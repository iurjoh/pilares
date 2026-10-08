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
  await expect(page.getByText('A seleção da biblioteca era inválida e foi removida.', { exact: false })).toBeVisible()
  await page.goto('/fisico'); await expect(page.locator('#water-liters')).toHaveValue('1')
})

for (const failure of ['network', '403', '429']) {
  test(`folder ${failure} exposes an error and reload recovers`, async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('pilares:library', JSON.stringify({ kind: 'folder', id: 'synthetic-folder', name: 'Synthetic library' }))
      sessionStorage.setItem('pilares:gdrive:token', JSON.stringify({ accessToken: 'synthetic', expiresAt: Date.now() + 3600000 }))
    })
    let broken = true
    await page.route('https://www.googleapis.com/drive/v3/files?**', route => broken
      ? failure === 'network' ? route.abort() : route.fulfill({ status: Number(failure), json: { error: 'synthetic failure' } })
      : route.fulfill({ json: { files: [{ id: 'synthetic-pdf', name: 'Recovered.pdf' }] } }))
    await page.goto('/intelectual')
    await expect(page.getByRole('alert')).toContainText('Não foi possível ler a pasta')
    broken = false; await page.getByRole('button', { name: 'Recarregar lista' }).click()
    await expect(page.getByRole('button', { name: 'Recovered' })).toBeVisible()
    await expect(page.getByRole('alert')).toHaveCount(0)
  })
}

test('Drive 401 must offer reconnect rather than claim the folder is empty', async ({ page }) => {
  test.fail(true, 'Known defect: listFolderPdfs throws token-expired but loadFiles does not set needsReconnect or clear the token.')
  await page.addInitScript(() => {
    localStorage.setItem('pilares:library', JSON.stringify({ kind: 'folder', id: 'synthetic-folder', name: 'Synthetic' }))
    sessionStorage.setItem('pilares:gdrive:token', JSON.stringify({ accessToken: 'synthetic', expiresAt: Date.now() + 3600000 }))
  })
  await page.route('https://www.googleapis.com/drive/v3/files?**', r => r.fulfill({ status: 401, json: { error: 'expired' } }))
  await page.goto('/intelectual')
  await expect(page.getByRole('button', { name: 'Conectar de novo' })).toBeVisible({ timeout: 3000 })
})
