import * as cheerio from "cheerio"
import { http, delay } from "./http-client.js"
import { BASE_URL, DEFAULT_PARAMS } from "./config.js"
import type { BookEntry, SearchOptions, SearchResult, ScraperError } from "./types.js"

export async function searchBooks(
  options: SearchOptions,
  delayMs = 600,
): Promise<SearchResult> {
  const { query, materialType = "allmaterials", start = 0, limit = 25 } = options

  const params: Record<string, string> = {
    ...DEFAULT_PARAMS,
    q: query,
    mat: materialType,
    maxResult: String(limit),
  }
  if (start > 0) {
    params.start = String(start)
  }

  const response = await http.get(`/bib/search`, { params }).catch((err) => {
    const error: ScraperError = {
      message: err.message,
      statusCode: err.response?.status,
      url: err.config?.url,
    }
    throw error
  })

  const html = response.data as string
  const $ = cheerio.load(html)

  const totalHitsRaw = $("#search-results-container").attr("data-hits") ?? "0"
  const totalHits = parseInt(totalHitsRaw, 10) || 0
  const page = Math.floor(start / limit)

  const items: BookEntry[] = []

  $("tr.biblioentry").each((_i, row) => {
    const $row = $(row)
    const cobissId = $row.attr("data-cobiss-id") ?? ""
    const titleAttr = $row.attr("data-title") ?? ""
    const detailPath = $row.attr("data-href") ?? ""
    const database = $row.attr("data-database") ?? params.db

    const positionText = $row.find("td:first-child small").text().trim()
    const position = parseInt(positionText.replace(".", ""), 10) || 0

    const title = $row.find("a.title").text().trim() || titleAttr
    const author = $row.find(".author").text().trim()
    const type = $row.find(".contentType").text().trim()
    const language = $row.find(".language .value").text().trim()
    const yearText = $row.find(".publishDate-data .value").text().trim()

    if (cobissId && title) {
      items.push({
        position,
        cobissId,
        database,
        title,
        author,
        type,
        language,
        year: yearText,
        detailUrl: `${BASE_URL}/${detailPath}`,
      })
    }
  })

  await delay(delayMs)

  return {
    query,
    totalHits,
    page,
    limit,
    items,
    fetchedAt: new Date().toISOString(),
  }
}

export interface AllPagesOptions {
  materialType?: SearchOptions["materialType"]
  limit?: 10 | 25 | 50 | 100
  maxPages?: number
  delayMs?: number
}

export async function searchAllPages(
  query: string,
  options: AllPagesOptions = {},
): Promise<{
  results: SearchResult[]
  combined: BookEntry[]
  totalHits: number
}> {
  const { materialType = "books", limit = 100, maxPages = 10, delayMs = 800 } = options
  const results: SearchResult[] = []
  const allItems: BookEntry[] = []
  let totalHits = 0

  for (let page = 0; page < maxPages; page++) {
    const start = page * limit
    const result = await searchBooks({ query, materialType, start, limit })

    totalHits = result.totalHits
    results.push(result)
    allItems.push(...result.items)

    const fetchedSoFar = allItems.length
    if (fetchedSoFar >= totalHits || result.items.length < limit) {
      break
    }
  }

  return { results, combined: allItems, totalHits }
}
