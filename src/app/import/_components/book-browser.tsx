"use client";

import { useEffect, useRef, useState } from "react";

import type { Book, CrawlEvent } from "~/app/api/_lib/cobiss";

const VISIBLE_COUNT = 50;
const number = new Intl.NumberFormat("en-US");

type StreamEvent = CrawlEvent | { type: "error"; message: string };

export function BookBrowser() {
  const books = useRef<Book[]>([]);
  const positions = useRef(new Map<string, number>());
  const active = useRef<AbortController | null>(null);
  const [, setVersion] = useState(0);
  const [page, setPage] = useState(0);
  const [running, setRunning] = useState(false);
  const [loaded, setLoaded] = useState(0);
  const [total, setTotal] = useState(0);
  const [checked, setChecked] = useState(0);
  const [failures, setFailures] = useState(0);
  const [pagesFetched, setPagesFetched] = useState(0);
  const [message, setMessage] = useState("");

  useEffect(() => () => active.current?.abort(), []);

  function handleEvent(event: StreamEvent) {
    if (event.type === "page") {
      for (const book of event.books) {
        if (positions.current.has(book.cobissId)) continue;
        positions.current.set(book.cobissId, books.current.length);
        books.current.push(book);
      }
      setLoaded(books.current.length);
      setTotal(event.totalHits);
      setPagesFetched(event.pagesFetched);
      setVersion((value) => value + 1);
    } else if (event.type === "isbn") {
      for (const item of event.items) {
        const position = positions.current.get(item.cobissId);
        if (position !== undefined) books.current[position]!.isbn = item.isbn;
      }
      setChecked(event.checked);
      setFailures(event.failures);
      setVersion((value) => value + 1);
    } else if (event.type === "done") {
      setMessage("Fetch and save complete.");
    } else {
      setMessage(event.message);
    }
  }

  async function start() {
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    books.current = [];
    positions.current.clear();
    setVersion(0);
    setPage(0);
    setLoaded(0);
    setTotal(0);
    setChecked(0);
    setFailures(0);
    setPagesFetched(0);
    setMessage("");
    setRunning(true);

    try {
      const response = await fetch("/api/books/stream", {
        method: "POST",
        cache: "no-store",
        signal: controller.signal,
      });
      if (!response.ok || !response.body) {
        throw new Error(
          response.status === 401
            ? "Sign in again to fetch books."
            : "Fetch could not start.",
        );
      }

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
          const event = JSON.parse(line) as StreamEvent;
          handleEvent(event);
          if (event.type === "done" || event.type === "error") finished = true;
        }
      }
      if (!finished && !controller.signal.aborted)
        setMessage("Connection ended before fetch completed.");
    } catch (error) {
      if (!controller.signal.aborted) {
        setMessage(error instanceof Error ? error.message : "Fetch failed.");
      }
    } finally {
      if (active.current === controller) {
        active.current = null;
        setRunning(false);
      }
    }
  }

  const pageCount = Math.ceil(loaded / VISIBLE_COUNT);
  const visible = books.current.slice(
    page * VISIBLE_COUNT,
    (page + 1) * VISIBLE_COUNT,
  );

  return (
    <section>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void start()}
          disabled={running}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-6 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {running ? "Fetching…" : "Fetch and save all books"}
        </button>
        {running && (
          <button
            type="button"
            onClick={() => {
              active.current?.abort();
              setMessage("Fetch stopped. Saved books remain in the database.");
            }}
            className="border-border hover:bg-card rounded-md border px-5 py-3 text-sm font-semibold"
          >
            Stop
          </button>
        )}
        <span
          className="text-muted-foreground text-sm"
          role="status"
          aria-live="polite"
        >
          {message ||
            (running ? "Fetching from COBISS…" : "No books fetched yet.")}
        </span>
      </div>

      {(loaded > 0 || running) && (
        <div className="border-border bg-card mt-8 grid gap-3 rounded-md border p-5 text-sm sm:grid-cols-3">
          <p>
            <strong>{number.format(loaded)}</strong> books saved ·{" "}
            {number.format(total)} matches
          </p>
          <p>
            <strong>{number.format(checked)}</strong> ISBN checks
          </p>
          <p>
            <strong>{number.format(pagesFetched)}</strong> pages fetched
            {failures ? ` · ${failures} lookup failures` : ""}
          </p>
        </div>
      )}

      {loaded > 0 && (
        <>
          <div className="mt-8 flex items-center justify-between gap-4">
            <h2 className="font-heading text-2xl font-semibold">Books</h2>
            <span className="text-muted-foreground text-sm">
              Page {page + 1} of {pageCount}
            </span>
          </div>
          <ol className="divide-border border-border bg-card mt-4 divide-y rounded-md border px-5">
            {visible.map((book) => (
              <li key={book.cobissId} className="py-4">
                <a
                  href={book.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary font-medium underline-offset-2 hover:underline"
                >
                  {book.title}
                </a>
                <p className="text-muted-foreground mt-1 text-sm">
                  {book.author || "Author unknown"}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  ISBN: {book.isbn ?? "Unavailable"}
                </p>
              </li>
            ))}
          </ol>
          <nav
            aria-label="Book pages"
            className="mt-5 flex justify-between gap-3"
          >
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              className="border-border rounded-md border px-5 py-2 text-sm disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page + 1 >= pageCount}
              onClick={() => setPage(page + 1)}
              className="border-border rounded-md border px-5 py-2 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </nav>
        </>
      )}
    </section>
  );
}
