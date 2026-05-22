import { fetchCobissDetails } from "./details.js"
import { fetchAvailability } from "./availability.js"
import { fetchGoogleDetails } from "./google-books.js"
import { resolveCoverImage, verifyCobissCover } from "./cover.js"
import type { BookEntry, BookWithDetails } from "./types.js"

export interface EnrichOptions {
  availability?: boolean
  google?: boolean
}

function buildAiContext(entry: BookEntry, cobiss: BookWithDetails["cobiss"], google: BookWithDetails["google"]): string {
  const parts: string[] = []

  parts.push(`Naslov: ${entry.title}`)
  if (entry.author) parts.push(`Autor: ${entry.author}`)
  if (entry.year) parts.push(`Godina: ${entry.year}`)
  if (entry.type) parts.push(`Tip: ${entry.type}`)
  if (entry.language) parts.push(`Jezik: ${entry.language}`)

  if (cobiss.fullTitle && cobiss.fullTitle !== entry.title) parts.push(`Puni naslov: ${cobiss.fullTitle}`)
  if (cobiss.uniformTitle) parts.push(`Uniformni naslov: ${cobiss.uniformTitle}`)
  if (cobiss.otherAuthors) parts.push(`Drugi autori: ${cobiss.otherAuthors}`)
  if (cobiss.publisher) parts.push(`Izdavac: ${cobiss.publisher}`)
  if (cobiss.publishYear) parts.push(`Godina izdanja: ${cobiss.publishYear}`)
  if (cobiss.isbn) parts.push(`ISBN: ${cobiss.isbn}`)
  if (cobiss.udk) parts.push(`UDK: ${cobiss.udk}`)
  if (cobiss.series) parts.push(`Serija: ${cobiss.series}`)
  if (cobiss.physicalDescription) parts.push(`Fizicki opis: ${cobiss.physicalDescription}`)
  if (cobiss.audience) parts.push(`Namena: ${cobiss.audience}`)
  if (cobiss.subjects?.length) parts.push(`Teme: ${cobiss.subjects.join("; ")}`)
  if (cobiss.otherSubjects) parts.push(`Dodatne teme: ${cobiss.otherSubjects}`)
  if (cobiss.notes) parts.push(`Napomene: ${cobiss.notes}`)

  if (google) {
    if (google.description) parts.push(`Opis: ${google.description}`)
    if (google.categories?.length) parts.push(`Zanrovi: ${google.categories.join("; ")}`)
    if (google.subtitle) parts.push(`Podnaslov: ${google.subtitle}`)
    if (google.pageCount) parts.push(`Broj strana: ${google.pageCount}`)
    if (google.averageRating) parts.push(`Ocena: ${google.averageRating}/5 (${google.ratingsCount} glasova)`)
    if (google.publisher) parts.push(`Izdavac (GB): ${google.publisher}`)
    if (google.publishedDate) parts.push(`Datum izdanja (GB): ${google.publishedDate}`)
    if (google.language) parts.push(`Jezik (GB): ${google.language}`)
  }

  return parts.join("\n")
}

export async function enrichBook(
  entry: BookEntry,
  options: EnrichOptions = {},
): Promise<BookWithDetails> {
  const { availability: doAvail = true, google: doGoogle = false } = options

  const tasks: Promise<unknown>[] = [
    fetchCobissDetails(entry.cobissId, entry.database),
  ]
  if (doAvail) {
    tasks.push(fetchAvailability(entry.cobissId, entry.database))
  }

  const [cobiss, availability] = await Promise.all(tasks)

  const enriched: BookWithDetails = {
    ...entry,
    cobiss: cobiss as BookWithDetails["cobiss"],
    availability: availability as BookWithDetails["availability"],
  }

  let googleThumbnail: string | undefined | null

  if (doGoogle) {
    const isbn = enriched.cobiss.isbn
    if (isbn) {
      enriched.google = await fetchGoogleDetails(isbn)
      googleThumbnail = enriched.google?.imageLinks?.thumbnail
    }
  }

  enriched.imageUrl = resolveCoverImage(googleThumbnail, entry.cobissId)

  if (enriched.imageUrl?.startsWith("https://d.cobiss.net/") || enriched.imageUrl?.startsWith("http://d.cobiss.net/")) {
    enriched.imageUrl = await verifyCobissCover(entry.cobissId)
  }

  enriched.description = enriched.google?.description ?? enriched.cobiss.notes ?? undefined
  enriched.aiContext = buildAiContext(entry, enriched.cobiss, enriched.google)

  return enriched
}
