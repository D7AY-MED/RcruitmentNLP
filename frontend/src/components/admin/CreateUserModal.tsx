'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authHeader } from '@/lib/adminAuth';

export type UserRole = 'recruiter' | 'candidate';

interface CreateUserModalProps {
  role: UserRole;
  onClose: () => void;
  onCreated: () => void;
}

const inputClass =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

/**
 * Modal form used by the admin to provision a new recruiter or candidate.
 * The visible fields adapt to `role` (recruiter needs a company; candidate
 * requires a phone). Posts to the matching /api/admin/{role}s endpoint.
 */
export default function CreateUserModal({ role, onClose, onCreated }: CreateUserModalProps) {
  const isRecruiter = role === 'recruiter';

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    company_name: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isRecruiter ? '/api/v1/admin/recruiters' : '/api/v1/admin/candidates';
    const payload = isRecruiter
      ? {
          full_name: form.full_name,
          email: form.email,
          password: form.password,
          company_name: form.company_name,
          phone: form.phone || undefined,
        }
      : {
          full_name: form.full_name,
          email: form.email,
          password: form.password,
          phone: form.phone,
        };

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Request failed (${res.status})`);
      }
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Could not create the account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const title = isRecruiter ? 'Create recruiter' : 'Create candidate';
  const subtitle = isRecruiter
    ? 'Provision a new recruiter account.'
    : 'Provision a new candidate account.';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Full name</label>
            <input className={inputClass} value={form.full_name} onChange={update('full_name')} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input type="email" className={inputClass} value={form.email} onChange={update('email')} required />
          </div>

          {isRecruiter && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Company name</label>
              <input className={inputClass} value={form.company_name} onChange={update('company_name')} required />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Phone{' '}
              {isRecruiter ? <span className="text-gray-400">(optional)</span> : null}
            </label>
            <input
              className={inputClass}
              value={form.phone}
              onChange={update('phone')}
              required={!isRecruiter}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              className={inputClass}
              value={form.password}
              onChange={update('password')}
              minLength={6}
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Creating…' : 'Create account'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
