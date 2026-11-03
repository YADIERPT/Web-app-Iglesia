'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createEmptyState } from './seed'
import { demoChurches } from './mock/seed'
import { getSupabaseClient } from './supabase'
import { loadChurchData, persistChurchItem, persistChurchSettings, removeChurchItem } from './supabase-data'
import type { ChurchSettings, ChurchState, CollectionKey, Role, User } from './types'

type Item<K extends CollectionKey> = ChurchState[K][number]
const DEMO_STORAGE_KEY = 'iglesias-merida-demo-state'

export type ChurchStore = ChurchState & {
  currentUser: User | null
  isHydrated: boolean
  dataError: string | null
  publicMemberCount: number
  save: <K extends CollectionKey>(key: K, item: Item<K>) => Promise<void>
  remove: <K extends CollectionKey>(key: K, id: string) => Promise<void>
  updateSettings: (settings: Partial<ChurchSettings>) => Promise<void>
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => Promise<void>
  addUser: (data: { name: string; email: string; password: string; role: Role; churchId?: string }) => Promise<{ ok: boolean; error?: string }>
}

const ChurchContext = createContext<ChurchStore | null>(null)

export function newId() {
  return crypto.randomUUID()
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.'
}

export function ChurchProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ChurchState>(createEmptyState)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const [dataError, setDataError] = useState<string | null>(null)
  const [publicMemberCount, setPublicMemberCount] = useState(0)
  const refreshSequence = useRef(0)
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

  useEffect(() => {
    if (!demoMode) return
    setDataError(null)
    try {
      const saved = window.localStorage.getItem(DEMO_STORAGE_KEY)
      setState(saved ? { ...createEmptyState(), ...JSON.parse(saved) } : createEmptyState())
    } catch (error) {
      setDataError(errorMessage(error))
      setState(createEmptyState())
    }
    setIsHydrated(true)
  }, [demoMode])

  useEffect(() => {
    if (!demoMode || !isHydrated) return
    window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state))
  }, [demoMode, isHydrated, state])

  const refresh = useCallback(async (userId: string | null, active: () => boolean) => {
    const sequence = ++refreshSequence.current
    setCurrentUserId(userId)
    setIsHydrated(false)
    try {
      const client = getSupabaseClient()
      if (!client) throw new Error('Configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY para conectar Supabase.')
      const loaded = await loadChurchData(client, userId)
      if (!active() || sequence !== refreshSequence.current) return
      setState(loaded.state)
      setPublicMemberCount(loaded.publicMemberCount)
      setDataError(null)
    } catch (error) {
      if (!active() || sequence !== refreshSequence.current) return
      if (userId) {
        const client = getSupabaseClient()
        if (client) void client.auth.signOut()
        setCurrentUserId(null)
      }
      setDataError(errorMessage(error))
    } finally {
      if (active() && sequence === refreshSequence.current) setIsHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (demoMode) return
    let active = true
    const client = getSupabaseClient()
    if (!client) {
      setDataError('Configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY para conectar Supabase.')
      setIsHydrated(true)
      return () => {
        active = false
      }
    }

    void client.auth.getSession().then(({ data, error }) => {
      if (error) throw error
      return refresh(data.session?.user.id ?? null, () => active)
    }).catch((error: unknown) => {
      if (!active) return
      setDataError(errorMessage(error))
      setIsHydrated(true)
    })

    const { data: authListener } = client.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => {
        void refresh(session?.user.id ?? null, () => active)
      }, 0)
    })

    return () => {
      active = false
      authListener.subscription.unsubscribe()
    }
  }, [demoMode, refresh])

  const save = useCallback(async <K extends CollectionKey>(key: K, item: Item<K>) => {
    if (demoMode) {
      setState((previous) => {
        const list = previous[key] as Item<K>[]
        const exists = list.some((entry) => entry.id === item.id)
        const next = exists ? list.map((entry) => (entry.id === item.id ? item : entry)) : [item, ...list]
        return { ...previous, [key]: next }
      })
      return
    }
    const client = getSupabaseClient()
    if (!client) throw new Error('Supabase no está configurado.')
    await persistChurchItem(client, key, item)
    setState((previous) => {
      const list = previous[key] as Item<K>[]
      const exists = list.some((entry) => entry.id === item.id)
      const next = exists ? list.map((entry) => (entry.id === item.id ? item : entry)) : [item, ...list]
      return { ...previous, [key]: next }
    })
  }, [demoMode])

  const remove = useCallback(async <K extends CollectionKey>(key: K, id: string) => {
    if (demoMode) {
      setState((previous) => ({ ...previous, [key]: (previous[key] as Item<K>[]).filter((entry) => entry.id !== id) }))
      return
    }
    const client = getSupabaseClient()
    if (!client) throw new Error('Supabase no está configurado.')
    await removeChurchItem(client, key, id)
    setState((previous) => {
      if (key === 'members') {
        return {
          ...previous,
          members: previous.members.filter((member) => member.id !== id),
          attendance: previous.attendance.map((record) => ({
            ...record,
            presentIds: record.presentIds.filter((memberId) => memberId !== id),
          })),
          ministries: previous.ministries.map((ministry) => ({
            ...ministry,
            coordinatorId: ministry.coordinatorId === id ? null : ministry.coordinatorId,
            memberIds: ministry.memberIds.filter((memberId) => memberId !== id),
          })),
          donations: previous.donations.map((donation) => ({
            ...donation,
            memberId: donation.memberId === id ? null : donation.memberId,
          })),
        }
      }
      if (key === 'events') {
        return {
          ...previous,
          events: previous.events.filter((event) => event.id !== id),
          attendance: previous.attendance.filter((record) => record.eventId !== id),
        }
      }
      return { ...previous, [key]: (previous[key] as Item<K>[]).filter((entry) => entry.id !== id) }
    })
  }, [demoMode])

  const updateSettings = useCallback(async (settings: Partial<ChurchSettings>) => {
    const next = { ...state.settings, ...settings }
    if (demoMode) {
      setState((previous) => ({ ...previous, settings: next }))
      return
    }
    const client = getSupabaseClient()
    if (!client) throw new Error('Supabase no está configurado.')
    await persistChurchSettings(client, next)
    setState((previous) => ({ ...previous, settings: next }))
  }, [state.settings])

  const login = useCallback(async (email: string, password: string) => {
    if (demoMode) {
      const demoRoles: Record<string, Role> = {
        administrador: 'super_admin',
        archivista: 'archivista',
        tesorero: 'tesorero',
        consulta: 'consulta',
      }
      const key = email.trim().split('@')[0].toLowerCase()
      const role = demoRoles[key] ?? 'super_admin'
      const isNetworkAdmin = role === 'super_admin' || role === 'administrador'
      const demoUser: User = {
        id: 'demo-user',
        name: email.trim() || 'Usuario de demostración',
        email: email.trim() || 'demo@iglesias.test',
        role,
        isNetworkAdmin,
        churchSlugs: isNetworkAdmin ? demoChurches.map((c) => c.slug) : [demoChurches[0]?.slug ?? 'catedral-san-ildefonso'],
      }
      setState((previous) => ({ ...previous, users: [demoUser] }))
      setCurrentUserId(demoUser.id)
      setDataError(null)
      setIsHydrated(true)
      return { ok: true }
    }
    const client = getSupabaseClient()
    if (!client) return { ok: false, error: 'Supabase no está configurado.' }
    setDataError(null)
    setIsHydrated(false)
    const { data, error } = await client.auth.signInWithPassword({ email: email.trim(), password })
    if (error || !data.user) {
      setIsHydrated(true)
      return { ok: false, error: 'No se pudo iniciar sesión. Revisa tus datos e inténtalo de nuevo.' }
    }
    try {
      const loaded = await loadChurchData(client, data.user.id)
      setCurrentUserId(data.user.id)
      setState(loaded.state)
      setPublicMemberCount(loaded.publicMemberCount)
      setDataError(null)
    } catch (reason) {
      const message = errorMessage(reason)
      setDataError(message)
      await client.auth.signOut()
      setCurrentUserId(null)
      return { ok: false, error: message }
    } finally {
      setIsHydrated(true)
    }
    return { ok: true }
  }, [demoMode])

  const logout = useCallback(async () => {
    if (demoMode) {
      setCurrentUserId(null)
      return
    }
    const client = getSupabaseClient()
    if (!client) throw new Error('Supabase no está configurado.')
    setCurrentUserId(null)
    const { error } = await client.auth.signOut()
    if (error) throw new Error(error.message)
  }, [demoMode])

  const addUser = useCallback(async (data: { name: string; email: string; password: string; role: Role; churchId?: string }) => {
    if (demoMode) {
      const user = { id: newId(), name: data.name.trim(), email: data.email.trim().toLowerCase(), role: data.role }
      setState((previous) => ({ ...previous, users: [...previous.users, user] }))
      return { ok: true }
    }
    const client = getSupabaseClient()
    if (!client) return { ok: false, error: 'Supabase no está configurado.' }
    const { data: result, error } = await client.functions.invoke<{ id: string }>('create-user', {
      body: { ...data, church_id: data.churchId },
    })
    if (error || !result?.id) return { ok: false, error: 'No se pudo crear el usuario. Verifica que la función create-user esté desplegada.' }
    setState((previous) => ({
      ...previous,
      users: [...previous.users, { id: result.id, name: data.name.trim(), email: data.email.trim().toLowerCase(), role: data.role }],
    }))
    return { ok: true }
  }, [demoMode])

  const value = useMemo<ChurchStore>(
    () => ({
      ...state,
      currentUser: state.users.find((user) => user.id === currentUserId) ?? null,
      isHydrated,
      dataError,
      publicMemberCount,
      save,
      remove,
      updateSettings,
      login,
      logout,
      addUser,
    }),
    [state, currentUserId, isHydrated, dataError, publicMemberCount, save, remove, updateSettings, login, logout, addUser],
  )

  return <ChurchContext.Provider value={value}>{children}</ChurchContext.Provider>
}

export function useChurch() {
  const context = useContext(ChurchContext)
  if (!context) throw new Error('useChurch debe usarse dentro de ChurchProvider')
  return context
}
