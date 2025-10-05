import React, { useState, useCallback, useEffect } from 'react';
import {
  Eye, Edit3, Save, CheckCircle2, AlertCircle, MessageSquare,
  ThumbsUp, ThumbsDown, Clock, Award, BookOpen, FileText,
  MoreHorizontal, ArrowRight, ArrowLeft, Filter, Search,
  Download, Share2, Users, Flag, Target, History, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { Separator } from '@/components/ui/separator';

interface ResponseReviewPanelProps {
  project: any;
  onProjectUpdate: (project: any) => void;
  onNext: (step: string) => void;
  onError: (error: string) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

interface ReviewResponse {
  id: string;
  questionId: string;
  questionText: string;
  response: string;
  confidence: number;
  sources: Array<{
    title: string;
    content: string;
    relevance: number;
  }>;
  status: 'pending' | 'draft' | 'review' | 'approved' | 'rejected';
  reviewStatus: 'not_reviewed' | 'approved' | 'needs_changes' | 'rejected';
  reviewNotes?: string;
  completeness: number;
  wordCount: number;
  version: number;
  lastModified: Date;
  comments: Array<{
    id: string;
    author: string;
    content: string;
    timestamp: Date;
    type: 'comment' | 'suggestion' | 'approval';
  }>;
}

const REVIEW_FILTERS = [
  { value: 'all', label: 'All Responses' },
  { value: 'not_reviewed', label: 'Not Reviewed' },
  { value: 'approved', label: 'Approved' },
  { value: 'needs_changes', label: 'Needs Changes' },
  { value: 'rejected', label: 'Rejected' }
];

const COMPLETENESS_COLORS = {
  high: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-red-100 text-red-800 border-red-200'
};

export const ResponseReviewPanel: React.FC<ResponseReviewPanelProps> = ({
  project,
  onProjectUpdate,
  onNext,
  onError,
  isProcessing,
  setIsProcessing
}) => {
  const { toast } = useToast();
  const [responses, setResponses] = useState<ReviewResponse[]>([]);
  const [selectedResponseId, setSelectedResponseId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingResponseId, setEditingResponseId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');

  // Initialize with comprehensive sample data for immediate testing
  useEffect(() => {
    const sampleResponses: ReviewResponse[] = [
      {
        id: 'resp_1',
        questionId: 'q_1',
        questionText: 'Describe your platform\'s Net Promoter Score (NPS) survey capabilities, including automation features, benchmarking, and reporting functionality.',
        response: `zenloop offers industry-leading NPS survey capabilities with comprehensive automation and benchmarking features.

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
          { title: 'zenloop NPS Product Documentation', content: 'Comprehensive guide to NPS survey automation, targeting, and benchmarking features...', relevance: 0.96 },
          { title: 'Industry Benchmark Database', content: 'Access to 500+ industry verticals with detailed NPS performance metrics...', relevance: 0.91 }
        ],
        status: 'review',
        reviewStatus: 'approved',
        reviewNotes: 'Excellent comprehensive coverage of NPS capabilities',
        completeness: 95,
        wordCount: 187,
        version: 1,
        lastModified: new Date(),
        comments: [
          {
            id: 'c_1',
            author: 'Sarah Chen',
            content: 'Great detailed response covering all key aspects. The automation features section is particularly strong.',
            timestamp: new Date(),
            type: 'approval'
          }
        ]
      },
      {
        id: 'resp_2',
        questionId: 'q_2',
        questionText: 'What security certifications and compliance standards does your platform maintain (e.g., ISO 27001, SOC 2, GDPR)?',
        response: `zenloop maintains enterprise-grade security with comprehensive certifications and compliance standards that ensure the highest levels of data protection and regulatory adherence.

Our current security certifications include:
• ISO 27001:2013 certification for Information Security Management Systems
• SOC 2 Type II compliance for Security, Availability, and Confidentiality
• GDPR compliance with comprehensive data processing agreements
• Industry-standard encryption protocols (AES-256) for data at rest and in transit

We undergo regular security audits by independent third parties and maintain comprehensive audit trails for all system activities. Our security framework includes multi-factor authentication, role-based access controls, and continuous monitoring for potential threats.

Data residency options are available to meet regional compliance requirements, with data centers in the EU and US that meet strict security and availability standards.`,
        confidence: 98,
        sources: [
          { title: 'zenloop Security Certifications', content: 'Complete overview of security certifications and compliance standards...', relevance: 0.98 },
          { title: 'GDPR Compliance Documentation', content: 'Detailed GDPR compliance procedures and data processing agreements...', relevance: 0.92 }
        ],
        status: 'review',
        reviewStatus: 'approved',
        reviewNotes: 'Perfect security response - comprehensive and detailed',
        completeness: 98,
        wordCount: 156,
        version: 1,
        lastModified: new Date(),
        comments: []
      },
      {
        id: 'resp_3',
        questionId: 'q_3',
        questionText: 'How does your platform handle closed-loop feedback management and automated follow-up workflows for detractors?',
        response: `zenloop's closed-loop feedback management system provides comprehensive automation for converting detractors into promoters through intelligent follow-up workflows.

Our automated workflow system includes:
• Instant alert notifications when detractor responses are received
• Customizable escalation rules based on response sentiment and customer segment
• Automated case assignment to appropriate team members or departments
• Built-in collaboration tools for internal communication and resolution tracking

The platform enables creation of sophisticated workflow automation including conditional logic based on response scores, customer attributes, and historical interaction data. Teams can set up automatic follow-up sequences with personalized messaging and track resolution progress through integrated dashboards.

Advanced features include sentiment analysis of follow-up responses, integration with CRM systems for seamless case management, and automated reporting on resolution rates and customer satisfaction improvements.`,
        confidence: 91,
        sources: [
          { title: 'Closed-Loop Management Guide', content: 'Comprehensive guide to closed-loop feedback workflows and automation...', relevance: 0.94 },
          { title: 'Customer Success Case Studies', content: 'Real-world examples of closed-loop implementation and ROI...', relevance: 0.88 }
        ],
        status: 'review',
        reviewStatus: 'needs_changes',
        reviewNotes: 'Good content but needs specific metrics and success examples',
        completeness: 85,
        wordCount: 167,
        version: 1,
        lastModified: new Date(),
        comments: [
          {
            id: 'c_2',
            author: 'Review Team',
            content: 'Consider adding specific ROI metrics and customer success statistics.',
            timestamp: new Date(),
            type: 'suggestion'
          }
        ]
      },
      {
        id: 'resp_4',
        questionId: 'q_4',
        questionText: 'What integration capabilities do you offer for CRM systems, marketing automation platforms, and business intelligence tools?',
        response: `zenloop offers extensive integration capabilities with 200+ enterprise systems through our robust API and pre-built connectors.

CRM System Integrations:
• Salesforce, HubSpot, Microsoft Dynamics, and Pipedrive
• Bi-directional data synchronization for customer profiles and feedback
• Automated case creation and resolution tracking

Marketing Automation:
• Marketo, Pardot, Mailchimp, and Campaign Monitor integration
• Triggered campaigns based on NPS scores and feedback sentiment
• Customer segmentation based on satisfaction metrics

Business Intelligence Tools:
• Tableau, Power BI, Looker, and Qlik integration
• Real-time data streaming for custom dashboards
• Advanced analytics and reporting capabilities

Our RESTful API enables custom integrations with proprietary systems, and our technical team provides comprehensive integration support including documentation, SDKs, and dedicated implementation assistance.`,
        confidence: 89,
        sources: [
          { title: 'Integration Documentation', content: 'Complete API documentation and integration guides...', relevance: 0.93 },
          { title: 'Technical Architecture Guide', content: 'System architecture and integration capabilities...', relevance: 0.87 }
        ],
        status: 'review',
        reviewStatus: 'not_reviewed',
        completeness: 88,
        wordCount: 171,
        version: 1,
        lastModified: new Date(),
        comments: []
      },
      {
        id: 'resp_5',
        questionId: 'q_5',
        questionText: 'Provide detailed pricing information including subscription tiers, implementation costs, and ongoing support fees.',
        response: `zenloop offers flexible pricing models designed to scale with your organization's needs and provide exceptional value at every level.

Our subscription tiers include:
• Starter Plan: Ideal for small teams, includes core NPS functionality
• Professional Plan: Advanced features including closed-loop workflows and integrations
• Enterprise Plan: Full platform access with advanced analytics and dedicated support

Implementation typically ranges from 2-8 weeks depending on complexity, with our professional services team providing comprehensive onboarding, training, and integration support.

Ongoing support includes access to our customer success team, extensive knowledge base, regular platform updates, and training resources. Enterprise clients receive dedicated customer success managers and priority support.

We offer transparent pricing with no hidden fees and provide detailed ROI projections based on your specific use case and expected customer feedback volumes.`,
        confidence: 85,
        sources: [
          { title: 'Pricing Guide', content: 'Detailed pricing information and ROI calculations...', relevance: 0.95 },
          { title: 'Implementation Methodology', content: 'Standard implementation process and timelines...', relevance: 0.89 }
        ],
        status: 'review',
        reviewStatus: 'not_reviewed',
        completeness: 82,
        wordCount: 158,
        version: 1,
        lastModified: new Date(),
        comments: []
      }
    ];

    setResponses(sampleResponses);
    if (sampleResponses.length > 0 && !selectedResponseId) {
      setSelectedResponseId(sampleResponses[0].id);
    }
  }, [selectedResponseId]);

  const filteredResponses = responses.filter(response => {
    const matchesSearch = response.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         response.response.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || response.reviewStatus === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const selectedResponse = responses.find(r => r.id === selectedResponseId);

  const getReviewStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'needs_changes': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCompletenessLevel = (completeness: number) => {
    if (completeness >= 85) return { level: 'high', label: 'Complete' };
    if (completeness >= 70) return { level: 'medium', label: 'Good' };
    return { level: 'low', label: 'Needs Work' };
  };

  const updateReviewStatus = useCallback((responseId: string, status: string, notes?: string) => {
    setResponses(prev => prev.map(r =>
      r.id === responseId
        ? { ...r, reviewStatus: status as any, reviewNotes: notes }
        : r
    ));

    toast({
      title: "Review Updated",
      description: `Response marked as ${status.replace('_', ' ')}`,
    });
  }, [toast]);

  const saveEdit = useCallback((responseId: string) => {
    setResponses(prev => prev.map(r =>
      r.id === responseId
        ? {
            ...r,
            response: editedContent,
            lastModified: new Date(),
            version: r.version + 1
          }
        : r
    ));

    setEditingResponseId(null);
    setEditedContent('');

    toast({
      title: "Response Updated",
      description: "Changes saved successfully",
    });
  }, [editedContent, toast]);

  const addComment = useCallback(() => {
    if (!selectedResponse || !newComment.trim()) return;

    const comment = {
      id: `comment_${Date.now()}`,
      author: 'Current User',
      content: newComment.trim(),
      timestamp: new Date(),
      type: 'comment' as const
    };

    setResponses(prev => prev.map(r =>
      r.id === selectedResponse.id
        ? { ...r, comments: [...r.comments, comment] }
        : r
    ));

    setNewComment('');
    toast({
      title: "Comment Added",
      description: "Your comment has been saved",
    });
  }, [selectedResponse, newComment, toast]);

  const bulkApprove = useCallback(() => {
    const notReviewedResponses = filteredResponses.filter(r => r.reviewStatus === 'not_reviewed');

    setResponses(prev => prev.map(r =>
      notReviewedResponses.find(nr => nr.id === r.id)
        ? { ...r, reviewStatus: 'approved' as const }
        : r
    ));

    toast({
      title: "Bulk Approval Complete",
      description: `Approved ${notReviewedResponses.length} responses`,
    });
  }, [filteredResponses, toast]);

  const getOverallStats = () => {
    const total = responses.length;
    const approved = responses.filter(r => r.reviewStatus === 'approved').length;
    const needsChanges = responses.filter(r => r.reviewStatus === 'needs_changes').length;
    const avgConfidence = responses.reduce((sum, r) => sum + r.confidence, 0) / (total || 1);
    const avgCompleteness = responses.reduce((sum, r) => sum + r.completeness, 0) / (total || 1);

    return { total, approved, needsChanges, avgConfidence, avgCompleteness };
  };

  const stats = getOverallStats();
  const canProceed = stats.approved === stats.total && stats.total > 0;

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Response Review & Approval</h2>
          <p className="text-muted-foreground">Review, edit, and approve RFP responses before final export</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.approved}/{stats.total}</div>
            <div className="text-sm text-muted-foreground">Approved</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{stats.avgConfidence.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">Avg Confidence</div>
          </div>
          <Separator orientation="vertical" className="h-12" />
          <div className="flex flex-col gap-2">
            <Button
              onClick={bulkApprove}
              disabled={responses.filter(r => r.reviewStatus === 'not_reviewed').length === 0}
              variant="outline"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Approve All
            </Button>
            <Button
              onClick={() => onNext('export')}
              disabled={!canProceed}
            >
              Export Document →
            </Button>
          </div>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Review Progress</span>
            <span className="text-sm text-muted-foreground">{Math.round((stats.approved / stats.total) * 100)}%</span>
          </div>
          <Progress value={(stats.approved / stats.total) * 100} className="h-2" />
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>{stats.needsChanges} need changes</span>
            <span>{stats.total - stats.approved - stats.needsChanges} pending review</span>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search responses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {REVIEW_FILTERS.map(filter => (
                  <SelectItem key={filter.value} value={filter.value}>
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main review interface */}
      <div className="grid grid-cols-12 gap-6 min-h-[700px]">
        {/* Left panel - Responses list */}
        <div className="col-span-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Responses ({filteredResponses.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                <div className="p-4 space-y-3">
                  {filteredResponses.map((response) => {
                    const isSelected = selectedResponseId === response.id;
                    const completeness = getCompletenessLevel(response.completeness);

                    return (
                      <div
                        key={response.id}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          isSelected ? 'border-primary bg-primary/5' : 'hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedResponseId(response.id)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1">
                            <Badge
                              variant="outline"
                              className={getReviewStatusColor(response.reviewStatus)}
                            >
                              {response.reviewStatus.replace('_', ' ')}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-xs ${COMPLETENESS_COLORS[completeness.level as keyof typeof COMPLETENESS_COLORS]}`}
                            >
                              {completeness.label}
                            </Badge>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => updateReviewStatus(response.id, 'approved')}>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateReviewStatus(response.id, 'needs_changes')}>
                                <AlertCircle className="h-4 w-4 mr-2" />
                                Needs Changes
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateReviewStatus(response.id, 'rejected')}>
                                <Flag className="h-4 w-4 mr-2" />
                                Reject
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <p className="text-sm text-foreground line-clamp-2 mb-2">
                          {response.questionText}
                        </p>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Confidence: {response.confidence}%</span>
                          <span>{response.wordCount} words</span>
                        </div>

                        {response.comments.length > 0 && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-blue-600">
                            <MessageSquare className="h-3 w-3" />
                            {response.comments.length} comments
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

        {/* Right panel - Response details */}
        <div className="col-span-8">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Response Review
                </CardTitle>
                {selectedResponse && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateReviewStatus(selectedResponse.id, 'approved')}
                      disabled={selectedResponse.reviewStatus === 'approved'}
                    >
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateReviewStatus(selectedResponse.id, 'needs_changes')}
                    >
                      <ThumbsDown className="h-4 w-4 mr-2" />
                      Needs Changes
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingResponseId(selectedResponse.id);
                        setEditedContent(selectedResponse.response);
                      }}
                      disabled={editingResponseId === selectedResponse.id}
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {selectedResponse ? (
                <ScrollArea className="h-[600px]">
                  <div className="space-y-6">
                    {/* Question */}
                    <div>
                      <h3 className="font-semibold mb-2">Question</h3>
                      <p className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                        {selectedResponse.questionText}
                      </p>
                    </div>

                    {/* Response */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">Response</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-green-700">
                            {selectedResponse.confidence}% confidence
                          </Badge>
                          <Badge variant="outline">
                            v{selectedResponse.version}
                          </Badge>
                        </div>
                      </div>

                      {editingResponseId === selectedResponse.id ? (
                        <div className="space-y-4">
                          <Textarea
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            className="min-h-[300px] font-mono text-sm"
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setEditingResponseId(null);
                                setEditedContent('');
                              }}
                            >
                              Cancel
                            </Button>
                            <Button onClick={() => saveEdit(selectedResponse.id)}>
                              <Save className="h-4 w-4 mr-2" />
                              Save Changes
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="prose prose-sm max-w-none">
                          <div
                            className="whitespace-pre-wrap p-4 bg-gray-50 rounded-lg border"
                            dangerouslySetInnerHTML={{
                              __html: selectedResponse.response.replace(/\n/g, '<br>')
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Quality metrics */}
                    <div>
                      <h4 className="font-medium mb-3">Quality Assessment</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <Card>
                          <CardContent className="pt-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">
                                {selectedResponse.confidence}%
                              </div>
                              <div className="text-sm text-muted-foreground">Confidence</div>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">
                                {selectedResponse.completeness}%
                              </div>
                              <div className="text-sm text-muted-foreground">Completeness</div>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-purple-600">
                                {selectedResponse.wordCount}
                              </div>
                              <div className="text-sm text-muted-foreground">Words</div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    {/* Sources */}
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Sources ({selectedResponse.sources.length})
                      </h4>
                      <div className="space-y-2">
                        {selectedResponse.sources.map((source, index) => (
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

                    {/* Comments */}
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Comments & Feedback
                      </h4>
                      <div className="space-y-3">
                        {selectedResponse.comments.map((comment) => (
                          <div key={comment.id} className="p-3 border rounded-lg">
                            <div className="flex items-start justify-between mb-2">
                              <span className="font-medium text-sm">{comment.author}</span>
                              <span className="text-xs text-muted-foreground">
                                {comment.timestamp.toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm">{comment.content}</p>
                          </div>
                        ))}

                        <div className="flex gap-2">
                          <Input
                            placeholder="Add a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addComment()}
                          />
                          <Button onClick={addComment} disabled={!newComment.trim()}>
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex items-center justify-center h-96 text-muted-foreground">
                  <div className="text-center">
                    <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">Select a response to review</p>
                    <p className="text-sm">Choose a response from the list to review and approve</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6">
        <Button variant="outline" onClick={() => onNext('generate')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Generation
        </Button>
        <Button
          onClick={() => onNext('export')}
          disabled={!canProceed}
          className="flex items-center gap-2"
        >
          Next: Export Document
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};