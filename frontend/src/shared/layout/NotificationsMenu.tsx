import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { EmptyState } from '../components/states';

/**
 * NotificationsMenu — header bell with a dropdown. Phase-0 stub: there is no
 * notifications backend yet, so it shows a polished empty state. Wired to a
 * real feed once the endpoint exists.
 */
export function NotificationsMenu() {
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
        aria-label="Notifications"
        aria-haspopup="menu"
        aria-expanded={open}
        className="relative w-10 h-10 rounded-xl flex items-center justify-center text-muted hover:text-ink hover:bg-surface-2 transition-colors"
      >
        <Bell className="w-[18px] h-[18px]" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-80 rounded-xl border border-border-brand bg-card shadow-lg overflow-hidden z-50"
        >
          <div className="px-4 py-3 border-b border-border-brand">
            <p className="text-sm font-semibold text-ink">Notifications</p>
          </div>
          <EmptyState
            icon={Bell}
            title="Aucune notification"
            description="Vous serez alerté ici dès qu'une activité vous concerne."
            className="py-10"
          />
        </div>
      )}
    </div>
  );
}

export default NotificationsMenu;
