import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";

import { listBooks, showBook } from "../books/catalog.mjs";
import { runEnrich } from "../books/enrich.mjs";
import { runFetch } from "../books/fetch.mjs";

afterEach(() => mock.restoreAll());

test("fetch command saves pages and ISBN updates", async () => {
  const writes = [];
  mock.method(console, "log", () => {});
  mock.method(globalThis, "fetch", async (input) => {
    const url = new URL(input);
    if (url.pathname.endsWith("/bib/search")) {
      assert.equal(url.searchParams.get("db"), "gbvk-17");
      return new Response(
        '<div id="search-results-container" data-hits="1"></div><table><tr class="biblioentry" data-cobiss-id="123" data-database="gbvk-17"><td><a class="title">Book</a><span class="author">Writer</span></td></tr></table>',
      );
    }
    return Response.json({ isbnCard: { value: "978-0-123456-47-2" } });
  });
  const db = {
    book: {
      upsert: async (value) => writes.push(["book", value]),
      update: async (value) => writes.push(["isbn", value]),
    },
  };

  await runFetch(db, new AbortController().signal, "gbvk-17");
  assert.deepEqual(
    writes.map(([kind]) => kind),
    ["book", "isbn"],
  );
  assert.equal(writes[1][1].data.isbn, "9780123456472");
  assert.equal(writes[0][1].where.catalog_cobissId.catalog, "gbvk-17");
  assert.equal(writes[1][1].where.catalog_cobissId.catalog, "gbvk-17");
});

test("enrich command saves a profile for a pending book", async () => {
  const saved = [];
  const logs = [];
  const errors = [];
  let geminiCalls = 0;
  const models = [];
  const book = {
    id: "book-1",
    catalog: "gbvk-17",
    cobissId: "123",
    title: "A Quiet Mystery",
    isbn: null,
    authors: [{ name: "A. Writer" }],
  };
  mock.method(console, "log", (line) => logs.push(line));
  mock.method(console, "error", (line) => errors.push(line));
  mock.method(globalThis, "fetch", async (input, init) => {
    if (String(input).includes("plus-legacy.cobiss.net")) {
      return Response.json({ notesCard: { value: "A quiet mystery." } });
    }
    models.push(JSON.parse(init.body).model);
    if (++geminiCalls < 4) {
      return Response.json(
        { error: { status: "UNAVAILABLE", message: "Model overloaded" } },
        { status: 503 },
      );
    }
    return Response.json({
      steps: [
        {
          type: "model_output",
          content: [
            {
              type: "text",
              text: JSON.stringify({
                summary:
                  "A quiet mystery about friendship, trust, and the cost of keeping secrets.",
                genres: ["Mystery"],
                themes: ["Friendship"],
                mood: ["Reflective"],
                category: "fiction",
                subjects: ["Secrets"],
                setting: [],
                pacing: ["Slow burn"],
                style: [],
                complexity: "Accessible",
                audience: ["Adult readers"],
                appeal: ["Character focus"],
                contentNotes: [],
                uncertainties: [],
              }),
            },
          ],
        },
      ],
    });
  });
  const db = {
    book: {
      findMany: async (query) => {
        assert.equal(query.take, undefined);
        assert.deepEqual(query.where, {
          catalog: "gbvk-17",
          enrichment: { is: null },
        });
        return [book];
      },
    },
    bookEnrichment: { upsert: async (value) => saved.push(value) },
  };

  assert.deepEqual(
    await runEnrich(db, new AbortController().signal, "key", "gbvk-17"),
    { saved: 1, failed: 0 },
  );
  assert.equal(saved[0].create.bookId, book.id);
  assert.equal(geminiCalls, 4);
  assert.deepEqual(models, [
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemma-4-31b-it",
    "gemma-4-26b-a4b-it",
  ]);
  assert.equal(saved[0].create.model, "gemma-4-26b-a4b-it");
  assert.deepEqual(saved[0].update, {});
  assert.deepEqual(saved[0].create.profile.subjects, ["Secrets"]);
  assert.match(logs[0], /gbvk-17: 1 pending/);
  assert(
    logs.some((line) =>
      line.includes("[1/1] A Quiet Mystery | saved with gemma-4-26b-a4b-it"),
    ),
  );
  assert.equal(errors.filter((line) => line.includes("| next:")).length, 3);
  assert(
    logs.some((line) =>
      line.includes("Complete: 1/1 processed, 1 saved, 0 failed, 0 pending"),
    ),
  );
});

test("enrich command reports exhausted models and leaves books pending", async () => {
  const logs = [];
  const errors = [];
  mock.method(console, "log", (line) => logs.push(line));
  mock.method(console, "error", (line) => errors.push(line));
  mock.method(globalThis, "fetch", async (input) =>
    String(input).includes("plus-legacy.cobiss.net")
      ? Response.json({})
      : Response.json(
          { error: { status: "UNAVAILABLE", message: "Model overloaded" } },
          { status: 503 },
        ),
  );
  const books = ["First", "Second"].map((title, index) => ({
    id: `book-${index}`,
    catalog: "gbvk-17",
    cobissId: String(index),
    title,
    isbn: null,
    authors: [],
  }));
  const db = {
    book: { findMany: async () => books },
    bookEnrichment: {
      upsert: async () => assert.fail("No profile should be saved"),
    },
  };

  assert.deepEqual(
    await runEnrich(db, new AbortController().signal, "key", "gbvk-17"),
    { saved: 0, failed: 1 },
  );
  assert.equal(errors.filter((line) => line.includes("| next:")).length, 3);
  assert(
    logs.some((line) =>
      line.includes("Stopped: Gemini models exhausted: 1/2 processed"),
    ),
  );
  assert(!logs.some((line) => line.includes("[2/2]")));
});

test("enrich command reports interruption", async () => {
  const logs = [];
  const controller = new AbortController();
  controller.abort();
  mock.method(console, "log", (line) => logs.push(line));
  const db = {
    book: { findMany: async () => [{ title: "Book" }] },
  };

  await assert.rejects(runEnrich(db, controller.signal, "key", "gbvk-17"));
  assert(logs.some((line) => line.includes("Interrupted: 0/1 processed")));
});

test("list and show expose saved book metadata and profile", async () => {
  const lines = [];
  mock.method(console, "log", (line) => lines.push(line));
  const book = {
    id: "book-1",
    title: "Book",
    isbn: "9780123456472",
    authors: [{ name: "Writer" }],
    catalog: "gbvk-17",
    cobissId: "123",
    language: "eng",
    sourceUrl: "https://example.com/123",
    lastFetchedAt: new Date("2026-11-16T00:00:00Z"),
    availabilityStatus: null,
    availabilityCheckedAt: null,
    enrichment: {
      bookId: "book-1",
      summary: "Summary",
      genres: ["Mystery"],
      themes: [],
      mood: [],
      profile: { appeal: ["Tense"] },
      model: "test-model",
      enrichedAt: new Date("2026-11-16T01:00:00Z"),
    },
  };
  const db = {
    book: {
      count: async (query) => {
        assert.equal(query.where.catalog, "gbvk-17");
        return query.where.enrichment ? 0 : 1;
      },
      findMany: async (query) => {
        assert.equal(query.skip, 0);
        assert.equal(query.take, 50);
        assert.deepEqual(query.where, { catalog: "gbvk-17" });
        return [book];
      },
      findFirst: async (query) => {
        assert.deepEqual(query.where, { id: "book-1", catalog: "gbvk-17" });
        return book;
      },
    },
  };

  await listBooks(db, 1, "gbvk-17");
  await showBook(db, "book-1", "gbvk-17");
  assert(
    lines.some((line) => line.includes("1 saved books; 0 need enrichment")),
  );
  assert(lines.some((line) => line.includes("book-1\tBook\tWriter\tenriched")));
  assert(lines.some((line) => line.includes("Model: test-model")));
  assert(lines.some((line) => line.includes('"appeal": [')));
});
