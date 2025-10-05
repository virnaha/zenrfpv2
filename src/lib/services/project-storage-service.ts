import { supabaseService } from './supabase-service';

export interface StoredProject {
  id: string;
  name: string;
  documentName: string;
  status: 'draft' | 'in_progress' | 'review' | 'completed';
  createdAt: string; // ISO string for serialization
  updatedAt: string;
  questionsTotal: number;
  questionsAnswered: number;
  confidence: number;
  document?: {
    id: string;
    name: string;
    size: number;
    content: string;
    uploadedAt: string;
    metadata?: any;
    analysis?: any;
    questionAnalysis?: any;
  };
  responses?: Array<{
    id: string;
    questionId: string;
    questionText: string;
    response: string;
    confidence: number;
    sources: string[];
    status: string;
    generatedAt?: string;
    version: number;
  }>;
}

class ProjectStorageService {
  private readonly STORAGE_KEY = 'zenloop_rfp_projects';
  private readonly AUTO_SAVE_INTERVAL = 30000; // 30 seconds
  private autoSaveTimer?: number;

  /**
   * Get all projects from localStorage
   */
  getAllProjects(): StoredProject[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];

      const projects = JSON.parse(stored);
      return Array.isArray(projects) ? projects : [];
    } catch (error) {
      console.error('Failed to load projects from localStorage:', error);
      return [];
    }
  }

  /**
   * Get a single project by ID
   */
  getProject(id: string): StoredProject | null {
    const projects = this.getAllProjects();
    return projects.find(p => p.id === id) || null;
  }

  /**
   * Save a project to localStorage
   */
  saveProject(project: StoredProject): void {
    try {
      const projects = this.getAllProjects();
      const existingIndex = projects.findIndex(p => p.id === project.id);

      // Update timestamps
      const updatedProject = {
        ...project,
        updatedAt: new Date().toISOString()
      };

      if (existingIndex >= 0) {
        projects[existingIndex] = updatedProject;
      } else {
        projects.push(updatedProject);
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(projects));

      // Also try to save to Supabase (non-blocking)
      this.saveToCloud(updatedProject).catch(err =>
        console.warn('Cloud backup failed:', err)
      );
    } catch (error) {
      console.error('Failed to save project to localStorage:', error);
      throw new Error('Failed to save project. Storage may be full.');
    }
  }

  /**
   * Delete a project
   */
  deleteProject(id: string): void {
    try {
      const projects = this.getAllProjects();
      const filtered = projects.filter(p => p.id !== id);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));

      // Also delete from cloud
      this.deleteFromCloud(id).catch(err =>
        console.warn('Cloud deletion failed:', err)
      );
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  }

  /**
   * Auto-save a project every 30 seconds
   */
  startAutoSave(projectId: string, getProject: () => StoredProject): () => void {
    // Clear existing timer
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }

    // Set up new auto-save
    this.autoSaveTimer = window.setInterval(() => {
      try {
        const project = getProject();
        if (project && project.id === projectId) {
          this.saveProject(project);
          console.log(`[Auto-save] Project ${projectId} saved at ${new Date().toLocaleTimeString()}`);
        }
      } catch (error) {
        console.error('[Auto-save] Failed:', error);
      }
    }, this.AUTO_SAVE_INTERVAL);

    // Return cleanup function
    return () => {
      if (this.autoSaveTimer) {
        clearInterval(this.autoSaveTimer);
        this.autoSaveTimer = undefined;
      }
    };
  }

  /**
   * Check if there's unsaved work to recover
   */
  hasUnsavedWork(): { hasWork: boolean; projects: StoredProject[] } {
    const projects = this.getAllProjects();
    const recentProjects = projects.filter(p => {
      const updatedAt = new Date(p.updatedAt);
      const now = new Date();
      const hoursSinceUpdate = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);

      // Consider work unsaved if updated in last 24 hours and not completed
      return hoursSinceUpdate < 24 && p.status !== 'completed';
    });

    return {
      hasWork: recentProjects.length > 0,
      projects: recentProjects
    };
  }

  /**
   * Export project data as JSON file
   */
  exportProject(project: StoredProject): void {
    const dataStr = JSON.stringify(project, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.name.replace(/[^a-z0-9]/gi, '_')}_${project.id}.json`;
    link.click();

    URL.revokeObjectURL(url);
  }

  /**
   * Import project from JSON file
   */
  async importProject(file: File): Promise<StoredProject> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const project = JSON.parse(content) as StoredProject;

          // Validate basic structure
          if (!project.id || !project.name) {
            throw new Error('Invalid project file format');
          }

          // Generate new ID to avoid conflicts
          project.id = `rfp_${Date.now()}`;
          project.createdAt = new Date().toISOString();
          project.updatedAt = new Date().toISOString();

          this.saveProject(project);
          resolve(project);
        } catch (error) {
          reject(new Error('Failed to import project: ' + (error as Error).message));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Get storage statistics
   */
  getStorageStats(): {
    projectCount: number;
    totalSize: number;
    sizePerProject: number;
    availableSpace: number;
  } {
    const projects = this.getAllProjects();
    const stored = localStorage.getItem(this.STORAGE_KEY) || '[]';
    const totalSize = new Blob([stored]).size;

    // Estimate available space (most browsers: 5-10MB for localStorage)
    const estimatedLimit = 10 * 1024 * 1024; // 10MB
    const availableSpace = Math.max(0, estimatedLimit - totalSize);

    return {
      projectCount: projects.length,
      totalSize,
      sizePerProject: projects.length > 0 ? totalSize / projects.length : 0,
      availableSpace
    };
  }

  /**
   * Clear all projects (with confirmation)
   */
  clearAllProjects(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Save to Supabase (cloud backup)
   * Non-blocking - failures are logged but don't prevent local save
   */
  private async saveToCloud(project: StoredProject): Promise<void> {
    try {
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl === 'https://demo.supabase.co') {
        return; // Supabase not configured, skip cloud save
      }

      // Note: You'll need to add a saveProject method to supabaseService
      // For now, this is a placeholder that won't cause errors
      if (typeof supabaseService.saveProject === 'function') {
        await supabaseService.saveProject(project);
      }
    } catch (error) {
      // Log but don't throw - cloud backup is optional
      console.warn('Cloud backup failed:', error);
    }
  }

  /**
   * Delete from Supabase
   */
  private async deleteFromCloud(id: string): Promise<void> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl === 'https://demo.supabase.co') {
        return;
      }

      if (typeof supabaseService.deleteProject === 'function') {
        await supabaseService.deleteProject(id);
      }
    } catch (error) {
      console.warn('Cloud deletion failed:', error);
    }
  }
}

export const projectStorageService = new ProjectStorageService();
