# COBISS Book Finder — Plan

## Cilj

Aplikacija koja koristi COBISS.SR bazu (3.3M+ zapisa) da korisnik prirodnim jezikom opiše knjigu, AI shvati šta se traži, pretraži COBISS i vrati rezultate. Kasnije → React Native mobilna aplikacija.

## Arhitektura (trenutno)

```
CLI (Node.js) → COBISS+ Legacy Scraper → JSON fajl
```

## Faze

### Faza 1 — Scraper (trenutno)
- [ ] Node.js skripta koja pretražuje COBISS+ Legacy
- [ ] Parsira HTML i izvlači: naslov, autor, godina, ISBN, tip, COBISS-ID
- [ ] Rezultate upisuje u JSON fajl
- [ ] Fetch pojedinačnih detalja knjige

### Faza 2 — AI integracija
- [ ] NLP → struktuirani upit
- [ ] Reranking rezultata

### Faza 3 — Lokalna baza
- [ ] SQLite/PostgreSQL umesto JSON
- [ ] Custom metadata (ocene, tagovi, status)
- [ ] Keširanje pretraga

### Faza 4 — React Native
- [ ] Mobilna aplikacija
- [ ] Pregled knjiga, pretraga, metadata

## COBISS+ Legacy URL-ovi

**Pretraga:**
```
GET https://plus-legacy.cobiss.net/cobiss/sr/sr/bib/search
  ?q=upit
  &mat=book
  &start=0
  &limit=25
```

**Detalji:**
```
GET https://plus-legacy.cobiss.net/cobiss/sr/sr/bib/COBISS_ID
```

## Tech Stack

| Sloj | Tehnologija |
|------|-------------|
| Runtime | Node.js |
| HTTP | axios |
| HTML parser | cheerio |
| CLI | commander + chalk |
| AI (kasnije) | OpenAI API / ollama |
| Baza (kasnije) | SQLite (better-sqlite3) |
| Mobile (kasnije) | React Native / Expo |

## Ograničenja

- Scraping — zavisi od HTML strukture legacy sajta
- Rate limiting — dodati delay između zahteva
- COBISS.SR vs COBISS.RS — odvojene baze
