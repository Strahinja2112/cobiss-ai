import axios from "axios";

const api = axios.create({
	baseURL: "https://www.delfi.rs/api",
	timeout: 8000,
});

async function main() {
	// Search for a book and show all fields
	const queries = [
		"orvel 1984",
		"pop cira i pop spira",
		"zona zamfirova",
		"orijent ekspres",
	];

	for (const q of queries) {
		const r = await api.get(
			`pc-frontend-api/search/advance-search/${encodeURIComponent(q)}?limit=2`,
		);
		const products = r.data?.data?.products || [];
		console.log(products);
		// if (!products.length) continue;

		// console.log(`\n=== "${q}" ===`);
		// const p = products[0];
		// console.log("title:", p.title);
		// console.log("barcode:", p.barcode);
		// console.log("navId:", p.navId);
		// console.log(
		// 	"authors:",
		// 	p.authors
		// 		?.map((a: any) => a.fullName || a.name)
		// 		.filter(Boolean)
		// 		.join(", "),
		// );
		// console.log("publisher:", p.publisher?.name);
		// console.log("description exists:", !!p.description);
		// console.log("description length:", p.description?.length || 0);
		// console.log("description preview:", (p.description || "").slice(0, 150));
		// console.log(
		// 	"attributes:",
		// 	JSON.stringify(p.attributes || []).slice(0, 200),
		// );
		// console.log("cover:", p.cover);
		// console.log(
		// 	"genres:",
		// 	p.genres
		// 		?.map((g: any) => g.name)
		// 		.filter(Boolean)
		// 		.join(", "),
		// );
	}
}

main();
