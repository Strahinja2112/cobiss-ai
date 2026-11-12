import * as cheerio from "cheerio"
import { http } from "../http/client.js"
import type { Availability } from "../../types/index.js"

export async function fetchAvailability(
  cobissId: string,
  database: string,
): Promise<Availability> {
  try {
    const resp = await http.get(`/bib/cir-status/${database}/${cobissId}`)
    const html = resp.data as string
    const $ = cheerio.load(html)
    const statusRaw = $.text().trim().replace(/\s+/g, " ")
    const status = $(".availability.value").text().trim() || statusRaw

    return { cobissId, database, status, statusRaw }
  } catch {
    return { cobissId, database, status: "nepoznato", statusRaw: "" }
  }
}
