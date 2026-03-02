import { StatsCards } from '@/components/dashboard/stats-cards';
import { RecentPayments } from '@/components/dashboard/recent-payments';
import { ServiceHealth } from '@/components/dashboard/service-health';

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Vista general del sistema MiPIT PoC
        </p>
      </div>

      <StatsCards />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RecentPayments />
        <ServiceHealth />
      </div>
    </div>
  );
}
