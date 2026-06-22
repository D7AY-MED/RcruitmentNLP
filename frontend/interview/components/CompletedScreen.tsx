'use client';

import { CheckCircle2 } from 'lucide-react';

export default function CompletedScreen() {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-6 shadow-sm">
        <CheckCircle2 className="w-8 h-8 text-green-500" />
      </div>

      <h2 className="text-xl font-bold text-gray-950 mb-3">
        Entretien terminé
      </h2>

      <p className="text-sm text-gray-600 leading-relaxed max-w-sm mx-auto">
        Merci pour votre temps. Vos réponses ont bien été enregistrées et sont désormais visibles par le recruteur.
      </p>

      <div className="mt-8 w-20 h-1 rounded-full bg-gray-200 mx-auto" />
    </div>
  );
}
