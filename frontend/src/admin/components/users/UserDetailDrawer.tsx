/**
 * Large user detail drawer with view + inline edit of every schema field.
 *
 * On open it fetches the full profile (the list rows are slim). "Edit" flips all
 * editable fields into inputs; "Save" PUTs only changed values. Candidate and
 * recruiter expose different field sets (see FIELD_GROUPS), all backed by real
 * columns on candidate_profiles / hr_profiles.
 */
import React, { useEffect, useMemo, useState } from "react";
import { Mail, Phone, Calendar, Pencil } from "lucide-react";
import {
  Drawer,
  Button,
  Field,
  Input,
  Select,
  Avatar,
  StatusBadge,
  Badge,
  LoadingState,
  ErrorState,
} from "../ui";
import type { UserRow, UserType } from "../../types";
import * as usersService from "../../services/users.service";
import { toast } from "../../hooks/useToast";
import { displayValue, formatDate } from "../../lib/format";

interface FieldDef {
  key: string;
  label: string;
  type?: "text" | "number" | "email" | "bool" | "csv";
}
interface FieldGroup {
  title: string;
  fields: FieldDef[];
}

const CANDIDATE_GROUPS: FieldGroup[] = [
  {
    title: "Identity",
    fields: [
      { key: "full_name", label: "Full name" },
      { key: "email", label: "Email", type: "email" },
      { key: "phone", label: "Phone" },
      { key: "phone_number", label: "Secondary phone" },
      { key: "city", label: "City" },
      { key: "linkedin_url", label: "LinkedIn URL" },
    ],
  },
  {
    title: "Professional",
    fields: [
      { key: "title", label: "Headline / title" },
      { key: "current_job_title", label: "Current job title" },
      { key: "current_company", label: "Current company" },
      { key: "years_of_experience", label: "Years of experience", type: "number" },
      { key: "open_to_work", label: "Open to work", type: "bool" },
    ],
  },
  {
    title: "Education & preferences",
    fields: [
      { key: "education_level", label: "Education level" },
      { key: "university_name", label: "University" },
      { key: "field_of_study", label: "Field of study" },
      { key: "languages", label: "Languages", type: "csv" },
      { key: "expected_salary_min", label: "Expected salary (min)", type: "number" },
      { key: "expected_salary_max", label: "Expected salary (max)", type: "number" },
    ],
  },
];

const RECRUITER_GROUPS: FieldGroup[] = [
  {
    title: "Identity",
    fields: [
      { key: "full_name", label: "Full name" },
      { key: "email", label: "Email", type: "email" },
      { key: "phone", label: "Phone" },
      { key: "company_name", label: "Company name" },
    ],
  },
  {
    title: "Company",
    fields: [
      { key: "company_industry", label: "Industry" },
      { key: "company_size", label: "Company size" },
      { key: "company_founded_year", label: "Founded year", type: "number" },
      { key: "company_website", label: "Website" },
      { key: "company_linkedin_url", label: "Company LinkedIn" },
      { key: "company_email", label: "Company email", type: "email" },
      { key: "company_phone", label: "Company phone" },
      { key: "company_address", label: "Address" },
      { key: "company_description", label: "Description" },
    ],
  },
];

export function UserDetailDrawer({
  open,
  userRef,
  onClose,
  onChanged,
}: {
  open: boolean;
  userRef: { type: UserType; id: string } | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [user, setUser] = useState<UserRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  const groups = useMemo(
    () => (userRef?.type === "recruiter" ? RECRUITER_GROUPS : CANDIDATE_GROUPS),
    [userRef?.type]
  );

  useEffect(() => {
    if (!open || !userRef) return;
    setEditing(false);
    setLoading(true);
    setError(null);
    usersService
      .getUser(userRef.type, userRef.id)
      .then((u) => {
        setUser(u);
        setForm({ ...(u.profile ?? {}) });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [open, userRef]);

  if (!userRef) return null;
  const profile = user?.profile ?? {};

  const setField = (key: string, raw: string, type?: string) => {
    let value: any = raw;
    if (type === "number") value = raw === "" ? null : Number(raw);
    if (type === "csv") value = raw.split(",").map((s) => s.trim()).filter(Boolean);
    setForm((f) => ({ ...f, [key]: value }));
  };

  const save = async () => {
    if (!user) return;
    // Diff against the loaded profile so we PUT only what changed.
    const changed: Record<string, any> = {};
    for (const group of groups) {
      for (const f of group.fields) {
        const before = profile[f.key];
        const after = form[f.key];
        if (JSON.stringify(before ?? null) !== JSON.stringify(after ?? null)) {
          changed[f.key] = after;
        }
      }
    }
    if (Object.keys(changed).length === 0) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      const updated = await usersService.updateUser(userRef.type, userRef.id, changed);
      setUser(updated);
      setForm({ ...(updated.profile ?? {}) });
      setEditing(false);
      toast.success("Changes saved");
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
      title={loading ? "Loading…" : user?.full_name || "User"}
      subtitle={
        user ? (
          <span className="flex items-center gap-2">
            <Badge tone={userRef.type === "recruiter" ? "emerald" : "indigo"}>
              {userRef.type === "recruiter" ? "Recruiter" : "Candidate"}
            </Badge>
            <StatusBadge active={!user.disabled} />
          </span>
        ) : null
      }
      footer={
        user && (
          <>
            {editing ? (
              <>
                <Button variant="outline" onClick={() => { setEditing(false); setForm({ ...profile }); }}>
                  Cancel
                </Button>
                <Button loading={saving} onClick={save}>Save changes</Button>
              </>
            ) : (
              <Button onClick={() => setEditing(true)}>
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            )}
          </>
        )
      }
    >
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : user ? (
        <div className="space-y-6">
          {/* Header card */}
          <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <Avatar name={user.full_name} className="h-12 w-12 text-sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">{user.full_name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{displayValue(user.email)}</span>
                <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{displayValue(user.phone)}</span>
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Joined {formatDate(user.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Field groups */}
          {groups.map((group) => (
            <section key={group.title}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                {group.title}
              </h3>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                {group.fields.map((f) => (
                  <div key={f.key} className={f.key === "company_description" ? "sm:col-span-2" : ""}>
                    <dt className="mb-1 text-xs font-medium text-gray-500">{f.label}</dt>
                    {editing ? (
                      f.type === "bool" ? (
                        <Select
                          value={String(!!form[f.key])}
                          onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value === "true" }))}
                        >
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </Select>
                      ) : (
                        <Input
                          type={f.type === "number" ? "number" : f.type === "email" ? "email" : "text"}
                          value={
                            f.type === "csv"
                              ? Array.isArray(form[f.key]) ? form[f.key].join(", ") : form[f.key] ?? ""
                              : form[f.key] ?? ""
                          }
                          onChange={(e) => setField(f.key, e.target.value, f.type)}
                        />
                      )
                    ) : (
                      <dd className="text-sm text-gray-900">{displayValue(profile[f.key])}</dd>
                    )}
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      ) : null}
    </Drawer>
  );
}
