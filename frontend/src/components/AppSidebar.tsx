'use client';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Briefcase, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { logout } from '@/lib/recruiterAuth';
import { AuthUser } from '@/lib/types';

interface AppSidebarProps {
  user?: AuthUser | null;
}

export default function AppSidebar({ user }: AppSidebarProps) {
  const location = useLocation();
  const pathname = location.pathname;
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const links = [
    { name: 'Talent Matcher', href: '/dashboard', icon: Search },
    { name: 'Job Pools', href: '/job-pools', icon: Briefcase },
  ];

  const handleLogout = () => {
    logout();
    navigate('/recruiter/login', { replace: true });
  };

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-surface border-r border-border-brand flex flex-col shrink-0 min-h-screen transition-all duration-300 relative`}>
      <div className="h-16 flex items-center justify-between px-6 border-b border-border-brand shrink-0">
        {!isCollapsed && <h2 className="text-xl font-bold text-ink tracking-tight">PooLink</h2>}
        {isCollapsed && <h2 className="text-xl font-bold text-ink tracking-tight mx-auto">PL</h2>}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-5 bg-white dark:bg-card border border-border-brand rounded-full p-1 text-gray-500 dark:text-muted hover:text-ink shadow-sm z-10"
          title={isCollapsed ? 'Expand menu' : 'Collapse menu'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              to={link.href}
              title={isCollapsed ? link.name : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-brand-light text-brand font-semibold'
                  : 'text-gray-600 dark:text-ink hover:text-ink hover:bg-gray-100/50 dark:hover:bg-surface-2'
              } ${isCollapsed ? 'justify-center' : ''}`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-brand' : 'text-gray-400 dark:text-muted'}`} />
              {!isCollapsed && link.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-border-brand shrink-0 mt-auto space-y-3">
        <button
          onClick={handleLogout}
          title={isCollapsed ? 'Log out' : undefined}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-ink transition-colors hover:bg-red-50 dark:hover:bg-danger-soft hover:text-red-650 ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!isCollapsed && 'Log out'}
        </button>
      </div>
    </aside>
  );
}
