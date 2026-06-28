import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, LogOut } from 'lucide-react';
import type { ElementType } from 'react';
import { cn } from '@/lib/utils';
import { Avatar } from '../components/Avatar';
import type { ShellUser } from './types';

export type ProfileMenuItem = {
  label: string;
  icon?: ElementType;
  to?: string;
  onClick?: () => void;
  danger?: boolean;
};

/**
 * ProfileMenu — avatar + name trigger with a dropdown. Shared by all roles.
 */
export function ProfileMenu({
  user,
  items = [],
  onSignOut,
  signOutLabel = 'Se déconnecter',
}: {
  user: ShellUser;
  items?: ProfileMenuItem[];
  onSignOut?: () => void;
  signOutLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-xl pl-1.5 pr-2 h-10 hover:bg-surface-2 transition-colors"
      >
        <Avatar name={user.name} src={user.avatarUrl} size="sm" />
        <span className="hidden sm:block text-left max-w-[140px]">
          <span className="block text-sm font-semibold text-ink truncate leading-tight">{user.name}</span>
          {user.meta && <span className="block text-xs text-muted truncate leading-tight">{user.meta}</span>}
        </span>
        <ChevronDown className={cn('w-4 h-4 text-muted transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-60 rounded-xl border border-border-brand bg-card shadow-lg overflow-hidden z-50"
        >
          <div className="px-4 py-3 border-b border-border-brand">
            <p className="text-sm font-semibold text-ink truncate">{user.name}</p>
            {user.email && <p className="text-xs text-muted truncate">{user.email}</p>}
          </div>
          <div className="py-1.5">
            {items.map((item) => {
              const cls =
                'w-full flex items-center gap-2.5 px-4 h-10 text-sm transition-colors text-ink hover:bg-surface-2';
              const Icon = item.icon;
              return item.to ? (
                <Link key={item.label} to={item.to} role="menuitem" className={cls} onClick={() => setOpen(false)}>
                  {Icon && <Icon className="w-4 h-4 text-muted" />}
                  {item.label}
                </Link>
              ) : (
                <button
                  key={item.label}
                  role="menuitem"
                  className={cls}
                  onClick={() => {
                    setOpen(false);
                    item.onClick?.();
                  }}
                >
                  {Icon && <Icon className="w-4 h-4 text-muted" />}
                  {item.label}
                </button>
              );
            })}
          </div>
          {onSignOut && (
            <div className="py-1.5 border-t border-border-brand">
              <button
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onSignOut();
                }}
                className="w-full flex items-center gap-2.5 px-4 h-10 text-sm text-danger hover:bg-danger-soft transition-colors"
              >
                <LogOut className="w-4 h-4" />
                {signOutLabel}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ProfileMenu;
