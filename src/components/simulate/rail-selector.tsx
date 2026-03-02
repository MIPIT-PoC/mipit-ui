'use client';

import { RAIL_CONFIG } from '@/lib/constants';
import type { Rail } from '@/lib/types';

interface Props {
  label: string;
  value: Rail;
  onChange: (rail: Rail) => void;
}

export function RailSelector({ label, value, onChange }: Props) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      <div className="flex gap-3">
        {(Object.entries(RAIL_CONFIG) as [Rail, typeof RAIL_CONFIG.PIX][]).map(
          ([rail, config]) => (
            <button
              key={rail}
              type="button"
              onClick={() => onChange(rail)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                value === rail
                  ? 'border-primary bg-primary/10 font-semibold'
                  : 'border-border hover:border-muted-foreground/40'
              }`}
            >
              <span className="text-xl">{config.flag}</span>
              <span>{config.label}</span>
            </button>
          ),
        )}
      </div>
    </div>
  );
}
