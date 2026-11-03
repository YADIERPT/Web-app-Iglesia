'use client'

import { Crown } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ministryIcon, TONE_CLASSES } from '@/components/site/ministries-section'
import { initials } from '@/lib/format'
import { newId, useChurch } from '@/lib/store'
import type { Ministry, MinistryTone } from '@/lib/types'
import { cn } from '@/lib/utils'
import { AddButton, Field, FormDialog, NativeSelect, RowActions, useEditor } from './form-kit'
import { EmptyState, PageHeader, RequireModule } from './panel-ui'

const TONES: { value: MinistryTone; label: string }[] = [
  { value: 'lavender', label: 'Lavanda' },
  { value: 'blush', label: 'Rosa' },
  { value: 'sage', label: 'Salvia' },
  { value: 'sky', label: 'Cielo' },
]

export function MinistriesView() {
  const { ministries, members, save, remove } = useChurch()
  const editor = useEditor<Ministry>()
  const activeMembers = members.filter((m) => m.active).sort((a, b) => a.name.localeCompare(b.name))
  const editableMembers = members
    .filter((member) => member.active || editor.editing?.memberIds.includes(member.id))
    .sort((a, b) => a.name.localeCompare(b.name))
  const coordinatorOptions = members
    .filter((member) => member.active || member.id === editor.editing?.coordinatorId)
    .sort((a, b) => a.name.localeCompare(b.name))
  const memberName = (id: string | null) => members.find((m) => m.id === id)?.name

  return (
    <RequireModule module="ministerios">
      <PageHeader
        eyebrow="Servicio"
        title="Ministerios"
        description="Organiza los grupos de servicio y sus integrantes."
        actions={<AddButton onClick={editor.create}>Nuevo ministerio</AddButton>}
      />

      {ministries.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {ministries.map((ministry, index) => {
            const Icon = ministryIcon(ministry.name)
            const team = ministry.memberIds
              .map((id) => members.find((m) => m.id === id))
              .filter((member): member is (typeof members)[number] => Boolean(member))
            return (
              <article
                key={ministry.id}
                className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both flex flex-col rounded-3xl border border-border bg-card p-6 transition-all duration-500 hover:-translate-y-0.5 hover:border-primary/40"
                style={{ animationDelay: `${index * 70}ms`, animationDuration: '600ms' }}
              >
                <div className="flex items-start justify-between">
                  <span className={cn('flex size-12 items-center justify-center rounded-2xl', TONE_CLASSES[ministry.tone])}>
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <RowActions label={ministry.name} onEdit={() => editor.edit(ministry)} onDelete={() => remove('ministries', ministry.id)} />
                </div>
                <h3 className="mt-5 font-serif text-2xl font-medium">{ministry.name}</h3>
                <p className="mt-1 flex-1 text-sm text-muted-foreground">{ministry.description}</p>
                <p className="mt-5 flex items-center gap-2 text-sm">
                  <Crown className="size-4 text-primary" aria-hidden />
                  {memberName(ministry.coordinatorId) ?? 'Sin coordinador'}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <div className="flex -space-x-2">
                    {team.slice(0, 5).map((member) => (
                      <Avatar key={member.id} className="size-8 ring-2 ring-card">
                        <AvatarFallback className="bg-accent text-[10px] font-semibold text-accent-foreground">{initials(member.name)}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">{team.length} integrantes</span>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <EmptyState>Aún no hay ministerios registrados.</EmptyState>
      )}

      <FormDialog
        key={editor.editing?.id ?? 'new'}
        open={editor.open}
        onOpenChange={editor.setOpen}
        title={editor.editing ? 'Editar ministerio' : 'Nuevo ministerio'}
        onSubmit={async (form) => {
          const coordinator = String(form.get('coordinatorId'))
          await save('ministries', {
            id: editor.editing?.id ?? newId(),
            name: String(form.get('name')),
            description: String(form.get('description')),
            coordinatorId: coordinator || null,
            memberIds: form.getAll('memberIds').map(String),
            tone: form.get('tone') as MinistryTone,
          })
        }}
      >
        <Field label="Nombre" htmlFor="min-name">
          <Input id="min-name" name="name" required defaultValue={editor.editing?.name} />
        </Field>
        <Field label="Descripción" htmlFor="min-desc">
          <Textarea id="min-desc" name="description" rows={2} defaultValue={editor.editing?.description} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Coordinador" htmlFor="min-coord">
            <NativeSelect id="min-coord" name="coordinatorId" defaultValue={editor.editing?.coordinatorId ?? ''}>
              <option value="">Sin asignar</option>
              {coordinatorOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}{m.active ? '' : ' (inactivo)'}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Color" htmlFor="min-tone">
            <NativeSelect id="min-tone" name="tone" defaultValue={editor.editing?.tone ?? 'lavender'}>
              {TONES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">Integrantes</legend>
          <div className="grid max-h-48 gap-1 overflow-y-auto rounded-lg border border-border p-2 sm:grid-cols-2">
            {editableMembers.map((m) => (
              <label key={m.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                <input type="checkbox" name="memberIds" value={m.id} defaultChecked={editor.editing?.memberIds.includes(m.id)} className="accent-primary" />
                {m.name}{m.active ? '' : ' (inactivo)'}
              </label>
            ))}
          </div>
        </fieldset>
      </FormDialog>
    </RequireModule>
  )
}
