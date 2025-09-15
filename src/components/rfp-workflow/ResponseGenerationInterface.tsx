import React, { useState, useCallback, useEffect } from 'react';
import {
  Sparkles, Play, RotateCcw, CheckCircle2, Clock, AlertCircle,
  BookOpen, Target, Zap, MessageSquare, Eye, Edit3, Save,
  ChevronDown, ChevronRight, Filter, Search, MoreHorizontal,
  TrendingUp, Award, Users, FileText, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';

// Import services
import { openAIService, OpenAIService, GenerationContext } from '../../lib/services/openai-service';
import { useQuestionExtraction } from '../../hooks/useQuestionExtraction';

interface ResponseGenerationProps {
  project: any;
  onProjectUpdate: (project: any) => void;
  onNext: (step: string) => void;
  onError: (error: string) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

interface ExtractedQuestion {
  id: string;
  text: string;
  category: string;
  complexity: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high';
  section?: string;
  subQuestions?: string[];
  keywords: string[];
}

interface ResponseData {
  id: string;
  questionId: string;
  content: string;
  confidence: number;
  sources: Array<{
    title: string;
    content: string;
    relevance: number;
  }>;
  status: 'pending' | 'generating' | 'completed' | 'error';
  generatedAt?: Date;
  template?: string;
  version: number;
  previousVersions: Array<{
    content: string;
    generatedAt: Date;
    template?: string;
  }>;
  error?: string;
}

const RESPONSE_TEMPLATES = [
  { id: 'comprehensive', name: 'Comprehensive Response', description: 'Detailed answer with examples' },
  { id: 'technical', name: 'Technical Focus', description: 'Technical depth and specifications' },
  { id: 'business', name: 'Business Value', description: 'ROI and business impact focused' },
  { id: 'competitive', name: 'Competitive Advantage', description: 'Highlight Zenloop differentiators' },
  { id: 'compliance', name: 'Compliance & Security', description: 'Regulatory and security emphasis' }
];

const CONFIDENCE_COLORS = {
  high: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-red-100 text-red-800 border-red-200'
};

const STATUS_COLORS = {
  pending: 'bg-gray-100 text-gray-800 border-gray-200',
  generating: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  error: 'bg-red-100 text-red-800 border-red-200'
};

export const ResponseGenerationInterface: React.FC<ResponseGenerationProps> = ({
  project,
  onProjectUpdate,
  onNext,
  onError,
  isProcessing,
  setIsProcessing
}) => {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<ExtractedQuestion[]>([]);
  const [responses, setResponses] = useState<Map<string, ResponseData>>(new Map());
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [selectedTemplate, setSelectedTemplate] = useState<string>('comprehensive');
  const [bulkGenerating, setBulkGenerating] = useState(false);

  // Extract questions from the document
  // Only use question extraction for real documents, not sample data
  const shouldExtractQuestions = project?.document?.content && !project?.document?.content.includes('sample RFP document content');
  const questionExtraction = useQuestionExtraction(shouldExtractQuestions ? project?.document?.content : undefined, false);

  useEffect(() => {
    // Initialize with sample data for immediate testing
    const sampleQuestions: ExtractedQuestion[] = [
      {
        id: 'q1',
        text: 'Describe your platform\'s Net Promoter Score (NPS) survey capabilities, including automation features, benchmarking, and reporting functionality.',
        category: 'NPS_PROGRAM',
        complexity: 'medium',
        priority: 'high',
        section: 'Core Features',
        keywords: ['NPS', 'Net Promoter Score', 'surveys', 'automation', 'benchmarking']
      },
      {
        id: 'q2',
        text: 'What security certifications and compliance standards does your platform maintain (e.g., ISO 27001, SOC 2, GDPR)?',
        category: 'PLATFORM_ARCHITECTURE',
        complexity: 'low',
        priority: 'high',
        section: 'Security & Compliance',
        keywords: ['security', 'compliance', 'ISO 27001', 'SOC 2', 'GDPR']
      },
      {
        id: 'q3',
        text: 'How does your platform handle closed-loop feedback management and automated follow-up workflows for detractors?',
        category: 'CLOSED_LOOP_MANAGEMENT',
        complexity: 'high',
        priority: 'medium',
        section: 'Workflow Management',
        keywords: ['closed-loop', 'feedback', 'automation', 'workflows', 'detractors']
      },
      {
        id: 'q4',
        text: 'What integration capabilities do you offer for CRM systems, marketing automation platforms, and business intelligence tools?',
        category: 'INTEGRATION_TECHNICAL',
        complexity: 'medium',
        priority: 'medium',
        section: 'Technical Integration',
        keywords: ['integration', 'CRM', 'API', 'automation', 'business intelligence']
      },
      {
        id: 'q5',
        text: 'Provide detailed pricing information including subscription tiers, implementation costs, and ongoing support fees.',
        category: 'PRICING',
        complexity: 'low',
        priority: 'high',
        section: 'Commercial',
        keywords: ['pricing', 'subscription', 'implementation', 'support', 'costs']
      }
    ];

    setQuestions(sampleQuestions);

    // Initialize responses map with sample responses
    const responsesMap = new Map<string, ResponseData>();

    // Add sample completed response
    responsesMap.set('q1', {
      id: 'resp_q1',
      questionId: 'q1',
      content: `Zenloop offers industry-leading NPS survey capabilities with comprehensive automation and benchmarking features.

Our platform provides automated NPS campaign management with smart targeting based on customer journey stages, behavioral triggers, and demographic segmentation. The system automatically distributes surveys via email, SMS, in-app notifications, and web intercepts.

Key automation features include:
• Intelligent send-time optimization based on individual customer preferences
• Dynamic survey routing based on customer segments and interaction history
• Automated reminder sequences with customizable timing and messaging
• Real-time response monitoring with instant notifications for critical feedback

Benchmarking capabilities include access to our comprehensive database of over 500 industry verticals, allowing you to compare your NPS scores against relevant industry standards. The platform provides detailed benchmark reports with percentile rankings, trend analysis, and competitive positioning insights.

Reporting functionality encompasses real-time dashboards, executive summaries, detailed analytics with drill-down capabilities, and automated report distribution. All reports can be customized and scheduled for regular delivery to stakeholders.`,
      confidence: 94,
      sources: [
        {
          title: 'Zenloop NPS Product Documentation',
          content: 'Comprehensive guide to NPS survey automation, targeting, and benchmarking features...',
          relevance: 0.96
        },
        {
          title: 'Industry Benchmark Database',
          content: 'Access to 500+ industry verticals with detailed NPS performance metrics...',
          relevance: 0.91
        }
      ],
      status: 'completed',
      version: 1,
      previousVersions: []
    });

    // Add sample generating response
    responsesMap.set('q2', {
      id: 'resp_q2',
      questionId: 'q2',
      content: 'Zenloop maintains enterprise-grade security with comprehensive certifications including ISO 27001, SOC 2 Type II, and GDPR compliance...',
      confidence: 0,
      sources: [],
      status: 'generating',
      version: 1,
      previousVersions: []
    });

    // Add sample pending responses
    ['q3', 'q4', 'q5'].forEach(qId => {
      responsesMap.set(qId, {
        id: `resp_${qId}`,
        questionId: qId,
        content: '',
        confidence: 0,
        sources: [],
        status: 'pending',
        version: 1,
        previousVersions: []
      });
    });

    setResponses(responsesMap);

    // Auto-select first question
    if (sampleQuestions.length > 0) {
      setSelectedQuestionId('q1');
    }

    // If we have real questions from document extraction, use those instead
    if (questionExtraction.data?.questions && shouldExtractQuestions) {
      setQuestions(questionExtraction.data.questions);
      const realResponsesMap = new Map<string, ResponseData>();
      questionExtraction.data.questions.forEach(q => {
        realResponsesMap.set(q.id, {
          id: `resp_${q.id}`,
          questionId: q.id,
          content: '',
          confidence: 0,
          sources: [],
          status: 'pending',
          version: 1,
          previousVersions: []
        });
      });
      setResponses(realResponsesMap);
    }
  }, [questionExtraction.data, shouldExtractQuestions]);

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (q.keywords && q.keywords.some(k => k?.toLowerCase().includes(searchTerm.toLowerCase())));
    const matchesCategory = filterCategory === 'all' || (q.category && q.category === filterCategory);
    const response = responses.get(q.id);
    const matchesStatus = filterStatus === 'all' || (response && response.status === filterStatus);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const generateResponse = useCallback(async (questionId: string, template?: string) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    const currentResponse = responses.get(questionId);
    if (!currentResponse) return;

    // Update status to generating
    const updatedResponse = { ...currentResponse, status: 'generating' as const };
    setResponses(prev => new Map(prev).set(questionId, updatedResponse));

    try {
      const generationContext: GenerationContext = {
        rfpContent: project.document.content,
        requirements: [question.text],
        targetAudience: 'RFP evaluation committee',
        companyProfile: 'Zenloop - Customer Experience Management Platform'
      };

      const sectionTemplate = OpenAIService.getSectionTemplates()['technical-approach'];

      const generatedContent = await openAIService.generateSection(
        'response-generation',
        generationContext,
        {
          ...sectionTemplate,
          promptTemplate: template ?
            `Generate a ${template} response for this RFP question: ${question.text}. ${sectionTemplate.promptTemplate}` :
            sectionTemplate.promptTemplate
        },
        (progress) => {
          // Update progress in real-time
          console.log('Generation progress:', progress);
        },
        (chunk) => {
          // Update content in real-time as it's generated
          setResponses(prev => {
            const newMap = new Map(prev);
            const current = newMap.get(questionId);
            if (current) {
              newMap.set(questionId, {
                ...current,
                content: current.content + chunk
              });
            }
            return newMap;
          });
        }
      );

      // Calculate confidence score based on content length and structure
      const confidence = Math.min(95, Math.max(60,
        (generatedContent.length / 500) * 30 +
        (generatedContent.split('\n').length * 5) + 40
      ));

      // Mock sources (in real implementation, these would come from RAG)
      const mockSources = [
        {
          title: 'Zenloop Product Documentation',
          content: 'Comprehensive platform capabilities and features...',
          relevance: 0.95
        },
        {
          title: 'Customer Success Case Study',
          content: 'Implementation results and ROI metrics...',
          relevance: 0.87
        },
        {
          title: 'Technical Architecture Guide',
          content: 'Security, scalability, and integration details...',
          relevance: 0.78
        }
      ];

      const finalResponse: ResponseData = {
        ...updatedResponse,
        content: generatedContent,
        confidence,
        sources: mockSources,
        status: 'completed',
        generatedAt: new Date(),
        template: template || selectedTemplate
      };

      setResponses(prev => new Map(prev).set(questionId, finalResponse));

      toast({
        title: "Response Generated",
        description: `Successfully generated response with ${confidence.toFixed(1)}% confidence`,
      });

    } catch (error) {
      const errorResponse = {
        ...updatedResponse,
        status: 'error' as const,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      setResponses(prev => new Map(prev).set(questionId, errorResponse));
      onError(`Failed to generate response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [questions, responses, project, selectedTemplate, toast, onError]);

  const bulkGenerate = useCallback(async () => {
    setBulkGenerating(true);
    const pendingQuestions = filteredQuestions.filter(q => {
      const response = responses.get(q.id);
      return response && response.status === 'pending';
    });

    for (const question of pendingQuestions) {
      await generateResponse(question.id);
      // Small delay between generations to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setBulkGenerating(false);
    toast({
      title: "Bulk Generation Complete",
      description: `Generated ${pendingQuestions.length} responses`,
    });
  }, [filteredQuestions, responses, generateResponse, toast]);

  const regenerateResponse = useCallback(async (questionId: string, template?: string) => {
    const currentResponse = responses.get(questionId);
    if (!currentResponse) return;

    // Save current version to history
    const updatedResponse = {
      ...currentResponse,
      previousVersions: [
        ...currentResponse.previousVersions,
        {
          content: currentResponse.content,
          generatedAt: currentResponse.generatedAt || new Date(),
          template: currentResponse.template
        }
      ],
      version: currentResponse.version + 1
    };

    setResponses(prev => new Map(prev).set(questionId, updatedResponse));
    await generateResponse(questionId, template);
  }, [responses, generateResponse]);

  const getCompletionStats = useCallback(() => {
    const total = questions.length;
    const completed = Array.from(responses.values()).filter(r => r.status === 'completed').length;
    const generating = Array.from(responses.values()).filter(r => r.status === 'generating').length;
    const avgConfidence = Array.from(responses.values())
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + r.confidence, 0) / (completed || 1);

    return { total, completed, generating, avgConfidence };
  }, [questions, responses]);

  const stats = getCompletionStats();

  return (
    <div className="space-y-6">
      {/* Header with stats and controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Response Generation</h2>
          <p className="text-muted-foreground">Generate professional RFP responses with Zenloop expertise</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{stats.completed}/{stats.total}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.avgConfidence.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">Avg Confidence</div>
          </div>
          <Separator orientation="vertical" className="h-12" />
          <div className="flex flex-col gap-2">
            <Button
              onClick={bulkGenerate}
              disabled={bulkGenerating || stats.completed === stats.total}
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              {bulkGenerating ? 'Generating...' : 'Generate All'}
            </Button>
            <Button
              variant="outline"
              onClick={() => onNext('review')}
              disabled={stats.completed === 0}
            >
              Review Responses →
            </Button>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-muted-foreground">{Math.round((stats.completed / stats.total) * 100)}%</span>
          </div>
          <Progress value={(stats.completed / stats.total) * 100} className="h-2" />
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>{stats.generating} generating</span>
            <span>{stats.total - stats.completed - stats.generating} pending</span>
          </div>
        </CardContent>
      </Card>

      {/* Filters and search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="pricing">Pricing</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
                <SelectItem value="implementation">Implementation</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="generating">Generating</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Response Template" />
              </SelectTrigger>
              <SelectContent>
                {RESPONSE_TEMPLATES.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main interface - Split layout */}
      <div className="grid grid-cols-12 gap-6 min-h-[600px]">
        {/* Left panel - Questions list */}
        <div className="col-span-5">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Questions ({filteredQuestions.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                <div className="p-4 space-y-3">
                  {filteredQuestions.map((question) => {
                    const response = responses.get(question.id);
                    const isExpanded = expandedQuestions.has(question.id);
                    const isSelected = selectedQuestionId === question.id;

                    return (
                      <div
                        key={question.id}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          isSelected ? 'border-primary bg-primary/5' : 'hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedQuestionId(question.id)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1">
                            <Badge variant="outline" className="text-xs">
                              {question.category || 'Uncategorized'}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-xs ${CONFIDENCE_COLORS[question.priority as keyof typeof CONFIDENCE_COLORS]}`}
                            >
                              {question.priority}
                            </Badge>
                            {response && (
                              <Badge
                                variant="outline"
                                className={`text-xs ${STATUS_COLORS[response.status as keyof typeof STATUS_COLORS]}`}
                              >
                                {response.status}
                              </Badge>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => generateResponse(question.id)}>
                                <Play className="h-4 w-4 mr-2" />
                                Generate Response
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => regenerateResponse(question.id)}>
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Regenerate
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <p className="text-sm text-foreground line-clamp-2 mb-2">
                          {question.text}
                        </p>

                        {response && response.status === 'completed' && (
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Confidence: {response.confidence.toFixed(1)}%</span>
                            <span>{response.sources.length} sources</span>
                          </div>
                        )}

                        {response && response.status === 'generating' && (
                          <div className="flex items-center gap-2 text-xs text-blue-600">
                            <Clock className="h-3 w-3 animate-spin" />
                            Generating response...
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right panel - Response display */}
        <div className="col-span-7">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Response Details
                </CardTitle>
                {selectedQuestionId && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateResponse(selectedQuestionId)}
                      disabled={!selectedQuestionId}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Generate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => regenerateResponse(selectedQuestionId)}
                      disabled={!selectedQuestionId}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Regenerate
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {selectedQuestionId && questions.find(q => q.id === selectedQuestionId) && responses.get(selectedQuestionId) ? (
                <ResponseDetailView
                  question={questions.find(q => q.id === selectedQuestionId)!}
                  response={responses.get(selectedQuestionId)!}
                  onRegenerate={(template) => regenerateResponse(selectedQuestionId, template)}
                  templates={RESPONSE_TEMPLATES}
                />
              ) : (
                <div className="flex items-center justify-center h-96 text-muted-foreground">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">Select a question to view response</p>
                    <p className="text-sm">Click on any question from the list to generate or view its response</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Component for displaying response details
const ResponseDetailView: React.FC<{
  question: ExtractedQuestion;
  response: ResponseData;
  onRegenerate: (template?: string) => void;
  templates: typeof RESPONSE_TEMPLATES;
}> = ({ question, response, onRegenerate, templates }) => {
  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState(response?.content || '');

  useEffect(() => {
    setEditedContent(response?.content || '');
  }, [response?.content]);

  // Early return if response is not defined
  if (!response) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>No response data available</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[600px]">
      <div className="space-y-6">
        {/* Question */}
        <div>
          <h3 className="font-semibold mb-2">Question</h3>
          <p className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
            {question.text}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">{question.category || 'Uncategorized'}</Badge>
            <Badge variant="outline">{question.priority} priority</Badge>
            <Badge variant="outline">{question.complexity} complexity</Badge>
          </div>
        </div>

        {/* Response */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Response</h3>
            <div className="flex items-center gap-2">
              {response.status === 'completed' && (
                <Badge variant="outline" className="text-green-700">
                  {response.confidence.toFixed(1)}% confidence
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditMode(!editMode)}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                {editMode ? 'Cancel' : 'Edit'}
              </Button>
            </div>
          </div>

          {response.status === 'pending' && (
            <div className="p-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
              <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Click "Generate" to create a response</p>
            </div>
          )}

          {response.status === 'generating' && (
            <div className="p-8 text-center text-blue-600 border-2 border-dashed border-blue-200 rounded-lg">
              <Clock className="h-8 w-8 mx-auto mb-2 animate-spin" />
              <p>Generating response...</p>
            </div>
          )}

          {response.status === 'error' && (
            <div className="p-4 text-center text-red-600 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-6 w-6 mx-auto mb-2" />
              <p>Error: {response.error}</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => onRegenerate()}>
                Try Again
              </Button>
            </div>
          )}

          {response.status === 'completed' && (
            <div className="space-y-4">
              {editMode ? (
                <div className="space-y-4">
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="min-h-[200px] font-mono text-sm"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setEditMode(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => {
                      // Save edited content
                      setEditMode(false);
                    }}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none">
                  <div
                    className="whitespace-pre-wrap p-4 bg-gray-50 rounded-lg border"
                    dangerouslySetInnerHTML={{ __html: (response.content || '').replace(/\n/g, '<br>') }}
                  />
                </div>
              )}

              {/* Sources */}
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Sources ({response.sources?.length || 0})
                </h4>
                <div className="space-y-2">
                  {(response.sources || []).map((source, index) => (
                    <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{source.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {(source.relevance * 100).toFixed(0)}% relevant
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{source.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Template variations */}
              <div>
                <h4 className="font-medium mb-2">Try Different Template</h4>
                <div className="grid grid-cols-2 gap-2">
                  {templates.map((template) => (
                    <Button
                      key={template.id}
                      variant="outline"
                      size="sm"
                      onClick={() => onRegenerate(template.id)}
                      className="justify-start text-left h-auto p-3"
                    >
                      <div>
                        <div className="font-medium text-xs">{template.name}</div>
                        <div className="text-xs text-muted-foreground">{template.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
};