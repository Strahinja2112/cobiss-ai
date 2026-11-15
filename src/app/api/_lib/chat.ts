import { z } from "zod";

export const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(2000),
      }),
    )
    .min(1)
    .max(12),
});

export const chatResultSchema = z.object({
  answer: z.string().trim().min(1).max(4000),
  recommendations: z
    .array(
      z.object({
        bookId: z.string(),
        reason: z.string().trim().min(1).max(300),
      }),
    )
    .max(5),
});

export const geminiChatSchema = {
  type: "object",
  properties: {
    answer: { type: "string" },
    recommendations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          bookId: { type: "string" },
          reason: { type: "string" },
        },
        required: ["bookId", "reason"],
        additionalProperties: false,
      },
    },
  },
  required: ["answer", "recommendations"],
  additionalProperties: false,
};

export type ChatBook = {
  id: string;
  title: string;
  authors: string[];
  sourceUrl: string;
  summary: string;
  genres: string[];
  themes: string[];
  mood: string[];
  profile: unknown;
};

export type ChatRecommendation = ChatBook & { reason: string };

export function resolveRecommendations(
  recommendations: z.infer<typeof chatResultSchema>["recommendations"],
  books: ChatBook[],
): ChatRecommendation[] {
  const byId = new Map(books.map((book) => [book.id, book]));
  const seen = new Set<string>();
  return recommendations.flatMap(({ bookId, reason }) => {
    const book = byId.get(bookId);
    if (!book || seen.has(bookId)) return [];
    seen.add(bookId);
    return [{ ...book, reason }];
  });
}
