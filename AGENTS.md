## Important rules

- Build modular first. No code files longer than 300 lines of code! Documentation, plans etc. can be as long as needed, but code files must be modular.
- Think ahead! Do not write code that you know will need to be changed later without planning for that change now. So keep entrypoints stable and isolate logic into smaller modules from the start!
- Do not limit yourself due to the LOC limit! If a task requires more code, split it into multiple files/modules/functions
- Do not add default fallbacks during development phase. Is something fails, let it fail, so we can fix it!
- Do not leavy empty try-catch blocks anywhere!
- Do not reinvent the wheel! Use open source, self-hosted libraries when needed. Ask the user, and help them qualify their selection.
- Design UI for the end-user, not for the schema!

## Commits

- Commit completed tasks automatically after applicable checks. Do not bundle separate tasks into one commit.
- Before committing, inspect `git status` and the staged diff. Stage only files for the completed task; never use `git add -A` when unrelated work is present.
- Run checks relevant to the change before committing. Report any check that could not run or failed; never describe an unrun check as passed.
- Make each commit one coherent change. Use a short, imperative subject that says what changed; add a body when the reason or a migration step is not clear from the diff.
- Never commit secrets, `.env`, generated build output, or unrelated user changes. Update `.env.example` when required configuration changes.
- Do not amend, force-push, reset, or rewrite existing history unless the user explicitly asks.

## Verification

- For documentation-only changes, run `git diff --check`; application builds are unnecessary.
- For TypeScript or server behavior changes, run `pnpm typecheck` and focused tests for changed logic. Run `pnpm build` when routes, configuration, or production behavior change.
- For UI changes, run `pnpm typecheck` and check the affected flow on desktop and mobile, including keyboard access and empty, loading, and error states.
- If a required check cannot run, state why and what remains unverified. Fix failing checks before marking a task complete.

## Database changes

- Change the Prisma schema through a committed migration; do not use `db:push` as a substitute for a migration.
- Before applying a migration to existing data, document how it preserves or transforms rows and how to recover if it fails. Review generated SQL for destructive operations.
- Do not apply destructive migrations to a live database without explicit user approval.

## Access control

- Enforce the approved Google account on reader pages and their server routes. Check authorization on the server before reading saved books or calling Gemini.
- Do not treat hidden buttons or client-side redirects as access control. Keep sign-in UI available when access is denied.

## Continuity Ledger (compaction-safe)

Maintain a single continuity file for this workspace: `CONTINUITY.md`.
`CONTINUITY.md` is the canonical briefing designed to survive compaction; do not rely on earlier chat/tool output unless it's reflected there.

### Operating rule

- At the start of each assistant turn: read `CONTINUITY.md` before acting.
- Update `CONTINUITY.md` only when there is a meaningful delta in: Goal/success criteria, Invariants/constraints, Decisions, State (Done/Now/Next), Open questions, Working set, or important tool outcomes.

### Keep it bounded (anti-bloat)

- Keep `CONTINUITY.md` short and high-signal:
  - `Snapshot`: ≤ 25 lines.
  - `Done (recent)`: ≤ 7 bullets.
  - `Working set`: ≤ 12 paths.
  - `Receipts`: keep last 10–20 entries.
- If sections exceed caps, compress older items into milestone bullets with pointers (commit/PR/log path/doc path). Do not paste raw logs.

### Anti-drift rules

- Facts only, no transcripts.
- Every entry must include:
  - a date or ISO timestamp (e.g., `2026-01-13` or `2026-01-13T09:42Z`)
  - a provenance tag: `[USER]`, `[CODE]`, `[TOOL]`, `[ASSUMPTION]`
- If unknown, write `UNCONFIRMED` (never guess). If something changes, supersede it explicitly (don't silently rewrite history).

### Decisions and incidents

- Record durable choices in `Decisions` as ADR-lite entries (e.g., `D001 ACTIVE: …`).
- For recurring weirdness, create a small, stable incident capsule (Symptoms / Evidence pointers / Mitigation / Status).

### Plan tool vs ledger

- Use `update_plan` for short-term execution scaffolding (3–7 steps).
- Use `CONTINUITY.md` for long-running continuity ("what/why/current state"), not micro task lists.
- Keep them consistent at the intent/progress level.

### In replies

- Start with a brief "Ledger Snapshot" (Goal + Now + Next + Open Questions).
- Print the full ledger only when it materially changed or the user requests it.
