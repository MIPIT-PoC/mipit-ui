export function StatsCards() {
  // TODO: Display aggregate stats (total payments, success rate, avg latency, etc.)
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {['Total Pagos', 'Completados', 'Fallidos', 'Latencia Promedio'].map((title) => (
        <div key={title} className="rounded-lg border p-6 space-y-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">—</p>
        </div>
      ))}
    </div>
  );
}
