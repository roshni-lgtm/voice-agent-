'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Phone, 
  PhoneIncoming, 
  PhoneOutgoing,
  Mic,
  BarChart3, 
  Settings,
  FileText,
  Users,
  Sparkles
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/calls', icon: Phone, label: 'All Calls' },
  { href: '/dashboard/incoming', icon: PhoneIncoming, label: 'Incoming' },
  { href: '/dashboard/outgoing', icon: PhoneOutgoing, label: 'Outgoing' },
  { href: '/dashboard/recordings', icon: Mic, label: 'Recordings' },
  { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/dashboard/transcripts', icon: FileText, label: 'Transcripts' },
  { href: '/dashboard/leads', icon: Users, label: 'Leads' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen p-6">
      <div className="flex items-center gap-2 mb-8">
        <Sparkles className="w-8 h-8 text-blue-400" />
        <h1 className="text-xl font-bold">AI Calling</h1>
      </div>
      
      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 p-4 bg-slate-800 rounded-lg">
        <p className="text-xs text-slate-400 mb-2">Live Status</p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-sm">System Online</span>
        </div>
      </div>
    </aside>
  );
}
