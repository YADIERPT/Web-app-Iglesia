'use client'

import { useEffect, useState } from 'react'
import { ReceiptText } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency } from '@/lib/format'
import { getSupabaseClient } from '@/lib/supabase'
import { AddButton, Field, FormDialog, RowActions, useEditor } from './form-kit'
import { EmptyState, PageHeader, Panel, RequireModule } from './panel-ui'

type ServicePrice = {
  id: string
  name: string
  suggestedPrice: number
  donationSuggested: boolean
  description: string
  showPublicly: boolean
  isActive: boolean
}

export function ServicePricesView({ churchId, churchName }: { churchId: string; churchName: string }) {
  const [services, setServices] = useState<ServicePrice[]>([])
  const [error, setError] = useState<string | null>(null)
  const editor = useEditor<ServicePrice>()

  async function loadServices() {
    const client = getSupabaseClient()
    if (!client) throw new Error('Supabase no está configurado.')
    const result = await client
      .from('service_prices')
      .select('id,name,suggested_price,donation_suggested,description,show_publicly,is_active')
      .eq('church_id', churchId)
      .order('name')
    if (result.error) throw new Error(result.error.message)
    setServices((result.data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      suggestedPrice: Number(row.suggested_price),
      donationSuggested: row.donation_suggested,
      description: row.description ?? '',
      showPublicly: row.show_publicly,
      isActive: row.is_active,
    })))
  }

  useEffect(() => {
    void loadServices().catch((reason) => setError(reason instanceof Error ? reason.message : 'No se pudo cargar el tarifario.'))
  }, [churchId])

  return (
    <RequireModule module="tarifario">
      <PageHeader
        eyebrow={churchName}
        title="Tarifario"
        description="Gestiona servicios, cuotas sugeridas y visibilidad pública."
        actions={<AddButton onClick={() => { setError(null); editor.create() }}>Nuevo servicio</AddButton>}
      />
      {error && <p role="alert" className="mb-6 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      <Panel>
        {services.length === 0 ? <EmptyState>No hay servicios configurados.</EmptyState> : (
          <div className="divide-y divide-border">
            {services.map((service) => (
              <article key={service.id} className="flex flex-wrap items-start justify-between gap-4 py-4 first:pt-0">
                <div>
                  <h2 className="font-serif text-xl font-semibold">{service.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{service.description || 'Sin descripción'}</p>
                  <p className="mt-2 text-sm">{service.donationSuggested ? 'Donativo sugerido' : 'Cuota fija sugerida'} · {formatCurrency(service.suggestedPrice)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-2 text-xs">
                    <span className="rounded-full border border-border px-2.5 py-1">{service.isActive ? 'Activo' : 'Inactivo'}</span>
                    <span className="rounded-full border border-border px-2.5 py-1">{service.showPublicly ? 'Público' : 'Interno'}</span>
                  </div>
                  <RowActions label={service.name} onEdit={() => editor.edit(service)} onDelete={() => removeService(service.id, churchId, setServices)} />
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>
      <FormDialog
        key={editor.editing?.id ?? 'new'}
        open={editor.open}
        onOpenChange={editor.setOpen}
        title={editor.editing ? 'Editar servicio' : 'Nuevo servicio'}
        description="El servicio quedará asociado a la iglesia activa."
        onSubmit={async (form) => {
          const client = getSupabaseClient()
          if (!client) throw new Error('Supabase no está configurado.')
          const values = {
            name: String(form.get('name') ?? '').trim(),
            suggested_price: Math.max(0, Number(form.get('suggestedPrice') ?? 0)),
            donation_suggested: form.get('donationSuggested') === 'on',
            description: String(form.get('description') ?? '').trim(),
            show_publicly: form.get('showPublicly') === 'on',
            is_active: form.get('isActive') === 'on',
          }
          const result = editor.editing
            ? await client.from('service_prices').update(values).eq('id', editor.editing.id).eq('church_id', churchId)
            : await client.from('service_prices').insert({ ...values, church_id: churchId })
          if (result.error) throw new Error(result.error.message)
          await loadServices()
        }}
      >
        <Field label="Nombre del servicio" htmlFor="service-name"><Input id="service-name" name="name" required defaultValue={editor.editing?.name ?? ''} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Precio sugerido (MXN)" htmlFor="service-price"><Input id="service-price" name="suggestedPrice" type="number" min="0" step="0.01" required defaultValue={editor.editing?.suggestedPrice ?? 0} /></Field>
          <div className="flex flex-col justify-end gap-3 pb-2">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="donationSuggested" defaultChecked={editor.editing?.donationSuggested ?? true} /> Donativo sugerido</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked={editor.editing?.isActive ?? true} /> Servicio activo</label>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="showPublicly" defaultChecked={editor.editing?.showPublicly ?? false} /> Mostrar públicamente</label>
        <Field label="Descripción" htmlFor="service-description"><Textarea id="service-description" name="description" rows={3} defaultValue={editor.editing?.description ?? ''} /></Field>
      </FormDialog>
    </RequireModule>
  )
}

async function removeService(id: string, churchId: string, setServices: (update: (previous: ServicePrice[]) => ServicePrice[]) => void) {
  const client = getSupabaseClient()
  if (!client) throw new Error('Supabase no está configurado.')
  const result = await client.from('service_prices').delete().eq('id', id).eq('church_id', churchId)
  if (result.error) throw new Error(result.error.message)
  setServices((previous) => previous.filter((service) => service.id !== id))
}
