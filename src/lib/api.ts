/**
 * @file api.ts
 * @description Thin fetch wrapper that injects a cached Bearer token from /auth/token and exposes typed methods for payments, translation preview, analytics, compensation and bank-mock administration endpoints of mipit-core.
 * @author Nicolás Calderón
 * @project MIPIT-PoC — Cross-border Instant Payments Middleware
 */

import type {
  PaymentSummary,
  PaymentDetail,
  CreatePaymentBody,
  TranslateRequest,
  TranslateResponse,
  TranslatePreviewResponse,
  Rail,
  RailMeta,
} from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api';

let _cachedToken: string | null = null;
let _tokenExpiresAt = 0;

async function getAuthToken(): Promise<string> {
  if (_cachedToken && Date.now() < _tokenExpiresAt) return _cachedToken;

  const res = await fetch(`${BASE_URL}/auth/token`);
  if (!res.ok) throw new Error('Failed to obtain auth token');
  const data = (await res.json()) as { access_token: string; expires_in: number };
  _cachedToken = data.access_token;
  _tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return _cachedToken;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAuthToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
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

  getAdapterHealth: (rail: string) =>
    apiFetch<Record<string, unknown>>(`/services/${rail}/health`),

  translate: (body: TranslateRequest) =>
    apiFetch<TranslateResponse>('/translate', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  translatePreview: (sourceRail: Rail, payload: Record<string, unknown>) =>
    apiFetch<TranslatePreviewResponse>('/translate/preview', {
      method: 'POST',
      body: JSON.stringify({ sourceRail, payload }),
    }),

  getRails: () =>
    apiFetch<{ rails: RailMeta[]; totalRails: number }>('/translate/rails'),

  // Analytics
  getAnalyticsSummary: () =>
    apiFetch<Record<string, unknown>>('/analytics/summary'),

  getAnalyticsLatency: () =>
    apiFetch<Record<string, unknown>>('/analytics/latency'),

  getCircuitBreakers: () =>
    apiFetch<Record<string, unknown>>('/analytics/circuit-breakers'),

  getRateLimits: () =>
    apiFetch<Record<string, unknown>>('/analytics/rate-limits'),

  getReconciliation: (hours?: number) =>
    apiFetch<Record<string, unknown>>(`/analytics/reconciliation${hours ? `?hours=${hours}` : ''}`),

  // Compensation
  compensatePayment: (paymentId: string) =>
    apiFetch<{ success: boolean; reason: string }>(`/compensate/${paymentId}`, { method: 'POST' }),

  compensateBatch: (limit?: number) =>
    apiFetch<{ processed: number; succeeded: number; failed: number }>('/compensate/batch', {
      method: 'POST',
      body: JSON.stringify({ limit: limit ?? 50 }),
    }),

  // Bank Simulator (direct calls to mock servers)
  getMockStats: (rail: string) =>
    apiFetch<Record<string, unknown>>(`/mocks/${rail}/admin/stats`),

  getMockConfig: (rail: string) =>
    apiFetch<Record<string, unknown>>(`/mocks/${rail}/admin/config`),

  updateMockConfig: (rail: string, config: Record<string, unknown>) =>
    apiFetch<Record<string, unknown>>(`/mocks/${rail}/admin/config`, {
      method: 'POST',
      body: JSON.stringify(config),
    }),

  forceRejectNext: (rail: string) =>
    apiFetch<Record<string, unknown>>(`/mocks/${rail}/admin/reject-next`, {
      method: 'POST',
    }),

  forceTimeoutNext: (rail: string) =>
    apiFetch<Record<string, unknown>>(`/mocks/${rail}/admin/timeout-next`, {
      method: 'POST',
    }),

  resetMock: (rail: string) =>
    apiFetch<Record<string, unknown>>(`/mocks/${rail}/admin/reset`, {
      method: 'POST',
    }),

  getMockHealth: (rail: string) =>
    apiFetch<Record<string, unknown>>(`/mocks/${rail}/health`),
};
