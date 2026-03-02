import type { PaymentDetail } from '@/lib/types';

interface RailAckPanelProps {
  railAck: PaymentDetail['rail_ack'];
}

export function RailAckPanel({ railAck }: RailAckPanelProps) {
  // TODO: Display rail acknowledgement details (tx ID, status, errors)
  return (
    <div className="rounded-lg border p-6 space-y-4">
      <h3 className="font-semibold">RailAckPanel</h3>
      <p className="text-sm text-muted-foreground">
        TODO: Panel de respuesta del riel destino
      </p>
      {railAck && (
        <pre className="text-xs bg-muted p-3 rounded font-mono">
          {JSON.stringify(railAck, null, 2)}
        </pre>
      )}
    </div>
  );
}
