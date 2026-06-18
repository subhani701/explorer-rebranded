# Private Geth Blockchain Explorer

A production-grade, fully-rebranded blockchain explorer for a private Geth network
(running on AWS EKS). Built on the Blockscout engine with a config-driven rebrand and
**no visible Blockscout identity** in the product.

## Features

- **Dashboard** — latest blocks/txs, TPS, gas usage & price, total blocks, validators/miners,
  connected nodes, average block time, network status/health, chain & network IDs, genesis info.
- **Blocks / Transactions / Addresses** — full detail pages incl. internal txs, logs, events,
  receipts, token transfers, contract creation.
- **Tokens** — ERC-20 / ERC-721 / ERC-1155 with transfers, holders, supply, metadata.
- **Smart contracts** — source verification, ABI, read/write, decoded txs, event logs.
- **Search** — address, tx hash, block number/hash, contract, token (ENS-ready).
- **APIs** — blocks, transactions, accounts, contracts, tokens, statistics.
- **Analytics** — daily txs, block production, gas, active addresses, token analytics, charts.

## Architecture

```
              ┌──────────────┐
   browser ── │  nginx proxy │ ── /        → frontend (rebranded, custom image)
              │   (ingress)  │ ── /api,/socket → backend (indexer + API)
              └──────────────┘ ── /stats-api  → stats (charts)
                     │
   ┌─────────┬───────┴────────┬───────────────┬──────────────┐
 backend   stats          verifier        visualizer     sig-provider
   │  │       │
 Postgres  Redis      Postgres(stats)
   │
   └── JSON-RPC (HTTP+WS) ──► Geth archive node on EKS
```

## Layout

```
Branding/
├── docker-compose.yml         # full stack
├── .env.example               # pinned versions + secrets + ports
├── Makefile                   # operational entrypoints (make help)
├── config/
│   ├── brand.env.example      # ← single source of truth for ALL branding
│   ├── backend.env.example    # indexer + RPC + DB
│   └── frontend.env.example   # frontend hosts + brand passthrough
├── frontend/                  # rebranded fork + custom Dockerfile
│   └── public/assets/         # logo, icon, favicon, footer-links.json
├── proxy/nginx.conf
├── scripts/                   # render-config, backup, restore, healthcheck
├── docs/                      # deployment, maintenance, backup, troubleshooting, rebranding
└── IMPLEMENTATION_LOG.md      # running build log
```

## Quick start (local)

```bash
make init          # create .env + config/*.env from templates
# 1) fill secrets in .env  2) fill brand values in config/brand.env
# 3) point config/backend.env RPC URLs at your chain
make build         # build the rebranded frontend image
make up            # start everything
make health        # verify all services are up
```

Explorer is served at `http://localhost` (proxy on port 80).

## Branding

All visible branding is driven by `config/brand.env`. See **docs/REBRANDING.md**.
After changing brand values: `make rebuild-frontend && make up`.

## Documentation

| Guide | File |
|---|---|
| Deployment (local → AWS) | `docs/DEPLOYMENT.md` |
| Rebranding | `docs/REBRANDING.md` |
| Maintenance | `docs/MAINTENANCE.md` |
| Backup & restore | `docs/BACKUP.md` |
| Troubleshooting | `docs/TROUBLESHOOTING.md` |

## License

Built on Blockscout (GPL-3.0). The `LICENSE` file and in-source copyright headers are
retained per GPL-3.0; all **visible** branding is replaced. See `docs/REBRANDING.md`
for the compliance posture.
