'use client';

import React, { useState } from 'react';
import { ArrowUp, CheckCircle2 } from 'lucide-react';
import JobHeroSection from '@/components/candidate/JobHeroSection';
import JobSidebar from '@/components/candidate/JobSidebar';
import AuthRequiredModal from '@/components/candidate/AuthRequiredModal';

/**
 * Candidate /apply page — DEMO ONLY.
 *
 * Mirrors the recruiter-generated link destination. Static mock content, no
 * network call. Not yet wired to a real pool token.
 *
 * Design: matches the Jobzyn job detail page layout (hero + two-column body
 * + polished footer). Uses PooLink blue gradient accent.
 */

/* ------------------------------------------------------------------ */
/*  Static mock data (Sr Consultant Transaction Services — PooLink)   */
/* ------------------------------------------------------------------ */

const MOCK_OFFER = {
  title: "Sr Consultant Transaction Services",
  companyName: "PooLink Confidential",
  location: "Casablanca",
  contractType: "CDI",
  salaryRange: "18 000 – 25 000 DHs",
  experienceLevel: "3 – 5 ans",
  languages: "Français",
  educationLevel: "BAC +5",
  companyDescription:
    "Cabinet international de conseil et d'audit de premier plan, offrant des services de Transaction Services, Due Diligence et Advisory à une clientèle variée au Maroc et en Afrique.",
};

const ABOUT = `Dans un cabinet international, vous contribuerez à des missions de due diligence dans le cadre d'opérations de financement. Vous interviendrez sur des opérations M&A (buy-side et sell-side) pour des acteurs de premier plan, en fournissant des analyses financières approfondies et des recommandations stratégiques.`;

const MISSIONS = [
  "Réaliser des missions de due diligence financière dans le cadre d'opérations de M&A (buy-side et sell-side).",
  "Analyser la performance historique et future des cibles pour identifier les zones de risque.",
  "Challenger les éléments de valorisation : qualité des résultats récurrents, identification des éléments de profitabilité non récurrents, passifs de type dette, BFR normatif.",
  "Apporter une perspective critique sur la qualité des résultats, la capacité de génération de cash-flows, et les principaux agrégats financiers.",
  "Préparer des rapports de due diligence clairs et structurés à destination des clients et parties prenantes.",
];

const PROFILE = [
  "Diplômé(e) d'une grande école de commerce ou université de premier plan (BAC +5).",
  "3 à 5 ans d'expérience minimum en Transaction Services, acquise au sein d'un cabinet d'audit, de conseil, ou d'une practice spécialisée.",
  "Solides capacités en analyse financière et modélisation.",
  "Maîtrise avancée d'Excel, PowerPoint et des outils de visualisation de données.",
  "Fortes capacités analytiques et rigueur intellectuelle.",
  "Excellentes qualités relationnelles, capacité à travailler en équipe et à interagir avec des interlocuteurs variés.",
  "Proactivité, sens business et capacité à gérer plusieurs priorités dans un environnement exigeant.",
  "Maîtrise parfaite du français et de l'anglais (écrit et oral).",
];

const BENEFITS = [
  "Environnement international stimulant avec exposition à des opérations de haut niveau.",
  "Programme de formation continue et développement de carrière structuré.",
  "Rémunération compétitive avec package d'avantages attractif.",
  "Missions diversifiées auprès de clients variés (private equity, corporates, institutions financières).",
  "Opportunités d'évolution rapide vers des postes de management.",
];

const PROCESS = [
  { step: "1", label: "Pré-sélection sur CV et lettre de motivation" },
  { step: "2", label: "Entretien technique et étude de cas" },
  { step: "3", label: "Rencontre avec l'équipe et les associés" },
];

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function CandidateApplyPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <div className="min-h-screen flex flex-col dark:bg-bg" style={{ background: '#f4f4f4' }}>
      {/* ---------- HERO (Includes Floating Header inside same Grid Background) ---------- */}
      <JobHeroSection
        title={MOCK_OFFER.title}
        companyName={MOCK_OFFER.companyName}
        location={MOCK_OFFER.location}
        contractType={MOCK_OFFER.contractType}
        salaryRange={MOCK_OFFER.salaryRange}
        experienceLevel={MOCK_OFFER.experienceLevel}
        languages={MOCK_OFFER.languages}
        educationLevel={MOCK_OFFER.educationLevel}
      />

      {/* ---------- MAIN CONTENT (two columns) ---------- */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="grid md:grid-cols-3 gap-8">
          {/* LEFT COLUMN (2/3) — Job Description */}
          <div className="md:col-span-2 space-y-8">
            {/* About the role */}
            <section className="rounded-xl border border-gray-200 dark:border-border-brand bg-white dark:bg-card p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-ink mb-4">
                À propos du poste
              </h2>
              <p className="text-sm text-gray-700 dark:text-ink leading-relaxed">
                {ABOUT}
              </p>
            </section>

            {/* Missions */}
            <section className="rounded-xl border border-gray-200 dark:border-border-brand bg-white dark:bg-card p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-ink mb-4">
                Missions
              </h2>
              <ul className="space-y-3">
                {MISSIONS.map((m) => (
                  <li key={m} className="flex items-start gap-3 text-sm text-gray-700 dark:text-ink">
                    <span
                      className="w-1.5 h-1.5 rounded-full mt-2 shrink-0 bg-brand"
                      aria-hidden="true"
                    />
                    <span className="leading-relaxed">{m}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Required profile */}
            <section className="rounded-xl border border-gray-200 dark:border-border-brand bg-white dark:bg-card p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-ink mb-4">
                Profil recherché
              </h2>
              <ul className="space-y-3">
                {PROFILE.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-sm text-gray-700 dark:text-ink">
                    <CheckCircle2
                      className="w-4 h-4 text-brand mt-0.5 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="leading-relaxed">{p}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Benefits */}
            <section className="rounded-xl border border-gray-200 dark:border-border-brand bg-white dark:bg-card p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-ink mb-4">
                Ce que nous offrons
              </h2>
              <ul className="space-y-3">
                {BENEFITS.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-sm text-gray-700 dark:text-ink">
                    <span
                      className="w-1.5 h-1.5 rounded-full mt-2 shrink-0 bg-brand"
                      aria-hidden="true"
                    />
                    <span className="leading-relaxed">{b}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Recruitment process */}
            <section className="rounded-xl border border-gray-200 dark:border-border-brand bg-white dark:bg-card p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-ink mb-5">
                Processus de recrutement
              </h2>
              <ol className="space-y-5">
                {PROCESS.map(({ step, label }) => (
                  <li key={step} className="flex items-start gap-4">
                    <span
                      className="flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-semibold shrink-0 bg-brand shadow-sm"
                    >
                      {step}
                    </span>
                    <span className="text-sm text-gray-700 dark:text-ink pt-1 leading-relaxed">
                      {label}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          {/* RIGHT COLUMN (1/3) — Sidebar */}
          <JobSidebar
            companyName={MOCK_OFFER.companyName}
            location={MOCK_OFFER.location}
            companyDescription={MOCK_OFFER.companyDescription}
            onApply={() => setShowAuthModal(true)}
          />
        </div>
      </main>

      {/* ---------- FOOTER ---------- */}
      <footer className="border-t border-border-brand bg-white/90 dark:bg-card/80" style={{ backdropFilter: 'blur(16px)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 flex flex-col gap-6">
          {/* Top row */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-6 flex-wrap">
              {/* Logo text */}
              <a href="/" className="text-xl font-bold tracking-tight" aria-label="PooLink home">
                <span className="text-brand">
                  PooLink
                </span>
              </a>
              <nav className="flex items-center gap-5 text-[0.85rem] font-medium text-gray-700 dark:text-ink">
                <a href="#" className="hover:text-brand transition-colors">
                  Offres
                </a>
                <a href="#" className="hover:text-brand transition-colors">
                  Entreprises
                </a>
                <a href="#" className="hover:text-brand transition-colors">
                  Nous contacter
                </a>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-border-brand bg-white dark:bg-card px-3 py-2 text-[0.8125rem] font-semibold text-gray-800 dark:text-ink hover:bg-brand-light hover:border-brand/35 transition-colors"
              >
                Newsletter
              </button>
              <div className="flex items-center gap-1.5">
                <a
                  href="#"
                  aria-label="LinkedIn"
                  className="h-9 w-9 rounded-lg border border-border-brand bg-white dark:bg-card flex items-center justify-center text-gray-500 dark:text-muted text-xs font-semibold hover:bg-brand-light hover:border-brand/35 transition-colors"
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

          {/* Divider */}
          <div className="h-px bg-border-brand" />

          {/* Bottom row */}
          <div className="flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-3 text-[0.75rem] text-gray-500 dark:text-muted">
            <p>© {new Date().getFullYear()} PooLink. Tous droits réservés.</p>
            <nav className="flex items-center gap-4">
              <a href="#" className="hover:text-brand transition-colors">
                Cookies
              </a>
              <a href="#" className="hover:text-brand transition-colors">
                Conditions générales
              </a>
              <a href="#" className="hover:text-brand transition-colors">
                Mentions légales
              </a>
            </nav>
          </div>
        </div>
      </footer>

      {/* ---------- AUTH REQUIRED MODAL ---------- */}
      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => window.alert('Connecté ! (Page démo)')}
      />
    </div>
  );
}
