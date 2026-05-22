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

export interface BookDetail {
  cobissId: string
  title: string
  authors: string[]
  publisher?: string
  publishYear?: string
  isbn?: string
  udk?: string
  language?: string
  physicalDescription?: string
  type?: string
  subjects?: string[]
  notes?: string
}

export interface ScraperError {
  message: string
  statusCode?: number
  url?: string
}
