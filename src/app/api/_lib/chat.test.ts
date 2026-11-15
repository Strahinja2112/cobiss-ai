import assert from "node:assert/strict";
import test from "node:test";

import {
  chatRequestSchema,
  resolveRecommendations,
  type ChatBook,
} from "./chat.ts";

test("chat requests require bounded conversation messages", () => {
  assert.equal(chatRequestSchema.safeParse({ messages: [] }).success, false);
  assert.equal(
    chatRequestSchema.safeParse({
      messages: [{ role: "user", content: "x".repeat(2001) }],
    }).success,
    false,
  );
});

test("only catalog books appear once in chat recommendations", () => {
  const book: ChatBook = {
    id: "saved-book",
    title: "It",
    authors: ["King, Stephen"],
    sourceUrl: "https://example.com/book",
    summary: "A novel about friendship and fear.",
    genres: ["Horror"],
    themes: ["Friendship"],
    mood: ["Ominous"],
    profile: {},
  };
  assert.deepEqual(
    resolveRecommendations(
      [
        { bookId: "invented-book", reason: "Unsupported" },
        { bookId: "saved-book", reason: "Fits the request" },
        { bookId: "saved-book", reason: "Duplicate" },
      ],
      [book],
    ),
    [{ ...book, reason: "Fits the request" }],
  );
});
