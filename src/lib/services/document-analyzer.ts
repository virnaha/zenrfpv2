import { createAPIConfig, APIConfiguration } from '../config/api-config';
import { zenloopPrompts, ZenloopConsultantContext } from './zenloop-consultant-prompts';
import { knowledgeIngestion } from './knowledge-ingestion';

export interface DocumentAnalysis {
  criticalRequirementsMatrix: {
    mandatory: Array<{
      requirement: string;
      complianceMapping: string;
      confidence: number;
    }>;
    desired: Array<{
      requirement: string;
      weightScore: string;
      confidence: number;
    }>;
    optional: Array<{
      requirement: string;
      confidence: number;
    }>;
    hidden: Array<{
      requirement: string;
      evidence: string;
      confidence: number;
    }>;
  };
  evaluationCriteria: {
    scoringMethodology: string;
    criteria: Array<{
      criterion: string;
      weight: string;
      priority: 'high' | 'medium' | 'low';
      confidence: number;
    }>;
    budgetIndicators: string;
    riskFactors: Array<{
      factor: string;
      severity: 'High' | 'Medium' | 'Low';
      confidence: number;
    }>;
  };
  strategicIntelligence: {
    incumbentAdvantages: string;
    politicalLandscape: string;
    timelinePressures: string;
    competitiveOpportunities: string;
    confidence: number;
  };
  winThemes: {
    primaryValueDrivers: string[];
    painPoints: string[];
    keyDifferentiators: string[];
    requiredProofPoints: string[];
    confidence: number;
  };
  redFlags: Array<{
    flag: string;
    severity: 'High' | 'Medium' | 'Low';
    impact: string;
    confidence: number;
  }>;
  deadlines: Array<{
    task: string;
    date: string;
    daysRemaining: number;
    urgency: 'High' | 'Medium' | 'Low';
  }>;
  stakeholders: Array<{
    name: string;
    role: string;
    department: string;
    influence: 'High' | 'Medium' | 'Low';
    priorities: string[];
  }>;
}

export interface AnalysisProgress {
  status: 'idle' | 'analyzing' | 'completed' | 'error';
  progress: number; // 0-100
  currentStep?: string;
  error?: string;
}

class DocumentAnalyzerService {
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

  private async buildAnalysisPrompt(documentContent: string): Promise<string> {
    // Retrieve relevant Zenloop knowledge for context
    const retrievedKnowledge = await this.retrieveRelevantKnowledge(documentContent);

    // For document analysis, we need JSON output, not the structured consultant format
    // Use the legacy prompt but enhanced with Zenloop knowledge
    const basePrompt = this.buildLegacyAnalysisPrompt(documentContent);

    // Inject Zenloop knowledge if available
    if (retrievedKnowledge.length > 0) {
      return zenloopPrompts.injectKnowledge(basePrompt, retrievedKnowledge);
    }

    return basePrompt;
  }

  private async retrieveRelevantKnowledge(documentContent: string, maxResults: number = 5): Promise<string[]> {
    try {
      // Extract key terms for knowledge retrieval
      const keyTerms = this.extractKeyTermsForRetrieval(documentContent);
      const retrievedDocs: string[] = [];

      // Search Zenloop knowledge base for relevant content
      for (const term of keyTerms.slice(0, 3)) { // Limit to top 3 terms
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

  private extractKeyTermsForRetrieval(documentContent: string): string[] {
    const text = documentContent.toLowerCase();
    const keyTerms: string[] = [];

    // CX-related terms
    const cxTerms = ['customer experience', 'nps', 'net promoter', 'csat', 'customer satisfaction',
                     'ces', 'customer effort', 'voice of customer', 'feedback', 'survey'];

    // Technical terms
    const techTerms = ['integration', 'api', 'dashboard', 'analytics', 'reporting', 'automation',
                       'workflow', 'real-time', 'closed loop', 'sentiment analysis'];

    // Industry terms
    const industryTerms = ['enterprise', 'saas', 'cloud', 'security', 'compliance', 'gdpr',
                          'scalability', 'performance', 'reliability'];

    // Check for presence of terms and prioritize
    [...cxTerms, ...techTerms, ...industryTerms].forEach(term => {
      if (text.includes(term)) {
        keyTerms.push(term);
      }
    });

    // Add specific Zenloop-related searches
    keyTerms.unshift('zenloop platform', 'customer experience platform', 'feedback management');

    return keyTerms.slice(0, 8); // Return top 8 most relevant terms
  }

  private buildLegacyAnalysisPrompt(documentContent: string): string {
    // Fallback to original prompt structure but with enhanced JSON format
    return `You are Sarah Chen, a Senior Customer Experience Consultant and Zenloop implementation specialist with 25+ years of experience transforming enterprise CX programs.

Extract and structure the following with Zenloop expertise:

1. **Critical Requirements Matrix**
   - Mandatory requirements (MUST have) with Zenloop capability mapping
   - Desired requirements (SHOULD have) with Zenloop differentiator opportunities
   - Optional requirements (NICE to have) with Zenloop value-add potential
   - Hidden requirements (implied but not stated) with Zenloop solution insights

2. **Evaluation Criteria Decoder**
   - Scoring methodology and weights with Zenloop positioning strategy
   - Decision-maker priorities with Zenloop value proposition alignment
   - Budget indicators and price sensitivity with Zenloop ROI opportunities
   - Risk factors and compliance requirements with Zenloop security/compliance strengths

3. **Strategic Intelligence**
   - Incumbent vendor advantages with Zenloop competitive response
   - Political landscape and stakeholder dynamics with Zenloop relationship strategy
   - Timeline pressures and urgency indicators with Zenloop rapid deployment advantages
   - Competitive positioning opportunities highlighting Zenloop differentiators

4. **Win Theme Identification**
   - Primary value drivers aligned with Zenloop's core strengths
   - Pain points that Zenloop uniquely addresses
   - Differentiators that position Zenloop competitively
   - Proof points needed from Zenloop customer success stories

5. **Red Flags & Risks**
   - Requirements that may challenge Zenloop positioning
   - Specifications that favor competitors
   - Missing information gaps that need Zenloop expertise clarification
   - Potential deal breakers requiring Zenloop strategic response

Document Content:
${documentContent}

Please respond with a valid JSON object containing these fields with confidence scores for each finding:
{
  "criticalRequirementsMatrix": {
    "mandatory": [
      {
        "requirement": "requirement description",
        "complianceMapping": "how to demonstrate compliance",
        "confidence": 0.95
      }
    ],
    "desired": [
      {
        "requirement": "requirement description",
        "weightScore": "percentage or importance level",
        "confidence": 0.85
      }
    ],
    "optional": [
      {
        "requirement": "requirement description",
        "confidence": 0.75
      }
    ],
    "hidden": [
      {
        "requirement": "implied requirement",
        "evidence": "why this is implied",
        "confidence": 0.70
      }
    ]
  },
  "evaluationCriteria": {
    "scoringMethodology": "description of how evaluation will be conducted",
    "criteria": [
      {
        "criterion": "criteria name",
        "weight": "percentage",
        "priority": "high/medium/low",
        "confidence": 0.90
      }
    ],
    "budgetIndicators": "budget range and price sensitivity analysis",
    "riskFactors": [
      {
        "factor": "risk description",
        "severity": "High|Medium|Low",
        "confidence": 0.80
      }
    ]
  },
  "strategicIntelligence": {
    "incumbentAdvantages": "analysis of current vendor advantages",
    "politicalLandscape": "stakeholder dynamics and decision-making process",
    "timelinePressures": "urgency indicators and timeline analysis",
    "competitiveOpportunities": "positioning opportunities for new vendors",
    "confidence": 0.75
  },
  "winThemes": {
    "primaryValueDrivers": ["driver1", "driver2"],
    "painPoints": ["pain point 1", "pain point 2"],
    "keyDifferentiators": ["differentiator 1", "differentiator 2"],
    "requiredProofPoints": ["proof point 1", "proof point 2"],
    "confidence": 0.85
  },
  "redFlags": [
    {
      "flag": "red flag description",
      "severity": "High|Medium|Low",
      "impact": "potential impact on proposal",
      "confidence": 0.90
    }
  ],
  "deadlines": [
    {
      "task": "task description",
      "date": "YYYY-MM-DD",
      "daysRemaining": number,
      "urgency": "High|Medium|Low"
    }
  ],
  "stakeholders": [
    {
      "name": "person name",
      "role": "job title",
      "department": "department name",
      "influence": "High|Medium|Low",
      "priorities": ["priority1", "priority2"]
    }
  ]
}

Ensure all dates are in YYYY-MM-DD format and calculate days remaining from today's date. Provide confidence scores (0.0-1.0) for each finding based on the clarity and specificity of the information in the document.`;
  }

  async analyzeDocument(
    documentContent: string,
    onProgress?: (progress: AnalysisProgress) => void
  ): Promise<DocumentAnalysis> {
    if (!this.config.features.enableAIGeneration) {
      throw new Error('AI generation is disabled in configuration');
    }

    // Cancel any ongoing request
    if (this.abortController) {
      this.abortController.abort();
    }

    this.abortController = new AbortController();

    try {
      // Update progress to analyzing
      onProgress?.({
        status: 'analyzing',
        progress: 0,
        currentStep: 'Preparing analysis...'
      });

      const prompt = await this.buildAnalysisPrompt(documentContent);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: this.config.openai.model,
          messages: [
            {
              role: 'system',
              content: 'You are Sarah Chen, a Senior Customer Experience Consultant and Zenloop implementation specialist. Analyze RFP documents through the lens of Zenloop\'s capabilities and your deep CX expertise. CRITICAL: You must respond with valid JSON only, following the exact schema provided in the prompt. Do not include any explanatory text, markdown formatting, or the structured Zenloop response format - only return the JSON object.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: this.config.openai.maxTokens,
          temperature: 0.3, // Lower temperature for more consistent analysis
          stream: false, // Use non-streaming for structured analysis
        }),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      onProgress?.({
        status: 'analyzing',
        progress: 50,
        currentStep: 'Processing analysis results...'
      });

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No analysis content received from OpenAI');
      }

      // Extract JSON from the response with improved parsing
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in response:', content);
        throw new Error('Invalid JSON response from analysis. Please check the OpenAI response format.');
      }

      onProgress?.({
        status: 'analyzing',
        progress: 90,
        currentStep: 'Finalizing results...'
      });

      let analysis: DocumentAnalysis;
      try {
        analysis = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Content that failed to parse:', jsonMatch[0]);
        throw new Error(`Failed to parse analysis JSON: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`);
      }

      // Validate and process the analysis
      const processedAnalysis = this.processAnalysis(analysis);

      onProgress?.({
        status: 'completed',
        progress: 100,
        currentStep: 'Analysis complete'
      });

      return processedAnalysis;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      onProgress?.({
        status: 'error',
        progress: 0,
        error: errorMessage
      });

      throw new Error(`Document analysis failed: ${errorMessage}`);
    }
  }

  private processAnalysis(analysis: DocumentAnalysis): DocumentAnalysis {
    // Ensure all required fields exist with defaults
    return {
      criticalRequirementsMatrix: {
        mandatory: analysis.criticalRequirementsMatrix?.mandatory || [],
        desired: analysis.criticalRequirementsMatrix?.desired || [],
        optional: analysis.criticalRequirementsMatrix?.optional || [],
        hidden: analysis.criticalRequirementsMatrix?.hidden || []
      },
      evaluationCriteria: {
        scoringMethodology: analysis.evaluationCriteria?.scoringMethodology || 'Not specified',
        criteria: analysis.evaluationCriteria?.criteria || [],
        budgetIndicators: analysis.evaluationCriteria?.budgetIndicators || 'Not specified',
        riskFactors: analysis.evaluationCriteria?.riskFactors || []
      },
      strategicIntelligence: {
        incumbentAdvantages: analysis.strategicIntelligence?.incumbentAdvantages || 'Not specified',
        politicalLandscape: analysis.strategicIntelligence?.politicalLandscape || 'Not specified',
        timelinePressures: analysis.strategicIntelligence?.timelinePressures || 'Not specified',
        competitiveOpportunities: analysis.strategicIntelligence?.competitiveOpportunities || 'Not specified',
        confidence: analysis.strategicIntelligence?.confidence || 0.5
      },
      winThemes: {
        primaryValueDrivers: analysis.winThemes?.primaryValueDrivers || [],
        painPoints: analysis.winThemes?.painPoints || [],
        keyDifferentiators: analysis.winThemes?.keyDifferentiators || [],
        requiredProofPoints: analysis.winThemes?.requiredProofPoints || [],
        confidence: analysis.winThemes?.confidence || 0.5
      },
      redFlags: analysis.redFlags || [],
      deadlines: analysis.deadlines || [],
      stakeholders: analysis.stakeholders || []
    };
  }

  cancelAnalysis(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  // Helper method to extract text from uploaded files
  async extractTextFromFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error('Failed to read text file'));
        reader.readAsText(file);
      } else if (file.type === 'application/pdf') {
        // For PDF files, we'll need to implement PDF text extraction
        // For now, return a placeholder - in a real implementation, you'd use a PDF parsing library
        reject(new Error('PDF text extraction not implemented yet'));
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // For DOCX files, we'll need to implement DOCX text extraction
        // For now, return a placeholder - in a real implementation, you'd use a DOCX parsing library
        reject(new Error('DOCX text extraction not implemented yet'));
      } else {
        reject(new Error('Unsupported file type'));
      }
    });
  }

  // Method to analyze document from file
  async analyzeDocumentFromFile(
    file: File,
    onProgress?: (progress: AnalysisProgress) => void
  ): Promise<DocumentAnalysis> {
    try {
      onProgress?.({
        status: 'analyzing',
        progress: 0,
        currentStep: 'Extracting text from file...'
      });

      const documentContent = await this.extractTextFromFile(file);
      
      onProgress?.({
        status: 'analyzing',
        progress: 10,
        currentStep: 'Text extraction complete, starting analysis...'
      });

      return await this.analyzeDocument(documentContent, (progressUpdate) => {
        // Adjust progress to account for file processing
        const adjustedProgress = 10 + (progressUpdate.progress * 0.9);
        onProgress?.({
          ...progressUpdate,
          progress: Math.round(adjustedProgress)
        });
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      onProgress?.({
        status: 'error',
        progress: 0,
        error: errorMessage
      });
      throw error;
    }
  }

  // Method to validate document content before analysis
  validateDocumentContent(content: string): { isValid: boolean; error?: string } {
    if (!content || content.trim().length === 0) {
      return { isValid: false, error: 'Document content is empty' };
    }
    
    if (content.trim().length < 50) {
      return { isValid: false, error: 'Document content is too short for meaningful analysis' };
    }
    
    return { isValid: true };
  }
}

// Export singleton instance
export const documentAnalyzer = new DocumentAnalyzerService(); 