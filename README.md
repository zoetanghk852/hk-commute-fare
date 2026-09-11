# HK Transpot Free

Requires [pnpm](https://pnpm.io/) 11.

```bash
pnpm install
pnpm dev
```

```bash
pnpm exec playwright install chromium
```

## Commands

```bash
pnpm install
pnpm dev          # local preview
pnpm test         # unit / component tests (Vitest)
pnpm test:watch   # watch mode (keep this on for TDD)
pnpm typecheck    # TypeScript check
pnpm e2e          # full Playwright suite
pnpm e2e:smoke    # smoke only (critical path)
pnpm e2e:ui       # Playwright UI mode
```
