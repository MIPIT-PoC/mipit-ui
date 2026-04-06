'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { RefreshCw } from 'lucide-react';

interface ServiceStatus {
  name: string;
  url: string;
  status: 'ok' | 'error' | 'loading';
  latency?: number;
  uptime?: number;
}

const SERVICES: Array<{ name: string; url: string }> = [
  { name: 'mipit-core', url: '' },
  { name: 'PIX Adapter', url: `${process.env.NEXT_PUBLIC_PIX_HEALTH_URL ?? 'http://localhost:9101'}/health` },
  { name: 'SPEI Adapter', url: `${process.env.NEXT_PUBLIC_SPEI_HEALTH_URL ?? 'http://localhost:9102'}/health` },
  { name: 'BRE-B Adapter', url: `${process.env.NEXT_PUBLIC_BREB_HEALTH_URL ?? 'http://localhost:9103'}/health` },
];

function StatusDot({ status }: { status: ServiceStatus['status'] }) {
  if (status === 'ok') {
    return (
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-40 animate-ping" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
      </span>
    );
  }
  if (status === 'loading') {
    return <span className="inline-block w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse" />;
  }
  return <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" />;
}

export function ServiceHealth() {
  const [services, setServices] = useState<ServiceStatus[]>(
    SERVICES.map(s => ({ ...s, status: 'loading' as const })),
  );

  const checkHealth = useCallback(async () => {
    const checks = [
      api.getHealth()
        .then(data => ({ name: 'mipit-core', url: '', status: 'ok' as const, uptime: data.uptime }))
        .catch(() => ({ name: 'mipit-core', url: '', status: 'error' as const })),
      ...SERVICES.slice(1).map(s =>
        fetch(s.url, { signal: AbortSignal.timeout(3000) })
          .then(r => ({ name: s.name, url: s.url, status: r.ok ? 'ok' as const : 'error' as const }))
          .catch(() => ({ name: s.name, url: s.url, status: 'error' as const }))
      ),
    ];

    const results = await Promise.all(checks);
    setServices(results.map((r, i) => ({ ...SERVICES[i], ...r })));
  }, []);

  useEffect(() => {
    checkHealth();
    const id = setInterval(checkHealth, 10_000);
    return () => clearInterval(id);
  }, [checkHealth]);

  const okCount = services.filter(s => s.status === 'ok').length;
  const anyLoading = services.some(s => s.status === 'loading');

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Estado de Servicios</h3>
        <div className="flex items-center gap-2">
          {!anyLoading && (
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              okCount === SERVICES.length
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {okCount === SERVICES.length ? 'Todos OK' : `${okCount}/${SERVICES.length} activos`}
            </span>
          )}
          <button
            type="button"
            onClick={() => void checkHealth()}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            title="Verificar servicios"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {services.map((svc) => (
          <div key={svc.name} className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2.5">
              <StatusDot status={svc.status} />
              <span className="text-sm font-medium">{svc.name}</span>
            </div>
            <div className="flex items-center gap-3">
              {svc.uptime !== undefined && (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {Math.floor(svc.uptime / 60)}m uptime
                </span>
              )}
              <span className={`text-xs font-medium ${
                svc.status === 'ok' ? 'text-green-600 dark:text-green-400'
                : svc.status === 'error' ? 'text-red-600 dark:text-red-400'
                : 'text-yellow-600'
              }`}>
                {svc.status === 'ok' ? 'Operativo' : svc.status === 'error' ? 'Caído' : 'Verificando…'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t">
        <p className="text-xs text-muted-foreground">
          7 rails soportados: PIX · SPEI · SWIFT MT103 · ISO 20022 MX · ACH NACHA · FedNow · Bre-B
        </p>
      </div>
    </div>
  );
}
