import type { PaymentSummary, PaymentDetail, CreatePaymentBody } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message ?? `API error ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  createPayment: (body: CreatePaymentBody, idempotencyKey?: string) =>
    apiFetch<PaymentSummary>('/payments', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
    }),

  getPayment: (id: string) =>
    apiFetch<PaymentDetail>(`/payments/${id}`),

  listPayments: (params?: { status?: string; rail?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.rail) query.set('rail', params.rail);
    if (params?.limit) query.set('limit', String(params.limit));
    return apiFetch<PaymentDetail[]>(`/payments?${query.toString()}`);
  },

  getHealth: () => apiFetch<{ status: string; uptime: number }>('/health'),
};
