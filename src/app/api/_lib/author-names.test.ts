import assert from "node:assert/strict";
import test from "node:test";

import { authorNames } from "./author-names.ts";

void test("splits multiple authors without splitting aliases or duplicate names", () => {
  assert.deepEqual(
    authorNames(
      "Griffiths, Dawn = Даун, Грифитс ; Griffiths, David ; Griffiths, Dawn = Даун, Грифитс",
    ),
    ["Griffiths, Dawn = Даун, Грифитс", "Griffiths, David"],
  );
  assert.deepEqual(authorNames(""), ["Author unknown"]);
  assert.deepEqual(authorNames(" ; "), ["Author unknown"]);
});
