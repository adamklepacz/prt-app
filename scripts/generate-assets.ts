/**
 * Generuje ikonę i splash z tych samych proceduralnych ilustracji co w aplikacji.
 * Uruchomienie: npx tsx scripts/generate-assets.ts  (wymaga pakietu `sharp`).
 */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const sharp = require('sharp');

import { botanicalPath } from '../src/components/botanicalPaths';

const out = join(__dirname, '..', 'assets');
mkdirSync(out, { recursive: true });

const SAGE = '#5E715D';
const PAPER = '#FAF8F5';

const icon = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#6A7E68"/><stop offset="1" stop-color="#4F624E"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#g)"/>
  <circle cx="512" cy="540" r="300" fill="${PAPER}" fill-opacity="0.10"/>
  <circle cx="512" cy="540" r="200" fill="${PAPER}" fill-opacity="0.12"/>
  <g transform="translate(152 120) scale(3.6)">
    <path d="${botanicalPath('willow')}" fill="none" stroke="${PAPER}" stroke-opacity="0.92" stroke-width="1.5" stroke-linecap="round"/>
  </g>
</svg>`;

const splash = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 200 200">
  <path d="${botanicalPath('sprig')}" fill="none" stroke="${SAGE}" stroke-width="1.6" stroke-linecap="round"/>
</svg>`;

async function main() {
  await sharp(Buffer.from(icon)).flatten({ background: SAGE }).png().toFile(join(out, 'icon.png'));
  await sharp(Buffer.from(splash)).png().toFile(join(out, 'splash.png'));
  console.log('assets/icon.png, assets/splash.png gotowe');
}

main();
