import { NextRequest } from "next/server"

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  limit: number
  reset: number
  retryAfter?: number
}

/**
 * Simple in-memory sliding window rate limiter for development and small deployments.
 * Keyed by arbitrary string (e.g., IP or IP+route).
 */
export class InMemoryRateLimiter {
  private hitTimestampsByKey: Map<string, number[]> = new Map()

  consume(key: string, limit: number, windowMs: number): RateLimitResult {
    const now = Date.now()
    const windowStart = now - windowMs

    const timestamps = this.hitTimestampsByKey.get(key) ?? []
    // Drop timestamps outside the window
    const recent = timestamps.filter((t) => t > windowStart)

    const remaining = Math.max(0, limit - recent.length - 1)
    const allowed = recent.length < limit
    const updated = allowed ? [...recent, now] : recent

    this.hitTimestampsByKey.set(key, updated)

    let reset = now + windowMs
    if (updated.length > 0) {
      // Reset at first hit in the window + windowMs
      reset = updated[0] + windowMs
    }

    const result: RateLimitResult = {
      allowed,
      remaining,
      limit,
      reset,
    }

    if (!allowed) {
      result.retryAfter = Math.max(0, Math.ceil((reset - now) / 1000))
    }

    return result
  }
}

export const defaultRateLimiter = new InMemoryRateLimiter()

export function getClientIp(request: NextRequest): string {
  // Try common proxy headers, fall back to request.ip
  const xff = request.headers.get("x-forwarded-for")
  if (xff) {
    const first = xff.split(",")[0]?.trim()
    if (first) return first
  }
  const realIp = request.headers.get("x-real-ip")
  if (realIp) return realIp
  // @ts-expect-error: NextRequest.ip is available at runtime
  return (request as any).ip || "0.0.0.0"
}

export function rateLimit(options: {
  key: string
  limit?: number
  windowMs?: number
  limiter?: InMemoryRateLimiter
}): RateLimitResult {
  const { key, limit = 20, windowMs = 60_000, limiter = defaultRateLimiter } = options
  return limiter.consume(key, limit, windowMs)
}

export function buildRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.reset / 1000)),
  }
  if (!result.allowed && result.retryAfter !== undefined) {
    headers["Retry-After"] = String(result.retryAfter)
  }
  return headers
}


