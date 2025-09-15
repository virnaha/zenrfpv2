import React, { useState, useCallback, useRef } from 'react';
import {
  Upload, FileText, Brain, Sparkles, CheckCircle2, AlertCircle,
  ArrowRight, ArrowLeft, Eye, Download, Clock, Target, Award,
  Users, Settings, BookOpen, MessageSquare, Edit3, Save, Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';

// Import existing services and hooks
import { fileProcessor } from '../lib/services/file-processor';
import { documentAnalyzer } from '../lib/services/document-analyzer';
import { useRFPAnalysis } from '../hooks/useRFPAnalysis';
import { useQuestionExtraction } from '../hooks/useQuestionExtraction';

// Import components directly to avoid lazy loading issues
import { RFPUploadWizard } from './rfp-workflow/RFPUploadWizard';
import { RFPAnalysisStep } from './rfp-workflow/RFPAnalysisStep';
import { ResponseGenerationInterface } from './rfp-workflow/ResponseGenerationInterface';
import { ResponseReviewPanel } from './rfp-workflow/ResponseReviewPanel';
import { RFPExportStep } from './rfp-workflow/RFPExportStep';
import { RFPDashboard } from './rfp-workflow/RFPDashboard';

type WorkflowStep = 'dashboard' | 'upload' | 'analyze' | 'generate' | 'review' | 'export';

interface RFPProject {
  id: string;
  name: string;
  documentName: string;
  status: 'draft' | 'in_progress' | 'review' | 'completed';
  createdAt: Date;
  updatedAt: Date;
  questionsTotal: number;
  questionsAnswered: number;
  confidence: number;
  document?: ProcessedDocument;
  responses?: ResponseData[];
}

interface ProcessedDocument {
  id: string;
  name: string;
  size: number;
  content: string;
  analysis?: any;
  questionAnalysis?: any;
  uploadedAt: Date;
}

interface ResponseData {
  id: string;
  questionId: string;
  questionText: string;
  response: string;
  confidence: number;
  sources: string[];
  status: 'pending' | 'generating' | 'completed' | 'approved';
  generatedAt?: Date;
  approvedAt?: Date;
  version: number;
  editHistory: Array<{
    version: number;
    content: string;
    editedAt: Date;
    editedBy: string;
  }>;
}

export const ProfessionalRFPWorkflow: React.FC = () => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('generate');
  const [currentProject, setCurrentProject] = useState<RFPProject | null>(null);
  const [projects, setProjects] = useState<RFPProject[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize with sample project for immediate testing
  React.useEffect(() => {
    const sampleProject: RFPProject = {
      id: 'sample_project_1',
      name: 'Customer Experience Platform RFP',
      documentName: 'Sample RFP Document',
      status: 'in_progress',
      createdAt: new Date(),
      updatedAt: new Date(),
      questionsTotal: 5,
      questionsAnswered: 2, // Show some progress
      confidence: 85,
      document: {
        id: 'sample_doc_1',
        name: 'Sample RFP Document',
        size: 1024000,
        content: 'This is a sample RFP document content for testing purposes. It contains questions about customer experience platforms, NPS surveys, security requirements, integrations, and pricing.',
        uploadedAt: new Date(),
        metadata: {
          pages: 8,
          wordCount: 2500,
          questionsEstimate: 5
        },
        analysis: {
          summary: 'RFP for customer experience platform selection',
          keyTopics: ['NPS', 'Customer Experience', 'Security', 'Integrations', 'Pricing'],
          complexity: 'medium',
          estimatedResponseTime: '2-3 hours'
        }
      }
    };

    setCurrentProject(sampleProject);
    setProjects([sampleProject]);
  }, []);

  // Calculate overall progress
  const calculateProgress = useCallback((project: RFPProject) => {
    if (!project) return 0;
    const steps = ['upload', 'analyze', 'generate', 'review', 'export'];
    let completed = 0;

    if (project.document) completed++; // Upload
    if (project.document?.analysis) completed++; // Analyze
    if (project.questionsAnswered > 0) completed++; // Generate
    if (project.status === 'review' || project.status === 'completed') completed++; // Review
    if (project.status === 'completed') completed++; // Export

    return (completed / steps.length) * 100;
  }, []);

  const getStepStatus = (step: WorkflowStep, project: RFPProject | null) => {
    if (!project) return 'pending';

    switch (step) {
      case 'upload': return project.document ? 'completed' : 'pending';
      case 'analyze': return project.document?.analysis ? 'completed' : 'pending';
      case 'generate': return project.questionsAnswered > 0 ? 'completed' : 'pending';
      case 'review': return project.status === 'review' || project.status === 'completed' ? 'completed' : 'pending';
      case 'export': return project.status === 'completed' ? 'completed' : 'pending';
      default: return 'pending';
    }
  };

  const createNewProject = useCallback((documentName: string) => {
    const newProject: RFPProject = {
      id: `rfp_${Date.now()}`,
      name: `RFP Response - ${documentName}`,
      documentName,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      questionsTotal: 0,
      questionsAnswered: 0,
      confidence: 0,
    };

    setCurrentProject(newProject);
    setProjects(prev => [...prev, newProject]);
    setCurrentStep('upload');

    return newProject;
  }, []);

  const navigateToStep = useCallback((step: WorkflowStep) => {
    setCurrentStep(step);
    setError(null);
  }, []);

  const handleProjectSelect = useCallback((project: RFPProject) => {
    setCurrentProject(project);

    // Determine the appropriate step based on project status
    if (!project.document) {
      setCurrentStep('upload');
    } else if (!project.document.analysis) {
      setCurrentStep('analyze');
    } else if (project.questionsAnswered === 0) {
      setCurrentStep('generate');
    } else if (project.status === 'draft' || project.status === 'in_progress') {
      setCurrentStep('review');
    } else {
      setCurrentStep('export');
    }
  }, []);

  // Render the workflow navigation
  const renderWorkflowNavigation = () => {
    const steps: Array<{ key: WorkflowStep; label: string; icon: React.ComponentType; description: string }> = [
      { key: 'dashboard', label: 'Dashboard', icon: Target, description: 'Project overview' },
      { key: 'upload', label: 'Upload', icon: Upload, description: 'Upload RFP document' },
      { key: 'analyze', label: 'Analyze', icon: Brain, description: 'AI document analysis' },
      { key: 'generate', label: 'Generate', icon: Sparkles, description: 'Create responses' },
      { key: 'review', label: 'Review', icon: Eye, description: 'Review & approve' },
      { key: 'export', label: 'Export', icon: Download, description: 'Generate final document' }
    ];

    return (
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">RFP Response Generator</h1>
              <p className="text-muted-foreground">Professional RFP response creation with Zenloop expertise</p>
            </div>
            {currentProject && (
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Progress</div>
                <div className="flex items-center gap-2">
                  <Progress value={calculateProgress(currentProject)} className="w-32" />
                  <span className="text-sm font-medium">{Math.round(calculateProgress(currentProject))}%</span>
                </div>
              </div>
            )}
          </div>

          <nav className="flex items-center space-x-6 overflow-x-auto">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const status = getStepStatus(step.key, currentProject);
              const isActive = currentStep === step.key;
              const isCompleted = status === 'completed';
              const isAccessible = currentProject || step.key === 'dashboard';

              return (
                <div key={step.key} className="flex items-center space-x-4">
                  <button
                    onClick={() => isAccessible && navigateToStep(step.key)}
                    disabled={!isAccessible}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors min-w-0 ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : isCompleted
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : isAccessible
                        ? 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        : 'text-muted-foreground/50 cursor-not-allowed'
                    }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium truncate">{step.label}</div>
                      <div className="text-xs opacity-75 truncate">{step.description}</div>
                    </div>
                    {isCompleted && <CheckCircle2 className="h-3 w-3 flex-shrink-0" />}
                  </button>
                  {index < steps.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>
    );
  };

  // Render the current step content
  const renderStepContent = () => {
    const commonProps = {
      project: currentProject,
      onProjectUpdate: (updatedProject: RFPProject) => {
        setCurrentProject(updatedProject);
        setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
      },
      onNext: (nextStep: WorkflowStep) => navigateToStep(nextStep),
      onError: setError,
      isProcessing,
      setIsProcessing
    };

    switch (currentStep) {
      case 'dashboard':
        return (
          <RFPDashboard
            projects={projects}
            onProjectSelect={handleProjectSelect}
            onCreateNew={createNewProject}
            {...commonProps}
          />
        );

      case 'upload':
        return (
          <RFPUploadWizard
            {...commonProps}
          />
        );

      case 'analyze':
        return (
          <RFPAnalysisStep
            {...commonProps}
          />
        );

      case 'generate':
        return (
          <ResponseGenerationInterface
            {...commonProps}
          />
        );

      case 'review':
        return (
          <ResponseReviewPanel
            {...commonProps}
          />
        );

      case 'export':
        return (
          <RFPExportStep
            {...commonProps}
          />
        );

      default:
        return <div>Step not implemented</div>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderWorkflowNavigation()}

      <main className="container mx-auto px-6 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {renderStepContent()}
      </main>
    </div>
  );
};

export default ProfessionalRFPWorkflow;