import { localStore } from './lib/store'
import { localDay, parseLocalDay } from './spiritual/plan'

const KEY = 'fisico-v1'
export const DEFAULT_WATER_GOAL_ML = 2000
export const DEFAULT_SLEEP_GOAL_HOURS = 8
export type PhysicalDay = {
  waterMl?: number
  sleepHours?: number
  bedtime?: string
  wakeTime?: string
  exercise?: boolean
  food?: boolean
}
export type PhysicalState = {
  version: 1
  days: Record<string, PhysicalDay>
  waterGoalMl: number
  sleepGoalHours: number
  sleepCustom: boolean
  alarmEnabled: boolean
  alarmTime: string
}
const initial = (): PhysicalState => ({ version: 1, days: {}, waterGoalMl: DEFAULT_WATER_GOAL_ML, sleepGoalHours: DEFAULT_SLEEP_GOAL_HOURS, sleepCustom: false, alarmEnabled: false, alarmTime: '07:00' })
const validDay = (value: string) => !!parseLocalDay(value)
const validTime = (value: unknown): value is string => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
export async function loadPhysical(): Promise<PhysicalState> {
  const data = await localStore.get<PhysicalState>(KEY)
  if (data?.version !== 1) return initial()
  const days: Record<string, PhysicalDay> = {}
  for (const [day, entry] of Object.entries(data.days || {})) {
    if (!validDay(day) || !entry || typeof entry !== 'object') continue
    days[day] = {
      waterMl: typeof entry.waterMl === 'number' && Number.isFinite(entry.waterMl) && entry.waterMl >= 0 && entry.waterMl <= 20000 ? entry.waterMl : undefined,
      sleepHours: typeof entry.sleepHours === 'number' && Number.isFinite(entry.sleepHours) && entry.sleepHours >= 0 && entry.sleepHours <= 24 ? entry.sleepHours : undefined,
      bedtime: validTime(entry.bedtime) ? entry.bedtime : undefined,
      wakeTime: validTime(entry.wakeTime) ? entry.wakeTime : undefined,
      exercise: typeof entry.exercise === 'boolean' ? entry.exercise : undefined,
      food: typeof entry.food === 'boolean' ? entry.food : undefined,
    }
  }
  return {
    version: 1,
    days,
    waterGoalMl: typeof data.waterGoalMl === 'number' && Number.isFinite(data.waterGoalMl) && data.waterGoalMl >= 250 && data.waterGoalMl <= 10000 ? data.waterGoalMl : DEFAULT_WATER_GOAL_ML,
    sleepGoalHours: typeof data.sleepGoalHours === 'number' && Number.isFinite(data.sleepGoalHours) && data.sleepGoalHours >= 2 && data.sleepGoalHours <= 16 ? data.sleepGoalHours : DEFAULT_SLEEP_GOAL_HOURS,
    sleepCustom: data.sleepCustom === true,
    alarmEnabled: data.alarmEnabled === true,
    alarmTime: validTime(data.alarmTime) ? data.alarmTime : '07:00',
  }
}
export async function savePhysical(data: PhysicalState) {
  await localStore.set(KEY, data)
  window.dispatchEvent(new Event('pilares:physical-updated'))
}
export function isDayComplete(data: PhysicalState, day: string) {
  const entry = data.days[day]
  if (!entry) return false
  return (entry.waterMl ?? 0) >= data.waterGoalMl && (entry.sleepHours ?? 0) >= data.sleepGoalHours && entry.exercise === true && entry.food === true
}
export function physicalSummary(data: PhysicalState, today = localDay()) {
  const entry = data.days[today] || {}
  const done = [(entry.waterMl ?? 0) >= data.waterGoalMl, (entry.sleepHours ?? 0) >= data.sleepGoalHours, entry.exercise === true, entry.food === true].filter(Boolean).length
  let streak = 0
  const date = parseLocalDay(today)!
  while (streak < 366) {
    if (!isDayComplete(data, localDay(date))) break
    streak++
    date.setDate(date.getDate() - 1)
  }
  return { waterMl: entry.waterMl, sleepHours: entry.sleepHours, exercise: entry.exercise, food: entry.food, done, streak }
}
