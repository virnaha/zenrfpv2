import React, { useState } from 'react';
import { Upload, Zap, FileText, Menu, X, ArrowRight } from 'lucide-react';
import { RFPUploader } from './RFPUploader';
import { RFPAnalyzer } from './RFPAnalyzer';
import { ResponseGenerator } from './ResponseGenerator';

type TabType = 'upload' | 'analyze' | 'generate';

export const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const tabs = [
    { 
      id: 'upload' as TabType, 
      label: 'Upload', 
      icon: Upload, 
      description: 'Upload RFP documents',
      step: 1
    },
    { 
      id: 'analyze' as TabType, 
      label: 'Analyze', 
      icon: Zap, 
      description: 'AI-powered analysis',
      step: 2
    },
    { 
      id: 'generate' as TabType, 
      label: 'Generate', 
      icon: FileText, 
      description: 'Create responses',
      step: 3
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'upload':
        return <RFPUploader />;
      case 'analyze':
        return <RFPAnalyzer />;
      case 'generate':
        return <ResponseGenerator />;
      default:
        return <RFPUploader />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors md:hidden"
              >
                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">
                    RFP Analyzer
                  </h1>
                  <p className="text-sm text-slate-600 hidden sm:block">AI-powered RFP analysis and response generation</p>
                </div>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {tabs.map((tab, index) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const isLast = index === tabs.length - 1;
                
                return (
                  <div key={tab.id} className="flex items-center">
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <span className={`text-xs font-bold ${isActive ? 'text-blue-200' : 'text-slate-400'}`}>
                        {tab.step}
                      </span>
                      <Icon className="w-4 h-4" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                    {!isLast && (
                      <ArrowRight className="w-4 h-4 text-slate-300 mx-2" />
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/20" onClick={() => setIsSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-80 bg-white shadow-xl">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Navigation</h2>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <nav className="p-6">
              <div className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setIsSidebarOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isActive ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {tab.step}
                      </div>
                      <Icon className="w-5 h-5" />
                      <div>
                        <div className="font-medium">{tab.label}</div>
                        <div className={`text-sm ${isActive ? 'text-blue-200' : 'text-slate-500'}`}>
                          {tab.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        {renderContent()}
      </main>
    </div>
  );
};