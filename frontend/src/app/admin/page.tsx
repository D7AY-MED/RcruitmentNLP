'use client';

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Users, Layers, Activity, ArrowRight } from 'lucide-react';
import { authHeader } from '@/lib/adminAuth';

interface Stats {
  recruiters: number;
  candidates: number;
  pools: number;
  activePools: number;
}

const CARDS = [
  { key: 'recruiters', label: 'Recruiters', icon: Briefcase, href: '/admin/recruiters' },
  { key: 'candidates', label: 'Candidates', icon: Users, href: '/admin/candidates' },
  { key: 'pools', label: 'Job Pools', icon: Layers, href: null },
  { key: 'activePools', label: 'Active Pools', icon: Activity, href: null },
] as const;

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/admin/stats`, { headers: { ...authHeader() } });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.detail || `Request failed (${res.status})`);
        }
        setStats(await res.json());
      } catch (err: any) {
        setError(err.message || 'Could not load stats.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <>
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500">Platform overview and user management.</p>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {CARDS.map((card) => {
            const Icon = card.icon;
            const value = stats ? stats[card.key] : null;
            return (
              <div
                key={card.key}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <Icon className="h-5 w-5" />
                  </span>
                  {card.href && (
                    <Link
                      to={card.href}
                      className="text-gray-400 hover:text-indigo-600 transition-colors"
                      title={`Manage ${card.label.toLowerCase()}`}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">
                    {loading ? '—' : value ?? 0}
                  </p>
                  <p className="text-sm text-gray-500">{card.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Manage recruiters</h2>
            <p className="text-sm text-gray-500 mb-4">
              Create recruiter accounts, review the roster, and remove access.
            </p>
            <Link
              to="/admin/recruiters"
              className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
            >
              Open recruiters <ArrowRight className="h-4 w-4" />
            </Link>
          </section>

          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Manage candidates</h2>
            <p className="text-sm text-gray-500 mb-4">
              Create candidate accounts, review the roster, and remove access.
            </p>
            <Link
              to="/admin/candidates"
              className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
            >
              Open candidates <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        </div>
      </main>
    </>
  );
}
