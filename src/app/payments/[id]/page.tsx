import { api } from '@/lib/api';
import { FlowTimeline } from '@/components/payments/flow-timeline';
import { MessageInspector } from '@/components/payments/message-inspector';
import { PaymentStatusBadge } from '@/components/payments/payment-status-badge';
import { RailAckPanel } from '@/components/payments/rail-ack-panel';
import { RAIL_CONFIG } from '@/lib/constants';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PaymentDetailPage({ params }: Props) {
  const { id } = await params;
  const payment = await api.getPayment(id);

  const origConf = RAIL_CONFIG[payment.origin as keyof typeof RAIL_CONFIG];
  const destConf = RAIL_CONFIG[payment.destination as keyof typeof RAIL_CONFIG];

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
          </div>
          <p className="text-muted-foreground mt-1">
            <span title={origConf?.label}>{origConf?.flag}</span>
            {' '}{payment.origin}{' '}→{' '}
            <span title={destConf?.label}>{destConf?.flag}</span>
            {' '}{payment.destination}
            {payment.amount && (
              <span className="ml-3 font-mono">
                {payment.currency} {payment.amount.toFixed(2)}
              </span>
            )}
          </p>
        </div>
      </div>

      <FlowTimeline currentStatus={payment.status} timestamps={payment.timestamps} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MessageInspector
            original={payment.original}
            canonical={payment.canonical}
            translated={payment.translated}
          />
        </div>
        <div className="space-y-4">
          <RailAckPanel railAck={payment.rail_ack} destination={payment.destination} />

          {/* Timestamps detail */}
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
                    <span className="text-right font-mono">
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
