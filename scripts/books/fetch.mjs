import { crawlBooks } from "../../src/app/api/_lib/cobiss.ts";
import { saveBooks } from "../../src/app/api/_lib/save-books.ts";

export async function runFetch(db, signal, catalog) {
  for await (const event of crawlBooks(signal, catalog)) {
    await saveBooks(event, db, catalog);
    if (event.type === "page") {
      console.log(
        `Saved ${event.loaded}/${event.totalHits} books; fetched ${event.pagesFetched} pages`,
      );
    } else if (event.type === "isbn") {
      console.log(
        `Checked ${event.checked} ISBNs; ${event.failures} lookup failures`,
      );
    } else {
      console.log(
        `Fetch complete: ${event.loaded} books, ${event.checked} ISBN checks, ${event.failures} lookup failures`,
      );
    }
  }
}
