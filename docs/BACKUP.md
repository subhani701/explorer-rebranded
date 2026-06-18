# Backup & Restore Guide

The indexed chain data lives in Postgres. Redis is a cache (rebuildable). Backups target
the `blockscout` database.

## On-demand backup

```bash
make backup
```
Writes a compressed, integrity-verified custom-format dump to `backups/` and prunes
dumps older than `RETENTION_DAYS` (default 14).

## Scheduled backup (cron)

```cron
# daily at 02:30
30 2 * * *  cd /opt/explorer && RETENTION_DAYS=30 bash scripts/backup.sh >> /var/log/explorer-backup.log 2>&1
```

For AWS, sync dumps off-box:
```bash
aws s3 sync ./backups s3://your-bucket/explorer-backups/ --storage-class STANDARD_IA
```
Enable bucket versioning + lifecycle expiration for retention.

## Restore

```bash
RESTORE_FILE=backups/blockscout-YYYYmmdd-HHMMSS.dump make restore
```
The script stops the backend, recreates the DB, loads the dump, and restarts services.
It prompts for confirmation (overwrites current data).

## Disaster recovery checklist

1. Provision a fresh host/cluster, install Docker.
2. Restore the repo (`config/*`, `.env`, `frontend/`) from version control / secrets store.
3. `make up` to create empty volumes.
4. `RESTORE_FILE=<latest dump> make restore`.
5. `make health`; let the realtime indexer catch up the gap since the dump.

## What is NOT backed up (by design)

- Redis cache — rebuilt automatically.
- Stats DB — regenerated from the main DB on start (`STATS__RUN_MIGRATIONS=true`).
- The chain itself — that lives on the Geth nodes, not here.
