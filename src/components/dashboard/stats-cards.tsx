'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { TrendingUp, TrendingDown, Activity, Globe } from 'lucide-react';
import type { PaymentDetail } from '@/lib/types';

interface Stat {
  title: string;
  value: string;
  subtitle?: string;
  color?: string;
  icon: React.ReactNode;
}

function StatCard({ title, value, subtitle, color = 'text-foreground', icon }: Stat) {
  return (
    <div className="rounded-lg border bg-card p-5 space-y-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="text-muted-foreground/60">{icon}</div>
      </div>
      <p className={`text-3xl font-bold tabular-nums ${color}`}>{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

export function StatsCards() {
  const [payments, setPayments] = useState<PaymentDetail[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPayments = useCallback(() => {
    api.listPayments({ limit: 200 })
      .then(setPayments)
      .catch(() => setPayments([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadPayments();
    const id = setInterval(loadPayments, 15_000);
    return () => clearInterval(id);
  }, [loadPayments]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg border p-5 space-y-3 animate-pulse bg-card shadow-sm">
            <div className="h-4 bg-muted rounded w-24" />
            <div className="h-9 bg-muted rounded w-16" />
            <div className="h-3 bg-muted rounded w-20" />
          </div>
        ))}
      </div>
    );
  }

  const total = payments.length;
  const completed = payments.filter(p => p.status === 'COMPLETED').length;
  const failed = payments.filter(p => ['FAILED', 'REJECTED'].includes(p.status)).length;
  const successRate = total > 0 ? ((completed / total) * 100).toFixed(1) : '—';
  const activeRails = new Set(payments.map(p => p.origin_rail).filter(Boolean)).size;

  const stats: Stat[] = [
    {
      title: 'Total Pagos',
      value: total.toString(),
      subtitle: 'Todas las transacciones',
      icon: <Activity className="w-5 h-5" />,
    },
    {
      title: 'Completados',
      value: completed.toString(),
      subtitle: `${successRate}% tasa de éxito`,
      color: 'text-green-600',
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      title: 'Fallidos / Rechazados',
      value: failed.toString(),
      subtitle: total > 0 ? `${((failed / total) * 100).toFixed(1)}% tasa de error` : 'Sin errores',
      color: failed > 0 ? 'text-red-600' : 'text-foreground',
      icon: <TrendingDown className="w-5 h-5" />,
    },
    {
      title: 'Rails Activos',
      value: activeRails.toString(),
      subtitle: `de 7 rails soportados`,
      color: 'text-blue-600',
      icon: <Globe className="w-5 h-5" />,
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
