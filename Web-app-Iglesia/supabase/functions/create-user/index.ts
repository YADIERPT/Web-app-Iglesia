import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const appOrigin = Deno.env.get('APP_ORIGIN')
if (!appOrigin) throw new Error('APP_ORIGIN debe estar configurado.')
const corsHeaders = {
  'Access-Control-Allow-Origin': appOrigin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin',
}

const roles = ['super_admin', 'parroco', 'vicario', 'secretaria', 'tesorero', 'archivista', 'consulta']
const legacyRoles: Record<string, string> = {
  super_admin: 'administrador',
  parroco: 'pastor',
  vicario: 'pastor',
  secretaria: 'secretario',
  tesorero: 'tesorero',
  archivista: 'secretario',
  consulta: 'secretario',
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return response({ error: 'Método no permitido.' }, 405)
  const origin = request.headers.get('Origin')
  if (origin && origin !== appOrigin) return response({ error: 'Origen no permitido.' }, 403)

  const authorization = request.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) return response({ error: 'No autorizado.' }, 401)

  try {
    const url = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!url || !anonKey || !serviceKey) throw new Error('Falta configuración de Supabase en la función.')

    const caller = createClient(url, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data: authData, error: authError } = await caller.auth.getUser()
    if (authError || !authData.user) return response({ error: 'La sesión no es válida.' }, 401)

    const service = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data: callerProfile, error: profileError } = await service
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .single()
    if (profileError) return response({ error: 'No se pudo validar el perfil administrador.' }, 403)
    const { data: callerAssignments, error: assignmentError } = await service
      .from('user_church_roles')
      .select('church_id,role')
      .eq('user_id', authData.user.id)
    if (assignmentError) return response({ error: 'No se pudo validar el alcance del usuario.' }, 403)

    const body: unknown = await request.json()
    if (!body || typeof body !== 'object') return response({ error: 'Datos inválidos.' }, 400)
    const input = body as Record<string, unknown>
    const name = typeof input.name === 'string' ? input.name.trim() : ''
    const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : ''
    const password = typeof input.password === 'string' ? input.password : ''
    const role = typeof input.role === 'string' ? input.role : ''
    const churchId = typeof input.church_id === 'string' ? input.church_id.trim() : ''
    const validChurchId = !churchId || /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(churchId)
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8 || !roles.includes(role) || !validChurchId || (role !== 'super_admin' && !churchId) || (role === 'super_admin' && churchId)) {
      return response({ error: 'Revisa nombre, correo, rol y contraseña (mínimo 8 caracteres).' }, 400)
    }
    const isLegacyAdmin = callerProfile?.role === 'administrador'
    const isSuperAdmin = callerAssignments?.some((assignment) => assignment.role === 'super_admin')
    const canManageChurch = callerAssignments?.some((assignment) => assignment.role === 'parroco' && assignment.church_id === churchId)
    if (!isLegacyAdmin && !isSuperAdmin && !canManageChurch) {
      return response({ error: 'No tienes permisos para crear usuarios en esta iglesia.' }, 403)
    }

    const { data: created, error: createError } = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    })
    if (createError) return response({ error: createError.message }, 400)

    if (!created.user) return response({ error: 'No se pudo completar el alta de usuario.' }, 500)

    const { error: insertError } = await service.from('profiles').insert({
      id: created.user.id,
      email,
      full_name: name,
      role: legacyRoles[role],
    })
    if (insertError) {
      const { error: cleanupError } = await service.auth.admin.deleteUser(created.user.id)
      if (cleanupError) console.error('create-user rollback failed:', cleanupError)
      return response({ error: 'No se pudo completar el perfil del usuario.' }, 500)
    }

    const { error: roleError } = await service.from('user_church_roles').insert({
      user_id: created.user.id,
      church_id: churchId || null,
      role,
    })
    if (roleError) {
      const { error: cleanupProfileError } = await service.from('profiles').delete().eq('id', created.user.id)
      const { error: cleanupAuthError } = await service.auth.admin.deleteUser(created.user.id)
      if (cleanupProfileError || cleanupAuthError) console.error('create-user role rollback failed:', cleanupProfileError ?? cleanupAuthError)
      return response({ error: 'No se pudo asignar el rol por iglesia.' }, 500)
    }

    return response({ id: created.user.id }, 201)
  } catch (error) {
    console.error('create-user failed:', error)
    return response({ error: 'No se pudo crear el usuario.' }, 500)
  }
})

function response(body: Record<string, string>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
