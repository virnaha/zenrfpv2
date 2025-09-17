import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { documentAnalyzer, DocumentAnalysis } from '../lib/services/document-analyzer';
import { rfpAnalyzer } from '../lib/services/rfp-analyzer';
import { enhancedQuestionExtractor } from '../lib/services/enhanced-question-extractor';
import {
  QuestionAnalysisResult,
  AnalyzeRFPRequest,
  AnalyzeRFPResponse,
  AnalysisDepth
} from '../lib/types/rfp-analyzer';

export interface RFPAnalysisState {
  documentAnalysis?: DocumentAnalysis;
  questionAnalysis?: QuestionAnalysisResult;
  rfpAnalysis?: AnalyzeRFPResponse;
  isAnalyzing: boolean;
  error: string | null;
  progress: number;
  currentStep: string;
}

export interface UseRFPAnalysisProps {
  documentId?: string;
  autoAnalyze?: boolean;
}

export function useRFPAnalysis({ documentId, autoAnalyze: _autoAnalyze = false }: UseRFPAnalysisProps = {}) {
  const [state, setState] = useState<RFPAnalysisState>({
    isAnalyzing: false,
    error: null,
    progress: 0,
    currentStep: ''
  });

  // Document analysis mutation
  const documentAnalysisMutation = useMutation({
    mutationFn: async (content: string) => {
      return await documentAnalyzer.analyzeDocument(
        content,
        (progress) => {
          setState(prev => ({
            ...prev,
            progress: progress.progress,
            currentStep: progress.currentStep || '',
            error: progress.error || null
          }));
        }
      );
    },
    onMutate: () => {
      setState(prev => ({
        ...prev,
        isAnalyzing: true,
        error: null,
        progress: 0,
        currentStep: 'Starting document analysis...'
      }));
    },
    onSuccess: (data) => {
      setState(prev => ({
        ...prev,
        documentAnalysis: data,
        progress: 33,
        currentStep: 'Document analysis complete'
      }));
    },
    onError: (error) => {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Document analysis failed',
        isAnalyzing: false,
        progress: 0
      }));
    }
  });

  // Question extraction mutation
  const questionExtractionMutation = useMutation({
    mutationFn: async (content: string) => {
      return await enhancedQuestionExtractor.extractQuestions(content);
    },
    onMutate: () => {
      setState(prev => ({
        ...prev,
        currentStep: 'Extracting and analyzing questions...',
        progress: 33
      }));
    },
    onSuccess: (data) => {
      setState(prev => ({
        ...prev,
        questionAnalysis: data,
        progress: 66,
        currentStep: 'Question analysis complete'
      }));
    },
    onError: (error) => {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Question extraction failed',
        isAnalyzing: false
      }));
    }
  });

  // RFP comprehensive analysis mutation
  const rfpAnalysisMutation = useMutation({
    mutationFn: async (request: AnalyzeRFPRequest) => {
      return await rfpAnalyzer.analyzeRFP(request);
    },
    onMutate: () => {
      setState(prev => ({
        ...prev,
        currentStep: 'Performing comprehensive RFP analysis...',
        progress: 66
      }));
    },
    onSuccess: (data) => {
      setState(prev => ({
        ...prev,
        rfpAnalysis: data,
        progress: 100,
        currentStep: 'Analysis complete',
        isAnalyzing: false
      }));
    },
    onError: (error) => {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'RFP analysis failed',
        isAnalyzing: false
      }));
    }
  });

  // Combined analysis function
  const analyzeRFP = useCallback(async (
    documentContent: string,
    options: {
      includeQuestionExtraction?: boolean;
      includeComprehensiveAnalysis?: boolean;
      analysisDepth?: AnalysisDepth;
      includeCompetitiveAnalysis?: boolean;
      includeSimilarRFPs?: boolean;
      maxSimilarRFPs?: number;
    } = {}
  ) => {
    const {
      includeQuestionExtraction = true,
      includeComprehensiveAnalysis = true,
      analysisDepth = AnalysisDepth.STANDARD,
      includeCompetitiveAnalysis = false,
      includeSimilarRFPs = false,
      maxSimilarRFPs = 5
    } = options;

    try {
      setState(prev => ({
        ...prev,
        isAnalyzing: true,
        error: null,
        progress: 0,
        currentStep: 'Starting analysis...'
      }));

      // Step 1: Document analysis (always required)
      const documentAnalysis = await documentAnalysisMutation.mutateAsync(documentContent);

      // Step 2: Question extraction (optional)
      let questionAnalysis: QuestionAnalysisResult | undefined;
      if (includeQuestionExtraction) {
        questionAnalysis = await questionExtractionMutation.mutateAsync(documentContent);
      }

      // Step 3: Comprehensive RFP analysis (optional)
      let rfpAnalysis: AnalyzeRFPResponse | undefined;
      if (includeComprehensiveAnalysis && documentId) {
        const request: AnalyzeRFPRequest = {
          document_id: documentId,
          analysis_depth: analysisDepth,
          include_competitive_analysis: includeCompetitiveAnalysis,
          include_similar_rfps: includeSimilarRFPs,
          max_similar_rfps: maxSimilarRFPs
        };
        rfpAnalysis = await rfpAnalysisMutation.mutateAsync(request);
      }

      return {
        documentAnalysis,
        questionAnalysis,
        rfpAnalysis
      };
    } catch (error) {
      throw error; // Re-throw to let the mutation handle it
    }
  }, [documentId, documentAnalysisMutation, questionExtractionMutation, rfpAnalysisMutation]);

  // Quick analysis for immediate feedback
  const quickAnalysis = useCallback(async (documentContent: string) => {
    return analyzeRFP(documentContent, {
      includeQuestionExtraction: true,
      includeComprehensiveAnalysis: false,
      analysisDepth: AnalysisDepth.QUICK
    });
  }, [analyzeRFP]);

  // Full analysis with all features
  const comprehensiveAnalysis = useCallback(async (documentContent: string) => {
    return analyzeRFP(documentContent, {
      includeQuestionExtraction: true,
      includeComprehensiveAnalysis: true,
      analysisDepth: AnalysisDepth.COMPREHENSIVE,
      includeCompetitiveAnalysis: true,
      includeSimilarRFPs: true,
      maxSimilarRFPs: 10
    });
  }, [analyzeRFP]);

  // Reset analysis state
  const resetAnalysis = useCallback(() => {
    setState({
      isAnalyzing: false,
      error: null,
      progress: 0,
      currentStep: ''
    });
    documentAnalysisMutation.reset();
    questionExtractionMutation.reset();
    rfpAnalysisMutation.reset();
  }, [documentAnalysisMutation, questionExtractionMutation, rfpAnalysisMutation]);

  // Cancel ongoing analysis
  const cancelAnalysis = useCallback(() => {
    documentAnalyzer.cancelAnalysis();
    setState(prev => ({
      ...prev,
      isAnalyzing: false,
      currentStep: 'Analysis cancelled',
      error: null
    }));
  }, []);

  return {
    // State
    ...state,

    // Actions
    analyzeRFP,
    quickAnalysis,
    comprehensiveAnalysis,
    resetAnalysis,
    cancelAnalysis,

    // Individual mutation states (renamed to avoid shadowing state keys)
    documentAnalysisStatus: {
      isLoading: documentAnalysisMutation.isPending,
      error: documentAnalysisMutation.error,
      data: documentAnalysisMutation.data
    },
    questionExtractionStatus: {
      isLoading: questionExtractionMutation.isPending,
      error: questionExtractionMutation.error,
      data: questionExtractionMutation.data
    },
    rfpAnalysisStatus: {
      isLoading: rfpAnalysisMutation.isPending,
      error: rfpAnalysisMutation.error,
      data: rfpAnalysisMutation.data
    }
  };
}

export type UseRFPAnalysisReturn = ReturnType<typeof useRFPAnalysis>;