'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { Check, Plus, Trash2, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ROLE_LABELS } from '@/lib/permissions'
import { newId, useChurch } from '@/lib/store'
import { ROLES, type Role, type Schedule } from '@/lib/types'
import { Field, FormDialog, NativeSelect } from './form-kit'
import { EmptyState, PageHeader, Panel, RequireModule } from './panel-ui'

export function SettingsView() {
  const { settings, updateSettings, users, save, addUser, currentUser } = useChurch()
  const [schedules, setSchedules] = useState<Schedule[]>(settings.schedules)
  const [saved, setSaved] = useState(false)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [userError, setUserError] = useState<string | null>(null)

  useEffect(() => {
    setSchedules(settings.schedules)
  }, [settings.schedules])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setSettingsError(null)
    try {
      await updateSettings({
        name: String(form.get('name')),
        tagline: String(form.get('tagline')),
        address: String(form.get('address')),
        phone: String(form.get('phone')),
        email: String(form.get('email')),
        mission: String(form.get('mission')),
        vision: String(form.get('vision')),
        schedules: schedules.filter((s) => s.name.trim()),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (error) {
      setSettingsError(error instanceof Error ? error.message : 'No se pudo guardar la configuración.')
    }
  }

  function updateSchedule(id: string, patch: Partial<Schedule>) {
    setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  return (
    <RequireModule module="configuracion">
      <PageHeader eyebrow="Sistema" title="Configuración" description="Información pública de la iglesia y usuarios del sistema." />

      <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-2">
        <Panel title="Datos generales">
          <div className="flex flex-col gap-4">
            <Field label="Nombre de la iglesia" htmlFor="s-name">
              <Input id="s-name" name="name" required defaultValue={settings.name} />
            </Field>
            <Field label="Frase principal" htmlFor="s-tag">
              <Input id="s-tag" name="tagline" defaultValue={settings.tagline} />
            </Field>
            <Field label="Dirección" htmlFor="s-address">
              <Input id="s-address" name="address" defaultValue={settings.address} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Teléfono" htmlFor="s-phone">
                <Input id="s-phone" name="phone" defaultValue={settings.phone} />
              </Field>
              <Field label="Correo" htmlFor="s-email">
                <Input id="s-email" name="email" type="email" defaultValue={settings.email} />
              </Field>
            </div>
            <Field label="Misión" htmlFor="s-mission">
              <Textarea id="s-mission" name="mission" rows={3} defaultValue={settings.mission} />
            </Field>
            <Field label="Visión" htmlFor="s-vision">
              <Textarea id="s-vision" name="vision" rows={3} defaultValue={settings.vision} />
            </Field>
          </div>
        </Panel>

        <div className="flex flex-col gap-6">
          <Panel
            title="Horarios de servicio"
            actions={
              <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => setSchedules((p) => [...p, { id: newId(), day: 'Domingo', time: '10:00', name: '' }])}>
                <Plus data-icon="inline-start" /> Agregar
              </Button>
            }
          >
            <ul className="flex flex-col gap-3">
              {schedules.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-2 rounded-2xl border border-border p-3 sm:flex-nowrap">
                  <NativeSelect value={s.day} onChange={(e) => updateSchedule(s.id, { day: e.target.value })} aria-label="Día" className="sm:w-32">
                    {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </NativeSelect>
                  <Input type="time" value={s.time} onChange={(e) => updateSchedule(s.id, { time: e.target.value })} aria-label="Hora" className="sm:w-32" />
                  <Input value={s.name} onChange={(e) => updateSchedule(s.id, { name: e.target.value })} placeholder="Nombre del servicio" aria-label="Nombre del servicio" />
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => setSchedules((p) => p.filter((x) => x.id !== s.id))}>
                    <Trash2 />
                    <span className="sr-only">Eliminar horario</span>
                  </Button>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel
            title="Usuarios y roles"
            description="Define qué puede ver cada persona del equipo."
            actions={
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => {
                  setUserError(null)
                  setUserDialogOpen(true)
                }}
              >
                <UserPlus data-icon="inline-start" /> Agregar usuario
              </Button>
            }
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead className="w-44">Rol</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length > 0 ? users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </TableCell>
                    <TableCell>
                      <NativeSelect
                        value={u.role}
                        disabled={u.id === currentUser?.id}
                        aria-label={`Rol de ${u.name}`}
                        onChange={(e) => {
                          setSettingsError(null)
                          void save('users', { ...u, role: e.target.value as Role }).catch((error: unknown) => {
                            setSettingsError(error instanceof Error ? error.message : 'No se pudo actualizar el rol.')
                          })
                        }}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </option>
                        ))}
                      </NativeSelect>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={2}>
                      <EmptyState>No hay usuarios registrados.</EmptyState>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Panel>

          <div className="flex flex-wrap items-center justify-end gap-4">
            <div className="flex items-center gap-4">
              {settingsError && <p role="alert" className="text-sm text-destructive">{settingsError}</p>}
              {saved && (
                <p role="status" className="flex items-center gap-1.5 text-sm text-sage-foreground">
                  <Check className="size-4" aria-hidden /> Cambios guardados
                </p>
              )}
              <Button type="submit" size="lg" className="rounded-full px-8">
                Guardar configuración
              </Button>
            </div>
          </div>
        </div>
      </form>

      <FormDialog
        open={userDialogOpen}
        onOpenChange={setUserDialogOpen}
        title="Agregar usuario"
        description="Crea una cuenta para el equipo y asígnale un rol."
        submitLabel="Crear usuario"
        onSubmit={async (form) => {
          const result = await addUser({
            name: String(form.get('name') ?? ''),
            email: String(form.get('email') ?? ''),
            password: String(form.get('password') ?? ''),
            role: form.get('role') as Role,
          })
          setUserError(result.error ?? null)
          return result.ok
        }}
      >
        <Field label="Nombre completo" htmlFor="u-name">
          <Input id="u-name" name="name" required autoComplete="name" />
        </Field>
        <Field label="Correo electrónico" htmlFor="u-email">
          <Input id="u-email" name="email" type="email" required autoComplete="email" />
        </Field>
        <Field label="Contraseña inicial" htmlFor="u-password">
          <Input id="u-password" name="password" type="password" minLength={8} required autoComplete="new-password" />
        </Field>
        <Field label="Rol" htmlFor="u-role">
          <NativeSelect id="u-role" name="role" defaultValue="secretario">
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </NativeSelect>
        </Field>
        {userError && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{userError}</p>}
      </FormDialog>
    </RequireModule>
  )
}
