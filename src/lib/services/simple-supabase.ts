import { createAPIConfig } from '../config/api-config';

export interface StoredDocument {
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

export class SimpleSupabaseService {
  private config = createAPIConfig();

  constructor() {
    console.log('✅ Using local processing mode - no external dependencies required');
  }

  async uploadDocument(
    file: File,
    content: string,
    metadata: {
      description: string;
      category: string;
      tags: string[];
    }
  ): Promise<{ success: boolean; document?: StoredDocument; error?: string }> {
    try {
      // Create document record (simulate successful upload)
      const document: StoredDocument = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: this.getFileType(file.type),
        size: file.size,
        content,
        description: metadata.description,
        category: metadata.category,
        tags: metadata.tags,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return { success: true, document };
    } catch (error) {
      console.error('Document processing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Processing failed',
      };
    }
  }

  async getDocuments(category?: string): Promise<StoredDocument[]> {
    // Return empty array for local processing mode
    return [];
  }

  async searchDocuments(query: string, category?: string): Promise<{
    documents: StoredDocument[];
    matchedSections: Record<string, string[]>;
  }> {
    // Return empty results for local processing mode
    return { documents: [], matchedSections: {} };
  }

  async deleteDocument(id: string): Promise<boolean> {
    // Always return true for local processing mode
    return true;
  }

  async getRelevantContent(rfpContent: string, sectionType: string): Promise<string> {
    // Return empty string for local processing mode
    return '';
  }

  private getFileType(mimeType: string): string {
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'docx';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'powerpoint';
    return 'txt';
  }

  isSupabaseConnected(): boolean {
    return false; // Always return false for local processing mode
  }
}

export const simpleSupabase = new SimpleSupabaseService();