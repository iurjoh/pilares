import { localStore } from './lib/store'
import { localDay, parseLocalDay, weekKey } from './spiritual/plan'

const KEY = 'mental-emocional-v1'
export type Mood = 1 | 2 | 3 | 4 | 5
export type DailyEntry = { mood?: Mood; note?: string; hours?: number }
export type Session = { id: string; date: string; professional: string; notes: string }
export type MentalState = {
  version: 1; days: Record<string, DailyEntry>; weeks: Record<string, string[]>;
  screenLimit: number; ideas: string[]; therapyEnabled: boolean; sessions: Session[];
  reminderEnabled: boolean; reminderTime: string
}
export const PRACTICES = [
  { id: 'dialogo', name: 'Diálogo e escuta ativa', detail: 'Escutar com atenção antes de responder.' },
  { id: 'individual', name: 'Tempo de qualidade individual', detail: 'Uma pausa sem cobrança, só sua.' },
  { id: 'familia', name: 'Tempo de qualidade familiar', detail: 'Estar presente com quem caminha com você.' },
] as const
export const MOODS = ['Muito difícil', 'Difícil', 'Neutro', 'Bom', 'Muito bom'] as const
const initial = (): MentalState => ({ version: 1, days: {}, weeks: {}, screenLimit: 3, ideas: [], therapyEnabled: false, sessions: [], reminderEnabled: false, reminderTime: '20:00' })
const validDay = (value: string) => !!parseLocalDay(value)
export async function loadMental(): Promise<MentalState> {
  const data = await localStore.get<MentalState>(KEY)
  if (data?.version !== 1) return initial()
  const days: Record<string, DailyEntry> = {}
  for (const [day, entry] of Object.entries(data.days || {})) {
    if (!validDay(day) || !entry || typeof entry !== 'object') continue
    days[day] = {
      mood: Number.isInteger(entry.mood) && entry.mood! >= 1 && entry.mood! <= 5 ? entry.mood : undefined,
      note: typeof entry.note === 'string' ? entry.note.slice(0, 4000) : undefined,
      hours: typeof entry.hours === 'number' && Number.isFinite(entry.hours) && entry.hours >= 0 && entry.hours <= 24 ? entry.hours : undefined,
    }
  }
  return {
    version: 1, days,
    weeks: data.weeks && typeof data.weeks === 'object' ? data.weeks : {},
    screenLimit: typeof data.screenLimit === 'number' && Number.isFinite(data.screenLimit) && data.screenLimit >= 0 && data.screenLimit <= 24 ? data.screenLimit : 3,
    ideas: Array.isArray(data.ideas) ? data.ideas.filter((x): x is string => typeof x === 'string').slice(0, 100) : [],
    therapyEnabled: data.therapyEnabled === true,
    sessions: Array.isArray(data.sessions) ? data.sessions.filter(s => s && typeof s.id === 'string' && validDay(s.date) && typeof s.professional === 'string' && typeof s.notes === 'string') : [],
    reminderEnabled: data.reminderEnabled === true,
    reminderTime: /^([01]\d|2[0-3]):[0-5]\d$/.test(data.reminderTime) ? data.reminderTime : '20:00',
  }
}
export async function saveMental(data: MentalState) {
  await localStore.set(KEY, data)
  window.dispatchEvent(new Event('pilares:mental-updated'))
}
export function mentalSummary(data: MentalState, today = localDay()) {
  const checked = (data.weeks[weekKey(today)] || []).length
  let streak = 0
  const date = parseLocalDay(today)!
  while (streak < 366) {
    const day = localDay(date)
    if (!data.days[day]?.mood) break
    streak++
    date.setDate(date.getDate() - 1)
  }
  return { mood: data.days[today]?.mood, checked, streak }
}
