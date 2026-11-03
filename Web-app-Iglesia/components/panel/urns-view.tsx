'use client'

import { useEffect, useMemo, useState } from 'react'
import { Box, FileText } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency, formatDate, todayISO } from '@/lib/format'
import { getSupabaseClient } from '@/lib/supabase'
import { AddButton, ExportButtons, Field, FormDialog, NativeSelect, RowActions, useEditor } from './form-kit'
import { EmptyState, PageHeader, Panel, RequireModule, StatCard } from './panel-ui'

type Urn = {
  id: string
  code: string
  location: string
  status: string
  priceMxn: number | null
}

type Contract = {
  id: string
  urnId: string
  deceasedName: string
  holderName: string
  holderPhone: string
  agreedPriceMxn: number
  startDate: string
  notes: string
}

type Payment = {
  id: string
  contractId: string
  entryDate: string
  amountMxn: number
  method: string
  notes: string
}

const STATUSES = [
  ['disponible', 'Disponible'],
  ['reservada', 'Reservada'],
  ['ocupada', 'Ocupada'],
  ['mantenimiento', 'Mantenimiento'],
] as const

export function UrnsView({ churchId, churchName }: { churchId: string; churchName: string }) {
  const [urns, setUrns] = useState<Urn[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [error, setError] = useState<string | null>(null)
  const [contractOpen, setContractOpen] = useState(false)
  const [contractEditing, setContractEditing] = useState<Contract | null>(null)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paymentContract, setPaymentContract] = useState<Contract | null>(null)
  const urnEditor = useEditor<Urn>()

  async function loadData() {
    const client = getSupabaseClient()
    if (!client) throw new Error('Supabase no está configurado.')
    const [urnResult, contractResult, paymentResult] = await Promise.all([
      client.from('urns').select('id,code,location,status,price_mxn').eq('church_id', churchId).order('code'),
      client.from('urn_contracts').select('id,urn_id,deceased_name,holder_name,holder_phone,agreed_price_mxn,start_date,notes').eq('church_id', churchId).order('start_date', { ascending: false }),
      client.from('finance_entries').select('id,related_id,entry_date,amount_mxn,method,notes').eq('church_id', churchId).eq('direction', 'ingreso').eq('concept', 'urna').eq('related_type', 'urn_contract').not('related_id', 'is', null).order('entry_date', { ascending: false }),
    ])
    if (urnResult.error) throw new Error(urnResult.error.message)
    if (contractResult.error) throw new Error(contractResult.error.message)
    if (paymentResult.error) throw new Error(paymentResult.error.message)
    setUrns((urnResult.data ?? []).map((row) => ({
      id: row.id,
      code: row.code,
      location: row.location ?? '',
      status: row.status,
      priceMxn: row.price_mxn === null ? null : Number(row.price_mxn),
    })))
    setContracts((contractResult.data ?? []).map((row) => ({
      id: row.id,
      urnId: row.urn_id,
      deceasedName: row.deceased_name ?? '',
      holderName: row.holder_name,
      holderPhone: row.holder_phone ?? '',
      agreedPriceMxn: Number(row.agreed_price_mxn),
      startDate: row.start_date,
      notes: row.notes ?? '',
    })))
    setPayments((paymentResult.data ?? []).map((row) => ({
      id: row.id,
      contractId: row.related_id,
      entryDate: row.entry_date,
      amountMxn: Number(row.amount_mxn),
      method: row.method ?? '',
      notes: row.notes ?? '',
    })))
  }

  useEffect(() => {
    void loadData().catch((reason) => setError(reason instanceof Error ? reason.message : 'No se pudieron cargar las urnas.'))
  }, [churchId])

  const occupied = urns.filter((urn) => urn.status === 'ocupada').length
  const available = urns.filter((urn) => urn.status === 'disponible').length
  const activeContracts = contracts.filter((contract) => urns.some((urn) => urn.id === contract.urnId)).length
  const pendingBalance = contracts.reduce((total, contract) => total + Math.max(0, contract.agreedPriceMxn - paidFor(contract.id, payments)), 0)
  const contractExportRows = contracts.map((contract) => [
    urns.find((urn) => urn.id === contract.urnId)?.code ?? '',
    contract.holderName,
    contract.deceasedName,
    contract.startDate,
    contract.agreedPriceMxn.toFixed(2),
    paidFor(contract.id, payments).toFixed(2),
    Math.max(0, contract.agreedPriceMxn - paidFor(contract.id, payments)).toFixed(2),
    contract.holderPhone,
    contract.notes,
  ])

  return (
    <RequireModule module="urnas">
      <PageHeader
        eyebrow={churchName}
        title="Urnas y nichos"
        description="Administra el inventario de urnas y los contratos asociados."
        actions={<AddButton onClick={() => { setError(null); urnEditor.create() }}>Nueva urna</AddButton>}
      />
      {error && <p role="alert" className="mb-6 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <StatCard label="Urnas disponibles" value={available} icon={Box} tone="sage" />
        <StatCard label="Urnas ocupadas" value={occupied} icon={Box} tone="blush" />
        <StatCard label="Contratos registrados" value={activeContracts} icon={FileText} tone="sky" />
        <StatCard label="Saldo pendiente" value={formatCurrency(pendingBalance)} icon={FileText} tone="lavender" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Inventario">
          {urns.length === 0 ? <EmptyState>No hay urnas registradas.</EmptyState> : (
            <div className="divide-y divide-border">
              {urns.map((urn) => (
                <article key={urn.id} className="flex flex-wrap items-start justify-between gap-4 py-4 first:pt-0">
                  <div>
                    <h2 className="font-serif text-xl font-semibold">{urn.code}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{urn.location || 'Ubicación no indicada'}{urn.priceMxn !== null ? ` · ${formatCurrency(urn.priceMxn)}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full border border-border px-2.5 py-1 text-xs">{statusLabel(urn.status)}</span>
                    <RowActions label={urn.code} onEdit={() => urnEditor.edit(urn)} onDelete={() => removeUrn(urn.id, churchId, setUrns)} />
                  </div>
                </article>
              ))}
            </div>
          )}
        </Panel>
        <Panel
          title="Contratos"
          actions={
            <div className="flex flex-wrap justify-end gap-2">
              <ExportButtons
                filename={`urnas-${churchId}`}
                title={`Contratos de urnas · ${churchName}`}
                subtitle="Contratos, pagos y saldos pendientes"
                headers={['Urna', 'Titular', 'Difunto', 'Inicio', 'Precio MXN', 'Pagado MXN', 'Pendiente MXN', 'Teléfono', 'Notas']}
                rows={contractExportRows}
              />
              <AddButton onClick={() => { setContractEditing(null); setContractOpen(true) }}>Nuevo contrato</AddButton>
            </div>
          }
        >
          {contracts.length === 0 ? <EmptyState>No hay contratos registrados.</EmptyState> : (
            <div className="divide-y divide-border">
              {contracts.map((contract) => (
                <article key={contract.id} className="flex flex-wrap items-start justify-between gap-4 py-4 first:pt-0">
                  <div>
                    <h2 className="font-serif text-xl font-semibold">{contract.holderName}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{contract.deceasedName || 'Nombre del difunto no indicado'} · {urns.find((urn) => urn.id === contract.urnId)?.code ?? 'Urna eliminada'}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Desde {formatDate(contract.startDate)} · {formatCurrency(contract.agreedPriceMxn)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Pagado: {formatCurrency(paidFor(contract.id, payments))} · Pendiente: {formatCurrency(Math.max(0, contract.agreedPriceMxn - paidFor(contract.id, payments)))}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <AddButton onClick={() => { setPaymentContract(contract); setPaymentOpen(true) }}>Registrar pago</AddButton>
                    <RowActions label={contract.holderName} onEdit={() => { setContractEditing(contract); setContractOpen(true) }} onDelete={() => removeContract(contract.id, churchId, payments, setContracts)} />
                  </div>
                </article>
              ))}
            </div>
          )}
        </Panel>
      </div>
      <FormDialog
        key={urnEditor.editing?.id ?? 'new'}
        open={urnEditor.open}
        onOpenChange={urnEditor.setOpen}
        title={urnEditor.editing ? 'Editar urna' : 'Nueva urna'}
        onSubmit={async (form) => {
          const client = getSupabaseClient()
          if (!client) throw new Error('Supabase no está configurado.')
          const values = {
            code: String(form.get('code') ?? '').trim(),
            location: String(form.get('location') ?? '').trim() || null,
            status: String(form.get('status') ?? 'disponible'),
            price_mxn: form.get('priceMxn') ? Math.max(0, Number(form.get('priceMxn'))) : null,
          }
          const result = urnEditor.editing
            ? await client.from('urns').update(values).eq('id', urnEditor.editing.id).eq('church_id', churchId)
            : await client.from('urns').insert({ ...values, church_id: churchId })
          if (result.error) throw new Error(result.error.message)
          await loadData()
        }}
      >
        <Field label="Código" htmlFor="urn-code"><Input id="urn-code" name="code" required defaultValue={urnEditor.editing?.code ?? ''} /></Field>
        <Field label="Ubicación" htmlFor="urn-location"><Input id="urn-location" name="location" defaultValue={urnEditor.editing?.location ?? ''} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Estado" htmlFor="urn-status"><NativeSelect id="urn-status" name="status" defaultValue={urnEditor.editing?.status ?? 'disponible'}>{STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</NativeSelect></Field>
          <Field label="Precio (MXN)" htmlFor="urn-price"><Input id="urn-price" name="priceMxn" type="number" min="0" step="0.01" defaultValue={urnEditor.editing?.priceMxn ?? ''} /></Field>
        </div>
      </FormDialog>
      <FormDialog
        key={contractEditing?.id ?? 'new-contract'}
        open={contractOpen}
        onOpenChange={setContractOpen}
        title={contractEditing ? 'Editar contrato' : 'Nuevo contrato'}
        onSubmit={async (form) => {
          const client = getSupabaseClient()
          if (!client) throw new Error('Supabase no está configurado.')
          const values = {
            urn_id: String(form.get('urnId') ?? ''),
            deceased_name: String(form.get('deceasedName') ?? '').trim() || null,
            holder_name: String(form.get('holderName') ?? '').trim(),
            holder_phone: String(form.get('holderPhone') ?? '').trim() || null,
            agreed_price_mxn: Math.max(0, Number(form.get('agreedPriceMxn') ?? 0)),
            start_date: String(form.get('startDate') ?? ''),
            notes: String(form.get('notes') ?? '').trim() || null,
          }
          const result = contractEditing
            ? await client.from('urn_contracts').update(values).eq('id', contractEditing.id).eq('church_id', churchId)
            : await client.from('urn_contracts').insert({ ...values, church_id: churchId })
          if (result.error) throw new Error(result.error.message)
          await loadData()
        }}
      >
        <Field label="Urna" htmlFor="contract-urn"><NativeSelect id="contract-urn" name="urnId" required defaultValue={contractEditing?.urnId ?? ''}><option value="">Selecciona una urna</option>{urns.map((urn) => <option key={urn.id} value={urn.id}>{urn.code} · {statusLabel(urn.status)}</option>)}</NativeSelect></Field>
        <Field label="Titular del contrato" htmlFor="contract-holder"><Input id="contract-holder" name="holderName" required defaultValue={contractEditing?.holderName ?? ''} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Difunto" htmlFor="contract-deceased"><Input id="contract-deceased" name="deceasedName" defaultValue={contractEditing?.deceasedName ?? ''} /></Field>
          <Field label="Teléfono" htmlFor="contract-phone"><Input id="contract-phone" name="holderPhone" type="tel" defaultValue={contractEditing?.holderPhone ?? ''} /></Field>
          <Field label="Precio acordado (MXN)" htmlFor="contract-price"><Input id="contract-price" name="agreedPriceMxn" type="number" min="0" step="0.01" required defaultValue={contractEditing?.agreedPriceMxn ?? 0} /></Field>
          <Field label="Fecha de inicio" htmlFor="contract-date"><Input id="contract-date" name="startDate" type="date" required defaultValue={contractEditing?.startDate ?? todayISO()} /></Field>
        </div>
        <Field label="Notas" htmlFor="contract-notes"><Textarea id="contract-notes" name="notes" rows={3} defaultValue={contractEditing?.notes ?? ''} /></Field>
      </FormDialog>
      <FormDialog
        key={paymentContract?.id ?? 'new-payment'}
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        title="Registrar pago"
        description={paymentContract ? `Contrato de ${paymentContract.holderName}. Pendiente: ${formatCurrency(Math.max(0, paymentContract.agreedPriceMxn - paidFor(paymentContract.id, payments)))}.` : undefined}
        onSubmit={async (form) => {
          const client = getSupabaseClient()
          if (!client) throw new Error('Supabase no está configurado.')
          if (!paymentContract) throw new Error('Selecciona un contrato.')
          const amount = Number(form.get('amountMxn') ?? 0)
          if (!Number.isFinite(amount) || amount <= 0) throw new Error('El pago debe ser mayor que cero.')
          if (amount > Math.max(0, paymentContract.agreedPriceMxn - paidFor(paymentContract.id, payments))) {
            throw new Error('El pago no puede superar el saldo pendiente.')
          }
          const result = await client.from('finance_entries').insert({
            church_id: churchId,
            entry_date: String(form.get('entryDate') ?? ''),
            direction: 'ingreso',
            concept: 'urna',
            amount_mxn: amount,
            related_type: 'urn_contract',
            related_id: paymentContract.id,
            donor_name: paymentContract.holderName,
            method: String(form.get('method') ?? '').trim() || null,
            notes: String(form.get('notes') ?? '').trim() || null,
          })
          if (result.error) throw new Error(result.error.message)
          await loadData()
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Fecha" htmlFor="urn-payment-date"><Input id="urn-payment-date" name="entryDate" type="date" required defaultValue={todayISO()} /></Field>
          <Field label="Monto (MXN)" htmlFor="urn-payment-amount"><Input id="urn-payment-amount" name="amountMxn" type="number" min="0.01" step="0.01" required /></Field>
        </div>
        <Field label="Método" htmlFor="urn-payment-method"><Input id="urn-payment-method" name="method" placeholder="Efectivo, transferencia..." /></Field>
        <Field label="Notas" htmlFor="urn-payment-notes"><Textarea id="urn-payment-notes" name="notes" rows={3} /></Field>
      </FormDialog>
    </RequireModule>
  )
}

function statusLabel(status: string) {
  return STATUSES.find(([value]) => value === status)?.[1] ?? status
}

function paidFor(contractId: string, payments: Payment[]) {
  return payments.filter((payment) => payment.contractId === contractId).reduce((total, payment) => total + payment.amountMxn, 0)
}

async function removeUrn(id: string, churchId: string, setUrns: (update: (previous: Urn[]) => Urn[]) => void) {
  const client = getSupabaseClient()
  if (!client) throw new Error('Supabase no está configurado.')
  const result = await client.from('urns').delete().eq('id', id).eq('church_id', churchId)
  if (result.error) throw new Error(result.error.message)
  setUrns((previous) => previous.filter((urn) => urn.id !== id))
}

async function removeContract(id: string, churchId: string, payments: Payment[], setContracts: (update: (previous: Contract[]) => Contract[]) => void) {
  const client = getSupabaseClient()
  if (!client) throw new Error('Supabase no está configurado.')
  if (paidFor(id, payments) > 0) throw new Error('No se puede eliminar un contrato con pagos registrados.')
  const result = await client.from('urn_contracts').delete().eq('id', id).eq('church_id', churchId)
  if (result.error) throw new Error(result.error.message)
  setContracts((previous) => previous.filter((contract) => contract.id !== id))
}
