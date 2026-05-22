import axios from "axios"
import { NO_GOOGLE_IMAGE_URL, COBISS_THUMBNAIL_BASE } from "../config/index.js"

export function resolveCoverImage(
  googleThumbnail: string | undefined | null,
  cobissId: string,
): string | null {
  if (googleThumbnail && googleThumbnail !== NO_GOOGLE_IMAGE_URL) {
    return googleThumbnail
  }

  return `${COBISS_THUMBNAIL_BASE}/${cobissId}`
}

let cobissCoverCache = new Set<string>()

export async function verifyCobissCover(cobissId: string): Promise<string | null> {
  if (cobissCoverCache.has(cobissId)) {
    return `${COBISS_THUMBNAIL_BASE}/${cobissId}`
  }

  const url = `${COBISS_THUMBNAIL_BASE}/${cobissId}`
  try {
    const resp = await axios.head(url, { timeout: 3000 })
    if (resp.status === 200) {
      cobissCoverCache.add(cobissId)
      return url
    }
    return null
  } catch {
    return null
  }
}
