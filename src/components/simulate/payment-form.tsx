'use client';

import type { Rail } from '@/lib/types';

interface PaymentFormProps {
  originRail: Rail;
  destRail: Rail;
}

export function PaymentForm({ originRail, destRail }: PaymentFormProps) {
  // TODO: Unified payment form that adapts fields based on selected rails
  return (
    <div className="space-y-4 rounded-lg border p-6">
      <h3 className="font-semibold">PaymentForm</h3>
      <p className="text-sm text-muted-foreground">
        TODO: Formulario unificado — {originRail} → {destRail}
      </p>
    </div>
  );
}
