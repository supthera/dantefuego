import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchPrintifyProducts, jsonResponse } from './lib/printify.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const PORT = Number(process.env.PORT || 8080);

loadEnv(path.join(ROOT, '.env'));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8'
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);

    if (url.pathname === '/api/products') {
      if (req.method === 'OPTIONS') {
        res.writeHead(204, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
        return;
      }

      if (req.method !== 'GET') {
        sendJson(res, { error: 'Method not allowed' }, 405);
        return;
      }

      const data = await fetchPrintifyProducts({
        token: process.env.PRINTIFY_TOKEN,
        shopId: process.env.PRINTIFY_SHOP_ID
      });

      sendJson(res, { data }, 200);
      return;
    }

    serveStatic(res, url.pathname);
  } catch (error) {
    console.error(error);
    sendJson(res, { error: error.message || 'Server error' }, 500);
  }
});

server.listen(PORT, () => {
  console.log(`Dante Fuego dev server → http://localhost:${PORT}`);
  if (!process.env.PRINTIFY_TOKEN) {
    console.warn('Warning: set PRINTIFY_TOKEN in .env to load live Printify listings.');
  }
});

function serveStatic(res, pathname) {
  const safePath = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.join(ROOT, path.normalize(safePath).replace(/^(\.\.[/\\])+/, ''));

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404).end('Not found');
    return;
  }

  const ext = path.extname(filePath);
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
}

function sendJson(res, body, status) {
  const response = jsonResponse(body, status);
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(JSON.stringify(body));
}

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
