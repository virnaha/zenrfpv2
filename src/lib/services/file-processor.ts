// Browser-compatible file processing with real PDF/DOCX extraction

export interface ProcessedFile {
  content: string;
  metadata: {
    pageCount?: number;
    wordCount: number;
    characterCount: number;
    hasImages?: boolean;
    processingTime: number;
    extractedSuccessfully?: boolean;
    documentType?: string;
  };
}

export class FileProcessorService {
  async processFile(file: File): Promise<ProcessedFile> {
    const startTime = Date.now();

    try {
      let content = '';
      let metadata: any = {};

      switch (file.type) {
        case 'application/pdf':
          const result = await this.processPDF(file);
          content = result.content;
          metadata = result.metadata;
          break;

        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          const docxResult = await this.processDOCX(file);
          content = docxResult.content;
          metadata = docxResult.metadata;
          break;

        case 'text/plain':
          content = await this.processText(file);
          metadata = { extractedSuccessfully: true, documentType: 'TXT' };
          break;

        default:
          throw new Error(`Unsupported file type: ${file.type}`);
      }

      const processingTime = Date.now() - startTime;

      return {
        content: content.trim(),
        metadata: {
          ...metadata,
          wordCount: this.countWords(content),
          characterCount: content.length,
          processingTime,
        },
      };
    } catch (error) {
      console.error('File processing failed:', error);
      throw new Error(`Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async processPDF(file: File): Promise<{ content: string; metadata: any }> {
    console.log(`Extracting text from PDF: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

    try {
      // Import browser-compatible PDF parser
      const pdfjsLib = await import('pdfjs-dist');

      // Use the correct file extension for pdfjs 5.x (uses .mjs not .js)
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.149/build/pdf.worker.min.mjs`;

      console.log('Converting PDF to array buffer...');
      const arrayBuffer = await file.arrayBuffer();
      console.log(`Buffer created: ${arrayBuffer.byteLength} bytes`);

      console.log('Loading PDF document...');
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      console.log(`PDF loaded: ${pdf.numPages} pages`);

      console.log('Extracting text from all pages...');
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';

        if (i % 5 === 0) {
          console.log(`Processed ${i}/${pdf.numPages} pages...`);
        }
      }

      console.log(`PDF parsed successfully: ${fullText.length} characters, ${pdf.numPages} pages`);

      return {
        content: fullText.trim(),
        metadata: {
          pageCount: pdf.numPages,
          hasImages: false,
          extractedSuccessfully: true,
          documentType: 'PDF',
        },
      };
    } catch (error) {
      console.error('PDF extraction failed:', error);
      throw new Error(`PDF extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async processDOCX(file: File): Promise<{ content: string; metadata: any }> {
    console.log(`Extracting text from DOCX: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

    try {
      // Import mammoth for DOCX parsing
      const mammoth = (await import('mammoth')).default;

      // Convert file to array buffer with timeout
      console.log('Converting DOCX to buffer...');
      const arrayBuffer = await file.arrayBuffer();
      console.log(`Buffer created: ${arrayBuffer.byteLength} bytes`);

      // Extract text from DOCX with timeout
      console.log('Parsing DOCX content...');
      const extractPromise = mammoth.extractRawText({ arrayBuffer });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('DOCX parsing timeout after 2 minutes')), 120000)
      );

      const result = await Promise.race([extractPromise, timeoutPromise]);
      console.log(`DOCX parsed successfully: ${result.value.length} characters`);

      return {
        content: result.value,
        metadata: {
          pageCount: 0,
          hasImages: false,
          extractedSuccessfully: true,
          documentType: 'DOCX',
          messages: result.messages,
        },
      };
    } catch (error) {
      console.error('DOCX extraction failed:', error);
      throw new Error(`DOCX extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async processText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };
      reader.onerror = () => reject(new Error('Failed to read text file'));
      reader.readAsText(file);
    });
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Method to validate file before processing
  validateFile(file: File): { isValid: boolean; error?: string } {
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return { isValid: false, error: 'File size exceeds 10MB limit' };
    }

    // Check file type
    const supportedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];

    if (!supportedTypes.includes(file.type)) {
      return { isValid: false, error: 'Unsupported file type. Please use PDF, DOCX, or TXT files.' };
    }

    return { isValid: true };
  }

  // Method to extract metadata without full processing
  async getFileInfo(file: File): Promise<{
    name: string;
    size: number;
    type: string;
    lastModified: number;
    estimatedProcessingTime: number;
  }> {
    // Estimate processing time based on file size and type
    let baseTime = 100; // Base 100ms
    const sizeMultiplier = file.size / (1024 * 1024); // Size in MB

    switch (file.type) {
      case 'application/pdf':
        baseTime += sizeMultiplier * 500; // PDFs take longer
        break;
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        baseTime += sizeMultiplier * 300; // DOCX is moderate
        break;
      default:
        baseTime += sizeMultiplier * 100; // Text files are fast
    }

    return {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      estimatedProcessingTime: Math.round(baseTime),
    };
  }
}

// Export singleton instance
export const fileProcessor = new FileProcessorService();