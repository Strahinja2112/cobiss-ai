import axios from 'axios'
import * as cheerio from 'cheerio'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import type {
  SearchOptions,
  SearchResult,
  BookEntry,
  ScraperError,
} from './types.js'

const BASE_URL = 'https://plus-legacy.cobiss.net/cobiss/sr/sr'
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'

const http = axios.create({
  baseURL: BASE_URL,
  headers: { 'User-Agent': USER_AGENT },
  timeout: 15_000,
})

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function searchBooks(
  options: SearchOptions,
  delayMs = 600
): Promise<SearchResult> {
  const { query, materialType = 'allmaterials', start = 0, limit = 25 } = options

  const params: Record<string, string> = {
    q: query,
    mat: materialType,
    maxResult: String(limit),
    db: 'cobib',
  }
  if (start > 0) {
    params.start = String(start)
  }

  const url = `/bib/search`
  const response = await http.get(url, { params }).catch((err) => {
    const error: ScraperError = {
      message: err.message,
      statusCode: err.response?.status,
      url: err.config?.url,
    }
    throw error
  })

  const html = response.data as string
  const $ = cheerio.load(html)

  const totalHitsRaw = $('#search-results-container').attr('data-hits') ?? '0'
  const totalHits = parseInt(totalHitsRaw, 10) || 0
  const page = Math.floor(start / limit)

  const items: BookEntry[] = []

  $('tr.biblioentry').each((_i, row) => {
    const $row = $(row)
    const cobissId = $row.attr('data-cobiss-id') ?? ''
    const titleAttr = $row.attr('data-title') ?? ''
    const detailPath = $row.attr('data-href') ?? ''

    const positionText = $row.find('td:first-child small').text().trim()
    const position = parseInt(positionText.replace('.', ''), 10) || 0

    const title = $row.find('a.title').text().trim() || titleAttr
    const author = $row.find('.author').text().trim()
    const type = $row.find('.contentType').text().trim()
    const language = $row.find('.language .value').text().trim()
    const yearText = $row.find('.publishDate-data .value').text().trim()

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

  // Be polite
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
    materialType?: SearchOptions['materialType']
    limit?: 10 | 25 | 50 | 100
    maxPages?: number
    delayMs?: number
  } = {}
): Promise<{
  results: SearchResult[]
  combined: BookEntry[]
  totalHits: number
}> {
  const { materialType = 'books', limit = 100, maxPages = 10, delayMs = 800 } = options
  const results: SearchResult[] = []
  const allItems: BookEntry[] = []
  let totalHits = 0

  for (let page = 0; page < maxPages; page++) {
    const start = page * limit
    const result = await searchBooks({
      query,
      materialType,
      start,
      limit,
    })

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

export async function saveResultsToJson(
  data: SearchResult | { results: SearchResult[]; combined: BookEntry[]; totalHits: number; query: string },
  filename?: string,
  outputDir = 'results'
): Promise<string> {
  await fs.mkdir(outputDir, { recursive: true })

  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const safeName = filename ?? `search-${ts}`
  const filePath = path.join(outputDir, `${safeName}.json`)

  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
  return filePath
}
