import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";

import { createEnrichLog } from "../books/enrich-log.mjs";

afterEach(() => mock.restoreAll());

test("logs bounded single-line errors and a resumable stop", () => {
  const logs = [];
  const errors = [];
  mock.method(console, "log", (line) => logs.push(line));
  mock.method(console, "error", (line) => errors.push(line));
  const log = createEnrichLog("gbvk-16", 3);
  log.attempt(1, "Book\nTitle");
  log.failed(
    1,
    "Book\nTitle",
    "second",
    new Error("HTTP 503\n".repeat(100)),
    1,
  );
  log.finish("Stopped: Gemini models exhausted", 1, 0, 1);

  assert.equal(logs.length, 4);
  assert(logs.some((line) => /\[█+░+\] 1\/3/.test(line)));
  assert(errors.every((line) => !line.includes("\n")));
  assert(errors[0].length < 300);
  assert.equal(errors.length, 1);
  assert(
    logs.some((line) =>
      line.includes("1/3 processed, 0 saved, 1 failed, 3 pending"),
    ),
  );
  assert(logs.includes("Resume: pnpm books enrich --catalog gbvk-16"));
});

test("redraws one progress bar with ETA in a terminal", () => {
  const writes = [];
  const logs = [];
  let time = 0;
  mock.method(console, "log", (line) => logs.push(line));
  const stream = {
    isTTY: true,
    columns: 80,
    write: (value) => writes.push(value),
  };
  const log = createEnrichLog("gbvk-16", 4, {
    stream,
    now: () => time,
  });
  log.attempt(1, "Current Book");
  time = 5000;
  log.saved(1, 1, 0);
  assert(writes.at(-1).includes("[████░░░░░░░░░░░░] 1/4"));
  assert(writes.at(-1).includes("ETA 15s"));
  assert(writes.at(-1).includes("1 saved, 0 failed"));
  assert(writes.at(-1).includes("Current Book"));
  const beforeFinish = writes.length;
  log.finish("Interrupted", 1, 1, 0);
  assert.equal(writes.length, beforeFinish + 1);
  assert(logs.some((line) => line.includes("Interrupted: 1/4 processed")));
});

test("logs completed and interrupted runs without a resume for completed work", () => {
  const logs = [];
  mock.method(console, "log", (line) => logs.push(line));
  const completed = createEnrichLog("gbvk-17", 0);
  completed.finish("Complete", 0, 0, 0);
  const interrupted = createEnrichLog("gbvk-17", 2);
  interrupted.finish("Interrupted", 1, 1, 0);

  assert(logs.some((line) => line.includes("Complete: 0/0 processed")));
  assert(logs.some((line) => line.includes("Interrupted: 1/2 processed")));
  assert.equal(logs.filter((line) => line.startsWith("Resume:")).length, 1);
});
