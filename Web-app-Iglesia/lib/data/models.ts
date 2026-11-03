export type Visibility = 'publico' | 'interno'
export type PublicationStatus = 'borrador' | 'publicado'

export type Church = {
  id: string
  slug: string
  name: string
  patronSaint: string | null
  address: string | null
  coverPath: string | null
  logoPath: string | null
  accentColor: string | null
  historySummary: string | null
  historyFull: string | null
  foundedYear: number | null
  isActive: boolean
  sortOrder: number
}

export type HeritageObject = {
  id: string
  churchId: string
  name: string
  category: string | null
  quantity: number
  description: string | null
  history: string | null
  coverPath?: string | null
  visibility: Visibility
  status: PublicationStatus
}

export type Saint = {
  id: string
  churchId: string
  name: string
  invocation: string | null
  kind: string | null
  description: string | null
  history: string | null
  coverPath?: string | null
  feastDayMonth?: number | null
  feastDayDay?: number | null
  visibility: Visibility
  status: PublicationStatus
}

export type DocumentRecord = {
  id: string
  churchId: string
  title: string
  docType: string | null
  periodStart: number | null
  periodEnd: number | null
  description: string | null
  filePath: string
  visibility: Visibility
  status: PublicationStatus
  ocrStatus: 'pendiente' | 'procesando' | 'listo' | 'error' | 'no_aplica'
}

export type MassSchedule = {
  id: string
  churchId: string
  weekday: number
  time: string
  label: string
  language: 'es' | 'maya'
  presider: string | null
}

export type ScheduleException = {
  id: string
  massScheduleId: string
  onDate: string
  action: 'cancelar' | 'mover'
  newTime: string | null
  note: string | null
}

export type Event = {
  id: string
  churchId: string
  title: string
  date: string
  time: string | null
  description: string
  showPublicly: boolean
}

export type ServicePrice = {
  id: string
  churchId: string
  name: string
  suggestedPrice: number
  donationSuggested: boolean
  description: string
  showPublicly: boolean
  isActive: boolean
}

export type PublicSearchResult = {
  id: string
  title: string
  description: string
  href: string
  category: string
  churchName: string
}
