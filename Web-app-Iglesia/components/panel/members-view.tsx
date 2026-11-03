'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate, initials, todayISO } from '@/lib/format'
import { newId, useChurch } from '@/lib/store'
import type { Member } from '@/lib/types'
import { AddButton, ExportButtons, Field, FormDialog, NativeSelect, RowActions, useEditor } from './form-kit'
import { EmptyState, PageHeader, Panel, RequireModule } from './panel-ui'

export function MembersView() {
  const { members, ministries, save, remove } = useChurch()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'todos' | 'activos' | 'inactivos'>('todos')
  const editor = useEditor<Member>()

  const filtered = members
    .filter((m) => (status === 'todos' ? true : status === 'activos' ? m.active : !m.active))
    .filter((m) => `${m.name} ${m.email} ${m.phone}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name))

  const rows = filtered.map((m) => [m.name, m.phone, m.email, formatDate(m.joinDate), m.active ? 'Activo' : 'Inactivo'])
  const headers = ['Nombre', 'Teléfono', 'Correo', 'Ingreso', 'Estado']

  return (
    <RequireModule module="miembros">
      <PageHeader
        eyebrow="Comunidad"
        title="Miembros"
        description="Administra el registro de la congregación."
        actions={
          <>
            <ExportButtons filename="miembros" title="Directorio de miembros" subtitle={`${filtered.length} registros`} headers={headers} rows={rows} />
            <AddButton onClick={editor.create}>Nuevo miembro</AddButton>
          </>
        }
      />

      <Panel>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, correo o teléfono"
              aria-label="Buscar miembros"
              className="h-10 pl-9"
            />
          </div>
          <NativeSelect value={status} onChange={(e) => setStatus(e.target.value as typeof status)} aria-label="Filtrar por estado" className="h-10 sm:w-44">
            <option value="todos">Todos</option>
            <option value="activos">Activos</option>
            <option value="inactivos">Inactivos</option>
          </NativeSelect>
        </div>

        {filtered.length === 0 ? (
          <EmptyState>No se encontraron miembros.</EmptyState>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Miembro</TableHead>
                <TableHead className="hidden md:table-cell">Teléfono</TableHead>
                <TableHead className="hidden lg:table-cell">Ministerios</TableHead>
                <TableHead className="hidden sm:table-cell">Ingreso</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((member) => {
                const memberMinistries = ministries.filter((min) => min.memberIds.includes(member.id))
                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">{initials(member.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                          <p className="mt-1 text-xs text-muted-foreground md:hidden">
                            {member.phone || 'Sin teléfono'}
                            <span className="px-1.5" aria-hidden>·</span>
                            Ingreso: {formatDate(member.joinDate, { month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">{member.phone || '—'}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {memberMinistries.map((min) => (
                          <Badge key={min.id} variant="secondary">
                            {min.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">{formatDate(member.joinDate, { month: 'short', year: 'numeric' })}</TableCell>
                    <TableCell>
                      <Badge variant={member.active ? 'default' : 'outline'}>{member.active ? 'Activo' : 'Inactivo'}</Badge>
                    </TableCell>
                    <TableCell>
                      <RowActions label={member.name} onEdit={() => editor.edit(member)} onDelete={() => remove('members', member.id)} />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Panel>

      <FormDialog
        key={editor.editing?.id ?? 'new'}
        open={editor.open}
        onOpenChange={editor.setOpen}
        title={editor.editing ? 'Editar miembro' : 'Nuevo miembro'}
        onSubmit={async (form) =>
          await save('members', {
            id: editor.editing?.id ?? newId(),
            name: String(form.get('name')),
            phone: String(form.get('phone')),
            email: String(form.get('email')),
            joinDate: String(form.get('joinDate')),
            active: form.get('active') === 'true',
          })
        }
      >
        <Field label="Nombre completo" htmlFor="m-name">
          <Input id="m-name" name="name" required defaultValue={editor.editing?.name} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Teléfono" htmlFor="m-phone">
            <Input id="m-phone" name="phone" type="tel" defaultValue={editor.editing?.phone} />
          </Field>
          <Field label="Correo" htmlFor="m-email">
            <Input id="m-email" name="email" type="email" defaultValue={editor.editing?.email} />
          </Field>
          <Field label="Fecha de ingreso" htmlFor="m-date">
            <Input id="m-date" name="joinDate" type="date" required defaultValue={editor.editing?.joinDate ?? todayISO()} />
          </Field>
          <Field label="Estado" htmlFor="m-active">
            <NativeSelect id="m-active" name="active" defaultValue={String(editor.editing?.active ?? true)}>
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </NativeSelect>
          </Field>
        </div>
      </FormDialog>
    </RequireModule>
  )
}
