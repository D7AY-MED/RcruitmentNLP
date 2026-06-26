'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Candidate, JobPool } from '@/lib/types';
import { listJobPools, searchCandidates } from '@/lib/jobPoolService';

interface SearchComponentProps {
  hrProfileId: string;
  onSearchComplete: (candidates: Candidate[], searchId: string) => void;
}

export default function SearchComponent({ hrProfileId, onSearchComplete }: SearchComponentProps) {
  const [pools, setPools] = useState<JobPool[]>([]);
  const [selectedPoolId, setSelectedPoolId] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingPools, setIsLoadingPools] = useState(false);

  // Fetch job pools on mount
  useEffect(() => {
    async function fetchPools() {
      setIsLoadingPools(true);
      try {
        const list = await listJobPools();
        setPools(list);
        if (list.length > 0) {
          setSelectedPoolId(list[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch job pools', error);
        toast.error('Failed to load job pools');
      } finally {
        setIsLoadingPools(false);
      }
    }
    fetchPools();
  }, []);

  const handleSearch = async () => {
    if (!selectedPoolId) {
      toast.error('Please select a job pool');
      return;
    }
    if (!jobDescription.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setIsSearching(true);
    try {
      const data = await searchCandidates(selectedPoolId, jobDescription);
      onSearchComplete(data.candidates, data.searchId);
      toast.success('Search completed successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-border-brand shadow-sm p-6">
      <h2 className="text-xl font-bold text-ink mb-4">Search Candidates</h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="poolSelect" className="block text-sm font-semibold text-gray-700 mb-2">
            Select Job Pool
          </label>
          {isLoadingPools ? (
            <div className="text-sm text-gray-500 py-2">Loading job pools...</div>
          ) : pools.length === 0 ? (
            <div className="text-sm text-red-500 py-2">No active job pools found. Please create a job pool first.</div>
          ) : (
            <select
              id="poolSelect"
              className="w-full px-3 py-2.5 border border-border-brand rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/35 focus:border-brand bg-white text-ink transition-all"
              value={selectedPoolId}
              onChange={(e) => setSelectedPoolId(e.target.value)}
              disabled={isSearching}
            >
              {pools.map((pool) => (
                <option key={pool.id} value={pool.id}>
                  {pool.title} {pool.gemini_store_name ? '' : '(No vector store)'}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label htmlFor="jobDescription" className="block text-sm font-semibold text-gray-700 mb-2">
            Search Query / Criteria
          </label>
          <textarea
            id="jobDescription"
            rows={6}
            className="w-full px-3 py-2.5 border border-border-brand rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/35 focus:border-brand transition-all"
            placeholder="Describe the profile you are looking for (e.g., 'React developer with 3 years of experience' or 'Python FastAPI backend engineer')..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            disabled={isSearching || pools.length === 0}
          />
        </div>
        
        <button
          onClick={handleSearch}
          disabled={isSearching || pools.length === 0}
          className="w-full bg-brand text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-hover disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
        >
          {isSearching ? 'Searching Store...' : 'Search Candidates'}
        </button>
      </div>
    </div>
  );
}
