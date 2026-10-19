import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
const catalogue = JSON.parse(readFileSync('src/library/catalogue.json','utf8')) as {code:string; asset:string; title:string; pages:number; license:string; licenseUrl:string; sha256:string}[]

for (const lang of ['pt-BR', 'en']) {
  test(`no-login catalogue and real PDF reader ${lang}`, async ({ page }, info) => {
    const errors: string[] = []
    const offsite: string[] = []
    page.on('pageerror', e => errors.push(e.message))
    page.on('request', req => { if (!req.url().startsWith('http://127.0.0.1:4191') && !req.url().startsWith('blob:')) offsite.push(req.url()) })
    await page.addInitScript(l => localStorage.setItem('pilares:lang', l), lang)
    await page.goto('/intelectual')
    await expect(page.locator('.local-library')).toBeVisible()
    await expect(page.locator('.licensed-pdf-list>li')).toHaveCount(2)
    await expect(page.locator('#local-pdf-input')).toHaveAttribute('type','file')
    for (const [i, book] of catalogue.entries()) {
      const row=page.locator('.licensed-pdf-list>li').nth(i)
      await expect(row).toContainText(book.license)
      await expect(row.locator('a[href^="https://creativecommons.org"]')).toHaveAttribute('href',book.licenseUrl)
      const response=await page.request.get(book.asset)
      expect(createHash('sha256').update(await response.body()).digest('hex')).toBe(book.sha256)
      const opener=row.locator('button')
      await opener.click()
      await expect(page.locator('.pdf-local-reader')).toBeVisible()
      await expect(page.locator('.pdf-viewport')).toHaveAttribute('data-rendered','true',{timeout:30000})
      await expect(page.locator('.pdf-local-reader [role="alert"]')).toHaveCount(0)
      expect(await page.locator('.pdf-local-reader canvas').evaluate((c:HTMLCanvasElement)=>c.width>200 && c.height>200)).toBeTruthy()
      await expect(page.locator('.pdf-controls')).toContainText(String(book.pages))
      await page.locator('.pdf-controls button').nth(1).click()
      await expect(page.locator('.pdf-viewport')).toHaveAttribute('data-rendered','true',{timeout:30000})
      await expect(page.locator('.pdf-controls')).toContainText(lang==='en'?'Page 2 of':'Página 2 de')
      if(i===1) { await page.locator('.pdf-controls button').nth(1).click(); await expect(page.locator('.pdf-viewport')).toHaveAttribute('data-rendered','true',{timeout:30000}) }
      await page.locator('.pdf-controls select').selectOption('1.5')
      await expect(page.locator('.pdf-viewport')).toHaveAttribute('data-rendered','true',{timeout:30000})
      await expect(page.locator('.pdf-controls select')).toBeEnabled(); expect(await page.locator('canvas').evaluate((c:HTMLCanvasElement)=>{const d=c.getContext('2d')!.getImageData(0,0,c.width,c.height).data;let dark=0;for(let j=0;j<d.length;j+=4)if(d[j]<100&&d[j+1]<100&&d[j+2]<100&&d[j+3]>200)dark++;return dark>20&&dark<c.width*c.height*.9})).toBe(true); await page.screenshot({path:`test-results/pdf-${i}-${info.project.name}-${lang}.png`})
      await page.keyboard.press('Escape')
      await expect(page.locator('.pdf-local-reader')).toHaveCount(0)
      await expect(opener).toBeFocused()
    }
    expect(errors).toEqual([])
    expect(offsite).toEqual([])
    expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false)
  })

  test(`local private file stays local, cleanup and validation ${lang}`, async ({page})=>{
    const requests:{url:string,body:string}[]=[]
    await page.addInitScript(l=>localStorage.setItem('pilares:lang',l),lang)
    await page.goto('/intelectual')
    page.on('request',r=>requests.push({url:r.url(),body:r.postData()||''}))
    const marker='PRIVATE_LOCAL_FILENAME_NOT_FOR_NETWORK.pdf'
    await page.locator('#local-pdf-input').setInputFiles({name:marker,mimeType:'application/pdf',buffer:readFileSync('public/library/payne-introduction-2015.pdf')})
    await expect(page.locator('.pdf-local-reader')).toHaveAttribute('aria-label',marker)
    await expect(page.locator('.pdf-viewport')).toHaveAttribute('data-rendered','true',{timeout:30000})
    await page.locator('.pdf-readable-text summary').click()
    await expect(page.locator('.pdf-page-text')).toContainText('Russ Payne')
    expect(requests.some(r=>(r.url+r.body).includes('PRIVATE_LOCAL_FILENAME'))).toBe(false)
    expect(requests.some(r=>!r.url.startsWith('http://127.0.0.1:4191'))).toBe(false)
    const storage=await page.evaluate(()=>JSON.stringify({local:{...localStorage},session:{...sessionStorage}}))
    expect(storage).not.toContain('PRIVATE_LOCAL_FILENAME')
    await page.reload()
    await expect(page.locator('.pdf-local-reader')).toHaveCount(0)
    await page.locator('#local-pdf-input').setInputFiles({name:'fake.pdf',mimeType:'application/pdf',buffer:Buffer.from('<script>top.PDF_SCRIPT_RAN=true</script>')})
    await expect(page.locator('.local-library [role="alert"]')).toBeVisible()
    await expect(page.locator('.pdf-local-reader')).toHaveCount(0)
    await page.locator('#local-pdf-input').setInputFiles({name:'broken.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.7\nbroken')})
    await expect(page.locator('.pdf-local-reader [role="alert"]')).toBeVisible()
    await page.keyboard.press('Escape')
    expect(await page.evaluate(()=>(window as unknown as {PDF_SCRIPT_RAN?:boolean}).PDF_SCRIPT_RAN)).toBeUndefined()
    await page.locator('#local-pdf-input').setInputFiles({name:'reader-clear.pdf',mimeType:'application/pdf',buffer:readFileSync('public/library/payne-introduction-2015.pdf')})
    await expect(page.locator('.pdf-viewport')).toHaveAttribute('data-rendered','true',{timeout:30000})
    await page.evaluate(()=>window.dispatchEvent(new CustomEvent('pilares:library-updated')))
    await expect(page.locator('.pdf-local-reader')).toHaveCount(0)
  })
}

test('local reader keyboard trap, accessible text and axe', async ({page})=>{
  test.setTimeout(120000)
  await page.addInitScript(()=>localStorage.setItem('pilares:lang','en'))
  await page.goto('/intelectual')
  await page.locator('.licensed-pdf-list>li').nth(0).locator('button').click()
  await expect(page.locator('.pdf-viewport')).toHaveAttribute('data-rendered','true',{timeout:30000})
  await expect(page.getByRole('button',{name:'Close reader',exact:true})).toBeFocused()
  for(let i=0;i<9;i++){
    await page.keyboard.press('Tab')
    expect(await page.evaluate(()=>!!document.activeElement?.closest('dialog'))).toBe(true)
  }
  await page.locator('.pdf-readable-text summary').click()
  await expect(page.locator('.pdf-page-text')).toContainText('Russ Payne')
  const {default:AxeBuilder}=await import('@axe-core/playwright')
  const results=await new AxeBuilder({page}).include('.pdf-local-reader').analyze()
  expect(results.violations).toEqual([])
  await page.keyboard.press('Escape')
  await expect(page.locator('.licensed-pdf-list>li').nth(0).locator('button')).toBeFocused()
})

test('PDF scripts are inert; passwords fail closed; no Google or analytics requests', async({page})=>{
  await page.goto('/intelectual')
  const external:string[]=[]
  page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:4191'))external.push(r.url())})
  await page.locator('#local-pdf-input').setInputFiles('e2e/fixtures/pdf-script-not-executed.pdf')
  await expect(page.locator('.pdf-viewport')).toHaveAttribute('data-rendered','true',{timeout:30000})
  await expect(page.locator('.pdf-readable-text')).toContainText(/no extractable text|não tem texto extraível/)
  expect(external).toEqual([])
  expect(await page.evaluate(()=>(window as unknown as {PDF_SCRIPT_RAN?:boolean}).PDF_SCRIPT_RAN)).toBeUndefined()
  await page.keyboard.press('Escape')
  await page.locator('#local-pdf-input').setInputFiles('e2e/fixtures/locked-synthetic.pdf')
  await expect(page.locator('.pdf-local-reader [role="alert"]')).toBeVisible()
  await expect(page.locator('.pdf-local-reader input')).toHaveCount(0)
  await page.keyboard.press('Escape')
})
