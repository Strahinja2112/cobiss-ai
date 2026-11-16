import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";

import { createEnrichLog } from "../books/enrich-log.mjs";

afterEach(() => mock.restoreAll());

test("logs bounded single-line errors and a resumable stop", () => {
  const logs = [];
  const errors = [];
  mock.method(console, "log", (line) => logs.push(line));
  mock.method(console, "error", (line) => errors.push(line));
  const log = createEnrichLog("gbvk-16", 3, ["first", "second"]);
  const started = log.startBook();
  log.attempt(1, "Book\nTitle", "first");
  log.fallback(
    1,
    "Book\nTitle",
    "first",
    new Error("busy\n".repeat(100)),
    "second",
    started,
  );
  log.failed(1, "Book\nTitle", "second", new Error("HTTP 503"), started);
  log.finish("Stopped: Gemini models exhausted", 1, 0, 1);

  assert(logs.some((line) => line.includes("[1/3] Book Title | trying first")));
  assert(errors.every((line) => !line.includes("\n")));
  assert(errors[0].length < 300);
  assert(
    logs.some((line) =>
      line.includes("1/3 processed, 0 saved, 1 failed, 3 pending"),
    ),
  );
  assert(logs.includes("Resume: pnpm books enrich --catalog gbvk-16"));
});

test("logs completed and interrupted runs without a resume for completed work", () => {
  const logs = [];
  mock.method(console, "log", (line) => logs.push(line));
  const completed = createEnrichLog("gbvk-17", 0, []);
  completed.finish("Complete", 0, 0, 0);
  const interrupted = createEnrichLog("gbvk-17", 2, ["first"]);
  interrupted.finish("Interrupted", 1, 1, 0);

  assert(logs.some((line) => line.includes("Complete: 0/0 processed")));
  assert(logs.some((line) => line.includes("Interrupted: 1/2 processed")));
  assert.equal(logs.filter((line) => line.startsWith("Resume:")).length, 1);
});
