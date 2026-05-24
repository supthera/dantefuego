import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPrintifyEnv } from './lib/env.js';
import { unlockStuckPrintifyProducts } from './lib/printify-admin.js';
import { fetchCatalogProduct, fetchCatalogProducts } from './lib/catalog.js';
import { createCheckoutSession, getCheckoutSessionStatus } from './lib/stripe.js';
import { handleStripeWebhook } from './lib/stripe-webhook.js';
import { jsonResponse } from './lib/printify.js';
import { getHealthStatus } from './lib/health.js';

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
  '.gif': 'image/gif',
  '.png': 'image/png',
  '.txt': 'text/plain; charset=utf-8'
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);

    if (url.pathname === '/api/health') {
      if (req.method !== 'GET') {
        sendJson(res, { error: 'Method not allowed' }, 405);
        return;
      }

      const status = await getHealthStatus(process.env);

      sendJson(res, status, status.ok ? 200 : 503);
      return;
    }

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

      const data = await fetchCatalogProducts(process.env);

      sendJson(res, { data }, 200);
      return;
    }

    if (url.pathname === '/api/checkout/create-session') {
      if (req.method === 'OPTIONS') {
        res.writeHead(204, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
        return;
      }

      if (req.method !== 'POST') {
        sendJson(res, { error: 'Method not allowed' }, 405);
        return;
      }

      const body = await readJsonBody(req);
      const session = await createCheckoutSession(process.env, body, {
        url: `http://${req.headers.host}${url.pathname}`
      });
      sendJson(res, session, 200);
      return;
    }

    if (url.pathname === '/api/checkout/config') {
      if (req.method !== 'GET') {
        sendJson(res, { error: 'Method not allowed' }, 405);
        return;
      }

      const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || '';
      if (!publishableKey) {
        sendJson(res, { error: 'Missing STRIPE_PUBLISHABLE_KEY' }, 503);
        return;
      }

      sendJson(res, { publishableKey }, 200);
      return;
    }

    if (url.pathname === '/api/contact/config') {
      if (req.method !== 'GET') {
        sendJson(res, { error: 'Method not allowed' }, 405);
        return;
      }

      const accessKey = process.env.WEB3FORMS_ACCESS_KEY || '';
      if (!accessKey) {
        sendJson(res, { error: 'Missing WEB3FORMS_ACCESS_KEY' }, 503);
        return;
      }

      sendJson(res, {
        accessKey,
        contactEmail: process.env.CONTACT_EMAIL || process.env.NOTIFY_EMAIL || 'hello@dantefuego.com'
      }, 200);
      return;
    }

    if (url.pathname === '/api/checkout/session-status') {
      if (req.method !== 'GET') {
        sendJson(res, { error: 'Method not allowed' }, 405);
        return;
      }

      try {
        const sessionId = url.searchParams.get('session_id');
        const data = await getCheckoutSessionStatus(process.env, sessionId);
        sendJson(res, data, 200);
      } catch (error) {
        sendJson(res, { error: error.message || 'Failed to retrieve session' }, 400);
      }
      return;
    }

    if (url.pathname === '/api/stripe/webhook') {
      if (req.method !== 'POST') {
        sendJson(res, { error: 'Method not allowed' }, 405);
        return;
      }

      const rawBody = await readRawBody(req);
      const signature = req.headers['stripe-signature'] || '';
      const result = await handleStripeWebhook(process.env, rawBody, signature);
      sendJson(res, result, 200);
      return;
    }

    if (url.pathname === '/api/printify/unlock-stuck') {
      if (req.method !== 'POST') {
        sendJson(res, { error: 'Method not allowed' }, 405);
        return;
      }

      const { token, shopId } = getPrintifyEnv(process.env);
      if (!token) {
        sendJson(res, { error: 'Missing Printify token' }, 503);
        return;
      }

      const report = await unlockStuckPrintifyProducts({ token, shopId });
      sendJson(res, report, 200);
      return;
    }

    const productMatch = url.pathname.match(/^\/api\/products\/([^/]+)$/);
    if (productMatch) {
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

      try {
        const data = await fetchCatalogProduct(process.env, productMatch[1]);
        sendJson(res, { data }, 200);
      } catch (error) {
        const status = error.message === 'Product not found' ? 404 : 500;
        sendJson(res, { error: error.message || 'Failed to load product' }, status);
      }
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

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
      } catch (error) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}
