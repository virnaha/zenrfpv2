// Core data models for the intelligent RFP analysis system

export interface Document {
  id: string;
  name: string;
  content: string;
  type: DocumentType;
  metadata: DocumentMetadata;
  created_at: string;
  updated_at: string;
}

export enum DocumentType {
  RFP = 'rfp',
  RFP_RESPONSE = 'rfp_response',
  TECHNICAL_DOC = 'technical_doc',
  CASE_STUDY = 'case_study',
  PRICING_SHEET = 'pricing_sheet',
  COMPLIANCE_DOC = 'compliance_doc',
  COMPANY_DOC = 'company_doc'
}

export interface DocumentMetadata {
  client_name?: string;
  industry: Industry;
  deal_size?: number;
  win_status?: WinStatus;
  submission_date?: string;
  decision_date?: string;
  confidence_score: number;
  tags: string[];
  source: string;
  language: string;
  region: string;
}

export enum Industry {
  HEALTHCARE = 'healthcare',
  FINANCE = 'finance',
  TECHNOLOGY = 'technology',
  MANUFACTURING = 'manufacturing',
  EDUCATION = 'education',
  GOVERNMENT = 'government',
  RETAIL = 'retail',
  ENERGY = 'energy',
  OTHER = 'other'
}

export enum WinStatus {
  WON = 'won',
  LOST = 'lost',
  NO_DECISION = 'no_decision',
  PENDING = 'pending',
  UNKNOWN = 'unknown'
}

// Knowledge Base Structures
export interface KnowledgeEntry {
  id: string;
  content: string;
  type: KnowledgeType;
  source_documents: string[];
  confidence_score: number;
  validation_status: ValidationStatus;
  metadata: KnowledgeMetadata;
  created_at: string;
  updated_at: string;
  usage_count: number;
}

export enum KnowledgeType {
  CAPABILITY = 'capability',
  PRICING = 'pricing',
  CASE_STUDY = 'case_study',
  TECHNICAL_SPEC = 'technical_spec',
  COMPLIANCE = 'compliance',
  DIFFERENTIATOR = 'differentiator',
  OBJECTION_HANDLING = 'objection_handling'
}

export enum ValidationStatus {
  VALIDATED = 'validated',
  PENDING = 'pending',
  REJECTED = 'rejected',
  OUTDATED = 'outdated'
}

export interface KnowledgeMetadata {
  industry_relevance: Industry[];
  deal_size_applicability: DealSizeRange;
  geographic_scope: string[];
  last_validated: string;
  validator: string;
  business_impact: BusinessImpact;
}

export enum DealSizeRange {
  SMALL = 'small',      // < $100K
  MEDIUM = 'medium',    // $100K - $1M
  LARGE = 'large',      // $1M - $10M
  ENTERPRISE = 'enterprise' // > $10M
}

export enum BusinessImpact {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

// Question Pattern Analysis
export interface QuestionPattern {
  id: string;
  canonical_form: string;
  variations: string[];
  intent: QuestionIntent;
  industry_frequency: Record<Industry, number>;
  typical_responses: string[];
  winning_response_ids: string[];
  complexity_score: number;
  keywords: string[];
}

export enum QuestionIntent {
  CAPABILITY_INQUIRY = 'capability_inquiry',
  PRICING_REQUEST = 'pricing_request',
  TECHNICAL_REQUIREMENT = 'technical_requirement',
  COMPLIANCE_CHECK = 'compliance_check',
  EXPERIENCE_VALIDATION = 'experience_validation',
  TIMELINE_INQUIRY = 'timeline_inquiry',
  SUPPORT_QUESTION = 'support_question'
}

// Winning Response Patterns
export interface WinningResponse {
  id: string;
  question_pattern_id: string;
  response_text: string;
  win_rate: number;
  usage_contexts: ResponseContext[];
  key_elements: string[];
  supporting_evidence: string[];
  competitive_advantages: string[];
  metadata: ResponseMetadata;
}

export interface ResponseContext {
  industry: Industry;
  deal_size: DealSizeRange;
  client_type: ClientType;
  competitive_situation: string[];
}

export enum ClientType {
  ENTERPRISE = 'enterprise',
  MID_MARKET = 'mid_market',
  SMB = 'smb',
  GOVERNMENT = 'government',
  NON_PROFIT = 'non_profit'
}

export interface ResponseMetadata {
  author: string;
  review_status: string;
  effectiveness_score: number;
  last_used: string;
  feedback_score: number;
}

// Client Intelligence
export interface ClientProfile {
  id: string;
  name: string;
  industry: Industry;
  size: ClientType;
  preferences: ClientPreferences;
  historical_interactions: HistoricalInteraction[];
  decision_makers: DecisionMaker[];
  competitive_landscape: CompetitorInfo[];
}

export interface ClientPreferences {
  communication_style: string;
  decision_timeline: string;
  evaluation_criteria_weights: Record<string, number>;
  preferred_proof_points: string[];
  past_objections: string[];
  successful_value_props: string[];
}

export interface HistoricalInteraction {
  date: string;
  type: InteractionType;
  outcome: WinStatus;
  key_insights: string[];
  lessons_learned: string[];
}

export enum InteractionType {
  RFP_RESPONSE = 'rfp_response',
  PROPOSAL = 'proposal',
  DISCOVERY_CALL = 'discovery_call',
  DEMO = 'demo',
  NEGOTIATION = 'negotiation'
}

export interface DecisionMaker {
  name: string;
  role: string;
  influence_level: InfluenceLevel;
  concerns: string[];
  motivations: string[];
}

export enum InfluenceLevel {
  CHAMPION = 'champion',
  INFLUENCER = 'influencer',
  DECISION_MAKER = 'decision_maker',
  USER = 'user',
  BLOCKER = 'blocker'
}

export interface CompetitorInfo {
  name: string;
  win_rate_against: number;
  key_differentiators: string[];
  common_objections: string[];
  pricing_position: PricingPosition;
}

export enum PricingPosition {
  PREMIUM = 'premium',
  COMPETITIVE = 'competitive',
  VALUE = 'value',
  BUDGET = 'budget'
}

// Analysis Results
export interface RFPAnalysis {
  id: string;
  rfp_document_id: string;
  analysis_date: string;
  similar_rfps: SimilarRFP[];
  extracted_requirements: Requirement[];
  risk_assessment: RiskAssessment;
  opportunity_score: number;
  recommended_strategy: ResponseStrategy;
  knowledge_gaps: KnowledgeGap[];
  competitive_analysis: CompetitiveAnalysis;
}

export interface SimilarRFP {
  document_id: string;
  similarity_score: number;
  outcome: WinStatus;
  key_similarities: string[];
  key_differences: string[];
  lessons_learned: string[];
}

export interface Requirement {
  id: string;
  text: string;
  category: RequirementCategory;
  criticality: Criticality;
  compliance_mandatory: boolean;
  our_capability_match: CapabilityMatch;
  supporting_evidence: string[];
  risk_factors: string[];
}

export enum RequirementCategory {
  FUNCTIONAL = 'functional',
  TECHNICAL = 'technical',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  COMPLIANCE = 'compliance',
  INTEGRATION = 'integration',
  SUPPORT = 'support',
  PRICING = 'pricing'
}

export enum Criticality {
  MUST_HAVE = 'must_have',
  SHOULD_HAVE = 'should_have',
  NICE_TO_HAVE = 'nice_to_have',
  UNKNOWN = 'unknown'
}

export interface CapabilityMatch {
  score: number; // 0-100
  status: MatchStatus;
  evidence: string[];
  gaps: string[];
  mitigation_strategies: string[];
}

export enum MatchStatus {
  FULL_MATCH = 'full_match',
  PARTIAL_MATCH = 'partial_match',
  NO_MATCH = 'no_match',
  UNKNOWN = 'unknown'
}

export interface RiskAssessment {
  overall_risk_score: number; // 0-100
  risk_factors: RiskFactor[];
  mitigation_strategies: string[];
  red_flags: string[];
  complexity_assessment: ComplexityAssessment;
}

export interface RiskFactor {
  type: RiskType;
  severity: RiskSeverity;
  description: string;
  probability: number; // 0-1
  impact: number; // 0-10
  mitigation: string;
}

export enum RiskType {
  TECHNICAL = 'technical',
  COMMERCIAL = 'commercial',
  TIMELINE = 'timeline',
  COMPLIANCE = 'compliance',
  COMPETITIVE = 'competitive',
  RESOURCE = 'resource'
}

export enum RiskSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export interface ComplexityAssessment {
  technical_complexity: number; // 0-10
  commercial_complexity: number; // 0-10
  timeline_pressure: number; // 0-10
  resource_requirements: ResourceRequirements;
  estimated_effort_hours: number;
}

export interface ResourceRequirements {
  technical_writers: number;
  subject_matter_experts: number;
  sales_support: number;
  executive_involvement: boolean;
}

export interface ResponseStrategy {
  approach: ResponseApproach;
  key_themes: string[];
  differentiation_strategy: string[];
  proof_points: string[];
  case_studies_to_include: string[];
  pricing_strategy: PricingStrategy;
  timeline: ResponseTimeline;
}

export enum ResponseApproach {
  TECHNICAL_LEADERSHIP = 'technical_leadership',
  VALUE_OPTIMIZATION = 'value_optimization',
  RELATIONSHIP_LEVERAGE = 'relationship_leverage',
  COMPETITIVE_DISPLACEMENT = 'competitive_displacement',
  SAFE_CHOICE = 'safe_choice'
}

export interface PricingStrategy {
  positioning: PricingPosition;
  discount_flexibility: number; // 0-100%
  value_justification: string[];
  competitive_comparison: boolean;
}

export interface ResponseTimeline {
  total_hours_estimated: number;
  critical_path_activities: string[];
  dependencies: string[];
  recommended_start_date: string;
  milestones: Milestone[];
}

export interface Milestone {
  name: string;
  date: string;
  deliverables: string[];
  dependencies: string[];
}

export interface KnowledgeGap {
  category: string;
  description: string;
  impact: BusinessImpact;
  suggested_research: string[];
  potential_sources: string[];
}

export interface CompetitiveAnalysis {
  likely_competitors: string[];
  our_win_probability: number; // 0-1
  key_differentiators: string[];
  competitive_risks: string[];
  recommended_positioning: string[];
}

// Learning and Feedback
export interface LearningFeedback {
  id: string;
  response_id: string;
  outcome: WinStatus;
  feedback_type: FeedbackType;
  lessons_learned: string[];
  what_worked: string[];
  what_didnt_work: string[];
  recommendations: string[];
  confidence_adjustment: number; // -1 to +1
}

export enum FeedbackType {
  WIN_LOSS_ANALYSIS = 'win_loss_analysis',
  USER_FEEDBACK = 'user_feedback',
  PERFORMANCE_REVIEW = 'performance_review',
  AUTOMATED_ANALYSIS = 'automated_analysis'
}

// Analytics and Metrics
export interface AnalyticsMetrics {
  knowledge_base_stats: KnowledgeBaseStats;
  performance_metrics: PerformanceMetrics;
  usage_analytics: UsageAnalytics;
  quality_metrics: QualityMetrics;
}

export interface KnowledgeBaseStats {
  total_documents: number;
  total_knowledge_entries: number;
  total_question_patterns: number;
  total_winning_responses: number;
  coverage_by_industry: Record<Industry, number>;
  last_updated: string;
}

export interface PerformanceMetrics {
  average_analysis_time: number;
  win_rate_improvement: number;
  time_saved_per_rfp: number;
  accuracy_score: number;
  user_satisfaction: number;
}

export interface UsageAnalytics {
  rfps_analyzed: number;
  knowledge_queries: number;
  most_used_patterns: QuestionPattern[];
  most_valuable_entries: KnowledgeEntry[];
  user_engagement: Record<string, number>;
}

export interface QualityMetrics {
  knowledge_accuracy: number;
  prediction_accuracy: number;
  response_relevance: number;
  coverage_gaps: string[];
  improvement_suggestions: string[];
}

// API Interfaces
export interface AnalyzeRFPRequest {
  document_id: string;
  analysis_depth: AnalysisDepth;
  include_competitive_analysis: boolean;
  include_similar_rfps: boolean;
  max_similar_rfps: number;
}

export enum AnalysisDepth {
  QUICK = 'quick',
  STANDARD = 'standard',
  COMPREHENSIVE = 'comprehensive'
}

export interface AnalyzeRFPResponse {
  analysis: RFPAnalysis;
  processing_time: number;
  confidence_score: number;
  recommendations: string[];
}

export interface QueryKnowledgeRequest {
  query: string;
  context?: QueryContext;
  max_results: number;
  min_confidence: number;
}

export interface QueryContext {
  industry?: Industry;
  client_type?: ClientType;
  deal_size?: DealSizeRange;
  question_intent?: QuestionIntent;
}

export interface QueryKnowledgeResponse {
  results: KnowledgeQueryResult[];
  total_results: number;
  processing_time: number;
}

export interface KnowledgeQueryResult {
  knowledge_entry: KnowledgeEntry;
  relevance_score: number;
  supporting_documents: Document[];
  related_patterns: QuestionPattern[];
}

// Enhanced Question Extraction Types
export interface ExtractedQuestion {
  id: string;
  originalText: string;
  normalizedText: string;
  subQuestions: SubQuestion[];
  category: QuestionCategory;
  complexity: QuestionComplexity;
  priority: QuestionPriority;
  requirementType: RequirementType;
  keywords: string[];
  isMultiPart: boolean;
  contextClues: string[];
  suggestedResponse?: string;
  confidenceScore: number;
  extractionMetadata: ExtractionMetadata;
}

export interface SubQuestion {
  id: string;
  text: string;
  category: QuestionCategory;
  requirementType: RequirementType;
  priority: QuestionPriority;
  parentQuestionId: string;
  orderIndex: number;
}

export enum QuestionCategory {
  TECHNICAL = 'technical',
  PRICING = 'pricing',
  SECURITY = 'security',
  COMPLIANCE = 'compliance',
  FUNCTIONAL = 'functional',
  PERFORMANCE = 'performance',
  INTEGRATION = 'integration',
  SUPPORT = 'support',
  IMPLEMENTATION = 'implementation',
  EXPERIENCE = 'experience',
  REFERENCE = 'reference'
}

export enum QuestionComplexity {
  SIMPLE = 'simple',        // Single requirement, clear answer
  MODERATE = 'moderate',    // Multiple aspects, straightforward
  COMPLEX = 'complex',      // Multiple requirements, interdependent
  VERY_COMPLEX = 'very_complex' // Multi-part, requires deep analysis
}

export enum QuestionPriority {
  CRITICAL = 'critical',    // Deal breaker if not answered well
  HIGH = 'high',           // Important for evaluation
  MEDIUM = 'medium',       // Standard question
  LOW = 'low',             // Nice to have
  INFORMATIONAL = 'informational' // For context only
}

export enum RequirementType {
  MANDATORY = 'mandatory',     // Must have
  PREFERRED = 'preferred',     // Should have
  OPTIONAL = 'optional',       // Nice to have
  INFORMATIONAL = 'informational', // For reference
  COMPLIANCE = 'compliance',   // Legal/regulatory requirement
  EVALUATION = 'evaluation'    // For scoring purposes
}

export interface ExtractionMetadata {
  sourceSection: string;
  pageNumber?: number;
  extractionMethod: string;
  processingTime: number;
  aiModel?: string;
  validatedBy?: string;
  lastUpdated: string;
}

// Question Analysis Results
export interface QuestionAnalysisResult {
  questions: ExtractedQuestion[];
  summary: QuestionExtractionSummary;
  recommendations: string[];
  processingMetrics: ProcessingMetrics;
}

export interface QuestionExtractionSummary {
  totalQuestions: number;
  questionsByCategory: Record<QuestionCategory, number>;
  questionsByComplexity: Record<QuestionComplexity, number>;
  questionsByPriority: Record<QuestionPriority, number>;
  multiPartQuestions: number;
  averageConfidence: number;
  coverageGaps: string[];
}

export interface ProcessingMetrics {
  totalProcessingTime: number;
  questionsExtracted: number;
  questionsNormalized: number;
  questionsValidated: number;
  averageConfidenceScore: number;
  qualityScore: number;
}