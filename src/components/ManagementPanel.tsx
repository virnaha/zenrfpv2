
import React, { useState } from 'react';
import { Search, Filter, MoreHorizontal, Calendar, FileText, TrendingUp, Users } from 'lucide-react';

export const ManagementPanel = () => {
  const [activeView, setActiveView] = useState('rfps');

  const mockRFPs = [
    {
      id: '1',
      title: 'Enterprise CRM Implementation',
      status: 'analyzed',
      uploadDate: '2024-01-15',
      dueDate: '2024-02-15',
      estimatedValue: '$175,000',
      progress: 85
    },
    {
      id: '2',
      title: 'Cloud Infrastructure Migration',
      status: 'response-generated',
      uploadDate: '2024-01-10',
      dueDate: '2024-02-01',
      estimatedValue: '$250,000',
      progress: 100
    },
    {
      id: '3',
      title: 'Mobile App Development',
      status: 'uploaded',
      uploadDate: '2024-01-20',
      dueDate: '2024-03-01',
      estimatedValue: '$120,000',
      progress: 25
    }
  ];

  const mockStats = [
    { label: 'Total RFPs', value: '24', change: '+12%', icon: FileText, color: 'blue' },
    { label: 'Win Rate', value: '68%', change: '+5%', icon: TrendingUp, color: 'green' },
    { label: 'Active Proposals', value: '8', change: '+2', icon: Calendar, color: 'amber' },
    { label: 'Team Members', value: '12', change: '+1', icon: Users, color: 'purple' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploaded': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'analyzed': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'response-generated': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'uploaded': return 'Uploaded';
      case 'analyzed': return 'Analyzed';
      case 'response-generated': return 'Response Generated';
      default: return 'Unknown';
    }
  };

  const getIconColor = (color: string) => {
    switch (color) {
      case 'blue': return 'text-blue-600 bg-blue-100';
      case 'green': return 'text-green-600 bg-green-100';
      case 'amber': return 'text-amber-600 bg-amber-100';
      case 'purple': return 'text-purple-600 bg-purple-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Management Dashboard</h2>
        <p className="text-slate-600">Monitor and manage your RFPs, responses, and team performance.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {mockStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-slate-200/60">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getIconColor(stat.color)}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-sm text-green-600 font-medium">{stat.change}</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                <p className="text-sm text-slate-500">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-6 bg-white/50 p-1 rounded-lg border border-slate-200/60">
        {[
          { id: 'rfps', label: 'RFPs' },
          { id: 'responses', label: 'Responses' },
          { id: 'templates', label: 'Templates' },
          { id: 'settings', label: 'Settings' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeView === tab.id
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-slate-200/60">
        {/* Header */}
        <div className="p-6 border-b border-slate-200/60">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800">RFP Management</h3>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search RFPs..."
                  className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                <Filter className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>
        </div>

        {/* RFP Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  RFP Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Upload Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Est. Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60">
              {mockRFPs.map((rfp) => (
                <tr key={rfp.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900">{rfp.title}</div>
                        <div className="text-sm text-slate-500">ID: {rfp.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(rfp.status)}`}>
                      {getStatusLabel(rfp.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {rfp.uploadDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {rfp.dueDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                    {rfp.estimatedValue}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-full bg-slate-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${rfp.progress}%` }}
                        />
                      </div>
                      <span className="text-sm text-slate-600 min-w-[3rem]">{rfp.progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                      <MoreHorizontal className="w-4 h-4 text-slate-600" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
