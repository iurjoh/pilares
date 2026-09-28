import { localStore } from './lib/store'
import { localDay, parseLocalDay } from './spiritual/plan'

const KEY = 'financeiro-v1'
export const MONEY_STEPS = [
  { id: 'dizimo', name: 'Dízimo' },
  { id: 'contas', name: 'Contas' },
  { id: 'custo', name: 'Custo de vida' },
  { id: 'investe', name: 'Investe o resto' },
] as const
export type MoneyStepId = typeof MONEY_STEPS[number]['id']
export type MonthEntry = {
  titheDone?: boolean
  titheNote?: string
  steps?: string[]
  goal?: string
  goalStatus?: 'atingido' | 'nao-atingido'
  goalWhy?: string
}
export type InvestGoalRecord = { text: string; done: boolean; closedAt: string }
export type FinancialState = {
  version: 1
  titheEnabled: boolean
  investorOsLinked: boolean
  months: Record<string, MonthEntry>
  investGoalText: string
  investGoalDone: boolean
  investGoalHistory: InvestGoalRecord[]
}
const initial = (): FinancialState => ({ version: 1, titheEnabled: false, investorOsLinked: false, months: {}, investGoalText: '', investGoalDone: false, investGoalHistory: [] })
const validMonth = (value: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(value) && !!parseLocalDay(`${value}-15`)
const validStep = (value: unknown): value is MoneyStepId => MONEY_STEPS.some(s => s.id === value)
const validText = (value: unknown, max: number): value is string => typeof value === 'string' && value.length <= max
export async function loadFinancial(): Promise<FinancialState> {
  const data = await localStore.get<FinancialState>(KEY)
  if (data?.version !== 1) return initial()
  const months: Record<string, MonthEntry> = {}
  for (const [month, entry] of Object.entries(data.months || {})) {
    if (!validMonth(month) || !entry || typeof entry !== 'object') continue
    months[month] = {
      titheDone: typeof entry.titheDone === 'boolean' ? entry.titheDone : undefined,
      titheNote: validText(entry.titheNote, 200) && entry.titheNote.trim() ? entry.titheNote : undefined,
      steps: Array.isArray(entry.steps) ? entry.steps.filter(validStep).slice(0, 4) : undefined,
      goal: validText(entry.goal, 200) && entry.goal.trim() ? entry.goal : undefined,
      goalStatus: entry.goalStatus === 'atingido' || entry.goalStatus === 'nao-atingido' ? entry.goalStatus : undefined,
      goalWhy: validText(entry.goalWhy, 500) && entry.goalWhy.trim() ? entry.goalWhy : undefined,
    }
  }
  return {
    version: 1,
    titheEnabled: data.titheEnabled === true,
    investorOsLinked: data.investorOsLinked === true,
    months,
    investGoalText: validText(data.investGoalText, 200) ? data.investGoalText : '',
    investGoalDone: data.investGoalDone === true,
    investGoalHistory: Array.isArray(data.investGoalHistory)
      ? data.investGoalHistory.filter((g): g is InvestGoalRecord => !!g && validText(g.text, 200) && typeof g.done === 'boolean' && typeof g.closedAt === 'string').slice(0, 20)
      : [],
  }
}
export async function saveFinancial(data: FinancialState) {
  await localStore.set(KEY, data)
  window.dispatchEvent(new Event('pilares:financeiro-updated'))
}
export function monthKey(today = localDay()) { return today.slice(0, 7) }
export function financialSummary(data: FinancialState, today = localDay()) {
  const month = data.months[monthKey(today)] || {}
  const steps = month.steps || []
  const total = data.titheEnabled ? 4 : 3
  const stepsDone = MONEY_STEPS.filter(s => (data.titheEnabled || s.id !== 'dizimo') && steps.includes(s.id)).length
  return {
    stepsDone,
    stepsTotal: total,
    titheDone: month.titheDone,
    hasPlan: !!(month.goal ?? '').trim(),
    investGoalSet: !!data.investGoalText.trim(),
    investGoalDone: data.investGoalDone,
  }
}
