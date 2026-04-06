'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';

/* —— Tipos de respuesta (API) —— */

interface PaymentsBlock {
  total?: number;
  completed?: number;
  failed?: number;
  rejected?: number;
  success_rate?: number;
}

interface StageLatency {
  p50?: number;
  p95?: number;
  p99?: number;
  count?: number;
}

interface CircuitBreakerRow {
  service: string;
  state: string;
  failures?: number;
  lastFailureAt?: string | null;
}

interface RateLimitRow {
  rail: string;
  availableTokens?: number;
  maxTokens?: number;
  utilizationPct?: number;
}

interface RailMetrics {
  sent?: number;
  completed?: number;
  failed?: number;
  success_rate?: number;
  avg_latency?: number;
}

interface ReconciliationSummary {
  [key: string]: unknown;
}

interface StuckPayment {
  [key: string]: unknown;
}

interface AnomalyRow {
  [key: string]: unknown;
}

const POLL_MS = 10_000;

function formatNumber(n: number | undefined): string {
  if (n === undefined || Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('es-ES').format(n);
}

function formatMs(ms: number | undefined): string {
  if (ms === undefined || Number.isNaN(ms)) return '—';
  if (ms < 1000) return `${formatNumber(Math.round(ms))} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

/** success_rate puede venir como 0–1 o 0–100 */
function formatSuccessRate(rate: number | undefined): string {
  if (rate === undefined || Number.isNaN(rate)) return '—';
  const pct = rate <= 1 && rate >= 0 ? rate * 100 : rate;
  return `${pct.toFixed(1)} %`;
}

function breakerStyles(state: string): { dot: string; ring: string; label: string } {
  const s = state.toUpperCase().replace(/-/g, '_');
  if (s === 'CLOSED') {
    return {
      dot: 'bg-green-500',
      ring: 'border-green-500/40 bg-green-500/10',
      label: 'text-green-700 dark:text-green-400',
    };
  }
  if (s === 'OPEN') {
    return {
      dot: 'bg-red-500',
      ring: 'border-red-500/40 bg-red-500/10',
      label: 'text-red-700 dark:text-red-400',
    };
  }
  if (s === 'HALF_OPEN') {
    return {
      dot: 'bg-amber-400',
      ring: 'border-amber-500/40 bg-amber-500/10',
      label: 'text-amber-700 dark:text-amber-400',
    };
  }
  return {
    dot: 'bg-muted-foreground',
    ring: 'border-border bg-muted/50',
    label: 'text-muted-foreground',
  };
}

function utilizationBarColor(pct: number): string {
  if (pct < 70) return 'bg-green-500';
  if (pct < 90) return 'bg-amber-500';
  return 'bg-red-500';
}

function parseSummary(data: Record<string, unknown>): {
  payments: PaymentsBlock;
  byRail: Record<string, RailMetrics>;
} {
  const payments = (data.payments as PaymentsBlock) ?? {};
  const byRail = (data.by_rail as Record<string, RailMetrics> | undefined) ?? {};
  return { payments, byRail };
}

function parseLatency(data: Record<string, unknown>): Record<string, StageLatency> {
  const stages = data.stages as Record<string, StageLatency> | undefined;
  return stages && typeof stages === 'object' ? stages : {};
}

function parseBreakers(data: Record<string, unknown>): CircuitBreakerRow[] {
  const breakers = data.breakers;
  if (!Array.isArray(breakers)) return [];
  return breakers.map((b) => {
    const row = b as Record<string, unknown>;
    return {
      service: String(row.service ?? '—'),
      state: String(row.state ?? 'UNKNOWN'),
      failures: typeof row.failures === 'number' ? row.failures : undefined,
      lastFailureAt: row.lastFailureAt != null ? String(row.lastFailureAt) : null,
    };
  });
}

function parseRateLimits(data: Record<string, unknown>): RateLimitRow[] {
  const limits = data.limits;
  if (!Array.isArray(limits)) return [];
  return limits.map((l) => {
    const row = l as Record<string, unknown>;
    return {
      rail: String(row.rail ?? '—'),
      availableTokens: typeof row.availableTokens === 'number' ? row.availableTokens : undefined,
      maxTokens: typeof row.maxTokens === 'number' ? row.maxTokens : undefined,
      utilizationPct: typeof row.utilizationPct === 'number' ? row.utilizationPct : undefined,
    };
  });
}

export default function AnalyticsPage() {
  /** Primera carga o reintento explícito: mostrar «Cargando...» */
  const [bootstrapped, setBootstrapped] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [payments, setPayments] = useState<PaymentsBlock>({});
  const [byRail, setByRail] = useState<Record<string, RailMetrics>>({});
  const [stages, setStages] = useState<Record<string, StageLatency>>({});
  const [breakers, setBreakers] = useState<CircuitBreakerRow[]>([]);
  const [rateLimits, setRateLimits] = useState<RateLimitRow[]>([]);

  const [reconLoading, setReconLoading] = useState(false);
  const [reconError, setReconError] = useState<string | null>(null);
  const [reconSummary, setReconSummary] = useState<ReconciliationSummary | null>(null);
  const [stuckPayments, setStuckPayments] = useState<StuckPayment[]>([]);
  const [reconRailBreakdown, setReconRailBreakdown] = useState<Record<string, unknown> | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyRow[]>([]);
  const [reconLoaded, setReconLoaded] = useState(false);

  const loadAnalytics = useCallback(async (opts?: { resetUi?: boolean }) => {
    if (opts?.resetUi) setBootstrapped(false);
    setError(null);
    try {
      const [summaryRaw, latencyRaw, breakersRaw, limitsRaw] = await Promise.all([
        api.getAnalyticsSummary(),
        api.getAnalyticsLatency(),
        api.getCircuitBreakers(),
        api.getRateLimits(),
      ]);

      const s = parseSummary(summaryRaw);
      setPayments(s.payments);
      setByRail(s.byRail);
      setStages(parseLatency(latencyRaw));
      setBreakers(parseBreakers(breakersRaw));
      setRateLimits(parseRateLimits(limitsRaw));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar');
    } finally {
      setBootstrapped(true);
    }
  }, []);

  useEffect(() => {
    void loadAnalytics();
    const id = window.setInterval(() => {
      void loadAnalytics();
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [loadAnalytics]);

  async function runReconciliation() {
    setReconError(null);
    setReconLoading(true);
    try {
      const raw = await api.getReconciliation();
      setReconSummary((raw.summary as ReconciliationSummary) ?? {});
      const stuck = raw.stuck_payments;
      setStuckPayments(Array.isArray(stuck) ? (stuck as StuckPayment[]) : []);
      setReconRailBreakdown(
        raw.rail_breakdown && typeof raw.rail_breakdown === 'object'
          ? (raw.rail_breakdown as Record<string, unknown>)
          : null,
      );
      const anom = raw.anomalies;
      setAnomalies(Array.isArray(anom) ? (anom as AnomalyRow[]) : []);
      setReconLoaded(true);
    } catch (e) {
      setReconError(e instanceof Error ? e.message : 'Error al cargar');
    } finally {
      setReconLoading(false);
    }
  }

  const stageEntries = Object.entries(stages).sort(([a], [b]) => a.localeCompare(b));
  const railEntries = Object.entries(byRail).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Analítica del sistema</h1>
          <p className="text-muted-foreground mt-2">
            Métricas operativas, latencias, resiliencia y conciliación (actualización cada 10 s)
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadAnalytics({ resetUi: true })}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted/50"
        >
          <RefreshCw className="h-4 w-4" />
          Actualizar ahora
        </button>
      </div>

      {error && (
        <div
          className="flex flex-col gap-3 rounded-lg border border-red-500/30 bg-red-500/5 p-4 sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <div className="flex items-start gap-2 text-sm text-red-700 dark:text-red-400">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>Error al cargar: {error}</span>
          </div>
          <button
            type="button"
            onClick={() => void loadAnalytics({ resetUi: true })}
            className="rounded-md border border-red-500/40 bg-background px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-500/10 dark:text-red-400"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* 1. Resumen del sistema */}
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">Resumen del sistema</h2>
        <p className="text-sm text-muted-foreground mt-1">Pagos agregados y tasa de éxito</p>
        {!bootstrapped && !error ? (
          <p className="mt-6 text-sm text-muted-foreground">Cargando...</p>
        ) : (
          <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total pagos</dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                {formatNumber(payments.total)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Completados</dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums text-green-600 dark:text-green-400">
                {formatNumber(payments.completed)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Fallidos</dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums text-red-600 dark:text-red-400">
                {formatNumber(payments.failed)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Rechazados</dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums text-amber-700 dark:text-amber-400">
                {formatNumber(payments.rejected)}
              </dd>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tasa de éxito</dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                {formatSuccessRate(payments.success_rate)}
              </dd>
            </div>
          </dl>
        )}
      </section>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        {/* 2. Latencia por etapa */}
        <section className="rounded-lg border border-border bg-card p-6 shadow-sm xl:col-span-2">
          <h2 className="text-lg font-semibold text-foreground">Latencia por etapa del pipeline</h2>
          <p className="text-sm text-muted-foreground mt-1">Percentiles por etapa (P50 / P95 / P99)</p>
          {!bootstrapped && !error ? (
            <p className="mt-6 text-sm text-muted-foreground">Cargando...</p>
          ) : stageEntries.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">Sin datos de latencia.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Etapa</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">P50</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">P95</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">P99</th>
                    <th className="pb-3 font-medium text-muted-foreground">Muestras</th>
                  </tr>
                </thead>
                <tbody>
                  {stageEntries.map(([name, v]) => (
                    <tr key={name} className="border-b border-border/60 last:border-0">
                      <td className="py-3 pr-4 font-medium text-foreground">{name}</td>
                      <td className="py-3 pr-4 tabular-nums text-foreground">{formatMs(v.p50)}</td>
                      <td className="py-3 pr-4 tabular-nums text-foreground">{formatMs(v.p95)}</td>
                      <td className="py-3 pr-4 tabular-nums text-foreground">{formatMs(v.p99)}</td>
                      <td className="py-3 tabular-nums text-muted-foreground">{formatNumber(v.count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* 3. Circuit breakers */}
        <section className="rounded-lg border border-border bg-card p-6 shadow-sm xl:col-span-2">
          <h2 className="text-lg font-semibold text-foreground">Estado de circuit breakers</h2>
          <p className="text-sm text-muted-foreground mt-1">Por servicio / riel</p>
          {!bootstrapped && !error ? (
            <p className="mt-6 text-sm text-muted-foreground">Cargando...</p>
          ) : breakers.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">Sin circuit breakers configurados.</p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {breakers.map((b) => {
                const st = breakerStyles(b.state);
                return (
                  <div
                    key={b.service}
                    className={`rounded-lg border p-4 shadow-sm ${st.ring}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${st.dot}`} aria-hidden />
                      <span className="font-medium text-foreground truncate">{b.service}</span>
                    </div>
                    <p className={`mt-2 text-sm font-semibold uppercase tracking-wide ${st.label}`}>
                      {b.state.replace(/_/g, '-')}
                    </p>
                    <dl className="mt-3 space-y-1 text-xs text-muted-foreground">
                      <div className="flex justify-between gap-2">
                        <dt>Fallos</dt>
                        <dd className="tabular-nums text-foreground">{formatNumber(b.failures)}</dd>
                      </div>
                      {b.lastFailureAt && (
                        <div className="flex justify-between gap-2">
                          <dt>Último fallo</dt>
                          <dd className="text-right text-[11px]">{b.lastFailureAt}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 4. Rate limiter */}
        <section className="rounded-lg border border-border bg-card p-6 shadow-sm xl:col-span-2">
          <h2 className="text-lg font-semibold text-foreground">Limitador de tasa</h2>
          <p className="text-sm text-muted-foreground mt-1">Utilización por riel</p>
          {!bootstrapped && !error ? (
            <p className="mt-6 text-sm text-muted-foreground">Cargando...</p>
          ) : rateLimits.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">Sin datos de límites de tasa.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {rateLimits.map((r) => {
                const pct = Math.min(100, Math.max(0, r.utilizationPct ?? 0));
                return (
                  <li key={r.rail}>
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="font-medium text-foreground">{r.rail}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {pct.toFixed(0)} % — {formatNumber(r.availableTokens)} / {formatNumber(r.maxTokens)} tokens
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all ${utilizationBarColor(pct)}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* 5. Desglose por riel */}
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">Desglose por riel</h2>
        <p className="text-sm text-muted-foreground mt-1">Enviados, resultado y latencia media</p>
        {!bootstrapped && !error ? (
          <p className="mt-6 text-sm text-muted-foreground">Cargando...</p>
        ) : railEntries.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">Sin desglose por riel.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 pr-4 font-medium text-muted-foreground">Riel</th>
                  <th className="pb-3 pr-4 font-medium text-muted-foreground">Enviados</th>
                  <th className="pb-3 pr-4 font-medium text-muted-foreground">Completados</th>
                  <th className="pb-3 pr-4 font-medium text-muted-foreground">Fallidos</th>
                  <th className="pb-3 pr-4 font-medium text-muted-foreground">Tasa éxito</th>
                  <th className="pb-3 font-medium text-muted-foreground">Latencia media</th>
                </tr>
              </thead>
              <tbody>
                {railEntries.map(([rail, m]) => (
                  <tr key={rail} className="border-b border-border/60 last:border-0">
                    <td className="py-3 pr-4 font-medium text-foreground">{rail}</td>
                    <td className="py-3 pr-4 tabular-nums">{formatNumber(m.sent)}</td>
                    <td className="py-3 pr-4 tabular-nums text-green-600 dark:text-green-400">
                      {formatNumber(m.completed)}
                    </td>
                    <td className="py-3 pr-4 tabular-nums text-red-600 dark:text-red-400">
                      {formatNumber(m.failed)}
                    </td>
                    <td className="py-3 pr-4 tabular-nums">{formatSuccessRate(m.success_rate)}</td>
                    <td className="py-3 tabular-nums text-muted-foreground">{formatMs(m.avg_latency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 6. Conciliación */}
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Informe de conciliación</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Pagos atascados y anomalías detectadas en el backend
            </p>
          </div>
          <button
            type="button"
            disabled={reconLoading}
            onClick={() => void runReconciliation()}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted/50 disabled:opacity-60"
          >
            {reconLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Ejecutar conciliación
          </button>
        </div>

        {reconError && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400" role="alert">
            Error al cargar: {reconError}
          </p>
        )}

        {!reconLoaded && !reconLoading && !reconError && (
          <p className="mt-6 text-sm text-muted-foreground">
            Pulse «Ejecutar conciliación» para cargar el informe (no se actualiza automáticamente).
          </p>
        )}

        {reconLoading && (
          <p className="mt-6 text-sm text-muted-foreground">Cargando...</p>
        )}

        {reconLoaded && reconSummary && !reconLoading && (
          <div className="mt-6 space-y-6">
            {Object.keys(reconSummary).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground">Resumen</h3>
                <dl className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(reconSummary).map(([k, v]) => (
                    <div
                      key={k}
                      className="rounded-md border border-border bg-background/50 px-3 py-2 text-sm"
                    >
                      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{k}</dt>
                      <dd className="mt-1 font-medium text-foreground break-all">
                        {v === null || v === undefined
                          ? '—'
                          : typeof v === 'object'
                            ? JSON.stringify(v)
                            : String(v)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {reconRailBreakdown && Object.keys(reconRailBreakdown).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground">Desglose (conciliación)</h3>
                <pre className="mt-2 overflow-x-auto rounded-md border border-border bg-background/80 p-3 text-xs text-muted-foreground">
                  {JSON.stringify(reconRailBreakdown, null, 2)}
                </pre>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold text-foreground">Pagos atascados</h3>
              {stuckPayments.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">Ninguno.</p>
              ) : (
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        {Object.keys(stuckPayments[0] ?? {}).map((col) => (
                          <th key={col} className="pb-2 pr-3 font-medium text-muted-foreground">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {stuckPayments.map((row, i) => (
                        <tr key={i} className="border-b border-border/50">
                          {Object.values(row).map((cell, j) => (
                            <td key={j} className="py-2 pr-3 text-foreground">
                              {cell === null || cell === undefined
                                ? '—'
                                : typeof cell === 'object'
                                  ? JSON.stringify(cell)
                                  : String(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground">Anomalías</h3>
              {anomalies.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">Ninguna detectada.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {anomalies.map((a, i) => (
                    <li
                      key={i}
                      className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm text-foreground"
                    >
                      <pre className="whitespace-pre-wrap break-all font-mono text-xs">
                        {JSON.stringify(a, null, 2)}
                      </pre>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
