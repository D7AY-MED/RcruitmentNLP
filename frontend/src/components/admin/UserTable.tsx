'use client';

import { Trash2 } from 'lucide-react';
import { formatDate, initials } from '@/lib/utils';

export interface UserRow {
  id: string;
  full_name?: string;
  email?: string;
  phone?: string | null;
  company_name?: string | null;
  created_at?: string;
}

interface UserTableProps {
  users: UserRow[];
  /** Extra column header shown after Email (e.g. "Company" or "Phone"). */
  extraColumn: { label: string; value: (u: UserRow) => string };
  loading?: boolean;
  emptyLabel?: string;
  deletingId?: string | null;
  onDelete?: (user: UserRow) => void;
}

/**
 * Reusable user listing table for the admin area (recruiters & candidates).
 * Matches the card/border styling used across the dashboard.
 */
export default function UserTable({
  users,
  extraColumn,
  loading = false,
  emptyLabel = 'No users yet.',
  deletingId = null,
  onDelete,
}: UserTableProps) {
  if (loading) {
    return <div className="p-6 text-sm text-gray-500">Loading…</div>;
  }

  if (users.length === 0) {
    return <div className="p-6 text-sm text-gray-500">{emptyLabel}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">{extraColumn.label}</th>
            <th className="px-4 py-3 font-medium">Joined</th>
            {onDelete && <th className="px-4 py-3 text-right font-medium">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                    {initials(u.full_name || u.email || '?')}
                  </span>
                  <span className="font-medium text-gray-900">{u.full_name || '—'}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-gray-600">{u.email || '—'}</td>
              <td className="px-4 py-3 text-gray-600">{extraColumn.value(u) || '—'}</td>
              <td className="px-4 py-3 text-gray-500">
                {u.created_at ? formatDate(u.created_at) : '—'}
              </td>
              {onDelete && (
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => onDelete(u)}
                    disabled={deletingId === u.id}
                    className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    title="Delete user"
                  >
                    <Trash2 className="h-4 w-4" />
                    {deletingId === u.id ? 'Deleting…' : 'Delete'}
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
