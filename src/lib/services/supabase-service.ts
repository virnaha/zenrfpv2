import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createAPIConfig } from '../config/api-config';

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

interface Database {
  public: {
    Tables: {
      documents: {
        Row: DocumentRecord;
        Insert: Omit<DocumentRecord, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DocumentRecord, 'id' | 'created_at'>>;
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
}

// Export singleton instance
export const supabaseService = new SupabaseService();
export type { DocumentRecord, Database };