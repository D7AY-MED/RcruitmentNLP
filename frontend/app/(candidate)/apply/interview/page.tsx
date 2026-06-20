'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { getCurrentCandidate } from '@/lib/candidateAuth';

export default function InterviewPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    getCurrentCandidate()
      .then(() => setChecking(false))
      .catch(() => router.replace('/'));
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-2" />
        Vérification...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">
        Demo Interview Page
      </h1>
    </div>
  );
}
