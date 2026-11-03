import type { SupabaseClient } from '@supabase/supabase-js'
import { createEmptyState } from './seed'
import type { Announcement, AttendanceRecord, ChurchEvent, ChurchSettings, ChurchState, CollectionKey, Donation, Member, Ministry, User } from './types'

type Row = Record<string, unknown>

function assertNoError(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

function rows(data: unknown, error: { message: string } | null): Row[] {
  assertNoError(error)
  if (!Array.isArray(data)) throw new Error('Supabase devolvió datos con un formato inesperado.')
  return data as Row[]
}

function row(data: unknown, error: { message: string } | null): Row | null {
  assertNoError(error)
  if (data === null) return null
  if (typeof data !== 'object' || Array.isArray(data)) throw new Error('Supabase devolvió datos con un formato inesperado.')
  return data as Row
}

const datePart = (value: unknown) => String(value ?? '').slice(0, 10)
const timePart = (value: unknown) => String(value ?? '').slice(0, 5)
const dayOrder = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export async function loadChurchData(client: SupabaseClient, userId: string | null) {
  const profileResult = userId
    ? await client.from('profiles').select('id,email,full_name,role')
    : { data: [], error: null }
  const profiles = rows(profileResult.data, profileResult.error)
  let currentProfile = userId ? profiles.find((profile) => profile.id === userId) : undefined

  if (userId && !currentProfile) {
    try {
      const { data: authData } = await client.auth.getUser()
      if (authData?.user && authData.user.id === userId) {
        const email = authData.user.email ?? ''
        const fullName =
          (authData.user.user_metadata?.full_name as string) ||
          (authData.user.user_metadata?.name as string) ||
          email.split('@')[0] ||
          'Usuario'
        const { data: newProfile, error: insertError } = await client
          .from('profiles')
          .insert({ id: userId, email, full_name: fullName, role: 'secretario' })
          .select('id,email,full_name,role')
          .maybeSingle()
        if (newProfile && !insertError) {
          currentProfile = newProfile as Row
          profiles.push(newProfile as Row)
        }
      }
    } catch {
      // Ignorar fallo de autorrecuperación y dejar que salte el error descriptivo
    }
  }

  if (userId && !currentProfile) throw new Error('Tu cuenta no tiene un perfil asignado. Contacta al administrador.')
  const role = String(currentProfile?.role ?? '')
  const canReadMemberDetails = ['administrador', 'pastor', 'secretario'].includes(role)
  const canReadMinistryDirectory = canReadMemberDetails || role === 'coordinador'
  const canReadAttendance = ['administrador', 'pastor', 'secretario', 'coordinador'].includes(role)
  const canReadDonations = ['administrador', 'pastor', 'tesorero'].includes(role)
  const [
    memberResult,
    eventResult,
    ministryResult,
    ministryMemberResult,
    attendanceResult,
    attendanceMemberResult,
    donationResult,
    announcementResult,
    settingsResult,
    scheduleResult,
    publicCountResult,
    ministryCountResult,
    assignmentResult,
  ] = await Promise.all([
    canReadMemberDetails
      ? client.from('members').select('*')
      : canReadMinistryDirectory
        ? client.rpc('ministry_member_directory')
        : Promise.resolve({ data: [], error: null }),
    client.from('events').select('*').order('date', { ascending: true }),
    client.from('ministries').select('*').order('name', { ascending: true }),
    canReadMinistryDirectory ? client.from('ministry_members').select('ministry_id,member_id') : Promise.resolve({ data: [], error: null }),
    canReadAttendance ? client.from('attendance_records').select('*') : Promise.resolve({ data: [], error: null }),
    canReadAttendance ? client.from('attendance_members').select('attendance_id,member_id') : Promise.resolve({ data: [], error: null }),
    canReadDonations ? client.from('donations').select('*') : Promise.resolve({ data: [], error: null }),
    client.from('announcements').select('*').order('date', { ascending: false }),
    client.from('church_settings').select('*').eq('id', 1).maybeSingle(),
    client.from('schedules').select('*').order('day').order('time'),
    client.rpc('public_active_member_count'),
    client.rpc('public_ministry_counts'),
    userId
      ? client.from('user_church_roles').select('church_id,role,churches(slug)').eq('user_id', userId)
      : Promise.resolve({ data: [], error: null }),
  ])

  const members = rows(memberResult.data, memberResult.error)
  const events = rows(eventResult.data, eventResult.error)
  const ministries = rows(ministryResult.data, ministryResult.error)
  const ministryMembers = rows(ministryMemberResult.data, ministryMemberResult.error)
  const attendanceRecords = rows(attendanceResult.data, attendanceResult.error)
  const attendanceMembers = rows(attendanceMemberResult.data, attendanceMemberResult.error)
  const donations = rows(donationResult.data, donationResult.error)
  const announcements = rows(announcementResult.data, announcementResult.error)
  const settings = row(settingsResult.data, settingsResult.error)
  const schedules = rows(scheduleResult.data, scheduleResult.error)
  assertNoError(publicCountResult.error)
  const ministryCounts = rows(ministryCountResult.data, ministryCountResult.error)
  const assignments = rows(assignmentResult.data, assignmentResult.error)
  const networkAssignment = assignments.find((assignment) => assignment.role === 'super_admin' && !assignment.church_id)
  const assignedChurchIds = assignments
    .map((assignment) => {
      const church = assignment.churches
      return church && typeof church === 'object' && !Array.isArray(church) && typeof (church as Record<string, unknown>).slug === 'string'
        ? String((church as Record<string, unknown>).slug)
        : null
    })
    .filter((churchSlug): churchSlug is string => churchSlug !== null)

  const state = createEmptyState()
  state.users = profiles.map((profile) => ({
    id: String(profile.id),
    email: String(profile.email),
    name: String(profile.full_name || profile.email || 'Usuario'),
    role: profile.id === userId && assignments[0]?.role
      ? assignments[0].role as User['role']
      : (profile.role === 'administrador' ? 'super_admin' : profile.role as User['role']),
    churchSlugs: profile.id === userId ? assignedChurchIds : undefined,
    isNetworkAdmin: profile.id === userId ? Boolean(networkAssignment || profile.role === 'administrador' || profile.role === 'super_admin' || assignments.some((a) => a.role === 'super_admin')) : (profile.role === 'administrador' || profile.role === 'super_admin'),
  }))
  state.members = members.map((member) => ({
    id: String(member.id),
    name: String(member.name),
    phone: String(member.phone ?? ''),
    email: String(member.email ?? ''),
    joinDate: datePart(member.join_date),
    active: Boolean(member.active),
  }))
  state.events = events.map((event) => ({
    id: String(event.id),
    title: String(event.title),
    date: datePart(event.date),
    time: timePart(event.time),
    place: String(event.place ?? ''),
    description: String(event.description ?? ''),
    responsible: String(event.responsible ?? ''),
    type: event.type as ChurchEvent['type'],
    status: event.status as ChurchEvent['status'],
  }))
  state.ministries = ministries.map((ministry) => ({
    id: String(ministry.id),
    name: String(ministry.name),
    description: String(ministry.description ?? ''),
    coordinatorId: ministry.coordinator_id ? String(ministry.coordinator_id) : null,
    memberIds: ministryMembers
      .filter((assignment) => assignment.ministry_id === ministry.id)
      .map((assignment) => String(assignment.member_id)),
    tone: ministry.tone as Ministry['tone'],
    memberCount: Number(ministryCounts.find((count) => count.ministry_id === ministry.id)?.member_count ?? 0),
  }))
  state.attendance = attendanceRecords.map((record) => ({
    id: String(record.id),
    eventId: String(record.event_id),
    date: datePart(record.date),
    presentIds: attendanceMembers
      .filter((assignment) => assignment.attendance_id === record.id)
      .map((assignment) => String(assignment.member_id)),
  }))
  state.donations = donations.map((donation) => ({
    id: String(donation.id),
    date: datePart(donation.date),
    amount: Number(donation.amount),
    concept: donation.concept as Donation['concept'],
    method: donation.method as Donation['method'],
    memberId: donation.member_id ? String(donation.member_id) : null,
  }))
  state.announcements = announcements.map((announcement) => ({
    id: String(announcement.id),
    title: String(announcement.title),
    body: String(announcement.body),
    date: datePart(announcement.date),
    important: Boolean(announcement.important),
  }))
  if (settings) {
    state.settings = {
      name: String(settings.name ?? ''),
      tagline: String(settings.tagline ?? ''),
      logoUrl: settings.logo_url ? String(settings.logo_url) : null,
      address: String(settings.address ?? ''),
      phone: String(settings.phone ?? ''),
      email: String(settings.email ?? ''),
      mission: String(settings.mission ?? ''),
      vision: String(settings.vision ?? ''),
      schedules: schedules
        .map((schedule) => ({
          id: String(schedule.id),
          day: String(schedule.day),
          time: timePart(schedule.time),
          name: String(schedule.name),
        }))
        .sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day) || a.time.localeCompare(b.time)),
    }
  }

  return {
    state,
    publicMemberCount: Number(publicCountResult.data ?? 0),
  }
}

export async function persistChurchItem<K extends CollectionKey>(
  client: SupabaseClient,
  key: K,
  item: ChurchState[K][number],
) {
  let error: { message: string } | null = null
  switch (key) {
    case 'users': {
      const user = item as User
      ;({ error } = await client.from('profiles').update({
        email: user.email,
        full_name: user.name,
        role: user.role,
      }).eq('id', user.id))
      break
    }
    case 'members': {
      const member = item as Member
      ;({ error } = await client.from('members').upsert({
        id: member.id,
        name: member.name,
        phone: member.phone,
        email: member.email,
        join_date: member.joinDate,
        active: member.active,
      }))
      break
    }
    case 'events': {
      const event = item as ChurchEvent
      ;({ error } = await client.from('events').upsert({
        id: event.id,
        title: event.title,
        date: event.date,
        time: event.time,
        place: event.place,
        description: event.description,
        responsible: event.responsible,
        type: event.type,
        status: event.status,
      }))
      break
    }
    case 'ministries': {
      const ministry = item as Ministry
      const result = await client.rpc('save_ministry_record', {
        ministry_id: ministry.id,
        ministry_name: ministry.name,
        ministry_description: ministry.description,
        coordinator_uuid: ministry.coordinatorId,
        ministry_tone: ministry.tone,
        member_uuids: ministry.memberIds,
      })
      error = result.error
      break
    }
    case 'attendance': {
      const attendance = item as AttendanceRecord
      const result = await client.rpc('save_attendance_record', {
        attendance_id: attendance.id,
        event_uuid: attendance.eventId,
        attendance_date: attendance.date,
        member_uuids: attendance.presentIds,
      })
      error = result.error
      break
    }
    case 'donations': {
      const donation = item as Donation
      ;({ error } = await client.from('donations').upsert({
        id: donation.id,
        date: donation.date,
        amount: donation.amount,
        concept: donation.concept,
        method: donation.method,
        member_id: donation.memberId,
      }))
      break
    }
    case 'announcements': {
      const announcement = item as Announcement
      ;({ error } = await client.from('announcements').upsert({
        id: announcement.id,
        title: announcement.title,
        body: announcement.body,
        date: announcement.date,
        important: announcement.important,
      }))
      break
    }
  }
  assertNoError(error)
}

export async function removeChurchItem(client: SupabaseClient, key: keyof ChurchState, id: string) {
  const tables: Partial<Record<keyof ChurchState, string>> = {
    members: 'members',
    events: 'events',
    ministries: 'ministries',
    attendance: 'attendance_records',
    donations: 'donations',
    announcements: 'announcements',
  }
  const table = tables[key]
  if (!table) throw new Error('Esta cuenta no puede eliminar ese registro.')
  const { error } = await client.from(table).delete().eq('id', id)
  assertNoError(error)
}

export async function persistChurchSettings(client: SupabaseClient, settings: ChurchSettings) {
  const { error } = await client.rpc('save_church_settings', {
    settings: {
      name: settings.name,
      tagline: settings.tagline,
      logo_url: settings.logoUrl,
      address: settings.address,
      phone: settings.phone,
      email: settings.email,
      mission: settings.mission,
      vision: settings.vision,
    },
    schedule_rows: settings.schedules.map((schedule) => ({
      id: schedule.id,
      day: schedule.day,
      time: schedule.time,
      name: schedule.name,
    })),
  })
  assertNoError(error)
}
