import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { useI18n } from '../i18n'

GlobalWorkerOptions.workerSrc = workerUrl
export type PdfSource = { title: string; file: File } | { title: string; url: string }

// Render content only. No annotation links, forms, embedded scripts, attachments or XFA.
export default function PdfReader({ source, onClose }: { source: PdfSource; onClose: () => void }) {
  const { t } = useI18n()
  const dialog = useRef<HTMLDialogElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const viewport = useRef<HTMLDivElement>(null)
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null)
  const [page, setPage] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [width, setWidth] = useState(320)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState(false)
  const [text, setText] = useState('')
  const [noText, setNoText] = useState(false)
  const [renderedKey, setRenderedKey] = useState('')
  const renderKey = `${page}:${zoom}:${width}`

  useEffect(() => {
    const d = dialog.current
    const opener = document.activeElement as HTMLElement | null
    if (d && !d.open) d.showModal()
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const observer = new ResizeObserver(entries => { const w = entries[0]?.contentRect.width; if (w) setWidth(Math.max(200, w - 24)) })
    if (viewport.current) observer.observe(viewport.current)
    return () => { observer.disconnect(); document.body.style.overflow = originalOverflow; if (d?.open) d.close(); opener?.focus() }
  }, [])

  useEffect(() => {
    let active = true
    let task: ReturnType<typeof getDocument> | undefined
    const controller = new AbortController()
    void (async () => {
      let buffer: ArrayBuffer
      if ('file' in source) buffer = await source.file.arrayBuffer()
      else {
        const response = await fetch(source.url, { credentials: 'omit', referrerPolicy: 'no-referrer', signal: controller.signal })
        if (!response.ok) throw new Error('unavailable')
        buffer = await response.arrayBuffer()
      }
      const data = new Uint8Array(buffer)
      if (!active) return
      task = getDocument({ data, enableXfa: false, cMapUrl: '/pdfjs/cmaps/', standardFontDataUrl: '/pdfjs/standard_fonts/', wasmUrl: '/pdfjs/wasm/', iccUrl: '/pdfjs/iccs/', verbosity: 0 })
      // Passwords are not collected or retained. Locked files fail closed in this reader.
      task.onPassword = () => { if (active) { setError(true); setBusy(false) }; void task?.destroy() }
      const loaded = await task.promise
      if (active) setDoc(loaded)
      else await task.destroy()
    })().catch(() => { if (active) { setError(true); setBusy(false) } })
    return () => { active = false; controller.abort(); void task?.destroy() }
  }, [source])

  useEffect(() => {
    if (!doc || !canvas.current) return
    let render: ReturnType<Awaited<ReturnType<PDFDocumentProxy['getPage']>>['render']> | undefined
    let active = true
    setBusy(true); setError(false); setText(''); setNoText(false)
    void (async () => {
      const pdfPage = await doc.getPage(page)
      if (!active || !canvas.current) return
      const natural = pdfPage.getViewport({ scale: 1 })
      if (!Number.isFinite(natural.width) || !Number.isFinite(natural.height) || natural.width <= 0 || natural.height <= 0) throw new Error('invalid page size')
      const scale = Math.min(width / natural.width, 1.8) * zoom
      const pixelBudgetScale = Math.sqrt(8_000_000 / (natural.width * natural.height * 4))
      const view = pdfPage.getViewport({ scale: Math.min(scale, pixelBudgetScale) })
      const ratio = Math.min(devicePixelRatio || 1, 2)
      const c = canvas.current
      c.width = Math.ceil(view.width * ratio); c.height = Math.ceil(view.height * ratio)
      c.style.width = `${view.width}px`; c.style.height = `${view.height}px`
      render = pdfPage.render({ canvas: c, viewport: view, transform: [ratio, 0, 0, ratio, 0, 0] })
      await render.promise
      const content = await pdfPage.getTextContent()
      if (!active) return
      const extracted = content.items.map(item => 'str' in item ? item.str + (item.hasEOL ? '\n' : ' ') : '').join('')
      setText(extracted); setNoText(!extracted.trim()); setRenderedKey(`${page}:${zoom}:${width}`); setBusy(false)
    })().catch(e => { if (active && e?.name !== 'RenderingCancelledException') { setError(true); setBusy(false) } })
    return () => { active = false; render?.cancel() }
  }, [doc, page, zoom, width])

  const trapFocus = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== 'Tab') return
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), select:not(:disabled), summary, a[href], [tabindex="0"]')).filter(el => el.getClientRects().length > 0)
    const first = items[0], last = items[items.length - 1]
    if (!first) return
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }

  return <dialog onKeyDown={trapFocus} ref={dialog} className="library-reader pdf-local-reader" aria-label={source.title} onCancel={onClose} onClose={onClose}>
    <div className="library-reader-bar"><strong>{source.title}</strong><button type="button" className="library-secondary" onClick={onClose} autoFocus>{t('Fechar leitor')}</button></div>
    <div className="pdf-controls" aria-label={t('Controles do PDF')}>
      <button type="button" disabled={!doc || busy || page <= 1} onClick={() => setPage(n => n - 1)}>{t('Página anterior')}</button>
      <span aria-live="polite">{doc ? t('Página {page} de {total}', { page, total: doc.numPages }) : t('Abrindo PDF...')}</span>
      <button type="button" disabled={!doc || busy || page >= doc.numPages} onClick={() => setPage(n => n + 1)}>{t('Próxima página')}</button>
      <label>{t('Zoom')} <select disabled={busy} value={zoom} onChange={event => setZoom(Number(event.target.value))}><option value={1}>100%</option><option value={1.5}>150%</option><option value={2}>200%</option></select></label>
    </div>
    <div ref={viewport} className="pdf-viewport" data-rendered={renderedKey === renderKey && !busy ? "true" : "false"} aria-busy={busy}>
      {busy && !error && <p role="status">{t('Abrindo PDF...')}</p>}
      {error && <p role="alert">{t('Não foi possível ler este PDF. Ele pode estar protegido por senha, danificado ou usar um formato não suportado. Escolha outro arquivo.')}</p>}
      <canvas ref={canvas} role="img" aria-label={t('Página {page} do PDF', { page })} hidden={error}/>
      {!busy && !error && <details className="pdf-readable-text"><summary>{t('Texto da página (acessível e selecionável)')}</summary>{noText ? <p>{t('Esta página não tem texto extraível. Pode ser uma imagem digitalizada. O app não faz OCR.')}</p> : <div className="pdf-page-text">{text}</div>}</details>}
    </div>
  </dialog>
}
