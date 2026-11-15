# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

One reader using the approved Google account. Additional reader accounts are outside the first release.

## Product Purpose

Talk to a chatbot about saved COBISS books and receive recommendations based on personal taste or a selected book. Inspect the catalog and AI-generated details. Begin with Stephen King books; expand to the full catalog later.

## Operating Context

The owner manually fetches books from COBISS and enriches displayed books in batches of up to 25 with Gemini. The main page is a chat grounded in those profiles. The import pages provide fetching, saved books, and book details. Gemini profiles include a summary, genres, themes, mood, reading-experience labels, and uncertainty notes.

## Constraints

- Only the approved Google account can access saved books and enrichment.
- Gemini calls are manually triggered and may incur charges.
- The first recommendation pool is the Stephen King books selected by the current catalog filter.
- Recommendations should use saved books and their enrichment profiles, and should explain why each result fits.
- The interface uses the published Olive shadcn theme: https://shadcnpreset.com/themes/olive-large-corners. Dark mode is the default, with a saved light mode choice.

## Open Decisions

- Whether to persist taste preferences and reading feedback after the first recommendation flow works.
- When and how to open access to other readers or the full catalog.
