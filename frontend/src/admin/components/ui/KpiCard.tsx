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
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600",
    rose: "bg-rose-50 text-rose-600",
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          {loading ? (
            <Skeleton className="mt-2 h-8 w-16" />
          ) : (
            <p className="mt-1 text-3xl font-bold tracking-tight text-gray-900">{value}</p>
          )}
          {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
        </div>
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", toneClasses[tone])}>
          {icon}
        </div>
      </div>
    </Card>
  );
}
