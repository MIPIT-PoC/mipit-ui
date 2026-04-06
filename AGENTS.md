# AGENTS.md

<purpose>
This repository implements the frontend simulator and inspector for MiPIT-PoC: a Next.js 15+ application that allows users to simulate cross-border payments and inspect the full payment lifecycle.

It is responsible for:
- a simulation page to create payments (select origin/destination rail, fill form, submit),
- a payment detail page with flow timeline (8 steps), message inspector (original/canonical/translated), and rail ACK panel,
- a history page with filterable payment table,
- a dashboard with stats cards, recent payments, and service health,
- communicating with mipit-core API (POST /payments, GET /payments/:id, GET /health),
- real-time status polling until terminal state (COMPLETED, FAILED, REJECTED).

Treat shipped code as the primary source of truth.
When code and documents disagree, prefer:
1. current repo implementation,
2. current architecture/design artifacts in mipit-docs,
3. current SRS,
4. project plan / older planning notes.
</purpose>

<project_scope>
This UI is a PoC simulator and flow inspector.
It does NOT implement:
- production user management or authentication,
- real payment initiation by end-users,
- mobile or responsive production UI,
- real-time WebSocket connections (uses polling).

The UI communicates exclusively with mipit-core via its REST API.
</project_scope>

<instruction_priority>
- User instructions override default style, tone, and initiative preferences.
- Safety, honesty, privacy, and permission constraints do not yield.
- If a newer user instruction conflicts with an earlier one, follow the newer instruction.
</instruction_priority>

<workflow>
  <phase name="clarify">
  - Before changes, clarify which area is affected:
    - simulation page / forms,
    - payment detail page (timeline, message inspector, rail ACK),
    - history page / table / filters,
    - dashboard (stats, recent, health),
    - API client layer (src/lib/api.ts),
    - types and constants (src/lib/types.ts, src/lib/constants.ts),
    - reusable hooks (src/hooks/),
    - layout / navigation components.
  </phase>

  <phase name="research">
  - Inspect the current codebase, especially:
    - src/lib/types.ts for PaymentStatus, PaymentDetail, CreatePaymentBody,
    - src/lib/api.ts for the API client,
    - src/lib/constants.ts for STATUS_CONFIG and RAIL_CONFIG,
    - src/app/ for page components,
    - src/components/ for reusable UI components,
    - src/hooks/ for data fetching hooks.
  - Cross-reference with mipit-core API contracts (OpenAPI spec).
  </phase>

  <phase name="plan">
  - Present a plan covering: affected pages/components, API contract dependencies, UX changes.
  - Wait for user approval.
  </phase>

  <phase name="implement">
  - Use Next.js App Router (src/app/).
  - Use shadcn/ui components for consistent styling.
  - Use TailwindCSS 4 for all styling.
  - Use react-hook-form + Zod for form validation.
  - Keep API calls in src/lib/api.ts — components call hooks, hooks call api.
  - Keep types centralized in src/lib/types.ts.
  - Use 'use client' directive only on interactive components.
  - Keep server components where possible for pages.
  </phase>

  <phase name="verify">
  - Run `npm run build` to verify Next.js builds without errors.
  - Run `npm run lint` for code quality.
  - Verify pages render correctly in browser.
  - Verify API integration: simulation creates a real payment, detail page shows timeline.
  - Verify status polling: page updates as payment progresses through states.
  </phase>

  <phase name="document">
  - Update README.md when pages, features, or setup steps change.
  - Update .env.example when environment variables change.
  </phase>
</workflow>

<architecture_rules>
- Next.js 15 App Router with src/ directory.
- TailwindCSS 4 + shadcn/ui for design system.
- API client centralized in src/lib/api.ts.
- Types match mipit-core API response shapes.
- STATUS_CONFIG maps all 11 payment statuses to colors, labels, and step numbers.
- RAIL_CONFIG maps PIX and SPEI to currencies, flags, and alias patterns.
- Standalone output mode for Docker deployment.
</architecture_rules>

<frontend_rules>
- Keep pages in src/app/ as thin orchestrators: fetch data, compose components.
- Keep components in src/components/ organized by feature (simulate/, payments/, history/, dashboard/, layout/).
- Keep hooks in src/hooks/ for data fetching with loading/error/data states.
- Keep utility functions in src/lib/utils.ts.
- Use shadcn/ui primitives (Button, Card, Input, Badge, Select, Table, Tabs, Toast).
- Use lucide-react for icons.
- Use sonner for toast notifications.
- Polling: use setInterval in hooks with cleanup on unmount; poll every 2s for detail, 10s for dashboard.
</frontend_rules>

<testing_rules>
- Component tests go in test/components/.
- Use React Testing Library for component tests.
- Verify form validation (required fields, format checks).
- Verify status badge renders correct color for each status.
- Verify timeline highlights correct step for each status.
</testing_rules>

<default_commands>
- Development: `npm run dev`
- Build: `npm run build`
- Start: `npm start`
- Lint: `npm run lint`
</default_commands>
