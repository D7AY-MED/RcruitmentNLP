'use client';

import React, { useState } from 'react';
import { ArrowRight, Building2, MapPin, Share2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface JobSidebarProps {
  companyName: string;
  location?: string;
  companyDescription?: string;
  contractType?: string;
  experienceLevel?: string;
  educationLevel?: string;
  onApply?: () => void;
  isAuthenticated?: boolean;
}

export default function JobSidebar({
  companyName,
  location,
  companyDescription,
  contractType,
  experienceLevel,
  educationLevel,
  onApply,
  isAuthenticated = false,
}: JobSidebarProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  return (
    <aside className="md:col-span-1">
      <div className="md:sticky md:top-28 space-y-5">
        {/* Apply CTA (side-by-side with share button) */}
        <div className="flex items-center gap-2 w-full">
          <Button
            onClick={onApply}
            className="flex-1 h-11 text-[14px] font-semibold rounded-xl text-white bg-brand hover:bg-brand-hover active:scale-[0.98] transition-all duration-200"
          >
            {isAuthenticated ? 'Continuer la candidature' : 'Connectez-vous pour postuler'}
            <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            onClick={handleShare}
            className="w-11 h-11 shrink-0 p-0 flex items-center justify-center rounded-xl border border-border-brand bg-white dark:bg-card text-gray-700 dark:text-ink hover:bg-brand-light hover:text-brand hover:border-brand/35 transition-colors"
            title="Partager cette offre"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-600 animate-pulse" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Company card */}
        <div className="rounded-xl border border-border-brand bg-white dark:bg-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-brand-light border border-brand/20">
              <Building2
                className="w-5 h-5 text-brand"
                aria-hidden="true"
              />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-ink">
                {companyName}
              </h3>
              {location && (
                <p className="flex items-center gap-1 text-[13px] text-gray-500 dark:text-muted mt-0.5">
                  <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                  {location}
                </p>
              )}
            </div>
          </div>

          {companyDescription && (
            <p className="text-[13px] text-gray-605 dark:text-ink leading-relaxed mb-4">
              {companyDescription}
            </p>
          )}

          <a
            href="#"
            className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand hover:text-brand-hover transition-colors"
          >
            En savoir plus sur l&apos;entreprise
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        </div>

        {/* Quick info card */}
        <div className="rounded-xl border border-border-brand bg-white dark:bg-card p-5">
          <h4 className="text-[13px] font-bold text-ink mb-3">
            Informations clés
          </h4>
          <ul className="space-y-2.5 text-[13px] text-gray-605 dark:text-ink">
            {location && (
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5 shrink-0" />
                Lieu : {location}
              </li>
            )}
            {contractType && (
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5 shrink-0" />
                Contrat : {contractType}
              </li>
            )}
            {experienceLevel && (
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5 shrink-0" />
                Expérience : {experienceLevel}
              </li>
            )}
            {educationLevel && (
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5 shrink-0" />
                Études : {educationLevel}
              </li>
            )}
          </ul>
        </div>
      </div>
    </aside>
  );
}
