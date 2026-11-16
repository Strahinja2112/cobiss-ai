import {
  enrichBook,
  GeminiHttpError,
} from "../../src/app/api/_lib/enrich-book.ts";
import { createEnrichLog } from "./enrich-log.mjs";
import { enrichmentModels } from "./models.mjs";

export async function runEnrich(db, signal, apiKey, catalog) {
  const books = await db.book.findMany({
    where: { catalog, enrichment: { is: null } },
    include: { authors: { select: { name: true } } },
    orderBy: [{ lastFetchedAt: "desc" }, { id: "desc" }],
  });
  let saved = 0;
  let failed = 0;
  let processed = 0;
  let reason = "Complete";
  const log = createEnrichLog(catalog, books.length);

  try {
    for (const [position, book] of books.entries()) {
      signal.throwIfAborted();
      const index = position + 1;
      let model;
      try {
        let enrichment;
        for (const [modelIndex, candidate] of enrichmentModels.entries()) {
          model = candidate;
          log.attempt(index, book.title);
          try {
            enrichment = await enrichBook(book, apiKey, candidate, signal);
            break;
          } catch (error) {
            if (
              !(error instanceof GeminiHttpError) ||
              modelIndex === enrichmentModels.length - 1
            )
              throw error;
          }
        }
        if (!enrichment || !model)
          throw new Error("Gemini returned no enrichment");
        const { summary, genres, themes, mood, ...profile } = enrichment;
        signal.throwIfAborted();
        await db.bookEnrichment.upsert({
          where: { bookId: book.id },
          create: {
            bookId: book.id,
            summary,
            genres,
            themes,
            mood,
            profile,
            model,
          },
          update: {},
        });
        saved++;
        processed++;
        log.saved(index, saved, failed);
      } catch (error) {
        if (signal.aborted) throw error;
        failed++;
        processed++;
        log.failed(index, book.title, model, error, failed);
        if (error instanceof GeminiHttpError) {
          reason = "Stopped: Gemini models exhausted";
          break;
        }
      }
    }
  } finally {
    const outcome =
      reason === "Complete" && failed > 0 ? "Finished with failures" : reason;
    log.finish(
      signal.aborted ? "Interrupted" : outcome,
      processed,
      saved,
      failed,
    );
  }
  return { saved, failed };
}
