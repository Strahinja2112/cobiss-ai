# COBISS Book Finder

Pretraga knjiga iz COBISS.SR baze. CLI alat koji scrape-uje COBISS+ Legacy,
prikuplja detalje o knjigama i proverava dostupnost u bibliotekama.

## Pokretanje

```bash
npm run search -- ljubav
npm run search -- ljubav --details
npm run search -- ljubav --available
npm run search -- ljubav --enrich --google
npm run search -- --all programiranje
```

## Opcije

| Opcija | Opis |
|--------|------|
| `--all` | Preuzmi sve strane rezultata |
| `--details, -d` | ISBN, publisher, UDK, fizički opis, napomene... |
| `--available, -a` | Status dostupnosti (slobodno, pozajmljeno...) |
| `--enrich, -e` | Detalji + dostupnost zajedno |
| `--google, -g` | Google Books enrichment (opis, žanr, ocena, slika) |
| `--help, -h` | Prikaži pomoć |

## Struktura projekta

```
src/
  config.ts         — URL-ovi, default params (db: gbvk-1)
  http-client.ts    — axios instanca, delay helper
  types.ts          — TypeScript tipovi
  search.ts         — searchBooks(), searchAllPages()
  details.ts        — fetchBookDetails() — /full JSON endpoint
  availability.ts   — fetchAvailability() — cir-status endpoint
  enricher.ts       — enrichBook() — spaja detalje + dostupnost + google
  google-books.ts   — Google Books API enrichment
  saver.ts          — saveResultsToJson()
  cli.ts            — CLI entry point
results/            — JSON rezultati pretraga
```

## Primer ispisa

```
  Pretražujem COBISS.SR za: "ljubav"

  Nađeno: 3 rezultata

   1. Žena za ljubav : roman                          Džen, Giš                    2006
       ISBN: 86-09-00931-9 (broš.)
       Status: slobodno - van biblioteke
   2. Ljubav ili TriP                                  Stefanović-Stanojević, T.    2020
       Status: ne postoji fond
   3. Committed : a love story                         Gilbert, Elizabeth           2011
       ISBN: 978-0-670-02165-9
       Status: slobodno - van biblioteke

  Rezultati sačuvani u: results/search-2026-05-22T06-22-08.json
```

## Tech stack

- Node.js 24 + TypeScript
- axios (HTTP)
- cheerio (HTML parsing)
- tsx (TypeScript execution)
