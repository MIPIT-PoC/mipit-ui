import type { PaymentSummary } from '@/lib/types';

interface PaymentCardProps {
  payment: PaymentSummary;
}

export function PaymentCard({ payment }: PaymentCardProps) {
  // TODO: Card summary for a single payment (used in lists/grids)
  return (
    <div className="rounded-lg border p-4 space-y-2 hover:bg-muted/50 transition-colors">
      <h4 className="font-mono text-sm font-semibold">{payment.payment_id}</h4>
      <p className="text-sm text-muted-foreground">
        TODO: Payment card — {payment.status} — {payment.destination}
      </p>
    </div>
  );
}
