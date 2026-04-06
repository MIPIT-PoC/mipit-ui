'use client';

import { useEffect, useState, use } from 'react';
import { api } from '@/lib/api';
import { FlowTimeline } from '@/components/payments/flow-timeline';
import { MessageInspector } from '@/components/payments/message-inspector';
import { PaymentStatusBadge } from '@/components/payments/payment-status-badge';
import { RailAckPanel } from '@/components/payments/rail-ack-panel';
import { RAIL_CONFIG } from '@/lib/constants';
import Link from 'next/link';
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import type { PaymentDetail } from '@/lib/types';

interface Props {
  params: Promise<{ id: string }>;
}

export default function PaymentDetailPage({ params }: Props) {
  const { id } = use(params);
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getPayment(id)
      .then((p) => { setPayment(p); setError(null); })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error desconocido'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-8 flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="max-w-6xl mx-auto p-8 space-y-4 text-center">
        <p className="text-red-600">{error ?? 'Pago no encontrado'}</p>
        <Link href="/history" className="text-sm text-primary hover:underline">Volver al historial</Link>
      </div>
    );
  }

  const origConf = RAIL_CONFIG[payment.origin_rail as keyof typeof RAIL_CONFIG];
  const destConf = RAIL_CONFIG[(payment.destination_rail ?? '') as keyof typeof RAIL_CONFIG];

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-8">
      <div className="flex items-center gap-3">
        <Link href="/history" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold font-mono">{payment.payment_id}</h1>
            <PaymentStatusBadge status={payment.status} />
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                api.getPayment(id)
                  .then((p) => { setPayment(p); setError(null); })
                  .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
                  .finally(() => setLoading(false));
              }}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              title="Actualizar"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <p className="text-muted-foreground mt-1">
            <span title={origConf?.label}>{origConf?.flag}</span>
            {' '}{payment.origin_rail}{' '}→{' '}
            <span title={destConf?.label}>{destConf?.flag}</span>
            {' '}{payment.destination_rail}
            {payment.amount && (
              <span className="ml-3 font-mono tabular-nums">
                {payment.currency} {Number(payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
          </p>
        </div>
      </div>

      <FlowTimeline currentStatus={payment.status} timestamps={payment.timestamps} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MessageInspector
            original={payment.original_payload ?? {}}
            canonical={payment.canonical_payload ?? {}}
            translated={payment.translated_payload ?? {}}
          />
        </div>
        <div className="space-y-4">
          <RailAckPanel railAck={payment.rail_ack ?? null} destination={payment.destination_rail ?? ''} />

          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="font-semibold text-sm">Marcas de Tiempo</h3>
            <div className="space-y-2 text-xs">
              {Object.entries(payment.timestamps)
                .filter(([, v]) => v)
                .map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-2">
                    <span className="text-muted-foreground font-mono">
                      {key.replace(/_at$/, '').replace(/_/g, ' ')}
                    </span>
                    <span className="text-right font-mono tabular-nums">
                      {new Date(value as string).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
