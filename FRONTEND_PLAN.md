# Reader frontend plan

## Current state

The reader chat lives at `/`. The owner uses `pnpm books fetch`, `list`, `show`, and `enrich` for catalog maintenance. The app admits one approved Google account. Chat recommendations use every saved book with an enrichment profile; conversations are currently kept only in the open page.

## First reader journey

1. Sign in at `/` and ask for a recommendation in natural language.
2. Continue the conversation with follow-ups, such as asking for a shorter or less graphic book.
3. See recommendations from all enriched saved books, each with a reason tied to its profile.
4. Open a recommendation to inspect its profile or COBISS record; use the CLI for catalog maintenance.

## Implementation order

1. **Built:** Chat at `/`, approved-account gate, saved-book grounding, follow-up questions, explanation cards, and book details.
2. **Catalog:** Add a reader-facing book list with search and useful profile filters. Reuse the current book details panel; show whether a book has an enrichment profile.
3. **Feedback:** Add simple “interested” and “not for me” actions so the owner can refine a session without editing data. Decide whether feedback needs persistence after the first flow is usable.
4. **Expansion:** Extend the candidate pool to the full imported catalog and revisit ranking quality and persistent preferences.

## Design and verification

Use the published [Olive shadcn theme](https://shadcnpreset.com/themes/olive-large-corners) for light and dark color tokens, with dark as the default and a persistent mode switch. Keep readable book titles, keyboard access, and a compact mobile layout. Verify the approved-account gate, book details panel, recommendation explanations, and empty states. Verify CLI paging and manual enrichment separately. Gemini enrichment remains capped at 25 books per batch.
