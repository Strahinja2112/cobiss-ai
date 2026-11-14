import { enrichBook, GeminiHttpError } from "~/app/api/_lib/enrich-book";
import { env } from "~/env";
import { auth } from "~/server/auth";
import { db } from "~/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const session = await auth();
  if (
    session?.user?.email?.toLowerCase() !==
    env.ALLOWED_GOOGLE_EMAIL.toLowerCase()
  ) {
    return new Response("Unauthorized", { status: 401 });
  }
  const apiKey = env.GEMINI_API_KEY;
  const model = env.GEMINI_MODEL;
  if (!apiKey || !model) {
    return new Response("Gemini is not configured", { status: 503 });
  }

  const books = await db.book.findMany({
    where: { enrichment: { is: null } },
    include: { authors: { select: { name: true } } },
    orderBy: [{ lastFetchedAt: "desc" }, { id: "desc" }],
    take: 25,
  });
  const controller = new AbortController();
  const abort = () => controller.abort();
  request.signal.addEventListener("abort", abort, { once: true });
  const encoder = new TextEncoder();
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({
    async start(streamController) {
      const send = (event: object) => {
        if (!cancelled)
          streamController.enqueue(
            encoder.encode(`${JSON.stringify(event)}\n`),
          );
      };
      let saved = 0;
      let failed = 0;
      try {
        send({ type: "start", total: books.length });
        for (const book of books) {
          if (controller.signal.aborted) break;
          try {
            const { summary, genres, themes, mood, ...profile } =
              await enrichBook(book, apiKey, model, controller.signal);
            if (controller.signal.aborted) break;
            await db.bookEnrichment.upsert({
              where: { bookId: book.id },
              create: {
                bookId: book.id,
                summary,
                genres,
                themes,
                mood,
                profile,
                model,
              },
              update: {},
            });
            saved++;
            send({ type: "book", title: book.title, saved, failed });
          } catch (error) {
            if (controller.signal.aborted) break;
            failed++;
            const message =
              error instanceof Error ? error.message : "Enrichment failed";
            send({
              type: "failure",
              title: book.title,
              message,
              saved,
              failed,
            });
            if (error instanceof GeminiHttpError) break;
          }
        }
        send({ type: "done", saved, failed });
      } catch (error) {
        if (!controller.signal.aborted)
          send({
            type: "error",
            message:
              error instanceof Error ? error.message : "Enrichment failed",
          });
      } finally {
        request.signal.removeEventListener("abort", abort);
        if (!cancelled) streamController.close();
      }
    },
    cancel() {
      cancelled = true;
      abort();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
