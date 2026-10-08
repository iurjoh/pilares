import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Synthetic data only. External Google frames are blocked so tests are offline-safe.
const routes = ['/', '/espiritual', '/mental-emocional', '/fisico', '/intelectual', '/financeiro', '/privacidade', '/configuracoes']

test.beforeEach(async ({ page }) => {
  await page.route(/google\.com|googleapis|gstatic/, route => route.abort())
})

for (const path of routes) {
  test(`axe: no automated violations on ${path}`, async ({ page }) => {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
    expect(results.violations.map(v => `${v.id}: ${v.nodes.length}`)).toEqual([])
  })
}

test('no request goes to Google Fonts', async ({ page }) => {
  const hosts: string[] = []
  page.on('request', r => hosts.push(new URL(r.url()).host))
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  expect(hosts.filter(h => h.includes('fonts.g'))).toEqual([])
})

test('reader dialog traps focus, closes with Esc and returns focus', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pilares:library', JSON.stringify({ kind: 'files', files: [{ id: 'abc123', name: 'Livro de teste.pdf' }] })))
  await page.goto('/intelectual')
  const book = page.getByRole('button', { name: 'Livro de teste' })
  await book.focus()
  await book.press('Enter')
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(page.getByRole('button', { name: 'Fechar leitor' })).toBeFocused()
  // Background content is inert while the modal is open: Tab never lands on it.
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab')
    const leaked = await page.evaluate(() => { const el = document.activeElement; return !!el && el !== document.body && !el.closest('dialog') })
    expect(leaked).toBe(false)
  }
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(book).toBeFocused()
})

test('language switch updates <html lang>', async ({ page }) => {
  await page.goto('/configuracoes')
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR')
  await page.getByRole('radio', { name: 'English' }).check()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
})

test('EN mobile: bottom nav labels are not truncated and home shows no Portuguese book name', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pilares:lang', 'en'))
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const labels = await page.locator('.bottom-nav a span').evaluateAll(els => els.map(e => ({ text: e.textContent, cut: e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1 })))
  expect(labels.length).toBe(6)
  expect(labels.filter(l => l.cut)).toEqual([])
  const body = await page.locator('body').innerText()
  expect(body).not.toMatch(/Gênesis/)
})
