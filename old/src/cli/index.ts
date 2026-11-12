import "dotenv/config";
import { enrichBook } from "../lib/enrichment/enricher.js";
import { saveResultsToJson } from "../lib/utils/saver.js";
import { searchAllPages, searchBooks } from "../lib/cobiss/search.js";
import type { BookEntry, BookWithDetails } from "../types/index.js";

function showHelp(): void {
  console.log(`
  Usage: npm run search -- <upit> [opcije]

  Opcije:
    --all              Preuzmi sve strane rezultata
    --available, -a    Proveri dostupnost u biblioteci
    --google, -g       Google Books: opis, zanr, ocena, slike
    --enrich, -e       Sve: dostupnost + Google Books
    --help, -h         Prikazi pomoc

  Delfi.rs podaci se uvek prikupljaju (besplatno, brzo).

  Primeri:
    npm run search -- ljubav
    npm run search -- ljubav --available
    npm run search -- ljubav --google
    npm run search -- ljubav --enrich
    npm run search -- --all programiranje
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    showHelp();
    process.exit(0);
  }

  const fetchAll = args.includes("--all");
  const withAvailability = args.includes("--available") || args.includes("-a");
  const withGoogle = args.includes("--google") || args.includes("-g");
  const withEnrich = args.includes("--enrich") || args.includes("-e");

  const query = args
    .filter(
      (a) =>
        ![
          "--all",
          "--available",
          "-a",
          "--google",
          "-g",
          "--enrich",
          "-e",
          "--help",
          "-h",
        ].includes(a),
    )
    .join(" ");

  if (!query) {
    showHelp();
    process.exit(1);
  }

  if (withGoogle || withEnrich) {
    if (!process.env.GOOGLE_BOOKS_API_KEY) {
      console.log("  (Google Books — bez API kljuca, moguce ogranicenje)");
    }
  }

  console.log(`\n  Pretrazujem COBISS.SR za: "${query}"\n`);

  try {
    let items: (BookEntry | BookWithDetails)[] = [];
    let totalHits = 0;

    if (fetchAll) {
      const data = await searchAllPages(query, {
        materialType: "books",
        limit: 100,
        maxPages: 50,
      });
      items = data.combined;
      totalHits = data.totalHits;
    } else {
      const result = await searchBooks({
        query,
        limit: 25,
        materialType: "books",
      });
      items = result.items;
      totalHits = result.totalHits;
    }

    console.log(`  Nađeno: ${totalHits} rezultata\n`);

    if (items.length === 0) {
      console.log("  Nema rezultata.\n");
      process.exit(0);
    }

    const doExtra = withAvailability || withGoogle || withEnrich;

    if (doExtra) {
      console.log(`  Prikupljam podatke za ${items.length} knjiga...\n`);
      const enriched: BookWithDetails[] = [];
      for (let i = 0; i < items.length; i++) {
        const book = items[i] as BookEntry;
        process.stdout.write(
          `    [${i + 1}/${items.length}] ${book.title.slice(0, 40).padEnd(41)}`,
        );
        const detail = await enrichBook(book, {
          availability: withAvailability || withEnrich,
          google: withGoogle || withEnrich,
        });
        process.stdout.write(` ${detail.availability?.status ?? "OK"}\n`);
        enriched.push(detail);
      }
      console.log();
      items = enriched;
    }

    for (const book of items) {
      const line = [
        `  ${String(book.position).padStart(2)}.`,
        book.title.padEnd(50).slice(0, 50),
        book.author.padEnd(28).slice(0, 28),
        book.year,
      ];
      console.log(line.join(" "));

      if ("cobiss" in book && book.cobiss.isbn) {
        console.log(`       ISBN: ${book.cobiss.isbn}`);
      }
      if ("availability" in book && book.availability?.status) {
        console.log(`       Status: ${book.availability.status}`);
      }
      if ("google" in book && book.google) {
        const g = book.google;
        if (g.categories?.length)
          console.log(`       Zanr: ${g.categories.join(", ")}`);
        if (g.averageRating)
          console.log(
            `       Ocena: ${"*".repeat(Math.round(g.averageRating))} (${g.averageRating}/5)`,
          );
        if (g.pageCount) console.log(`       Strane: ${g.pageCount}`);
        if (g.subtitle) console.log(`       Podnaslov: ${g.subtitle}`);
      }
      if ("delfi" in book && book.delfi) {
        const d = book.delfi;
        const cats = d.genres
          ?.map((g) => g.genreName)
          .filter(Boolean)
          .join(", ");
        if (cats) console.log(`       Kategorije: ${cats}`);
        const pages = d.attributes?.find((a) => a.k === "numberOfPages")?.v;
        if (pages) console.log(`       Strane: ${pages}`);
        if (d.publisher) console.log(`       Izdavac: ${d.publisher}`);
      }
      if ("description" in book && book.description) {
        console.log(
          `       Opis: ${book.description.slice(0, 200).replace(/\n/g, " ")}`,
        );
      }
      if ("imageUrl" in book && book.imageUrl) {
        console.log(`       Slika: ${book.imageUrl}`);
      }
    }

    const filePath = await saveResultsToJson(
      fetchAll
        ? { query, results: [], combined: items, totalHits }
        : {
            query,
            totalHits,
            page: 0,
            limit: items.length,
            items,
            fetchedAt: new Date().toISOString(),
          },
    );
    console.log(`\n  Rezultati sacuvani u: ${filePath}\n`);
  } catch (err: unknown) {
    const error = err as { message?: string; statusCode?: number };
    console.error(`\n  Greska: ${error.message ?? String(err)}`);
    if (error.statusCode) console.error(`  HTTP status: ${error.statusCode}`);
    process.exit(1);
  }
}

main();
