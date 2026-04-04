'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { RAIL_CONFIG } from '@/lib/constants';
import type { Rail, TranslatePreviewResponse } from '@/lib/types';
import { ArrowRight, ChevronDown, ChevronRight, Copy, Check, Loader2, AlertCircle } from 'lucide-react';

const RAILS: Rail[] = ['PIX', 'SPEI', 'SWIFT_MT103', 'ISO20022_MX', 'ACH_NACHA', 'FEDNOW'];

const SAMPLE_PAYLOADS: Record<Rail, Record<string, unknown>> = {
  PIX: {
    endToEndId: 'E6074694820230601120012345678901',
    valor: { original: '1500.00' },
    pagador: { ispb: '60746948', nome: 'João Silva', cpf: '12345678901', contaTransacional: { numero: '123456-7', tipoConta: 'CACC' } },
    recebedor: { ispb: '00000000', nome: 'Maria Garcia' },
    chave: '+5521999887766',
    tipoChave: 'PHONE',
    tipo: 'TRANSF',
  },
  SPEI: {
    claveRastreo: 'MIPIT20230601001',
    empresa: 'MIPIT',
    fechaOperacion: '20230601',
    folioOrigen: 'PMT001',
    institucionContraparte: '012',
    institucionOperante: '999',
    monto: 28500,
    iva: 0,
    tipoPago: 1,
    tipoCuentaBeneficiario: 40,
    nombreBeneficiario: 'Carlos López',
    cuentaBeneficiario: '012180000118359719',
    conceptoPago: 'Transferencia MIPIT',
    referenciaNumerica: 1234567,
  },
  SWIFT_MT103: {
    transactionRef: 'TXN202306010001',
    bankOperationCode: 'CRED',
    valueDate: '2023-06-01',
    currency: 'USD',
    amount: 1500,
    orderingCustomer: { account: '123456789', name: 'John Smith', address: ['100 Main St', 'New York US'] },
    accountWithInstitution: { bic: 'BANKMXMMXXX' },
    beneficiaryCustomer: { account: 'SPEI-012345678901234567', name: 'Maria Garcia', address: ['Mexico City MX'] },
    remittanceInfo: '/INV/2023-001 Payment services',
    detailsOfCharges: 'SHA',
  },
  ISO20022_MX: {
    GrpHdr: { MsgId: 'MSG-20230601-001', CreDtTm: '2023-06-01T12:00:00Z', NbOfTxs: '1', SttlmInf: { SttlmMtd: 'CLRG' } },
    CdtTrfTxInf: {
      PmtId: { EndToEndId: 'E2E-20230601-001' },
      IntrBkSttlmAmt: { Ccy: 'EUR', value: '2500.00' },
      Dbtr: { Nm: 'Hans Müller', PstlAdr: { Ctry: 'DE' } },
      DbtrAcct: { Id: { IBAN: 'DE89370400440532013000' } },
      Cdtr: { Nm: 'Maria Garcia', PstlAdr: { Ctry: 'MX' } },
      CdtrAcct: { Id: { Othr: { Id: '012180000118359719' } } },
    },
  },
  ACH_NACHA: {
    batchHeader: { recordType: '5', serviceClassCode: '220', companyName: 'ACME CORP', companyId: '1234567890', secCode: 'PPD', companyEntryDescription: 'PAYROLL', effectiveEntryDate: '230601', originatingDfiId: '02100002', batchNumber: '0000001' },
    entryDetail: { recordType: '6', transactionCode: 22, routingTransitNumber: '021000021', accountNumber: '123456789', amount: 150000, individualName: 'John Smith', discretionaryData: '  ', addendaRecordIndicator: '0', traceNumber: '021000020000001' },
    originator: { name: 'ACME CORP', accountNumber: '987654321', routingNumber: '021000021' },
    odfi: { name: 'JPMorgan Chase', routingNumber: '021000021', countryCode: 'US' },
  },
  FEDNOW: {
    FIToFICstmrCdtTrf: {
      GrpHdr: { MsgId: 'MSG-20230601-001', CreDtTm: '2023-06-01T12:00:00Z', NbOfTxs: '1', SttlmInf: { SttlmMtd: 'CLRG', ClrSys: { Cd: 'USABA' } } },
      CdtTrfTxInf: {
        PmtId: { EndToEndId: 'E2E-FED-001', UETR: 'a5d5c3b2-1e4f-4a8b-9c0d-1234567890ab' },
        IntrBkSttlmAmt: { Ccy: 'USD', value: '1500.00' },
        IntrBkSttlmDt: '2023-06-01',
        DbtrAgt: { FinInstnId: { ClrSysMmbId: { ClrSysId: { Cd: 'USABA' }, MmbId: '021000021' } } },
        Dbtr: { Nm: 'Alice Johnson', PstlAdr: { Ctry: 'US' } },
        DbtrAcct: { Id: { Othr: { Id: '987654321' } } },
        CdtrAgt: { FinInstnId: { ClrSysMmbId: { ClrSysId: { Cd: 'USABA' }, MmbId: '026009593' } } },
        Cdtr: { Nm: 'Bob Martinez', PstlAdr: { Ctry: 'US' } },
        CdtrAcct: { Id: { Othr: { Id: '123456789' } } },
        LclInstrm: { Prtry: 'INST' },
      },
    },
  },
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="text-muted-foreground hover:text-foreground transition-colors p-1">
      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

function ResultPanel({ rail, result }: { rail: Rail; result: { success: boolean; data?: Record<string, unknown>; error?: string } }) {
  const [expanded, setExpanded] = useState(false);
  const conf = RAIL_CONFIG[rail as keyof typeof RAIL_CONFIG];
  const json = JSON.stringify(result.data ?? {}, null, 2);

  return (
    <div className={`rounded-lg border overflow-hidden ${result.success ? '' : 'border-red-200 bg-red-50/30'}`}>
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{conf?.flag ?? '🌐'}</span>
          <span className="font-medium text-sm">{conf?.label ?? rail}</span>
          {!result.success && <AlertCircle className="w-4 h-4 text-red-500" />}
        </div>
        <div className="flex items-center gap-2">
          {result.success && <span className="text-xs text-green-600 font-medium">OK</span>}
          {!result.success && <span className="text-xs text-red-500 font-medium">Error</span>}
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t">
          {result.success ? (
            <div className="relative">
              <div className="absolute top-2 right-2 z-10">
                <CopyButton text={json} />
              </div>
              <pre className="text-xs font-mono p-3 overflow-auto max-h-64 bg-muted/20">{json}</pre>
            </div>
          ) : (
            <div className="p-3 text-sm text-red-600">{result.error}</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TranslatorPage() {
  const [sourceRail, setSourceRail] = useState<Rail>('PIX');
  const [payload, setPayload] = useState(JSON.stringify(SAMPLE_PAYLOADS.PIX, null, 2));
  const [payloadError, setPayloadError] = useState<string | null>(null);
  const [result, setResult] = useState<TranslatePreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [canonicalExpanded, setCanonicalExpanded] = useState(false);

  function handleRailChange(rail: Rail) {
    setSourceRail(rail);
    setPayload(JSON.stringify(SAMPLE_PAYLOADS[rail], null, 2));
    setPayloadError(null);
    setResult(null);
  }

  function handlePayloadChange(value: string) {
    setPayload(value);
    try {
      JSON.parse(value);
      setPayloadError(null);
    } catch {
      setPayloadError('JSON inválido');
    }
  }

  async function handleTranslate() {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(payload);
    } catch {
      setPayloadError('JSON inválido — corrija antes de traducir');
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const res = await api.translatePreview(sourceRail, parsed);
      setResult(res);
    } catch (err) {
      toast.error('Error de traducción', {
        description: err instanceof Error ? err.message : 'Error desconocido',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold">Traductor de Mensajes</h1>
        <p className="text-muted-foreground mt-2">
          Convierte un mensaje de pago desde cualquier formato hacia todos los demás formatos simultáneamente
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input panel */}
        <div className="space-y-4">
          <div className="rounded-lg border p-4 space-y-3">
            <h2 className="font-semibold">Riel Origen</h2>
            <div className="grid grid-cols-2 gap-2">
              {RAILS.map(rail => {
                const conf = RAIL_CONFIG[rail as keyof typeof RAIL_CONFIG];
                return (
                  <button
                    key={rail}
                    type="button"
                    onClick={() => handleRailChange(rail)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm transition-all ${
                      sourceRail === rail
                        ? 'border-primary bg-primary/10 font-semibold'
                        : 'border-border hover:border-muted-foreground/40'
                    }`}
                  >
                    <span>{conf?.flag ?? '🌐'}</span>
                    <span className="truncate text-xs">{conf?.label ?? rail}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b">
              <span className="text-sm font-medium">Payload JSON</span>
              <div className="flex items-center gap-2">
                {payloadError && <span className="text-xs text-red-500">{payloadError}</span>}
                <CopyButton text={payload} />
              </div>
            </div>
            <textarea
              value={payload}
              onChange={e => handlePayloadChange(e.target.value)}
              className="w-full h-80 p-4 font-mono text-xs bg-background resize-none focus:outline-none"
              spellCheck={false}
            />
          </div>

          <button
            onClick={handleTranslate}
            disabled={loading || Boolean(payloadError)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Traduciendo a {RAILS.length - 1} formatos...
              </>
            ) : (
              <>
                Traducir a todos los formatos
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Output panel */}
        <div className="space-y-4">
          {!result && !loading && (
            <div className="rounded-lg border border-dashed p-12 text-center space-y-2">
              <p className="text-muted-foreground">
                Selecciona un riel, edita el payload si necesitas, y presiona &quot;Traducir&quot;.
              </p>
              <p className="text-xs text-muted-foreground">
                Se mostrará la traducción a los {RAILS.length - 1} formatos restantes simultáneamente.
              </p>
            </div>
          )}

          {loading && (
            <div className="space-y-3">
              {RAILS.filter(r => r !== sourceRail).map(r => (
                <div key={r} className="rounded-lg border p-3 animate-pulse flex items-center gap-3">
                  <div className="w-6 h-6 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded w-32" />
                </div>
              ))}
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Canonical */}
              <div className="rounded-lg border overflow-hidden">
                <button
                  onClick={() => setCanonicalExpanded(e => !e)}
                  className="w-full flex items-center justify-between p-3 bg-indigo-50/50 border-indigo-200 hover:bg-indigo-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📐</span>
                    <span className="font-medium text-sm">Modelo Canónico (pacs.008)</span>
                  </div>
                  {canonicalExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                {canonicalExpanded && (
                  <div className="border-t relative">
                    <div className="absolute top-2 right-2">
                      <CopyButton text={JSON.stringify(result.canonical, null, 2)} />
                    </div>
                    <pre className="text-xs font-mono p-3 overflow-auto max-h-64 bg-muted/10">
                      {JSON.stringify(result.canonical, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground px-1">
                Traducciones a {Object.keys(result.translations).length} formatos:
              </p>

              {(Object.entries(result.translations) as [Rail, { success: boolean; data?: Record<string, unknown>; error?: string }][]).map(
                ([rail, res]) => (
                  <ResultPanel key={rail} rail={rail} result={res} />
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
