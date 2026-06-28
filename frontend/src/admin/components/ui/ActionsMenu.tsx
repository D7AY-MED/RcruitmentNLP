/**
 * Three-dot actions menu (dropdown).
 *
 * Click the trigger to open a small menu of actions. Closes on outside-click,
 * Escape, or after an item is chosen. Items can be marked `danger` (red) and
 * `disabled`. Positioned to the right, flipping above if near the viewport edge
 * is intentionally kept simple (always opens below-right).
 */
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ActionItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

export function ActionsMenu({ items, label = "Open actions" }: { items: ActionItem[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (
        !menuRef.current?.contains(e.target as Node) &&
        !triggerRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      // Menu is 192px wide; align its right edge to the trigger's right edge.
      setCoords({ top: rect.bottom + 6, left: rect.right - 192 });
    }
    setOpen((o) => !o);
  };

  return (
    <>
      <button
        ref={triggerRef}
        onClick={toggle}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 dark:text-muted transition-colors",
          "hover:bg-gray-100 dark:hover:bg-surface-2 hover:text-gray-700",
          open && "bg-gray-100 dark:bg-surface-2 text-gray-700"
        )}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ top: coords.top, left: Math.max(8, coords.left) }}
            className="fixed z-[60] w-48 overflow-hidden rounded-lg border border-gray-200 dark:border-border-brand bg-white dark:bg-card py-1 shadow-lg"
          >
            {items.map((item, i) => (
              <button
                key={i}
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors",
                  "disabled:cursor-not-allowed disabled:opacity-40",
                  item.danger
                    ? "text-danger hover:bg-danger-soft dark:hover:bg-danger-soft"
                    : "text-gray-700 dark:text-ink hover:bg-gray-50 dark:hover:bg-surface-2"
                )}
              >
                {item.icon && <span className="shrink-0">{item.icon}</span>}
                {item.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}
