'use client';

import React from 'react';
import { BrandLogo } from '@/shared/components';
import {
  FileText,
  MapPin,
  Calendar,
  Globe,
  GraduationCap,
  Building2,
  Search,
  LogIn,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ThemeToggle';

export interface JobHeroProps {
  title: string;
  companyName: string;
  location?: string;
  contractType?: string;
  salaryRange?: string;
  experienceLevel?: string;
  languages?: string;
  educationLevel?: string;
  sector?: string;
  publishDate?: string;
  isAuthenticated?: boolean;
  candidateName?: string;
  candidateEmail?: string;
  onProfile?: () => void;
  onConnexion?: () => void;
}

function MetaTag({
  icon: Icon,
  name,
  value,
}: {
  icon: React.ElementType;
  name: string;
  value: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border-brand bg-white dark:bg-card px-3 py-1.5 text-[13px] font-medium text-gray-500 dark:text-muted shadow-sm">
      <Icon className="w-3.5 h-3.5 text-brand" aria-hidden="true" />
      <span>
        {name} <span className="font-bold text-gray-900 dark:text-ink">{value}</span>
      </span>
    </span>
  );
}

export default function JobHeroSection({
  title,
  companyName,
  location,
  contractType,
  salaryRange,
  experienceLevel,
  languages,
  educationLevel,
  sector = 'Conseil & Audit',
  publishDate = 'Publiée il y a 18 jours',
  isAuthenticated = false,
  candidateName,
  candidateEmail,
  onProfile,
  onConnexion,
}: JobHeroProps) {
  return (
    <section className="relative bg-white dark:bg-card border-b border-gray-200 dark:border-border-brand overflow-hidden pb-12 sm:pb-14">
      {/* Blueprint grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#eff6ff_1px,transparent_1px),linear-gradient(to_bottom,#eff6ff_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] opacity-70" />

      {/* ---------- HEADER ---------- */}
      <div className="max-w-5xl w-[calc(100%-2rem)] mx-auto mt-4 px-6 h-16 bg-white dark:bg-card rounded-2xl border border-border-brand shadow-sm flex items-center justify-between z-50 relative">
        {/* Logo */}
        <a href="/" className="inline-flex items-center" aria-label="Accueil">
          <BrandLogo className="h-7" />
        </a>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <button className="text-gray-400 dark:text-muted hover:text-brand transition-colors p-1" aria-label="Recherche">
            <Search className="w-5 h-5" />
          </button>
          {isAuthenticated ? (
            <button
              onClick={onProfile}
              className="h-10 px-4 rounded-xl border border-border-brand bg-white dark:bg-card hover:bg-brand-light text-[13px] font-bold text-ink flex items-center gap-2 transition-all shadow-sm"
            >
              <div className="w-6 h-6 rounded-full bg-brand-light text-brand flex items-center justify-center font-extrabold text-xs">
                {candidateName ? candidateName.charAt(0).toUpperCase() : 'U'}
              </div>
              <span>{candidateName || 'Mon Profil'}</span>
            </button>
          ) : (
            <Button
              onClick={onConnexion}
              className="h-10 px-5 text-[13px] font-semibold rounded-xl text-white bg-brand hover:bg-brand-hover active:scale-[0.98] transition-all duration-200 flex items-center gap-1.5"
            >
              <LogIn className="w-4 h-4" />
              Connexion
            </Button>
          )}
        </div>
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 flex flex-col items-center text-center">
        {/* Company Detail Header Block */}
        <div className="flex items-center gap-3 mb-6 bg-white/50 dark:bg-card/50 backdrop-blur-sm p-2 pr-4 rounded-2xl border border-border-brand">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-brand-light border border-brand/20 text-brand font-bold text-base shrink-0 shadow-sm">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="text-left">
            <div className="font-bold text-gray-900 dark:text-ink text-sm">
              {companyName}
            </div>
            <div className="text-xs text-gray-500 dark:text-muted flex items-center gap-1.5 flex-wrap mt-0.5 font-medium">
              <span>{sector}</span>
              <span className="text-gray-300 dark:text-muted">•</span>
              <span>{location}</span>
              <span className="text-gray-300 dark:text-muted">•</span>
              <span className="text-gray-500 dark:text-muted">{publishDate}</span>
            </div>
          </div>
        </div>

        {/* Job title */}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-ink max-w-2xl mx-auto leading-tight">
          {title}
        </h1>

        {/* Metadata tags */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
          {contractType && <MetaTag icon={FileText} name="Type de contrat" value={contractType} />}
          {location && <MetaTag icon={MapPin} name="Lieu de travail" value={location} />}
          {experienceLevel && <MetaTag icon={Calendar} name="Expérience" value={experienceLevel} />}
          {languages && <MetaTag icon={Globe} name="Langues" value={languages} />}
          {educationLevel && <MetaTag icon={GraduationCap} name="Niveau d'étude" value={educationLevel} />}
        </div>
      </div>
    </section>
  );
}
