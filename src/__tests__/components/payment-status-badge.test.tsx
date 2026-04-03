import { render, screen } from '@testing-library/react';
import { PaymentStatusBadge } from '@/components/payments/payment-status-badge';
import { STATUS_CONFIG } from '@/lib/constants';
import type { PaymentStatus } from '@/lib/types';

describe('PaymentStatusBadge', () => {
  it('renders COMPLETED status with correct label', () => {
    render(<PaymentStatusBadge status="COMPLETED" />);
    expect(screen.getByText('Completado')).toBeInTheDocument();
  });

  it('renders FAILED status with correct label', () => {
    render(<PaymentStatusBadge status="FAILED" />);
    expect(screen.getByText('Fallido')).toBeInTheDocument();
  });

  it('renders RECEIVED status with correct label', () => {
    render(<PaymentStatusBadge status="RECEIVED" />);
    expect(screen.getByText('Recibido')).toBeInTheDocument();
  });

  it('renders DUPLICATE status with correct label', () => {
    render(<PaymentStatusBadge status="DUPLICATE" />);
    expect(screen.getByText('Duplicado')).toBeInTheDocument();
  });

  const statuses: PaymentStatus[] = [
    'RECEIVED', 'VALIDATED', 'CANONICALIZED', 'ROUTED', 'QUEUED',
    'SENT_TO_DESTINATION', 'ACKED_BY_RAIL', 'COMPLETED',
    'FAILED', 'REJECTED', 'DUPLICATE',
  ];

  statuses.forEach(status => {
    it(`renders correct label for ${status}`, () => {
      render(<PaymentStatusBadge status={status} />);
      expect(screen.getByText(STATUS_CONFIG[status].label)).toBeInTheDocument();
    });
  });

  it('applies the correct CSS color class for COMPLETED', () => {
    const { container } = render(<PaymentStatusBadge status="COMPLETED" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('bg-green-500');
  });

  it('applies the correct CSS color class for FAILED', () => {
    const { container } = render(<PaymentStatusBadge status="FAILED" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('bg-red-500');
  });
});
