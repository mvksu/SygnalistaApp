import { test, expect } from '@playwright/test'

test('rate limit endpoint enforces request limit', async ({ request }) => {
  for (let i = 0; i < 5; i++) {
    const res = await request.get('/api/rate-limit-test')
    expect(res.status(), `request ${i + 1} should succeed`).toBe(200)
  }
  const blocked = await request.get('/api/rate-limit-test')
  expect(blocked.status()).toBe(429)
  const remaining = blocked.headers()['x-ratelimit-remaining']
  expect(remaining).toBe('0')
})

