import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/Navigation';
import {
  BookOpen, MessageSquare, Video, FileText, Mail, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const helpResources = [
  {
    icon: BookOpen,
    title: 'Documentation',
    description: 'Comprehensive guides and tutorials',
    link: '#',
    color: 'text-blue-600 bg-blue-50'
  },
  {
    icon: Video,
    title: 'Video Tutorials',
    description: 'Step-by-step video walkthroughs',
    link: '#',
    color: 'text-purple-600 bg-purple-50'
  },
  {
    icon: MessageSquare,
    title: 'Community Forum',
    description: 'Ask questions and share knowledge',
    link: '#',
    color: 'text-green-600 bg-green-50'
  },
  {
    icon: Mail,
    title: 'Contact Support',
    description: 'Get help from our team',
    link: 'mailto:support@zenloop.com',
    color: 'text-orange-600 bg-orange-50'
  }
];

const faqs = [
  {
    question: 'How do I upload an RFP document?',
    answer: 'Navigate to the Home page, click "New RFP", and follow the upload wizard to select your document.'
  },
  {
    question: 'What file formats are supported?',
    answer: 'We support PDF (.pdf), Word documents (.docx), and plain text (.txt) files up to 10MB.'
  },
  {
    question: 'How does the AI analysis work?',
    answer: 'Our AI analyzes your RFP to extract requirements, evaluation criteria, and strategic insights using advanced language models and your company knowledge base.'
  },
  {
    question: 'Can I edit the generated responses?',
    answer: 'Yes! All generated responses can be edited in the Review step before exporting the final document.'
  },
  {
    question: 'How do I add documents to the knowledge base?',
    answer: 'Go to Knowledge Base from the main navigation, then upload your company documents. These will be used to enhance RFP responses.'
  }
];

export const Help = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/30">
      <div className="container mx-auto px-6 py-8">
        <Breadcrumbs />

        <div className="mt-6 space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Help & Support</h1>
            <p className="text-muted-foreground">
              Find answers, learn best practices, and get support
            </p>
          </div>

          {/* Help Resources */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {helpResources.map((resource) => {
              const Icon = resource.icon;
              return (
                <Card key={resource.title} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${resource.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <CardTitle>{resource.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {resource.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="w-full"
                    >
                      <a href={resource.link} target="_blank" rel="noopener noreferrer">
                        <span>Learn More</span>
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Quick Start Guide */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Start Guide</CardTitle>
              <CardDescription>
                Get started with zen-rfp generator in 5 simple steps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                <li className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    1
                  </span>
                  <div>
                    <h3 className="font-semibold">Upload your RFP document</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload PDF, Word, or text files from the Home page
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    2
                  </span>
                  <div>
                    <h3 className="font-semibold">Review AI analysis</h3>
                    <p className="text-sm text-muted-foreground">
                      Examine extracted requirements and strategic insights
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    3
                  </span>
                  <div>
                    <h3 className="font-semibold">Generate responses</h3>
                    <p className="text-sm text-muted-foreground">
                      AI creates professional responses using your knowledge base
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    4
                  </span>
                  <div>
                    <h3 className="font-semibold">Review & edit</h3>
                    <p className="text-sm text-muted-foreground">
                      Make adjustments to ensure accuracy and tone
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    5
                  </span>
                  <div>
                    <h3 className="font-semibold">Export your response</h3>
                    <p className="text-sm text-muted-foreground">
                      Download as Word, PDF, or Excel format
                    </p>
                  </div>
                </li>
              </ol>
            </CardContent>
          </Card>

          {/* FAQ */}
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index}>
                  <h3 className="font-semibold mb-2">{faq.question}</h3>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Still need help?</h3>
                <p className="text-muted-foreground mb-4">
                  Our support team is here to assist you
                </p>
                <Button asChild>
                  <a href="mailto:support@zenloop.com">
                    <Mail className="mr-2 h-4 w-4" />
                    Contact Support
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Help;
