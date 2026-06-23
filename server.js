const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = 8765;
const ROOT = path.join(__dirname);
const CONTENT_FILE = path.join(ROOT, 'site', 'content.json');
const ADMIN_PASSWORD = 'oumaima2026'; // ← Changez ce mot de passe !
const sessions = new Set();

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { resolve({}); }
    });
  });
}

function isAuth(req) {
  const cookie = req.headers.cookie || '';
  const match = cookie.match(/session=([^;]+)/);
  return match && sessions.has(match[1]);
}

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
}

function json(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}

http.createServer(async (req, res) => {
  const urlPath = req.url.split('?')[0];
  const method = req.method;

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST', 'Access-Control-Allow-Headers': 'Content-Type' });
    return res.end();
  }

  // ── API LOGIN ──────────────────────────────────────────────
  if (urlPath === '/api/login' && method === 'POST') {
    const body = await parseBody(req);
    if (body.password === ADMIN_PASSWORD) {
      const token = crypto.randomBytes(24).toString('hex');
      sessions.add(token);
      res.writeHead(200, { 'Set-Cookie': `session=${token}; Path=/; HttpOnly`, 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ ok: true, token }));
    }
    return json(res, { ok: false, error: 'Mot de passe incorrect' }, 401);
  }

  // ── API LOGOUT ─────────────────────────────────────────────
  if (urlPath === '/api/logout' && method === 'POST') {
    const cookie = (req.headers.cookie || '').match(/session=([^;]+)/);
    if (cookie) sessions.delete(cookie[1]);
    res.writeHead(200, { 'Set-Cookie': 'session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT' });
    return res.end(JSON.stringify({ ok: true }));
  }

  // ── API GET CONTENT ────────────────────────────────────────
  if (urlPath === '/api/content' && method === 'GET') {
    return serveFile(res, CONTENT_FILE);
  }

  // ── API SAVE CONTENT ───────────────────────────────────────
  if (urlPath === '/api/content' && method === 'POST') {
    if (!isAuth(req)) return json(res, { ok: false, error: 'Non autorisé' }, 401);
    const body = await parseBody(req);
    fs.writeFile(CONTENT_FILE, JSON.stringify(body, null, 2), (err) => {
      if (err) return json(res, { ok: false, error: err.message }, 500);
      json(res, { ok: true });
    });
    return;
  }

  // ── CHECK AUTH ─────────────────────────────────────────────
  if (urlPath === '/api/auth' && method === 'GET') {
    return json(res, { authenticated: isAuth(req) });
  }

  // ── STATIC FILES ───────────────────────────────────────────
  let filePath;
  if (urlPath === '/' || urlPath === '/site' || urlPath === '/site/') {
    filePath = path.join(ROOT, 'site', 'index.html');
  } else {
    filePath = path.join(ROOT, urlPath);
  }

  // Handle directories → index.html
  try {
    if (fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
  } catch(e) {}

  serveFile(res, filePath);

}).listen(PORT, () => {
  console.log('\n✅ Travel with Oumaima — Serveur démarré');
  console.log('   Site:  http://localhost:' + PORT + '/site/');
  console.log('   Admin: http://localhost:' + PORT + '/site/admin.html');
  console.log('   Mot de passe admin: oumaima2026\n');
});
