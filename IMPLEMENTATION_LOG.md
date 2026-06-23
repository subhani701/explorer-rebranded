# Implementation Log — Private Geth Blockchain Explorer

A running log of every decision and change. Newest entries at the top of each section.

---

## Project Summary

A production-grade blockchain explorer for a **private Geth network**, built on the
Blockscout engine (GPL-3.0) with a **fully custom, config-driven rebrand** and **no
visible Blockscout identity** in the product. The chain runs on **AWS EKS**; the explorer
is developed locally first, then deployed.

### Architecture decisions (locked)

| Concern | Decision | Rationale |
|---|---|---|
| Indexer/backend | Official `blockscout/blockscout` image, pinned | Mature, maintained; all config via env — no fork needed |
| Frontend | **Forked + custom Docker image** | Only way to fully remove "Made with Blockscout", favicon, package metadata, splash/loading branding |
| Branding | Single source of truth: `config/brand.env` | Config-driven rebrand; no scattered hardcoded strings |
| Datastore | PostgreSQL 16 + Redis 7 | Blockscout's supported stack |
| Microservices | stats, smart-contract-verifier, visualizer, sig-provider | Full explorer feature parity (charts, verification, tx decoding) |
| Reverse proxy | nginx | Single ingress, TLS termination point, health endpoints |
| Test strategy | Against the real EKS chain (per owner) | Validate true chain data |
| License posture | Keep `LICENSE` + source copyright headers; remove all **visible** branding | GPL-3.0 compliant; trademark-clean fork |

### License note (GPL-3.0)

Blockscout is GPL-3.0. Removing **visible** branding (name, logos, favicon, footer,
titles, social links) is fully permitted. We **retain** the `LICENSE` file and in-source
copyright/license headers, and keep source available under GPL on distribution. End users
see zero Blockscout identity; the repository stays license-compliant.

---

## Brand identity (received)

**Voltuswave** — assets supplied in `Branding/assets/` (logo.svg, icon.png, favicon.ico/png,
footer.json). Wired into `config/brand.env`:
- Primary `#E6262A` (red), secondary `#0F0F0F` (near-black) — from the logo.
- Logo wordmark + hex-V mark; generated a **dark-mode logo variant** (black text → white).
- Footer column: Voltuswave (About Us, Contact) → voltuswave.com.
- Replaces the owner's prior **runtime DOM hack** (`hide-blockscout.js` + `custom.css`),
  which caused a branding flash and didn't touch title/favicon/manifest.

## Chain (received + verified)

Public EKS ELB RPC — `http://a69fac0e1aa0642eb9bb6cf285ca4395-148367067.ap-south-1.elb.amazonaws.com`
(WS at `/ws`). Verified reachable from the build host:

| Check | Result |
|---|---|
| Client | `Geth/v1.13.15-stable` |
| Chain ID | `0x12d687` = **1234567** ✓ |
| Net version | 1234567 ✓ |
| Block height | ~**1,191,177** (note: larger than the earlier "small <100k" estimate) |
| Peers | 3, `eth_syncing` = false (synced) |
| **debug API** | `debug_traceBlockByNumber` (callTracer) returns `[]`, not "method not found" → **enabled** ✓ |
| **Archive** | `eth_getBalance` @ block `0x1` returns a value, not "missing trie node" → **archive** ✓ |
| Consensus | Clique PoA (genesis difficulty `0x1`, signer extraData) ✓ |
| Native coin | **VW** (Voltus) — wired into backend/brand/frontend (was ETH placeholder) |

All explorer-critical RPCs (debug/trace + archive) are available. No blockers remain on
the chain side.

---

## Change Log

### 2026-06-18 — Project foundation
- Created project skeleton under `E:\BlockChain- REBORN\Branding`.
- Authored config-driven branding template, full-stack `docker-compose.yml`, backend/frontend
  env templates, nginx proxy, Makefile, backup/restore/health scripts, docs suite.

### 2026-06-18 — Brand integration (Voltuswave)
- Read supplied assets; set `config/brand.env` with Voltuswave identity + colors.
- Copied assets into the frontend build context; generated dark-mode logo variant.

### 2026-06-18 — Frontend fork + rebrand (real source)
- Verified toolchain: Docker (daemon up), Compose, git, Node 20.
- Materialized upstream `blockscout/frontend` **@ v2.8.0** → `frontend/_upstream` (4,341 files).
- Inspected real source: footer (`ui/snippets/footer/Footer.tsx`), favicon generator,
  meta config. Found upstream uses **pnpm + Node 22 + multi-stage Dockerfile with runtime
  env injection** — so we build with **upstream's own Dockerfile**, not a hand-rolled one.
- Rebrand split into 3 mechanisms (see `frontend/REBRAND.md`):
  1. Runtime env (`config/frontend.env`) incl. `PROMOTE_BLOCKSCOUT_IN_TITLE=false`.
  2. Full-file overlays (`frontend/overlays/`): branded `Footer.tsx`, favicon generator.
  3. Token/metadata patches (`apply-brand-patches.js`): copyright, package.json, config sweep.
- Authored `scripts/prepare-frontend.sh` (idempotent injection) + Makefile `fork`/`prepare`/`build`.
- **Validated** the injection against real source: overlays applied, footer copyright →
  "© 2026 Voltuswave", `package.json` name → `voltuswave`, no visible Blockscout strings
  remain in the footer (only SPDX/maintainer comments, stripped from prod JS).
- **Status:** rebrand wired + validated in source.

### 2026-06-18 — Backend live against the real chain (END-TO-END VERIFIED)
- Fixed image pins (guessed versions didn't exist) → verified `:latest` resolves for backend
  + all microservices (documented: pin to digests for prod).
- Brought up db, redis, backend, stats-db, verifier, visualizer, sig-provider — **all healthy**.
- Backend connected to the Voltuswave ELB RPC and **indexed live**: block_catchup fetcher
  walking the chain from the tip; **185k+ blocks indexed within minutes** (range 1.0M→1.19M).
- **Fixed API rate limit**: default global limiter returned `429` on every call →
  `API_RATE_LIMIT_DISABLED=true` for this private explorer (documented re-enable for public).
- **API verified serving real data**: `/api/v2/main-page/blocks` (real blocks, Clique
  difficulty 2, zero-address coinbase), `/api/v2/stats` (total_blocks, addresses, block time).
- **Transactions = 0 confirmed correct**, not a bug: RPC sampling across the whole history
  (blocks 0x10000…0x122d00) shows every block has 0 txs — the chain produces empty blocks.

### 2026-06-18 — Frontend via CI (owner decision)
- Dev machine has only **7.3 GiB RAM**; Blockscout frontend build OOMs (needs ~6–8 GiB).
- Per owner: build the fully-rebranded image in **GitHub Actions** (CI runner has the RAM).
- Added `.github/workflows/build-frontend.yml` (fork → prepare → build → push to GHCR) and
  `docker-compose.prod.yml` (deploy by pulling the CI image; no local build).
- **Status:** backend/indexer/API/stats fully working on the real chain. Frontend image
  builds in CI on push; deploy pulls it. Remaining: run CI build, then bring up frontend+proxy.

### 2026-06-18 — Stats/charts + full API validation
- `stats` service needed `STATS__BLOCKSCOUT_API_URL=http://backend:4000` → added to compose;
  now reports `{"status":"SERVING"}` and tracks indexing status.
- Validated more API surface: `/api/v2/addresses/{addr}` (signer with ~393.59 VW balance),
  `/api/v2/blocks/{n}`, `/api/v2/search?q=` (returns block with `/block/...` URL).
- Full backend stack healthy: db, redis, backend, stats, stats-db, verifier, visualizer,
  sig-provider. Indexing ongoing (300k+/1.19M, climbing fast).

### 2026-06-19 — Full chain indexed + CI live
- **Indexing complete: 100%** — block 0 (genesis) → tip 1,198,309, **1,198,317 blocks**.
  Entire chain history in the explorer; backend healthy.
- Pushed repo to GitHub (`subhani701/explorer-rebranded`, public).
- First CI run hit `startup_failure` (top-level `env` github-context expressions) →
  fixed by computing image name/tag in a step. Re-run **building** (image:
  `ghcr.io/subhani701/voltuswave-frontend`).

## Remaining work
- [ ] CI build to finish → rebranded frontend image on GHCR (monitoring).
- [ ] `FRONTEND_IMAGE=ghcr.io/subhani701/voltuswave-frontend:latest \
      docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d frontend proxy`
      → branded UI at http://localhost; visual rebrand verification.
- [ ] Add GPL/Blockscout LICENSE/NOTICE to the public repo (compliance).
- [ ] Pin image digests (`docker compose images`) for reproducible prod.
