/**
 * Application detail drawer: candidate + job context, AI summary/score (from
 * Candidate_summaries) and the full interview transcript (question/answer pairs
 * from interview_sessions). Read-only — interviews are produced by the engine.
 */
import React, { useEffect, useState } from "react";
import { User, Briefcase, Sparkles, MessageSquare, CheckCircle2, Clock } from "lucide-react";
import { Drawer, Badge, Card, LoadingState, ErrorState } from "../ui";
import type { ApplicationDetail } from "../../types";
import * as appsService from "../../services/applications.service";
import { displayValue } from "../../lib/format";

export function ApplicationDetailDrawer({
  open,
  sessionId,
  onClose,
}: {
  open: boolean;
  sessionId: string | null;
  onClose: () => void;
}) {
  const [data, setData] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !sessionId) return;
    setLoading(true);
    setError(null);
    appsService.getApplication(sessionId).then(setData).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [open, sessionId]);

  const progress = data ? (data.total_questions ? Math.round((data.answered / data.total_questions) * 100) : 0) : 0;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={loading ? "Loading…" : data?.candidate_name || "Application"}
      subtitle={
        data && (
          <span className="flex items-center gap-2">
            <Badge tone={data.status === "completed" ? "green" : "amber"}>
              {data.status === "completed" ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
              {data.status === "completed" ? "Completed" : "In progress"}
            </Badge>
            <span className="text-xs text-gray-400">{data.answered}/{data.total_questions} answered</span>
          </span>
        )
      }
    >
      {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : data ? (
        <div className="space-y-6">
          {/* Context */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Card className="p-4">
              <p className="flex items-center gap-1.5 text-xs font-medium text-gray-500"><User className="h-3.5 w-3.5" />Candidate</p>
              <p className="mt-1 font-semibold text-gray-900">{displayValue(data.candidate_name)}</p>
              {data.candidate?.email && <p className="text-xs text-gray-500">{data.candidate.email}</p>}
            </Card>
            <Card className="p-4">
              <p className="flex items-center gap-1.5 text-xs font-medium text-gray-500"><Briefcase className="h-3.5 w-3.5" />Job pool</p>
              <p className="mt-1 font-semibold text-gray-900">{displayValue(data.pool_title)}</p>
              {data.pool?.company_name && <p className="text-xs text-gray-500">{data.pool.company_name}</p>}
            </Card>
          </div>

          {/* Progress */}
          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
              <span>Interview progress</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* AI summary */}
          {data.summary && (data.summary.summary || data.summary.score) && (
            <Card className="border-indigo-100 bg-indigo-50/40 p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-indigo-900"><Sparkles className="h-4 w-4" />AI summary</p>
                {data.summary.score && <Badge tone="indigo">Score: {data.summary.score}</Badge>}
              </div>
              {data.summary.summary && <p className="whitespace-pre-wrap text-sm text-gray-700">{data.summary.summary}</p>}
            </Card>
          )}

          {/* Transcript */}
          <section>
            <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
              <MessageSquare className="h-3.5 w-3.5" />Transcript
            </h3>
            {!data.questions.length ? (
              <p className="text-sm text-gray-400">No questions recorded.</p>
            ) : (
              <ol className="space-y-4">
                {data.questions.map((q, i) => (
                  <li key={q.sequence ?? i} className="rounded-xl border border-gray-200 p-4">
                    <p className="text-sm font-medium text-gray-900">
                      <span className="mr-2 text-indigo-600">Q{q.sequence ?? i + 1}.</span>
                      {q.question}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">
                      {q.answer ? q.answer : <span className="italic text-gray-400">No answer yet</span>}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      ) : null}
    </Drawer>
  );
}
