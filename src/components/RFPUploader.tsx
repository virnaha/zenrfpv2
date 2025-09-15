import React, { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2, X, Brain, Loader2 } from 'lucide-react';
import { fileProcessor } from '../lib/services/file-processor';
import { documentAnalyzer } from '../lib/services/document-analyzer';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'processing' | 'analyzing' | 'completed' | 'error';
  progress: number;
  error?: string;
  content?: string;
  analysis?: any;
}

export const RFPUploader = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);
  const fileInputRef = React.createRef<HTMLInputElement>();

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
    handleFiles(files);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    files.forEach((file) => {
      const fileId = Math.random().toString(36).substr(2, 9);
      
      if (!validTypes.includes(file.type)) {
        setUploadedFiles(prev => [...prev, {
          id: fileId,
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'error',
          progress: 0,
          error: 'Only PDF, DOCX, and TXT files are supported'
        }]);
        return;
      }

      if (file.size > maxSize) {
        setUploadedFiles(prev => [...prev, {
          id: fileId,
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'error',
          progress: 0,
          error: 'File size exceeds 10MB limit'
        }]);
        return;
      }

      const newFile: UploadedFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'uploading',
        progress: 0
      };

      setUploadedFiles(prev => [...prev, newFile]);
      processFileAndAnalyze(file, fileId);
    });
  };

  const processFileAndAnalyze = async (file: File, fileId: string) => {
    try {
      // Step 1: Extract content
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'uploading', progress: 30 } : f
      ));

      const processedFile = await fileProcessor.processFile(file);
      
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId ? { 
          ...f, 
          status: 'processing', 
          progress: 60,
          content: processedFile.content 
        } : f
      ));

      // Step 2: AI Analysis
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'analyzing', progress: 80 } : f
      ));

      const analysis = await documentAnalyzer.analyzeDocument(processedFile.content);
      
      // Step 3: Complete
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId ? { 
          ...f, 
          status: 'completed', 
          progress: 100,
          analysis 
        } : f
      ));
      
    } catch (error) {
      console.error('Processing failed:', error);
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId ? { 
          ...f, 
          status: 'error', 
          progress: 0,
          error: error instanceof Error ? error.message : 'Processing failed'
        } : f
      ));
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading': return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'processing': return <FileText className="w-4 h-4 text-amber-500" />;
      case 'analyzing': return <Brain className="w-4 h-4 text-purple-500" />;
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusText = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading': return 'Uploading...';
      case 'processing': return 'Processing...';
      case 'analyzing': return 'AI Analysis...';
      case 'completed': return 'Ready';
      case 'error': return 'Failed';
      default: return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-6">
            <Upload className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            Upload RFP Documents
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Upload your RFP documents for instant AI-powered analysis and insights.
          </p>
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden mb-8">
          <div
            className={`relative p-12 border-2 border-dashed transition-all duration-200 ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.txt"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            <div className="text-center">
              <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6 transition-colors ${
                dragActive ? 'bg-blue-100' : 'bg-slate-100'
              }`}>
                <Upload className={`w-10 h-10 ${dragActive ? 'text-blue-600' : 'text-slate-500'}`} />
              </div>
              
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                {dragActive ? 'Drop files here' : 'Choose files or drag here'}
              </h3>
              <p className="text-slate-600 mb-6">
                Support for PDF, DOCX, and TXT files up to 10MB
              </p>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              >
                Browse Files
              </button>
            </div>
          </div>
        </div>

        {/* File List */}
        {uploadedFiles.length > 0 && (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-semibold text-slate-900">
                Processing Files ({uploadedFiles.length})
              </h3>
            </div>
            
            <div className="divide-y divide-slate-100">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      {getStatusIcon(file.status)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">{file.name}</p>
                        <div className="flex items-center space-x-3 mt-1">
                          <span className="text-sm text-slate-500">{formatFileSize(file.size)}</span>
                          <span className={`text-sm font-medium ${
                            file.status === 'completed' ? 'text-green-600' :
                            file.status === 'error' ? 'text-red-600' : 'text-blue-600'
                          }`}>
                            {getStatusText(file.status)}
                          </span>
                        </div>
                        {file.error && (
                          <p className="text-sm text-red-600 mt-1">{file.error}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 ml-4">
                      {file.status === 'completed' && file.analysis && (
                        <button
                          onClick={() => setSelectedAnalysis(file.analysis)}
                          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          View Results
                        </button>
                      )}
                      <button
                        onClick={() => removeFile(file.id)}
                        className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {(file.status === 'uploading' || file.status === 'processing' || file.status === 'analyzing') && (
                    <div className="mt-4">
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            file.status === 'uploading' ? 'bg-blue-500' : 
                            file.status === 'processing' ? 'bg-amber-500' : 'bg-purple-500'
                          }`}
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analysis Modal */}
        {selectedAnalysis && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
              <div className="flex justify-between items-center p-6 border-b border-slate-200">
                <h3 className="text-xl font-bold text-slate-900">Analysis Results</h3>
                <button
                  onClick={() => setSelectedAnalysis(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="space-y-6">
                  {/* Critical Requirements */}
                  {selectedAnalysis.criticalRequirementsMatrix?.mandatory && (
                    <div>
                      <h4 className="text-lg font-semibold text-slate-900 mb-3">Critical Requirements</h4>
                      <div className="space-y-3">
                        {selectedAnalysis.criticalRequirementsMatrix.mandatory.map((req: any, index: number) => (
                          <div key={index} className="p-4 bg-red-50 border border-red-200 rounded-xl">
                            <div className="flex justify-between items-start mb-2">
                              <h5 className="font-medium text-red-900">{req.requirement}</h5>
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                                {Math.round(req.confidence * 100)}%
                              </span>
                            </div>
                            <p className="text-sm text-red-700">{req.complianceMapping}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Evaluation Criteria */}
                  {selectedAnalysis.evaluationCriteria && (
                    <div>
                      <h4 className="text-lg font-semibold text-slate-900 mb-3">Evaluation Criteria</h4>
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                        <p className="text-blue-900 mb-3">{selectedAnalysis.evaluationCriteria.scoringMethodology}</p>
                        {selectedAnalysis.evaluationCriteria.criteria && (
                          <div className="space-y-2">
                            {selectedAnalysis.evaluationCriteria.criteria.map((criterion: any, index: number) => (
                              <div key={index} className="flex justify-between items-center">
                                <span className="text-blue-800">{criterion.criterion}</span>
                                <span className="font-semibold text-blue-900">{criterion.weight}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Win Themes */}
                  {selectedAnalysis.winThemes && (
                    <div>
                      <h4 className="text-lg font-semibold text-slate-900 mb-3">Key Opportunities</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        {selectedAnalysis.winThemes.primaryValueDrivers && (
                          <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                            <h5 className="font-medium text-green-900 mb-2">Value Drivers</h5>
                            <ul className="text-sm text-green-800 space-y-1">
                              {selectedAnalysis.winThemes.primaryValueDrivers.map((driver: string, index: number) => (
                                <li key={index}>• {driver}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {selectedAnalysis.winThemes.keyDifferentiators && (
                          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                            <h5 className="font-medium text-amber-900 mb-2">Differentiators</h5>
                            <ul className="text-sm text-amber-800 space-y-1">
                              {selectedAnalysis.winThemes.keyDifferentiators.map((diff: string, index: number) => (
                                <li key={index}>• {diff}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Risk Factors */}
                  {selectedAnalysis.redFlags && selectedAnalysis.redFlags.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-slate-900 mb-3">Risk Factors</h4>
                      <div className="space-y-3">
                        {selectedAnalysis.redFlags.map((flag: any, index: number) => (
                          <div key={index} className="p-4 bg-red-50 border border-red-200 rounded-xl">
                            <div className="flex justify-between items-start mb-2">
                              <h5 className="font-medium text-red-900">{flag.flag}</h5>
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                flag.severity === 'High' ? 'bg-red-200 text-red-800' :
                                flag.severity === 'Medium' ? 'bg-amber-200 text-amber-800' :
                                'bg-yellow-200 text-yellow-800'
                              }`}>
                                {flag.severity}
                              </span>
                            </div>
                            <p className="text-sm text-red-700">{flag.impact}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};