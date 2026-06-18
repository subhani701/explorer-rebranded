# Troubleshooting Guide

## Connectivity

**Backend can't reach the chain / no blocks indexing**
- Test RPC: `curl -X POST http://localhost:8545 -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' -H 'Content-Type: application/json'`
- If empty: `kubectl port-forward` not running, or wrong svc/port.
- Container can't reach host port → use `host.docker.internal` (Docker Desktop) or
  `172.17.0.1` (Linux) in `config/backend.env`, not `localhost`.
- RPC bound to `127.0.0.1` on the node → set `--http.addr 0.0.0.0`.

**No internal transactions / traces**
- `debug` API not enabled on Geth → add `debug` to `--http.api`.
- Node not archive → set `--gcmode archive`. Without it, historical traces are unavailable.
- `INDEXER_DISABLE_INTERNAL_TRANSACTIONS_FETCHER` must be `false`.

## Indexing

**Indexer stuck / errors on old blocks** — almost always non-archive node missing trace
state. Confirm archive mode; for a private chain you generally want a full archive node.

**Slow first index** — normal; it backfills from genesis. Watch `make logs`. Small chains
finish in minutes.

**Realtime updates not showing** — WS URL wrong/unreachable (`ETHEREUM_JSONRPC_WS_URL`),
or proxy not forwarding `/socket`. Check `proxy/nginx.conf` and that `8546` is forwarded.

## Frontend

**UI loads but no data / API errors** — `NEXT_PUBLIC_API_HOST`/`_PROTOCOL` mismatch.
In the browser devtools, failing calls reveal the wrong host. Fix `config/frontend.env`,
`make rebuild-frontend && make up`.

**Branding didn't change** — env-only values need `make up`; build-time assets (favicon,
package meta, splash) need `make rebuild-frontend`. Hard-refresh the browser.

**Mixed-content / WS blocked in prod** — set `NEXT_PUBLIC_API_PROTOCOL=https` and
`NEXT_PUBLIC_WS_PROTOCOL=wss` when behind TLS.

## Database

**Backend boot loops on migrations** — check `make logs backend`; ensure `DATABASE_URL`
and `POSTGRES_PASSWORD` match between `.env` and `config/backend.env`. Verify
`db` is healthy (`make ps`).

**Out of connections** — raise Postgres `max_connections` (compose `command`) and/or lower
`POOL_SIZE`/`POOL_SIZE_API` in `config/backend.env`.

## Microservices

**Contract verification fails** — `smart-contract-verifier` down or
`MICROSERVICE_SC_VERIFIER_URL` wrong. `docker compose logs smart-contract-verifier`.

**Charts empty** — `stats` service still building its DB on first run, or
`STATS__BLOCKSCOUT_DB_URL` wrong. Charts populate after the stats migrations + first
aggregation cycle.

## Quick triage

```bash
make health         # which surface is down
make ps             # container states / restarts
docker compose logs --tail=200 <service>
```
