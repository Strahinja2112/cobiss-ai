# COBISS Book Finder

Local Next.js app built with Create T3 App. It fetches English-language books from the `gbvk-16` COBISS catalog (Odeljenje stranih jezika), saves title, author, ISBN, and source URL in PostgreSQL, and lists saved books at `/import/books`. No cron job is used.

The existing fetch and saved-books pages live at `/import` and `/import/books` in `src/app/import/`. The old URLs redirect to these pages.

## Setup

1. Run `pnpm install`.
2. Copy `.env.example` to `.env`. Set `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `ALLOWED_GOOGLE_EMAIL`, and `DATABASE_URL`.
3. Create a Google OAuth **Web application** client. Add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI. If the OAuth app is in testing mode, add your email as a test user.
4. Start PostgreSQL and run `pnpm db:migrate` to create the tables.
5. Run `pnpm dev`, open `http://localhost:3000/import`, and sign in with the allowed Google account.
6. Click **Fetch and save all books**. Use **Stop** to end the fetch; saved books remain available at `/import/books`.

The app fetches every English-language book in this department and checks each ISBN. Repeating a fetch updates records instead of creating duplicates. The import page shows incoming results and fetch progress; `/import/books` lists saved records.

To build AI recommendation profiles, set `GEMINI_API_KEY` and `GEMINI_MODEL` in `.env`, then click **Enrich next 25** on `/import/books`. Each run processes at most 25 displayed books without profiles; progress and failures appear beside the button. Select a book to review its metadata and completed profile in the details panel. Gemini calls may incur charges.

For an existing database created with `prisma db push`, first run `pnpm exec prisma migrate resolve --applied 20261114170000_baseline`, then `pnpm db:migrate`. The baseline records the tables already present; the next migration links existing books to authors.

## Checks

Run `pnpm typecheck`, `node --test tests/*.test.mjs src/app/api/_lib/*.test.ts`, and `pnpm build`. The `old/` directory contains the earlier CLI and sample output for reference. The app uses Prisma for saved books; tRPC files remain from the T3 scaffold.
