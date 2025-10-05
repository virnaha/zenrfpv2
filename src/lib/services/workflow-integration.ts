import { 
  Document, 
  RFPAnalysis, 
  WinStatus, 
  AnalyzeRFPRequest,
  AnalyzeRFPResponse 
} from '../types/rfp-analyzer';
import { rfpAnalyzer } from './rfp-analyzer';
import { learningEngine } from './learning-engine';
import { documentIntelligence } from './document-intelligence';

export interface WorkflowConfig {
  autoAnalyzeUploads: boolean;
  requireHumanReview: boolean;
  enableLearningFeedback: boolean;
  notificationSettings: NotificationSettings;
  qualityThresholds: QualityThresholds;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  slackIntegration: boolean;
  webhookUrl?: string;
  notifyOnHighOpportunity: boolean;
  notifyOnRisks: boolean;
}

export interface QualityThresholds {
  minimumConfidenceScore: number;
  minimumWinProbability: number;
  maximumRiskScore: number;
  requireReviewBelow: number;
}

export interface WorkflowState {
  id: string;
  documentId: string;
  currentStep: WorkflowStep;
  progress: number;
  status: WorkflowStatus;
  analysis?: RFPAnalysis;
  metadata: WorkflowMetadata;
  createdAt: string;
  updatedAt: string;
}

export enum WorkflowStep {
  DOCUMENT_UPLOAD = 'document_upload',
  DOCUMENT_PROCESSING = 'document_processing',
  INTELLIGENCE_EXTRACTION = 'intelligence_extraction',
  SIMILARITY_ANALYSIS = 'similarity_analysis',
  RISK_ASSESSMENT = 'risk_assessment',
  RESPONSE_GENERATION = 'response_generation',
  HUMAN_REVIEW = 'human_review',
  OUTCOME_TRACKING = 'outcome_tracking',
  LEARNING_UPDATE = 'learning_update',
  COMPLETED = 'completed'
}

export enum WorkflowStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  WAITING_REVIEW = 'waiting_review',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface WorkflowMetadata {
  assignedTo?: string;
  priority: WorkflowPriority;
  deadline?: string;
  tags: string[];
  estimatedEffort: number; // hours
  actualEffort?: number; // hours
  qualityScore?: number;
  clientNotified: boolean;
}

export enum WorkflowPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export class WorkflowIntegration {
  private config: WorkflowConfig;
  private activeWorkflows: Map<string, WorkflowState> = new Map();
  private workflowHistory: WorkflowState[] = [];

  constructor(config?: Partial<WorkflowConfig>) {
    this.config = {
      autoAnalyzeUploads: true,
      requireHumanReview: true,
      enableLearningFeedback: true,
      notificationSettings: {
        emailNotifications: false,
        slackIntegration: false,
        notifyOnHighOpportunity: true,
        notifyOnRisks: true
      },
      qualityThresholds: {
        minimumConfidenceScore: 0.7,
        minimumWinProbability: 0.3,
        maximumRiskScore: 80,
        requireReviewBelow: 0.6
      },
      ...config
    };
  }

  // Main Workflow Orchestration
  async processNewRFP(document: Document, metadata?: Partial<WorkflowMetadata>): Promise<string> {
    console.log(`Starting workflow for new RFP: ${document.name}`);

    const workflowId = this.generateWorkflowId();
    const workflow: WorkflowState = {
      id: workflowId,
      documentId: document.id,
      currentStep: WorkflowStep.DOCUMENT_UPLOAD,
      progress: 0,
      status: WorkflowStatus.IN_PROGRESS,
      metadata: {
        priority: WorkflowPriority.MEDIUM,
        tags: [],
        estimatedEffort: 8, // Default 8 hours
        clientNotified: false,
        ...metadata
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.activeWorkflows.set(workflowId, workflow);

    // Start asynchronous processing
    this.executeWorkflow(workflowId, document);

    return workflowId;
  }

  private async executeWorkflow(workflowId: string, document: Document): Promise<void> {
    try {
      let workflow = this.activeWorkflows.get(workflowId);
      if (!workflow) return;

      // Step 1: Document Processing
      workflow = await this.updateWorkflowStep(workflow, WorkflowStep.DOCUMENT_PROCESSING, 10);
      
      const processingResult = await documentIntelligence.processDocument(document);
      console.log(`Document processing completed with quality score: ${processingResult.qualityScore}`);

      // Step 2: Intelligence Extraction
      workflow = await this.updateWorkflowStep(workflow, WorkflowStep.INTELLIGENCE_EXTRACTION, 25);
      
      // Process extracted knowledge
      await this.processExtractedIntelligence(processingResult, workflow);

      // Step 3: Similarity Analysis
      workflow = await this.updateWorkflowStep(workflow, WorkflowStep.SIMILARITY_ANALYSIS, 40);
      
      const analysisRequest: AnalyzeRFPRequest = {
        document_id: document.id,
        analysis_depth: 'comprehensive',
        include_competitive_analysis: true,
        include_similar_rfps: true,
        max_similar_rfps: 5
      };

      const analysisResult = await rfpAnalyzer.analyzeRFP(analysisRequest);
      workflow.analysis = analysisResult.analysis;

      // Step 4: Risk Assessment
      workflow = await this.updateWorkflowStep(workflow, WorkflowStep.RISK_ASSESSMENT, 55);
      
      await this.assessWorkflowRisks(workflow);

      // Step 5: Response Generation
      workflow = await this.updateWorkflowStep(workflow, WorkflowStep.RESPONSE_GENERATION, 70);
      
      await this.generateInitialResponse(workflow);

      // Step 6: Quality Check and Human Review Decision
      if (this.requiresHumanReview(workflow)) {
        workflow = await this.updateWorkflowStep(workflow, WorkflowStep.HUMAN_REVIEW, 80);
        workflow.status = WorkflowStatus.WAITING_REVIEW;
        await this.notifyForReview(workflow);
      } else {
        workflow = await this.updateWorkflowStep(workflow, WorkflowStep.COMPLETED, 100);
        workflow.status = WorkflowStatus.COMPLETED;
      }

      // Send notifications
      await this.sendWorkflowNotifications(workflow);

    } catch (error) {
      console.error(`Workflow ${workflowId} failed:`, error);
      await this.handleWorkflowFailure(workflowId, error);
    }
  }

  // Workflow Step Management
  private async updateWorkflowStep(
    workflow: WorkflowState, 
    step: WorkflowStep, 
    progress: number
  ): Promise<WorkflowState> {
    workflow.currentStep = step;
    workflow.progress = progress;
    workflow.updatedAt = new Date().toISOString();
    
    this.activeWorkflows.set(workflow.id, workflow);
    
    console.log(`Workflow ${workflow.id}: ${step} (${progress}%)`);
    return workflow;
  }

  // Human Review Integration
  async submitHumanReview(
    workflowId: string, 
    reviewer: string, 
    approved: boolean, 
    feedback: string,
    modifications?: any
  ): Promise<void> {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow || workflow.currentStep !== WorkflowStep.HUMAN_REVIEW) {
      throw new Error('Workflow not found or not in review state');
    }

    console.log(`Human review submitted for workflow ${workflowId}: ${approved ? 'Approved' : 'Rejected'}`);

    // Record feedback for learning
    if (workflow.analysis) {
      await learningEngine.recordUserFeedback(
        workflow.analysis.id,
        'performance_review' as any,
        approved ? 5 : 2,
        [feedback],
        modifications ? [JSON.stringify(modifications)] : []
      );
    }

    if (approved) {
      // Move to completion
      await this.updateWorkflowStep(workflow, WorkflowStep.COMPLETED, 100);
      workflow.status = WorkflowStatus.COMPLETED;
    } else {
      // Return to response generation with feedback
      await this.updateWorkflowStep(workflow, WorkflowStep.RESPONSE_GENERATION, 70);
      await this.incorporateFeedback(workflow, feedback, modifications);
    }
  }

  // Outcome Tracking
  async recordRFPOutcome(
    workflowId: string, 
    outcome: WinStatus, 
    details: {
      winReason?: string;
      lossReason?: string;
      competitorsInvolved?: string[];
      keyDecisionFactors?: string[];
    }
  ): Promise<void> {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    console.log(`Recording outcome for workflow ${workflowId}: ${outcome}`);

    // Update workflow to outcome tracking
    await this.updateWorkflowStep(workflow, WorkflowStep.OUTCOME_TRACKING, 90);

    // Process outcome for learning
    await learningEngine.processWinLossOutcome(workflow.documentId, outcome, details);

    // Update to learning update step
    await this.updateWorkflowStep(workflow, WorkflowStep.LEARNING_UPDATE, 95);

    // Update knowledge base based on outcome
    await this.updateKnowledgeFromOutcome(workflow, outcome, details);

    // Complete workflow
    await this.updateWorkflowStep(workflow, WorkflowStep.COMPLETED, 100);
    workflow.status = WorkflowStatus.COMPLETED;

    // Move to history
    this.workflowHistory.push(workflow);
    this.activeWorkflows.delete(workflowId);
  }

  // Analytics and Reporting
  async getWorkflowAnalytics(): Promise<any> {
    const allWorkflows = [...this.activeWorkflows.values(), ...this.workflowHistory];
    
    return {
      total: allWorkflows.length,
      active: this.activeWorkflows.size,
      completed: this.workflowHistory.filter(w => w.status === WorkflowStatus.COMPLETED).length,
      averageProcessingTime: this.calculateAverageProcessingTime(allWorkflows),
      successRate: this.calculateSuccessRate(allWorkflows),
      commonBottlenecks: this.identifyBottlenecks(allWorkflows),
      qualityTrends: this.analyzeQualityTrends(allWorkflows)
    };
  }

  async exportWorkflowReport(): Promise<any> {
    const analytics = await this.getWorkflowAnalytics();
    const recentWorkflows = this.workflowHistory.slice(-10);
    
    return {
      summary: analytics,
      recentWorkflows: recentWorkflows.map(w => ({
        id: w.id,
        documentId: w.documentId,
        status: w.status,
        qualityScore: w.metadata.qualityScore,
        actualEffort: w.metadata.actualEffort,
        duration: this.calculateDuration(w)
      })),
      recommendations: await this.generateWorkflowRecommendations(),
      timestamp: new Date().toISOString()
    };
  }

  // Helper Methods
  private requiresHumanReview(workflow: WorkflowState): boolean {
    if (!this.config.requireHumanReview) return false;
    if (!workflow.analysis) return true;

    const analysis = workflow.analysis;
    
    // Require review if confidence is below threshold
    if (analysis.confidence_score < this.config.qualityThresholds.requireReviewBelow) {
      return true;
    }

    // Require review if risk is too high
    if (analysis.risk_assessment.overall_risk_score > this.config.qualityThresholds.maximumRiskScore) {
      return true;
    }

    // Require review if opportunity score is very high (important opportunity)
    if (analysis.opportunity_score > 85) {
      return true;
    }

    return false;
  }

  private async processExtractedIntelligence(result: any, workflow: WorkflowState): Promise<void> {
    // Store extracted knowledge entries
    for (const entry of result.knowledgeEntries) {
      // In a real implementation, this would save to database
      console.log(`Extracted knowledge: ${entry.content.substring(0, 100)}...`);
    }

    // Update workflow quality score
    workflow.metadata.qualityScore = result.qualityScore;
  }

  private async assessWorkflowRisks(workflow: WorkflowState): Promise<void> {
    if (!workflow.analysis) return;

    const risks = workflow.analysis.risk_assessment;
    
    // Check for critical risks
    const criticalRisks = risks.risk_factors.filter(risk => risk.severity === 'critical');
    
    if (criticalRisks.length > 0) {
      workflow.metadata.priority = WorkflowPriority.URGENT;
      console.log(`Critical risks identified for workflow ${workflow.id}`);
    }
  }

  private async generateInitialResponse(workflow: WorkflowState): Promise<void> {
    if (!workflow.analysis) return;

    // Generate response sections based on analysis
    const strategy = workflow.analysis.recommended_strategy;
    console.log(`Generated response strategy: ${strategy.approach}`);
    
    // This would generate actual response content in a real implementation
  }

  private async notifyForReview(workflow: WorkflowState): Promise<void> {
    console.log(`Workflow ${workflow.id} requires human review`);
    
    if (this.config.notificationSettings.emailNotifications) {
      // Send email notification
    }
    
    if (this.config.notificationSettings.slackIntegration) {
      // Send Slack notification
    }
  }

  private async sendWorkflowNotifications(workflow: WorkflowState): Promise<void> {
    if (!workflow.analysis) return;

    const settings = this.config.notificationSettings;
    
    if (settings.notifyOnHighOpportunity && workflow.analysis.opportunity_score > 80) {
      console.log(`High opportunity detected: ${workflow.analysis.opportunity_score}%`);
    }
    
    if (settings.notifyOnRisks && workflow.analysis.risk_assessment.overall_risk_score > 70) {
      console.log(`High risk detected: ${workflow.analysis.risk_assessment.overall_risk_score}%`);
    }
  }

  private async handleWorkflowFailure(workflowId: string, error: any): Promise<void> {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) return;

    workflow.status = WorkflowStatus.FAILED;
    workflow.updatedAt = new Date().toISOString();
    
    console.error(`Workflow ${workflowId} failed at step ${workflow.currentStep}:`, error);
    
    // Move to history
    this.workflowHistory.push(workflow);
    this.activeWorkflows.delete(workflowId);
  }

  private async incorporateFeedback(workflow: WorkflowState, feedback: string, modifications?: any): Promise<void> {
    console.log(`Incorporating feedback for workflow ${workflow.id}: ${feedback}`);
    // This would update the response based on feedback
  }

  private async updateKnowledgeFromOutcome(workflow: WorkflowState, outcome: WinStatus, details: any): Promise<void> {
    // Update knowledge base with outcome information
    console.log(`Updating knowledge base with outcome: ${outcome}`);
  }

  private calculateAverageProcessingTime(workflows: WorkflowState[]): number {
    const completedWorkflows = workflows.filter(w => w.status === WorkflowStatus.COMPLETED);
    if (completedWorkflows.length === 0) return 0;

    const totalTime = completedWorkflows.reduce((acc, w) => acc + this.calculateDuration(w), 0);
    return totalTime / completedWorkflows.length;
  }

  private calculateSuccessRate(workflows: WorkflowState[]): number {
    if (workflows.length === 0) return 0;
    const successful = workflows.filter(w => w.status === WorkflowStatus.COMPLETED).length;
    return successful / workflows.length;
  }

  private identifyBottlenecks(workflows: WorkflowState[]): any[] {
    // Analyze where workflows spend the most time
    return [];
  }

  private analyzeQualityTrends(workflows: WorkflowState[]): any[] {
    // Analyze quality score trends over time
    return [];
  }

  private calculateDuration(workflow: WorkflowState): number {
    const start = new Date(workflow.createdAt).getTime();
    const end = new Date(workflow.updatedAt).getTime();
    return (end - start) / (1000 * 60 * 60); // Hours
  }

  private async generateWorkflowRecommendations(): Promise<string[]> {
    return [
      'Consider reducing human review threshold for low-risk RFPs',
      'Implement automated quality checks to reduce processing time',
      'Add more industry-specific knowledge to improve accuracy'
    ];
  }

  private generateWorkflowId(): string {
    return `workflow-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  // Public API Methods
  getActiveWorkflows(): WorkflowState[] {
    return Array.from(this.activeWorkflows.values());
  }

  getWorkflowById(id: string): WorkflowState | undefined {
    return this.activeWorkflows.get(id);
  }

  updateConfig(newConfig: Partial<WorkflowConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): WorkflowConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const workflowIntegration = new WorkflowIntegration();