import assert from "node:assert/strict";
import { test } from "node:test";

import { parseArgs } from "../scripts/books/args.mjs";

test("parses all terminal commands and rejects unsafe arguments", () => {
  assert.deepEqual(parseArgs([]), { command: "help" });
  assert.deepEqual(parseArgs(["fetch"]), { command: "fetch" });
  assert.deepEqual(parseArgs(["enrich"]), { command: "enrich" });
  assert.deepEqual(parseArgs(["list", "2"]), { command: "list", page: 2 });
  assert.deepEqual(parseArgs(["show", "book-id"]), {
    command: "show",
    id: "book-id",
  });
  assert.throws(() => parseArgs(["list", "0"]), /positive page/);
  assert.throws(() => parseArgs(["list", "2.5"]), /positive page/);
  assert.throws(() => parseArgs(["list", "9007199254740992"]), /too large/);
  assert.throws(() => parseArgs(["fetch", "unexpected"]), /no arguments/);
  assert.throws(() => parseArgs(["show"]), /needs one book ID/);
});
