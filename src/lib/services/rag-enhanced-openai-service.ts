import { createAPIConfig, APIConfiguration } from '../config/api-config';
import { enhancedDocumentProcessor } from './enhanced-document-processor';

export interface RAGContext {
  rfpContent?: string;
  sectionType: string;
  requirements?: string[];
  constraints?: string[];
  targetAudience?: string;
  useRAG?: boolean;
  ragCategory?: string;
  language?: 'en' | 'de' | 'auto';
  responseLanguage?: 'en' | 'de';
}

export interface RAGResponse {
  content: string;
  sources: Array<{
    document: string;
    chunk: number;
    similarity: number;
    excerpt: string;
  }>;
  tokensUsed: number;
  processingTime: number;
  ragContextUsed: boolean;
}

export interface SectionTemplate {
  id: string;
  name: string;
  description: string;
  promptTemplate: string;
  maxTokens?: number;
  useRAG?: boolean;
  ragInstructions?: string;
}

export interface GenerationProgress {
  sectionId: string;
  status: 'pending' | 'gathering_context' | 'generating' | 'completed' | 'error';
  progress: number; // 0-100
  content?: string;
  error?: string;
  ragSources?: number;
}

class RAGEnhancedOpenAIService {
  private config: APIConfiguration;
  private abortController?: AbortController;

  // Default section templates with RAG integration
  public defaultSections: SectionTemplate[] = [
    {
      id: 'executive-summary',
      name: 'Executive Summary',
      description: 'High-level overview of the proposal',
      useRAG: true,
      promptTemplate: `Create a compelling executive summary for this RFP response.

RFP Requirements:
{rfpContent}

{ragContext}

Include:
- Brief company introduction
- Value proposition alignment with their needs
- Key differentiators
- Expected outcomes

Keep it professional and customer-focused. Maximum 300 words.`,
      maxTokens: 500,
      ragInstructions: 'Find company overview, value propositions, and success stories'
    },
    {
      id: 'technical-approach',
      name: 'Technical Approach',
      description: 'Detailed technical solution description',
      useRAG: true,
      promptTemplate: `Provide a detailed technical approach for this RFP.

RFP Requirements:
{rfpContent}

{ragContext}

Address:
- Technical architecture and capabilities
- Integration approaches
- Security and compliance measures
- Scalability considerations
- Implementation methodology

Be specific about how our solution meets their technical requirements.`,
      maxTokens: 1000,
      ragInstructions: 'Look for technical specifications, API documentation, integration guides, and architecture details'
    },
    {
      id: 'pricing',
      name: 'Pricing & Packages',
      description: 'Pricing structure and package details',
      useRAG: true,
      promptTemplate: `Create a transparent pricing proposal for this RFP.

RFP Requirements:
{rfpContent}

{ragContext}

Include:
- Package options that fit their needs
- Clear pricing breakdown
- Implementation costs
- Ongoing support costs
- Value justification

Make it easy to understand and show clear ROI.`,
      maxTokens: 800,
      ragInstructions: 'Find pricing information, package details, implementation costs, and ROI data'
    },
    {
      id: 'company-overview',
      name: 'Company Overview',
      description: 'Company background and qualifications',
      useRAG: true,
      promptTemplate: `Present our company in the best light for this RFP.

RFP Requirements:
{rfpContent}

{ragContext}

Highlight:
- Company history and experience
- Relevant expertise and team
- Market position and stability
- Certifications and partnerships
- Why we're the right partner

Focus on aspects most relevant to their requirements.`,
      maxTokens: 600,
      ragInstructions: 'Look for company information, team bios, certifications, partnerships, and industry experience'
    },
    {
      id: 'references',
      name: 'References & Case Studies',
      description: 'Customer success stories and references',
      useRAG: true,
      promptTemplate: `Provide compelling references and case studies for this RFP.

RFP Requirements:
{rfpContent}

{ragContext}

Include:
- Similar customer success stories
- Quantified results and outcomes
- Relevant industry experience
- Customer testimonials
- Reference contacts (if available)

Choose the most relevant examples for their industry and use case.`,
      maxTokens: 800,
      ragInstructions: 'Find case studies, customer testimonials, success metrics, and reference information'
    }
  ];

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

  /**
   * Generate content for a specific section using RAG-enhanced context
   */
  async generateSectionWithRAG(
    template: SectionTemplate,
    context: RAGContext,
    onProgress?: (progress: GenerationProgress) => void
  ): Promise<RAGResponse> {
    const startTime = Date.now();

    if (!this.config.features.enableAIGeneration) {
      throw new Error('AI generation is disabled. Please configure OpenAI API key.');
    }

    // Step 1: Gather RAG context if enabled
    let ragContext = '';
    let ragSources: RAGResponse['sources'] = [];
    let ragContextUsed = false;

    onProgress?.({
      sectionId: template.id,
      status: 'gathering_context',
      progress: 10,
      ragSources: 0,
    });

    if (template.useRAG && context.useRAG !== false && enhancedDocumentProcessor.isConfigured()) {
      try {
        const contextResult = await enhancedDocumentProcessor.getRelevantContext(
          context.rfpContent || '',
          context.sectionType || template.id,
          {
            category: context.ragCategory,
            maxChunks: 5,
            similarityThreshold: 0.7,
          }
        );

        if (contextResult.context) {
          ragContext = `Relevant Company Information:
${contextResult.context}

Use this information to provide specific, accurate details in your response.`;

          ragSources = contextResult.sources.map((source, index) => ({
            document: source.document,
            chunk: source.chunk,
            similarity: source.similarity,
            excerpt: contextResult.context.split('\n\n')[index]?.substring(0, 150) + '...' || '',
          }));

          ragContextUsed = true;
        }

        onProgress?.({
          sectionId: template.id,
          status: 'gathering_context',
          progress: 30,
          ragSources: ragSources.length,
        });

      } catch (error) {
        console.warn('RAG context gathering failed, proceeding without:', error);
      }
    }

    // Step 2: Prepare prompt with RAG context
    let prompt = template.promptTemplate
      .replace('{rfpContent}', context.rfpContent || 'No RFP content provided')
      .replace('{ragContext}', ragContext || 'No specific company information available. Provide general best practices.');

    // Add additional context
    if (context.requirements?.length) {
      prompt += `\n\nSpecific Requirements to Address:\n${context.requirements.join('\n- ')}`;
    }

    if (context.constraints?.length) {
      prompt += `\n\nConstraints to Consider:\n${context.constraints.join('\n- ')}`;
    }

    if (context.targetAudience) {
      prompt += `\n\nTarget Audience: ${context.targetAudience}`;
    }

    onProgress?.({
      sectionId: template.id,
      status: 'generating',
      progress: 40,
      ragSources: ragSources.length,
    });

    // Step 3: Generate content using OpenAI
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: this.config.openai.model,
          messages: [
            {
              role: 'system',
              content: `You are an expert RFP response writer specializing in customer experience platforms.
              Provide detailed, professional, and compelling responses that directly address the client's requirements.
              ${ragContext ? 'Use the provided company information to give specific, accurate details.' : ''}
              Be concise but thorough. Format your response in clear sections with bullet points where appropriate.

              ${context.responseLanguage === 'de' ?
                'WICHTIG: Antworten Sie ausschließlich auf Deutsch. Verwenden Sie professionelle deutsche Geschäftssprache.' :
                context.responseLanguage === 'en' ?
                'IMPORTANT: Respond exclusively in English using professional business language.' :
                'IMPORTANT: Respond in the same language as the RFP content. If mixed languages, prioritize the primary language of the requirements.'}`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: template.maxTokens || this.config.openai.maxTokens,
          temperature: this.config.openai.temperature,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
        throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      const tokensUsed = data.usage?.total_tokens || 0;

      onProgress?.({
        sectionId: template.id,
        status: 'completed',
        progress: 100,
        content,
        ragSources: ragSources.length,
      });

      return {
        content: content.trim(),
        sources: ragSources,
        tokensUsed,
        processingTime: Date.now() - startTime,
        ragContextUsed,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Generation failed';

      onProgress?.({
        sectionId: template.id,
        status: 'error',
        progress: 0,
        error: errorMessage,
      });

      throw new Error(`Content generation failed: ${errorMessage}`);
    }
  }

  /**
   * Generate multiple sections with RAG enhancement
   */
  async generateMultipleSections(
    templates: SectionTemplate[],
    context: RAGContext,
    onProgress?: (overall: { completed: number; total: number; current?: string }) => void,
    onSectionProgress?: (progress: GenerationProgress) => void
  ): Promise<Record<string, RAGResponse>> {
    const results: Record<string, RAGResponse> = {};

    for (let i = 0; i < templates.length; i++) {
      const template = templates[i];

      onProgress?.({
        completed: i,
        total: templates.length,
        current: template.name,
      });

      try {
        const result = await this.generateSectionWithRAG(
          template,
          { ...context, sectionType: template.id },
          onSectionProgress
        );

        results[template.id] = result;

        // Small delay between sections to avoid rate limits
        if (i < templates.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        console.error(`Failed to generate section ${template.id}:`, error);
        results[template.id] = {
          content: `Error generating ${template.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          sources: [],
          tokensUsed: 0,
          processingTime: 0,
          ragContextUsed: false,
        };
      }
    }

    onProgress?.({
      completed: templates.length,
      total: templates.length,
    });

    return results;
  }

  /**
   * Test RAG capabilities with a simple query
   */
  async testRAGSearch(query: string, category?: string): Promise<{
    results: number;
    sources: string[];
    success: boolean;
    error?: string;
  }> {
    try {
      if (!enhancedDocumentProcessor.isConfigured()) {
        return {
          results: 0,
          sources: [],
          success: false,
          error: 'RAG system not configured. Please set up Supabase and upload documents.',
        };
      }

      const searchResults = await enhancedDocumentProcessor.semanticSearch(query, {
        category,
        limit: 5,
        similarityThreshold: 0.5,
      });

      return {
        results: searchResults.length,
        sources: searchResults.map(r => r.document_metadata?.name || 'Unknown').filter(Boolean),
        success: true,
      };

    } catch (error) {
      return {
        results: 0,
        sources: [],
        success: false,
        error: error instanceof Error ? error.message : 'Test failed',
      };
    }
  }

  /**
   * Get service status including RAG capabilities
   */
  getServiceStatus(): {
    openai: boolean;
    rag: boolean;
    database: boolean;
    message: string;
  } {
    const openaiEnabled = this.config.features.enableAIGeneration;
    const ragStatus = enhancedDocumentProcessor.getStatus();

    let message = '';
    if (!openaiEnabled) {
      message = 'OpenAI API key required for content generation';
    } else if (!ragStatus.database) {
      message = 'Database connection required for RAG features';
    } else if (!ragStatus.embeddings) {
      message = 'OpenAI embeddings service required for RAG search';
    } else {
      message = 'All services operational';
    }

    return {
      openai: openaiEnabled,
      rag: ragStatus.database && ragStatus.embeddings,
      database: ragStatus.database,
      message,
    };
  }

  /**
   * Cancel ongoing generation
   */
  cancelGeneration(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = undefined;
    }
  }

  /**
   * Get available section templates
   */
  getSectionTemplates(): SectionTemplate[] {
    return this.defaultSections;
  }

  /**
   * Add or update a section template
   */
  addSectionTemplate(template: SectionTemplate): void {
    const existingIndex = this.defaultSections.findIndex(s => s.id === template.id);
    if (existingIndex >= 0) {
      this.defaultSections[existingIndex] = template;
    } else {
      this.defaultSections.push(template);
    }
  }
}

// Export singleton instance
export const ragEnhancedOpenAIService = new RAGEnhancedOpenAIService();