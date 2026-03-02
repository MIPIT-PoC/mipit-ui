import { STATUS_CONFIG } from '@/lib/constants';
import type { PaymentStatus } from '@/lib/types';

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  // TODO: Style with proper badge component from shadcn/ui
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${config.color}`}>
      {config.label}
    </span>
  );
}
