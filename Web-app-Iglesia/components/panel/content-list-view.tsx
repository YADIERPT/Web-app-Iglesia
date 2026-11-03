'use client'

import { useEffect, useState } from 'react'
import { ImagePlus, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getSupabaseClient } from '@/lib/supabase'
import type { ModuleKey } from '@/lib/permissions'
import { Field, FormDialog, NativeSelect, RowActions } from './form-kit'
import { EmptyState, PageHeader, Panel, RequireModule } from './panel-ui'

type ContentRow = {
  id: string
  name: string
  description: string | null
  visibility: string
  status: string
  cover_path?: string | null
  quantity?: number
  category?: string | null
  kind?: string | null
  feast_day_month?: number | null
  feast_day_day?: number | null
}

const MONTHS = [
  { value: 1, name: 'Enero', maxDays: 31 },
  { value: 2, name: 'Febrero', maxDays: 29 }, // Permitir hasta 29 para festividades religiosas bisiestas
  { value: 3, name: 'Marzo', maxDays: 31 },
  { value: 4, name: 'Abril', maxDays: 30 },
  { value: 5, name: 'Mayo', maxDays: 31 },
  { value: 6, name: 'Junio', maxDays: 30 },
  { value: 7, name: 'Julio', maxDays: 31 },
  { value: 8, name: 'Agosto', maxDays: 31 },
  { value: 9, name: 'Septiembre', maxDays: 30 },
  { value: 10, name: 'Octubre', maxDays: 31 },
  { value: 11, name: 'Noviembre', maxDays: 30 },
  { value: 12, name: 'Diciembre', maxDays: 31 },
] as const

function getMaxDays(month: number | null): number {
  if (!month) return 31
  const found = MONTHS.find((m) => m.value === month)
  return found ? found.maxDays : 31
}

const CONFIG = {
  patrimonio: {
    title: 'Objetos históricos y bienes sacros',
    description: 'Catálogo de piezas de orfebrería, cálices, estatuas, campanas y bienes de valor documentados.',
    table: 'heritage_objects',
    select: 'id,name,description,category,quantity,cover_path,visibility,status',
    label: (row: ContentRow) => row.category || 'Sin categoría',
  },
  santos: {
    title: 'Santos e imágenes devocionales',
    description: 'Consulta y registro de santos patronos, advocaciones, estatuas y pinturas religiosas con su festividad litúrgica.',
    table: 'saints',
    select: 'id,name,description,kind,cover_path,visibility,status,feast_day_month,feast_day_day',
    label: (row: ContentRow) => row.kind || 'Sin clasificación',
  },
} as const

export function ContentListView({ module, churchId, churchName }: { module: 'patrimonio' | 'santos'; churchId: string; churchName: string }) {
  const config = CONFIG[module]
  const [rows, setRows] = useState<ContentRow[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ContentRow | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Estados interactivos del formulario
  const [feastMonth, setFeastMonth] = useState<number | null>(null)
  const [feastDay, setFeastDay] = useState<number | null>(null)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [removeImageRequested, setRemoveImageRequested] = useState(false)

  useEffect(() => {
    const client = getSupabaseClient()
    if (!client) {
      setError('Supabase no está configurado.')
      return
    }
    void client
      .from(config.table)
      .select(config.select as string)
      .eq('church_id', churchId)
      .order('name')
      .then(({ data, error: resultError }) => {
        if (resultError) {
          setError(resultError.message)
          return
        }
        setRows((data ?? []) as unknown as ContentRow[])
      })
  }, [churchId, config.select, config.table])

  function handleOpenCreate() {
    setEditing(null)
    setError(null)
    setFeastMonth(null)
    setFeastDay(null)
    setSelectedImage(null)
    setPreviewUrl(null)
    setRemoveImageRequested(false)
    setOpen(true)
  }

  function handleOpenEdit(row: ContentRow) {
    setEditing(row)
    setError(null)
    setFeastMonth(row.feast_day_month ?? null)
    setFeastDay(row.feast_day_day ?? null)
    setSelectedImage(null)
    setPreviewUrl(row.cover_path ?? null)
    setRemoveImageRequested(false)
    setOpen(true)
  }

  function handleMonthChange(newMonthStr: string) {
    const monthNum = newMonthStr ? Number(newMonthStr) : null
    setFeastMonth(monthNum)
    if (monthNum && feastDay) {
      const max = getMaxDays(monthNum)
      if (feastDay > max) {
        setFeastDay(max)
      }
    } else if (!monthNum) {
      setFeastDay(null)
    }
  }

  return (
    <RequireModule module={module as ModuleKey}>
      <PageHeader
        eyebrow={churchName}
        title={config.title}
        description={config.description}
        actions={<Button onClick={handleOpenCreate}><Plus data-icon="inline-start" />Nuevo registro</Button>}
      />
      {error && <p role="alert" className="mb-6 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      <Panel>
        {rows.length === 0 ? <EmptyState>Aún no hay registros en esta iglesia.</EmptyState> : (
          <div className="divide-y divide-border">
            {rows.map((row) => (
              <article key={row.id} className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0">
                <div className="flex items-center gap-4">
                  {row.cover_path ? (
                    <img
                      src={row.cover_path}
                      alt={row.name}
                      className="size-16 rounded-xl border border-border object-cover shadow-sm shrink-0"
                    />
                  ) : (
                    <div className="flex size-16 shrink-0 items-center justify-center rounded-xl border border-border bg-secondary font-serif text-2xl font-semibold text-primary">
                      {row.name.trim().charAt(0) || 'I'}
                    </div>
                  )}
                  <div>
                    <h2 className="font-serif text-xl font-semibold leading-tight">{row.name}</h2>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs">
                      <span className="font-semibold uppercase tracking-[0.12em] text-gold-text">{config.label(row)}</span>
                      {row.quantity && row.quantity > 1 && (
                        <span className="text-muted-foreground">· Cantidad: {row.quantity} piezas</span>
                      )}
                      {row.feast_day_month && row.feast_day_day && (
                        <span className="rounded-md bg-accent px-2 py-0.5 font-medium text-accent-foreground">
                          Festividad: {row.feast_day_day} de {MONTHS.find((m) => m.value === row.feast_day_month)?.name}
                        </span>
                      )}
                    </div>
                    {row.description && <p className="mt-1.5 text-sm text-muted-foreground line-clamp-1">{row.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-2 text-xs">
                    <span className="rounded-full border border-border px-2.5 py-1 capitalize">{row.visibility}</span>
                    <span className="rounded-full border border-border px-2.5 py-1 capitalize">{row.status}</span>
                  </div>
                  <RowActions
                    label={row.name}
                    onEdit={() => handleOpenEdit(row)}
                    onDelete={async () => {
                      const client = getSupabaseClient()
                      if (!client) throw new Error('Supabase no está configurado.')
                      const result = await client.from(config.table).delete().eq('id', row.id)
                      if (result.error) throw new Error(result.error.message)
                      setRows((previous) => previous.filter((item) => item.id !== row.id))
                    }}
                  />
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={`${editing ? 'Editar' : 'Nuevo'} registro de ${module === 'patrimonio' ? 'objeto de valor' : 'santo o imagen'}`}
        description="El registro y su fotografía quedarán asociados a la iglesia activa."
        onSubmit={async (form) => {
          const client = getSupabaseClient()
          if (!client) throw new Error('Supabase no está configurado.')

          // Validación de festividad
          if (module === 'santos') {
            if (feastDay && !feastMonth) {
              throw new Error('Selecciona un mes para el día de festividad indicado.')
            }
            if (feastMonth && feastDay) {
              const max = getMaxDays(feastMonth)
              if (feastDay < 1 || feastDay > max) {
                const monthName = MONTHS.find((m) => m.value === feastMonth)?.name ?? `Mes ${feastMonth}`
                throw new Error(`El día de festividad para ${monthName} debe estar entre 1 y ${max}.`)
              }
            }
          }

          const recordId = editing?.id ?? crypto.randomUUID()
          let finalCoverPath = editing?.cover_path ?? null

          if (removeImageRequested) {
            finalCoverPath = null
          }

          // Subida de imagen a Supabase Storage si se seleccionó un archivo nuevo
          if (selectedImage) {
            const ext = selectedImage.name.split('.').pop()?.toLowerCase() || 'jpg'
            const storagePath = `${churchId}/${module}/${recordId}-${Date.now()}.${ext}`

            const uploadResult = await client.storage
              .from('church-media')
              .upload(storagePath, selectedImage, {
                contentType: selectedImage.type,
                upsert: true,
              })

            if (uploadResult.error) {
              throw new Error(`No se pudo subir la fotografía: ${uploadResult.error.message}`)
            }

            const { data: pubData } = client.storage.from('church-media').getPublicUrl(storagePath)
            finalCoverPath = pubData.publicUrl

            // Registrar en la tabla media
            try {
              await client.from('media').insert({
                church_id: churchId,
                owner_type: module === 'patrimonio' ? 'object' : 'saint',
                owner_id: recordId,
                file_path: finalCoverPath,
                caption: String(form.get('name') ?? '').trim(),
                visibility: form.get('visibility') === 'publico' ? 'publico' : 'interno',
              })
            } catch {
              // Si la tabla no está creada aún en la base de datos local, no interrumpe el guardado
            }
          }

          const common = {
            id: recordId,
            church_id: churchId,
            name: String(form.get('name') ?? '').trim(),
            description: String(form.get('description') ?? '').trim() || null,
            cover_path: finalCoverPath,
            visibility: form.get('visibility') === 'publico' ? 'publico' : 'interno',
            status: form.get('status') === 'publicado' ? 'publicado' : 'borrador',
          }

          const result = module === 'patrimonio'
            ? await client.from('heritage_objects').upsert({
                ...common,
                category: String(form.get('classification') ?? '').trim() || null,
                quantity: Math.max(1, Number(form.get('quantity') ?? 1)),
              })
            : await client.from('saints').upsert({
                ...common,
                kind: String(form.get('classification') ?? '').trim() || null,
                feast_day_month: feastMonth,
                feast_day_day: feastMonth ? feastDay : null,
              })

          if (result.error) throw new Error(result.error.message)
          await loadRows(churchId, config.table, config.select, setRows)
        }}
      >
        <Field label="Nombre" htmlFor="content-name">
          <Input id="content-name" name="name" required defaultValue={editing?.name ?? ''} placeholder="Ej. Cáliz de plata cincelada / Virgen de la Asunción" />
        </Field>

        <Field label={module === 'patrimonio' ? 'Categoría' : 'Clasificación'} htmlFor="content-classification">
          <Input
            id="content-classification"
            name="classification"
            defaultValue={editing ? (module === 'patrimonio' ? editing.category ?? '' : editing.kind ?? '') : ''}
            placeholder={module === 'patrimonio' ? 'Ej. Orfebrería, Escultura, Mobiliario' : 'Ej. Escultura de bulto, Lienzo al óleo, Reliquia'}
          />
        </Field>

        {module === 'patrimonio' && (
          <Field label="Cantidad de piezas" htmlFor="content-quantity">
            <Input id="content-quantity" name="quantity" type="number" min={1} defaultValue={editing?.quantity ?? 1} />
          </Field>
        )}

        {module === 'santos' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Mes de festividad" htmlFor="saint-feast-month">
              <NativeSelect
                id="saint-feast-month"
                name="feastDayMonth"
                value={feastMonth !== null ? String(feastMonth) : ''}
                onChange={(e) => handleMonthChange(e.target.value)}
              >
                <option value="">-- Sin festividad --</option>
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.name} ({m.maxDays} días)
                  </option>
                ))}
              </NativeSelect>
            </Field>

            <Field label="Día de festividad" htmlFor="saint-feast-day">
              <NativeSelect
                id="saint-feast-day"
                name="feastDayDay"
                disabled={feastMonth === null}
                value={feastDay !== null ? String(feastDay) : ''}
                onChange={(e) => setFeastDay(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">{feastMonth ? '-- Selecciona el día --' : '-- Primero elige un mes --'}</option>
                {feastMonth !== null &&
                  Array.from({ length: getMaxDays(feastMonth) }, (_, idx) => idx + 1).map((d) => (
                    <option key={d} value={d}>
                      Día {d}
                    </option>
                  ))}
              </NativeSelect>
            </Field>
          </div>
        )}

        {/* Campo para anexar fotografía */}
        <Field
          label={module === 'patrimonio' ? 'Fotografía de la pieza u objeto' : 'Fotografía del santo o imagen'}
          htmlFor="content-image"
        >
          {previewUrl && (
            <div className="relative mb-2 flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3">
              <img
                src={previewUrl}
                alt="Vista previa"
                className="size-16 rounded-lg border border-border object-cover shrink-0"
              />
              <div className="flex-1 min-w-0 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground truncate">
                  {selectedImage ? selectedImage.name : 'Fotografía actual registrada'}
                </p>
                <p className="mt-0.5">
                  {selectedImage ? `${(selectedImage.size / 1024).toFixed(0)} KB · Lista para subir` : 'Se conservará esta imagen a menos que la quites o sustituyas.'}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => {
                  setSelectedImage(null)
                  setPreviewUrl(null)
                  setRemoveImageRequested(true)
                }}
              >
                <Trash2 className="size-4" />
                Quitar
              </Button>
            </div>
          )}
          <Input
            id="content-image"
            name="image"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/jpg"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) return
              if (!file.type.startsWith('image/')) {
                setError('El archivo seleccionado debe ser una imagen válida (PNG, JPG, WebP).')
                return
              }
              if (file.size > 15 * 1024 * 1024) {
                setError('La imagen no debe superar los 15 MB de tamaño.')
                return
              }
              setSelectedImage(file)
              setPreviewUrl(URL.createObjectURL(file))
              setRemoveImageRequested(false)
            }}
          />
          <p className="text-[0.75rem] text-muted-foreground">
            Formatos admitidos: PNG, JPG o WebP. Máximo 15 MB.
          </p>
        </Field>

        <Field label="Descripción o notas históricas" htmlFor="content-description">
          <Input id="content-description" name="description" defaultValue={editing?.description ?? ''} placeholder="Detalles de procedencia, estilo o historia" />
        </Field>

        <Field label="Visibilidad" htmlFor="content-visibility">
          <NativeSelect id="content-visibility" name="visibility" defaultValue={editing?.visibility ?? 'publico'}>
            <option value="publico">Público (visible en la web)</option>
            <option value="interno">Interno (solo administradores y sacerdotes)</option>
          </NativeSelect>
        </Field>

        <Field label="Estado de publicación" htmlFor="content-status">
          <NativeSelect id="content-status" name="status" defaultValue={editing?.status ?? 'publicado'}>
            <option value="publicado">Publicado</option>
            <option value="borrador">Borrador</option>
          </NativeSelect>
        </Field>
      </FormDialog>
    </RequireModule>
  )
}

async function loadRows(
  churchId: string,
  table: 'heritage_objects' | 'saints',
  select: string,
  setRows: (rows: ContentRow[]) => void,
) {
  const client = getSupabaseClient()
  if (!client) throw new Error('Supabase no está configurado.')
  const result = await client.from(table).select(select).eq('church_id', churchId).order('name')
  if (result.error) throw new Error(result.error.message)
  setRows((result.data ?? []) as unknown as ContentRow[])
}
