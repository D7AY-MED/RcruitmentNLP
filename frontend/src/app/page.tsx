'use client';

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Briefcase,
  MessageSquareText,
  FileText,
  Users,
  Shield,
  ArrowRight,
  Zap,
  BarChart3,
  UserCheck,
  Menu,
  X,
} from 'lucide-react';
import { getToken } from '@/lib/recruiterAuth';
import { getToken as getCandidateToken } from '@/lib/candidateAuth';

export default function LandingPage() {
  const [recruiterLoggedIn, setRecruiterLoggedIn] = useState(false);
  const [candidateLoggedIn, setCandidateLoggedIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setRecruiterLoggedIn(Boolean(getToken()));
    setCandidateLoggedIn(Boolean(getCandidateToken()));
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* ─── HEADER ─── */}
      <Header
        recruiterLoggedIn={recruiterLoggedIn}
        candidateLoggedIn={candidateLoggedIn}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobile={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

      <main className="flex-1">
        {/* ─── HERO ─── */}
        <HeroSection
          recruiterLoggedIn={recruiterLoggedIn}
          candidateLoggedIn={candidateLoggedIn}
        />

        {/* ─── DUAL AUDIENCE ─── */}
        <DualAudienceSection />

        {/* ─── HOW IT WORKS ─── */}
        <HowItWorksSection />

        {/* ─── FEATURES ─── */}
        <FeaturesSection />

        {/* ─── TRUST BAR ─── */}
        <TrustSection />

        {/* ─── CTA ─── */}
        <CTASection
          recruiterLoggedIn={recruiterLoggedIn}
          candidateLoggedIn={candidateLoggedIn}
        />
      </main>

      {/* ─── FOOTER ─── */}
      <Footer />
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   HEADER
   ═══════════════════════════════════════════════════ */

function Header({
  recruiterLoggedIn,
  candidateLoggedIn,
  mobileMenuOpen,
  onToggleMobile,
}: {
  recruiterLoggedIn: boolean;
  candidateLoggedIn: boolean;
  mobileMenuOpen: boolean;
  onToggleMobile: () => void;
}) {
  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        background: 'oklch(1.000 0.000 0 / 0.85)',
        backdropFilter: 'blur(12px)',
        borderColor: 'var(--border-color)',
      }}
    >
      <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--brand)' }}
          >
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--ink)' }}>
            PooLink
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          <NavLinks />
          <div className="flex items-center gap-3">
            {recruiterLoggedIn ? (
              <Link
                to="/dashboard"
                className="h-9 px-4 rounded-lg text-sm font-semibold text-white flex items-center gap-1.5 transition-colors"
                style={{ background: 'var(--brand)' }}
              >
                Tableau de bord recruteur
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/recruiter/login"
                  className="text-sm font-medium transition-colors"
                  style={{ color: 'var(--muted)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
                >
                  Connexion recruteur
                </Link>
                <Link
                  to="/recruiter/register"
                  className="h-9 px-4 rounded-lg text-sm font-semibold text-white flex items-center gap-1.5 transition-colors"
                  style={{ background: 'var(--brand)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--brand-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--brand)')}
                >
                  Inscription recruteur
                </Link>
              </>
            )}
          </div>
        </nav>

        {/* Mobile toggle */}
        <button
          onClick={onToggleMobile}
          className="md:hidden p-2 rounded-lg transition-colors"
          style={{ color: 'var(--ink)' }}
          aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div
          className="md:hidden border-t px-5 py-4 space-y-4"
          style={{ borderColor: 'var(--border-color)', background: 'var(--bg)' }}
        >
          <nav className="flex flex-col gap-3">
            <MobileNavLinks />
          </nav>
          <div className="flex flex-col gap-2 pt-2">
            {recruiterLoggedIn ? (
              <Link
                to="/dashboard"
                className="h-10 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-1.5"
                style={{ background: 'var(--brand)' }}
              >
                Tableau de bord recruteur
              </Link>
            ) : (
              <>
                <Link
                  to="/recruiter/register"
                  className="h-10 rounded-lg text-sm font-semibold text-white flex items-center justify-center"
                  style={{ background: 'var(--brand)' }}
                >
                  Créer un compte recruteur
                </Link>
                <Link
                  to="/recruiter/login"
                  className="h-10 rounded-lg text-sm font-semibold flex items-center justify-center border"
                  style={{ color: 'var(--ink)', borderColor: 'var(--border-color)' }}
                >
                  Connexion recruteur
                </Link>
              </>
            )}
            {candidateLoggedIn ? (
              <Link
                to="/candidate/profile"
                className="h-10 rounded-lg text-sm font-semibold text-white flex items-center justify-center"
                style={{ background: 'var(--accent)' }}
              >
                Mon profil candidat
              </Link>
            ) : (
              <Link
                to="/offers"
                className="h-10 rounded-lg text-sm font-semibold flex items-center justify-center border"
                style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}
              >
                Voir les offres
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function NavLinks() {
  const linkStyle = {
    color: 'var(--muted)',
  };
  return (
    <>
      <Link
        to="/recruiter/login"
        className="text-sm font-medium transition-colors"
        style={linkStyle}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
      >
        Recruteurs
      </Link>
      <Link
        to="/offers"
        className="text-sm font-medium transition-colors"
        style={linkStyle}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
      >
        Candidats
      </Link>
      <a
        href="#fonctionnalites"
        className="text-sm font-medium transition-colors"
        style={linkStyle}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
      >
        Fonctionnalités
      </a>
    </>
  );
}

function MobileNavLinks() {
  return (
    <>
      <Link
        to="/recruiter/login"
        className="text-sm font-medium py-1"
        style={{ color: 'var(--ink)' }}
      >
        Recruteurs
      </Link>
      <Link
        to="/offers"
        className="text-sm font-medium py-1"
        style={{ color: 'var(--ink)' }}
      >
        Candidats
      </Link>
      <a
        href="#fonctionnalites"
        className="text-sm font-medium py-1"
        style={{ color: 'var(--ink)' }}
      >
        Fonctionnalités
      </a>
    </>
  );
}

/* ═══════════════════════════════════════════════════
   HERO
   ═══════════════════════════════════════════════════ */

function HeroSection({
  recruiterLoggedIn,
  candidateLoggedIn,
}: {
  recruiterLoggedIn: boolean;
  candidateLoggedIn: boolean;
}) {
  return (
    <section className="relative overflow-hidden">
      {/* Subtle grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(var(--brand) 1px, transparent 1px), linear-gradient(90deg, var(--brand) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      <div className="relative mx-auto max-w-6xl px-5 pt-20 pb-24 sm:pt-28 sm:pb-32">
        <div className="max-w-3xl">
          {/* Pill */}
          <div className="animate-fade-up mb-6">
            <span
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold"
              style={{
                background: 'var(--brand-light)',
                color: 'var(--brand)',
              }}
            >
              <Zap className="w-3 h-3" />
              Présélection intelligente & matching sémantique
            </span>
          </div>

          {/* Heading */}
          <h1
            className="animate-fade-up-delay-1 text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.1]"
            style={{
              color: 'var(--ink)',
              textWrap: 'balance',
              letterSpacing: '-0.02em',
            }}
          >
            Trouvez le bon candidat{' '}
            <span style={{ color: 'var(--brand)' }}>au bon poste.</span>
            <br />
            Grâce au matching sémantique.
          </h1>

          {/* Subtext */}
          <p
            className="animate-fade-up-delay-2 mt-6 text-lg leading-relaxed max-w-xl"
            style={{ color: 'var(--muted)' }}
          >
            PooLink qualifie vos candidatures par matching sémantique et automatise le premier contact via des entretiens IA conversationnels.
          </p>

          {/* Dual CTAs */}
          <div className="animate-fade-up-delay-3 mt-10 flex flex-col sm:flex-row gap-3">
            {recruiterLoggedIn ? (
              <Link
                to="/dashboard"
                className="h-12 px-6 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2 transition-colors"
                style={{ background: 'var(--brand)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--brand-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--brand)')}
              >
                <Briefcase className="w-4 h-4" />
                Accéder à mon tableau de bord
              </Link>
            ) : (
              <Link
                to="/recruiter/register"
                className="h-12 px-6 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2 transition-colors"
                style={{ background: 'var(--brand)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--brand-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--brand)')}
              >
                <Briefcase className="w-4 h-4" />
                Créer un espace recruteur
              </Link>
            )}

            {candidateLoggedIn ? (
              <Link
                to="/candidate/profile"
                className="h-12 px-6 rounded-lg text-sm font-bold flex items-center justify-center gap-2 border-2 transition-colors"
                style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--accent)';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--accent)';
                }}
              >
                <Users className="w-4 h-4" />
                Accéder à mon profil
              </Link>
            ) : (
              <Link
                to="/offers"
                className="h-12 px-6 rounded-lg text-sm font-bold flex items-center justify-center gap-2 border-2 transition-colors"
                style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--accent)';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--accent)';
                }}
              >
                <Users className="w-4 h-4" />
                Découvrir les offres
              </Link>
            )}
          </div>
        </div>

        {/* Abstract shape — brand accent */}
        <div
          className="absolute -right-16 top-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full hidden lg:block"
          style={{
            background:
              'radial-gradient(circle at 40% 40%, var(--brand-light) 0%, transparent 70%)',
            opacity: 0.7,
          }}
        />
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   DUAL AUDIENCE
   ═══════════════════════════════════════════════════ */

function DualAudienceSection() {
  return (
    <section
      id="recruteurs"
      className="py-20 sm:py-24"
      style={{ background: 'var(--surface)' }}
    >
      <div className="mx-auto max-w-6xl px-5">
        <div className="text-center mb-14">
          <h2
            className="text-2xl sm:text-3xl font-bold tracking-tight"
            style={{ color: 'var(--ink)', letterSpacing: '-0.015em' }}
          >
            Un espace de travail optimisé pour chaque parcours
          </h2>
          <p className="mt-3 text-base max-w-lg mx-auto" style={{ color: 'var(--muted)' }}>
            Que vous cherchiez à recruter le meilleur profil ou à trouver votre prochaine opportunité, PooLink s'adapte à vos besoins.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recruiter card */}
          <div
            className="rounded-xl p-8 border transition-shadow hover:shadow-md"
            style={{
              background: 'var(--bg)',
              borderColor: 'var(--border-color)',
            }}
          >
            <div
              className="w-11 h-11 rounded-lg flex items-center justify-center mb-5"
              style={{ background: 'var(--brand-light)' }}
            >
              <Briefcase className="w-5 h-5" style={{ color: 'var(--brand)' }} />
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--ink)' }}>
              Pour les Recruteurs
            </h3>
            <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--muted)' }}>
              Créez vos offres d'emploi, comparez les candidatures par pertinence sémantique et laissez notre IA mener les premiers entretiens de pré-sélection.
            </p>
            <ul className="space-y-2.5">
              {[
                'Classement automatique des CV par pertinence',
                'Entretiens de premier niveau menés par l\'IA',
                'Rapports d\'entretiens et scores de matching',
                'Centralisation des candidatures par poste',
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-sm"
                  style={{ color: 'var(--ink)' }}
                >
                  <UserCheck
                    className="w-4 h-4 mt-0.5 shrink-0"
                    style={{ color: 'var(--brand)' }}
                  />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              to="/recruiter/register"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
              style={{ color: 'var(--brand)' }}
            >
              Créer un compte recruteur
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Candidate card */}
          <div
            id="candidats"
            className="rounded-xl p-8 border transition-shadow hover:shadow-md"
            style={{
              background: 'var(--bg)',
              borderColor: 'var(--border-color)',
            }}
          >
            <div
              className="w-11 h-11 rounded-lg flex items-center justify-center mb-5"
              style={{ background: 'oklch(0.950 0.020 165)' }}
            >
              <Users className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--ink)' }}>
              Pour les Candidats
            </h3>
            <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--muted)' }}>
              Postulez en un clic et échangez de manière naturelle avec notre assistant IA pour mettre en avant votre parcours et vos motivations.
            </p>
            <ul className="space-y-2.5">
              {[
                'Accès gratuit aux offres d\'emploi actives',
                'Candidature simplifiée sans lettre de motivation',
                'Entretien IA conversationnel et bienveillant',
                'Retour rapide sur la pertinence de votre profil',
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-sm"
                  style={{ color: 'var(--ink)' }}
                >
                  <UserCheck
                    className="w-4 h-4 mt-0.5 shrink-0"
                    style={{ color: 'var(--accent)' }}
                  />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              to="/offers"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
              style={{ color: 'var(--accent)' }}
            >
              Découvrir les offres d'emploi
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   HOW IT WORKS
   ═══════════════════════════════════════════════════ */

function HowItWorksSection() {
  const steps = [
    {
      step: 1,
      title: 'Décrivez votre besoin',
      description:
        'Saisissez les compétences et le contexte du poste en langage naturel ou importez directement votre fiche de poste.',
      icon: FileText,
    },
    {
      step: 2,
      title: 'Comparez les profils',
      description:
        'L\'IA analyse les CV déposés et calcule instantanément un score de compatibilité sémantique, au-delà des simples mots-clés.',
      icon: BarChart3,
    },
    {
      step: 3,
      title: 'Qualifiez les candidats',
      description:
        'Les candidats sélectionnés passent un court entretien textuel avec notre IA. Vous recevez une synthèse structurée de leurs réponses.',
      icon: MessageSquareText,
    },
  ];

  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="text-center mb-14">
          <h2
            className="text-2xl sm:text-3xl font-bold tracking-tight"
            style={{ color: 'var(--ink)', letterSpacing: '-0.015em' }}
          >
            Comment ça fonctionne
          </h2>
          <p className="mt-3 text-base max-w-lg mx-auto" style={{ color: 'var(--muted)' }}>
            Trois étapes pour automatiser votre pré-sélection et identifier les meilleurs talents.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map(({ step, title, description, icon: Icon }) => (
            <div key={step} className="relative">
              {/* Connector line (desktop only) */}
              {step < 3 && (
                <div
                  className="absolute top-7 left-full w-full h-px hidden md:block -z-10"
                  style={{ background: 'var(--border-color)' }}
                />
              )}

              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
                style={{ background: 'var(--brand-light)' }}
              >
                <Icon className="w-6 h-6" style={{ color: 'var(--brand)' }} />
              </div>
              <p
                className="text-xs font-bold uppercase tracking-wider mb-2"
                style={{ color: 'var(--brand)' }}
              >
                Étape {step}
              </p>
              <h3 className="text-base font-bold mb-2" style={{ color: 'var(--ink)' }}>
                {title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   FEATURES
   ═══════════════════════════════════════════════════ */

function FeaturesSection() {
  const features = [
    {
      icon: Search,
      title: 'Recherche sémantique avancée',
      description:
        'Identifiez les profils pertinents en décrivant vos besoins en langage naturel. L\'IA comprend le contexte et les soft skills associés.',
      accent: 'brand' as const,
    },
    {
      icon: MessageSquareText,
      title: 'Entretiens de pré-sélection IA',
      description:
        'Notre assistant virtuel qualifie les candidats avec des questions ciblées sur le poste, garantissant une évaluation fluide et structurée.',
      accent: 'teal' as const,
    },
    {
      icon: Briefcase,
      title: 'Gestion centralisée des offres',
      description:
        'Regroupez vos offres dans des pools dédiés, partagez un lien de candidature unique et suivez la progression des candidats.',
      accent: 'brand' as const,
    },
    {
      icon: Shield,
      title: 'Évaluation anonyme et équitable',
      description:
        'Masquez les données personnelles (nom, photo, genre) durant la première phase pour vous concentrer uniquement sur les compétences réelles.',
      accent: 'teal' as const,
    },
  ];

  return (
    <section
      id="fonctionnalites"
      className="py-20 sm:py-24"
      style={{ background: 'var(--surface)' }}
    >
      <div className="mx-auto max-w-6xl px-5">
        <div className="text-center mb-14">
          <h2
            className="text-2xl sm:text-3xl font-bold tracking-tight"
            style={{ color: 'var(--ink)', letterSpacing: '-0.015em' }}
          >
            Fonctionnalités clés
          </h2>
          <p className="mt-3 text-base max-w-lg mx-auto" style={{ color: 'var(--muted)' }}>
            Tout ce qu'il faut pour un recrutement efficace et équitable.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map(({ icon: Icon, title, description, accent }) => {
            const isBrand = accent === 'brand';
            return (
              <div
                key={title}
                className="rounded-xl p-7 border transition-shadow hover:shadow-md"
                style={{
                  background: 'var(--bg)',
                  borderColor: 'var(--border-color)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{
                    background: isBrand ? 'var(--brand-light)' : 'oklch(0.950 0.020 165)',
                  }}
                >
                  <Icon
                    className="w-5 h-5"
                    style={{ color: isBrand ? 'var(--brand)' : 'var(--accent)' }}
                  />
                </div>
                <h3 className="text-base font-bold mb-2" style={{ color: 'var(--ink)' }}>
                  {title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                  {description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   TRUST BAR
   ═══════════════════════════════════════════════════ */

function TrustSection() {
  const stats = [
    { value: '2 000+', label: 'Candidats évalués' },
    { value: '95%', label: 'Taux de satisfaction' },
    { value: '3×', label: 'Plus rapide que le tri manuel' },
    { value: 'Zéro', label: 'Biais initial de sélection' },
  ];

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p
                className="text-2xl sm:text-3xl font-extrabold"
                style={{ color: 'var(--brand)' }}
              >
                {value}
              </p>
              <p className="mt-1 text-sm font-medium" style={{ color: 'var(--muted)' }}>
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   FINAL CTA
   ═══════════════════════════════════════════════════ */

function CTASection({
  recruiterLoggedIn,
  candidateLoggedIn,
}: {
  recruiterLoggedIn: boolean;
  candidateLoggedIn: boolean;
}) {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div
          className="rounded-2xl p-10 sm:p-14 text-center"
          style={{ background: 'var(--brand)' }}
        >
          <h2
            className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-4"
            style={{ letterSpacing: '-0.015em' }}
          >
            Prêt à simplifier vos processus de recrutement ?
          </h2>
          <p className="text-base text-white/80 max-w-lg mx-auto mb-8">
            Rejoignez PooLink dès aujourd'hui pour identifier rapidement les meilleurs talents ou postuler aux opportunités qui vous correspondent.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={recruiterLoggedIn ? '/dashboard' : '/recruiter/register'}
              className="h-12 px-7 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
              style={{
                background: 'var(--bg)',
                color: 'var(--brand)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg)')}
            >
              <Briefcase className="w-4 h-4" />
              {recruiterLoggedIn ? 'Accéder à mon tableau de bord' : 'Créer mon compte recruteur'}
            </Link>
            <Link
              to={candidateLoggedIn ? '/candidate/profile' : '/offers'}
              className="h-12 px-7 rounded-lg text-sm font-bold flex items-center gap-2 border-2 border-white/30 text-white transition-colors"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <Users className="w-4 h-4" />
              {candidateLoggedIn ? 'Consulter mon profil candidat' : 'Parcourir les offres d\'emploi'}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════════════ */

function Footer() {
  return (
    <footer
      className="border-t py-8"
      style={{ borderColor: 'var(--border-color)' }}
    >
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded flex items-center justify-center"
              style={{ background: 'var(--brand)' }}
            >
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-bold" style={{ color: 'var(--ink)' }}>
              PooLink
            </span>
          </div>

          <nav className="flex items-center gap-6">
            <Link
              to="/recruiter/login"
              className="text-xs font-medium transition-colors"
              style={{ color: 'var(--muted)' }}
            >
              Recruteurs
            </Link>
            <Link
              to="/offers"
              className="text-xs font-medium transition-colors"
              style={{ color: 'var(--muted)' }}
            >
              Candidats
            </Link>
            <Link
              to="/dashboard"
              className="text-xs font-medium transition-colors"
              style={{ color: 'var(--muted)' }}
            >
              Tableau de bord
            </Link>
          </nav>

          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            © {new Date().getFullYear()} PooLink. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
