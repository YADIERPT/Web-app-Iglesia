export function toISODate(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseISODate(value: string) {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayISO() {
  return toISODate(new Date())
}

export function formatDate(value: string, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }) {
  return new Intl.DateTimeFormat('es-MX', options).format(parseISODate(value))
}

export function formatShortDate(value: string) {
  return formatDate(value, { day: 'numeric', month: 'short' })
}

export function formatTime(value: string) {
  const [h, m] = value.split(':').map(Number)
  const date = new Date()
  date.setHours(h, m)
  return new Intl.DateTimeFormat('es-MX', { hour: 'numeric', minute: '2-digit' }).format(date)
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function monthKey(value: string) {
  return value.slice(0, 7)
}

export function monthLabel(key: string, style: 'long' | 'short' = 'long') {
  const [y, m] = key.split('-').map(Number)
  return new Intl.DateTimeFormat('es-MX', { month: style, year: style === 'long' ? 'numeric' : undefined }).format(
    new Date(y, m - 1, 1),
  )
}

export function startOfWeekISO(value: string) {
  const date = parseISODate(value)
  const day = (date.getDay() + 6) % 7
  date.setDate(date.getDate() - day)
  return toISODate(date)
}

export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}
