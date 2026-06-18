# Frontend Fork — Rebrand Architecture

The rebranded frontend image is produced from a **pinned upstream fork** built with
**upstream's own production Dockerfile** (which correctly handles runtime env injection,
favicon generation, and the SVG sprite build). Our rebrand is layered on top in three
clearly-separated mechanisms.

## Pipeline

```
make fork      → scripts/fork-frontend.sh    : clone upstream @ pinned tag → frontend/_upstream
make build     → scripts/prepare-frontend.sh : inject rebrand into _upstream, then docker build
                  1. render-config.sh         → frontend/patches/brand.generated.json (from brand.env)
                  2. copy frontend/overlays/* → _upstream/*        (full-file replacements)
                  3. copy frontend/public/assets/* → _upstream/public/assets + /static
                  4. node apply-brand-patches.js → token/metadata edits
                  5. docker compose build frontend (upstream Dockerfile)
```

Re-running is safe (idempotent). After changing `config/brand.env`, run `make rebuild-frontend`.

## Three rebrand mechanisms

### 1. Runtime env (config/frontend.env) — no rebuild needed
Blockscout re-injects `NEXT_PUBLIC_*` at container start, so these apply on `make up`:
- `NEXT_PUBLIC_PROMOTE_BLOCKSCOUT_IN_TITLE=false` — **removes "Blockscout" from page titles**
- `NEXT_PUBLIC_NETWORK_NAME`, `_SHORT_NAME`
- `NEXT_PUBLIC_NETWORK_LOGO`, `_LOGO_DARK`, `_ICON`, `_ICON_DARK`
- `NEXT_PUBLIC_FOOTER_LINKS` → our `footer-links.json` (custom columns)
- `NEXT_PUBLIC_OG_DESCRIPTION`
- `FAVICON_MASTER_URL` + `BRAND_NAME` → favicon regenerated from our icon at start

### 2. Full-file overlays (frontend/overlays/) — baked into image
For surfaces too structural for env. Each file mirrors its upstream path and is copied
over the source before build:
- `ui/snippets/footer/Footer.tsx` — removes the Blockscout links column, "Made with
  Blockscout" block, product description, and blockscout-github version links; renders
  only operator footer columns + brand copyright (token injected at build).
- `deploy/tools/favicon-generator/index.js` — `appName` from `BRAND_NAME`; reads the
  bundled local icon (no external hosting needed).

### 3. Token/metadata patches (apply-brand-patches.js) — baked into image
Mechanical edits, each independent and skip-with-warning if upstream moves:
- Inject `BRAND_FOOTER_COPYRIGHT` into the overlaid footer copyright token.
- `package.json` → brand name/description (repository field dropped).
- Defensive sweep of any quoted `"Blockscout"` display defaults in `configs/app`.

## Updating the pinned version

1. Bump `FRONTEND_TAG` in `scripts/fork-frontend.sh` (and `.env`).
2. `make fork` to re-materialize.
3. `make build`. If `apply-brand-patches.js` prints `[skip]` for the footer or a path
   moved, open the overlaid file path in `_upstream`, re-sync the overlay in
   `frontend/overlays/`, rebuild. Verify with the checklist below.

## Verification checklist

- `grep -ri blockscout` over the **built** `public/` and rendered UI text → only SPDX /
  license / source comments (allowed); no visible UI strings.
- Footer: only Voltuswave column + "© 2026 Voltuswave…"; no "Made with Blockscout".
- Browser tab title and PWA name = Voltuswave; favicon = Voltuswave hex-V.
- Header logo = Voltuswave (white-text variant in dark mode).

## License compliance (GPL-3.0)

Overlays and patches retain the `LICENSE` file and in-source `SPDX`/copyright headers.
Only user-visible branding is changed. Distribute corresponding source under GPL-3.0.
