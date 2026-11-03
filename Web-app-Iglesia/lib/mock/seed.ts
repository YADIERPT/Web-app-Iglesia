import type { Church, DocumentRecord, Event, HeritageObject, MassSchedule, Saint, ServicePrice } from '@/lib/data/models'

const CHURCH_COVERS: Record<string, string> = {
  'catedral-san-ildefonso': '/images/churches/catedral-san-ildefonso.png',
  'jesus-tercera-orden': '/images/churches/jesus-tercera-orden.jpg',
  'la-candelaria': '/images/churches/la-candelaria.jpg',
  'santa-lucia': '/images/churches/santa-lucia.jpg',
  'san-juan-de-dios': '/images/churches/san-juan-de-dios.jpg',
  'santa-ana': '/images/churches/santa-ana.jpg',
  'la-mejorada': '/images/churches/la-mejorada.jpg',
  'san-cristobal': '/images/churches/san-cristobal.jpg',
  'santiago': '/images/churches/santiago.jpg',
  'santa-isabel': '/images/churches/santa-isabel.jpg',
}

export const demoChurches: Church[] = [
  ['catedral-san-ildefonso', 'Catedral de San Ildefonso'],
  ['jesus-tercera-orden', 'Iglesia de Jesús (Tercera Orden)'],
  ['la-candelaria', 'Iglesia de la Candelaria'],
  ['santa-lucia', 'Iglesia de Santa Lucía'],
  ['san-juan-de-dios', 'Iglesia de San Juan de Dios'],
  ['santa-ana', 'Iglesia de Santa Ana'],
  ['la-mejorada', 'Iglesia de La Mejorada'],
  ['san-cristobal', 'Iglesia de San Cristóbal'],
  ['santiago', 'Iglesia de Santiago'],
  ['santa-isabel', 'Ermita de Santa Isabel'],
].map(([slug, name], index) => ({
  id: `demo-church-${index + 1}`,
  slug,
  name,
  patronSaint: null,
  address: null,
  coverPath: CHURCH_COVERS[slug] ?? null,
  logoPath: null,
  accentColor: null,
  historySummary: 'Texto de ejemplo. La historia de esta iglesia se cargará desde el panel.',
  historyFull: null,
  foundedYear: null,
  isActive: true,
  sortOrder: index,
}))

export const demoObjects: HeritageObject[] = [{
  id: 'demo-object-1',
  churchId: demoChurches[0].id,
  name: 'Objeto histórico de ejemplo',
  category: 'otro',
  quantity: 1,
  description: 'Registro de ejemplo para demostrar el catálogo.',
  history: 'Contenido demostrativo pendiente de sustituirse por información documentada.',
  visibility: 'publico',
  status: 'publicado',
}]

export const demoSaints: Saint[] = [{
  id: 'demo-saint-1',
  churchId: demoChurches[2].id,
  name: 'Santo e imagen de ejemplo',
  invocation: 'Advocación de ejemplo',
  kind: 'imagen',
  description: 'Registro de ejemplo para demostrar la ficha pública.',
  history: 'Contenido demostrativo pendiente de sustituirse por información documentada.',
  visibility: 'publico',
  status: 'publicado',
}]

export const demoDocuments: DocumentRecord[] = [{
  id: 'demo-document-1',
  churchId: demoChurches[0].id,
  title: 'Documento de ejemplo',
  docType: 'otro',
  periodStart: null,
  periodEnd: null,
  description: 'PDF de ejemplo para demostrar el visor del archivo.',
  filePath: '/documentos/documento-ejemplo.pdf',
  visibility: 'publico',
  status: 'publicado',
  ocrStatus: 'no_aplica',
}]

export const demoMassSchedules: MassSchedule[] = [
  { id: 'demo-schedule-1', churchId: demoChurches[0].id, weekday: 0, time: '08:00', label: 'Misa de ejemplo', language: 'es', presider: null },
  { id: 'demo-schedule-2', churchId: demoChurches[0].id, weekday: 0, time: '19:00', label: 'Misa vespertina de ejemplo', language: 'es', presider: null },
]

export const demoEvents: Event[] = [
  {
    id: 'demo-event-1',
    churchId: demoChurches[0].id,
    title: 'Actividad parroquial de ejemplo',
    date: '2026-11-15',
    time: '12:00',
    description: 'Evento demostrativo pendiente de sustituirse por información aprobada.',
    showPublicly: true,
  },
]

export const demoServicePrices: ServicePrice[] = [
  { id: 'demo-service-1', churchId: demoChurches[0].id, name: 'Servicio parroquial de ejemplo', suggestedPrice: 0, donationSuggested: true, description: 'Cuota sugerida de demostración; será sustituida por datos aprobados.', showPublicly: true, isActive: true },
]
