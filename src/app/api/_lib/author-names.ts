export function authorNames(author: string): string[] {
  // shortcut: matches authors by exact COBISS text; use authority IDs when available.
  return [
    ...new Set(
      author.split(/\s*;\s*/).map((name) => name.trim() || "Author unknown"),
    ),
  ];
}
