# RoadTalk

## Prérequis

- Node 22 LTS (voir `.node-version`)
- pnpm via corepack (`corepack enable`)
- Docker + Docker Compose

## Démarrage

```bash
pnpm install
docker compose -f infra/docker/docker-compose.yml up -d
pnpm dev
```

## Structure

- `apps/api` — backend NestJS (Fastify)
- `apps/mobile` — application React Native (Expo)
- `packages/config` — tsconfig / eslint / prettier partagés
- `infra/docker` — services locaux (PostgreSQL+PostGIS, Redis)
