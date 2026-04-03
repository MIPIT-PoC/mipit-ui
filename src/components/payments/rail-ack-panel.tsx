import type { PaymentDetail } from '@/lib/types';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface RailAckPanelProps {
  railAck: PaymentDetail['rail_ack'];
  destination?: string;
}

const ACK_STATUS_CONFIG = {
  ACCEPTED: {
    icon: CheckCircle,
    color: 'text-green-600',
    bg: 'bg-green-50 border-green-200',
    label: 'Aceptado por el riel',
  },
  REJECTED: {
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-50 border-red-200',
    label: 'Rechazado por el riel',
  },
  ERROR: {
    icon: AlertCircle,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50 border-yellow-200',
    label: 'Error de comunicación',
  },
} as const;

/** Maps rail error codes to human-readable descriptions */
const ERROR_CODE_DESCRIPTIONS: Record<string, string> = {
  // BACEN/PIX SPI codes
  AM04: 'Fondos insuficientes (BACEN AM04)',
  RR04: 'Motivo de pago inválido (BACEN RR04)',
  DS04: 'Agente destinatario inaccesible (BACEN DS04)',
  // CECOBAN/SPEI codes
  R01: 'Fondos insuficientes (CECOBAN R01)',
  R03: 'Cuenta beneficiaria no encontrada (CECOBAN R03)',
  LIM: 'Límite operativo excedido (CECOBAN LIM)',
  // Generic
  TIMEOUT: 'Tiempo de espera agotado',
  UNKNOWN: 'Error desconocido del riel',
};

export function RailAckPanel({ railAck, destination }: RailAckPanelProps) {
  if (!railAck) {
    return (
      <div className="rounded-lg border p-6 space-y-2">
        <h3 className="font-semibold">Respuesta del Riel</h3>
        <p className="text-sm text-muted-foreground">
          Aún no se ha recibido respuesta del riel destino.
        </p>
      </div>
    );
  }

  const conf = ACK_STATUS_CONFIG[railAck.status];
  const Icon = conf.icon;

  const errorDescription = railAck.error?.code
    ? ERROR_CODE_DESCRIPTIONS[railAck.error.code] ?? railAck.error.message
    : null;

  return (
    <div className="rounded-lg border p-6 space-y-4">
      <h3 className="font-semibold">Respuesta del Riel{destination ? ` (${destination})` : ''}</h3>

      <div className={`flex items-start gap-3 p-4 rounded-lg border ${conf.bg}`}>
        <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${conf.color}`} />
        <div className="space-y-1">
          <p className={`font-medium text-sm ${conf.color}`}>{conf.label}</p>
          {railAck.rail_tx_id && (
            <p className="text-xs text-muted-foreground font-mono">
              ID Riel: {railAck.rail_tx_id}
            </p>
          )}
        </div>
      </div>

      {railAck.error && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Error del riel</p>
          <div className="rounded-md bg-muted p-3 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold">{railAck.error.code}</span>
              <span className="text-xs text-muted-foreground">—</span>
              <span className="text-xs">{errorDescription}</span>
            </div>
          </div>
        </div>
      )}

      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
          Ver respuesta completa (JSON)
        </summary>
        <pre className="mt-2 bg-muted p-3 rounded font-mono overflow-auto max-h-40">
          {JSON.stringify(railAck, null, 2)}
        </pre>
      </details>
    </div>
  );
}
