import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { BookOpen, FileUp } from 'lucide-react'
import { useI18n } from '../i18n'
import catalogue from './catalogue.json'
import { validateLocalPdf } from './localFile'
import type { PdfSource } from './PdfReader'
const PdfReader = lazy(() => import('./PdfReader'))

export function LocalLibrary() {
  const { t } = useI18n()
  const input = useRef<HTMLInputElement>(null)
  const [source, setSource] = useState<PdfSource | null>(null)
  const [error, setError] = useState('')
  const run = useRef(0)
  useEffect(() => {
    const clear = () => { ++run.current; setSource(null); setError(''); if (input.current) input.current.value = '' }
    window.addEventListener('pilares:library-updated', clear)
    return () => { window.removeEventListener('pilares:library-updated', clear) }
  }, [])
  const pick = async (file?: File) => {
    if (!file) return
    const mine = ++run.current
    setError('')
    try {
      const invalid = await validateLocalPdf(file)
      if (mine !== run.current) return
      if (invalid) { setError(invalid === 'size' ? 'Escolha um PDF entre 1 byte e 50 MB.' : 'Este arquivo não parece ser um PDF válido.'); return }
      setSource({ title: file.name, file })
    } catch { if (mine === run.current) setError('Não foi possível abrir o arquivo neste aparelho. Tente novamente.') }
    finally { if (input.current) input.current.value = '' }
  }
  return <div className="local-library">
    <p className="library-note library-test-notice">{t('Versão de teste: sem login obrigatório, sem contagem de cliques ou downloads. A biblioteca compartilhada contém apenas os 2 PDFs licenciados abaixo, não uma coleção privada.')}</p>
    <section aria-labelledby="local-pdfs-title" className="local-library-section">
      <h3 id="local-pdfs-title">{t('PDFs do seu aparelho')}</h3>
      <p>{t('Escolha um PDF para ler aqui, sem Google. O arquivo não é enviado, copiado para a coleção compartilhada nem salvo pelo Pilares. Ele precisa ser escolhido de novo ao sair ou recarregar.')}</p>
      <input ref={input} type="file" accept="application/pdf,.pdf" id="local-pdf-input" className="sr-only" aria-label={t('Escolher PDF do aparelho')} onChange={event => { void pick(event.target.files?.[0]) }}/>
      <button type="button" className="intellectual-primary" onClick={() => input.current?.click()}><FileUp size={17} aria-hidden="true"/> {t('Escolher PDF do aparelho')}</button>
      <p className="library-note">{t('Um arquivo por vez, até 50 MB. A leitura usa a memória deste aparelho. PDFs protegidos por senha não são abertos. JavaScript, formulários e anexos do PDF não são executados.')}</p>
      {error && <p role="alert" className="save-error">{t(error)}</p>}
    </section>
    <section aria-labelledby="shared-pdfs-title" className="local-library-section">
      <h3 id="shared-pdfs-title">{t('2 livros para testar, sem login')}</h3>
      <p>{t('PDFs integrais com licença de compartilhamento não comercial, preservados sem alterações. Não há promessa de impedir cópias: compartilhe conforme a licença de cada obra.')}</p>
      <ul className="licensed-pdf-list">{catalogue.map(book => <li key={book.code}>
        <h4>{book.title}</h4><p>{book.author} · {book.year} · {book.pages} {t('páginas')} · {book.language === 'en' ? t('Inglês') : t('Português (Brasil)')}</p>
        <p><a href={book.licenseUrl} target="_blank" rel="noopener noreferrer">{book.license}</a> · <a href={book.source} target="_blank" rel="noopener noreferrer">{t('Fonte oficial e créditos')}</a></p>
        <div className="library-actions"><button type="button" className="intellectual-primary" onClick={() => setSource({ title: book.title, url: book.asset })}><BookOpen size={16} aria-hidden="true"/> {t('Ler {title}', { title: book.title })}</button><a href={book.asset} download className="library-secondary">{t('Baixar PDF')}</a></div>
        <p className="library-note">{t('Cópia original sem alterações. Preserve a autoria, os créditos e a licença. Uso não comercial.')}{book.license.includes('ND') && <> {t('Não distribua adaptações desta obra.')}</>}</p>
      </li>)}</ul>
    </section>
    {source && <Suspense fallback={<p role="status">{t('Abrindo PDF...')}</p>}><PdfReader source={source} onClose={() => setSource(null)}/></Suspense>}
  </div>
}
