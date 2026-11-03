import type { Schedule } from './types'

export type ScheduleException = {
  scheduleId: string
  date: string
  action: 'cancelar' | 'mover'
  newTime?: string
}

export type PrototypeIntention = {
  date: string
  time: string
  honoree: string
  stipend: number
  paid: boolean
}

export type PrototypeFinanceEntry = {
  date: string
  direction: 'ingreso' | 'egreso'
  amount: number
}

export type PrototypeUrnContract = {
  agreedPrice: number
  payments: number[]
}

export function todaysMasses(schedules: Schedule[], exceptions: ScheduleException[], date: Date) {
  const weekday = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][date.getDay()]
  const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  return schedules
    .filter((schedule) => schedule.day === weekday)
    .map((schedule) => {
      const exception = exceptions.find((item) => item.scheduleId === schedule.id && item.date === dateKey)
      if (exception?.action === 'cancelar') return null
      return exception?.action === 'mover' && exception.newTime
        ? { ...schedule, time: exception.newTime }
        : schedule
    })
    .filter((schedule): schedule is Schedule => Boolean(schedule))
    .sort((a, b) => a.time.localeCompare(b.time))
}

export function financeTotals(entries: PrototypeFinanceEntry[], month: string) {
  const filtered = entries.filter((entry) => entry.date.startsWith(month))
  const income = filtered.filter((entry) => entry.direction === 'ingreso').reduce((sum, entry) => sum + entry.amount, 0)
  const expenses = filtered.filter((entry) => entry.direction === 'egreso').reduce((sum, entry) => sum + entry.amount, 0)
  return { income, expenses, balance: income - expenses }
}

export function urnBalance(contract: PrototypeUrnContract) {
  const paid = contract.payments.reduce((sum, payment) => sum + payment, 0)
  return { paid, pending: Math.max(0, contract.agreedPrice - paid) }
}

export function paidIntentionsTotal(intentions: PrototypeIntention[]) {
  return intentions.filter((intention) => intention.paid).reduce((sum, intention) => sum + intention.stipend, 0)
}
