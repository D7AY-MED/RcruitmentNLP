'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Briefcase, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getToken } from '@/lib/recruiterAuth';

/**
 * Public landing page (route: /).
 * Anyone can see it. The recruiter dashboard lives at /dashboard and is gated
 * by RequireRecruiter, so the CTAs here adapt to whether a session exists.
 */
export default function LandingPage() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(Boolean(getToken()));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-indigo-50">
      {/* Top bar */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <span className="text-xl font-bold tracking-tight text-gray-900">xQuesty</span>
        <nav className="flex items-center gap-3">
          {loggedIn ? (
            <Link href="/dashboard">
              <Button size="sm">Go to dashboard</Button>
            </Link>
          ) : (
            <>
              <Link
                href="/recruiter/login"
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Sign in
              </Link>
              <Link href="/recruiter/register">
                <Button size="sm">Get started</Button>
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        <section className="flex flex-col items-center py-20 text-center sm:py-28">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-medium text-indigo-700">
            <Sparkles className="h-3.5 w-3.5" />
            AI-powered recruitment
          </span>
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            Find the right candidates, faster.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-gray-600">
            Describe the role in plain language and let xQuesty surface pre-qualified,
            intelligently ranked candidates — then manage everything from one dashboard.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            {loggedIn ? (
              <Link href="/dashboard">
                <Button size="lg">Open dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/recruiter/register">
                  <Button size="lg">Create recruiter account</Button>
                </Link>
                <Link href="/recruiter/login">
                  <Button size="lg" variant="outline">
                    Sign in
                  </Button>
                </Link>
              </>
            )}
          </div>
        </section>

        {/* Feature row */}
        <section className="grid gap-6 pb-24 sm:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50">
              <Search className="h-5 w-5 text-indigo-600" />
            </div>
            <h3 className="mb-1 text-lg font-semibold text-gray-900">Talent Matcher</h3>
            <p className="text-sm text-gray-600">
              Natural-language search that ranks candidates by how well they fit your role.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50">
              <Briefcase className="h-5 w-5 text-indigo-600" />
            </div>
            <h3 className="mb-1 text-lg font-semibold text-gray-900">Job Pools</h3>
            <p className="text-sm text-gray-600">
              Create shareable application links and collect pre-screened applicants in one place.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-5 text-center text-sm text-gray-500 sm:px-6">
          xQuesty — AI-powered recruitment
        </div>
      </footer>
    </div>
  );
}
