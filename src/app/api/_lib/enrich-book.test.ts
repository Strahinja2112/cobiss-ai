import assert from "node:assert/strict";
import test from "node:test";

import { enrichBook } from "./enrich-book.ts";

void test("sends COBISS context to Gemini and validates its profile", async () => {
  const originalFetch = globalThis.fetch;
  let geminiRequest: Record<string, unknown> | undefined;
  globalThis.fetch = async (input, init) => {
    if (typeof input !== "string") throw new Error("Unexpected fetch URL");
    if (input.includes("plus-legacy.cobiss.net")) {
      return Response.json({ notesCard: { value: "A quiet mystery." } });
    }
    if (typeof init?.body !== "string")
      throw new Error("Unexpected Gemini body");
    geminiRequest = JSON.parse(init.body) as Record<string, unknown>;
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
  };

  try {
    const result = await enrichBook(
      {
        catalog: "gbvk-16",
        cobissId: "123",
        title: "A Quiet Mystery",
        isbn: null,
        authors: [{ name: "A. Writer" }],
      },
      "test-key",
      "test-model",
      new AbortController().signal,
    );
    assert.equal(result.category, "fiction");
    assert.deepEqual(result.themes, ["Friendship"]);
    assert.equal(geminiRequest?.model, "test-model");
    assert.equal(geminiRequest?.store, false);
    assert.match(String(geminiRequest?.input), /A quiet mystery\./);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
