/**
 * Jobs page — job_pools listing with search, status filter, table, actions menu
 * (view, activate/deactivate, archive, delete) and a detail/edit drawer.
 */
import React, { useState } from "react";
import { Briefcase, Eye, Power, Archive, Trash2 } from "lucide-react";
import { useQuery } from "../hooks/useQuery";
import { useDebounce } from "../hooks/useDebounce";
import * as jobsService from "../services/jobs.service";
import { invalidate } from "../services/cache";
import type { Job } from "../types";
import {
  Card, PageHeader, SearchInput, Select, DataTable, Badge, StatusBadge, ActionsMenu, useConfirm,
} from "../components/ui";
import type { Column } from "../components/ui";
import { JobDetailDrawer } from "../components/jobs/JobDetailDrawer";
import { toast } from "../hooks/useToast";
import { formatDate } from "../lib/format";

type StatusFilter = "" | "active" | "inactive" | "archived";

export function JobsPage() {
  const confirm = useConfirm();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("");
  const [selected, setSelected] = useState<string | null>(null);
  const debounced = useDebounce(search);

  const { data, loading, error, reload } = useQuery<Job[]>(
    `jobs:${status || "all"}:${debounced}`,
    () => jobsService.listJobs({ search: debounced || undefined, status: status || undefined })
  );
  const rows = data ?? [];

  const refreshAfterMutation = () => {
    invalidate("jobs:");
    invalidate("dashboard:"); // pools-by-state chart + counts change
    reload();
  };

  const toggle = async (job: Job, field: "status" | "archived") => {
    try {
      await jobsService.updateJob(job.id, { [field]: !(job as any)[field] });
      toast.success("Job updated");
      refreshAfterMutation();
    } catch (e: any) {
      toast.error(e.message || "Update failed");
    }
  };

  const remove = async (job: Job) => {
    const ok = await confirm({
      title: "Delete job pool?",
      message: `"${job.title}" will be permanently deleted. This cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await jobsService.deleteJob(job.id);
      toast.success("Job deleted");
      refreshAfterMutation();
    } catch (e: any) {
      toast.error(e.message || "Delete failed");
    }
  };

  const columns: Column<Job>[] = [
    {
      header: "Title",
      cell: (j) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-gray-900 dark:text-ink">{j.title || "Untitled"}</p>
          <p className="truncate text-xs text-gray-500 dark:text-muted">{j.location || "—"}</p>
        </div>
      ),
    },
    { header: "Company", cell: (j) => <span className="text-gray-600 dark:text-ink">{j.company_name || "—"}</span> },
    { header: "Contract", cell: (j) => <span className="text-gray-600 dark:text-ink">{j.contract_type || "—"}</span> },
    {
      header: "Status",
      cell: (j) =>
        j.archived ? (
          <Badge tone="gray"><Archive className="h-3 w-3" />Archived</Badge>
        ) : (
          <StatusBadge active={!!j.status} labels={["Active", "Inactive"]} />
        ),
    },
    { header: "Created", cell: (j) => <span className="text-gray-500 dark:text-muted">{formatDate(j.created_at)}</span> },
    {
      header: "",
      align: "right",
      width: "56px",
      cell: (j) => (
        <div onClick={(e) => e.stopPropagation()}>
          <ActionsMenu
            items={[
              { label: "View details", icon: <Eye className="h-4 w-4" />, onClick: () => setSelected(j.id) },
              { label: j.status ? "Deactivate" : "Activate", icon: <Power className="h-4 w-4" />, onClick: () => toggle(j, "status") },
              { label: j.archived ? "Unarchive" : "Archive", icon: <Archive className="h-4 w-4" />, onClick: () => toggle(j, "archived") },
              { label: "Delete", icon: <Trash2 className="h-4 w-4" />, danger: true, onClick: () => remove(j) },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Jobs" subtitle="Job pools across all recruiters" />

      <Card>
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-border-brand">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by title, company or location…" className="sm:max-w-xs" />
          <Select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} className="sm:w-44">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </Select>
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(j) => j.id}
          loading={loading}
          error={error}
          onRetry={reload}
          onRowClick={(j) => setSelected(j.id)}
          pageSize={15}
          empty={{
            title: "No jobs found",
            description: search || status ? "Try adjusting your search or filters." : "Recruiters' job pools will appear here.",
            icon: <Briefcase className="h-6 w-6" />,
          }}
        />
      </Card>

      <JobDetailDrawer open={!!selected} jobId={selected} onClose={() => setSelected(null)} onChanged={refreshAfterMutation} />
    </div>
  );
}
