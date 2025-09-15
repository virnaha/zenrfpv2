// Zenloop Competitive Intelligence Service
// Provides strategic positioning against major CX platforms

import { zenloopPrompts } from './zenloop-consultant-prompts';
import { knowledgeIngestion } from './knowledge-ingestion';
import { createAPIConfig, APIConfiguration } from '../config/api-config';

export interface CompetitorProfile {
  name: string;
  category: 'enterprise' | 'mid-market' | 'niche' | 'legacy';
  strengths: string[];
  weaknesses: string[];
  pricingPosition: 'premium' | 'competitive' | 'value' | 'budget';
  targetMarkets: string[];
  keyDifferentiators: string[];
}

export interface CompetitiveAnalysis {
  competitor: string;
  zenloopAdvantages: string[];
  competitorAdvantages: string[];
  battleCard: BattleCard;
  positioningStrategy: string;
  proofPoints: string[];
  riskMitigation: string[];
  winStrategy: string;
}

export interface BattleCard {
  competitorName: string;
  quickHits: string[];
  featureComparison: FeatureComparison[];
  customerSuccessStories: string[];
  pricingAdvantages: string[];
  implementationAdvantages: string[];
  landmines: string[]; // Areas to avoid or handle carefully
}

export interface FeatureComparison {
  category: string;
  zenloopCapability: string;
  competitorCapability: string;
  advantage: 'zenloop' | 'competitor' | 'neutral';
  details: string;
}

export class ZenloopCompetitiveIntelligence {
  private config: APIConfiguration;
  private competitorProfiles: Map<string, CompetitorProfile>;

  constructor() {
    this.config = createAPIConfig();
    this.initializeCompetitorProfiles();
  }

  private initializeCompetitorProfiles(): void {
    this.competitorProfiles = new Map();

    // Medallia - Enterprise leader
    this.competitorProfiles.set('medallia', {
      name: 'Medallia',
      category: 'enterprise',
      strengths: [
        'Enterprise market leader with strong brand recognition',
        'Comprehensive CX platform with advanced analytics',
        'Large customer base and extensive integrations',
        'Strong text analytics and journey mapping capabilities'
      ],
      weaknesses: [
        'Complex implementation and high cost of ownership',
        'Steep learning curve and user interface complexity',
        'Over-engineered for mid-market organizations',
        'Slower innovation cycle and rigid architecture'
      ],
      pricingPosition: 'premium',
      targetMarkets: ['Fortune 500', 'Large Enterprise', 'Global Organizations'],
      keyDifferentiators: ['Journey orchestration', 'Advanced analytics', 'Enterprise scale']
    });

    // Qualtrics - Research-focused platform
    this.competitorProfiles.set('qualtrics', {
      name: 'Qualtrics',
      category: 'enterprise',
      strengths: [
        'Strong survey design and research capabilities',
        'Academic and research market leadership',
        'Powerful statistical analysis tools',
        'SAP backing and enterprise credibility'
      ],
      weaknesses: [
        'Complex for operational CX programs',
        'Research-focused rather than action-oriented',
        'Limited closed-loop automation capabilities',
        'High complexity for simple feedback collection'
      ],
      pricingPosition: 'premium',
      targetMarkets: ['Research Organizations', 'Large Enterprise', 'Academic'],
      keyDifferentiators: ['Advanced research tools', 'Statistical analysis', 'Survey sophistication']
    });

    // InMoment - Voice of Customer specialist
    this.competitorProfiles.set('inmoment', {
      name: 'InMoment',
      category: 'enterprise',
      strengths: [
        'Strong voice of customer and text analytics',
        'Industry-specific solutions and expertise',
        'Managed services and consulting capabilities',
        'Social listening and digital feedback integration'
      ],
      weaknesses: [
        'Limited self-service capabilities',
        'Heavy reliance on professional services',
        'Complex pricing and implementation model',
        'Less focus on real-time operational feedback'
      ],
      pricingPosition: 'premium',
      targetMarkets: ['Retail', 'Hospitality', 'Financial Services'],
      keyDifferentiators: ['Industry expertise', 'Managed services', 'Social integration']
    });

    // SurveyMonkey/Momentive - Self-service leader
    this.competitorProfiles.set('surveymonkey', {
      name: 'SurveyMonkey',
      category: 'mid-market',
      strengths: [
        'Easy-to-use self-service platform',
        'Strong brand recognition and market penetration',
        'Affordable pricing for basic feedback collection',
        'Quick implementation and time-to-value'
      ],
      weaknesses: [
        'Limited enterprise-grade features and security',
        'Basic analytics and reporting capabilities',
        'Lack of advanced CX program management tools',
        'No closed-loop automation or workflow capabilities'
      ],
      pricingPosition: 'value',
      targetMarkets: ['SMB', 'Mid-market', 'Basic survey needs'],
      keyDifferentiators: ['Ease of use', 'Self-service', 'Broad market adoption']
    });
  }

  async analyzeCompetitor(competitorName: string, rfpContext?: string): Promise<CompetitiveAnalysis> {
    const competitor = this.competitorProfiles.get(competitorName.toLowerCase());
    if (!competitor) {
      throw new Error(`Competitor profile not found: ${competitorName}`);
    }

    // Retrieve relevant competitive intelligence from knowledge base
    const competitiveKnowledge = await this.retrieveCompetitiveKnowledge(competitorName);

    // Generate battle card
    const battleCard = await this.generateBattleCard(competitor, competitiveKnowledge);

    // Analyze positioning strategy
    const positioningStrategy = await this.generatePositioningStrategy(competitor, rfpContext);

    return {
      competitor: competitor.name,
      zenloopAdvantages: this.getZenloopAdvantages(competitor),
      competitorAdvantages: competitor.strengths,
      battleCard,
      positioningStrategy,
      proofPoints: this.getZenloopProofPoints(competitor),
      riskMitigation: this.getRiskMitigation(competitor),
      winStrategy: await this.generateWinStrategy(competitor, rfpContext)
    };
  }

  private getZenloopAdvantages(competitor: CompetitorProfile): string[] {
    const baseAdvantages = [
      'Rapid implementation and time-to-value (weeks vs. months)',
      'Intuitive user experience requiring minimal training',
      'Closed-loop automation for real-time action on feedback',
      'European data privacy leadership and GDPR compliance',
      'Flexible pricing model scaling with business growth',
      'Customer-centric product development and innovation speed'
    ];

    // Add competitor-specific advantages
    switch (competitor.name.toLowerCase()) {
      case 'medallia':
        return [
          ...baseAdvantages,
          'Significantly lower total cost of ownership',
          'Faster deployment without complex professional services',
          'Modern cloud-native architecture vs. legacy systems',
          'Direct customer relationship vs. channel-heavy approach'
        ];
      case 'qualtrics':
        return [
          ...baseAdvantages,
          'Focus on operational CX vs. research complexity',
          'Built-in action workflows vs. analysis-only approach',
          'Simplified user interface for non-researchers',
          'Real-time operational dashboards vs. complex reporting'
        ];
      case 'surveymonkey':
        return [
          'Enterprise-grade security and compliance',
          'Advanced analytics and AI-driven insights',
          'Sophisticated closed-loop management capabilities',
          'Professional CX program methodology and best practices',
          'Dedicated customer success and consulting support'
        ];
      default:
        return baseAdvantages;
    }
  }

  private getZenloopProofPoints(competitor: CompetitorProfile): string[] {
    return [
      'Average 3-week implementation vs. 6+ months for enterprise competitors',
      '40%+ improvement in NPS program ROI within first year',
      '95%+ customer satisfaction with platform usability',
      'Sub-second response time for real-time feedback processing',
      '200+ pre-built integrations vs. custom development requirements',
      'European data residency with global compliance coverage'
    ];
  }

  private getRiskMitigation(competitor: CompetitorProfile): string[] {
    const baseRisks = [
      'Address "startup concern" with growth metrics and enterprise customers',
      'Emphasize European heritage as data privacy advantage, not limitation',
      'Position rapid innovation as benefit vs. "feature completeness" concerns'
    ];

    switch (competitor.name.toLowerCase()) {
      case 'medallia':
        return [
          ...baseRisks,
          'Acknowledge enterprise features while highlighting simplicity advantage',
          'Position as "enterprise-ready without enterprise complexity"',
          'Emphasize customer success stories in Fortune 500 accounts'
        ];
      case 'qualtrics':
        return [
          ...baseRisks,
          'Respect research capabilities while positioning operational focus',
          'Demonstrate statistical rigor in CX methodology',
          'Show integration with existing research tools and processes'
        ];
      default:
        return baseRisks;
    }
  }

  private async generateBattleCard(competitor: CompetitorProfile, knowledge: string[]): Promise<BattleCard> {
    const quickHits = this.generateQuickHits(competitor);
    const featureComparison = this.generateFeatureComparison(competitor);

    return {
      competitorName: competitor.name,
      quickHits,
      featureComparison,
      customerSuccessStories: [
        'Major retailer reduced complaint resolution time by 60% with Zenloop closed-loop automation',
        'SaaS company increased NPS by 35 points using Zenloop\'s real-time insights',
        'Financial services firm achieved 90% survey completion rates with Zenloop\'s mobile-optimized surveys'
      ],
      pricingAdvantages: [
        'Transparent subscription pricing without hidden professional services costs',
        'Flexible scaling model that grows with business needs',
        'No per-user licensing - unlimited team access included',
        'ROI-positive within 90 days vs. 12+ months for enterprise competitors'
      ],
      implementationAdvantages: [
        'Self-service onboarding with optional expert guidance',
        'Pre-built templates and best practices for immediate value',
        'Native integrations requiring no custom development',
        'Dedicated customer success manager from day one'
      ],
      landmines: this.generateLandmines(competitor)
    };
  }

  private generateQuickHits(competitor: CompetitorProfile): string[] {
    const base = [
      'Zenloop delivers results in weeks, not months',
      'No complex training required - intuitive interface',
      'Real-time action automation, not just measurement',
      'European data privacy leadership with global reach'
    ];

    switch (competitor.name.toLowerCase()) {
      case 'medallia':
        return [
          ...base,
          '10x faster implementation than Medallia',
          'Modern cloud architecture vs. legacy platform',
          'Direct partnership vs. channel complexity'
        ];
      case 'qualtrics':
        return [
          ...base,
          'Operational CX focus vs. academic research complexity',
          'Built-in workflows vs. analysis-only approach',
          'Immediate actionability vs. research reports'
        ];
      default:
        return base;
    }
  }

  private generateFeatureComparison(competitor: CompetitorProfile): FeatureComparison[] {
    const baseComparisons: FeatureComparison[] = [
      {
        category: 'Implementation Speed',
        zenloopCapability: '2-3 weeks average, self-service onboarding',
        competitorCapability: '3-12 months with extensive professional services',
        advantage: 'zenloop',
        details: 'Zenloop\'s modern architecture enables rapid deployment without complex customization'
      },
      {
        category: 'User Experience',
        zenloopCapability: 'Intuitive interface, minimal training required',
        competitorCapability: 'Complex interface requiring extensive user training',
        advantage: 'zenloop',
        details: 'Zenloop prioritizes user experience with consumer-grade interface design'
      },
      {
        category: 'Closed-Loop Automation',
        zenloopCapability: 'Native workflow automation with real-time triggers',
        competitorCapability: 'Manual processes or complex workflow configuration',
        advantage: 'zenloop',
        details: 'Built-in automation ensures immediate action on customer feedback'
      }
    ];

    // Add competitor-specific comparisons
    switch (competitor.name.toLowerCase()) {
      case 'medallia':
        return [
          ...baseComparisons,
          {
            category: 'Total Cost of Ownership',
            zenloopCapability: 'Transparent subscription pricing, no hidden costs',
            competitorCapability: 'High license fees plus extensive professional services',
            advantage: 'zenloop',
            details: 'Zenloop delivers enterprise value at mid-market pricing'
          }
        ];
      case 'qualtrics':
        return [
          ...baseComparisons,
          {
            category: 'Operational Focus',
            zenloopCapability: 'Built for operational CX teams and real-time action',
            competitorCapability: 'Research-focused with complex statistical tools',
            advantage: 'zenloop',
            details: 'Zenloop optimizes for business impact, not academic research'
          }
        ];
      default:
        return baseComparisons;
    }
  }

  private generateLandmines(competitor: CompetitorProfile): string[] {
    const base = [
      'Don\'t dismiss competitor\'s market position - acknowledge and differentiate',
      'Avoid direct feature comparisons without context - focus on business outcomes',
      'Don\'t oversell - let customer success stories speak for capabilities'
    ];

    switch (competitor.name.toLowerCase()) {
      case 'medallia':
        return [
          ...base,
          'Don\'t underestimate their enterprise relationships and market presence',
          'Avoid appearing "too simple" - emphasize sophistication where it matters',
          'Don\'t ignore their advanced analytics - position practical insights'
        ];
      case 'qualtrics':
        return [
          ...base,
          'Don\'t dismiss their research capabilities - respect academic rigor',
          'Avoid positioning as "dumbed down" - emphasize operational efficiency',
          'Don\'t ignore SAP relationship - acknowledge enterprise backing'
        ];
      default:
        return base;
    }
  }

  private async generatePositioningStrategy(competitor: CompetitorProfile, rfpContext?: string): Promise<string> {
    if (!rfpContext) {
      return this.getDefaultPositioningStrategy(competitor);
    }

    // Use AI to generate contextual positioning strategy
    const prompt = zenloopPrompts.competitivePositioning(competitor.name, rfpContext);

    try {
      if (!this.config.features.enableAIGeneration) {
        return this.getDefaultPositioningStrategy(competitor);
      }

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
              content: 'You are Sarah Chen, Zenloop\'s expert consultant. Generate strategic competitive positioning that is sophisticated, factual, and respectful while clearly differentiating Zenloop\'s advantages.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.3
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices?.[0]?.message?.content || this.getDefaultPositioningStrategy(competitor);
      }
    } catch (error) {
      console.warn('Failed to generate AI positioning strategy:', error);
    }

    return this.getDefaultPositioningStrategy(competitor);
  }

  private getDefaultPositioningStrategy(competitor: CompetitorProfile): string {
    switch (competitor.name.toLowerCase()) {
      case 'medallia':
        return 'Position Zenloop as the modern, agile alternative to Medallia\'s enterprise complexity. Emphasize rapid value realization, intuitive user experience, and lower total cost of ownership while respecting Medallia\'s market leadership. Focus on outcomes-driven approach vs. feature-heavy platform.';

      case 'qualtrics':
        return 'Position Zenloop as the operational CX platform vs. Qualtrics\' research focus. Emphasize real-time action and business impact over statistical analysis complexity. Acknowledge research capabilities while differentiating on practical business outcomes and ease of use.';

      case 'surveymonkey':
        return 'Position Zenloop as the enterprise-grade evolution of basic survey tools. Emphasize advanced CX methodology, security, and closed-loop capabilities while maintaining simplicity. Show progression path from basic feedback collection to strategic CX transformation.';

      default:
        return 'Position Zenloop based on core differentiators: rapid implementation, intuitive user experience, closed-loop automation, European data privacy leadership, and customer-centric innovation approach.';
    }
  }

  private async generateWinStrategy(competitor: CompetitorProfile, rfpContext?: string): Promise<string> {
    const advantages = this.getZenloopAdvantages(competitor);
    const proofPoints = this.getZenloopProofPoints(competitor);

    return `Win Strategy vs. ${competitor.name}:
1. Lead with time-to-value advantage: ${advantages[0]}
2. Demonstrate user experience superiority with live demo
3. Present cost comparison showing 40-60% TCO savings
4. Share relevant customer success stories: ${proofPoints[0]}
5. Emphasize European data privacy as competitive advantage
6. Position as strategic partnership vs. vendor relationship
7. Offer pilot program to prove value with minimal risk`;
  }

  private async retrieveCompetitiveKnowledge(competitorName: string): Promise<string[]> {
    try {
      const searchTerms = [`zenloop vs ${competitorName}`, `${competitorName} competitive analysis`, 'competitive advantages'];
      const knowledge: string[] = [];

      for (const term of searchTerms) {
        try {
          const results = await knowledgeIngestion.searchZenloopKnowledge(term, 1);
          results.forEach(result => {
            knowledge.push(`${result.source}: ${result.content}`);
          });
        } catch (error) {
          console.warn(`Failed to retrieve competitive knowledge for ${term}:`, error);
        }
      }

      return knowledge.slice(0, 3); // Limit to top 3 results
    } catch (error) {
      console.warn('Failed to retrieve competitive knowledge:', error);
      return [];
    }
  }

  // Public methods for easy access
  getAvailableCompetitors(): string[] {
    return Array.from(this.competitorProfiles.keys());
  }

  getCompetitorProfile(name: string): CompetitorProfile | undefined {
    return this.competitorProfiles.get(name.toLowerCase());
  }

  async generateBattleCards(): Promise<BattleCard[]> {
    const battleCards: BattleCard[] = [];

    for (const competitor of this.competitorProfiles.values()) {
      const knowledge = await this.retrieveCompetitiveKnowledge(competitor.name);
      const battleCard = await this.generateBattleCard(competitor, knowledge);
      battleCards.push(battleCard);
    }

    return battleCards;
  }
}

// Export singleton instance
export const zenloopCompetitiveIntelligence = new ZenloopCompetitiveIntelligence();