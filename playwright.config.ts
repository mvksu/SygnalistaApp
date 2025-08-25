import type { PlaywrightTestConfig } from '@playwright/test'

const port = Number(process.env.PORT || 3000)

const config: PlaywrightTestConfig = {
  testDir: 'tests/e2e',
  timeout: 60_000,
  use: {
    baseURL: `http://localhost:${port}`,
    headless: true,
    trace: 'on-first-retry',
  },
  webServer: {
    command: process.env.E2E_USE_BUILD === 'true'
      ? 'npm run build && npm run start'
      : 'npm run dev',
    url: `http://localhost:${port}`,
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_DISABLE_RECAPTCHA: 'true',
      CAPTCHA_DISABLED: 'true',
    },
  },
}

export default config


