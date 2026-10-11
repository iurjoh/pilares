import { test, expect } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'

// QA local de fluxos (npm run qa): navegacao por abas e fluxo de registro
// de habito, em viewport mobile (390px) e desktop (1280px). Complementa a
// e2e/accessibility.spec.ts (checagem fixa de a11y por rota). Dados 100%
// ficticios: cada teste roda num contexto limpo de navegador e nunca chama
// Google/Drive de verdade.
test.beforeEach(async ({ page }) => {
  await page.route(/google\.com|googleapis|gstatic/, r => r.abort())
})

const DESTINOS = [
  { path: '/', heading: /caminho|way/i },
  { path: '/espiritual', heading: /espiritual|spiritual/i },
  { path: '/mental-emocional', heading: /mental/i },
  { path: '/fisico', heading: /f.sico|physical/i },
  { path: '/intelectual', heading: /intelectual|intellectual/i },
  { path: '/financeiro', heading: /financeiro|financial/i },
]

test('abas levam aos 5 pilares e de volta ao inicio', async ({ page }, testInfo) => {
  const mobile = testInfo.project.name === 'mobile'
  const abas = page.locator(mobile ? '.bottom-nav' : '.desktop-nav')
  const outraNav = page.locator(mobile ? '.desktop-nav' : '.bottom-nav')
  await page.goto('/')
  await expect(abas).toBeVisible()
  await expect(outraNav).toBeHidden()
  for (const destino of DESTINOS.slice(1)) {
    await abas.getByRole('link', { name: destino.heading }).first().click()
    await expect(page).toHaveURL(new RegExp(`${destino.path}$`))
    await expect(page.locator('main')).toBeVisible()
  }
  await abas.getByRole('link', { name: /in.cio|home/i }).first().click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.locator('.home-hero')).toBeVisible()
})

test('fluxo de registro de habito: humor, nota, pratica e telas persistem', async ({ page }) => {
  await page.goto('/mental-emocional')
  const aviso = page.getByRole('button', { name: 'Entendi' })
  // Aviso de dados sensiveis cobre a pagina ate ser confirmado; espera
  // ele ou o conteudo aparecer antes de decidir (estado carrega async).
  await page.waitForSelector('[role="note"], .mood-scale')
  if (await aviso.isVisible()) await aviso.click()

  // Humor 4 de 5
  const humor = page.locator('.mood-scale button').nth(3)
  await humor.click()
  await expect(humor).toHaveAttribute('aria-pressed', 'true')

  // Nota livre (dado ficticio)
  await page.locator('#mental-note').fill('Dia de teste do QA local: caminhada curta e leitura.')

  // Uma pratica da semana
  const pratica = page.locator('.mental-practices input[type="checkbox"]').first()
  await pratica.check()
  await expect(pratica).toBeChecked()

  // Telas: limite 4h, registro 2h -> dentro do limite
  await page.locator('#screen-limit').fill('4')
  await page.locator('#screen-hours').fill('2')
  await expect(page.locator('.screen-result')).not.toHaveClass(/over-limit/)

  // Recarrega: tudo continua salvo (armazenamento local)
  await page.reload()
  await page.waitForSelector('[role="note"], .mood-scale')
  if (await aviso.isVisible()) await aviso.click()
  await expect(page.locator('.mood-scale button').nth(3)).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('#mental-note')).toHaveValue('Dia de teste do QA local: caminhada curta e leitura.')
  await expect(page.locator('.mental-practices input[type="checkbox"]').first()).toBeChecked()
  await expect(page.locator('#screen-hours')).toHaveValue('2')

  // Acessibilidade da pagina COM dados registrados
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()
  expect(results.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target).join(', ')}`)).toEqual([])
})
