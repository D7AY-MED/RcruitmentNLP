'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, UserPlus, LogIn, X, Mail, Lock, User, Phone, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { registerCandidate, loginCandidate } from '@/lib/candidateAuth';

type AuthView = 'choose' | 'login' | 'register';

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  token?: string;
}

export default function AuthRequiredModal({ isOpen, onClose, token }: AuthRequiredModalProps) {
  const router = useRouter();
  const [view, setView] = useState<AuthView>('choose');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setPhone('');
    setShowPassword(false);
    setError('');
    setLoading(false);
    setView('choose');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await registerCandidate({ full_name: fullName, email, password, phone });
      router.push(token ? `/apply/interview/${token}` : '/apply/interview');
    } catch (err: any) {
      setError(err.message || 'Inscription échouée. Veuillez réessayer.');
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginCandidate(email, password);
      router.push(token ? `/apply/interview/${token}` : '/apply/interview');
    } catch (err: any) {
      setError(err.message || 'Email ou mot de passe incorrect.');
      setLoading(false);
    }
  };

  const switchToLogin = () => {
    setError('');
    setView('login');
  };

  const switchToRegister = () => {
    setError('');
    setView('register');
  };

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

        {view === 'choose' && (
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
                onClick={switchToRegister}
                className="w-full h-11 text-[14px] font-bold rounded-xl text-white hover:opacity-90 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(to right, #2563EB 70%, #60A5FA 130%)',
                }}
              >
                <UserPlus className="w-4 h-4" />
                Créer un compte
              </Button>

              <Button
                onClick={switchToLogin}
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
        )}

        {view === 'login' && (
          <>
            <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-6 shadow-sm">
              <LogIn className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold text-gray-950 mb-1">
              Connexion
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Connectez-vous pour postuler à cette offre.
            </p>

            {error && (
              <div className="w-full mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 text-left">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="w-full space-y-4 px-2">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                  className="w-full h-11 pl-10 pr-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mot de passe"
                  required
                  className="w-full h-11 pl-10 pr-10 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 text-[14px] font-bold rounded-xl text-white hover:opacity-90 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(to right, #2563EB 70%, #60A5FA 130%)',
                }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                {loading ? 'Connexion...' : 'Se connecter'}
              </Button>
            </form>

            <p className="mt-5 text-sm text-gray-500">
              Pas encore de compte ?{' '}
              <button onClick={switchToRegister} className="font-semibold text-blue-600 hover:text-blue-700">
                Créer un compte
              </button>
            </p>
          </>
        )}

        {view === 'register' && (
          <>
            <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-6 shadow-sm">
              <UserPlus className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold text-gray-950 mb-1">
              Créer un compte
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Inscrivez-vous pour postuler en quelques clics.
            </p>

            {error && (
              <div className="w-full mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 text-left">
                {error}
              </div>
            )}

            <form onSubmit={handleSignup} className="w-full space-y-4 px-2">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nom complet"
                  required
                  className="w-full h-11 pl-10 pr-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                  className="w-full h-11 pl-10 pr-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>

              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Téléphone"
                  required
                  className="w-full h-11 pl-10 pr-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mot de passe (min. 6 caractères)"
                  required
                  minLength={6}
                  className="w-full h-11 pl-10 pr-10 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 text-[14px] font-bold rounded-xl text-white hover:opacity-90 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(to right, #2563EB 70%, #60A5FA 130%)',
                }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                {loading ? 'Inscription...' : 'Créer un compte'}
              </Button>
            </form>

            <p className="mt-5 text-sm text-gray-500">
              Déjà un compte ?{' '}
              <button onClick={switchToLogin} className="font-semibold text-blue-600 hover:text-blue-700">
                Se connecter
              </button>
            </p>
          </>
        )}

      </div>
    </div>
  );
}
