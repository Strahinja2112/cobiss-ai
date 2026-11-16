import assert from "node:assert/strict";
import test from "node:test";

import {
  displayAuthorNames,
  displayBookTitle,
} from "./display-author-names.ts";

void test("display author names without COBISS parallel-script aliases", () => {
  assert.equal(
    displayAuthorNames(["King, Stephen, 1947- = Кинг, Стивен, 1947-"]),
    "King, Stephen, 1947-",
  );
});

void test("remove spaces before title punctuation", () => {
  assert.equal(
    displayBookTitle("Billy Summers : a novel"),
    "Billy Summers: a novel",
  );
});
