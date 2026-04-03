import { renderHook, waitFor } from '@testing-library/react';
import { usePayment } from '@/hooks/use-payment';
import { api } from '@/lib/api';

jest.mock('@/lib/api');
const mockApi = api as jest.Mocked<typeof api>;

const MOCK_PAYMENT = {
  payment_id: 'PMT-AAAA0001234567890123',
  status: 'COMPLETED' as const,
  origin: 'PIX' as const,
  destination: 'SPEI' as const,
  amount: 1500,
  currency: 'USD',
  original: {},
  canonical: {},
  translated: {},
  rail_ack: { status: 'ACCEPTED' as const, rail_tx_id: 'TX-001' },
  timestamps: { created_at: '2023-06-01T12:00:00Z', completed_at: '2023-06-01T12:00:05Z' },
};

describe('usePayment', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should start with loading state', () => {
    mockApi.getPayment.mockImplementation(() => new Promise(() => {}));
    const { result } = renderHook(() => usePayment('PMT-AAAA0001234567890123'));

    expect(result.current.loading).toBe(true);
    expect(result.current.payment).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should fetch and return payment data', async () => {
    mockApi.getPayment.mockResolvedValueOnce(MOCK_PAYMENT);
    const { result } = renderHook(() => usePayment('PMT-AAAA0001234567890123'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.payment).toEqual(MOCK_PAYMENT);
    expect(result.current.error).toBeNull();
    expect(mockApi.getPayment).toHaveBeenCalledWith('PMT-AAAA0001234567890123');
  });

  it('should set error state on API failure', async () => {
    mockApi.getPayment.mockRejectedValueOnce(new Error('Payment not found'));
    const { result } = renderHook(() => usePayment('PMT-INVALID'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Payment not found');
    expect(result.current.payment).toBeNull();
  });

  it('should re-fetch when id changes', async () => {
    mockApi.getPayment.mockResolvedValue(MOCK_PAYMENT);

    const { result, rerender } = renderHook(({ id }) => usePayment(id), {
      initialProps: { id: 'PMT-AAAA0001234567890123' },
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockApi.getPayment).toHaveBeenCalledTimes(1);

    rerender({ id: 'PMT-BBBB0001234567890123' });
    await waitFor(() => expect(mockApi.getPayment).toHaveBeenCalledTimes(2));
    expect(mockApi.getPayment).toHaveBeenLastCalledWith('PMT-BBBB0001234567890123');
  });
});
