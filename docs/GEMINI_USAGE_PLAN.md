# Gemini enrichment usage display

## Goal

Show how many more books can be enriched with the configured Gemini model, without implying that a local estimate is Google's live quota.

## What limits the number

Gemini rate limits are per **project and model**, not per API key. Requests per minute, input tokens per minute, and requests per day can each block a request. Daily request limits reset at midnight Pacific time. Paid projects can also have spend limits. Chat and enrichment use the same `GEMINI_MODEL` and project, so both consume shared capacity. Other clients using that project also count. See [Gemini rate limits](https://aistudio.google.com/docs/rate-limits) and [billing](https://aistudio.google.com/docs/billing).

## Implementation plan

1. **Confirm source and access.** Identify the Google Cloud project behind `GEMINI_API_KEY`, its active model, and whether it is free or paid. Check the project's [AI Studio rate-limit dashboard](https://aistudio.google.com/rate-limit?timeRange=last-28-days) and [usage dashboard](https://aistudio.google.com/usage). Do not put the API key or Google Cloud credentials in the browser.
2. **Record this app's requests.** Add one usage record for each Gemini request from both the `pnpm books enrich` CLI and `/api/chat`: time, model, operation, outcome, and token counts from the Interactions API `usage` field. Record attempts even when enrichment fails after Gemini responds. Keep records separate from `BookEnrichment`, which represents saved profiles rather than all quota use. See [Interactions API usage fields](https://ai.google.dev/api/interactions-api).
3. **Get project-wide limits and usage.** If Google Cloud exposes the needed Gemini metrics for this project, read the model's limits through Cloud Quotas and actual use through Cloud Monitoring using server credentials. Verify metric names and access in the real project before coding the adapter. The AI Studio dashboards require `cloudquotas.quotas.get` for limits and `monitoring.timeSeries.list` for usage; see [AI Studio permissions](https://aistudio.google.com/docs/troubleshoot-ai-studio). If the metrics are unavailable, show app-only counts and a link to AI Studio, not a fabricated remaining balance.
4. **Present honest capacity.** In the settings drawer, show model, last updated time, remaining daily requests, short-window request/token headroom, and the relevant reset time when those values are available. Label app-only figures as estimates. Translate request headroom to “about N more books” only after measuring token use per enrichment; use the lowest applicable limit and state that other project traffic can change it. Keep the existing 25-book batch cap.
5. **Verify.** Compare displayed figures against AI Studio for the same project and model. Test day reset, shared chat traffic, failed requests, model changes, missing permissions, and 429 responses. Never present stale data as live quota.

## Decision before implementation

Choose between project-wide quota display, which needs Google Cloud read permissions, and a lighter app-only estimate. The drawer now links to Google's live rate-limit page until that decision is made.
