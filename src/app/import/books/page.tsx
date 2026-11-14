import Link from "next/link";
import { redirect } from "next/navigation";

import { env } from "~/env";
import { displayedBooks } from "~/app/api/_lib/book-selection";
import { ThemeToggle } from "~/components/theme-toggle";
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
    redirect("/import");
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
    <main className="bg-background text-foreground min-h-screen px-4 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <header className="bg-primary text-primary-foreground mb-8 flex flex-wrap items-start justify-between gap-5 rounded-xl px-6 py-7 sm:px-8">
          <div>
            <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
              Saved books
            </h1>
            <p className="text-primary-foreground/85 mt-3 text-sm">
              {total} Stephen King books
            </p>
          </div>
          <nav className="flex flex-wrap gap-2">
            <Link
              href="/import"
              className="border-primary-foreground/75 hover:bg-primary-foreground/10 rounded-full border px-4 py-2 text-sm font-medium"
            >
              Back to fetch
            </Link>
            <ThemeToggle />
          </nav>
        </header>

        <EnrichButton pending={pending} />

        {books.length === 0 ? (
          <p className="border-border bg-card text-muted-foreground rounded-2xl border p-6 text-sm">
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
                    href={`/import/books?page=${page - 1}`}
                    className="border-border hover:bg-card rounded-full border px-5 py-2 text-sm"
                  >
                    Previous
                  </Link>
                ) : (
                  <span />
                )}
                <span className="text-muted-foreground text-sm">
                  Page {page} of {pageCount}
                </span>
                {page < pageCount ? (
                  <Link
                    href={`/import/books?page=${page + 1}`}
                    className="border-border hover:bg-card rounded-full border px-5 py-2 text-sm"
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
