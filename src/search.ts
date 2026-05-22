import {
  searchBooks,
  searchAllPages,
  saveResultsToJson,
  fetchBookDetails,
  fetchAvailability,
  enrichBook,
} from "./scraper.js"
import type { BookEntry, BookWithDetails } from "./types.js"
import * as fs from "node:fs/promises"

function showHelp(): void {
  console.log(`
  Usage: npm run search -- <upit> [opcije]

  Opcije:
    --all           Preuzmi sve strane rezultata
    --details, -d   Prikupi detalje o svakoj knjizi (publisher, ISBN, opis, itd.)
    --available, -a Prikupi status dostupnosti za svaku knjigu
    --enrich, -e    Detalji + dostupnost zajedno
    --help, -h      Prikaži pomoć

  Primeri:
    npm run search -- ljubav
    npm run search -- ljubav --details
    npm run search -- ljubav --enrich
    npm run search -- --all programiranje
`)
}

async function main() {
  const args = process.argv.slice(2)

  if (args.includes("--help") || args.includes("-h")) {
    showHelp()
    process.exit(0)
  }

  const fetchAll = args.includes("--all")
  const withDetails = args.includes("--details") || args.includes("-d")
  const withAvailability = args.includes("--available") || args.includes("-a")
  const withEnrich = args.includes("--enrich") || args.includes("-e")
  const query = args
    .filter((a) => a !== "--all" && a !== "--details" && a !== "-d" && a !== "--available" && a !== "-a" && a !== "--enrich" && a !== "-e")
    .join(" ")

  if (!query) {
    showHelp()
    process.exit(1)
  }

  console.log(`\n  Pretražujem COBISS.SR za: "${query}"\n`)

  try {
    let items: (BookEntry | BookWithDetails)[] = []
    let totalHits = 0
    const doEnrich = withDetails || withAvailability || withEnrich

    if (fetchAll) {
      const data = await searchAllPages(query, {
        materialType: "books",
        limit: 100,
        maxPages: 50,
      })
      items = data.combined
      totalHits = data.totalHits
    } else {
      const result = await searchBooks({ query, limit: 25, materialType: "books" })
      items = result.items
      totalHits = result.totalHits
    }

    console.log(`  Nađeno: ${totalHits} rezultata\n`)

    if (items.length === 0) {
      console.log("  Nema rezultata. Probaj drugačiji upit.\n")
      process.exit(0)
    }

    // Enrich with details/availability if requested
    if (doEnrich) {
      console.log(`  Prikupljam podatke za ${items.length} knjiga...\n`)
      const enriched: BookWithDetails[] = []
      for (let i = 0; i < items.length; i++) {
        const book = items[i] as BookEntry
        process.stdout.write(`    [${i + 1}/${items.length}] ${book.title.slice(0, 40).padEnd(41)}`)
        let detail
        if (withEnrich || (withDetails && withAvailability)) {
          detail = await enrichBook(book)
          process.stdout.write(` ${detail.availability?.status ?? "?"}\n`)
        } else if (withDetails) {
          const d = await fetchBookDetails(book.cobissId)
          detail = { ...book, details: d }
          process.stdout.write(` OK\n`)
        } else if (withAvailability) {
          const a = await fetchAvailability(book.cobissId)
          detail = { ...book, availability: a }
          process.stdout.write(` ${a.status}\n`)
        }
        if (detail) enriched.push(detail)
      }
      console.log()
      items = enriched
    }

    // Display results
    for (const book of items) {
      const line = [
        `  ${String(book.position).padStart(2)}.`,
        book.title.padEnd(50).slice(0, 50),
        book.author.padEnd(28).slice(0, 28),
        book.year,
      ]
      console.log(line.join(" "))
      if (doEnrich && "details" in book && book.details?.isbn) {
        console.log(`       ISBN: ${book.details.isbn}`)
      }
      if (doEnrich && "availability" in book && book.availability?.status) {
        console.log(`       Status: ${book.availability.status}`)
      }
    }

    const filePath = await saveResultsToJson(
      fetchAll
        ? { query, results: [], combined: items, totalHits }
        : { query, totalHits, page: 0, limit: items.length, items, fetchedAt: new Date().toISOString() },
    )
    console.log(`\n  Rezultati sačuvani u: ${filePath}\n`)
  } catch (err: unknown) {
    const error = err as { message?: string; statusCode?: number }
    console.error(`\n  Greška: ${error.message ?? String(err)}`)
    if (error.statusCode) {
      console.error(`  HTTP status: ${error.statusCode}`)
    }
    process.exit(1)
  }
}

main()
