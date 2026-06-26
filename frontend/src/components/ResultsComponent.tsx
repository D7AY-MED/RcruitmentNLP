'use client';

import { Candidate } from '@/lib/types';

interface ResultsComponentProps {
  candidates: Candidate[];
  searchId: string;
  hrProfileId: string;
  onUnlockComplete?: (unlockedCandidates: Array<Pick<Candidate, 'id'> & Partial<Pick<Candidate, 'name' | 'phone' | 'email' | 'cv_url'>>>) => void;
  onCandidateDetails?: (candidateDetails: Array<Pick<Candidate, 'id'> & Partial<Pick<Candidate, 'name' | 'phone' | 'email' | 'cv_url'>>>) => void;
}

export default function ResultsComponent({ 
  candidates, 
  searchId, 
  hrProfileId,
  onUnlockComplete,
  onCandidateDetails,
}: ResultsComponentProps) {

  if (candidates.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border border-border-brand shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-ink">Top Matching Candidates</h2>
        <p className="text-sm text-gray-500 mt-1">Ranked by AI matching score and query relevance</p>
      </div>

      <div className="space-y-5">
        {candidates.map((candidate, index) => {
          return (
            <div
              key={candidate.id}
              className="border border-border-brand rounded-2xl p-5 hover:border-brand/40 hover:shadow-sm transition-all duration-200 bg-white"
            >
              {/* Header row: Rank Badge + Name on Left, CV link on Right */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4 pb-3 border-b border-border-brand">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center bg-brand-light text-brand text-xs font-bold px-2.5 py-1 rounded-xl border border-brand/20">
                    Match #{index + 1}
                  </span>
                  <h3 className="text-lg font-bold text-ink">
                    {candidate.name || 'Unknown Candidate'}
                  </h3>
                </div>
                
                <div className="flex items-center gap-2">
                  {candidate.cv_url && candidate.cv_url !== '#' && (
                    <a
                      href={candidate.cv_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center bg-brand text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold hover:bg-brand-hover transition-colors"
                    >
                      Open CV (new tab)
                    </a>
                  )}
                  {(!candidate.cv_url || candidate.cv_url === '#') && (
                    <span className="inline-flex items-center justify-center bg-gray-100 text-gray-500 px-3 py-1.5 rounded-xl text-xs font-semibold">
                      CV not available
                    </span>
                  )}
                </div>
              </div>

              {/* Body Content */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Summary</h4>
                  <p className="text-sm text-gray-750 mt-1.5 leading-relaxed">{candidate.summary}</p>
                </div>

                {candidate.matchDescription && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                      ✨ Why This Candidate Matches
                    </h4>
                    <p className="text-sm text-emerald-950 mt-1.5 leading-relaxed">{candidate.matchDescription}</p>
                  </div>
                )}

                {/* Footer details: contact information */}
                <div className="pt-3 border-t border-border-brand">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-455">Phone</p>
                      <p className="text-sm text-ink font-semibold mt-0.5">{candidate.phone || 'Not available'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-455">Email</p>
                      <p className="text-sm text-ink font-semibold mt-0.5">{candidate.email || 'Not available'}</p>
                    </div>
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
