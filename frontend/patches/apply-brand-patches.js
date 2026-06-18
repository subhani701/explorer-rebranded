#!/usr/bin/env node
/*
 * apply-brand-patches.js — token/metadata rebrand for the materialized upstream
 * frontend (run from inside frontend/_upstream by scripts/prepare-frontend.sh).
 *
 * Structural rebrand (footer, favicon-generator) is handled by full-file overlays
 * in frontend/overlays/. THIS script handles the mechanical bits that are easier
 * as in-place edits:
 *   1) inject BRAND_FOOTER_COPYRIGHT into the overlaid Footer copyright token
 *   2) set package.json identity
 *   3) defensive sweep of any quoted "Blockscout" display defaults in configs
 *
 * Defensive: each step is independent and SKIPS WITH A WARNING if its target
 * moved, so the build never breaks on one stale path. Never touches LICENSE or
 * in-source SPDX/copyright headers (GPL-3.0 compliance).
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const BRAND = loadBrand();
let applied = 0, warned = 0;

function loadBrand() {
  const candidates = [
    path.join(ROOT, 'patches', 'brand.generated.json'),
    path.join(__dirname, 'brand.generated.json'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  }
  return {
    name: process.env.BRAND_NAME || 'Explorer',
    shortName: process.env.BRAND_SHORT_NAME || 'Explorer',
    description: process.env.BRAND_META_DESCRIPTION || 'Blockchain explorer',
    copyright: process.env.BRAND_FOOTER_COPYRIGHT || '© Explorer',
  };
}

const ok = (m) => { applied++; console.log(`  [patch] ${m}`); };
const warn = (m) => { warned++; console.warn(`  [skip ] ${m}`); };
const abs = (p) => path.join(ROOT, p);
const has = (p) => fs.existsSync(abs(p));
const read = (p) => fs.readFileSync(abs(p), 'utf8');
const write = (p, s) => fs.writeFileSync(abs(p), s);

// 1) Inject copyright into the overlaid footer -------------------------------
(function injectFooterCopyright() {
  const p = 'ui/snippets/footer/Footer.tsx';
  if (!has(p)) return warn(`${p} not found (overlay not applied?)`);
  let src = read(p);
  if (!src.includes('__BRAND_COPYRIGHT__')) return warn('footer copyright token already replaced');
  // copyright may contain the {copy} sentinel; the component renders the © entity.
  const value = (BRAND.copyright || '').replace(/©/g, '{copy}');
  src = src.replace(/__BRAND_COPYRIGHT__/g, value.replace(/'/g, "\\'"));
  write(p, src);
  ok('footer copyright → brand');
})();

// 2) package.json identity ----------------------------------------------------
(function patchPackageJson() {
  const p = 'package.json';
  if (!has(p)) return warn('package.json not found');
  const pkg = JSON.parse(read(p));
  pkg.name = (BRAND.shortName || BRAND.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  pkg.description = BRAND.description;
  if ('author' in pkg) pkg.author = BRAND.name;
  if ('repository' in pkg) delete pkg.repository;
  write(p, JSON.stringify(pkg, null, 2) + '\n');
  ok('package.json identity → brand');
})();

// 3) Defensive sweep of quoted "Blockscout" display defaults -----------------
(function sweepConfigDefaults() {
  const dirs = ['configs/app'];
  let touched = 0;
  for (const d of dirs) {
    const dabs = abs(d);
    if (!fs.existsSync(dabs)) continue;
    for (const f of walk(dabs)) {
      if (!/\.(ts|tsx|js)$/.test(f) || /\.d\.ts$/.test(f)) continue;
      const before = fs.readFileSync(f, 'utf8');
      // Only replace quoted standalone "Blockscout" used as a display default,
      // never import paths, identifiers, env keys, or SPDX headers.
      const after = before.replace(/(['"`])Blockscout\1/g, `$1${BRAND.name}$1`);
      if (after !== before && !/SPDX/.test(before.split('\n')[0] || '')) {
        fs.writeFileSync(f, after); touched++;
      }
    }
  }
  touched ? ok(`swept ${touched} config display default(s) → brand`)
          : warn('no quoted "Blockscout" display defaults found in configs/app');
})();

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    e.isDirectory() ? out.push(...walk(p)) : out.push(p);
  }
  return out;
}

console.log(`\n[brand] patches applied: ${applied}, skipped/warned: ${warned}`);
