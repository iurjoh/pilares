import { test, expect } from '@playwright/test'

// Isolated local preview only. Never use personal Drive data or live OAuth.
test.beforeEach(async ({ page }) => {
  await page.route(/google\.com|googleapis|gstatic/, r => r.abort())
})

test('save, reload and export preserve a synthetic physical record without OAuth tokens', async ({ page }) => {
  await page.goto('/fisico')
  await page.locator('#water-liters').fill('1.25')
  await expect.poll(() => page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>(resolve => { const r = indexedDB.open('pilares-local-v1'); r.onsuccess = () => resolve(r.result) })
    const tx = db.transaction('settings'); const r = tx.objectStore('settings').get('fisico-v1')
    const value = await new Promise(resolve => { tx.oncomplete = () => resolve(r.result) }); db.close(); return value
  })).toMatchObject({ version: 1 })
  await page.reload()
  await expect(page.locator('#water-liters')).toHaveValue('1.25')
  await page.evaluate(() => sessionStorage.setItem('pilares:gdrive:token', JSON.stringify({ accessToken: 'synthetic-do-not-export', expiresAt: Date.now() + 3600000 })))
  await page.goto('/configuracoes')
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Baixar meus dados', exact: true }).click()
  const artifact = await download
  const stream = await artifact.createReadStream(); const chunks: Buffer[] = []
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk))
  const raw = Buffer.concat(chunks).toString(); const json = JSON.parse(raw)
  expect(json.format).toBe('pilares-export-v1')
  expect(Object.values(json.indexedDB['fisico-v1'].days)).toContainEqual(expect.objectContaining({ waterMl: 1250 }))
  expect(raw).not.toContain('synthetic-do-not-export')
  expect(raw).not.toContain('accessToken')
})

test('corrupt library selection resets without losing unrelated pillar records', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pilares:library', '{broken'))
  await page.goto('/fisico'); await page.locator('#water-liters').fill('1')
  await page.goto('/intelectual')
  await expect(page.getByRole('button', { name: 'Escolher PDFs no Google Drive' })).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('pilares:library'))).toBeNull()
  await page.goto('/fisico'); await expect(page.locator('#water-liters')).toHaveValue('1')
})

async function stubGoogle(page: import('@playwright/test').Page, picks: Array<Array<{ id: string; name: string }> | 'hang' | 'error'>) {
  await page.route('https://accounts.google.com/gsi/client', route => route.fulfill({ contentType: 'text/javascript', body: `
    window.google = window.google || {}
    window.google.accounts = { oauth2: {
      initTokenClient: (cfg) => ({ requestAccessToken: () => { window.__tokens = (window.__tokens || 0) + 1; cfg.callback({ access_token: 'fake-token', expires_in: 3600 }) } }),
      revoke: (_t, done) => done && done(),
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
        b.build = () => ({ setVisible: () => { const docs = window.__picks.shift(); if (docs === 'hang') { window.__latePicker = cb; return; } if (docs === 'error') throw new Error('synthetic Picker failure'); if (docs) cb({ action: 'picked', docs: docs.map(d => ({ ...d, mimeType: 'application/pdf' })) }); else cb({ action: 'cancel' }) } })
        return b
      },
    }` }))
}

test('Picker cancel preserves saved PDFs and permits another selection', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pilares:library', JSON.stringify({ kind: 'files', files: [{ id: 'saved1', name: 'Saved.pdf' }] })))
  await stubGoogle(page, [[], [{ id: 'added2', name: 'Added.pdf' }]])
  await page.goto('/intelectual')
  await page.getByRole('button', { name: 'Adicionar PDFs' }).click()
  await expect(page.getByRole('button', { name: 'Adicionar PDFs' })).toBeEnabled()
  await expect(page.getByRole('button', { name: 'Saved', exact: true })).toBeVisible()
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('pilares:library')!).files)).toHaveLength(1)
  await page.getByRole('button', { name: 'Adicionar PDFs' }).click()
  await expect(page.getByRole('button', { name: 'Added', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Saved', exact: true })).toBeVisible()
})

test('Picker initialization error preserves the library and retry recovers', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pilares:library', JSON.stringify({ kind: 'files', files: [{ id: 'saved1', name: 'Saved.pdf' }] })))
  await stubGoogle(page, ['error', [{ id: 'added2', name: 'Added.pdf' }]])
  await page.goto('/intelectual')
  await page.getByRole('button', { name: 'Adicionar PDFs' }).click()
  await expect(page.getByRole('alert')).toContainText('Não foi possível abrir a seleção')
  await expect(page.getByRole('button', { name: 'Saved', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Adicionar PDFs' }).click()
  await expect(page.getByRole('button', { name: 'Added', exact: true })).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('unresponsive Picker with locally valid rejected token recovers with a fresh token and ignores late result', async ({ page }) => {
  // Simulates an unresponsive Picker, not a real Google HTTP 401.
  await page.addInitScript(() => sessionStorage.setItem('pilares:gdrive:token', JSON.stringify({ accessToken: 'synthetic-rejected', expiresAt: Date.now() + 3600000 })))
  await stubGoogle(page, ['hang', [{ id: 'fresh1', name: 'Fresh.pdf' }]])
  await page.goto('/intelectual')
  await page.getByRole('button', { name: 'Escolher PDFs no Google Drive' }).click()
  await expect(page.getByRole('button', { name: 'Conectar de novo' })).toBeVisible()
  expect(await page.evaluate(() => (window as any).__tokens ?? 0)).toBe(0)
  await page.getByRole('button', { name: 'Conectar de novo' }).click()
  await expect(page.getByRole('button', { name: 'Fresh', exact: true })).toBeVisible()
  expect(await page.evaluate(() => (window as any).__tokens)).toBe(1)
  expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem('pilares:gdrive:token')!).accessToken)).toBe('fake-token')
  await page.evaluate(() => (window as any).__latePicker({ action: 'picked', docs: [{ id: 'late1', name: 'Stale.pdf', mimeType: 'application/pdf' }] }))
  await expect(page.getByRole('button', { name: 'Stale', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Fresh', exact: true })).toBeVisible()
})

test('corrupt selection shows its reset notice on first mount', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pilares:library', '{broken'))
  await page.goto('/intelectual')
  await expect(page.getByText('A seleção da biblioteca era inválida e foi removida.', { exact: false })).toBeVisible({ timeout: 2000 })
})
