import type { Role } from './types'

export type ModuleKey =
  | 'dashboard'
  | 'miembros'
  | 'asistencia'
  | 'eventos'
  | 'ministerios'
  | 'donaciones'
  | 'comunicados'
  | 'reportes'
  | 'configuracion'
  | 'archivo'
  | 'patrimonio'
  | 'santos'
  | 'historia'
  | 'horarios'
  | 'calendario'
  | 'intenciones'
  | 'finanzas'
  | 'urnas'
  | 'tarifario'
  | 'usuarios'

const ACCESS: Record<Role, ModuleKey[]> = {
  administrador: [
    'dashboard',
    'miembros',
    'asistencia',
    'eventos',
    'ministerios',
    'donaciones',
    'comunicados',
    'reportes',
    'configuracion',
    'archivo',
    'patrimonio',
    'santos',
    'historia',
    'horarios',
    'calendario',
    'intenciones',
    'finanzas',
    'urnas',
    'tarifario',
    'usuarios',
  ],
  pastor: ['dashboard', 'miembros', 'asistencia', 'eventos', 'ministerios', 'donaciones', 'comunicados', 'reportes', 'archivo', 'patrimonio', 'santos', 'historia', 'horarios', 'calendario', 'intenciones', 'finanzas', 'urnas', 'tarifario', 'usuarios'],
  secretario: ['dashboard', 'miembros', 'asistencia', 'eventos', 'ministerios', 'comunicados', 'reportes', 'archivo', 'patrimonio', 'santos', 'historia', 'horarios', 'calendario', 'intenciones', 'tarifario'],
  tesorero: ['dashboard', 'donaciones', 'reportes', 'horarios', 'intenciones', 'finanzas', 'urnas', 'tarifario'],
  coordinador: ['dashboard', 'asistencia', 'eventos', 'ministerios', 'comunicados', 'horarios', 'calendario'],
  super_admin: ['dashboard', 'archivo', 'patrimonio', 'santos', 'historia', 'horarios', 'calendario', 'intenciones', 'finanzas', 'urnas', 'tarifario', 'usuarios', 'comunicados', 'configuracion'],
  parroco: ['dashboard', 'archivo', 'patrimonio', 'santos', 'historia', 'horarios', 'calendario', 'intenciones', 'finanzas', 'urnas', 'tarifario', 'usuarios', 'comunicados'],
  vicario: ['dashboard', 'archivo', 'patrimonio', 'santos', 'historia', 'horarios', 'calendario', 'intenciones', 'tarifario', 'comunicados'],
  secretaria: ['dashboard', 'archivo', 'patrimonio', 'santos', 'historia', 'horarios', 'calendario', 'intenciones', 'tarifario', 'comunicados'],
  archivista: ['dashboard', 'archivo', 'patrimonio', 'santos', 'historia', 'horarios'],
  consulta: ['dashboard', 'archivo', 'patrimonio', 'santos', 'historia', 'horarios', 'calendario', 'comunicados'],
}

export const ROLE_LABELS: Record<Role, string> = {
  administrador: 'Administrador',
  pastor: 'Pastor',
  secretario: 'Secretario',
  tesorero: 'Tesorero',
  coordinador: 'Coordinador',
  super_admin: 'Super administrador',
  parroco: 'Párroco',
  vicario: 'Vicario',
  secretaria: 'Secretaría',
  archivista: 'Archivista',
  consulta: 'Consulta',
}

export function canAccess(role: Role | undefined, module: ModuleKey) {
  if (!role) return false
  return ACCESS[role].includes(module)
}

export function canSeeFinance(role: Role | undefined) {
  return ['administrador', 'pastor', 'tesorero', 'super_admin', 'parroco'].includes(role ?? '')
}
