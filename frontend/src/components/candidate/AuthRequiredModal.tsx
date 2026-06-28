'use client';

import { useState } from 'react';
import { Briefcase, X } from 'lucide-react';
import { AuthForm, type AuthMode } from '@/shared/auth';

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * AuthRequiredModal — in-context candidate sign up / sign in during the apply
 * flow. Reuses the unified <AuthForm> (same design + backend as the auth
 * gateway); on success it calls back so the apply flow can continue instead of
 * navigating away. Token-only, light + dark.
 */
export default function AuthRequiredModal({ isOpen, onClose, onSuccess }: AuthRequiredModalProps) {
  const [mode, setMode] = useState<AuthMode>('register');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-bg/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-3xl border border-border-brand bg-card p-7 shadow-xl z-10">
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-4 right-4 p-1.5 rounded-full text-muted hover:text-ink hover:bg-surface-2 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <span className="mx-auto w-14 h-14 rounded-2xl bg-grad-brand-soft border border-border-brand flex items-center justify-center text-brand mb-4">
            <Briefcase className="w-7 h-7" />
          </span>
          <h3 className="font-display text-xl font-bold text-ink">
            {mode === 'register' ? 'Postuler à cette offre' : 'Se connecter'}
          </h3>
          <p className="mt-2 text-sm text-muted leading-relaxed">
            Cette offre comprend un <span className="font-semibold text-brand">entretien IA conversationnel</span>.
            Créez votre compte candidat ou connectez-vous pour postuler.
          </p>
        </div>

        <AuthForm role="candidate" mode={mode} onSwitchMode={setMode} onSuccess={onSuccess} />
      </div>
    </div>
  );
}
