import axios from "axios"
import { BASE_URL, USER_AGENT } from "../config/index.js"

export const http = axios.create({
  baseURL: BASE_URL,
  headers: { "User-Agent": USER_AGENT },
  timeout: 15_000,
})

export const delfiHttp = axios.create({
  baseURL: "https://www.delfi.rs/api",
  timeout: 10_000,
})

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
