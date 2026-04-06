'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useSse } from '@/hooks/use-sse';
import { STATUS_CONFIG, RAIL_CONFIG } from '@/lib/constants';
import type { PaymentStatus, Rail } from '@/lib/types';
import type { PaymentEvent } from '@/hooks/use-sse';

function formatRelativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '—';
  const sec = Math.floor((Date.now() - t) / 1000);
  if (sec < 60) return `hace ${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `hace ${min}m`;
  const h = Math.floor(min / 60);
  return `hace ${h}h`;
}

function truncateId(id: string, len = 10): string {
  if (id.length <= len) return id;
  return `${id.slice(0, len)}…`;
}

function railFlag(rail: string | undefined): string {
  if (!rail) return '—';
  const key = rail as Rail;
  return RAIL_CONFIG[key]?.flag ?? '📡';
}

function statusBadgeClasses(status: string): string {
  const cfg = STATUS_CONFIG[status as PaymentStatus];
  if (cfg) return `${cfg.color} text-white`;
  return 'bg-muted text-muted-foreground';
}

function EventRow({ event }: { event: PaymentEvent }) {
  const cfg = STATUS_CONFIG[event.status as PaymentStatus];
  const label = cfg?.label ?? event.status;

  return (
    <article className="rounded-lg border bg-card p-4 text-foreground shadow-sm animate-[liveEventIn_0.35s_ease-out_forwards]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Link
            href={`/payments/${event.payment_id}`}
            className="font-mono text-sm font-medium text-primary hover:underline"
            title={event.payment_id}
          >
            {truncateId(event.payment_id)}
          </Link>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClasses(event.status)}`}
          >
            {label}
          </span>
        </div>
        <time className="shrink-0 text-xs text-muted-foreground" dateTime={event.timestamp}>
          {formatRelativeTime(event.timestamp)}
        </time>
      </div>

      <p className="mt-2 text-sm text-muted-foreground">
        <span title={event.origin_rail ?? ''}>
          {railFlag(event.origin_rail)} {event.origin_rail ?? '—'}
        </span>
        <span className="mx-2 text-foreground/40">→</span>
        <span title={event.destination_rail ?? ''}>
          {railFlag(event.destination_rail)} {event.destination_rail ?? '—'}
        </span>
      </p>

      {event.fx && (
        <p className="mt-2 text-sm">
          <span className="text-muted-foreground">FX:</span>{' '}
          <span className="font-medium">
            {event.fx.source_currency}/{event.fx.target_currency} @ {event.fx.rate}
          </span>
          <span className="text-muted-foreground"> · </span>
          <span>{event.fx.converted_amount.toLocaleString('es', { maximumFractionDigits: 2 })}</span>{' '}
          <span className="text-muted-foreground">{event.fx.target_currency}</span>
        </p>
      )}

      {event.latency_ms != null && (
        <p className="mt-1 text-sm text-muted-foreground">
          Latencia: <span className="font-medium text-foreground">{event.latency_ms} ms</span>
        </p>
      )}

      {event.error && (
        <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">{event.error}</p>
      )}
    </article>
  );
}

export default function LivePaymentTrackerPage() {
  const { events, connected, clearEvents } = useSse({ maxEvents: 100 });

  const statusCounts = useMemo(() => {
    let completed = 0;
    let failed = 0;
    let rejected = 0;
    for (const e of events) {
      if (e.status === 'COMPLETED') completed += 1;
      else if (e.status === 'FAILED') failed += 1;
      else if (e.status === 'REJECTED') rejected += 1;
    }
    return { completed, failed, rejected };
  }, [events]);

  const railCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const e of events) {
      if (e.origin_rail) m[e.origin_rail] = (m[e.origin_rail] ?? 0) + 1;
      if (e.destination_rail) m[e.destination_rail] = (m[e.destination_rail] ?? 0) + 1;
    }
    return m;
  }, [events]);

  const railEntries = useMemo(
    () => Object.entries(railCounts).sort((a, b) => b[1] - a[1]),
    [railCounts],
  );

  return (
    <>
      <style>{`
        @keyframes liveEventIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pagos en vivo</h1>
            <p className="mt-1 text-muted-foreground">
              Flujo de eventos del pipeline en tiempo real (SSE)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              {connected ? (
                <>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
                  </span>
                  <span className="font-medium text-green-600 dark:text-green-400">Conectado</span>
                </>
              ) : (
                <>
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  <span className="font-medium text-red-600 dark:text-red-400">Desconectado</span>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={clearEvents}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Limpiar
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px] lg:items-start">
          <section className="min-h-0 space-y-3">
            <h2 className="text-lg font-semibold">Feed en vivo</h2>
            <div className="max-h-[min(70vh,720px)] space-y-3 overflow-y-auto pr-1">
              {events.length === 0 ? (
                <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
                  {connected
                    ? 'Esperando eventos de pago…'
                    : 'Sin conexión. Reintentando en unos segundos…'}
                </div>
              ) : (
                events.map((event) => (
                  <EventRow key={`${event.payment_id}-${event.timestamp}-${event.status}`} event={event} />
                ))
              )}
            </div>
          </section>

          <aside className="space-y-4 lg:sticky lg:top-20">
            <div className="rounded-lg border bg-card p-4">
              <h3 className="text-sm font-semibold text-foreground">Sesión</h3>
              <p className="mt-2 text-2xl font-bold tabular-nums">{events.length}</p>
              <p className="text-xs text-muted-foreground">eventos recibidos</p>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <h3 className="text-sm font-semibold text-foreground">Por estado</h3>
              <ul className="mt-3 space-y-2 text-sm">
                <li className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Completados</span>
                  <span className="font-medium tabular-nums text-green-600 dark:text-green-400">
                    {statusCounts.completed}
                  </span>
                </li>
                <li className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Fallidos</span>
                  <span className="font-medium tabular-nums text-red-600 dark:text-red-400">
                    {statusCounts.failed}
                  </span>
                </li>
                <li className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Rechazados</span>
                  <span className="font-medium tabular-nums text-amber-600 dark:text-amber-400">
                    {statusCounts.rejected}
                  </span>
                </li>
              </ul>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <h3 className="text-sm font-semibold text-foreground">Por riel</h3>
              {railEntries.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">Sin datos aún</p>
              ) : (
                <ul className="mt-3 space-y-2 text-sm">
                  {railEntries.map(([rail, count]) => (
                    <li key={rail} className="flex justify-between gap-2">
                      <span className="text-muted-foreground">
                        {railFlag(rail)} {rail}
                      </span>
                      <span className="font-medium tabular-nums">{count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
