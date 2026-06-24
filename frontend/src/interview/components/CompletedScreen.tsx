'use client';

import { PartyPopper, User } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CompletedScreen() {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-6 shadow-sm">
        <PartyPopper className="w-8 h-8 text-green-500" />
      </div>

      <h2 className="text-xl font-bold text-gray-950 mb-3">
        Félicitations — Entretien terminé !
      </h2>

      <p className="text-sm text-gray-600 leading-relaxed max-w-sm mx-auto">
        Vous avez terminé l&apos;entretien avec succès. Votre profil est désormais
        entre les mains du recruteur, qui examinera vos réponses sous peu.
      </p>

      <p className="text-xs text-gray-400 mt-4">
        Nous vous remercions pour votre temps et votre participation.
      </p>

      <div className="mt-8 w-20 h-1 rounded-full bg-gray-200 mx-auto" />

      <div className="mt-8 pt-6 border-t border-gray-100">
        <p className="text-sm text-gray-600 leading-relaxed max-w-sm mx-auto">
          Complétez votre profil pour maximiser vos chances d&apos;obtenir ce poste.
        </p>
        <Link
          to="/candidate/profile"
          className="mt-4 inline-flex items-center gap-2 h-11 px-6 rounded-xl text-white font-bold text-sm transition-all active:scale-[0.98]"
          style={{ background: 'linear-gradient(to right, #2563EB 70%, #60A5FA 130%)' }}
        >
          <User className="w-4 h-4" />
          Compléter mon profil
        </Link>
      </div>
    </div>
  );
}
