import { test, expect, type Page } from '@playwright/test'
async function delayed(page: Page) {
  await page.evaluate(() => {
    const original = indexedDB.open.bind(indexedDB)
    indexedDB.open = (...args: Parameters<IDBFactory['open']>) => {
      const request = original(...args); let callback: ((e: Event) => unknown) | null = null
      request.addEventListener('success', event => setTimeout(() => callback?.call(request, event), 1200))
      Object.defineProperty(request, 'onsuccess', { set(fn) { callback = fn } }); return request
    }
  })
}
test.beforeEach(async({context})=>context.addInitScript(()=>localStorage.setItem('pilares:lang','pt-BR')))
test('newer edit in another tab wins even while first database open is delayed',async({context,page})=>{
 const second=await context.newPage();await page.goto('/fisico');await second.goto('/fisico')
 await expect(page.locator('#water-liters')).toBeVisible();await expect(second.locator('#water-liters')).toBeVisible()
 await delayed(page);await page.locator('#water-liters').fill('1');await second.locator('#water-liters').fill('2')
 await page.waitForTimeout(1600);await second.reload();await expect(second.locator('#water-liters')).toHaveValue('2')
})
test('delete in another tab invalidates an in-flight save',async({context,page})=>{
 const second=await context.newPage();await page.goto('/fisico');await second.goto('/configuracoes')
 await expect(page.locator('#water-liters')).toBeVisible();await delayed(page);await page.locator('#water-liters').fill('1')
 second.on('dialog',d=>d.accept());await second.getByRole('button',{name:'Apagar todos os meus dados',exact:true}).click()
 await page.waitForTimeout(1600);await page.reload();await expect(page.locator('#water-liters')).not.toHaveValue('1')
})
test('malformed recovery entry is quarantined without blocking other records or export',async({page})=>{
 await page.goto('/fisico');await page.locator('#water-liters').fill('1.5')
 await page.evaluate(()=>localStorage.setItem('pilares:pending-write:broken','{invalid'))
 await page.reload();await expect(page.locator('#water-liters')).toHaveValue('1.5')
 expect(await page.evaluate(()=>localStorage.getItem('pilares:quarantined-write:broken'))).toBe('{invalid')
 await page.goto('/configuracoes');const download=page.waitForEvent('download');await page.getByRole('button',{name:'Baixar meus dados',exact:true}).click();await download
})
