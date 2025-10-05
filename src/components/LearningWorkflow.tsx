import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Brain, 
  Target, 
  TrendingUp,
  FileCheck,
  Users,
  Lightbulb,
  Star,
  ArrowRight,
  Upload
} from 'lucide-react';
import { rfpAnalyzer } from '@/lib/services/rfp-analyzer';
import { learningEngine } from '@/lib/services/learning-engine';
import { WinStatus } from '@/lib/types/rfp-analyzer';

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  progress: number;
  actions?: string[];
}

interface LearningSession {
  id: string;
  rfpId: string;
  rfpName: string;
  startedAt: string;
  status: 'active' | 'completed' | 'review_needed';
  steps: WorkflowStep[];
  insights: any[];
  outcome?: WinStatus;
}

export const LearningWorkflow: React.FC = () => {
  const [activeSessions, setActiveSessions] = useState<LearningSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<LearningSession | null>(null);
  const [feedbackForm, setFeedbackForm] = useState({
    outcome: '',
    rating: 5,
    winFactors: '',
    lossReasons: '',
    improvements: '',
    competitors: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadActiveSessions();
  }, []);

  const loadActiveSessions = async () => {
    // Mock data - in real implementation, this would come from your backend
    const mockSessions: LearningSession[] = [
      {
        id: 'session-1',
        rfpId: 'rfp-healthcare-001',
        rfpName: 'Healthcare Management Platform RFP',
        startedAt: new Date().toISOString(),
        status: 'active',
        steps: [
          {
            id: 'step-1',
            title: 'Document Analysis',
            description: 'AI analysis of RFP requirements and extraction of key patterns',
            status: 'completed',
            progress: 100,
            actions: ['Extracted 23 requirements', 'Identified 8 question patterns', 'Found 3 similar historical RFPs']
          },
          {
            id: 'step-2',
            title: 'Knowledge Mapping',
            description: 'Mapping requirements to existing knowledge base',
            status: 'completed',
            progress: 100,
            actions: ['92% capability match found', 'Identified 2 knowledge gaps', 'Retrieved 15 relevant case studies']
          },
          {
            id: 'step-3',
            title: 'Response Generation',
            description: 'Generating initial response based on learned patterns',
            status: 'in_progress',
            progress: 75,
            actions: ['Generated 80% of response sections', 'Applied winning patterns from similar RFPs']
          },
          {
            id: 'step-4',
            title: 'Quality Review',
            description: 'Human review and feedback collection',
            status: 'pending',
            progress: 0,
            actions: []
          },
          {
            id: 'step-5',
            title: 'Outcome Learning',
            description: 'Learning from final outcome and updating knowledge base',
            status: 'pending',
            progress: 0,
            actions: []
          }
        ],
        insights: [
          {
            type: 'pattern_match',
            message: 'This RFP is 87% similar to a previous win in healthcare sector',
            confidence: 0.87,
            action: 'Apply winning strategy from similar RFP'
          },
          {
            type: 'risk_factor',
            message: 'Custom integration requirements may be challenging',
            confidence: 0.72,
            action: 'Prepare detailed integration plan'
          }
        ]
      }
    ];

    setActiveSessions(mockSessions);
    if (mockSessions.length > 0 && !selectedSession) {
      setSelectedSession(mockSessions[0]);
    }
  };

  const handleOutcomeFeedback = async () => {
    if (!selectedSession) return;

    setLoading(true);
    try {
      // Record the outcome and feedback
      await learningEngine.processWinLossOutcome(
        selectedSession.rfpId,
        feedbackForm.outcome as WinStatus,
        {
          winReason: feedbackForm.winFactors,
          lossReason: feedbackForm.lossReasons,
          keyDecisionFactors: feedbackForm.winFactors.split(',').map(f => f.trim()),
          competitorsInvolved: feedbackForm.competitors.split(',').map(c => c.trim())
        }
      );

      // Update session status
      const updatedSessions = activeSessions.map(session => 
        session.id === selectedSession.id 
          ? { ...session, status: 'completed' as const, outcome: feedbackForm.outcome as WinStatus }
          : session
      );
      setActiveSessions(updatedSessions);

      // Reset form
      setFeedbackForm({
        outcome: '',
        rating: 5,
        winFactors: '',
        lossReasons: '',
        improvements: '',
        competitors: ''
      });

      alert('Feedback recorded successfully! The system will learn from this outcome.');
    } catch (error) {
      console.error('Failed to record feedback:', error);
      alert('Failed to record feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUserFeedback = async (rating: number, comments: string) => {
    if (!selectedSession) return;

    try {
      await learningEngine.recordUserFeedback(
        selectedSession.id,
        'user_feedback' as any,
        rating,
        [comments],
        []
      );
      
      alert('Thank you for your feedback! This helps improve our AI responses.');
    } catch (error) {
      console.error('Failed to record user feedback:', error);
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in_progress': return <Clock className="h-5 w-5 text-blue-600" />;
      case 'pending': return <AlertCircle className="h-5 w-5 text-gray-400" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'pattern_match': return <Target className="h-4 w-4 text-green-600" />;
      case 'risk_factor': return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'opportunity': return <TrendingUp className="h-4 w-4 text-blue-600" />;
      default: return <Lightbulb className="h-4 w-4 text-purple-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Learning Workflow</h2>
          <p className="text-muted-foreground">
            Track RFP analysis progress and provide feedback to improve AI performance
          </p>
        </div>
        <Button>
          <Upload className="w-4 h-4 mr-2" />
          Start New Analysis
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Session List */}
        <Card>
          <CardHeader>
            <CardTitle>Active Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {activeSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedSession?.id === session.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedSession(session)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{session.rfpName}</h4>
                      <Badge 
                        variant={session.status === 'completed' ? 'default' : 'secondary'}
                      >
                        {session.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Started {new Date(session.startedAt).toLocaleDateString()}
                    </p>
                    <div className="mt-2">
                      <Progress 
                        value={session.steps.reduce((acc, step) => acc + step.progress, 0) / session.steps.length} 
                        className="h-1" 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Session Details */}
        <div className="md:col-span-2">
          {selectedSession ? (
            <Tabs defaultValue="workflow" className="space-y-4">
              <TabsList>
                <TabsTrigger value="workflow">Workflow</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
                <TabsTrigger value="feedback">Feedback</TabsTrigger>
              </TabsList>

              <TabsContent value="workflow" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{selectedSession.rfpName}</CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>Session ID: {selectedSession.id}</span>
                      <span>Started: {new Date(selectedSession.startedAt).toLocaleString()}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedSession.steps.map((step, index) => (
                        <div key={step.id} className="relative">
                          {index < selectedSession.steps.length - 1 && (
                            <div className="absolute left-[10px] top-[32px] w-[2px] h-[calc(100%-12px)] bg-gray-200" />
                          )}
                          
                          <div className="flex items-start space-x-3">
                            <div className="relative z-10 bg-white">
                              {getStepIcon(step.status)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-medium">{step.title}</h4>
                                <span className="text-sm text-muted-foreground">
                                  {step.progress}%
                                </span>
                              </div>
                              
                              <p className="text-sm text-muted-foreground mb-2">
                                {step.description}
                              </p>
                              
                              {step.progress > 0 && (
                                <Progress value={step.progress} className="h-2 mb-2" />
                              )}
                              
                              {step.actions && step.actions.length > 0 && (
                                <div className="space-y-1">
                                  {step.actions.map((action, actionIndex) => (
                                    <div key={actionIndex} className="text-xs flex items-center space-x-2">
                                      <CheckCircle className="h-3 w-3 text-green-600" />
                                      <span>{action}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="insights" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>AI Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedSession.insights.map((insight, index) => (
                        <Alert key={index}>
                          {getInsightIcon(insight.type)}
                          <AlertDescription className="ml-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{insight.message}</p>
                                <p className="text-sm text-muted-foreground mt-1">{insight.action}</p>
                              </div>
                              <Badge variant="outline">
                                {Math.round(insight.confidence * 100)}% confidence
                              </Badge>
                            </div>
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="feedback" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Provide Outcome Feedback</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Help the AI learn by providing feedback on the RFP outcome
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium">Outcome</label>
                        <Select value={feedbackForm.outcome} onValueChange={(value) => 
                          setFeedbackForm({...feedbackForm, outcome: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select outcome" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="won">Won</SelectItem>
                            <SelectItem value="lost">Lost</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="no_decision">No Decision</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Overall Rating</label>
                        <div className="flex items-center space-x-1 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-5 w-5 cursor-pointer ${
                                star <= feedbackForm.rating 
                                  ? 'text-yellow-400 fill-current' 
                                  : 'text-gray-300'
                              }`}
                              onClick={() => setFeedbackForm({...feedbackForm, rating: star})}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Key Win Factors (if won)</label>
                      <Textarea
                        placeholder="What were the key factors that led to winning this RFP?"
                        value={feedbackForm.winFactors}
                        onChange={(e) => setFeedbackForm({...feedbackForm, winFactors: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Loss Reasons (if lost)</label>
                      <Textarea
                        placeholder="What were the main reasons for losing this RFP?"
                        value={feedbackForm.lossReasons}
                        onChange={(e) => setFeedbackForm({...feedbackForm, lossReasons: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Competitors Involved</label>
                      <Input
                        placeholder="List main competitors (comma-separated)"
                        value={feedbackForm.competitors}
                        onChange={(e) => setFeedbackForm({...feedbackForm, competitors: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Improvement Suggestions</label>
                      <Textarea
                        placeholder="How could our response have been improved?"
                        value={feedbackForm.improvements}
                        onChange={(e) => setFeedbackForm({...feedbackForm, improvements: e.target.value})}
                      />
                    </div>

                    <Button 
                      onClick={handleOutcomeFeedback} 
                      disabled={!feedbackForm.outcome || loading}
                      className="w-full"
                    >
                      {loading ? 'Recording Feedback...' : 'Submit Feedback'}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Session Selected</h3>
                <p className="text-muted-foreground">
                  Select an active learning session from the list to view details
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};