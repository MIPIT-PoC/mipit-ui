'use client';

import { STATUS_CONFIG } from '@/lib/constants';
import type { PaymentStatus, PaymentDetail } from '@/lib/types';

const TIMELINE_STEPS: PaymentStatus[] = [
  'RECEIVED', 'VALIDATED', 'CANONICALIZED', 'ROUTED',
  'QUEUED', 'SENT_TO_DESTINATION', 'ACKED_BY_RAIL', 'COMPLETED',
];

interface Props {
  currentStatus: PaymentStatus;
  timestamps: PaymentDetail['timestamps'];
}

export function FlowTimeline({ currentStatus, timestamps }: Props) {
  const currentStep = STATUS_CONFIG[currentStatus]?.step ?? 0;
  const isFailed = currentStep === -1;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Flujo de la Transacción</h3>
      <div className="flex items-center gap-1">
        {TIMELINE_STEPS.map((step, i) => {
          const config = STATUS_CONFIG[step];
          const isActive = config.step <= currentStep && !isFailed;
          const isCurrent = step === currentStatus;

          return (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center w-full">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white transition-all ${
                    isCurrent ? `${config.color} ring-4 ring-offset-2 ring-current` :
                    isActive ? config.color : 'bg-muted'
                  }`}
                >
                  {i + 1}
                </div>
                <span className="text-[10px] mt-1 text-center text-muted-foreground">
                  {config.label}
                </span>
              </div>
              {i < TIMELINE_STEPS.length - 1 && (
                <div className={`h-0.5 w-full ${isActive ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          );
        })}
      </div>
      {isFailed && (
        <div className={`text-center py-2 rounded ${STATUS_CONFIG[currentStatus].color} text-white text-sm font-semibold`}>
          {STATUS_CONFIG[currentStatus].label}
        </div>
      )}
    </div>
  );
}
