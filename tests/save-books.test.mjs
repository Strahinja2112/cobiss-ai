import assert from "node:assert/strict";
import { test } from "node:test";

import { saveBooks } from "../src/app/api/_lib/save-books.ts";

test("saves fetched books and only replaces ISBN when lookup succeeds", async () => {
  const calls = [];
  const db = {
    book: {
      upsert: async (value) => calls.push(["upsert", value]),
      update: async (value) => calls.push(["update", value]),
    },
  };

  await saveBooks(
    {
      type: "page",
      books: [
        {
          cobissId: "123",
          title: "Book title",
          author: "Author",
          isbn: null,
          url: "https://plus-legacy.cobiss.net/cobiss/sr/sr_latn/bib/gbvk-16/123",
        },
      ],
      totalHits: 1,
      pagesFetched: 1,
      loaded: 1,
    },
    db,
  );
  await saveBooks(
    {
      type: "isbn",
      items: [
        { cobissId: "123", isbn: null },
        { cobissId: "123", isbn: "9780123456789" },
      ],
      checked: 1,
      failures: 0,
    },
    db,
  );

  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0][1].where, {
    catalog_cobissId: { catalog: "gbvk-16", cobissId: "123" },
  });
  assert.equal(calls[0][1].create.sourceUrl, "https://plus-legacy.cobiss.net/cobiss/sr/sr_latn/bib/gbvk-16/123");
  assert.equal(calls[0][1].update.isbn, undefined);
  assert.deepEqual(calls[1][1].data, { isbn: "9780123456789" });
});
