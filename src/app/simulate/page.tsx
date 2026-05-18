'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { RAIL_CONFIG } from '@/lib/constants';
import { ArrowRight, Loader2 } from 'lucide-react';

/**
 * W5.8 — /simulate is restricted to the 3 productive rails (PIX, SPEI, Bre-B)
 * because those are the only ones with a real adapter + mock + pipeline E2E.
 * The other 4 (SWIFT MT103, ISO20022 MX, ACH NACHA, FedNow) are case-study
 * rails that exercise the canonical/translation layer for extensibility
 * demonstration; they are reachable from the /translator page.
 *
 * See LIMITATIONS.md §1 and audits/AUDITORIA-CUMPLIMIENTO-TESIS-2026-05-17.md.
 */
const PRODUCTIVE_RAILS = ['PIX', 'SPEI', 'BRE_B'] as const;
type ProductiveRail = (typeof PRODUCTIVE_RAILS)[number];
const RAILS: ProductiveRail[] = [...PRODUCTIVE_RAILS];

const formSchema = z.object({
  originRail: z.enum(PRODUCTIVE_RAILS),
  destRail: z.enum(PRODUCTIVE_RAILS),
  amount: z.coerce.number().positive('El monto debe ser mayor a 0'),
  currency: z.string().min(3).max(3),
  debtorAlias: z.string().min(3, 'El alias del ordenante es requerido'),
  debtorName: z.string().optional(),
  creditorAlias: z.string().min(3, 'El alias del beneficiario es requerido'),
  creditorName: z.string().optional(),
  purpose: z.string().optional(),
  reference: z.string().optional(),
}).refine(d => d.originRail !== d.destRail, {
  message: 'El riel origen y destino deben ser diferentes',
  path: ['destRail'],
});

type FormValues = z.infer<typeof formSchema>;

// W5.7 — CLABE placeholders use valid mod-10 check digits.
// W5.11 — Bre-B mobile alias `+57 3xxx` (TR-002 mobile-only).
const ALIAS_PLACEHOLDERS: Record<ProductiveRail, { debtor: string; creditor: string }> = {
  PIX:   { debtor: 'PIX-12345678909',           creditor: 'PIX-+5511999887766' },
  SPEI:  { debtor: 'SPEI-012180000118359713',   creditor: 'SPEI-002180012345678906' },
  BRE_B: { debtor: 'BREB-+573001234567',         creditor: 'BREB-901234567-3' },
};

function RailPicker({ label, value, onChange, excluded }: {
  label: string;
  value: ProductiveRail;
  onChange: (r: ProductiveRail) => void;
  excluded?: ProductiveRail;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {RAILS.map(rail => {
          const conf = RAIL_CONFIG[rail as keyof typeof RAIL_CONFIG];
          const disabled = rail === excluded;
          return (
            <button
              key={rail}
              type="button"
              disabled={disabled}
              onClick={() => onChange(rail)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm transition-all ${
                value === rail
                  ? 'border-primary bg-primary/10 font-semibold'
                  : disabled
                    ? 'border-border opacity-30 cursor-not-allowed'
                    : 'border-border hover:border-muted-foreground/40'
              }`}
            >
              <span>{conf?.flag ?? '🌐'}</span>
              <span className="truncate">{conf?.label ?? rail}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

const inputClass = "w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring";

export default function SimulatePage() {
  const router = useRouter();
  const [originRail, setOriginRail] = useState<ProductiveRail>('PIX');
  const [destRail, setDestRail] = useState<ProductiveRail>('SPEI');

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      originRail: 'PIX',
      destRail: 'SPEI',
      amount: 150.25,
      currency: 'USD',
      purpose: 'P2P',
      reference: 'MIPIT-POC',
    },
  });

  const currency = watch('currency');

  function handleOriginChange(r: ProductiveRail) {
    setOriginRail(r);
    setValue('originRail', r);
    if (r === destRail) {
      const other = RAILS.find(x => x !== r) ?? 'SPEI';
      setDestRail(other);
      setValue('destRail', other);
    }
  }

  function handleDestChange(r: ProductiveRail) {
    setDestRail(r);
    setValue('destRail', r);
  }

  const onSubmit = async (data: FormValues) => {
    try {
      const result = await api.createPayment({
        amount: data.amount,
        currency: data.currency,
        debtor: { alias: data.debtorAlias, name: data.debtorName || undefined },
        creditor: { alias: data.creditorAlias, name: data.creditorName || undefined },
        purpose: data.purpose || 'P2P',
        reference: data.reference || 'MIPIT-POC',
      });
      toast.success('Transacción iniciada', { description: result.payment_id });
      router.push(`/payments/${result.payment_id}`);
    } catch (err) {
      toast.error('Error al iniciar transacción', {
        description: err instanceof Error ? err.message : 'Error desconocido',
      });
    }
  };

  const placeholders = ALIAS_PLACEHOLDERS[originRail];
  const credPlaceholders = ALIAS_PLACEHOLDERS[destRail];

  return (
    <div className="max-w-3xl mx-auto space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold">Simulación de Pago</h1>
        <p className="text-muted-foreground mt-2">
          Inicia una transacción transfronteriza entre los <strong>3 rieles productivos</strong> del PoC.
        </p>
      </div>

      {/* W5.8 — Banner steering case-study rails to the /translator page */}
      <div className="rounded-lg border border-dashed bg-muted/40 p-4 text-sm">
        <p className="font-medium">¿Buscas SWIFT MT103, ISO 20022 MX, ACH NACHA o FedNow?</p>
        <p className="text-muted-foreground mt-1">
          Esos cuatro rieles son <em>case-study de extensibilidad</em> — usan la capa canónica
          ISO 20022 pacs.008 pero no tienen adaptador productivo ni mock. Para ver cómo MiPIT los
          traduce, abre el{' '}
          <Link href="/translator" className="text-primary font-medium underline">Traductor ISO 20022 →</Link>.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Rail selection */}
        <div className="rounded-lg border p-6 space-y-6">
          <h2 className="font-semibold">Rieles de Pago</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RailPicker label="Riel Origen" value={originRail} onChange={handleOriginChange} excluded={destRail} />
            <RailPicker label="Riel Destino" value={destRail} onChange={handleDestChange} excluded={originRail} />
          </div>
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-full text-sm text-muted-foreground">
              <span>{RAIL_CONFIG[originRail as keyof typeof RAIL_CONFIG]?.flag}</span>
              <span>{originRail}</span>
              <ArrowRight className="w-4 h-4" />
              <span>{RAIL_CONFIG[destRail as keyof typeof RAIL_CONFIG]?.flag}</span>
              <span>{destRail}</span>
            </div>
          </div>
        </div>

        {/* Amount */}
        <div className="rounded-lg border p-6 space-y-4">
          <h2 className="font-semibold">Monto</h2>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Monto" error={errors.amount?.message}>
              <input
                type="number"
                step="0.01"
                min="0.01"
                {...register('amount')}
                className={inputClass}
              />
            </FormField>
            <FormField label="Moneda" error={errors.currency?.message}>
              <select {...register('currency')} className={inputClass}>
                <option value="USD">USD — Dólar americano</option>
                <option value="BRL">BRL — Real brasileño</option>
                <option value="MXN">MXN — Peso mexicano</option>
                <option value="COP">COP — Peso colombiano</option>
                <option value="EUR">EUR — Euro</option>
              </select>
            </FormField>
          </div>
        </div>

        {/* Debtor (Ordering party) */}
        <div className="rounded-lg border p-6 space-y-4">
          <h2 className="font-semibold">
            Ordenante {RAIL_CONFIG[originRail as keyof typeof RAIL_CONFIG]?.flag}
            <span className="ml-2 text-sm font-normal text-muted-foreground">({originRail})</span>
          </h2>
          <div className="grid grid-cols-1 gap-4">
            <FormField label="Alias / Cuenta" error={errors.debtorAlias?.message}>
              <input
                {...register('debtorAlias')}
                placeholder={placeholders.debtor}
                className={inputClass}
              />
              <p className="text-xs text-muted-foreground mt-1">Ejemplo: {placeholders.debtor}</p>
            </FormField>
            <FormField label="Nombre (opcional)">
              <input
                {...register('debtorName')}
                placeholder="Nombre del ordenante"
                className={inputClass}
              />
            </FormField>
          </div>
        </div>

        {/* Creditor (Beneficiary) */}
        <div className="rounded-lg border p-6 space-y-4">
          <h2 className="font-semibold">
            Beneficiario {RAIL_CONFIG[destRail as keyof typeof RAIL_CONFIG]?.flag}
            <span className="ml-2 text-sm font-normal text-muted-foreground">({destRail})</span>
          </h2>
          <div className="grid grid-cols-1 gap-4">
            <FormField label="Alias / Cuenta" error={errors.creditorAlias?.message}>
              <input
                {...register('creditorAlias')}
                placeholder={credPlaceholders.creditor}
                className={inputClass}
              />
              <p className="text-xs text-muted-foreground mt-1">Ejemplo: {credPlaceholders.creditor}</p>
            </FormField>
            <FormField label="Nombre (opcional)">
              <input
                {...register('creditorName')}
                placeholder="Nombre del beneficiario"
                className={inputClass}
              />
            </FormField>
          </div>
        </div>

        {/* Purpose & Reference */}
        <div className="rounded-lg border p-6 space-y-4">
          <h2 className="font-semibold">Referencia</h2>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Propósito" error={errors.purpose?.message}>
              <select {...register('purpose')} className={inputClass}>
                <option value="P2P">P2P — Persona a persona</option>
                <option value="B2B">B2B — Empresa a empresa</option>
                <option value="SALARY">Nómina</option>
                <option value="RENT">Alquiler</option>
                <option value="INVOICE">Factura</option>
                <option value="OTHER">Otro</option>
              </select>
            </FormField>
            <FormField label="Referencia">
              <input
                {...register('reference')}
                placeholder="MIPIT-POC"
                className={inputClass}
              />
            </FormField>
          </div>
        </div>

        {errors.destRail && (
          <p className="text-sm text-red-500 text-center">{errors.destRail.message}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              Iniciar Transacción
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
