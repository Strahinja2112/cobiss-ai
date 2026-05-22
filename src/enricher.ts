import { fetchAvailability } from "./availability.js";
import { fetchBookDetails } from "./details.js";
import { fetchGoogleBooks } from "./google-books.js";
import type { BookEntry, BookWithDetails } from "./types.js";

export interface EnrichOptions {
	details?: boolean;
	availability?: boolean;
	google?: boolean;
}

export async function enrichBook(
	entry: BookEntry,
	options: EnrichOptions = {},
): Promise<BookWithDetails> {
	const {
		details: doDetails = true,
		availability: doAvail = true,
		google: doGoogle = false,
	} = options;

	const enriched: BookWithDetails = { ...entry };

	const tasks: Promise<void>[] = [];
	let detailsPromise: Promise<BookWithDetails["details"]> | undefined;

	if (doDetails) {
		detailsPromise = fetchBookDetails(entry.cobissId, entry.database);
		tasks.push(
			detailsPromise.then((d) => {
				enriched.details = d;
			}),
		);
	}
	if (doAvail) {
		tasks.push(
			fetchAvailability(entry.cobissId, entry.database).then((a) => {
				enriched.availability = a;
			}),
		);
	}

	await Promise.all(tasks);

	if (doGoogle) {
		const isbn = enriched.details?.isbn;
		if (isbn) {
			enriched.googleBooks = await fetchGoogleBooks(isbn);
		}
	}

	return enriched;
}
