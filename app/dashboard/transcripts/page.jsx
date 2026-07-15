'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { FileText, Search, Download, Eye } from 'lucide-react';

export default function TranscriptsPage() {
  const [transcripts, setTranscripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTranscript, setSelectedTranscript] = useState(null);

  useEffect(() => {
    fetchTranscripts();
  }, []);

  const fetchTranscripts = async () => {
    try {
      const response = await fetch('/api/calls?limit=200');
      const data = await response.json();
      const callsWithTranscripts = (data.calls || []).filter(call => call.transcriptId);
      setTranscripts(callsWithTranscripts);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching transcripts:', error);
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const filteredTranscripts = transcripts.filter(t => 
    !searchTerm || 
    t.from?.includes(searchTerm) || 
    t.to?.includes(searchTerm) ||
    t.callSid?.includes(searchTerm)
  );

  const viewTranscriptDetails = async (call) => {
    try {
      const response = await fetch(`/api/calls/${call.id}`);
      const data = await response.json();
      setSelectedTranscript(data);
    } catch (error) {
      alert('Failed to load transcript details');
    }
  };

  const exportTranscript = (transcript) => {
    const text = `Call Transcript\n\nCall SID: ${transcript.call?.callSid}\nFrom: ${transcript.call?.from}\nTo: ${transcript.call?.to}\nDate: ${formatDate(transcript.call?.createdAt)}\n\n${transcript.transcript?.text || 'No transcript available'}`;
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${transcript.call?.callSid}-${Date.now()}.txt`;
    a.click();
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              Call Transcripts
            </h1>
            <p className="text-slate-600 mt-1">View and search through call transcriptions</p>
          </div>

          {/* Search */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by phone number or Call SID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <p className="text-sm text-slate-600 mb-1">Total Transcripts</p>
              <p className="text-3xl font-bold text-slate-900">{transcripts.length}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <p className="text-sm text-slate-600 mb-1">Analyzed</p>
              <p className="text-3xl font-bold text-green-600">
                {transcripts.filter(t => t.analysisId).length}
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <p className="text-sm text-slate-600 mb-1">Pending Analysis</p>
              <p className="text-3xl font-bold text-orange-600">
                {transcripts.filter(t => !t.analysisId).length}
              </p>
            </div>
          </div>

          {/* Transcripts List */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                {filteredTranscripts.length} Transcript{filteredTranscripts.length !== 1 ? 's' : ''} Found
              </h3>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-500">Loading transcripts...</div>
            ) : filteredTranscripts.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No transcripts found</p>
                <p className="text-sm text-slate-400 mt-2">Transcripts are generated automatically after calls are completed</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {filteredTranscripts.map((transcript) => (
                  <div key={transcript.id} className="p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            transcript.direction === 'inbound' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {transcript.direction}
                          </span>
                          <span className="text-sm font-medium text-slate-900">
                            {transcript.from} → {transcript.to}
                          </span>
                          {transcript.analysisId && (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                              Analyzed
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                          <span>Call SID: {transcript.callSid?.slice(0, 25)}...</span>
                          <span>•</span>
                          <span>{formatDate(transcript.createdAt)}</span>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-2">
                          Transcript available for this call. Click "View Details" to see the full transcription.
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => viewTranscriptDetails(transcript)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Transcript Detail Modal */}
          {selectedTranscript && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedTranscript(null)}>
              <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-slate-900">Transcript Details</h3>
                  <button
                    onClick={() => setSelectedTranscript(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="p-6">
                  <div className="mb-6 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600">Call SID</p>
                      <p className="font-medium">{selectedTranscript.call?.callSid}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Date</p>
                      <p className="font-medium">{formatDate(selectedTranscript.call?.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">From</p>
                      <p className="font-medium">{selectedTranscript.call?.from}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">To</p>
                      <p className="font-medium">{selectedTranscript.call?.to}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-slate-900">Transcript</h4>
                      <button
                        onClick={() => exportTranscript(selectedTranscript)}
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Download className="w-4 h-4" />
                        Export
                      </button>
                    </div>
                    <p className="text-slate-700 whitespace-pre-wrap">
                      {selectedTranscript.transcript?.text || 'Transcript content will appear here once the call is transcribed.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
