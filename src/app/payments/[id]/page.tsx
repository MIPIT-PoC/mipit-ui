'use client';

import { useEffect, useState, use } from 'react';
import { api } from '@/lib/api';
import { FlowTimeline } from '@/components/payments/flow-timeline';
import { MessageInspector } from '@/components/payments/message-inspector';
import { PaymentStatusBadge } from '@/components/payments/payment-status-badge';
import { RailAckPanel } from '@/components/payments/rail-ack-panel';
import { RAIL_CONFIG, JAEGER_BASE_URL } from '@/lib/constants';
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

          {/* P11/P07 — Trazabilidad ISO 20022 + Jaeger link.
              Audit found trace_id was in the API but never surfaced in the UI,
              and UETR was missing entirely. */}
          {(payment.trace_id || payment.uetr || payment.end_to_end_id) && (
            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="font-semibold text-sm">Trazabilidad ISO 20022</h3>
              <div className="space-y-2 text-xs">
                {payment.uetr && (
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">UETR (UUIDv4)</span>
                    <code className="text-[10px] font-mono break-all">{payment.uetr}</code>
                  </div>
                )}
                {payment.end_to_end_id && (
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">EndToEndId</span>
                    <code className="text-[10px] font-mono break-all">{payment.end_to_end_id}</code>
                  </div>
                )}
                {payment.charge_bearer && (
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">ChrgBr</span>
                    <code className="font-mono">{payment.charge_bearer}</code>
                  </div>
                )}
                {payment.interbank_settlement_date && (
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">IntrBkSttlmDt</span>
                    <code className="font-mono">{payment.interbank_settlement_date}</code>
                  </div>
                )}
                {payment.trace_id && (
                  <div className="flex flex-col gap-1 pt-2 border-t">
                    <span className="text-muted-foreground">Trace ID (OpenTelemetry)</span>
                    <code className="text-[10px] font-mono break-all">{payment.trace_id}</code>
                    {/*
                       * W5.3 — Jaeger link via attribute search rather than /trace/<id>.
                       * Our trace_id is a ULID (request-scoped) attached as the
                       * span attribute `mipit.trace_id`; the underlying OTel
                       * span uses a different hex ID. /trace/<ULID> returns
                       * "Trace not found"; search-by-attribute does find it.
                       */}
                    <a
                      href={`${JAEGER_BASE_URL}/search?service=mipit-core&tags=${encodeURIComponent(JSON.stringify({ 'mipit.trace_id': payment.trace_id }))}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-blue-500 hover:underline text-xs mt-1"
                    >
                      Buscar en Jaeger ↗
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* P05 — FX breakdown visible when canonical had cross-currency. */}
          {payment.exchange_rate && (
            <div className="rounded-lg border p-4 space-y-2">
              <h3 className="font-semibold text-sm">Conversión FX (cross-border)</h3>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Instructed</span>
                  <code className="font-mono">{payment.instructed_amount} {payment.instructed_currency}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rate</span>
                  <code className="font-mono">{Number(payment.exchange_rate).toFixed(6)}</code>
                </div>
                <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                  <span>Settled</span>
                  <code className="font-mono">{payment.settlement_amount} {payment.settlement_currency}</code>
                </div>
              </div>
            </div>
          )}

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
