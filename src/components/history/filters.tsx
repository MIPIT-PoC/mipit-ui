'use client';

import type { PaymentStatus, Rail } from '@/lib/types';
import { STATUS_CONFIG, RAIL_CONFIG } from '@/lib/constants';
import { X } from 'lucide-react';

interface FiltersProps {
  status?: PaymentStatus;
  rail?: Rail;
  onStatusChange: (s: PaymentStatus | undefined) => void;
  onRailChange: (r: Rail | undefined) => void;
}

const RAIL_OPTIONS = Object.entries(RAIL_CONFIG) as [Rail, typeof RAIL_CONFIG.PIX][];
const STATUS_OPTIONS = Object.entries(STATUS_CONFIG) as [PaymentStatus, typeof STATUS_CONFIG.RECEIVED][];

export function Filters({ status, rail, onStatusChange, onRailChange }: FiltersProps) {
  const hasFilters = Boolean(status || rail);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border p-4">
      <span className="text-sm font-medium text-muted-foreground">Filtrar por:</span>

      {/* Rail filter */}
      <select
        value={rail ?? ''}
        onChange={e => onRailChange((e.target.value as Rail) || undefined)}
        className="text-sm border rounded-md px-3 py-1.5 bg-background hover:border-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">Todos los rieles</option>
        {RAIL_OPTIONS.map(([r, conf]) => (
          <option key={r} value={r}>{conf.flag} {conf.label}</option>
        ))}
      </select>

      {/* Status filter */}
      <select
        value={status ?? ''}
        onChange={e => onStatusChange((e.target.value as PaymentStatus) || undefined)}
        className="text-sm border rounded-md px-3 py-1.5 bg-background hover:border-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">Todos los estados</option>
        {STATUS_OPTIONS.map(([s, conf]) => (
          <option key={s} value={s}>{conf.label}</option>
        ))}
      </select>

      {hasFilters && (
        <button
          onClick={() => { onStatusChange(undefined); onRailChange(undefined); }}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
          Limpiar
        </button>
      )}

      {hasFilters && (
        <div className="flex flex-wrap gap-2 ml-2">
          {rail && (
            <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
              {RAIL_CONFIG[rail as keyof typeof RAIL_CONFIG]?.flag} {RAIL_CONFIG[rail as keyof typeof RAIL_CONFIG]?.label}
              <button onClick={() => onRailChange(undefined)}><X className="w-3 h-3" /></button>
            </span>
          )}
          {status && (
            <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
              {STATUS_CONFIG[status].label}
              <button onClick={() => onStatusChange(undefined)}><X className="w-3 h-3" /></button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
