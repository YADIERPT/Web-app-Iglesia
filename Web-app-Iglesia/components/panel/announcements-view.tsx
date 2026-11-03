'use client'

import { Megaphone } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { formatDate, todayISO } from '@/lib/format'
import { newId, useChurch } from '@/lib/store'
import type { Announcement } from '@/lib/types'
import { cn } from '@/lib/utils'
import { AddButton, Field, FormDialog, RowActions, useEditor } from './form-kit'
import { EmptyState, PageHeader, RequireModule } from './panel-ui'

export function AnnouncementsView() {
  const { announcements, save, remove } = useChurch()
  const editor = useEditor<Announcement>()
  const sorted = [...announcements].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <RequireModule module="comunicados">
      <PageHeader
        eyebrow="Avisos"
        title="Comunicados"
        description="Publica anuncios que aparecerán en el sitio público."
        actions={<AddButton onClick={editor.create}>Nuevo comunicado</AddButton>}
      />

      {sorted.length === 0 ? (
        <EmptyState>Aún no hay comunicados.</EmptyState>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {sorted.map((item) => (
            <article
              key={item.id}
              className={cn(
                'relative overflow-hidden rounded-3xl border bg-card p-7 transition-all duration-500 hover:shadow-[0_20px_50px_-30px_var(--gold)]',
                item.important ? 'border-primary/40' : 'border-border',
              )}
            >
              {item.important && <div aria-hidden className="gold-hairline absolute inset-x-0 top-0 h-0.5" />}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{formatDate(item.date)}</span>
                  {item.important && (
                    <span className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                      <Megaphone className="size-3" aria-hidden /> Importante
                    </span>
                  )}
                </div>
                <RowActions label={item.title} onEdit={() => editor.edit(item)} onDelete={() => remove('announcements', item.id)} />
              </div>
              <h3 className="mt-3 font-serif text-2xl font-medium">{item.title}</h3>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </article>
          ))}
        </div>
      )}

      <FormDialog
        key={editor.editing?.id ?? 'new'}
        open={editor.open}
        onOpenChange={editor.setOpen}
        title={editor.editing ? 'Editar comunicado' : 'Nuevo comunicado'}
        submitLabel="Publicar"
        onSubmit={async (form) =>
          await save('announcements', {
            id: editor.editing?.id ?? newId(),
            title: String(form.get('title')),
            body: String(form.get('body')),
            date: String(form.get('date')),
            important: form.get('important') === 'on',
          })
        }
      >
        <Field label="Título" htmlFor="an-title">
          <Input id="an-title" name="title" required defaultValue={editor.editing?.title} />
        </Field>
        <Field label="Mensaje" htmlFor="an-body">
          <Textarea id="an-body" name="body" rows={5} required defaultValue={editor.editing?.body} />
        </Field>
        <div className="grid items-end gap-4 sm:grid-cols-2">
          <Field label="Fecha" htmlFor="an-date">
            <Input id="an-date" name="date" type="date" required defaultValue={editor.editing?.date ?? todayISO()} />
          </Field>
          <label className="flex h-9 cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" name="important" defaultChecked={editor.editing?.important} className="accent-primary" />
            Marcar como importante
          </label>
        </div>
      </FormDialog>
    </RequireModule>
  )
}
