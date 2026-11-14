"use client";

import { useEffect, useRef, useState } from "react";

import type { Prisma } from "../../../generated/prisma";

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
      <ol className="divide-y divide-[#e4dfd5] rounded-2xl border border-[#ded9cd] bg-white px-5">
        {books.map((book) => (
          <li key={book.id}>
            <button
              type="button"
              onClick={(event) => {
                trigger.current = event.currentTarget;
                setSelectedId(book.id);
              }}
              aria-pressed={selectedId === book.id}
              className={`w-full py-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315c42] ${selectedId === book.id ? "bg-[#f4f7f1]" : ""}`}
            >
              <span className="block font-medium text-[#244a33]">
                {book.title}
              </span>
              <span className="mt-1 block text-sm text-[#5e675f]">
                {book.authors.map((author) => author.name).join(" ; ") ||
                  "Author unknown"}
              </span>
              <span className="mt-1 block text-xs text-[#7b8179]">
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
          className="fixed inset-0 z-50 overflow-y-auto bg-white p-5 text-[#202b24] lg:sticky lg:top-6 lg:z-auto lg:max-h-[calc(100vh-3rem)] lg:rounded-2xl lg:border lg:border-[#ded9cd]"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-[#5a7663] uppercase">
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
              className="rounded-full border border-[#c4cabc] px-3 py-1 text-sm hover:bg-[#f6f2eb]"
              aria-label="Close book details"
            >
              Close
            </button>
          </div>

          <a
            href={selected.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 block text-sm break-all text-[#244a33] underline"
          >
            {selected.sourceUrl}
          </a>

          <dl className="mt-5 grid gap-3 border-t border-[#e4dfd5] pt-5 text-sm sm:grid-cols-2">
            {fields.map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="text-xs font-semibold tracking-wide text-[#7b8179] uppercase">
                  {label}
                </dt>
                <dd className="mt-1 break-words">{value}</dd>
              </div>
            ))}
          </dl>

          <section className="mt-6 border-t border-[#e4dfd5] pt-5">
            <h3 className="font-heading text-xl font-semibold">
              AI recommendation profile
            </h3>
            {selected.enrichment ? (
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-[#4a5a4e]">
                <p>{selected.enrichment.summary}</p>
                {enrichmentFields.map(([label, values]) =>
                  values.length ? (
                    <p key={label}>
                      <strong className="text-[#202b24]">{label}:</strong>{" "}
                      {values.join(", ")}
                    </p>
                  ) : null,
                )}
                <p className="text-xs text-[#7b8179]">
                  Model: {selected.enrichment.model} · Enriched{" "}
                  {date(selected.enrichment.enrichedAt)}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-[#5e675f]">
                No AI profile saved yet.
              </p>
            )}
          </section>
        </aside>
      )}
    </div>
  );
}
