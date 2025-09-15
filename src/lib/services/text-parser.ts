export class TextParserService {
  static async extractTextFromFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error('Failed to read text file'));
        reader.readAsText(file);
      } else if (file.type === 'application/pdf') {
        // For PDF files, we'll need to implement PDF text extraction
        // For now, return a placeholder - in a real implementation, you'd use a PDF parsing library
        reject(new Error('PDF text extraction not implemented yet. Please convert to text format or use a PDF parsing library like pdf-parse.'));
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // For DOCX files, we'll need to implement DOCX text extraction
        // For now, return a placeholder - in a real implementation, you'd use a DOCX parsing library
        reject(new Error('DOCX text extraction not implemented yet. Please convert to text format or use a DOCX parsing library like mammoth.'));
      } else if (file.type.includes('powerpoint') || file.type.includes('presentation')) {
        // For PowerPoint files, we'll need to implement PPT text extraction
        reject(new Error('PowerPoint text extraction not implemented yet. Please convert to text format or use a PPT parsing library.'));
      } else {
        reject(new Error('Unsupported file type. Please use text files (.txt) for now.'));
      }
    });
  }

  static async extractTextFromTextFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read text file'));
      reader.readAsText(file);
    });
  }

  // Helper method to create a text file from content
  static createTextFile(content: string, filename: string): File {
    const blob = new Blob([content], { type: 'text/plain' });
    return new File([blob], filename, { type: 'text/plain' });
  }

  // Helper method to validate file type
  static isValidFileType(file: File): boolean {
    const validTypes = [
      'text/plain',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    
    return validTypes.includes(file.type) || 
           file.name.endsWith('.txt') || 
           file.name.endsWith('.pdf') || 
           file.name.endsWith('.docx') || 
           file.name.endsWith('.pptx');
  }

  // Helper method to get file extension
  static getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  // Helper method to get file type from extension
  static getFileTypeFromExtension(filename: string): string {
    const extension = this.getFileExtension(filename);
    switch (extension) {
      case 'txt': return 'text/plain';
      case 'pdf': return 'application/pdf';
      case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'pptx': return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      default: return 'text/plain';
    }
  }
} 