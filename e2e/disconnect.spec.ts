import { test, expect } from '@playwright/test'

type Mode = 'success' | 'failure' | 'hang' | 'missing' | 'expired' | 'near-expiry' | 'script-blocked'
const seed = async (page: import('@playwright/test').Page, mode: Mode) => {
  await page.addInitScript((mode) => {
    if (sessionStorage.getItem('disconnect-test-seeded')) return
    sessionStorage.setItem('disconnect-test-seeded', 'yes')
    localStorage.setItem('pilares:library', JSON.stringify({ kind: 'files', files: [{ id: 'synthetic', name: 'Synthetic.pdf' }] }))
    if (mode !== 'missing') sessionStorage.setItem('pilares:gdrive:token', JSON.stringify({ accessToken: 'synthetic-token', expiresAt: Date.now() + (mode === 'expired' ? -1000 : mode === 'near-expiry' ? 10000 : 3600000) }))
  }, mode)
  await page.route('https://accounts.google.com/gsi/client', route => mode === 'script-blocked' ? route.abort() : route.fulfill({ contentType: 'text/javascript', body: `window.__revokes=0;window.google={accounts:{oauth2:{revoke:(_token,done)=>{window.__revokes++;${mode === 'hang' ? '' : `done({successful:${mode !== 'failure'}})`}}}}}` }))
  await page.route('https://apis.google.com/**', r => r.abort())
  await page.route('https://drive.google.com/**', r => r.abort())
}
for (const path of ['library', 'settings', 'erase'] as const) for (const mode of ['success','failure','hang','missing','expired','near-expiry','script-blocked'] as const) {
  test(`${path}: ${mode} reports the real result and clears local connection`, async ({ page }) => {
    await seed(page, mode)
    await page.goto(path === 'library' ? '/intelectual' : '/configuracoes')
    if (path === 'erase') {
      page.on('dialog', d => d.accept())
      await Promise.all([page.waitForEvent('load'), page.getByRole('button', { name: 'Apagar todos os meus dados', exact: true }).click()])
      // The seed marker survives reload; deleted application data is never re-seeded.
    } else await page.getByRole('button', { name: 'Desconectar biblioteca', exact: true }).click()
    await expect.poll(() => page.evaluate(() => ({ selection: localStorage.getItem('pilares:library'), token: sessionStorage.getItem('pilares:gdrive:token') }))).toEqual({ selection: null, token: null })
    const text = mode === 'success' || mode === 'near-expiry' ? 'O Google confirmou a revogação' : mode === 'missing' || mode === 'expired' ? 'Não há token válido' : 'Não foi possível confirmar a revogação no Google'
    await expect(page.getByText(text, { exact: false })).toBeVisible({ timeout: 12000 })
    if (!['success','near-expiry'].includes(mode)) await expect(page.getByRole('link', { name: 'Gerenciar o acesso do Pilares na Conta Google' })).toHaveAttribute('href', 'https://myaccount.google.com/connections')
  })
}

test('disconnect invalidates the other tab local token and open reader', async ({ context }) => {
  const a = await context.newPage(), b = await context.newPage()
  await seed(a, 'success'); await seed(b, 'success')
  await a.goto('/configuracoes'); await b.goto('/intelectual')
  await b.getByRole('button', { name: 'Synthetic', exact: true }).click()
  await expect(b.getByRole('dialog')).toBeVisible()
  await a.getByRole('button', { name: 'Desconectar biblioteca', exact: true }).click()
  await expect.poll(() => b.evaluate(() => sessionStorage.getItem('pilares:gdrive:token'))).toBeNull()
  await expect(b.getByRole('dialog')).toHaveCount(0)
})
