import React, { useState } from 'react';
import { Zap, FileText, Upload, AlertTriangle, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { documentAnalyzer, DocumentAnalysis, AnalysisProgress } from '../lib/services/document-analyzer';

export const RFPAnalyzer = () => {
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [progress, setProgress] = useState<AnalysisProgress>({
    status: 'idle',
    progress: 0
  });
  const [documentContent, setDocumentContent] = useState<string>('');

  const handleAnalyzeDocument = async () => {
    // Validate document content
    const validation = documentAnalyzer.validateDocumentContent(documentContent);
    if (!validation.isValid) {
      alert(validation.error || 'Please provide valid document content for analysis');
      return;
    }

    try {
      setProgress({
        status: 'analyzing',
        progress: 0,
        currentStep: 'Starting analysis...'
      });

      const result = await documentAnalyzer.analyzeDocument(
        documentContent,
        (progressUpdate) => {
          setProgress(progressUpdate);
        }
      );

      setAnalysis(result);
      setProgress({
        status: 'completed',
        progress: 100,
        currentStep: 'Analysis complete'
      });
    } catch (error) {
      console.error('Analysis failed:', error);
      setProgress({
        status: 'error',
        progress: 0,
        error: error instanceof Error ? error.message : 'Analysis failed'
      });
    }
  };

  const handleCancelAnalysis = () => {
    documentAnalyzer.cancelAnalysis();
    setProgress({
      status: 'idle',
      progress: 0
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-6">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            AI-Powered RFP Analysis
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Get instant, intelligent insights from your RFP documents with our advanced AI analysis engine.
          </p>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          
          {/* Input Section */}
          <div className="p-8 border-b border-slate-100">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Document Content
            </h2>
            <textarea
              value={documentContent}
              onChange={(e) => setDocumentContent(e.target.value)}
              placeholder="Paste your RFP document content here for analysis..."
              className="w-full h-48 p-4 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-700"
            />
            
            {/* Action Buttons */}
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-slate-500">
                {documentContent.length} characters
              </div>
              <div className="flex items-center space-x-3">
                {progress.status === 'analyzing' && (
                  <button
                    onClick={handleCancelAnalysis}
                    className="px-6 py-2 text-slate-600 hover:text-slate-800 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={handleAnalyzeDocument}
                  disabled={!documentContent.trim() || progress.status === 'analyzing'}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  {progress.status === 'analyzing' ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analyzing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Zap className="w-4 h-4" />
                      <span>Analyze Document</span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Progress Section */}
          {progress.status !== 'idle' && (
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-700">
                  {progress.currentStep || 'Processing...'}
                </span>
                <span className="text-sm text-slate-500">
                  {progress.progress}%
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.progress}%` }}
                ></div>
              </div>
              {progress.error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-red-700">{progress.error}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Results Section */}
          {analysis && (
            <div className="p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">
                    Analysis Complete
                  </h3>
                  <p className="text-sm text-slate-500">
                    AI has analyzed your document and extracted key insights
                  </p>
                </div>
              </div>

              {/* Critical Requirements */}
              {analysis.criticalRequirementsMatrix?.mandatory && (
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-slate-900 mb-4">
                    Critical Requirements
                  </h4>
                  <div className="space-y-3">
                    {analysis.criticalRequirementsMatrix.mandatory.map((req, index) => (
                      <div key={index} className="p-4 bg-red-50 border border-red-200 rounded-xl">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-medium text-red-900">{req.requirement}</h5>
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                            {Math.round(req.confidence * 100)}% confidence
                          </span>
                        </div>
                        <p className="text-sm text-red-700">{req.complianceMapping}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Evaluation Criteria */}
              {analysis.evaluationCriteria && (
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-slate-900 mb-4">
                    Evaluation Criteria
                  </h4>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-blue-900 mb-3">{analysis.evaluationCriteria.scoringMethodology}</p>
                    {analysis.evaluationCriteria.criteria && (
                      <div className="space-y-2">
                        {analysis.evaluationCriteria.criteria.map((criterion, index) => (
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
              {analysis.winThemes && (
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-slate-900 mb-4">
                    Key Opportunities
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    {analysis.winThemes.primaryValueDrivers && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                        <h5 className="font-medium text-green-900 mb-2">Value Drivers</h5>
                        <ul className="text-sm text-green-800 space-y-1">
                          {analysis.winThemes.primaryValueDrivers.map((driver, index) => (
                            <li key={index}>• {driver}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {analysis.winThemes.keyDifferentiators && (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <h5 className="font-medium text-amber-900 mb-2">Differentiators</h5>
                        <ul className="text-sm text-amber-800 space-y-1">
                          {analysis.winThemes.keyDifferentiators.map((diff, index) => (
                            <li key={index}>• {diff}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Red Flags */}
              {analysis.redFlags && analysis.redFlags.length > 0 && (
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-slate-900 mb-4">
                    Risk Factors
                  </h4>
                  <div className="space-y-3">
                    {analysis.redFlags.map((flag, index) => (
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
          )}

          {/* Empty State */}
          {!analysis && progress.status === 'idle' && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-600 mb-2">
                Ready for Analysis
              </h3>
              <p className="text-slate-500">
                Paste your RFP content above and click "Analyze Document" to get started.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};