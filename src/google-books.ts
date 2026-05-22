import axios from "axios"
import { GOOGLE_BOOKS_BASE_URL, GOOGLE_BOOKS_API_KEY } from "./config.js"
import type { GoogleBooksData } from "./types.js"

function extractIsbn(raw: string): string | null {
  const match = raw.match(/\b(\d[\d -]*[\dX])\b/)
  if (!match) return null
  return match[1].replace(/[^0-9X]/gi, "")
}

export async function fetchGoogleBooks(isbn: string): Promise<GoogleBooksData | null> {
  if (!isbn) return null

  const cleanIsbn = extractIsbn(isbn)
  if (!cleanIsbn) return null

  try {
    const params: Record<string, string> = { q: `isbn:${cleanIsbn}` }
    if (GOOGLE_BOOKS_API_KEY) params.key = GOOGLE_BOOKS_API_KEY

    const resp = await axios.get(`${GOOGLE_BOOKS_BASE_URL}/volumes`, {
      params,
      timeout: 10_000,
    })

    const data = resp.data as {
      totalItems: number
      items?: Array<{
        volumeInfo: {
          title?: string
          description?: string
          categories?: string[]
          pageCount?: number
          imageLinks?: { thumbnail?: string }
          averageRating?: number
          ratingsCount?: number
          publishedDate?: string
          maturityRating?: string
          previewLink?: string
          infoLink?: string
        }
      }>
    }

    if (!data.totalItems || !data.items?.length) return null

    const info = data.items[0].volumeInfo

    return {
      description: info.description?.slice(0, 2000),
      categories: info.categories,
      pageCount: info.pageCount,
      thumbnail: info.imageLinks?.thumbnail,
      averageRating: info.averageRating,
      ratingsCount: info.ratingsCount,
      publishedDate: info.publishedDate,
      maturityRating: info.maturityRating,
      previewLink: info.previewLink,
      infoLink: info.infoLink,
    }
  } catch {
    return null
  }
}
