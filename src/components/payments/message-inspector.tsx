'use client';

interface Props {
  original: Record<string, unknown> | null;
  canonical: Record<string, unknown> | null;
  translated: Record<string, unknown> | null;
}

export function MessageInspector({ original, canonical, translated }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Inspector de Mensajes</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MessageColumn title="Original (Riel Origen)" data={original} color="border-blue-500" />
        <MessageColumn title="Canónico (pacs.008)" data={canonical} color="border-purple-500" />
        <MessageColumn title="Traducido (Riel Destino)" data={translated} color="border-green-500" />
      </div>
    </div>
  );
}

function MessageColumn({
  title,
  data,
  color,
}: {
  title: string;
  data: Record<string, unknown> | null;
  color: string;
}) {
  return (
    <div className={`border-t-4 ${color} rounded-lg bg-muted/50 p-4`}>
      <h4 className="text-sm font-semibold mb-3">{title}</h4>
      <pre className="text-xs overflow-auto max-h-96 bg-background p-3 rounded font-mono">
        {data ? JSON.stringify(data, null, 2) : 'Pendiente...'}
      </pre>
    </div>
  );
}
