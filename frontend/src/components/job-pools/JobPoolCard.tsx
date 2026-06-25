'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Users, Calendar, Archive, Power, Trash2, MoreVertical, ChevronRight } from 'lucide-react';
import JobPoolStatusBadge from '@/components/job-pools/JobPoolStatusBadge';
import CopyLinkButton from '@/components/job-pools/CopyLinkButton';
import { publicPoolUrl } from '@/lib/frontendData';
import { formatDate } from '@/lib/utils';
import { JobPool } from '@/lib/types';

export interface JobPoolCardProps {
  pool: JobPool;
  onView?: (pool: JobPool) => void;
  onStatusChange?: (status: JobPool['status']) => void;
  onDelete?: (pool: JobPool) => void;
  busy?: boolean;
}

export default function JobPoolCard({ pool, onView, onStatusChange, onDelete, busy }: JobPoolCardProps) {
  const url = publicPoolUrl(pool.public_slug);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Click outside to close dropdown menu
  useEffect(() => {
    const clickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', clickOutside);
      document.addEventListener('touchstart', clickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', clickOutside);
      document.removeEventListener('touchstart', clickOutside);
    };
  }, [menuOpen]);

  // Escape key to close dropdown menu
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    if (menuOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [menuOpen]);

  return (
    <div 
      className="bg-card border border-border rounded-2xl p-5 card-shadow cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all duration-200 group relative"
      onClick={() => onView?.(pool)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-foreground truncate group-hover:text-indigo-600 transition-colors">{pool.title}</h3>
          {pool.company_name && (
            <p className="text-sm text-muted-foreground truncate">{pool.company_name}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0" ref={menuRef}>
          <JobPoolStatusBadge status={pool.status} />
          
          <div className="relative">
            <button
              type="button"
              disabled={busy}
              aria-haspopup="true"
              aria-expanded={menuOpen}
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              title="More actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div 
                role="menu" 
                aria-label="Job pool actions"
                className="absolute right-0 top-full mt-1.5 w-40 bg-white border border-border rounded-xl shadow-lg z-30 py-1.5 animate-slide-in"
              >
                {pool.status === 'active' ? (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onStatusChange?.('disabled');
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-foreground hover:bg-muted focus:bg-muted focus:outline-none transition-colors flex items-center gap-2"
                  >
                    <Power className="w-3.5 h-3.5 text-muted-foreground" />
                    Disable
                  </button>
                ) : pool.status === 'disabled' ? (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onStatusChange?.('active');
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-foreground hover:bg-muted focus:bg-muted focus:outline-none transition-colors flex items-center gap-2"
                  >
                    <Power className="w-3.5 h-3.5 text-muted-foreground" />
                    Activate
                  </button>
                ) : null}

                {pool.status !== 'archived' && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onStatusChange?.('archived');
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-foreground hover:bg-muted focus:bg-muted focus:outline-none transition-colors flex items-center gap-2"
                  >
                    <Archive className="w-3.5 h-3.5 text-muted-foreground" />
                    Archive
                  </button>
                )}

                <button
                  type="button"
                  role="menuitem"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onDelete?.(pool);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-destructive hover:bg-red-50 focus:bg-red-50 focus:outline-none transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
          {formatDate(pool.created_at)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" aria-hidden="true" />
          {pool.applicant_count ?? 0} applicant{(pool.applicant_count ?? 0) === 1 ? '' : 's'}
        </span>
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <CopyLinkButton value={url} className="shrink-0 w-full" />
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <span className="text-xs font-semibold text-indigo-600 group-hover:text-indigo-800 transition-colors flex items-center gap-1">
          View candidates
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </div>
  );
}
