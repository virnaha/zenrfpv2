import { Document, DocumentType, Industry, KnowledgeEntry } from '../types/rfp-analyzer';
import { documentIntelligence } from './document-intelligence';
import { simpleSupabase } from './simple-supabase';

export interface KnowledgeIngestionResult {
  documentsProcessed: number;
  knowledgeEntriesExtracted: number;
  processingTime: number;
  documents: Document[];
  knowledgeEntries: KnowledgeEntry[];
}

export class KnowledgeIngestionService {
  async ingestZenloopDocuments(): Promise<KnowledgeIngestionResult> {
    const startTime = Date.now();
    console.log('🔄 Starting ingestion of Zenloop knowledge base documents...');

    const documents: Document[] = [
      // DFL Purchase Order - Real customer contract
      {
        id: 'zenloop-kb-dfl-purchase-order',
        name: 'DFL Deutsche Fußball Liga - Purchase Order',
        content: `
          DFL Deutsche Fußball Liga GmbH Purchase Order
          
          CUSTOMER: DFL Deutsche Fußball Liga GmbH, Frankfurt am Main
          CONTRACT VALUE: €24,000 first year, €22,000 annually thereafter
          
          SERVICES INCLUDED:
          
          Platform & Support Package:
          1. Collect Feedback
          - Data collection via standard channels
          - Survey script data collection  
          - Survey throttling
          - CX Methodologies: NPS, flexible first question & scale
          - Additional questions
          
          2. Focus on Opportunities
          - Starter dictionary template
          - NLP-based topics and sentiment recognition
          
          3. Interact with Customers
          - Act workflows via standard channels
          - Act workflows via Plug & Play integrations: Zapier, Slack
          
          4. Act on Innovation Opportunities
          - Standard dashboards & reports
          
          5. Delight
          - CSV & PNG exports
          - Customizable email reports & alerts
          
          6. Organisation Management
          - Standard user roles
          
          7. Security & Privacy
          - 2FA authentication
          - Data storage: Europe
          - Manual anonymization & deletion
          
          8. Branding
          - Customizable survey design
          
          BOOKED ADD-ONS:
          - Reputation Management: Free (€0 p.a.)
          - Survey Whitelabeling: Free (€0 p.a.) 
          - zenInsights & zenSurveys: Free (€0 p.a.)
          - Zendesk Plug & Play Integration: €2,000 p.a.
          
          SUPPORT:
          - Support Hub
          - Technical support via live chat & email
          - Onboarding (5 hours) and consulting (4 hours p.a.) by dedicated Customer Success Manager
          
          VOLUME INCLUDED:
          - Responses: 100,000
          - Users: 15
          - Business Units: 1
          
          SETUP SERVICES: €2,000 one-time
          
          PRICING TIERS FOR ADDITIONAL RESPONSES:
          50K responses: €17,000
          100K responses: €20,000
          200K responses: €24,000
          500K responses: €30,000
          
          ADDITIONAL FEATURES PRICING:
          - Survey Whitelabeling: €1,500 p.a.
          - Reputation Management: €1,500 p.a.
          - Standard REST-API: €1,500 p.a.
          - Translation Engine: €1,500 p.a.
          - Premium Integrations (Zendesk, Freshdesk, Salesforce): €2,000 p.a.
          - Premium CRM Integrations (Emarsys, Salesforce Marketing): €2,000 p.a.
          - Industry Benchmarking: €1,800 p.a.
          - zenInsights & zenSurveys: €3,000 p.a.
          - CX Consulting: €150/hour
          
          CONTRACT TERMS:
          - Payment: Annual prepayment, 14 days after invoice
          - Minimum contract duration: 24 months
          - Valid until: 30.06.2025
        `,
        type: DocumentType.COMPANY_DOC,
        metadata: {
          industry: Industry.TECHNOLOGY,
          confidence_score: 0.98,
          tags: ['pricing', 'contract', 'features', 'dfl-customer'],
          source: 'customer-contract',
          language: 'de',
          region: 'DE'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },

      // Zenloop Privacy Policy
      {
        id: 'zenloop-kb-privacy-policy',
        name: 'Zenloop Privacy Policy (GDPR Compliant)',
        content: `
          Zenloop Privacy Policy - Last Updated: 01.04.2023
          
          WHO WE ARE:
          zenloop is a Business-to-Business Software-as-a-Service platform that enables customers to collect, analyze and "close the loop" feedback to measure and promote loyalty.
          
          GDPR COMPLIANCE:
          "Personal data" means any information relating to an identified or identifiable natural person according to Article 4 GDPR.
          
          DATA CATEGORIES:
          We process three types of users:
          1. Website Visitors - people visiting our website
          2. Creators - people creating and conducting surveys via our website  
          3. Respondents - people responding to surveys
          
          WEBSITE VISITOR DATA COLLECTION:
          - Statistical usage data: how you found our site, browsing behavior, duration, clicks
          - Device and browser data: device type, browser, IP address, geographic location
          - Referral data: external sources that led you to our site
          - Cookie and page-tag data: tracking services from third parties
          - Voluntary data: information you provide voluntarily
          
          LEGAL BASIS: Article 6(1)(f) GDPR - legitimate interest in enabling website visits and ensuring system functionality and security
          
          DATA USAGE:
          - Personalize your experience
          - Improve our website  
          - Improve customer service
          - Evaluate and develop new features
          
          DATA SHARING:
          We share data only under limited circumstances:
          1. zenloop companies (within EEA or adequate protection countries)
          2. Service providers (payment processors, hosting, analytics)
          3. When legally required by authorities
          4. In case of company structure changes
          5. With your explicit consent
          
          SERVICE PROVIDERS INCLUDE:
          - Google Analytics (Google Inc., USA)
          - Intercom Inc. (San Francisco, USA)
          - Pipedrive (Tallinn, Estonia)
          - Stripe (San Francisco, USA)
          - Zapier Inc. (San Francisco, USA)
          - AutopilotHQ, Inc. (San Francisco, USA)
          - productboard Inc. (San Francisco, USA)
          - Various other analytics and business tools
          
          DATA STORAGE: Europe
          SECURITY: 2FA, encryption, regular backups, firewalls, virus scanners
          
          USER RIGHTS:
          - Access your data
          - Rectify incorrect data
          - Erase your data
          - Restrict processing
          - Data portability
          - Object to processing
          - Withdraw consent
        `,
        type: DocumentType.COMPLIANCE_DOC,
        metadata: {
          industry: Industry.TECHNOLOGY,
          confidence_score: 0.99,
          tags: ['gdpr', 'privacy', 'compliance', 'data-protection'],
          source: 'legal-documents',
          language: 'de',
          region: 'EU'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },

      // Data Processing Agreement
      {
        id: 'zenloop-kb-data-processing-agreement',
        name: 'Zenloop Data Processing Agreement (Article 28 GDPR)',
        content: `
          Zenloop Data Processing Agreement (AVV)
          Agreement on data processing according to Article 28 GDPR
          
          PARTIES:
          Customer (Data Controller) ↔ SaaS.group zenloop GmbH (Data Processor)
          
          PURPOSE:
          This agreement describes how zenloop processes survey data provided by customers in connection with service usage according to data protection law requirements.
          
          PROCESSING SCOPE:
          Subject: Collection of customer satisfaction surveys and reviews of the client's products and services
          Purpose: Process optimization for the client
          Duration: As long as zenloop provides services under the contract
          
          DATA TYPES:
          - Personal information including name and email address
          - IP addresses
          - Usage data
          - Device data  
          - Reference data
          - Cookie and page-tag information
          
          AFFECTED PERSON CATEGORIES:
          - Customer's customers
          - Customer's employees  
          - Customer's business contacts
          
          EXCLUSIONS:
          Special categories of personal data processing is excluded (racial origin, political opinions, religious beliefs, union membership, genetic data, biometric data, health data, sexual orientation)
          
          CUSTOMER INSTRUCTIONS:
          Customers can provide additional instructions regarding type, scope and procedure of data processing. Instructions must comply with data protection laws.
          
          ZENLOOP OBLIGATIONS:
          - Process data only according to documented instructions
          - Process data only within EU/EEA or countries with adequate protection
          - Ensure employee confidentiality commitments
          - Implement technical and organizational measures per Article 32 GDPR
          - Support customer with data subject rights
          - Assist with data protection impact assessments
          - Delete or return data at contract end
          
          DATA PROCESSING LOCATION:
          Primarily within Germany, EU member states, EEA countries, or countries with adequate data protection level according to European Commission decisions.
          
          SUBPROCESSORS:
          zenloop may engage third-party subprocessors with customer notification and adequate contractual protections.
          
          TECHNICAL AND ORGANIZATIONAL MEASURES:
          - Access controls
          - Data encryption
          - Regular backups
          - Monitoring and logging
          - Staff training
          - Incident response procedures
          
          CUSTOMER AUDIT RIGHTS:
          Customers can audit zenloop's technical and organizational measures once per year, with more frequent audits if required by data protection laws.
        `,
        type: DocumentType.COMPLIANCE_DOC,
        metadata: {
          industry: Industry.TECHNOLOGY,
          confidence_score: 0.99,
          tags: ['gdpr', 'article-28', 'data-processing', 'avv', 'compliance'],
          source: 'legal-documents',
          language: 'de',
          region: 'EU'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },

      // Terms of Service
      {
        id: 'zenloop-kb-terms-of-service',
        name: 'Zenloop Terms of Service (AGB)',
        content: `
          Zenloop Terms of Service - Last Update: 15.07.2024
          
          COMPANY:
          SaaS.group zenloop GmbH, Attilastraße 18, 12529 Schönefeld
          Business-to-Business Software-as-a-Service platform enabling business customers to collect and evaluate feedback to measure and increase customer loyalty.
          
          KEY DEFINITIONS:
          - Providers: Online platform providers where online reviews are displayed
          - Authorized Users: Customer employees authorized to access SaaS services
          - Customer Data: All profile information and data provided by customer  
          - Survey Recipients: Natural or legal persons contacted via SaaS services
          - Platform: zenloop's Software-as-a-Service platform accessible via website
          - zenloop ORM: Online Reputation Management SaaS solution
          - zenloop 2.0/zenSurveys: AI-powered functionalities
          
          CONTRACT SCOPE:
          Provision of SaaS services and additional services as agreed in individual contracts
          
          SERVICE DELIVERY:
          - Temporary usage of SaaS services via internet remote access
          - Platform stored on servers accessible via internet connection
          - Customer responsible for own internet connection and hardware
          
          SECURITY MEASURES:
          - Appropriate precautions against data loss
          - Prevention of unauthorized third-party access
          - Regular backups
          - State-of-the-art firewalls
          - Regularly updated virus scanners
          
          PLATFORM DEVELOPMENT:
          - Continuous development and improvement of SaaS services
          - Core product updates provided free of charge
          - Extensive updates may be classified as new products with additional fees
          - AI functionality: Results vary in accuracy and reliability
          
          ONLINE REPUTATION MANAGEMENT:
          - Customer-initiated services
          - Customer decides which public online review data to retrieve
          - Third-party platform terms and conditions must be observed
          - Customer responsibility for compliance with laws and regulations
          
          USER ACCOUNTS:
          - Password-protected access via platform
          - Encrypted email delivery of login credentials
          - Strict prohibition of sharing access credentials
          - Immediate notification required for suspected misuse
          
          SERVICE LEVEL AGREEMENT:
          - 99.5% availability per calendar year
          - Planned maintenance: 18:00-22:00 CET, max 1.5 hours/week
          - Regular maintenance: Tuesdays/Thursdays 10:00-10:20 CET
          - Weekend improvement activities excluded from availability calculation
          
          AI FUNCTIONALITY DISCLAIMER:
          zenloop 2.0/zenSurveys uses artificial intelligence for data analysis. AI-generated results are based on available data and algorithms and may vary in accuracy and reliability without zenloop influence or responsibility.
        `,
        type: DocumentType.COMPANY_DOC,
        metadata: {
          industry: Industry.TECHNOLOGY,
          confidence_score: 0.98,
          tags: ['terms-of-service', 'agb', 'sla', 'ai-disclaimer'],
          source: 'legal-documents',
          language: 'de',
          region: 'DE'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },

      // Customer Q&A Document
      {
        id: 'zenloop-kb-wuestenrot-qa',
        name: 'Wuestenrot Customer Q&A - Implementation Guide',
        content: `
          Zenloop Customer Q&A - Wuestenrot Implementation
          
          DEVELOPER RESOURCES:
          
          Survey Implementation Time:
          - Survey Creation: 15 minutes
          - Implementation (embedding code): 60-90 minutes  
          - Testing: 45 minutes
          - Total: 120-180 minutes per survey
          
          Technical Documentation:
          - Email embed: https://docs.zenloop.com/docs/email-embed-getting-started
          - Website overlay: https://support.zenloop.com/en/collections/259136-website-overlay-channel
          
          Multiple Website Surveys: Yes, possible on multiple websites simultaneously with code implementation on each page
          
          SURVEY FEATURES:
          
          zenSurveys vs zenClassic:
          - zenClassic: Limited to scale question + text box, especially on mobile
          - zenSurveys: All question types available in all channels
          
          Question Logic:
          - zenClassic: Based on NPS score only
          - zenSurveys: All logic types supported
          
          Test Response Management: Test responses can be deleted to avoid "responses exist" blocking message
          
          DYNAMIC FEATURES:
          
          Redirect Links: With zenSurveys, redirect links can be dynamic based on device, OS, etc. to direct customers to appropriate review platforms/app stores
          
          Link Customization: With zenSurveys, redirect link colors can be customized
          
          ACCESSIBILITY:
          
          WCAG 2.1 AA Compliance: Yes, zenloop supports WCAG 2.1 AA standards including keyboard navigation and screenreader compatibility
          
          Cookies: Yes, zenloop uses cookies. See privacy policy at https://www.zenloop.com/en/legal/privacy/
          
          OFFLINE FEEDBACK INTEGRATION:
          
          Traditional Channels: QR codes, tablets, link surveys for integrating offline interactions (emails, letters, phone calls, in-person consultations)
          
          Email Integration: Automatic forwarding and analysis of customer correspondence possible
          
          TARGETING & TRIGGERING:
          
          Available Options:
          - Time-delay, Exit-intent: UI-based
          - Scroll depth, Click events, Sticky sidebar: Via Google Tag Manager / Custom JS
          - User & Event properties: Via JS script
          - Frequency protection: Per survey throttling (seen/answered X days), channel-specific
          
          Sticky Sidebar Integration: Yes, surveys can be triggered on sidebar clicks
          
          Cross-channel Frequency Management: Transaction-based surveys with relevant feedback timing
          
          ANALYTICS & INTEGRATION:
          
          Multiple Metrics: Yes, detailed analysis available for NPS, CSAT, CES, and other metrics with zenSurveys
          
          Review Platform Integration: 
          - Google Reviews: Yes, automated scraping
          - App Store/Google Play: Yes, automated scraping  
          - Trustpilot: Yes, automated scraping
          - No manual CSV import needed
          
          Adobe Analytics: No native connector, data push via REST API or CDP possible
          
          Database Integration: Yes, automatic storage of survey results in customer database via API
          
          Microsoft Teams: Integration available
          
          Non-NPS Alerts: With zenSurveys, alerts can be triggered for all metrics, keywords, not just NPS
          
          Territory-based Alerts: Yes, automatic notification of sales representatives for negative feedback from their region
          
          AI Content Export: Yes, CSV export available for AI-generated content, summaries, and reports
          
          TOPICS & CATEGORIZATION:
          
          Topic Generation: Automatic AI generation, no manual dictionary required
          
          Translation: Automatic topic and keyword translation
          
          Feedback Tagging: Automatic tagging, no manual intervention required
          
          Page-based Tagging: Yes, automatic tagging with page ID/URL or custom page tags
          
          Value Stream Assignment: Yes, automatic assignment to value streams via custom properties or AI topics
          
          Duplicate Detection: Not in zenloop, handled in CRM
          
          DATA PROTECTION:
          
          Consent Management: Customer controls consent by only passing identity data when consent flag is set in customer database. Without consent, responses remain anonymous.
          
          Data Retention: Automatic anonymization or deletion after specified time available
          
          Data Storage: EU storage, see AVV and Privacy Policies
          
          PRICING STRUCTURE:
          
          Three Main Factors:
          1. Annual response volume
          2. Premium features (zenSurveys, Promotor Forwarding) and premium integrations (Salesforce Plug&Play)
          3. Onboarding and consulting scope by Customer Success team
        `,
        type: DocumentType.COMPANY_DOC,
        metadata: {
          industry: Industry.TECHNOLOGY,
          confidence_score: 0.95,
          tags: ['customer-qa', 'implementation', 'features', 'wuestenrot'],
          source: 'customer-support',
          language: 'de',
          region: 'DE'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },

      // Technical Architecture Document
      {
        id: 'zenloop-kb-technical-architecture',
        name: 'Zenloop Technical Architecture & Platform Review',
        content: `
          Zenloop Technical Due Diligence - Platform Architecture
          
          TECHNOLOGY STACK:
          
          Backend Technologies:
          - Elixir/Phoenix: Primary language and framework for core backend services, chosen for exceptional concurrency and reliability for real-time processing
          - Python: AI/ML microservices and specialized data processing pipelines
          - PostgreSQL: Primary relational database with advanced partitioning strategies
          - ElasticSearch: Search engine for efficient text analysis and complex querying
          - Redis: In-memory data store for caching and real-time features
          
          Frontend Technologies:
          - React: Primary framework for modern UI components and interactive dashboards
          - TypeScript: Type-safe JavaScript development
          - Ember.js: Legacy framework for existing components (actively migrating to React)
          - Modern CSS with SCSS preprocessor
          - Recharts and D3.js for data visualization
          
          Infrastructure and DevOps:
          - Amazon Web Services (AWS) cloud platform:
            * ECS for container orchestration
            * RDS for managed PostgreSQL databases
            * S3 for object storage
            * CloudFront for CDN services
            * CloudWatch for monitoring
            * CloudAMQP for queue management
          - Docker for containerization
          - GitHub Actions for CI/CD automation
          - Terraform for infrastructure as code
          - Sentry for error tracking and performance monitoring
          
          AI and Machine Learning:
          - Azure OpenAI for advanced natural language processing
          - Custom Python ML pipelines for domain-specific analysis
          - TensorFlow for specialized machine learning models
          - scikit-learn for traditional machine learning algorithms
          
          Integration and APIs:
          - RESTful APIs following OpenAPI specifications
          - GraphQL for data-intensive client applications
          - WebSockets for real-time features
          - OAuth 2.0 and JWT for authentication
          
          Security Technologies:
          - AWS Security services (GuardDuty, Config, CloudTrail)
          - Automated vulnerability scanning
          - Dependabot for dependency security management
          - HTTPS/TLS for all communications
          
          PLATFORM ARCHITECTURE:
          
          Microservices Architecture:
          - Survey management service
          - Rendering service  
          - Analysis service
          - Feedback analysis service
          - Report creation service
          - User Access Management (UAM)
          
          Data Flow:
          1. Survey responses stored in PostgreSQL (source of truth)
          2. Indexed into ElasticSearch for searching and analysis
          3. Processing pipeline analyzes text, assigns topics, extracts sentiment
          4. Results available via RESTful APIs and dashboards
          
          Deployment Infrastructure:
          - Services containerized using Docker
          - CI/CD pipelines through GitHub Actions
          - Three environments: Development, Staging, Production
          - AWS infrastructure: ELB, ECS Cluster, RDS PostgreSQL, S3 storage
          - Monitoring: CloudWatch, Prometheus, Grafana
          
          COMPLEXITY AREAS:
          
          1. PostgreSQL-ElasticSearch Synchronization: Sophisticated handling of race conditions and edge cases during reindexing
          
          2. Multi-language Support: Text analysis pipeline for numerous languages adds complexity to codebase and testing
          
          3. Legacy Ember Components: Coexistence with React creates integration challenges (actively migrating to React)
          
          4. Partitioning Strategy: PostgreSQL partitioning improves performance but adds query optimization complexity
          
          5. Integration Complexity: Numerous third-party integrations introduce potential external failure points
          
          MITIGATION STRATEGIES:
          - Comprehensive automated testing, especially for data synchronization
          - Detailed developer documentation
          - Incremental legacy code modernization
          - Regular monitoring of critical integration points
          
          FRAMEWORK SUPPORT:
          
          Frontend Integration:
          - Platform uses React and legacy Ember internally
          - Framework-agnostic JavaScript widget for customer integration
          - RESTful APIs for integration with any frontend framework
          - WebSocket support for real-time updates
          
          Performance Characteristics:
          - Real-time data processing pipeline using Elixir
          - Modular, API-first architecture
          - Machine learning pipeline for language detection, topic assignment, sentiment analysis
          - Efficient handling of large-scale, multi-staged survey data
        `,
        type: DocumentType.TECHNICAL_DOC,
        metadata: {
          industry: Industry.TECHNOLOGY,
          confidence_score: 0.99,
          tags: ['architecture', 'technical', 'infrastructure', 'aws', 'elixir', 'python'],
          source: 'technical-documentation',
          language: 'en',
          region: 'Global'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    // Process each document through the intelligence pipeline
    const allKnowledgeEntries: KnowledgeEntry[] = [];
    for (const document of documents) {
      console.log(`📄 Processing: ${document.name}`);
      
      const intelligenceResult = await documentIntelligence.processDocument(document);
      allKnowledgeEntries.push(...intelligenceResult.knowledgeEntries);
      
      // Store document in knowledge base
      if (simpleSupabase.isSupabaseConnected()) {
        try {
          await simpleSupabase.saveDocument(document);
          console.log(`✅ Saved to Supabase: ${document.name}`);
        } catch (error) {
          console.log(`💾 Stored locally: ${document.name} (Supabase not available)`);
        }
      }
    }

    const processingTime = Date.now() - startTime;
    
    console.log(`🎉 Knowledge ingestion completed!`);
    console.log(`📊 Processed ${documents.length} documents in ${processingTime}ms`);
    console.log(`🧠 Extracted ${allKnowledgeEntries.length} knowledge entries`);

    return {
      documentsProcessed: documents.length,
      knowledgeEntriesExtracted: allKnowledgeEntries.length,
      processingTime,
      documents,
      knowledgeEntries: allKnowledgeEntries
    };
  }

  async searchZenloopKnowledge(query: string, maxResults: number = 5): Promise<any[]> {
    // Simple search implementation - in production would use ElasticSearch
    const mockResults = [
      {
        id: 'pricing-info',
        title: 'Zenloop Pricing Information',
        content: 'Platform & Support: €20,000/year for 100,000 responses, 15 users, 1 business unit. Additional features available.',
        confidence: 0.95,
        source: 'DFL Purchase Order'
      },
      {
        id: 'gdpr-compliance',
        title: 'GDPR Compliance',
        content: 'zenloop is fully GDPR compliant with data storage in Europe, 2FA security, encryption, and comprehensive data protection measures.',
        confidence: 0.98,
        source: 'Privacy Policy'
      },
      {
        id: 'technical-stack',
        title: 'Technical Architecture',
        content: 'Built on Elixir/Phoenix backend with React frontend, PostgreSQL database, AWS infrastructure, and AI/ML capabilities using Python.',
        confidence: 0.92,
        source: 'Technical Architecture'
      }
    ];

    return mockResults.filter(result => 
      result.content.toLowerCase().includes(query.toLowerCase()) ||
      result.title.toLowerCase().includes(query.toLowerCase())
    ).slice(0, maxResults);
  }
}

export const knowledgeIngestion = new KnowledgeIngestionService();