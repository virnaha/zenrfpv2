import React, { useState, useCallback } from 'react';
import {
  Download, FileText, File, Share2, CheckCircle2, Clock,
  Award, Target, Users, Eye, Settings, BookOpen, Star,
  Mail, Link, Copy, ArrowLeft, ExternalLink, Printer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { Separator } from '@/components/ui/separator';

import { documentFormatter } from '../../lib/services/document-formatting';

interface RFPExportStepProps {
  project: any;
  onProjectUpdate: (project: any) => void;
  onNext: (step: string) => void;
  onError: (error: string) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

interface ExportOptions {
  includeExecutiveSummary: boolean;
  includeTableOfContents: boolean;
  includeComplianceMatrix: boolean;
  includeZenloopBranding: boolean;
  includeSourceCitations: boolean;
  includeCoverLetter: boolean;
  format: 'docx' | 'pdf' | 'excel';
  template: 'professional' | 'corporate' | 'modern';
  customCoverLetter: string;
  companyName: string;
  contactPerson: string;
  contactEmail: string;
}

const EXPORT_FORMATS = [
  {
    id: 'docx',
    name: 'Word Document (.docx)',
    description: 'Editable document with full formatting',
    icon: FileText,
    recommended: true
  },
  {
    id: 'pdf',
    name: 'PDF Document (.pdf)',
    description: 'Professional PDF with bookmarks',
    icon: File,
    recommended: false
  },
  {
    id: 'excel',
    name: 'Excel Matrix (.xlsx)',
    description: 'Response matrix for procurement teams',
    icon: File,
    recommended: false
  }
];

const TEMPLATES = [
  {
    id: 'professional',
    name: 'Professional',
    description: 'Clean, formal design with zenloop branding'
  },
  {
    id: 'corporate',
    name: 'Corporate',
    description: 'Traditional corporate style with blue accents'
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Contemporary design with visual elements'
  }
];

export const RFPExportStep: React.FC<RFPExportStepProps> = ({
  project,
  onProjectUpdate,
  onNext,
  onError,
  isProcessing,
  setIsProcessing
}) => {
  const { toast } = useToast();
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeExecutiveSummary: true,
    includeTableOfContents: true,
    includeComplianceMatrix: true,
    includeZenloopBranding: true,
    includeSourceCitations: true,
    includeCoverLetter: true,
    format: 'docx',
    template: 'professional',
    customCoverLetter: '',
    companyName: '',
    contactPerson: '',
    contactEmail: ''
  });
  const [exportProgress, setExportProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const updateExportOption = useCallback((key: keyof ExportOptions, value: any) => {
    setExportOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  const generateDocument = useCallback(async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      // Step 1: Prepare document structure
      setExportProgress(10);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 2: Collect and format responses
      setExportProgress(25);
      const sampleResponses = [
        {
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
            { title: 'zenloop NPS Product Documentation', content: 'Comprehensive guide to NPS survey automation...' },
            { title: 'Industry Benchmark Database', content: 'Access to 500+ industry verticals...' }
          ]
        },
        {
          questionText: 'What security certifications and compliance standards does your platform maintain?',
          response: `zenloop maintains enterprise-grade security with comprehensive certifications and compliance standards that ensure the highest levels of data protection and regulatory adherence.

Our current security certifications include:
• ISO 27001:2013 certification for Information Security Management Systems
• SOC 2 Type II compliance for Security, Availability, and Confidentiality
• GDPR compliance with comprehensive data processing agreements
• Industry-standard encryption protocols (AES-256) for data at rest and in transit

We undergo regular security audits by independent third parties and maintain comprehensive audit trails for all system activities. Our security framework includes multi-factor authentication, role-based access controls, and continuous monitoring for potential threats.`,
          confidence: 98,
          sources: [
            { title: 'zenloop Security Certifications', content: 'Complete overview of security certifications...' },
            { title: 'GDPR Compliance Documentation', content: 'Detailed GDPR compliance procedures...' }
          ]
        }
      ];

      // Step 3: Generate formatted document
      setExportProgress(50);
      await new Promise(resolve => setTimeout(resolve, 500));

      const formattedDocument = documentFormatter.formatCompleteDocument(
        sampleResponses,
        project?.name || 'Customer Experience Platform RFP',
        exportOptions.companyName || 'zenloop',
        exportOptions.contactPerson,
        exportOptions.customCoverLetter
      );

      // Step 4: Apply template styling
      setExportProgress(70);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 5: Generate export format
      setExportProgress(90);
      let documentContent: string;
      let filename: string;

      switch (exportOptions.format) {
        case 'docx':
          documentContent = documentFormatter.toWordHTML(formattedDocument);
          filename = `RFP_Response_${project?.name?.replace(/\s+/g, '_') || 'Document'}.html`;
          break;
        case 'pdf':
          documentContent = documentFormatter.toWordHTML(formattedDocument);
          filename = `RFP_Response_${project?.name?.replace(/\s+/g, '_') || 'Document'}.html`;
          break;
        case 'excel':
          documentContent = generateExcelMatrix(formattedDocument);
          filename = `RFP_Response_Matrix_${project?.name?.replace(/\s+/g, '_') || 'Document'}.csv`;
          break;
        default:
          documentContent = documentFormatter.toWordHTML(formattedDocument);
          filename = `RFP_Response_${project?.name?.replace(/\s+/g, '_') || 'Document'}.html`;
      }

      // Create downloadable blob
      const blob = new Blob([documentContent], {
        type: exportOptions.format === 'excel' ? 'text/csv' : 'text/html'
      });
      const downloadUrl = URL.createObjectURL(blob);

      // Step 6: Finalize
      setExportProgress(100);
      await new Promise(resolve => setTimeout(resolve, 300));

      setDownloadUrl(downloadUrl);
      setExportComplete(true);

      // Update project status
      const updatedProject = {
        ...project,
        status: 'completed',
        updatedAt: new Date()
      };
      onProjectUpdate(updatedProject);

      toast({
        title: "Document Generated Successfully",
        description: `Your professional RFP response is ready for download`,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Export failed';
      onError(`Document export failed: ${errorMessage}`);
    } finally {
      setIsExporting(false);
    }
  }, [project, exportOptions, onProjectUpdate, onError, toast]);

  // Helper function to generate Excel matrix
  const generateExcelMatrix = (document: any): string => {
    const headers = ['Question', 'Response Summary', 'Confidence', 'Status'];
    const rows = document.complianceMatrix.map((item: any) => [
      `"${item.requirement.replace(/"/g, '""')}"`,
      `"${item.response.replace(/"/g, '""')}"`,
      '95%',
      `"${item.status}"`
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  };

  const downloadDocument = useCallback(() => {
    if (downloadUrl) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `RFP_Response_${project?.name?.replace(/\s+/g, '_') || 'Document'}.${exportOptions.format === 'excel' ? 'csv' : 'html'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Download Started",
        description: "Your professional RFP response document is downloading",
      });
    }
  }, [downloadUrl, toast, project, exportOptions.format]);

  const copyShareLink = useCallback(() => {
    navigator.clipboard.writeText(`${window.location.origin}/rfp-export/${project.id}/preview`);
    toast({
      title: "Link Copied",
      description: "Share link copied to clipboard",
    });
  }, [project, toast]);

  const sendByEmail = useCallback(() => {
    const subject = encodeURIComponent(`RFP Response: ${project.name}`);
    const body = encodeURIComponent(`Please find attached our response to your RFP. You can also view it online at: ${window.location.origin}/rfp-export/${project.id}/preview`);
    window.open(`mailto:${exportOptions.contactEmail}?subject=${subject}&body=${body}`);
  }, [project, exportOptions.contactEmail]);

  const getProjectStats = () => {
    // Mock stats - in real implementation, these would come from actual project data
    return {
      totalQuestions: 45,
      answeredQuestions: 45,
      avgConfidence: 89.2,
      totalWords: 12450,
      documentPages: 38,
      completionTime: '3.2 hours',
      timeSaved: '28 hours'
    };
  };

  const stats = getProjectStats();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Export Final RFP Response</h2>
        <p className="text-muted-foreground">
          Generate your professional RFP response document with custom formatting and branding
        </p>
      </div>

      {/* Project Summary */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-600" />
            <h3 className="text-xl font-semibold text-green-900 mb-2">RFP Response Complete!</h3>
            <p className="text-green-700">
              Your professional RFP response has been generated using zenloop expertise and is ready for export.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700">{stats.answeredQuestions}/{stats.totalQuestions}</div>
              <div className="text-sm text-green-600">Questions Answered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-700">{stats.avgConfidence}%</div>
              <div className="text-sm text-blue-600">Avg Confidence</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-700">{stats.totalWords.toLocaleString()}</div>
              <div className="text-sm text-purple-600">Total Words</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-700">{stats.timeSaved}</div>
              <div className="text-sm text-orange-600">Time Saved</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Configuration */}
      {!exportComplete && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left panel - Export options */}
          <div className="space-y-6">
            {/* Format Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Export Format</CardTitle>
                <CardDescription>Choose your preferred document format</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {EXPORT_FORMATS.map((format) => {
                  const Icon = format.icon;
                  return (
                    <div
                      key={format.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        exportOptions.format === format.id
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-gray-300'
                      }`}
                      onClick={() => updateExportOption('format', format.id)}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className="h-5 w-5 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{format.name}</span>
                            {format.recommended && (
                              <Badge className="text-xs">Recommended</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{format.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Template Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Document Template</CardTitle>
                <CardDescription>Select the visual design for your document</CardDescription>
              </CardHeader>
              <CardContent>
                <Select
                  value={exportOptions.template}
                  onValueChange={(value) => updateExportOption('template', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATES.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        <div>
                          <div className="font-medium">{template.name}</div>
                          <div className="text-sm text-muted-foreground">{template.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>Add your contact details to the document</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={exportOptions.companyName}
                    onChange={(e) => updateExportOption('companyName', e.target.value)}
                    placeholder="Your organization name"
                  />
                </div>
                <div>
                  <Label htmlFor="contactPerson">Contact Person</Label>
                  <Input
                    id="contactPerson"
                    value={exportOptions.contactPerson}
                    onChange={(e) => updateExportOption('contactPerson', e.target.value)}
                    placeholder="Primary contact name"
                  />
                </div>
                <div>
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={exportOptions.contactEmail}
                    onChange={(e) => updateExportOption('contactEmail', e.target.value)}
                    placeholder="contact@company.com"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right panel - Content options */}
          <div className="space-y-6">
            {/* Include Options */}
            <Card>
              <CardHeader>
                <CardTitle>Document Content</CardTitle>
                <CardDescription>Choose what to include in your final document</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="execSummary">Executive Summary</Label>
                    <p className="text-sm text-muted-foreground">Auto-generated overview of key points</p>
                  </div>
                  <Switch
                    id="execSummary"
                    checked={exportOptions.includeExecutiveSummary}
                    onCheckedChange={(checked) => updateExportOption('includeExecutiveSummary', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="toc">Table of Contents</Label>
                    <p className="text-sm text-muted-foreground">Navigable document structure</p>
                  </div>
                  <Switch
                    id="toc"
                    checked={exportOptions.includeTableOfContents}
                    onCheckedChange={(checked) => updateExportOption('includeTableOfContents', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="compliance">Compliance Matrix</Label>
                    <p className="text-sm text-muted-foreground">Requirements vs response mapping</p>
                  </div>
                  <Switch
                    id="compliance"
                    checked={exportOptions.includeComplianceMatrix}
                    onCheckedChange={(checked) => updateExportOption('includeComplianceMatrix', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="branding">zenloop Branding</Label>
                    <p className="text-sm text-muted-foreground">Company logos and styling</p>
                  </div>
                  <Switch
                    id="branding"
                    checked={exportOptions.includeZenloopBranding}
                    onCheckedChange={(checked) => updateExportOption('includeZenloopBranding', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="citations">Source Citations</Label>
                    <p className="text-sm text-muted-foreground">Reference materials and knowledge base sources</p>
                  </div>
                  <Switch
                    id="citations"
                    checked={exportOptions.includeSourceCitations}
                    onCheckedChange={(checked) => updateExportOption('includeSourceCitations', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="coverLetter">Cover Letter</Label>
                    <p className="text-sm text-muted-foreground">Personalized introduction</p>
                  </div>
                  <Switch
                    id="coverLetter"
                    checked={exportOptions.includeCoverLetter}
                    onCheckedChange={(checked) => updateExportOption('includeCoverLetter', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Custom Cover Letter */}
            {exportOptions.includeCoverLetter && (
              <Card>
                <CardHeader>
                  <CardTitle>Custom Cover Letter</CardTitle>
                  <CardDescription>Add a personalized message (optional)</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={exportOptions.customCoverLetter}
                    onChange={(e) => updateExportOption('customCoverLetter', e.target.value)}
                    placeholder="Add any specific points you'd like to highlight in the cover letter..."
                    className="min-h-[100px]"
                  />
                </CardContent>
              </Card>
            )}

            {/* Generate Button */}
            <Card>
              <CardContent className="pt-6">
                <Button
                  onClick={generateDocument}
                  disabled={isExporting}
                  className="w-full"
                  size="lg"
                >
                  {isExporting ? (
                    <>
                      <Clock className="h-5 w-5 mr-2 animate-spin" />
                      Generating Document...
                    </>
                  ) : (
                    <>
                      <Download className="h-5 w-5 mr-2" />
                      Generate RFP Response Document
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Export Progress */}
      {isExporting && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-6">
              <div className="relative mb-6">
                <FileText className="h-16 w-16 mx-auto text-primary animate-pulse" />
                <div className="absolute -top-1 -right-1">
                  <Clock className="h-6 w-6 text-blue-500 animate-spin" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-4">Generating Your RFP Response Document</h3>

              <div className="max-w-md mx-auto space-y-2 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span>Progress</span>
                  <span>{Math.round(exportProgress)}%</span>
                </div>
                <Progress value={exportProgress} className="h-3" />
              </div>

              <p className="text-sm text-muted-foreground">
                This may take 1-2 minutes depending on document complexity and format
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Complete */}
      {exportComplete && (
        <div className="space-y-6">
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Your professional RFP response document has been generated successfully and is ready for download.
            </AlertDescription>
          </Alert>

          {/* Download and Share Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Download Document
                </CardTitle>
                <CardDescription>
                  Get your formatted RFP response document
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium">RFP_Response_{project.name}.{exportOptions.format}</p>
                      <p className="text-sm text-muted-foreground">
                        ~{stats.documentPages} pages, {stats.totalWords.toLocaleString()} words
                      </p>
                    </div>
                  </div>
                  <Button onClick={downloadDocument}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>

                <Button variant="outline" className="w-full" onClick={() => window.print()}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print Preview
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  Share & Collaborate
                </CardTitle>
                <CardDescription>
                  Share your document with team members
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full" onClick={copyShareLink}>
                  <Link className="h-4 w-4 mr-2" />
                  Copy Share Link
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={sendByEmail}
                  disabled={!exportOptions.contactEmail}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send by Email
                </Button>

                <Button variant="outline" className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Online Preview
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Success metrics */}
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <Star className="h-12 w-12 mx-auto mb-4 text-purple-600" />
                <h3 className="text-lg font-semibold text-purple-900 mb-4">Project Complete!</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-purple-700">{stats.completionTime}</div>
                    <div className="text-sm text-purple-600">Total Time</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-700">{stats.timeSaved}</div>
                    <div className="text-sm text-green-600">Time Saved</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-700">{stats.avgConfidence}%</div>
                    <div className="text-sm text-blue-600">Quality Score</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6">
        <Button variant="outline" onClick={() => onNext('review')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Review
        </Button>
        <Button variant="outline" onClick={() => onNext('dashboard')}>
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
};