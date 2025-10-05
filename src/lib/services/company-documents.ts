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
  };
  size: number;
}

export interface DocumentSearchResult {
  document: CompanyDocument;
  relevance: number;
  matchedSections: string[];
}

export class CompanyDocumentsService {
  private documents: Map<string, CompanyDocument> = new Map();
  private searchIndex: Map<string, string[]> = new Map(); // word -> documentIds

  constructor() {
    this.initializeDefaultDocuments();
  }

  private initializeDefaultDocuments() {
    // Add default Zenloop documents structure
    const defaultDocuments: CompanyDocument[] = [
      {
        id: 'zenloop-power-deck',
        name: 'Zenloop Power Deck',
        type: 'powerpoint',
        content: '',
        metadata: {
          description: 'Main Zenloop presentation deck with company overview, product features, and value propositions',
          category: 'company',
          tags: ['zenloop', 'presentation', 'overview', 'features'],
          lastUpdated: new Date().toISOString()
        },
        size: 0
      },
      {
        id: 'zenloop-pricing-guide',
        name: 'Zenloop Pricing Guide',
        type: 'pdf',
        content: '',
        metadata: {
          description: 'Comprehensive pricing information, packages, and cost structures',
          category: 'pricing',
          tags: ['zenloop', 'pricing', 'packages', 'costs', 'plans'],
          lastUpdated: new Date().toISOString()
        },
        size: 0
      },
      {
        id: 'zenloop-product-specs',
        name: 'Zenloop Product Specifications',
        type: 'docx',
        content: '',
        metadata: {
          description: 'Detailed technical specifications, features, and capabilities',
          category: 'product',
          tags: ['zenloop', 'technical', 'specifications', 'features', 'capabilities'],
          lastUpdated: new Date().toISOString()
        },
        size: 0
      }
    ];

    defaultDocuments.forEach(doc => {
      this.documents.set(doc.id, doc);
    });
  }

  async addDocument(file: File, description?: string): Promise<CompanyDocument> {
    const content = await this.extractTextFromFile(file);
    const documentId = this.generateDocumentId(file.name);
    
    const document: CompanyDocument = {
      id: documentId,
      name: file.name,
      type: this.getFileType(file.type),
      content,
      metadata: {
        description: description || `Uploaded document: ${file.name}`,
        category: this.categorizeDocument(file.name, content),
        tags: this.extractTags(file.name, content),
        lastUpdated: new Date().toISOString()
      },
      size: file.size
    };

    this.documents.set(documentId, document);
    this.updateSearchIndex(document);
    
    return document;
  }

  private generateDocumentId(filename: string): string {
    return filename.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private getFileType(mimeType: string): CompanyDocument['type'] {
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'powerpoint';
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'docx';
    return 'txt';
  }

  private categorizeDocument(filename: string, content: string): CompanyDocument['metadata']['category'] {
    const lowerContent = content.toLowerCase();
    const lowerFilename = filename.toLowerCase();

    if (lowerContent.includes('pricing') || lowerContent.includes('cost') || lowerContent.includes('price') ||
        lowerFilename.includes('pricing') || lowerFilename.includes('cost')) {
      return 'pricing';
    }
    
    if (lowerContent.includes('product') || lowerContent.includes('feature') || lowerContent.includes('specification') ||
        lowerFilename.includes('product') || lowerFilename.includes('feature')) {
      return 'product';
    }
    
    if (lowerContent.includes('case study') || lowerContent.includes('customer') || lowerContent.includes('success') ||
        lowerFilename.includes('case') || lowerFilename.includes('customer')) {
      return 'case-studies';
    }
    
    if (lowerContent.includes('technical') || lowerContent.includes('api') || lowerContent.includes('integration') ||
        lowerFilename.includes('technical') || lowerFilename.includes('api')) {
      return 'technical';
    }
    
    return 'company';
  }

  private extractTags(filename: string, content: string): string[] {
    const tags = new Set<string>();
    const lowerContent = content.toLowerCase();
    const lowerFilename = filename.toLowerCase();

    // Extract Zenloop-specific tags
    if (lowerContent.includes('zenloop') || lowerFilename.includes('zenloop')) {
      tags.add('zenloop');
    }

    // Extract common business terms
    const businessTerms = ['feedback', 'survey', 'customer', 'experience', 'analytics', 'insights', 'nps', 'csat'];
    businessTerms.forEach(term => {
      if (lowerContent.includes(term)) {
        tags.add(term);
      }
    });

    // Extract technical terms
    const technicalTerms = ['api', 'integration', 'webhook', 'sdk', 'mobile', 'web', 'cloud'];
    technicalTerms.forEach(term => {
      if (lowerContent.includes(term)) {
        tags.add(term);
      }
    });

    return Array.from(tags);
  }

  private async extractTextFromFile(file: File): Promise<string> {
    // For now, we'll use a simple approach that works with text files
    // In a production environment, you'd want to implement proper PDF/DOCX/PPTX parsing
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error('Failed to read text file'));
        reader.readAsText(file);
      });
    } else {
      // For other file types, we'll create a placeholder with instructions
      const placeholderContent = `This is a placeholder for the content of ${file.name}.
      
To properly extract text from this file type, you would need to:

1. For PDF files: Use a library like pdf-parse or pdf2pic
2. For DOCX files: Use a library like mammoth or docx
3. For PowerPoint files: Use a library like pptxgen or similar

For now, please convert your ${file.name} to a text file (.txt) format and upload it again.

Alternatively, you can manually copy and paste the content into a text file.`;
      
      return placeholderContent;
    }
  }

  private updateSearchIndex(document: CompanyDocument) {
    const words = document.content.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2)
      .map(word => word.replace(/[^a-z0-9]/g, ''));

    words.forEach(word => {
      if (!this.searchIndex.has(word)) {
        this.searchIndex.set(word, []);
      }
      const documentIds = this.searchIndex.get(word)!;
      if (!documentIds.includes(document.id)) {
        documentIds.push(document.id);
      }
    });
  }

  searchDocuments(query: string, category?: string): DocumentSearchResult[] {
    const queryWords = query.toLowerCase().split(/\s+/);
    const results: Map<string, DocumentSearchResult> = new Map();

    queryWords.forEach(word => {
      const matchingDocs = this.searchIndex.get(word) || [];
      matchingDocs.forEach(docId => {
        const document = this.documents.get(docId);
        if (!document || (category && document.metadata.category !== category)) {
          return;
        }

        if (!results.has(docId)) {
          results.set(docId, {
            document,
            relevance: 0,
            matchedSections: []
          });
        }

        const result = results.get(docId)!;
        result.relevance += 1;

        // Find matching sections
        const sentences = document.content.split(/[.!?]+/);
        sentences.forEach(sentence => {
          if (sentence.toLowerCase().includes(word)) {
            result.matchedSections.push(sentence.trim());
          }
        });
      });
    });

    return Array.from(results.values())
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 10); // Return top 10 results
  }

  getDocumentsByCategory(category: CompanyDocument['metadata']['category']): CompanyDocument[] {
    return Array.from(this.documents.values())
      .filter(doc => doc.metadata.category === category);
  }

  getDocument(id: string): CompanyDocument | undefined {
    return this.documents.get(id);
  }

  getAllDocuments(): CompanyDocument[] {
    return Array.from(this.documents.values());
  }

  updateDocument(id: string, updates: Partial<CompanyDocument>): CompanyDocument | null {
    const document = this.documents.get(id);
    if (!document) return null;

    const updatedDocument = { ...document, ...updates };
    this.documents.set(id, updatedDocument);
    this.updateSearchIndex(updatedDocument);
    
    return updatedDocument;
  }

  deleteDocument(id: string): boolean {
    const document = this.documents.get(id);
    if (!document) return false;

    this.documents.delete(id);
    
    // Remove from search index
    this.searchIndex.forEach((documentIds, word) => {
      const filteredIds = documentIds.filter(docId => docId !== id);
      if (filteredIds.length === 0) {
        this.searchIndex.delete(word);
      } else {
        this.searchIndex.set(word, filteredIds);
      }
    });

    return true;
  }

  // Method to get relevant content for RFP response generation
  getRelevantContentForRFP(rfpContent: string, sectionType: string): string {
    const query = this.buildQueryForSection(rfpContent, sectionType);
    const results = this.searchDocuments(query);
    
    return results
      .map(result => result.matchedSections.join(' '))
      .join('\n\n');
  }

  private buildQueryForSection(rfpContent: string, sectionType: string): string {
    const lowerRfp = rfpContent.toLowerCase();
    const lowerSection = sectionType.toLowerCase();
    
    let query = '';
    
    // Add section-specific keywords
    if (lowerSection.includes('executive') || lowerSection.includes('summary')) {
      query += 'zenloop overview company value proposition ';
    }
    
    if (lowerSection.includes('technical') || lowerSection.includes('approach')) {
      query += 'zenloop technical features capabilities api integration ';
    }
    
    if (lowerSection.includes('pricing') || lowerSection.includes('cost')) {
      query += 'zenloop pricing packages costs plans ';
    }
    
    if (lowerSection.includes('company') || lowerSection.includes('overview')) {
      query += 'zenloop company history experience expertise ';
    }
    
    if (lowerSection.includes('reference') || lowerSection.includes('case')) {
      query += 'zenloop case studies customer success stories ';
    }
    
    // Add RFP-specific terms
    const rfpWords = lowerRfp.split(/\s+/).filter(word => word.length > 3).slice(0, 10);
    query += rfpWords.join(' ');
    
    return query;
  }
}

// Export singleton instance
export const companyDocuments = new CompanyDocumentsService(); 