# Rebranding Guide

All visible branding is config-driven. The product ships with **zero visible Blockscout
identity**; the GPL-3.0 `LICENSE` and in-source copyright headers are retained (invisible
to end users) for license compliance.

## Single source of truth

Edit `config/brand.env`. Apply with:

```bash
make rebuild-frontend    # bakes build-time assets (favicon, package meta)
make up
```

## What each value controls

| Value | Surface |
|---|---|
| `BRAND_NAME`, `BRAND_SHORT_NAME` | Header, page titles, footer copyright |
| `BRAND_NETWORK_NAME` | Network label across the UI + API |
| `BRAND_META_TITLE` / `BRAND_META_DESCRIPTION` | Browser tab title, SEO/OG tags |
| `BRAND_LOGO_URL` / `_DARK` | Header logo (light/dark) |
| `BRAND_ICON_URL` / `_DARK` | Small square icon |
| `BRAND_FAVICON_MASTER_URL` | Favicon set (generated at build) |
| `BRAND_COLOR_PRIMARY/SECONDARY/ACCENT` | Theme palette (light + dark) |
| `BRAND_FOOTER_LINKS_URL` | Footer columns (JSON, max 3 columns) |
| `BRAND_FOOTER_COPYRIGHT` | Footer copyright line |

## Assets

Place files in `frontend/public/assets/`:
- `logo.svg`, `logo-dark.svg` — wide header logo
- `icon.svg`, `icon-dark.svg` — square icon
- `favicon.svg` — favicon master (PNG/ICO variants generated at build)
- `footer-links.json` — footer columns

## Footer links format

```json
[
  { "title": "Explorer", "links": [ { "text": "Blocks", "url": "/blocks" } ] }
]
```
Max 3 columns. The default Blockscout footer column and the "Made with Blockscout"
line are removed in the fork (see below) — only your columns render.

## Source-level removals handled in the fork

These are patched in the forked `frontend/` (not achievable via env alone), all reading
from `brand.env` where a value is needed:

- "Made with Blockscout" footer line — removed.
- Default Blockscout social/GitHub links — removed.
- `package.json` name/description — set to brand.
- `<title>` / meta / Open Graph defaults — driven by `BRAND_META_*`.
- Favicon, `manifest.json`, app icons — regenerated from `favicon.svg` at build.
- Loading/splash screen logo — replaced with brand icon.

## License compliance (do not skip)

- Keep the repo's `LICENSE` file (GPL-3.0).
- Keep copyright/license headers inside source files.
- If you distribute the running app externally, make the corresponding source available
  under GPL-3.0.
- Removing the **Blockscout trademark/name** from the UI is expected and permitted.

This gives end users a fully independent-looking explorer while staying compliant.
