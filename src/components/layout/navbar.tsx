import Link from 'next/link';

export function Navbar() {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-8">
        <Link href="/" className="text-xl font-bold tracking-tight">
          MiPIT <span className="text-muted-foreground font-normal text-sm">PoC</span>
        </Link>

        <div className="flex items-center gap-6">
          <Link href="/" className="text-sm hover:text-foreground text-muted-foreground transition-colors">
            Dashboard
          </Link>
          <Link href="/simulate" className="text-sm hover:text-foreground text-muted-foreground transition-colors">
            Simular
          </Link>
          <Link href="/history" className="text-sm hover:text-foreground text-muted-foreground transition-colors">
            Historial
          </Link>
        </div>
      </div>
    </nav>
  );
}
