import { load } from "cheerio";

const BASE = "https://plus-legacy.cobiss.net/cobiss/sr/sr_latn";
export const COBISS_CATALOG = "gbvk-16";
const PAGE_SIZE = 10;

export interface Book {
  cobissId: string;
  title: string;
  author: string;
  isbn: string | null;
  url: string;
}

export interface SearchPage {
  totalHits: number;
  books: Book[];
}

export function parseSearchPage(
  html: string,
  catalog = COBISS_CATALOG,
): SearchPage {
  const $ = load(html);
  const hits = $("#search-results-container").attr("data-hits");
  const totalHits = Number(hits);
  if (hits === undefined || !Number.isFinite(totalHits)) {
    throw new Error("COBISS search result count is missing");
  }

  const books: Book[] = [];
  $("tr.biblioentry").each((_, row) => {
    const entry = $(row);
    const cobissId = entry.attr("data-cobiss-id");
    const title =
      entry.find("a.title").text().trim() || entry.attr("data-title")?.trim();
    if (!cobissId || !title) return;

    const database = entry.attr("data-database") ?? catalog;
    if (database !== catalog) {
      throw new Error(`COBISS returned ${database} for ${catalog}`);
    }
    books.push({
      cobissId,
      title,
      author: entry.find(".author").text().trim(),
      isbn: null,
      url: `${BASE}/bib/${database}/${cobissId}`,
    });
  });
  return { totalHits, books };
}

function cleanIsbn(raw: string): string | null {
  const candidates = [...raw.matchAll(/\b(\d[\d -]*[\dX])\b/gi)]
    .map((match) => match[1]?.replace(/[^0-9X]/gi, ""))
    .filter((value): value is string =>
      Boolean(value && [10, 13].includes(value.length)),
    );
  return (
    candidates.find((value) => value.length === 13) ?? candidates[0] ?? null
  );
}

async function get(url: URL, signal: AbortSignal): Promise<Response> {
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 COBISS Book Finder" },
    cache: "no-store",
    signal: AbortSignal.any([signal, AbortSignal.timeout(15_000)]),
  });
  if (!response.ok) throw new Error(`COBISS returned HTTP ${response.status}`);
  return response;
}

export async function fetchSearchPage(
  start: number,
  signal: AbortSignal,
  catalog = COBISS_CATALOG,
): Promise<SearchPage> {
  const url = new URL(`${BASE}/bib/search`);
  url.search = new URLSearchParams({
    c: "la=eng",
    db: catalog,
    mat: "books",
    maxResult: String(PAGE_SIZE),
    start: String(start),
  }).toString();
  return parseSearchPage(await (await get(url, signal)).text(), catalog);
}

export async function fetchIsbn(
  book: Book,
  signal: AbortSignal,
): Promise<string | null> {
  const fullUrl = new URL(`${book.url}/full`);
  try {
    const record = (await (await get(fullUrl, signal)).json()) as {
      isbnCard?: { value?: string };
    };
    if (record.isbnCard?.value) return cleanIsbn(record.isbnCard.value);
  } catch (error) {
    if (signal.aborted) throw error;
  }

  const $ = load(await (await get(new URL(book.url), signal)).text());
  let isbn: string | null = null;
  $("div.recordPrompt").each((_, prompt) => {
    const label = $(prompt).find("span").first().text().trim();
    if (label.toLowerCase().includes("isbn")) {
      isbn = cleanIsbn($(prompt).text().replace(label, ""));
    }
  });
  return isbn;
}

export type CrawlEvent =
  | {
      type: "page";
      books: Book[];
      totalHits: number;
      pagesFetched: number;
      loaded: number;
    }
  | {
      type: "isbn";
      items: { cobissId: string; isbn: string | null }[];
      checked: number;
      failures: number;
    }
  | { type: "done"; loaded: number; checked: number; failures: number };

export async function* crawlBooks(
  signal: AbortSignal,
  catalog = COBISS_CATALOG,
): AsyncGenerator<CrawlEvent> {
  const seen = new Set<string>();
  let checked = 0;
  let failures = 0;
  let totalHits = 0;

  for (let start = 0; ; start += PAGE_SIZE) {
    signal.throwIfAborted();
    const page = await fetchSearchPage(start, signal, catalog);
    totalHits = page.totalHits;
    if (page.books.length === 0 && start < totalHits) {
      throw new Error(`COBISS stopped before result ${totalHits}`);
    }
    const books = page.books.filter((book) => {
      if (seen.has(book.cobissId)) return false;
      seen.add(book.cobissId);
      return true;
    });
    if (page.books.length && books.length === 0) {
      throw new Error("COBISS repeated a result page");
    }
    yield {
      type: "page",
      books,
      totalHits,
      pagesFetched: start / PAGE_SIZE + 1,
      loaded: seen.size,
    };

    let updates: { cobissId: string; isbn: string | null }[] = [];
    for (const book of books) {
      signal.throwIfAborted();
      try {
        updates.push({
          cobissId: book.cobissId,
          isbn: await fetchIsbn(book, signal),
        });
      } catch (error) {
        if (signal.aborted) throw error;
        failures++;
        updates.push({ cobissId: book.cobissId, isbn: null });
      }
      checked++;
      if (updates.length === 20) {
        yield { type: "isbn", items: updates, checked, failures };
        updates = [];
      }
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    if (updates.length)
      yield { type: "isbn", items: updates, checked, failures };
    if (start + page.books.length >= totalHits) break;
    await new Promise((resolve) => setTimeout(resolve, 600));
  }
  yield { type: "done", loaded: seen.size, checked, failures };
}
