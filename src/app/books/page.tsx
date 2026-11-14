import Link from "next/link";
import { redirect } from "next/navigation";

import { env } from "~/env";
import { auth } from "~/server/auth";
import { db } from "~/server/db";

import { EnrichButton } from "./enrich-button";

const PAGE_SIZE = 50;

export default async function SavedBooks({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (
    session?.user?.email?.toLowerCase() !==
    env.ALLOWED_GOOGLE_EMAIL.toLowerCase()
  ) {
    redirect("/");
  }

  const requestedPage = Number((await searchParams).page);
  const [total, pending] = await Promise.all([
    db.book.count(),
    db.book.count({ where: { enrichment: { is: null } } }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? Math.min(requestedPage, pageCount)
      : 1;
  const books = await db.book.findMany({
    orderBy: [{ lastFetchedAt: "desc" }, { id: "desc" }],
    include: { authors: { orderBy: { name: "asc" } }, enrichment: true },
    where: {
      authors: {
        some: {
          name: {
            startsWith: "King",
          },
        },
      },
    },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  return (
    <main className="min-h-screen bg-[#f6f2eb] px-4 py-8 text-[#202b24] sm:px-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-[#d9d3c6] pb-6">
          <div>
            <p className="mb-2 text-xs font-semibold tracking-[0.24em] text-[#5a7663] uppercase">
              COBISS book finder
            </p>
            <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
              Saved books
            </h1>
            <p className="mt-3 text-sm text-[#5e675f]">
              {total} books in your database
            </p>
          </div>
          <Link
            href="/"
            className="rounded-full border border-[#c4cabc] px-4 py-2 text-sm font-medium hover:bg-white"
          >
            Back to fetch
          </Link>
        </header>

        <EnrichButton pending={pending} />

        {books.length === 0 ? (
          <p className="rounded-2xl border border-[#ded9cd] bg-white p-6 text-sm text-[#5e675f]">
            No books saved yet. Fetch books on the main page.
          </p>
        ) : (
          <>
            <ol className="divide-y divide-[#e4dfd5] rounded-2xl border border-[#ded9cd] bg-white px-5">
              {books.map((book) => (
                <li key={book.id} className="py-4">
                  <a
                    href={book.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[#244a33] underline-offset-2 hover:underline"
                  >
                    {book.title}
                  </a>
                  <p className="mt-1 text-sm text-[#5e675f]">
                    {book.authors.map((author) => author.name).join(" ; ") ||
                      "Author unknown"}
                  </p>
                  <p className="mt-1 text-xs text-[#7b8179]">
                    ISBN: {book.isbn ?? "Unavailable"}
                  </p>
                  {book.enrichment && (
                    <details className="mt-3 text-sm text-[#4a5a4e]">
                      <summary className="cursor-pointer font-medium text-[#315c42]">
                        AI recommendation profile
                      </summary>
                      <p className="mt-2 leading-relaxed">
                        {book.enrichment.summary}
                      </p>
                      <p className="mt-2">
                        Genres: {book.enrichment.genres.join(", ") || "Unknown"}
                      </p>
                      <p>
                        Themes: {book.enrichment.themes.join(", ") || "Unknown"}
                      </p>
                      <p>
                        Mood: {book.enrichment.mood.join(", ") || "Unknown"}
                      </p>
                      {Object.entries(
                        book.enrichment.profile as Record<string, unknown>,
                      )
                        .filter(([, value]) =>
                          Array.isArray(value)
                            ? value.length > 0
                            : Boolean(value),
                        )
                        .map(([key, value]) => (
                          <p key={key}>
                            {key.replace(/([A-Z])/g, " $1")}:{" "}
                            {Array.isArray(value)
                              ? value.join(", ")
                              : String(value)}
                          </p>
                        ))}
                    </details>
                  )}
                </li>
              ))}
            </ol>
            {pageCount > 1 && (
              <nav
                aria-label="Saved book pages"
                className="mt-5 flex items-center justify-between gap-3"
              >
                {page > 1 ? (
                  <Link
                    href={`/books?page=${page - 1}`}
                    className="rounded-full border border-[#c4cabc] px-5 py-2 text-sm hover:bg-white"
                  >
                    Previous
                  </Link>
                ) : (
                  <span />
                )}
                <span className="text-sm text-[#5e675f]">
                  Page {page} of {pageCount}
                </span>
                {page < pageCount ? (
                  <Link
                    href={`/books?page=${page + 1}`}
                    className="rounded-full border border-[#c4cabc] px-5 py-2 text-sm hover:bg-white"
                  >
                    Next
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
            )}
          </>
        )}
      </div>
    </main>
  );
}
