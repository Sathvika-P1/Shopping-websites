import { test, expect } from '@playwright/test'

test('renders the storefront heading', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Storefront' })).toBeVisible()
})
