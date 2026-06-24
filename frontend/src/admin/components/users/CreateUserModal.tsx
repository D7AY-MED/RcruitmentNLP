/**
 * Create-user modal. Switches required fields by role:
 *   - candidate: full_name, email, phone, password
 *   - recruiter: full_name, email, company_name, phone, password
 */
import React, { useState } from "react";
import { Modal, Button, Field, Input, Select } from "../ui";
import type { UserType } from "../../types";
import * as usersService from "../../services/users.service";
import { toast } from "../../hooks/useToast";

export function CreateUserModal({
  open,
  onClose,
  onCreated,
  defaultRole = "candidate",
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  defaultRole?: UserType;
}) {
  const [role, setRole] = useState<UserType>(defaultRole);
  const [form, setForm] = useState({ full_name: "", email: "", password: "", phone: "", company_name: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const reset = () => {
    setForm({ full_name: "", email: "", password: "", phone: "", company_name: "" });
    setError(null);
    setRole(defaultRole);
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (role === "recruiter" && !form.company_name.trim()) {
      setError("Company name is required for recruiters.");
      return;
    }
    setBusy(true);
    try {
      if (role === "candidate") {
        await usersService.createCandidate({
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          password: form.password,
          phone: form.phone.trim() || undefined,
        });
      } else {
        await usersService.createRecruiter({
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          password: form.password,
          company_name: form.company_name.trim(),
          phone: form.phone.trim() || undefined,
        });
      }
      toast.success(`${role === "candidate" ? "Candidate" : "Recruiter"} created`);
      reset();
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create user.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Create user"
      subtitle="Provision a new candidate or recruiter account"
      footer={
        <>
          <Button variant="outline" onClick={close}>Cancel</Button>
          <Button form="create-user-form" type="submit" loading={busy}>Create user</Button>
        </>
      }
    >
      <form id="create-user-form" onSubmit={submit} className="space-y-4">
        <Field label="Role">
          <Select value={role} onChange={(e) => setRole(e.target.value as UserType)}>
            <option value="candidate">Candidate</option>
            <option value="recruiter">Recruiter</option>
          </Select>
        </Field>

        <Field label="Full name">
          <Input required value={form.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="Jane Doe" />
        </Field>

        <Field label="Email">
          <Input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="jane@example.com" />
        </Field>

        {role === "recruiter" && (
          <Field label="Company name">
            <Input required value={form.company_name} onChange={(e) => set("company_name", e.target.value)} placeholder="Acme Inc." />
          </Field>
        )}

        <Field label={role === "candidate" ? "Phone (optional)" : "Phone (optional)"}>
          <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+1 555 010 0000" />
        </Field>

        <Field label="Temporary password" hint="At least 6 characters. The user can change it later.">
          <Input required type="text" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="••••••••" />
        </Field>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}
      </form>
    </Modal>
  );
}
