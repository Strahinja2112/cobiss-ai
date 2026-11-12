export function extractIsbn(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const candidates = [...raw.matchAll(/\b(\d[\d -]*[\dX])\b/g)]
    .map((m) => m[1].replace(/[^0-9X]/gi, ""))
    .filter(Boolean);
  if (candidates.length === 0) return null;
  const preferred = candidates.find((c) => c.length === 13);
  return preferred ?? candidates[0];
}

export function cleanIsbn(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const candidates = [...raw.matchAll(/\b(\d[\d -]*[\dX])\b/g)]
    .map((m) => m[1].replace(/[^0-9X]/gi, ""))
    .filter(Boolean);
  if (candidates.length === 0) return raw;
  const preferred = candidates.find((c) => c.length === 13);
  return preferred ?? candidates[0];
}
