import assert from "node:assert/strict";
import test from "node:test";

import { enrichBook, GeminiHttpError } from "./enrich-book.ts";

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

void test("includes Gemini error details with HTTP status", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    if (typeof input !== "string") throw new Error("Unexpected fetch URL");
    return input.includes("plus-legacy.cobiss.net")
      ? Response.json({})
      : Response.json(
          { error: { status: "UNAVAILABLE", message: "Model overloaded" } },
          { status: 503 },
        );
  };
  try {
    await assert.rejects(
      enrichBook(
        {
          catalog: "gbvk-16",
          cobissId: "123",
          title: "Book",
          isbn: null,
          authors: [],
        },
        "test-key",
        "test-model",
        new AbortController().signal,
      ),
      (error: unknown) =>
        error instanceof GeminiHttpError &&
        error.status === 503 &&
        error.message ===
          "Gemini returned HTTP 503: UNAVAILABLE: Model overloaded",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
