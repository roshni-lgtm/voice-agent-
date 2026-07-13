'use client';

import { useState } from 'react';
import { Phone, PhoneIncoming, PhoneOutgoing, Play, FileText, Brain } from 'lucide-react';

export default function CallTable({ calls = [], onAnalyze }) {
  const [analyzingId, setAnalyzingId] = useState(null);

  const handleAnalyze = async (callId) => {
    setAnalyzingId(callId);
    try {
      await onAnalyze(callId);
    } finally {
      setAnalyzingId(null);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'completed': 'bg-green-100 text-green-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      'ringing': 'bg-yellow-100 text-yellow-800',
      'failed': 'bg-red-100 text-red-800',
      'busy': 'bg-orange-100 text-orange-800',
      'no-answer': 'bg-gray-100 text-gray-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Call Info</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">From/To</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Duration</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Time</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {calls.map((call) => (
            <tr key={call.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  {call.direction === 'inbound' ? (
                    <PhoneIncoming className="w-5 h-5 text-blue-600" />
                  ) : (
                    <PhoneOutgoing className="w-5 h-5 text-green-600" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {call.direction === 'inbound' ? 'Inbound' : 'Outbound'}
                    </p>
                    <p className="text-xs text-slate-500">{call.callSid?.slice(0, 20)}...</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <p className="text-sm text-slate-900">From: {call.from}</p>
                <p className="text-sm text-slate-500">To: {call.to}</p>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(call.status)}`}>
                  {call.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                {formatDuration(call.duration)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                {formatDate(call.createdAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                {call.hasRecording && (
                  <button className="text-blue-600 hover:text-blue-800" title="Play Recording">
                    <Play className="w-5 h-5" />
                  </button>
                )}
                {call.transcriptId && (
                  <button className="text-purple-600 hover:text-purple-800" title="View Transcript">
                    <FileText className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => handleAnalyze(call.id)}
                  disabled={analyzingId === call.id}
                  className="text-green-600 hover:text-green-800 disabled:opacity-50"
                  title="AI Analysis"
                >
                  <Brain className={`w-5 h-5 ${analyzingId === call.id ? 'animate-spin' : ''}`} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {calls.length === 0 && (
        <div className="text-center py-12">
          <Phone className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No calls found</p>
        </div>
      )}
    </div>
  );
}
