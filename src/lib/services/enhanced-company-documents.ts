import { simpleSupabase, StoredDocument } from './simple-supabase';
import { fileProcessor, ProcessedFile } from './file-processor';

export interface CompanyDocument {
  id: string;
  name: string;
  type: 'powerpoint' | 'pdf' | 'docx' | 'txt';
  content: string;
  metadata: {
    description: string;
    category: 'pricing' | 'product' | 'company' | 'case-studies' | 'technical';
    tags: string[];
    lastUpdated: string;
    fileSize: number;
    processingInfo?: {
      wordCount: number;
      characterCount: number;
      processingTime: number;
      pageCount?: number;
    };
  };
  size: number;
}

export interface DocumentSearchResult {
  document: CompanyDocument;
  relevance: number;
  matchedSections: string[];
}

export interface UploadProgress {
  stage: 'validating' | 'processing' | 'uploading' | 'completed' | 'error';
  progress: number; // 0-100
  message: string;
  error?: string;
}

export class EnhancedCompanyDocumentsService {
  private fallbackDocuments: Map<string, CompanyDocument> = new Map();
  private initialized = false;

  constructor() {
    this.initializeDefaultDocuments();
  }

  private async initializeDefaultDocuments() {
    if (this.initialized) return;

    // Load Zenloop sample documents
    try {
      await this.loadZenloopDocuments();
    } catch (error) {
      console.warn('Failed to load Zenloop sample documents:', error);
    }

    this.initialized = true;
  }

  private async loadZenloopDocuments() {
    const sampleDocuments = [
      {
        name: 'Zenloop Company Overview',
        path: '/sample-zenloop-documents/zenloop-company-overview.txt',
        category: 'company' as const,
        description: 'Comprehensive company overview including mission, values, and capabilities',
        tags: ['zenloop', 'company', 'overview', 'mission', 'values'],
      },
      {
        name: 'Zenloop Pricing Guide',
        path: '/sample-zenloop-documents/zenloop-pricing-guide.txt',
        category: 'pricing' as const,
        description: 'Complete pricing information including plans, add-ons, and enterprise options',
        tags: ['zenloop', 'pricing', 'plans', 'enterprise', 'costs'],
      },
      {
        name: 'Zenloop Technical Specifications',
        path: '/sample-zenloop-documents/zenloop-technical-specs.txt',
        category: 'technical' as const,
        description: 'Technical specifications, API documentation, and integration capabilities',
        tags: ['zenloop', 'technical', 'api', 'integration', 'specifications'],
      },
    ];

    for (const doc of sampleDocuments) {
      try {
        const response = await fetch(doc.path);
        if (response.ok) {
          const content = await response.text();
          await this.addDocumentFromContent(
            doc.name,
            content,
            {
              description: doc.description,
              category: doc.category,
              tags: doc.tags,
            }
          );
        }
      } catch (error) {
        console.warn(`Failed to load ${doc.name}:`, error);
      }
    }
  }

  async addDocument(
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<CompanyDocument> {
    try {
      // Stage 1: Validation
      onProgress?.({
        stage: 'validating',
        progress: 10,
        message: 'Validating file...',
      });

      const validation = fileProcessor.validateFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Stage 2: File Processing
      onProgress?.({
        stage: 'processing',
        progress: 30,
        message: 'Extracting text content...',
      });

      const processedFile = await fileProcessor.processFile(file);

      onProgress?.({
        stage: 'processing',
        progress: 60,
        message: 'Analyzing content...',
      });

      // Auto-categorize and tag
      const category = this.categorizeDocument(file.name, processedFile.content);
      const tags = this.extractTags(file.name, processedFile.content);
      const description = this.generateDescription(file.name, processedFile.content);

      // Stage 3: Upload to Supabase or fallback
      onProgress?.({
        stage: 'uploading',
        progress: 80,
        message: 'Saving document...',
      });

      let document: CompanyDocument;

      if (simpleSupabase.isSupabaseConnected()) {
        const result = await simpleSupabase.uploadDocument(file, processedFile.content, {
          description,
          category,
          tags,
        });

        if (result.success && result.document) {
          document = this.convertFromStoredDocument(result.document, processedFile);
        } else {
          throw new Error(result.error || 'Upload failed');
        }
      } else {
        // Fallback to in-memory storage
        document = this.createDocumentFromFile(file, processedFile, {
          description,
          category,
          tags,
        });
        this.fallbackDocuments.set(document.id, document);
      }

      onProgress?.({
        stage: 'completed',
        progress: 100,
        message: 'Document uploaded successfully!',
      });

      return document;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onProgress?.({
        stage: 'error',
        progress: 0,
        message: 'Upload failed',
        error: errorMessage,
      });
      throw error;
    }
  }

  async addDocumentFromContent(
    name: string,
    content: string,
    metadata: {
      description: string;
      category: CompanyDocument['metadata']['category'];
      tags: string[];
    }
  ): Promise<CompanyDocument> {
    const document: CompanyDocument = {
      id: this.generateDocumentId(name),
      name,
      type: 'txt',
      content,
      metadata: {
        ...metadata,
        lastUpdated: new Date().toISOString(),
        fileSize: content.length,
        processingInfo: {
          wordCount: content.split(/\s+/).length,
          characterCount: content.length,
          processingTime: 0,
        },
      },
      size: content.length,
    };

    if (simpleSupabase.isSupabaseConnected()) {
      try {
        const result = await simpleSupabase.uploadDocument(
          new File([content], name, { type: 'text/plain' }),
          content,
          metadata
        );
        if (result.success && result.document) {
          return this.convertFromStoredDocument(result.document);
        }
      } catch (error) {
        console.warn('Supabase upload failed, using fallback:', error);
      }
    }

    // Fallback storage
    this.fallbackDocuments.set(document.id, document);
    return document;
  }

  async getAllDocuments(): Promise<CompanyDocument[]> {
    await this.initializeDefaultDocuments();

    if (simpleSupabase.isSupabaseConnected()) {
      try {
        const records = await simpleSupabase.getDocuments();
        return records.map(record => this.convertFromStoredDocument(record));
      } catch (error) {
        console.warn('Failed to fetch from Supabase, using fallback:', error);
      }
    }

    return Array.from(this.fallbackDocuments.values());
  }

  async getDocumentsByCategory(
    category: CompanyDocument['metadata']['category']
  ): Promise<CompanyDocument[]> {
    if (simpleSupabase.isSupabaseConnected()) {
      try {
        const records = await simpleSupabase.getDocuments(category);
        return records.map(record => this.convertFromStoredDocument(record));
      } catch (error) {
        console.warn('Failed to fetch from Supabase, using fallback:', error);
      }
    }

    return Array.from(this.fallbackDocuments.values()).filter(
      doc => doc.metadata.category === category
    );
  }

  async searchDocuments(
    query: string,
    category?: CompanyDocument['metadata']['category']
  ): Promise<DocumentSearchResult[]> {
    if (simpleSupabase.isSupabaseConnected()) {
      try {
        const { documents, matchedSections } = await simpleSupabase.searchDocuments(
          query,
          category
        );
        
        return documents.map(doc => ({
          document: this.convertFromStoredDocument(doc),
          relevance: this.calculateRelevance(query, doc.content),
          matchedSections: matchedSections[doc.id] || [],
        }));
      } catch (error) {
        console.warn('Supabase search failed, using fallback:', error);
      }
    }

    // Fallback search
    return this.fallbackSearch(query, category);
  }

  async deleteDocument(id: string): Promise<boolean> {
    if (simpleSupabase.isSupabaseConnected()) {
      const success = await simpleSupabase.deleteDocument(id);
      if (success) return true;
    }

    return this.fallbackDocuments.delete(id);
  }

  async getRelevantContentForRFP(rfpContent: string, sectionType: string): Promise<string> {
    if (simpleSupabase.isSupabaseConnected()) {
      try {
        return await simpleSupabase.getRelevantContent(rfpContent, sectionType);
      } catch (error) {
        console.warn('Supabase content search failed, using fallback:', error);
      }
    }

    // Fallback implementation
    const query = this.buildQueryForSection(rfpContent, sectionType);
    const results = await this.searchDocuments(query);
    
    return results
      .slice(0, 3)
      .map(result => result.matchedSections.join(' '))
      .join('\n\n');
  }

  // Helper methods
  private createDocumentFromFile(
    file: File,
    processedFile: ProcessedFile,
    metadata: {
      description: string;
      category: CompanyDocument['metadata']['category'];
      tags: string[];
    }
  ): CompanyDocument {
    return {
      id: this.generateDocumentId(file.name),
      name: file.name,
      type: this.getFileType(file.type),
      content: processedFile.content,
      metadata: {
        ...metadata,
        lastUpdated: new Date().toISOString(),
        fileSize: file.size,
        processingInfo: processedFile.metadata,
      },
      size: file.size,
    };
  }

  private convertFromStoredDocument(
    record: StoredDocument,
    processedFile?: ProcessedFile
  ): CompanyDocument {
    return {
      id: record.id,
      name: record.name,
      type: record.type as CompanyDocument['type'],
      content: record.content,
      metadata: {
        description: record.description,
        category: record.category as CompanyDocument['metadata']['category'],
        tags: record.tags,
        lastUpdated: record.updated_at,
        fileSize: record.size,
        processingInfo: processedFile?.metadata,
      },
      size: record.size,
    };
  }

  private generateDocumentId(filename: string): string {
    return `${Date.now()}-${filename.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')}`;
  }

  private getFileType(mimeType: string): CompanyDocument['type'] {
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'docx';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'powerpoint';
    return 'txt';
  }

  private categorizeDocument(filename: string, content: string): CompanyDocument['metadata']['category'] {
    const lowerContent = content.toLowerCase();
    const lowerFilename = filename.toLowerCase();

    if (this.containsKeywords(lowerContent, lowerFilename, ['pricing', 'cost', 'price', 'plan'])) {
      return 'pricing';
    }
    if (this.containsKeywords(lowerContent, lowerFilename, ['product', 'feature', 'specification'])) {
      return 'product';
    }
    if (this.containsKeywords(lowerContent, lowerFilename, ['case study', 'customer', 'success'])) {
      return 'case-studies';
    }
    if (this.containsKeywords(lowerContent, lowerFilename, ['technical', 'api', 'integration'])) {
      return 'technical';
    }
    return 'company';
  }

  private containsKeywords(content: string, filename: string, keywords: string[]): boolean {
    return keywords.some(keyword => content.includes(keyword) || filename.includes(keyword));
  }

  private extractTags(filename: string, content: string): string[] {
    const tags = new Set<string>(['zenloop']);
    const lowerContent = content.toLowerCase();

    const businessTerms = ['feedback', 'survey', 'customer', 'analytics', 'insights', 'nps', 'csat'];
    const technicalTerms = ['api', 'integration', 'webhook', 'sdk', 'mobile', 'web', 'cloud'];
    
    [...businessTerms, ...technicalTerms].forEach(term => {
      if (lowerContent.includes(term)) tags.add(term);
    });

    return Array.from(tags);
  }

  private generateDescription(filename: string, content: string): string {
    const preview = content.substring(0, 200).trim();
    return `${filename} - ${preview}${content.length > 200 ? '...' : ''}`;
  }

  private calculateRelevance(query: string, content: string): number {
    const queryTerms = query.toLowerCase().split(/\s+/);
    const contentLower = content.toLowerCase();
    let score = 0;

    queryTerms.forEach(term => {
      const matches = (contentLower.match(new RegExp(term, 'g')) || []).length;
      score += matches;
    });

    return Math.min(score, 10); // Cap at 10
  }

  private fallbackSearch(
    query: string,
    category?: CompanyDocument['metadata']['category']
  ): DocumentSearchResult[] {
    const queryTerms = query.toLowerCase().split(/\s+/);
    const results: DocumentSearchResult[] = [];

    this.fallbackDocuments.forEach(doc => {
      if (category && doc.metadata.category !== category) return;

      const relevance = this.calculateRelevance(query, doc.content);
      if (relevance > 0) {
        const matchedSections: string[] = [];
        const sentences = doc.content.split(/[.!?]+/);
        
        sentences.forEach(sentence => {
          if (queryTerms.some(term => sentence.toLowerCase().includes(term))) {
            matchedSections.push(sentence.trim());
          }
        });

        results.push({
          document: doc,
          relevance,
          matchedSections: matchedSections.slice(0, 3),
        });
      }
    });

    return results.sort((a, b) => b.relevance - a.relevance).slice(0, 10);
  }

  private buildQueryForSection(rfpContent: string, sectionType: string): string {
    const sectionKeywords: Record<string, string[]> = {
      'executive-summary': ['zenloop', 'overview', 'company', 'value', 'proposition'],
      'technical-approach': ['technical', 'features', 'api', 'integration', 'capabilities'],
      'pricing': ['pricing', 'packages', 'costs', 'plans'],
      'company-overview': ['company', 'history', 'experience', 'expertise'],
      'references': ['case', 'studies', 'customer', 'success'],
    };

    const keywords = sectionKeywords[sectionType] || ['zenloop'];
    const rfpKeywords = rfpContent
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 5);

    return [...keywords, ...rfpKeywords].join(' ');
  }
}

// Export singleton instance
export const enhancedCompanyDocuments = new EnhancedCompanyDocumentsService();
export type { 
  CompanyDocument as EnhancedCompanyDocument, 
  DocumentSearchResult as EnhancedDocumentSearchResult, 
  UploadProgress 
};