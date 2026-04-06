'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { STATUS_CONFIG, RAIL_CONFIG } from '@/lib/constants';
import type { PaymentDetail } from '@/lib/types';

function formatTimeAgo(iso: string): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return `hace ${sec}s`;
  if (sec < 3600) return `hace ${Math.floor(sec / 60)}m`;
  if (sec < 86400) return `hace ${Math.floor(sec / 3600)}h`;
  return `hace ${Math.floor(sec / 86400)}d`;
}

export function RecentPayments() {
  const [payments, setPayments] = useState<PaymentDetail[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    api.listPayments({ limit: 10 })
      .then(setPayments)
      .catch(() => setPayments([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 15_000);
    return () => clearInterval(id);
  }, [load]);

  return (
    <div className="rounded-lg border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Últimos Pagos</h3>
        <Link href="/history" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          Ver todos →
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="h-4 bg-muted rounded w-32" />
              <div className="h-4 bg-muted rounded w-20 ml-auto" />
            </div>
          ))}
        </div>
      ) : payments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No hay transacciones registradas
        </p>
      ) : (
        <div className="space-y-2">
          {payments.map((p) => {
            const statusConf = STATUS_CONFIG[p.status];
            const originConf = RAIL_CONFIG[p.origin_rail as keyof typeof RAIL_CONFIG];
            const destConf = RAIL_CONFIG[(p.destination_rail ?? '') as keyof typeof RAIL_CONFIG];
            return (
              <Link
                key={p.payment_id}
                href={`/payments/${p.payment_id}`}
                className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors gap-4"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base" title={originConf?.label}>
                    {originConf?.flag ?? '?'}
                  </span>
                  <span className="text-muted-foreground text-xs">→</span>
                  <span className="text-base" title={destConf?.label}>
                    {destConf?.flag ?? '?'}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground truncate">
                    {p.payment_id.replace('PMT-', '')}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {p.amount && (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {p.currency} {Number(p.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  )}
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white ${statusConf.color}`}>
                    {statusConf.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground/70 tabular-nums w-14 text-right">
                    {p.timestamps?.created_at ? formatTimeAgo(p.timestamps.created_at) : ''}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
