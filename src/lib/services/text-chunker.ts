export interface TextChunk {
  content: string;
  index: number;
  startIndex: number;
  endIndex: number;
  metadata: {
    wordCount: number;
    characterCount: number;
    section?: string;
    hasNumbers?: boolean;
    hasQuestions?: boolean;
  };
}

export interface ChunkingOptions {
  chunkSize: number; // Target chunk size in tokens (approximately)
  overlapSize: number; // Overlap between chunks in tokens
  preserveParagraphs: boolean; // Try to keep paragraphs together
  preserveSentences: boolean; // Try to keep sentences together
  minChunkSize?: number; // Minimum chunk size to avoid tiny chunks
}

export class TextChunkerService {
  private static readonly DEFAULT_OPTIONS: ChunkingOptions = {
    chunkSize: 500, // ~500 tokens per chunk
    overlapSize: 50, // ~50 token overlap
    preserveParagraphs: true,
    preserveSentences: true,
    minChunkSize: 100, // Don't create chunks smaller than 100 tokens
  };

  /**
   * Chunks text into overlapping segments optimized for embeddings
   */
  chunkText(text: string, options: Partial<ChunkingOptions> = {}): TextChunk[] {
    const opts = { ...TextChunkerService.DEFAULT_OPTIONS, ...options };

    // Clean and normalize the text
    const cleanText = this.cleanText(text);
    if (!cleanText.trim()) {
      return [];
    }

    // Split text into sentences for better chunking
    const sentences = this.splitIntoSentences(cleanText);
    if (sentences.length === 0) {
      return [];
    }

    const chunks: TextChunk[] = [];
    let currentChunk = '';
    let currentStartIndex = 0;
    let chunkIndex = 0;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      const potentialChunk = currentChunk + (currentChunk ? ' ' : '') + sentence;

      // Estimate token count (rough approximation: 1 token ≈ 0.75 words)
      const estimatedTokens = this.estimateTokenCount(potentialChunk);

      if (estimatedTokens <= opts.chunkSize) {
        // Add sentence to current chunk
        currentChunk = potentialChunk;
      } else {
        // Current chunk is full, finalize it
        if (currentChunk.trim()) {
          const chunkEndIndex = currentStartIndex + currentChunk.length;
          chunks.push(this.createChunk(
            currentChunk,
            chunkIndex++,
            currentStartIndex,
            chunkEndIndex
          ));
        }

        // Start new chunk with overlap
        const overlapText = this.createOverlapText(currentChunk, opts.overlapSize);
        currentChunk = overlapText + (overlapText ? ' ' : '') + sentence;
        currentStartIndex = this.findOverlapStartIndex(cleanText, overlapText, currentStartIndex);
      }
    }

    // Add the final chunk if it exists and meets minimum size
    if (currentChunk.trim()) {
      const estimatedTokens = this.estimateTokenCount(currentChunk);
      if (estimatedTokens >= (opts.minChunkSize || 0)) {
        chunks.push(this.createChunk(
          currentChunk,
          chunkIndex,
          currentStartIndex,
          currentStartIndex + currentChunk.length
        ));
      } else if (chunks.length > 0) {
        // Merge small final chunk with the last chunk
        const lastChunk = chunks[chunks.length - 1];
        lastChunk.content += ' ' + currentChunk;
        lastChunk.endIndex = currentStartIndex + currentChunk.length;
        lastChunk.metadata = this.calculateChunkMetadata(lastChunk.content);
      }
    }

    return chunks;
  }

  /**
   * Chunks text preserving document structure (sections, paragraphs)
   */
  chunkWithStructure(text: string, options: Partial<ChunkingOptions> = {}): TextChunk[] {
    const opts = { ...TextChunkerService.DEFAULT_OPTIONS, ...options };

    // First, identify document sections
    const sections = this.identifySections(text);
    const allChunks: TextChunk[] = [];

    for (const section of sections) {
      const sectionChunks = this.chunkText(section.content, opts);

      // Add section metadata to chunks
      sectionChunks.forEach((chunk, idx) => {
        chunk.metadata.section = section.title;
        chunk.index = allChunks.length + idx;
      });

      allChunks.push(...sectionChunks);
    }

    return allChunks;
  }

  private cleanText(text: string): string {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove form feed and other control characters
      .replace(/[\f\v]/g, '')
      // Normalize quotes
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'")
      // Clean up common document artifacts
      .replace(/\[Page \d+\]/gi, '')
      .replace(/\[CONFIDENTIAL\]/gi, '')
      .trim();
  }

  private splitIntoSentences(text: string): string[] {
    // Split on sentence endings, but be careful about abbreviations
    const sentenceRegex = /(?<![A-Z][a-z]\.)\s*[.!?]+\s+/g;
    const sentences = text.split(sentenceRegex).filter(s => s.trim().length > 0);

    // Clean up each sentence
    return sentences.map(sentence => sentence.trim());
  }

  private estimateTokenCount(text: string): number {
    // Rough approximation: 1 token ≈ 0.75 words
    // This is a heuristic - for exact token counting, you'd use tiktoken
    const wordCount = text.split(/\s+/).length;
    return Math.ceil(wordCount / 0.75);
  }

  private createOverlapText(text: string, overlapTokens: number): string {
    const words = text.split(/\s+/);
    const overlapWords = Math.ceil(overlapTokens * 0.75); // Convert tokens to approximate words

    if (words.length <= overlapWords) {
      return text;
    }

    return words.slice(-overlapWords).join(' ');
  }

  private findOverlapStartIndex(fullText: string, overlapText: string, currentIndex: number): number {
    if (!overlapText) return currentIndex;

    const overlapIndex = fullText.lastIndexOf(overlapText, currentIndex);
    return overlapIndex !== -1 ? overlapIndex : currentIndex;
  }

  private createChunk(
    content: string,
    index: number,
    startIndex: number,
    endIndex: number
  ): TextChunk {
    return {
      content: content.trim(),
      index,
      startIndex,
      endIndex,
      metadata: this.calculateChunkMetadata(content),
    };
  }

  private calculateChunkMetadata(content: string): TextChunk['metadata'] {
    const wordCount = content.split(/\s+/).length;
    const characterCount = content.length;
    const hasNumbers = /\d/.test(content);
    const hasQuestions = /\?/.test(content);

    return {
      wordCount,
      characterCount,
      hasNumbers,
      hasQuestions,
    };
  }

  private identifySections(text: string): Array<{ title: string; content: string }> {
    const sections: Array<{ title: string; content: string }> = [];

    // Common section patterns in RFPs and business documents
    const sectionPatterns = [
      /^(\d+\.?\s+[A-Z][^:\n]*):?\s*$/gm, // Numbered sections: "1. OVERVIEW"
      /^([A-Z][A-Z\s]{3,}):?\s*$/gm, // All caps sections: "TECHNICAL REQUIREMENTS"
      /^(SECTION\s+\d+[^:\n]*):?\s*$/gim, // Section headers: "SECTION 1: OVERVIEW"
      /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*$/gm, // Title case sections
    ];

    let currentContent = text;
    let lastIndex = 0;

    // Try to match section headers
    for (const pattern of sectionPatterns) {
      const matches = Array.from(currentContent.matchAll(pattern));

      if (matches.length > 1) {
        // Found multiple sections with this pattern
        for (let i = 0; i < matches.length; i++) {
          const match = matches[i];
          const nextMatch = matches[i + 1];

          const sectionStart = match.index || 0;
          const sectionEnd = nextMatch ? nextMatch.index || currentContent.length : currentContent.length;

          const title = match[1].trim();
          const content = currentContent.substring(sectionStart + match[0].length, sectionEnd).trim();

          if (content.length > 50) { // Only include substantial sections
            sections.push({ title, content });
          }
        }
        break; // Use the first pattern that works well
      }
    }

    // If no clear sections found, treat as one section
    if (sections.length === 0) {
      sections.push({
        title: 'Document Content',
        content: text,
      });
    }

    return sections;
  }

  /**
   * Get optimal chunk size based on content length
   */
  getOptimalChunkSize(contentLength: number): number {
    if (contentLength < 2000) return 300; // Smaller chunks for short documents
    if (contentLength < 10000) return 500; // Standard chunk size
    if (contentLength < 50000) return 750; // Larger chunks for long documents
    return 1000; // Very large chunks for very long documents
  }

  /**
   * Validate chunking configuration
   */
  validateOptions(options: ChunkingOptions): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (options.chunkSize < 50) {
      errors.push('Chunk size too small (minimum 50 tokens)');
    }
    if (options.chunkSize > 2000) {
      errors.push('Chunk size too large (maximum 2000 tokens)');
    }
    if (options.overlapSize >= options.chunkSize) {
      errors.push('Overlap size must be smaller than chunk size');
    }
    if (options.overlapSize < 0) {
      errors.push('Overlap size cannot be negative');
    }
    if (options.minChunkSize && options.minChunkSize >= options.chunkSize) {
      errors.push('Minimum chunk size must be smaller than chunk size');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const textChunker = new TextChunkerService();