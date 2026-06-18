# Deployment Guide

Covers local bring-up against the EKS chain, then production deployment on AWS.

## 0. Prerequisites

- Docker + Docker Compose v2
- `kubectl` configured for the EKS cluster (for local dev against the chain)
- The Geth node must run with archive mode and the required RPC APIs (see §2)

## 1. Configure

```bash
make init                     # copies *.example -> real files
```

Edit:
- `.env` — set `POSTGRES_PASSWORD`, `STATS_DB_PASSWORD` (`openssl rand -base64 32`),
  pin image versions.
- `config/brand.env` — name, colors, logo paths, footer links (see REBRANDING.md).
- `config/backend.env` — `CHAIN_ID`, `NETWORK_ID`, RPC URLs, `SECRET_KEY_BASE`
  (`openssl rand -base64 64 | tr -d '\n'`).

## 2. Geth node requirements (on EKS)

The node's args/config must include:

```
--http --http.addr 0.0.0.0 --http.api eth,net,web3,debug,txpool
--ws   --ws.addr 0.0.0.0   --ws.api eth,net,web3,debug,txpool
--gcmode archive
```

- `debug` API → internal transactions / traces.
- `--gcmode archive` → historical traces for older blocks.
- Clique/PoA chains: auto-detected by the geth JSON-RPC variant; no extra config.

If the deployment lacks these, patch the Geth `Deployment`/`StatefulSet` and ensure the
`Service` exposes `8545` (HTTP) and `8546` (WS).

## 3. Reach the EKS chain from local dev

```bash
kubectl get svc -A | grep -i geth        # find namespace + service
kubectl port-forward -n <ns> svc/<geth-svc> 8545:8545
kubectl port-forward -n <ns> svc/<geth-svc> 8546:8546   # second terminal
```

Then in `config/backend.env` keep:
```
ETHEREUM_JSONRPC_HTTP_URL=http://host.docker.internal:8545
ETHEREUM_JSONRPC_WS_URL=ws://host.docker.internal:8546
ETHEREUM_JSONRPC_TRACE_URL=http://host.docker.internal:8545
```
(`host.docker.internal` lets the backend container reach the host's forwarded port.
On Linux without Docker Desktop, use `172.17.0.1`.)

Verify connectivity:
```bash
curl -X POST http://localhost:8545 -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

## 4. Build & run

```bash
make build      # rebranded frontend image
make up         # full stack
make logs       # watch indexing
make health     # all green?
```

Open `http://localhost`.

## 5. Production on AWS

Two supported topologies:

**A. Single EC2 (simple):** run this compose on an `m5.xlarge` (4 vCPU/16 GB), gp3 EBS
≥100 GB. Put Geth and Blockscout in the same VPC; the backend reaches Geth over the
**private** Service DNS/IP (never expose `8545` publicly). Front with an **ALB + ACM
cert**; forward 443→proxy:80.

**B. Direct on EKS (cloud-native):** translate the compose to a Helm release / manifests
(Postgres via RDS, Redis via ElastiCache recommended). The backend connects to the Geth
Service in-cluster: `http://<geth-svc>.<ns>.svc.cluster.local:8545`. Expose the proxy via
an Ingress + ACM cert.

In production set, in `config/frontend.env`:
```
NEXT_PUBLIC_API_PROTOCOL=https
NEXT_PUBLIC_WS_PROTOCOL=wss
NEXT_PUBLIC_APP_HOST=explorer.yourdomain.com
NEXT_PUBLIC_API_HOST=explorer.yourdomain.com
```
then `make rebuild-frontend && make up`.

## 5b. Frontend image — built in CI (required)

The rebranded frontend image is **built in CI**, not on the dev machine (Blockscout's
Next build needs ~6–8 GiB RAM). The workflow `.github/workflows/build-frontend.yml`:
forks upstream → injects overlays/assets/patches → builds with upstream's Dockerfile →
pushes to GHCR.

**One-time setup**
1. Push this repo to GitHub.
2. The workflow uses the built-in `GITHUB_TOKEN` (no extra secret) to push to
   `ghcr.io/<owner>/voltuswave-frontend`. Ensure Actions has `packages: write` (default).
3. Trigger: push to `main` touching `frontend/**` or `config/brand.env`, or run the
   **Build rebranded frontend** workflow manually (`workflow_dispatch`).

**Deploy the built image** (instead of building locally):
```bash
# set the tag the workflow pushed
echo "FRONTEND_IMAGE=ghcr.io/<owner>/voltuswave-frontend:latest" >> .env
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

To rebrand later: edit `config/brand.env`, push → CI rebuilds → `docker compose ... pull frontend && up -d`.

> On a host **with** ≥8 GiB you can still build locally with `make build` (no CI needed).

## 6. Smoke test (post-deploy)

```bash
make health
curl -s http://<host>/api/v2/blocks | head
curl -s http://<host>/api/v2/stats  | head
```
Confirm blocks increment in the UI and a sample tx shows internal txs (validates
`debug` + archive).
