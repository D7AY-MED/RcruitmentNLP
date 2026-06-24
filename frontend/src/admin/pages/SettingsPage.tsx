/**
 * Settings page (reached only via the profile dropdown, never the sidebar).
 *
 * Tabbed sections:
 *   - My Profile : edit the signed-in admin's name
 *   - Admin Users: list/create/delete administrators (the ONLY admin surface)
 *   - Security   : change own password
 *   - API Keys   : placeholder (no DB support; spec forbids new tables)
 *
 * The active tab is encoded in the URL (/admin/settings/:section) so the
 * dropdown can deep-link to "My Profile".
 */
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { UserCog, Shield, KeyRound, Users, Trash2, Plus, Lock } from "lucide-react";
import { useAsync } from "../hooks/useAsync";
import { useAdminAuth } from "../context/AdminAuthContext";
import * as settingsService from "../services/settings.service";
import type { Admin } from "../types";
import {
  Card, PageHeader, Tabs, Button, Field, Input, Avatar, Badge, DataTable, Modal,
  useConfirm, LoadingState, ErrorState, EmptyState,
} from "../components/ui";
import type { Column, TabItem } from "../components/ui";
import { toast } from "../hooks/useToast";
import { formatDate } from "../lib/format";

const TABS: TabItem[] = [
  { value: "profile", label: <span className="flex items-center gap-1.5"><UserCog className="h-4 w-4" />My Profile</span> },
  { value: "admins", label: <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />Admin Users</span> },
  { value: "security", label: <span className="flex items-center gap-1.5"><Shield className="h-4 w-4" />Security</span> },
  { value: "api-keys", label: <span className="flex items-center gap-1.5"><KeyRound className="h-4 w-4" />API Keys</span> },
];

export function SettingsPage() {
  const { section } = useParams();
  const navigate = useNavigate();
  const active = TABS.some((t) => t.value === section) ? (section as string) : "profile";

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your account, administrators and platform security" />
      <Tabs tabs={TABS} value={active} onChange={(v) => navigate(`/admin/settings/${v}`)} className="mb-6" />
      {active === "profile" && <ProfileSection />}
      {active === "admins" && <AdminUsersSection />}
      {active === "security" && <SecuritySection />}
      {active === "api-keys" && <ApiKeysSection />}
    </div>
  );
}

/* --- My Profile ----------------------------------------------------------- */

function ProfileSection() {
  const { admin, setAdmin } = useAdminAuth();
  const [fullName, setFullName] = useState(admin?.full_name ?? "");
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await settingsService.updateProfile({ full_name: fullName.trim() });
      setAdmin(updated);
      toast.success("Profile updated");
    } catch (err: any) {
      toast.error(err.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="max-w-2xl p-6">
      <div className="mb-6 flex items-center gap-4">
        <Avatar name={admin?.full_name} className="h-14 w-14 text-base" />
        <div>
          <p className="font-semibold text-gray-900">{admin?.full_name}</p>
          <p className="text-sm text-gray-500">{admin?.email}</p>
          <Badge tone="indigo" className="mt-1">Administrator</Badge>
        </div>
      </div>
      <form onSubmit={save} className="space-y-4">
        <Field label="Full name"><Input value={fullName} onChange={(e) => setFullName(e.target.value)} required /></Field>
        <Field label="Email" hint="Email changes are managed in Supabase Auth and are not editable here.">
          <Input value={admin?.email ?? ""} disabled />
        </Field>
        <div className="pt-2"><Button type="submit" loading={saving}>Save profile</Button></div>
      </form>
    </Card>
  );
}

/* --- Admin Users ---------------------------------------------------------- */

function AdminUsersSection() {
  const { admin } = useAdminAuth();
  const confirm = useConfirm();
  const { data, loading, error, reload } = useAsync<Admin[]>(settingsService.listAdmins, []);
  const [createOpen, setCreateOpen] = useState(false);

  const remove = async (a: Admin) => {
    const ok = await confirm({
      title: "Remove administrator?",
      message: `${a.full_name} will lose admin access and their account will be deleted.`,
      confirmLabel: "Remove",
      danger: true,
    });
    if (!ok) return;
    try {
      await settingsService.deleteAdmin(a.id);
      toast.success("Administrator removed");
      reload();
    } catch (e: any) {
      toast.error(e.message || "Failed to remove admin");
    }
  };

  const columns: Column<Admin>[] = [
    {
      header: "Administrator",
      cell: (a) => (
        <div className="flex items-center gap-3">
          <Avatar name={a.full_name} />
          <div className="min-w-0">
            <p className="truncate font-medium text-gray-900">
              {a.full_name}
              {a.id === admin?.id && <span className="ml-2 text-xs text-indigo-600">(you)</span>}
            </p>
            <p className="truncate text-xs text-gray-500">{a.email}</p>
          </div>
        </div>
      ),
    },
    { header: "Added", cell: (a) => <span className="text-gray-500">{formatDate(a.created_at)}</span> },
    {
      header: "",
      align: "right",
      width: "56px",
      cell: (a) =>
        a.id === admin?.id ? (
          <span className="text-xs text-gray-300">—</span>
        ) : (
          <Button variant="ghost" size="icon" onClick={() => remove(a)} aria-label="Remove admin">
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        ),
    },
  ];

  return (
    <Card>
      <div className="flex items-center justify-between border-b border-gray-100 p-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Administrators</h2>
          <p className="text-sm text-gray-500">People with full access to this console</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" />Add admin</Button>
      </div>
      <DataTable
        columns={columns}
        rows={data ?? []}
        rowKey={(a) => a.id}
        loading={loading}
        error={error}
        onRetry={reload}
        empty={{ title: "No administrators", icon: <Users className="h-6 w-6" /> }}
      />
      <CreateAdminModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={reload} />
    </Card>
  );
}

function CreateAdminModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    setBusy(true);
    try {
      await settingsService.createAdmin({ full_name: form.full_name.trim(), email: form.email.trim(), password: form.password });
      toast.success("Administrator added");
      setForm({ full_name: "", email: "", password: "" });
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create admin.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add administrator"
      subtitle="Grant another person full admin access"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button form="create-admin-form" type="submit" loading={busy}>Add admin</Button>
        </>
      }
    >
      <form id="create-admin-form" onSubmit={submit} className="space-y-4">
        <Field label="Full name"><Input required value={form.full_name} onChange={(e) => set("full_name", e.target.value)} /></Field>
        <Field label="Email"><Input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>
        <Field label="Temporary password" hint="At least 6 characters.">
          <Input required type="text" value={form.password} onChange={(e) => set("password", e.target.value)} />
        </Field>
        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      </form>
    </Modal>
  );
}

/* --- Security ------------------------------------------------------------- */

function SecuritySection() {
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (pwd.length < 6) return setError("Password must be at least 6 characters.");
    if (pwd !== confirm) return setError("Passwords do not match.");
    setBusy(true);
    try {
      await settingsService.changePassword(pwd);
      toast.success("Password updated");
      setPwd("");
      setConfirm("");
    } catch (err: any) {
      setError(err.message || "Failed to update password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="max-w-2xl p-6">
      <div className="mb-4 flex items-center gap-2">
        <Lock className="h-5 w-5 text-indigo-600" />
        <div>
          <h2 className="text-base font-semibold text-gray-900">Change password</h2>
          <p className="text-sm text-gray-500">Update the password for your admin account</p>
        </div>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <Field label="New password"><Input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} required autoComplete="new-password" /></Field>
        <Field label="Confirm new password"><Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" /></Field>
        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <div className="pt-2"><Button type="submit" loading={busy}>Update password</Button></div>
      </form>
    </Card>
  );
}

/* --- API Keys (placeholder) ----------------------------------------------- */

function ApiKeysSection() {
  const { data, loading } = useAsync(settingsService.getApiKeys, []);
  return (
    <Card className="max-w-2xl p-6">
      <EmptyState
        title="API keys are not available yet"
        description={data?.message || "API key management requires database support that is not part of the current schema."}
        icon={<KeyRound className="h-6 w-6" />}
        action={<Badge tone="amber">Coming soon</Badge>}
      />
    </Card>
  );
}
