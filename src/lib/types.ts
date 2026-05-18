export type Rail = 'PIX' | 'SPEI' | 'SWIFT_MT103' | 'ISO20022_MX' | 'ACH_NACHA' | 'FEDNOW' | 'BRE_B';

export type PaymentStatus =
  | 'RECEIVED'
  | 'VALIDATED'
  | 'CANONICALIZED'
  // W5.6 — added so a payment that the SSE/REST surfaces while still in the
  // normalization step (Wave 3 P05 stage between CANONICALIZED and ROUTED)
  // doesn't crash the badge with STATUS_CONFIG[undefined].
  | 'NORMALIZED'
  | 'ROUTED'
  | 'QUEUED'
  | 'SENT_TO_DESTINATION'
  | 'ACKED_BY_RAIL'
  | 'COMPLETED'
  | 'FAILED'
  | 'REJECTED'
  | 'DUPLICATE'
  | 'COMPENSATING'
  | 'COMPENSATED'
  | 'DEAD_LETTER';

export interface PaymentSummary {
  payment_id: string;
  status: PaymentStatus;
  received_at: string;
  destination: Rail;
}

export interface PaymentDetail {
  payment_id: string;
  status: PaymentStatus;
  origin_rail: Rail;
  destination_rail: Rail | null;
  amount: number | string;
  currency: string;
  /** P11/P07 — Surface ISO 20022 + observability fields in the UI. */
  trace_id?: string;
  uetr?: string;
  charge_bearer?: 'DEBT' | 'CRED' | 'SHAR' | 'SLEV';
  interbank_settlement_date?: string;
  instructed_amount?: number | string | null;
  instructed_currency?: string | null;
  settlement_amount?: number | string | null;
  settlement_currency?: string | null;
  exchange_rate?: number | string | null;
  end_to_end_id?: string;
  original_payload?: Record<string, unknown>;
  canonical_payload?: Record<string, unknown>;
  translated_payload?: Record<string, unknown>;
  rail_ack?: {
    rail_tx_id?: string;
    status: 'ACCEPTED' | 'REJECTED' | 'ERROR';
    error?: { code: string; message: string };
  } | null;
  timestamps: {
    created_at: string;
    validated_at?: string | null;
    canonicalized_at?: string | null;
    routed_at?: string | null;
    queued_at?: string | null;
    sent_at?: string | null;
    acked_at?: string | null;
    completed_at?: string | null;
  };
}

export interface CreatePaymentBody {
  amount: number;
  currency: string;
  debtor: { alias: string; name?: string };
  creditor: { alias: string; name?: string };
  purpose?: string;
  reference?: string;
}

export interface TranslateRequest {
  sourceRail: Rail;
  destinationRail: Rail;
  payload: Record<string, unknown>;
  options?: {
    includeCanonical?: boolean;
    paymentId?: string;
  };
}

export interface TranslateResponse {
  paymentId: string;
  sourceRail: Rail;
  destinationRail: Rail;
  translated: Record<string, unknown>;
  canonical?: Record<string, unknown>;
  translatedAt: string;
  traceId?: string;
}

export interface TranslatePreviewResponse {
  paymentId: string;
  sourceRail: Rail;
  canonical: Record<string, unknown>;
  translations: Record<Rail, { success: boolean; data?: Record<string, unknown>; error?: string }>;
  translatedAt: string;
  traceId?: string;
}

export interface RailMeta {
  id: Rail;
  label: string;
  description: string;
  region: string;
  standard: string;
}
