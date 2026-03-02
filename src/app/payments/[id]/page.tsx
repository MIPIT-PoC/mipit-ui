import { api } from '@/lib/api';
import { FlowTimeline } from '@/components/payments/flow-timeline';
import { MessageInspector } from '@/components/payments/message-inspector';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PaymentDetailPage({ params }: Props) {
  const { id } = await params;
  const payment = await api.getPayment(id);

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-mono">{payment.payment_id}</h1>
          <p className="text-muted-foreground">
            {payment.origin} → {payment.destination}
          </p>
        </div>
        {/* TODO: Status badge */}
      </div>

      <FlowTimeline currentStatus={payment.status} timestamps={payment.timestamps} />

      <MessageInspector
        original={payment.original}
        canonical={payment.canonical}
        translated={payment.translated}
      />

      {/* TODO: Rail ACK panel */}
      {/* TODO: Timestamps detail */}
    </div>
  );
}
