import type { ElementType } from 'react';

/** The three product roles. Each renders the SAME DashboardShell. */
export type Role = 'admin' | 'recruiter' | 'candidate';

export type NavItem = {
  label: string;
  to: string;
  icon: ElementType;
  /** exact-match active state (e.g. index routes) */
  end?: boolean;
  /** optional: marks a secondary nav item */
  comingSoon?: boolean;
};

export type NavSection = {
  /** optional muted section caption */
  title?: string;
  items: NavItem[];
};

export type ShellUser = {
  name: string;
  email?: string;
  /** secondary line under the name (company for recruiter, role for admin…) */
  meta?: string;
  avatarUrl?: string | null;
};

export type Crumb = { label: string; to?: string };
