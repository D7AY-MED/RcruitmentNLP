'use client';
import React from 'react';
import { Users, Calendar, Eye, Archive, Power, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

  return (
    <div 
      className="bg-card border border-border rounded-2xl p-5 card-shadow cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all duration-200 group"
      onClick={() => onView?.(pool)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-foreground truncate">{pool.title}</h3>
          {pool.company_name && (
            <p className="text-sm text-muted-foreground truncate">{pool.company_name}</p>
          )}
        </div>
        <JobPoolStatusBadge status={pool.status} />
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

      <div className="mt-4 pt-4">
        <CopyLinkButton value={url} className="shrink-0 w-full" />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
        {pool.status === 'active' ? (
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onStatusChange?.('disabled'); }} disabled={busy}>
            <Power className="w-4 h-4 sm:mr-1.5" aria-hidden="true" />
            <span className="hidden sm:inline">Disable</span>
          </Button>
        ) : pool.status === 'disabled' ? (
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onStatusChange?.('active'); }} disabled={busy}>
            <Power className="w-4 h-4 sm:mr-1.5" aria-hidden="true" />
            <span className="hidden sm:inline">Activate</span>
          </Button>
        ) : null}

        {pool.status !== 'archived' && (
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onStatusChange?.('archived'); }} disabled={busy}>
            <Archive className="w-4 h-4 sm:mr-1.5" aria-hidden="true" />
            <span className="hidden sm:inline">Archive</span>
          </Button>
        )}

        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => { e.stopPropagation(); onDelete?.(pool); }}
          disabled={busy}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="w-4 h-4 sm:mr-1.5" aria-hidden="true" />
          <span className="hidden sm:inline">Delete</span>
        </Button>
      </div>
    </div>
  );
}
