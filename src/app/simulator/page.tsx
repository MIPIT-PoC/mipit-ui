'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { toast } from 'sonner';
import { Loader2, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';

export type SimulatorRail = 'PIX' | 'SPEI' | 'BRE_B';

type MockConfigShape = {
  enabled: boolean;
  rejectionRate: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  forceRejectCode: string;
};

type RailMeta = {
  id: SimulatorRail;
  flag: string;
  label: string;
  codes: string[];
};

const RAILS: RailMeta[] = [
  {
    id: 'PIX',
    flag: '🇧🇷',
    label: 'PIX (Brasil)',
    codes: ['AM04', 'AC01', 'RR04', 'BE01', 'DS04'],
  },
  {
    id: 'SPEI',
    flag: '🇲🇽',
    label: 'SPEI (México)',
    codes: ['R01', 'R02', 'R03', 'R04', 'R08', 'LIM'],
  },
  {
    id: 'BRE_B',
    flag: '🇨🇴',
    label: 'Bre-B (Colombia)',
    codes: ['BREB001', 'BREB002', 'BREB003', 'BREB004', 'BREB005'],
  },
];

type RailSnapshot = {
  available: boolean;
  healthy: boolean;
  stats: {
    totalReceived: number;
    totalAccepted: number;
    totalRejected: number;
    totalTimeout: number;
  } | null;
  config: MockConfigShape | null;
  loading: boolean;
};

const emptySnapshot = (): RailSnapshot => ({
  available: true,
  healthy: false,
  stats: null,
  config: null,
  loading: true,
});

function isHealthyPayload(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  const status = (data as { status?: string }).status;
  return status === 'ok';
}

function parseStats(data: unknown): RailSnapshot['stats'] {
  if (!data || typeof data !== 'object') return null;
  const o = data as Record<string, unknown>;
  const n = (k: string) => (typeof o[k] === 'number' ? o[k] : 0);
  return {
    totalReceived: n('totalReceived'),
    totalAccepted: n('totalAccepted'),
    totalRejected: n('totalRejected'),
    totalTimeout: n('totalTimeout'),
  };
}

function parseConfig(data: unknown): MockConfigShape | null {
  if (!data || typeof data !== 'object') return null;
  const o = data as { config?: unknown };
  const c = o.config;
  if (!c || typeof c !== 'object') return null;
  const cfg = c as Record<string, unknown>;
  return {
    enabled: Boolean(cfg.enabled),
    rejectionRate:
      typeof cfg.rejectionRate === 'number'
        ? Math.max(0, Math.min(1, cfg.rejectionRate))
        : 0,
    minLatencyMs: typeof cfg.minLatencyMs === 'number' ? cfg.minLatencyMs : 0,
    maxLatencyMs: typeof cfg.maxLatencyMs === 'number' ? cfg.maxLatencyMs : 0,
    forceRejectCode: typeof cfg.forceRejectCode === 'string' ? cfg.forceRejectCode : '',
  };
}

const btnBase =
  'px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none';
const btnPrimary = `${btnBase} bg-primary text-primary-foreground hover:bg-primary/90`;
const btnDestructive = `${btnBase} bg-red-500 text-white hover:bg-red-600`;
const btnOutline = `${btnBase} border border-border bg-background hover:bg-muted/50`;

const inputClass =
  'w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

export default function SimulatorPage() {
  const [tab, setTab] = useState<string>('PIX');
  const [snapshots, setSnapshots] = useState<Record<SimulatorRail, RailSnapshot>>({
    PIX: emptySnapshot(),
    SPEI: emptySnapshot(),
    BRE_B: emptySnapshot(),
  });

  const refreshStatsHealth = useCallback(async (rail: SimulatorRail) => {
    let healthOk = false;
    let stats: RailSnapshot['stats'] = null;
    let available = true;

    try {
      const [h, s] = await Promise.all([api.getMockHealth(rail), api.getMockStats(rail)]);
      healthOk = isHealthyPayload(h);
      stats = parseStats(s);
    } catch {
      available = false;
      healthOk = false;
      stats = null;
    }

    setSnapshots(prev => ({
      ...prev,
      [rail]: {
        ...prev[rail],
        available,
        healthy: available && healthOk,
        stats,
        loading: false,
      },
    }));
  }, []);

  const loadFullRail = useCallback(
    async (rail: SimulatorRail) => {
      setSnapshots(prev => ({
        ...prev,
        [rail]: { ...prev[rail], loading: true },
      }));

      let healthOk = false;
      let stats: RailSnapshot['stats'] = null;
      let config: MockConfigShape | null = null;
      let available = true;

      try {
        const [h, s, cfgRes] = await Promise.all([
          api.getMockHealth(rail),
          api.getMockStats(rail),
          api.getMockConfig(rail),
        ]);
        healthOk = isHealthyPayload(h);
        stats = parseStats(s);
        config = parseConfig(cfgRes);
      } catch {
        available = false;
        healthOk = false;
        stats = null;
        config = null;
      }

      setSnapshots(prev => ({
        ...prev,
        [rail]: {
          available,
          healthy: available && healthOk,
          stats,
          config,
          loading: false,
        },
      }));
    },
    [],
  );

  useEffect(() => {
    RAILS.forEach(r => {
      void loadFullRail(r.id);
    });
  }, [loadFullRail]);

  useEffect(() => {
    const id = window.setInterval(() => {
      RAILS.forEach(r => {
        void refreshStatsHealth(r.id);
      });
    }, 5000);
    return () => window.clearInterval(id);
  }, [refreshStatsHealth]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Simulador bancario</h1>
        <p className="text-muted-foreground mt-2">
          Panel de control unificado para los mocks PIX, SPEI y Bre-B
        </p>
      </div>

      <Tabs.Root value={tab} onValueChange={setTab}>
        <Tabs.List
          className="flex flex-wrap gap-2 border-b border-border pb-3"
          aria-label="Rieles de simulación"
        >
          {RAILS.map(r => (
            <Tabs.Trigger
              key={r.id}
              value={r.id}
              className="inline-flex items-center gap-2 rounded-md border border-transparent px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-border data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <span aria-hidden>{r.flag}</span>
              {r.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {RAILS.map(r => (
          <Tabs.Content key={r.id} value={r.id} className="mt-6 outline-none">
            <RailPanel
              meta={r}
              snapshot={snapshots[r.id]}
              onReload={() => void loadFullRail(r.id)}
              onConfigUpdated={cfg =>
                setSnapshots(prev => ({
                  ...prev,
                  [r.id]: { ...prev[r.id], config: cfg },
                }))
              }
            />
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </div>
  );
}

function RailPanel({
  meta,
  snapshot,
  onReload,
  onConfigUpdated,
}: {
  meta: RailMeta;
  snapshot: RailSnapshot;
  onReload: () => void;
  onConfigUpdated: (c: MockConfigShape) => void;
}) {
  const { id: rail } = meta;
  const rejectDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [rejectPct, setRejectPct] = useState(0);
  const [latMin, setLatMin] = useState(0);
  const [latMax, setLatMax] = useState(0);
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (rejectDebounceRef.current) clearTimeout(rejectDebounceRef.current);
    };
  }, []);

  useEffect(() => {
    if (snapshot.config) {
      setRejectPct(Math.round(snapshot.config.rejectionRate * 100));
      setLatMin(snapshot.config.minLatencyMs);
      setLatMax(snapshot.config.maxLatencyMs);
    }
  }, [snapshot.config]);

  const pushConfig = useCallback(
    async (partial: Partial<MockConfigShape>) => {
      if (!snapshot.config) return;
      const next: MockConfigShape = { ...snapshot.config, ...partial };
      setPending('config');
      try {
        const res = await api.updateMockConfig(rail, partial as Record<string, unknown>);
        const parsed = parseConfig(res);
        if (parsed) onConfigUpdated(parsed);
        else onConfigUpdated(next);
      } catch (e) {
        toast.error('No se pudo actualizar la configuración', {
          description: e instanceof Error ? e.message : 'Error desconocido',
        });
        void onReload();
      } finally {
        setPending(null);
      }
    },
    [onConfigUpdated, onReload, rail, snapshot.config],
  );

  const onRejectSlider = (pct: number) => {
    setRejectPct(pct);
    if (rejectDebounceRef.current) clearTimeout(rejectDebounceRef.current);
    rejectDebounceRef.current = setTimeout(() => {
      void pushConfig({ rejectionRate: pct / 100 });
    }, 400);
  };

  const handleEnabled = (enabled: boolean) => {
    void pushConfig({ enabled });
  };

  const commitLatencies = (nextMin: number, nextMax: number) => {
    if (!snapshot.config) return;
    const a = Math.max(0, Math.floor(nextMin) || 0);
    const b = Math.max(0, Math.floor(nextMax) || 0);
    void pushConfig({ minLatencyMs: a, maxLatencyMs: Math.max(a, b) });
  };

  const handleCode = (forceRejectCode: string) => {
    void pushConfig({ forceRejectCode });
  };

  const runAction = async (
    label: string,
    fn: () => Promise<unknown>,
  ) => {
    setPending(label);
    try {
      await fn();
      toast.success('Acción completada');
      onReload();
    } catch (e) {
      toast.error('La acción falló', {
        description: e instanceof Error ? e.message : 'Error desconocido',
      });
    } finally {
      setPending(null);
    }
  };

  if (snapshot.loading && !snapshot.config && snapshot.available) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm flex items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Cargando simulador…
      </div>
    );
  }

  if (!snapshot.available) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-lg" aria-hidden>
              {meta.flag}
            </span>
            <h2 className="text-lg font-semibold text-foreground">{meta.label}</h2>
          </div>
          <span className="inline-flex items-center rounded-md border border-red-500/50 bg-red-500/10 px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400">
            No disponible
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          No se pudo conectar con el mock en el puerto configurado. Comprueba que el servidor esté
          en ejecución y que la URL en las variables de entorno sea correcta.
        </p>
        <button type="button" className={btnOutline} onClick={onReload}>
          <span className="inline-flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </span>
        </button>
      </div>
    );
  }

  const cfg = snapshot.config;
  const st = snapshot.stats;

  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-6 text-foreground">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden>
            {meta.flag}
          </span>
          <div>
            <h2 className="text-lg font-semibold">{meta.label}</h2>
            <p className="text-xs text-muted-foreground font-mono">{rail}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2" title="Estado del mock">
            <span
              className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                snapshot.healthy ? 'bg-emerald-500' : 'bg-red-500'
              }`}
              aria-hidden
            />
            <span className="text-sm text-muted-foreground">
              {snapshot.healthy ? 'En línea' : 'Fuera de servicio'}
            </span>
          </div>
          <button
            type="button"
            className={btnOutline}
            onClick={onReload}
            disabled={pending !== null}
          >
            <span className="inline-flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </span>
          </button>
        </div>
      </div>

      <section className="space-y-2">
        <h3 className="text-sm font-medium text-foreground">Estadísticas</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <StatBox label="Recibidos" value={st?.totalReceived ?? '—'} />
          <StatBox label="Aceptados" value={st?.totalAccepted ?? '—'} />
          <StatBox label="Rechazados" value={st?.totalRejected ?? '—'} />
          <StatBox label="Timeouts" value={st?.totalTimeout ?? '—'} />
        </div>
      </section>

      {cfg && (
        <section className="space-y-4 border-t border-border pt-6">
          <h3 className="text-sm font-medium">Configuración</h3>

          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">Mock habilitado</span>
            <button
              type="button"
              role="switch"
              aria-checked={cfg.enabled}
              disabled={pending !== null}
              onClick={() => handleEnabled(!cfg.enabled)}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                cfg.enabled ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`pointer-events-none block h-6 w-6 translate-x-0.5 rounded-full bg-background shadow ring-0 transition-transform ${
                  cfg.enabled ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tasa de rechazo</span>
              <span className="font-medium tabular-nums">{rejectPct}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={rejectPct}
              disabled={pending !== null}
              onChange={e => onRejectSlider(Number(e.target.value))}
              className="w-full accent-primary h-2"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Latencia mín. (ms)</span>
              <input
                type="number"
                min={0}
                className={inputClass}
                value={latMin}
                disabled={pending !== null}
                onChange={e => setLatMin(Number(e.target.value))}
                onBlur={() => commitLatencies(latMin, latMax)}
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Latencia máx. (ms)</span>
              <input
                type="number"
                min={0}
                className={inputClass}
                value={latMax}
                disabled={pending !== null}
                onChange={e => setLatMax(Number(e.target.value))}
                onBlur={() => commitLatencies(latMin, latMax)}
              />
            </label>
          </div>

          <label className="space-y-1 block">
            <span className="text-xs text-muted-foreground">Código de rechazo forzado</span>
            <select
              className={inputClass}
              value={cfg.forceRejectCode}
              disabled={pending !== null}
              onChange={e => handleCode(e.target.value)}
            >
              {meta.codes.map(code => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </label>
        </section>
      )}

      <section className="flex flex-wrap gap-3 border-t border-border pt-6">
        <button
          type="button"
          className={btnDestructive}
          disabled={pending !== null}
          onClick={() =>
            runAction('reject', () => api.forceRejectNext(rail))
          }
        >
          Rechazar siguiente
        </button>
        <button
          type="button"
          className={btnDestructive}
          disabled={pending !== null}
          onClick={() =>
            runAction('timeout', () => api.forceTimeoutNext(rail))
          }
        >
          Timeout siguiente
        </button>
        <button
          type="button"
          className={btnPrimary}
          disabled={pending !== null}
          onClick={() => {
            const ok = window.confirm(
              `¿Restablecer por completo el simulador ${meta.label}? Se borrarán estadísticas y la configuración volverá a los valores por defecto.`,
            );
            if (!ok) return;
            void runAction('reset', () => api.resetMock(rail));
          }}
        >
          Resetear
        </button>
      </section>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border border-border bg-background/80 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}
