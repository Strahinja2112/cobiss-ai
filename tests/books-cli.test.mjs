import assert from "node:assert/strict";
import { test } from "node:test";

import { parseArgs } from "../scripts/books/args.mjs";

test("parses all terminal commands and rejects unsafe arguments", () => {
  assert.deepEqual(parseArgs([]), { command: "help" });
  assert.deepEqual(parseArgs(["fetch"]), {
    command: "fetch",
    catalog: "gbvk-16",
  });
  assert.deepEqual(parseArgs(["enrich", "--catalog", "gbvk-17"]), {
    command: "enrich",
    catalog: "gbvk-17",
  });
  assert.deepEqual(parseArgs(["list", "2", "--catalog", "gbvk-17"]), {
    command: "list",
    page: 2,
    catalog: "gbvk-17",
  });
  assert.deepEqual(parseArgs(["show", "book-id"]), {
    command: "show",
    id: "book-id",
    catalog: "gbvk-16",
  });
  assert.deepEqual(parseArgs(["show", "book-id", "--catalog", "gbvk-17"]), {
    command: "show",
    id: "book-id",
    catalog: "gbvk-17",
  });
  assert.throws(() => parseArgs(["list", "0"]), /positive page/);
  assert.throws(() => parseArgs(["list", "2.5"]), /positive page/);
  assert.throws(() => parseArgs(["list", "9007199254740992"]), /too large/);
  assert.throws(() => parseArgs(["fetch", "unexpected"]), /no arguments/);
  assert.throws(() => parseArgs(["show"]), /needs one book ID/);
  assert.throws(() => parseArgs(["fetch", "--catalog"]), /needs a gbvk/);
  assert.throws(
    () => parseArgs(["fetch", "--catalog", "other-17"]),
    /needs a gbvk/,
  );
  assert.throws(
    () => parseArgs(["fetch", "--catalog", "gbvk-17", "--catalog", "gbvk-18"]),
    /once/,
  );
});
