import axios from "axios"
import { GOOGLE_BOOKS_BASE_URL, GOOGLE_BOOKS_API_KEY } from "../config/index.js"
import { extractIsbn } from "../utils/isbn.js"
import type { GoogleDetails } from "../../types/index.js"

function pickImageLinks(volumeInfo: Record<string, unknown>): GoogleDetails["imageLinks"] | undefined {
  const images = volumeInfo.imageLinks as Record<string, string> | undefined
  if (!images) return undefined
  return {
    smallThumbnail: images.smallThumbnail,
    thumbnail: images.thumbnail,
    small: images.small,
    medium: images.medium,
    large: images.large,
    extraLarge: images.extraLarge,
  }
}

export async function fetchGoogleDetails(isbn: string): Promise<GoogleDetails | null> {
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

    const data = resp.data as { totalItems: number; items?: Array<{ volumeInfo: Record<string, unknown> }> }
    if (!data.totalItems || !data.items?.length) return null

    const v = data.items[0].volumeInfo

    return {
      description: (v.description as string)?.slice(0, 3000),
      categories: v.categories as string[],
      pageCount: v.pageCount as number,
      averageRating: v.averageRating as number,
      ratingsCount: v.ratingsCount as number,
      subtitle: v.subtitle as string,
      publisher: v.publisher as string,
      publishedDate: v.publishedDate as string,
      language: v.language as string,
      imageLinks: pickImageLinks(v),
      previewLink: v.previewLink as string,
      infoLink: v.infoLink as string,
    }
  } catch {
    return null
  }
}
