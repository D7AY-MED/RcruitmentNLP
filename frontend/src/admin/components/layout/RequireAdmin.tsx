/**
 * Route guard for admin pages.
 *
 * - No token at all -> redirect to /admin/login immediately.
 * - Token present but still validating -> show a full-screen loader.
 * - Validated admin -> render children.
 * - Validation failed (token rejected) -> redirect to login.
 */
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { hasToken } from "../../services/auth.service";
import { Spinner } from "../ui";

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { admin, loading } = useAdminAuth();
  const location = useLocation();

  if (!hasToken()) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-surface">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-7 w-7" />
          <p className="text-sm text-gray-500 dark:text-muted">Verifying your session…</p>
        </div>
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
