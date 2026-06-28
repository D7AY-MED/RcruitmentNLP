/**
 * Admin login page (public route).
 *
 * On success the AdminAuthContext is populated and we redirect to the dashboard
 * (or the page the user was originally heading to). Already-authenticated admins
 * visiting /admin/login are bounced straight to the dashboard.
 */
import React, { useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { ShieldCheck, Loader2 } from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";
import { Button, Field, Input, Label } from "../components/ui";
import { hasToken } from "../services/auth.service";

export function LoginPage() {
  const { admin, login } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as any)?.from || "/admin";

  // If a valid session already exists, don't show the form.
  if (admin && hasToken()) return <Navigate to={from} replace />;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || "Login failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-white to-indigo-50/40 px-4 dark:bg-none dark:bg-bg">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-600/20">
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-ink">PooLink Admin</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-muted">Sign in to the administration console</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-border-brand dark:bg-card">
          <form onSubmit={onSubmit} className="space-y-5">
            <Field label="Email" htmlFor="email">
              <Input
                id="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@poolink.com"
              />
            </Field>
            <Field label="Password" htmlFor="password">
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </Field>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" loading={submitting}>
              {!submitting && <ShieldCheck className="h-4 w-4" />}
              Sign in
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400 dark:text-muted">
          Protected area · PooLink Recruitment Platform
        </p>
      </div>
    </div>
  );
}
