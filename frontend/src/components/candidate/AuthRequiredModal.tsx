'use client';

import React, { useState } from 'react';
import { Briefcase, UserPlus, LogIn, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { registerCandidate, loginCandidate } from '@/lib/candidateAuth';

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type View = 'choice' | 'register' | 'login';

export default function AuthRequiredModal({ isOpen, onClose, onSuccess }: AuthRequiredModalProps) {
  const [view, setView] = useState<View>('choice');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const reset = () => {
    setName('');
    setEmail('');
    setPassword('');
    setPhone('');
    setError('');
    setLoading(false);
    setView('choice');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await registerCandidate({ full_name: name, email, password, phone });
      reset();
      onSuccess?.();
    } catch (err: any) {
      setError(err?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginCandidate(email, password);
      reset();
      onSuccess?.();
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const renderChoice = () => (
    <>
      <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-6 shadow-sm">
        <Briefcase className="w-7 h-7" />
      </div>

      <h3 className="text-xl font-bold text-gray-950 mb-3">
        Entretien IA requis
      </h3>

      <div className="space-y-2 mb-6">
        <p className="text-sm text-gray-600 leading-relaxed px-4">
          Cette offre d'emploi nécessite un <span className="font-semibold text-blue-600">entretien vidéo avec notre IA</span> dans le cadre du processus de recrutement.
        </p>
        <p className="text-[13px] text-gray-400">
          Pour postuler, vous devez d'abord créer un compte ou vous connecter.
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full px-2">
        <Button
          onClick={() => setView('register')}
          className="w-full h-11 text-[14px] font-bold rounded-xl text-white hover:opacity-90 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
          style={{
            background: 'linear-gradient(to right, #2563EB 70%, #60A5FA 130%)',
          }}
        >
          <UserPlus className="w-4 h-4" />
          Créer un compte
        </Button>

        <Button
          onClick={() => setView('login')}
          variant="outline"
          className="w-full h-11 text-[14px] font-bold rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 flex items-center justify-center gap-2"
        >
          <LogIn className="w-4 h-4" />
          J'ai déjà un compte
        </Button>

        <button
          onClick={handleClose}
          className="mt-2 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors py-1"
        >
          Annuler
        </button>
      </div>
    </>
  );

  const renderRegister = () => (
    <>
      <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-6 shadow-sm">
        <UserPlus className="w-7 h-7" />
      </div>

      <h3 className="text-xl font-bold text-gray-950 mb-3">
        Créer un compte
      </h3>

      <form onSubmit={handleRegister} className="w-full px-2 space-y-4">
        <input
          type="text"
          placeholder="Nom complet"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full h-11 px-4 text-sm rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full h-11 px-4 text-sm rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full h-11 px-4 text-sm rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
        />
        <input
          type="tel"
          placeholder="Téléphone (optionnel)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full h-11 px-4 text-sm rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
        />

        {error && <p className="text-xs text-red-500 text-center">{error}</p>}

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 text-[14px] font-bold rounded-xl text-white hover:opacity-90 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
          style={{
            background: 'linear-gradient(to right, #2563EB 70%, #60A5FA 130%)',
          }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          {loading ? 'Création...' : 'Créer mon compte'}
        </Button>

        <button
          type="button"
          onClick={() => { setView('choice'); setError(''); }}
          className="w-full text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors py-1"
        >
          Retour
        </button>
      </form>
    </>
  );

  const renderLogin = () => (
    <>
      <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-6 shadow-sm">
        <LogIn className="w-7 h-7" />
      </div>

      <h3 className="text-xl font-bold text-gray-950 mb-3">
        Se connecter
      </h3>

      <form onSubmit={handleLogin} className="w-full px-2 space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full h-11 px-4 text-sm rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full h-11 px-4 text-sm rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
        />

        {error && <p className="text-xs text-red-500 text-center">{error}</p>}

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 text-[14px] font-bold rounded-xl text-white hover:opacity-90 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
          style={{
            background: 'linear-gradient(to right, #2563EB 70%, #60A5FA 130%)',
          }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
          {loading ? 'Connexion...' : 'Se connecter'}
        </Button>

        <button
          type="button"
          onClick={() => { setView('choice'); setError(''); }}
          className="w-full text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors py-1"
        >
          Retour
        </button>
      </form>
    </>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={handleClose}
      />

      <div className="relative bg-white rounded-3xl max-w-md w-[calc(100%-2rem)] mx-auto p-8 shadow-2xl border border-gray-100 flex flex-col items-center text-center z-10 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-full hover:bg-gray-50"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {view === 'choice' && renderChoice()}
        {view === 'register' && renderRegister()}
        {view === 'login' && renderLogin()}
      </div>
    </div>
  );
}
