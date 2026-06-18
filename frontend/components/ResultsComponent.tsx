'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Candidate } from '@/lib/types';

interface ResultsComponentProps {
  candidates: Candidate[];
  searchId: string;
  hrProfileId: string;
  onUnlockComplete: (unlockedCandidates: Array<Pick<Candidate, 'id'> & Partial<Pick<Candidate, 'name' | 'phone' | 'email' | 'cv_url'>>>) => void;
  onCandidateDetails?: (candidateDetails: Array<Pick<Candidate, 'id'> & Partial<Pick<Candidate, 'name' | 'phone' | 'email' | 'cv_url'>>>) => void;
}

export default function ResultsComponent({ 
  candidates, 
  searchId, 
  hrProfileId,
  onUnlockComplete,
  onCandidateDetails,
}: ResultsComponentProps) {
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockedCandidateIds, setUnlockedCandidateIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchUnlockedCandidates();
  }, [searchId]);

  const fetchUnlockedCandidates = async () => {
    setUnlockedCandidateIds(new Set());
  };

  const handleUnlock = async () => {
    setIsUnlocking(true);
    try {
      const candidateIds = candidates.map(c => c.id);

      toast.success('Candidates unlocked successfully!');
      setUnlockedCandidateIds(new Set(candidateIds));
      onUnlockComplete(candidates);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unlock failed');
    } finally {
      setIsUnlocking(false);
    }
  };

  if (candidates.length === 0) {
    return null;
  }

  const allUnlocked = candidates.every(c => unlockedCandidateIds.has(c.id));

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Top 5 Matching Candidates</h2>
        {!allUnlocked && (
          <button
            onClick={handleUnlock}
            disabled={isUnlocking}
            className="bg-green-600 text-white px-6 py-3 rounded-md font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isUnlocking ? 'Unlocking...' : 'Unlock 5 Profiles (1 Credit)'}
          </button>
        )}
      </div>

      <div className="space-y-4">
        {candidates.map((candidate, index) => {
          const isUnlocked = unlockedCandidateIds.has(candidate.id);
          
          return (
            <div
              key={candidate.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-medium text-gray-900">
                  Candidate {index + 1}
                </h3>
                <div className="flex items-center gap-2">
                  {isUnlocked && candidate.cv_url && (
                    <a
                      href={candidate.cv_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Open CV (new tab)
                    </a>
                  )}
                  {isUnlocked && !candidate.cv_url && (
                    <span className="inline-flex items-center justify-center bg-gray-100 text-gray-600 px-3 py-1.5 rounded-md text-xs font-semibold">
                      CV not available
                    </span>
                  )}
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    isUnlocked 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {isUnlocked ? 'Unlocked' : 'Locked'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-700">Summary</p>
                  <p className="text-sm text-gray-600 mt-1">{candidate.summary}</p>
                </div>

                {candidate.matchDescription && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3 mt-2">
                    <p className="text-sm font-medium text-green-800 flex items-center gap-1">
                      ✅ Why This Candidate
                    </p>
                    <p className="text-sm text-green-700 mt-1">{candidate.matchDescription}</p>
                  </div>
                )}


                <div className={`space-y-1 ${!isUnlocked ? 'filter blur-sm select-none' : ''}`}>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Name</p>
                    <p className="text-sm text-gray-600">{candidate.name || 'Not available'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Phone</p>
                    <p className="text-sm text-gray-600">{candidate.phone || 'Not available'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Email</p>
                    <p className="text-sm text-gray-600">{candidate.email || 'Not available'}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
