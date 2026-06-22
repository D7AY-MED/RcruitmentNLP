'use client';

import { useState, useCallback } from 'react';
import { Briefcase } from 'lucide-react';
import { startInterview, continueInterview } from '../lib/api';
import SetupForm from './SetupForm';
import QASession from './QASession';
import CompletedScreen from './CompletedScreen';
import type { InterviewStatus } from '../lib/types';

interface InterviewViewProps {
  jobTitle: string;
  companyName: string;
}

export default function InterviewView({ jobTitle, companyName }: InterviewViewProps) {
  const [status, setStatus] = useState<InterviewStatus>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [responseId, setResponseId] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleStart = useCallback(async (formData: FormData) => {
    setIsStarting(true);
    setQuestion('');
    setErrorMessage(null);
    setStatus('active');

    try {
      const result = await startInterview(formData, (delta) => {
        setQuestion((prev) => prev + delta);
      });

      setSessionId(result.sessionId);
      setResponseId(result.responseId);
      setQuestion(result.question);
      setQuestionIndex(1);
    } catch (err: any) {
      setErrorMessage(err.message || 'Impossible de démarrer l\'entretien.');
      setIsStarting(false);
      return;
    } finally {
      setIsStarting(false);
    }
  }, []);

  const handleReset = useCallback(() => {
    setStatus('idle');
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

      if (result.completed) {
        setResponseId(result.responseId);
        setStatus('completed');
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
  }, [responseId, sessionId]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f4f4f4' }}>
      <header className="border-b border-gray-200/80 bg-white/90" style={{ backdropFilter: 'blur(16px)' }}>
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <span
            className="text-lg font-bold tracking-tight bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(to right, #2563EB, #60A5FA)' }}
          >
            PooLink
          </span>
          <span className="text-gray-300 text-sm">|</span>
          <span className="text-sm text-gray-500 font-medium truncate">{companyName}</span>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 sm:py-12">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
          {status === 'idle' && (
            <>
              <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Briefcase className="w-6 h-6 text-blue-600" />
                </div>
                <h1 className="text-xl font-bold text-gray-950 mb-2">
                  Entretien IA — {jobTitle}
                </h1>
                <p className="text-sm text-gray-500">
                  Téléversez votre CV pour que l&apos;IA personnalise les questions.
                </p>
              </div>
              <SetupForm onStart={handleStart} isStarting={isStarting} />
            </>
          )}

          {status === 'active' && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-lg font-bold text-gray-950 mb-1">
                  Entretien IA
                </h1>
                <p className="text-xs text-gray-400">{companyName} — {jobTitle}</p>
              </div>
              <QASession
                questionIndex={questionIndex}
                totalQuestions={15}
                question={question}
                onSubmit={handleAnswer}
                isSubmitting={isSubmitting}
                error={errorMessage}
                onReset={handleReset}
              />
            </>
          )}

          {status === 'completed' && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-lg font-bold text-gray-950 mb-1">
                  Entretien IA
                </h1>
                <p className="text-xs text-gray-400">{companyName} — {jobTitle}</p>
              </div>
              <CompletedScreen />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
