import React, { useState, useCallback } from 'react';
import { FileText, Sparkles, Loader2, AlertCircle, CheckCircle2, Download, Edit3 } from 'lucide-react';
import { openAIService, GenerationContext, GenerationProgress, SectionTemplate, OpenAIService } from '../lib/services/openai-service';

export const ResponseGenerator = () => {
  const [sections, setSections] = useState([
    { id: 'executive-summary', title: 'Executive Summary', completed: false, content: '', generating: false, error: '' },
    { id: 'company-overview', title: 'Company Overview', completed: false, content: '', generating: false, error: '' },
    { id: 'technical-approach', title: 'Technical Approach', completed: false, content: '', generating: false, error: '' },
    { id: 'project-timeline', title: 'Project Timeline', completed: false, content: '', generating: false, error: '' },
    { id: 'pricing', title: 'Pricing Framework', completed: false, content: '', generating: false, error: '' },
    { id: 'compliance', title: 'Compliance & Certifications', completed: false, content: '', generating: false, error: '' }
  ]);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [generationContext, setGenerationContext] = useState<GenerationContext>({
    rfpContent: '',
    companyProfile: '',
    requirements: [],
    constraints: [],
    targetAudience: ''
  });

  const handleGenerateSection = useCallback(async (sectionId: string) => {
    const sectionTemplates = OpenAIService.getSectionTemplates();
    const template = sectionTemplates[sectionId];
    
    if (!template) {
      console.error(`No template found for section: ${sectionId}`);
      return;
    }

    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, generating: true, error: '', completed: false }
        : section
    ));

    try {
      const content = await openAIService.generateSection(
        sectionId,
        generationContext,
        template,
        (progress: GenerationProgress) => {
          setSections(prev => prev.map(section => 
            section.id === sectionId 
              ? { 
                  ...section, 
                  generating: progress.status === 'generating',
                  completed: progress.status === 'completed',
                  content: progress.content || section.content,
                  error: progress.error || ''
                }
              : section
          ));
        },
        (chunk: string) => {
          setSections(prev => prev.map(section => 
            section.id === sectionId 
              ? { ...section, content: (section.content || '') + chunk }
              : section
          ));
        }
      );

      setSections(prev => prev.map(section => 
        section.id === sectionId 
          ? { ...section, completed: true, generating: false, content, error: '' }
          : section
      ));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Generation failed';
      setSections(prev => prev.map(section => 
        section.id === sectionId 
          ? { ...section, generating: false, error: errorMessage, completed: false }
          : section
      ));
    }
  }, [generationContext]);

  const handleGenerateAllSections = useCallback(async () => {
    setIsGeneratingAll(true);
    const sectionTemplates = OpenAIService.getSectionTemplates();
    
    setSections(prev => prev.map(section => ({
      ...section,
      completed: false,
      generating: false,
      content: '',
      error: ''
    })));

    try {
      const sectionsToGenerate = sections.map(section => ({
        sectionType: section.id,
        template: sectionTemplates[section.id]
      })).filter(item => item.template);

      const results = await openAIService.generateMultipleSections(
        sectionsToGenerate,
        generationContext,
        (progress: GenerationProgress) => {
          setSections(prev => prev.map(section => 
            section.id === progress.sectionId 
              ? { 
                  ...section, 
                  generating: progress.status === 'generating',
                  completed: progress.status === 'completed',
                  content: progress.content || section.content,
                  error: progress.error || ''
                }
              : section
          ));
        },
        (sectionId: string, chunk: string) => {
          setSections(prev => prev.map(section => 
            section.id === sectionId 
              ? { ...section, content: (section.content || '') + chunk }
              : section
          ));
        }
      );

      setSections(prev => prev.map(section => ({
        ...section,
        completed: true,
        generating: false,
        content: results[section.id] || section.content,
        error: ''
      })));

    } catch (error) {
      console.error('Error generating all sections:', error);
    } finally {
      setIsGeneratingAll(false);
    }
  }, [sections, generationContext]);

  const handleCancelGeneration = useCallback(() => {
    openAIService.cancelGeneration();
    setSections(prev => prev.map(section => ({
      ...section,
      generating: false
    })));
    setIsGeneratingAll(false);
  }, []);

  const completedSections = sections.filter(s => s.completed).length;
  const generatingSections = sections.filter(s => s.generating).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-6xl mx-auto px-6 py-12">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-6">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            Generate RFP Response
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Create professional, AI-powered responses tailored to your RFP requirements.
          </p>
        </div>

        {/* Main Actions */}
        <div className="text-center mb-12">
          <button 
            onClick={isGeneratingAll ? handleCancelGeneration : handleGenerateAllSections}
            disabled={generatingSections > 0 && !isGeneratingAll}
            className={`px-8 py-4 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] ${
              isGeneratingAll
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
            } ${generatingSections > 0 && !isGeneratingAll ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isGeneratingAll ? (
              <div className="flex items-center space-x-3">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Cancel Generation</span>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Sparkles className="w-5 h-5" />
                <span>Generate Complete Response</span>
              </div>
            )}
          </button>
          
          {completedSections > 0 && (
            <div className="mt-4 text-sm text-slate-600">
              {completedSections} of {sections.length} sections completed
              {generatingSections > 0 && ` • ${generatingSections} generating`}
            </div>
          )}
        </div>

        {/* Response Sections */}
        <div className="grid gap-6 lg:grid-cols-2">
          {sections.map((section) => (
            <div
              key={section.id}
              className={`bg-white rounded-2xl shadow-lg border transition-all duration-200 hover:shadow-xl ${
                section.completed
                  ? 'border-green-200'
                  : section.generating
                  ? 'border-blue-200'
                  : section.error
                  ? 'border-red-200'
                  : 'border-slate-200'
              }`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      section.completed
                        ? 'bg-green-100'
                        : section.generating
                        ? 'bg-blue-100'
                        : section.error
                        ? 'bg-red-100'
                        : 'bg-slate-100'
                    }`}>
                      {section.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : section.generating ? (
                        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                      ) : section.error ? (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      ) : (
                        <FileText className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{section.title}</h3>
                      <p className="text-sm text-slate-500">
                        {section.completed 
                          ? 'Ready for review' 
                          : section.generating 
                          ? 'Generating content...' 
                          : section.error 
                          ? 'Generation failed' 
                          : 'Ready to generate'
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {section.completed && (
                      <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                        <Edit3 className="w-4 h-4 text-slate-600" />
                      </button>
                    )}
                    <button
                      onClick={() => handleGenerateSection(section.id)}
                      disabled={section.generating || isGeneratingAll}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        section.completed
                          ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          : section.generating
                          ? 'bg-blue-100 text-blue-600 cursor-not-allowed'
                          : section.error
                          ? 'bg-red-100 text-red-600 hover:bg-red-200'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {section.completed ? 'Regenerate' : section.generating ? 'Generating...' : section.error ? 'Retry' : 'Generate'}
                    </button>
                  </div>
                </div>

                {section.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{section.error}</p>
                  </div>
                )}

                {section.content && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-700 line-clamp-4">
                      {section.content}
                      {section.generating && (
                        <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse"></span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Export Actions */}
        {completedSections > 0 && (
          <div className="mt-12 text-center">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Export Your Response</h3>
              <div className="flex justify-center space-x-4">
                <button className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]">
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </button>
                <button className="flex items-center space-x-2 px-6 py-3 bg-slate-600 text-white rounded-xl font-medium hover:bg-slate-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]">
                  <FileText className="w-4 h-4" />
                  <span>Export DOCX</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {completedSections === 0 && !isGeneratingAll && generatingSections === 0 && (
          <div className="mt-12 text-center">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-600 mb-2">
                Ready to Generate
              </h3>
              <p className="text-slate-500">
                Click "Generate Complete Response" to create all sections, or generate individual sections above.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};