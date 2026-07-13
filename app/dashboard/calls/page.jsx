'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import CallTable from '@/components/CallTable';
import { Search, Filter, Download } from 'lucide-react';

export default function CallsPage() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    direction: '',
    status: '',
    search: ''
  });

  useEffect(() => {
    fetchCalls();
  }, [filters]);

  const fetchCalls = async () => {
    try {
      let url = '/api/calls?limit=100';
      if (filters.direction) url += `&direction=${filters.direction}`;
      if (filters.status) url += `&status=${filters.status}`;
      
      const response = await fetch(url);
      const data = await response.json();
      setCalls(data.calls || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching calls:', error);
      setLoading(false);
    }
  };

  const handleAnalyzeCall = async (callId) => {
    try {
      const response = await fetch(`/api/calls/${callId}/analyze`, {
        method: 'POST'
      });
      if (response.ok) {
        alert('Call analyzed successfully!');
        fetchCalls();
      }
    } catch (error) {
      alert('Failed to analyze call');
    }
  };

  const exportCalls = () => {
    const csv = [
      ['Call SID', 'From', 'To', 'Direction', 'Status', 'Duration', 'Date'].join(','),
      ...calls.map(call => [
        call.callSid,
        call.from,
        call.to,
        call.direction,
        call.status,
        call.duration || 0,
        new Date(call.createdAt).toISOString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calls-${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">All Calls</h1>
            <p className="text-slate-600 mt-1">View and manage all your calls</p>
          </div>

          {/* Filters */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search calls..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Direction</label>
                <select
                  value={filters.direction}
                  onChange={(e) => setFilters({ ...filters, direction: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Directions</option>
                  <option value="inbound">Inbound</option>
                  <option value="outbound">Outbound</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="in-progress">In Progress</option>
                  <option value="failed">Failed</option>
                  <option value="busy">Busy</option>
                  <option value="no-answer">No Answer</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={exportCalls}
                  className="w-full bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Export CSV
                </button>
              </div>
            </div>
          </div>

          {/* Calls Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                {calls.length} Call{calls.length !== 1 ? 's' : ''} Found
              </h3>
            </div>
            {loading ? (
              <div className="p-12 text-center text-slate-500">Loading calls...</div>
            ) : (
              <CallTable calls={calls} onAnalyze={handleAnalyzeCall} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
