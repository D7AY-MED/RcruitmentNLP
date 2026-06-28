/**
 * Dashboard — the premium overview.
 *
 * Composes: 4 headline KPI cards, a secondary KPI strip, a growth area chart,
 * an application-status donut, a pools-by-state bar chart, a recent-activity
 * feed and quick actions. All data comes from /dashboard/{stats,charts,activity}.
 */
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Building2,
  Briefcase,
  ClipboardList,
  Activity,
  CheckCircle2,
  FileText,
  Layers,
  UserPlus,
  ArrowRight,
  PlusCircle,
} from "lucide-react";
import { useQuery } from "../hooks/useQuery";
import * as dashboard from "../services/dashboard.service";
import { Card, KpiCard, PageHeader, Button, Badge, ChartSkeleton, LoadingState, ErrorState } from "../components/ui";
import { GrowthAreaChart, StatusDonut, SimpleBarChart } from "../components/charts/Charts";
import { timeAgo } from "../lib/format";

const ACTIVITY_META: Record<string, { icon: React.ReactNode; tone: string }> = {
  candidate: { icon: <Users className="h-4 w-4" />, tone: "bg-indigo-50 text-indigo-600" },
  recruiter: { icon: <Building2 className="h-4 w-4" />, tone: "bg-emerald-50 text-emerald-600" },
  job: { icon: <Briefcase className="h-4 w-4" />, tone: "bg-amber-50 text-amber-600" },
  application: { icon: <ClipboardList className="h-4 w-4" />, tone: "bg-blue-50 text-blue-600" },
};

export function DashboardPage() {
  const navigate = useNavigate();
  const stats = useQuery("dashboard:stats", dashboard.getStats);
  const charts = useQuery("dashboard:charts", dashboard.getCharts);
  const activity = useQuery("dashboard:activity", dashboard.getActivity);

  const s = stats.data;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Platform overview and key performance indicators"
        actions={
          <>
            <Button variant="outline" size="md" onClick={() => navigate("/admin/reports")}>
              <FileText className="h-4 w-4" />
              Reports
            </Button>
            <Button size="md" onClick={() => navigate("/admin/users")}>
              <UserPlus className="h-4 w-4" />
              Manage users
            </Button>
          </>
        }
      />

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Candidates" value={s?.candidates ?? 0} loading={stats.loading}
          icon={<Users className="h-5 w-5" />} tone="indigo" hint="Total registered candidates" />
        <KpiCard label="Recruiters" value={s?.recruiters ?? 0} loading={stats.loading}
          icon={<Building2 className="h-5 w-5" />} tone="emerald" hint="Across all companies" />
        <KpiCard label="Job Pools" value={s?.pools ?? 0} loading={stats.loading}
          icon={<Briefcase className="h-5 w-5" />} tone="amber" hint={`${s?.activePools ?? 0} active`} />
        <KpiCard label="Applications" value={s?.applications ?? 0} loading={stats.loading}
          icon={<ClipboardList className="h-5 w-5" />} tone="blue"
          hint={`${s?.completedApplications ?? 0} completed`} />
      </div>

      {/* Secondary KPIs */}
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Companies" value={s?.companies ?? 0} loading={stats.loading}
          icon={<Layers className="h-5 w-5" />} tone="rose" />
        <KpiCard label="Active Pools" value={s?.activePools ?? 0} loading={stats.loading}
          icon={<Activity className="h-5 w-5" />} tone="emerald" />
        <KpiCard label="Completed" value={s?.completedApplications ?? 0} loading={stats.loading}
          icon={<CheckCircle2 className="h-5 w-5" />} tone="indigo" />
        <KpiCard label="AI Summaries" value={s?.summaries ?? 0} loading={stats.loading}
          icon={<FileText className="h-5 w-5" />} tone="blue" />
      </div>

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-ink">Growth</h2>
              <p className="text-sm text-gray-500 dark:text-muted">New candidates vs recruiters, last 6 months</p>
            </div>
          </div>
          {charts.loading ? (
            <ChartSkeleton height={260} />
          ) : charts.error ? (
            <ErrorState message={charts.error} onRetry={charts.reload} />
          ) : (
            <GrowthAreaChart data={charts.data?.growth ?? []} />
          )}
        </Card>

        <Card className="p-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-ink">Applications</h2>
          <p className="mb-2 text-sm text-gray-500 dark:text-muted">Status breakdown</p>
          {charts.loading ? <ChartSkeleton height={220} /> : <StatusDonut data={charts.data?.applicationStatus ?? []} />}
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Activity feed */}
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 dark:text-ink">Recent activity</h2>
            <Badge tone="gray">Live</Badge>
          </div>
          {activity.loading ? (
            <LoadingState />
          ) : activity.error ? (
            <ErrorState message={activity.error} onRetry={activity.reload} />
          ) : !activity.data?.length ? (
            <p className="py-8 text-center text-sm text-gray-400 dark:text-muted">No recent activity</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-[hsl(var(--border))]">
              {activity.data.map((item, i) => {
                const meta = ACTIVITY_META[item.type] ?? ACTIVITY_META.candidate;
                return (
                  <li key={i} className="flex items-center gap-3 py-3">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${meta.tone}`}>
                      {meta.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-ink">{item.title}</p>
                      <p className="truncate text-xs text-gray-500 dark:text-muted">{item.subtitle}</p>
                    </div>
                    <span className="shrink-0 text-xs text-gray-400 dark:text-muted">{timeAgo(item.timestamp)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Quick actions + pools state */}
        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-ink">Quick actions</h2>
            <div className="space-y-2">
              <QuickAction label="Manage users" icon={<Users className="h-4 w-4" />} onClick={() => navigate("/admin/users")} />
              <QuickAction label="Review applications" icon={<ClipboardList className="h-4 w-4" />} onClick={() => navigate("/admin/applications")} />
              <QuickAction label="Browse jobs" icon={<Briefcase className="h-4 w-4" />} onClick={() => navigate("/admin/jobs")} />
              <QuickAction label="Export a report" icon={<PlusCircle className="h-4 w-4" />} onClick={() => navigate("/admin/reports")} />
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-semibold text-gray-900 dark:text-ink">Job pools</h2>
            <p className="mb-2 text-sm text-gray-500 dark:text-muted">By state</p>
            {charts.loading ? <ChartSkeleton height={220} /> : <SimpleBarChart data={charts.data?.poolsState ?? []} />}
          </Card>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-700 dark:border-border-brand dark:text-ink dark:hover:bg-brand-light"
    >
      <span className="flex items-center gap-2.5">{icon}{label}</span>
      <ArrowRight className="h-4 w-4 text-gray-300" />
    </button>
  );
}
