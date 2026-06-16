'use client';
import React from 'react';

const TONES = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  disabled: 'bg-amber-50 text-amber-700 border-amber-200',
  archived: 'bg-muted text-muted-foreground border-border',
};

export default function JobPoolStatusBadge({ status }) {
  const tone = TONES[status] || TONES.archived;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium capitalize ${tone}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />
      {status || 'unknown'}
    </span>
  );
}
