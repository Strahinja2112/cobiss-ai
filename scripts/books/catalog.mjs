const PAGE_SIZE = 50;

export function plain(value) {
  return String(value)
    .replace(/\p{Cc}/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function listBooks(db, page, catalog) {
  const [total, pending] = await Promise.all([
    db.book.count({ where: { catalog } }),
    db.book.count({ where: { catalog, enrichment: { is: null } } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (page > pages) throw new Error(`Page ${page} exceeds ${pages}`);
  const books = await db.book.findMany({
    where: { catalog },
    orderBy: [{ lastFetchedAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      title: true,
      isbn: true,
      authors: { select: { name: true }, orderBy: { name: "asc" } },
      enrichment: { select: { bookId: true } },
    },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });
  console.log(
    `${total} saved books; ${pending} need enrichment; page ${page}/${pages}`,
  );
  for (const book of books) {
    const authors = book.authors.map(({ name }) => plain(name)).join("; ");
    console.log(
      `${book.id}\t${plain(book.title)}\t${authors || "Author unknown"}\t${book.enrichment ? "enriched" : "pending"}\t${book.isbn ?? "no ISBN"}`,
    );
  }
}

export async function showBook(db, id, catalog) {
  const book = await db.book.findFirst({
    where: { id, catalog },
    include: { authors: { orderBy: { name: "asc" } }, enrichment: true },
  });
  if (!book) throw new Error(`Book not found: ${id}`);
  const fields = {
    ID: book.id,
    Title: book.title,
    Authors:
      book.authors.map(({ name }) => name).join("; ") || "Author unknown",
    ISBN: book.isbn ?? "Unavailable",
    Language: book.language,
    Catalog: book.catalog,
    "COBISS ID": book.cobissId,
    "COBISS URL": book.sourceUrl,
    "Last fetched": book.lastFetchedAt.toISOString(),
    Availability: book.availabilityStatus ?? "Not checked",
    "Availability checked":
      book.availabilityCheckedAt?.toISOString() ?? "Not checked",
  };
  for (const [label, value] of Object.entries(fields)) {
    console.log(`${label}: ${plain(value)}`);
  }
  if (!book.enrichment) {
    console.log("No enrichment profile saved");
    return;
  }
  const { summary, genres, themes, mood, profile, model, enrichedAt } =
    book.enrichment;
  console.log(`Summary: ${plain(summary)}`);
  for (const [label, values] of Object.entries({
    Genres: genres,
    Themes: themes,
    Mood: mood,
  })) {
    console.log(`${label}: ${values.map(plain).join(", ")}`);
  }
  console.log(`Profile: ${JSON.stringify(profile, null, 2)}`);
  console.log(`Model: ${plain(model)}`);
  console.log(`Enriched: ${enrichedAt.toISOString()}`);
}
