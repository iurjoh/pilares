import { useEffect, useState } from 'react'
import { usePillarSave } from '../lib/usePillarSave'
import { ExternalLink, LockKeyhole, Plus, Sparkles, Trash2 } from 'lucide-react'
import { pillars } from '../data'
import { PillarPage } from './PillarPage'
import { localDay, parseLocalDay, dateLabel, weekKey } from '../spiritual/plan'
import { loadIntellectual, saveIntellectual, intellectualSummary, type IntellectualState, type IntellectualDay } from '../intellectual-state'
import { useI18n } from '../i18n'
import { LibrarySection } from './LibrarySection'

const requestBody = ['Olá! Gostaria de sugerir um livro para a biblioteca:', '', 'Título: ', 'Autor: ', 'Por que vale a leitura: '].join('\n')
const REQUEST_LINK = `mailto:iuri.johansson+pilares@gmail.com?subject=${encodeURIComponent('Pedido de livro - Biblioteca')}&body=${encodeURIComponent(requestBody)}`

export default function Intelectual() {
  const { t } = useI18n()
  const [state, setState] = useState<IntellectualState | null>(null)
  const [today, setToday] = useState(localDay())
  const [error, setError] = useState('')
  const [newSkill, setNewSkill] = useState('')
  const [newInterest, setNewInterest] = useState('')
  useEffect(() => { let active = true; loadIntellectual().then(s => { if (active) setState(s) }).catch(() => { if (active) setError(t('Não foi possível ler os dados neste navegador.')) }); const timer = window.setInterval(() => setToday(localDay()), 60000); return () => { active = false; clearInterval(timer) } }, [t])
  const { save, retry, status } = usePillarSave(saveIntellectual, setState)
  const updateDay = (patch: Partial<IntellectualDay>) => { if (!state) return; save({ ...state, days: { ...state.days, [today]: { ...state.days[today], ...patch } } }) }
  const entry = state?.days[today] || {}
  const summary = state ? intellectualSummary(state, today) : null
  const week = weekKey(today)
  const checked = state?.skillWeeks[week] || []
  const minutes = entry.minutes ?? 0
  const goal = state?.readingGoalMin ?? 30
  const readingStatus = entry.minutes === undefined ? t('Ainda não registrado') : minutes >= goal ? t('Meta batida') : t('Faltam {minutes} min', { minutes: goal - minutes })
  const learnedHistory: { date: string; note: string }[] = []
  if (state) {
    const cursor = parseLocalDay(today)!
    for (let i = 0; i < 7; i += 1) {
      const key = localDay(cursor)
      const note = state.days[key]?.learnedNote?.trim()
      if (note) learnedHistory.push({ date: key, note })
      cursor.setDate(cursor.getDate() - 1)
    }
  }
  return <PillarPage pillar={pillars[3]} ready><div className="mental-workspace">
    <div className="mental-intro"><div className="eyebrow">{t('UM ESPAÇO PARA CONTINUAR APRENDENDO')}</div><h2>{t('A mente também caminha.')}</h2><p>{t('Leitura livre, habilidades novas e interesses que despertam curiosidade. Um passo de cada vez, sem pontuação e sem julgamento.')}</p></div>
    {error && <p className="save-error" role="alert">{error}</p>}
    {status === 'saving' && <p role="status">{t('Salvando...')}</p>}
    {status === 'failed' && <p className="save-error" role="alert">{t('Alteração ainda não salva neste navegador.')} <button type="button" onClick={retry}>{t('Tentar novamente')}</button></p>}
    {!state ? <p role="status">{t('Abrindo seu espaço...')}</p> : <>
      <div className="mental-stats intellectual-stats" aria-label={t('Resumo intelectual')}><span><strong>{entry.minutes !== undefined ? t('{minutes} de {goal} min', { minutes, goal }) : t('Ainda não registrado')}</strong><small>{t('Leitura de hoje')}</small></span><span><strong>{summary!.learningStreak} {summary!.learningStreak === 1 ? t('dia') : t('dias')}</strong><small>{t('Sequência de aprendizado')}</small></span><span><strong>{summary!.skillsTotal === 0 ? t('Nenhuma habilidade ainda') : `${summary!.skillsDone}/${summary!.skillsTotal}`}</strong><small>{t('Habilidades nesta semana')}</small></span></div>
      <section className="mental-panel sophia-banner" aria-labelledby="sophia-title"><div className="eyebrow">{t('UM CONVITE')}</div><h2 id="sophia-title">{t('Conheça o Sophia.')}</h2><p>{t('O Sophia é o companheiro de filosofia do Iuri, em um aplicativo separado: as Meditações de Marco Aurélio e conversas guiadas para pensar o dia. Se tiver interesse, é só abrir.')}</p><a className="intellectual-primary sophia-link" href="https://sophia-philosophy.pages.dev" target="_blank" rel="noreferrer">{t('Abrir o Sophia')} <ExternalLink size={15} aria-hidden="true"/></a></section>
      <section className="mental-panel intellectual-panel" aria-labelledby="reading-title"><div className="eyebrow">{t('01 · LEITURA')}</div><h2 id="reading-title">{t('Leitura de hoje.')}</h2><p>{t('Registro de {date} · hoje. Leitura livre: qualquer livro, artigo ou texto conta. Arraste a barra ou escreva os minutos.', { date: dateLabel(today) })}</p><label className="field-label" htmlFor="reading-slider">{t('De zero até sua meta')}</label><input id="reading-slider" className="water-slider reading-slider" type="range" min="0" max={goal} step="5" value={Math.min(minutes, goal)} onChange={e => updateDay({ minutes: Number(e.target.value) })} aria-valuetext={t('{minutes} de {goal} minutos', { minutes, goal })}/><div className="water-bar reading-bar" aria-hidden="true"><i style={{ width: `${Math.min(100, (minutes / goal) * 100)}%` }}/></div><label className="field-label" htmlFor="reading-minutes">{t('Ou escreva os minutos')}</label><input id="reading-minutes" type="number" min="0" max="480" step="5" value={entry.minutes === undefined ? '' : minutes} placeholder={`Ex.: ${goal}`} onChange={e => { if (e.target.value === '') updateDay({ minutes: undefined }); else { const n = Number(e.target.value); if (Number.isFinite(n) && n >= 0 && n <= 480) updateDay({ minutes: n }) } }}/><div className="screen-result" role="status">{readingStatus}{entry.minutes !== undefined ? ` · ${t('{minutes} min de {goal} min', { minutes, goal })}` : ''}</div><label className="field-label" htmlFor="reading-goal">{t('Minha meta diária (minutos)')}</label><input id="reading-goal" type="number" min="5" max="480" step="5" value={state.readingGoalMin} onChange={e => { const n = Number(e.target.value); if (e.target.value !== '' && Number.isFinite(n) && n >= 5 && n <= 480) save({ ...state, readingGoalMin: n }) }}/></section>
      <section className="mental-panel intellectual-panel" aria-labelledby="learning-title"><div className="eyebrow">{t('02 · APRENDIZADO')}</div><h2 id="learning-title">{t('O que você aprendeu hoje?')}</h2><p>{t('Uma frase basta. Cada dia com um aprendizado registrado soma na sua sequência.')}</p><label className="sr-only" htmlFor="learned-note">{t('O que você aprendeu hoje?')}</label><input id="learned-note" type="text" maxLength={500} placeholder={t('Ex.: descobri como funciona a maré...')} value={entry.learnedNote ?? ''} onChange={e => updateDay({ learnedNote: e.target.value })}/>{learnedHistory.length > 0 && <><h3 className="learning-history-title">{t('Caderno de aprendizados')}</h3><ul className="learning-history">{learnedHistory.map(item => <li key={item.date}><strong>{dateLabel(item.date)}</strong><span>{item.note}</span></li>)}</ul></>}</section>
      <section className="mental-panel intellectual-panel" aria-labelledby="skills-title"><div className="eyebrow">{t('03 · HABILIDADES')}</div><h2 id="skills-title">{t('Habilidades em desenvolvimento.')}</h2><p>{t('Idiomas, instrumentos, técnicas... marque cada habilidade praticada nesta semana. Semana de {week}. O checklist recomeça na segunda-feira; as semanas anteriores continuam guardadas neste navegador.', { week: dateLabel(week) })}</p><form className="inline-form" onSubmit={e => { e.preventDefault(); const name = newSkill.trim(); if (name && !state.skills.includes(name) && state.skills.length < 20) { save({ ...state, skills: [...state.skills, name] }); setNewSkill('') } }}><label className="sr-only" htmlFor="new-skill">{t('Nova habilidade')}</label><input id="new-skill" maxLength={80} placeholder={t('Ex.: Italiano, violão, desenho...')} value={newSkill} onChange={e => setNewSkill(e.target.value)}/><button type="submit" aria-label={t('Adicionar habilidade')}><Plus size={19}/></button></form>{state.skills.length === 0 && <p className="empty-note">{t('Nenhuma habilidade cadastrada ainda. Adicione a primeira acima.')}</p>}<div className="mental-practices intellectual-skills">{state.skills.map(name => <div key={name} className="skill-row"><label className={`weekly-item ${checked.includes(name) ? 'checked' : ''}`}><input type="checkbox" checked={checked.includes(name)} onChange={() => save({ ...state, skillWeeks: { ...state.skillWeeks, [week]: checked.includes(name) ? checked.filter(x => x !== name) : [...checked, name] } })}/><span><strong>{name}</strong></span></label><button type="button" className="skill-remove" aria-label={t('Remover habilidade {name}', { name })} onClick={() => { if (window.confirm(t('Remover a habilidade "{name}"?', { name }))) save({ ...state, skills: state.skills.filter(x => x !== name) }) }}><Trash2 size={15}/></button></div>)}</div></section>
      <section className="mental-panel intellectual-panel" aria-labelledby="interests-title"><div className="eyebrow">{t('04 · INTERESSES')}</div><h2 id="interests-title">{t('Caderno de interesses.')}</h2><p>{t('Livros, filmes, temas e ideias novas que despertaram sua curiosidade. Anote para não perder.')}</p><form className="inline-form" onSubmit={e => { e.preventDefault(); const item = newInterest.trim(); if (item && state.interests.length < 100) { save({ ...state, interests: [item, ...state.interests] }); setNewInterest('') } }}><label className="sr-only" htmlFor="new-interest">{t('Novo interesse')}</label><input id="new-interest" maxLength={80} placeholder={t("Ex.: assistir 'Interestelar', ler sobre estoicismo...")} value={newInterest} onChange={e => setNewInterest(e.target.value)}/><button type="submit" aria-label={t('Anotar interesse')}><Plus size={19}/></button></form>{state.interests.length > 0 && <ul className="custom-ideas">{state.interests.map((item, i) => <li key={`${item}-${i}`}>{item}<button type="button" aria-label={t('Remover interesse {item}', { item })} onClick={() => save({ ...state, interests: state.interests.filter((_, index) => index !== i) })}><Trash2 size={16}/></button></li>)}</ul>}</section>
      <section className="mental-panel intellectual-panel" aria-labelledby="library-title"><div className="eyebrow">{t('05 · BIBLIOTECA')}</div><h2 id="library-title">{t('Biblioteca pessoal.')}</h2><LibrarySection/></section>
      <section className="mental-panel intellectual-panel" aria-labelledby="request-title"><div className="eyebrow">{t('06 · PEDIR UM LIVRO')}</div><h2 id="request-title">{t('Falta um livro?')}</h2><p>{t('Envie uma sugestão de leitura por e-mail. A lista privada de livros não aparece neste site.')}</p><a className="intellectual-primary sophia-link" href={REQUEST_LINK}>{t('Pedir um livro por e-mail')} <Sparkles size={15} aria-hidden="true"/></a></section>
      <p className="mental-privacy intellectual-privacy"><LockKeyhole size={17} aria-hidden="true"/> {t('Seus registros ficam só neste navegador, sem conta, servidor ou analytics. Limpar os dados do site ou trocar de aparelho apaga o histórico. A biblioteca conectada abre direto da sua nuvem, só com os arquivos que você autorizar.')}</p>
    </>}
  </div></PillarPage>
}
