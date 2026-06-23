'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { authHeader } from '@/lib/adminAuth';
import UserTable, { UserRow } from '@/components/admin/UserTable';
import CreateUserModal from '@/components/admin/CreateUserModal';

export default function AdminRecruitersPage() {
  const [recruiters, setRecruiters] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/admin/recruiters`, { headers: { ...authHeader() } });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Request failed (${res.status})`);
      }
      setRecruiters(await res.json());
    } catch (err: any) {
      setError(err.message || 'Could not load recruiters.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (user: UserRow) => {
    if (!window.confirm(`Delete recruiter "${user.full_name || user.email}"? This cannot be undone.`)) {
      return;
    }
    setDeletingId(user.id);
    setError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/admin/recruiters/${user.id}`, {
        method: 'DELETE',
        headers: { ...authHeader() },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Request failed (${res.status})`);
      }
      setRecruiters((prev) => prev.filter((r) => r.id !== user.id));
    } catch (err: any) {
      setError(err.message || 'Could not delete recruiter.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Recruiters</h1>
            <p className="text-sm text-gray-500">{recruiters.length} total</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" /> New recruiter
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <UserTable
            users={recruiters}
            loading={loading}
            emptyLabel="No recruiters yet. Create the first one."
            extraColumn={{ label: 'Company', value: (u) => u.company_name || '' }}
            deletingId={deletingId}
            onDelete={handleDelete}
          />
        </div>
      </main>

      {showModal && (
        <CreateUserModal role="recruiter" onClose={() => setShowModal(false)} onCreated={load} />
      )}
    </>
  );
}
