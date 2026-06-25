'use client';

import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import SearchComponent from '@/components/SearchComponent';
import ResultsComponent from '@/components/ResultsComponent';
import { Candidate, SearchHistoryItem } from '@/lib/types';
import { getSearchHistory, getSearchHistoryDetails } from '@/lib/frontendData';
import { useRecruiter, useRecruiterContext } from '@/lib/recruiter-context';
import AppHeader from '@/components/AppHeader';
import AppSidebar from '@/components/AppSidebar';

export default function DashboardPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searchId, setSearchId] = useState<string>('');
  const [historyItems, setHistoryItems] = useState<SearchHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [openingHistoryId, setOpeningHistoryId] = useState<string | null>(null);
  const user = useRecruiter();
  const { refreshUser } = useRecruiterContext();
  const hrProfileId = user.id;

  const fetchSearchHistory = async () => {
    setHistoryLoading(true);
    setHistoryItems(getSearchHistory());
    setHistoryLoading(false);
  };

  const handleOpenHistory = async (item: SearchHistoryItem) => {
    setOpeningHistoryId(item.id);
    const data = getSearchHistoryDetails(item.id);
    setSearchId(data.searchId || item.id);
    setCandidates(Array.isArray(data.candidates) ? data.candidates : []);
    setOpeningHistoryId(null);
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
    <div className="flex min-h-screen bg-gray-50">
      <AppSidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Toaster position="top-right" />

        <AppHeader user={user} hrProfileId={hrProfileId} onProfileSaved={refreshUser} />

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sticky top-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Search History</h2>
                  <button
                    onClick={fetchSearchHistory}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Refresh
                  </button>
                </div>

                {historyLoading ? (
                  <div className="text-sm text-gray-500">Loading history...</div>
                ) : historyItems.length === 0 ? (
                  <div className="text-sm text-gray-500">
                    No previous searches yet. Your recent matching runs will appear here.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
                    {historyItems.map((item) => {
                      const isActive = item.id === searchId;
                      return (
                        <article
                          key={item.id}
                          className={`rounded-lg border p-3 transition ${
                            isActive ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <p className="text-xs text-gray-500">
                              {new Date(item.createdAt).toLocaleString()}
                            </p>
                            <span className="text-[10px] px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                              {item.unlockedCount}/{item.topCount} unlocked
                            </span>
                          </div>
                          <p className="text-sm text-gray-800 line-clamp-3 mb-3">
                            {item.queryDescription}
                          </p>
                          <button
                            onClick={() => handleOpenHistory(item)}
                            disabled={openingHistoryId === item.id}
                            className="w-full text-sm font-medium px-3 py-2 rounded-md bg-gray-900 text-white hover:bg-black disabled:opacity-60"
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
        </main>

        <footer className="bg-white border-t border-gray-200 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <p className="text-center text-sm text-gray-500">
              HR Dashboard - Candidate Matching System
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
