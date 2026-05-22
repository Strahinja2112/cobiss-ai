import { delfiHttp } from "../http/client.js"
import { DELFI_WEB_BASE } from "../config/index.js"
import type { DelfiProduct, DelfiSearchResult } from "../../types/index.js"

export class DelfiApi {
  async search(query: string, limit = 5): Promise<DelfiSearchResult> {
    const resp = await delfiHttp.get("/pc-frontend-api/search/advance-search/" + encodeURIComponent(query), {
      params: { limit },
    })

    const data = resp.data?.data as {
      recordsTotal?: number
      products?: DelfiProduct[]
    } | undefined

    const products = data?.products ?? []
    const total = data?.recordsTotal ?? products.length

    return { products, total, query }
  }

  async findByIsbn(isbn: string): Promise<DelfiProduct | null> {
    const clean = isbn.replace(/[^0-9X]/gi, "")
    if (!clean) return null

    const result = await this.search(clean, 5)

    for (const product of result.products) {
      if (product.barcode === clean) {
        return product
      }
    }

    return null
  }

  async findByTitleAuthor(title: string, author: string, isbn?: string): Promise<DelfiProduct | null> {
    const keywords = [title, author]
      .filter(Boolean)
      .join(" ")
      .slice(0, 80)

    const result = await this.search(keywords, 10)
    if (result.products.length === 0) return null

    if (isbn) {
      const cleanIsbn = isbn.replace(/[^0-9X]/gi, "")
      const match = result.products.find(p => p.barcode === cleanIsbn)
      if (match) return match
    }

    const titleWords = title.toLowerCase().split(/\s+/).filter(w => w.length > 2)
    const scored = result.products.map(p => {
      const pTitle = p.title.toLowerCase()
      const score = titleWords.filter(w => pTitle.includes(w)).length / titleWords.length
      return { product: p, score }
    })
    scored.sort((a, b) => b.score - a.score)

    if (scored.length > 0 && scored[0].score >= 0.5) {
      return scored[0].product
    }

    return null
  }

  getImageUrl(product: DelfiProduct, size: "fb" | "s" | "m" | "l" | "xl" | "xxl" | "org" = "m"): string | null {
    const path = product.images?.[size]
    if (!path) return null
    return `${DELFI_WEB_BASE}${path}`
  }

  getAttribute(product: DelfiProduct, key: string): string | undefined {
    return product.attributes?.find(a => a.k === key)?.v
  }

  getCategories(product: DelfiProduct): string[] {
    return product.genres?.map(c => c.genreName).filter(Boolean) ?? []
  }

  getSubcategories(product: DelfiProduct): string[] {
    return product.subgenres?.map(c => c.genreName).filter(Boolean) ?? []
  }

  getAuthors(product: DelfiProduct): string[] {
    return product.authors?.map(a => a.authorName).filter(Boolean) ?? []
  }

  stripHtml(html: string): string {
    return html
      .replace(/<[^>]+>/g, " ")
      .replace(/&scaron;/g, "š")
      .replace(/&Scaron;/g, "Š")
      .replace(/&nbsp;/g, " ")
      .replace(/&ndash;/g, "–")
      .replace(/&mdash;/g, "—")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\s+/g, " ")
      .trim()
  }

  getDescription(product: DelfiProduct): string | undefined {
    if (!product.description) return undefined
    const text = this.stripHtml(product.description)
    return text || undefined
  }

  getPrice(product: DelfiProduct): { full?: number; discounted?: number; currency?: string } | null {
    if (!product.priceList) return null
    return {
      full: product.priceList.fullPrice,
      discounted: product.priceList.regularDiscountPrice,
    }
  }

  getIsbn(product: DelfiProduct): string | undefined {
    const attr = this.getAttribute(product, "ISBN")
    if (attr) return attr
    return product.barcode || undefined
  }

  getMetaDescription(product: DelfiProduct): string | undefined {
    return product.metaData?.description || undefined
  }

  getFullDetails(product: DelfiProduct): Record<string, unknown> {
    return {
      title: product.title,
      barcode: product.barcode,
      authors: this.getAuthors(product),
      publisher: product.publisher,
      categories: this.getCategories(product),
      subcategories: this.getSubcategories(product),
      description: this.getDescription(product),
      numberOfPages: this.getAttribute(product, "numberOfPages"),
      format: this.getAttribute(product, "format"),
      weight: this.getAttribute(product, "weight"),
      importedFrom: this.getAttribute(product, "importedFrom"),
      cover: product.cover,
      imageUrls: {
        small: this.getImageUrl(product, "s"),
        medium: this.getImageUrl(product, "m"),
        large: this.getImageUrl(product, "l"),
        xl: this.getImageUrl(product, "xl"),
      },
      inStock: product.isAvailable ?? product.quantity ? true : false,
    }
  }
}
