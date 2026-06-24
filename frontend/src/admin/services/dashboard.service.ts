/** Dashboard data service. */
import { http } from "./client";
import type { AdminStats, DashboardCharts, ActivityItem } from "../types";

export const getStats = () => http.get<AdminStats>("/api/v1/admin/dashboard/stats");
export const getCharts = () => http.get<DashboardCharts>("/api/v1/admin/dashboard/charts");
export const getActivity = () => http.get<ActivityItem[]>("/api/v1/admin/dashboard/activity");
