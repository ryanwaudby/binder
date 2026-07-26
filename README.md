# binder

National Dex binder tracker for the Waudby family Pokémon card collection.

The binder holds 34 double-sided pages, 16 slots per page (1088 slots total).
Each of the 1025 National Dex species gets a fixed page + slot, assigned in
Dex order (page = `ceil(dexNumber / 16)`, slot = `((dexNumber - 1) % 16) + 1`).
The trailing ~63 slots are spare.

## Stack

- Cloudflare Worker serving a static frontend (`public/`) plus a small JSON
  API (`worker/index.js`)
- D1 (SQLite) database: `species` (static reference data) and `collection`
  (which dex numbers are marked collected, and when)
- Species data sourced from [PokeAPI](https://pokeapi.co/); artwork from the
  [PokeAPI sprites repo](https://github.com/PokeAPI/sprites)

## Editing collection state

Marking a Pokémon collected/uncollected requires the shared family password,
sent as `Authorization: Bearer <password>` to `POST /api/collect`. It's
stored as a Worker secret (`EDIT_PASSWORD`), never committed to this repo.
Looking things up (search, page/slot lookup, random hunt) needs no password.

## Local development

```
npm install -g wrangler   # if not already installed
wrangler d1 execute binder --local --file=db/schema.sql
wrangler d1 execute binder --local --file=db/seed.sql
wrangler dev
```

## Deploying

Deploys automatically from `main` via Cloudflare Pages/Workers, following
the [waudby.me subdomain pattern](https://github.com/ryanwaudby/skills).
Live at [binder.waudby.me](https://binder.waudby.me).
