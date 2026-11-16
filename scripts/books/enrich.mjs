import { setTimeout as delay } from "node:timers/promises";

import {
  enrichBook,
  GeminiHttpError,
} from "../../src/app/api/_lib/enrich-book.ts";
import { plain } from "./catalog.mjs";

export async function runEnrich(db, signal, apiKey, model, catalog) {
  const books = await db.book.findMany({
    where: { catalog, enrichment: { is: null } },
    include: { authors: { select: { name: true } } },
    orderBy: [{ lastFetchedAt: "desc" }, { id: "desc" }],
    take: 25,
  });
  let saved = 0;
  let failed = 0;

  console.log(`Enriching ${books.length} books with ${model}`);
  for (const book of books) {
    signal.throwIfAborted();
    try {
      let enrichment;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          enrichment = await enrichBook(book, apiKey, model, signal);
          break;
        } catch (error) {
          if (
            !(error instanceof GeminiHttpError) ||
            error.status !== 503 ||
            attempt === 2
          )
            throw error;
          console.error(`${plain(book.title)}: ${error.message}; retrying`);
          await delay(1000 * 2 ** attempt, undefined, { signal });
        }
      }
      if (!enrichment) throw new Error("Gemini returned no enrichment");
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
      console.log(`Saved ${saved}/${books.length}: ${plain(book.title)}`);
    } catch (error) {
      if (signal.aborted) throw error;
      failed++;
      console.error(
        `${plain(book.title)}: ${plain(error instanceof Error ? error.message : error)}`,
      );
      if (error instanceof GeminiHttpError) break;
    }
  }
  console.log(`Batch complete: ${saved} saved, ${failed} failed`);
  return { saved, failed };
}
