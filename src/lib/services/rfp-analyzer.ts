import { 
  Document, 
  DocumentType, 
  RFPAnalysis, 
  KnowledgeEntry, 
  QuestionPattern, 
  WinningResponse,
  ClientProfile,
  SimilarRFP,
  Requirement,
  RiskAssessment,
  ResponseStrategy,
  LearningFeedback,
  AnalyzeRFPRequest,
  AnalyzeRFPResponse,
  QueryKnowledgeRequest,
  QueryKnowledgeResponse,
  Industry,
  WinStatus,
  AnalysisDepth,
  RequirementCategory,
  CapabilityMatch,
  MatchStatus
} from '../types/rfp-analyzer';
import { simpleSupabase } from './simple-supabase';
import { knowledgeIngestion } from './knowledge-ingestion';

export class RFPAnalyzer {
  private knowledgeBase: Map<string, KnowledgeEntry> = new Map();
  private questionPatterns: Map<string, QuestionPattern> = new Map();
  private winningResponses: Map<string, WinningResponse> = new Map();
  private clientProfiles: Map<string, ClientProfile> = new Map();
  private documentCache: Map<string, Document> = new Map();

  constructor() {
    this.initializeKnowledgeBase();
  }

  // Core Analysis Methods
  async analyzeHistoricalRFP(document: Document, metadata: any): Promise<void> {
    console.log(`Analyzing historical RFP: ${document.name}`);
    
    // Extract patterns from the RFP
    const extractedPatterns = await this.extractQuestionPatterns(document);
    const requirements = await this.extractRequirements(document);
    const clientInsights = await this.extractClientInsights(document, metadata);

    // Store patterns for future learning
    for (const pattern of extractedPatterns) {
      await this.storeQuestionPattern(pattern);
    }

    // Update knowledge base with new insights
    await this.updateKnowledgeFromDocument(document, requirements, metadata);
    
    // Update client profile if available
    if (metadata.client_name) {
      await this.updateClientProfile(metadata.client_name, clientInsights);
    }

    console.log(`Extracted ${extractedPatterns.length} patterns and ${requirements.length} requirements`);
  }

  async extractWinningPatterns(rfp: Document, outcome: WinStatus): Promise<WinningResponse[]> {
    if (outcome !== WinStatus.WON) {
      return [];
    }

    console.log(`Extracting winning patterns from: ${rfp.name}`);
    
    // Find the corresponding response document
    const responseDoc = await this.findResponseDocument(rfp.id);
    if (!responseDoc) {
      console.warn(`No response document found for RFP: ${rfp.id}`);
      return [];
    }

    // Extract successful response patterns
    const winningPatterns = await this.analyzeWinningResponse(rfp, responseDoc);
    
    // Store these patterns for future use
    for (const pattern of winningPatterns) {
      await this.storeWinningResponse(pattern);
    }

    return winningPatterns;
  }

  async mapQuestionVariations(questions: string[]): Promise<Map<string, QuestionPattern>> {
    const mappedPatterns = new Map<string, QuestionPattern>();
    
    for (const question of questions) {
      // Find or create canonical pattern
      const canonicalPattern = await this.findOrCreateQuestionPattern(question);
      mappedPatterns.set(question, canonicalPattern);
    }

    return mappedPatterns;
  }

  async buildKnowledgeGraph(documents: Document[]): Promise<void> {
    console.log(`Building knowledge graph from ${documents.length} documents`);
    
    // Process each document to extract knowledge
    for (const doc of documents) {
      await this.processDocumentForKnowledge(doc);
    }

    // Build relationships between knowledge entries
    await this.createKnowledgeRelationships();
    
    // Update search indices
    await this.updateSearchIndices();
    
    console.log('Knowledge graph construction completed');
  }

  async predictRequirements(newRFP: Document): Promise<Requirement[]> {
    console.log(`Predicting requirements for: ${newRFP.name}`);
    
    // Find similar historical RFPs
    const similarRFPs = await this.findSimilarRFPs(newRFP, 0.7);
    
    // Extract common patterns from similar RFPs
    const predictedRequirements: Requirement[] = [];
    const requirementFrequency = new Map<string, number>();

    for (const similar of similarRFPs) {
      const historicalDoc = await this.getDocument(similar.document_id);
      if (historicalDoc) {
        const requirements = await this.extractRequirements(historicalDoc);
        
        for (const req of requirements) {
          const key = this.normalizeRequirement(req.text);
          requirementFrequency.set(key, (requirementFrequency.get(key) || 0) + 1);
        }
      }
    }

    // Create predicted requirements based on frequency
    for (const [reqText, frequency] of requirementFrequency.entries()) {
      if (frequency >= Math.ceil(similarRFPs.length * 0.3)) { // Appears in 30%+ of similar RFPs
        predictedRequirements.push({
          id: this.generateId(),
          text: reqText,
          category: await this.categorizeRequirement(reqText),
          criticality: await this.assessCriticality(reqText, frequency, similarRFPs.length),
          compliance_mandatory: await this.isComplianceMandatory(reqText),
          our_capability_match: await this.assessCapabilityMatch(reqText),
          supporting_evidence: [],
          risk_factors: []
        });
      }
    }

    console.log(`Predicted ${predictedRequirements.length} requirements`);
    return predictedRequirements;
  }

  // Document Intelligence Pipeline
  async processDocumentForKnowledge(document: Document): Promise<KnowledgeEntry[]> {
    const extractedEntries: KnowledgeEntry[] = [];
    
    // Classify document sections
    const sections = await this.classifyDocumentSections(document);
    
    // Extract knowledge from each section
    for (const section of sections) {
      const entries = await this.extractKnowledgeFromSection(section, document);
      extractedEntries.push(...entries);
    }

    // Validate and score extracted knowledge
    for (const entry of extractedEntries) {
      entry.confidence_score = await this.scoreKnowledgeConfidence(entry);
      await this.storeKnowledgeEntry(entry);
    }

    return extractedEntries;
  }

  // Learning Mechanisms
  async updateKnowledgeBase(newDocument: Document, metadata: any): Promise<void> {
    console.log(`Updating knowledge base with: ${newDocument.name}`);
    
    // Process document for new knowledge
    const newEntries = await this.processDocumentForKnowledge(newDocument);
    
    // Update existing entries if conflicts arise
    await this.resolveKnowledgeConflicts(newEntries);
    
    // Update patterns and templates
    await this.updatePatterns(newDocument);
    
    console.log(`Added ${newEntries.length} new knowledge entries`);
  }

  async reinforceLearning(response: WinningResponse, outcome: WinStatus): Promise<void> {
    const feedback: LearningFeedback = {
      id: this.generateId(),
      response_id: response.id,
      outcome,
      feedback_type: 'win_loss_analysis' as any,
      lessons_learned: [],
      what_worked: [],
      what_didnt_work: [],
      recommendations: [],
      confidence_adjustment: outcome === WinStatus.WON ? 0.1 : -0.1
    };

    // Adjust confidence scores based on outcome
    await this.adjustConfidenceScores(response, feedback);
    
    // Update win rates
    await this.updateWinRates(response, outcome);
    
    console.log(`Learning reinforced for response: ${response.id}`);
  }

  // Analysis Tools
  async findSimilarRFPs(newRFP: Document, threshold: number = 0.7): Promise<SimilarRFP[]> {
    const similarRFPs: SimilarRFP[] = [];
    
    // Get all historical RFPs
    const historicalRFPs = await this.getHistoricalRFPs();
    
    for (const historical of historicalRFPs) {
      const similarity = await this.calculateSimilarity(newRFP, historical);
      
      if (similarity >= threshold) {
        const similarities = await this.identifySimilarities(newRFP, historical);
        const differences = await this.identifyDifferences(newRFP, historical);
        
        similarRFPs.push({
          document_id: historical.id,
          similarity_score: similarity,
          outcome: historical.metadata.win_status || WinStatus.UNKNOWN,
          key_similarities: similarities,
          key_differences: differences,
          lessons_learned: await this.extractLessonsLearned(historical)
        });
      }
    }

    // Sort by similarity score
    return similarRFPs.sort((a, b) => b.similarity_score - a.similarity_score);
  }

  async analyzeRFP(request: AnalyzeRFPRequest): Promise<AnalyzeRFPResponse> {
    const startTime = Date.now();
    console.log(`Starting comprehensive RFP analysis for document: ${request.document_id}`);
    
    // Get the RFP document
    const rfpDocument = await this.getDocument(request.document_id);
    if (!rfpDocument) {
      throw new Error(`Document not found: ${request.document_id}`);
    }

    // Find similar RFPs
    const similarRFPs = request.include_similar_rfps ? 
      await this.findSimilarRFPs(rfpDocument, 0.6) : [];

    // Extract requirements
    const requirements = await this.extractRequirements(rfpDocument);
    
    // Assess risks
    const riskAssessment = await this.assessRisks(rfpDocument, requirements);
    
    // Calculate opportunity score
    const opportunityScore = await this.calculateOpportunityScore(rfpDocument, similarRFPs);
    
    // Generate response strategy
    const responseStrategy = await this.generateResponseStrategy(
      rfpDocument, 
      requirements, 
      similarRFPs, 
      riskAssessment
    );

    // Identify knowledge gaps
    const knowledgeGaps = await this.identifyKnowledgeGaps(requirements);
    
    // Competitive analysis
    const competitiveAnalysis = request.include_competitive_analysis ?
      await this.performCompetitiveAnalysis(rfpDocument, similarRFPs) : 
      {
        likely_competitors: [],
        our_win_probability: 0.5,
        key_differentiators: [],
        competitive_risks: [],
        recommended_positioning: []
      };

    const analysis: RFPAnalysis = {
      id: this.generateId(),
      rfp_document_id: request.document_id,
      analysis_date: new Date().toISOString(),
      similar_rfps: similarRFPs.slice(0, request.max_similar_rfps || 5),
      extracted_requirements: requirements,
      risk_assessment: riskAssessment,
      opportunity_score: opportunityScore,
      recommended_strategy: responseStrategy,
      knowledge_gaps: knowledgeGaps,
      competitive_analysis: competitiveAnalysis
    };

    const processingTime = Date.now() - startTime;
    
    return {
      analysis,
      processing_time: processingTime,
      confidence_score: await this.calculateAnalysisConfidence(analysis),
      recommendations: await this.generateActionableRecommendations(analysis)
    };
  }

  // Knowledge Query Interface
  async queryKnowledgeBase(request: QueryKnowledgeRequest): Promise<QueryKnowledgeResponse> {
    const startTime = Date.now();
    
    // Parse and understand the query
    const queryIntent = await this.parseQueryIntent(request.query);
    
    // Search knowledge entries
    const knowledgeResults = await this.searchKnowledgeEntries(
      request.query, 
      request.context,
      request.max_results
    );

    // Filter by confidence threshold
    const filteredResults = knowledgeResults.filter(
      result => result.relevance_score >= request.min_confidence
    );

    const processingTime = Date.now() - startTime;

    return {
      results: filteredResults,
      total_results: filteredResults.length,
      processing_time: processingTime
    };
  }

  // Helper Methods
  private async initializeKnowledgeBase(): Promise<void> {
    // Load existing knowledge from Supabase or fallback storage
    try {
      if (simpleSupabase.isSupabaseConnected()) {
        // Load from Supabase
        console.log('Loading knowledge base from Supabase...');
      } else {
        // Load sample knowledge
        console.log('Initializing sample knowledge base...');
        await this.initializeSampleKnowledge();
      }
    } catch (error) {
      console.error('Failed to initialize knowledge base:', error);
    }
  }

  private async initializeSampleKnowledge(): Promise<void> {
    try {
      // Load authentic Zenloop knowledge base
      console.log('🔄 Loading authentic Zenloop knowledge base...');
      const ingestionResult = await knowledgeIngestion.ingestZenloopDocuments();
      
      // Add knowledge entries to the analyzer's knowledge base
      for (const entry of ingestionResult.knowledgeEntries) {
        this.knowledgeBase.set(entry.id, entry);
      }
      
      console.log(`✅ Loaded ${ingestionResult.knowledgeEntriesExtracted} authentic Zenloop knowledge entries`);
      console.log(`📊 Knowledge base now contains ${this.knowledgeBase.size} total entries`);
      
    } catch (error) {
      console.error('Failed to load Zenloop knowledge base, falling back to basic knowledge:', error);
      
      // Fallback to basic knowledge if ingestion fails
      await this.loadFallbackKnowledge();
    }
  }

  private async loadFallbackKnowledge(): Promise<void> {
    // Basic fallback knowledge
    const fallbackEntries: KnowledgeEntry[] = [
      {
        id: 'zenloop-basic-platform',
        content: 'Zenloop is a comprehensive customer experience platform that helps businesses collect, analyze and act on customer feedback through NPS, CSAT, and CES surveys.',
        type: 'product' as any,
        source_documents: ['zenloop-overview'],
        confidence_score: 0.95,
        validation_status: 'validated' as any,
        metadata: {
          industry_relevance: [Industry.TECHNOLOGY, Industry.RETAIL, Industry.FINANCE],
          deal_size_applicability: 'enterprise' as any,
          geographic_scope: ['global'],
          last_validated: new Date().toISOString(),
          validator: 'system',
          business_impact: 'high' as any
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        usage_count: 0
      }
    ];

    for (const entry of fallbackEntries) {
      this.knowledgeBase.set(entry.id, entry);
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  private async extractQuestionPatterns(document: Document): Promise<QuestionPattern[]> {
    // Implementation would analyze document for question patterns
    return [];
  }

  private async extractRequirements(document: Document): Promise<Requirement[]> {
    // Implementation would extract requirements from RFP
    const requirements: Requirement[] = [];
    
    // Analyze document content for requirements
    const sections = document.content.split('\n\n');
    
    for (const section of sections) {
      if (this.isRequirementSection(section)) {
        const req: Requirement = {
          id: this.generateId(),
          text: section.trim(),
          category: await this.categorizeRequirement(section),
          criticality: await this.assessCriticality(section, 1, 1),
          compliance_mandatory: await this.isComplianceMandatory(section),
          our_capability_match: await this.assessCapabilityMatch(section),
          supporting_evidence: [],
          risk_factors: []
        };
        requirements.push(req);
      }
    }
    
    return requirements;
  }

  private isRequirementSection(text: string): boolean {
    const requirementIndicators = [
      'must', 'shall', 'required', 'requirement', 'needs to', 'should be able to'
    ];
    const lowerText = text.toLowerCase();
    return requirementIndicators.some(indicator => lowerText.includes(indicator));
  }

  private async categorizeRequirement(text: string): Promise<RequirementCategory> {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('security') || lowerText.includes('encryption')) {
      return RequirementCategory.SECURITY;
    }
    if (lowerText.includes('performance') || lowerText.includes('speed')) {
      return RequirementCategory.PERFORMANCE;
    }
    if (lowerText.includes('compliance') || lowerText.includes('regulation')) {
      return RequirementCategory.COMPLIANCE;
    }
    if (lowerText.includes('integration') || lowerText.includes('api')) {
      return RequirementCategory.INTEGRATION;
    }
    if (lowerText.includes('technical') || lowerText.includes('system')) {
      return RequirementCategory.TECHNICAL;
    }
    if (lowerText.includes('support') || lowerText.includes('service')) {
      return RequirementCategory.SUPPORT;
    }
    if (lowerText.includes('price') || lowerText.includes('cost')) {
      return RequirementCategory.PRICING;
    }
    
    return RequirementCategory.FUNCTIONAL;
  }

  private async assessCapabilityMatch(text: string): Promise<CapabilityMatch> {
    // Simplified capability assessment
    const lowerText = text.toLowerCase();
    let score = 50; // Default neutral score
    
    // Check against known Zenloop capabilities
    if (lowerText.includes('feedback') || lowerText.includes('survey')) score += 30;
    if (lowerText.includes('analytics') || lowerText.includes('reporting')) score += 20;
    if (lowerText.includes('gdpr') || lowerText.includes('compliance')) score += 25;
    if (lowerText.includes('api') || lowerText.includes('integration')) score += 15;
    
    // Cap at 100
    score = Math.min(score, 100);
    
    let status: MatchStatus;
    if (score >= 80) status = MatchStatus.FULL_MATCH;
    else if (score >= 50) status = MatchStatus.PARTIAL_MATCH;
    else status = MatchStatus.NO_MATCH;
    
    return {
      score,
      status,
      evidence: [],
      gaps: [],
      mitigation_strategies: []
    };
  }

  // Placeholder implementations for other methods
  private async extractClientInsights(document: Document, metadata: any): Promise<any> { return {}; }
  private async storeQuestionPattern(pattern: QuestionPattern): Promise<void> {}
  private async updateKnowledgeFromDocument(document: Document, requirements: Requirement[], metadata: any): Promise<void> {}
  private async updateClientProfile(clientName: string, insights: any): Promise<void> {}
  private async findResponseDocument(rfpId: string): Promise<Document | null> { return null; }
  private async analyzeWinningResponse(rfp: Document, response: Document): Promise<WinningResponse[]> { return []; }
  private async storeWinningResponse(pattern: WinningResponse): Promise<void> {}
  private async findOrCreateQuestionPattern(question: string): Promise<QuestionPattern> { 
    return {} as QuestionPattern; 
  }
  private async createKnowledgeRelationships(): Promise<void> {}
  private async updateSearchIndices(): Promise<void> {}
  private normalizeRequirement(text: string): string { return text.toLowerCase().trim(); }
  private async assessCriticality(text: string, frequency: number, total: number): Promise<any> { return 'unknown'; }
  private async isComplianceMandatory(text: string): Promise<boolean> { 
    return text.toLowerCase().includes('mandatory') || text.toLowerCase().includes('required');
  }
  private async classifyDocumentSections(document: Document): Promise<any[]> { return []; }
  private async extractKnowledgeFromSection(section: any, document: Document): Promise<KnowledgeEntry[]> { return []; }
  private async scoreKnowledgeConfidence(entry: KnowledgeEntry): Promise<number> { return 0.8; }
  private async storeKnowledgeEntry(entry: KnowledgeEntry): Promise<void> {}
  private async resolveKnowledgeConflicts(entries: KnowledgeEntry[]): Promise<void> {}
  private async updatePatterns(document: Document): Promise<void> {}
  private async adjustConfidenceScores(response: WinningResponse, feedback: LearningFeedback): Promise<void> {}
  private async updateWinRates(response: WinningResponse, outcome: WinStatus): Promise<void> {}
  private async getHistoricalRFPs(): Promise<Document[]> { return []; }
  private async calculateSimilarity(doc1: Document, doc2: Document): Promise<number> { return 0.5; }
  private async identifySimilarities(doc1: Document, doc2: Document): Promise<string[]> { return []; }
  private async identifyDifferences(doc1: Document, doc2: Document): Promise<string[]> { return []; }
  private async extractLessonsLearned(document: Document): Promise<string[]> { return []; }
  private async getDocument(id: string): Promise<Document | null> { return this.documentCache.get(id) || null; }
  private async assessRisks(document: Document, requirements: Requirement[]): Promise<RiskAssessment> {
    return {
      overall_risk_score: 30,
      risk_factors: [],
      mitigation_strategies: [],
      red_flags: [],
      complexity_assessment: {
        technical_complexity: 5,
        commercial_complexity: 3,
        timeline_pressure: 4,
        resource_requirements: {
          technical_writers: 2,
          subject_matter_experts: 1,
          sales_support: 1,
          executive_involvement: false
        },
        estimated_effort_hours: 40
      }
    };
  }
  private async calculateOpportunityScore(document: Document, similarRFPs: SimilarRFP[]): Promise<number> { return 75; }
  private async generateResponseStrategy(document: Document, requirements: Requirement[], similar: SimilarRFP[], risks: RiskAssessment): Promise<ResponseStrategy> {
    return {} as ResponseStrategy;
  }
  private async identifyKnowledgeGaps(requirements: Requirement[]): Promise<any[]> { return []; }
  private async performCompetitiveAnalysis(document: Document, similar: SimilarRFP[]): Promise<any> { return {}; }
  private async calculateAnalysisConfidence(analysis: RFPAnalysis): Promise<number> { return 0.85; }
  private async generateActionableRecommendations(analysis: RFPAnalysis): Promise<string[]> { 
    return [
      'Focus on compliance and security differentiators',
      'Leverage customer success stories from similar industries',
      'Address technical requirements with detailed specifications'
    ]; 
  }
  private async parseQueryIntent(query: string): Promise<any> { return {}; }
  private async searchKnowledgeEntries(query: string, context: any, maxResults: number): Promise<any[]> { 
    // Enhanced search that includes Zenloop knowledge base
    const results: any[] = [];
    
    // Search local knowledge base
    const localResults = Array.from(this.knowledgeBase.values())
      .filter(entry => 
        entry.content.toLowerCase().includes(query.toLowerCase())
      )
      .map(entry => ({
        knowledge_entry: entry,
        relevance_score: this.calculateRelevanceScore(entry, query),
        supporting_documents: [entry.source_documents].flat(),
        related_patterns: []
      }));
    
    results.push(...localResults);
    
    // Also search the Zenloop knowledge base directly
    try {
      const zenloopResults = await knowledgeIngestion.searchZenloopKnowledge(query, maxResults);
      const transformedResults = zenloopResults.map(result => ({
        knowledge_entry: {
          id: result.id,
          content: result.content,
          type: 'zenloop-kb' as any,
          source_documents: [result.source],
          confidence_score: result.confidence,
          validation_status: 'validated' as any,
          metadata: {
            industry_relevance: [Industry.TECHNOLOGY],
            source: result.source
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          usage_count: 0
        },
        relevance_score: result.confidence,
        supporting_documents: [result.source],
        related_patterns: []
      }));
      
      results.push(...transformedResults);
    } catch (error) {
      console.warn('Failed to search Zenloop knowledge base:', error);
    }
    
    // Sort by relevance and limit results
    return results
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, maxResults);
  }

  private calculateRelevanceScore(entry: KnowledgeEntry, query: string): number {
    const queryLower = query.toLowerCase();
    const contentLower = entry.content.toLowerCase();
    
    let score = 0;
    
    // Exact phrase match
    if (contentLower.includes(queryLower)) {
      score += 0.8;
    }
    
    // Individual word matches
    const queryWords = queryLower.split(' ');
    const contentWords = contentLower.split(' ');
    const matchCount = queryWords.filter(word => contentWords.includes(word)).length;
    score += (matchCount / queryWords.length) * 0.6;
    
    // Boost for high confidence entries
    score *= entry.confidence_score;
    
    return Math.min(score, 1.0);
  }
}

// Export singleton instance
export const rfpAnalyzer = new RFPAnalyzer();