# HK Commute Fare Lookup

## Scripts

```bash
pnpm install
pnpm dev          # local preview http://127.0.0.1:5173
pnpm typecheck    # TypeScript
pnpm lint         # oxlint
pnpm test         # Vitest (unit / component)
pnpm test:watch
pnpm build        # output to dist/
pnpm e2e          # full Playwright suite
pnpm e2e:smoke    # smoke only
pnpm e2e:ui       # Playwright UI mode
```

## Data

Fare snapshot and scope: `[src/data/fares.meta.json](src/data/fares.meta.json)` (`asOf`, source, Adult Octopus / urban lines).
