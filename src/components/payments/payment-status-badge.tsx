import { STATUS_CONFIG } from '@/lib/constants';
import type { PaymentStatus } from '@/lib/types';

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  // W5.6 — fall back to a neutral badge if the status was added on the backend
  // without bumping the UI enum. Prevents the page from crashing on an unknown
  // status (e.g. an old payment with a status that has since been retired).
  const config = STATUS_CONFIG[status] ?? { label: status, color: 'bg-slate-500', step: 0 };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${config.color}`}>
      {config.label}
    </span>
  );
}
