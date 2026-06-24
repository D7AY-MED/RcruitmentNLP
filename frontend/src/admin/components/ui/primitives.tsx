/**
 * Small presentational primitives shared across admin pages:
 * Card, Badge, StatusBadge, Spinner, Skeleton, EmptyState, ErrorState,
 * PageHeader, Avatar.
 */
import React from "react";
import { cn } from "@/lib/utils";
import { Loader2, AlertTriangle, Inbox } from "lucide-react";
import { Button } from "./Button";

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-xl border border-gray-200 bg-white shadow-sm", className)}
      {...props}
    >
      {children}
    </div>
  );
}

type BadgeTone = "gray" | "green" | "red" | "indigo" | "amber" | "blue";
const TONES: Record<BadgeTone, string> = {
  gray: "bg-gray-100 text-gray-700",
  green: "bg-emerald-100 text-emerald-700",
  red: "bg-red-100 text-red-700",
  indigo: "bg-indigo-100 text-indigo-700",
  amber: "bg-amber-100 text-amber-700",
  blue: "bg-blue-100 text-blue-700",
};

export function Badge({
  tone = "gray",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/** Coloured dot + label for an enabled/disabled or active/inactive status. */
export function StatusBadge({ active, labels }: { active: boolean; labels?: [string, string] }) {
  const [on, off] = labels ?? ["Active", "Disabled"];
  return (
    <Badge tone={active ? "green" : "gray"}>
      <span className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-emerald-500" : "bg-gray-400")} />
      {active ? on : off}
    </Badge>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-5 w-5 animate-spin text-indigo-600", className)} />;
}

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={cn("animate-pulse rounded-md bg-gray-200", className)} style={style} />;
}

/** Centered loading state for a whole panel. */
export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-500">
      <Spinner className="h-6 w-6" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

/** Skeleton placeholder for a chart panel (shimmer bars), so charts never show
 *  a bare "Loading…" spinner. */
export function ChartSkeleton({ height = 220 }: { height?: number }) {
  const bars = [60, 80, 45, 95, 70, 85, 55];
  return (
    <div className="flex items-end justify-between gap-2 px-1" style={{ height }}>
      {bars.map((h, i) => (
        <Skeleton key={i} className="flex-1 rounded-t-md" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        {icon ?? <Inbox className="h-6 w-6" />}
      </div>
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      {description && <p className="max-w-sm text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="text-sm font-semibold text-gray-900">Something went wrong</h3>
      <p className="max-w-sm text-sm text-gray-500">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

/** Standard page header: title, optional subtitle, right-aligned actions slot. */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Circular initials avatar. */
export function Avatar({ name, className }: { name?: string | null; className?: string }) {
  const init = (name || "?")
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700",
        className
      )}
    >
      {init || "?"}
    </div>
  );
}
