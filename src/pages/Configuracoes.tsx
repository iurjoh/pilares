import { Link } from 'react-router-dom'
import { ArrowLeft, Check, Languages, Unplug } from 'lucide-react'
import { useEffect, useState } from 'react'
import { LANGS, useI18n, type Lang } from '../i18n'
import { clearSelection, loadSelection, type LibrarySelection } from '../drive/library'
import { clearToken, currentToken, revokeToken } from '../drive/google'
import { driveConfigured } from '../config'

export default function Configuracoes() {
  const { lang, setLang, t } = useI18n()
  const [selection, setSelection] = useState<LibrarySelection | null>(null)
  useEffect(() => { setSelection(loadSelection()) }, [])
  const disconnect = async () => {
    const token = currentToken()
    if (token) await revokeToken(token).catch(() => {})
    clearToken()
    clearSelection()
    setSelection(null)
    window.dispatchEvent(new Event('pilares:library-updated'))
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
        {!selection ? <p>{t('Nenhuma nuvem conectada neste navegador. Você pode conectar a sua biblioteca na página Intelectual.')}</p> : <>
          <p>{selection.kind === 'folder'
            ? t('Google Drive conectado · pasta "{name}".', { name: selection.name })
            : t('Google Drive conectado · {count} arquivos escolhidos.', { count: selection.files.length })}</p>
          <button type="button" className="library-disconnect" onClick={disconnect}>{t('Desconectar biblioteca')}</button>
        </>}
      </section>}

      <p className="settings-legal"><Link to="/privacidade">{t('Ler a Política de Privacidade')}</Link></p>
    </div>
  </main>
}
