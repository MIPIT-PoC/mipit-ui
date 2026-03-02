export type Rail = 'PIX' | 'SPEI';

export type PaymentStatus =
  | 'RECEIVED'
  | 'VALIDATED'
  | 'CANONICALIZED'
  | 'ROUTED'
  | 'QUEUED'
  | 'SENT_TO_DESTINATION'
  | 'ACKED_BY_RAIL'
  | 'COMPLETED'
  | 'FAILED'
  | 'REJECTED'
  | 'DUPLICATE';

export interface PaymentSummary {
  payment_id: string;
  status: PaymentStatus;
  received_at: string;
  destination: Rail;
}

export interface PaymentDetail {
  payment_id: string;
  status: PaymentStatus;
  origin: Rail;
  destination: Rail;
  amount: number;
  currency: string;
  original: Record<string, unknown>;
  canonical: Record<string, unknown>;
  translated: Record<string, unknown>;
  rail_ack: {
    rail_tx_id?: string;
    status: 'ACCEPTED' | 'REJECTED' | 'ERROR';
    error?: { code: string; message: string };
  } | null;
  timestamps: {
    created_at: string;
    validated_at?: string;
    canonicalized_at?: string;
    routed_at?: string;
    queued_at?: string;
    sent_at?: string;
    acked_at?: string;
    completed_at?: string;
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
