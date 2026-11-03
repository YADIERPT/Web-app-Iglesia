'use client'

import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { Download, FileText, Plus, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getSupabaseClient } from '@/lib/supabase'
import { Field, FormDialog, NativeSelect, RowActions } from './form-kit'
import { EmptyState, PageHeader, Panel, RequireModule } from './panel-ui'

type DocumentRow = {
  id: string
  title: string
  doc_type: string | null
  description: string | null
  file_path: string
  visibility: 'publico' | 'interno'
  status: 'borrador' | 'publicado'
  ocr_status: string
}

export function DocumentsView({ churchId, churchName }: { churchId: string; churchName: string }) {
  const [documents, setDocuments] = useState<DocumentRow[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<DocumentRow | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function loadDocuments() {
    const client = getSupabaseClient()
    if (!client) throw new Error('Supabase no está configurado.')
    const result = await client
      .from('documents')
      .select('id,title,doc_type,description,file_path,visibility,status,ocr_status')
      .eq('church_id', churchId)
      .order('title')
    if (result.error) throw new Error(result.error.message)
    setDocuments(result.data ?? [])
  }

  useEffect(() => {
    void loadDocuments().catch((reason) => setError(reason instanceof Error ? reason.message : 'No se pudieron cargar los documentos.'))
  }, [churchId])

  return (
    <RequireModule module="archivo">
      <PageHeader
        eyebrow={churchName}
        title="Archivo histórico"
        description="Administra documentos PDF, metadatos, visibilidad y estado de OCR."
        actions={<Button onClick={() => { setEditing(null); setError(null); setOpen(true) }}><Plus data-icon="inline-start" />Subir PDF</Button>}
      />
      {error && <p role="alert" className="mb-6 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      <Panel>
        {documents.length === 0 ? <EmptyState>Aún no hay documentos registrados en esta iglesia.</EmptyState> : (
          <div className="divide-y divide-border">
            {documents.map((document) => (
              <article key={document.id} className="flex flex-wrap items-start justify-between gap-4 py-4 first:pt-0">
                <div className="flex gap-3">
                  <FileText className="mt-1 size-5 text-primary" aria-hidden />
                  <div>
                    <h2 className="font-serif text-xl font-semibold">{document.title}</h2>
                    {document.doc_type && <p className="mt-1 text-xs uppercase tracking-[0.12em] text-gold-text">{document.doc_type}</p>}
                    {document.description && <p className="mt-2 text-sm text-muted-foreground">{document.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-2 text-xs">
                    <span className="rounded-full border border-border px-2.5 py-1">{document.visibility}</span>
                    <span className="rounded-full border border-border px-2.5 py-1">{document.status}</span>
                    <span className="rounded-full border border-border px-2.5 py-1">OCR: {document.ocr_status}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={document.ocr_status === 'procesando'}
                    onClick={async () => {
                      try {
                        const client = getSupabaseClient()
                        if (!client) throw new Error('Supabase no está configurado.')
                        const job = await client.rpc('request_document_ocr', { target_document_id: document.id })
                        if (job.error) throw new Error(job.error.message)
                        await loadDocuments()
                      } catch (reason) {
                        setError(reason instanceof Error ? reason.message : 'No se pudo solicitar el OCR.')
                      }
                    }}
                  >
                    <RotateCw data-icon="inline-start" />
                    {document.ocr_status === 'pendiente' ? 'Solicitar OCR' : 'Reprocesar OCR'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        const client = getSupabaseClient()
                        if (!client) throw new Error('Supabase no está configurado.')
                        const { bucket, path } = storageLocation(document.file_path)
                        let url: string
                        if (document.visibility === 'publico' && bucket === 'church-public-documents') {
                          url = client.storage.from(bucket).getPublicUrl(path).data.publicUrl
                        } else {
                          const signed = await client.storage.from(bucket).createSignedUrl(path, 60)
                          if (signed.error) throw new Error(signed.error.message)
                          const userResult = await client.auth.getUser()
                          if (userResult.error || !userResult.data.user) throw new Error('La sesión ha expirado. Inicia sesión de nuevo.')
                          const audit = await client.from('audit_log').insert({
                            actor_id: userResult.data.user.id,
                            church_id: churchId,
                            action: 'download',
                            entity_type: 'documents',
                            entity_id: document.id,
                            metadata: { title: document.title },
                          })
                          if (audit.error) throw new Error(audit.error.message)
                          url = signed.data.signedUrl
                        }
                        window.open(url, '_blank', 'noopener,noreferrer')
                      } catch (reason) {
                        setError(reason instanceof Error ? reason.message : 'No se pudo descargar el documento.')
                      }
                    }}
                  >
                    <Download data-icon="inline-start" />
                    Descargar
                  </Button>
                  <RowActions
                    label={document.title}
                    onEdit={() => { setEditing(document); setError(null); setOpen(true) }}
                    onDelete={async () => {
                      const client = getSupabaseClient()
                      if (!client) throw new Error('Supabase no está configurado.')
                      const { bucket, path } = storageLocation(document.file_path)
                      const storageResult = await client.storage.from(bucket).remove([path])
                      if (storageResult.error) throw new Error(storageResult.error.message)
                      const result = await client.from('documents').delete().eq('id', document.id)
                      if (result.error) throw new Error(result.error.message)
                      setDocuments((previous) => previous.filter((item) => item.id !== document.id))
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
        title={editing ? 'Editar documento' : 'Subir documento'}
        description={editing ? 'Actualiza los metadatos del documento.' : 'El PDF se guardará en el bucket correspondiente a su visibilidad.'}
        submitLabel={editing ? 'Guardar cambios' : 'Subir documento'}
        onSubmit={async (form) => {
          const client = getSupabaseClient()
          if (!client) throw new Error('Supabase no está configurado.')
          if (editing) {
            const nextVisibility = form.get('visibility') === 'publico' ? 'publico' : 'interno'
            const currentLocation = storageLocation(editing.file_path)
            const nextBucket = nextVisibility === 'publico' ? 'church-public-documents' : 'church-documents'
            let nextFilePath = editing.file_path
            if (currentLocation.bucket !== nextBucket) {
              const nextPath = `${churchId}/${editing.id}-${originalFileName(currentLocation.path, editing.id)}`
              await transferStorageFile(client, currentLocation, { bucket: nextBucket, path: nextPath })
              nextFilePath = `${nextBucket}/${nextPath}`
            }
            const result = await client.from('documents').update({
              title: String(form.get('title') ?? '').trim(),
              doc_type: String(form.get('doc_type') ?? '').trim() || null,
              description: String(form.get('description') ?? '').trim() || null,
              file_path: nextFilePath,
              visibility: nextVisibility,
              status: form.get('status') === 'publicado' ? 'publicado' : 'borrador',
            }).eq('id', editing.id)
            if (result.error) {
              if (currentLocation.bucket !== nextBucket) {
                const nextPath = nextFilePath.slice(nextBucket.length + 1)
                try {
                  await transferStorageFile(client, { bucket: nextBucket, path: nextPath }, currentLocation)
                } catch (rollbackReason) {
                  throw new Error(`${result.error.message} Además, no se pudo revertir el archivo: ${rollbackReason instanceof Error ? rollbackReason.message : 'error desconocido'}`)
                }
              }
              throw new Error(result.error.message)
            }
            await loadDocuments()
            return
          }
          const file = form.get('file')
          if (!(file instanceof File) || file.size === 0) throw new Error('Selecciona un archivo PDF.')
          if (file.type !== 'application/pdf') throw new Error('El archivo debe ser un PDF.')
          const visibility = form.get('visibility') === 'publico' ? 'publico' : 'interno'
          const status = form.get('status') === 'publicado' ? 'publicado' : 'borrador'
          const bucket = visibility === 'publico' ? 'church-public-documents' : 'church-documents'
          const documentId = crypto.randomUUID()
          const path = `${churchId}/${documentId}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`
          const upload = await client.storage.from(bucket).upload(path, file, { contentType: 'application/pdf', upsert: false })
          if (upload.error) throw new Error(upload.error.message)
          const result = await client.from('documents').insert({
            id: documentId,
            church_id: churchId,
            title: String(form.get('title') ?? '').trim(),
            doc_type: String(form.get('doc_type') ?? '').trim() || null,
            description: String(form.get('description') ?? '').trim() || null,
            file_path: `${bucket}/${path}`,
            file_size: file.size,
            visibility,
            status,
          })
          if (result.error) {
            await client.storage.from(bucket).remove([path])
            throw new Error(result.error.message)
          }
          const job = await client.from('ocr_jobs').insert({
            document_id: documentId,
            attempts: 0,
            error: null,
            status: 'pendiente',
          })
          if (job.error) {
            await client.from('documents').delete().eq('id', documentId).eq('church_id', churchId)
            await client.storage.from(bucket).remove([path])
            throw new Error(job.error.message)
          }
          await loadDocuments()
        }}
      >
        <Field label="Título" htmlFor="document-title"><Input id="document-title" name="title" required defaultValue={editing?.title ?? ''} /></Field>
        <Field label="Tipo de documento" htmlFor="document-type"><Input id="document-type" name="doc_type" placeholder="Acta, libro, inventario..." defaultValue={editing?.doc_type ?? ''} /></Field>
        <Field label="Descripción" htmlFor="document-description"><Input id="document-description" name="description" defaultValue={editing?.description ?? ''} /></Field>
        <Field label="Visibilidad" htmlFor="document-visibility">
          <NativeSelect id="document-visibility" name="visibility" defaultValue={editing?.visibility ?? 'interno'}>
            <option value="interno">Interno</option>
            <option value="publico">Público</option>
          </NativeSelect>
        </Field>
        <Field label="Estado" htmlFor="document-status">
          <NativeSelect id="document-status" name="status" defaultValue={editing?.status ?? 'borrador'}>
            <option value="borrador">Borrador</option>
            <option value="publicado">Publicado</option>
          </NativeSelect>
        </Field>
        {!editing && <Field label="Archivo PDF" htmlFor="document-file"><Input id="document-file" name="file" type="file" accept="application/pdf,.pdf" required /></Field>}
      </FormDialog>
    </RequireModule>
  )
}

function storageLocation(filePath: string) {
  const separator = filePath.indexOf('/')
  if (separator <= 0 || separator === filePath.length - 1) throw new Error('La ruta del documento no es válida.')
  return {
    bucket: filePath.slice(0, separator),
    path: filePath.slice(separator + 1),
  }
}

function originalFileName(path: string, documentId: string) {
  const fileName = path.split('/').pop() ?? 'document.pdf'
  const prefix = `${documentId}-`
  return fileName.startsWith(prefix) ? fileName.slice(prefix.length) : fileName
}

async function transferStorageFile(
  client: SupabaseClient,
  source: { bucket: string; path: string },
  target: { bucket: string; path: string },
) {
  const download = await client.storage.from(source.bucket).download(source.path)
  if (download.error) throw new Error(download.error.message)
  const upload = await client.storage.from(target.bucket).upload(target.path, download.data, {
    contentType: 'application/pdf',
    upsert: false,
  })
  if (upload.error) throw new Error(upload.error.message)
  const remove = await client.storage.from(source.bucket).remove([source.path])
  if (remove.error) {
    await client.storage.from(target.bucket).remove([target.path])
    throw new Error(remove.error.message)
  }
}
