// Shared locale signal for non-component modules (date formatting).
let current = 'pt-BR'
export function setDateLocale(locale: string) { current = locale }
export function dateLocale() { return current }
