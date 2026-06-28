/** KPI stat card for the dashboard: icon, label, value, optional delta/hint. */
import React from "react";
import { cn } from "@/lib/utils";
import { Card, Skeleton } from "./primitives";

export function KpiCard({
  label,
  value,
  icon,
  hint,
  tone = "indigo",
  loading,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  hint?: string;
  tone?: "indigo" | "emerald" | "amber" | "blue" | "rose";
  loading?: boolean;
}) {
  const toneClasses: Record<string, string> = {
    indigo: "bg-brand-light text-brand",
    emerald: "bg-success-soft text-success",
    amber: "bg-warning-soft text-warning",
    blue: "bg-brand-accent-50 text-brand-accent",
    rose: "bg-danger-soft text-danger",
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500 dark:text-muted">{label}</p>
          {loading ? (
            <Skeleton className="mt-2 h-8 w-16" />
          ) : (
            <p className="mt-1 text-3xl font-bold tracking-tight text-gray-900 dark:text-ink">{value}</p>
          )}
          {hint && <p className="mt-1 text-xs text-gray-400 dark:text-muted">{hint}</p>}
        </div>
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", toneClasses[tone])}>
          {icon}
        </div>
      </div>
    </Card>
  );
}
