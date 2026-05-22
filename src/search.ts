import { searchBooks, searchAllPages, saveResultsToJson } from './scraper.js'

async function main() {
  const args = process.argv.slice(2)
  const fetchAll = args.includes('--all') || args.includes('-a')
  const query = args.filter((a) => a !== '--all' && a !== '-a').join(' ')

  if (!query) {
    console.error('  Usage: npm run search -- <upit> [--all]')
    console.error('  Example: npm run search -- SF roman devedesete')
    process.exit(1)
  }

  console.log(`\n  Pretražujem COBISS.SR za: "${query}"\n`)

  try {
    if (fetchAll) {
      const data = await searchAllPages(query, {
        materialType: 'books',
        limit: 100,
        maxPages: 50,
      })

      console.log(`  Nađeno: ${data.totalHits} rezultata\n`)

      for (const book of data.combined.slice(0, 30)) {
        const line = [
          `  ${String(book.position).padStart(3)}.`,
          book.title.padEnd(55).slice(0, 55),
          book.author.padEnd(30).slice(0, 30),
          book.year,
        ]
        console.log(line.join(' '))
      }

      if (data.combined.length > 30) {
        console.log(`  ... i još ${data.combined.length - 30} rezultata`)
      }

      const filePath = await saveResultsToJson({
        query,
        results: data.results,
        combined: data.combined,
        totalHits: data.totalHits,
      })
      console.log(`\n  Svi rezultati sačuvani u: ${filePath}\n`)
    } else {
      const result = await searchBooks({ query, limit: 25, materialType: 'books' })

      console.log(`  Nađeno: ${result.totalHits} rezultata\n`)

      if (result.items.length === 0) {
        console.log('  Nema rezultata. Probaj drugačiji upit.\n')
        process.exit(0)
      }

      for (const book of result.items) {
        const line = [
          `  ${String(book.position).padStart(2)}.`,
          book.title.padEnd(55).slice(0, 55),
          book.author.padEnd(30).slice(0, 30),
          book.year,
        ]
        console.log(line.join(' '))
      }

      console.log(`\n  --- Stranica ${result.page + 1} od ${Math.ceil(result.totalHits / result.limit)} ---`)

      const filePath = await saveResultsToJson(result)
      console.log(`\n  Rezultati sačuvani u: ${filePath}\n`)
    }
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
