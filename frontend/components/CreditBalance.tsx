'use client';

import { useEffect, useState } from 'react';
import { Coins } from 'lucide-react';
import { getCreditBalance } from '@/lib/frontendData';

interface CreditBalanceProps {
  hrProfileId: string;
  refreshTrigger?: number;
  isCollapsed?: boolean;
}

export default function CreditBalance({ hrProfileId, refreshTrigger = 0, isCollapsed = false }: CreditBalanceProps) {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBalance();
  }, [hrProfileId, refreshTrigger]);

  const fetchBalance = async () => {
    try {
      setBalance(getCreditBalance());
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    } finally {
      setLoading(false);
    }
  }

  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center justify-center p-2 bg-indigo-50 rounded-lg shadow-sm" title={`Available Credits: ${balance ?? 0}`}>
        <Coins className="w-5 h-5 text-indigo-600 mb-1" />
        {loading ? (
          <span className="text-xs text-gray-500">...</span>
        ) : (
          <span className="text-sm font-bold text-indigo-700">{balance ?? 0}</span>
        )}
      </div>
    );
  }

  return (
    <div className="bg-indigo-50 rounded-lg shadow-sm px-4 py-3">
      <div className="flex items-center space-x-2">
        <Coins className="w-5 h-5 text-indigo-600" />
        <span className="text-sm font-medium text-gray-700">Credits:</span>
        {loading ? (
          <span className="text-sm text-gray-500">Loading...</span>
        ) : (
          <span className="text-lg font-bold text-indigo-700 ml-auto">{balance ?? 0}</span>
        )}
      </div>
    </div>
  );
}
