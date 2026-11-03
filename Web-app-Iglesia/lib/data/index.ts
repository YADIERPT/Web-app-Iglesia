import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { demoChurches, demoDocuments, demoEvents, demoMassSchedules, demoObjects, demoSaints, demoServicePrices } from '@/lib/mock/seed'
import type { Church, DocumentRecord, Event, HeritageObject, MassSchedule, PublicSearchResult, Saint, ScheduleException, ServicePrice } from './models'

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

type DatabaseRow = Record<string, unknown>

function getServerClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

function documentUrl(client: SupabaseClient, filePath: string) {
  if (/^(https?:)?\/\//.test(filePath) || filePath.startsWith('/')) return filePath
  const bucketPrefix = 'church-public-documents/'
  const normalizedPath = filePath.startsWith(bucketPrefix) ? filePath.slice(bucketPrefix.length) : filePath
  return client.storage.from('church-public-documents').getPublicUrl(normalizedPath).data.publicUrl
}

function rows(data: unknown, error: { message: string } | null): DatabaseRow[] {
  if (error) throw new Error(error.message)
  if (!Array.isArray(data)) throw new Error('Supabase devolvió datos con un formato inesperado.')
  return data as DatabaseRow[]
}

const text = (value: unknown) => (value === null || value === undefined ? null : String(value))
const datePart = (value: unknown) => String(value ?? '').slice(0, 10)
const timePart = (value: unknown) => String(value ?? '').slice(0, 5)

export async function getChurches(): Promise<Church[]> {
  if (isDemoMode) return demoChurches.filter((church) => church.isActive).sort((a, b) => a.sortOrder - b.sortOrder)
  const client = getServerClient()
  if (!client) return []
  const result = await client.from('churches').select('id,slug,name,patron_saint,address,cover_path,logo_path,accent_color,history_summary,history_full,founded_year,is_active,sort_order').eq('is_active', true).order('sort_order').order('name')
  return rows(result.data, result.error).map((church) => ({
    id: String(church.id),
    slug: String(church.slug),
    name: String(church.name),
    patronSaint: text(church.patron_saint),
    address: text(church.address),
    coverPath: text(church.cover_path),
    logoPath: text(church.logo_path),
    accentColor: text(church.accent_color),
    historySummary: text(church.history_summary),
    historyFull: text(church.history_full),
    foundedYear: church.founded_year === null ? null : Number(church.founded_year),
    isActive: Boolean(church.is_active),
    sortOrder: Number(church.sort_order ?? 0),
  }))
}

export async function getChurchBySlug(slug: string): Promise<Church | null> {
  return (await getChurches()).find((church) => church.slug === slug) ?? null
}

export async function getHeritageObjects(churchId?: string): Promise<HeritageObject[]> {
  if (isDemoMode) return demoObjects.filter((object) => !churchId || object.churchId === churchId)
  const client = getServerClient()
  if (!client) return []
  let query = client.from('heritage_objects').select('id,church_id,name,category,quantity,description,history,cover_path,visibility,status')
  if (churchId) query = query.eq('church_id', churchId)
  const result = await query.eq('visibility', 'publico').eq('status', 'publicado').order('name')
  return rows(result.data, result.error).map((object) => ({
    id: String(object.id),
    churchId: String(object.church_id),
    name: String(object.name),
    category: text(object.category),
    quantity: Number(object.quantity ?? 1),
    description: text(object.description),
    history: text(object.history),
    coverPath: text(object.cover_path),
    visibility: object.visibility as HeritageObject['visibility'],
    status: object.status as HeritageObject['status'],
  }))
}

export async function getSaints(churchId?: string): Promise<Saint[]> {
  if (isDemoMode) return demoSaints.filter((saint) => !churchId || saint.churchId === churchId)
  const client = getServerClient()
  if (!client) return []
  let query = client.from('saints').select('id,church_id,name,invocation,kind,description,history,cover_path,visibility,status,feast_day_month,feast_day_day')
  if (churchId) query = query.eq('church_id', churchId)
  const result = await query.eq('visibility', 'publico').eq('status', 'publicado').order('name')
  return rows(result.data, result.error).map((saint) => ({
    id: String(saint.id),
    churchId: String(saint.church_id),
    name: String(saint.name),
    invocation: text(saint.invocation),
    kind: text(saint.kind),
    description: text(saint.description),
    history: text(saint.history),
    coverPath: text(saint.cover_path),
    feastDayMonth: saint.feast_day_month === null ? null : Number(saint.feast_day_month),
    feastDayDay: saint.feast_day_day === null ? null : Number(saint.feast_day_day),
    visibility: saint.visibility as Saint['visibility'],
    status: saint.status as Saint['status'],
  }))
}

export async function listDocuments(churchId?: string): Promise<DocumentRecord[]> {
  if (isDemoMode) return demoDocuments.filter((document) => !churchId || document.churchId === churchId)
  const client = getServerClient()
  if (!client) return []
  let query = client.from('documents').select('id,church_id,title,doc_type,period_start,period_end,description,file_path,visibility,status,ocr_status')
  if (churchId) query = query.eq('church_id', churchId)
  const result = await query.eq('visibility', 'publico').eq('status', 'publicado').order('title')
  return rows(result.data, result.error).map((document) => ({
    id: String(document.id),
    churchId: String(document.church_id),
    title: String(document.title),
    docType: text(document.doc_type),
    periodStart: document.period_start === null ? null : Number(document.period_start),
    periodEnd: document.period_end === null ? null : Number(document.period_end),
    description: text(document.description),
    filePath: documentUrl(client, String(document.file_path)),
    visibility: document.visibility as DocumentRecord['visibility'],
    status: document.status as DocumentRecord['status'],
    ocrStatus: document.ocr_status as DocumentRecord['ocrStatus'],
  }))
}

export async function getMassSchedules(churchId?: string): Promise<MassSchedule[]> {
  if (isDemoMode) return demoMassSchedules.filter((schedule) => !churchId || schedule.churchId === churchId)
  const client = getServerClient()
  if (!client) return []
  let query = client.from('mass_schedules').select('id,church_id,weekday,time,label,language,presider')
  if (churchId) query = query.eq('church_id', churchId)
  const result = await query.eq('is_active', true).order('weekday').order('time')
  return rows(result.data, result.error).map((schedule) => ({
    id: String(schedule.id),
    churchId: String(schedule.church_id),
    weekday: Number(schedule.weekday),
    time: timePart(schedule.time),
    label: String(schedule.label),
    language: schedule.language === 'maya' ? 'maya' : 'es',
    presider: text(schedule.presider),
  }))
}

export async function getScheduleExceptions(churchId?: string): Promise<ScheduleException[]> {
  if (isDemoMode) return []
  const client = getServerClient()
  if (!client) return []
  let query = client
    .from('schedule_exceptions')
    .select('id,mass_schedule_id,on_date,action,new_time,note,mass_schedules!inner(church_id)')
  if (churchId) query = query.eq('mass_schedules.church_id', churchId)
  const result = await query.gte('on_date', new Date().toISOString().slice(0, 10)).order('on_date')
  return rows(result.data, result.error).map((exception) => ({
    id: String(exception.id),
    massScheduleId: String(exception.mass_schedule_id),
    onDate: datePart(exception.on_date),
    action: exception.action === 'mover' ? 'mover' : 'cancelar',
    newTime: exception.new_time === null ? null : timePart(exception.new_time),
    note: text(exception.note),
  }))
}

export async function getPublicEvents(churchId?: string): Promise<Event[]> {
  if (isDemoMode) {
    return demoEvents
      .filter((event) => event.showPublicly && (!churchId || event.churchId === churchId))
      .sort((a, b) => a.date.localeCompare(b.date))
  }
  const client = getServerClient()
  if (!client) return []
  let query = client.from('events').select('id,church_id,title,date,time,description,status')
  if (churchId) query = query.eq('church_id', churchId)
  const result = await query.eq('status', 'programado').gte('date', new Date().toISOString().slice(0, 10)).order('date').order('time')
  const regularEvents: Event[] = rows(result.data, result.error).map((event) => ({
    id: String(event.id),
    churchId: String(event.church_id),
    title: String(event.title),
    date: datePart(event.date),
    time: text(event.time) ? timePart(event.time) : null,
    description: String(event.description ?? ''),
    showPublicly: true,
  }))

  const saints = await getSaints(churchId)
  const currentYear = new Date().getFullYear()
  const today = new Date().toISOString().slice(0, 10)
  const projectedFeasts: Event[] = saints
    .filter((saint) => saint.feastDayMonth && saint.feastDayDay)
    .map((saint) => {
      const monthStr = String(saint.feastDayMonth).padStart(2, '0')
      const dayStr = String(saint.feastDayDay).padStart(2, '0')
      const feastDate = `${currentYear}-${monthStr}-${dayStr}`
      return {
        id: `saint-feast-${saint.id}`,
        churchId: saint.churchId,
        title: `Fiesta patronal: ${saint.name}`,
        date: feastDate,
        time: null,
        description: `Festividad litúrgica de ${saint.name}${saint.invocation ? ` (${saint.invocation})` : ''}`,
        showPublicly: true,
      }
    })
    .filter((event) => event.date >= today)

  return [...regularEvents, ...projectedFeasts].sort((a, b) => a.date.localeCompare(b.date))
}

export async function getServicePrices(churchId?: string): Promise<ServicePrice[]> {
  if (isDemoMode) return demoServicePrices.filter((service) => service.showPublicly && (!churchId || service.churchId === churchId))
  const client = getServerClient()
  if (!client) return []
  let query = client.from('service_prices').select('id,church_id,name,suggested_price,donation_suggested,description,show_publicly')
  if (churchId) query = query.eq('church_id', churchId)
  const result = await query.eq('show_publicly', true).eq('is_active', true).order('name')
  return rows(result.data, result.error).map((service) => ({
    id: String(service.id),
    churchId: String(service.church_id),
    name: String(service.name),
    suggestedPrice: Number(service.suggested_price ?? 0),
    donationSuggested: Boolean(service.donation_suggested),
    description: String(service.description ?? ''),
    showPublicly: Boolean(service.show_publicly),
    isActive: Boolean(service.is_active),
  }))
}

export async function getPublishedContentCount(): Promise<number> {
  if (isDemoMode) return demoObjects.length + demoSaints.length + demoDocuments.length + demoServicePrices.filter((service) => service.showPublicly).length
  const client = getServerClient()
  if (!client) return 0
  const results = await Promise.all([
    client.from('heritage_objects').select('id', { count: 'exact', head: true }).eq('visibility', 'publico').eq('status', 'publicado'),
    client.from('saints').select('id', { count: 'exact', head: true }).eq('visibility', 'publico').eq('status', 'publicado'),
    client.from('documents').select('id', { count: 'exact', head: true }).eq('visibility', 'publico').eq('status', 'publicado'),
    client.from('service_prices').select('id', { count: 'exact', head: true }).eq('show_publicly', true).eq('is_active', true),
  ])
  for (const result of results) {
    if (result.error) throw new Error(result.error.message)
  }
  return results.reduce((total, result) => total + (result.count ?? 0), 0)
}

export async function searchPublicContent(query: string): Promise<PublicSearchResult[]> {
  if (!query.trim()) return []
  const term = query.trim().toLocaleLowerCase('es-MX')
  const churches = await getChurches()
  const churchById = new Map(churches.map((church) => [church.id, church]))
  const results: PublicSearchResult[] = []

  for (const object of await getHeritageObjects()) {
    const church = churchById.get(object.churchId)
    const searchable = [object.name, object.category, object.description, object.history, church?.name].filter(Boolean).join(' ').toLocaleLowerCase('es-MX')
    if (church && searchable.includes(term)) {
      results.push({ id: object.id, title: object.name, description: object.description ?? 'Registro público de patrimonio.', href: `/iglesias/${church.slug}/patrimonio/${object.id}`, category: 'Patrimonio', churchName: church.name })
    }
  }

  for (const saint of await getSaints()) {
    const church = churchById.get(saint.churchId)
    const searchable = [saint.name, saint.invocation, saint.kind, saint.description, saint.history, church?.name].filter(Boolean).join(' ').toLocaleLowerCase('es-MX')
    if (church && searchable.includes(term)) {
      results.push({ id: saint.id, title: saint.name, description: saint.description ?? 'Registro público de santos e imágenes.', href: `/iglesias/${church.slug}/santos/${saint.id}`, category: 'Santos e imágenes', churchName: church.name })
    }
  }

  for (const document of await listDocuments()) {
    const church = churchById.get(document.churchId)
    const searchable = [document.title, document.docType, document.description, church?.name].filter(Boolean).join(' ').toLocaleLowerCase('es-MX')
    if (church && searchable.includes(term)) {
      results.push({ id: document.id, title: document.title, description: document.description ?? 'Documento público del archivo.', href: document.filePath, category: 'Archivo', churchName: church.name })
    }
  }

  return results
}
