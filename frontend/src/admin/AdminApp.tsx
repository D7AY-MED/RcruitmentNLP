/**
 * Admin module entry point.
 *
 * Mounted by the root router at "/admin/*". Owns:
 *   - the admin auth context (AdminAuthProvider)
 *   - the confirm-dialog provider (imperative confirmations)
 *   - a react-hot-toast <Toaster/> scoped to the admin area
 *   - the admin route table (login is public; everything else is guarded by
 *     RequireAdmin and rendered inside AdminLayout)
 *
 * All routes are relative to "/admin" because the parent route uses a splat.
 */
import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { AdminAuthProvider } from "./context/AdminAuthContext";
import { ConfirmProvider, Spinner } from "./components/ui";
import { RequireAdmin } from "./components/layout/RequireAdmin";
import { AdminLayout } from "./components/layout/AdminLayout";

// Login stays eager (it is the first paint for unauthenticated users). The
// authenticated pages are code-split so the initial admin bundle is smaller and
// each page's JS loads only when first visited.
import { LoginPage } from "./pages/LoginPage";
const DashboardPage = lazy(() => import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const UsersPage = lazy(() => import("./pages/UsersPage").then((m) => ({ default: m.UsersPage })));
const CompaniesPage = lazy(() => import("./pages/CompaniesPage").then((m) => ({ default: m.CompaniesPage })));
const JobsPage = lazy(() => import("./pages/JobsPage").then((m) => ({ default: m.JobsPage })));
const ApplicationsPage = lazy(() => import("./pages/ApplicationsPage").then((m) => ({ default: m.ApplicationsPage })));
const ReportsPage = lazy(() => import("./pages/ReportsPage").then((m) => ({ default: m.ReportsPage })));
const SettingsPage = lazy(() => import("./pages/SettingsPage").then((m) => ({ default: m.SettingsPage })));

function RouteFallback() {
  return (
    <div className="flex items-center justify-center py-24">
      <Spinner className="h-6 w-6" />
    </div>
  );
}

export default function AdminApp() {
  return (
    <AdminAuthProvider>
      <ConfirmProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: { borderRadius: "10px", fontSize: "14px" },
            success: { iconTheme: { primary: "#4f46e5", secondary: "#fff" } },
          }}
        />
        <Routes>
          {/* Public */}
          <Route path="login" element={<LoginPage />} />

          {/* Guarded shell */}
          <Route
            element={
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            }
          >
            <Route index element={<Suspense fallback={<RouteFallback />}><DashboardPage /></Suspense>} />
            <Route path="users" element={<Suspense fallback={<RouteFallback />}><UsersPage /></Suspense>} />
            <Route path="companies" element={<Suspense fallback={<RouteFallback />}><CompaniesPage /></Suspense>} />
            <Route path="jobs" element={<Suspense fallback={<RouteFallback />}><JobsPage /></Suspense>} />
            <Route path="applications" element={<Suspense fallback={<RouteFallback />}><ApplicationsPage /></Suspense>} />
            <Route path="reports" element={<Suspense fallback={<RouteFallback />}><ReportsPage /></Suspense>} />
            <Route path="settings" element={<Suspense fallback={<RouteFallback />}><SettingsPage /></Suspense>} />
            <Route path="settings/:section" element={<Suspense fallback={<RouteFallback />}><SettingsPage /></Suspense>} />
          </Route>

          {/* Unknown admin path -> dashboard */}
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </ConfirmProvider>
    </AdminAuthProvider>
  );
}
