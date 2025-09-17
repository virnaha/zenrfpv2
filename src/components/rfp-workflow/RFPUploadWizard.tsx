import React, { useState, useCallback, useRef } from 'react';
import {
  Upload, FileText, AlertCircle, CheckCircle2, X, Eye,
  File, FileType, Clock, Zap, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

import { fileProcessor } from '../../lib/services/file-processor';
import { supabaseService } from '../../lib/services/supabase-service';

interface RFPUploadWizardProps {
  project: any;
  onProjectUpdate: (project: any) => void;
  onNext: (step: string) => void;
  onError: (error: string) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

interface UploadedFile {
  file: File;
  content?: string;
  preview?: string;
  processingProgress: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
  metadata?: {
    pages?: number;
    wordCount?: number;
    questionsEstimate?: number;
  };
}

export const RFPUploadWizard: React.FC<RFPUploadWizardProps> = ({
  project,
  onProjectUpdate,
  onNext,
  onError,
  isProcessing,
  setIsProcessing
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  }, []);

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!validTypes.includes(file.type)) {
      return { isValid: false, error: 'Only PDF, DOCX, and TXT files are supported' };
    }

    if (file.size > maxSize) {
      return { isValid: false, error: 'File size must be less than 10MB' };
    }

    return { isValid: true };
  };

  const handleFileUpload = async (file: File) => {
    const validation = validateFile(file);
    if (!validation.isValid) {
      onError(validation.error || 'Invalid file');
      return;
    }

    const newUploadedFile: UploadedFile = {
      file,
      processingProgress: 0,
      status: 'pending'
    };

    setUploadedFile(newUploadedFile);
    setIsProcessing(true);

    try {
      // Update status to processing
      setUploadedFile(prev => prev ? { ...prev, status: 'processing' } : null);

      // Simulate file processing with progress updates
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setUploadedFile(prev => prev ? { ...prev, processingProgress: i } : null);
      }

      // Process the file
      const processedFile = await fileProcessor.processFile(file);

      // Extract metadata from the content string
      const wordCount = processedFile.content.split(/\s+/).length;
      const questionsEstimate = Math.ceil(processedFile.content.split('?').length * 0.8);
      const pages = file.type === 'application/pdf' ? Math.ceil(file.size / 50000) : Math.ceil(wordCount / 300);

      const metadata = {
        pages,
        wordCount,
        questionsEstimate
      };

      // Create preview (first 300 characters)
      const preview = processedFile.content.substring(0, 300) + (processedFile.content.length > 300 ? '...' : '');

      // Update file status to completed
      const completedFile: UploadedFile = {
        ...newUploadedFile,
        content: processedFile.content,
        preview,
        processingProgress: 100,
        status: 'completed',
        metadata
      };

      setUploadedFile(completedFile);

      // Save to Supabase (best-effort)
      try {
        await supabaseService.uploadDocument(file, processedFile.content, {
          description: 'RFP document',
          category: 'rfp',
          tags: []
        });
      } catch (e) {
        // Non-fatal if remote save fails
        console.warn('Supabase save skipped/failed:', e);
      }

      // Update project with document (local state)
      const updatedProject = {
        ...project,
        document: {
          id: `doc_${Date.now()}`,
          name: file.name,
          size: file.size,
          content: processedFile.content,
          uploadedAt: new Date(),
          metadata
        },
        updatedAt: new Date(),
        questionsTotal: questionsEstimate
      };

      onProjectUpdate(updatedProject);

      toast({
        title: "Upload complete",
        description: `Processed ${wordCount} words (~${questionsEstimate} questions detected).`,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process file';
      setUploadedFile(prev => prev ? {
        ...prev,
        status: 'error',
        error: errorMessage
      } : null);
      onError(`File processing failed: ${errorMessage}`);
      toast({
        title: 'Upload failed',
        description: 'Please try again. If the issue persists, contact support.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetryUpload = () => {
    if (uploadedFile) {
      handleFileUpload(uploadedFile.file);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FileType className="h-8 w-8 text-red-500" />;
    if (fileType.includes('word')) return <FileText className="h-8 w-8 text-blue-500" />;
    return <File className="h-8 w-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    const kb = bytes / 1024;
    const mb = kb / 1024;
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    return `${kb.toFixed(1)} KB`;
  };

  const canProceed = uploadedFile?.status === 'completed' && project?.document;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Upload RFP Document</h2>
        <p className="text-muted-foreground">
          Upload your RFP document to begin the AI-powered response generation process
        </p>
      </div>

      {/* Upload Area */}
      {!uploadedFile && (
        <Card>
          <CardContent className="pt-6">
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                dragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="mx-auto mb-4">
                <Upload className="h-12 w-12 mx-auto text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Drop your RFP document here</h3>
              <p className="text-muted-foreground mb-4">
                or click to browse and select a file
              </p>
              <Button onClick={openFileDialog} className="mb-4">
                Choose File
              </Button>
              <div className="text-sm text-muted-foreground">
                <p>Supported formats: PDF, DOCX, TXT</p>
                <p>Maximum file size: 10MB</p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.docx,.txt"
              onChange={handleFileInput}
            />
          </CardContent>
        </Card>
      )}

      {/* File Processing Status */}
      {uploadedFile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getFileIcon(uploadedFile.file.type)}
              Document Processing
            </CardTitle>
            <CardDescription>
              Processing your RFP document for AI analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File Info */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                {getFileIcon(uploadedFile.file.type)}
                <div>
                  <p className="font-medium">{uploadedFile.file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(uploadedFile.file.size)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {uploadedFile.status === 'completed' && (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                )}
                {uploadedFile.status === 'processing' && (
                  <Badge className="bg-blue-100 text-blue-800">
                    <Clock className="h-3 w-3 mr-1" />
                    Processing...
                  </Badge>
                )}
                {uploadedFile.status === 'error' && (
                  <Badge className="bg-red-100 text-red-800">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Error
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                  className="h-8 w-8 p-0"
                  aria-label="Remove uploaded file"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Progress Bar */}
            {uploadedFile.status === 'processing' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Processing document...</span>
                  <span>{uploadedFile.processingProgress}%</span>
                </div>
                <Progress value={uploadedFile.processingProgress} className="h-2" />
              </div>
            )}

            {/* Error Display */}
            {uploadedFile.status === 'error' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Processing Failed</AlertTitle>
                <AlertDescription className="mt-2">
                  {uploadedFile.error}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetryUpload}
                    className="mt-2"
                  >
                    Try Again
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Success Display */}
            {uploadedFile.status === 'completed' && uploadedFile.metadata && (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Document Successfully Processed</AlertTitle>
                  <AlertDescription>
                    Your RFP document has been processed and is ready for analysis.
                  </AlertDescription>
                </Alert>

                {/* Document Stats */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-700">{uploadedFile.metadata.pages}</div>
                    <div className="text-sm text-green-600">Pages</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-700">{uploadedFile.metadata.wordCount.toLocaleString()}</div>
                    <div className="text-sm text-green-600">Words</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-700">~{uploadedFile.metadata.questionsEstimate}</div>
                    <div className="text-sm text-green-600">Questions Est.</div>
                  </div>
                </div>

                {/* Document Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Document Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-gray-50 rounded-lg border max-h-32 overflow-y-auto">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {uploadedFile.preview}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upload Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Tips for Best Results</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Ensure the document contains clear question sections</li>
                <li>• Include all requirements and evaluation criteria</li>
                <li>• Upload the complete RFP document, not just excerpts</li>
                <li>• Text-based formats (DOCX, PDF with text) work better than scanned images</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6">
        <Button variant="outline" onClick={() => onNext('dashboard')}>
          ← Back to Dashboard
        </Button>
        <Button
          onClick={() => onNext('analyze')}
          disabled={!canProceed}
          className="flex items-center gap-2"
        >
          Next: Analyze Document
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};