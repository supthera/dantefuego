import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { unlockStuckPrintifyProducts } from '../lib/printify-admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

loadEnv(path.join(ROOT, '.env'));

const productIds = process.argv.slice(2).filter(Boolean);
const token = process.env.PRINTIFY_TOKEN || process.env.Printify_Token;

if (!token) {
  console.error('Missing PRINTIFY_TOKEN. Add it to .env first.');
  process.exit(1);
}

const report = await unlockStuckPrintifyProducts({
  token,
  shopId: process.env.PRINTIFY_SHOP_ID,
  productIds
});

console.log(JSON.stringify(report, null, 2));

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;

  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}
