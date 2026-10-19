/* Travel with Oumaima — Cloudflare Pages worker
   Sert /api/* (admin: contenu + photos, stockés en KV), sinon les fichiers statiques. */

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-cache', ...extra },
  });
}

// Mot de passe : d'abord celui défini par l'admin (KV), sinon la variable
// d'environnement, sinon la valeur par défaut.
async function getPwd(env) {
  const stored = await env.SITE_KV.get('admin_password');
  return (stored && stored.trim()) || env.ADMIN_PASSWORD || 'oumaima2026';
}

async function isAuth(req, env) {
  const pwd = await getPwd(env);
  return (req.headers.get('authorization') || '') === 'Bearer ' + pwd;
}

async function handleApi(req, env, path) {
  const pwd = await getPwd(env);

  if (path === 'login' && req.method === 'POST') {
    const body = await req.json().catch(() => ({}));
    if (body.password === pwd) return json({ ok: true, token: pwd });
    return json({ ok: false, error: 'Mot de passe incorrect' }, 401);
  }

  if (path === 'change-password' && req.method === 'POST') {
    if (!(await isAuth(req, env))) return json({ error: 'unauthorized' }, 401);
    const body = await req.json().catch(() => ({}));
    const np = (body.newPassword || '').trim();
    if (np.length < 6) return json({ ok: false, error: 'Le mot de passe doit faire au moins 6 caractères' }, 400);
    await env.SITE_KV.put('admin_password', np);
    return json({ ok: true, token: np });
  }

  if (path === 'content') {
    if (req.method === 'GET') {
      const data = await env.SITE_KV.get('content');
      if (!data) return json({ error: 'not-found' }, 404);
      return new Response(data, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          // cache CDN 60s pour économiser les requêtes, no-store côté navigateur admin
          'Cache-Control': 'public, max-age=60',
        },
      });
    }
    if (req.method === 'PUT' || req.method === 'POST') {
      if (!(await isAuth(req, env))) return json({ error: 'unauthorized' }, 401);
      const text = await req.text();
      try { JSON.parse(text); } catch { return json({ error: 'invalid-json' }, 400); }
      await env.SITE_KV.put('content', text);
      return json({ ok: true });
    }
  }

  if (path === 'upload' && req.method === 'POST') {
    if (!(await isAuth(req, env))) return json({ error: 'unauthorized' }, 401);
    const body = await req.json().catch(() => null);
    if (!body || !body.data || !body.name) return json({ error: 'invalid' }, 400);
    const ext = (body.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    const key = Date.now() + '-' + body.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-');
    const bin = Uint8Array.from(atob(body.data), c => c.charCodeAt(0));
    await env.SITE_KV.put('img:' + key, bin.buffer, { metadata: { type: ext } });
    return json({ ok: true, url: '/api/img/' + key });
  }

  if (path === 'images' && req.method === 'GET') {
    if (!(await isAuth(req, env))) return json({ error: 'unauthorized' }, 401);
    const list = await env.SITE_KV.list({ prefix: 'img:' });
    return json({ images: list.keys.map(k => ({ key: k.name.slice(4), url: '/api/img/' + k.name.slice(4) })) });
  }

  if (path.startsWith('img/')) {
    const key = 'img:' + decodeURIComponent(path.slice(4));
    if (req.method === 'GET') {
      const { value, metadata } = await env.SITE_KV.getWithMetadata(key, { type: 'arrayBuffer' });
      if (!value) return new Response('Not found', { status: 404 });
      const ext = (metadata && metadata.type) || 'jpg';
      const mime = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' }[ext] || 'image/jpeg';
      return new Response(value, {
        headers: { 'Content-Type': mime, 'Cache-Control': 'public, max-age=604800' },
      });
    }
    if (req.method === 'DELETE') {
      if (!(await isAuth(req, env))) return json({ error: 'unauthorized' }, 401);
      await env.SITE_KV.delete(key);
      return json({ ok: true });
    }
  }

  return json({ error: 'not-found', path }, 404);
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname.startsWith('/api/')) {
      return handleApi(req, env, url.pathname.slice(5));
    }
    return env.ASSETS.fetch(req);
  },
};
