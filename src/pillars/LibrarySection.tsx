import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { BookOpen, CloudOff, FolderOpen, RefreshCw, Unplug, X } from 'lucide-react'
import { useI18n } from '../i18n'
import { driveConfigured } from '../config'
import { clearToken, currentToken, pickFolder, pickPdfs, requestToken, revokeToken } from '../drive/google'
import { clearSelection, listFolder, loadSelection, selectionWasReset, previewUrl, saveSelection, type LibraryFile, type LibraryFolder, type LibrarySelection } from '../drive/library'

type Status = 'idle' | 'connecting' | 'picking' | 'loading' | 'error'

function LibraryContent() {
  const { t } = useI18n()
  const [selection, setSelection] = useState<LibrarySelection | null>(null)
  const [files, setFiles] = useState<LibraryFile[]>([])
  const [folders, setFolders] = useState<LibraryFolder[]>([])
  const [trail, setTrail] = useState<LibraryFolder[]>([])
  const [reading, setReading] = useState<LibraryFile | null>(null)
  const [selectionReset, setSelectionReset] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [needsReconnect, setNeedsReconnect] = useState(false)

  // Returns a usable token, trying a silent refresh when the stored one expired.
  const ensureToken = useCallback(async (): Promise<string> => {
    const stored = currentToken()
    if (stored) return stored
    try { return await requestToken('') }
    catch { setNeedsReconnect(true); throw new Error('token-expired') }
  }, [])

  // Folder libraries are browsed one level at a time; `trail` is the path from the chosen folder.
  const loadFolderAt = useCallback(async (nextTrail: LibraryFolder[]) => {
    setStatus('loading')
    try {
      const token = await ensureToken()
      const listing = await listFolder(token, nextTrail[nextTrail.length - 1].id)
      setTrail(nextTrail)
      setFolders(listing.folders)
      setFiles(listing.files)
      setNeedsReconnect(false)
      setStatus('idle')
    } catch (err) {
      setStatus('idle')
      if ((err as Error).message === 'token-expired') {
        clearToken()
        setNeedsReconnect(true)
        setFolders([])
        setFiles([])
      } else setStatus('error')
    }
  }, [ensureToken])

  const loadFiles = useCallback(async (sel: LibrarySelection) => {
    if (sel.kind === 'files') { setFolders([]); setTrail([]); setFiles(sel.files); return }
    await loadFolderAt([{ id: sel.id, name: sel.name }])
  }, [loadFolderAt])

  useEffect(() => {
    const refresh = () => {
      const sel = loadSelection()
      setSelectionReset(selectionWasReset())
      setSelection(sel)
      setNeedsReconnect(false)
      if (sel) loadFiles(sel)
      else { setFiles([]); setFolders([]); setTrail([]) }
    }
    refresh()
    window.addEventListener('pilares:library-updated', refresh)
    return () => window.removeEventListener('pilares:library-updated', refresh)
  }, [loadFiles])

  const connect = async (mode: 'folder' | 'files') => {
    setStatus('connecting')
    try {
      const token = await requestToken('select_account')
      setStatus('picking')
      if (mode === 'folder') {
        const folder = await pickFolder(token)
        if (folder) {
          const sel: LibrarySelection = { kind: 'folder', id: folder.id, name: folder.name }
          saveSelection(sel)
          setSelection(sel)
          await loadFiles(sel)
        }
      } else {
        const picked = await pickPdfs(token)
        if (picked && picked.length > 0) {
          const sel: LibrarySelection = { kind: 'files', files: picked }
          saveSelection(sel)
          setSelection(sel)
          setFiles(picked)
          setNeedsReconnect(false)
        }
      }
      setStatus('idle')
    } catch {
      setStatus('error')
    }
  }

  const disconnect = async () => {
    const token = currentToken()
    if (token) await revokeToken(token).catch(() => {})
    clearToken()
    clearSelection()
    setSelection(null)
    setFiles([])
    setFolders([])
    setTrail([])
    setReading(null)
  }

  if (!driveConfigured()) return null

  if (!selection) return <div className="library-connect">
    {selectionReset && <p role="status">{t('A seleção da biblioteca era inválida e foi removida. Seus registros dos pilares não foram apagados. Escolha seus PDFs novamente.')}</p>}
    <p className="library-lead">{t('Esta biblioteca é sua. Conecte a sua nuvem e leia os seus próprios PDFs aqui - o Pilares só enxerga o que você escolher (acesso limitado aos arquivos que você autorizar; o app só lê e mostra, não altera nem apaga) e nada passa por servidor nosso.')}</p>
    <ol className="library-steps">
      <li>{t('Tenha uma conta no Google Drive (gratuita).')}</li>
      <li>{t('Suba os seus PDFs para uma pasta, por exemplo "Pilares/Biblioteca", pelo app ou site do Drive.')}</li>
      <li>{t('Conecte aqui e escolha a pasta ou os arquivos na tela oficial do Google.')}</li>
    </ol>
    <div className="library-actions">
      <button type="button" className="intellectual-primary" disabled={status === 'connecting' || status === 'picking'} onClick={() => connect('folder')}>
        <FolderOpen size={16} aria-hidden="true"/> {status === 'connecting' || status === 'picking' ? t('Abrindo o Google...') : t('Conectar Google Drive · escolher pasta')}
      </button>
      <button type="button" className="library-secondary" disabled={status === 'connecting' || status === 'picking'} onClick={() => connect('files')}>
        {t('Escolher PDFs um a um')}
      </button>
    </div>
    <p className="library-note">{t('OneDrive, Dropbox e outras nuvens chegam nas próximas etapas.')}</p>
    {status === 'error' && <p className="save-error" role="alert">{t('Não foi possível conectar agora. Verifique o seu login do Google e tente de novo.')}</p>}
  </div>

  return <div className="library-browser">
    <div className="library-toolbar">
      {selection.kind === 'folder' && trail.length > 0
        ? <nav aria-label={t('Caminho da biblioteca')} className="library-origin"><ol className="library-crumbs">
            {trail.map((crumb, i) => <li key={crumb.id}>
              {i < trail.length - 1
                ? <button type="button" className="library-crumb" onClick={() => loadFolderAt(trail.slice(0, i + 1))}>{crumb.name}</button>
                : <span aria-current="page">{crumb.name}</span>}
            </li>)}
          </ol></nav>
        : <span className="library-origin">{selection.kind === 'folder'
            ? t('Pasta "{name}"', { name: selection.name })
            : t('{count} PDFs escolhidos por você', { count: files.length })}</span>}
      <span className="library-toolbar-actions">
        {selection.kind === 'folder' && <button type="button" className="library-icon-btn" aria-label={t('Recarregar lista')} onClick={() => loadFolderAt(trail.length > 0 ? trail : [{ id: selection.id, name: selection.name }])}><RefreshCw size={15}/></button>}
        <button type="button" className="library-icon-btn danger" aria-label={t('Desconectar biblioteca')} onClick={disconnect}><Unplug size={15}/></button>
      </span>
    </div>
    {needsReconnect && <p className="library-note" role="status">{t('A sessão com o Google expirou.')} <button type="button" className="library-secondary" onClick={() => connect(selection.kind === 'folder' ? 'folder' : 'files')}>{t('Conectar de novo')}</button></p>}
    {status === 'loading' && <p role="status">{t('Abrindo a sua biblioteca...')}</p>}
    {status === 'error' && <p className="save-error" role="alert">{t('Não foi possível ler a pasta agora. Tente recarregar.')}</p>}
    {!needsReconnect && status !== 'loading' && files.length === 0 && folders.length === 0 && status !== 'error' && <p className="empty-note">{t('Nenhum PDF ou pasta por aqui ainda. Suba arquivos na pasta escolhida e recarregue.')}</p>}
    {folders.length > 0 && <ul className="library-grid library-folders" aria-label={t('Pastas')}>
      {folders.map(folder => <li key={folder.id}>
        <button type="button" className="library-book library-folder" onClick={() => loadFolderAt([...trail, folder])}>
          <FolderOpen size={20} aria-hidden="true"/>
          <span>{folder.name}</span>
        </button>
      </li>)}
    </ul>}
    {files.length > 0 && <ul className="library-grid" aria-label={t('PDFs')}>
      {files.map(file => <li key={file.id}>
        <button type="button" className="library-book" onClick={() => setReading(file)}>
          <BookOpen size={20} aria-hidden="true"/>
          <span>{file.name.replace(/\.pdf$/i, '')}</span>
        </button>
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
