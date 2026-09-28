import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, Sparkles } from 'lucide-react'
import type { Pillar } from '../data'
import { useI18n } from '../i18n'

export function PillarPage({ pillar, children, ready = false }: { pillar: Pillar; children?: React.ReactNode; ready?: boolean }) {
  const { t } = useI18n()
  const Icon = pillar.icon
  return <main className="module-page" id="conteudo">
    <div className="container">
      <Link className="back-link" to="/"><ArrowLeft size={17} aria-hidden="true"/> {t('Visão geral')}</Link>
      <div className={`module-hero tone-${pillar.color}`}>
        <div className="module-symbol"><Icon size={30} strokeWidth={1.5} aria-hidden="true"/></div>
        <div className="eyebrow">{t('PILAR {number} / 05', { number: pillar.number })}</div>
        <h1>{t(pillar.title)}</h1><p className="hero-tagline">{t(pillar.tagline)}</p>
        <div className="hero-decoration" aria-hidden="true"><span/><span/><span/><span/><span/></div>
      </div>
      {!ready && <div className="module-content">
        <div><div className="eyebrow">{t('SEU ESPAÇO')}</div><h2>{t('Um começo de cada vez.')}</h2><p>{t('Estamos preparando ferramentas simples para apoiar a sua jornada neste pilar. Sem pressa, sem cobrança.')}</p></div>
        <div className="soon-card"><div className="soon-icon"><Sparkles size={22} aria-hidden="true"/></div><span className="status-chip">{t('EM BREVE')}</span><h3>{t('Este espaço está crescendo')}</h3><p>{t('Por enquanto, você já pode conhecer os cinco pilares. Novas possibilidades chegam nas próximas etapas.')}</p><Link to="/">{t('Explorar outros pilares')} <ArrowUpRight size={17} aria-hidden="true"/></Link></div>
      </div>}
      {children}
    </div>
  </main>
}
