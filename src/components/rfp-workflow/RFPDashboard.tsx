import React, { useState } from 'react';
import {
  Plus, Search, Filter, MoreHorizontal, Calendar, Clock, Target,
  TrendingUp, Award, Users, FileText, CheckCircle2, AlertCircle,
  BarChart3, PieChart, Activity, Zap, BookOpen, MessageSquare,
  Upload, Brain, Sparkles, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface RFPDashboardProps {
  projects: any[];
  onProjectSelect: (project: any) => void;
  onCreateNew: (name: string) => void;
  project: any;
  onProjectUpdate: (project: any) => void;
  onNext: (step: string) => void;
  onError: (error: string) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

export const RFPDashboard: React.FC<RFPDashboardProps> = ({
  projects,
  onProjectSelect,
  onCreateNew,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.documentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'review': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProgressPercentage = (project: any) => {
    let completed = 0;
    const total = 5; // Total workflow steps

    if (project.document) completed++;
    if (project.document?.analysis) completed++;
    if (project.questionsAnswered > 0) completed++;
    if (project.status === 'review' || project.status === 'completed') completed++;
    if (project.status === 'completed') completed++;

    return (completed / total) * 100;
  };

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      onCreateNew(newProjectName.trim());
      setNewProjectName('');
      setShowCreateDialog(false);
    }
  };

  // Mock statistics for demonstration
  const stats = {
    totalProjects: projects.length,
    completedProjects: projects.filter(p => p.status === 'completed').length,
    inProgress: projects.filter(p => p.status === 'in_progress' || p.status === 'review').length,
    avgResponseTime: '2.3 hours',
    avgConfidence: 89.5,
    timeSaved: '156 hours'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">RFP Response Dashboard</h2>
          <p className="text-muted-foreground">Manage your RFP projects and track progress</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New RFP Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New RFP Project</DialogTitle>
              <DialogDescription>
                Start a new RFP response project. You'll be able to upload your RFP document in the next step.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  placeholder="e.g., Acme Corp CX Platform RFP"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateProject} disabled={!newProjectName.trim()}>
                Create Project
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Projects</p>
                <p className="text-2xl font-bold">{stats.totalProjects}</p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completedProjects}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
                <p className="text-2xl font-bold">{stats.avgResponseTime}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Confidence</p>
                <p className="text-2xl font-bold">{stats.avgConfidence}%</p>
              </div>
              <Award className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Time Saved</p>
                <p className="text-2xl font-bold">{stats.timeSaved}</p>
              </div>
              <Zap className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No RFP Projects Yet</h3>
              <p className="text-muted-foreground mb-6">
                {projects.length === 0
                  ? "Create your first RFP project to get started with professional response generation."
                  : "No projects match your search criteria."
                }
              </p>
              {projects.length === 0 && (
                <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Project
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-1">{project.name}</CardTitle>
                    <CardDescription className="line-clamp-1">
                      {project.documentName}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onProjectSelect(project)}>
                        Open Project
                      </DropdownMenuItem>
                      <DropdownMenuItem>Duplicate</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Status and Progress */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className={getStatusColor(project.status)}
                    >
                      {project.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(getProgressPercentage(project))}%
                    </span>
                  </div>
                  <Progress value={getProgressPercentage(project)} className="h-2" />
                </div>

                {/* Project Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {project.questionsAnswered}/{project.questionsTotal} answered
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {project.confidence}% confidence
                    </span>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    Created: {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    Updated: {new Date(project.updatedAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  onClick={() => onProjectSelect(project)}
                  className="w-full mt-4"
                  variant={project.status === 'completed' ? 'outline' : 'default'}
                >
                  {project.status === 'completed' ? 'View Project' : 'Continue Working'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Start Guide for empty state */}
      {projects.length === 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center max-w-2xl mx-auto">
              <BookOpen className="h-16 w-16 mx-auto mb-6 text-blue-600" />
              <h3 className="text-xl font-semibold mb-4">Get Started with Professional RFP Responses</h3>
              <p className="text-muted-foreground mb-6">
                Our AI-powered RFP response generator helps you create professional, accurate responses
                using Zenloop's expertise and knowledge base. Here's how it works:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Upload className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">1. Upload</h4>
                    <p className="text-sm text-muted-foreground">Upload your RFP document (PDF, DOCX, or TXT)</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Brain className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">2. Analyze</h4>
                    <p className="text-sm text-muted-foreground">AI extracts questions and requirements</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Sparkles className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">3. Generate</h4>
                    <p className="text-sm text-muted-foreground">Create responses with Zenloop expertise</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <Download className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">4. Export</h4>
                    <p className="text-sm text-muted-foreground">Download professional Word/PDF document</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setShowCreateDialog(true)}
                className="mt-8 px-8"
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Your First RFP Project
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};