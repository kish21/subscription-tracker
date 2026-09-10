import { expect, test } from '@playwright/test'

/**
 * M1 core journey (M1-SLICE-03).
 *
 * Drives the real browser at the altitude the milestone exit criterion names:
 * "the dashboard SHOWS the correct monthly total, yearly total and both renewals
 * in date order" — asserted against rendered UI, not an API payload.
 *
 * Also pins tenant isolation from the user's seat: User B must not see a single
 * one of User A's rows.
 */

const PASSWORD = 'Password12345!'

/** Unique per run so repeated runs never collide on the unique-email constraint. */
function uniqueEmail(tag: string): string {
  return `e2e-${tag}-${Date.now()}-${Math.floor(Math.random() * 10_000)}@test.com`
}

async function signUp(page: import('@playwright/test').Page, email: string, name: string) {
  await page.goto('/signup')
  // Wait on a unique interactive element, never a text match.
  await page.locator('#auth-email').waitFor({ state: 'visible' })

  await page.locator('#auth-name').fill(name)
  await page.locator('#auth-email').fill(email)
  await page.locator('#auth-password').fill(PASSWORD)

  const currency = page.locator('#auth-currency')
  if (await currency.count()) {
    await currency.selectOption('USD')
  }

  await page.locator('button[type="submit"]').click()
  await page.waitForURL('**/dashboard', { timeout: 30_000 })
}

async function addSubscription(
  page: import('@playwright/test').Page,
  opts: { name: string; price: string; cycle: string; category: string; renewal: string },
) {
  await page.getByRole('button', { name: 'Add subscription' }).click()
  await page.locator('#sub-name').waitFor({ state: 'visible' })

  await page.locator('#sub-name').fill(opts.name)
  await page.locator('#sub-price').fill(opts.price)
  await page.locator('#sub-cycle').selectOption(opts.cycle)
  await page.locator('#sub-category').selectOption(opts.category)
  await page.locator('#sub-renewal').fill(opts.renewal)

  await page.getByRole('button', { name: 'Save subscription' }).click()
  // Assert persisted state (the row appears), never merely that paint happened.
  await expect(page.getByRole('rowheader', { name: opts.name })).toBeVisible({ timeout: 30_000 })
}

/** A renewal date N days out, as the YYYY-MM-DD the date input expects. */
function renewalInDays(days: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

test.describe('M1 core journey — "I can see what I pay"', () => {
  test('signs up, adds a monthly and a yearly subscription, and shows correct totals and renewals', async ({
    page,
  }) => {
    await signUp(page, uniqueEmail('a'), 'User A')

    // Empty state first: a brand-new account owes nothing.
    const summary = page.getByRole('region', { name: 'Spend summary' })
    await expect(summary.getByText('$0.00').first()).toBeVisible()

    await addSubscription(page, {
      name: 'Netflix',
      price: '15.99',
      cycle: 'monthly',
      category: 'Streaming',
      renewal: renewalInDays(10),
    })

    await addSubscription(page, {
      name: 'Amazon Prime',
      price: '139',
      cycle: 'yearly',
      category: 'Streaming',
      renewal: renewalInDays(15),
    })

    // Monthly: 1599 + round(13900/12) = 1599 + 1158 = 2757 => $27.57
    await expect(summary.getByText('$27.57')).toBeVisible()
    // Yearly: (1599 * 12) + 13900 = 33088 => $330.88
    await expect(summary.getByText('$330.88')).toBeVisible()

    // Both renewals listed, soonest first.
    const renewalsSection = page.getByRole('list').first()
    const renewalNames = await renewalsSection.locator('li').allInnerTexts()
    expect(renewalNames).toHaveLength(2)
    expect(renewalNames[0]).toContain('Netflix')
    expect(renewalNames[1]).toContain('Amazon Prime')
  })

  test('isolates tenants: User B sees none of User A rows (ADR-005)', async ({ browser }) => {
    const contextA = await browser.newContext()
    const pageA = await contextA.newPage()
    await signUp(pageA, uniqueEmail('iso-a'), 'Isolated A')
    await addSubscription(pageA, {
      name: 'Private Service A',
      price: '50.00',
      cycle: 'monthly',
      category: 'Software',
      renewal: renewalInDays(5),
    })
    // Scope to the summary region: the amount legitimately also appears in the
    // renewals list and the table, so an unscoped match is ambiguous by design.
    const summaryA = pageA.getByRole('region', { name: 'Spend summary' })
    await expect(summaryA.getByText('$50.00')).toBeVisible()

    // A completely separate browser context: no shared cookies with User A.
    const contextB = await browser.newContext()
    const pageB = await contextB.newPage()
    await signUp(pageB, uniqueEmail('iso-b'), 'Isolated B')

    await expect(pageB.getByRole('rowheader', { name: 'Private Service A' })).toHaveCount(0)
    expect(await pageB.content()).not.toContain('Private Service A')
    const summaryB = pageB.getByRole('region', { name: 'Spend summary' })
    await expect(summaryB.getByText('$0.00').first()).toBeVisible()

    await contextA.close()
    await contextB.close()
  })

  test('fails closed: an unauthenticated visitor cannot reach the dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForURL('**/login', { timeout: 30_000 })
    await expect(page.locator('#auth-email')).toBeVisible()
  })
})
