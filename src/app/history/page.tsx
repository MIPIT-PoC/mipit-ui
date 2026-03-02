import { PaymentTable } from '@/components/history/payment-table';
import { Filters } from '@/components/history/filters';

export default function HistoryPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold">Historial de Transacciones</h1>
        <p className="text-muted-foreground mt-2">
          Consulta todas las transacciones procesadas por el sistema
        </p>
      </div>

      <Filters />
      <PaymentTable />
    </div>
  );
}
