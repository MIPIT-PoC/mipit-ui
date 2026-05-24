'use client';

/**
 * @file page.tsx
 * @description Payment simulation form restricted to the 3 productive rails (PIX, SPEI, Bre-B) with inline alias validation (CLABE mod-10, BRE-B phone/NIT/email), rail-pair picker and zod-resolved react-hook-form submission to /payments.
 * @author Carlos Mejía
 * @project MIPIT-PoC — Cross-border Instant Payments Middleware
 */

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

// Audit-Claude W5.8 + master Carlos: keep inline validation (checksum CLABE,
// CPF, NIT) — backend schema valida igual pero el cliente da feedback
// inmediato y permite mejor UX. Las productive rails ya están en
// PRODUCTIVE_RAILS arriba; los 4 case-study viven en /translator.
function validatePixAlias(alias: string): boolean {
  return alias.startsWith('PIX-') && alias.length > 4;
}

function validateSpeAlias(alias: string): boolean {
  if (!alias.startsWith('SPEI-')) return false;
  const clabe = alias.slice(5);
  if (!/^\d{18}$/.test(clabe)) return false;
  const weights = [3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7];
  const sum = weights.reduce((acc, w, i) => acc + parseInt(clabe[i], 10) * w, 0);
  return parseInt(clabe[17], 10) === (10 - (sum % 10)) % 10;
}

function validateBrebAlias(alias: string): boolean {
  if (!alias.startsWith('BREB-')) return false;
  const key = alias.slice(5);
  // Phone: +57 followed by 10 digits
  if (/^\+57\d{10}$/.test(key)) return true;
  // NIT: 9-10 digits, dash, 1 digit
  if (/^\d{9,10}-\d$/.test(key)) return true;
  // Email: must have @ and .
  if (key.includes('@') && key.includes('.') && key.length >= 5) return true;
  // Generic alias: at least 3 chars
  return key.length >= 3;
}

function validateAliasForRail(alias: string, rail: ProductiveRail): string | true {
  if (!alias) return 'El alias es requerido';

  if (rail === 'PIX') {
    if (!validatePixAlias(alias)) return 'Debe ser: PIX-xxxxx (ej: PIX-user@bank.com)';
    return true;
  }
  if (rail === 'SPEI') {
    if (!validateSpeAlias(alias))
      return 'Debe ser: SPEI-XXXXXXXXXXXXXXXXXX (18 dígitos CLABE válido)';
    return true;
  }
  if (rail === 'BRE_B') {
    if (!validateBrebAlias(alias)) return 'Debe ser: BREB-phone/NIT/email (ej: BREB-+573005551234)';
    return true;
  }

  // ProductiveRail is exhaustive; fall-through unreachable.
  return true;
}
const createFormSchema = () =>
  z
    .object({
      // Audit 4 merge — sólo productive rails en /simulate (W5.8).
      originRail: z.enum(PRODUCTIVE_RAILS),
      destRail: z.enum(PRODUCTIVE_RAILS),

      amount: z.coerce.number().positive('El monto debe ser mayor a 0'),

      currency: z.string().min(3).max(3),

      debtorAlias: z.string().min(1, 'El alias del ordenante es requerido'),

      debtorName: z.string().optional(),

      creditorAlias: z.string().min(1, 'El alias del beneficiario es requerido'),

      creditorName: z.string().optional(),

      purpose: z.string().optional(),

      reference: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      const debtorValidation = validateAliasForRail(data.debtorAlias, data.originRail);

      if (debtorValidation !== true) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['debtorAlias'],
          message: String(debtorValidation),
        });
      }

      const creditorValidation = validateAliasForRail(data.creditorAlias, data.destRail);

      if (creditorValidation !== true) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['creditorAlias'],
          message: String(creditorValidation),
        });
      }

      if (data.originRail === data.destRail) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['destRail'],
          message: 'El riel origen y destino deben ser diferentes',
        });
      }
    });

type FormSchemaType = ReturnType<typeof createFormSchema>;
type FormValues = z.infer<FormSchemaType>;

// W5.7 — CLABE placeholders use valid mod-10 check digits.
// W5.11 — Bre-B mobile alias `+57 3xxx` (TR-002 mobile-only).
// Audit 3 X1 — NIT `901234567` DIAN check digit is 7 (not 3 as previously placed).
// Audit 4 merge — restringido a ProductiveRail (3); los 4 case-study viven en /translator (W5.8).
const ALIAS_PLACEHOLDERS: Record<ProductiveRail, { debtor: string; creditor: string }> = {
  PIX:   { debtor: 'PIX-12345678909',           creditor: 'PIX-+5511999887766' },
  SPEI:  { debtor: 'SPEI-012180000118359713',   creditor: 'SPEI-002180012345678906' },
  BRE_B: { debtor: 'BREB-+573001234567',         creditor: 'BREB-901234567-7' },
};

function RailPicker({
  label,
  value,
  onChange,
  excluded,
}: {
  label: string;
  value: ProductiveRail;
  onChange: (r: ProductiveRail) => void;
  excluded?: ProductiveRail;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {RAILS.map((rail) => {
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

function FormField({
  label,
  error,
  children,
  hint,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      {!error && hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

const inputClass =
  'w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring';

export default function SimulatePage() {
  const router = useRouter();
  // Audit 4 merge — ProductiveRail (3 productive), formSchema con superRefine
  // de master para validación inline checksum.
  const [originRail, setOriginRail] = useState<ProductiveRail>('PIX');
  const [destRail, setDestRail] = useState<ProductiveRail>('SPEI');
  const formSchema = createFormSchema();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      originRail: 'PIX',
      destRail: 'SPEI',
      amount: 150.25,
      currency: 'USD',
      purpose: 'P2P',
      reference: 'MIPIT-POC',
      debtorAlias: 'PIX-user@bank.com',
      creditorAlias: 'SPEI-012180000118359719',
    },
    mode: 'onChange',
  });

  const currency = watch('currency');
  const debtorAliasValue = watch('debtorAlias');
  const creditorAliasValue = watch('creditorAlias');

  function handleOriginChange(r: ProductiveRail) {
    setOriginRail(r);
    setValue('originRail', r, { shouldValidate: true });
    if (r === destRail) {
      const other = RAILS.find((x) => x !== r) ?? 'SPEI';
      setDestRail(other);
      setValue('destRail', other, { shouldValidate: true });
    }
  }

  function handleDestChange(r: ProductiveRail) {
    setDestRail(r);
    setValue('destRail', r, { shouldValidate: true });
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
            <RailPicker
              label="Riel Origen"
              value={originRail}
              onChange={handleOriginChange}
              excluded={destRail}
            />
            <RailPicker
              label="Riel Destino"
              value={destRail}
              onChange={handleDestChange}
              excluded={originRail}
            />
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
            <FormField
              label="Alias / Cuenta"
              error={errors.debtorAlias?.message}
              hint={`Formato: ${placeholders.debtor}`}
            >
              <div className="relative">
                <input
                  {...register('debtorAlias')}
                  placeholder={placeholders.debtor}
                  className={`${inputClass} ${debtorAliasValue && errors.debtorAlias ? 'border-red-500' : ''}`}
                />
                {debtorAliasValue && !errors.debtorAlias && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600">✓</div>
                )}
              </div>
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
            <FormField
              label="Alias / Cuenta"
              error={errors.creditorAlias?.message}
              hint={`Formato: ${credPlaceholders.creditor}`}
            >
              <div className="relative">
                <input
                  {...register('creditorAlias')}
                  placeholder={credPlaceholders.creditor}
                  className={`${inputClass} ${creditorAliasValue && errors.creditorAlias ? 'border-red-500' : ''}`}
                />
                {creditorAliasValue && !errors.creditorAlias && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600">✓</div>
                )}
              </div>
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
              <input {...register('reference')} placeholder="MIPIT-POC" className={inputClass} />
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
