import * as cheerio from "cheerio"
import { http, delay } from "./http-client.js"
import type { BookDetail, FullDetailsResponse } from "./types.js"

function cleanIsbn(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  const candidates = [...raw.matchAll(/\b(\d[\d -]*[\dX])\b/g)]
    .map(m => m[1].replace(/[^0-9X]/gi, ""))
    .filter(Boolean)
  if (candidates.length === 0) return raw
  const preferred = candidates.find(c => c.length === 13)
  return preferred ?? candidates[0]
}

export async function fetchBookDetails(
  cobissId: string,
  database: string,
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

  try {
    const fullResp = await http.get(`/bib/${database}/${cobissId}/full`)
    const fullData = fullResp.data as FullDetailsResponse

    if (fullData.titleCard?.value) fullTitle = fullData.titleCard.value
    if (fullData.materialDescr?.value) type = fullData.materialDescr.value
    if (fullData.languageCard?.value) language = fullData.languageCard.value
    if (fullData.publisherCard?.value) publisher = fullData.publisherCard.value
    if (fullData.publishDate?.value) publishYear = fullData.publishDate.value
    if (fullData.isbnCard?.value) isbn = cleanIsbn(fullData.isbnCard.value)
    if (fullData.udkCard?.value) udk = fullData.udkCard.value
    if (fullData.seriesCard?.value) series = fullData.seriesCard.value
    if (fullData.ph_descriptionCard?.value) physicalDescription = fullData.ph_descriptionCard.value
    if (fullData.notesCard?.value) notes = fullData.notesCard.value
    if (fullData.otherAuthor702?.value) otherAuthors = fullData.otherAuthor702.value
    if (fullData.author700701?.value) authors = [fullData.author700701.value]
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

      if (!type && label.includes("vrsta")) type = text
      if (!language && label.includes("jezik")) language = text
      if (!publisher && label.includes("izdavanje")) publisher = text
      if (!isbn && label.includes("isbn")) isbn = cleanIsbn(text)
    })

    $("#labelSubject").closest("div").find("a").each((_i, el) => {
      const subj = $(el).text().trim()
      if (subj) subjects.push(subj)
    })
  } catch {
    // proceed with what we have
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
