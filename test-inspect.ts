import "dotenv/config"
import { http } from "./src/http-client.js"
import * as cheerio from "cheerio"

const r = await http.get("/bib/search", { params: { q: "1984", db: "gbvk-1", mat: "books", maxResult: "3" } })
const $ = cheerio.load(r.data)

$("tr.biblioentry").each((i, el) => {
  const $el = $(el)
  console.log(`\n=== Result ${i + 1} ===`)
  // All data attributes
  const attrs = (el as any).attribs || {}
  for (const [k, v] of Object.entries(attrs)) {
    if (k.startsWith("data-")) {
      console.log(`  ${k}: ${String(v).slice(0, 100)}`)
    }
  }
  // All td classes and content
  $el.find("td").each((j, td) => {
    const cls = $(td).attr("class") || ""
    const html = $(td).html()?.replace(/\s+/g, " ").trim().slice(0, 150) || ""
    if (html) console.log(`  td[${j}] .${cls}: ${html}`)
  })
})
