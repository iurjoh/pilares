import { test, expect } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'

// Auditoria de acessibilidade (checagem fixa de toda revisao de UI/UX):
// axe-core WCAG 2.x A/AA em todas as rotas (inclui contraste), alvos de
// toque >= 24px e navegacao por teclado. Roda nos projetos mobile e desktop.
// Isolado: nunca chama Google/Drive de verdade.
test.beforeEach(async ({ page }) => {
  await page.route(/google\.com|googleapis|gstatic/, r => r.abort())
})

const ROUTES = ['/', '/espiritual', '/mental-emocional', '/fisico', '/intelectual', '/financeiro', '/privacidade', '/configuracoes']

for (const route of ROUTES) {
  test(`wcag 2.x A/AA sem violacoes em ${route}`, async ({ page }) => {
    await page.goto(route)
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()
    expect(results.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target).join(', ')}`)).toEqual([])
  })
}

test('alvos de toque >= 24px (rodape, voltar, link legal)', async ({ page }) => {
  for (const route of ROUTES) {
    await page.goto(route)
    for (const selector of ['.footer-links a', '.back-link', '.settings-legal a']) {
      for (const el of await page.locator(selector).all()) {
        const box = await el.boundingBox()
        if (!box) continue
        expect(box.height, `${route} ${selector}: alvo com ${box.height}px de altura (minimo 24px)`).toBeGreaterThanOrEqual(24)
        expect(box.width, `${route} ${selector}: alvo com ${box.width}px de largura (minimo 24px)`).toBeGreaterThanOrEqual(24)
      }
    }
  }
})

test('teclado: skip-link primeiro, indicador visivel e sem armadilha na home', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  await expect(page.locator('.skip-link')).toBeFocused()
  let previous = ''
  let repeats = 0
  for (let i = 0; i < 24; i++) {
    const focus = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null
      if (!el || el.tagName === 'BODY') return null
      const st = getComputedStyle(el)
      const visible = (st.outlineStyle !== 'none' && parseFloat(st.outlineWidth) > 0) || st.boxShadow !== 'none'
      return { id: `${el.tagName}:${el.textContent?.slice(0, 30)}`, visible }
    })
    if (!focus) break
    expect(focus.visible, `elemento focado sem indicador visivel: ${focus.id}`).toBe(true)
    repeats = focus.id === previous ? repeats + 1 : 0
    expect(repeats, `foco preso em ${focus.id}`).toBeLessThan(3)
    previous = focus.id
    await page.keyboard.press('Tab')
  }
})
