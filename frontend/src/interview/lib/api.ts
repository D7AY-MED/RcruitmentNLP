import { getToken } from '@/lib/candidateAuth';
import type { SessionStatus } from './types';

const API_URL = import.meta.env.VITE_API_URL || '';

function authHeaders(): Record<string, string> {
  const token = getToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export async function getSessionStatus(poolId: string): Promise<SessionStatus> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // 8s timeout so this never hangs the page (it runs inside Promise.all).
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const response = await fetch(
      `${API_URL}/api/v1/interview/session?pool_id=${encodeURIComponent(poolId)}`,
      { headers, signal: ctrl.signal },
    );
    if (!response.ok) return { status: 'none' };
    return (await response.json()) as SessionStatus;
  } catch {
    return { status: 'none' };
  } finally {
    clearTimeout(timer);
  }
}

export async function startInterview(
  formData: FormData,
  onDelta: (text: string) => void,
): Promise<{ sessionId: string; responseId: string; question: string }> {
  const token = getToken();
  const headers: Record<string, string> = { Accept: 'text/event-stream' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_URL}/api/v1/interview/start`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try { const b = await response.json(); if (b.detail) detail = b.detail; } catch {}
    throw new Error(detail);
  }

  if (!response.body) throw new Error('Streaming response body is missing.');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  let sessionId = '';
  let responseId = '';
  let question = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split('\n\n');
    buffer = chunks.pop() || '';

    for (const chunk of chunks) {
      const lines = chunk.split('\n');
      let eventType = '';
      let data = '';

      for (const line of lines) {
        if (line.startsWith('event:')) eventType = line.slice(6).trim();
        if (line.startsWith('data:')) data += line.slice(5).trim();
      }

      if (!eventType || !data) continue;

      let payload: any;
      try { payload = JSON.parse(data); } catch { continue; }

      if (eventType === 'meta') {
        sessionId = payload.sessionId || '';
      }

      if (eventType === 'delta') {
        const delta = payload.delta || '';
        if (delta) {
          question += delta;
          onDelta(delta);
        }
      }

      if (eventType === 'done') {
        responseId = payload.responseId || '';
        question = payload.question || question;
        return { sessionId, responseId, question };
      }

      if (eventType === 'error') {
        throw new Error(payload.error || 'AI service error.');
      }
    }
  }

  throw new Error('Stream ended unexpectedly.');
}

export async function continueInterview(
  sessionId: string,
  previousResponseId: string,
  answer: string,
  onDelta: (text: string) => void,
): Promise<{ completed: boolean; responseId: string; question?: string }> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_URL}/api/v1/interview/next`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ sessionId, previousResponseId, answer }),
  });

  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try { const b = await response.json(); if (b.detail) detail = b.detail; } catch {}
    throw new Error(detail);
  }

  if (!response.body) throw new Error('Streaming response body is missing.');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  let result: any = { completed: false, responseId: '' };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split('\n\n');
    buffer = chunks.pop() || '';

    for (const chunk of chunks) {
      const lines = chunk.split('\n');
      let eventType = '';
      let data = '';

      for (const line of lines) {
        if (line.startsWith('event:')) eventType = line.slice(6).trim();
        if (line.startsWith('data:')) data += line.slice(5).trim();
      }

      if (!eventType || !data) continue;

      let payload: any;
      try { payload = JSON.parse(data); } catch { continue; }

      if (eventType === 'delta') {
        const delta = payload.delta || '';
        if (delta) onDelta(delta);
      }

      if (eventType === 'done') {
        result = payload;
      }

      if (eventType === 'error') {
        throw new Error(payload.error || 'AI service error.');
      }
    }
  }

  return {
    completed: result.completed || false,
    responseId: result.responseId || '',
    question: result.question || undefined,
  };
}
