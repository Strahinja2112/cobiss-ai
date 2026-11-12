import { auth } from "~/server/auth";
import { crawlBooks } from "~/app/api/_lib/cobiss";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user || session.user.email !== process.env.ALLOWED_GOOGLE_EMAIL) {
    return new Response("Unauthorized", { status: 401 });
  }

  const controller = new AbortController();
  const abort = () => controller.abort();
  request.signal.addEventListener("abort", abort, { once: true });
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(streamController) {
      try {
        for await (const event of crawlBooks(controller.signal)) {
          streamController.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          const message = error instanceof Error ? error.message : "COBISS fetch failed";
          streamController.enqueue(encoder.encode(`${JSON.stringify({ type: "error", message })}\n`));
        }
      } finally {
        request.signal.removeEventListener("abort", abort);
        streamController.close();
      }
    },
    cancel: abort,
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
