# Continuity

## Snapshot

- 2026-11-15 [USER] Goal: commit completed chat hook and UI work in separate task-specific commits.
- 2026-11-15 [TOOL] Now: chat hook extraction committed as `e63b19e`; chat UI changes are under verification.
- 2026-11-15 [CODE] Next: commit chat UI after checks; leave unrelated layout, page, textarea, and Gemini plan changes unstaged.
- 2026-11-15 [CODE] Open: intended product scope and whether current sign-in UI change is temporary.

## Done (recent)

- 2026-11-15 [TOOL] `e63b19e` extracted chat state and request logic into `useChatHome`; `pnpm typecheck` passed.
- 2026-11-15 [TOOL] Reviewed README, product plan, frontend plan, package scripts, Prisma schema, routes, tests, and working-tree changes.

## Decisions

- 2026-11-15 [USER] D001 ACTIVE: Keep code modules at or below 300 lines; build modularly, avoid development fallbacks and empty catches, and design UI for readers.
- 2026-11-15 [USER] D002 ACTIVE: Maintain this bounded ledger with dated, tagged facts; update only for meaningful changes.
- 2026-11-15 [USER] D003 ACTIVE: Keep current `AGENTS.md` rules and add commit guidance.
- 2026-11-15 [USER] D004 ACTIVE: Commit completed work automatically; require verification by change type, migration and data preservation planning, and server-side approved-account access control.

## Open questions

- 2026-11-15 [ASSUMPTION] UNCONFIRMED: Whether disabled sign-in gate in current `src/app/page.tsx` is temporary local work.
- 2026-11-15 [ASSUMPTION] UNCONFIRMED: Whether `AGENTS.md` should govern current King-only reader app or planned full-catalog expansion.

## Working set

- 2026-11-15 [CODE] `AGENTS.md`, `README.md`, `PRODUCT.md`, `FRONTEND_PLAN.md`
- 2026-11-15 [CODE] `src/app/_components/chat-home.tsx`, `chat-header.tsx`, `chat-book-details.tsx`, `src/components/theme-toggle.tsx`
- 2026-11-15 [CODE] `src/hooks/use-chat-home.ts`, `src/app/api/_lib/`, `prisma/schema.prisma`

## Receipts

- 2026-11-15 [TOOL] `git status`: unrelated local edits remain in `src/app/layout.tsx`, `src/app/page.tsx`, `src/components/ui/textarea.tsx`, and `GEMINI_USAGE_PLAN.md`.
- 2026-11-15 [TOOL] `git status --short`: modified `AGENTS.md`, chat UI, layout, page, textarea; untracked chat hook.
- 2026-11-15 [TOOL] `AGENTS.md` changed from empty to user-supplied rules between tool reads; earlier empty-file state is superseded.
- 2026-11-15 [TOOL] Staged `AGENTS.md` and `CONTINUITY.md` only; `git diff --cached --check` passed.
- 2026-11-15 [CODE] `/` has Gemini chat over saved enriched Stephen King books; `/import` fetches COBISS; `/import/books` lists and enriches in batches of 25.
- 2026-11-15 [CODE] README lists `pnpm typecheck`, Node tests, and `pnpm build` as checks.
