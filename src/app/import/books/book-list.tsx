"use client";

import { useEffect, useRef, useState } from "react";

import type { Prisma } from "../../../../generated/prisma";

type SavedBook = Prisma.BookGetPayload<{
  include: { authors: true; enrichment: true };
}>;

function date(value: Date | null): string {
  return value
    ? value.toISOString().replace("T", " ").slice(0, 16) + " UTC"
    : "Unavailable";
}

export function BookList({ books }: { books: SavedBook[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);
  const selected = books.find((book) => book.id === selectedId);

  useEffect(() => {
    if (!selected) return;
    panel.current?.scrollTo(0, 0);
    closeButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedId(null);
        trigger.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected]);

  const profile = selected?.enrichment?.profile as
    Record<string, unknown> | undefined;
  const enrichmentFields: [string, string[]][] = selected?.enrichment
    ? [
        ["Genres", selected.enrichment.genres],
        ["Themes", selected.enrichment.themes],
        ["Mood", selected.enrichment.mood],
        ...Object.entries(profile ?? {}).map(
          ([key, value]): [string, string[]] => [
            key.replace(/([A-Z])/g, " $1"),
            Array.isArray(value)
              ? value.filter((item): item is string => typeof item === "string")
              : typeof value === "string"
                ? [value]
                : [],
          ],
        ),
      ]
    : [];
  const fields = selected
    ? [
        [
          "Authors",
          selected.authors.map((author) => author.name).join(" ; ") ||
            "Author unknown",
        ],
        ["ISBN", selected.isbn ?? "Unavailable"],
        ["Language", selected.language],
        ["Catalog", selected.catalog],
        ["COBISS ID", selected.cobissId],
        ["Record ID", selected.id],
        ["Last fetched", date(selected.lastFetchedAt)],
        ["Availability", selected.availabilityStatus ?? "Not checked"],
        ["Availability checked", date(selected.availabilityCheckedAt)],
      ]
    : [];

  return (
    <div className={selected ? "grid gap-5 lg:grid-cols-2" : "max-w-5xl"}>
      <ol className="divide-border border-border bg-card divide-y rounded-2xl border px-5">
        {books.map((book) => (
          <li key={book.id}>
            <button
              type="button"
              onClick={(event) => {
                trigger.current = event.currentTarget;
                setSelectedId(book.id);
              }}
              aria-pressed={selectedId === book.id}
              className={`focus-visible:outline-ring w-full py-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 ${selectedId === book.id ? "bg-accent" : ""}`}
            >
              <span className="text-primary block font-medium">
                {book.title}
              </span>
              <span className="text-muted-foreground mt-1 block text-sm">
                {book.authors.map((author) => author.name).join(" ; ") ||
                  "Author unknown"}
              </span>
              <span className="text-muted-foreground mt-1 block text-xs">
                ISBN: {book.isbn ?? "Unavailable"}
                {book.enrichment ? " · AI profile saved" : ""}
              </span>
            </button>
          </li>
        ))}
      </ol>

      {selected && (
        <aside
          ref={panel}
          aria-label={`Details for ${selected.title}`}
          className="bg-card text-foreground lg:border-border fixed inset-0 z-50 overflow-y-auto p-5 lg:sticky lg:top-6 lg:z-auto lg:max-h-[calc(100vh-3rem)] lg:rounded-2xl lg:border"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase">
                Book details
              </p>
              <h2 className="font-heading mt-2 text-2xl font-semibold">
                {selected.title}
              </h2>
            </div>
            <button
              ref={closeButton}
              type="button"
              onClick={() => {
                setSelectedId(null);
                trigger.current?.focus();
              }}
              className="border-border hover:bg-background rounded-full border px-3 py-1 text-sm"
              aria-label="Close book details"
            >
              Close
            </button>
          </div>

          <a
            href={selected.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary mt-4 block text-sm break-all underline"
          >
            {selected.sourceUrl}
          </a>

          <dl className="border-border mt-5 grid gap-3 border-t pt-5 text-sm sm:grid-cols-2">
            {fields.map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  {label}
                </dt>
                <dd className="mt-1 break-words">{value}</dd>
              </div>
            ))}
          </dl>

          <section className="border-border mt-6 border-t pt-5">
            <h3 className="font-heading text-xl font-semibold">
              AI recommendation profile
            </h3>
            {selected.enrichment ? (
              <div className="text-muted-foreground mt-3 space-y-3 text-sm leading-relaxed">
                <p>{selected.enrichment.summary}</p>
                {enrichmentFields.map(([label, values]) =>
                  values.length ? (
                    <p key={label}>
                      <strong className="text-foreground">{label}:</strong>{" "}
                      {values.join(", ")}
                    </p>
                  ) : null,
                )}
                <p className="text-muted-foreground text-xs">
                  Model: {selected.enrichment.model} · Enriched{" "}
                  {date(selected.enrichment.enrichedAt)}
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground mt-3 text-sm">
                No AI profile saved yet.
              </p>
            )}
          </section>
        </aside>
      )}
    </div>
  );
}
