import type { ReactNode } from 'react';
import { Menu } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { Breadcrumbs } from './Breadcrumbs';
import { GlobalSearch } from './GlobalSearch';
import { NotificationsMenu } from './NotificationsMenu';
import { ProfileMenu, type ProfileMenuItem } from './ProfileMenu';
import { QuickActions } from './QuickActions';
import type { Crumb, Role, ShellUser } from './types';

/**
 * AppHeader — the single sticky glass header for every role:
 * mobile menu · breadcrumbs · global search · notifications · theme · profile.
 */
export function AppHeader({
  user,
  breadcrumbs = [],
  actions,
  profileItems = [],
  onSignOut,
  onOpenSidebar,
  searchPlaceholder,
  role,
  navItems = [],
}: {
  user: ShellUser;
  breadcrumbs?: Crumb[];
  actions?: ReactNode;
  profileItems?: ProfileMenuItem[];
  onSignOut?: () => void;
  onOpenSidebar?: () => void;
  searchPlaceholder?: string;
  role?: Role;
  navItems?: { label: string; to: string }[];
}) {
  return (
    <header className="sticky top-0 z-40 h-16 glass border-b border-border-brand">
      <div className="h-full flex items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Ouvrir le menu"
          className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center text-muted hover:text-ink hover:bg-surface-2 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0 flex-1">
          <Breadcrumbs items={breadcrumbs} />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <QuickActions>{actions}</QuickActions>
          <GlobalSearch placeholder={searchPlaceholder} role={role} navItems={navItems} />
          <NotificationsMenu />
          <ThemeToggle />
          <ProfileMenu user={user} items={profileItems} onSignOut={onSignOut} />
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
