'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { PaymentDetail } from '@/lib/types';

export function usePayment(id: string) {
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchPayment() {
      try {
        setLoading(true);
        const data = await api.getPayment(id);
        if (!cancelled) setPayment(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPayment();
    return () => { cancelled = true; };
  }, [id]);

  return { payment, loading, error };
}
