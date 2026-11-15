# Continuity

## Snapshot

- 2026-11-16 [USER] Goal: reconcile local GBVK-16 books with COBISS and explain search differences.
- 2026-11-16 [TOOL] Now: all 2,090 live IDs and all seven pictured “train” results are saved locally; Prisma Studio title filter differs from COBISS search.
- 2026-11-16 [CODE] Next: rerun `pnpm books fetch` when COBISS changes; enrich books for chat separately.
- 2026-11-16 [CODE] Open: no blocking questions; sign-in UI and Gemini quota work remain separate.

## Done (recent)

- 2026-11-16 [TOOL] Backfilled three missing COBISS records and verified a complete 2,090-ID match with the local DB.
- 2026-11-16 [CODE] Added Node CLI, usage docs, and focused behavior tests; removed import UI/API and stale links.
- 2026-11-16 [CODE] Added saved/enriched/pending counts to the main page using parallel database counts.
- 2026-11-16 [CODE] Removed Stephen King restrictions from chat, saved-book list, and enrichment query; updated product docs.
- 2026-11-15 [CODE] Replaced full-width header and in-conversation New chat control with two floating actions.
- 2026-11-15 [CODE] Added spring theme selection, press feedback, theme transitions, and empty-chat entrance with reduced-motion handling.
- 2026-11-15 [TOOL] `acfbc17` committed chat UI and initial settings drawer; `e63b19e` committed chat hook extraction.

## Decisions

- 2026-11-15 [USER] D001 ACTIVE: Keep code modules at or below 300 lines; build modularly, avoid development fallbacks and empty catches, and design UI for readers.
- 2026-11-15 [USER] D002 ACTIVE: Maintain this bounded ledger with dated, tagged facts; update only for meaningful changes.
- 2026-11-15 [USER] D003 ACTIVE: Keep current `AGENTS.md` rules and add commit guidance.
- 2026-11-15 [USER] D004 ACTIVE: Commit completed work automatically; require verification by change type, migration and data preservation planning, and server-side approved-account access control.
- 2026-11-15 [USER] D005 ACTIVE: Settings remain a bottom drawer, designed for future mobile use; use larger title, smaller subtitle, no X, and avoid nested cards.
- 2026-11-16 [USER] D006 ACTIVE: CLI supports Node 22.18+ without a new runtime dependency; remove `/api/books/stream` and `/api/books/enrich` after CLI parity.

## Open questions

- 2026-11-15 [ASSUMPTION] UNCONFIRMED: Whether disabled sign-in gate in current `src/app/page.tsx` is temporary local work.
- 2026-11-15 [ASSUMPTION] UNCONFIRMED: Whether `AGENTS.md` should govern current King-only reader app or planned full-catalog expansion.
- 2026-11-15 [ASSUMPTION] UNCONFIRMED: Whether Google Cloud project quota metrics are available for in-app remaining-capacity display.

## Working set

- 2026-11-16 [CODE] `scripts/books.mjs`, `scripts/books/*.mjs`, `tests/books-cli*.mjs`, `src/app/_components/chat-home.tsx`
- 2026-11-16 [CODE] `README.md`, `PRODUCT.md`, `FRONTEND_PLAN.md`, `GEMINI_USAGE_PLAN.md`, `AGENTS.md`

## Receipts

- 2026-11-16 [TOOL] Read-only DB lookup found all seven pictured COBISS “train” results. Prisma title `contains: "train"` returned the four Studio rows; case-insensitive contains returned five, adding `Train dreams`. COBISS also returns three titles without “train”; Studio includes `The death strain` via substring match.
- 2026-11-16 [TOOL] Before backfill: live catalog had 2,090 unique English-book IDs, local DB 2,087; missing IDs were 54611977, 13520695, and 334684672. Most recent pre-backfill fetch was 2026-11-12T19:27:52Z; exact reason for omissions UNCONFIRMED.
- 2026-11-16 [TOOL] Backfilled those three via existing `fetchSearchPage`, `fetchIsbn`, and `saveBooks`; full 21-page reconciliation afterward found 2,090 local IDs, zero missing and zero stale.
- 2026-11-16 [TOOL] Worktree `.env` resolves to main checkout `.env`; read-only query on `localhost:5432/cobiss-ai-app` found Christie `10213687`, row ID `cmwdxd93p00etg0vi2d3w864d`, with 1,553 books ahead (50/page, page 32).
- 2026-11-16 [TOOL] Live GBVK-16 author search returned six Christie books, one matching `la=eng`: `The mysterious affair at Styles` (COBISS `10213687`).
- 2026-11-16 [TOOL] Read-only DB query found that exact record among 2,087 saved books with `enrichment: null`; chat query requires `enrichment isNot null`.
- 2026-11-16 [TOOL] CLI tests, existing Node tests, TypeScript, targeted ESLint, and diff whitespace passed; live `list` could not connect to PostgreSQL at localhost:5432.
- 2026-11-16 [TOOL] Escalated production build compiled; lint failed on existing errors in chat tests and unrelated UI components. Isolated sandbox build first failed to fetch Google Fonts.
- 2026-11-15 [TOOL] Floating-action change passed `pnpm typecheck`, targeted ESLint, Prettier, and `git diff --check`.
- 2026-11-16 [TOOL] Created `feat/import-cli`; `node --test tests/*.test.mjs src/app/api/_lib/*.test.ts` passed 5 files and `pnpm typecheck` passed before edits.
- 2026-11-15 [TOOL] Animation change passed `pnpm typecheck`, targeted ESLint, and `git diff --check`; browser host unavailable for visual feel-check.
- 2026-11-15 [TOOL] New animation changes passed typecheck, targeted ESLint, Prettier, and CSS compile; `pnpm build` still fails on unrelated existing lint errors.
- 2026-11-15 [TOOL] `pnpm typecheck`, targeted ESLint, Prettier on edited TSX, and Impeccable detector passed; browser host unavailable.
- 2026-11-15 [TOOL] `pnpm build` compiled UI but failed on existing lint errors in chat tests and unused UI components; page also has unused imports.
- 2026-11-15 [CODE] Earlier receipt called `GEMINI_USAGE_PLAN.md` unrelated; superseded: it is a deliverable for current settings task.
- 2026-11-15 [TOOL] Staged `AGENTS.md` and `CONTINUITY.md` only; `git diff --cached --check` passed.
- 2026-11-15 [CODE] `/` has Gemini chat over saved enriched Stephen King books; `/import` fetches COBISS; `/import/books` lists and enriches in batches of 25.
- 2026-11-15 [CODE] README lists `pnpm typecheck`, Node tests, and `pnpm build` as checks.
