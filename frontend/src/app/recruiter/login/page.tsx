'use client';

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { loginRecruiter } from '@/lib/recruiterAuth';

/**
 * Recruiter login page.
 * On success: JWT is stored in localStorage and the user is sent to the dashboard.
 */
export default function RecruiterLoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginRecruiter(email, password);
      navigate('/dashboard'); // recruiter dashboard
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-border-brand px-3 py-2 text-sm bg-white dark:bg-surface text-ink focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand';

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-light dark:bg-bg px-4">
      <div className="w-full max-w-md rounded-2xl border border-border-brand bg-white dark:bg-card p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-bold text-ink">Recruiter sign in</h1>
        <p className="mb-6 text-sm text-gray-500 dark:text-muted">Welcome back.</p>

        {/* Simple error message */}
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Email</label>
            <input
              type="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Password</label>
            <input
              type="password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full bg-brand hover:bg-brand-hover text-white rounded-xl" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-ink">
          Don&apos;t have an account?{' '}
          <Link to="/recruiter/register" className="font-semibold text-brand hover:text-brand-hover hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
