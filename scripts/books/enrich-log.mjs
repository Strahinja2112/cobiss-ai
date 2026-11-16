import { performance } from "node:perf_hooks";

import { plain } from "./catalog.mjs";

const clean = (value, limit = 160) => plain(value).slice(0, limit);

function duration(milliseconds) {
  if (milliseconds === null) return "--";
  const seconds = Math.max(0, Math.round(milliseconds / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours) return `${hours}h ${minutes}m`;
  if (minutes) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

export function createEnrichLog(
  catalog,
  total,
  { stream = process.stdout, now = () => performance.now() } = {},
) {
  const interactive = Boolean(stream.isTTY);
  const started = now();
  const interval = Math.max(1, Math.ceil(total / 20));
  let processed = 0;
  let saved = 0;
  let failed = 0;
  let currentBook = "";
  let finished = false;

  const progress = () => {
    const filled = total === 0 ? 16 : Math.round((processed / total) * 16);
    const bar = `[${"█".repeat(filled)}${"░".repeat(16 - filled)}]`;
    const eta = processed
      ? duration(((now() - started) / processed) * (total - processed))
      : "--";
    return `${bar} ${processed}/${total} | ${saved} saved, ${failed} failed | ETA ${eta}${currentBook ? ` | ${clean(currentBook, 32)}` : ""}`;
  };
  const redraw = () => {
    if (!interactive || finished) return;
    stream.write(
      `\r\x1b[2K${progress().slice(0, Math.max(1, (stream.columns ?? 80) - 1))}`,
    );
  };
  const checkpoint = () => {
    if (interactive) redraw();
    else if (processed % interval === 0 && processed < total)
      console.log(progress());
  };
  const timer = interactive ? setInterval(redraw, 1000) : null;
  timer?.unref();
  console.log(`${catalog}: ${total} pending`);
  redraw();

  return {
    attempt: (_index, title) => {
      currentBook = title;
      redraw();
    },
    saved: (index, savedCount, failedCount) => {
      processed = index;
      saved = savedCount;
      failed = failedCount;
      checkpoint();
    },
    failed: (index, title, candidate, error, failedCount) => {
      processed = index;
      failed = failedCount;
      const message = `[${index}/${total}] ${clean(title, 80)}: ${candidate ? `${candidate}: ` : ""}${clean(error instanceof Error ? error.message : error)}`;
      if (interactive) {
        stream.write(`\r\x1b[2K${message}\n`);
        redraw();
      } else {
        console.error(message);
        checkpoint();
      }
    },
    finish: (reason, processedCount, savedCount, failedCount) => {
      finished = true;
      if (timer) clearInterval(timer);
      if (interactive) stream.write("\r\x1b[2K");
      const pending = total - savedCount;
      console.log(
        `${reason}: ${processedCount}/${total} processed, ${savedCount} saved, ${failedCount} failed, ${pending} pending | ${duration(now() - started)}`,
      );
      if (pending > 0)
        console.log(`Resume: pnpm books enrich --catalog ${catalog}`);
    },
  };
}
