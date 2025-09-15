import { useState, useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { enhancedQuestionExtractor } from '../lib/services/enhanced-question-extractor';
import {
  ExtractedQuestion,
  QuestionAnalysisResult,
  QuestionCategory,
  QuestionComplexity,
  QuestionPriority,
  RequirementType
} from '../lib/types/rfp-analyzer';

export interface QuestionExtractionFilters {
  categories?: QuestionCategory[];
  complexities?: QuestionComplexity[];
  priorities?: QuestionPriority[];
  requirementTypes?: RequirementType[];
  searchText?: string;
  showMultiPart?: boolean;
  minConfidence?: number;
}

export interface QuestionEditRequest {
  questionId: string;
  updates: Partial<ExtractedQuestion>;
}

export interface QuestionSplitRequest {
  questionId: string;
  splitPoints: string[]; // Text at which to split the question
}

export function useQuestionExtraction(documentContent?: string, autoExtract = false) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<QuestionExtractionFilters>({});
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());

  // Main extraction query
  const extractionQuery = useQuery({
    queryKey: ['questionExtraction', documentContent],
    queryFn: () => enhancedQuestionExtractor.extractQuestions(documentContent!),
    enabled: !!documentContent && autoExtract,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });

  // Manual extraction mutation
  const extractQuestionsMutation = useMutation({
    mutationFn: async (content: string) => {
      return await enhancedQuestionExtractor.extractQuestions(content);
    },
    onSuccess: (data) => {
      // Cache the result
      queryClient.setQueryData(['questionExtraction', documentContent], data);
    }
  });

  // Edit question mutation
  const editQuestionMutation = useMutation({
    mutationFn: async ({ questionId, updates }: QuestionEditRequest) => {
      const currentData = extractionQuery.data;
      if (!currentData) throw new Error('No questions data available');

      const updatedQuestions = currentData.questions.map(q =>
        q.id === questionId ? { ...q, ...updates } : q
      );

      return {
        ...currentData,
        questions: updatedQuestions
      };
    },
    onSuccess: (updatedData) => {
      queryClient.setQueryData(['questionExtraction', documentContent], updatedData);
    }
  });

  // Split question mutation
  const splitQuestionMutation = useMutation({
    mutationFn: async ({ questionId, splitPoints }: QuestionSplitRequest) => {
      const currentData = extractionQuery.data;
      if (!currentData) throw new Error('No questions data available');

      const questionToSplit = currentData.questions.find(q => q.id === questionId);
      if (!questionToSplit) throw new Error('Question not found');

      // Create new questions from split points
      const newQuestions: ExtractedQuestion[] = [];
      const originalText = questionToSplit.originalText;

      splitPoints.forEach((splitText, index) => {
        if (splitText.trim()) {
          const newQuestion: ExtractedQuestion = {
            ...questionToSplit,
            id: `${questionId}-split-${index}`,
            originalText: splitText.trim(),
            normalizedText: splitText.trim(),
            subQuestions: [],
            isMultiPart: false,
            extractionMetadata: {
              ...questionToSplit.extractionMetadata,
              extractionMethod: 'manual-split',
              lastUpdated: new Date().toISOString()
            }
          };
          newQuestions.push(newQuestion);
        }
      });

      // Remove original question and add new ones
      const updatedQuestions = [
        ...currentData.questions.filter(q => q.id !== questionId),
        ...newQuestions
      ];

      return {
        ...currentData,
        questions: updatedQuestions
      };
    },
    onSuccess: (updatedData) => {
      queryClient.setQueryData(['questionExtraction', documentContent], updatedData);
    }
  });

  // Delete question mutation
  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: string) => {
      const currentData = extractionQuery.data;
      if (!currentData) throw new Error('No questions data available');

      const updatedQuestions = currentData.questions.filter(q => q.id !== questionId);

      return {
        ...currentData,
        questions: updatedQuestions
      };
    },
    onSuccess: (updatedData) => {
      queryClient.setQueryData(['questionExtraction', documentContent], updatedData);
      setSelectedQuestions(prev => {
        const newSelected = new Set(prev);
        newSelected.delete(updatedData.questions.find(q => !prev.has(q.id))?.id || '');
        return newSelected;
      });
    }
  });

  // Filtered questions based on current filters
  const filteredQuestions = useMemo(() => {
    const questions = extractionQuery.data?.questions || [];

    return questions.filter(question => {
      // Category filter
      if (filters.categories?.length && !filters.categories.includes(question.category)) {
        return false;
      }

      // Complexity filter
      if (filters.complexities?.length && !filters.complexities.includes(question.complexity)) {
        return false;
      }

      // Priority filter
      if (filters.priorities?.length && !filters.priorities.includes(question.priority)) {
        return false;
      }

      // Requirement type filter
      if (filters.requirementTypes?.length && !filters.requirementTypes.includes(question.requirementType)) {
        return false;
      }

      // Search text filter
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        const matchesText = question.originalText.toLowerCase().includes(searchLower) ||
                           question.normalizedText.toLowerCase().includes(searchLower) ||
                           question.keywords.some(keyword => keyword.includes(searchLower));
        if (!matchesText) return false;
      }

      // Multi-part filter
      if (filters.showMultiPart !== undefined && question.isMultiPart !== filters.showMultiPart) {
        return false;
      }

      // Confidence filter
      if (filters.minConfidence !== undefined && question.confidenceScore < filters.minConfidence) {
        return false;
      }

      return true;
    });
  }, [extractionQuery.data?.questions, filters]);

  // Grouped questions by category
  const questionsByCategory = useMemo(() => {
    const grouped: Record<QuestionCategory, ExtractedQuestion[]> = Object.values(QuestionCategory).reduce(
      (acc, category) => {
        acc[category] = [];
        return acc;
      },
      {} as Record<QuestionCategory, ExtractedQuestion[]>
    );

    filteredQuestions.forEach(question => {
      grouped[question.category].push(question);
    });

    return grouped;
  }, [filteredQuestions]);

  // Statistics
  const statistics = useMemo(() => {
    const questions = extractionQuery.data?.questions || [];

    return {
      total: questions.length,
      filtered: filteredQuestions.length,
      byCategory: Object.values(QuestionCategory).reduce((acc, category) => {
        acc[category] = questions.filter(q => q.category === category).length;
        return acc;
      }, {} as Record<QuestionCategory, number>),
      byComplexity: Object.values(QuestionComplexity).reduce((acc, complexity) => {
        acc[complexity] = questions.filter(q => q.complexity === complexity).length;
        return acc;
      }, {} as Record<QuestionComplexity, number>),
      byPriority: Object.values(QuestionPriority).reduce((acc, priority) => {
        acc[priority] = questions.filter(q => q.priority === priority).length;
        return acc;
      }, {} as Record<QuestionPriority, number>),
      multiPart: questions.filter(q => q.isMultiPart).length,
      averageConfidence: questions.length > 0
        ? questions.reduce((sum, q) => sum + q.confidenceScore, 0) / questions.length
        : 0
    };
  }, [extractionQuery.data?.questions, filteredQuestions]);

  // Actions
  const extractQuestions = useCallback((content: string) => {
    return extractQuestionsMutation.mutate(content);
  }, [extractQuestionsMutation]);

  const editQuestion = useCallback((questionId: string, updates: Partial<ExtractedQuestion>) => {
    return editQuestionMutation.mutate({ questionId, updates });
  }, [editQuestionMutation]);

  const splitQuestion = useCallback((questionId: string, splitPoints: string[]) => {
    return splitQuestionMutation.mutate({ questionId, splitPoints });
  }, [splitQuestionMutation]);

  const deleteQuestion = useCallback((questionId: string) => {
    return deleteQuestionMutation.mutate(questionId);
  }, [deleteQuestionMutation]);

  const updateFilters = useCallback((newFilters: Partial<QuestionExtractionFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const selectQuestion = useCallback((questionId: string) => {
    setSelectedQuestions(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(questionId)) {
        newSelected.delete(questionId);
      } else {
        newSelected.add(questionId);
      }
      return newSelected;
    });
  }, []);

  const selectAllFiltered = useCallback(() => {
    const allIds = new Set(filteredQuestions.map(q => q.id));
    setSelectedQuestions(allIds);
  }, [filteredQuestions]);

  const clearSelection = useCallback(() => {
    setSelectedQuestions(new Set());
  }, []);

  const bulkEdit = useCallback((updates: Partial<ExtractedQuestion>) => {
    const selectedIds = Array.from(selectedQuestions);
    const promises = selectedIds.map(questionId =>
      editQuestionMutation.mutateAsync({ questionId, updates })
    );
    return Promise.all(promises);
  }, [selectedQuestions, editQuestionMutation]);

  const bulkDelete = useCallback(() => {
    const selectedIds = Array.from(selectedQuestions);
    const promises = selectedIds.map(questionId =>
      deleteQuestionMutation.mutateAsync(questionId)
    );
    return Promise.all(promises);
  }, [selectedQuestions, deleteQuestionMutation]);

  return {
    // Data
    data: extractionQuery.data,
    questions: filteredQuestions,
    questionsByCategory,
    statistics,

    // State
    isLoading: extractionQuery.isLoading || extractQuestionsMutation.isPending,
    error: extractionQuery.error || extractQuestionsMutation.error,
    isExtracting: extractQuestionsMutation.isPending,
    isEditing: editQuestionMutation.isPending || splitQuestionMutation.isPending || deleteQuestionMutation.isPending,

    // Filters
    filters,

    // Selection
    selectedQuestions,
    hasSelection: selectedQuestions.size > 0,

    // Actions
    extractQuestions,
    editQuestion,
    splitQuestion,
    deleteQuestion,

    // Filter actions
    updateFilters,
    clearFilters,

    // Selection actions
    selectQuestion,
    selectAllFiltered,
    clearSelection,

    // Bulk actions
    bulkEdit,
    bulkDelete,

    // Utility
    refetch: extractionQuery.refetch,
    invalidate: () => queryClient.invalidateQueries({ queryKey: ['questionExtraction'] })
  };
}

export type UseQuestionExtractionReturn = ReturnType<typeof useQuestionExtraction>;