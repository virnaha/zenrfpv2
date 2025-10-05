import { useMemo } from 'react';
import {
  QuestionCategory,
  QuestionComplexity,
  QuestionPriority,
  RequirementType,
  ExtractedQuestion
} from '../lib/types/rfp-analyzer';

// Category configuration with metadata
export interface CategoryConfig {
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  priority: number;
}

export interface ComplexityConfig {
  label: string;
  description: string;
  color: string;
  bgColor: string;
  icon: string;
  scoreRange: [number, number];
}

export interface PriorityConfig {
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  urgencyScore: number;
}

export interface RequirementTypeConfig {
  label: string;
  description: string;
  color: string;
  bgColor: string;
  icon: string;
  isRequired: boolean;
}

export function useQuestionCategories() {
  // Category configurations
  const categoryConfigs: Record<QuestionCategory, CategoryConfig> = useMemo(() => ({
    [QuestionCategory.TECHNICAL]: {
      label: 'Technical',
      description: 'Technical specifications, architecture, and system requirements',
      color: 'text-blue-700',
      bgColor: 'bg-blue-100',
      borderColor: 'border-blue-200',
      icon: 'Settings',
      priority: 1
    },
    [QuestionCategory.PRICING]: {
      label: 'Pricing',
      description: 'Cost, budget, and financial considerations',
      color: 'text-green-700',
      bgColor: 'bg-green-100',
      borderColor: 'border-green-200',
      icon: 'DollarSign',
      priority: 2
    },
    [QuestionCategory.SECURITY]: {
      label: 'Security',
      description: 'Security measures, encryption, and access controls',
      color: 'text-red-700',
      bgColor: 'bg-red-100',
      borderColor: 'border-red-200',
      icon: 'Shield',
      priority: 3
    },
    [QuestionCategory.COMPLIANCE]: {
      label: 'Compliance',
      description: 'Regulatory requirements, certifications, and standards',
      color: 'text-purple-700',
      bgColor: 'bg-purple-100',
      borderColor: 'border-purple-200',
      icon: 'CheckCircle',
      priority: 4
    },
    [QuestionCategory.FUNCTIONAL]: {
      label: 'Functional',
      description: 'Business functionality and user requirements',
      color: 'text-indigo-700',
      bgColor: 'bg-indigo-100',
      borderColor: 'border-indigo-200',
      icon: 'User',
      priority: 5
    },
    [QuestionCategory.PERFORMANCE]: {
      label: 'Performance',
      description: 'Speed, scalability, and performance metrics',
      color: 'text-orange-700',
      bgColor: 'bg-orange-100',
      borderColor: 'border-orange-200',
      icon: 'Zap',
      priority: 6
    },
    [QuestionCategory.INTEGRATION]: {
      label: 'Integration',
      description: 'System integration and interoperability',
      color: 'text-cyan-700',
      bgColor: 'bg-cyan-100',
      borderColor: 'border-cyan-200',
      icon: 'Link',
      priority: 7
    },
    [QuestionCategory.SUPPORT]: {
      label: 'Support',
      description: 'Customer support, training, and maintenance',
      color: 'text-pink-700',
      bgColor: 'bg-pink-100',
      borderColor: 'border-pink-200',
      icon: 'HeadphonesIcon',
      priority: 8
    },
    [QuestionCategory.IMPLEMENTATION]: {
      label: 'Implementation',
      description: 'Deployment, setup, and project management',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-100',
      borderColor: 'border-yellow-200',
      icon: 'Rocket',
      priority: 9
    },
    [QuestionCategory.EXPERIENCE]: {
      label: 'Experience',
      description: 'Company experience and expertise',
      color: 'text-teal-700',
      bgColor: 'bg-teal-100',
      borderColor: 'border-teal-200',
      icon: 'Award',
      priority: 10
    },
    [QuestionCategory.REFERENCE]: {
      label: 'References',
      description: 'Client references and case studies',
      color: 'text-gray-700',
      bgColor: 'bg-gray-100',
      borderColor: 'border-gray-200',
      icon: 'Users',
      priority: 11
    }
  }), []);

  // Complexity configurations
  const complexityConfigs: Record<QuestionComplexity, ComplexityConfig> = useMemo(() => ({
    [QuestionComplexity.SIMPLE]: {
      label: 'Simple',
      description: 'Straightforward question with clear answer',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      icon: 'Circle',
      scoreRange: [0, 2]
    },
    [QuestionComplexity.MODERATE]: {
      label: 'Moderate',
      description: 'Multi-aspect question requiring some analysis',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      icon: 'AlertCircle',
      scoreRange: [2, 4]
    },
    [QuestionComplexity.COMPLEX]: {
      label: 'Complex',
      description: 'Multi-part question requiring detailed analysis',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      icon: 'AlertTriangle',
      scoreRange: [4, 6]
    },
    [QuestionComplexity.VERY_COMPLEX]: {
      label: 'Very Complex',
      description: 'Highly complex question requiring deep analysis',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      icon: 'XCircle',
      scoreRange: [6, 10]
    }
  }), []);

  // Priority configurations
  const priorityConfigs: Record<QuestionPriority, PriorityConfig> = useMemo(() => ({
    [QuestionPriority.CRITICAL]: {
      label: 'Critical',
      description: 'Deal breaker if not answered well',
      color: 'text-red-700',
      bgColor: 'bg-red-100',
      borderColor: 'border-red-300',
      icon: 'AlertCircle',
      urgencyScore: 5
    },
    [QuestionPriority.HIGH]: {
      label: 'High',
      description: 'Important for evaluation',
      color: 'text-orange-700',
      bgColor: 'bg-orange-100',
      borderColor: 'border-orange-300',
      icon: 'ArrowUp',
      urgencyScore: 4
    },
    [QuestionPriority.MEDIUM]: {
      label: 'Medium',
      description: 'Standard question',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-100',
      borderColor: 'border-yellow-300',
      icon: 'Minus',
      urgencyScore: 3
    },
    [QuestionPriority.LOW]: {
      label: 'Low',
      description: 'Nice to have',
      color: 'text-blue-700',
      bgColor: 'bg-blue-100',
      borderColor: 'border-blue-300',
      icon: 'ArrowDown',
      urgencyScore: 2
    },
    [QuestionPriority.INFORMATIONAL]: {
      label: 'Informational',
      description: 'For context only',
      color: 'text-gray-700',
      bgColor: 'bg-gray-100',
      borderColor: 'border-gray-300',
      icon: 'Info',
      urgencyScore: 1
    }
  }), []);

  // Requirement type configurations
  const requirementTypeConfigs: Record<RequirementType, RequirementTypeConfig> = useMemo(() => ({
    [RequirementType.MANDATORY]: {
      label: 'Mandatory',
      description: 'Must have requirement',
      color: 'text-red-700',
      bgColor: 'bg-red-100',
      icon: 'AlertCircle',
      isRequired: true
    },
    [RequirementType.PREFERRED]: {
      label: 'Preferred',
      description: 'Should have requirement',
      color: 'text-orange-700',
      bgColor: 'bg-orange-100',
      icon: 'Star',
      isRequired: false
    },
    [RequirementType.OPTIONAL]: {
      label: 'Optional',
      description: 'Nice to have requirement',
      color: 'text-blue-700',
      bgColor: 'bg-blue-100',
      icon: 'Plus',
      isRequired: false
    },
    [RequirementType.COMPLIANCE]: {
      label: 'Compliance',
      description: 'Legal/regulatory requirement',
      color: 'text-purple-700',
      bgColor: 'bg-purple-100',
      icon: 'CheckCircle',
      isRequired: true
    },
    [RequirementType.EVALUATION]: {
      label: 'Evaluation',
      description: 'For scoring purposes',
      color: 'text-green-700',
      bgColor: 'bg-green-100',
      icon: 'Target',
      isRequired: false
    },
    [RequirementType.INFORMATIONAL]: {
      label: 'Informational',
      description: 'For reference only',
      color: 'text-gray-700',
      bgColor: 'bg-gray-100',
      icon: 'Info',
      isRequired: false
    }
  }), []);

  // Helper functions
  const getCategoryConfig = (category: QuestionCategory): CategoryConfig => {
    return categoryConfigs[category];
  };

  const getComplexityConfig = (complexity: QuestionComplexity): ComplexityConfig => {
    return complexityConfigs[complexity];
  };

  const getPriorityConfig = (priority: QuestionPriority): PriorityConfig => {
    return priorityConfigs[priority];
  };

  const getRequirementTypeConfig = (type: RequirementType): RequirementTypeConfig => {
    return requirementTypeConfigs[type];
  };

  // Analysis functions
  const analyzeQuestionDistribution = (questions: ExtractedQuestion[]) => {
    const distribution = {
      byCategory: Object.values(QuestionCategory).map(category => ({
        category,
        count: questions.filter(q => q.category === category).length,
        config: categoryConfigs[category]
      })).sort((a, b) => b.count - a.count),

      byComplexity: Object.values(QuestionComplexity).map(complexity => ({
        complexity,
        count: questions.filter(q => q.complexity === complexity).length,
        config: complexityConfigs[complexity]
      })).sort((a, b) => a.config.scoreRange[0] - b.config.scoreRange[0]),

      byPriority: Object.values(QuestionPriority).map(priority => ({
        priority,
        count: questions.filter(q => q.priority === priority).length,
        config: priorityConfigs[priority]
      })).sort((a, b) => b.config.urgencyScore - a.config.urgencyScore),

      byRequirementType: Object.values(RequirementType).map(type => ({
        type,
        count: questions.filter(q => q.requirementType === type).length,
        config: requirementTypeConfigs[type]
      }))
    };

    return distribution;
  };

  const getQuestionTypeStats = (questions: ExtractedQuestion[]) => {
    const stats = {
      totalQuestions: questions.length,
      multiPartQuestions: questions.filter(q => q.isMultiPart).length,
      averageConfidence: questions.length > 0
        ? questions.reduce((sum, q) => sum + q.confidenceScore, 0) / questions.length
        : 0,
      criticalQuestions: questions.filter(q => q.priority === QuestionPriority.CRITICAL).length,
      mandatoryRequirements: questions.filter(q => q.requirementType === RequirementType.MANDATORY).length,
      complexQuestions: questions.filter(q =>
        q.complexity === QuestionComplexity.COMPLEX || q.complexity === QuestionComplexity.VERY_COMPLEX
      ).length
    };

    return stats;
  };

  const generateRecommendations = (questions: ExtractedQuestion[]) => {
    const recommendations: string[] = [];
    const stats = getQuestionTypeStats(questions);

    if (stats.criticalQuestions > 0) {
      recommendations.push(`${stats.criticalQuestions} critical questions require immediate attention`);
    }

    if (stats.mandatoryRequirements > stats.totalQuestions * 0.5) {
      recommendations.push('High number of mandatory requirements - ensure comprehensive responses');
    }

    if (stats.complexQuestions > stats.totalQuestions * 0.3) {
      recommendations.push('Many complex questions identified - consider involving subject matter experts');
    }

    if (stats.multiPartQuestions > 0) {
      recommendations.push(`${stats.multiPartQuestions} multi-part questions may benefit from structured responses`);
    }

    if (stats.averageConfidence < 0.7) {
      recommendations.push('Low average confidence score - consider manual review of extracted questions');
    }

    return recommendations;
  };

  const prioritizeQuestions = (questions: ExtractedQuestion[]) => {
    return questions.sort((a, b) => {
      // Primary sort: Priority urgency score (descending)
      const priorityDiff = priorityConfigs[b.priority].urgencyScore - priorityConfigs[a.priority].urgencyScore;
      if (priorityDiff !== 0) return priorityDiff;

      // Secondary sort: Complexity (descending)
      const complexityDiff = complexityConfigs[b.complexity].scoreRange[1] - complexityConfigs[a.complexity].scoreRange[1];
      if (complexityDiff !== 0) return complexityDiff;

      // Tertiary sort: Confidence score (descending)
      return b.confidenceScore - a.confidenceScore;
    });
  };

  return {
    // Configurations
    categoryConfigs,
    complexityConfigs,
    priorityConfigs,
    requirementTypeConfigs,

    // Helper functions
    getCategoryConfig,
    getComplexityConfig,
    getPriorityConfig,
    getRequirementTypeConfig,

    // Analysis functions
    analyzeQuestionDistribution,
    getQuestionTypeStats,
    generateRecommendations,
    prioritizeQuestions,

    // Constants
    categories: Object.values(QuestionCategory),
    complexities: Object.values(QuestionComplexity),
    priorities: Object.values(QuestionPriority),
    requirementTypes: Object.values(RequirementType)
  };
}

export type UseQuestionCategoriesReturn = ReturnType<typeof useQuestionCategories>;