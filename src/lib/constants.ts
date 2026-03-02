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
};

export const RAIL_CONFIG = {
  PIX:  { label: 'PIX (Brasil)',  flag: '🇧🇷', currency: 'BRL', aliasPrefix: 'PIX-',  aliasPattern: /^PIX-[A-Za-z0-9._-]{6,64}$/ },
  SPEI: { label: 'SPEI (México)', flag: '🇲🇽', currency: 'MXN', aliasPrefix: 'SPEI-', aliasPattern: /^SPEI-\d{18}$/ },
} as const;
