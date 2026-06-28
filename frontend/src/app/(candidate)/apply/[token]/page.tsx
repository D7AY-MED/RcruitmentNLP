'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowUp, CheckCircle2, Loader2, AlertTriangle, Lock } from 'lucide-react';
import JobHeroSection from '@/components/candidate/JobHeroSection';
import JobSidebar from '@/components/candidate/JobSidebar';
import AuthRequiredModal from '@/components/candidate/AuthRequiredModal';
import { BrandLogo } from '@/shared/components';
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
      <div className="flex min-h-screen items-center justify-center bg-brand-light/35 dark:bg-bg text-gray-500 dark:text-muted">
        <Loader2 className="w-8 h-8 animate-spin text-brand mr-2" />
        Chargement de l'offre d'emploi...
      </div>
    );
  }

  if (error || !pool) {
    return (
      <div className="min-h-screen bg-brand-light/20 dark:bg-bg flex flex-col relative overflow-hidden">
        {/* Soft atmospheric gradients */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-light/40 rounded-full blur-3xl pointer-events-none" />

        {/* ---------- HEADER ---------- */}
        <header className="w-full z-50 relative py-4">
          <div className="max-w-5xl w-[calc(100%-2rem)] mx-auto px-6 h-16 bg-white dark:bg-card rounded-2xl border border-border-brand shadow-sm flex items-center justify-between">
            <a href="/" className="inline-flex items-center" aria-label="Accueil">
              <BrandLogo className="h-7" />
            </a>
            <a
              href="/offers"
              className="px-4 py-2 text-sm font-bold text-gray-700 dark:text-ink hover:text-brand transition-colors"
            >
              Voir les offres
            </a>
          </div>
        </header>

        {/* ---------- MAIN CONTENT CARD ---------- */}
        <div className="flex-1 flex items-center justify-center p-6 relative z-10">
          <div className="relative bg-white/85 dark:bg-card/85 backdrop-blur-md border border-slate-100 dark:border-border-brand rounded-3xl shadow-2xl p-8 sm:p-12 max-w-lg w-full text-center overflow-hidden transition-all duration-300">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center mx-auto mb-6 shadow-inner animate-pulse">
              <Lock className="w-7 h-7 text-amber-600" aria-hidden="true" />
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-ink tracking-tight mb-3">
              Cette offre n'est plus active
            </h1>
            
            <div className="w-16 h-1 bg-gradient-to-r from-amber-400 to-amber-600 mx-auto rounded-full mb-6" />

            <p className="text-base text-slate-600 dark:text-ink leading-relaxed mb-6 max-w-md mx-auto">
              Le processus de recrutement pour ce poste est désormais finalisé ou suspendu.
            </p>

            <div className="bg-indigo-50/50 dark:bg-brand-light rounded-2xl p-5 border border-indigo-100/50 mb-8 text-left">
              <h4 className="text-sm font-bold text-indigo-900 mb-1">Ne laissez pas cette fermeture vous arrêter !</h4>
              <p className="text-xs text-indigo-700 leading-relaxed">
                Nous avons de nombreuses autres opportunités passionnantes en cours qui correspondent peut-être parfaitement à votre profil. Découvrez dès maintenant nos offres actives et trouvez celle qui propulsera votre carrière.
              </p>
            </div>

            <div className="flex flex-col items-center justify-center">
              <a
                href="/offers"
                className="w-full inline-flex items-center justify-center px-8 h-12 text-sm font-bold text-white bg-brand hover:bg-brand-hover rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all duration-200 gap-2"
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
    <div className="min-h-screen flex flex-col animate-in fade-in duration-300 dark:bg-bg" style={{ background: '#f4f4f4' }}>
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
              <section className="rounded-xl border border-gray-200 dark:border-border-brand bg-white dark:bg-card p-6 sm:p-8 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-ink mb-4">À propos du poste</h2>
                <p className="text-sm text-gray-700 dark:text-ink leading-relaxed whitespace-pre-line">{aboutText}</p>
              </section>
            )}

            {/* Missions */}
            {missionsList.length > 0 && (
              <section className="rounded-xl border border-gray-200 dark:border-border-brand bg-white dark:bg-card p-6 sm:p-8 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-ink mb-4">Missions</h2>
                <ul className="space-y-3">
                  {missionsList.map((m, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-gray-700 dark:text-ink">
                      <span
                        className="w-1.5 h-1.5 rounded-full mt-2 shrink-0 bg-brand"
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
              <section className="rounded-xl border border-gray-200 dark:border-border-brand bg-white dark:bg-card p-6 sm:p-8 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-ink mb-4">Profil recherché</h2>
                <ul className="space-y-3">
                  {profileRequirements.map((p, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-gray-700 dark:text-ink">
                      <CheckCircle2 className="w-4 h-4 text-brand mt-0.5 shrink-0" aria-hidden="true" />
                      <span className="leading-relaxed">{p}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Competency Badges Section */}
            {((pool.required_skills && pool.required_skills.length > 0) ||
              (pool.nice_to_have_skills && pool.nice_to_have_skills.length > 0)) && (
              <section className="rounded-xl border border-gray-200 dark:border-border-brand bg-white dark:bg-card p-6 sm:p-8 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-ink mb-4">Compétences attendues</h2>
                <div className="space-y-4">
                  {pool.required_skills && pool.required_skills.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-muted mb-2">
                        Indispensables (Must-Have)
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {pool.required_skills.map((skill) => (
                          <span
                            key={skill}
                            className="text-xs font-semibold rounded-full border border-brand/20 bg-brand-light px-3 py-1 text-brand"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {pool.nice_to_have_skills && pool.nice_to_have_skills.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-muted mb-2">
                        Recommandées (Nice-to-Have)
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {pool.nice_to_have_skills.map((skill) => (
                          <span
                            key={skill}
                            className="text-xs font-medium rounded-full border border-gray-200 dark:border-border-brand bg-gray-50 dark:bg-surface px-3 py-1 text-gray-700 dark:text-ink"
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
              <h2 className="text-lg font-semibold text-gray-900 dark:text-ink mb-5">Processus de recrutement</h2>
              <ol className="space-y-5">
                {DEFAULT_PROCESS.map(({ step, label }) => (
                  <li key={step} className="flex items-start gap-4">
                    <span
                      className="flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-semibold shrink-0 bg-brand shadow-sm"
                    >
                      {step}
                    </span>
                    <span className="text-sm text-gray-700 dark:text-ink pt-1 leading-relaxed">{label}</span>
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
            isAuthenticated={!!candidate}
          />
        </div>
      </main>

      {/* ---------- FOOTER ---------- */}
      <footer className="border-t border-gray-200/80 dark:border-border-brand bg-white/90 dark:bg-card/80" style={{ backdropFilter: 'blur(16px)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-6 flex-wrap">
              <a href="/" className="inline-flex items-center" aria-label="Accueil">
                <BrandLogo className="h-6" />
              </a>
              <nav className="flex items-center gap-5 text-[0.85rem] font-medium text-gray-700 dark:text-ink">
                <a href="/offers" className="hover:text-brand transition-colors">Offres</a>
                <a href="#" className="hover:text-brand transition-colors">Nous contacter</a>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-border-brand bg-white dark:bg-card px-3 py-2 text-[0.8125rem] font-semibold text-gray-800 dark:text-ink hover:bg-brand-light hover:border-brand/35 hover:text-brand transition-colors"
              >
                Newsletter
              </button>
              <div className="flex items-center gap-1.5">
                <a
                  href="#"
                  aria-label="LinkedIn"
                  className="h-9 w-9 rounded-lg border border-border-brand bg-white dark:bg-card flex items-center justify-center text-gray-500 dark:text-muted text-xs font-semibold hover:bg-brand-light hover:border-brand/35 hover:text-brand transition-colors"
                >
                  in
                </a>
                <button
                  type="button"
                  aria-label="Retour en haut"
                  className="h-9 w-9 rounded-lg border border-border-brand bg-white dark:bg-card flex items-center justify-center text-gray-600 dark:text-ink hover:bg-brand-light hover:border-brand/35 hover:text-brand transition-colors"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  <ArrowUp className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          <div className="h-px bg-border-brand" />

          <div className="flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-3 text-[0.75rem] text-gray-500 dark:text-muted">
            <p>© {new Date().getFullYear()} xQuesty. Tous droits réservés.</p>
            <nav className="flex items-center gap-4">
              <a href="#" className="hover:text-brand transition-colors">Cookies</a>
              <a href="#" className="hover:text-brand transition-colors">Conditions générales</a>
              <a href="#" className="hover:text-brand transition-colors">Mentions légales</a>
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
