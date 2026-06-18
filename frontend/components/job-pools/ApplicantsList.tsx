'use client';
import React from 'react';
import { Users, Mail } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import { formatDate, initials } from '@/lib/utils';

const APP_TONE: Record<string, string> = {
  applied: 'bg-sky-50 text-sky-700 border-sky-200',
  reviewing: 'bg-amber-50 text-amber-700 border-amber-200',
  accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
};
const INTERVIEW_TONE: Record<string, string> = {
  not_started: 'bg-muted text-muted-foreground border-border',
  in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

function Tag({ value, map }: { value: string | undefined; map: Record<string, string> }) {
  const tone = value && map[value] ? map[value] : 'bg-muted text-muted-foreground border-border';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium ${tone}`}>
      {String(value || '—').replace(/_/g, ' ')}
    </span>
  );
}

export interface StudentApplicant {
  id: string;
  student_name?: string;
  student_email?: string;
  status?: string;
  interview_status?: string;
  joined_at?: string;
}

export default function ApplicantsList({ students = [] }: { students?: StudentApplicant[] }) {
  if (!students.length) {
    return (
      <EmptyState
        icon={Users}
        title="No applicants yet"
        description="Share the public link to start receiving applications."
      />
    );
  }

  return (
    <ul className="divide-y divide-border">
      {students.map((s) => (
        <li key={s.id} className="flex items-center gap-3 py-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
            {initials(s.student_name || s.student_email || '')}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">
              {s.student_name || 'Candidate'}
            </p>
            {s.student_email && (
              <p className="text-xs text-muted-foreground truncate inline-flex items-center gap-1">
                <Mail className="w-3 h-3" aria-hidden="true" />
                {s.student_email}
              </p>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <Tag value={s.status} map={APP_TONE} />
            <Tag value={s.interview_status} map={INTERVIEW_TONE} />
          </div>
          <span className="text-xs text-muted-foreground shrink-0 w-20 text-right">
            {s.joined_at ? formatDate(s.joined_at) : ''}
          </span>
        </li>
      ))}
    </ul>
  );
}
