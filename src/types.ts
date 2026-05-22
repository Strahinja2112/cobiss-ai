export interface SearchOptions {
  query: string
  materialType?: MaterialType
  start?: number
  limit?: 10 | 25 | 50 | 100
  database?: string
}

export type MaterialType =
  | 'allmaterials'
  | 'books'
  | 'serials'
  | 'articles'
  | 'ebooks'
  | 'audiobooks'
  | 'sound'
  | 'video'
  | 'evideo'
  | 'maps'
  | 'music'
  | 'pict'
  | 'toys'
  | 'events'
  | 'allrecords'

export interface BookEntry {
  position: number
  cobissId: string
  database: string
  title: string
  author: string
  type: string
  language: string
  year: string
  detailUrl: string
}

export interface SearchResult {
  query: string
  totalHits: number
  page: number
  limit: number
  items: BookEntry[]
  fetchedAt: string
}

export interface FullDetailRecord {
  name: string
  value: string
}

export interface FullDetailsResponse {
  author700701?: FullDetailRecord
  titleCard?: FullDetailRecord
  uniformTitle?: FullDetailRecord
  materialDescr?: FullDetailRecord
  languageCard?: FullDetailRecord
  publishDate?: FullDetailRecord
  publisherCard?: FullDetailRecord
  ph_descriptionCard?: FullDetailRecord
  otherAuthor702?: FullDetailRecord
  seriesCard?: FullDetailRecord
  isbnCard?: FullDetailRecord
  notesCard?: FullDetailRecord
  udkCard?: FullDetailRecord
  cobissid?: FullDetailRecord
  [key: string]: FullDetailRecord | undefined
}

export interface BookDetail {
  cobissId: string
  title: string
  fullTitle?: string
  uniformTitle?: string
  authors: string[]
  otherAuthors?: string
  type?: string
  language?: string
  publisher?: string
  publishYear?: string
  isbn?: string
  udk?: string
  series?: string
  physicalDescription?: string
  notes?: string
  subjects?: string[]
}

export interface Availability {
  cobissId: string
  database: string
  status: string
  statusRaw: string
}

export interface GoogleBooksData {
  description?: string
  categories?: string[]
  pageCount?: number
  thumbnail?: string
  averageRating?: number
  ratingsCount?: number
  publishedDate?: string
  maturityRating?: string
  previewLink?: string
  infoLink?: string
}

export interface BookWithDetails extends BookEntry {
  details?: BookDetail
  availability?: Availability
  googleBooks?: GoogleBooksData | null
  imageUrl?: string | null
}

export interface ScraperError {
  message: string
  statusCode?: number
  url?: string
}

export const MATERIAL_TYPE_MAP: Record<string, string> = {
  books: "books",
  allmaterials: "allmaterials",
  serials: "serials",
  articles: "articles",
  ebooks: "ebooks",
  audiobooks: "audiobooks",
  sound: "sound",
  video: "video",
  evideo: "evideo",
  maps: "maps",
  music: "music",
  pict: "pict",
  toys: "toys",
  events: "events",
  allrecords: "allrecords",
}
