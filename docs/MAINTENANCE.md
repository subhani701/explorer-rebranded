# Maintenance Guide

## Routine operations

| Task | Command |
|---|---|
| Status | `make ps` |
| Logs | `make logs` (or `docker compose logs -f backend`) |
| Health | `make health` |
| Restart | `make restart` |
| Stop (keep data) | `make down` |
| Start | `make up` |

## Upgrading

1. Bump pinned versions in `.env` (`BACKEND_VERSION`, `STATS_VERSION`, ...).
2. `make pull` to fetch new images.
3. `make up` — the backend runs DB migrations automatically on start.
4. `make health` and check `make logs` for migration completion.

Always `make backup` before an upgrade.

## Re-indexing

If indexed data looks wrong (e.g. after enabling archive/debug on the node):
- Internal-tx backfill: handled automatically once `debug` API is available.
- Full re-index: `make clean` (DESTRUCTIVE — drops volumes), then `make up`. Only for
  small chains or last resort.

## Monitoring

- Each service exposes a healthcheck (`make health` aggregates them).
- Logs are JSON, rotated (20 MB × 5 files) via the compose logging driver.
- For production, scrape:
  - backend `/api/health`
  - proxy `/health`
  - Postgres via `pg_isready`
  See `docs/TROUBLESHOOTING.md` for common failure signatures.

## Database hygiene

- Postgres grows with chain size; monitor disk.
- `VACUUM`/autovacuum is enabled by default; for large chains tune
  `shared_buffers`/`work_mem` in the compose `command`.
- Take regular backups (`make backup`, schedule via cron — see BACKUP.md).

## Secrets rotation

- `SECRET_KEY_BASE`, DB passwords: rotate in `.env`/`config/backend.env`, then
  `make up`. Rotating DB password requires updating Postgres role + `DATABASE_URL`.
