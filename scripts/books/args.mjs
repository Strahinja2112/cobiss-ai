export const usage = `Usage: pnpm books <command>

Commands:
  fetch             Fetch English COBISS books and save them
  list [page]       List saved books (50 per page)
  show <book-id>    Show metadata and enrichment for one saved book
  enrich            Enrich up to 25 books without profiles
  help              Show this help`;

export function parseArgs(args) {
  const [command, ...rest] = args;
  if (!command || command === "help") {
    if (rest.length) throw new Error("help takes no arguments");
    return { command: "help" };
  }
  if (command === "fetch" || command === "enrich") {
    if (rest.length) throw new Error(`${command} takes no arguments`);
    return { command };
  }
  if (command === "list") {
    if (rest.length > 1 || (rest[0] && !/^[1-9]\d*$/.test(rest[0]))) {
      throw new Error("list accepts one positive page number");
    }
    const page = Number(rest[0] ?? "1");
    if (!Number.isSafeInteger(page))
      throw new Error("Page number is too large");
    return { command, page };
  }
  if (command === "show") {
    if (rest.length !== 1 || !rest[0]?.trim()) {
      throw new Error("show needs one book ID from list");
    }
    return { command, id: rest[0] };
  }
  throw new Error(`Unknown command: ${command}`);
}
