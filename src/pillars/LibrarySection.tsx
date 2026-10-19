import { clearDisconnectNotice, disconnectInProgress, disconnectLibrary, lastDisconnectResult, type DisconnectResult } from '../drive/disconnect'
import { DisconnectNotice } from '../drive/DisconnectNotice'
import { Component, useEffect, useRef, useState, type ReactNode } from 'react'
import { BookOpen, CloudOff, Plus, Unplug, X } from 'lucide-react'
import { useI18n } from '../i18n'
import { driveConfigured } from '../config'
import { clearToken, currentToken, pickPdfs, requestToken } from '../drive/google'
import { clearSelection, loadSelection, mergeFiles, removeFile, selectionWasReset, previewUrl, saveSelection, type LibraryFile, type LibrarySelection } from '../drive/library'

type Status = 'idle' | 'connecting' | 'picking' | 'error'

function LibraryContent() {
  const { t } = useI18n()
  const [selection, setSelection] = useState<LibrarySelection | null>(null)
  const [reading, setReading] = useState<LibraryFile | null>(null)
  const [selectionReset, setSelectionReset] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [notice, setNotice] = useState('')
  const [disconnectResult, setDisconnectResult] = useState<DisconnectResult | null>(lastDisconnectResult)

  // Invalidate pending Picker replies whenever a disconnect clears the selection.
  const run = useRef(0)

  useEffect(() => {
    const refresh = (event?: Event) => {
      // loadSelection() must run first: it is what clears a corrupted selection and sets the reset flag.
      const loaded = loadSelection()
      setSelectionReset(selectionWasReset())
      setSelection(loaded)
      if (!loaded) { setReading(null); ++run.current; setStatus('idle') }
      setDisconnectResult(event instanceof CustomEvent && event.detail ? event.detail as DisconnectResult : lastDisconnectResult())
    }
    refresh()
    window.addEventListener('pilares:library-updated', refresh)
    return () => window.removeEventListener('pilares:library-updated', refresh)
  }, [])

  // Folder access is not granted by drive.file, so a folder saved by an older version is only
  // used as the starting point of the Picker; the library itself is the list of picked PDFs.
  const legacyFolder = selection?.kind === 'folder' ? selection : null
  const files: LibraryFile[] = selection?.kind === 'files' ? selection.files : []


  // `fresh` throws away the stored token and asks Google for a new one, for when the stored token
  // was rejected before its local expiry and the Picker never opened.
  const addPdfs = async (fresh = false) => {
    if (disconnectInProgress()) return
    clearDisconnectNotice(); setDisconnectResult(null)
    const mine = ++run.current
    setStatus('connecting')
    setNotice('')
    try {
      if (fresh) clearToken()
      const token = currentToken() ?? await requestToken('select_account')
      if (mine !== run.current) return
      setStatus('picking')
      const picked = await pickPdfs(token, legacyFolder?.id)
      if (mine !== run.current) return
      if (picked && picked.length > 0) {
        const merged = mergeFiles(files, picked)
        const next: LibrarySelection = { kind: 'files', files: merged.files }
        saveSelection(next)
        setSelection(next)
        setNotice(merged.truncated
          ? t('Limite de {max} PDFs atingido. Remova alguns para adicionar outros.', { max: 1000 })
          : t('{added} PDFs adicionados, {total} na biblioteca.', { added: merged.added, total: merged.files.length }))
      }
      setStatus('idle')
    } catch {
      if (mine === run.current) setStatus('error')
    }
  }

  const removeOne = (id: string) => {
    const next: LibrarySelection = { kind: 'files', files: removeFile(files, id) }
    saveSelection(next)
    setSelection(next)
    setNotice('')
  }

  const disconnect = async () => {
    ++run.current
    setReading(null)
    setNotice('')
    await disconnectLibrary()
  }

  if (!driveConfigured()) return null

  const busy = status === 'connecting' || status === 'picking' || disconnectResult?.revocation === 'checking'
  const pickLabel = disconnectResult?.revocation === 'checking' ? t('Desconectando...') : busy ? t('Abrindo o Google...') : t('Escolher PDFs no Google Drive')

  if (!selection) return <div className="library-connect">
    <DisconnectNotice result={disconnectResult}/>
    {selectionReset && <p role="status">{t('A seleção da biblioteca era inválida e foi removida. Seus registros dos pilares não foram apagados. Escolha seus PDFs novamente.')}</p>}
    <p className="library-lead">{t('Esta biblioteca é sua. Escolha os seus próprios PDFs no Google Drive e leia aqui - o Pilares só enxerga os arquivos que você selecionar (acesso limitado aos arquivos que você autorizar; o app só lê e mostra).')}</p>
    <ol className="library-steps">
      <li>{t('Tenha uma conta no Google Drive (gratuita).')}</li>
      <li>{t('Toque em escolher PDFs e navegue pelas suas pastas na tela oficial do Google.')}</li>
      <li>{t('Selecione vários PDFs de uma vez. Repita em outras pastas para adicionar mais.')}</li>
    </ol>
    <div className="library-actions">
      <button type="button" className="intellectual-primary" disabled={busy} onClick={() => addPdfs()}>
        <Plus size={16} aria-hidden="true"/> {pickLabel}
      </button>
    </div>
    <p className="library-note">{t('O Google só libera os arquivos que você escolhe, não o conteúdo de pastas inteiras.')}</p>
    {status === 'picking' && <p className="library-note" role="status">{t('O seletor do Google não abriu ou mostrou um erro?')} <button type="button" className="library-secondary" onClick={() => addPdfs(true)}>{t('Conectar de novo')}</button></p>}
    {status === 'error' && <p className="save-error" role="alert">{t('Não foi possível conectar agora. Verifique o seu login do Google e tente de novo.')}</p>}
  </div>

  return <div className="library-browser">
    <div className="library-toolbar">
      <span className="library-origin">{legacyFolder
        ? t('Pasta "{name}"', { name: legacyFolder.name })
        : t('{count} PDFs escolhidos por você', { count: files.length })}</span>
      <span className="library-toolbar-actions">
        <button type="button" className="library-secondary" disabled={busy} onClick={() => addPdfs()}><Plus size={15} aria-hidden="true"/> {busy ? t('Abrindo o Google...') : t('Adicionar PDFs')}</button>
        <button type="button" disabled={busy} className="library-icon-btn danger" aria-label={t('Desconectar biblioteca')} onClick={disconnect}><Unplug size={15}/></button>
      </span>
    </div>
    {legacyFolder && <p className="library-note" role="status">{t('Conectar uma pasta inteira não é mais possível: o Google só libera os arquivos que você escolhe. Use "Adicionar PDFs" e selecione os livros dentro da pasta.')}</p>}
    {status === 'picking' && <p className="library-note" role="status">{t('O seletor do Google não abriu ou mostrou um erro?')} <button type="button" className="library-secondary" onClick={() => addPdfs(true)}>{t('Conectar de novo')}</button></p>}
    {notice && <p className="library-note" role="status">{notice}</p>}
    {status === 'error' && <p className="save-error" role="alert">{t('Não foi possível abrir a seleção do Google agora. Verifique o seu login e tente de novo.')}</p>}
    {files.length === 0 && status !== 'error' && <p className="empty-note">{t('Nenhum PDF escolhido ainda. Toque em "Adicionar PDFs" e selecione os livros no Google Drive.')}</p>}
    {files.length > 0 && <ul className="library-grid" aria-label={t('PDFs')}>
      {files.map(file => <li key={file.id} className="library-item">
        <button type="button" className="library-book" onClick={() => setReading(file)}>
          <BookOpen size={20} aria-hidden="true"/>
          <span>{file.name.replace(/\.pdf$/i, '')}</span>
        </button>
        <button type="button" className="library-icon-btn library-remove" aria-label={t('Remover {name} da biblioteca', { name: file.name })} onClick={() => removeOne(file.id)}><X size={14}/></button>
      </li>)}
    </ul>}
    <p className="library-note"><CloudOff size={13} aria-hidden="true"/> {t('Leitura direta do seu Drive, só no seu navegador. O Pilares não copia nem guarda os seus PDFs.')}</p>
    {reading && <ReaderDialog file={reading} closeLabel={t('Fechar leitor')} onClose={() => setReading(null)} />}
  </div>
}

// Native <dialog> opened with showModal(): focus is trapped, Esc closes it and
// focus returns to the element that opened it (WCAG 2.1.2, 2.4.3).
function ReaderDialog({ file, closeLabel, onClose }: { file: LibraryFile; closeLabel: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    const opener = document.activeElement as HTMLElement | null
    if (dialog && !dialog.open) dialog.showModal()
    return () => {
      if (dialog?.open) dialog.close()
      opener?.focus?.()
    }
  }, [])
  return <dialog ref={ref} className="library-reader" aria-label={file.name} onClose={onClose} onCancel={onClose}>
    <div className="library-reader-bar">
      <strong>{file.name}</strong>
      <button type="button" className="library-icon-btn" aria-label={closeLabel} onClick={onClose} autoFocus><X size={17}/></button>
    </div>
    <iframe title={file.name} src={previewUrl(file.id)} className="library-reader-frame" sandbox="allow-scripts allow-same-origin allow-popups" referrerPolicy="no-referrer"/>
  </dialog>
}

// Keep a reader/render failure inside the library, never the entire app.
class LibraryBoundary extends Component<{ children: ReactNode; fallback: (reset: () => void) => ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  reset = () => { clearSelection(); this.setState({ failed: false }) }
  render() { return this.state.failed ? this.props.fallback(this.reset) : this.props.children }
}
export function LibrarySection() {
  const { t } = useI18n()
  return <LibraryBoundary fallback={reset => <div role="alert" className="save-error"><p>{t('A biblioteca não abriu. Seus registros dos pilares continuam disponíveis.')}</p><button type="button" onClick={reset}>{t('Limpar seleção e tentar novamente')}</button></div>}><LibraryContent/></LibraryBoundary>
}
