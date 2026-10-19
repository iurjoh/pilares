import { Link } from 'react-router-dom'
import { ArrowLeft, Check, Languages, Unplug } from 'lucide-react'
import { useEffect, useState } from 'react'
import { LANGS, useI18n, type Lang } from '../i18n'
import { loadSelection, type LibrarySelection } from '../drive/library'
import { disconnectLibrary, lastDisconnectResult, type DisconnectResult } from '../drive/disconnect'
import { DisconnectNotice } from '../drive/DisconnectNotice'
import { driveConfigured } from '../config'
import { downloadData, deleteData } from '../lib/dataControl'

export default function Configuracoes() {
  const { lang, setLang, t } = useI18n()
  const [selection, setSelection] = useState<LibrarySelection | null>(null)
  const [dataStatus, setDataStatus] = useState('')
  const [disconnectResult, setDisconnectResult] = useState<DisconnectResult | null>(lastDisconnectResult)
  useEffect(() => {
    const refresh = (event?: Event) => {
      setSelection(loadSelection())
      setDisconnectResult(event instanceof CustomEvent && event.detail ? event.detail as DisconnectResult : lastDisconnectResult())
    }
    refresh()
    window.addEventListener('pilares:library-updated', refresh)
    return () => window.removeEventListener('pilares:library-updated', refresh)
  }, [])
  const disconnect = async () => { await disconnectLibrary() }
  const exportData = async () => {
    try { await downloadData(); setDataStatus(t('Arquivo de dados preparado. Guarde-o em lugar privado.')) }
    catch { setDataStatus(t('Falha ao exportar. Nada foi apagado.')) }
  }
  const eraseData = async () => {
    if (!window.confirm(t('Apagar todos os dados locais do Pilares neste navegador? Essa ação não pode ser desfeita.'))) return
    try { await deleteData(); setSelection(null); setDataStatus(t('Dados locais apagados neste navegador.')); window.location.reload() }
    catch { setDataStatus(t('Falha ao apagar todos os dados. Verifique o armazenamento do navegador.')) }
  }
  return <main className="module-page settings-page" id="conteudo">
    <div className="container legal-container">
      <Link className="back-link" to="/"><ArrowLeft size={17} aria-hidden="true"/> {t('Visão geral')}</Link>
      <div className="legal-head">
        <div className="eyebrow">{t('O APP DO SEU JEITO')}</div>
        <h1>{t('Configurações')}</h1>
        <p>{t('Suas escolhas ficam guardadas apenas neste navegador.')}</p>
      </div>

      <section className="settings-block" aria-labelledby="set-lang">
        <h2 id="set-lang"><Languages size={19} aria-hidden="true"/> {t('Idioma do app')}</h2>
        <p>{t('Você escolhe o idioma. Mais línguas chegam nas próximas etapas.')}</p>
        <div className="lang-options" role="radiogroup" aria-label={t('Idioma do app')}>
          {LANGS.map(option => <label key={option.id} className={`lang-option ${lang === option.id ? 'active' : ''}`}>
            <input type="radio" name="lang" checked={lang === option.id} onChange={() => setLang(option.id as Lang)}/>
            <span>{option.label}</span>
            {lang === option.id && <Check size={16} aria-hidden="true"/>}
          </label>)}
        </div>
      </section>

      {driveConfigured() && <section className="settings-block" aria-labelledby="set-library">
        <h2 id="set-library"><Unplug size={19} aria-hidden="true"/> {t('Biblioteca conectada')}</h2>
        <DisconnectNotice result={disconnectResult}/>
        {!selection ? <p>{t('Nenhuma nuvem conectada neste navegador. Você pode conectar a sua biblioteca na página Intelectual.')}</p> : <>
          <p>{selection.kind === 'folder'
            ? t('Google Drive conectado · pasta "{name}".', { name: selection.name })
            : t('Google Drive conectado · {count} arquivos escolhidos.', { count: selection.files.length })}</p>
          <button type="button" className="library-disconnect" onClick={disconnect}>{t('Desconectar biblioteca')}</button>
        </>}
      </section>}

      <section className="settings-block" aria-labelledby="set-data">
        <h2 id="set-data">{t('Seus dados neste navegador')}</h2>
        <p>{t('Baixe uma cópia antes de apagar. O arquivo pode conter notas de saúde, religião e finanças; guarde-o em lugar privado. Em aparelho compartilhado, outras pessoas podem acessar os dados salvos neste navegador. Não há backup automático.')}</p>
        <button type="button" className="library-disconnect" onClick={exportData}>{t('Baixar meus dados')}</button>{' '}
        <button type="button" className="library-disconnect" onClick={eraseData}>{t('Apagar todos os meus dados')}</button>
        <p role="status" aria-live="polite">{dataStatus}</p>
      </section>

      <p className="settings-legal"><Link to="/privacidade">{t('Ler a Política de Privacidade')}</Link></p>
    </div>
  </main>
}
