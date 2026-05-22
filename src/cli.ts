import "dotenv/config"
import { fetchAvailability } from "./availability.js";
import { fetchBookDetails } from "./details.js";
import { enrichBook } from "./enricher.js";
import { saveResultsToJson } from "./saver.js";
import { searchAllPages, searchBooks } from "./search.js";
import type { BookEntry, BookWithDetails } from "./types.js";

function showHelp(): void {
	console.log(`
  Usage: npm run search -- <upit> [opcije]

  Opcije:
    --all           Preuzmi sve strane rezultata
    --details, -d   Prikupi detalje o svakoj knjizi (publisher, ISBN, opis, itd.)
    --available, -a Prikupi status dostupnosti za svaku knjigu
    --enrich, -e    Detalji + dostupnost zajedno
    --google, -g    Google Books enrichment (opis, zanr, ocena, slika)
    --help, -h      Prikaži pomoć

  Primeri:
    npm run search -- ljubav
    npm run search -- ljubav --details
    npm run search -- ljubav --enrich --google
    npm run search -- --all programiranje
`);
}

async function main() {
	const args = process.argv.slice(2);

	if (args.includes("--help") || args.includes("-h")) {
		showHelp();
		process.exit(0);
	}

	const fetchAll = args.includes("--all");
	const withDetails = args.includes("--details") || args.includes("-d");
	const withAvailability = args.includes("--available") || args.includes("-a");
	const withEnrich = args.includes("--enrich") || args.includes("-e");
	const withGoogle = args.includes("--google") || args.includes("-g");
	const query = args
		.filter(
			(a) =>
				![
					"--all",
					"--details",
					"-d",
					"--available",
					"-a",
					"--enrich",
					"-e",
					"--google",
					"-g",
				].includes(a),
		)
		.join(" ");

	if (!query) {
		showHelp();
		process.exit(1);
	}

	if (withGoogle) {
		if (!process.env.GOOGLE_BOOKS_API_KEY) {
			console.log(
				`  (Google Books enrichment — bez API ključa, moguće je ograničenje)`,
			);
		} else {
			console.log(`  (Google Books enrichment uključen)`);
		}
	}

	console.log(`\n  Pretražujem COBISS.SR za: "${query}"\n`);

	try {
		let items: (BookEntry | BookWithDetails)[] = [];
		let totalHits = 0;
		const doEnrich =
			withDetails || withAvailability || withEnrich || withGoogle;

		if (fetchAll) {
			const data = await searchAllPages(query, {
				materialType: "books",
				limit: 100,
				maxPages: 50,
			});
			items = data.combined;
			totalHits = data.totalHits;
		} else {
			const result = await searchBooks({
				query,
				limit: 25,
				materialType: "books",
			});
			items = result.items;
			totalHits = result.totalHits;
		}

		console.log(`  Nađeno: ${totalHits} rezultata\n`);

		if (items.length === 0) {
			console.log("  Nema rezultata. Probaj drugačiji upit.\n");
			process.exit(0);
		}

		if (doEnrich) {
			console.log(`  Prikupljam podatke za ${items.length} knjiga...\n`);
			const enriched: BookWithDetails[] = [];
			for (let i = 0; i < items.length; i++) {
				const book = items[i] as BookEntry;
				process.stdout.write(
					`    [${i + 1}/${items.length}] ${book.title.slice(0, 40).padEnd(41)}`,
				);
				let detail;
				if (withEnrich || (withDetails && withAvailability) || withGoogle) {
					detail = await enrichBook(book, { google: withGoogle });
					process.stdout.write(
						` ${(detail.availability?.status ?? detail.googleBooks) ? "OK" : "?"}\n`,
					);
				} else if (withDetails) {
					const d = await fetchBookDetails(book.cobissId, book.database);
					detail = { ...book, details: d };
					process.stdout.write(` OK\n`);
				} else if (withAvailability) {
					const a = await fetchAvailability(book.cobissId, book.database);
					detail = { ...book, availability: a };
					process.stdout.write(` ${a.status}\n`);
				}
				if (detail) enriched.push(detail);
			}
			console.log();
			items = enriched;
		}

		for (const book of items) {
			const line = [
				`  ${String(book.position).padStart(2)}.`,
				book.title.padEnd(50).slice(0, 50),
				book.author.padEnd(28).slice(0, 28),
				book.year,
			];
			console.log(line.join(" "));
			if (doEnrich && "details" in book && book.details?.isbn) {
				console.log(`       ISBN: ${book.details.isbn}`);
			}
			if (doEnrich && "availability" in book && book.availability?.status) {
				console.log(`       Status: ${book.availability.status}`);
			}
			if (withGoogle && "googleBooks" in book && book.googleBooks) {
				const g = book.googleBooks;
				if (g.categories?.length)
					console.log(`       Zanr: ${g.categories.join(", ")}`);
				if (g.averageRating)
					console.log(
						`       Ocena: ${"★".repeat(Math.round(g.averageRating))} (${g.averageRating})`,
					);
				if (g.pageCount) console.log(`       Strane: ${g.pageCount}`);
				if (g.description)
					console.log(`       Opis: ${g.description.slice(0, 120)}...`);
			}
		}

		const filePath = await saveResultsToJson(
			fetchAll
				? { query, results: [], combined: items, totalHits }
				: {
						query,
						totalHits,
						page: 0,
						limit: items.length,
						items,
						fetchedAt: new Date().toISOString(),
					},
		);
		console.log(`\n  Rezultati sačuvani u: ${filePath}\n`);
	} catch (err: unknown) {
		const error = err as { message?: string; statusCode?: number };
		console.error(`\n  Greška: ${error.message ?? String(err)}`);
		if (error.statusCode) {
			console.error(`  HTTP status: ${error.statusCode}`);
		}
		process.exit(1);
	}
}

main();
