export const ROLES = [
  'administrador',
  'pastor',
  'secretario',
  'tesorero',
  'coordinador',
  'super_admin',
  'parroco',
  'vicario',
  'secretaria',
  'archivista',
  'consulta',
] as const
export type Role = (typeof ROLES)[number]

export type User = {
  id: string
  name: string
  email: string
  role: Role
  churchSlugs?: string[]
  isNetworkAdmin?: boolean
}

export type Member = {
  id: string
  name: string
  phone: string
  email: string
  joinDate: string
  active: boolean
}

export type EventType = 'religioso' | 'administrativo'
export type EventStatus = 'programado' | 'cancelado'

export type ChurchEvent = {
  id: string
  title: string
  date: string
  time: string
  place: string
  description: string
  responsible: string
  type: EventType
  status: EventStatus
}

export type MinistryTone = 'lavender' | 'blush' | 'sage' | 'sky'

export type Ministry = {
  id: string
  name: string
  description: string
  coordinatorId: string | null
  memberIds: string[]
  tone: MinistryTone
  memberCount?: number
}

export type AttendanceRecord = {
  id: string
  eventId: string
  date: string
  presentIds: string[]
}

export const DONATION_CONCEPTS = ['Diezmo', 'Ofrenda', 'Misiones', 'Construcción', 'Otro'] as const
export const DONATION_METHODS = ['Efectivo', 'Transferencia', 'Tarjeta'] as const

export type Donation = {
  id: string
  date: string
  amount: number
  concept: (typeof DONATION_CONCEPTS)[number]
  method: (typeof DONATION_METHODS)[number]
  memberId: string | null
}

export type Announcement = {
  id: string
  title: string
  body: string
  date: string
  important: boolean
}

export type Schedule = {
  id: string
  day: string
  time: string
  name: string
}

export type ChurchSettings = {
  name: string
  tagline: string
  logoUrl: string | null
  address: string
  phone: string
  email: string
  mission: string
  vision: string
  schedules: Schedule[]
}

export type ChurchState = {
  users: User[]
  members: Member[]
  events: ChurchEvent[]
  ministries: Ministry[]
  attendance: AttendanceRecord[]
  donations: Donation[]
  announcements: Announcement[]
  settings: ChurchSettings
}

export type CollectionKey = Exclude<keyof ChurchState, 'settings'>
