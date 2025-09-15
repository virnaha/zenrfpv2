import React, { useState, useCallback, useEffect } from 'react';
import {
  Brain, CheckCircle2, Clock, AlertCircle, Target, TrendingUp,
  Users, Award, FileText, Eye, ArrowRight, ArrowLeft, RefreshCw,
  Lightbulb, Flag, Calendar, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';

import { documentAnalyzer } from '../../lib/services/document-analyzer';
import { useRFPAnalysis } from '../../hooks/useRFPAnalysis';

interface RFPAnalysisStepProps {
  project: any;
  onProjectUpdate: (project: any) => void;
  onNext: (step: string) => void;
  onError: (error: string) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

export const RFPAnalysisStep: React.FC<RFPAnalysisStepProps> = ({
  project,
  onProjectUpdate,
  onNext,
  onError,
  isProcessing,
  setIsProcessing
}) => {
  const { toast } = useToast();
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'analyzing' | 'completed' | 'error'>('idle');

  // Use the existing RFP analysis hook
  const rfpAnalysis = useRFPAnalysis({
    documentId: project?.document?.id,
    autoAnalyze: false
  });

  useEffect(() => {
    if (project?.document?.analysis) {
      setAnalysis(project.document.analysis);
      setAnalysisStatus('completed');
    }
  }, [project]);

  const runAnalysis = useCallback(async () => {
    if (!project?.document?.content) {
      onError('No document content available for analysis');
      return;
    }

    setIsProcessing(true);
    setAnalysisStatus('analyzing');
    setAnalysisProgress(0);

    try {
      const result = await documentAnalyzer.analyzeDocument(
        project.document.content,
        (progress) => {
          setAnalysisProgress(progress.progress);
          setCurrentStep(progress.currentStep || '');
        }
      );

      setAnalysis(result);
      setAnalysisStatus('completed');

      // Update project with analysis
      const updatedProject = {
        ...project,
        document: {
          ...project.document,
          analysis: result
        },
        updatedAt: new Date()
      };

      onProjectUpdate(updatedProject);

      toast({
        title: "Analysis Complete",
        description: "RFP document has been successfully analyzed with Zenloop expertise",
      });

    } catch (error) {
      setAnalysisStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      onError(`Document analysis failed: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  }, [project, onProjectUpdate, onError, setIsProcessing, toast]);

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const canProceed = analysisStatus === 'completed' && analysis;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Document Analysis</h2>
        <p className="text-muted-foreground">
          AI-powered analysis of your RFP document with Zenloop expertise
        </p>
      </div>

      {/* Analysis Trigger Card */}
      {analysisStatus === 'idle' && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Brain className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Ready to Analyze</h3>
              <p className="text-muted-foreground mb-6">
                Start the AI analysis to extract requirements, identify win themes, and develop strategic insights
              </p>
              <Button onClick={runAnalysis} className="px-8" size="lg">
                <Brain className="h-5 w-5 mr-2" />
                Start Analysis
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Progress */}
      {analysisStatus === 'analyzing' && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="relative mb-6">
                <Brain className="h-16 w-16 mx-auto text-primary animate-pulse" />
                <div className="absolute -top-1 -right-1">
                  <Clock className="h-6 w-6 text-blue-500 animate-spin" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Analyzing Document</h3>
              <p className="text-muted-foreground mb-6">{currentStep}</p>

              <div className="max-w-md mx-auto space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progress</span>
                  <span>{analysisProgress}%</span>
                </div>
                <Progress value={analysisProgress} className="h-3" />
              </div>

              <div className="mt-6 text-sm text-muted-foreground">
                <p>This may take 1-2 minutes depending on document complexity</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Error */}
      {analysisStatus === 'error' && (
        <Card>
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Analysis Failed</AlertTitle>
              <AlertDescription className="mt-2">
                There was an error analyzing your document. Please try again.
                <Button
                  variant="outline"
                  size="sm"
                  onClick={runAnalysis}
                  className="mt-2 ml-2"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Analysis
                </Button>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {analysisStatus === 'completed' && analysis && (
        <div className="space-y-6">
          {/* Success Banner */}
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Analysis Complete</AlertTitle>
            <AlertDescription>
              Your RFP has been analyzed with Zenloop expertise. Review the insights below and proceed to response generation.
            </AlertDescription>
          </Alert>

          {/* Analysis Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="requirements">Requirements</TabsTrigger>
              <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
              <TabsTrigger value="strategy">Strategy</TabsTrigger>
              <TabsTrigger value="themes">Win Themes</TabsTrigger>
              <TabsTrigger value="risks">Risks</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Requirements</p>
                        <p className="text-2xl font-bold">
                          {(analysis.criticalRequirementsMatrix?.mandatory?.length || 0) +
                           (analysis.criticalRequirementsMatrix?.desired?.length || 0) +
                           (analysis.criticalRequirementsMatrix?.optional?.length || 0)}
                        </p>
                      </div>
                      <Target className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Win Themes</p>
                        <p className="text-2xl font-bold">
                          {analysis.winThemes?.primaryValueDrivers?.length || 0}
                        </p>
                      </div>
                      <Award className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Stakeholders</p>
                        <p className="text-2xl font-bold">
                          {analysis.stakeholders?.length || 0}
                        </p>
                      </div>
                      <Users className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Red Flags</p>
                        <p className="text-2xl font-bold text-red-600">
                          {analysis.redFlags?.length || 0}
                        </p>
                      </div>
                      <Flag className="h-8 w-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Key Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Strategic Intelligence
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">Competitive Opportunities</h4>
                      <p className="text-sm text-muted-foreground">
                        {analysis.strategicIntelligence?.competitiveOpportunities || 'Not available'}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Timeline Pressures</h4>
                      <p className="text-sm text-muted-foreground">
                        {analysis.strategicIntelligence?.timelinePressures || 'Not available'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Requirements Tab */}
            <TabsContent value="requirements" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Mandatory Requirements */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Mandatory Requirements</CardTitle>
                    <CardDescription>Must-have features and capabilities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      <div className="space-y-3">
                        {analysis.criticalRequirementsMatrix?.mandatory?.map((req: any, index: number) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <p className="text-sm font-medium mb-1">{req.requirement}</p>
                            <p className="text-xs text-muted-foreground mb-2">{req.complianceMapping}</p>
                            <Badge variant="outline" className="text-xs">
                              {(req.confidence * 100).toFixed(0)}% confidence
                            </Badge>
                          </div>
                        )) || (
                          <p className="text-sm text-muted-foreground">No mandatory requirements identified</p>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Desired Requirements */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Desired Requirements</CardTitle>
                    <CardDescription>Preferred features that add value</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      <div className="space-y-3">
                        {analysis.criticalRequirementsMatrix?.desired?.map((req: any, index: number) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <p className="text-sm font-medium mb-1">{req.requirement}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">{req.weightScore}</span>
                              <Badge variant="outline" className="text-xs">
                                {(req.confidence * 100).toFixed(0)}% confidence
                              </Badge>
                            </div>
                          </div>
                        )) || (
                          <p className="text-sm text-muted-foreground">No desired requirements identified</p>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Win Themes Tab */}
            <TabsContent value="themes" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Primary Value Drivers</CardTitle>
                    <CardDescription>Key themes that resonate with evaluators</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analysis.winThemes?.primaryValueDrivers?.map((driver: string, index: number) => (
                        <Badge key={index} variant="secondary" className="mr-2 mb-2">
                          {driver}
                        </Badge>
                      )) || (
                        <p className="text-sm text-muted-foreground">No value drivers identified</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Pain Points</CardTitle>
                    <CardDescription>Current challenges to address</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analysis.winThemes?.painPoints?.map((pain: string, index: number) => (
                        <Badge key={index} variant="outline" className="mr-2 mb-2 border-orange-200 text-orange-800">
                          {pain}
                        </Badge>
                      )) || (
                        <p className="text-sm text-muted-foreground">No pain points identified</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Key Differentiators</CardTitle>
                    <CardDescription>Zenloop's unique advantages</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analysis.winThemes?.keyDifferentiators?.map((diff: string, index: number) => (
                        <Badge key={index} variant="outline" className="mr-2 mb-2 border-green-200 text-green-800">
                          {diff}
                        </Badge>
                      )) || (
                        <p className="text-sm text-muted-foreground">No differentiators identified</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Required Proof Points</CardTitle>
                    <CardDescription>Evidence needed to support claims</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analysis.winThemes?.requiredProofPoints?.map((proof: string, index: number) => (
                        <Badge key={index} variant="outline" className="mr-2 mb-2 border-blue-200 text-blue-800">
                          {proof}
                        </Badge>
                      )) || (
                        <p className="text-sm text-muted-foreground">No proof points identified</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Risks Tab */}
            <TabsContent value="risks" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Flag className="h-5 w-5" />
                    Risk Assessment
                  </CardTitle>
                  <CardDescription>
                    Potential challenges and mitigation strategies
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysis.redFlags?.map((flag: any, index: number) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium">{flag.flag}</h4>
                          <Badge
                            variant="outline"
                            className={getSeverityColor(flag.severity)}
                          >
                            {flag.severity} Risk
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{flag.impact}</p>
                        <div className="text-xs text-muted-foreground">
                          Confidence: {(flag.confidence * 100).toFixed(0)}%
                        </div>
                      </div>
                    )) || (
                      <p className="text-sm text-muted-foreground">No significant risks identified</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Other tabs would be implemented similarly */}
            <TabsContent value="evaluation">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">Evaluation criteria analysis coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="strategy">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">Strategic intelligence coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6">
        <Button variant="outline" onClick={() => onNext('upload')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Upload
        </Button>
        <Button
          onClick={() => onNext('generate')}
          disabled={!canProceed}
          className="flex items-center gap-2"
        >
          Next: Generate Responses
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};