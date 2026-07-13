'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import StatsCard from '@/components/StatsCard';
import CallTable from '@/components/CallTable';
import { 
  Phone, 
  PhoneIncoming, 
  PhoneOutgoing, 
  Clock,
  TrendingUp,
  Users,
  Activity,
  Bot
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [recentCalls, setRecentCalls] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    // Refresh every 10 seconds
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [summaryRes, callsRes, analyticsRes] = await Promise.all([
        fetch('/api/dashboard/summary'),
        fetch('/api/calls?limit=10'),
        fetch('/api/dashboard/analytics?period=daily')
      ]);

      const summaryData = await summaryRes.json();
      const callsData = await callsRes.json();
      const analyticsData = await analyticsRes.json();

      setSummary(summaryData);
      setRecentCalls(callsData.calls || []);
      setAnalytics(analyticsData.analytics || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const handleAnalyzeCall = async (callId) => {
    try {
      const response = await fetch(`/api/calls/${callId}/analyze`, {
        method: 'POST'
      });
      const data = await response.json();
      alert('Call analyzed successfully!');
      fetchDashboardData();
    } catch (error) {
      alert('Failed to analyze call');
      console.error(error);
    }
  };

  const handleMakeCall = async () => {
    const phoneNumber = prompt('Enter phone number (E.164 format, e.g., +1234567890):');
    if (!phoneNumber) return;

    try {
      const response = await fetch('/api/twilio/voice/outgoing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: phoneNumber })
      });

      const data = await response.json();
      if (response.ok) {
        alert(`Call initiated! Call SID: ${data.callSid}`);
        fetchDashboardData();
      } else {
        alert(`Failed to make call: ${data.error}`);
      }
    } catch (error) {
      alert('Error making call');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Activity className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <p className="text-slate-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">AI Calling Dashboard</h1>
              <p className="text-slate-600 mt-1">Real-time overview of your calling platform</p>
            </div>
            <button
              onClick={handleMakeCall}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Phone className="w-5 h-5" />
              Make Call
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Calls"
              value={summary?.totalCalls || 0}
              icon={Phone}
              change={12}
              trend="up"
            />
            <StatsCard
              title="Inbound Calls"
              value={summary?.inboundCalls || 0}
              icon={PhoneIncoming}
              change={8}
              trend="up"
            />
            <StatsCard
              title="Outbound Calls"
              value={summary?.outboundCalls || 0}
              icon={PhoneOutgoing}
              change={15}
              trend="up"
            />
            <StatsCard
              title="Active Calls"
              value={summary?.activeCalls || 0}
              icon={Activity}
              change={0}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="AI Calls"
              value={summary?.aiCalls || 0}
              icon={Bot}
              change={20}
              trend="up"
            />
            <StatsCard
              title="Human Calls"
              value={summary?.humanCalls || 0}
              icon={Users}
              change={5}
              trend="up"
            />
            <StatsCard
              title="Avg Duration"
              value={`${Math.floor(summary?.averageDuration || 0)}s`}
              icon={Clock}
              change={3}
              trend="up"
            />
            <StatsCard
              title="Answered Calls"
              value={summary?.answeredCalls || 0}
              icon={TrendingUp}
              change={10}
              trend="up"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Call Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#3b82f6" name="Total Calls" />
                  <Line type="monotone" dataKey="inbound" stroke="#10b981" name="Inbound" />
                  <Line type="monotone" dataKey="outbound" stroke="#f59e0b" name="Outbound" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Call Status Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completed" fill="#10b981" name="Completed" />
                  <Bar dataKey="failed" fill="#ef4444" name="Failed" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Calls */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Recent Calls</h3>
            </div>
            <CallTable calls={recentCalls} onAnalyze={handleAnalyzeCall} />
          </div>
        </div>
      </main>
    </div>
  );
}
