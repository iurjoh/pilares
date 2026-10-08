import { dateLocale } from '../i18n/locale'
/** Plano canônico de 365 dias: todos os 1.189 capítulos uma vez, em ordem, sem texto bíblico.
 * Contagem dos 66 livros confrontada com https://versenotes.org/a-list-of-books-in-the-bible-by-number-of-chapters/
 * e https://www.livinggreeknt.org/resources/chapter-count.php (66 livros, 1.189 capítulos).
 */
export const BOOKS = [
  ['Gênesis',50],['Êxodo',40],['Levítico',27],['Números',36],['Deuteronômio',34],['Josué',24],['Juízes',21],['Rute',4],['1 Samuel',31],['2 Samuel',24],['1 Reis',22],['2 Reis',25],['1 Crônicas',29],['2 Crônicas',36],['Esdras',10],['Neemias',13],['Ester',10],['Jó',42],['Salmos',150],['Provérbios',31],['Eclesiastes',12],['Cântico dos Cânticos',8],['Isaías',66],['Jeremias',52],['Lamentações',5],['Ezequiel',48],['Daniel',12],['Oseias',14],['Joel',3],['Amós',9],['Obadias',1],['Jonas',4],['Miqueias',7],['Naum',3],['Habacuque',3],['Sofonias',3],['Ageu',2],['Zacarias',14],['Malaquias',4],
  ['Mateus',28],['Marcos',16],['Lucas',24],['João',21],['Atos',28],['Romanos',16],['1 Coríntios',16],['2 Coríntios',13],['Gálatas',6],['Efésios',6],['Filipenses',4],['Colossenses',4],['1 Tessalonicenses',5],['2 Tessalonicenses',3],['1 Timóteo',6],['2 Timóteo',4],['Tito',3],['Filemom',1],['Hebreus',13],['Tiago',5],['1 Pedro',5],['2 Pedro',3],['1 João',5],['2 João',1],['3 João',1],['Judas',1],['Apocalipse',22],
] as const satisfies readonly (readonly [string,number])[]

export type Reading = { day: number; references: string[]; chapterCount: number }
const chapters = BOOKS.flatMap(([book, count]) => Array.from({length: count}, (_, i) => ({book, chapter: i + 1})))
/** Every day has 3 or 4 chapters; uses contiguous ranges for compact citations. */
export const READING_PLAN_365: Reading[] = Array.from({length:365}, (_, index) => {
  const start = Math.floor(index * chapters.length / 365)
  const end = Math.floor((index + 1) * chapters.length / 365)
  const refs: string[] = []
  for (let i = start; i < end;) {
    const first = chapters[i]
    let j = i + 1
    while (j < end && chapters[j].book === first.book) j++
    const last = chapters[j - 1]
    refs.push(`${first.book} ${first.chapter}${j-i > 1 ? `–${last.chapter}` : ''}`)
    i = j
  }
  return {day: index + 1, references: refs, chapterCount: end - start}
})

/** Dates are local calendar dates, never UTC instants: avoid day shifts at midnight and DST. */
export function localDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
}
export function parseLocalDay(day: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null
  const [year, month, date] = day.split('-').map(Number)
  const parsed = new Date(year,month-1,date,12)
  return parsed.getFullYear()===year && parsed.getMonth()===month-1 && parsed.getDate()===date ? parsed : null
}
export function dayForStart(start: string, today = localDay()) {
  const a=parseLocalDay(start), b=parseLocalDay(today)
  if (!a || !b) return 1
  const utc = (d:Date) => Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())
  return Math.min(365,Math.max(1, Math.round((utc(b)-utc(a))/86400000)+1))
}
export function weekKey(day = localDay()) {
  const d=parseLocalDay(day)
  if (!d) return weekKey(localDay())
  const monday = new Date(d.getFullYear(),d.getMonth(),d.getDate() - ((d.getDay()+6)%7),12)
  return localDay(monday)
}
export function dateLabel(day:string){
  const d=parseLocalDay(day)
  return d ? new Intl.DateTimeFormat(dateLocale(),{day:'numeric',month:'long',year:'numeric'}).format(d) : ''
}
export function dateForStart(start:string, day:number){
  const d=parseLocalDay(start)
  if(!d) return ''
  d.setDate(d.getDate() + day - 1)
  return localDay(d)
}


/** Traduz o nome do livro numa referência como "Gênesis 1–3" ou "1 Samuel 4". Sem tradução, mantém o texto original. */
export function translateReference(reference: string, t: (msgid: string) => string) {
  const match = /^(.+?) (\d+(?:–\d+)?)$/.exec(reference)
  return match ? `${t(match[1])} ${match[2]}` : reference
}
