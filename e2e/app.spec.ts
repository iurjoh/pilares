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
  const book = page.getByRole('button', { name: 'Livro de teste', exact: true })
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

// Replaces Google Identity Services and the Picker with small stubs so the flow runs without a login.
async function stubGoogle(page: import('@playwright/test').Page, picks: Array<Array<{ id: string; name: string }> | 'hang'>) {
  await page.route('https://accounts.google.com/gsi/client', route => route.fulfill({ contentType: 'text/javascript', body: `
    window.google = window.google || {}
    window.google.accounts = { oauth2: {
      initTokenClient: (cfg) => ({ requestAccessToken: () => { window.__tokens = (window.__tokens || 0) + 1; cfg.callback({ access_token: 'fake-token', expires_in: 3600 }) } }),
      revoke: (_t, done) => done && done({successful:true}),
    } }` }))
  await page.route('https://apis.google.com/js/api.js', route => route.fulfill({ contentType: 'text/javascript', body: `
    window.__parents = []
    window.__picks = ${JSON.stringify(picks)}
    window.gapi = { load: (_n, o) => o.callback() }
    window.google = window.google || {}
    const chain = () => new Proxy({}, { get: (_t, k) => k === 'setParent' ? (id) => { window.__parents.push(id); return chain() } : () => chain() })
    window.google.picker = {
      ViewId: { FOLDERS: 'FOLDERS' }, Feature: { MULTISELECT_ENABLED: 'M' },
      DocsView: function () { const v = { setParent(id) { window.__parents.push(id); return v } }; for (const m of ['setMimeTypes','setIncludeFolders','setSelectFolderEnabled']) v[m] = () => v; return v },
      PickerBuilder: function () {
        const b = {}; let cb
        for (const m of ['setDeveloperKey','setAppId','setOrigin','addView','setOAuthToken','enableFeature']) b[m] = () => b
        b.setCallback = (fn) => { cb = fn; return b }
        b.build = () => ({ setVisible: () => { const docs = window.__picks.shift(); if (docs === 'hang') return; if (docs) cb({ action: 'picked', docs: docs.map(d => ({ ...d, mimeType: 'application/pdf' })) }); else cb({ action: 'cancel' }) } })
        return b
      },
    }` }))
}

test('library: pick PDFs, add more without duplicates, remove one, keep after reload', async ({ page }) => {
  await stubGoogle(page, [
    [{ id: 'a1', name: 'Meditacoes.pdf' }, { id: 'b2', name: 'Republica.pdf' }],
    [{ id: 'b2', name: 'Republica.pdf' }, { id: 'c3', name: 'Apologia.pdf' }],
  ])
  await page.goto('/intelectual')
  await page.getByRole('button', { name: 'Escolher PDFs no Google Drive' }).click()
  await expect(page.getByRole('button', { name: 'Meditacoes', exact: true })).toBeVisible()
  await expect(page.getByText('2 PDFs escolhidos por você')).toBeVisible()
  await page.getByRole('button', { name: 'Adicionar PDFs' }).click()
  await expect(page.getByRole('button', { name: 'Apologia', exact: true })).toBeVisible()
  await expect(page.getByText('3 PDFs escolhidos por você')).toBeVisible()
  await page.getByRole('button', { name: 'Remover Republica.pdf da biblioteca' }).click()
  await expect(page.getByText('2 PDFs escolhidos por você')).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Meditacoes', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Republica', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Meditacoes', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
  expect(results.violations.map(v => `${v.id}: ${v.nodes.length}`)).toEqual([])
})

test('library: Picker that never answers can be retried with a fresh token', async ({ page }) => {
  await stubGoogle(page, ['hang', [{ id: 'r1', name: 'Retomado.pdf' }]])
  await page.addInitScript(() => sessionStorage.setItem('pilares:gdrive:token', JSON.stringify({ accessToken: 'rejected', expiresAt: Date.now() + 3_600_000 })))
  await page.goto('/intelectual')
  await page.getByRole('button', { name: 'Escolher PDFs no Google Drive' }).click()
  const retry = page.getByRole('button', { name: 'Conectar de novo' })
  await expect(retry).toBeVisible()
  expect(await page.evaluate(() => (window as unknown as { __tokens?: number }).__tokens ?? 0)).toBe(0)
  await retry.click()
  await expect(page.getByRole('button', { name: 'Retomado', exact: true })).toBeVisible()
  expect(await page.evaluate(() => (window as unknown as { __tokens?: number }).__tokens ?? 0)).toBe(1)
  await expect(retry).toHaveCount(0)
})

test('library: no folder connect option; a saved folder only opens the Picker inside it', async ({ page }) => {
  await stubGoogle(page, [[{ id: 'z9', name: 'Livro.pdf' }]])
  await page.addInitScript(() => localStorage.setItem('pilares:library', JSON.stringify({ kind: 'folder', id: 'pastaLegada1', name: 'Biblioteca antiga' })))
  await page.goto('/intelectual')
  await expect(page.getByRole('button', { name: /escolher pasta/i })).toHaveCount(0)
  await expect(page.getByText(/Conectar uma pasta inteira não é mais possível/)).toBeVisible()
  await page.getByRole('button', { name: 'Adicionar PDFs' }).click()
  await expect(page.getByRole('button', { name: 'Livro', exact: true })).toBeVisible()
  expect(await page.evaluate(() => (window as unknown as { __parents: string[] }).__parents)).toEqual(['pastaLegada1'])
  await expect(page.getByText(/Conectar uma pasta inteira/)).toHaveCount(0)
})

test('EN mobile: bottom nav labels are not truncated and home shows no Portuguese book name', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pilares:lang', 'en'))
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  const labels = await page.locator('.bottom-nav a span').evaluateAll(els => els.map(e => ({ text: e.textContent, cut: e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1, sw: e.scrollWidth, cw: e.clientWidth, sh: e.scrollHeight, ch: e.clientHeight })))
  expect(labels.length).toBe(6)
  expect(labels.filter(l => l.cut)).toEqual([])
  const body = await page.locator('body').innerText()
  expect(body).not.toMatch(/Gênesis/)
})
