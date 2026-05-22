export const DOMAIN = "https://plus-legacy.cobiss.net";
export const BASE_PATH = "/cobiss/sr/sr_latn";
export const BASE_URL = `${DOMAIN}${BASE_PATH}`;
export const DETAIL_BASE_URL = BASE_URL;

export const USER_AGENT =
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

export const GOOGLE_BOOKS_BASE_URL = "https://www.googleapis.com/books/v1";

export const GOOGLE_BOOKS_API_KEY: string | undefined =
	process.env.GOOGLE_BOOKS_API_KEY || undefined;

export const DEFAULT_PARAMS = {
	q: "*",
	db: "gbvk-1",
	mat: "books",
} as const;
