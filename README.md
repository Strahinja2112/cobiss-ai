# COBISS Book Finder

Local Next.js app built with Create T3 App. The main page is a Gemini chat that recommends from all saved books with enrichment profiles. The terminal CLI fetches English-language books from the `gbvk-16` COBISS catalog (Odeljenje stranih jezika) and saves them in PostgreSQL. No cron job is used.

The reader chat lives at `/`. Run catalog maintenance commands locally with Node 22.18+.

## Setup

1. Run `pnpm install`.
2. Copy `.env.example` to `.env`. Set `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `ALLOWED_GOOGLE_EMAIL`, and `DATABASE_URL`.
3. Create a Google OAuth **Web application** client. Add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI. If the OAuth app is in testing mode, add your email as a test user.
4. Start PostgreSQL and run `pnpm db:migrate` to create the tables.
5. Run `pnpm dev`, open `http://localhost:3000`, and sign in with the allowed Google account.
6. Run `pnpm books fetch` to fetch and save books. Press Ctrl-C to stop; books already saved remain in PostgreSQL.

The CLI fetches every English-language book in this department and checks each ISBN. Repeating a fetch updates records instead of creating duplicates. Progress appears in the terminal. Run `pnpm books list` to see saved records (50 per page), `pnpm books list 2` for the next page, or `pnpm books show <book-id>` for metadata and a saved profile. The book ID appears in the list.

Commands use `gbvk-16` by default. Add `--catalog gbvk-17` after a command's arguments to target another GBVK department, for example `pnpm books fetch --catalog gbvk-17`, `pnpm books list 2 --catalog gbvk-17`, or `pnpm books enrich --catalog gbvk-17`. The list, details, and enrichment commands only use books from the selected catalog.

To build AI recommendation profiles, set `GEMINI_API_KEY` in `.env`, then run `pnpm books enrich`. The CLI tries `gemini-3.5-flash-lite`, then `gemini-3.1-flash-lite` if Gemini returns an HTTP error. Each run processes at most 25 saved books without profiles; progress and failures appear in the terminal. Rerun to process another batch. Gemini calls may incur charges. Chat still uses `GEMINI_MODEL` from `.env`.

On `/`, ask for a book recommendation in plain English and follow up in the same conversation. Gemini receives every saved book profile and can recommend only books with saved enrichment. Open a suggested book for its full profile. Chat history lasts until the page is refreshed; each message makes a Gemini call and may incur charges.

For an existing database created with `prisma db push`, first run `pnpm exec prisma migrate resolve --applied 20261114170000_baseline`, then `pnpm db:migrate`. The baseline records the tables already present; the next migration links existing books to authors.

## Checks

Run `pnpm typecheck`, `node --test tests/*.test.mjs src/app/api/_lib/*.test.ts`, and `pnpm build`. The `old/` directory contains the earlier CLI and sample output for reference. The app uses Prisma for saved books; tRPC files remain from the T3 scaffold.
