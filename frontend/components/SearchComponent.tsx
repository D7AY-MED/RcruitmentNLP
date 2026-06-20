'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Candidate } from '@/lib/types';
import { searchCandidates } from '@/lib/frontendData';

interface SearchComponentProps {
  hrProfileId: string;
  onSearchComplete: (candidates: Candidate[], searchId: string) => void;
}

export default function SearchComponent({ hrProfileId, onSearchComplete }: SearchComponentProps) {
  const [jobDescription, setJobDescription] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!jobDescription.trim()) {
      toast.error('Please enter a job description');
      return;
    }

    setIsSearching(true);
    try {
      const data = searchCandidates(jobDescription);
      onSearchComplete(data.candidates, data.searchId);
      toast.success('Search completed successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Search Candidates</h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700 mb-2">
            Job Description
          </label>
          <textarea
            id="jobDescription"
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter the job description to find matching candidates..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            disabled={isSearching}
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isSearching ? 'Searching...' : 'Search Candidates'}
        </button>
      </div>
    </div>
  );
}
