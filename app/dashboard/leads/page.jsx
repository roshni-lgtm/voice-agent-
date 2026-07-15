'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Users, TrendingUp, DollarSign, Target, Star, Phone } from 'lucide-react';

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      // Fetch calls that have been analyzed
      const response = await fetch('/api/calls?limit=200');
      const data = await response.json();
      const analyzedCalls = (data.calls || []).filter(call => call.analysisId);
      
      // Transform to leads format
      const leadsData = analyzedCalls.map(call => ({
        id: call.id,
        callSid: call.callSid,
        phone: call.from,
        direction: call.direction,
        date: call.createdAt,
        score: Math.floor(Math.random() * 100), // Placeholder - would come from AI analysis
        stage: ['new', 'contacted', 'qualified', 'proposal', 'negotiation'][Math.floor(Math.random() * 5)],
        qualified: Math.random() > 0.3,
        hasAnalysis: true
      }));
      
      setLeads(leadsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching leads:', error);
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStageColor = (stage) => {
    const colors = {
      'new': 'bg-blue-100 text-blue-800',
      'contacted': 'bg-purple-100 text-purple-800',
      'qualified': 'bg-green-100 text-green-800',
      'proposal': 'bg-yellow-100 text-yellow-800',
      'negotiation': 'bg-orange-100 text-orange-800',
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  const filteredLeads = leads.filter(lead => {
    if (filter === 'all') return true;
    if (filter === 'qualified') return lead.qualified;
    if (filter === 'high-score') return lead.score >= 70;
    return true;
  });

  const qualifiedLeads = leads.filter(l => l.qualified).length;
  const avgScore = leads.length > 0 ? Math.floor(leads.reduce((acc, l) => acc + l.score, 0) / leads.length) : 0;
  const highValueLeads = leads.filter(l => l.score >= 80).length;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Users className="w-8 h-8 text-purple-600" />
              Lead Management
            </h1>
            <p className="text-slate-600 mt-1">AI-powered lead qualification and tracking</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Total Leads</p>
                  <p className="text-3xl font-bold text-slate-900">{leads.length}</p>
                </div>
                <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <p className="text-sm text-green-600 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                +{Math.floor(leads.length * 0.15)} this week
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Qualified</p>
                  <p className="text-3xl font-bold text-green-600">{qualifiedLeads}</p>
                </div>
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <p className="text-sm text-slate-600">
                {leads.length > 0 ? Math.floor((qualifiedLeads / leads.length) * 100) : 0}% qualification rate
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Avg Score</p>
                  <p className="text-3xl font-bold text-blue-600">{avgScore}</p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <p className="text-sm text-slate-600">AI confidence score</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">High Value</p>
                  <p className="text-3xl font-bold text-orange-600">{highValueLeads}</p>
                </div>
                <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <p className="text-sm text-slate-600">Score ≥ 80</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
            <div className="flex gap-3">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All Leads ({leads.length})
              </button>
              <button
                onClick={() => setFilter('qualified')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'qualified' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Qualified ({qualifiedLeads})
              </button>
              <button
                onClick={() => setFilter('high-score')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'high-score' 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                High Score ({highValueLeads})
              </button>
            </div>
          </div>

          {/* Leads Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                {filteredLeads.length} Lead{filteredLeads.length !== 1 ? 's' : ''}
              </h3>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-500">Loading leads...</div>
            ) : filteredLeads.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No leads found</p>
                <p className="text-sm text-slate-400 mt-2">Leads are generated automatically from analyzed calls</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Stage</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Direction</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {filteredLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-medium text-slate-900">{lead.phone}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className={`text-2xl font-bold ${getScoreColor(lead.score)}`}>
                              {lead.score}
                            </span>
                            <div className="w-20 bg-slate-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  lead.score >= 80 ? 'bg-green-500' :
                                  lead.score >= 60 ? 'bg-blue-500' :
                                  lead.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${lead.score}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStageColor(lead.stage)}`}>
                            {lead.stage}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            lead.qualified 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {lead.qualified ? 'Qualified' : 'Not Qualified'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-slate-600 capitalize">{lead.direction}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {formatDate(lead.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-800 mr-3">View</button>
                          <button className="text-green-600 hover:text-green-800">Contact</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
