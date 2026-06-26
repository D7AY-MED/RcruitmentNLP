'use client';

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  Briefcase, 
  Calendar, 
  ChevronRight, 
  Loader2, 
  Building2,
  Inbox
} from 'lucide-react';
import { listPublicJobPools } from '@/lib/jobPoolService';
import { JobPool } from '@/lib/types';
import { getToken, getCurrentCandidate, Candidate } from '@/lib/candidateAuth';
import AuthRequiredModal from '@/components/candidate/AuthRequiredModal';

export default function CandidateOffersPage() {
  const [offers, setOffers] = useState<JobPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [contractFilter, setContractFilter] = useState('All');
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const t = getToken();
    if (!t) return;
    getCurrentCandidate()
      .then(setCandidate)
      .catch(() => {});
  }, []);

  const handleAuthSuccess = async () => {
    setShowAuthModal(false);
    try {
      const data = await getCurrentCandidate();
      setCandidate(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const list = await listPublicJobPools();
        if (!cancelled) {
          // Filter out disabled ones just in case
          setOffers(list.filter(p => p.status === 'active'));
        }
      } catch (err) {
        console.error('Failed to load offers:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleApplyClick = (slug: string) => {
    navigate(`/apply/${slug}`);
  };

  // Filter offers based on search term and contract type
  const filteredOffers = offers.filter(offer => {
    const matchesSearch = 
      offer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (offer.company_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (offer.location || '').toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesContract = 
      contractFilter === 'All' || 
      (offer.contract_type || '').toLowerCase() === contractFilter.toLowerCase();
      
    return matchesSearch && matchesContract;
  });

  return (
    <div className="bg-slate-50 min-h-screen relative overflow-hidden flex flex-col font-sans">
      {/* Blueprint grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#eff6ff_1px,transparent_1px),linear-gradient(to_bottom,#eff6ff_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] opacity-70 pointer-events-none" />

      {/* ---------- HEADER ---------- */}
      <header className="w-full z-50 sticky top-0 bg-white/80 backdrop-blur-md border-b border-border-brand py-4">
        <div className="max-w-5xl w-[calc(100%-2rem)] mx-auto px-6 h-16 bg-white rounded-2xl border border-border-brand shadow-sm flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="text-xl font-bold tracking-tight" aria-label="PooLink home">
            <span className="text-brand">
              PooLink
            </span>
          </a>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-600">
            <a href="/offers" className="text-brand transition-colors">
              Emplois
            </a>
            <a href="/recruiter/login" className="hover:text-brand transition-colors">
              Recruteur
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {candidate ? (
              <button
                onClick={() => navigate('/candidate/profile')}
                className="h-10 px-4 rounded-xl border border-border-brand bg-white hover:bg-brand-light text-[13px] font-bold text-ink flex items-center gap-2 transition-all shadow-sm"
              >
                <div className="w-6 h-6 rounded-full bg-brand-light text-brand flex items-center justify-center font-extrabold text-xs">
                  {candidate.full_name ? candidate.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span>{candidate.full_name || 'Mon Profil'}</span>
              </button>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="h-10 px-5 text-[13px] font-semibold rounded-xl text-white bg-brand hover:bg-brand-hover active:scale-[0.98] transition-all duration-200 flex items-center gap-1.5"
              >
                Connexion
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ---------- HERO SECTION ---------- */}
      <section className="relative py-12 px-4 sm:px-6 lg:px-8 text-center z-10 max-w-4xl mx-auto mt-6">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
          Découvrez nos <span className="text-brand">opportunités d'emploi</span>
        </h1>
        <p className="text-lg text-slate-650 max-w-2xl mx-auto leading-relaxed font-normal">
          Explorez des postes à forte valeur ajoutée, postulez facilement et passez un entretien vidéo intelligent propulsé par l'IA de PooLink.
        </p>
      </section>

      {/* ---------- FILTERS & SEARCH ---------- */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pb-20 relative z-10">
        <div className="bg-white p-4 sm:p-6 rounded-3xl border border-border-brand shadow-xl mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search bar */}
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un poste, une entreprise ou une ville..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-border-brand rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
            />
          </div>

          {/* Contract Filter */}
          <div className="flex gap-2 w-full md:w-auto shrink-0 overflow-x-auto pb-1 md:pb-0">
            {['All', 'CDI', 'CDD', 'Stage', 'Freelance'].map((type) => (
              <button
                key={type}
                onClick={() => setContractFilter(type)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  (type === 'All' && contractFilter === 'All') || (contractFilter.toLowerCase() === type.toLowerCase())
                    ? 'bg-brand text-white shadow-md shadow-brand/20'
                    : 'bg-slate-50 text-gray-650 hover:bg-slate-105 border border-border-brand'
                }`}
              >
                {type === 'All' ? 'Tous les contrats' : type}
              </button>
            ))}
          </div>
        </div>

        {/* ---------- OFFERS LIST ---------- */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-405">
            <Loader2 className="w-10 h-10 animate-spin text-brand mb-4" />
            <p className="text-sm font-medium">Chargement des meilleures offres...</p>
          </div>
        ) : filteredOffers.length > 0 ? (
          <div className="space-y-4">
            {filteredOffers.map((offer) => (
              <div
                key={offer.id}
                onClick={() => handleApplyClick(offer.public_slug)}
                className="bg-white border border-border-brand rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-xl hover:border-brand/40 hover:-translate-y-1 transform transition-all duration-300 cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
              >
                {/* Offer Details */}
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-light border border-brand/20 text-brand font-bold text-sm shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-extrabold text-ink leading-snug">
                        {offer.title}
                      </h3>
                      <p className="text-sm font-semibold text-slate-500 mt-0.5">
                        {offer.company_name || 'Entreprise Confidentielle'}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-slate-650 line-clamp-2 leading-relaxed">
                    {offer.main_mission || offer.description || "Aucune description fournie pour ce poste. Cliquez pour en savoir plus."}
                  </p>

                  {/* Metadata tags */}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    {offer.location && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-50 border border-border-brand text-xs font-semibold text-slate-550">
                        <MapPin className="w-3 h-3 text-brand" />
                        {offer.location}
                      </span>
                    )}
                    {offer.contract_type && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-brand-light border border-brand/20 text-xs font-bold text-brand">
                        <Briefcase className="w-3 h-3" />
                        {offer.contract_type}
                      </span>
                    )}
                    {offer.experience_level && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-50 border border-amber-100 text-xs font-semibold text-amber-700">
                        <Calendar className="w-3 h-3" />
                        {offer.experience_level}
                      </span>
                    )}
                  </div>
                </div>

                {/* Apply Button Action */}
                <div className="w-full md:w-auto shrink-0 pt-2 md:pt-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApplyClick(offer.public_slug);
                    }}
                    className="w-full md:w-auto inline-flex items-center justify-center px-6 py-3.5 bg-slate-900 hover:bg-brand text-white rounded-2xl text-xs font-bold transition-all duration-300 gap-1.5 shadow-md hover:shadow-lg hover:shadow-brand/10 active:scale-95"
                  >
                    Postuler maintenant
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-border-brand rounded-3xl p-12 text-center shadow-md max-w-md mx-auto relative overflow-hidden">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-border-brand flex items-center justify-center mx-auto mb-4">
              <Inbox className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-ink mb-1">Aucune offre disponible</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Nous n'avons pas trouvé d'offres correspondant à votre recherche. Essayez d'ajuster vos mots-clés ou le type de contrat.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setContractFilter('All');
              }}
              className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </main>

      {/* ---------- AUTH REQUIRED MODAL ---------- */}
      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
