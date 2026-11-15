import {
  enrichBook,
  GeminiHttpError,
} from "../../src/app/api/_lib/enrich-book.ts";
import { plain } from "./catalog.mjs";

export async function runEnrich(db, signal, apiKey, model) {
  const books = await db.book.findMany({
    where: { enrichment: { is: null } },
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
      const { summary, genres, themes, mood, ...profile } = await enrichBook(
        book,
        apiKey,
        model,
        signal,
      );
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
