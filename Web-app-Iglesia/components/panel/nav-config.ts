import {
  CalendarDays,
  ClipboardCheck,
  FileBarChart,
  HandCoins,
  LayoutDashboard,
  Megaphone,
  Settings,
  Users,
  UsersRound,
  Archive,
  BookOpen,
  Church,
  Clock3,
  Coins,
  Image,
  Landmark,
  ReceiptText,
  ScrollText,
  UserCog,
  WalletCards,
  type LucideIcon,
} from 'lucide-react'
import type { ModuleKey } from '@/lib/permissions'

export type NavItem = {
  module: ModuleKey
  href: string
  label: string
  icon: LucideIcon
  networkOnly?: boolean
  churchScoped?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { module: 'dashboard', href: '/panel', label: 'Panel principal', icon: LayoutDashboard },
  { module: 'dashboard', href: '/panel/red', label: 'Vista de red', icon: Church, networkOnly: true },
  { module: 'dashboard', href: '/panel/red/iglesias', label: 'Iglesias de la red', icon: Church, networkOnly: true },
  { module: 'archivo', href: '/panel/[slug]/archivo', label: 'Archivo', icon: Archive, churchScoped: true },
  { module: 'patrimonio', href: '/panel/[slug]/patrimonio', label: 'Patrimonio', icon: Landmark, churchScoped: true },
  { module: 'santos', href: '/panel/[slug]/santos', label: 'Santos e imágenes', icon: Image, churchScoped: true },
  { module: 'historia', href: '/panel/[slug]/historia', label: 'Historia', icon: BookOpen, churchScoped: true },
  { module: 'horarios', href: '/panel/[slug]/horarios', label: 'Horarios', icon: Clock3, churchScoped: true },
  { module: 'calendario', href: '/panel/[slug]/calendario', label: 'Calendario', icon: CalendarDays, churchScoped: true },
  { module: 'intenciones', href: '/panel/[slug]/intenciones', label: 'Intenciones de misa', icon: ScrollText, churchScoped: true },
  { module: 'finanzas', href: '/panel/[slug]/finanzas', label: 'Finanzas', icon: WalletCards, churchScoped: true },
  { module: 'urnas', href: '/panel/[slug]/urnas', label: 'Urnas', icon: Coins, churchScoped: true },
  { module: 'tarifario', href: '/panel/[slug]/tarifario', label: 'Tarifario', icon: ReceiptText, churchScoped: true },
  { module: 'comunicados', href: '/panel/[slug]/comunicados', label: 'Comunicados', icon: Megaphone, churchScoped: true },
  { module: 'usuarios', href: '/panel/[slug]/usuarios', label: 'Usuarios y roles', icon: UserCog, churchScoped: true },
  { module: 'configuracion', href: '/panel/[slug]/configuracion', label: 'Configuración', icon: Settings, churchScoped: true },
]

export const LEGACY_NAV_ITEMS: { module: ModuleKey; href: string; label: string; icon: LucideIcon }[] = [
  { module: 'miembros', href: '/panel/miembros', label: 'Miembros', icon: Users },
  { module: 'asistencia', href: '/panel/asistencia', label: 'Asistencia', icon: ClipboardCheck },
  { module: 'eventos', href: '/panel/eventos', label: 'Eventos', icon: CalendarDays },
  { module: 'ministerios', href: '/panel/ministerios', label: 'Ministerios', icon: UsersRound },
  { module: 'donaciones', href: '/panel/donaciones', label: 'Aportaciones', icon: HandCoins },
  { module: 'reportes', href: '/panel/reportes', label: 'Reportes', icon: FileBarChart },
]
