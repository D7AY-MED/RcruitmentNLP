"use client";

import { FormEvent, useRef, useState } from "react";

type StartResponse = {
  sessionId: string;
  responseId: string;
  question: string;
  status: "active" | "completed";
};

type NextResponse =
  | {
      completed: false;
      responseId: string;
      question: string;
      status: "active" | "completed";
    }
  | {
      completed: true;
      responseId: string;
      status: "active" | "completed";
    };

export default function HomePage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [candidateName, setCandidateName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [cvText, setCvText] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [answer, setAnswer] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [responseId, setResponseId] = useState<string | null>(null);
  const [question, setQuestion] = useState<string | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [status, setStatus] = useState<"idle" | "active" | "completed">("idle");
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toErrorMessage(value: unknown): string {
    if (value instanceof Error) {
      return value.message;
    }
    if (value instanceof Event) {
      return "The request was interrupted by the browser. Please try again.";
    }
    if (typeof value === "string" && value.trim()) {
      return value;
    }
    return "Unexpected error.";
  }

  async function parseApiPayload<T>(response: Response): Promise<T & { error?: string }> {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return (await response.json()) as T & { error?: string };
    }

    const text = await response.text();
    if (!response.ok) {
      throw new Error(
        `Request failed (${response.status}). ${text ? "Server returned non-JSON error." : ""}`.trim()
      );
    }

    throw new Error("Server returned non-JSON response.");
  }

  async function consumeSse(
    response: Response,
    handlers: {
      onMeta?: (payload: Record<string, unknown>) => void;
      onDelta?: (payload: Record<string, unknown>) => void;
      onDone?: (payload: Record<string, unknown>) => void;
      onError?: (payload: Record<string, unknown>) => void;
    }
  ): Promise<void> {
    if (!response.ok) {
      const data = await parseApiPayload<{ error?: string }>(response);
      throw new Error(data.error || `Request failed (${response.status}).`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/event-stream")) {
      throw new Error("Server did not return a streaming response.");
    }

    if (!response.body) {
      throw new Error("Streaming response body is missing.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split("\n\n");
      buffer = chunks.pop() || "";

      for (const chunk of chunks) {
        const lines = chunk.split("\n");
        let eventType = "";
        let data = "";

        for (const line of lines) {
          if (line.startsWith("event:")) {
            eventType = line.slice(6).trim();
          }
          if (line.startsWith("data:")) {
            data += line.slice(5).trim();
          }
        }

        if (!eventType || !data) {
          continue;
        }

        let payload: Record<string, unknown> = {};
        try {
          payload = JSON.parse(data) as Record<string, unknown>;
        } catch {
          continue;
        }

        if (eventType === "meta") {
          handlers.onMeta?.(payload);
        } else if (eventType === "delta") {
          handlers.onDelta?.(payload);
        } else if (eventType === "done") {
          handlers.onDone?.(payload);
        } else if (eventType === "error") {
          handlers.onError?.(payload);
        }
      }
    }
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function assignCvFile(file: File | null) {
    setCvFile(file);
    setIsDragOver(false);
  }

  async function handleStart(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!candidateName.trim()) {
      setNameError("Candidate name is required.");
      return;
    }
    setNameError(null);

    if (!cvText.trim() && !cvFile) {
      setError("Please paste CV text or upload a CV file.");
      return;
    }

    setIsStarting(true);

    try {
      const formData = new FormData();
      formData.set("candidateName", candidateName.trim());
      if (cvText.trim()) {
        formData.set("cvText", cvText.trim());
      }
      if (cvFile) {
        formData.set("cvFile", cvFile);
      }

      const response = await fetch("/api/interview/start", {
        method: "POST",
        headers: {
          Accept: "text/event-stream"
        },
        body: formData
      });

      setQuestion("");
      setStatus("active");
      setAnswer("");

      await consumeSse(response, {
        onMeta: (payload) => {
          const id =
            typeof payload.sessionId === "string" ? payload.sessionId : null;
          if (id) {
            setSessionId(id);
          }
        },
        onDelta: (payload) => {
          const delta = typeof payload.delta === "string" ? payload.delta : "";
          if (!delta) return;
          setQuestion((prev) => (prev || "") + delta);
        },
        onDone: (payload) => {
          const nextResponseId =
            typeof payload.responseId === "string" ? payload.responseId : "";
          const doneQuestion =
            typeof payload.question === "string" ? payload.question : "";
          const nextSessionId =
            typeof payload.sessionId === "string" ? payload.sessionId : null;

          if (nextSessionId) {
            setSessionId(nextSessionId);
          }
          if (nextResponseId) {
            setResponseId(nextResponseId);
          }
          if (doneQuestion) {
            setQuestion(doneQuestion);
          }
          setQuestionIndex(1);
          setStatus("active");
        },
        onError: (payload) => {
          const message =
            typeof payload.error === "string"
              ? payload.error
              : "Unable to start interview.";
          throw new Error(message);
        }
      });
    } catch (err) {
      setError(toErrorMessage(err));
      setStatus("idle");
      setQuestionIndex(0);
    } finally {
      setIsStarting(false);
    }
  }

  async function handleNext(e: FormEvent) {
    e.preventDefault();
    if (!responseId || !answer.trim()) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/interview/next", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream"
        },
        body: JSON.stringify({
          previousResponseId: responseId,
          answer: answer.trim()
        })
      });

      setQuestion("");
      setAnswer("");

      await consumeSse(response, {
        onDelta: (payload) => {
          const delta = typeof payload.delta === "string" ? payload.delta : "";
          if (!delta) return;
          setQuestion((prev) => (prev || "") + delta);
        },
        onDone: (payload) => {
          const nextResponseId =
            typeof payload.responseId === "string" ? payload.responseId : "";
          const completed = payload.completed === true;
          const doneQuestion =
            typeof payload.question === "string" ? payload.question : "";

          if (nextResponseId) {
            setResponseId(nextResponseId);
          }

          if (completed) {
            setStatus("completed");
            setQuestion(null);
          } else {
            setStatus("active");
            setQuestionIndex((prev) => prev + 1);
            if (doneQuestion) {
              setQuestion(doneQuestion);
            }
          }
        },
        onError: (payload) => {
          const message =
            typeof payload.error === "string"
              ? payload.error
              : "Unable to submit answer.";
          throw new Error(message);
        }
      });
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="card">
        {isStarting && (
          <div className="loading-overlay" aria-live="polite" aria-busy="true">
            <div className="loading-spinner" />
            <p className="loading-text">Preparing your interview...</p>
          </div>
        )}

        <div className="header-block">
          <h1 className="title">AI Interview Platform</h1>
          <p className="subtitle">
            Upload your CV, then answer one adaptive question at a time.
          </p>
        </div>

        {status === "idle" && (
          <form onSubmit={handleStart}>
            <div className="field">
              <label className="label" htmlFor="candidateName">
                Candidate name
              </label>
              <input
                id="candidateName"
                type="text"
                value={candidateName}
                onChange={(e) => {
                  setCandidateName(e.target.value);
                  if (nameError && e.target.value.trim()) {
                    setNameError(null);
                  }
                }}
                placeholder="Your full name"
                className={nameError ? "input-error" : undefined}
                required
              />
              {nameError && <p className="field-hint-error">{nameError}</p>}
            </div>

            <div className="field">
              <label className="label" htmlFor="cvText">
                CV text (optional if uploading file)
              </label>
              <textarea
                id="cvText"
                value={cvText}
                onChange={(e) => setCvText(e.target.value)}
                placeholder="Paste your CV here..."
              />
            </div>

            <div className="field">
              <label className="label" htmlFor="cvFile">
                CV file upload (PDF or text)
              </label>
              <div
                className={`dropzone ${isDragOver ? "is-dragging" : ""}`.trim()}
                onClick={openFilePicker}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  assignCvFile(event.dataTransfer.files?.[0] ?? null);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openFilePicker();
                  }
                }}
                aria-label="CV file upload (PDF or text)"
              >
                <p className="dropzone-title">Click or drag your CV here</p>
                <p className={`dropzone-subtext ${cvFile ? "done" : ""}`.trim()}>
                  {cvFile ? (
                    <>
                      <span className="file-check" aria-hidden="true">
                        ✓
                      </span>
                      {cvFile.name}
                    </>
                  ) : (
                    "No file selected"
                  )}
                </p>
              </div>
              <input
                id="cvFile"
                ref={fileInputRef}
                className="visually-hidden"
                type="file"
                accept=".pdf,.txt,text/plain,application/pdf"
                onChange={(e) => assignCvFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={isStarting || !candidateName.trim()}
              aria-disabled={isStarting || !candidateName.trim()}
            >
              Start Interview
            </button>
          </form>
        )}

        {status !== "idle" && (
          <>
            <div className="meta-row">
              <div className="session-meta">
                Session: {sessionId ?? "n/a"} | Status: {status}
              </div>
              {status === "active" && questionIndex > 0 && (
                <div className="progress-meta">Question {questionIndex} of 15</div>
              )}
            </div>

            {status === "active" && question && (
              <>
                <div className="question-bubble" key={`${responseId}-${questionIndex}`}>
                  {question}
                </div>
                <form onSubmit={handleNext}>
                  <div className="field">
                    <label className="label" htmlFor="answer">
                      Your answer
                    </label>
                    <textarea
                      id="answer"
                      className="answer-textarea"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Type your answer..."
                      autoComplete="off"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isSubmitting || !answer.trim()}
                    aria-disabled={isSubmitting || !answer.trim()}
                  >
                    {isSubmitting && <span className="btn-spinner" aria-hidden="true" />}
                    {isSubmitting ? "Submitting..." : "Submit Answer"}
                  </button>
                </form>
              </>
            )}

            {status === "completed" && (
              <div className="done">
                Interview complete. Thank you for your time.
              </div>
            )}
          </>
        )}

        {error && <p className="error">{error}</p>}
      </section>
    </main>
  );
}
