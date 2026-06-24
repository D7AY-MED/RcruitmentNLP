'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowUp, CheckCircle2, Loader2, AlertTriangle, Lock } from 'lucide-react';
import JobHeroSection from '@/components/candidate/JobHeroSection';
import JobSidebar from '@/components/candidate/JobSidebar';
import AuthRequiredModal from '@/components/candidate/AuthRequiredModal';
import { getPublicJobPool } from '@/lib/jobPoolService';
import { getPublicPool as getPublicPoolMock } from '@/lib/frontendData';
import { getToken, getCurrentCandidate } from '@/lib/candidateAuth';
import type { Candidate } from '@/lib/candidateAuth';
import { JobPool } from '@/lib/types';

const DEFAULT_PROCESS = [
  { step: "1", label: "Dépôt de CV & Analyse IA : Téléversez votre CV pour une extraction automatique de vos compétences et de votre expérience." },
  { step: "2", label: "Entretien virtuel interactif : Répondez en ligne aux questions posées par notre assistant IA adaptées à votre profil et à l'offre." },
  { step: "3", label: "Évaluation & Matching : Les recruteurs étudient votre score de compatibilité et vos réponses pour le processus final de sélection." },
];

export default function CandidateApplyDynamicPage() {
  const params = useParams();
  const token = params.token as string;

  const [pool, setPool] = useState<JobPool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const t = getToken();
    if (!t) { setAuthChecked(true); return; }
    getCurrentCandidate()
      .then(setCandidate)
      .catch(() => {})
      .finally(() => setAuthChecked(true));
  }, []);

  const handleApply = useCallback(() => {
    if (candidate) {
      navigate(`/apply/interview/${token}`);
    } else {
      setShowAuthModal(true);
    }
  }, [candidate, token, navigate]);

  const handleProfile = useCallback(() => {
    navigate('/candidate/profile');
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const currentPool = await getPublicJobPool(token);
        if (cancelled) return;
        if (!currentPool) {
          setError({
            title: 'Offre introuvable',
            message: "Ce lien de candidature est invalide ou l'offre a été retirée.",
          });
        } else {
          setPool(currentPool);
        }
      } catch (err) {
        if (cancelled) return;
        // Fallback to mock data for demo purposes
        const mockPool = getPublicPoolMock(token);
        if (!mockPool) {
          setError({
            title: 'Offre introuvable',
            message: "Ce lien de candidature est invalide ou l'offre a été retirée.",
          });
        } else {
          setPool(mockPool);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-2" />
        Chargement de l'offre d'emploi...
      </div>
    );
  }

  if (error || !pool) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">
        {/* Soft atmospheric gradients */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-200/20 rounded-full blur-3xl pointer-events-none" />

        {/* ---------- HEADER ---------- */}
        <header className="w-full z-50 relative py-4">
          <div className="max-w-5xl w-[calc(100%-2rem)] mx-auto px-6 h-16 bg-white rounded-2xl border border-gray-150 shadow-sm flex items-center justify-between">
            {/* Logo */}
            <a href="/" className="text-xl font-bold tracking-tight" aria-label="PooLink home">
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: 'linear-gradient(to right, #2563EB, #60A5FA)',
                }}
              >
                PooLink
              </span>
            </a>
            
            {/* Nav Links */}
            <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-600">
              <a href="/offers" className="text-blue-600 transition-colors">
                Emplois
              </a>
              <a href="/recruiter/login" className="hover:text-blue-600 transition-colors">
                Recruteur
              </a>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <a
                href="/recruiter/login"
                className="px-4 py-2 text-sm font-bold text-gray-700 hover:text-blue-600 transition-colors"
              >
                Connexion
              </a>
            </div>
          </div>
        </header>

        {/* ---------- MAIN CONTENT CARD ---------- */}
        <div className="flex-1 flex items-center justify-center p-6 relative z-10">
          <div className="relative bg-white/85 backdrop-blur-md border border-slate-100 rounded-3xl shadow-2xl p-8 sm:p-12 max-w-lg w-full text-center overflow-hidden transition-all duration-300">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center mx-auto mb-6 shadow-inner animate-pulse">
              <Lock className="w-7 h-7 text-amber-600" aria-hidden="true" />
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
              Cette offre n'est plus active
            </h1>
            
            <div className="w-16 h-1 bg-gradient-to-r from-amber-400 to-amber-600 mx-auto rounded-full mb-6" />

            <p className="text-base text-slate-600 leading-relaxed mb-6 max-w-md mx-auto">
              Le processus de recrutement pour ce poste est désormais finalisé ou suspendu.
            </p>

            <div className="bg-indigo-50/50 rounded-2xl p-5 border border-indigo-100/50 mb-8 text-left">
              <h4 className="text-sm font-bold text-indigo-900 mb-1">Ne laissez pas cette fermeture vous arrêter !</h4>
              <p className="text-xs text-indigo-700 leading-relaxed">
                Nous avons de nombreuses autres opportunités passionnantes en cours qui correspondent peut-être parfaitement à votre profil. Découvrez dès maintenant nos offres actives et trouvez celle qui propulsera votre carrière.
              </p>
            </div>

            <div className="flex flex-col items-center justify-center">
              <a
                href="/offers"
                className="w-full inline-flex items-center justify-center px-8 h-12 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all duration-200 gap-2"
              >
                Découvrir nos offres d'emploi
                <span className="text-base">→</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Derive structured data for sections
  const aboutText = pool.description || pool.main_mission || "";
  
  const missionsList =
    pool.responsibilities && pool.responsibilities.length > 0
      ? pool.responsibilities
      : [];

  // Build Profile requirements dynamically
  const profileRequirements = [];
  if (pool.education_level) {
    profileRequirements.push(`Diplôme requis : ${pool.education_level}.`);
  }

  if (pool.experience_level) {
    profileRequirements.push(`Expérience professionnelle requise : ${pool.experience_level}.`);
  }

  if (pool.language) {
    profileRequirements.push(`Maîtrise linguistique requise : ${pool.language}.`);
  }

  if (pool.required_skills && pool.required_skills.length > 0) {
    profileRequirements.push(`Compétences clés indispensables : ${pool.required_skills.join(', ')}.`);
  }

  if (pool.soft_skills && pool.soft_skills.length > 0) {
    profileRequirements.push(`Qualités recherchées : ${pool.soft_skills.join(', ')}.`);
  }

  if (pool.deal_breakers && pool.deal_breakers.length > 0) {
    pool.deal_breakers.forEach((db) => {
      profileRequirements.push(`Critère d'exclusion : ${db}.`);
    });
  }

  return (
    <div className="min-h-screen flex flex-col animate-in fade-in duration-300" style={{ background: '#f4f4f4' }}>
      {/* ---------- HERO (Includes Floating Header inside same Grid Background) ---------- */}
      <JobHeroSection
        title={pool.title}
        companyName={pool.company_name || 'Entreprise Confidentielle'}
        location={pool.location || undefined}
        contractType={pool.contract_type || undefined}
        salaryRange={pool.salary_range || undefined}
        experienceLevel={pool.experience_level || undefined}
        languages={pool.language || undefined}
        educationLevel={pool.education_level || undefined}
        isAuthenticated={!!candidate}
        candidateName={candidate?.full_name}
        candidateEmail={candidate?.email}
        onProfile={handleProfile}
        onConnexion={() => setShowAuthModal(true)}
      />

      {/* ---------- MAIN CONTENT (two columns) ---------- */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="grid md:grid-cols-3 gap-8">
          {/* LEFT COLUMN (2/3) — Job Description */}
          <div className="md:col-span-2 space-y-8">
            {/* About the role */}
            {aboutText && (
              <section className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">À propos du poste</h2>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{aboutText}</p>
              </section>
            )}

            {/* Missions */}
            {missionsList.length > 0 && (
              <section className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Missions</h2>
                <ul className="space-y-3">
                  {missionsList.map((m, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-gray-700">
                      <span
                        className="w-1.5 h-1.5 rounded-full mt-2 shrink-0 bg-blue-600"
                        aria-hidden="true"
                      />
                      <span className="leading-relaxed">{m}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Required profile */}
            {profileRequirements.length > 0 && (
              <section className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Profil recherché</h2>
                <ul className="space-y-3">
                  {profileRequirements.map((p, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" aria-hidden="true" />
                      <span className="leading-relaxed">{p}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Competency Badges Section */}
            {((pool.required_skills && pool.required_skills.length > 0) ||
              (pool.nice_to_have_skills && pool.nice_to_have_skills.length > 0)) && (
              <section className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Compétences attendues</h2>
                <div className="space-y-4">
                  {pool.required_skills && pool.required_skills.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                        Indispensables (Must-Have)
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {pool.required_skills.map((skill) => (
                          <span
                            key={skill}
                            className="text-xs font-semibold rounded-full border border-blue-100 bg-blue-50/50 px-3 py-1 text-blue-700"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {pool.nice_to_have_skills && pool.nice_to_have_skills.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                        Recommandées (Nice-to-Have)
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {pool.nice_to_have_skills.map((skill) => (
                          <span
                            key={skill}
                            className="text-xs font-medium rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-gray-700"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Recruitment process */}
            <section className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-5">Processus de recrutement</h2>
              <ol className="space-y-5">
                {DEFAULT_PROCESS.map(({ step, label }) => (
                  <li key={step} className="flex items-start gap-4">
                    <span
                      className="flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-semibold shrink-0"
                      style={{
                        background: 'linear-gradient(to right, #2563EB 70%, #60A5FA 130%)',
                      }}
                    >
                      {step}
                    </span>
                    <span className="text-sm text-gray-700 pt-1 leading-relaxed">{label}</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          {/* RIGHT COLUMN (1/3) — Sidebar */}
          <JobSidebar
            companyName={pool.company_name || 'Entreprise Confidentielle'}
            location={pool.location || undefined}
            companySector="Conseil & Audit"
            contractType={pool.contract_type || undefined}
            experienceLevel={pool.experience_level || undefined}
            educationLevel={pool.education_level || undefined}
            onApply={handleApply}
          />
        </div>
      </main>

      {/* ---------- FOOTER ---------- */}
      <footer className="border-t border-gray-200/80 bg-white/90" style={{ backdropFilter: 'blur(16px)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-6 flex-wrap">
              <a href="/" className="text-xl font-bold tracking-tight" aria-label="PooLink home">
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage: 'linear-gradient(to right, #2563EB, #60A5FA)',
                  }}
                >
                  PooLink
                </span>
              </a>
              <nav className="flex items-center gap-5 text-[0.85rem] font-medium text-gray-700">
                <a href="#" className="hover:text-blue-600 transition-colors">Offres</a>
                <a href="#" className="hover:text-blue-600 transition-colors">Entreprises</a>
                <a href="#" className="hover:text-blue-600 transition-colors">Nous contacter</a>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-[0.8125rem] font-semibold text-gray-800 hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                Newsletter
              </button>
              <div className="flex items-center gap-1.5">
                <a
                  href="#"
                  aria-label="LinkedIn"
                  className="h-9 w-9 rounded-lg border border-black/10 bg-white flex items-center justify-center text-gray-500 text-xs font-semibold hover:bg-blue-50 hover:border-blue-200 transition-colors"
                >
                  in
                </a>
                <button
                  type="button"
                  aria-label="Retour en haut"
                  className="h-9 w-9 rounded-lg border border-black/10 bg-white flex items-center justify-center text-gray-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  <ArrowUp className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-200/70" />

          <div className="flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-3 text-[0.75rem] text-gray-500">
            <p>© {new Date().getFullYear()} PooLink. Tous droits réservés.</p>
            <nav className="flex items-center gap-4">
              <a href="#" className="hover:text-blue-600 transition-colors">Cookies</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Conditions générales</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Mentions légales</a>
            </nav>
          </div>
        </div>
      </footer>

      {/* ---------- AUTH REQUIRED MODAL ---------- */}
      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => navigate(`/apply/interview/${token}`)}
      />
    </div>
  );
}
