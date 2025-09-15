import { 
  LearningFeedback, 
  WinningResponse, 
  WinStatus, 
  QuestionPattern, 
  KnowledgeEntry,
  Document,
  FeedbackType,
  PerformanceMetrics,
  AnalyticsMetrics
} from '../types/rfp-analyzer';
import { rfpAnalyzer } from './rfp-analyzer';
import { simpleSupabase } from './simple-supabase';

export interface LearningEvent {
  id: string;
  type: LearningEventType;
  data: any;
  timestamp: string;
  source: string;
  confidence: number;
}

export enum LearningEventType {
  RFP_OUTCOME = 'rfp_outcome',
  USER_FEEDBACK = 'user_feedback',
  PATTERN_DISCOVERY = 'pattern_discovery',
  KNOWLEDGE_VALIDATION = 'knowledge_validation',
  COMPETITIVE_INTELLIGENCE = 'competitive_intelligence'
}

export interface LearningInsight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  impact: BusinessImpact;
  recommendations: string[];
  confidence: number;
  supporting_evidence: string[];
  created_at: string;
}

export enum InsightType {
  WIN_RATE_TREND = 'win_rate_trend',
  EMERGING_REQUIREMENT = 'emerging_requirement',
  COMPETITIVE_SHIFT = 'competitive_shift',
  KNOWLEDGE_GAP = 'knowledge_gap',
  PROCESS_IMPROVEMENT = 'process_improvement'
}

export enum BusinessImpact {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export class LearningEngine {
  private feedbackHistory: LearningFeedback[] = [];
  private learningEvents: LearningEvent[] = [];
  private insights: LearningInsight[] = [];
  private performanceBaseline: PerformanceMetrics | null = null;

  constructor() {
    this.initializeBaseline();
  }

  // Core Learning Methods
  async processWinLossOutcome(
    rfpId: string, 
    outcome: WinStatus, 
    details: {
      competitorsInvolved?: string[];
      winReason?: string;
      lossReason?: string;
      keyDecisionFactors?: string[];
      clientFeedback?: string;
    }
  ): Promise<LearningInsight[]> {
    console.log(`Processing win/loss outcome for RFP: ${rfpId}, outcome: ${outcome}`);

    // Create learning event
    const learningEvent: LearningEvent = {
      id: this.generateId(),
      type: LearningEventType.RFP_OUTCOME,
      data: { rfpId, outcome, ...details },
      timestamp: new Date().toISOString(),
      source: 'outcome_tracking',
      confidence: 0.95
    };

    this.learningEvents.push(learningEvent);

    // Generate insights from this outcome
    const insights = await this.generateOutcomeInsights(learningEvent);
    
    // Update knowledge base based on outcome
    await this.updateKnowledgeFromOutcome(rfpId, outcome, details);
    
    // Update win rate predictions
    await this.updateWinRatePredictions(outcome, details);

    return insights;
  }

  async recordUserFeedback(
    responseId: string,
    feedbackType: FeedbackType,
    rating: number,
    comments: string[],
    suggestions: string[]
  ): Promise<void> {
    const feedback: LearningFeedback = {
      id: this.generateId(),
      response_id: responseId,
      outcome: WinStatus.PENDING,
      feedback_type: feedbackType,
      lessons_learned: comments,
      what_worked: [],
      what_didnt_work: [],
      recommendations: suggestions,
      confidence_adjustment: this.calculateConfidenceAdjustment(rating)
    };

    this.feedbackHistory.push(feedback);

    // Create learning event
    const learningEvent: LearningEvent = {
      id: this.generateId(),
      type: LearningEventType.USER_FEEDBACK,
      data: feedback,
      timestamp: new Date().toISOString(),
      source: 'user_interface',
      confidence: 0.8
    };

    this.learningEvents.push(learningEvent);

    // Process feedback for insights
    await this.processFeedbackInsights(feedback);

    console.log(`Recorded user feedback for response: ${responseId}, rating: ${rating}/5`);
  }

  async discoverNewPatterns(documents: Document[]): Promise<QuestionPattern[]> {
    console.log(`Analyzing ${documents.length} documents for new patterns...`);
    
    const newPatterns: QuestionPattern[] = [];
    const existingPatterns = await this.getExistingPatterns();

    // Analyze documents for recurring question themes
    const questionClusters = await this.clusterSimilarQuestions(documents);
    
    for (const cluster of questionClusters) {
      // Check if this represents a new pattern
      const isNewPattern = !this.patternExists(cluster, existingPatterns);
      
      if (isNewPattern && cluster.frequency >= 3) { // Minimum frequency threshold
        const pattern: QuestionPattern = {
          id: this.generateId(),
          canonical_form: cluster.canonicalForm,
          variations: cluster.variations,
          intent: await this.inferQuestionIntent(cluster.canonicalForm),
          industry_frequency: cluster.industryFrequency,
          typical_responses: [],
          winning_response_ids: [],
          complexity_score: await this.assessQuestionComplexity(cluster.canonicalForm),
          keywords: await this.extractKeywords(cluster.canonicalForm)
        };

        newPatterns.push(pattern);

        // Create learning event
        const learningEvent: LearningEvent = {
          id: this.generateId(),
          type: LearningEventType.PATTERN_DISCOVERY,
          data: { pattern, cluster },
          timestamp: new Date().toISOString(),
          source: 'pattern_analysis',
          confidence: cluster.confidence
        };

        this.learningEvents.push(learningEvent);
      }
    }

    console.log(`Discovered ${newPatterns.length} new question patterns`);
    return newPatterns;
  }

  async validateKnowledgeEntry(
    entryId: string, 
    validator: string, 
    isValid: boolean, 
    corrections?: string[]
  ): Promise<void> {
    const learningEvent: LearningEvent = {
      id: this.generateId(),
      type: LearningEventType.KNOWLEDGE_VALIDATION,
      data: { entryId, validator, isValid, corrections },
      timestamp: new Date().toISOString(),
      source: 'knowledge_validation',
      confidence: 1.0
    };

    this.learningEvents.push(learningEvent);

    // Update knowledge entry confidence based on validation
    await this.updateKnowledgeConfidence(entryId, isValid, validator);

    // If corrections provided, create new knowledge entries
    if (corrections && corrections.length > 0) {
      await this.createCorrectedKnowledgeEntries(entryId, corrections, validator);
    }

    console.log(`Knowledge entry ${entryId} validated by ${validator}: ${isValid ? 'Valid' : 'Invalid'}`);
  }

  // Advanced Analytics
  async generatePerformanceInsights(): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];
    const currentMetrics = await this.calculateCurrentMetrics();

    // Compare with baseline
    if (this.performanceBaseline) {
      const improvements = this.compareMetrics(currentMetrics, this.performanceBaseline);
      insights.push(...improvements);
    }

    // Trend analysis
    const trendInsights = await this.analyzeTrends();
    insights.push(...trendInsights);

    // Knowledge gap analysis
    const gapInsights = await this.analyzeKnowledgeGaps();
    insights.push(...gapInsights);

    return insights;
  }

  async predictWinProbability(
    rfpAnalysis: any,
    historicalContext: any[]
  ): Promise<{ probability: number; confidence: number; factors: string[] }> {
    // Simple rule-based prediction (would be ML in production)
    let probability = 0.5; // Base probability
    const factors: string[] = [];
    
    // Factor in similar RFP outcomes
    const similarWins = historicalContext.filter(ctx => ctx.outcome === WinStatus.WON);
    const winRate = similarWins.length / historicalContext.length;
    probability = (probability + winRate) / 2;
    factors.push(`Similar RFP win rate: ${Math.round(winRate * 100)}%`);

    // Factor in capability match scores
    const avgCapabilityMatch = rfpAnalysis.extracted_requirements
      .reduce((acc: number, req: any) => acc + req.our_capability_match.score, 0) / 
      rfpAnalysis.extracted_requirements.length;
    
    probability += (avgCapabilityMatch / 100 - 0.5) * 0.3;
    factors.push(`Average capability match: ${Math.round(avgCapabilityMatch)}%`);

    // Factor in competitive landscape
    if (rfpAnalysis.competitive_analysis.likely_competitors.length <= 2) {
      probability += 0.1;
      factors.push('Low competitive pressure');
    }

    // Factor in risk assessment
    const riskPenalty = rfpAnalysis.risk_assessment.overall_risk_score / 100 * 0.2;
    probability -= riskPenalty;
    factors.push(`Risk adjustment: -${Math.round(riskPenalty * 100)}%`);

    // Ensure probability stays within bounds
    probability = Math.max(0.1, Math.min(0.9, probability));

    const confidence = this.calculatePredictionConfidence(historicalContext.length, avgCapabilityMatch);

    return {
      probability,
      confidence,
      factors
    };
  }

  // Continuous Improvement
  async optimizeResponseTemplates(): Promise<string[]> {
    const optimizations: string[] = [];
    
    // Analyze winning responses
    const winningResponses = await this.getWinningResponses();
    const patterns = await this.analyzeSuccessPatterns(winningResponses);

    // Generate optimization suggestions
    for (const pattern of patterns) {
      if (pattern.effectiveness > 0.8) {
        optimizations.push(`Promote pattern: "${pattern.description}" (${Math.round(pattern.effectiveness * 100)}% effective)`);
      }
    }

    // Identify underperforming templates
    const underperforming = await this.identifyUnderperformingTemplates();
    for (const template of underperforming) {
      optimizations.push(`Update template: "${template.name}" (${Math.round(template.winRate * 100)}% win rate)`);
    }

    return optimizations;
  }

  async exportLearningReport(): Promise<any> {
    const report = {
      summary: {
        totalRFPsAnalyzed: this.learningEvents.filter(e => e.type === LearningEventType.RFP_OUTCOME).length,
        averageWinRate: await this.calculateAverageWinRate(),
        knowledgeGrowth: await this.calculateKnowledgeGrowth(),
        topInsights: this.insights.slice(0, 5)
      },
      patterns: {
        newPatternsDiscovered: this.learningEvents.filter(e => e.type === LearningEventType.PATTERN_DISCOVERY).length,
        mostFrequentQuestions: await this.getMostFrequentQuestionPatterns(),
        emergingTrends: await this.getEmergingTrends()
      },
      performance: {
        currentMetrics: await this.calculateCurrentMetrics(),
        improvement: this.performanceBaseline ? 
          this.compareMetrics(await this.calculateCurrentMetrics(), this.performanceBaseline) : [],
        recommendations: await this.generatePerformanceRecommendations()
      },
      knowledge: {
        totalEntries: await this.getKnowledgeEntryCount(),
        validationRate: await this.getKnowledgeValidationRate(),
        topPerformingEntries: await this.getTopPerformingKnowledgeEntries(),
        identifiedGaps: await this.getKnowledgeGaps()
      }
    };

    return report;
  }

  // Helper Methods
  private async initializeBaseline(): Promise<void> {
    // Set initial performance baseline
    this.performanceBaseline = {
      average_analysis_time: 5000, // 5 seconds
      win_rate_improvement: 0,
      time_saved_per_rfp: 0,
      accuracy_score: 0.7,
      user_satisfaction: 3.5
    };
  }

  private calculateConfidenceAdjustment(rating: number): number {
    // Convert 1-5 rating to confidence adjustment (-1 to +1)
    return (rating - 3) / 2 * 0.1;
  }

  private async generateOutcomeInsights(event: LearningEvent): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];
    const { outcome, winReason, lossReason, keyDecisionFactors } = event.data;

    if (outcome === WinStatus.WON && keyDecisionFactors) {
      insights.push({
        id: this.generateId(),
        type: InsightType.WIN_RATE_TREND,
        title: 'Key Win Factors Identified',
        description: `Decision factors that led to win: ${keyDecisionFactors.join(', ')}`,
        impact: BusinessImpact.HIGH,
        recommendations: [`Emphasize these factors in future responses: ${keyDecisionFactors.join(', ')}`],
        confidence: 0.85,
        supporting_evidence: [winReason || 'Win reason not specified'],
        created_at: new Date().toISOString()
      });
    }

    return insights;
  }

  private async clusterSimilarQuestions(documents: Document[]): Promise<any[]> {
    // Simplified clustering - would use ML clustering in production
    const questionMap = new Map<string, any>();
    
    for (const doc of documents) {
      const questions = this.extractQuestions(doc.content);
      
      for (const question of questions) {
        const normalized = this.normalizeQuestion(question);
        
        if (questionMap.has(normalized)) {
          const cluster = questionMap.get(normalized)!;
          cluster.frequency++;
          cluster.variations.add(question);
        } else {
          questionMap.set(normalized, {
            canonicalForm: normalized,
            variations: new Set([question]),
            frequency: 1,
            confidence: 0.7,
            industryFrequency: {}
          });
        }
      }
    }

    return Array.from(questionMap.values()).map(cluster => ({
      ...cluster,
      variations: Array.from(cluster.variations)
    }));
  }

  private extractQuestions(content: string): string[] {
    // Extract sentences that look like questions
    const sentences = content.split(/[.!?]+/);
    return sentences.filter(s => 
      s.trim().length > 10 && 
      (s.includes('?') || 
       s.toLowerCase().includes('what') || 
       s.toLowerCase().includes('how') || 
       s.toLowerCase().includes('can you'))
    );
  }

  private normalizeQuestion(question: string): string {
    return question.toLowerCase()
      .replace(/[?.,!]/g, '')
      .replace(/\b(what|how|can|do|does|will|would|should)\b/g, '')
      .trim();
  }

  private patternExists(cluster: any, existingPatterns: QuestionPattern[]): boolean {
    return existingPatterns.some(pattern => 
      this.calculateSimilarity(cluster.canonicalForm, pattern.canonical_form) > 0.8
    );
  }

  private calculateSimilarity(text1: string, text2: string): number {
    // Simple word overlap similarity
    const words1 = new Set(text1.toLowerCase().split(' '));
    const words2 = new Set(text2.toLowerCase().split(' '));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  // Placeholder methods (would be implemented with actual data operations)
  private async getExistingPatterns(): Promise<QuestionPattern[]> { return []; }
  private async inferQuestionIntent(question: string): Promise<any> { return 'capability_inquiry'; }
  private async assessQuestionComplexity(question: string): Promise<number> { return 5; }
  private async extractKeywords(question: string): Promise<string[]> { return question.split(' '); }
  private async updateKnowledgeFromOutcome(rfpId: string, outcome: WinStatus, details: any): Promise<void> {}
  private async updateWinRatePredictions(outcome: WinStatus, details: any): Promise<void> {}
  private async processFeedbackInsights(feedback: LearningFeedback): Promise<void> {}
  private async updateKnowledgeConfidence(entryId: string, isValid: boolean, validator: string): Promise<void> {}
  private async createCorrectedKnowledgeEntries(entryId: string, corrections: string[], validator: string): Promise<void> {}
  private async calculateCurrentMetrics(): Promise<PerformanceMetrics> {
    return {
      average_analysis_time: 4000,
      win_rate_improvement: 0.15,
      time_saved_per_rfp: 120,
      accuracy_score: 0.82,
      user_satisfaction: 4.2
    };
  }
  private compareMetrics(current: PerformanceMetrics, baseline: PerformanceMetrics): LearningInsight[] { return []; }
  private async analyzeTrends(): Promise<LearningInsight[]> { return []; }
  private async analyzeKnowledgeGaps(): Promise<LearningInsight[]> { return []; }
  private calculatePredictionConfidence(historicalCount: number, capabilityMatch: number): number {
    return Math.min(0.9, 0.5 + (historicalCount / 20) * 0.3 + (capabilityMatch / 100) * 0.2);
  }
  private async getWinningResponses(): Promise<any[]> { return []; }
  private async analyzeSuccessPatterns(responses: any[]): Promise<any[]> { return []; }
  private async identifyUnderperformingTemplates(): Promise<any[]> { return []; }
  private async calculateAverageWinRate(): Promise<number> { return 0.65; }
  private async calculateKnowledgeGrowth(): Promise<number> { return 0.25; }
  private async getMostFrequentQuestionPatterns(): Promise<any[]> { return []; }
  private async getEmergingTrends(): Promise<any[]> { return []; }
  private async generatePerformanceRecommendations(): Promise<string[]> { return []; }
  private async getKnowledgeEntryCount(): Promise<number> { return 156; }
  private async getKnowledgeValidationRate(): Promise<number> { return 0.78; }
  private async getTopPerformingKnowledgeEntries(): Promise<any[]> { return []; }
  private async getKnowledgeGaps(): Promise<any[]> { return []; }
}

// Export singleton instance
export const learningEngine = new LearningEngine();