import { useCallback, useEffect, useState } from 'react'
import { pillars } from '../data'
import { PillarPage } from './PillarPage'
import { ACTIVITIES, loadSpiritual, saveSpiritual, spiritualSummary, type SpiritualState } from '../spiritual/state'
import { BOOKS, dateForStart, dateLabel, dayForStart, localDay, READING_PLAN_365, weekKey } from '../spiritual/plan'
import { useI18n } from '../i18n'

const otherTracks = [
  ['Ordem cronológica','Acompanhe os acontecimentos na sequência histórica.'],
  ['Antigo Testamento','Concentre-se nos livros do Antigo Testamento.'],
  ['Novo Testamento','Concentre-se nos livros do Novo Testamento.'],
  ['Trilhas de estudo','Percursos temáticos a definir juntos.'],
]
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const bookPatterns = BOOKS.map(([book]) => new RegExp(`^${escapeRe(book)}(?= \\d)`))
export default function Espiritual(){
  const { t } = useI18n()
  const [state,setState]=useState<SpiritualState|null>(null)
  const [error,setError]=useState('')
  const [today,setToday]=useState(localDay())
  const [viewDay,setViewDay]=useState<number|null>(null)
  useEffect(()=>{let active=true;loadSpiritual().then(s=>{if(active)setState(s)}).catch(()=>{if(active)setError(t('Não foi possível abrir o armazenamento local. Confira as permissões do navegador.'))});const timer=window.setInterval(()=>setToday(localDay()),60000);return()=>{active=false;clearInterval(timer)}},[t])
  const change=useCallback(async(next:SpiritualState)=>{try{await saveSpiritual(next);setState(next);setError('')}catch{setError(t('Não foi possível salvar. Tente novamente ou confira o espaço disponível no navegador.'))}},[t])
  const current=state?dayForStart(state.startDate,today):1
  const shown=viewDay??current
  const reading=READING_PLAN_365[shown-1]
  const week=weekKey(today)
  const checks=state?.weeks[week]||[]
  const summary=state?spiritualSummary(state):null
  const refText=(refs:string[])=>refs.map(r=>{let out=r;for(let i=0;i<BOOKS.length;i+=1){out=out.replace(bookPatterns[i],t(BOOKS[i][0]))}return out}).join(' · ')
  return <PillarPage pillar={pillars[0]} ready><section className="spiritual-workspace" aria-labelledby="spiritual-heading">
    <div className="workspace-intro"><div className="eyebrow">{t('PLANO DE LEITURA')}</div><h2 id="spiritual-heading">{t('Bíblia em um ano')}</h2><p>{t('66 livros, 1.189 capítulos em 365 dias, na ordem dos livros. Cada dia reúne 3 ou 4 capítulos. Você lê na sua Bíblia e marca o dia aqui.')}</p></div>
    {error && <p role="alert" className="save-error">{error}</p>}
    {!state ? <p role="status">{t('Abrindo seu plano...')}</p> : <>
      <div className="spiritual-cards"><article className="reading-card"><div className="eyebrow">{t('LEITURA DO DIA')}</div><div className="reading-card-top"><h3>{t('Dia {day}', { day: shown })} <small>/ 365</small></h3><span>{dateLabel(dateForStart(state.startDate,shown))}</span></div><p className="reading-refs">{refText(reading.references)}</p><p className="reading-meta">{t('{count} capítulos', { count: reading.chapterCount })} · {shown===current?t('Hoje no seu plano'):shown<current?t('Dia anterior'):t('Próximo dia')}</p><button className={`reading-toggle ${state.completedDays.includes(shown)?'is-done':''}`} type="button" aria-pressed={state.completedDays.includes(shown)} onClick={()=>change({...state,completedDays:state.completedDays.includes(shown)?state.completedDays.filter(n=>n!==shown):[...state.completedDays,shown].sort((a,b)=>a-b)})}>{state.completedDays.includes(shown)?t('✓ Leitura concluída · desfazer'):t('Marcar leitura concluída')}</button><div className="day-nav"><button disabled={shown<=1} onClick={()=>setViewDay(shown-1)}>{t('← Anterior')}</button><button disabled={shown===current} onClick={()=>setViewDay(null)}>{t('Hoje')}</button><button disabled={shown>=365} onClick={()=>setViewDay(shown+1)}>{t('Próximo →')}</button></div></article>
      <article className="progress-card"><div className="eyebrow">{t('SEU CAMINHO')}</div><strong>{summary!.percentage}%</strong><p>{t('{done} de 365 dias concluídos', { done: summary!.completed })}</p><div className="progress-track" role="progressbar" aria-label={t('Dias de leitura concluídos')} aria-valuemin={0} aria-valuemax={365} aria-valuenow={summary!.completed}><span style={{width:`${summary!.percentage}%`}}/></div><label htmlFor="reading-start">{t('Data de início do plano')}</label><input id="reading-start" type="date" value={state.startDate} max={today} onChange={e=>{const date=e.target.value;if(date && date<=today){change({...state,startDate:date});setViewDay(null)}}}/><small>{t('O dia atual é calculado pela data de início. Mudar a data não apaga as leituras marcadas; após o dia 365, o plano permanece no último dia até você escolher uma nova data.')}</small></article></div>
      <section className="weekly-card" aria-labelledby="weekly-heading"><div className="weekly-heading"><div><div className="eyebrow">{t('RITMO DA SEMANA')}</div><h2 id="weekly-heading">{t('Pequenos passos, juntos.')}</h2><p>{t('Semana de {week} · {done} de {total} práticas marcadas. Recomeça toda segunda-feira; as semanas anteriores ficam guardadas neste navegador.', { week: dateLabel(week), done: checks.length, total: ACTIVITIES.length })}</p></div></div><div className="weekly-grid">{ACTIVITIES.map(a=><label className={`weekly-item ${checks.includes(a.id)?'checked':''}`} key={a.id}><input type="checkbox" checked={checks.includes(a.id)} onChange={()=>change({...state,weeks:{...state.weeks,[week]:checks.includes(a.id)?checks.filter(x=>x!==a.id):[...checks,a.id]}})}/><span><strong>{t(a.title)}</strong><small>{t(a.description)}</small></span></label>)}</div></section>
    </>}
    <section className="future-plans"><div className="eyebrow">{t('OUTROS CAMINHOS')}</div><h2>{t('Para depois')}</h2><div className="future-grid">{otherTracks.map(([name,description])=><article key={name}><span className="plan-status">{t('EM BREVE')}</span><h3>{t(name)}</h3><p>{t(description)}</p></article>)}</div></section>
    <p className="privacy-note">{t('Seu progresso fica apenas neste navegador. Se limpar os dados do site ou trocar de aparelho, ele não será transferido.')}</p>
  </section></PillarPage>
}
