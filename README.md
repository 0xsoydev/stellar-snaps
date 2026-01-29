# Stellar Snaps

Shareable payment links for the Stellar blockchain. Create snaps, share URLs, and let anyone pay with one click using Freighter.

**Live:** [stellar-snaps.vercel.app](https://stellar-snaps.vercel.app)

## Repo structure

Monorepo (pnpm + Turborepo):

| Path | Description |
|------|-------------|
| `apps/web` | Next.js app: dashboard, snap pages, API (snaps, registry, build-tx, etc.) |
| `apps/extension` | Browser extension: detects snap links and shows payment cards |
| `packages/core` | `@stellar-snaps/sdk` – create snaps, URIs, Freighter, discovery, etc. |
| `packages/ui` | Shared UI components |
| `packages/eslint-config` | Shared ESLint config |
| `packages/typescript-config` | Shared tsconfigs |

## Prerequisites

- Node.js >= 18
- pnpm 9 (or use corepack: `corepack enable pnpm`)

## Setup

```bash
pnpm install
```

### Web app (dashboard + API)

1. Create `apps/web/.env` with `DATABASE_URL` (Neon or other Postgres).
2. Push schema (creates `snaps` and `registry` tables):
   ```bash
   cd apps/web && pnpm db:push
   ```
3. Run:
   ```bash
   pnpm dev --filter=web
   ```
   Open [http://localhost:3000](http://localhost:3000).

### Extension

1. Build:
   ```bash
   pnpm build --filter=@stellar-snaps/extension
   ```
2. In Chrome: `chrome://extensions` → Load unpacked → `apps/extension/dist`.

### SDK (packages/core)

- Used by web and extension via workspace; also published as `@stellar-snaps/sdk`.
- Tests: `cd packages/core && pnpm test`
- Build: `pnpm build --filter=@stellar-snaps/sdk`

## Commands (from repo root)

| Command | Description |
|---------|-------------|
| `pnpm dev` | Run all apps in dev mode |
| `pnpm build` | Build all packages and apps |
| `pnpm lint` | Lint all packages |
| `pnpm check-types` | Typecheck all packages |
| `pnpm dev --filter=web` | Run only web app |
| `pnpm build --filter=@stellar-snaps/sdk` | Build only SDK |

## Docs

- [SDK API & usage](packages/core/README.md)
- [Web app](apps/web/README.md)

## License

MIT
