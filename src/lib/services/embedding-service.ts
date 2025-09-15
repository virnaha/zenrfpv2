import { createAPIConfig } from '../config/api-config';

export interface EmbeddingResult {
  embedding: number[];
  tokensUsed: number;
}

export interface BatchEmbeddingResult {
  embeddings: number[][];
  totalTokensUsed: number;
  processedCount: number;
  errors: string[];
}

export interface EmbeddingRequest {
  text: string;
  id?: string;
}

export class EmbeddingService {
  private config = createAPIConfig();
  private readonly MODEL = 'text-embedding-ada-002';
  private readonly MAX_TOKENS_PER_REQUEST = 8191; // OpenAI's limit for ada-002
  private readonly MAX_BATCH_SIZE = 100; // Process in smaller batches to avoid rate limits

  /**
   * Generate embedding for a single text
   */
  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    if (!this.config.features.enableAIGeneration) {
      throw new Error('AI generation is disabled. Please configure VITE_OPENAI_API_KEY');
    }

    const cleanText = this.preprocessText(text);
    if (!cleanText.trim()) {
      throw new Error('Cannot generate embedding for empty text');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.openai.apiKey}`,
          'Content-Type': 'application/json',
          ...(this.config.openai.organization && {
            'OpenAI-Organization': this.config.openai.organization,
          }),
        },
        body: JSON.stringify({
          model: this.MODEL,
          input: cleanText,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
        throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();

      if (!data.data || !data.data[0] || !data.data[0].embedding) {
        throw new Error('Invalid response from OpenAI API');
      }

      return {
        embedding: data.data[0].embedding,
        tokensUsed: data.usage?.total_tokens || this.estimateTokens(cleanText),
      };
    } catch (error) {
      console.error('Embedding generation failed:', error);
      throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate embeddings for multiple texts in batches
   */
  async generateBatchEmbeddings(
    requests: EmbeddingRequest[],
    onProgress?: (progress: { processed: number; total: number; currentBatch: number }) => void
  ): Promise<BatchEmbeddingResult> {
    if (!this.config.features.enableAIGeneration) {
      throw new Error('AI generation is disabled. Please configure VITE_OPENAI_API_KEY');
    }

    const embeddings: number[][] = [];
    let totalTokensUsed = 0;
    let processedCount = 0;
    const errors: string[] = [];

    // Process requests in batches
    for (let i = 0; i < requests.length; i += this.MAX_BATCH_SIZE) {
      const batch = requests.slice(i, i + this.MAX_BATCH_SIZE);
      const batchNumber = Math.floor(i / this.MAX_BATCH_SIZE) + 1;

      try {
        const batchResult = await this.processBatch(batch);
        embeddings.push(...batchResult.embeddings);
        totalTokensUsed += batchResult.totalTokensUsed;
        processedCount += batchResult.processedCount;

        if (onProgress) {
          onProgress({
            processed: processedCount,
            total: requests.length,
            currentBatch: batchNumber,
          });
        }

        // Add a small delay between batches to respect rate limits
        if (i + this.MAX_BATCH_SIZE < requests.length) {
          await this.delay(100);
        }
      } catch (error) {
        const errorMsg = `Batch ${batchNumber} failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(errorMsg);

        // Add empty embeddings for failed items to maintain array alignment
        for (let j = 0; j < batch.length; j++) {
          embeddings.push([]);
        }
      }
    }

    return {
      embeddings,
      totalTokensUsed,
      processedCount,
      errors,
    };
  }

  private async processBatch(requests: EmbeddingRequest[]): Promise<BatchEmbeddingResult> {
    const validRequests = requests.filter(req => this.preprocessText(req.text).trim());

    if (validRequests.length === 0) {
      return {
        embeddings: [],
        totalTokensUsed: 0,
        processedCount: 0,
        errors: ['No valid texts to process in batch'],
      };
    }

    const texts = validRequests.map(req => this.preprocessText(req.text));

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.openai.apiKey}`,
          'Content-Type': 'application/json',
          ...(this.config.openai.organization && {
            'OpenAI-Organization': this.config.openai.organization,
          }),
        },
        body: JSON.stringify({
          model: this.MODEL,
          input: texts,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
        throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();

      if (!data.data || !Array.isArray(data.data)) {
        throw new Error('Invalid response format from OpenAI API');
      }

      const embeddings = data.data.map((item: any) => item.embedding || []);
      const tokensUsed = data.usage?.total_tokens || texts.reduce((sum, text) => sum + this.estimateTokens(text), 0);

      return {
        embeddings,
        totalTokensUsed: tokensUsed,
        processedCount: validRequests.length,
        errors: [],
      };
    } catch (error) {
      throw new Error(`Batch embedding failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same dimensions');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  /**
   * Find most similar embeddings from a list
   */
  findMostSimilar(
    queryEmbedding: number[],
    candidateEmbeddings: Array<{ embedding: number[]; id?: string; metadata?: any }>,
    topK: number = 5,
    threshold: number = 0.7
  ): Array<{ id?: string; similarity: number; metadata?: any }> {
    const similarities = candidateEmbeddings
      .map((candidate) => ({
        id: candidate.id,
        similarity: this.calculateSimilarity(queryEmbedding, candidate.embedding),
        metadata: candidate.metadata,
      }))
      .filter(item => item.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

    return similarities;
  }

  /**
   * Preprocess text for embedding
   */
  private preprocessText(text: string): string {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove control characters
      .replace(/[\x00-\x1F\x7F]/g, '')
      // Truncate to stay within token limits (rough approximation)
      .substring(0, this.MAX_TOKENS_PER_REQUEST * 3) // ~3 chars per token estimate
      .trim();
  }

  /**
   * Estimate token count (rough approximation)
   */
  private estimateTokens(text: string): number {
    // Very rough approximation: ~0.75 tokens per word
    return Math.ceil(text.split(/\s+/).length * 0.75);
  }

  /**
   * Validate embedding dimensions
   */
  validateEmbedding(embedding: number[]): { isValid: boolean; error?: string } {
    if (!Array.isArray(embedding)) {
      return { isValid: false, error: 'Embedding must be an array' };
    }

    if (embedding.length !== 1536) {
      return { isValid: false, error: `Embedding must have 1536 dimensions, got ${embedding.length}` };
    }

    if (embedding.some(val => typeof val !== 'number' || !isFinite(val))) {
      return { isValid: false, error: 'Embedding contains invalid numbers' };
    }

    return { isValid: true };
  }

  /**
   * Get embedding dimensions for the current model
   */
  getEmbeddingDimensions(): number {
    return 1536; // OpenAI ada-002 dimensions
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured(): boolean {
    return this.config.features.enableAIGeneration && this.config.openai.apiKey !== 'demo-key';
  }

  /**
   * Get rate limit information
   */
  getRateLimitInfo(): { requestsPerMinute: number; tokensPerMinute: number } {
    // OpenAI ada-002 rate limits (may vary by account tier)
    return {
      requestsPerMinute: 3000,
      tokensPerMinute: 1000000,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const embeddingService = new EmbeddingService();