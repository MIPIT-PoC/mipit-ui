'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RailSelector } from '@/components/simulate/rail-selector';
import { api } from '@/lib/api';
import type { Rail } from '@/lib/types';

export default function SimulatePage() {
  const router = useRouter();
  const [originRail, setOriginRail] = useState<Rail>('PIX');
  const [destRail, setDestRail] = useState<Rail>('SPEI');
  const [amount, setAmount] = useState(150.25);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await api.createPayment({
        amount,
        currency: 'USD',
        debtor: {
          alias: formData.get('debtor_alias') as string,
          name: formData.get('debtor_name') as string,
        },
        creditor: {
          alias: formData.get('creditor_alias') as string,
          name: formData.get('creditor_name') as string,
        },
        purpose: formData.get('purpose') as string || 'P2P',
        reference: formData.get('reference') as string || 'MIPIT-POC',
      });

      router.push(`/payments/${result.payment_id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold">Simulación de Pago</h1>
        <p className="text-muted-foreground mt-2">
          Inicia una transacción transfronteriza entre rieles de pago
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <RailSelector label="Riel Origen" value={originRail} onChange={setOriginRail} />
          <RailSelector label="Riel Destino" value={destRail} onChange={setDestRail} />
        </div>

        {/* TODO: Amount + Currency fields */}
        {/* TODO: Dynamic form fields based on originRail/destRail */}
        {/* TODO: Debtor fields */}
        {/* TODO: Creditor fields */}
        {/* TODO: Purpose + Reference fields */}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? 'Procesando...' : 'Iniciar Transacción'}
        </button>
      </form>
    </div>
  );
}
