# Plan daljeg razvoja

## 1. Google Books enrichment ⭐ (u toku)

**Zadatak:** Za svaku knjigu koja ima ISBN, dovući dodatne metapodatke sa Google Books API-ja — opis, kategorije (žanrovi), broj strana, sliku korica, ocene.

**Tačno kako:**

### 1.1 API
- Endpoint: `GET https://www.googleapis.com/books/v1/volumes?q=isbn:{ISBN}`
- API key opcioni (environment varijabla `GOOGLE_BOOKS_API_KEY`)
- Rate limit: 1000 req/dan bez ključa, 100k/dan sa ključem

### 1.2 Podaci koje uzimamo
| Google polje | Naš tip |
|---|---|
| `description` | opis knjige (srpski/engleski) |
| `categories` | žanrovi |
| `pageCount` | broj strana |
| `imageLinks.thumbnail` | slika korica (URL) |
| `averageRating` | prosečna ocena (0-5) |
| `ratingsCount` | broj ocena |
| `publishedDate` | datum izdavanja |
| `previewLink` | Google Books preview link |

### 1.3 Implementacija
```
src/google-books.ts  ← nov fajl
```

```typescript
export async function fetchGoogleBooks(isbn: string): Promise<GoogleBooksData | null>
```

### 1.4 Integracija
- `enricher.ts` prima opciju `google: true`
- CLI: `--google` ili `-g` flag
- Prikaz u ispisu ispod ISBN: opis (skraćen), žanrovi, ocena, broj strana

---

## 2. "Preporuči 10 knjiga" — AI re-rank

**Zadatak:** Korisnik kaže "daj mi 10 knjiga koje će mi se svideti" na osnovu opisa. Sistem pretraži COBISS, pokupi detalje + Google Books meta, pa AI odabere najboljih 10 i objasni zašto.

**Tačno kako:**

### 2.1 Tok
```
1. Korisnikov upit → COBISS search (široka pretraga)
2. Za svaku knjigu: COBISS detalji + Google Books enrichment
3. Sve knjige + njihovi metapodaci → AI prompt
4. AI rangira 10 najboljih i daje objašnjenje
5. Prikaz: rang lista sa razlozima
```

### 2.2 Prompt
```
Sistem: Ti si bibliotekar specijalizovan za preporuke. Dobijaš listu knjiga
sa metapodacima (naslov, autor, opis, žanr, ocena). Na osnovu korisnikovog
zahteva, izaberi 10 najboljih knjiga i rangiraj ih.

Korisnik želi: "{user_input}"

Knjige:
{json}

Odgovori JSON:
{
  "recommendations": [
    {
      "rank": 1,
      "cobissId": "...",
      "reason": "zašto baš ova knjiga (srpski)"
    }
  ],
  "explanation": "ukratko objašnjenje izbora (srpski)"
}
```

### 2.3 CLI
```bash
npm run recommend -- "neki dobar SF roman, volim Asimova i Gibsona"
```

Poseban fajl: `src/recommend.ts`

---

## 3. SQLite baza

**Zadatak:** Zameniti JSON fajlove SQLite bazom. Keširati pretrage, čuvati custom metadata.

**Tačno kako:**

### 3.1 Biblioteka
- `better-sqlite3` (sinhroni, brz, nema konfiguracije)
- `npm install better-sqlite3`
- `npm install -D @types/better-sqlite3`

### 3.2 Šema (`src/db/schema.ts`)

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
  google_books_data TEXT,  -- JSON
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
  result_json TEXT,
  fetched_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (hash)
);

CREATE TABLE user_metadata (
  cobiss_id TEXT NOT NULL,
  database_name TEXT NOT NULL,
  user_rating INTEGER,  -- 1-5
  user_tags TEXT,       -- JSON array
  user_notes TEXT,
  read_status TEXT,     -- 'want_to_read' | 'reading' | 'read' | 'abandoned'
  created_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (cobiss_id, database_name)
);
```

### 3.3 Tok

```
search() → check search_cache → if fresh, return cached
  → else: scrape COBISS → save to books + search_cache
→ enrichBook() → save to books (details + google) + availability_cache
→ display
```

---

## 4. Concurrent scraping

Trenutno se knjige obrađuju jedna po jedna. Prebaci na batch:

```typescript
async function enrichBatch(entries: BookEntry[], options: EnrichOptions) {
  const batches = chunk(entries, 3)
  const results: BookWithDetails[] = []
  for (const batch of batches) {
    const enriched = await Promise.allSettled(
      batch.map(e => enrichBook(e, options))
    )
    results.push(...enriched.filter(r => r.status === 'fulfilled').map(r => r.value))
    await delay(500)  // između batch-eva
  }
  return results
}
```

---

## 5. React Native mobilna aplikacija

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
// GET /api/search?q=...&details=true&available=true&google=true
// GET /api/books/:db/:cobissId
// POST /api/books/:db/:cobissId/metadata
```

---

## Prioritizacija

| # | Feature | Vreme | Trud |
|---|---------|-------|------|
| 1 | Google Books enrichment | 1-2h | Mali |
| 2 | Concurrent scraping | 30min | Mali |
| 3 | Preporuči 10 (AI re-rank) | 3-4h | Srednji |
| 4 | SQLite baza | 3-4h | Mali |
| 5 | REST API server | 4-5h | Srednji |
| 6 | React Native app | 2-3 dana | Veliki |
