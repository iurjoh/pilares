import { useEffect, useState } from 'react'
import { pillars } from '../data'
import { localStore, READING_PLAN, type ReadingPlan } from '../lib/store'
import { PillarPage } from './PillarPage'
const choices: { value: ReadingPlan; name: string; description: string; disabled?: boolean }[] = [
  { value: 'anual', name: 'Bíblia em um ano', description: 'O caminho padrão para ler toda a Bíblia em um ano.' },
  { value: 'cronologico', name: 'Ordem cronológica', description: 'Acompanhe os acontecimentos na sequência histórica.', disabled: true },
  { value: 'antigo', name: 'Antigo Testamento', description: 'Concentre-se nos livros do Antigo Testamento.', disabled: true },
  { value: 'novo', name: 'Novo Testamento', description: 'Concentre-se nos livros do Novo Testamento.', disabled: true },
  { value: 'trilhas', name: 'Trilhas de estudo', description: 'Percursos temáticos a definir juntos.', disabled: true },
]
export default function Espiritual() {
  const [selected, setSelected] = useState<ReadingPlan>('anual')
  useEffect(() => { let active = true; localStore.get<ReadingPlan>(READING_PLAN).then(value => { if (active && choices.some(c => c.value === value && !c.disabled)) setSelected(value!) }).catch(() => {}); return () => { active = false } }, [])
  return <PillarPage pillar={pillars[0]}><section className="plans" aria-labelledby="plan-heading"><div className="eyebrow">PLANO DE LEITURA</div><h2 id="plan-heading">Seu caminho de leitura</h2><p>A estrutura já está aqui. O plano diário e as outras trilhas chegam em uma próxima etapa.</p><div className="plan-grid">{choices.map(choice => <div className={`plan-option ${choice.value === selected ? 'chosen' : ''}`} key={choice.value}><span className="plan-status">{choice.disabled ? 'EM BREVE' : 'PADRÃO'}</span><h3>{choice.name}</h3><p>{choice.description}</p>{!choice.disabled && <span className="selected-indicator">Selecionado</span>}</div>)}</div></section></PillarPage>
}
