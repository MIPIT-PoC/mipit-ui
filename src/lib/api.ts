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

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

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

// Adapter mock URLs for the Bank Simulator Dashboard
const ADAPTER_URLS: Record<string, string> = {
  PIX: process.env.NEXT_PUBLIC_PIX_MOCK_URL ?? 'http://localhost:9001',
  SPEI: process.env.NEXT_PUBLIC_SPEI_MOCK_URL ?? 'http://localhost:9002',
  BRE_B: process.env.NEXT_PUBLIC_BREB_MOCK_URL ?? 'http://localhost:9003',
};

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
  getMockStats: async (rail: string) => {
    const url = ADAPTER_URLS[rail];
    if (!url) throw new Error(`No mock URL for rail: ${rail}`);
    const res = await fetch(`${url}/admin/stats`);
    if (!res.ok) throw new Error(`Stats ${res.status}`);
    return res.json();
  },

  getMockConfig: async (rail: string) => {
    const url = ADAPTER_URLS[rail];
    if (!url) throw new Error(`No mock URL for rail: ${rail}`);
    const res = await fetch(`${url}/admin/config`);
    if (!res.ok) throw new Error(`Config ${res.status}`);
    return res.json();
  },

  updateMockConfig: async (rail: string, config: Record<string, unknown>) => {
    const url = ADAPTER_URLS[rail];
    if (!url) throw new Error(`No mock URL for rail: ${rail}`);
    const res = await fetch(`${url}/admin/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error((err as { message?: string }).message ?? `Config update ${res.status}`);
    }
    return res.json();
  },

  forceRejectNext: async (rail: string) => {
    const url = ADAPTER_URLS[rail];
    if (!url) throw new Error(`No mock URL for rail: ${rail}`);
    const res = await fetch(`${url}/admin/reject-next`, { method: 'POST' });
    if (!res.ok) throw new Error(`reject-next ${res.status}`);
    return res.json();
  },

  forceTimeoutNext: async (rail: string) => {
    const url = ADAPTER_URLS[rail];
    if (!url) throw new Error(`No mock URL for rail: ${rail}`);
    const res = await fetch(`${url}/admin/timeout-next`, { method: 'POST' });
    if (!res.ok) throw new Error(`timeout-next ${res.status}`);
    return res.json();
  },

  resetMock: async (rail: string) => {
    const url = ADAPTER_URLS[rail];
    if (!url) throw new Error(`No mock URL for rail: ${rail}`);
    const res = await fetch(`${url}/admin/reset`, { method: 'POST' });
    if (!res.ok) throw new Error(`reset ${res.status}`);
    return res.json();
  },

  getMockHealth: async (rail: string) => {
    const url = ADAPTER_URLS[rail];
    if (!url) throw new Error(`No mock URL for rail: ${rail}`);
    const res = await fetch(`${url}/health`);
    if (!res.ok) throw new Error(`Health ${res.status}`);
    return res.json();
  },
};
