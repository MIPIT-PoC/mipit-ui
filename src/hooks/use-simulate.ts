'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import type { CreatePaymentBody, PaymentSummary } from '@/lib/types';

export function useSimulate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PaymentSummary | null>(null);

  async function simulate(body: CreatePaymentBody) {
    try {
      setLoading(true);
      setError(null);
      const idempotencyKey = crypto.randomUUID();
      const data = await api.createPayment(body, idempotencyKey);
      setResult(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return { simulate, loading, error, result };
}
