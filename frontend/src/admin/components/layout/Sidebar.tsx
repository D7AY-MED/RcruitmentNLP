/**
 * Admin sidebar navigation.
 *
 * Preserves xQuesty branding (indigo "xQuesty Admin" wordmark) and links the six
 * primary areas. Per the spec, Settings is NOT in the sidebar -- it lives in the
 * Topbar profile dropdown. Collapsible to an icon rail on desktop; on mobile it
 * is a slide-in drawer controlled by the layout.
 */
import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  ClipboardList,
  BarChart3,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/companies", label: "Companies", icon: Building2 },
  { to: "/admin/jobs", label: "Jobs", icon: Briefcase },
  { to: "/admin/applications", label: "Applications", icon: ClipboardList },
  { to: "/admin/reports", label: "Reports", icon: BarChart3 },
];

export function Sidebar({
  collapsed,
  onToggle,
  onNavigate,
}: {
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-gray-200 dark:border-border-brand bg-white dark:bg-card transition-all duration-200",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 border-b border-gray-200 dark:border-border-brand px-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
          x
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-gray-900 dark:text-ink">PooLink</p>
            <p className="truncate text-xs text-gray-400 dark:text-muted">Admin Console</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                collapsed && "justify-center px-0",
                isActive
                  ? "bg-indigo-50 dark:bg-brand-light text-indigo-700"
                  : "text-gray-600 dark:text-ink hover:bg-gray-50 dark:hover:bg-surface-2 hover:text-gray-900"
              )
            }
            title={collapsed ? label : undefined}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle (desktop only) */}
      <div className="hidden border-t border-gray-200 dark:border-border-brand p-3 lg:block">
        <button
          onClick={onToggle}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500 dark:text-muted hover:bg-gray-50 dark:hover:bg-surface-2 hover:text-gray-700",
            collapsed && "justify-center px-0"
          )}
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
