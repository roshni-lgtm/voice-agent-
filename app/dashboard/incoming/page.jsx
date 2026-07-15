'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import CallTable from '@/components/CallTable';
import { PhoneIncoming, Filter, Download } from 'lucide-react';

export default function IncomingCallsPage() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchCalls();
  }, [filters]);

  const fetchCalls = async () => {
    try {
      let url = '/api/calls?direction=inbound&limit=100';
      if (filters.status) url += `&status=${filters.status}`;
      if (filters.startDate) url += `&startDate=${filters.startDate}`;
      if (filters.endDate) url += `&endDate=${filters.endDate}`;
      
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
      ['Call SID', 'From', 'To', 'Status', 'Duration', 'Date'].join(','),
      ...calls.map(call => [
        call.callSid,
        call.from,
        call.to,
        call.status,
        call.duration || 0,
        new Date(call.createdAt).toISOString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incoming-calls-${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <PhoneIncoming className="w-8 h-8 text-blue-600" />
                Incoming Calls
              </h1>
              <p className="text-slate-600 mt-1">All inbound calls received</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={exportCalls}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Export
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <p className="text-sm text-slate-600 mb-1">Total Inbound</p>
              <p className="text-3xl font-bold text-slate-900">{calls.length}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <p className="text-sm text-slate-600 mb-1">Answered</p>
              <p className="text-3xl font-bold text-green-600">
                {calls.filter(c => c.status === 'completed' || c.status === 'answered').length}
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <p className="text-sm text-slate-600 mb-1">Missed</p>
              <p className="text-3xl font-bold text-red-600">
                {calls.filter(c => c.status === 'no-answer' || c.status === 'busy').length}
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <p className="text-sm text-slate-600 mb-1">With Recording</p>
              <p className="text-3xl font-bold text-purple-600">
                {calls.filter(c => c.hasRecording).length}
              </p>
            </div>
          </div>

          {/* Calls Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                {calls.length} Incoming Call{calls.length !== 1 ? 's' : ''}
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
