/**
 * Job (job_pool) detail drawer: overview, requirements, recruiter/company, and
 * management actions (activate/deactivate, archive/unarchive, edit core fields,
 * delete). Edits PATCH only changed fields.
 */
import React, { useEffect, useState } from "react";
import { MapPin, Briefcase, Building2, Power, Archive, Pencil } from "lucide-react";
import {
  Drawer, Button, Field, Input, Textarea, Badge, StatusBadge, LoadingState, ErrorState,
} from "../ui";
import type { Job } from "../../types";
import * as jobsService from "../../services/jobs.service";
import { toast } from "../../hooks/useToast";
import { displayValue, formatDate } from "../../lib/format";

const ARRAY_FIELDS: { key: keyof Job; label: string }[] = [
  { key: "must_have_skills", label: "Must-have skills" },
  { key: "nice_to_have_skills", label: "Nice-to-have skills" },
  { key: "soft_skills", label: "Soft skills" },
  { key: "responsibilities", label: "Responsibilities" },
  { key: "deal_breakers", label: "Deal breakers" },
  { key: "languages", label: "Languages" },
];

export function JobDetailDrawer({
  open,
  jobId,
  onClose,
  onChanged,
}: {
  open: boolean;
  jobId: string | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  const load = (id: string) => {
    setLoading(true);
    setError(null);
    jobsService.getJob(id).then((j) => { setJob(j); setForm({ ...j }); })
      .catch((e) => setError(e.message)).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!open || !jobId) return;
    setEditing(false);
    load(jobId);
  }, [open, jobId]);

  const patch = async (changes: Record<string, any>, msg: string) => {
    if (!jobId) return;
    try {
      const updated = await jobsService.updateJob(jobId, changes);
      setJob(updated);
      setForm({ ...updated });
      toast.success(msg);
      onChanged();
    } catch (e: any) {
      toast.error(e.message || "Update failed");
    }
  };

  const saveEdits = async () => {
    if (!job) return;
    const editable = ["title", "description", "location", "contract_type", "seniority_level", "main_mission", "notes"];
    const changed: Record<string, any> = {};
    for (const k of editable) if ((job as any)[k] !== form[k]) changed[k] = form[k];
    if (!Object.keys(changed).length) { setEditing(false); return; }
    setSaving(true);
    await patch(changed, "Job updated");
    setSaving(false);
    setEditing(false);
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={loading ? "Loading…" : job?.title || "Job pool"}
      subtitle={
        job && (
          <span className="flex items-center gap-2">
            <StatusBadge active={!!job.status} labels={["Active", "Inactive"]} />
            {job.archived && <Badge tone="gray"><Archive className="h-3 w-3" />Archived</Badge>}
          </span>
        )
      }
      footer={
        job && (
          editing ? (
            <>
              <Button variant="outline" onClick={() => { setEditing(false); setForm({ ...job }); }}>Cancel</Button>
              <Button loading={saving} onClick={saveEdits}>Save changes</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => patch({ status: !job.status }, job.status ? "Deactivated" : "Activated")}>
                <Power className="h-4 w-4" />{job.status ? "Deactivate" : "Activate"}
              </Button>
              <Button variant="outline" onClick={() => patch({ archived: !job.archived }, job.archived ? "Unarchived" : "Archived")}>
                <Archive className="h-4 w-4" />{job.archived ? "Unarchive" : "Archive"}
              </Button>
              <Button onClick={() => setEditing(true)}><Pencil className="h-4 w-4" />Edit</Button>
            </>
          )
        )
      }
    >
      {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : job ? (
        <div className="space-y-6">
          {/* Meta */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-border-brand dark:bg-surface dark:text-ink">
            <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4 text-gray-400 dark:text-muted" />{displayValue(job.company_name)}</span>
            <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-gray-400 dark:text-muted" />{displayValue(job.location)}</span>
            <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4 text-gray-400 dark:text-muted" />{displayValue(job.contract_type)}</span>
            <span className="text-gray-400 dark:text-muted">Created {formatDate(job.created_at)}</span>
          </div>

          {/* Core (editable) */}
          <section className="space-y-4">
            {editing ? (
              <>
                <Field label="Title"><Input value={form.title ?? ""} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} /></Field>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Location"><Input value={form.location ?? ""} onChange={(e) => setForm((s) => ({ ...s, location: e.target.value }))} /></Field>
                  <Field label="Contract type"><Input value={form.contract_type ?? ""} onChange={(e) => setForm((s) => ({ ...s, contract_type: e.target.value }))} /></Field>
                  <Field label="Seniority"><Input value={form.seniority_level ?? ""} onChange={(e) => setForm((s) => ({ ...s, seniority_level: e.target.value }))} /></Field>
                </div>
                <Field label="Main mission"><Textarea value={form.main_mission ?? ""} onChange={(e) => setForm((s) => ({ ...s, main_mission: e.target.value }))} /></Field>
                <Field label="Description"><Textarea value={form.description ?? ""} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} /></Field>
                <Field label="Notes"><Textarea value={form.notes ?? ""} onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))} /></Field>
              </>
            ) : (
              <>
                {job.main_mission && <DetailBlock label="Main mission" value={job.main_mission} />}
                {job.description && <DetailBlock label="Description" value={job.description} />}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <Meta label="Seniority" value={job.seniority_level} />
                  <Meta label="Experience" value={job.experience_range} />
                  <Meta label="Education" value={job.education_level} />
                </div>
              </>
            )}
          </section>

          {/* Requirements arrays */}
          {!editing && (
            <section className="space-y-4">
              {ARRAY_FIELDS.map((f) => {
                const arr = (job as any)[f.key] as string[] | null;
                if (!arr?.length) return null;
                return (
                  <div key={f.key as string}>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-muted">{f.label}</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {arr.map((s, i) => <Badge key={i} tone="indigo">{s}</Badge>)}
                    </div>
                  </div>
                );
              })}
            </section>
          )}
        </div>
      ) : null}
    </Drawer>
  );
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-muted">{label}</h4>
      <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-ink">{value}</p>
    </div>
  );
}

function Meta({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 dark:text-muted">{label}</p>
      <p className="text-sm text-gray-900 dark:text-ink">{displayValue(value)}</p>
    </div>
  );
}
