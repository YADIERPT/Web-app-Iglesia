'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useChurch } from '@/lib/store'
import { DashboardView } from './dashboard-view'

export function PanelLandingView() {
  const router = useRouter()
  const { currentUser, isHydrated } = useChurch()

  useEffect(() => {
    if (!isHydrated || !currentUser) return

    // PLAN.md §4: /panel redirige a la iglesia del usuario (o a /panel/red si es super_admin)
    if (currentUser.isNetworkAdmin) {
      router.replace('/panel/red')
      return
    }

    const savedChurch = typeof window !== 'undefined' ? window.localStorage.getItem('iglesias_active_church') : null
    if (savedChurch && currentUser.churchSlugs?.includes(savedChurch)) {
      router.replace(`/panel/${savedChurch}`)
      return
    }
    const churchSlug = currentUser.churchSlugs?.[0]
    if (churchSlug) {
      router.replace(`/panel/${churchSlug}`)
      return
    }
  }, [currentUser, isHydrated, router])

  if (isHydrated && currentUser) return null
  return <DashboardView />
}
