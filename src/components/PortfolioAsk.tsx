"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";

import { AskAnswer } from "@/components/AskAnswer";
import type { Locale } from "@/lib/locale";
import { sourceHref } from "@/lib/rag/sourceHref";

export type AskCitation = {
  source_path: string;
  chunk_index: number;
  distance: number;
};

export type AskResponse = {
  answer: string;
  citations: AskCitation[];
  embedding_model: string;
  chat_model: string;
  run_id: string | null;
};

export type PortfolioAskStrings = {
  title: string;
  lede: string;
  placeholder: string;
  submit: string;
  busy: string;
  empty: string;
  error: string;
  unavailable: string;
  citations: string;
  samplesLabel: string;
  samples: readonly string[];
  sourcesLabel: string;
  sourcesEmpty: string;
  sourcesUnavailable: string;
};

export type PortfolioAskProps = {
  strings: PortfolioAskStrings;
  /** Compact floating-chat layout hides the sources rail. */
  variant?: "page" | "widget";
  locale?: Locale;
};

type Message = {
  role: "user" | "assistant";
  text: string;
  meta?: AskResponse;
};

type SourcesResponse = {
  files: string[];
  embedding_model: string;
  error?: string;
};

function errorFromPayload(
  payload: { error?: unknown },
  status: number,
  fallback: string,
): string {
  if (typeof payload.error === "string" && payload.error.trim()) {
    return payload.error;
  }
  return `${fallback} (${status})`;
}

async function readJson<T>(response: Response): Promise<T> {
  const rawBody = await response.text();
  try {
    return JSON.parse(rawBody) as T;
  } catch {
    throw new Error(`non-JSON response (${response.status})`);
  }
}

export function PortfolioAsk({ strings, variant = "page", locale = "en" }: PortfolioAskProps) {
  const formId = useId();
  const isWidget = variant === "widget";
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<string[]>([]);
  const [sourcesNote, setSourcesNote] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const samplePrompts = isWidget ? strings.samples.slice(0, 3) : strings.samples;

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => {
    if (isWidget) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/rag-sources");
        const payload = await readJson<SourcesResponse>(response);
        if (cancelled) return;
        if (!response.ok) {
          setFiles([]);
          setSourcesNote(
            response.status === 503
              ? strings.unavailable
              : strings.sourcesUnavailable,
          );
          return;
        }
        const listed = payload.files || [];
        setFiles(listed);
        setSourcesNote(listed.length === 0 ? strings.sourcesEmpty : null);
      } catch {
        if (!cancelled) {
          setFiles([]);
          setSourcesNote(strings.sourcesUnavailable);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isWidget, strings.sourcesEmpty, strings.sourcesUnavailable, strings.unavailable]);

  async function ask(raw: string) {
    const next = raw.trim();
    if (!next || busy) return;
    setQuestion("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", text: next }]);
    setBusy(true);
    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: next }),
      });
      const payload = await readJson<AskResponse & { error?: unknown }>(response);
      if (!response.ok) {
        if (response.status === 503) {
          throw new Error(strings.unavailable);
        }
        throw new Error(errorFromPayload(payload, response.status, strings.error));
      }
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: payload.answer, meta: payload },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.error);
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void ask(question);
  }

  return (
    <div className={`ask-shell${isWidget ? " ask-shell-widget" : ""}`}>
      {!isWidget ? (
        <header className="ask-intro">
          <h1>{strings.title}</h1>
          <p className="ask-lede">{strings.lede}</p>
        </header>
      ) : null}

      <section className="ask-samples" aria-label={strings.samplesLabel}>
        {!isWidget ? (
          <p className="ask-samples-label">{strings.samplesLabel}</p>
        ) : null}
        <ul>
          {samplePrompts.map((sample) => (
            <li key={sample}>
              <button
                type="button"
                className="ask-sample"
                disabled={busy}
                onClick={() => void ask(sample)}
              >
                {sample}
              </button>
            </li>
          ))}
        </ul>
      </section>

      {!isWidget ? (
        <aside className="ask-sources" aria-label={strings.sourcesLabel}>
          <h2>{strings.sourcesLabel}</h2>
          {sourcesNote ? <p className="ask-sources-note">{sourcesNote}</p> : null}
          {files.length > 0 ? (
            <ul>
              {files.map((file) => (
                <li key={file}>
                  <code>{file}</code>
                </li>
              ))}
            </ul>
          ) : null}
        </aside>
      ) : null}

      <section className="ask-thread" aria-live="polite">
        {messages.length === 0 && !busy ? (
          <p className="ask-empty">{strings.empty}</p>
        ) : null}
        {messages.map((message, index) => (
          <article
            key={`${message.role}-${index}`}
            className={`ask-turn ask-turn-${message.role}`}
          >
            {message.role === "assistant" ? (
              <AskAnswer text={message.text} locale={locale} />
            ) : (
              <p>{message.text}</p>
            )}
            {message.meta && message.meta.citations.length > 0 ? (
              <div className="ask-citations">
                <p className="ask-citations-label">{strings.citations}</p>
                <ul>
                  {message.meta.citations.map((citation) => (
                    <li key={`${citation.source_path}-${citation.chunk_index}`}>
                      <Link className="ask-cite" href={sourceHref(citation.source_path, locale)}>
                        {citation.source_path}
                      </Link>
                      <span className="ask-distance">
                        d={citation.distance.toFixed(3)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </article>
        ))}
        {busy ? <p className="ask-busy">{strings.busy}</p> : null}
        {error ? (
          <p className="ask-error" role="alert">
            {error}
          </p>
        ) : null}
        <div ref={bottomRef} />
      </section>

      <form className="ask-composer" id={formId} onSubmit={onSubmit}>
        <label className="vh" htmlFor={`${formId}-input`}>
          {strings.placeholder}
        </label>
        {isWidget ? (
          <input
            id={`${formId}-input`}
            name="question"
            type="text"
            autoComplete="off"
            value={question}
            disabled={busy}
            placeholder={strings.placeholder}
            onChange={(event) => setQuestion(event.target.value)}
          />
        ) : (
          <textarea
            id={`${formId}-input`}
            name="question"
            rows={3}
            value={question}
            disabled={busy}
            placeholder={strings.placeholder}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void ask(question);
              }
            }}
          />
        )}
        <button type="submit" className="ask-submit" disabled={busy || !question.trim()}>
          {busy ? strings.busy : strings.submit}
        </button>
      </form>
    </div>
  );
}
