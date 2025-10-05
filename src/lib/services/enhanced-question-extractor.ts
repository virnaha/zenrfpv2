import {
  ExtractedQuestion,
  SubQuestion,
  QuestionCategory,
  QuestionComplexity,
  QuestionPriority,
  RequirementType,
  ExtractionMetadata,
  QuestionAnalysisResult,
  QuestionExtractionSummary,
  ProcessingMetrics
} from '../types/rfp-analyzer';
import { createAPIConfig, APIConfiguration } from '../config/api-config';
import { zenloopPrompts, ZenloopConsultantContext } from './zenloop-consultant-prompts';
import { knowledgeIngestion } from './knowledge-ingestion';

export class EnhancedQuestionExtractor {
  private config: APIConfiguration;
  private categoryKeywords: Record<QuestionCategory, string[]>;
  private requirementKeywords: Record<RequirementType, string[]>;
  private priorityIndicators: Record<QuestionPriority, string[]>;

  constructor() {
    this.config = createAPIConfig();
    this.initializeKeywords();
  }

  private initializeKeywords(): void {
    // Enhanced Zenloop-aware categorization keywords
    this.categoryKeywords = {
      [QuestionCategory.TECHNICAL]: [
        'technical', 'system', 'architecture', 'database', 'infrastructure',
        'api', 'integration', 'software', 'platform', 'technology', 'cloud',
        'specifications', 'requirements', 'development', 'programming',
        // Zenloop-specific technical terms
        'dashboard', 'analytics', 'real-time', 'automation', 'workflow',
        'data processing', 'machine learning', 'ai', 'sentiment analysis'
      ],
      [QuestionCategory.PRICING]: [
        'pricing', 'cost', 'price', 'fee', 'budget', 'payment', 'invoice',
        'billing', 'subscription', 'license', 'financial', 'economic', 'roi',
        // Zenloop pricing context
        'per response', 'monthly', 'annual', 'enterprise', 'volume discount',
        'implementation cost', 'total cost of ownership', 'value proposition'
      ],
      [QuestionCategory.SECURITY]: [
        'security', 'encryption', 'authentication', 'authorization', 'access',
        'firewall', 'vulnerability', 'threat', 'risk', 'breach', 'protection',
        'secure', 'safety', 'privacy', 'confidential', 'cybersecurity',
        // Data privacy specific to CX platforms
        'data protection', 'customer data', 'personal information', 'consent management'
      ],
      [QuestionCategory.COMPLIANCE]: [
        'compliance', 'regulation', 'regulatory', 'standard', 'certification',
        'audit', 'policy', 'governance', 'legal', 'gdpr', 'hipaa', 'sox',
        'iso', 'pci', 'requirement', 'mandate', 'law',
        // CX-specific compliance
        'data residency', 'right to be forgotten', 'consent', 'opt-out', 'data retention'
      ],
      [QuestionCategory.FUNCTIONAL]: [
        // Core CX functionality - Zenloop's strength areas
        'nps', 'net promoter score', 'csat', 'customer satisfaction', 'ces', 'customer effort',
        'survey', 'feedback', 'voice of customer', 'customer experience', 'cx',
        'questionnaire', 'rating', 'score', 'measurement', 'metric',
        'function', 'feature', 'capability', 'workflow', 'process', 'business',
        'user', 'interface', 'experience', 'functionality', 'operation',
        // Advanced CX capabilities
        'closed loop', 'follow-up', 'action management', 'case management', 'alerts'
      ],
      [QuestionCategory.PERFORMANCE]: [
        'performance', 'speed', 'latency', 'throughput', 'scalability', 'load',
        'capacity', 'availability', 'uptime', 'response', 'optimization',
        // CX platform performance specifics
        'response rate', 'completion rate', 'real-time processing', 'survey delivery speed'
      ],
      [QuestionCategory.INTEGRATION]: [
        'integration', 'interface', 'connector', 'api', 'webhook', 'sync',
        'import', 'export', 'data transfer', 'interoperability', 'compatibility',
        // CX platform integrations
        'crm', 'salesforce', 'hubspot', 'slack', 'teams', 'zapier',
        'sso', 'single sign-on', 'ldap', 'active directory'
      ],
      [QuestionCategory.SUPPORT]: [
        'support', 'maintenance', 'service', 'help', 'training', 'documentation',
        'customer service', 'technical support', 'assistance', 'guidance',
        // CX implementation support
        'onboarding', 'best practices', 'consulting', 'customer success',
        'account management', 'training program', 'certification'
      ],
      [QuestionCategory.IMPLEMENTATION]: [
        'implementation', 'deployment', 'installation', 'setup', 'configuration',
        'migration', 'rollout', 'go-live', 'onboarding', 'project',
        // CX program launch
        'survey design', 'program setup', 'template', 'questionnaire design',
        'pilot', 'launch', 'rollout plan', 'change management'
      ],
      [QuestionCategory.EXPERIENCE]: [
        'experience', 'expertise', 'history', 'background', 'portfolio',
        'case study', 'reference', 'testimonial', 'track record', 'proven',
        // CX industry experience
        'customer experience expertise', 'cx transformation', 'nps program',
        'feedback management', 'industry experience', 'vertical expertise'
      ],
      [QuestionCategory.REFERENCE]: [
        'reference', 'referral', 'client', 'customer', 'testimonial',
        'case study', 'example', 'similar', 'comparable', 'previous',
        // Specific reference types
        'success story', 'roi case study', 'implementation example',
        'customer outcome', 'before and after', 'results achieved'
      ]
    };

    this.requirementKeywords = {
      [RequirementType.MANDATORY]: [
        'must', 'required', 'mandatory', 'shall', 'essential', 'critical',
        'necessary', 'compulsory', 'obligatory', 'imperative'
      ],
      [RequirementType.PREFERRED]: [
        'prefer', 'should', 'desired', 'wanted', 'favorable', 'ideal',
        'recommended', 'better', 'advantageous'
      ],
      [RequirementType.OPTIONAL]: [
        'optional', 'nice to have', 'if possible', 'bonus', 'additional',
        'extra', 'supplementary', 'enhancement'
      ],
      [RequirementType.COMPLIANCE]: [
        'compliance', 'regulatory', 'legal', 'standard', 'certification',
        'audit', 'mandate', 'requirement'
      ],
      [RequirementType.EVALUATION]: [
        'evaluate', 'assess', 'score', 'rate', 'measure', 'criteria',
        'benchmark', 'compare', 'weigh'
      ],
      [RequirementType.INFORMATIONAL]: [
        'describe', 'explain', 'provide information', 'detail', 'outline',
        'clarify', 'elaborate', 'specify'
      ]
    };

    this.priorityIndicators = {
      [QuestionPriority.CRITICAL]: [
        'critical', 'essential', 'vital', 'crucial', 'mandatory', 'must have',
        'deal breaker', 'non-negotiable', 'required'
      ],
      [QuestionPriority.HIGH]: [
        'important', 'high priority', 'significant', 'key', 'major',
        'primary', 'principal', 'fundamental'
      ],
      [QuestionPriority.MEDIUM]: [
        'moderate', 'standard', 'typical', 'regular', 'normal',
        'average', 'routine'
      ],
      [QuestionPriority.LOW]: [
        'minor', 'low priority', 'secondary', 'less important',
        'supplementary', 'additional'
      ],
      [QuestionPriority.INFORMATIONAL]: [
        'informational', 'background', 'context', 'reference',
        'for information', 'fyi', 'awareness'
      ]
    };
  }

  async extractQuestions(documentContent: string, sourceMetadata?: any): Promise<QuestionAnalysisResult> {
    const startTime = Date.now();

    try {
      // Step 1: Use AI to extract structured questions
      const aiExtractedQuestions = await this.aiExtractQuestions(documentContent);

      // Step 2: Apply rule-based enhancement
      const enhancedQuestions = await this.enhanceQuestions(aiExtractedQuestions, documentContent);

      // Step 3: Detect multi-part questions and split them
      const processedQuestions = await this.processMultiPartQuestions(enhancedQuestions);

      // Step 4: Categorize and prioritize
      const categorizedQuestions = await this.categorizeAndPrioritize(processedQuestions);

      // Step 5: Calculate complexity scores
      const finalQuestions = await this.calculateComplexity(categorizedQuestions);

      // Step 6: Generate summary and metrics
      const summary = this.generateSummary(finalQuestions);
      const metrics = this.calculateMetrics(finalQuestions, startTime);

      // Step 7: Generate recommendations
      const recommendations = this.generateRecommendations(finalQuestions, summary);

      return {
        questions: finalQuestions,
        summary,
        recommendations,
        processingMetrics: metrics
      };
    } catch (error) {
      throw new Error(`Question extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async aiExtractQuestions(documentContent: string): Promise<Partial<ExtractedQuestion>[]> {
    if (!this.config.features.enableAIGeneration) {
      return this.fallbackExtraction(documentContent);
    }

    // Retrieve relevant Zenloop knowledge for context
    const retrievedKnowledge = await this.retrieveRelevantKnowledge(documentContent);

    const context: ZenloopConsultantContext = {
      retrievedKnowledge: retrievedKnowledge,
      rfpContext: 'Question extraction with Zenloop expertise'
    };

    const prompt = zenloopPrompts.questionExtraction(documentContent, context);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.openai.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.openai.model,
          messages: [
            {
              role: 'system',
              content: 'You are Sarah Chen, a Senior Customer Experience Consultant and Zenloop implementation specialist. Extract and categorize RFP questions through the lens of Zenloop\'s capabilities and CX expertise. Prioritize questions based on Zenloop\'s competitive strengths and identify strategic positioning opportunities.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 4000,
          temperature: 0.2
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      // Extract JSON from response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Invalid JSON response from AI');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.warn('AI extraction failed, falling back to rule-based extraction:', error);
      return this.fallbackExtraction(documentContent);
    }
  }

  private fallbackExtraction(documentContent: string): Partial<ExtractedQuestion>[] {
    const questions: Partial<ExtractedQuestion>[] = [];
    const questionPatterns = [
      /\d+\.\s+(.+?\?)/g,
      /Question\s+\d+[:\s]+(.+?\?)/gi,
      /Please\s+(.+?\?)/gi,
      /Describe\s+(.+?)[\.\?]/gi,
      /Provide\s+(.+?)[\.\?]/gi,
      /Explain\s+(.+?)[\.\?]/gi,
      /List\s+(.+?)[\.\?]/gi
    ];

    for (const pattern of questionPatterns) {
      let match;
      while ((match = pattern.exec(documentContent)) !== null) {
        const text = match[1].trim();
        if (text.length > 10 && text.length < 500) {
          questions.push({
            originalText: text,
            normalizedText: text,
            keywords: this.extractKeywords(text),
            contextClues: [],
            isMultiPart: this.detectMultiPart(text),
            confidenceScore: 0.7
          });
        }
      }
    }

    return questions;
  }

  private async enhanceQuestions(questions: Partial<ExtractedQuestion>[], documentContent: string): Promise<ExtractedQuestion[]> {
    return questions.map((q, index) => {
      const id = `question-${Date.now()}-${index}`;
      const now = new Date().toISOString();

      return {
        id,
        originalText: q.originalText || '',
        normalizedText: q.normalizedText || q.originalText || '',
        subQuestions: [],
        category: q.category as QuestionCategory || this.categorizeQuestion(q.originalText || ''),
        complexity: QuestionComplexity.SIMPLE,
        priority: QuestionPriority.MEDIUM,
        requirementType: q.requirementType as RequirementType || this.determineRequirementType(q.originalText || ''),
        keywords: q.keywords || this.extractKeywords(q.originalText || ''),
        isMultiPart: q.isMultiPart || false,
        contextClues: q.contextClues || [],
        confidenceScore: q.confidenceScore || 0.7,
        extractionMetadata: {
          sourceSection: 'document',
          extractionMethod: 'ai-enhanced',
          processingTime: 0,
          lastUpdated: now
        }
      };
    });
  }

  private async processMultiPartQuestions(questions: ExtractedQuestion[]): Promise<ExtractedQuestion[]> {
    const processedQuestions: ExtractedQuestion[] = [];

    for (const question of questions) {
      if (question.isMultiPart) {
        const subQuestions = this.splitMultiPartQuestion(question);
        question.subQuestions = subQuestions;
      }
      processedQuestions.push(question);
    }

    return processedQuestions;
  }

  private splitMultiPartQuestion(question: ExtractedQuestion): SubQuestion[] {
    const subQuestions: SubQuestion[] = [];
    const text = question.originalText;

    // Split on common multi-part indicators
    const splitPatterns = [
      /\b(and|or|also|additionally|furthermore|moreover)\b/gi,
      /[;]/g,
      /\b(a\)|b\)|c\)|d\)|e\)|\d\))/g,
      /\b(i\.|ii\.|iii\.|iv\.|v\.)/g
    ];

    let parts = [text];
    for (const pattern of splitPatterns) {
      const newParts: string[] = [];
      for (const part of parts) {
        const splits = part.split(pattern).filter(p => p.trim().length > 10);
        newParts.push(...splits);
      }
      if (newParts.length > parts.length) {
        parts = newParts;
        break;
      }
    }

    parts.forEach((part, index) => {
      if (part.trim().length > 10) {
        subQuestions.push({
          id: `${question.id}-sub-${index}`,
          text: part.trim(),
          category: this.categorizeQuestion(part),
          requirementType: this.determineRequirementType(part),
          priority: this.determinePriority(part),
          parentQuestionId: question.id,
          orderIndex: index
        });
      }
    });

    return subQuestions;
  }

  private async categorizeAndPrioritize(questions: ExtractedQuestion[]): Promise<ExtractedQuestion[]> {
    return questions.map(question => ({
      ...question,
      category: this.categorizeQuestion(question.originalText),
      priority: this.determinePriority(question.originalText),
      requirementType: this.determineRequirementType(question.originalText)
    }));
  }

  private categorizeQuestion(text: string): QuestionCategory {
    const lowerText = text.toLowerCase();
    let bestMatch = QuestionCategory.FUNCTIONAL;
    let maxMatches = 0;

    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      const matches = keywords.filter(keyword => lowerText.includes(keyword)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        bestMatch = category as QuestionCategory;
      }
    }

    return bestMatch;
  }

  private determinePriority(text: string): QuestionPriority {
    const lowerText = text.toLowerCase();

    for (const [priority, indicators] of Object.entries(this.priorityIndicators)) {
      if (indicators.some(indicator => lowerText.includes(indicator))) {
        return priority as QuestionPriority;
      }
    }

    return QuestionPriority.MEDIUM;
  }

  private determineRequirementType(text: string): RequirementType {
    const lowerText = text.toLowerCase();

    for (const [type, keywords] of Object.entries(this.requirementKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return type as RequirementType;
      }
    }

    return RequirementType.INFORMATIONAL;
  }

  private async calculateComplexity(questions: ExtractedQuestion[]): Promise<ExtractedQuestion[]> {
    return questions.map(question => {
      let complexity = QuestionComplexity.SIMPLE;
      const text = question.originalText;

      // Factors that increase complexity
      let complexityScore = 0;

      if (question.isMultiPart) complexityScore += 2;
      if (question.subQuestions.length > 2) complexityScore += 1;
      if (text.length > 200) complexityScore += 1;
      if ((text.match(/and|or|also/gi) || []).length > 2) complexityScore += 1;
      if (text.includes('integration') || text.includes('compliance')) complexityScore += 1;

      if (complexityScore >= 4) complexity = QuestionComplexity.VERY_COMPLEX;
      else if (complexityScore >= 3) complexity = QuestionComplexity.COMPLEX;
      else if (complexityScore >= 2) complexity = QuestionComplexity.MODERATE;

      return { ...question, complexity };
    });
  }

  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 3)
      .filter(word => !['this', 'that', 'with', 'from', 'they', 'have', 'will', 'been', 'were'].includes(word));

    return [...new Set(words)].slice(0, 10);
  }

  private detectMultiPart(text: string): boolean {
    const multiPartIndicators = [
      /\b(and|or|also|additionally|furthermore|moreover)\b/gi,
      /[;]/g,
      /\b(a\)|b\)|c\)|d\)|e\)|\d\))/g,
      /\b(i\.|ii\.|iii\.|iv\.|v\.)/g
    ];

    return multiPartIndicators.some(pattern => pattern.test(text));
  }

  private generateSummary(questions: ExtractedQuestion[]): QuestionExtractionSummary {
    const questionsByCategory: Record<QuestionCategory, number> = Object.values(QuestionCategory).reduce((acc, cat) => {
      acc[cat] = 0;
      return acc;
    }, {} as Record<QuestionCategory, number>);

    const questionsByComplexity: Record<QuestionComplexity, number> = Object.values(QuestionComplexity).reduce((acc, comp) => {
      acc[comp] = 0;
      return acc;
    }, {} as Record<QuestionComplexity, number>);

    const questionsByPriority: Record<QuestionPriority, number> = Object.values(QuestionPriority).reduce((acc, pri) => {
      acc[pri] = 0;
      return acc;
    }, {} as Record<QuestionPriority, number>);

    questions.forEach(q => {
      questionsByCategory[q.category]++;
      questionsByComplexity[q.complexity]++;
      questionsByPriority[q.priority]++;
    });

    const averageConfidence = questions.length > 0 ?
      questions.reduce((sum, q) => sum + q.confidenceScore, 0) / questions.length : 0;

    const multiPartQuestions = questions.filter(q => q.isMultiPart).length;

    return {
      totalQuestions: questions.length,
      questionsByCategory,
      questionsByComplexity,
      questionsByPriority,
      multiPartQuestions,
      averageConfidence,
      coverageGaps: this.identifyCoverageGaps(questions)
    };
  }

  private identifyCoverageGaps(questions: ExtractedQuestion[]): string[] {
    const gaps: string[] = [];
    const categories = new Set(questions.map(q => q.category));

    if (!categories.has(QuestionCategory.SECURITY)) gaps.push('Security requirements may not be fully addressed');
    if (!categories.has(QuestionCategory.COMPLIANCE)) gaps.push('Compliance questions may be missing');
    if (!categories.has(QuestionCategory.PRICING)) gaps.push('Pricing structure questions may be incomplete');
    if (!categories.has(QuestionCategory.INTEGRATION)) gaps.push('Integration requirements may need more detail');

    const criticalCount = questions.filter(q => q.priority === QuestionPriority.CRITICAL).length;
    if (criticalCount === 0) gaps.push('No critical priority questions identified - may need review');

    return gaps;
  }

  private calculateMetrics(questions: ExtractedQuestion[], startTime: number): ProcessingMetrics {
    const processingTime = Date.now() - startTime;
    const averageConfidence = questions.length > 0 ?
      questions.reduce((sum, q) => sum + q.confidenceScore, 0) / questions.length : 0;

    return {
      totalProcessingTime: processingTime,
      questionsExtracted: questions.length,
      questionsNormalized: questions.length,
      questionsValidated: questions.filter(q => q.confidenceScore > 0.7).length,
      averageConfidenceScore: averageConfidence,
      qualityScore: this.calculateQualityScore(questions)
    };
  }

  private calculateQualityScore(questions: ExtractedQuestion[]): number {
    if (questions.length === 0) return 0;

    let score = 0;

    // Factor 1: Average confidence
    const avgConfidence = questions.reduce((sum, q) => sum + q.confidenceScore, 0) / questions.length;
    score += avgConfidence * 40; // 40% weight

    // Factor 2: Category coverage
    const categoriesCovered = new Set(questions.map(q => q.category)).size;
    const maxCategories = Object.values(QuestionCategory).length;
    score += (categoriesCovered / maxCategories) * 30; // 30% weight

    // Factor 3: Multi-part question handling
    const multiPartRatio = questions.filter(q => q.isMultiPart).length / questions.length;
    score += (multiPartRatio > 0 ? 20 : 10); // 20% weight if multi-part found

    // Factor 4: Complexity distribution
    const complexQuestions = questions.filter(q =>
      q.complexity === QuestionComplexity.COMPLEX || q.complexity === QuestionComplexity.VERY_COMPLEX
    ).length;
    score += Math.min((complexQuestions / questions.length) * 10, 10); // 10% weight

    return Math.min(score, 100);
  }

  private generateRecommendations(questions: ExtractedQuestion[], summary: QuestionExtractionSummary): string[] {
    const recommendations: string[] = [];

    if (summary.averageConfidence < 0.7) {
      recommendations.push('Consider manual review of extracted questions - confidence scores are below optimal threshold');
    }

    if (summary.multiPartQuestions > summary.totalQuestions * 0.3) {
      recommendations.push('High number of multi-part questions detected - consider breaking down responses into clear sections');
    }

    const criticalCount = summary.questionsByPriority[QuestionPriority.CRITICAL];
    if (criticalCount > 0) {
      recommendations.push(`${criticalCount} critical questions identified - prioritize these in your response strategy`);
    }

    const technicalCount = summary.questionsByCategory[QuestionCategory.TECHNICAL];
    if (technicalCount > summary.totalQuestions * 0.4) {
      recommendations.push('Technical questions dominate - ensure technical team involvement in response preparation');
    }

    if (summary.coverageGaps.length > 0) {
      recommendations.push(`Address potential gaps: ${summary.coverageGaps.join(', ')}`);
    }

    const complexCount = summary.questionsByComplexity[QuestionComplexity.COMPLEX] +
                        summary.questionsByComplexity[QuestionComplexity.VERY_COMPLEX];
    if (complexCount > 0) {
      recommendations.push(`${complexCount} complex questions require detailed responses with multiple stakeholder input`);
    }

    return recommendations;
  }

  private async retrieveRelevantKnowledge(documentContent: string, maxResults: number = 3): Promise<string[]> {
    try {
      // Extract CX-specific terms for better knowledge retrieval
      const cxTerms = this.extractCXTermsForRetrieval(documentContent);
      const retrievedDocs: string[] = [];

      // Search Zenloop knowledge base for relevant content
      for (const term of cxTerms.slice(0, 2)) { // Limit to top 2 terms for question extraction
        try {
          const results = await knowledgeIngestion.searchZenloopKnowledge(term, 2);
          results.forEach(result => {
            retrievedDocs.push(`${result.source}: ${result.content}`);
          });
        } catch (error) {
          console.warn(`Failed to retrieve knowledge for term "${term}":`, error);
        }
      }

      return retrievedDocs.slice(0, maxResults);
    } catch (error) {
      console.warn('Failed to retrieve Zenloop knowledge for question extraction:', error);
      return [];
    }
  }

  private extractCXTermsForRetrieval(documentContent: string): string[] {
    const text = documentContent.toLowerCase();
    const keyTerms: string[] = [];

    // Prioritize CX-specific terms for better context retrieval
    const cxTerms = ['nps', 'net promoter', 'csat', 'customer satisfaction', 'ces', 'customer effort',
                     'feedback', 'survey', 'voice of customer', 'customer experience'];

    const techTerms = ['dashboard', 'analytics', 'reporting', 'integration', 'api', 'automation'];

    // Check for presence of terms and prioritize CX terms
    [...cxTerms, ...techTerms].forEach(term => {
      if (text.includes(term)) {
        keyTerms.push(term);
      }
    });

    // Always include general Zenloop searches
    keyTerms.unshift('zenloop capabilities', 'cx platform features');

    return keyTerms.slice(0, 5); // Return top 5 most relevant terms
  }
}

// Export singleton instance
export const enhancedQuestionExtractor = new EnhancedQuestionExtractor();