export class HttpError extends Error {
  statusCode: number
  error?: string
  data?: unknown

  constructor(statusCode: number, message: string, error?: string, data?: unknown) {
    super(message)
    this.name = "HttpError"
    this.statusCode = statusCode
    this.error = error
    this.data = data
  }
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

interface RequestOptions {
  method?: HttpMethod
  body?: unknown
  headers?: Record<string, string>
  params?: Record<string, string | number | boolean | undefined | null>
}

let tokenGetter: () => string | null = () => null
let unauthorizedHandler: () => void = () => {
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.href = "/login"
  }
}

export function configureHttp(options: {
  getToken?: () => string | null
  onUnauthorized?: () => void
}) {
  if (options.getToken) tokenGetter = options.getToken
  if (options.onUnauthorized) unauthorizedHandler = options.onUnauthorized
}

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"

export async function http<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let url = `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`

  if (options.params) {
    const searchParams = new URLSearchParams()
    Object.entries(options.params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        searchParams.append(key, String(val))
      }
    })
    const qs = searchParams.toString()
    if (qs) {
      url += (url.includes("?") ? "&" : "?") + qs
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  }

  const token = tokenGetter()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    let errorBody: { statusCode?: number; message?: string | string[]; error?: string; [key: string]: unknown } = {}
    try {
      errorBody = await response.json()
    } catch {
      errorBody = { message: response.statusText }
    }

    const message = Array.isArray(errorBody.message)
      ? errorBody.message.join(", ")
      : errorBody.message || `Request failed with status ${response.status}`

    if (response.status === 401) {
      unauthorizedHandler()
    }

    throw new HttpError(response.status, message, errorBody.error, errorBody)
  }

  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}
