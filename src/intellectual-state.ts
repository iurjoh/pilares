import { localStore } from './lib/store'
import { localDay, parseLocalDay, weekKey } from './spiritual/plan'

const KEY = 'intelectual-v1'
export const DEFAULT_READING_GOAL_MIN = 30
export type IntellectualDay = { minutes?: number; learnedNote?: string }
export type IntellectualState = {
  version: 1
  days: Record<string, IntellectualDay>
  readingGoalMin: number
  skills: string[]
  skillWeeks: Record<string, string[]>
  interests: string[]
}
const initial = (): IntellectualState => ({ version: 1, days: {}, readingGoalMin: DEFAULT_READING_GOAL_MIN, skills: [], skillWeeks: {}, interests: [] })
const validDay = (value: string) => !!parseLocalDay(value)
const validName = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= 80
export async function loadIntellectual(): Promise<IntellectualState> {
  const data = await localStore.get<IntellectualState>(KEY)
  if (data?.version !== 1) return initial()
  const days: Record<string, IntellectualDay> = {}
  for (const [day, entry] of Object.entries(data.days || {})) {
    if (!validDay(day) || !entry || typeof entry !== 'object') continue
    days[day] = {
      minutes: typeof entry.minutes === 'number' && Number.isFinite(entry.minutes) && entry.minutes >= 0 && entry.minutes <= 480 ? entry.minutes : undefined,
      learnedNote: typeof entry.learnedNote === 'string' && entry.learnedNote.trim() ? entry.learnedNote.slice(0, 500) : undefined,
    }
  }
  const skills: string[] = []
  if (Array.isArray(data.skills)) for (const s of data.skills) { if (validName(s) && !skills.includes(s) && skills.length < 20) skills.push(s) }
  const skillWeeks: Record<string, string[]> = {}
  for (const [week, list] of Object.entries(data.skillWeeks || {})) {
    if (!validDay(week) || !Array.isArray(list)) continue
    skillWeeks[week] = list.filter(validName).slice(0, 20)
  }
  return {
    version: 1,
    days,
    readingGoalMin: typeof data.readingGoalMin === 'number' && Number.isFinite(data.readingGoalMin) && data.readingGoalMin >= 5 && data.readingGoalMin <= 480 ? data.readingGoalMin : DEFAULT_READING_GOAL_MIN,
    skills,
    skillWeeks,
    interests: Array.isArray(data.interests) ? data.interests.filter(validName).slice(0, 100) : [],
  }
}
export async function saveIntellectual(data: IntellectualState) {
  await localStore.set(KEY, data)
  window.dispatchEvent(new Event('pilares:intelectual-updated'))
}
export function intellectualSummary(data: IntellectualState, today = localDay()) {
  const entry = data.days[today] || {}
  const minutesToday = entry.minutes
  let learningStreak = 0
  const date = parseLocalDay(today)!
  while (learningStreak < 366) {
    if (!(data.days[localDay(date)]?.learnedNote ?? '').trim()) break
    learningStreak++
    date.setDate(date.getDate() - 1)
  }
  const checked = data.skillWeeks[weekKey(today)] || []
  const skillsDone = data.skills.filter(s => checked.includes(s)).length
  return {
    minutesToday,
    goal: data.readingGoalMin,
    readingDone: (minutesToday ?? 0) >= data.readingGoalMin,
    learningStreak,
    skillsDone,
    skillsTotal: data.skills.length,
    interests: data.interests.length,
  }
}
