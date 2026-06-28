import { useState, type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { navConfig } from './navConfig';
import type { Crumb, NavSection, Role, ShellUser } from './types';
import type { ProfileMenuItem } from './ProfileMenu';

/**
 * DashboardShell — the ONE application shell shared by admin, recruiter and
 * candidate. Only `role` (→ nav + permissions) and the per-page props differ;
 * the layout, header, sidebar, theming and components are identical.
 *
 * Renders <Outlet/> by default (route layout) or `children` when provided.
 * Token-only, fully light/dark.
 */
export function DashboardShell({
  role,
  user,
  sections,
  breadcrumbs = [],
  actions,
  profileItems = [],
  onSignOut,
  searchPlaceholder,
  children,
}: {
  role: Role;
  user: ShellUser;
  /** override the default per-role nav if needed */
  sections?: NavSection[];
  breadcrumbs?: Crumb[];
  actions?: ReactNode;
  profileItems?: ProfileMenuItem[];
  onSignOut?: () => void;
  searchPlaceholder?: string;
  children?: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = sections ?? navConfig[role];
  const navItems = nav.flatMap((s) => s.items).map((i) => ({ label: i.label, to: i.to }));

  return (
    <div className="min-h-screen bg-bg text-ink flex">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden lg:flex shrink-0 transition-[width] duration-200',
          collapsed ? 'w-20' : 'w-64',
        )}
      >
        <div className="fixed inset-y-0 left-0 z-30" style={{ width: collapsed ? 80 : 256 }}>
          <AppSidebar
            role={role}
            sections={nav}
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed((v) => !v)}
          />
        </div>
      </aside>

      {/* Mobile off-canvas sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-bg/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 max-w-[80%] h-full">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Fermer le menu"
              className="absolute -right-12 top-3 w-10 h-10 rounded-xl flex items-center justify-center bg-card border border-border-brand text-ink"
            >
              <X className="w-5 h-5" />
            </button>
            <AppSidebar
              role={role}
              sections={nav}
              collapsed={false}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">
        <AppHeader
          user={user}
          breadcrumbs={breadcrumbs}
          actions={actions}
          profileItems={profileItems}
          onSignOut={onSignOut}
          onOpenSidebar={() => setMobileOpen(true)}
          searchPlaceholder={searchPlaceholder}
          role={role}
          navItems={navItems}
        />
        <main className="flex-1 px-4 sm:px-6 py-6 max-w-[1400px] w-full mx-auto">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}

export default DashboardShell;
