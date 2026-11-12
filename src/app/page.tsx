import Link from "next/link";

import { BookBrowser } from "~/app/_components/book-browser";
import { auth } from "~/server/auth";

export default async function Home() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-[#f6f2eb] px-4 py-8 text-[#202b24] sm:px-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 flex flex-wrap items-start justify-between gap-4 border-b border-[#d9d3c6] pb-6">
          <div>
            <p className="mb-2 text-xs font-semibold tracking-[0.24em] text-[#5a7663] uppercase">
              COBISS book finder
            </p>
            <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
              Library catalog
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#5e675f]">
              Preview five English Stephen King matches from GBVK-16. Fetch
              runs on this machine; results stay in this browser tab.
            </p>
          </div>
          {session?.user && (
            <Link
              href="/api/auth/signout"
              className="rounded-full border border-[#c4cabc] px-4 py-2 text-sm font-medium hover:bg-white"
            >
              Sign out
            </Link>
          )}
        </header>

        {session?.user ? (
          <BookBrowser />
        ) : (
          <section className="max-w-lg rounded-2xl border border-[#ded9cd] bg-white p-8 shadow-sm">
            <h2 className="font-heading text-2xl font-semibold">Sign in to browse</h2>
            <p className="mt-3 text-sm leading-6 text-[#5e675f]">
              This catalog is available only to the approved Google account.
            </p>
            <Link
              href="/api/auth/signin"
              className="mt-6 inline-flex rounded-full bg-[#315c42] px-5 py-3 text-sm font-semibold text-white hover:bg-[#244a33]"
            >
              Sign in with Google
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}
