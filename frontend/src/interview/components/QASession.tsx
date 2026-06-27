'use client';

import { FormEvent, useState, ChangeEvent } from 'react';
import { Loader2, ArrowRight, Brain, List, Paperclip, Info, RefreshCw } from 'lucide-react';

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
  const [wordCount, setWordCount] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);
  const displayError = error || localError;

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setAnswer(val);
    const text = val.trim();
    const words = text ? text.split(/\s+/).length : 0;
    setWordCount(words);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!answer.trim() || isSubmitting) return;

    try {
      await onSubmit(answer.trim());
      setAnswer('');
      setWordCount(0);
    } catch (err: any) {
      setLocalError(err.message || 'Erreur lors de l\'envoi.');
    }
  };

  const canRetry = !!error && !!onReset;
  const showAnswerForm = questionIndex > 0 && !canRetry;
  const progressPercent = totalQuestions > 0 ? Math.min(100, Math.max(0, (questionIndex / totalQuestions) * 100)) : 0;

  return (
    <div className="space-y-8 w-full">
      {/* Progress Indicator */}
      <div className="w-full">
        <div className="flex justify-between items-end mb-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Assessment Phase
          </span>
          <span className="text-sm text-blue-600 font-semibold">
            Question {questionIndex || '?'} of {totalQuestions}
          </span>
        </div>
        <div className="w-full h-1 bg-gray-200/60 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <section className="space-y-6">
        <div className="bg-white border border-gray-200/80 p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-start gap-4">
            <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl shrink-0 border border-blue-100/50">
              <Brain className="w-6 h-6 fill-current animate-pulse" />
            </div>
            <div className="space-y-2">
              <p className="text-base text-gray-600 leading-relaxed whitespace-pre-line">
                {question || 'Chargement de la question...'}
              </p>
            </div>
          </div>
        </div>

        {displayError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {displayError}
          </div>
        )}

        {canRetry && (
          <div className="text-center bg-white border border-gray-200/80 rounded-2xl p-8 shadow-sm">
            <p className="text-sm text-gray-500 mb-4">
              L&apos;entretien n&apos;a pas pu démarrer correctement. Vous pouvez réessayer.
            </p>
            <button
              onClick={onReset}
              className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-blue-600 text-white font-semibold text-sm transition-all hover:bg-blue-700 active:scale-[0.98]"
            >
              <RefreshCw className="w-4 h-4" />
              Réessayer
            </button>
          </div>
        )}

        {showAnswerForm && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Candidate Response Area */}
            <div className="relative group">
              {/* Glowing focus border background decoration */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/10 to-transparent rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
              
              <div className="relative bg-white border border-gray-200 rounded-2xl overflow-hidden focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-100 transition-all duration-300">
                <textarea
                  value={answer}
                  onChange={handleInputChange}
                  placeholder="Type your answer here..."
                  className="w-full min-h-[250px] p-6 text-base text-gray-700 bg-transparent border-none focus:ring-0 resize-none placeholder:text-gray-400/60"
                  autoComplete="off"
                  disabled={isSubmitting}
                  required
                />
                
                {/* Text Area Footer Tools */}
                <div className="flex justify-end items-center px-6 py-4 bg-gray-50/50 border-t border-gray-100">
                  <span className="text-xs font-semibold text-gray-400">
                    {wordCount} {wordCount === 1 ? 'word' : 'words'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Section */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2 text-gray-400/80">
                <Info className="w-4 h-4 shrink-0 text-gray-400" />
                <p className="text-xs font-medium">Your answer is automatically saved as you type.</p>
              </div>
              
              <div className="w-full sm:w-auto">
                <button
                  type="submit"
                  disabled={isSubmitting || !answer.trim()}
                  className="w-full sm:w-auto h-12 px-8 rounded-full font-semibold text-sm bg-blue-600 text-white shadow-sm hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 group"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <span>Submit Answer</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
