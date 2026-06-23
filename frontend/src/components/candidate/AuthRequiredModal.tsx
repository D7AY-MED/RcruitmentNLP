'use client';

import React from 'react';
import { Briefcase, UserPlus, LogIn, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthRequiredModal({ isOpen, onClose }: AuthRequiredModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal Content Card */}
      <div className="relative bg-white rounded-3xl max-w-md w-[calc(100%-2rem)] mx-auto p-8 shadow-2xl border border-gray-100 flex flex-col items-center text-center z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-full hover:bg-gray-50"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon in Blue Circle */}
        <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-6 shadow-sm">
          <Briefcase className="w-7 h-7" />
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-gray-950 mb-3">
          Entretien IA requis
        </h3>

        {/* Body Text */}
        <div className="space-y-2 mb-6">
          <p className="text-sm text-gray-600 leading-relaxed px-4">
            Cette offre d'emploi nécessite un <span className="font-semibold text-blue-600">entretien vidéo avec notre IA</span> dans le cadre du processus de recrutement.
          </p>
          <p className="text-[13px] text-gray-400">
            Pour postuler, vous devez d'abord créer un compte ou vous connecter.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 w-full px-2">
          {/* Create Account Button */}
          <Button
            className="w-full h-11 text-[14px] font-bold rounded-xl text-white hover:opacity-90 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(to right, #2563EB 70%, #60A5FA 130%)',
            }}
          >
            <UserPlus className="w-4 h-4" />
            Créer un compte
          </Button>

          {/* Already have an account Button */}
          <Button
            variant="outline"
            className="w-full h-11 text-[14px] font-bold rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            J'ai déjà un compte
          </Button>

          {/* Cancel text button */}
          <button
            onClick={onClose}
            className="mt-2 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors py-1"
          >
            Annuler
          </button>
        </div>

      </div>
    </div>
  );
}
