'use client';

import { FormEvent, useState } from 'react';
import { Loader2, Send } from 'lucide-react';

interface QASessionProps {
  questionIndex: number;
  totalQuestions: number;
  question: string;
  onSubmit: (answer: string) => Promise<void>;
  isSubmitting: boolean;
  error?: string | null;
  onReset?: () => void;
}

export default function QASession({
  questionIndex,
  totalQuestions,
  question,
  onSubmit,
  isSubmitting,
  error,
  onReset,
}: QASessionProps) {
  const [answer, setAnswer] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const displayError = error || localError;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!answer.trim()) return;

    try {
      await onSubmit(answer.trim());
      setAnswer('');
    } catch (err: any) {
      setLocalError(err.message || 'Erreur lors de l\'envoi.');
    }
  };

  const canRetry = !!error && !!onReset;
  const showAnswerForm = questionIndex > 0 && !canRetry;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Question {questionIndex || '?'} sur {totalQuestions}
        </span>
        <span className="text-xs font-medium text-gray-400">
          {questionIndex > 0 ? `${Math.round((questionIndex / totalQuestions) * 100)}%` : '---'}
        </span>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-white border border-blue-100 p-6">
        <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
          {question || 'Chargement de la question...'}
        </div>
      </div>

      {displayError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {displayError}
        </div>
      )}

      {canRetry && (
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-3">
            L&apos;entretien n&apos;a pas pu démarrer correctement. Vous pouvez réessayer.
          </p>
          <button
            onClick={onReset}
            className="h-11 px-6 rounded-xl text-white font-bold text-sm transition-all active:scale-[0.98]"
            style={{ background: 'linear-gradient(to right, #2563EB 70%, #60A5FA 130%)' }}
          >
            Réessayer
          </button>
        </div>
      )}

      {showAnswerForm && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Votre réponse
            </label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Tapez votre réponse ici..."
              rows={4}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 focus:bg-white focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all resize-none"
              autoComplete="off"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !answer.trim()}
            className="w-full h-12 rounded-xl text-white font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: 'linear-gradient(to right, #2563EB 70%, #60A5FA 130%)' }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Envoyer la réponse
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
