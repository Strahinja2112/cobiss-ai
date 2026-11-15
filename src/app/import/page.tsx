import Link from "next/link";

import { ThemeToggle } from "~/components/theme-toggle";
import { BookBrowser } from "./_components/book-browser";
import { auth } from "~/server/auth";

export default async function Home() {
  const session = await auth();

  return (
    <div className="bg-background text-foreground min-h-screen px-4 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <header className="bg-primary text-primary-foreground mb-10 flex flex-wrap items-start justify-between gap-5 rounded-md px-6 py-7 sm:px-8">
          <div>
            <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
              Library catalog
            </h1>
            <p className="text-primary-foreground/85 mt-3 max-w-xl text-sm leading-6">
              Fetch English books from GBVK-16 and save them to the database.
              Fetch runs on this machine.
            </p>
          </div>
          <nav className="flex flex-wrap gap-2">
            {session?.user && (
              <>
                <Link
                  href="/import/books"
                  className="border-primary-foreground/75 hover:bg-primary-foreground/10 rounded-md border px-4 py-2 text-sm font-medium"
                >
                  Saved books
                </Link>
                <Link
                  href="/api/auth/signout"
                  className="border-primary-foreground/75 hover:bg-primary-foreground/10 rounded-md border px-4 py-2 text-sm font-medium"
                >
                  Sign out
                </Link>
              </>
            )}
            <ThemeToggle />
          </nav>
        </header>

        {session?.user ? (
          <BookBrowser />
        ) : (
          <section className="border-border bg-card max-w-lg rounded-md border p-8 shadow-sm">
            <h2 className="font-heading text-2xl font-semibold">
              Sign in to browse
            </h2>
            <p className="text-muted-foreground mt-3 text-sm leading-6">
              This catalog is available only to the approved Google account.
            </p>
            <Link
              href="/api/auth/signin"
              className="bg-primary text-primary-foreground hover:bg-primary/90 mt-6 inline-flex rounded-md px-5 py-3 text-sm font-semibold"
            >
              Sign in with Google
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}
