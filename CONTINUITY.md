# Continuity

## Snapshot

- 2026-11-15 [USER] Goal: mobile-style bottom settings drawer with theme choice; plan Gemini enrichment capacity display.
- 2026-11-15 [CODE] Now: mobile settings drawer and usage plan ready; task files prepared for commit.
- 2026-11-15 [CODE] Next: verify on a real phone and choose quota data source before implementing remaining-capacity display.
- 2026-11-15 [CODE] Open: project-wide quota permissions and whether sign-in UI change is temporary.

## Done (recent)

- 2026-11-15 [TOOL] `acfbc17` committed chat UI and initial settings drawer; `e63b19e` committed chat hook extraction.
- 2026-11-15 [TOOL] Reviewed README, product plan, frontend plan, package scripts, Prisma schema, routes, tests, and working-tree changes.

## Decisions

- 2026-11-15 [USER] D001 ACTIVE: Keep code modules at or below 300 lines; build modularly, avoid development fallbacks and empty catches, and design UI for readers.
- 2026-11-15 [USER] D002 ACTIVE: Maintain this bounded ledger with dated, tagged facts; update only for meaningful changes.
- 2026-11-15 [USER] D003 ACTIVE: Keep current `AGENTS.md` rules and add commit guidance.
- 2026-11-15 [USER] D004 ACTIVE: Commit completed work automatically; require verification by change type, migration and data preservation planning, and server-side approved-account access control.
- 2026-11-15 [USER] D005 ACTIVE: Settings remain a bottom drawer, designed for future mobile use; use larger title, smaller subtitle, no X, and avoid nested cards.

## Open questions

- 2026-11-15 [ASSUMPTION] UNCONFIRMED: Whether disabled sign-in gate in current `src/app/page.tsx` is temporary local work.
- 2026-11-15 [ASSUMPTION] UNCONFIRMED: Whether `AGENTS.md` should govern current King-only reader app or planned full-catalog expansion.
- 2026-11-15 [ASSUMPTION] UNCONFIRMED: Whether Google Cloud project quota metrics are available for in-app remaining-capacity display.

## Working set

- 2026-11-15 [CODE] `src/app/_components/chat-header.tsx`, `src/components/ui/drawer.tsx`, `src/app/layout.tsx`, `src/styles/globals.css`
- 2026-11-15 [CODE] `GEMINI_USAGE_PLAN.md`, `src/app/api/books/enrich/route.ts`, `src/app/api/chat/route.ts`

## Receipts

- 2026-11-15 [TOOL] `git status`: unrelated local edits remain in `src/app/layout.tsx`, `src/app/page.tsx`, `src/components/ui/textarea.tsx`, and `GEMINI_USAGE_PLAN.md`.
- 2026-11-15 [TOOL] `pnpm typecheck`, targeted ESLint, Prettier on edited TSX, and Impeccable detector passed; browser host unavailable.
- 2026-11-15 [TOOL] `pnpm build` compiled UI but failed on existing lint errors in chat tests and unused UI components; page also has unused imports.
- 2026-11-15 [CODE] Earlier receipt called `GEMINI_USAGE_PLAN.md` unrelated; superseded: it is a deliverable for current settings task.
- 2026-11-15 [TOOL] `git status --short`: modified `AGENTS.md`, chat UI, layout, page, textarea; untracked chat hook.
- 2026-11-15 [TOOL] `AGENTS.md` changed from empty to user-supplied rules between tool reads; earlier empty-file state is superseded.
- 2026-11-15 [TOOL] Staged `AGENTS.md` and `CONTINUITY.md` only; `git diff --cached --check` passed.
- 2026-11-15 [CODE] `/` has Gemini chat over saved enriched Stephen King books; `/import` fetches COBISS; `/import/books` lists and enriches in batches of 25.
- 2026-11-15 [CODE] README lists `pnpm typecheck`, Node tests, and `pnpm build` as checks.
