import { test, expect } from '@playwright/test'
for (const destination of ['reload', '/intelectual']) {
  test(`last edit recovers after immediate ${destination} before database opens`, async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('pilares:lang', 'pt'))
    await page.route(/google\.com|googleapis|gstatic/, r => r.abort())
    await page.goto('/fisico'); await expect(page.locator('#water-liters')).toBeVisible()
    await page.evaluate(() => {
      const original = indexedDB.open.bind(indexedDB)
      indexedDB.open = (...args: Parameters<IDBFactory['open']>) => {
        const request = original(...args)
        let callback: ((e: Event) => unknown) | null = null
        request.addEventListener('success', event => setTimeout(() => callback?.call(request, event), 1500))
        Object.defineProperty(request, 'onsuccess', { set(fn) { callback = fn } })
        return request
      }
    })
    await page.locator('#water-liters').fill('1.25')
    if (destination === 'reload') await page.reload()
    else { await page.goto(destination); await page.goto('/fisico') }
    await expect(page.locator('#water-liters')).toHaveValue('1.25')
    expect(await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('pilares:pending-write:')).length)).toBe(0)
  })
}
