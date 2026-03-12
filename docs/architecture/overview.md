# MamaVPN Architecture Overview

## MVP Stack

- `apps/api` - NestJS API and orchestration layer
- `apps/bot` - Telegram bot transport layer on top of backend flows
- `apps/miniapp` - Next.js Mini App for self-service management
- `packages/shared` - domain contracts and DTO-like shared shapes
- `packages/config` - typed environment parsing
- `infrastructure/prisma` - data model and migrations

## MVP Principles

- bot remains a transport layer, not the place for core business logic
- provisioning is isolated behind a Marzban adapter
- billing state lives in our backend
- Mini App is a cabinet, not a landing page
