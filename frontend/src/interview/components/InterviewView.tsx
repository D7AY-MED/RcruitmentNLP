'use client';

import { useState, useCallback, useEffect } from 'react';
import { Briefcase, Loader2 } from 'lucide-react';
import { startInterview, continueInterview, getSessionStatus } from '../lib/api';
import SetupForm from './SetupForm';
import QASession from './QASession';
import CompletedScreen from './CompletedScreen';
import type { InterviewStatus } from '../lib/types';

interface InterviewViewProps {
  jobTitle: string;
  companyName: string;
  poolId: string;
  maxQuestions?: number;
}

type PageStatus = 'loading' | InterviewStatus;

export default function InterviewView({ jobTitle, companyName, poolId, maxQuestions = 15 }: InterviewViewProps) {
  const [pageStatus, setPageStatus] = useState<PageStatus>('loading');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [responseId, setResponseId] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    getSessionStatus(poolId).then((status) => {
      if (status.status === 'completed') {
        setPageStatus('completed');
      } else if (status.status === 'active') {
        setSessionId(status.sessionId);
        setResponseId(status.responseId);
        setQuestion(status.question);
        setQuestionIndex(status.sequence);
        setPageStatus('active');
      } else {
        setPageStatus('idle');
      }
    });
  }, [poolId]);

  const handleStart = useCallback(async (formData: FormData) => {
    setIsStarting(true);
    setQuestion('');
    setErrorMessage(null);

    formData.append('poolId', poolId);

    try {
      const result = await startInterview(formData, (delta) => {
        setQuestion((prev) => prev + delta);
      });

      setSessionId(result.sessionId);
      setResponseId(result.responseId);
      setQuestion(result.question);
      setQuestionIndex(1);
      setPageStatus('active');
    } catch (err: any) {
      setErrorMessage(err.message || 'Impossible de démarrer l\'entretien.');
      setIsStarting(false);
      return;
    } finally {
      setIsStarting(false);
    }
  }, [poolId]);

  const handleReset = useCallback(() => {
    setPageStatus('idle');
    setQuestion('');
    setQuestionIndex(0);
    setSessionId(null);
    setResponseId(null);
    setErrorMessage(null);
  }, []);

  const handleAnswer = useCallback(async (answer: string) => {
    if (!responseId || !sessionId) return;
    setIsSubmitting(true);
    setQuestion('');
    setErrorMessage(null);

    try {
      const result = await continueInterview(
        sessionId,
        responseId,
        answer,
        (delta) => {
          setQuestion((prev) => prev + delta);
        },
      );

      const isFinished = result.completed || questionIndex >= maxQuestions;

      if (isFinished) {
        setResponseId(result.responseId);
        setPageStatus('completed');
      } else {
        setResponseId(result.responseId);
        setQuestion(result.question || '');
        setQuestionIndex((prev) => prev + 1);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur lors de l\'envoi de la réponse.');
    } finally {
      setIsSubmitting(false);
    }
  }, [responseId, sessionId, questionIndex, maxQuestions]);

  if (pageStatus === 'loading') {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Chargement...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f7f9fb' }}>
      <header className="border-b border-gray-200/80 bg-white/90 sticky top-0 z-50" style={{ backdropFilter: 'blur(16px)' }}>
        <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 flex justify-between items-center w-full">
          <div className="flex items-center gap-3">
            <span
              className="text-xl font-bold tracking-tight bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(to right, #2563EB, #60A5FA)' }}
            >
              PooLink
            </span>
            <span className="text-gray-300 text-sm">|</span>
            <span className="text-sm text-gray-500 font-medium truncate max-w-[150px] sm:max-w-none">{companyName}</span>
          </div>
          <nav className="hidden md:flex gap-8 items-center text-sm font-semibold">
            <span className="text-gray-400 hover:text-blue-600 transition-colors cursor-pointer">Help Center</span>
            <span className="text-blue-600 transition-all duration-300 cursor-default">Interview Session</span>
          </nav>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full">
          {pageStatus === 'idle' && (
            <>
              {/* Header Section */}
              <section className="text-center mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-2">
                  Upload CV to start your interview
                </h1>
                <p className="text-sm sm:text-base text-gray-500 max-w-md mx-auto">
                  Welcome to your PooLink AI assessment. Please provide your professional details to begin the automated screening process.
                </p>
              </section>

              {/* Card Container */}
              <div className="bg-white border border-gray-200/80 rounded-2xl p-6 sm:p-8 shadow-sm">
                <SetupForm onStart={handleStart} isStarting={isStarting} />
              </div>
            </>
          )}

          {pageStatus === 'active' && (
            <QASession
              questionIndex={questionIndex}
              totalQuestions={maxQuestions}
              question={question}
              onSubmit={handleAnswer}
              isSubmitting={isSubmitting}
              error={errorMessage}
              onReset={handleReset}
            />
          )}

          {pageStatus === 'completed' && (
            <div className="bg-white border border-gray-200/80 rounded-2xl p-6 sm:p-8 shadow-sm">
              <div className="text-center mb-6">
                <h1 className="text-lg font-bold text-gray-950 mb-1">
                  Entretien IA
                </h1>
                <p className="text-xs text-gray-400">{companyName} — {jobTitle}</p>
              </div>
              <CompletedScreen />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-transparent py-8 mt-auto border-t border-gray-200/50">
        <div className="max-w-2xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-400 font-medium">
          <div>
            © 2026 PooLink. Secure & Private.
          </div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
