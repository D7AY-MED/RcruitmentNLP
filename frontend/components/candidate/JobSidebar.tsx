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
}

export default function JobSidebar({
  companyName,
  location,
  companyDescription,
  contractType,
  experienceLevel,
  educationLevel,
  onApply,
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
            className="flex-1 h-11 text-[14px] font-semibold rounded-lg text-white hover:opacity-90 active:scale-[0.98] transition-all duration-200"
            style={{
              background: 'linear-gradient(to right, #2563EB 70%, #60A5FA 130%)',
            }}
          >
            Postuler
            <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            onClick={handleShare}
            className="w-11 h-11 shrink-0 p-0 flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
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
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 border border-blue-100">
              <Building2
                className="w-5 h-5 text-blue-600"
                aria-hidden="true"
              />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-gray-900">
                {companyName}
              </h3>
              {location && (
                <p className="flex items-center gap-1 text-[13px] text-gray-500 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                  {location}
                </p>
              )}
            </div>
          </div>

          {companyDescription && (
            <p className="text-[13px] text-gray-600 leading-relaxed mb-4">
              {companyDescription}
            </p>
          )}

          <a
            href="#"
            className="inline-flex items-center gap-1 text-[13px] font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            En savoir plus sur l&apos;entreprise
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        </div>

        {/* Quick info card */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h4 className="text-[13px] font-semibold text-gray-900 mb-3">
            Informations clés
          </h4>
          <ul className="space-y-2.5 text-[13px] text-gray-600">
            {location && (
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                Lieu : {location}
              </li>
            )}
            {contractType && (
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                Contrat : {contractType}
              </li>
            )}
            {experienceLevel && (
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                Expérience : {experienceLevel}
              </li>
            )}
            {educationLevel && (
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                Études : {educationLevel}
              </li>
            )}
          </ul>
        </div>
      </div>
    </aside>
  );
}
