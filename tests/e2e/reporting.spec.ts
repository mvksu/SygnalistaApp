import { test, expect } from '@playwright/test'

test('Submit report → receive receipt → unlock inbox → send follow-up', async ({ page }) => {
  const channelSlug = process.env.PLAYWRIGHT_CHANNEL_SLUG
  if (!channelSlug) {
    test.skip(true, 'Set PLAYWRIGHT_CHANNEL_SLUG to run this e2e flow against a public channel')
  }
  await page.goto(`/reporting-channel/${encodeURIComponent(channelSlug!)}`)

  // Fill minimal report form
  // Subject
  const subject = `Automated Test ${Date.now()}`
  const subjectInput = page.locator('input[placeholder="Short summary of your report"]')
  if (await subjectInput.count()) {
    await subjectInput.fill(subject)
  }

  // Choose anonymous
  const anonCheckbox = page.locator('label:has-text("Submit anonymously")')
  if (await anonCheckbox.count()) {
    // Already checked by default per component; no-op
  }

  // Select first category option
  const categorySelect = page.locator('select')
  await categorySelect.selectOption({ index: 1 })

  // Description
  await page.locator('textarea[placeholder="Describe the issue..."]').fill('This is an E2E test message that exceeds 20 characters.')

  // Submit
  await page.getByRole('button', { name: /Submit report/i }).click()

  // Expect redirect to receipt page
  await page.waitForURL(/\/case\//, { timeout: 10_000 })
  const caseUrl = page.url()

  // Extract code and case key from URL
  const match = /\/case\/([^?]+)\?caseKey=([^&]+)/.exec(caseUrl)
  expect(match).toBeTruthy()
  const code = decodeURIComponent(match![1])
  const caseKey = decodeURIComponent(match![2])
  expect(code).toBeTruthy()
  expect(caseKey).toBeTruthy()

  // Navigate to inbox and unlock
  await page.goto(`/r/${encodeURIComponent(code)}`)
  await page.getByLabel('Case key').fill(caseKey)
  await page.getByRole('button', { name: /Unlock/i }).click()

  // Send a follow-up message
  await page.getByPlaceholder('Write a reply...').fill('Automated follow-up from E2E test')
  await page.getByRole('button', { name: /^Send$/ }).click()

  // Expect message to appear
  await expect(page.getByText('Automated follow-up from E2E test')).toBeVisible({ timeout: 10_000 })
})


