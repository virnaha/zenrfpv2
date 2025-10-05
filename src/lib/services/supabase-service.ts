import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createAPIConfig } from '../config/api-config';
import type { StoredProject } from './project-storage-service';

interface DocumentRecord {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string;
  description: string;
  category: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  file_path?: string;
}

interface ProjectRecord {
  id: string;
  name: string;
  document_name: string;
  status: string;
  created_at: string;
  updated_at: string;
  questions_total: number;
  questions_answered: number;
  confidence: number;
  project_data: any; // JSON field containing full project state
}

interface Database {
  public: {
    Tables: {
      documents: {
        Row: DocumentRecord;
        Insert: Omit<DocumentRecord, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DocumentRecord, 'id' | 'created_at'>>;
      };
      rfp_projects: {
        Row: ProjectRecord;
        Insert: Omit<ProjectRecord, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ProjectRecord, 'id' | 'created_at'>>;
      };
    };
  };
}

class SupabaseService {
  private client: SupabaseClient<Database> | null = null;
  private isConnected = false;
  private config = createAPIConfig();

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      const url = this.config.supabase.url;
      const anonKey = this.config.supabase.anonKey;
      // In demo mode these will be non-empty placeholders; we still create the client
      if (url && anonKey) {
        this.client = createClient<Database>(url, anonKey, {
          auth: { persistSession: false }
        });
        this.isConnected = true;
      } else {
        this.isConnected = false;
      }
    } catch (error) {
      console.warn('Supabase initialization failed, continuing without remote storage.', error);
      this.isConnected = false;
      this.client = null;
    }
  }

  async createDocumentsTable(): Promise<boolean> {
    if (!this.client || !this.isConnected) return false;

    try {
      // For now, we'll assume the table exists or will be created manually
      // In a real deployment, you'd create this via Supabase dashboard or migrations
      console.log('Document table initialization - please ensure the documents table exists in Supabase');
      return true;
    } catch (error) {
      console.error('Failed to create documents table:', error);
      return false;
    }
  }

  async uploadDocument(
    file: File,
    content: string,
    metadata: {
      description: string;
      category: string;
      tags: string[];
    }
  ): Promise<{ success: boolean; document?: DocumentRecord; error?: string }> {
    if (!this.client || !this.isConnected) {
      return { success: false, error: 'Supabase not connected' };
    }

    try {
      // Upload file to storage bucket
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `documents/${fileName}`;

      const { error: uploadError } = await this.client.storage
        .from('documents')
        .upload(filePath, file, { upsert: false });

      if (uploadError) {
        console.warn('File upload failed, proceeding without file storage:', uploadError);
      }

      // Save document record
      const documentData = {
        name: file.name,
        type: this.getFileType(file.type),
        size: file.size,
        content,
        description: metadata.description,
        category: metadata.category,
        tags: metadata.tags,
        file_path: uploadError ? undefined : filePath,
      };

      const { data, error } = await this.client
        .from('documents')
        .insert([documentData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, document: data };
    } catch (error) {
      console.error('Upload document failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  async getDocuments(category?: string): Promise<DocumentRecord[]> {
    if (!this.client || !this.isConnected) return [];

    try {
      let query = this.client.from('documents').select('*');
      
      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error } = await query.order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get documents failed:', error);
      return [];
    }
  }

  async searchDocuments(query: string, category?: string): Promise<{
    documents: DocumentRecord[];
    matchedSections: Record<string, string[]>;
  }> {
    if (!this.client || !this.isConnected) {
      return { documents: [], matchedSections: {} };
    }

    try {
      // Simple text search on content and name
      let searchQuery = this.client
        .from('documents')
        .select('*')
        .ilike('content', `%${query}%`);

      if (category && category !== 'all') {
        searchQuery = searchQuery.eq('category', category);
      }

      const { data, error } = await searchQuery.order('updated_at', { ascending: false });

      if (error) throw error;

      // Extract matched sections for each document
      const matchedSections: Record<string, string[]> = {};
      const queryTerms = query.toLowerCase().split(/\s+/);

      (data || []).forEach(doc => {
        const sections: string[] = [];
        const sentences = doc.content.split(/[.!?]+/);
        
        sentences.forEach(sentence => {
          const lowerSentence = sentence.toLowerCase();
          if (queryTerms.some(term => lowerSentence.includes(term))) {
            sections.push(sentence.trim());
          }
        });
        
        matchedSections[doc.id] = sections.slice(0, 3); // Top 3 matches
      });

      return { documents: data || [], matchedSections };
    } catch (error) {
      console.error('Search documents failed:', error);
      return { documents: [], matchedSections: {} };
    }
  }

  async deleteDocument(id: string): Promise<boolean> {
    if (!this.client || !this.isConnected) return false;

    try {
      // Get document to find file path
      const { data: document } = await this.client
        .from('documents')
        .select('file_path')
        .eq('id', id)
        .single();

      // Delete file from storage if it exists
      if (document?.file_path) {
        await this.client.storage.from('documents').remove([document.file_path]);
      }

      // Delete document record
      const { error } = await this.client.from('documents').delete().eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Delete document failed:', error);
      return false;
    }
  }

  async updateDocument(
    id: string,
    updates: Partial<{
      name: string;
      description: string;
      category: string;
      tags: string[];
      content: string;
    }>
  ): Promise<boolean> {
    if (!this.client || !this.isConnected) return false;

    try {
      const { error } = await this.client
        .from('documents')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Update document failed:', error);
      return false;
    }
  }

  async getRelevantContent(rfpContent: string, sectionType: string): Promise<string> {
    if (!this.client || !this.isConnected) return '';

    try {
      // Build search query based on section type and RFP content
      const searchTerms = this.buildSearchTerms(rfpContent, sectionType);
      const { documents } = await this.searchDocuments(searchTerms);
      
      return documents
        .slice(0, 5) // Top 5 most relevant documents
        .map(doc => doc.content)
        .join('\n\n');
    } catch (error) {
      console.error('Get relevant content failed:', error);
      return '';
    }
  }

  private buildSearchTerms(rfpContent: string, sectionType: string): string {
    const sectionKeywords: Record<string, string[]> = {
      'executive-summary': ['overview', 'company', 'value proposition', 'zenloop'],
      'technical-approach': ['technical', 'features', 'capabilities', 'api', 'integration'],
      'pricing': ['pricing', 'packages', 'costs', 'plans'],
      'company-overview': ['company', 'history', 'experience', 'expertise'],
      'references': ['case studies', 'customer', 'success stories'],
    };

    const keywords = sectionKeywords[sectionType] || ['zenloop'];
    const rfpKeywords = rfpContent
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 5);

    return [...keywords, ...rfpKeywords].join(' ');
  }

  private getFileType(mimeType: string): string {
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'docx';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'powerpoint';
    return 'txt';
  }

  isSupabaseConnected(): boolean {
    return this.isConnected;
  }

  getClient(): SupabaseClient<Database> | null {
    return this.client;
  }

  /**
   * Save RFP project to Supabase (cloud backup)
   */
  async saveProject(project: StoredProject): Promise<void> {
    if (!this.client || !this.isConnected) {
      throw new Error('Supabase not connected');
    }

    try {
      const projectRecord: Omit<ProjectRecord, 'created_at' | 'updated_at'> = {
        id: project.id,
        name: project.name,
        document_name: project.documentName,
        status: project.status,
        questions_total: project.questionsTotal,
        questions_answered: project.questionsAnswered,
        confidence: project.confidence,
        project_data: project // Store full project as JSON
      };

      const { error } = await this.client
        .from('rfp_projects')
        .upsert(projectRecord, { onConflict: 'id' });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to save project to Supabase:', error);
      throw error;
    }
  }

  /**
   * Load RFP project from Supabase
   */
  async loadProject(id: string): Promise<StoredProject | null> {
    if (!this.client || !this.isConnected) {
      return null;
    }

    try {
      const { data, error } = await this.client
        .from('rfp_projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return null;

      return data.project_data as StoredProject;
    } catch (error) {
      console.error('Failed to load project from Supabase:', error);
      return null;
    }
  }

  /**
   * Get all projects from Supabase
   */
  async getAllProjects(): Promise<StoredProject[]> {
    if (!this.client || !this.isConnected) {
      return [];
    }

    try {
      const { data, error } = await this.client
        .from('rfp_projects')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      if (!data) return [];

      return data.map(record => record.project_data as StoredProject);
    } catch (error) {
      console.error('Failed to get projects from Supabase:', error);
      return [];
    }
  }

  /**
   * Delete RFP project from Supabase
   */
  async deleteProject(id: string): Promise<void> {
    if (!this.client || !this.isConnected) {
      throw new Error('Supabase not connected');
    }

    try {
      const { error } = await this.client
        .from('rfp_projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to delete project from Supabase:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const supabaseService = new SupabaseService();
export type { DocumentRecord, ProjectRecord, Database };