# MamaVPN

Telegram-first VPN MVP for RU/CIS users.

## Workspace

- `apps/api` - NestJS API and product orchestration
- `apps/bot` - Telegram bot transport layer
- `apps/miniapp` - Next.js Telegram Mini App
- `packages/shared` - shared types and domain contracts
- `packages/config` - environment and runtime config helpers
- `infrastructure/prisma` - database schema
- `docs/architecture` - implementation notes

## Quick Start

1. Copy `.env.example` to `.env`
2. Start infrastructure: `docker compose up -d`
3. Install dependencies: `pnpm install`
4. Generate Prisma client: `pnpm db:generate`
5. Run migrations: `pnpm db:migrate`
6. Start apps with `pnpm dev`
