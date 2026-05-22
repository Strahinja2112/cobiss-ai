import axios from "axios"
import type { OpenLibraryData } from "../../types/index.js"

interface OpenLibraryWork {
  description?: string | { value?: string }
  subjects?: string[]
  subject_places?: string[]
  subject_people?: string[]
  subject_times?: string[]
}

interface OpenLibraryEdition {
  title?: string
  works?: Array<{ key: string }>
  number_of_pages?: number
  publishers?: string[]
  publish_date?: string
  isbn_13?: string[]
  isbn_10?: string[]
}

function extractText(val: unknown): string | undefined {
  if (!val) return undefined
  if (typeof val === "string") return val
  if (typeof val === "object" && val !== null) {
    const obj = val as Record<string, unknown>
    return typeof obj.value === "string" ? obj.value : undefined
  }
  return undefined
}

export async function fetchOpenLibrary(isbn: string): Promise<OpenLibraryData | null> {
  if (!isbn) return null

  try {
    const editionResp = await axios.get<OpenLibraryEdition>(
      `https://openlibrary.org/isbn/${isbn}.json`,
      { timeout: 6000 },
    )

    const edition = editionResp.data
    if (!edition.works?.length) return null

    const workResp = await axios.get<OpenLibraryWork>(
      `https://openlibrary.org${edition.works[0].key}.json`,
      { timeout: 6000 },
    )

    const work = workResp.data
    const description = extractText(work.description)

    if (!description && !work.subjects?.length) return null

    return {
      description,
      subjects: work.subjects?.slice(0, 20),
      subjectPlaces: work.subject_places?.slice(0, 10),
      subjectPeople: work.subject_people?.slice(0, 10),
      subjectTimes: work.subject_times?.slice(0, 10),
    }
  } catch {
    return null
  }
}
