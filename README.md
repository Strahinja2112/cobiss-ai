# COBISS Book Finder

Local Next.js app built with Create T3 App. It fetches English-language books from the `gbvk-16` COBISS catalog (Odeljenje stranih jezika) and shows title, author, ISBN, and a link to each record. Results stay in the browser tab; no database or cron job is used.

## Setup

1. Run `pnpm install`.
2. Copy `.env.example` to `.env`. Set `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, and `ALLOWED_GOOGLE_EMAIL`.
3. Create a Google OAuth **Web application** client. Add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI. If the OAuth app is in testing mode, add your email as a test user.
4. Run `pnpm dev`, open `http://localhost:3000`, and sign in with the allowed Google account.
5. Click **Fetch all books**. Use **Stop** to end the crawl; books already received stay visible until refresh.

The English-language COBISS search currently reports about 2,100 records in this department. Fetching every ISBN may take a while. The page shows incoming results and fetch progress, 50 books at a time. Keep the tab and local server open until the crawl ends.

## Checks

Run `pnpm typecheck`, `node --test tests/cobiss.test.mjs`, and `pnpm build`. The `old/` directory contains the earlier CLI and sample output for reference. Prisma and tRPC files remain from the T3 scaffold, but no database route or database call is used by this feature.
