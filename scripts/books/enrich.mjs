import {
  enrichBook,
  GeminiHttpError,
} from "../../src/app/api/_lib/enrich-book.ts";
import { plain } from "./catalog.mjs";
import { enrichmentModels } from "./models.mjs";

export async function runEnrich(db, signal, apiKey, catalog) {
  const books = await db.book.findMany({
    where: { catalog, enrichment: { is: null } },
    include: { authors: { select: { name: true } } },
    orderBy: [{ lastFetchedAt: "desc" }, { id: "desc" }],
    take: 25,
  });
  let saved = 0;
  let failed = 0;

  console.log(
    `Enriching ${books.length} books with ${enrichmentModels.join(", then ")}`,
  );
  for (const book of books) {
    signal.throwIfAborted();
    try {
      let enrichment;
      let model;
      for (const candidate of enrichmentModels) {
        try {
          enrichment = await enrichBook(book, apiKey, candidate, signal);
          model = candidate;
          break;
        } catch (error) {
          if (
            !(error instanceof GeminiHttpError) ||
            candidate === enrichmentModels.at(-1)
          )
            throw error;
          console.error(
            `${plain(book.title)}: ${candidate}: ${error.message}; trying next model`,
          );
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
