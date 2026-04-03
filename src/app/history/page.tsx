'use client';

import { useState } from 'react';
import { PaymentTable } from '@/components/history/payment-table';
import { Filters } from '@/components/history/filters';
import type { PaymentStatus, Rail } from '@/lib/types';

export default function HistoryPage() {
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | undefined>();
  const [railFilter, setRailFilter] = useState<Rail | undefined>();

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold">Historial de Transacciones</h1>
        <p className="text-muted-foreground mt-2">
          Consulta todas las transacciones procesadas por el sistema
        </p>
      </div>

      <Filters
        status={statusFilter}
        rail={railFilter}
        onStatusChange={setStatusFilter}
        onRailChange={setRailFilter}
      />

      <PaymentTable filters={{ status: statusFilter, rail: railFilter }} />
    </div>
  );
}
