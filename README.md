# mipit-ui

> **MiPIT PoC** — Simulation & Inspection UI for cross-border payments.

Next.js 15 + TailwindCSS + shadcn/ui frontend that communicates with `mipit-core` via HTTPS.

## Quick Start

```bash
# Install dependencies
npm install

# Initialize shadcn/ui components
npx shadcn@latest init

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Copy `.env.example` to `.env.local` and adjust:

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8080` | mipit-core API URL |
| `NEXT_PUBLIC_APP_NAME` | `MiPIT PoC` | App display name |

## Pages

| Route | Description |
|---|---|
| `/` | Dashboard — stats, recent payments, service health |
| `/simulate` | Payment simulation form with rail selector |
| `/payments/[id]` | Payment detail — flow timeline + message inspector |
| `/history` | Transaction history with filters |

## Project Structure

```
src/
├── app/            # Next.js App Router pages
├── components/     # React components by domain
│   ├── layout/     # Navbar, Footer
│   ├── simulate/   # Rail selector, payment forms
│   ├── payments/   # Timeline, inspector, badges
│   ├── history/    # Table, filters
│   ├── dashboard/  # Stats, recent, health
│   └── ui/         # shadcn/ui primitives
├── hooks/          # Custom React hooks
└── lib/            # API client, types, utils, constants
```

## Docker

```bash
docker build -t mipit-ui .
docker run -p 3000:3000 -e NEXT_PUBLIC_API_BASE_URL=http://core:8080 mipit-ui
```

## License

MIT
