import axios from "axios"
import * as cheerio from "cheerio"
import * as fs from "node:fs/promises"
import * as path from "node:path"
import type {
  BookEntry,
  BookDetail,
  Availability,
  BookWithDetails,
  FullDetailsResponse,
  ScraperError,
  SearchOptions,
  SearchResult,
} from "./types.js"

const DOMAIN = "https://plus-legacy.cobiss.net"
const BASE_PATH = "/cobiss/sr/sr_latn"
const BASE_URL = `${DOMAIN}${BASE_PATH}`
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"

const http = axios.create({
  baseURL: BASE_URL,
  headers: { "User-Agent": USER_AGENT },
  timeout: 15_000,
})

const DEFAULT_PARAMS = {
  q: "*",
  db: "gbvk-15",
  mat: "books",
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function dbFromParams(params: Record<string, string>): string {
  return params.db || "gbvk-15"
}

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

  const db = dbFromParams(params)
  const items: BookEntry[] = []

  $("tr.biblioentry").each((_i, row) => {
    const $row = $(row)
    const cobissId = $row.attr("data-cobiss-id") ?? ""
    const titleAttr = $row.attr("data-title") ?? ""
    const detailPath = $row.attr("data-href") ?? ""

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

export async function searchAllPages(
  query: string,
  options: {
    materialType?: SearchOptions["materialType"]
    limit?: 10 | 25 | 50 | 100
    maxPages?: number
    delayMs?: number
  } = {},
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

export async function fetchBookDetails(
  cobissId: string,
  database = "gbvk-15",
  delayMs = 400,
): Promise<BookDetail> {
  let fullTitle: string | undefined
  let type: string | undefined
  let language: string | undefined
  let publisher: string | undefined
  let publishYear: string | undefined
  let isbn: string | undefined
  let udk: string | undefined
  let series: string | undefined
  let physicalDescription: string | undefined
  let notes: string | undefined
  let otherAuthors: string | undefined
  let authors: string[] = []
  let subjects: string[] = []

  // 1. Fetch the /full JSON endpoint for rich metadata
  try {
    const fullResp = await http.get(`/bib/${database}/${cobissId}/full`)
    const fullData = fullResp.data as FullDetailsResponse

    if (fullData.titleCard?.value) fullTitle = fullData.titleCard.value
    if (fullData.materialDescr?.value) type = fullData.materialDescr.value
    if (fullData.languageCard?.value) language = fullData.languageCard.value
    if (fullData.publisherCard?.value) publisher = fullData.publisherCard.value
    if (fullData.publishDate?.value) publishYear = fullData.publishDate.value
    if (fullData.isbnCard?.value) isbn = fullData.isbnCard.value
    if (fullData.udkCard?.value) udk = fullData.udkCard.value
    if (fullData.seriesCard?.value) series = fullData.seriesCard.value
    if (fullData.ph_descriptionCard?.value) physicalDescription = fullData.ph_descriptionCard.value
    if (fullData.notesCard?.value) notes = fullData.notesCard.value
    if (fullData.otherAuthor702?.value) otherAuthors = fullData.otherAuthor702.value
    if (fullData.author700701?.value) {
      authors = [fullData.author700701.value]
    }
    if (fullData.uniformTitle?.value) {
      // uniformTitle is available
    }
  } catch {
    // fallback: continue with partial data
  }

  await delay(delayMs)

  // 2. Fetch the detail page for subjects and any extra info
  try {
    const detailResp = await http.get(`/bib/${database}/${cobissId}`)
    const html = detailResp.data as string
    const $ = cheerio.load(html)

    // Parse record info from the initial HTML
    $("div.recordPrompt").each((_i, el) => {
      const $el = $(el)
      const label = $el.find("span").first().text().trim().toLowerCase()
      const text = $el.text().replace(label, "").replace(" - ", "").trim()

      if (!type && label.includes("vrsta")) type = text
      if (!language && label.includes("jezik")) language = text
      if (!publisher && label.includes("izdavanje")) publisher = text
      if (!isbn && label.includes("isbn")) isbn = text
    })

    // Subjects from the sidebar
    $("#labelSubject").closest("div").find("a").each((_i, el) => {
      const subj = $(el).text().trim()
      if (subj) subjects.push(subj)
    })
  } catch {
    // proceed with whatever we have
  }

  await delay(delayMs)

  return {
    cobissId,
    title: fullTitle || cobissId,
    fullTitle,
    authors,
    otherAuthors,
    type,
    language,
    publisher,
    publishYear,
    isbn,
    udk,
    series,
    physicalDescription,
    notes,
    subjects,
  }
}

export async function fetchAvailability(
  cobissId: string,
  database = "gbvk-15",
): Promise<Availability> {
  try {
    const resp = await http.get(`/bib/cir-status/${database}/${cobissId}`)
    const html = resp.data as string
    const $ = cheerio.load(html)
    const statusRaw = $.text().trim().replace(/\s+/g, " ")
    const status = $(".availability.value").text().trim() || statusRaw

    return { cobissId, database, status, statusRaw }
  } catch {
    return { cobissId, database, status: "nepoznato", statusRaw: "" }
  }
}

export async function enrichBook(
  entry: BookEntry,
  database = "gbvk-15",
): Promise<BookWithDetails> {
  const [details, availability] = await Promise.all([
    fetchBookDetails(entry.cobissId, database),
    fetchAvailability(entry.cobissId, database),
  ])
  return { ...entry, details, availability }
}

export async function saveResultsToJson(
  data:
    | SearchResult
    | {
        results: SearchResult[]
        combined: BookEntry[] | BookWithDetails[]
        totalHits: number
        query: string
      },
  filename?: string,
  outputDir = "results",
): Promise<string> {
  await fs.mkdir(outputDir, { recursive: true })

  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
  const safeName = filename ?? `search-${ts}`
  const filePath = path.join(outputDir, `${safeName}.json`)

  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8")
  return filePath
}
