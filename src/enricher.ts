import { fetchBookDetails } from "./details.js"
import { fetchAvailability } from "./availability.js"
import type { BookEntry, BookWithDetails } from "./types.js"

export async function enrichBook(entry: BookEntry): Promise<BookWithDetails> {
  const [details, availability] = await Promise.all([
    fetchBookDetails(entry.cobissId, entry.database),
    fetchAvailability(entry.cobissId, entry.database),
  ])
  return { ...entry, details, availability }
}
