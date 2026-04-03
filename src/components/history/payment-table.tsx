'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { STATUS_CONFIG, RAIL_CONFIG } from '@/lib/constants';
import type { PaymentDetail, PaymentStatus, Rail } from '@/lib/types';
import { ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';

type SortField = 'payment_id' | 'status' | 'amount' | 'created_at';
type SortDir = 'asc' | 'desc';

interface FiltersState {
  status?: PaymentStatus;
  rail?: Rail;
}

interface Props {
  filters?: FiltersState;
}

export function PaymentTable({ filters }: Props) {
  const [payments, setPayments] = useState<PaymentDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const PAGE_SIZE = 15;

  const fetchPayments = useCallback(() => {
    setLoading(true);
    api.listPayments({ status: filters?.status, rail: filters?.rail, limit: 100 })
      .then(setPayments)
      .catch(() => setPayments([]))
      .finally(() => setLoading(false));
  }, [filters?.status, filters?.rail]);

  useEffect(() => {
    fetchPayments();
    setPage(1);
  }, [fetchPayments]);

  const sorted = [...payments].sort((a, b) => {
    let av: string | number = a[sortField as keyof PaymentDetail] as string | number ?? '';
    let bv: string | number = b[sortField as keyof PaymentDetail] as string | number ?? '';
    if (sortField === 'created_at') {
      av = a.timestamps.created_at ?? '';
      bv = b.timestamps.created_at ?? '';
    }
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <span className="w-4 inline-block" />;
    return sortDir === 'asc' ? <ChevronUp className="w-4 h-4 inline" /> : <ChevronDown className="w-4 h-4 inline" />;
  }

  if (loading) {
    return (
      <div className="rounded-lg border">
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="h-5 bg-muted rounded w-48" />
              <div className="h-5 bg-muted rounded w-20" />
              <div className="h-5 bg-muted rounded w-16" />
              <div className="h-5 bg-muted rounded w-20 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="rounded-lg border p-12 text-center">
        <p className="text-muted-foreground">No se encontraron transacciones con los filtros actuales.</p>
        <Link href="/simulate" className="text-sm text-primary hover:underline mt-2 inline-block">
          Simular una transacción →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left p-3 font-medium cursor-pointer hover:text-foreground text-muted-foreground" onClick={() => toggleSort('payment_id')}>
                ID <SortIcon field="payment_id" />
              </th>
              <th className="text-left p-3 font-medium text-muted-foreground">
                Ruta
              </th>
              <th className="text-left p-3 font-medium cursor-pointer hover:text-foreground text-muted-foreground" onClick={() => toggleSort('amount')}>
                Monto <SortIcon field="amount" />
              </th>
              <th className="text-left p-3 font-medium cursor-pointer hover:text-foreground text-muted-foreground" onClick={() => toggleSort('status')}>
                Estado <SortIcon field="status" />
              </th>
              <th className="text-left p-3 font-medium cursor-pointer hover:text-foreground text-muted-foreground" onClick={() => toggleSort('created_at')}>
                Fecha <SortIcon field="created_at" />
              </th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {paginated.map((p, i) => {
              const status = STATUS_CONFIG[p.status];
              const origConf = RAIL_CONFIG[p.origin as keyof typeof RAIL_CONFIG];
              const destConf = RAIL_CONFIG[p.destination as keyof typeof RAIL_CONFIG];
              return (
                <tr key={p.payment_id} className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/10'}`}>
                  <td className="p-3 font-mono text-xs text-muted-foreground">
                    {p.payment_id.replace('PMT-', '')}
                  </td>
                  <td className="p-3">
                    <span className="flex items-center gap-1 text-sm">
                      <span title={origConf?.label}>{origConf?.flag ?? p.origin}</span>
                      <span className="text-muted-foreground">→</span>
                      <span title={destConf?.label}>{destConf?.flag ?? p.destination}</span>
                    </span>
                  </td>
                  <td className="p-3 font-mono text-sm">
                    {p.currency} {p.amount?.toFixed(2) ?? '—'}
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white ${status.color}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {p.timestamps.created_at
                      ? new Date(p.timestamps.created_at).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
                      : '—'
                    }
                  </td>
                  <td className="p-3">
                    <Link href={`/payments/${p.payment_id}`} className="text-muted-foreground hover:text-foreground">
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {sorted.length} transacciones — página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 rounded border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Anterior
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 rounded border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
