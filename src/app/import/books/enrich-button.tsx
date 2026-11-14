"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Event =
  | { type: "start"; total: number }
  | {
      type: "book" | "failure";
      title: string;
      saved: number;
      failed: number;
      message?: string;
    }
  | { type: "done"; saved: number; failed: number }
  | { type: "error"; message: string };

export function EnrichButton({ pending }: { pending: number }) {
  const router = useRouter();
  const active = useRef<AbortController | null>(null);
  const lastFailure = useRef("");
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => () => active.current?.abort(), []);

  async function start() {
    const controller = new AbortController();
    active.current = controller;
    lastFailure.current = "";
    setRunning(true);
    setMessage("Starting enrichment…");
    try {
      const response = await fetch("/api/books/enrich", {
        method: "POST",
        signal: controller.signal,
      });
      if (!response.ok || !response.body)
        throw new Error(
          response.status === 401
            ? "Sign in again to enrich books."
            : response.status === 503
              ? "Gemini is not configured."
              : "Enrichment could not start.",
        );
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finished = false;
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        buffer += decoder.decode(chunk.value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line) continue;
          const event = JSON.parse(line) as Event;
          if (event.type === "start")
            setMessage(`Enriching up to ${event.total} books…`);
          else if (event.type === "book")
            setMessage(
              `${event.saved} saved, ${event.failed} failed · ${event.title}`,
            );
          else if (event.type === "failure") {
            lastFailure.current = `${event.title}: ${event.message}`;
            setMessage(
              `${event.saved} saved, ${event.failed} failed · ${event.title}: ${event.message}`,
            );
          } else if (event.type === "done") {
            finished = true;
            setMessage(
              `Batch complete: ${event.saved} saved, ${event.failed} failed.${lastFailure.current ? ` Last failure: ${lastFailure.current}` : ""}`,
            );
          } else {
            finished = true;
            setMessage(event.message ?? "Enrichment failed.");
          }
        }
      }
      if (!finished && !controller.signal.aborted)
        setMessage("Connection ended before enrichment completed.");
    } catch (error) {
      if (!controller.signal.aborted)
        setMessage(
          error instanceof Error ? error.message : "Enrichment failed.",
        );
    } finally {
      if (active.current === controller) {
        active.current = null;
        setRunning(false);
        router.refresh();
      }
    }
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => void start()}
        disabled={running || pending === 0}
        className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-5 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
      >
        {running ? "Enriching…" : "Enrich next 25"}
      </button>
      {running && (
        <button
          type="button"
          onClick={() => {
            active.current?.abort();
            setMessage("Stopped. Saved enrichments remain available.");
          }}
          className="border-border hover:bg-card rounded-full border px-5 py-2 text-sm font-medium"
        >
          Stop
        </button>
      )}
      <span
        className="text-muted-foreground text-sm"
        role="status"
        aria-live="polite"
      >
        {message || `${pending} books still need enrichment`}
      </span>
    </div>
  );
}
