'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Mic, Play, Download, Search, Calendar } from 'lucide-react';

export default function RecordingsPage() {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    fetchRecordings();
  }, []);

  const fetchRecordings = async () => {
    try {
      // Fetch calls with recordings
      const response = await fetch('/api/calls?limit=200');
      const data = await response.json();
      const callsWithRecordings = (data.calls || []).filter(call => call.hasRecording);
      setRecordings(callsWithRecordings);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching recordings:', error);
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const filteredRecordings = recordings.filter(rec => {
    const matchesSearch = !searchTerm || 
      rec.from?.includes(searchTerm) || 
      rec.to?.includes(searchTerm) ||
      rec.callSid?.includes(searchTerm);
    
    const matchesDate = !dateFilter || 
      new Date(rec.createdAt).toISOString().split('T')[0] === dateFilter;
    
    return matchesSearch && matchesDate;
  });

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Mic className="w-8 h-8 text-purple-600" />
              Call Recordings
            </h1>
            <p className="text-slate-600 mt-1">View and manage all call recordings</p>
          </div>

          {/* Filters */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
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

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <p className="text-sm text-slate-600 mb-1">Total Recordings</p>
              <p className="text-3xl font-bold text-slate-900">{recordings.length}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <p className="text-sm text-slate-600 mb-1">Total Duration</p>
              <p className="text-3xl font-bold text-purple-600">
                {Math.floor(recordings.reduce((acc, r) => acc + (r.recordingDuration || 0), 0) / 60)}m
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <p className="text-sm text-slate-600 mb-1">Inbound</p>
              <p className="text-3xl font-bold text-blue-600">
                {recordings.filter(r => r.direction === 'inbound').length}
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <p className="text-sm text-slate-600 mb-1">Outbound</p>
              <p className="text-3xl font-bold text-green-600">
                {recordings.filter(r => r.direction === 'outbound').length}
              </p>
            </div>
          </div>

          {/* Recordings List */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                {filteredRecordings.length} Recording{filteredRecordings.length !== 1 ? 's' : ''} Found
              </h3>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-500">Loading recordings...</div>
            ) : filteredRecordings.length === 0 ? (
              <div className="p-12 text-center">
                <Mic className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No recordings found</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {filteredRecordings.map((recording) => (
                  <div key={recording.id} className="p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            recording.direction === 'inbound' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {recording.direction}
                          </span>
                          <span className="text-sm font-medium text-slate-900">
                            {recording.from} → {recording.to}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <span>Call SID: {recording.callSid?.slice(0, 20)}...</span>
                          <span>•</span>
                          <span>Duration: {formatDuration(recording.recordingDuration)}</span>
                          <span>•</span>
                          <span>{formatDate(recording.createdAt)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {recording.recordingUrl && (
                          <>
                            <a
                              href={recording.recordingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Play Recording"
                            >
                              <Play className="w-5 h-5" />
                            </a>
                            <a
                              href={recording.recordingUrl}
                              download
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Download Recording"
                            >
                              <Download className="w-5 h-5" />
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {recording.recordingUrl && (
                      <div className="mt-4">
                        <audio 
                          controls 
                          className="w-full"
                          style={{ maxWidth: '500px' }}
                        >
                          <source src={recording.recordingUrl} type="audio/mpeg" />
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
