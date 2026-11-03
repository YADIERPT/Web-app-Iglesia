'use client'

import { useState, type ComponentProps, type FormEvent, type ReactNode } from 'react'
import { FileDown, FileSpreadsheet, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { exportToExcel, exportToPDF } from '@/lib/export'
import { cn } from '@/lib/utils'

export function Field({ label, htmlFor, children, className }: { label: string; htmlFor: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  )
}

export function NativeSelect({ className, ...props }: ComponentProps<'select'>) {
  return (
    <select
      className={cn(
        'h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30',
        className,
      )}
      {...props}
    />
  )
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  onSubmit,
  children,
  submitLabel = 'Guardar',
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  onSubmit: (form: FormData) => void | boolean | Promise<void | boolean>
  children: ReactNode
  submitLabel?: string
}) {
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    try {
      if (await onSubmit(new FormData(event.currentTarget)) === false) return
      onOpenChange(false)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo guardar. Inténtalo de nuevo.')
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-medium">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {children}
          {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{submitLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function useEditor<T>() {
  const [editing, setEditing] = useState<T | null>(null)
  const [open, setOpen] = useState(false)
  return {
    editing,
    open,
    setOpen,
    create: () => {
      setEditing(null)
      setOpen(true)
    },
    edit: (item: T) => {
      setEditing(item)
      setOpen(true)
    },
  }
}

export function AddButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <Button onClick={onClick} className="rounded-full">
      <Plus data-icon="inline-start" />
      {children}
    </Button>
  )
}

export function RowActions({ onEdit, onDelete, label }: { onEdit?: () => void; onDelete?: () => void | Promise<void>; label: string }) {
  async function handleDelete() {
    if (!onDelete || !window.confirm(`¿Eliminar "${label}"? Esta acción no se puede deshacer.`)) return
    try {
      await onDelete()
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'No se pudo eliminar el registro.')
    }
  }

  return (
    <div className="flex justify-end gap-1">
      {onEdit && (
        <Button variant="ghost" size="icon-sm" onClick={onEdit}>
          <Pencil />
          <span className="sr-only">Editar {label}</span>
        </Button>
      )}
      {onDelete && (
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={handleDelete}
        >
          <Trash2 />
          <span className="sr-only">Eliminar {label}</span>
        </Button>
      )}
    </div>
  )
}

export function ExportButtons({
  filename,
  title,
  subtitle,
  headers,
  rows,
}: {
  filename: string
  title: string
  subtitle: string
  headers: string[]
  rows: (string | number)[][]
}) {
  return (
    <>
      <Button variant="outline" className="rounded-full" onClick={() => exportToExcel(filename, headers, rows)}>
        <FileSpreadsheet data-icon="inline-start" />
        CSV
      </Button>
      <Button variant="outline" className="rounded-full" onClick={() => exportToPDF(title, subtitle, headers, rows)}>
        <FileDown data-icon="inline-start" />
        PDF
      </Button>
    </>
  )
}
