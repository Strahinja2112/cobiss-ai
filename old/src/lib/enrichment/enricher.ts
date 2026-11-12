import type { BookEntry, BookWithDetails } from "../../types/index.js";
import { fetchAvailability } from "../cobiss/availability.js";
import { fetchCobissDetails } from "../cobiss/details.js";
import { DelfiApi } from "../delfi/index.js";
import { resolveCoverImage, verifyCobissCover } from "./cover.js";
import { fetchGoogleDetails } from "./google-books.js";
import { fetchOpenLibrary } from "./open-library.js";

const delfi = new DelfiApi();

export interface EnrichOptions {
  availability?: boolean;
  google?: boolean;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&scaron;/g, "š")
    .replace(/&Scaron;/g, "Š")
    .replace(/&nbsp;/g, " ")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function buildAiContext(
  entry: BookEntry,
  cobiss: BookWithDetails["cobiss"],
  google: BookWithDetails["google"],
  openLibrary: BookWithDetails["openLibrary"],
  delfiProduct: BookWithDetails["delfi"],
): string {
  const parts: string[] = [];

  parts.push(`Naslov: ${entry.title}`);
  if (entry.author) parts.push(`Autor: ${entry.author}`);
  if (entry.year) parts.push(`Godina: ${entry.year}`);
  if (entry.type) parts.push(`Tip: ${entry.type}`);
  if (entry.language) parts.push(`Jezik: ${entry.language}`);

  if (cobiss.fullTitle && cobiss.fullTitle !== entry.title)
    parts.push(`Puni naslov: ${cobiss.fullTitle}`);
  if (cobiss.uniformTitle)
    parts.push(`Uniformni naslov: ${cobiss.uniformTitle}`);
  if (cobiss.otherAuthors) parts.push(`Drugi autori: ${cobiss.otherAuthors}`);
  if (cobiss.publisher) parts.push(`Izdavac: ${cobiss.publisher}`);
  if (cobiss.publishYear) parts.push(`Godina izdanja: ${cobiss.publishYear}`);
  if (cobiss.isbn) parts.push(`ISBN: ${cobiss.isbn}`);
  if (cobiss.udk) parts.push(`UDK: ${cobiss.udk}`);
  if (cobiss.series) parts.push(`Serija: ${cobiss.series}`);
  if (cobiss.physicalDescription)
    parts.push(`Fizicki opis: ${cobiss.physicalDescription}`);
  if (cobiss.audience) parts.push(`Namena: ${cobiss.audience}`);
  if (cobiss.subjects?.length)
    parts.push(`Teme: ${cobiss.subjects.join("; ")}`);
  if (cobiss.otherSubjects) parts.push(`Dodatne teme: ${cobiss.otherSubjects}`);
  if (cobiss.notes) parts.push(`Napomene: ${cobiss.notes}`);

  if (google) {
    if (google.description) parts.push(`Opis: ${google.description}`);
    if (google.categories?.length)
      parts.push(`Zanrovi: ${google.categories.join("; ")}`);
    if (google.subtitle) parts.push(`Podnaslov: ${google.subtitle}`);
    if (google.pageCount) parts.push(`Broj strana: ${google.pageCount}`);
    if (google.averageRating)
      parts.push(
        `Ocena: ${google.averageRating}/5 (${google.ratingsCount} glasova)`,
      );
    if (google.publisher) parts.push(`Izdavac (GB): ${google.publisher}`);
    if (google.publishedDate)
      parts.push(`Datum izdanja (GB): ${google.publishedDate}`);
    if (google.language) parts.push(`Jezik (GB): ${google.language}`);
  }

  if (openLibrary) {
    if (openLibrary.description && !google?.description)
      parts.push(`Opis (OL): ${openLibrary.description}`);
    if (openLibrary.subjects?.length)
      parts.push(`Predmeti: ${openLibrary.subjects.join("; ")}`);
    if (openLibrary.subjectPlaces?.length)
      parts.push(`Mesta: ${openLibrary.subjectPlaces.join("; ")}`);
    if (openLibrary.subjectPeople?.length)
      parts.push(`Licnosti: ${openLibrary.subjectPeople.join("; ")}`);
  }

  if (delfiProduct) {
    const delfiDesc = delfi.getDescription(delfiProduct);
    if (delfiDesc && !google?.description)
      parts.push(`Opis (Delfi): ${delfiDesc.slice(0, 2000)}`);
    const cats = delfi.getCategories(delfiProduct);
    if (cats.length) parts.push(`Kategorije (Delfi): ${cats.join("; ")}`);
    if (delfiProduct.publisher)
      parts.push(`Izdavac (Delfi): ${delfiProduct.publisher}`);
    const pages = delfi.getAttribute(delfiProduct, "numberOfPages");
    if (pages) parts.push(`Broj strana (Delfi): ${pages}`);
  }

  return parts.join("\n");
}

export async function enrichBook(
  entry: BookEntry,
  options: EnrichOptions = {},
): Promise<BookWithDetails> {
  const { availability: doAvail = true, google: doGoogle = false } = options;

  const tasks: Promise<unknown>[] = [
    fetchCobissDetails(entry.cobissId, entry.database),
  ];
  if (doAvail) {
    tasks.push(fetchAvailability(entry.cobissId, entry.database));
  }

  const [cobiss, availability] = await Promise.all(tasks);
  const cobissData = cobiss as BookWithDetails["cobiss"];

  const enriched: BookWithDetails = {
    ...entry,
    cobiss: cobissData,
    availability: availability as BookWithDetails["availability"],
  };

  let googleThumbnail: string | undefined | null;
  let delfiCoverUrl: string | null = null;

  const isbn = cobissData.isbn;
  const enrichTasks: Promise<unknown>[] = [];

  if (doGoogle && isbn) {
    enrichTasks.push(
      fetchGoogleDetails(isbn).then((r) => {
        enriched.google = r;
      }),
      fetchOpenLibrary(isbn).then((r) => {
        enriched.openLibrary = r;
      }),
    );
  }

  if (isbn) {
    enrichTasks.push(
      (async () => {
        const cleanIsbn = isbn.replace(/[^0-9X]/gi, "");
        const queries = [entry.title];

        const srCyr: Record<string, string> = {
          а: "a",
          б: "b",
          в: "v",
          г: "g",
          д: "d",
          ђ: "đ",
          е: "e",
          ж: "ž",
          з: "z",
          и: "i",
          ј: "j",
          к: "k",
          л: "l",
          љ: "lj",
          м: "m",
          н: "n",
          њ: "nj",
          о: "o",
          п: "p",
          р: "r",
          с: "s",
          т: "t",
          ћ: "ć",
          у: "u",
          ф: "f",
          х: "h",
          ц: "c",
          ч: "č",
          џ: "dž",
          ш: "š",
          А: "A",
          Б: "B",
          В: "V",
          Г: "G",
          Д: "D",
          Ђ: "Đ",
          Е: "E",
          Ж: "Ž",
          З: "Z",
          И: "I",
          Ј: "J",
          К: "K",
          Л: "L",
          Љ: "Lj",
          М: "M",
          Н: "N",
          Њ: "Nj",
          О: "O",
          П: "P",
          Р: "R",
          С: "S",
          Т: "T",
          Ћ: "Ć",
          У: "U",
          Ф: "F",
          Х: "H",
          Ц: "C",
          Ч: "Č",
          Џ: "Dž",
          Ш: "Š",
        };
        const srCyrPattern = new RegExp(
          "[" + Object.keys(srCyr).join("") + "]",
          "g",
        );
        const translitTitle = entry.title.replace(
          srCyrPattern,
          (c) => srCyr[c] ?? c,
        );
        if (translitTitle !== entry.title) {
          queries.push(translitTitle);
        }

        const latinOnly = entry.title.replace(/[^\x00-\x7F]/g, "").trim();
        if (
          latinOnly &&
          latinOnly !== entry.title &&
          latinOnly !== translitTitle
        ) {
          queries.push(latinOnly);
        }

        const words = entry.title.split(/\s+/).filter((w) => w.length > 2);
        if (words.length >= 2) {
          queries.push(words.slice(0, 3).join(" "));
        } else if (words.length === 1) {
          queries.push(words[0]);
        }

        const authorName = entry.author
          .replace(/[,\d=\-]/g, "")
          .split(/\s+/)
          .filter((w) => w.length > 2 && /[A-Za-z]/.test(w))
          .slice(0, 2)
          .join(" ");
        if (authorName && !queries.includes(authorName)) {
          queries.push(authorName + " " + words.slice(0, 2).join(" "));
        }

        try {
          for (const q of queries) {
            if (enriched.delfi) break;
            const result = await delfi.search(q, 10);
            if (result.products.length === 0) continue;
            const match = result.products.find((p) => p.barcode === cleanIsbn);
            if (match) {
              enriched.delfi = match;
              delfiCoverUrl = delfi.getImageUrl(match, "m");
            }
          }

          if (!enriched.delfi) {
            const nameParts = entry.author
              .replace(/[,\d=\-]/g, "")
              .split(/\s+/)
              .filter((w) => w.length > 2 && /[A-Za-z]/.test(w));

            if (nameParts.length >= 2) {
              const queries2 = [
                [...nameParts].reverse().slice(0, 2).join(" "),
                nameParts.slice(0, 2).join(" "),
                nameParts.slice(-2).join(" "),
              ];
              for (const q2 of [...new Set(queries2)]) {
                if (enriched.delfi) break;
                const result = await delfi.search(q2, 15);
                const match = result.products.find(
                  (p) => p.barcode === cleanIsbn,
                );
                if (match) {
                  enriched.delfi = match;
                  delfiCoverUrl = delfi.getImageUrl(match, "m");
                }
              }
            }
          }
        } catch {
          /* delfi unavailable */
          console.log("Delfi unavailable for: ", entry.title);
        }
      })(),
    );
  }

  if (enrichTasks.length > 0) {
    await Promise.all(enrichTasks);
  }

  if (doGoogle && enriched.google) {
    googleThumbnail = enriched.google.imageLinks?.thumbnail;
  }

  enriched.imageUrl = resolveCoverImage(
    googleThumbnail,
    entry.cobissId,
    delfiCoverUrl,
  );

  if (
    enriched.imageUrl?.startsWith("https://d.cobiss.net/") ||
    enriched.imageUrl?.startsWith("http://d.cobiss.net/")
  ) {
    enriched.imageUrl = await verifyCobissCover(entry.cobissId);
  }

  enriched.description =
    enriched.google?.description ??
    (enriched.delfi ? delfi.getDescription(enriched.delfi) : undefined) ??
    enriched.openLibrary?.description ??
    enriched.cobiss.notes ??
    undefined;

  enriched.aiContext = buildAiContext(
    entry,
    enriched.cobiss,
    enriched.google,
    enriched.openLibrary,
    enriched.delfi,
  );

  return enriched;
}
