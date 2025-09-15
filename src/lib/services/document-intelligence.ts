import { 
  Document, 
  DocumentType, 
  KnowledgeEntry, 
  Requirement, 
  RequirementCategory,
  Industry,
  WinStatus 
} from '../types/rfp-analyzer';

export interface DocumentSection {
  id: string;
  title: string;
  content: string;
  type: SectionType;
  confidence: number;
  metadata: Record<string, any>;
}

export enum SectionType {
  EXECUTIVE_SUMMARY = 'executive_summary',
  REQUIREMENTS = 'requirements',
  EVALUATION_CRITERIA = 'evaluation_criteria',
  SUBMISSION_GUIDELINES = 'submission_guidelines',
  TECHNICAL_SPECIFICATIONS = 'technical_specifications',
  COMPLIANCE_REQUIREMENTS = 'compliance_requirements',
  PRICING_INFORMATION = 'pricing_information',
  COMPANY_BACKGROUND = 'company_background',
  CASE_STUDY = 'case_study',
  TIMELINE = 'timeline'
}

export interface ExtractionResult {
  sections: DocumentSection[];
  metadata: DocumentExtractionMetadata;
  knowledgeEntries: KnowledgeEntry[];
  requirements: Requirement[];
  qualityScore: number;
}

export interface DocumentExtractionMetadata {
  documentType: DocumentType;
  industry: Industry;
  complexity: number;
  language: string;
  extractionDate: string;
  processingTime: number;
  clientIndicators: string[];
  dealSizeIndicators: string[];
  competitorMentions: string[];
}

export class DocumentIntelligenceService {
  private sectionPatterns: Map<SectionType, RegExp[]> = new Map();
  private requirementIndicators: RegExp[] = [];
  private complianceKeywords: string[] = [];
  private industryKeywords: Map<Industry, string[]> = new Map();

  constructor() {
    this.initializePatterns();
  }

  // A. Document Ingestion & Classification
  async processDocument(document: Document): Promise<ExtractionResult> {
    const startTime = Date.now();
    console.log(`Processing document: ${document.name}`);

    // Auto-detect document type if not already classified
    if (!document.type || document.type === DocumentType.COMPANY_DOC) {
      document.type = await this.autoDetectDocumentType(document);
    }

    // Extract metadata
    const metadata = await this.extractDocumentMetadata(document);

    // Identify document sections
    const sections = await this.identifyDocumentSections(document);

    // Extract knowledge entries
    const knowledgeEntries = await this.extractKnowledgeFromSections(sections, document);

    // Extract requirements (if RFP)
    const requirements = document.type === DocumentType.RFP ? 
      await this.extractRequirementsFromSections(sections) : [];

    // Calculate quality score
    const qualityScore = await this.calculateExtractionQuality(sections, knowledgeEntries);

    const processingTime = Date.now() - startTime;
    metadata.processingTime = processingTime;

    console.log(`Document processed in ${processingTime}ms with quality score: ${qualityScore}`);

    return {
      sections,
      metadata,
      knowledgeEntries,
      requirements,
      qualityScore
    };
  }

  async autoDetectDocumentType(document: Document): Promise<DocumentType> {
    const content = document.content.toLowerCase();
    const name = document.name.toLowerCase();

    // RFP Detection
    const rfpIndicators = [
      'request for proposal', 'rfp', 'proposal submission', 'bid request',
      'evaluation criteria', 'submission requirements', 'proposal requirements'
    ];
    if (this.containsKeywords(content, rfpIndicators) || this.containsKeywords(name, rfpIndicators)) {
      return DocumentType.RFP;
    }

    // RFP Response Detection
    const responseIndicators = [
      'proposal response', 'rfp response', 'our proposal', 'technical proposal',
      'executive summary', 'company overview', 'proposed solution'
    ];
    if (this.containsKeywords(content, responseIndicators) || this.containsKeywords(name, responseIndicators)) {
      return DocumentType.RFP_RESPONSE;
    }

    // Case Study Detection
    const caseStudyIndicators = [
      'case study', 'customer success', 'implementation', 'results achieved',
      'challenge', 'solution', 'outcome', 'customer story'
    ];
    if (this.containsKeywords(content, caseStudyIndicators) || this.containsKeywords(name, caseStudyIndicators)) {
      return DocumentType.CASE_STUDY;
    }

    // Pricing Sheet Detection
    const pricingIndicators = [
      'pricing', 'price list', 'cost', 'quote', 'rates', 'fees',
      'subscription', 'package', 'plan', 'tier'
    ];
    if (this.containsKeywords(content, pricingIndicators) || this.containsKeywords(name, pricingIndicators)) {
      return DocumentType.PRICING_SHEET;
    }

    // Technical Documentation Detection
    const technicalIndicators = [
      'api documentation', 'technical specification', 'integration guide',
      'developer guide', 'architecture', 'system requirements'
    ];
    if (this.containsKeywords(content, technicalIndicators) || this.containsKeywords(name, technicalIndicators)) {
      return DocumentType.TECHNICAL_DOC;
    }

    // Compliance Documentation Detection
    const complianceIndicators = [
      'compliance', 'regulation', 'gdpr', 'hipaa', 'sox', 'iso',
      'certification', 'audit', 'security policy'
    ];
    if (this.containsKeywords(content, complianceIndicators) || this.containsKeywords(name, complianceIndicators)) {
      return DocumentType.COMPLIANCE_DOC;
    }

    // Default to company document
    return DocumentType.COMPANY_DOC;
  }

  async extractDocumentMetadata(document: Document): Promise<DocumentExtractionMetadata> {
    const content = document.content.toLowerCase();
    
    // Detect industry
    const industry = await this.detectIndustry(content);
    
    // Assess complexity
    const complexity = await this.assessDocumentComplexity(document);
    
    // Detect language (simplified)
    const language = this.detectLanguage(content);
    
    // Find client indicators
    const clientIndicators = this.extractClientIndicators(content);
    
    // Find deal size indicators
    const dealSizeIndicators = this.extractDealSizeIndicators(content);
    
    // Find competitor mentions
    const competitorMentions = this.extractCompetitorMentions(content);

    return {
      documentType: document.type,
      industry,
      complexity,
      language,
      extractionDate: new Date().toISOString(),
      processingTime: 0, // Will be set later
      clientIndicators,
      dealSizeIndicators,
      competitorMentions
    };
  }

  async identifyDocumentSections(document: Document): Promise<DocumentSection[]> {
    const sections: DocumentSection[] = [];
    const content = document.content;
    
    // Split document into potential sections
    const paragraphs = content.split(/\n\s*\n/);
    let currentSection: DocumentSection | null = null;
    
    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i].trim();
      if (!paragraph) continue;

      // Check if this paragraph starts a new section
      const sectionType = await this.identifySectionType(paragraph);
      
      if (sectionType) {
        // Save previous section if exists
        if (currentSection) {
          sections.push(currentSection);
        }
        
        // Start new section
        currentSection = {
          id: `section-${i}`,
          title: this.extractSectionTitle(paragraph),
          content: paragraph,
          type: sectionType,
          confidence: await this.calculateSectionConfidence(paragraph, sectionType),
          metadata: {}
        };
      } else if (currentSection) {
        // Add to current section
        currentSection.content += '\n\n' + paragraph;
      } else {
        // Create a general content section
        currentSection = {
          id: `section-${i}`,
          title: 'Content',
          content: paragraph,
          type: SectionType.COMPANY_BACKGROUND,
          confidence: 0.5,
          metadata: {}
        };
      }
    }
    
    // Add final section
    if (currentSection) {
      sections.push(currentSection);
    }
    
    return sections;
  }

  // B. Knowledge Extraction
  async extractKnowledgeFromSections(sections: DocumentSection[], document: Document): Promise<KnowledgeEntry[]> {
    const knowledgeEntries: KnowledgeEntry[] = [];
    
    for (const section of sections) {
      const entries = await this.extractKnowledgeFromSection(section, document);
      knowledgeEntries.push(...entries);
    }
    
    return knowledgeEntries;
  }

  private async extractKnowledgeFromSection(section: DocumentSection, document: Document): Promise<KnowledgeEntry[]> {
    const entries: KnowledgeEntry[] = [];
    const sentences = this.splitIntoSentences(section.content);
    
    for (const sentence of sentences) {
      if (await this.isValuableKnowledge(sentence)) {
        const entry: KnowledgeEntry = {
          id: this.generateId(),
          content: sentence,
          type: await this.categorizeKnowledge(sentence, section.type),
          source_documents: [document.id],
          confidence_score: await this.scoreKnowledgeConfidence(sentence, section),
          validation_status: 'pending' as any,
          metadata: {
            industry_relevance: [document.metadata?.industry || Industry.OTHER],
            deal_size_applicability: 'medium' as any,
            geographic_scope: ['global'],
            last_validated: new Date().toISOString(),
            validator: 'system',
            business_impact: await this.assessBusinessImpact(sentence)
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          usage_count: 0
        };
        
        entries.push(entry);
      }
    }
    
    return entries;
  }

  // C. Pattern Recognition
  async extractRequirementsFromSections(sections: DocumentSection[]): Promise<Requirement[]> {
    const requirements: Requirement[] = [];
    
    for (const section of sections) {
      if (this.isRequirementSection(section)) {
        const sectionRequirements = await this.parseRequirementsFromContent(section.content);
        requirements.push(...sectionRequirements);
      }
    }
    
    return requirements;
  }

  private async parseRequirementsFromContent(content: string): Promise<Requirement[]> {
    const requirements: Requirement[] = [];
    const sentences = this.splitIntoSentences(content);
    
    for (const sentence of sentences) {
      if (await this.isRequirement(sentence)) {
        const requirement: Requirement = {
          id: this.generateId(),
          text: sentence,
          category: await this.categorizeRequirement(sentence),
          criticality: await this.assessRequirementCriticality(sentence),
          compliance_mandatory: await this.isComplianceMandatory(sentence),
          our_capability_match: await this.assessCapabilityMatch(sentence),
          supporting_evidence: [],
          risk_factors: await this.identifyRiskFactors(sentence)
        };
        
        requirements.push(requirement);
      }
    }
    
    return requirements;
  }

  // Helper Methods
  private initializePatterns(): void {
    // Initialize section patterns
    this.sectionPatterns.set(SectionType.EXECUTIVE_SUMMARY, [
      /executive\s+summary/i,
      /overview/i,
      /introduction/i
    ]);
    
    this.sectionPatterns.set(SectionType.REQUIREMENTS, [
      /requirements?/i,
      /specifications?/i,
      /needs?/i,
      /must\s+have/i
    ]);
    
    this.sectionPatterns.set(SectionType.EVALUATION_CRITERIA, [
      /evaluation\s+criteria/i,
      /scoring/i,
      /assessment/i,
      /selection\s+criteria/i
    ]);

    // Initialize requirement indicators
    this.requirementIndicators = [
      /\b(must|shall|will|should|need|require)\b/i,
      /\bis\s+required\b/i,
      /\bmandatory\b/i,
      /\bessential\b/i
    ];

    // Initialize compliance keywords
    this.complianceKeywords = [
      'gdpr', 'hipaa', 'sox', 'pci', 'iso', 'compliance', 'regulation',
      'audit', 'certification', 'standard', 'policy'
    ];

    // Initialize industry keywords
    this.industryKeywords.set(Industry.HEALTHCARE, [
      'patient', 'medical', 'healthcare', 'hospital', 'clinic', 'emr', 'ehr', 'hipaa'
    ]);
    
    this.industryKeywords.set(Industry.FINANCE, [
      'financial', 'bank', 'investment', 'trading', 'payment', 'credit', 'loan', 'sox'
    ]);
    
    this.industryKeywords.set(Industry.TECHNOLOGY, [
      'software', 'api', 'cloud', 'saas', 'platform', 'integration', 'development'
    ]);
  }

  private containsKeywords(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword.toLowerCase()));
  }

  private async detectIndustry(content: string): Promise<Industry> {
    const scores = new Map<Industry, number>();
    
    for (const [industry, keywords] of this.industryKeywords.entries()) {
      const score = keywords.reduce((acc, keyword) => {
        const matches = (content.match(new RegExp(keyword, 'gi')) || []).length;
        return acc + matches;
      }, 0);
      scores.set(industry, score);
    }
    
    // Find industry with highest score
    let maxScore = 0;
    let detectedIndustry = Industry.OTHER;
    
    for (const [industry, score] of scores.entries()) {
      if (score > maxScore) {
        maxScore = score;
        detectedIndustry = industry;
      }
    }
    
    return detectedIndustry;
  }

  private async assessDocumentComplexity(document: Document): Promise<number> {
    const content = document.content;
    let complexity = 1;
    
    // Factors that increase complexity
    if (content.length > 10000) complexity += 2;
    if (content.length > 50000) complexity += 3;
    
    // Technical terms
    const technicalTerms = ['api', 'integration', 'architecture', 'protocol', 'algorithm'];
    const technicalCount = technicalTerms.reduce((acc, term) => 
      acc + (content.toLowerCase().match(new RegExp(term, 'g')) || []).length, 0);
    complexity += Math.min(technicalCount / 10, 3);
    
    // Compliance requirements
    const complianceCount = this.complianceKeywords.reduce((acc, keyword) => 
      acc + (content.toLowerCase().match(new RegExp(keyword, 'g')) || []).length, 0);
    complexity += Math.min(complianceCount / 5, 2);
    
    return Math.min(complexity, 10);
  }

  private detectLanguage(content: string): string {
    // Simplified language detection
    const englishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with'];
    const englishCount = englishWords.reduce((acc, word) => 
      acc + (content.toLowerCase().match(new RegExp(`\\b${word}\\b`, 'g')) || []).length, 0);
    
    return englishCount > 10 ? 'en' : 'unknown';
  }

  private extractClientIndicators(content: string): string[] {
    const indicators: string[] = [];
    
    // Company name patterns
    const companyPatterns = [
      /\b([A-Z][a-z]+\s+(Inc|Corp|Ltd|LLC|Company|Corporation))\b/g,
      /\b([A-Z][a-z]+\s+[A-Z][a-z]+\s+(Inc|Corp|Ltd|LLC))\b/g
    ];
    
    for (const pattern of companyPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        indicators.push(...matches);
      }
    }
    
    return [...new Set(indicators)]; // Remove duplicates
  }

  private extractDealSizeIndicators(content: string): string[] {
    const indicators: string[] = [];
    
    // Budget/value patterns
    const budgetPatterns = [
      /\$[\d,]+(?:\.\d+)?[KMB]?/g,
      /budget\s+of\s+[\$\d,]+/gi,
      /value\s+[\$\d,]+/gi
    ];
    
    for (const pattern of budgetPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        indicators.push(...matches);
      }
    }
    
    return indicators;
  }

  private extractCompetitorMentions(content: string): string[] {
    const competitors = [
      'salesforce', 'hubspot', 'microsoft', 'oracle', 'sap', 'workday',
      'servicenow', 'tableau', 'power bi', 'qlik', 'looker'
    ];
    
    return competitors.filter(competitor => 
      content.toLowerCase().includes(competitor.toLowerCase()));
  }

  private async identifySectionType(paragraph: string): Promise<SectionType | null> {
    const lowerParagraph = paragraph.toLowerCase();
    
    for (const [sectionType, patterns] of this.sectionPatterns.entries()) {
      for (const pattern of patterns) {
        if (pattern.test(lowerParagraph)) {
          return sectionType;
        }
      }
    }
    
    return null;
  }

  private extractSectionTitle(paragraph: string): string {
    // Extract first line as title, or first sentence if no clear line break
    const lines = paragraph.split('\n');
    const firstLine = lines[0].trim();
    
    // If first line is short and looks like a title
    if (firstLine.length < 100 && !firstLine.endsWith('.')) {
      return firstLine;
    }
    
    // Otherwise extract first sentence
    const sentences = paragraph.split(/[.!?]/);
    return sentences[0].trim();
  }

  private async calculateSectionConfidence(content: string, sectionType: SectionType): Promise<number> {
    const patterns = this.sectionPatterns.get(sectionType) || [];
    let confidence = 0.5; // Base confidence
    
    for (const pattern of patterns) {
      if (pattern.test(content.toLowerCase())) {
        confidence += 0.2;
      }
    }
    
    return Math.min(confidence, 1.0);
  }

  private splitIntoSentences(text: string): string[] {
    return text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
  }

  private async isValuableKnowledge(sentence: string): boolean {
    // Check if sentence contains valuable information
    const valuableIndicators = [
      'we provide', 'our solution', 'zenloop offers', 'capability', 'feature',
      'benefit', 'advantage', 'compliance', 'certified', 'proven', 'experience'
    ];
    
    const lowerSentence = sentence.toLowerCase();
    return valuableIndicators.some(indicator => lowerSentence.includes(indicator));
  }

  private async categorizeKnowledge(sentence: string, sectionType: SectionType): Promise<any> {
    const lowerSentence = sentence.toLowerCase();
    
    if (lowerSentence.includes('price') || lowerSentence.includes('cost')) return 'pricing';
    if (lowerSentence.includes('compliance') || lowerSentence.includes('regulation')) return 'compliance';
    if (lowerSentence.includes('case study') || lowerSentence.includes('customer')) return 'case_study';
    if (lowerSentence.includes('technical') || lowerSentence.includes('api')) return 'technical_spec';
    if (lowerSentence.includes('advantage') || lowerSentence.includes('unique')) return 'differentiator';
    
    return 'capability';
  }

  private async scoreKnowledgeConfidence(sentence: string, section: DocumentSection): Promise<number> {
    let confidence = 0.5;
    
    // Boost confidence for specific indicators
    if (sentence.includes('certified') || sentence.includes('proven')) confidence += 0.2;
    if (sentence.includes('years of experience')) confidence += 0.15;
    if (section.confidence > 0.8) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  private async assessBusinessImpact(sentence: string): Promise<any> {
    const highImpactIndicators = ['critical', 'essential', 'key', 'primary'];
    const lowerSentence = sentence.toLowerCase();
    
    if (highImpactIndicators.some(indicator => lowerSentence.includes(indicator))) {
      return 'high';
    }
    
    return 'medium';
  }

  private isRequirementSection(section: DocumentSection): boolean {
    return [
      SectionType.REQUIREMENTS,
      SectionType.TECHNICAL_SPECIFICATIONS,
      SectionType.COMPLIANCE_REQUIREMENTS
    ].includes(section.type);
  }

  private async isRequirement(sentence: string): boolean {
    return this.requirementIndicators.some(pattern => pattern.test(sentence));
  }

  private async categorizeRequirement(sentence: string): Promise<RequirementCategory> {
    const lowerSentence = sentence.toLowerCase();
    
    if (lowerSentence.includes('security') || lowerSentence.includes('encrypt')) {
      return RequirementCategory.SECURITY;
    }
    if (lowerSentence.includes('performance') || lowerSentence.includes('speed')) {
      return RequirementCategory.PERFORMANCE;
    }
    if (lowerSentence.includes('compliance') || lowerSentence.includes('regulation')) {
      return RequirementCategory.COMPLIANCE;
    }
    if (lowerSentence.includes('integration') || lowerSentence.includes('api')) {
      return RequirementCategory.INTEGRATION;
    }
    
    return RequirementCategory.FUNCTIONAL;
  }

  private async assessRequirementCriticality(sentence: string): Promise<any> {
    const lowerSentence = sentence.toLowerCase();
    
    if (lowerSentence.includes('must') || lowerSentence.includes('mandatory')) {
      return 'must_have';
    }
    if (lowerSentence.includes('should') || lowerSentence.includes('preferred')) {
      return 'should_have';
    }
    if (lowerSentence.includes('nice') || lowerSentence.includes('optional')) {
      return 'nice_to_have';
    }
    
    return 'unknown';
  }

  private async isComplianceMandatory(sentence: string): Promise<boolean> {
    const mandatoryIndicators = ['mandatory', 'required', 'must comply', 'shall comply'];
    const lowerSentence = sentence.toLowerCase();
    
    return mandatoryIndicators.some(indicator => lowerSentence.includes(indicator));
  }

  private async assessCapabilityMatch(sentence: string): Promise<any> {
    // This would integrate with knowledge base to assess our capabilities
    return {
      score: 70,
      status: 'partial_match',
      evidence: [],
      gaps: [],
      mitigation_strategies: []
    };
  }

  private async identifyRiskFactors(sentence: string): Promise<string[]> {
    const riskFactors: string[] = [];
    const lowerSentence = sentence.toLowerCase();
    
    if (lowerSentence.includes('custom') || lowerSentence.includes('proprietary')) {
      riskFactors.push('Custom development required');
    }
    if (lowerSentence.includes('tight timeline') || lowerSentence.includes('urgent')) {
      riskFactors.push('Timeline pressure');
    }
    if (lowerSentence.includes('budget') && lowerSentence.includes('limited')) {
      riskFactors.push('Budget constraints');
    }
    
    return riskFactors;
  }

  private async calculateExtractionQuality(sections: DocumentSection[], entries: KnowledgeEntry[]): Promise<number> {
    let qualityScore = 0.5;
    
    // Factor in section confidence
    const avgSectionConfidence = sections.reduce((acc, section) => acc + section.confidence, 0) / sections.length;
    qualityScore += avgSectionConfidence * 0.3;
    
    // Factor in knowledge extraction success
    const avgKnowledgeConfidence = entries.reduce((acc, entry) => acc + entry.confidence_score, 0) / entries.length;
    qualityScore += avgKnowledgeConfidence * 0.3;
    
    // Factor in coverage
    if (sections.length >= 3) qualityScore += 0.1;
    if (entries.length >= 5) qualityScore += 0.1;
    
    return Math.min(qualityScore, 1.0);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
}

// Export singleton instance
export const documentIntelligence = new DocumentIntelligenceService();