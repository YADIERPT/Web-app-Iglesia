'use client'

import { useEffect, useState } from 'react'
import { UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ROLE_LABELS } from '@/lib/permissions'
import { useChurch } from '@/lib/store'
import { getSupabaseClient } from '@/lib/supabase'
import { ROLES, type Role } from '@/lib/types'
import { Field, FormDialog, NativeSelect } from './form-kit'
import { EmptyState, PageHeader, Panel, RequireModule } from './panel-ui'
import { RowActions, useEditor } from './form-kit'

const CHURCH_ROLES = ROLES.filter((role): role is Role => ['parroco', 'vicario', 'secretaria', 'tesorero', 'archivista', 'consulta'].includes(role))
type Assignment = { userId: string; name: string; email: string; role: Role }

export function UsersManagementView({ churchId, churchName }: { churchId: string; churchName: string }) {
  const { currentUser, addUser } = useChurch()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const editor = useEditor<Assignment>()

  async function loadAssignments() {
    const client = getSupabaseClient()
    if (!client) throw new Error('Supabase no está configurado.')
    const result = await client
      .from('user_church_roles')
      .select('user_id,role,profiles!inner(email,full_name)')
      .eq('church_id', churchId)
      .order('role')
    if (result.error) throw new Error(result.error.message)
    setAssignments((result.data ?? []).map((row) => {
      const profile = row.profiles as { email?: string; full_name?: string | null }
      return { userId: row.user_id, name: profile.full_name || profile.email || 'Usuario', email: profile.email || '', role: row.role as Role }
    }))
  }

  useEffect(() => {
    void loadAssignments().catch((reason) => setMessage(reason instanceof Error ? reason.message : 'No se pudieron cargar las asignaciones.'))
  }, [churchId])

  return (
    <RequireModule module="usuarios">
      {!currentUser?.isNetworkAdmin && !currentUser?.churchSlugs?.length ? (
        <EmptyState>No tienes una iglesia asignada para administrar usuarios.</EmptyState>
      ) : (
        <>
          <PageHeader
            eyebrow={churchName}
            title="Usuarios y roles"
            description="Crea cuentas y asígnales un rol dentro de esta iglesia."
            actions={<Button onClick={() => { setMessage(null); setOpen(true) }}><UserPlus data-icon="inline-start" />Agregar usuario</Button>}
          />
          {message && <p role="status" className="mb-6 rounded-lg bg-sage/30 px-3 py-2 text-sm text-sage-foreground">{message}</p>}
          <Panel title="Asignaciones" description="Las cuentas se crean mediante la función segura de Supabase.">
            {assignments.length === 0 ? <EmptyState>No hay usuarios asignados a esta iglesia.</EmptyState> : (
              <div className="divide-y divide-border">
                {assignments.map((assignment) => (
                  <article key={`${assignment.userId}-${assignment.role}`} className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0">
                    <div><h2 className="font-serif text-xl font-semibold">{assignment.name}</h2><p className="mt-1 text-sm text-muted-foreground">{assignment.email}</p></div>
                    <div className="flex items-center gap-3"><span className="rounded-full border border-border px-2.5 py-1 text-xs">{ROLE_LABELS[assignment.role]}</span><RowActions label={assignment.name} onEdit={() => editor.edit(assignment)} onDelete={() => removeAssignment(assignment, churchId, setAssignments)} /></div>
                  </article>
                ))}
              </div>
            )}
          </Panel>
          <FormDialog
            open={open}
            onOpenChange={setOpen}
            title="Agregar usuario"
            description={`Crea una cuenta para ${churchName}.`}
            submitLabel="Crear usuario"
            onSubmit={async (form) => {
              const result = await addUser({
                name: String(form.get('name') ?? ''),
                email: String(form.get('email') ?? ''),
                password: String(form.get('password') ?? ''),
                role: form.get('role') as Role,
                churchId,
              })
              if (!result.ok) throw new Error(result.error ?? 'No se pudo crear el usuario.')
              setMessage('Usuario creado y asignado correctamente.')
              await loadAssignments()
            }}
          >
            <Field label="Nombre completo" htmlFor="managed-user-name"><Input id="managed-user-name" name="name" required autoComplete="name" /></Field>
            <Field label="Correo electrónico" htmlFor="managed-user-email"><Input id="managed-user-email" name="email" type="email" required autoComplete="email" /></Field>
            <Field label="Contraseña inicial" htmlFor="managed-user-password"><Input id="managed-user-password" name="password" type="password" minLength={8} required autoComplete="new-password" /></Field>
            <Field label="Rol" htmlFor="managed-user-role">
              <NativeSelect id="managed-user-role" name="role" defaultValue="consulta">
                {CHURCH_ROLES.map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}
              </NativeSelect>
            </Field>
          </FormDialog>
          <FormDialog
            key={editor.editing?.userId ?? 'assignment'}
            open={editor.open}
            onOpenChange={editor.setOpen}
            title="Editar rol"
            onSubmit={async (form) => {
              const client = getSupabaseClient()
              if (!client || !editor.editing) throw new Error('Supabase no está configurado.')
              const result = await client.from('user_church_roles').update({ role: form.get('role') as Role }).eq('user_id', editor.editing.userId).eq('church_id', churchId)
              if (result.error) throw new Error(result.error.message)
              await loadAssignments()
            }}
          >
            <p className="text-sm text-muted-foreground">{editor.editing?.name} · {editor.editing?.email}</p>
            <Field label="Rol" htmlFor="assignment-role"><NativeSelect id="assignment-role" name="role" defaultValue={editor.editing?.role}>{CHURCH_ROLES.map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}</NativeSelect></Field>
          </FormDialog>
        </>
      )}
    </RequireModule>
  )
}

async function removeAssignment(assignment: Assignment, churchId: string, setAssignments: (update: (previous: Assignment[]) => Assignment[]) => void) {
  const client = getSupabaseClient()
  if (!client) throw new Error('Supabase no está configurado.')
  const result = await client.from('user_church_roles').delete().eq('user_id', assignment.userId).eq('church_id', churchId).eq('role', assignment.role)
  if (result.error) throw new Error(result.error.message)
  setAssignments((previous) => previous.filter((item) => !(item.userId === assignment.userId && item.role === assignment.role)))
}
