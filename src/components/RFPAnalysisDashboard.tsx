import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  Brain, 
  FileText, 
  Target, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Award,
  Users,
  Lightbulb
} from 'lucide-react';
import { rfpAnalyzer } from '@/lib/services/rfp-analyzer';
import { learningEngine } from '@/lib/services/learning-engine';

interface AnalysisOverview {
  totalRFPs: number;
  averageWinProbability: number;
  knowledgeEntries: number;
  patternsIdentified: number;
  timesSaved: number;
  winRateImprovement: number;
}

interface TrendData {
  month: string;
  winRate: number;
  rfpCount: number;
  averageScore: number;
}

interface RequirementAnalysis {
  category: string;
  count: number;
  matchRate: number;
  color: string;
}

export const RFPAnalysisDashboard: React.FC = () => {
  const [overview, setOverview] = useState<AnalysisOverview | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [requirements, setRequirements] = useState<RequirementAnalysis[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load overview data
      const overviewData = await loadOverviewData();
      setOverview(overviewData);

      // Load trend data
      const trendData = await loadTrendData();
      setTrends(trendData);

      // Load requirement analysis
      const reqData = await loadRequirementAnalysis();
      setRequirements(reqData);

      // Load learning insights
      const insightData = await learningEngine.generatePerformanceInsights();
      setInsights(insightData);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOverviewData = async (): Promise<AnalysisOverview> => {
    // In a real implementation, this would come from your analytics service
    return {
      totalRFPs: 45,
      averageWinProbability: 72,
      knowledgeEntries: 256,
      patternsIdentified: 34,
      timesSaved: 180, // hours
      winRateImprovement: 28 // percentage points
    };
  };

  const loadTrendData = async (): Promise<TrendData[]> => {
    return [
      { month: 'Jan', winRate: 58, rfpCount: 8, averageScore: 67 },
      { month: 'Feb', winRate: 62, rfpCount: 12, averageScore: 71 },
      { month: 'Mar', winRate: 68, rfpCount: 15, averageScore: 74 },
      { month: 'Apr', winRate: 72, rfpCount: 10, averageScore: 78 }
    ];
  };

  const loadRequirementAnalysis = async (): Promise<RequirementAnalysis[]> => {
    return [
      { category: 'Security', count: 89, matchRate: 92, color: '#0088FE' },
      { category: 'Integration', count: 67, matchRate: 78, color: '#00C49F' },
      { category: 'Performance', count: 54, matchRate: 85, color: '#FFBB28' },
      { category: 'Compliance', count: 43, matchRate: 95, color: '#FF8042' },
      { category: 'Support', count: 32, matchRate: 88, color: '#8884d8' }
    ];
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'win_rate_trend': return <TrendingUp className="h-4 w-4" />;
      case 'knowledge_gap': return <AlertTriangle className="h-4 w-4" />;
      case 'process_improvement': return <Lightbulb className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getInsightColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading analytics dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">RFP Intelligence Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive analytics and learning insights for your RFP responses
          </p>
        </div>
        <Button onClick={() => window.print()}>
          Export Report
        </Button>
      </div>

      {/* Overview Cards */}
      {overview && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total RFPs Analyzed</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.totalRFPs}</div>
              <p className="text-xs text-muted-foreground">
                +12% from last quarter
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Win Probability</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.averageWinProbability}%</div>
              <div className="mt-2">
                <Progress value={overview.averageWinProbability} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Knowledge Base</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.knowledgeEntries}</div>
              <p className="text-xs text-muted-foreground">
                {overview.patternsIdentified} patterns identified
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.timesSaved}h</div>
              <p className="text-xs text-muted-foreground">
                +{overview.winRateImprovement}% win rate improvement
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="analytics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="requirements">Requirements Analysis</TabsTrigger>
          <TabsTrigger value="insights">Learning Insights</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Win Rate Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Win Rate Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="winRate" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="Win Rate %" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* RFP Volume */}
            <Card>
              <CardHeader>
                <CardTitle>RFP Analysis Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="rfpCount" fill="#82ca9d" name="RFPs Analyzed" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="requirements" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Requirements Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Requirement Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={requirements}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, count }) => `${category}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {requirements.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Match Rates */}
            <Card>
              <CardHeader>
                <CardTitle>Capability Match Rates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {requirements.map((req) => (
                  <div key={req.category} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{req.category}</span>
                      <span>{req.matchRate}%</span>
                    </div>
                    <Progress value={req.matchRate} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4">
            {insights.length > 0 ? (
              insights.map((insight) => (
                <Card key={insight.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getInsightIcon(insight.type)}
                        <CardTitle className="text-lg">{insight.title}</CardTitle>
                      </div>
                      <Badge variant={getInsightColor(insight.impact) as any}>
                        {insight.impact}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{insight.description}</p>
                    
                    {insight.recommendations && insight.recommendations.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-semibold">Recommendations:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {insight.recommendations.map((rec: string, index: number) => (
                            <li key={index} className="text-sm">{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Confidence: {Math.round(insight.confidence * 100)}%</span>
                      <span>{new Date(insight.created_at).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Insights Generated Yet</h3>
                  <p className="text-muted-foreground">
                    As you analyze more RFPs and provide feedback, the system will generate insights to help improve your responses.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Knowledge Coverage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Validated Entries</span>
                    <span className="font-semibold">78%</span>
                  </div>
                  <Progress value={78} />
                  
                  <div className="flex justify-between">
                    <span>Industry Coverage</span>
                    <span className="font-semibold">65%</span>
                  </div>
                  <Progress value={65} />
                  
                  <div className="flex justify-between">
                    <span>Question Patterns</span>
                    <span className="font-semibold">89%</span>
                  </div>
                  <Progress value={89} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Knowledge Areas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Security & Compliance</span>
                    <Badge variant="secondary">95%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API Integration</span>
                    <Badge variant="secondary">87%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Pricing Models</span>
                    <Badge variant="secondary">82%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Case Studies</span>
                    <Badge variant="secondary">76%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Knowledge Gaps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Missing competitive analysis for fintech sector
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Limited healthcare compliance documentation
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Need more enterprise-scale case studies
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};