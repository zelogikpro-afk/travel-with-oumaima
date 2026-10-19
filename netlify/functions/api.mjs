import { getStore } from '@netlify/blobs';

const PASSWORD = process.env.ADMIN_PASSWORD || 'oumaima2026';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
  });
}

function isAuth(req) {
  const h = req.headers.get('authorization') || '';
  return h === 'Bearer ' + PASSWORD;
}

export default async (req) => {
  const url = new URL(req.url);
  // path après /api/  (redirect /api/* -> /.netlify/functions/api/:splat)
  const path = url.pathname.replace(/^\/(\.netlify\/functions\/api|api)\/?/, '');

  /* ── LOGIN ── */
  if (path === 'login' && req.method === 'POST') {
    const body = await req.json().catch(() => ({}));
    if (body.password === PASSWORD) return json({ ok: true, token: PASSWORD });
    return json({ ok: false, error: 'Mot de passe incorrect' }, 401);
  }

  /* ── CONTENT ── */
  if (path === 'content') {
    const store = getStore('site-content');
    if (req.method === 'GET') {
      const data = await store.get('content', { type: 'json' });
      if (!data) return json({ error: 'not-found' }, 404);
      return json(data);
    }
    if (req.method === 'PUT' || req.method === 'POST') {
      if (!isAuth(req)) return json({ error: 'unauthorized' }, 401);
      const body = await req.json().catch(() => null);
      if (!body || typeof body !== 'object') return json({ error: 'invalid-json' }, 400);
      await store.setJSON('content', body);
      return json({ ok: true });
    }
  }

  /* ── UPLOAD IMAGE (base64) ── */
  if (path === 'upload' && req.method === 'POST') {
    if (!isAuth(req)) return json({ error: 'unauthorized' }, 401);
    const body = await req.json().catch(() => null);
    if (!body || !body.data || !body.name) return json({ error: 'invalid' }, 400);
    const ext = (body.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    const key = Date.now() + '-' + body.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-');
    const bin = Uint8Array.from(atob(body.data), c => c.charCodeAt(0));
    const store = getStore('site-images');
    await store.set(key, bin, { metadata: { type: ext } });
    return json({ ok: true, url: '/api/img/' + key });
  }

  /* ── LIST IMAGES ── */
  if (path === 'images' && req.method === 'GET') {
    if (!isAuth(req)) return json({ error: 'unauthorized' }, 401);
    const store = getStore('site-images');
    const { blobs } = await store.list();
    return json({ images: blobs.map(b => ({ key: b.key, url: '/api/img/' + b.key })) });
  }

  /* ── SERVE / DELETE IMAGE ── */
  if (path.startsWith('img/')) {
    const key = decodeURIComponent(path.slice(4));
    const store = getStore('site-images');
    if (req.method === 'GET') {
      const res = await store.getWithMetadata(key, { type: 'arrayBuffer' });
      if (!res) return new Response('Not found', { status: 404 });
      const ext = (res.metadata && res.metadata.type) || 'jpg';
      const mime = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' }[ext] || 'image/jpeg';
      return new Response(res.data, {
        headers: { 'Content-Type': mime, 'Cache-Control': 'public, max-age=604800' },
      });
    }
    if (req.method === 'DELETE') {
      if (!isAuth(req)) return json({ error: 'unauthorized' }, 401);
      await store.delete(key);
      return json({ ok: true });
    }
  }

  return json({ error: 'not-found', path }, 404);
};

export const config = { path: '/api/*' };
