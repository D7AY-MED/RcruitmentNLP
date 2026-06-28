/**
 * Company detail drawer: overview, editable company_* fields, member recruiters
 * and the company's job pools. Editing writes the shared company_* columns to
 * every recruiter in the company (backend handles the fan-out).
 */
import React, { useEffect, useState } from "react";
import { Globe, Mail, Phone, MapPin, Users, Briefcase, Pencil } from "lucide-react";
import {
  Drawer, Button, Field, Input, Textarea, Avatar, Badge, LoadingState, ErrorState,
} from "../ui";
import type { Company } from "../../types";
import * as companiesService from "../../services/companies.service";
import { toast } from "../../hooks/useToast";
import { displayValue } from "../../lib/format";

const EDIT_FIELDS: { key: keyof Company; label: string; textarea?: boolean; type?: string }[] = [
  { key: "company_industry", label: "Industry" },
  { key: "company_size", label: "Company size" },
  { key: "company_founded_year", label: "Founded year", type: "number" },
  { key: "company_website", label: "Website" },
  { key: "company_linkedin_url", label: "LinkedIn" },
  { key: "company_email", label: "Email", type: "email" },
  { key: "company_phone", label: "Phone" },
  { key: "company_address", label: "Address" },
  { key: "company_description", label: "Description", textarea: true },
];

export function CompanyDetailDrawer({
  open,
  companyKey,
  onClose,
  onChanged,
}: {
  open: boolean;
  companyKey: string | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !companyKey) return;
    setEditing(false);
    setLoading(true);
    setError(null);
    companiesService
      .getCompany(companyKey)
      .then((c) => {
        setCompany(c);
        setForm({ ...c });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [open, companyKey]);

  const save = async () => {
    if (!company || !companyKey) return;
    const changed: Record<string, any> = {};
    for (const f of EDIT_FIELDS) {
      const before = (company as any)[f.key];
      const after = form[f.key as string];
      if (JSON.stringify(before ?? null) !== JSON.stringify(after ?? null)) changed[f.key as string] = after;
    }
    if (!Object.keys(changed).length) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      const updated = await companiesService.updateCompany(companyKey, changed);
      setCompany(updated);
      setForm({ ...updated });
      setEditing(false);
      toast.success("Company updated");
      onChanged();
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={loading ? "Loading…" : company?.company_name || "Company"}
      subtitle={
        company && (
          <span className="flex items-center gap-2">
            <Badge tone="emerald"><Users className="h-3 w-3" />{company.recruiters} recruiters</Badge>
            <Badge tone="amber"><Briefcase className="h-3 w-3" />{company.jobs} jobs</Badge>
          </span>
        )
      }
      footer={
        company && (
          editing ? (
            <>
              <Button variant="outline" onClick={() => { setEditing(false); setForm({ ...company }); }}>Cancel</Button>
              <Button loading={saving} onClick={save}>Save changes</Button>
            </>
          ) : (
            <Button onClick={() => setEditing(true)}><Pencil className="h-4 w-4" />Edit company</Button>
          )
        )
      }
    >
      {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : company ? (
        <div className="space-y-6">
          {/* Quick contact */}
          {!editing && (
            <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-border-brand dark:bg-surface dark:text-ink">
              <span className="flex items-center gap-1.5"><Globe className="h-4 w-4 text-gray-400 dark:text-muted" />{displayValue(company.company_website)}</span>
              <span className="flex items-center gap-1.5"><Mail className="h-4 w-4 text-gray-400 dark:text-muted" />{displayValue(company.company_email)}</span>
              <span className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-gray-400 dark:text-muted" />{displayValue(company.company_phone)}</span>
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-gray-400 dark:text-muted" />{displayValue(company.company_address)}</span>
            </div>
          )}

          {/* Company fields */}
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-muted">Company profile</h3>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              {EDIT_FIELDS.map((f) => (
                <div key={f.key as string} className={f.textarea ? "sm:col-span-2" : ""}>
                  <dt className="mb-1 text-xs font-medium text-gray-500 dark:text-muted">{f.label}</dt>
                  {editing ? (
                    f.textarea ? (
                      <Textarea value={form[f.key as string] ?? ""} onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))} />
                    ) : (
                      <Input
                        type={f.type === "number" ? "number" : f.type === "email" ? "email" : "text"}
                        value={form[f.key as string] ?? ""}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, [f.key]: f.type === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value }))
                        }
                      />
                    )
                  ) : (
                    <dd className="text-sm text-gray-900 dark:text-ink">{displayValue((company as any)[f.key])}</dd>
                  )}
                </div>
              ))}
            </dl>
          </section>

          {/* Members */}
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-muted">
              Recruiters ({company.members.length})
            </h3>
            <ul className="space-y-2">
              {company.members.map((m) => (
                <li key={m.id} className="flex items-center gap-3 rounded-lg border border-gray-100 p-2.5 dark:border-border-brand">
                  <Avatar name={m.full_name} className="h-8 w-8 text-[11px]" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-ink">{m.full_name}</p>
                    <p className="truncate text-xs text-gray-500 dark:text-muted">{m.email}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Jobs */}
          {!!company.pools?.length && (
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-muted">
                Job pools ({company.pools.length})
              </h3>
              <ul className="space-y-2">
                {company.pools.map((p) => (
                  <li key={p.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-2.5 dark:border-border-brand">
                    <span className="truncate text-sm text-gray-900 dark:text-ink">{p.title}</span>
                    <Badge tone={p.status ? "green" : "gray"}>{p.status ? "Active" : "Inactive"}</Badge>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      ) : null}
    </Drawer>
  );
}
