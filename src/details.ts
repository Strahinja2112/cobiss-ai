import * as cheerio from "cheerio"
import { http, delay } from "./http-client.js"
import type { CobissDetail } from "./types.js"

function cleanIsbn(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  const candidates = [...raw.matchAll(/\b(\d[\d -]*[\dX])\b/g)]
    .map(m => m[1].replace(/[^0-9X]/gi, ""))
    .filter(Boolean)
  if (candidates.length === 0) return raw
  const preferred = candidates.find(c => c.length === 13)
  return preferred ?? candidates[0]
}

export async function fetchCobissDetails(
  cobissId: string,
  database: string,
  delayMs = 400,
): Promise<CobissDetail> {
  const result: CobissDetail = { authors: [] }

  try {
    const fullResp = await http.get(`/bib/${database}/${cobissId}/full`)
    const raw = fullResp.data as Record<string, { name: string; value: string }>

    if (raw.titleCard?.value) result.fullTitle = raw.titleCard.value
    if (raw.uniformTitle?.value) result.uniformTitle = raw.uniformTitle.value
    if (raw.materialDescr?.value) result.type = raw.materialDescr.value
    if (raw.materialDescr100e?.value) result.audience = raw.materialDescr100e.value
    if (raw.languageCard?.value) result.language = raw.languageCard.value
    if (raw.publisherCard?.value) result.publisher = raw.publisherCard.value
    if (raw.publishDate?.value) result.publishYear = raw.publishDate.value
    if (raw.isbnCard?.value) result.isbn = cleanIsbn(raw.isbnCard.value)
    if (raw.udkCard?.value) result.udk = raw.udkCard.value
    if (raw.seriesCard?.value) result.series = raw.seriesCard.value
    if (raw.ph_descriptionCard?.value) result.physicalDescription = raw.ph_descriptionCard.value
    if (raw.notesCard?.value) result.notes = raw.notesCard.value
    if (raw.otherAuthor702?.value) result.otherAuthors = raw.otherAuthor702.value
    if (raw.otherSubjects?.value) result.otherSubjects = raw.otherSubjects.value
    if (raw.author700701?.value) result.authors = [raw.author700701.value]
    if (raw.urlIgnoreDuplicates?.value) result.digitalContentsUrl = raw.urlIgnoreDuplicates.value
  } catch {
    // fallback with partial data
  }

  await delay(delayMs)

  try {
    const detailResp = await http.get(`/bib/${database}/${cobissId}`)
    const html = detailResp.data as string
    const $ = cheerio.load(html)

    $("div.recordPrompt").each((_i, el) => {
      const $el = $(el)
      const label = $el.find("span").first().text().trim().toLowerCase()
      const text = $el.text().replace(label, "").replace(" - ", "").trim()

      if (!result.type && label.includes("vrsta")) result.type = text
      if (!result.audience && label.includes("vrsta")) {
        const parts = text.split(";")
        if (parts.length > 1) result.audience = parts[1].trim()
      }
      if (!result.language && label.includes("jezik")) result.language = text
      if (!result.publisher && label.includes("izdavanje")) result.publisher = text
      if (!result.isbn && label.includes("isbn")) result.isbn = cleanIsbn(text)
    })

    $("#labelSubject").closest("div").find("a").each((_i, el) => {
      const subj = $(el).text().trim()
      if (subj) {
        if (!result.subjects) result.subjects = []
        result.subjects.push(subj)
      }
    })
  } catch {
    // proceed with what we have
  }

  await delay(delayMs)

  return result
}
