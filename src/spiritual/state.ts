import { localStore } from '../lib/store'
import { dayForStart, localDay, weekKey } from './plan'
export type SpiritualState = {
  version: 1
  startDate: string
  completedDays: number[]
  weeks: Record<string, string[]>
}
const KEY='spiritual-plan-v1'
export const ACTIVITIES = [
  {id:'leitura',title:'Leitura diária da Bíblia',description:'Faça da leitura um encontro no dia a dia.'},
  {id:'culto',title:'Culto familiar semanal',description:'Reserve um tempo para estar junto em família.'},
  {id:'comunidade',title:'Participação na comunidade',description:'Caminhe com outras pessoas.'},
  {id:'ensino',title:'Ensino bíblico',description:'Aprenda e compartilhe o que descobriu.'},
] as const
export async function loadSpiritual():Promise<SpiritualState> {
  const s=await localStore.get<SpiritualState>(KEY)
  if(s?.version===1 && /^\d{4}-\d{2}-\d{2}$/.test(s.startDate) && Array.isArray(s.completedDays)){
    return {...s,completedDays:[...new Set(s.completedDays.filter(n=>Number.isInteger(n)&&n>=1&&n<=365))],weeks:s.weeks&&typeof s.weeks==='object'?s.weeks:{}}
  }
  const initial:SpiritualState={version:1,startDate:localDay(),completedDays:[],weeks:{}}
  await localStore.set(KEY,initial)
  return initial
}
export async function saveSpiritual(state:SpiritualState){ await localStore.set(KEY,state); window.dispatchEvent(new Event('pilares:spiritual-updated')) }
export function completedCount(s:SpiritualState){return s.completedDays.length}
export function spiritualSummary(s:SpiritualState){
  const day=dayForStart(s.startDate), completed=completedCount(s), checked=(s.weeks[weekKey()]||[]).length
  return {day,completed,checked,percentage:Math.round(completed/365*1000)/10}
}
