import { performance } from "node:perf_hooks";

import { plain } from "./catalog.mjs";

const clean = (value, limit = 180) => plain(value).slice(0, limit);
const elapsed = (start) =>
  `${((performance.now() - start) / 1000).toFixed(1)}s`;

export function createEnrichLog(catalog, total, models) {
  const started = performance.now();
  console.log(`${catalog}: ${total} pending | models: ${models.join(" > ")}`);

  const book = (index, title) => `[${index}/${total}] ${clean(title, 120)}`;
  return {
    startBook: () => performance.now(),
    attempt: (index, title, model) =>
      console.log(`${book(index, title)} | trying ${model}`),
    fallback: (index, title, model, error, next, bookStart) =>
      console.error(
        `${book(index, title)} | ${model}: ${clean(error.message)} | next: ${next} | ${elapsed(bookStart)}`,
      ),
    saved: (index, title, model, bookStart, saved, failed) =>
      console.log(
        `${book(index, title)} | saved with ${model} | ${elapsed(bookStart)} | ${saved} saved, ${failed} failed`,
      ),
    failed: (index, title, model, error, bookStart) =>
      console.error(
        `${book(index, title)} | failed${model ? ` with ${model}` : ""}: ${clean(error instanceof Error ? error.message : error)} | ${elapsed(bookStart)}`,
      ),
    finish: (reason, processed, saved, failed) => {
      const pending = total - saved;
      console.log(
        `${reason}: ${processed}/${total} processed, ${saved} saved, ${failed} failed, ${pending} pending | ${elapsed(started)}`,
      );
      if (pending > 0)
        console.log(`Resume: pnpm books enrich --catalog ${catalog}`);
    },
  };
}
