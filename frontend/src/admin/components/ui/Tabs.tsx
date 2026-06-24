/** Simple underline tabs. Controlled via `value`/`onChange`. */
import React from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  value: string;
  label: React.ReactNode;
}

export function Tabs({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: TabItem[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("border-b border-gray-200", className)}>
      <nav className="-mb-px flex gap-6" role="tablist">
        {tabs.map((t) => {
          const active = t.value === value;
          return (
            <button
              key={t.value}
              role="tab"
              aria-selected={active}
              onClick={() => onChange(t.value)}
              className={cn(
                "whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors",
                active
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              )}
            >
              {t.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
