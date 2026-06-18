/* eslint-disable no-console */
// Rebranded favicon generator overlay.
//  - appName comes from BRAND_NAME (was hardcoded 'Blockscout').
//  - Master image may be an http(s) URL OR a local file path; defaults to the
//    bundled brand icon so favicons regenerate with no external hosting needed.
const { favicons } = require('favicons');
const fs = require('fs/promises');
const path = require('path');

generateFavicons();

async function loadMaster() {
  const masterUrl = process.env.MASTER_URL || process.env.FAVICON_MASTER_URL || '';
  if (/^https?:\/\//i.test(masterUrl)) {
    const response = await fetch(masterUrl);
    return Buffer.from(await response.arrayBuffer());
  }
  // Local path or unset -> read bundled brand icon from disk.
  const candidates = [
    masterUrl && path.resolve(process.cwd(), masterUrl.replace(/^\//, '')),
    path.resolve(process.cwd(), 'public/assets/icon.png'),
    path.resolve(process.cwd(), 'public/assets/favicon.png'),
  ].filter(Boolean);
  for (const p of candidates) {
    try { return await fs.readFile(p); } catch { /* try next */ }
  }
  throw new Error('No favicon master found (set FAVICON_MASTER_URL or bundle public/assets/icon.png)');
}

async function generateFavicons() {
  console.log('Generating favicons...');
  try {
    const source = await loadMaster();

    const configuration = {
      path: '/output',
      appName: process.env.BRAND_NAME || 'Explorer',
      icons: {
        android: true,
        appleIcon: { background: 'transparent' },
        appleStartup: false,
        favicons: true,
        windows: false,
        yandex: false,
      },
    };

    try {
      const result = await favicons(source, configuration);
      const outputDir = path.resolve(process.cwd(), 'output');
      await fs.mkdir(outputDir, { recursive: true });

      for (const image of result.images) {
        if (image.name === 'apple-touch-icon-180x180.png' || image.name === 'android-chrome-192x192.png' ||
          (!image.name.startsWith('apple-touch-icon') && !image.name.startsWith('android-chrome'))
        ) {
          await fs.writeFile(path.join(outputDir, image.name), image.contents);
        }
        if (image.name === 'android-chrome-192x192.png') {
          await fs.writeFile(path.join(outputDir, 'logo-icon.png'), image.contents);
        }
      }

      for (const file of result.files) {
        if (file.name !== 'manifest.webmanifest') {
          await fs.writeFile(path.join(outputDir, file.name), file.contents);
        }
      }

      console.log('Favicons generated successfully!');
    } catch (faviconError) {
      console.error('Error generating favicons:', faviconError);
      process.exit(1);
    }
  } catch (error) {
    console.error('Error in favicon generation process:', error);
    process.exit(1);
  }
}
