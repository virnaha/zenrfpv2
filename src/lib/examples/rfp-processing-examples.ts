import { 
  Document, 
  DocumentType, 
  Industry, 
  WinStatus 
} from '../types/rfp-analyzer';
import { rfpAnalyzer } from '../services/rfp-analyzer';
import { learningEngine } from '../services/learning-engine';
import { documentIntelligence } from '../services/document-intelligence';

// Example 1: Healthcare RFP Processing
export const healthcareRFPExample = async (): Promise<void> => {
  console.log('🏥 Processing Healthcare RFP Example...');

  // Sample healthcare RFP document
  const healthcareRFP: Document = {
    id: 'healthcare-rfp-001',
    name: 'Patient Feedback Management System RFP',
    content: `
      HEALTHCARE MANAGEMENT SOLUTIONS RFP
      
      EXECUTIVE SUMMARY
      We are seeking a comprehensive patient feedback management system that can handle 
      high-volume patient survey distribution, real-time analytics, and seamless integration 
      with our existing EMR systems.
      
      MANDATORY REQUIREMENTS
      1. HIPAA compliance is absolutely mandatory
      2. Must integrate with Epic EMR system
      3. Real-time analytics dashboard required
      4. Multi-language support (English, Spanish, French)
      5. Mobile-responsive patient portal
      6. 99.9% uptime SLA required
      
      TECHNICAL SPECIFICATIONS
      - API integration with Epic FHIR R4
      - SOC 2 Type II certification required
      - Data encryption at rest and in transit
      - Role-based access control
      - Audit trail for all data access
      
      EVALUATION CRITERIA
      - Technical capability (40%)
      - Security and compliance (30%)
      - Cost (20%)
      - Implementation timeline (10%)
      
      TIMELINE
      - Proposal submission: 30 days
      - Vendor presentations: 45 days  
      - Final decision: 60 days
      - Implementation start: 90 days
    `,
    type: DocumentType.RFP,
    metadata: {
      client_name: 'Regional Healthcare Network',
      industry: Industry.HEALTHCARE,
      deal_size: 500000,
      confidence_score: 0.95,
      tags: ['healthcare', 'patient-feedback', 'epic-integration'],
      source: 'procurement-portal',
      language: 'en',
      region: 'US'
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Step 1: Document Intelligence Processing
  console.log('📄 Step 1: Processing document intelligence...');
  const intelligenceResult = await documentIntelligence.processDocument(healthcareRFP);
  
  console.log(`✅ Extracted ${intelligenceResult.knowledgeEntries.length} knowledge entries`);
  console.log(`✅ Identified ${intelligenceResult.requirements.length} requirements`);
  console.log(`✅ Quality score: ${Math.round(intelligenceResult.qualityScore * 100)}%`);

  // Step 2: RFP Analysis
  console.log('🧠 Step 2: Performing comprehensive RFP analysis...');
  const analysisResult = await rfpAnalyzer.analyzeRFP({
    document_id: healthcareRFP.id,
    analysis_depth: 'comprehensive',
    include_competitive_analysis: true,
    include_similar_rfps: true,
    max_similar_rfps: 5
  });

  console.log(`✅ Analysis completed in ${analysisResult.processing_time}ms`);
  console.log(`✅ Confidence score: ${Math.round(analysisResult.confidence_score * 100)}%`);
  console.log(`✅ Opportunity score: ${analysisResult.analysis.opportunity_score}%`);
  console.log(`✅ Found ${analysisResult.analysis.similar_rfps.length} similar historical RFPs`);

  // Step 3: Win Probability Prediction
  console.log('🎯 Step 3: Predicting win probability...');
  const winPrediction = await learningEngine.predictWinProbability(
    analysisResult.analysis,
    analysisResult.analysis.similar_rfps
  );

  console.log(`✅ Win probability: ${Math.round(winPrediction.probability * 100)}%`);
  console.log(`✅ Prediction confidence: ${Math.round(winPrediction.confidence * 100)}%`);
  console.log('✅ Key factors:', winPrediction.factors.join(', '));

  // Step 4: Pattern Discovery
  console.log('🔍 Step 4: Discovering new patterns...');
  const newPatterns = await learningEngine.discoverNewPatterns([healthcareRFP]);
  console.log(`✅ Discovered ${newPatterns.length} new question patterns`);

  console.log('🏥 Healthcare RFP processing completed successfully!\n');
};

// Example 2: Technology RFP Processing with Win/Loss Learning
export const technologyRFPExample = async (): Promise<void> => {
  console.log('💻 Processing Technology RFP Example...');

  const techRFP: Document = {
    id: 'tech-rfp-002',
    name: 'Customer Experience Platform RFP',
    content: `
      ENTERPRISE TECHNOLOGY SOLUTIONS RFP
      
      OVERVIEW
      We need a modern customer experience platform that can scale with our growing business
      and provide deep insights into customer satisfaction and engagement.
      
      REQUIREMENTS
      1. Must handle 100,000+ survey responses per month
      2. Advanced analytics and reporting capabilities
      3. API integrations with Salesforce, HubSpot, and Slack
      4. GDPR and CCPA compliance required
      5. White-label capabilities for client portal
      6. Real-time alerting and notifications
      7. Machine learning for sentiment analysis
      
      PREFERRED FEATURES
      - Custom branding options
      - Advanced segmentation capabilities  
      - Integration with Microsoft Teams
      - Mobile app for managers
      - Predictive analytics
      
      EVALUATION PROCESS
      - Technical demonstration required
      - Reference customer interviews
      - Security assessment
      - Total cost of ownership analysis
    `,
    type: DocumentType.RFP,
    metadata: {
      client_name: 'TechCorp Solutions',
      industry: Industry.TECHNOLOGY,
      deal_size: 250000,
      confidence_score: 0.88,
      tags: ['customer-experience', 'analytics', 'integrations'],
      source: 'direct-inquiry',
      language: 'en',
      region: 'EU'
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  console.log('📊 Analyzing technology RFP...');
  const analysisResult = await rfpAnalyzer.analyzeRFP({
    document_id: techRFP.id,
    analysis_depth: 'standard',
    include_competitive_analysis: true,
    include_similar_rfps: true,
    max_similar_rfps: 3
  });

  // Simulate winning this RFP
  console.log('🎉 Simulating WIN outcome...');
  await learningEngine.processWinLossOutcome(techRFP.id, WinStatus.WON, {
    winReason: 'Superior API integration capabilities and strong GDPR compliance',
    keyDecisionFactors: [
      'Native Salesforce integration',
      'GDPR compliance leadership',
      'Advanced analytics capabilities',
      'Competitive pricing'
    ],
    competitorsInvolved: ['SurveyMonkey', 'Qualtrics', 'Typeform']
  });

  console.log('✅ Win outcome processed - knowledge base updated');

  // Demonstrate learning from outcome
  console.log('🧠 Extracting lessons learned...');
  const insights = await learningEngine.generatePerformanceInsights();
  console.log(`✅ Generated ${insights.length} performance insights`);

  console.log('💻 Technology RFP processing completed successfully!\n');
};

// Example 3: Financial Services RFP with Loss Learning
export const financialServicesRFPExample = async (): Promise<void> => {
  console.log('🏦 Processing Financial Services RFP Example...');

  const financeRFP: Document = {
    id: 'finance-rfp-003',
    name: 'Banking Customer Satisfaction Platform RFP',
    content: `
      FINANCIAL SERVICES CUSTOMER FEEDBACK RFP
      
      BACKGROUND
      As a leading regional bank, we require a sophisticated customer feedback platform
      that meets strict financial services compliance requirements.
      
      MANDATORY COMPLIANCE
      1. SOX compliance required
      2. PCI DSS Level 1 certification mandatory  
      3. Fed regulations compliance (FFIEC guidelines)
      4. Multi-factor authentication required
      5. Advanced encryption standards
      
      FUNCTIONAL REQUIREMENTS
      - Branch and digital channel feedback collection
      - Net Promoter Score tracking and benchmarking
      - Complaint management workflow
      - Regulatory reporting capabilities
      - Customer journey mapping
      - Real-time escalation for critical issues
      
      TECHNICAL REQUIREMENTS
      - On-premise deployment option required
      - High availability (99.99% uptime)
      - Disaster recovery capabilities
      - API rate limiting and security
      - Data residency controls
      
      BUDGET CONSIDERATIONS
      - Multi-year licensing preferred
      - Professional services for implementation
      - Ongoing support and maintenance
      - Training for 50+ users
    `,
    type: DocumentType.RFP,
    metadata: {
      client_name: 'Metro Regional Bank',
      industry: Industry.FINANCE,
      deal_size: 750000,
      confidence_score: 0.92,
      tags: ['banking', 'compliance', 'on-premise'],
      source: 'banking-procurement',
      language: 'en',
      region: 'US'
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  console.log('🏦 Analyzing financial services RFP...');
  const analysisResult = await rfpAnalyzer.analyzeRFP({
    document_id: financeRFP.id,
    analysis_depth: 'comprehensive',
    include_competitive_analysis: true,
    include_similar_rfps: true,
    max_similar_rfps: 4
  });

  // Simulate losing this RFP
  console.log('❌ Simulating LOSS outcome...');
  await learningEngine.processWinLossOutcome(financeRFP.id, WinStatus.LOST, {
    lossReason: 'Lack of on-premise deployment option and limited banking-specific features',
    keyDecisionFactors: [
      'On-premise deployment requirement',
      'Banking-specific compliance features',
      'Incumbent vendor relationship',
      'Implementation complexity concerns'
    ],
    competitorsInvolved: ['Verint', 'NICE', 'ForeSee']
  });

  console.log('✅ Loss outcome processed - learning from feedback');

  // Generate recommendations based on loss
  console.log('💡 Generating improvement recommendations...');
  const recommendations = await learningEngine.optimizeResponseTemplates();
  console.log('✅ Recommendations generated:', recommendations.slice(0, 3).join(', '));

  console.log('🏦 Financial services RFP processing completed successfully!\n');
};

// Comprehensive Example Runner
export const runAllRFPExamples = async (): Promise<void> => {
  console.log('🚀 Running Comprehensive RFP Processing Examples...\n');
  
  const startTime = Date.now();
  
  try {
    // Run all examples
    await healthcareRFPExample();
    await technologyRFPExample();
    await financialServicesRFPExample();
    
    // Generate final learning report
    console.log('📈 Generating comprehensive learning report...');
    const learningReport = await learningEngine.exportLearningReport();
    
    console.log('='.repeat(60));
    console.log('📊 COMPREHENSIVE LEARNING REPORT');
    console.log('='.repeat(60));
    console.log(`📈 Total RFPs Analyzed: ${learningReport.summary.totalRFPsAnalyzed}`);
    console.log(`🎯 Average Win Rate: ${Math.round(learningReport.summary.averageWinRate * 100)}%`);
    console.log(`🧠 Knowledge Growth: ${Math.round(learningReport.summary.knowledgeGrowth * 100)}%`);
    console.log(`⚡ Processing Time: ${Date.now() - startTime}ms`);
    console.log('='.repeat(60));
    
    console.log('✅ All RFP processing examples completed successfully!');
    
  } catch (error) {
    console.error('❌ Error running RFP examples:', error);
  }
};

// Performance Benchmark Function
export const benchmarkRFPProcessing = async (): Promise<any> => {
  console.log('⏱️ Running RFP Processing Performance Benchmarks...\n');
  
  const benchmarks = {
    documentProcessing: [],
    analysisSpeed: [],
    learningUpdates: [],
    totalThroughput: 0
  };
  
  const testDocuments = [
    { size: 'small', contentLength: 1000 },
    { size: 'medium', contentLength: 5000 },
    { size: 'large', contentLength: 15000 },
    { size: 'extra_large', contentLength: 30000 }
  ];
  
  for (const testDoc of testDocuments) {
    console.log(`📊 Benchmarking ${testDoc.size} document (${testDoc.contentLength} chars)...`);
    
    // Create test document
    const testRFP: Document = {
      id: `benchmark-${testDoc.size}`,
      name: `Benchmark RFP - ${testDoc.size}`,
      content: 'Sample RFP content '.repeat(testDoc.contentLength / 20),
      type: DocumentType.RFP,
      metadata: {
        industry: Industry.TECHNOLOGY,
        confidence_score: 0.8,
        tags: ['benchmark'],
        source: 'benchmark',
        language: 'en',
        region: 'US'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Benchmark document processing
    const processingStart = Date.now();
    await documentIntelligence.processDocument(testRFP);
    const processingTime = Date.now() - processingStart;
    
    // Benchmark analysis
    const analysisStart = Date.now();
    await rfpAnalyzer.analyzeRFP({
      document_id: testRFP.id,
      analysis_depth: 'standard',
      include_competitive_analysis: false,
      include_similar_rfps: false,
      max_similar_rfps: 0
    });
    const analysisTime = Date.now() - analysisStart;
    
    console.log(`✅ ${testDoc.size}: Processing ${processingTime}ms, Analysis ${analysisTime}ms`);
    
    benchmarks.documentProcessing.push({ size: testDoc.size, time: processingTime });
    benchmarks.analysisSpeed.push({ size: testDoc.size, time: analysisTime });
  }
  
  benchmarks.totalThroughput = benchmarks.analysisSpeed.reduce((acc, b) => acc + b.time, 0);
  
  console.log('\n📈 Performance Benchmark Results:');
  console.log(`⚡ Average processing time: ${Math.round(benchmarks.documentProcessing.reduce((acc, b) => acc + b.time, 0) / benchmarks.documentProcessing.length)}ms`);
  console.log(`🧠 Average analysis time: ${Math.round(benchmarks.analysisSpeed.reduce((acc, b) => acc + b.time, 0) / benchmarks.analysisSpeed.length)}ms`);
  console.log(`🎯 Total throughput: ${benchmarks.totalThroughput}ms for 4 documents`);
  
  return benchmarks;
};

// Export example runner for easy execution
export default {
  runAllRFPExamples,
  healthcareRFPExample,
  technologyRFPExample,
  financialServicesRFPExample,
  benchmarkRFPProcessing
};