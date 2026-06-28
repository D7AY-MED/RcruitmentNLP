/**
 * Applications page — interview_sessions grouped into applications. Search,
 * status filter, progress bars, and a read-only transcript drawer.
 */
import React, { useState } from "react";
import { ClipboardList, CheckCircle2, Clock } from "lucide-react";
import { useQuery } from "../hooks/useQuery";
import { useDebounce } from "../hooks/useDebounce";
import * as appsService from "../services/applications.service";
import type { ApplicationRow } from "../types";
import {
  Card, PageHeader, SearchInput, Select, DataTable, Badge, Avatar,
} from "../components/ui";
import type { Column } from "../components/ui";
import { ApplicationDetailDrawer } from "../components/applications/ApplicationDetailDrawer";
import { formatDateTime } from "../lib/format";

type StatusFilter = "" | "active" | "completed";

export function ApplicationsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("");
  const [selected, setSelected] = useState<string | null>(null);
  const debounced = useDebounce(search);

  const { data, loading, error, reload } = useQuery<ApplicationRow[]>(
    `applications:${status || "all"}:${debounced}`,
    () => appsService.listApplications({ search: debounced || undefined, status: status || undefined })
  );
  const rows = data ?? [];

  const columns: Column<ApplicationRow>[] = [
    {
      header: "Candidate",
      cell: (a) => (
        <div className="flex items-center gap-3">
          <Avatar name={a.candidate_name} />
          <div className="min-w-0">
            <p className="truncate font-medium text-gray-900 dark:text-ink">{a.candidate_name || "Unknown"}</p>
            <p className="truncate text-xs text-gray-500 dark:text-muted">{a.phone || "—"}</p>
          </div>
        </div>
      ),
    },
    { header: "Job pool", cell: (a) => <span className="text-gray-600 dark:text-ink">{a.pool_title || "—"}</span> },
    {
      header: "Progress",
      cell: (a) => {
        const pct = a.total_questions ? Math.round((a.answered / a.total_questions) * 100) : 0;
        return (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-100 dark:bg-surface-2">
              <div className="h-full rounded-full bg-indigo-600" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-gray-500 dark:text-muted">{a.answered}/{a.total_questions}</span>
          </div>
        );
      },
    },
    {
      header: "Status",
      cell: (a) => (
        <Badge tone={a.status === "completed" ? "green" : "amber"}>
          {a.status === "completed" ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
          {a.status === "completed" ? "Completed" : "In progress"}
        </Badge>
      ),
    },
    { header: "Updated", cell: (a) => <span className="text-gray-500 dark:text-muted">{formatDateTime(a.updated_at)}</span> },
  ];

  return (
    <div>
      <PageHeader title="Applications" subtitle="Candidate interviews across all job pools" />

      <Card>
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-border-brand">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by candidate or job…" className="sm:max-w-xs" />
          <Select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} className="sm:w-44">
            <option value="">All statuses</option>
            <option value="active">In progress</option>
            <option value="completed">Completed</option>
          </Select>
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(a) => a.session_id || `${a.candidate_id}`}
          loading={loading}
          error={error}
          onRetry={reload}
          onRowClick={(a) => setSelected(a.session_id)}
          pageSize={15}
          empty={{
            title: "No applications found",
            description: search || status ? "Try adjusting your search or filters." : "Interviews will appear here as candidates apply.",
            icon: <ClipboardList className="h-6 w-6" />,
          }}
        />
      </Card>

      <ApplicationDetailDrawer open={!!selected} sessionId={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
