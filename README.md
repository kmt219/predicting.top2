# Predicting.top Clone

Minimal MVP clone of `predicting.top` built with Next.js App Router.

## Included

- Homepage leaderboard
- Trader profile pages
- Top positions page
- Mock-backed API routes under `/api/v1`
- Shared data layer ready to swap for real ingestion
- Planning docs for competitive gap analysis and sprinting

## Run locally

```bash
npm install
npm run dev
```

## Routes

- `/`
- `/positions`
- `/account/aenews`

## API

- `/api/v1/leaderboard`
- `/api/v1/traders/:slug`
- `/api/v1/traders/:slug/pnl-history`
- `/api/v1/traders/:slug/monthly-summary`
- `/api/v1/positions`
- `/api/v1/markets/trending`
- `/api/v1/trades/recent`
- `/api/v1/meta/filters`

## Next step

Replace `lib/mock-data.ts` with:

- normalized database models
- ingestion workers
- cached query layer
- live platform adapters for Polymarket, Kalshi, and Opinion Labs

## Planning Documents

- [Gap analysis](./docs/gap-analysis.md)
- [Task list and sprint plan](./docs/task-list.md)
