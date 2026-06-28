/**
 * Top bar: mobile menu button, page-area breadcrumb, and the profile dropdown.
 *
 * Per the spec, Settings is reached ONLY through this profile dropdown
 * (Profile -> Settings), never the sidebar. The dropdown also holds Sign out.
 */
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Settings, LogOut, ChevronDown, UserCog } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { Avatar } from "../ui";
import ThemeToggle from "@/components/ThemeToggle";

export function Topbar({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 dark:border-border-brand bg-white/80 dark:bg-card/80 px-4 backdrop-blur sm:px-6">
      <button
        onClick={onOpenSidebar}
        className="rounded-lg p-2 text-gray-500 dark:text-muted hover:bg-gray-100 dark:hover:bg-surface-2 lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden items-center gap-2 text-sm text-gray-400 dark:text-muted lg:flex">
        <span className="font-medium text-gray-700 dark:text-ink">Admin Console</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />

        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg p-1 pr-2 transition-colors hover:bg-gray-100 dark:hover:bg-surface-2"
            aria-haspopup="menu"
            aria-expanded={open}
          >
            <Avatar name={admin?.full_name} />
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium leading-tight text-gray-900 dark:text-ink">{admin?.full_name}</p>
              <p className="text-xs leading-tight text-gray-400 dark:text-muted">{admin?.email}</p>
            </div>
            <ChevronDown className={cn("h-4 w-4 text-gray-400 dark:text-muted transition-transform", open && "rotate-180")} />
          </button>

          {open && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-gray-200 dark:border-border-brand bg-white dark:bg-card py-1 shadow-lg"
            >
              <div className="border-b border-gray-100 dark:border-border-brand px-4 py-3">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-ink">{admin?.full_name}</p>
                <p className="truncate text-xs text-gray-500 dark:text-muted">{admin?.email}</p>
              </div>
              <button
                role="menuitem"
                onClick={() => go("/admin/settings/profile")}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-gray-700 dark:text-ink hover:bg-gray-50 dark:hover:bg-surface-2"
              >
                <UserCog className="h-4 w-4 text-gray-400 dark:text-muted" />
                My Profile
              </button>
              <button
                role="menuitem"
                onClick={() => go("/admin/settings")}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-gray-700 dark:text-ink hover:bg-gray-50 dark:hover:bg-surface-2"
              >
                <Settings className="h-4 w-4 text-gray-400 dark:text-muted" />
                Settings
              </button>
              <div className="my-1 border-t border-gray-100 dark:border-border-brand" />
              <button
                role="menuitem"
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-danger-soft"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
