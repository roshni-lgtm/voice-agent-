'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Phone, Brain, BarChart3 } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Auto redirect to dashboard after 2 seconds
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Sparkles className="w-16 h-16 text-blue-600 animate-pulse" />
        </div>
        <h1 className="text-5xl font-bold text-slate-900 mb-4">AI Calling Platform</h1>
        <p className="text-xl text-slate-600 mb-8">Production-ready voice calling with AI intelligence</p>
        
        <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <Phone className="w-10 h-10 text-blue-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-900">Twilio Voice</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <Brain className="w-10 h-10 text-purple-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-900">ElevenLabs AI</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <BarChart3 className="w-10 h-10 text-green-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-900">OpenAI Analytics</p>
          </div>
        </div>

        <button
          onClick={() => router.push('/dashboard')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors inline-flex items-center gap-2"
        >
          Go to Dashboard
          <span className="animate-bounce">→</span>
        </button>
        
        <p className="text-sm text-slate-500 mt-6">Redirecting automatically...</p>
      </div>
    </div>
  );
}
