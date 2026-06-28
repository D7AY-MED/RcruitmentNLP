'use client';

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { registerRecruiter } from '@/lib/recruiterAuth';

/**
 * Recruiter registration page.
 * On success: JWT is stored in localStorage and the user is sent to the dashboard.
 */
export default function RecruiterRegisterPage() {
  const navigate = useNavigate();

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
    try {
      await registerRecruiter({
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        company_name: form.company_name,
        phone: form.phone || undefined, // phone is optional
      });
      navigate('/dashboard'); // recruiter dashboard
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-border-brand px-3 py-2 text-sm bg-white dark:bg-surface text-ink focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand';

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-light dark:bg-bg px-4">
      <div className="w-full max-w-md rounded-2xl border border-border-brand bg-white dark:bg-card p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-bold text-ink">Create recruiter account</h1>
        <p className="mb-6 text-sm text-gray-500 dark:text-muted">Start finding the right candidates.</p>

        {/* Simple error message */}
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Full name</label>
            <input className={inputClass} value={form.full_name} onChange={update('full_name')} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Email</label>
            <input type="email" className={inputClass} value={form.email} onChange={update('email')} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Company name</label>
            <input className={inputClass} value={form.company_name} onChange={update('company_name')} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Phone <span className="text-gray-400 dark:text-muted">(optional)</span>
            </label>
            <input className={inputClass} value={form.phone} onChange={update('phone')} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Password</label>
            <input
              type="password"
              className={inputClass}
              value={form.password}
              onChange={update('password')}
              minLength={6}
              required
            />
          </div>

          <Button type="submit" className="w-full bg-brand hover:bg-brand-hover text-white rounded-xl" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-ink">
          Already have an account?{' '}
          <Link to="/recruiter/login" className="font-semibold text-brand hover:text-brand-hover hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
