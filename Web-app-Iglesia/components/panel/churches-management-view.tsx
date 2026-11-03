'use client'

import { useEffect, useState } from 'react'
import { Pencil, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useChurch } from '@/lib/store'
import { getSupabaseClient } from '@/lib/supabase'
import { Field, FormDialog, NativeSelect } from './form-kit'
import { EmptyState, PageHeader, Panel, RequireModule } from './panel-ui'

type ChurchRecord = {
  id: string
  slug: string
  name: string
  patron_saint: string | null
  address: string | null
  is_active: boolean
  sort_order: number
}

export function ChurchesManagementView() {
  const { currentUser } = useChurch()
  const [churches, setChurches] = useState<ChurchRecord[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ChurchRecord | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function loadChurches() {
    const client = getSupabaseClient()
    if (!client) throw new Error('Supabase no está configurado.')
    const result = await client
      .from('churches')
      .select('id,slug,name,patron_saint,address,is_active,sort_order')
      .order('sort_order')
      .order('name')
    if (result.error) throw new Error(result.error.message)
    setChurches(result.data ?? [])
  }

  useEffect(() => {
    if (!currentUser?.isNetworkAdmin) return
    void loadChurches().catch((reason) => setError(reason instanceof Error ? reason.message : 'No se pudieron cargar las iglesias.'))
  }, [currentUser?.isNetworkAdmin])

  function startCreate() {
    setEditing(null)
    setError(null)
    setOpen(true)
  }

  function startEdit(church: ChurchRecord) {
    setEditing(church)
    setError(null)
    setOpen(true)
  }

  return (
    <RequireModule module="dashboard">
      {!currentUser?.isNetworkAdmin ? (
        <EmptyState>Solo un super administrador puede administrar la red.</EmptyState>
      ) : (
        <>
          <PageHeader
            eyebrow="Super administrador"
            title="Iglesias de la red"
            description="Crea y actualiza las sedes disponibles para el sitio y el panel."
            actions={<Button onClick={startCreate}><Plus data-icon="inline-start" />Nueva iglesia</Button>}
          />
          {error && <p role="alert" className="mb-6 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          <Panel>
            {churches.length === 0 ? <EmptyState>Aún no hay iglesias registradas.</EmptyState> : (
              <div className="divide-y divide-border">
                {churches.map((church) => (
                  <article key={church.id} className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0">
                    <div>
                      <h2 className="font-serif text-xl font-semibold">{church.name}</h2>
                      <p className="text-sm text-muted-foreground">/{church.slug}{church.address ? ` · ${church.address}` : ''}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <NativeSelect
                        value={church.is_active ? 'active' : 'inactive'}
                        aria-label={`Estado de ${church.name}`}
                        onChange={async (event) => {
                          const client = getSupabaseClient()
                          if (!client) return
                          const result = await client.from('churches').update({ is_active: event.target.value === 'active' }).eq('id', church.id)
                          if (result.error) {
                            setError(result.error.message)
                            return
                          }
                          setChurches((previous) => previous.map((item) => item.id === church.id ? { ...item, is_active: event.target.value === 'active' } : item))
                        }}
                        className="w-36"
                      >
                        <option value="active">Activa</option>
                        <option value="inactive">Inactiva</option>
                      </NativeSelect>
                      <Button variant="ghost" size="icon-sm" onClick={() => startEdit(church)}>
                        <Pencil />
                        <span className="sr-only">Editar {church.name}</span>
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </Panel>
          <FormDialog
            open={open}
            onOpenChange={setOpen}
            title={editing ? 'Editar iglesia' : 'Nueva iglesia'}
            description="Los cambios se aplican directamente al catálogo de la red."
            onSubmit={async (form) => {
              const client = getSupabaseClient()
              if (!client) throw new Error('Supabase no está configurado.')
              const values = {
                slug: String(form.get('slug') ?? '').trim().toLowerCase(),
                name: String(form.get('name') ?? '').trim(),
                patron_saint: String(form.get('patron_saint') ?? '').trim() || null,
                address: String(form.get('address') ?? '').trim() || null,
                sort_order: Number(form.get('sort_order') ?? 0),
              }
              const result = editing
                ? await client.from('churches').update(values).eq('id', editing.id)
                : await client.from('churches').insert(values)
              if (result.error) throw new Error(result.error.message)
              await loadChurches()
            }}
          >
            <Field label="Nombre" htmlFor="church-name"><Input id="church-name" name="name" required defaultValue={editing?.name ?? ''} /></Field>
            <Field label="Slug" htmlFor="church-slug"><Input id="church-slug" name="slug" required pattern="[a-z0-9-]+" defaultValue={editing?.slug ?? ''} /></Field>
            <Field label="Santo patrono" htmlFor="church-patron"><Input id="church-patron" name="patron_saint" defaultValue={editing?.patron_saint ?? ''} /></Field>
            <Field label="Dirección" htmlFor="church-address"><Input id="church-address" name="address" defaultValue={editing?.address ?? ''} /></Field>
            <Field label="Orden" htmlFor="church-order"><Input id="church-order" name="sort_order" type="number" min={0} defaultValue={editing?.sort_order ?? churches.length} /></Field>
          </FormDialog>
        </>
      )}
    </RequireModule>
  )
}
