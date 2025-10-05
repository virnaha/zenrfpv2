import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2, X, Brain, Loader2, Database, Search, Tag, BookOpen, Filter, Download, FolderOpen, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { enhancedDocumentProcessor, ProcessedDocument, SearchResult } from '../lib/services/enhanced-document-processor';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

interface KnowledgeDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'processing' | 'chunking' | 'embedding' | 'completed' | 'error';
  progress: number;
  error?: string;
  category: string;
  tags: string[];
  description: string;
  chunks_count?: number;
  embeddings_count?: number;
  upload_date?: string;
}

interface BulkUploadProgress {
  currentFile: number;
  totalFiles: number;
  currentStage: string;
  overallProgress: number;
  fileName?: string;
}

export const KnowledgeBase = () => {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [bulkProgress, setBulkProgress] = useState<BulkUploadProgress | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const [documentForm, setDocumentForm] = useState({
    description: '',
    category: 'company-docs',
    tags: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing documents on component mount
  useEffect(() => {
    loadExistingDocuments();
  }, []);

  const loadExistingDocuments = async () => {
    try {
      if (!enhancedDocumentProcessor.isConfigured()) {
        console.warn('Document processor not configured');
        return;
      }

      // Load documents from Supabase using the enhanced processor's internal supabase client
      const { createClient } = await import('@supabase/supabase-js');
      const { createAPIConfig } = await import('../lib/config/api-config');

      const config = createAPIConfig();
      const supabase = createClient(config.supabase.url, config.supabase.anonKey);

      const { data: dbDocuments, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load documents:', error);
        toast.error('Failed to load existing documents');
        return;
      }

      if (dbDocuments && dbDocuments.length > 0) {
        const loadedDocuments: KnowledgeDocument[] = dbDocuments.map(doc => ({
          id: doc.id,
          name: doc.name,
          size: doc.size,
          type: doc.type,
          status: 'completed' as const,
          progress: 100,
          category: doc.category || 'general',
          tags: doc.tags || [],
          description: doc.description || '',
          chunks_count: 0, // We could calculate this but it's not critical for display
          embeddings_count: doc.embeddings_count || 0,
          upload_date: doc.created_at,
        }));

        setDocuments(loadedDocuments);
        toast.success(`Loaded ${loadedDocuments.length} existing documents`);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('Failed to load existing documents');
    }
  };

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'company-docs', label: 'Company Documents' },
    { value: 'case-studies', label: 'Case Studies' },
    { value: 'technical-specs', label: 'Technical Specifications' },
    { value: 'pricing', label: 'Pricing & Packages' },
    { value: 'references', label: 'References & Testimonials' },
    { value: 'templates', label: 'Response Templates' },
    { value: 'rfp-examples-en', label: 'RFP Examples (English)' },
    { value: 'rfp-examples-de', label: 'RFP Examples (German)' },
    { value: 'company-docs-de', label: 'Company Documents (German)' },
  ];

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
      setShowDocumentDialog(true);
      // Store files in a ref or state to process after form submission
      (window as any).pendingFiles = files;
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (files.length > 0) {
        setShowDocumentDialog(true);
        (window as any).pendingFiles = files;
      }
    }
  };

  const processFiles = async (files: File[]) => {
    if (!enhancedDocumentProcessor.isConfigured()) {
      toast.error('Knowledge Base not configured. Please set up Supabase and OpenAI API keys.');
      return;
    }

    setIsUploading(true);
    setActiveTab('documents');

    // Create document entries with pending status
    const newDocuments: KnowledgeDocument[] = files.map((file, index) => ({
      id: `temp-${Date.now()}-${index}`,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading',
      progress: 0,
      category: documentForm.category,
      tags: documentForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      description: documentForm.description,
    }));

    setDocuments(prev => [...prev, ...newDocuments]);

    try {
      // Prepare metadata for batch processing
      const metadata = files.map(() => ({
        description: documentForm.description,
        category: documentForm.category,
        tags: documentForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      }));

      // Process documents
      const results = await enhancedDocumentProcessor.processDocuments(
        files,
        metadata,
        {
          generateEmbeddings: true,
          onProgress: (progress: BulkUploadProgress) => {
            setBulkProgress(progress);

            // Update individual document status
            setDocuments(prev => prev.map((doc, index) => {
              if (index >= prev.length - files.length) {
                const fileIndex = index - (prev.length - files.length);
                if (fileIndex === progress.currentFile - 1) {
                  let status: KnowledgeDocument['status'] = 'processing';
                  switch (progress.currentStage) {
                    case 'extraction': status = 'processing'; break;
                    case 'chunking': status = 'chunking'; break;
                    case 'embeddings': status = 'embedding'; break;
                    case 'storage': status = 'embedding'; break;
                    case 'complete': status = 'completed'; break;
                  }
                  return { ...doc, status, progress: progress.overallProgress };
                }
              }
              return doc;
            }));
          },
        }
      );

      // Update documents with final results
      setDocuments(prev => prev.map((doc, index) => {
        if (index >= prev.length - files.length) {
          const resultIndex = index - (prev.length - files.length);
          const result = results[resultIndex];

          if (result) {
            return {
              ...doc,
              id: result.document.id,
              status: 'completed',
              progress: 100,
              chunks_count: result.processing_stats.total_chunks,
              embeddings_count: result.processing_stats.total_embeddings,
              upload_date: new Date().toISOString(),
            };
          }
        }
        return doc;
      }));

      toast.success(`Successfully processed ${results.length} documents with RAG capabilities`);

    } catch (error) {
      console.error('Batch processing failed:', error);
      toast.error(`Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);

      // Mark failed documents
      setDocuments(prev => prev.map((doc, index) => {
        if (index >= prev.length - files.length) {
          return {
            ...doc,
            status: 'error',
            error: error instanceof Error ? error.message : 'Processing failed',
          };
        }
        return doc;
      }));
    } finally {
      setIsUploading(false);
      setBulkProgress(null);
      setShowDocumentDialog(false);
      setDocumentForm({ description: '', category: 'company-docs', tags: '' });
    }
  };

  const handleFormSubmit = () => {
    const files = (window as any).pendingFiles as File[];
    if (files && files.length > 0) {
      processFiles(files);
      (window as any).pendingFiles = null;
    }
  };

  const performSemanticSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await enhancedDocumentProcessor.semanticSearch(searchQuery, {
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        limit: 10,
        similarityThreshold: 0.7,
        includeContent: true,
      });

      setSearchResults(results);

      if (results.length === 0) {
        toast.info('No relevant documents found. Try different keywords.');
      }
    } catch (error) {
      toast.error('Search failed. Please try again.');
      console.error('Search error:', error);
    }
  };

  const removeDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
    toast.success('Document removed from knowledge base');
  };

  const getStatusIcon = (status: KnowledgeDocument['status']) => {
    switch (status) {
      case 'uploading': return <Upload className="h-4 w-4 text-blue-500" />;
      case 'processing': return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'chunking': return <FileText className="h-4 w-4 text-blue-500" />;
      case 'embedding': return <Brain className="h-4 w-4 text-purple-500" />;
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: KnowledgeDocument['status']) => {
    switch (status) {
      case 'uploading': return 'Uploading...';
      case 'processing': return 'Extracting text...';
      case 'chunking': return 'Creating chunks...';
      case 'embedding': return 'Generating embeddings...';
      case 'completed': return 'Ready for RAG';
      case 'error': return 'Processing failed';
      default: return 'Unknown';
    }
  };

  const completedDocs = documents.filter(doc => doc.status === 'completed');
  const totalEmbeddings = completedDocs.reduce((sum, doc) => sum + (doc.embeddings_count || 0), 0);

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 min-h-[calc(100vh-4rem)] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Knowledge Base</h1>
          <p className="text-slate-600 mb-4">
            Upload and manage your company documents for RAG-powered RFP responses
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Database className="h-8 w-8 text-blue-600" />
                  <div className="ml-2">
                    <p className="text-2xl font-bold">{completedDocs.length}</p>
                    <p className="text-xs text-muted-foreground">Documents</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Brain className="h-8 w-8 text-purple-600" />
                  <div className="ml-2">
                    <p className="text-2xl font-bold">{totalEmbeddings.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Embeddings</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <BookOpen className="h-8 w-8 text-green-600" />
                  <div className="ml-2">
                    <p className="text-2xl font-bold">{categories.length - 1}</p>
                    <p className="text-xs text-muted-foreground">Categories</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Search className="h-8 w-8 text-orange-600" />
                  <div className="ml-2">
                    <p className="text-2xl font-bold">{searchResults.length}</p>
                    <p className="text-xs text-muted-foreground">Search Results</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="upload">Upload Documents</TabsTrigger>
            <TabsTrigger value="documents">Document Library</TabsTrigger>
            <TabsTrigger value="search">Semantic Search</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upload Knowledge Documents</CardTitle>
                <CardDescription>
                  Add company documents, case studies, and references to enhance RFP responses with RAG
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-300 hover:border-blue-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                  <p className="text-xl font-medium text-slate-900 mb-2">
                    Drag and drop files here
                  </p>
                  <p className="text-slate-500 mb-4">
                    or click to select files (PDF, DOCX, TXT)
                  </p>
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <FolderOpen className="mr-2 h-4 w-4" />
                    Select Files
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </div>

                {bulkProgress && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing Documents ({bulkProgress.currentFile}/{bulkProgress.totalFiles})
                      </CardTitle>
                      <CardDescription>
                        {bulkProgress.fileName && `Current: ${bulkProgress.fileName}`}
                        <br />
                        Stage: {bulkProgress.currentStage}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Progress value={bulkProgress.overallProgress} className="w-full" />
                      <p className="text-sm text-muted-foreground mt-2">
                        {Math.round(bulkProgress.overallProgress)}% complete
                      </p>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Document Library</h3>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {documents
                .filter(doc => selectedCategory === 'all' || doc.category === selectedCategory)
                .map(document => (
                <Card key={document.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(document.status)}
                        <div>
                          <CardTitle className="text-base">{document.name}</CardTitle>
                          <CardDescription>{getStatusText(document.status)}</CardDescription>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDocument(document.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {document.status !== 'completed' && document.progress > 0 && (
                      <Progress value={document.progress} className="w-full" />
                    )}

                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary">{document.category}</Badge>
                      {document.tags.map(tag => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))}
                    </div>

                    {document.description && (
                      <p className="text-sm text-muted-foreground">{document.description}</p>
                    )}

                    {document.status === 'completed' && (
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{document.chunks_count || 0} chunks</span>
                        <span>{document.embeddings_count || 0} embeddings</span>
                        <span>{Math.round(document.size / 1024)}KB</span>
                      </div>
                    )}

                    {document.error && (
                      <p className="text-sm text-red-600">{document.error}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="search" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Semantic Search</CardTitle>
                <CardDescription>
                  Search through your knowledge base using natural language queries
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Search for technical requirements, pricing info, case studies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && performSemanticSearch()}
                  />
                  <Button onClick={performSemanticSearch}>
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {searchResults.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Search Results ({searchResults.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-4">
                      {searchResults.map((result, index) => (
                        <Card key={index}>
                          <CardContent className="pt-4">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4 text-blue-500" />
                                <span className="font-medium text-sm">
                                  {result.document_metadata?.name || 'Unknown Document'}
                                </span>
                                <Badge variant="outline">{result.document_metadata?.category}</Badge>
                              </div>
                              <Badge variant="secondary">
                                {Math.round(result.similarity * 100)}% match
                              </Badge>
                            </div>

                            <p className="text-sm text-muted-foreground mb-2">
                              {result.chunk.content}
                            </p>

                            <div className="flex flex-wrap gap-1">
                              {result.document_metadata?.tags?.map((tag: string) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Document Form Dialog */}
        <Dialog open={showDocumentDialog} onOpenChange={setShowDocumentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Document Information</DialogTitle>
              <DialogDescription>
                Provide details about the documents you're uploading to improve RAG search quality.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the document contents..."
                  value={documentForm.description}
                  onChange={(e) => setDocumentForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={documentForm.category}
                  onValueChange={(value) => setDocumentForm(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.slice(1).map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  placeholder="zenloop, customer experience, case study..."
                  value={documentForm.tags}
                  onChange={(e) => setDocumentForm(prev => ({ ...prev, tags: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowDocumentDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleFormSubmit}
                disabled={!documentForm.description.trim()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Process Documents
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};