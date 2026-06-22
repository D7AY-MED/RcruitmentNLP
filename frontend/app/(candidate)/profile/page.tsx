'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, User } from 'lucide-react';
import { getCurrentCandidate, getToken } from '@/lib/candidateAuth';
import type { Candidate } from '@/lib/candidateAuth';

export default function CandidateProfilePage() {
  const router = useRouter();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/');
      return;
    }

    getCurrentCandidate()
      .then((user) => {
        setCandidate(user);
        setChecking(false);
      })
      .catch(() => {
        router.replace('/');
      });
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-2" />
        Chargement...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f4f4f4' }}>
      <header className="border-b border-gray-200/80 bg-white/90" style={{ backdropFilter: 'blur(16px)' }}>
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <span
            className="text-lg font-bold tracking-tight bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(to right, #2563EB, #60A5FA)' }}
          >
            PooLink
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 sm:py-12">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-950 mb-2">Mon Profil</h1>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Nom</p>
              <p className="text-base font-medium text-gray-900">{candidate?.full_name || '—'}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Email</p>
              <p className="text-base font-medium text-gray-900">{candidate?.email || '—'}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Téléphone</p>
              <p className="text-base font-medium text-gray-900">{candidate?.phone || '—'}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
