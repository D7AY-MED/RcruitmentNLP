/**
 * Reports page — analytics dashboards + CSV/Excel exports.
 *
 * Shows headline totals, an interview-completion gauge, a top-companies bar
 * chart, and an export panel that downloads any dataset as CSV or XLSX from the
 * backend (which builds the files in-memory; no schema changes).
 */
import React, { useState } from "react";
import {
  Users, Building2, Briefcase, ClipboardList, Download, FileSpreadsheet, FileText, TrendingUp,
} from "lucide-react";
import { useQuery } from "../hooks/useQuery";
import * as reportsService from "../services/reports.service";
import type { ReportDataset } from "../services/reports.service";
import { Card, PageHeader, KpiCard, Button, Badge, LoadingState, ErrorState } from "../components/ui";
import { SimpleBarChart } from "../components/charts/Charts";
import { toast } from "../hooks/useToast";

const DATASETS: { key: ReportDataset; label: string; icon: React.ReactNode }[] = [
  { key: "users", label: "All users", icon: <Users className="h-4 w-4" /> },
  { key: "candidates", label: "Candidates", icon: <Users className="h-4 w-4" /> },
  { key: "recruiters", label: "Recruiters", icon: <Building2 className="h-4 w-4" /> },
  { key: "companies", label: "Companies", icon: <Building2 className="h-4 w-4" /> },
  { key: "jobs", label: "Jobs", icon: <Briefcase className="h-4 w-4" /> },
  { key: "applications", label: "Applications", icon: <ClipboardList className="h-4 w-4" /> },
];

export function ReportsPage() {
  const { data, loading, error, reload } = useQuery("reports:summary", reportsService.getSummary);
  const [busy, setBusy] = useState<string | null>(null);

  const doExport = async (dataset: ReportDataset, format: "csv" | "xlsx") => {
    setBusy(`${dataset}:${format}`);
    try {
      await reportsService.exportDataset(dataset, format);
      toast.success(`Exported ${dataset}.${format}`);
    } catch (e: any) {
      toast.error(e.message || "Export failed");
    } finally {
      setBusy(null);
    }
  };

  const t = data?.totals;
  const topCompanies = (data?.topCompanies ?? []).map((c) => ({ name: c.company_name, value: c.jobs }));

  return (
    <div>
      <PageHeader title="Reports" subtitle="Platform analytics and data exports" />

      {loading ? (
        <Card><LoadingState /></Card>
      ) : error ? (
        <Card><ErrorState message={error} onRetry={reload} /></Card>
      ) : (
        <>
          {/* Totals */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Candidates" value={t?.candidates ?? 0} icon={<Users className="h-5 w-5" />} tone="indigo" />
            <KpiCard label="Recruiters" value={t?.recruiters ?? 0} icon={<Building2 className="h-5 w-5" />} tone="emerald" />
            <KpiCard label="Jobs" value={t?.jobs ?? 0} icon={<Briefcase className="h-5 w-5" />} tone="amber"
              hint={`${t?.activeJobs ?? 0} active · ${t?.archivedJobs ?? 0} archived`} />
            <KpiCard label="Applications" value={t?.applications ?? 0} icon={<ClipboardList className="h-5 w-5" />} tone="blue"
              hint={`${t?.completedApplications ?? 0} completed`} />
          </div>

          {/* Charts row */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="p-6 lg:col-span-1">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-ink"><TrendingUp className="h-4 w-4 text-indigo-600" />Interview completion</p>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-4xl font-bold tracking-tight text-gray-900 dark:text-ink">{data?.rates.interviewCompletionRate ?? 0}%</span>
                <span className="mb-1 text-sm text-gray-500 dark:text-muted">of interviews completed</span>
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-surface-2">
                <div className="h-full rounded-full bg-indigo-600" style={{ width: `${data?.rates.interviewCompletionRate ?? 0}%` }} />
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Badge tone="emerald">{data?.rates.openToWorkCandidates ?? 0} open to work</Badge>
                <Badge tone="gray">{t?.companies ?? 0} companies</Badge>
              </div>
            </Card>

            <Card className="p-6 lg:col-span-2">
              <p className="mb-2 text-sm font-semibold text-gray-900 dark:text-ink">Top companies by job pools</p>
              <SimpleBarChart data={topCompanies} />
            </Card>
          </div>

          {/* Export */}
          <Card className="mt-6 p-6">
            <div className="mb-4 flex items-center gap-2">
              <Download className="h-5 w-5 text-indigo-600" />
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-ink">Export data</h2>
                <p className="text-sm text-gray-500 dark:text-muted">Download any dataset as CSV or Excel</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {DATASETS.map((d) => (
                <div key={d.key} className="flex items-center justify-between rounded-xl border border-gray-200 p-4 dark:border-border-brand">
                  <span className="flex items-center gap-2.5 text-sm font-medium text-gray-700 dark:text-ink">
                    <span className="text-indigo-600">{d.icon}</span>
                    {d.label}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button variant="outline" size="sm" loading={busy === `${d.key}:csv`} onClick={() => doExport(d.key, "csv")}>
                      <FileText className="h-3.5 w-3.5" />CSV
                    </Button>
                    <Button variant="outline" size="sm" loading={busy === `${d.key}:xlsx`} onClick={() => doExport(d.key, "xlsx")}>
                      <FileSpreadsheet className="h-3.5 w-3.5" />Excel
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
