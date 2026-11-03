'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowDownToLine, ArrowRight, ArrowUpFromLine, Coins, WalletCards } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { getSupabaseClient } from '@/lib/supabase'
import { ExportButtons } from './form-kit'
import { Panel, StatCard } from './panel-ui'

type NetworkSummaryRow = {
  church_id: string
  church_name: string
  church_slug: string
  total_income: number
  total_expenses: number
  net_balance: number
  pending_urn_balance: number
}

export function NetworkFinanceView() {
  const [rows, setRows] = useState<NetworkSummaryRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSummary() {
      const client = getSupabaseClient()
      if (!client) {
        setLoading(false)
        return
      }
      try {
        const { data, error } = await client.rpc('get_network_financial_summary')
        if (error) {
          // Si no tiene permisos de super_admin o falla, se oculta discretamente
          setRows([])
        } else if (Array.isArray(data)) {
          setRows(
            data.map((r: Record<string, unknown>) => ({
              church_id: String(r.church_id),
              church_name: String(r.church_name),
              church_slug: String(r.church_slug),
              total_income: Number(r.total_income ?? 0),
              total_expenses: Number(r.total_expenses ?? 0),
              net_balance: Number(r.net_balance ?? 0),
              pending_urn_balance: Number(r.pending_urn_balance ?? 0),
            })),
          )
        }
      } catch {
        setRows([])
      } finally {
        setLoading(false)
      }
    }

    void loadSummary()
  }, [])

  if (loading || rows.length === 0) {
    return null
  }

  const totalIncome = rows.reduce((acc, r) => acc + r.total_income, 0)
  const totalExpenses = rows.reduce((acc, r) => acc + r.total_expenses, 0)
  const netBalance = rows.reduce((acc, r) => acc + r.net_balance, 0)
  const totalPendingUrns = rows.reduce((acc, r) => acc + r.pending_urn_balance, 0)

  const exportRows = rows.map((r) => [
    r.church_name,
    r.total_income.toFixed(2),
    r.total_expenses.toFixed(2),
    r.net_balance.toFixed(2),
    r.pending_urn_balance.toFixed(2),
  ])

  return (
    <div className="mt-8 space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-semibold">Consolidado financiero de la red</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Vista global de ingresos, egresos y saldos de urnas de las 10 iglesias de la red (acceso super administrador).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Ingresos totales red" value={formatCurrency(totalIncome)} icon={ArrowUpFromLine} tone="sage" />
        <StatCard label="Egresos totales red" value={formatCurrency(totalExpenses)} icon={ArrowDownToLine} tone="blush" />
        <StatCard label="Balance consolidado" value={formatCurrency(netBalance)} icon={WalletCards} tone="sky" />
        <StatCard label="Saldos pendientes urnas" value={formatCurrency(totalPendingUrns)} icon={Coins} tone="lavender" />
      </div>

      <Panel
        title="Comparativo por sede"
        description="Resumen contable acumulado por cada iglesia de la red."
        actions={
          <ExportButtons
            filename="consolidado-financiero-red"
            title="Consolidado financiero de la red"
            subtitle="Resumen de ingresos, egresos y saldos por iglesia"
            headers={['Iglesia', 'Ingresos MXN', 'Egresos MXN', 'Balance Neto MXN', 'Saldo Pendiente Urnas MXN']}
            rows={exportRows}
          />
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                <th className="pb-3 font-medium">Sede</th>
                <th className="pb-3 text-right font-medium">Ingresos</th>
                <th className="pb-3 text-right font-medium">Egresos</th>
                <th className="pb-3 text-right font-medium">Balance neto</th>
                <th className="pb-3 text-right font-medium">Saldo urnas</th>
                <th className="pb-3 text-right font-medium">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.church_id} className="hover:bg-accent/40">
                  <td className="py-3 font-serif font-medium">{row.church_name}</td>
                  <td className="py-3 text-right text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(row.total_income)}
                  </td>
                  <td className="py-3 text-right text-destructive">
                    {formatCurrency(row.total_expenses)}
                  </td>
                  <td className={`py-3 text-right font-semibold ${row.net_balance >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-destructive'}`}>
                    {row.net_balance >= 0 ? '+' : ''}{formatCurrency(row.net_balance)}
                  </td>
                  <td className="py-3 text-right text-muted-foreground">
                    {formatCurrency(row.pending_urn_balance)}
                  </td>
                  <td className="py-3 text-right">
                    <Link
                      href={`/panel/${row.church_slug}/finanzas`}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      Finanzas <ArrowRight className="size-3" aria-hidden />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}
