import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, Sparkles } from 'lucide-react'
import type { Pillar } from '../data'

export function PillarPage({ pillar, children }: { pillar: Pillar; children?: React.ReactNode }) {
  const Icon = pillar.icon
  return <main className="module-page" id="conteudo">
    <div className="container">
      <Link className="back-link" to="/"><ArrowLeft size={17} aria-hidden="true"/> Visão geral</Link>
      <div className={`module-hero tone-${pillar.color}`}>
        <div className="module-symbol"><Icon size={30} strokeWidth={1.5} aria-hidden="true"/></div>
        <div className="eyebrow">PILAR {pillar.number} / 05</div>
        <h1>{pillar.title}</h1><p className="hero-tagline">{pillar.tagline}</p>
        <div className="hero-decoration" aria-hidden="true"><span/><span/><span/><span/><span/></div>
      </div>
      <div className="module-content">
        <div><div className="eyebrow">SEU ESPAÇO</div><h2>Um começo de cada vez.</h2><p>Estamos preparando ferramentas simples para apoiar a sua jornada neste pilar. Sem pressa, sem cobrança.</p></div>
        <div className="soon-card"><div className="soon-icon"><Sparkles size={22} aria-hidden="true"/></div><span className="status-chip">EM BREVE</span><h3>Este espaço está crescendo</h3><p>Por enquanto, você já pode conhecer os cinco pilares. Novas possibilidades chegam nas próximas etapas.</p><Link to="/">Explorar outros pilares <ArrowUpRight size={17} aria-hidden="true"/></Link></div>
      </div>
      {children}
    </div>
  </main>
}
