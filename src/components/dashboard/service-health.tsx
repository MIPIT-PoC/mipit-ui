'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface ServiceStatus {
  name: string;
  url: string;
  status: 'ok' | 'error' | 'loading';
  latency?: number;
  uptime?: number;
}

const SERVICES: Array<{ name: string; url: string }> = [
  { name: 'mipit-core', url: '' },  // fetched via api.getHealth()
  { name: 'PIX Adapter', url: `${process.env.NEXT_PUBLIC_PIX_URL ?? 'http://localhost:8081'}/health` },
  { name: 'SPEI Adapter', url: `${process.env.NEXT_PUBLIC_SPEI_URL ?? 'http://localhost:8082'}/health` },
];

function StatusDot({ status }: { status: ServiceStatus['status'] }) {
  const colors = { ok: 'bg-green-500', error: 'bg-red-500', loading: 'bg-yellow-400 animate-pulse' };
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[status]}`} />;
}

export function ServiceHealth() {
  const [services, setServices] = useState<ServiceStatus[]>(
    SERVICES.map(s => ({ ...s, status: 'loading' as const })),
  );

  useEffect(() => {
    const checks = [
      api.getHealth()
        .then(data => ({ name: 'mipit-core', url: '', status: 'ok' as const, uptime: data.uptime }))
        .catch(() => ({ name: 'mipit-core', url: '', status: 'error' as const })),
      ...SERVICES.slice(1).map(s =>
        fetch(s.url, { signal: AbortSignal.timeout(3000) })
          .then(r => ({ name: s.name, url: s.url, status: (r.ok ? 'ok' : 'error') as const }))
          .catch(() => ({ name: s.name, url: s.url, status: 'error' as const }))
      ),
    ];

    Promise.all(checks).then(results => {
      setServices(results.map((r, i) => ({ ...SERVICES[i], ...r })));
    });
  }, []);

  const allOk = services.every(s => s.status === 'ok');
  const anyLoading = services.some(s => s.status === 'loading');

  return (
    <div className="rounded-lg border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Estado de Servicios</h3>
        {!anyLoading && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${allOk ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {allOk ? 'Todos OK' : 'Degradado'}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {services.map((svc) => (
          <div key={svc.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusDot status={svc.status} />
              <span className="text-sm font-medium">{svc.name}</span>
            </div>
            <div className="flex items-center gap-2">
              {svc.uptime !== undefined && (
                <span className="text-xs text-muted-foreground">
                  {Math.floor(svc.uptime / 60)}m uptime
                </span>
              )}
              <span className={`text-xs ${svc.status === 'ok' ? 'text-green-600' : svc.status === 'error' ? 'text-red-600' : 'text-yellow-600'}`}>
                {svc.status === 'ok' ? 'Operativo' : svc.status === 'error' ? 'Error' : 'Verificando...'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2 border-t">
        <p className="text-xs text-muted-foreground">
          6 rails soportados: PIX · SPEI · SWIFT MT103 · ISO 20022 MX · ACH NACHA · FedNow
        </p>
      </div>
    </div>
  );
}
