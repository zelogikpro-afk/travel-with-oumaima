/* ============================================================
   TRAVEL WITH OUMAIMA — Content Loader
   Charge content.json et met à jour le DOM
   ============================================================ */

async function loadSiteContent() {
  try {
    const res = await fetch('/api/content?t=' + Date.now());
    if (!res.ok) return;
    const c = await res.json();
    applyHero(c.hero || {});
    applyPhilosophy(c.philosophy || {});
    applyDepartures(c.departures || []);
    applyContact(c.contact || {});
    applySEO(c.seo || {});
  } catch (e) {
    console.warn('Content loader: impossible de charger content.json', e);
  }
}

/* ── HERO ─────────────────────────────────────────────────── */
function applyHero(h) {
  setText('hero-badge-text', h.badge);
  setText('hero-subtitle-text', h.subtitle);
  setLink('hero-cta1', h.cta1_link, h.cta1_text);
  setLink('hero-cta2', h.cta2_link, h.cta2_text);
}

/* ── PHILOSOPHY ───────────────────────────────────────────── */
function applyPhilosophy(p) {
  setText('phil-title', p.title);
  setText('phil-text1', p.text1);
  setText('phil-text2', p.text2);
  setText('phil-stat1-num', p.stat1_num);
  setText('phil-stat1-label', p.stat1_label);
  setText('phil-stat2-num', p.stat2_num);
  setText('phil-stat2-label', p.stat2_label);
  setText('phil-stat3-num', p.stat3_num);
  setText('phil-stat3-label', p.stat3_label);
}

/* ── DEPARTURES ───────────────────────────────────────────── */
function applyDepartures(deps) {
  const container = document.getElementById('dep-dynamic-grid');
  if (!container) return;

  const visible = deps.filter(d => d.visible !== false);

  if (visible.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#999;padding:40px;">Aucun départ disponible pour le moment. Revenez bientôt !</p>';
    return;
  }

  container.innerHTML = visible.map(dep => `
    <div class="dep-card reveal">
      <div class="dep-image">
        <img src="${dep.image || ''}" alt="${esc(dep.title)}" loading="lazy" onerror="this.parentElement.style.background='#1F2B22'">
        ${dep.spots ? `<span class="dep-badge" style="background:${dep.badge_color || '#B87333'}">${esc(dep.spots)}</span>` : ''}
      </div>
      <div class="dep-content">
        <div class="dep-meta">
          ${dep.date ? `<span>📅 ${esc(dep.date)}</span>` : ''}
          ${dep.duration ? `<span>⏱ ${esc(dep.duration)}</span>` : ''}
        </div>
        <h3 class="t-title">${esc(dep.title)}</h3>
        <p style="font-size:0.82rem;color:var(--text-light);line-height:1.6;">${esc(dep.description)}</p>
        <div class="dep-footer">
          <div class="dep-price">
            <span class="amount">${esc(dep.price)} <span style="font-size:1rem;">${esc(dep.currency || 'MAD')}</span></span>
            <span class="per">${esc(dep.price_note || '')}</span>
          </div>
          ${dep.spots_urgency ? `<span class="dep-spots">${esc(dep.spots_urgency)}</span>` : ''}
        </div>
        <a href="https://wa.me/${esc(dep.whatsapp || '212600000000')}" class="dep-btn" target="_blank">Je rejoins l'aventure →</a>
      </div>
    </div>
  `).join('');

  // Ré-activer les animations reveal sur les nouvelles cards
  document.querySelectorAll('#dep-dynamic-grid .reveal').forEach(el => {
    revealObserver && revealObserver.observe(el);
  });
}

/* ── CONTACT ──────────────────────────────────────────────── */
function applyContact(c) {
  // WhatsApp — tous les liens wa.me
  const wa = c.whatsapp || '212600000000';
  document.querySelectorAll('[data-contact="whatsapp"]').forEach(el => {
    el.href = 'https://wa.me/' + wa;
  });
  // Instagram
  const ig = c.instagram || '';
  document.querySelectorAll('[data-contact="instagram"]').forEach(el => {
    el.href = ig ? 'https://instagram.com/' + ig : '#';
    const label = el.querySelector('[data-label]');
    if (label) label.textContent = ig ? '@' + ig : '';
  });
  // Email
  const mail = c.email || '';
  document.querySelectorAll('[data-contact="email"]').forEach(el => {
    el.href = mail ? 'mailto:' + mail : '#';
    const label = el.querySelector('[data-label]');
    if (label) label.textContent = mail;
  });
  // Facebook
  const fb = c.facebook || '';
  document.querySelectorAll('[data-contact="facebook"]').forEach(el => {
    el.href = fb ? (fb.startsWith('http') ? fb : 'https://facebook.com/' + fb) : '#';
  });
  // TikTok
  const tt = c.tiktok || '';
  document.querySelectorAll('[data-contact="tiktok"]').forEach(el => {
    el.href = tt ? 'https://tiktok.com/@' + tt : '#';
  });
}

/* ── SEO ──────────────────────────────────────────────────── */
function applySEO(s) {
  if (s.title) document.title = s.title;
  const desc = document.querySelector('meta[name="description"]');
  if (desc && s.description) desc.content = s.description;
}

/* ── HELPERS ──────────────────────────────────────────────── */
function setText(id, val) {
  if (!val && val !== 0) return;
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function setLink(id, href, text) {
  const el = document.getElementById(id);
  if (!el) return;
  if (href) el.href = href;
  if (text) el.textContent = text;
}

function esc(str) {
  return (str || '').toString()
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Lancer au chargement de la page
document.addEventListener('DOMContentLoaded', loadSiteContent);
