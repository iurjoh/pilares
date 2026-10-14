import { test, expect } from '@playwright/test'

// Every route using the shared module-page shell, including aliases.
const routes = ['/espiritual', '/mental-emocional', '/mental', '/fisico', '/intelectual', '/financeiro', '/privacidade', '/privacy', '/configuracoes', '/settings']
for (const lang of ['pt', 'en']) for (const route of routes) for (const notice of ['new', 'acknowledged']) {
  test(`${lang} ${route} ${notice}: footer follows the final content`, async ({ page }) => {
    await page.addInitScript(({ lang, notice }) => {
      localStorage.setItem('pilares:lang', lang)
      if (notice === 'acknowledged') localStorage.setItem('pilares:sensitive-notice-v1', 'read')
    }, { lang, notice })
    await page.route(/google\.com|googleapis|gstatic/, r => r.abort())
    await page.goto(route)
    await expect(page.locator('main.module-page')).toBeVisible()
    await page.evaluate(() => document.fonts.ready)
    const gated = notice === 'new' && ['/mental-emocional','/mental','/financeiro'].includes(route)
    const final = gated ? page.locator('[role=note] button') : page.locator('.mental-privacy, .physical-privacy, .privacy-note, .legal-page, .settings-page').last()
    await expect(final).toBeVisible()
    const gap = await page.evaluate(() => {
      const main = document.querySelector('main.module-page')!
      const footer = document.querySelector('footer')!.getBoundingClientRect()
      const bottoms: number[] = []
      const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT)
      while (walker.nextNode()) {
        const node = walker.currentNode
        const el = node.parentElement!
        if (!node.textContent?.trim() || el.closest('[aria-hidden="true"]') || getComputedStyle(el).visibility === 'hidden') continue
        const range = document.createRange(); range.selectNodeContents(node)
        for (const rect of range.getClientRects()) if (rect.height > 0) bottoms.push(rect.bottom)
      }
      for (const el of main.querySelectorAll('input,button,textarea,select,img')) {
        const rect = el.getBoundingClientRect()
        if (rect.height > 0 && !el.closest('[aria-hidden="true"]')) bottoms.push(rect.bottom)
      }
      return footer.top - Math.max(...bottoms)
    })
    expect(gap).toBeGreaterThanOrEqual(0)
    expect(gap).toBeLessThanOrEqual(80)
  })
}
