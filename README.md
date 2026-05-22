# COBISS Book Finder

Pretraga knjiga iz COBISS.SR baze preko prirodnog jezika.

Trenutno: CLI skripta koja scrape-uje COBISS+ Legacy i čuva rezultate u JSON.

## Pokretanje

```bash
node src/search.js "neki SF roman iz devedesetih"
```

## Struktura projekta

```
├── src/
│   ├── scraper.js      # COBISS+ Legacy HTTP scraping
│   └── search.js       # CLI entry point
├── results/            # JSON rezultati pretraga
├── plan.md
└── README.md
```

## Kasnije

- AI agent za razumevanje prirodnog jezika
- SQLite baza sa custom metadata
- React Native mobilna aplikacija
