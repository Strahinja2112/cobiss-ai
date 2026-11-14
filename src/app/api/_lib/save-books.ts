import type { PrismaClient } from "../../../../generated/prisma";

import { authorNames } from "./author-names.ts";
import { COBISS_CATALOG, type CrawlEvent } from "./cobiss.ts";

export async function saveBooks(
  event: CrawlEvent,
  db: Pick<PrismaClient, "book">,
): Promise<void> {
  if (event.type === "page") {
    for (const book of event.books) {
      const authors = authorNames(book.author).map((name) => ({
        where: { name },
        create: { name },
      }));
      await db.book.upsert({
        where: {
          catalog_cobissId: {
            catalog: COBISS_CATALOG,
            cobissId: book.cobissId,
          },
        },
        create: {
          catalog: COBISS_CATALOG,
          cobissId: book.cobissId,
          title: book.title,
          authors: { connectOrCreate: authors },
          isbn: book.isbn,
          sourceUrl: book.url,
        },
        update: {
          title: book.title,
          authors: { set: [], connectOrCreate: authors },
          sourceUrl: book.url,
          lastFetchedAt: new Date(),
        },
      });
    }
  } else if (event.type === "isbn") {
    for (const item of event.items) {
      if (!item.isbn) continue;
      await db.book.update({
        where: {
          catalog_cobissId: {
            catalog: COBISS_CATALOG,
            cobissId: item.cobissId,
          },
        },
        data: { isbn: item.isbn },
      });
    }
  }
}
