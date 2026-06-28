'use client';

import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import SearchComponent from '@/components/SearchComponent';
import ResultsComponent from '@/components/ResultsComponent';
import { Candidate, SearchHistoryItem } from '@/lib/types';
import { listSearchHistory, getSearchHistoryDetails } from '@/lib/jobPoolService';
import { useRecruiter } from '@/lib/recruiter-context';
import { PageHeader } from '@/shared/components';

export default function DashboardPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searchId, setSearchId] = useState<string>('');
  const [historyItems, setHistoryItems] = useState<SearchHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [openingHistoryId, setOpeningHistoryId] = useState<string | null>(null);
  const user = useRecruiter();
  const hrProfileId = user.id;

  const fetchSearchHistory = async () => {
    setHistoryLoading(true);
    try {
      const history = await listSearchHistory();
      // Map any missing pool_title or fields
      setHistoryItems(history);
    } catch (error) {
      console.error('Failed to fetch search history', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleOpenHistory = async (item: SearchHistoryItem) => {
    setOpeningHistoryId(item.id);
    try {
      const data = await getSearchHistoryDetails(item.id);
      setSearchId(data.searchId || item.id);
      setCandidates(Array.isArray(data.candidates) ? data.candidates : []);
    } catch (error) {
      console.error('Failed to open search history details', error);
    } finally {
      setOpeningHistoryId(null);
    }
  };

  useEffect(() => {
    fetchSearchHistory();
  }, []);

  const mergeCandidateDetails = (
    unlockedCandidates: Array<Pick<Candidate, 'id'> & Partial<Pick<Candidate, 'name' | 'phone' | 'email' | 'cv_url'>>>
  ) => {
    if (unlockedCandidates.length === 0) return;

    const detailsById = new Map(unlockedCandidates.map(c => [c.id, c] as const));
    setCandidates(prev =>
      prev.map(c => {
        const details = detailsById.get(c.id);
        if (!details) return c;

        return {
          ...c,
          ...(details.name ? { name: details.name } : {}),
          ...(details.phone ? { phone: details.phone } : {}),
          ...(details.email ? { email: details.email } : {}),
          ...(details.cv_url ? { cv_url: details.cv_url } : {}),
        };
      })
    );
  };

  const handleSearchComplete = (newCandidates: Candidate[], newSearchId: string) => {
    setCandidates(newCandidates);
    setSearchId(newSearchId);
    fetchSearchHistory();
  };

  const handleUnlockComplete = (
    unlockedCandidates: Array<Pick<Candidate, 'id'> & Partial<Pick<Candidate, 'name' | 'phone' | 'email' | 'cv_url'>>>
  ) => {
    mergeCandidateDetails(unlockedCandidates);
  };

  return (
    <div>
      <Toaster position="top-right" />
      <PageHeader title="Recherche de candidats" subtitle="Matching sémantique propulsé par l'IA." />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <SearchComponent
                hrProfileId={hrProfileId}
                onSearchComplete={handleSearchComplete}
              />

              {candidates.length > 0 && (
                <ResultsComponent
                  candidates={candidates}
                  searchId={searchId}
                  hrProfileId={hrProfileId}
                  onUnlockComplete={handleUnlockComplete}
                  onCandidateDetails={mergeCandidateDetails}
                />
              )}
            </div>

            <aside className="lg:col-span-1">
              <section className="bg-white dark:bg-card rounded-2xl border border-border-brand shadow-sm p-5 sticky top-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-ink">Search History</h2>
                  <button
                    onClick={fetchSearchHistory}
                    className="text-xs text-brand hover:text-brand-hover font-semibold transition-colors"
                  >
                    Refresh
                  </button>
                </div>

                {historyLoading ? (
                  <div className="text-sm text-gray-500 dark:text-muted">Loading history...</div>
                ) : historyItems.length === 0 ? (
                  <div className="text-sm text-gray-500 dark:text-muted">
                    No previous searches yet. Your recent matching runs will appear here.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
                    {historyItems.map((item: any) => {
                      const isActive = item.id === searchId;
                      return (
                        <article
                          key={item.id}
                          className={`rounded-xl border p-3 transition ${
                            isActive ? 'border-brand/40 bg-brand-light' : 'border-border-brand bg-white dark:bg-card'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-xs text-gray-400 dark:text-muted">
                              {new Date(item.createdAt).toLocaleString()}
                            </p>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-light text-brand font-bold border border-brand/10">
                              {item.topCount} candidates
                            </span>
                          </div>
                          {item.pool_title && (
                            <p className="text-xs font-bold text-brand mb-1">
                              Pool: {item.pool_title}
                            </p>
                          )}
                          <p className="text-sm text-gray-705 dark:text-ink line-clamp-3 mb-3 leading-relaxed">
                            {item.queryDescription}
                          </p>
                          <button
                            onClick={() => handleOpenHistory(item)}
                            disabled={openingHistoryId === item.id}
                            className="w-full text-sm font-semibold px-3 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white transition-all disabled:opacity-60"
                          >
                            {openingHistoryId === item.id ? 'Opening...' : 'Open Search'}
                          </button>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            </aside>
      </div>
    </div>
  );
}
