import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryRateLimiter, buildRateLimitHeaders, getClientIp, rateLimit } from './rate-limit'

function createReq(headers: Record<string, string> = {}, ip?: string) {
  return { headers: new Headers(headers), ip } as any
}

describe('InMemoryRateLimiter', () => {
  let limiter: InMemoryRateLimiter
  beforeEach(() => {
    limiter = new InMemoryRateLimiter()
  })

  it('blocks after reaching the limit', () => {
    const key = 'user1'
    const limit = 2
    const windowMs = 1000
    const first = limiter.consume(key, limit, windowMs)
    const second = limiter.consume(key, limit, windowMs)
    const third = limiter.consume(key, limit, windowMs)

    expect(first.allowed).toBe(true)
    expect(second.allowed).toBe(true)
    expect(third.allowed).toBe(false)
    expect(third.retryAfter).toBeGreaterThanOrEqual(0)
  })
})

describe('buildRateLimitHeaders', () => {
  it('includes rate limit information and retry header', () => {
    const result = { allowed: false, remaining: 0, limit: 5, reset: Date.now() + 1000, retryAfter: 10 }
    const headers = buildRateLimitHeaders(result)
    expect(headers['X-RateLimit-Limit']).toBe('5')
    expect(headers['X-RateLimit-Remaining']).toBe('0')
    expect(headers['X-RateLimit-Reset']).toBe(String(Math.ceil(result.reset / 1000)))
    expect(headers['Retry-After']).toBe('10')
  })
})

describe('getClientIp', () => {
  it('prefers x-forwarded-for header', () => {
    const req = createReq({ 'x-forwarded-for': '1.2.3.4' })
    expect(getClientIp(req)).toBe('1.2.3.4')
  })

  it('falls back to x-real-ip header', () => {
    const req = createReq({ 'x-real-ip': '5.6.7.8' })
    expect(getClientIp(req)).toBe('5.6.7.8')
  })

  it('falls back to request.ip when headers are missing', () => {
    const req = createReq({}, '9.9.9.9')
    expect(getClientIp(req)).toBe('9.9.9.9')
  })
})

describe('rateLimit helper', () => {
  it('uses provided limiter and options', () => {
    const limiter = new InMemoryRateLimiter()
    const res1 = rateLimit({ key: 'abc', limit: 1, windowMs: 1000, limiter })
    const res2 = rateLimit({ key: 'abc', limit: 1, windowMs: 1000, limiter })
    expect(res1.allowed).toBe(true)
    expect(res2.allowed).toBe(false)
  })
})

