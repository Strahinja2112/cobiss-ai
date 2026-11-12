import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";

import { crawlBooks, parseSearchPage } from "../src/app/api/_lib/cobiss.ts";

afterEach(() => mock.restoreAll());

const row = (id, title) =>
  `<tr class="biblioentry" data-cobiss-id="${id}" data-database="gbvk-16"><td><a class="title">${title}</a><span class="author">Author ${id}</span></td></tr>`;
const page = (hits, ...rows) =>
  `<div id="search-results-container" data-hits="${hits}"></div><table>${rows.join("")}</table>`;

test("parses book rows and rejects a missing result count", () => {
  const parsed = parseSearchPage(page(1, row("123", "Book title")));
  assert.equal(parsed.totalHits, 1);
  assert.deepEqual(parsed.books[0], {
    cobissId: "123",
    title: "Book title",
    author: "Author 123",
    isbn: null,
    url: "https://plus-legacy.cobiss.net/cobiss/sr/sr_latn/bib/gbvk-16/123",
  });
  assert.throws(() => parseSearchPage("<html></html>"), /result count/);
});

test("crawls later pages and returns ISBN values", async () => {
  const starts = [];
  mock.method(globalThis, "fetch", async (input) => {
    const url = new URL(input);
    if (url.pathname.endsWith("/bib/search")) {
      assert.equal(url.searchParams.get("c"), "la=eng");
      assert.equal(url.searchParams.get("db"), "gbvk-16");
      const start = Number(url.searchParams.get("start"));
      starts.push(start);
      return new Response(
        start === 0
          ? page(11, row("1", "First"))
          : page(11, row("2", "Second")),
      );
    }
    return Response.json({
      isbnCard: {
        value: url.pathname.includes("/1/") ? "978-0-123456-47-2" : "",
      },
    });
  });

  const events = [];
  for await (const event of crawlBooks(new AbortController().signal))
    events.push(event);
  assert.deepEqual(starts, [0, 10]);
  assert.deepEqual(
    events
      .filter((event) => event.type === "page")
      .map((event) => event.loaded),
    [1, 2],
  );
  assert.equal(events.at(-1).type, "done");
  assert.equal(events.at(-1).checked, 2);
});

test("fetches more than five books and checks every ISBN", async () => {
  let searches = 0;
  let details = 0;
  mock.method(globalThis, "fetch", async (input) => {
    const url = new URL(input);
    if (url.pathname.endsWith("/bib/search")) {
      searches++;
      return new Response(
        page(
          6,
          ...Array.from({ length: 6 }, (_, index) =>
            row(String(index + 1), `Book ${index + 1}`),
          ),
        ),
      );
    }
    details++;
    return Response.json({ isbnCard: { value: "978-0-123456-47-2" } });
  });

  const events = [];
  for await (const event of crawlBooks(new AbortController().signal))
    events.push(event);
  assert.equal(events.find((event) => event.type === "page").books.length, 6);
  assert.equal(events.at(-1).loaded, 6);
  assert.equal(events.at(-1).checked, 6);
  assert.equal(searches, 1);
  assert.equal(details, 6);
});
