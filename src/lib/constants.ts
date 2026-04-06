import type { PaymentStatus } from './types';

export const STATUS_CONFIG: Record<PaymentStatus, { label: string; color: string; step: number }> = {
  RECEIVED:             { label: 'Recibido',        color: 'bg-blue-500',    step: 1 },
  VALIDATED:            { label: 'Validado',        color: 'bg-blue-600',    step: 2 },
  CANONICALIZED:        { label: 'Canonicalizado',  color: 'bg-indigo-500',  step: 3 },
  ROUTED:               { label: 'Enrutado',        color: 'bg-purple-500',  step: 4 },
  QUEUED:               { label: 'En Cola',         color: 'bg-yellow-500',  step: 5 },
  SENT_TO_DESTINATION:  { label: 'Enviado al Riel', color: 'bg-orange-500',  step: 6 },
  ACKED_BY_RAIL:        { label: 'ACK del Riel',    color: 'bg-teal-500',    step: 7 },
  COMPLETED:            { label: 'Completado',      color: 'bg-green-500',   step: 8 },
  FAILED:               { label: 'Fallido',         color: 'bg-red-500',     step: -1 },
  REJECTED:             { label: 'Rechazado',       color: 'bg-red-400',     step: -1 },
  DUPLICATE:            { label: 'Duplicado',       color: 'bg-gray-500',    step: -1 },
  COMPENSATING:         { label: 'Compensando',     color: 'bg-amber-500',   step: -2 },
  COMPENSATED:          { label: 'Compensado',      color: 'bg-amber-600',   step: -2 },
  DEAD_LETTER:          { label: 'Dead Letter',     color: 'bg-red-700',     step: -3 },
};

export const RAIL_CONFIG = {
  PIX:         { label: 'PIX (Brasil)',       flag: '🇧🇷', currency: 'BRL', aliasPrefix: 'PIX-',  aliasPattern: /^PIX-[A-Za-z0-9._-]{6,64}$/, region: 'América del Sur' },
  SPEI:        { label: 'SPEI (México)',      flag: '🇲🇽', currency: 'MXN', aliasPrefix: 'SPEI-', aliasPattern: /^SPEI-\d{18}$/,               region: 'América del Norte' },
  SWIFT_MT103: { label: 'SWIFT MT103',        flag: '🌐', currency: 'USD', aliasPrefix: '',       aliasPattern: /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/, region: 'Internacional' },
  ISO20022_MX: { label: 'ISO 20022 MX',       flag: '🏦', currency: 'EUR', aliasPrefix: '',       aliasPattern: /^[A-Z]{2}\d{2}[A-Z0-9]{4,32}$/,               region: 'Internacional' },
  ACH_NACHA:   { label: 'ACH NACHA (EE.UU)', flag: '🇺🇸', currency: 'USD', aliasPrefix: '',       aliasPattern: /^\d{9}\/[\w-]+$/,              region: 'América del Norte' },
  FEDNOW:      { label: 'FedNow (EE.UU)',    flag: '🇺🇸', currency: 'USD', aliasPrefix: '',       aliasPattern: /^\d{9}\/[\w-]+$/,              region: 'América del Norte' },
  BRE_B:       { label: 'Bre-B (Colombia)', flag: '🇨🇴', currency: 'COP', aliasPrefix: 'BREB-',  aliasPattern: /^(BREB-\+57\d{10}|\d{9,10}-\d|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+)$/, region: 'América del Sur' },
} as const;

export type SupportedRail = keyof typeof RAIL_CONFIG;
