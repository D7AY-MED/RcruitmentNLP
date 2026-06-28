import { NavLink } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '../components/Logo';
import type { NavSection, Role } from './types';
import { roleLabel } from './navConfig';

/**
 * AppSidebar — the single sidebar for every role. Collapsible icon-rail on
 * desktop; the same markup is reused inside the mobile off-canvas drawer.
 * Active item = brand-tint pill. Token-only, light + dark.
 */
export function AppSidebar({
  role,
  sections,
  collapsed,
  onToggleCollapse,
  onNavigate,
}: {
  role: Role;
  sections: NavSection[];
  collapsed: boolean;
  onToggleCollapse?: () => void;
  /** called when a link is tapped (used to close the mobile drawer) */
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-surface border-r border-border-brand">
      {/* Brand */}
      <div className={cn('h-16 flex items-center border-b border-border-brand', collapsed ? 'justify-center px-2' : 'px-5')}>
        {collapsed ? (
          <img src="/poolink-icon.png" alt="PooLink" className="w-8 h-8" />
        ) : (
          <Logo />
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {sections.map((section, si) => (
          <div key={section.title ?? si}>
            {section.title && !collapsed && (
              <p className="px-2 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
                {section.title}
              </p>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={onNavigate}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      cn(
                        'group flex items-center gap-3 rounded-xl px-3 h-10 text-sm font-medium transition-colors',
                        collapsed && 'justify-center px-0',
                        isActive
                          ? 'bg-brand-light text-brand'
                          : 'text-muted hover:text-ink hover:bg-surface-2',
                      )
                    }
                  >
                    <item.icon className="w-[18px] h-[18px] shrink-0" />
                    {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer: role + collapse toggle */}
      <div className="border-t border-border-brand p-3">
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Étendre le menu' : 'Réduire le menu'}
            className={cn(
              'flex items-center gap-2 w-full rounded-xl h-9 px-3 text-xs font-medium text-muted hover:text-ink hover:bg-surface-2 transition-colors',
              collapsed && 'justify-center px-0',
            )}
          >
            <ChevronLeft className={cn('w-4 h-4 transition-transform', collapsed && 'rotate-180')} />
            {!collapsed && <span>Espace {roleLabel[role]}</span>}
          </button>
        )}
      </div>
    </div>
  );
}

export default AppSidebar;
