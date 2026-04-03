'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { PaymentDetail } from '@/lib/types';

interface Stat {
  title: string;
  value: string;
  subtitle?: string;
  color?: string;
}

function StatCard({ title, value, subtitle, color = 'text-foreground' }: Stat) {
  return (
    <div className="rounded-lg border p-6 space-y-2">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

export function StatsCards() {
  const [payments, setPayments] = useState<PaymentDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listPayments({ limit: 100 })
      .then(setPayments)
      .catch(() => setPayments([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg border p-6 space-y-2 animate-pulse">
            <div className="h-4 bg-muted rounded w-24" />
            <div className="h-8 bg-muted rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  const total = payments.length;
  const completed = payments.filter(p => p.status === 'COMPLETED').length;
  const failed = payments.filter(p => ['FAILED', 'REJECTED'].includes(p.status)).length;
  const successRate = total > 0 ? ((completed / total) * 100).toFixed(1) : '—';

  const stats: Stat[] = [
    { title: 'Total Pagos', value: total.toString(), subtitle: 'Todas las transacciones' },
    {
      title: 'Completados',
      value: completed.toString(),
      subtitle: `${successRate}% éxito`,
      color: 'text-green-600',
    },
    {
      title: 'Fallidos/Rechazados',
      value: failed.toString(),
      subtitle: total > 0 ? `${((failed / total) * 100).toFixed(1)}% error` : undefined,
      color: failed > 0 ? 'text-red-600' : 'text-foreground',
    },
    {
      title: 'Rails Activos',
      value: new Set(payments.map(p => p.origin)).size.toString(),
      subtitle: 'Formatos en uso',
      color: 'text-blue-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </div>
  );
}
