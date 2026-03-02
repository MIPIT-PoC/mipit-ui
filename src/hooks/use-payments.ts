'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { PaymentDetail } from '@/lib/types';

interface UsePaymentsParams {
  status?: string;
  rail?: string;
  limit?: number;
}

export function usePayments(params?: UsePaymentsParams) {
  const [payments, setPayments] = useState<PaymentDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchPayments() {
      try {
        setLoading(true);
        const data = await api.listPayments(params);
        if (!cancelled) setPayments(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPayments();
    return () => { cancelled = true; };
  }, [params?.status, params?.rail, params?.limit]);

  return { payments, loading, error };
}
