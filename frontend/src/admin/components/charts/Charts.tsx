/**
 * Recharts wrappers tuned to the xQuesty look (indigo accent, soft grids).
 *
 * Three reusable charts power the dashboard and reports:
 *   - GrowthAreaChart: candidates vs recruiters signups over time
 *   - StatusDonut:     a labelled donut for categorical breakdowns
 *   - SimpleBarChart:  a vertical bar chart for counts by category
 *
 * Each is wrapped in ResponsiveContainer so it fills its parent card.
 */
import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

const INDIGO = "#4f46e5";
const EMERALD = "#10b981";
const PALETTE = ["#4f46e5", "#10b981", "#f59e0b", "#3b82f6", "#ec4899", "#8b5cf6"];

const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  fontSize: 12,
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
};

export function GrowthAreaChart({
  data,
}: {
  data: { month: string; candidates: number; recruiters: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="gradCandidates" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={INDIGO} stopOpacity={0.3} />
            <stop offset="95%" stopColor={INDIGO} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradRecruiters" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={EMERALD} stopOpacity={0.3} />
            <stop offset="95%" stopColor={EMERALD} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        <Area type="monotone" dataKey="candidates" name="Candidates" stroke={INDIGO} strokeWidth={2} fill="url(#gradCandidates)" />
        <Area type="monotone" dataKey="recruiters" name="Recruiters" stroke={EMERALD} strokeWidth={2} fill="url(#gradRecruiters)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function StatusDonut({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) {
    return <div className="flex h-[220px] items-center justify-center text-sm text-gray-400">No data yet</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={2}
          stroke="none"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function SimpleBarChart({ data, color = INDIGO }: { data: { name: string; value: number }[]; color?: string }) {
  if (!data.length) {
    return <div className="flex h-[220px] items-center justify-center text-sm text-gray-400">No data yet</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} interval={0} />
        <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f8fafc" }} />
        <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  );
}
