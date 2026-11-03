import type { Metadata } from 'next'
import { PanelShell } from '@/components/panel/panel-shell'

export const metadata: Metadata = {
  title: 'Panel | Iglesia Luz de Gracia',
}

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return <PanelShell>{children}</PanelShell>
}
