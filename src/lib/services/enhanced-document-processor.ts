import { fileProcessor, ProcessedFile } from './file-processor';
import { textChunker, TextChunk, ChunkingOptions } from './text-chunker';
import { embeddingService, EmbeddingRequest } from './embedding-service';
import { createClient } from '@supabase/supabase-js';
import { createAPIConfig } from '../config/api-config';

export interface DocumentEmbedding {
  id?: string;
  document_id: string;
  chunk_index: number;
  content: string;
  content_length: number;
  embedding: number[];
  metadata: {
    section?: string;
    wordCount: number;
    characterCount: number;
    hasNumbers?: boolean;
    hasQuestions?: boolean;
    chunkingOptions?: ChunkingOptions;
  };
}

export interface ProcessedDocument {
  document: {
    id: string;
    name: string;
    type: string;
    size: number;
    content: string;
    description: string;
    category: string;
    tags: string[];
    embeddings_generated: boolean;
    embeddings_count: number;
  };
  chunks: TextChunk[];
  embeddings: DocumentEmbedding[];
  processing_stats: {
    total_chunks: number;
    total_embeddings: number;
    tokens_used: number;
    processing_time_ms: number;
    success_rate: number;
  };
}

export interface SearchResult {
  chunk: TextChunk & { document_id: string; document_name?: string };
  similarity: number;
  document_metadata?: any;
}

export class EnhancedDocumentProcessor {
  private config = createAPIConfig();
  private supabase = createClient(this.config.supabase.url, this.config.supabase.anonKey);

  /**
   * Process a single document: extract text, chunk it, and generate embeddings
   */
  async processDocument(
    file: File,
    metadata: {
      description: string;
      category: string;
      tags: string[];
    },
    options: {
      chunkingOptions?: Partial<ChunkingOptions>;
      generateEmbeddings?: boolean;
      onProgress?: (progress: { stage: string; progress: number; message?: string }) => void;
    } = {}
  ): Promise<ProcessedDocument> {
    const startTime = Date.now();
    const { onProgress = () => {} } = options;

    try {
      // Stage 1: Extract text from file
      onProgress({ stage: 'extraction', progress: 10, message: `Extracting text from ${file.name}` });
      const processedFile = await fileProcessor.processFile(file);

      // Stage 2: Chunk the text
      onProgress({ stage: 'chunking', progress: 30, message: 'Breaking document into chunks' });
      const chunkingOpts: ChunkingOptions = {
        chunkSize: textChunker.getOptimalChunkSize(processedFile.content.length),
        overlapSize: 50,
        preserveParagraphs: true,
        preserveSentences: true,
        minChunkSize: 100,
        ...options.chunkingOptions,
      };

      const chunks = textChunker.chunkWithStructure(processedFile.content, chunkingOpts);

      // Stage 3: Store document in database
      onProgress({ stage: 'storage', progress: 50, message: 'Saving document to database' });

      if (!this.supabase) {
        throw new Error('Supabase not configured. Please check your environment variables.');
      }

      const { data: document, error: docError } = await this.supabase
        .from('documents')
        .insert([{
          name: file.name,
          type: this.getFileType(file.type),
          size: file.size,
          content: processedFile.content,
          description: metadata.description,
          category: metadata.category,
          tags: metadata.tags,
          embeddings_generated: false,
          embeddings_count: 0,
        }])
        .select()
        .single();

      if (docError || !document) {
        throw new Error(`Failed to save document: ${docError?.message || 'Unknown error'}`);
      }

      let embeddings: DocumentEmbedding[] = [];
      let embeddingStats = { total_embeddings: 0, tokens_used: 0, success_rate: 1 };

      // Stage 4: Generate embeddings if requested
      if (options.generateEmbeddings !== false) {
        onProgress({ stage: 'embeddings', progress: 60, message: 'Generating embeddings' });

        const embeddingRequests: EmbeddingRequest[] = chunks.map(chunk => ({
          text: chunk.content,
          id: `${document.id}_${chunk.index}`,
        }));

        const batchResult = await embeddingService.generateBatchEmbeddings(
          embeddingRequests,
          ({ processed, total }) => {
            const embeddingProgress = 60 + (processed / total) * 20;
            onProgress({
              stage: 'embeddings',
              progress: embeddingProgress,
              message: `Generated embeddings for ${processed}/${total} chunks`
            });
          }
        );

        // Stage 5: Store embeddings in database
        onProgress({ stage: 'storage', progress: 85, message: 'Storing embeddings in database' });

        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const embedding = batchResult.embeddings[i];

          if (embedding && embedding.length > 0) {
            const embeddingDoc: DocumentEmbedding = {
              document_id: document.id,
              chunk_index: chunk.index,
              content: chunk.content,
              content_length: chunk.content.length,
              embedding,
              metadata: {
                ...chunk.metadata,
                chunkingOptions: chunkingOpts,
              },
            };

            embeddings.push(embeddingDoc);
          }
        }

        // Batch insert embeddings
        if (embeddings.length > 0) {
          const { error: embeddingError } = await this.supabase
            .from('document_embeddings')
            .insert(embeddings.map(emb => ({
              document_id: emb.document_id,
              chunk_index: emb.chunk_index,
              content: emb.content,
              content_length: emb.content_length,
              embedding: emb.embedding,
              metadata: emb.metadata,
            })));

          if (embeddingError) {
            console.warn('Some embeddings failed to save:', embeddingError);
          }

          // Update document with embedding stats
          await this.supabase
            .from('documents')
            .update({
              embeddings_generated: true,
              embeddings_count: embeddings.length,
              last_embedded_at: new Date().toISOString(),
            })
            .eq('id', document.id);
        }

        embeddingStats = {
          total_embeddings: embeddings.length,
          tokens_used: batchResult.totalTokensUsed,
          success_rate: embeddings.length / chunks.length,
        };
      }

      const processingTime = Date.now() - startTime;
      onProgress({ stage: 'complete', progress: 100, message: 'Document processing complete' });

      return {
        document: {
          ...document,
          embeddings_generated: embeddings.length > 0,
          embeddings_count: embeddings.length,
        },
        chunks,
        embeddings,
        processing_stats: {
          total_chunks: chunks.length,
          ...embeddingStats,
          processing_time_ms: processingTime,
        },
      };

    } catch (error) {
      console.error('Document processing failed:', error);
      throw new Error(`Failed to process document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Perform semantic search across all document embeddings
   */
  async semanticSearch(
    query: string,
    options: {
      category?: string;
      limit?: number;
      similarityThreshold?: number;
      includeContent?: boolean;
    } = {}
  ): Promise<SearchResult[]> {
    if (!this.supabase) {
      throw new Error('Database not configured');
    }

    const {
      category,
      limit = 10,
      similarityThreshold = 0.7,
      includeContent = true,
    } = options;

    try {
      // Generate embedding for the query
      const queryEmbedding = await embeddingService.generateEmbedding(query);

      // Use the Supabase function for similarity search
      let rpcQuery = this.supabase.rpc('match_documents', {
        query_embedding: queryEmbedding.embedding,
        similarity_threshold: similarityThreshold,
        match_count: limit,
      });

      const { data: matches, error } = await rpcQuery;

      if (error) {
        throw new Error(`Search failed: ${error.message}`);
      }

      if (!matches || matches.length === 0) {
        return [];
      }

      // Get document information if needed
      const documentIds = [...new Set(matches.map((m: any) => m.document_id))];
      let documentMap: Record<string, any> = {};

      if (includeContent) {
        const { data: documents } = await this.supabase
          .from('documents')
          .select('id, name, category, tags, description')
          .in('id', documentIds);

        if (documents) {
          documentMap = documents.reduce((acc, doc) => {
            acc[doc.id] = doc;
            return acc;
          }, {} as Record<string, any>);
        }
      }

      // Filter by category if specified
      const filteredMatches = category && category !== 'all'
        ? matches.filter((match: any) => {
            const doc = documentMap[match.document_id];
            return doc && doc.category === category;
          })
        : matches;

      // Convert to SearchResult format
      const results: SearchResult[] = filteredMatches.map((match: any) => {
        const document = documentMap[match.document_id];

        return {
          chunk: {
            content: match.content,
            index: match.chunk_index,
            startIndex: 0, // Not stored in DB
            endIndex: match.content.length,
            metadata: match.metadata || {},
            document_id: match.document_id,
            document_name: document?.name,
          },
          similarity: match.similarity,
          document_metadata: document ? {
            name: document.name,
            category: document.category,
            tags: document.tags,
            description: document.description,
          } : undefined,
        };
      });

      return results;

    } catch (error) {
      console.error('Semantic search failed:', error);
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get relevant context for RFP generation
   */
  async getRelevantContext(
    rfpContent: string,
    sectionType: string,
    options: {
      maxChunks?: number;
      category?: string;
      similarityThreshold?: number;
    } = {}
  ): Promise<{
    context: string;
    sources: Array<{ document: string; chunk: number; similarity: number }>;
  }> {
    const {
      maxChunks = 5,
      category,
      similarityThreshold = 0.7,
    } = options;

    // Build search query based on section type and RFP content
    const searchQuery = this.buildContextQuery(rfpContent, sectionType);

    try {
      const searchResults = await this.semanticSearch(searchQuery, {
        category,
        limit: maxChunks,
        similarityThreshold,
        includeContent: true,
      });

      const context = searchResults
        .map(result => result.chunk.content)
        .join('\n\n');

      const sources = searchResults.map(result => ({
        document: result.document_metadata?.name || 'Unknown Document',
        chunk: result.chunk.index,
        similarity: result.similarity,
      }));

      return { context, sources };

    } catch (error) {
      console.error('Failed to get relevant context:', error);
      return { context: '', sources: [] };
    }
  }

  /**
   * Batch process multiple documents
   */
  async processDocuments(
    files: File[],
    metadata: Array<{
      description: string;
      category: string;
      tags: string[];
    }>,
    options: {
      chunkingOptions?: Partial<ChunkingOptions>;
      generateEmbeddings?: boolean;
      onProgress?: (progress: {
        currentFile: number;
        totalFiles: number;
        currentStage: string;
        overallProgress: number;
        fileName?: string;
      }) => void;
    } = {}
  ): Promise<ProcessedDocument[]> {
    const { onProgress } = options;
    const results: ProcessedDocument[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileMeta = metadata[i] || metadata[0]; // Use first metadata if not enough provided

      try {
        const result = await this.processDocument(file, fileMeta, {
          ...options,
          onProgress: (fileProgress) => {
            const overallProgress = (i / files.length) * 100 + (fileProgress.progress / files.length);
            onProgress?.({
              currentFile: i + 1,
              totalFiles: files.length,
              currentStage: fileProgress.stage,
              overallProgress,
              fileName: file.name,
            });
          },
        });

        results.push(result);

        // Small delay between files to avoid overwhelming the system
        if (i < files.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

      } catch (error) {
        console.error(`Failed to process file ${file.name}:`, error);
        // Continue with other files even if one fails
      }
    }

    return results;
  }

  private buildContextQuery(rfpContent: string, sectionType: string): string {
    const sectionKeywords: Record<string, string[]> = {
      'executive-summary': ['overview', 'company', 'value proposition', 'solution', 'benefits'],
      'technical-approach': ['technical', 'features', 'capabilities', 'architecture', 'integration', 'API'],
      'pricing': ['pricing', 'packages', 'costs', 'plans', 'subscription', 'licensing'],
      'company-overview': ['company', 'history', 'experience', 'expertise', 'team', 'about'],
      'references': ['case studies', 'customer', 'success stories', 'testimonials', 'references'],
      'implementation': ['implementation', 'deployment', 'setup', 'installation', 'rollout'],
      'support': ['support', 'maintenance', 'training', 'help', 'assistance'],
    };

    const keywords = sectionKeywords[sectionType] || ['zenloop', 'customer experience'];

    // Extract key terms from RFP content
    const rfpKeywords = rfpContent
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3 && !/^\d+$/.test(word)) // Filter out short words and pure numbers
      .slice(0, 10); // Limit to top 10 terms

    return [...keywords, ...rfpKeywords].join(' ');
  }

  private getFileType(mimeType: string): string {
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'docx';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'pptx';
    return 'txt';
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured(): boolean {
    return !!this.supabase && embeddingService.isConfigured();
  }

  /**
   * Get service status
   */
  getStatus(): {
    database: boolean;
    embeddings: boolean;
    fileProcessing: boolean;
  } {
    return {
      database: !!this.supabase,
      embeddings: embeddingService.isConfigured(),
      fileProcessing: true, // File processing is always available
    };
  }
}

// Export singleton instance
export const enhancedDocumentProcessor = new EnhancedDocumentProcessor();