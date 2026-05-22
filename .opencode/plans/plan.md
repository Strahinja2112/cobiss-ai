# Plan daljeg razvoja

## 1. AI agent — razumevanje prirodnog jezika ⭐ (prvi sledeći)

**Zadatak:** Korisnik piše "neki SF roman iz devedesetih, na srpskom, nisam čitao Asimova" → AI pretvara u struktuirane parametre za pretragu.

**Tačno kako:**

### 1.1 Izbor modela
- **Opcija A (preporučeno)**: OpenAI API (`gpt-4o-mini`, jeftin i brz)
  - `npm install openai`
  - API key kroz `.env` fajl
- **Opcija B (lokalno)**: `ollama` sa `llama3.2:3b` ili `mistral`
  - Besplatno, ali sporije i slabiji rezultati za srpski

### 1.2 Prompt arhitektura

```
Sistem: Ti si bibliotekarski asistent. Na osnovu korisnikovog opisa,
izvuci struktuirane podatke za pretragu COBISS baze.

Korisnik: "{user_input}"

Odgovori JSON:
{
  "searchQuery": "glavne ključne reči",
  "filters": {
    "yearFrom": null | number,
    "yearTo": null | number,
    "language": null | "srp" | "eng" | ...,
    "author": null | string
  },
  "explanation": "zašto si ovo izabrao (srpski)"
}
```

### 1.3 Implementacija (fajl: `src/ai.ts`)

```typescript
// prompt → OpenAI → parsiran JSON
export async function interpretQuery(userInput: string): Promise<InterpretedQuery>
```

### 1.4 Integracija u CLI

```bash
npm run search -- "daj mi neki SF roman"
# AI interpretira → pretražuje → rerankuje rezultate → prikazuje
```

---

## 2. Lokalna baza (SQLite)

**Zadatak:** Zameniti JSON fajlove SQLite bazom. Keširati pretrage, čuvati custom metadata.

**Tačno kako:**

### 2.1 Biblioteka
- `better-sqlite3` (sinhroni, brz, nema konfiguracije)
- `npm install better-sqlite3`
- `npm install -D @types/better-sqlite3`

### 2.2 Šema (`src/db/schema.ts`)

```sql
CREATE TABLE books (
  cobiss_id TEXT PRIMARY KEY,
  database_name TEXT NOT NULL,
  title TEXT NOT NULL,
  author TEXT,
  type TEXT,
  language TEXT,
  year TEXT,
  isbn TEXT,
  publisher TEXT,
  udk TEXT,
  series TEXT,
  physical_description TEXT,
  notes TEXT,
  subjects TEXT,  -- JSON array
  detail_json TEXT,  -- ceo FullDetailsResponse
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE availability_cache (
  cobiss_id TEXT NOT NULL,
  database_name TEXT NOT NULL,
  status TEXT,
  status_raw TEXT,
  fetched_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (cobiss_id, database_name)
);

CREATE TABLE search_cache (
  query TEXT NOT NULL,
  hash TEXT NOT NULL,  -- hash(query + filters)
  result_json TEXT,    -- ceo SearchResult
  fetched_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (hash)
);

CREATE TABLE user_metadata (
  cobiss_id TEXT NOT NULL,
  database_name TEXT NOT NULL,
  user_rating INTEGER,  -- 1-5
  user_tags TEXT,       -- JSON array tagova
  user_notes TEXT,
  read_status TEXT,     -- 'want_to_read' | 'reading' | 'read' | 'abandoned'
  created_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (cobiss_id, database_name)
);
```

### 2.3 Tok

```
search() → check search_cache → if fresh, return cached
  → else: scrape COBISS → save to books + search_cache
→ enrichBook() → save to books (details) + availability_cache
→ display
```

---

## 3. React Native mobilna aplikacija

**Zadatak:** Aplikacija koja koristi Node.js backend (ili direktno API).

**Dve opcije:**

### Opcija A: Expo managed workflow (lakše)
```bash
npx create-expo-app cobiss-mobile
```
- Expo Router za navigaciju
- NativeWind (Tailwind za RN) za UI
- Backend: Node.js server (Express/Fastify) koji wrappuje scraper

### Opcija B: React Native CLI (više kontrole)
- Za native module ako treba ISBN skeniranje kamerom

### API sloj

```
mobile app → REST API server → COBISS scraper → SQLite → response
```

Potrebno napraviti `src/server.ts`:
```typescript
// Express server sa endpointima:
// GET /api/search?q=...&details=true&available=true
// GET /api/books/:db/:cobissId
// POST /api/books/:db/:cobissId/metadata
```

---

## 4. Dodatne optimizacije

### 4.1 Concurrent scraping
Trenutno se knjige enrich-uju jedna po jedna. Prebaci na `Promise.allSettled()` sa batch-ovima od 3-5 paralelno, uz `delay` između batch-eva da ne dobiješ rate limiting.

### 4.2 Metadata enrichment iz drugih izvora
- Google Books API (dodatni ISBN, slika korica, opis)
- Goodreads (ocene, recenzije) — scraping
- Wikipedia (autori)

### 4.3 Full-text pretraga
Kad se pređe na SQLite, dodati FTS5 (full-text search) za pretragu po naslovu, autoru, napomenama.

---

## Prioritizacija

| # | Feature | Vreme | Trud |
|---|---------|-------|------|
| 1 | AI agent (OpenAI) | 2-3h | Mali |
| 2 | SQLite baza | 3-4h | Mali |
| 3 | Concurrent enrich | 30min | Mali |
| 4 | REST API server | 4-5h | Srednji |
| 5 | React Native app | 2-3 dana | Veliki |
| 6 | Google Books enrichment | 2h | Mali |
