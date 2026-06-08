"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Briefcase, 
  KanbanSquare, 
  Calendar, 
  Clock, 
  FileText, 
  CheckSquare, 
  Files, 
  UserPlus, 
  Settings 
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Contacts', href: '/contacts', icon: Users },
  { name: 'Pipeline', href: '/pipeline', icon: KanbanSquare },
  { name: 'Meetings', href: '/meetings', icon: Calendar },
  { name: 'Follow-ups', href: '/follow-ups', icon: Clock },
  { name: 'Proposals', href: '/proposals', icon: FileText },
  { name: 'Approvals', href: '/approvals', icon: CheckSquare },
  { name: 'Documents', href: '/documents', icon: Files },
  { name: 'Onboarding', href: '/onboarding', icon: UserPlus },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full hidden md:flex">
      <div className="h-16 flex items-center px-6 border-b border-gray-200 shrink-0">
        <span className="text-xl font-bold text-blue-600">Humppl Growth OS</span>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? 'text-blue-700' : 'text-gray-400'}`} aria-hidden="true" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
