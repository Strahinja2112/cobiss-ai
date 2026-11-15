import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { PrismaClient } from "../generated/prisma/index.js";

import { parseArgs, usage } from "./books/args.mjs";
import { listBooks, showBook } from "./books/catalog.mjs";
import { runEnrich } from "./books/enrich.mjs";
import { runFetch } from "./books/fetch.mjs";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.command === "help") {
    console.log(usage);
    return;
  }

  const envFile = resolve(import.meta.dirname, "../.env");
  if (existsSync(envFile)) process.loadEnvFile(envFile);
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  if (
    args.command === "enrich" &&
    (!process.env.GEMINI_API_KEY || !process.env.GEMINI_MODEL)
  ) {
    throw new Error(
      "GEMINI_API_KEY and GEMINI_MODEL are required for enrichment",
    );
  }

  const db = new PrismaClient();
  const controller = new AbortController();
  const stop = () => controller.abort();
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  try {
    if (args.command === "fetch") {
      await runFetch(db, controller.signal);
    } else if (args.command === "list") {
      await listBooks(db, args.page);
    } else if (args.command === "show") {
      await showBook(db, args.id);
    } else {
      const result = await runEnrich(
        db,
        controller.signal,
        process.env.GEMINI_API_KEY,
        process.env.GEMINI_MODEL,
      );
      if (result.failed) process.exitCode = 1;
    }
  } catch (error) {
    console.error(
      controller.signal.aborted ? "Stopped; saved work remains" : error,
    );
    process.exitCode = controller.signal.aborted ? 130 : 1;
  } finally {
    process.removeListener("SIGINT", stop);
    process.removeListener("SIGTERM", stop);
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
