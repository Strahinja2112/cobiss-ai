import * as fs from "node:fs/promises"
import * as path from "node:path"
import type { BookEntry, BookWithDetails, SearchResult } from "./types.js"

type SavableData =
  | SearchResult
  | {
      results: SearchResult[]
      combined: BookEntry[] | BookWithDetails[]
      totalHits: number
      query: string
    }

export async function saveResultsToJson(
  data: SavableData,
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
