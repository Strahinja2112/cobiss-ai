import { DelfiApi } from "./src/lib/delfi/index.js"

const delfi = new DelfiApi()

async function testSearch(query: string) {
  const r = await delfi.search(query, 3)
  const first = r.products[0]
  return { total: r.total, products: r.products, query }
}

async function main() {
  // Strategy: find book by matching title search + barcode filtering
  console.log("=== Strategy: title + barcode match ===\n")
  
  // COBISS books we want to cross-reference
  const cobissBooks = [
    { title: "Zona Zamfirova", isbn: "9788652130504", authorFromCobiss: "Stevan Sremac" },
    { title: "1984", isbn: "9788652146048", authorFromCobiss: "Orvel, Džordž" },
    { title: "Pop Ćira i pop Spira", isbn: "9788681678725", authorFromCobiss: "Stevan Sremac" },
  ]

  for (const book of cobissBooks) {
    console.log(`Looking for: "${book.title}" [${book.isbn}]`)

    // Strategy 1: Search by just the title
    const r1 = await delfi.search(book.title, 15)
    let match = r1.products.find(p => p.barcode === book.isbn)
    console.log(`  search("${book.title}"): ${r1.total} results` +
      (match ? ` ✓ FOUND via barcode!` : ""))

    // Strategy 2: Search by just author last name
    if (!match) {
      const authorLast = book.authorFromCobiss.split(/[, ]/).filter(Boolean).pop() || ""
      const r2 = await delfi.search(authorLast + " " + book.title, 15)
      match = r2.products.find(p => p.barcode === book.isbn)
      console.log(`  search("${authorLast} ${book.title}"): ${r2.total} results` +
        (match ? ` ✓ FOUND via barcode!` : ""))
    }

    // Strategy 3: Search by author surname if name-based search didn't help
    if (!match) {
      const authorSurname = book.authorFromCobiss.split(",")[0].trim()
      const r3 = await delfi.search(book.title + " " + authorSurname, 15)
      match = r3.products.find(p => p.barcode === book.isbn)
      console.log(`  search("${book.title} ${authorSurname}"): ${r3.total} results` +
        (match ? ` ✓ FOUND via barcode!` : ""))
    }

    // Strategy 4: Search by just the title (already did) but then try all products
    if (!match) {
      const authorWords = book.authorFromCobiss
        .replace(/[,\d=-]/g, "")
        .trim()
        .split(/\s+/)
        .filter(w => w.length > 2)
      
      const candidates = r1.products.filter(p => {
        if (p.barcode === book.isbn) return true
        const pTitle = p.title.toLowerCase()
        const pAuthors = delfi.getAuthors(p).map(a => a.toLowerCase())
        return authorWords.some(w => pTitle.includes(w.toLowerCase()) || pAuthors.some(pa => pa.includes(w.toLowerCase())))
      })
      if (candidates.length > 0) {
        match = candidates[0]
        console.log(`  closest candidate: "${match.title}" [${match.barcode}] (author: ${delfi.getAuthors(match).join(", ")})`)
      } else {
        console.log(`  no match via any strategy ✗`)
      }
    }

    if (match) {
      console.log(`  ✓ ${match.title}`)
      console.log(`    author: ${delfi.getAuthors(match).join(", ")}`)
      console.log(`    publisher: ${match.publisher}`)
      console.log(`    description: ${(delfi.getDescription(match) || "(none)").slice(0, 120)}`)
    }
    console.log("")
  }

  // Let's also see what fields improve matching
  console.log("=== What publisher names look like on Delfi ===\n")
  const authorsToCheck = ["Stevan Sremac", "Džordž Orvel", "George Orwell", "Orvel"]
  for (const author of authorsToCheck) {
    const r = await delfi.search(author, 5)
    if (r.total > 0) {
      console.log(`search("${author}"): ${r.total} results`)
      for (const p of r.products.slice(0, 3)) {
        console.log(`  [${p.barcode}] "${p.title}" — ${delfi.getAuthors(p).join(", ")} (${p.publisher})`)
      }
      console.log("")
    }
  }
}

main()
