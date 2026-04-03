import { renderHook, act } from '@testing-library/react';
import { useSimulate } from '@/hooks/use-simulate';
import { api } from '@/lib/api';

jest.mock('@/lib/api');

const mockApi = api as jest.Mocked<typeof api>;

describe('useSimulate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should start with idle state', () => {
    const { result } = renderHook(() => useSimulate());
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.result).toBeNull();
  });

  it('should call api.createPayment with correct payload', async () => {
    const mockPayment = { payment_id: 'PMT-AAAA0001234567890123', status: 'RECEIVED', received_at: '2023-06-01T12:00:00Z', destination: 'SPEI' };
    mockApi.createPayment.mockResolvedValueOnce(mockPayment as any);

    const { result } = renderHook(() => useSimulate());

    await act(async () => {
      await result.current.simulate({
        amount: 1500,
        currency: 'USD',
        debtor: { alias: 'PIX-test@email.com', name: 'João' },
        creditor: { alias: 'SPEI-012180000118359719', name: 'María' },
        purpose: 'P2P',
        reference: 'REF-001',
      });
    });

    expect(mockApi.createPayment).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 1500, currency: 'USD' }),
      expect.any(String),
    );
    expect(result.current.result).toEqual(mockPayment);
    expect(result.current.error).toBeNull();
  });

  it('should set loading to true during request', async () => {
    let resolvePromise!: (v: any) => void;
    mockApi.createPayment.mockImplementationOnce(() => new Promise(r => { resolvePromise = r; }));

    const { result } = renderHook(() => useSimulate());

    act(() => {
      result.current.simulate({ amount: 100, currency: 'USD', debtor: { alias: 'a' }, creditor: { alias: 'b' } });
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolvePromise({ payment_id: 'PMT-TEST', status: 'RECEIVED', received_at: '', destination: 'SPEI' });
    });

    expect(result.current.loading).toBe(false);
  });

  it('should set error state on API failure', async () => {
    mockApi.createPayment.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useSimulate());

    await act(async () => {
      try {
        await result.current.simulate({ amount: 100, currency: 'USD', debtor: { alias: 'a' }, creditor: { alias: 'b' } });
      } catch {
        // expected to throw
      }
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.loading).toBe(false);
    expect(result.current.result).toBeNull();
  });

  it('should generate unique idempotency key per request', async () => {
    const mockPayment = { payment_id: 'PMT-TEST', status: 'RECEIVED', received_at: '', destination: 'SPEI' };
    mockApi.createPayment.mockResolvedValue(mockPayment as any);

    const { result } = renderHook(() => useSimulate());

    const body = { amount: 100, currency: 'USD', debtor: { alias: 'a' }, creditor: { alias: 'b' } };

    await act(async () => { await result.current.simulate(body); });
    await act(async () => { await result.current.simulate(body); });

    const calls = mockApi.createPayment.mock.calls;
    const key1 = calls[0][1];
    const key2 = calls[1][1];
    expect(key1).not.toBe(key2);
  });
});
