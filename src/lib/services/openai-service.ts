import { createAPIConfig, APIConfiguration } from '../config/api-config';
import { enhancedCompanyDocuments } from './enhanced-company-documents';
import { zenloopPrompts, ZenloopConsultantContext } from './zenloop-consultant-prompts';
import { knowledgeIngestion } from './knowledge-ingestion';

export interface GenerationContext {
  rfpContent?: string;
  companyProfile?: string;
  requirements?: string[];
  constraints?: string[];
  targetAudience?: string;
}

export interface SectionTemplate {
  id: string;
  name: string;
  description: string;
  promptTemplate: string;
  maxTokens?: number;
}

export interface GenerationProgress {
  sectionId: string;
  status: 'pending' | 'generating' | 'completed' | 'error';
  progress: number; // 0-100
  content?: string;
  error?: string;
}

export interface StreamChunk {
  type: 'content' | 'progress' | 'error' | 'complete';
  data: string | number | GenerationProgress;
}

class OpenAIService {
  private config: APIConfiguration;
  private abortController?: AbortController;

  constructor() {
    this.config = createAPIConfig();
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.openai.apiKey}`,
    };

    if (this.config.openai.organization) {
      headers['OpenAI-Organization'] = this.config.openai.organization;
    }

    return headers;
  }

  private async buildPrompt(sectionType: string, context: GenerationContext, template: SectionTemplate): Promise<string> {
    // Use Zenloop-specific templates if available
    const zenloopTemplate = this.getZenloopTemplate(sectionType);
    if (zenloopTemplate) {
      return await this.buildZenloopPrompt(sectionType, context, zenloopTemplate);
    }

    // Fallback to original template with Zenloop enhancements
    const basePrompt = template.promptTemplate;

    let prompt = basePrompt
      .replace('{sectionType}', sectionType)
      .replace('{templateName}', template.name);

    // Add Zenloop context enhancement
    prompt = `As Zenloop's expert consultant, ${prompt}`;

    if (context.rfpContent) {
      prompt += `\n\nRFP Content:\n${context.rfpContent}`;
    }

    if (context.companyProfile) {
      prompt += `\n\nCompany Profile:\n${context.companyProfile}`;
    }

    if (context.requirements && context.requirements.length > 0) {
      prompt += `\n\nKey Requirements:\n${context.requirements.map(req => `- ${req}`).join('\n')}`;
    }

    if (context.constraints && context.constraints.length > 0) {
      prompt += `\n\nConstraints:\n${context.constraints.map(constraint => `- ${constraint}`).join('\n')}`;
    }

    if (context.targetAudience) {
      prompt += `\n\nTarget Audience:\n${context.targetAudience}`;
    }

    // Add Zenloop knowledge retrieval
    try {
      const retrievedKnowledge = await this.retrieveZenloopKnowledge(context.rfpContent || '', sectionType);
      if (retrievedKnowledge.length > 0) {
        prompt += `\n\nZENLOOP REFERENCE MATERIALS:\n${retrievedKnowledge.join('\n\n')}`;
      }
    } catch (error) {
      console.warn('Failed to retrieve Zenloop knowledge:', error);
    }

    // Add relevant company documents content
    if (context.rfpContent) {
      try {
        const relevantContent = await enhancedCompanyDocuments.getRelevantContentForRFP(context.rfpContent, sectionType);
        if (relevantContent) {
          prompt += `\n\nRelevant Company Information:\n${relevantContent}`;
        }
      } catch (error) {
        console.warn('Failed to get relevant content:', error);
      }
    }

    return prompt;
  }

  private getZenloopTemplate(sectionType: string): any {
    const templates = zenloopPrompts.responseTemplates;
    switch (sectionType) {
      case 'executive-summary':
        return templates.executiveSummary;
      case 'technical-approach':
        return templates.technicalApproach;
      case 'company-overview':
        return templates.companyOverview;
      default:
        return null;
    }
  }

  private async buildZenloopPrompt(sectionType: string, context: GenerationContext, template: any): Promise<string> {
    // Retrieve relevant Zenloop knowledge
    const retrievedKnowledge = await this.retrieveZenloopKnowledge(context.rfpContent || '', sectionType);

    // Build context string for template
    const contextString = [
      context.rfpContent ? `RFP Content: ${context.rfpContent}` : '',
      context.requirements ? `Key Requirements: ${context.requirements.join(', ')}` : '',
      context.constraints ? `Constraints: ${context.constraints.join(', ')}` : '',
      context.targetAudience ? `Target Audience: ${context.targetAudience}` : ''
    ].filter(Boolean).join('\n\n');

    return template.userTemplate(contextString, retrievedKnowledge);
  }

  private async retrieveZenloopKnowledge(rfpContent: string, sectionType: string, maxResults: number = 3): Promise<string[]> {
    try {
      if (!rfpContent) return [];

      // Extract key terms based on section type
      const keyTerms = this.extractKeyTermsBySectionType(rfpContent, sectionType);
      const retrievedDocs: string[] = [];

      // Search Zenloop knowledge base
      for (const term of keyTerms.slice(0, 2)) {
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
      console.warn('Failed to retrieve Zenloop knowledge:', error);
      return [];
    }
  }

  private extractKeyTermsBySectionType(content: string, sectionType: string): string[] {
    const text = content.toLowerCase();
    const baseTerms = ['zenloop platform', 'customer experience'];

    switch (sectionType) {
      case 'executive-summary':
        return [...baseTerms, 'roi', 'business value', 'cx transformation'];
      case 'technical-approach':
        return [...baseTerms, 'api', 'integration', 'architecture', 'analytics'];
      case 'company-overview':
        return [...baseTerms, 'customer success', 'case study', 'implementation'];
      case 'pricing':
        return [...baseTerms, 'pricing model', 'subscription', 'value proposition'];
      default:
        return baseTerms;
    }
  }

  async generateSection(
    sectionType: string,
    context: GenerationContext,
    template: SectionTemplate,
    onProgress?: (progress: GenerationProgress) => void,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    if (!this.config.features.enableAIGeneration) {
      throw new Error('AI generation is disabled in configuration');
    }

    // Cancel any ongoing request
    if (this.abortController) {
      this.abortController.abort();
    }

    this.abortController = new AbortController();

    const prompt = await this.buildPrompt(sectionType, context, template);
    const maxTokens = template.maxTokens || this.config.openai.maxTokens;

    try {
      // Update progress to generating
      onProgress?.({
        sectionId: sectionType,
        status: 'generating',
        progress: 0,
      });

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: this.config.openai.model,
          messages: [
            {
              role: 'system',
              content: 'You are Sarah Chen, a Senior Customer Experience Consultant and Zenloop implementation specialist with 25+ years of experience. Generate RFP response sections that position Zenloop as the optimal solution while demonstrating deep CX expertise. Structure responses in the Zenloop format: Zenloop Solution → Industry Insight → Strategic Recommendation. Use your access to Zenloop\'s knowledge base to provide specific, accurate information about capabilities and customer success stories.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: maxTokens,
          temperature: this.config.openai.temperature,
          stream: true,
        }),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response body received');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let chunkCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              // Update progress to completed
              onProgress?.({
                sectionId: sectionType,
                status: 'completed',
                progress: 100,
                content: accumulatedContent,
              });
              return accumulatedContent;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.choices?.[0]?.delta?.content) {
                const content = parsed.choices[0].delta.content;
                accumulatedContent += content;
                chunkCount++;
                
                // Call chunk callback for real-time updates
                onChunk?.(content);
                
                // Update progress (rough estimation)
                const progress = Math.min(95, Math.floor((chunkCount / 50) * 100));
                onProgress?.({
                  sectionId: sectionType,
                  status: 'generating',
                  progress,
                  content: accumulatedContent,
                });
              }
            } catch (e) {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }

      return accumulatedContent;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      onProgress?.({
        sectionId: sectionType,
        status: 'error',
        progress: 0,
        error: errorMessage,
      });

      throw error;
    } finally {
      this.abortController = undefined;
    }
  }

  async generateMultipleSections(
    sections: Array<{ sectionType: string; template: SectionTemplate }>,
    context: GenerationContext,
    onProgress?: (progress: GenerationProgress) => void,
    onChunk?: (sectionId: string, chunk: string) => void
  ): Promise<Record<string, string>> {
    const results: Record<string, string> = {};
    
    for (const { sectionType, template } of sections) {
      try {
        const content = await this.generateSection(
          sectionType,
          context,
          template,
          onProgress,
          (chunk) => onChunk?.(sectionType, chunk)
        );
        results[sectionType] = content;
      } catch (error) {
        console.error(`Error generating section ${sectionType}:`, error);
        results[sectionType] = `Error generating content: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    }

    return results;
  }

  cancelGeneration(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = undefined;
    }
  }

  // Predefined section templates
  static getSectionTemplates(): Record<string, SectionTemplate> {
    return {
      'executive-summary': {
        id: 'executive-summary',
        name: 'Executive Summary',
        description: 'High-level overview of the proposed solution',
        promptTemplate: `Create a compelling executive summary for the {sectionType} section of an RFP response. 
        This should be a concise, high-level overview that captures the key value propositions and differentiators.
        Focus on business outcomes and strategic benefits. Leverage the critical requirements matrix and win themes
        to demonstrate clear understanding of the customer's needs and your strategic positioning.`,
        maxTokens: 800,
      },
      'company-overview': {
        id: 'company-overview',
        name: 'Company Overview',
        description: 'Introduction to the company and its capabilities',
        promptTemplate: `Write a professional company overview section that establishes credibility and expertise.
        Highlight relevant experience, certifications, and success stories that align with the RFP requirements.
        Address the strategic intelligence insights and demonstrate how your company's strengths position you
        to overcome incumbent advantages and competitive challenges.`,
        maxTokens: 600,
      },
      'technical-approach': {
        id: 'technical-approach',
        name: 'Technical Approach',
        description: 'Detailed technical methodology and solution design',
        promptTemplate: `Develop a comprehensive technical approach section that demonstrates deep understanding of the requirements.
        Include methodology, architecture considerations, implementation strategy, and technical innovations.
        Show how your approach addresses the specific challenges outlined in the RFP and leverages the evaluation criteria
        to maximize scoring potential. Address any red flags identified in the analysis with mitigation strategies.`,
        maxTokens: 1200,
      },
      'project-timeline': {
        id: 'project-timeline',
        name: 'Project Timeline',
        description: 'Detailed project schedule and milestones',
        promptTemplate: `Create a realistic and detailed project timeline with clear milestones and deliverables.
        Include phases, key activities, dependencies, and resource allocation considerations.
        Demonstrate project management expertise and risk mitigation strategies. Address timeline pressures
        identified in the strategic intelligence and ensure alignment with critical deadlines.`,
        maxTokens: 800,
      },
      'team-structure': {
        id: 'team-structure',
        name: 'Team Structure',
        description: 'Proposed team composition and roles',
        promptTemplate: `Design an optimal team structure for this project, including key roles, responsibilities, and qualifications.
        Highlight team member expertise, relevant experience, and how the team composition ensures project success.
        Include organizational structure and reporting relationships. Align team capabilities with stakeholder
        priorities and evaluation criteria to maximize scoring potential.`,
        maxTokens: 700,
      },
      'pricing': {
        id: 'pricing',
        name: 'Pricing Framework',
        description: 'Cost structure and pricing strategy',
        promptTemplate: `Develop a competitive and transparent pricing framework that demonstrates value for money.
        Include cost breakdown, payment terms, and value-added services. Leverage budget indicators and price
        sensitivity analysis to position pricing strategically. Justify pricing decisions and show ROI for the client.`,
        maxTokens: 600,
      },
      'references': {
        id: 'references',
        name: 'References & Case Studies',
        description: 'Relevant client references and success stories',
        promptTemplate: `Create compelling case studies and references that demonstrate relevant experience and successful outcomes.
        Include specific metrics, challenges overcome, and client testimonials where appropriate.
        Focus on projects similar in scope and complexity to the current RFP. Provide proof points that align
        with the required proof points identified in the win themes analysis.`,
        maxTokens: 900,
      },
      'compliance': {
        id: 'compliance',
        name: 'Compliance & Certifications',
        description: 'Regulatory compliance and quality certifications',
        promptTemplate: `Detail all relevant certifications, compliance standards, and quality assurance processes.
        Include specific certifications, audit results, and compliance frameworks that apply to this project.
        Demonstrate commitment to quality, security, and regulatory requirements.`,
        maxTokens: 500,
      },
    };
  }
}

// Export singleton instance
export const openAIService = new OpenAIService();
export { OpenAIService };
export default openAIService; 