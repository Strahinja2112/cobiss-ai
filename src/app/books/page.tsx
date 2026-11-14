import Link from "next/link";
import { redirect } from "next/navigation";

import { env } from "~/env";
import { displayedBooks } from "~/app/api/_lib/book-selection";
import { auth } from "~/server/auth";
import { db } from "~/server/db";

import { BookList } from "./book-list";
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
    db.book.count({ where: displayedBooks }),
    db.book.count({
      where: { ...displayedBooks, enrichment: { is: null } },
    }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? Math.min(requestedPage, pageCount)
      : 1;
  const books = await db.book.findMany({
    orderBy: [{ lastFetchedAt: "desc" }, { id: "desc" }],
    include: { authors: { orderBy: { name: "asc" } }, enrichment: true },
    where: displayedBooks,
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  return (
    <main className="min-h-screen bg-[#f6f2eb] px-4 py-8 text-[#202b24] sm:px-8 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-[#d9d3c6] pb-6">
          <div>
            <p className="mb-2 text-xs font-semibold tracking-[0.24em] text-[#5a7663] uppercase">
              COBISS book finder
            </p>
            <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
              Saved books
            </h1>
            <p className="mt-3 text-sm text-[#5e675f]">
              {total} Stephen King books
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
            <BookList books={books} />
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
