export interface SearchOptions {
  query: string
  materialType?: MaterialType
  start?: number
  limit?: 10 | 25 | 50 | 100
  database?: string
}

export type MaterialType =
  | 'allmaterials' | 'books' | 'serials' | 'articles' | 'ebooks'
  | 'audiobooks' | 'sound' | 'video' | 'evideo' | 'maps'
  | 'music' | 'pict' | 'toys' | 'events' | 'allrecords'

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

export interface CobissDetail {
  fullTitle?: string
  uniformTitle?: string
  authors: string[]
  otherAuthors?: string
  type?: string
  audience?: string
  language?: string
  publisher?: string
  publishYear?: string
  isbn?: string
  udk?: string
  series?: string
  physicalDescription?: string
  notes?: string
  subjects?: string[]
  otherSubjects?: string
  digitalContentsUrl?: string
}

export interface Availability {
  cobissId: string
  database: string
  status: string
  statusRaw: string
}

export interface GoogleImages {
  smallThumbnail?: string
  thumbnail?: string
  small?: string
  medium?: string
  large?: string
  extraLarge?: string
}

export interface GoogleDetails {
  description?: string
  categories?: string[]
  pageCount?: number
  averageRating?: number
  ratingsCount?: number
  subtitle?: string
  publisher?: string
  publishedDate?: string
  language?: string
  imageLinks?: GoogleImages
  previewLink?: string
  infoLink?: string
}

export interface OpenLibraryData {
  description?: string
  subjects?: string[]
  subjectPlaces?: string[]
  subjectPeople?: string[]
  subjectTimes?: string[]
}

export interface BookWithDetails extends BookEntry {
  cobiss: CobissDetail
  availability?: Availability
  google?: GoogleDetails | null
  openLibrary?: OpenLibraryData | null
  delfi?: DelfiProduct | null
  imageUrl?: string | null
  description?: string
  aiContext?: string
}

export interface ScraperError {
  message: string
  statusCode?: number
  url?: string
}

export interface DelfiAuthor {
  _id: string
  authorName: string
}

export interface DelfiImages {
  fb?: string
  s?: string
  m?: string
  l?: string
  xl?: string
  xxl?: string
  org?: string
}

export interface DelfiAttribute {
  k: string
  v: string
}

export interface DelfiProduct {
  _id: string
  navId: string
  title: string
  barcode: string
  description: string
  shortDescription?: string
  cover: string
  authors: DelfiAuthor[]
  publisher: string
  genres?: Array<{ _id: string; genreName: string }>
  subgenres?: Array<{ _id: string; genreName: string }>
  category?: string
  attributes: DelfiAttribute[]
  images: DelfiImages
  priceList?: {
    fullPrice?: number
    regularDiscountPrice?: number
    eBookPrice?: number
    currency?: string
  }
  quantity?: number
  isAvailable?: boolean
  inStock?: boolean
  rating?: number
  rankList?: { rank1?: number; rank2?: number; rank3?: number; rank4?: number; rank5?: number }
  metaData?: { description?: string; keyWords?: string }
  releaseDate?: string
  productType?: string
  url?: string
  slug?: string
  imgGallery?: string[]
}

export interface DelfiSearchResult {
  products: DelfiProduct[]
  total: number
  query: string
}

export const MATERIAL_TYPE_MAP: Record<string, string> = {
  books: "books", allmaterials: "allmaterials", serials: "serials",
  articles: "articles", ebooks: "ebooks", audiobooks: "audiobooks",
  sound: "sound", video: "video", evideo: "evideo", maps: "maps",
  music: "music", pict: "pict", toys: "toys", events: "events",
  allrecords: "allrecords",
}
