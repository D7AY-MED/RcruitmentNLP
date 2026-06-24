/**
 * Admin authentication context.
 *
 * Holds the currently signed-in admin and exposes login/logout/refresh. The
 * provider validates an existing token on mount (so a page refresh keeps the
 * session) and is consumed by RequireAdmin, the Topbar profile menu and the
 * login page.
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { Admin } from "../types";
import * as authService from "../services/auth.service";
import { isAuthError } from "../services/client";

interface AdminAuthValue {
  admin: Admin | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<Admin>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setAdmin: (admin: Admin) => void;
}

const AdminAuthContext = createContext<AdminAuthValue | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!authService.hasToken()) {
      setAdmin(null);
      setLoading(false);
      return;
    }
    try {
      const me = await authService.getCurrentAdmin();
      setAdmin(me);
    } catch (err) {
      // Only drop the session on a real auth failure; keep it on transient
      // network errors so a flaky connection doesn't log the admin out.
      if (isAuthError(err)) setAdmin(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const me = await authService.login(email, password);
    setAdmin(me);
    return me;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setAdmin(null);
  }, []);

  return (
    <AdminAuthContext.Provider value={{ admin, loading, login, logout, refresh, setAdmin }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  return ctx;
}
