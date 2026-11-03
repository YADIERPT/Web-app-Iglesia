import type { Metadata } from 'next'
import { AuthCard } from '@/components/auth/auth-card'

export const metadata: Metadata = {
  title: 'Ingresar | Iglesia Luz de Gracia',
}

export default function LoginPage() {
  return <AuthCard />
}
