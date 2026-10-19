# Predicting.top Clone

Minimal MVP clone of `predicting.top` built with Next.js App Router.

## Included

- Homepage leaderboard
- Trader profile pages
- Top positions page
- PMXT-backed live market and Polymarket trade routes under `/api/v1`
- Sample-backed trader rankings, profiles, and positions
- Planning docs for competitive gap analysis and sprinting

## Run locally

```bash
npm install
npm run dev
```

Set `PMXT_API_KEY` in `.env.local` for PMXT market and trade data. Add the same variable to your hosting provider's production environment before redeploying.

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

PMXT's public feed does not provide third-party trader P&L or holdings. Replace the sample-backed trader data in `lib/mock-data.ts` only if you add a source that provides those fields.

## Planning Documents

- [Gap analysis](./docs/gap-analysis.md)
- [Task list and sprint plan](./docs/task-list.md)
