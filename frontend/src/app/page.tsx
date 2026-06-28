'use client';

import { Suspense, lazy, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Search,
  Briefcase,
  MessageSquareText,
  FileText,
  Users,
  Shield,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Menu,
  X,
  Check,
  Sparkles,
} from 'lucide-react';
import { getToken } from '@/lib/recruiterAuth';
import { getToken as getCandidateToken } from '@/lib/candidateAuth';
import { cn } from '@/lib/utils';
import ThemeToggle from '@/components/ThemeToggle';
import {
  Reveal,
  Logo,
  CTAButton,
  SectionHeading,
  StatCard,
  type Stat,
  FeatureCard,
  AudienceCard,
  PricingCard,
  type Plan,
  TestimonialCard,
  type Testimonial,
  FAQAccordion,
  type FaqItem,
} from '@/shared/components';

/* The signature AI Match Score card is decorative and only shown on large
   screens — lazy-load it so it never weighs down the initial hero bundle. */
const AIMatchCard = lazy(() => import('@/shared/components/AIMatchCard'));

/* ════════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════════ */

export default function LandingPage() {
  const [recruiterLoggedIn, setRecruiterLoggedIn] = useState(false);
  const [candidateLoggedIn, setCandidateLoggedIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setRecruiterLoggedIn(Boolean(getToken()));
    setCandidateLoggedIn(Boolean(getCandidateToken()));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-bg text-ink">
      <Header
        recruiterLoggedIn={recruiterLoggedIn}
        candidateLoggedIn={candidateLoggedIn}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobile={() => setMobileMenuOpen((v) => !v)}
      />

      <main className="flex-1">
        <HeroSection
          recruiterLoggedIn={recruiterLoggedIn}
          candidateLoggedIn={candidateLoggedIn}
        />
        <LogosSection />
        <StatsSection />
        <DualAudienceSection />
        <HowItWorksSection />
        <FeaturesSection />
        <DashboardPreviewSection />
        <TestimonialsSection />
        <PricingSection />
        <FaqSection />
        <CTASection
          recruiterLoggedIn={recruiterLoggedIn}
          candidateLoggedIn={candidateLoggedIn}
        />
      </main>

      <Footer />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   HEADER
   ════════════════════════════════════════════════════════════════════ */

const NAV = [
  { label: 'Fonctionnalités', to: '#features', anchor: true },
  { label: 'Solutions', to: '#solutions', anchor: true },
  { label: 'Tarifs', to: '#pricing', anchor: true },
  { label: 'À propos', to: '#about', anchor: true },
];

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
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-300',
        scrolled ? 'glass border-b border-border-brand' : 'border-b border-transparent',
      )}
    >
      <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between">
        <Logo />

        <nav className="hidden md:flex items-center gap-8">
          <NavLinks />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {recruiterLoggedIn || candidateLoggedIn ? (
              <CTAButton to={recruiterLoggedIn ? '/dashboard' : '/candidate/profile'} size="sm">
                Mon espace
                <ArrowRight className="w-3.5 h-3.5" />
              </CTAButton>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-muted hover:text-ink transition-colors"
                >
                  Connexion
                </Link>
                <CTAButton to="/get-started" size="sm">
                  Commencer
                  <ArrowRight className="w-3.5 h-3.5" />
                </CTAButton>
              </>
            )}
          </div>
        </nav>

        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={onToggleMobile}
            className="p-2 rounded-lg text-ink hover:bg-surface transition-colors"
            aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden overflow-hidden border-t border-border-brand bg-bg"
          >
            <div className="px-5 py-4 space-y-4">
              <nav className="flex flex-col gap-1">
                <MobileNavLinks onNavigate={onToggleMobile} />
              </nav>
              <div className="flex flex-col gap-2 pt-2">
                {recruiterLoggedIn || candidateLoggedIn ? (
                  <CTAButton
                    to={recruiterLoggedIn ? '/dashboard' : '/candidate/profile'}
                    className="w-full"
                    onClick={onToggleMobile}
                  >
                    Mon espace
                  </CTAButton>
                ) : (
                  <>
                    <CTAButton to="/get-started" className="w-full" onClick={onToggleMobile}>
                      Commencer gratuitement
                    </CTAButton>
                    <CTAButton to="/login" variant="secondary" className="w-full" onClick={onToggleMobile}>
                      Se connecter
                    </CTAButton>
                  </>
                )}
                <CTAButton to="/offers" variant="ghost" className="w-full" onClick={onToggleMobile}>
                  Parcourir les offres
                </CTAButton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function NavLinks() {
  return (
    <>
      {NAV.map((item) =>
        item.anchor ? (
          <a
            key={item.label}
            href={item.to}
            className="text-sm font-medium text-muted hover:text-ink transition-colors"
          >
            {item.label}
          </a>
        ) : (
          <Link
            key={item.label}
            to={item.to}
            className="text-sm font-medium text-muted hover:text-ink transition-colors"
          >
            {item.label}
          </Link>
        ),
      )}
    </>
  );
}

function MobileNavLinks({ onNavigate }: { onNavigate: () => void }) {
  return (
    <>
      {NAV.map((item) =>
        item.anchor ? (
          <a
            key={item.label}
            href={item.to}
            onClick={onNavigate}
            className="text-sm font-medium text-ink py-2 px-2 rounded-lg hover:bg-surface transition-colors"
          >
            {item.label}
          </a>
        ) : (
          <Link
            key={item.label}
            to={item.to}
            onClick={onNavigate}
            className="text-sm font-medium text-ink py-2 px-2 rounded-lg hover:bg-surface transition-colors"
          >
            {item.label}
          </Link>
        ),
      )}
    </>
  );
}

/* ════════════════════════════════════════════════════════════════════
   HERO
   ════════════════════════════════════════════════════════════════════ */

function HeroSection({
  recruiterLoggedIn,
  candidateLoggedIn,
}: {
  recruiterLoggedIn: boolean;
  candidateLoggedIn: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <section className="relative overflow-hidden">
      {/* Mesh + grid + floating aurora orbs */}
      <div className="absolute inset-0 -z-10 bg-mesh" />
      <div className="absolute inset-0 -z-10 bg-grid opacity-60" />
      <div
        className="absolute -top-24 -left-24 w-[460px] h-[460px] rounded-full blur-3xl opacity-50 animate-aurora -z-10"
        style={{ background: 'radial-gradient(circle, hsl(var(--indigo-500)/0.45), transparent 70%)' }}
      />
      <div
        className="absolute top-10 -right-32 w-[520px] h-[520px] rounded-full blur-3xl opacity-40 animate-aurora -z-10"
        style={{
          background: 'radial-gradient(circle, hsl(var(--cyan-500)/0.34), transparent 70%)',
          animationDelay: '-6s',
        }}
      />

      <div className="relative mx-auto max-w-6xl px-5 pt-20 pb-20 sm:pt-28 sm:pb-28">
        <div className="max-w-3xl">
          <motion.span
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold bg-brand-light text-brand border border-border-brand"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Présélection intelligente & matching sémantique
          </motion.span>

          <motion.h1
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
            className="mt-6 font-display text-4xl sm:text-6xl font-bold tracking-tight leading-[1.05] text-ink"
            style={{ textWrap: 'balance', letterSpacing: '-0.02em' }}
          >
            Trouvez le bon candidat <span className="text-gradient">au bon poste.</span>
            <br className="hidden sm:block" /> Grâce au matching sémantique.
          </motion.h1>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.16 }}
            className="mt-6 text-lg leading-relaxed max-w-xl text-muted"
          >
            PooLink qualifie vos candidatures par matching sémantique et automatise
            le premier contact via des entretiens IA conversationnels.
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.24 }}
            className="mt-10 flex flex-col sm:flex-row gap-3"
          >
            {recruiterLoggedIn || candidateLoggedIn ? (
              <CTAButton to={recruiterLoggedIn ? '/dashboard' : '/candidate/profile'}>
                <Sparkles className="w-4 h-4" />
                Accéder à mon espace
              </CTAButton>
            ) : (
              <CTAButton to="/get-started">
                <Sparkles className="w-4 h-4" />
                Commencer gratuitement
              </CTAButton>
            )}
            <CTAButton to="/offers" variant="secondary">
              <Users className="w-4 h-4" />
              Parcourir les offres
            </CTAButton>
          </motion.div>

          <motion.p
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.34 }}
            className="mt-5 flex items-center gap-2 text-xs text-muted"
          >
            <Check className="w-3.5 h-3.5 text-success" />
            Sans carte bancaire · Mise en place en quelques minutes
          </motion.p>
        </div>

        {/* Floating AI Match Score card (desktop only, lazy-loaded) */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 30, rotate: -1 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          className="hidden lg:block absolute right-5 top-28 w-[340px]"
        >
          <Suspense fallback={null}>
            <AIMatchCard />
          </Suspense>
        </motion.div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════
   LOGOS
   ════════════════════════════════════════════════════════════════════ */

function LogosSection() {
  const logos = ['Atlas RH', 'Nexity', 'Horizon', 'Lumen Group', 'Vertex', 'Orbit'];
  return (
    <section className="py-12 border-y border-border-brand bg-surface">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal className="text-center text-xs font-semibold uppercase tracking-widest text-muted mb-8">
          Ils recrutent plus intelligemment avec PooLink
        </Reveal>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 items-center">
          {logos.map((name, i) => (
            <Reveal key={name} delay={i * 0.05} className="flex justify-center">
              <span className="font-display text-lg font-bold text-muted hover:text-ink transition-colors">
                {name}
              </span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════
   STATS
   ════════════════════════════════════════════════════════════════════ */

function StatsSection() {
  const stats: Stat[] = [
    { value: 2000, suffix: '+', label: 'Candidats évalués' },
    { value: 95, suffix: '%', label: 'Taux de satisfaction' },
    { value: null, display: '3×', label: 'Plus rapide que le tri manuel' },
    { value: null, display: 'Zéro', label: 'Biais initial de sélection' },
  ];
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <StatCard key={s.label} stat={s} delay={i * 0.08} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════
   DUAL AUDIENCE
   ════════════════════════════════════════════════════════════════════ */

function DualAudienceSection() {
  return (
    <section id="solutions" className="py-20 sm:py-24 bg-surface">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHeading
          eyebrow="Deux parcours, une plateforme"
          title="Un espace optimisé pour chaque parcours"
          subtitle="Que vous cherchiez à recruter le meilleur profil ou à trouver votre prochaine opportunité, PooLink s'adapte à vos besoins."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Reveal>
            <AudienceCard
              icon={Briefcase}
              tone="brand"
              title="Pour les Recruteurs"
              description="Créez vos offres, comparez les candidatures par pertinence sémantique et laissez notre IA mener les premiers entretiens de pré-sélection."
              items={[
                'Classement automatique des CV par pertinence',
                "Entretiens de premier niveau menés par l'IA",
                "Rapports d'entretiens et scores de matching",
                'Centralisation des candidatures par poste',
              ]}
              cta={{ label: 'Créer un compte recruteur', to: '/register/recruiter' }}
            />
          </Reveal>
          <Reveal delay={0.1}>
            <AudienceCard
              id="candidats"
              icon={Users}
              tone="cyan"
              title="Pour les Candidats"
              description="Postulez en un clic et échangez de manière naturelle avec notre assistant IA pour mettre en avant votre parcours et vos motivations."
              items={[
                'Accès gratuit aux offres actives',
                'Candidature simplifiée sans lettre de motivation',
                'Entretien IA conversationnel et bienveillant',
                'Retour rapide sur la pertinence de votre profil',
              ]}
              cta={{ label: 'Créer un compte candidat', to: '/register/candidate' }}
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════
   HOW IT WORKS
   ════════════════════════════════════════════════════════════════════ */

function HowItWorksSection() {
  const steps = [
    {
      step: 1,
      title: 'Décrivez votre besoin',
      description:
        'Saisissez les compétences et le contexte du poste en langage naturel ou importez votre fiche de poste.',
      icon: FileText,
    },
    {
      step: 2,
      title: 'Comparez les profils',
      description:
        "L'IA analyse les CV et calcule un score de compatibilité sémantique, au-delà des simples mots-clés.",
      icon: BarChart3,
    },
    {
      step: 3,
      title: 'Qualifiez les candidats',
      description:
        'Les candidats sélectionnés passent un court entretien IA. Vous recevez une synthèse structurée.',
      icon: MessageSquareText,
    },
  ];
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHeading
          eyebrow="Comment ça marche"
          title="Trois étapes pour automatiser votre pré-sélection"
          subtitle="Identifiez les meilleurs talents sans perdre de temps sur le tri manuel."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map(({ step, title, description, icon: Icon }, i) => (
            <Reveal key={step} delay={i * 0.1} className="relative">
              {step < 3 && (
                <div className="absolute top-7 left-[calc(50%+2rem)] right-0 h-px hidden md:block bg-gradient-to-r from-border-brand to-transparent" />
              )}
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 bg-grad-brand-soft border border-border-brand">
                  <Icon className="w-6 h-6 text-brand" />
                </div>
                <p className="font-mono text-xs font-bold uppercase tracking-wider mb-2 text-brand">
                  Étape {step}
                </p>
                <h3 className="font-display text-lg font-bold mb-2 text-ink">{title}</h3>
                <p className="text-sm leading-relaxed text-muted">{description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════
   FEATURES
   ════════════════════════════════════════════════════════════════════ */

function FeaturesSection() {
  const features = [
    {
      icon: Search,
      title: 'Recherche sémantique avancée',
      description:
        "Identifiez les profils pertinents en langage naturel. L'IA comprend le contexte et les soft skills associés.",
    },
    {
      icon: MessageSquareText,
      title: 'Entretiens de pré-sélection IA',
      description:
        'Notre assistant qualifie les candidats avec des questions ciblées, pour une évaluation fluide et structurée.',
    },
    {
      icon: Briefcase,
      title: 'Gestion centralisée des offres',
      description:
        'Regroupez vos offres dans des pools dédiés, partagez un lien unique et suivez la progression des candidats.',
    },
    {
      icon: Shield,
      title: 'Évaluation anonyme et équitable',
      description:
        'Masquez les données personnelles durant la première phase pour vous concentrer sur les compétences réelles.',
    },
  ];
  return (
    <section id="features" className="py-20 sm:py-24 bg-surface">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHeading
          eyebrow="Fonctionnalités"
          title="Tout ce qu'il faut pour recruter mieux"
          subtitle="Un recrutement efficace, rapide et équitable, propulsé par l'IA."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map(({ icon, title, description }, i) => (
            <FeatureCard
              key={title}
              icon={icon}
              title={title}
              description={description}
              delay={i * 0.08}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════
   DASHBOARD PREVIEW
   ════════════════════════════════════════════════════════════════════ */

function DashboardPreviewSection() {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHeading
          eyebrow="Aperçu produit"
          title="Un tableau de bord clair et puissant"
          subtitle="Suivez vos pools, vos candidatures et vos scores de matching en un coup d'œil."
        />
        <Reveal>
          <div className="rounded-2xl border border-border-brand bg-card shadow-xl overflow-hidden">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 h-10 border-b border-border-brand bg-surface">
              <span className="w-3 h-3 rounded-full bg-danger" />
              <span className="w-3 h-3 rounded-full bg-warning" />
              <span className="w-3 h-3 rounded-full bg-success" />
              <span className="ml-3 text-xs text-muted font-mono">app.poolink.io/dashboard</span>
            </div>
            {/* Body */}
            <div className="p-5 sm:p-8 bg-mesh">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Candidats', value: '1 284' },
                  { label: 'Pools actifs', value: '18' },
                  { label: 'Entretiens', value: '342' },
                  { label: 'Score moyen', value: '87%' },
                ].map((k) => (
                  <div key={k.label} className="rounded-xl border border-border-brand bg-card p-4">
                    <p className="text-xs text-muted">{k.label}</p>
                    <p className="font-display text-2xl font-bold text-ink mt-1">{k.value}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 rounded-xl border border-border-brand bg-card p-5">
                  <p className="text-sm font-semibold text-ink mb-4">Évolution des candidatures</p>
                  <div className="flex items-end gap-2 h-32">
                    {[40, 55, 48, 70, 62, 85, 78, 95, 88].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-md bg-grad-brand"
                        style={{ height: `${h}%`, opacity: 0.55 + h / 220 }}
                      />
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-border-brand bg-card p-5">
                  <p className="text-sm font-semibold text-ink mb-4">Top matchs</p>
                  <div className="space-y-3">
                    {[96, 91, 88].map((s, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-grad-brand-soft border border-border-brand" />
                        <div className="flex-1 h-2 rounded-full bg-surface-2 overflow-hidden">
                          <div className="h-full bg-grad-brand rounded-full" style={{ width: `${s}%` }} />
                        </div>
                        <span className="font-mono text-xs font-bold text-brand">{s}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════
   TESTIMONIALS
   ════════════════════════════════════════════════════════════════════ */

function TestimonialsSection() {
  const testimonials: Testimonial[] = [
    {
      quote:
        'PooLink a divisé par trois notre temps de présélection. Les scores de matching sont étonnamment précis.',
      name: 'Camille D.',
      role: 'Responsable Talent — Atlas RH',
    },
    {
      quote:
        'Les entretiens IA nous font gagner des heures chaque semaine. Les synthèses sont claires et exploitables.',
      name: 'Yassine E.',
      role: 'Recruteur Tech — Vertex',
    },
    {
      quote:
        'Une expérience candidat fluide et respectueuse. Nos taux de complétion ont nettement augmenté.',
      name: 'Sophie L.',
      role: 'HR Manager — Horizon',
    },
  ];
  return (
    <section className="py-20 sm:py-24 bg-surface">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHeading
          eyebrow="Témoignages"
          title="Les équipes RH adorent PooLink"
          subtitle="Rejoignez les recruteurs qui transforment leur processus de recrutement."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.1}>
              <TestimonialCard testimonial={t} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════
   PRICING
   ════════════════════════════════════════════════════════════════════ */

function PricingSection() {
  const plans: Plan[] = [
    {
      name: 'Découverte',
      price: 'Gratuit',
      description: 'Pour tester la pré-sélection IA.',
      features: ['1 pool de recrutement', "Jusqu'à 20 candidats", 'Matching sémantique', 'Entretien IA standard'],
      cta: 'Commencer gratuitement',
      to: '/register/recruiter',
      featured: false,
    },
    {
      name: 'Pro',
      price: '49€',
      period: '/mois',
      description: 'Pour les équipes qui recrutent régulièrement.',
      features: [
        'Pools illimités',
        'Candidats illimités',
        'Scores & rapports avancés',
        'Entretiens IA personnalisés',
        'Support prioritaire',
      ],
      cta: "Démarrer l'essai",
      to: '/register/recruiter',
      featured: true,
    },
    {
      name: 'Entreprise',
      price: 'Sur devis',
      description: 'Pour les grands volumes et besoins spécifiques.',
      features: ['Tout le plan Pro', 'SSO & sécurité avancée', 'Intégrations sur mesure', 'Accompagnement dédié'],
      cta: 'Nous contacter',
      to: '/register/recruiter',
      featured: false,
    },
  ];
  return (
    <section id="pricing" className="py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHeading
          eyebrow="Tarifs"
          title="Une tarification simple et transparente"
          subtitle="Commencez gratuitement, évoluez quand vous êtes prêt."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 0.08} className="h-full">
              <PricingCard plan={plan} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════
   FAQ
   ════════════════════════════════════════════════════════════════════ */

function FaqSection() {
  const faqs: FaqItem[] = [
    {
      q: 'Comment fonctionne le matching sémantique ?',
      a: "Notre IA analyse le sens des CV et de vos critères, pas seulement les mots-clés. Elle calcule un score de compatibilité qui prend en compte le contexte, l'expérience et les compétences associées.",
    },
    {
      q: "Qu'est-ce qu'un entretien IA ?",
      a: "C'est un court échange textuel conversationnel mené par notre assistant. Il pose des questions ciblées sur le poste et génère une synthèse structurée des réponses du candidat.",
    },
    {
      q: 'Les données des candidats sont-elles protégées ?',
      a: "Oui. Les données personnelles peuvent être masquées durant la première phase d'évaluation, et nous appliquons des standards de sécurité stricts pour protéger toutes les informations.",
    },
    {
      q: 'Puis-je essayer gratuitement ?',
      a: 'Absolument. Le plan Découverte est gratuit et sans carte bancaire. Vous pouvez créer un pool et évaluer vos premiers candidats immédiatement.',
    },
    {
      q: 'PooLink convient-il aux candidats ?',
      a: 'Oui. Les candidats accèdent gratuitement aux offres, postulent en un clic et passent un entretien IA bienveillant qui valorise leur parcours.',
    },
  ];
  return (
    <section id="faq" className="py-20 sm:py-24 bg-surface">
      <div className="mx-auto max-w-3xl px-5">
        <SectionHeading eyebrow="FAQ" title="Questions fréquentes" />
        <FAQAccordion items={faqs} defaultOpen={0} />
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════
   FINAL CTA
   ════════════════════════════════════════════════════════════════════ */

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
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl p-10 sm:p-16 text-center bg-brand bg-grad-brand shadow-xl">
            <div className="absolute inset-0 bg-grid opacity-20" />
            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
            <div className="relative">
              <h2
                className="font-display text-3xl sm:text-4xl font-bold text-brand-contrast tracking-tight mb-4"
                style={{ letterSpacing: '-0.02em' }}
              >
                Prêt à simplifier vos recrutements ?
              </h2>
              <p className="text-base text-white/80 max-w-lg mx-auto mb-8">
                Rejoignez PooLink dès aujourd'hui pour identifier les meilleurs talents
                ou postuler aux opportunités qui vous correspondent.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <CTAButton
                  to={recruiterLoggedIn ? '/dashboard' : '/get-started'}
                  variant="onbrand"
                  size="lg"
                  className="font-bold"
                >
                  <Sparkles className="w-4 h-4" />
                  {recruiterLoggedIn ? 'Accéder à mon tableau de bord' : 'Commencer gratuitement'}
                </CTAButton>
                <CTAButton
                  to={candidateLoggedIn ? '/candidate/profile' : '/offers'}
                  variant="onbrand-outline"
                  size="lg"
                  className="font-bold"
                >
                  <Users className="w-4 h-4" />
                  {candidateLoggedIn ? 'Consulter mon profil' : 'Parcourir les offres'}
                </CTAButton>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════
   FOOTER
   ════════════════════════════════════════════════════════════════════ */

function Footer() {
  const cols = [
    {
      title: 'Produit',
      links: [
        { label: 'Fonctionnalités', to: '#features', anchor: true },
        { label: 'Solutions', to: '#solutions', anchor: true },
        { label: 'Tarifs', to: '#pricing', anchor: true },
        { label: 'FAQ', to: '#faq', anchor: true },
      ],
    },
    {
      title: 'Recruteurs',
      links: [
        { label: 'Connexion', to: '/login/recruiter', anchor: false },
        { label: 'Inscription', to: '/register/recruiter', anchor: false },
        { label: 'Tableau de bord', to: '/dashboard', anchor: false },
      ],
    },
    {
      title: 'Candidats',
      links: [
        { label: "Offres d'emploi", to: '/offers', anchor: false },
        { label: 'Mon profil', to: '/candidate/profile', anchor: false },
      ],
    },
  ];
  return (
    <footer id="about" className="border-t border-border-brand bg-bg">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2">
            <Logo />
            <p className="mt-4 text-sm text-muted max-w-xs leading-relaxed">
              La plateforme de recrutement propulsée par l'IA. Présélection
              intelligente, entretiens conversationnels et matching sémantique.
            </p>
          </div>
          {cols.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-bold uppercase tracking-wider text-ink mb-4">{col.title}</p>
              <ul className="space-y-3">
                {col.links.map((l) =>
                  l.anchor ? (
                    <li key={l.label}>
                      <a href={l.to} className="text-sm text-muted hover:text-ink transition-colors">
                        {l.label}
                      </a>
                    </li>
                  ) : (
                    <li key={l.label}>
                      <Link
                        to={l.to}
                        className="text-sm text-muted hover:text-ink transition-colors inline-flex items-center gap-1 group"
                      >
                        {l.label}
                        <ArrowUpRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </Link>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-8 border-t border-border-brand flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} PooLink. Tous droits réservés.
          </p>
          <p className="text-xs text-muted">Conçu avec soin pour un recrutement plus juste.</p>
        </div>
      </div>
    </footer>
  );
}
