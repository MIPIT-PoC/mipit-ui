'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

export interface PaymentEvent {
  payment_id: string;
  status: string;
  previous_status?: string;
  destination_rail?: string;
  origin_rail?: string;
  fx?: {
    source_currency: string;
    target_currency: string;
    rate: number;
    converted_amount: number;
  };
  latency_ms?: number;
  error?: string;
  timestamp: string;
}

interface UseSseOptions {
  paymentId?: string;
  maxEvents?: number;
}

export function useSse(options: UseSseOptions = {}) {
  const { paymentId, maxEvents = 100 } = options;
  const [events, setEvents] = useState<PaymentEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [clientCount, setClientCount] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    const path = paymentId
      ? `/events/payments/${paymentId}`
      : '/events/payments';

    const es = new EventSource(`${BASE_URL}${path}`);
    eventSourceRef.current = es;

    es.addEventListener('connected', (e) => {
      setConnected(true);
      try {
        const data = JSON.parse(e.data);
        if (data.clientId) {
          console.log('SSE connected:', data.clientId);
        }
      } catch { /* ignore */ }
    });

    es.addEventListener('payment_update', (e) => {
      try {
        const event: PaymentEvent = JSON.parse(e.data);
        setEvents((prev) => {
          const next = [event, ...prev];
          return next.slice(0, maxEvents);
        });
      } catch { /* ignore malformed events */ }
    });

    es.onerror = () => {
      setConnected(false);
      es.close();
      setTimeout(connect, 3000);
    };
  }, [paymentId, maxEvents]);

  useEffect(() => {
    connect();
    return () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };
  }, [connect]);

  const clearEvents = useCallback(() => setEvents([]), []);

  return { events, connected, clientCount, clearEvents };
}
