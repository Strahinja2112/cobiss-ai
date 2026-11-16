import { COBISS_CATALOG } from "../../src/app/api/_lib/cobiss.ts";

export const usage = `Usage: pnpm books <command> [arguments] [--catalog gbvk-N]

Catalog defaults to ${COBISS_CATALOG}.

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
  let catalog = COBISS_CATALOG;
  const option = rest.indexOf("--catalog");
  if (option !== -1) {
    const value = rest[option + 1];
    if (!/^gbvk-\d+$/.test(value ?? "")) {
      throw new Error("--catalog needs a gbvk-{number} value");
    }
    catalog = value;
    rest.splice(option, 2);
  }
  if (rest.includes("--catalog"))
    throw new Error("--catalog can be given once");
  if (command === "fetch" || command === "enrich") {
    if (rest.length) throw new Error(`${command} takes no arguments`);
    return { command, catalog };
  }
  if (command === "list") {
    if (rest.length > 1 || (rest[0] && !/^[1-9]\d*$/.test(rest[0]))) {
      throw new Error("list accepts one positive page number");
    }
    const page = Number(rest[0] ?? "1");
    if (!Number.isSafeInteger(page))
      throw new Error("Page number is too large");
    return { command, page, catalog };
  }
  if (command === "show") {
    if (rest.length !== 1 || !rest[0]?.trim()) {
      throw new Error("show needs one book ID from list");
    }
    return { command, id: rest[0], catalog };
  }
  throw new Error(`Unknown command: ${command}`);
}
