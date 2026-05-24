/**
 * @file footer.tsx
 * @description Global footer server component that displays the MiPIT PoC tagline beneath every page.
 * @author María Camila Osuna
 * @project MIPIT-PoC — Cross-border Instant Payments Middleware
 */

export function Footer() {
  return (
    <footer className="border-t py-6 text-center text-sm text-muted-foreground">
      <p>MiPIT PoC &mdash; Cross-border Payment Interoperability</p>
    </footer>
  );
}
