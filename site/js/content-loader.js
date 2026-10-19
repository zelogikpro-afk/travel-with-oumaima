/* ============================================================
   TRAVEL WITH OUMAIMA — Content Loader
   ============================================================ */

let _deps = [];
let _depModalSwiper = null;
let _shareDep = null;

async function loadSiteContent() {
  try {
    // Contenu géré par l'admin (Netlify Blobs), sinon fichier statique
    let res = await fetch('/api/content?t=' + Date.now()).catch(() => null);
    if (!res || !res.ok) res = await fetch('content.json?t=' + Date.now());
    if (!res.ok) return;
    const c = await res.json();
    applyHero(c.hero || {});
    applyPhilosophy(c.philosophy || {});
    applyDepartures(c.departures || []);
    if (window._rebuildBookingList) window._rebuildBookingList();
    renderDestCatalog();
    applySite(c.site || {});
    applyTexts(c.texts || {});
    applyContact(c.contact || {});
    applyStats(c.stats || (c.apropos && c.apropos.stats) || []);
    applySEO(c.seo || {});
    openTripFromUrl();
  } catch (e) {
    console.warn('Content loader error:', e);
  }
}

/* ── CATALOGUE DESTINATIONS (généré depuis les départs) ───── */
const TYPE_LABELS = { voyage: '🧳 Voyage', sortie: '☀️ Sortie journée', activite: '🪂 Activité' };

function renderDestCatalog() {
  const grid = document.getElementById('dest-dynamic-catalog');
  if (!grid) return;

  const deps = _deps.filter(d => d.visible !== false && d.title);
  grid.innerHTML = deps.map(d => {
    const img = (d.images && d.images[0]) || '';
    const type = d.type || 'voyage';
    const price = d.price ? esc(d.price) + ' ' + esc(d.currency || 'DH') : '';
    return `
    <div class="dest-card" data-type="${esc(type)}" data-dep-id="${esc(String(d.id))}">
      <div class="dest-carousel">
        <img src="${esc(img)}" alt="${esc(d.title)}" loading="lazy" style="width:100%;height:100%;object-fit:cover;">
      </div>
      <div class="dest-info">
        <div class="dest-location">${TYPE_LABELS[type] || ''}${d.duration ? ' · ' + esc(d.duration) : ''}</div>
        <h3 class="t-title">${esc(d.title)}</h3>
        <div class="dest-tags">
          ${d.subtitle ? '<span class="dest-tag">' + esc(d.subtitle) + '</span>' : ''}
          ${price ? '<span class="dest-tag">💰 ' + price + '</span>' : ''}
        </div>
        <a class="dest-discover">Découvrir <span>→</span></a>
      </div>
    </div>`;
  }).join('');

  // clic → fiche du voyage
  grid.querySelectorAll('.dest-card').forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => openTripModal(card.dataset.depId));
  });

  // filtres par type
  const btns = document.querySelectorAll('.dest-filter-btn');
  function applyFilter(f) {
    grid.querySelectorAll('.dest-card').forEach(card => {
      card.style.display = (f === 'all' || card.dataset.type === f) ? '' : 'none';
    });
  }
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyFilter(btn.dataset.filter);
    });
  });

  // paramètres d'URL depuis la recherche de l'accueil (?q=...&type=...)
  const p = new URLSearchParams(location.search);
  const q = (p.get('q') || '').toLowerCase();
  const type = p.get('type') || 'all';
  if (type !== 'all') {
    btns.forEach(b => b.classList.toggle('active', b.dataset.filter === type));
    applyFilter(type);
  }
  if (q) {
    grid.querySelectorAll('.dest-card').forEach(card => {
      const title = (card.querySelector('.t-title') || {}).textContent || '';
      if (!title.toLowerCase().includes(q)) card.style.display = 'none';
    });
  }
}

/* ── APPARENCE (logo + couverture, gérés par l'admin) ─────── */
function applySite(s) {
  if (s.hero_image) {
    const bg = document.querySelector('.hero-bg');
    if (bg) bg.style.backgroundImage = "url('" + s.hero_image + "')";
  }
  if (s.logo) {
    document.querySelectorAll('.nav-logo img, .loader-logo, .hero-logo-wrap img').forEach(img => {
      img.src = s.logo;
    });
  }
}

/* ── CHIFFRES CLÉS (bande accueil, gérés par l'admin) ─────── */
function applyStats(stats) {
  const wrap = document.getElementById('site-stats');
  if (!wrap) return;
  const list = (stats || []).filter(s => s && (s.num || s.label));
  if (!list.length) {
    const sec = document.getElementById('stats');
    if (sec) sec.style.display = 'none';
    return;
  }
  wrap.style.gridTemplateColumns = 'repeat(' + Math.min(list.length, 4) + ', 1fr)';
  wrap.innerHTML = list.map(s =>
    '<div class="stat-item"><div class="stat-num">' + esc(s.num) +
    '</div><div class="stat-label">' + esc(s.label) + '</div></div>'
  ).join('');
}

/* ── TEXTES DES SECTIONS (gérés par l'admin) ──────────────── */
function applyTexts(t) {
  for (const key in t) {
    if (!t[key]) continue;
    const el = document.getElementById('txt-' + key);
    if (el) el.textContent = t[key];
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
  _deps = deps;
  const container = document.getElementById('dep-dynamic-grid');
  if (!container) return;

  const visible = deps.filter(d => d.visible !== false);
  if (visible.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#999;padding:40px;">Aucun départ disponible pour le moment.</p>';
    return;
  }

  container.innerHTML = visible.map((dep, i) => {
    const mainDate = dep.dates && dep.dates[0] ? dep.dates[0].label : (dep.date || '');
    const mainSpots = dep.dates && dep.dates[0] ? dep.dates[0].spots : '🟢 Places disponibles';
    const images = dep.images || (dep.image ? [dep.image] : []);
    const firstImg = images[0] || '';

    const dateButtons = (dep.dates || []).map((d, idx) => `
      <button class="dep-date-tab${idx === 0 ? ' active' : ''}" data-date="${esc(d.label)}" data-spots="${esc(d.spots)}">
        ${esc(d.label)}
      </button>`).join('');

    const slides = images.map(img => `
      <div class="swiper-slide">
        <img src="${esc(img)}" alt="${esc(dep.title)}" loading="lazy">
      </div>`).join('');

    return `
    <div class="dep-card reveal" data-dep-id="${dep.id}" style="--delay:${i * 0.15}s">
      <!-- Image Slider -->
      <div class="swiper dep-card-swiper" id="dep-swiper-${dep.id}">
        <div class="swiper-wrapper">${slides}</div>
        ${images.length > 1 ? '<div class="swiper-pagination"></div>' : ''}
      </div>
      <!-- Gradient overlay -->
      <div class="dep-card-overlay"></div>
      <!-- Contenu -->
      <div class="dep-card-body">
        <div class="dep-card-head">
          <h3 class="dep-card-title">${esc(dep.title)}</h3>
          ${dep.subtitle ? `<p class="dep-card-subtitle">${esc(dep.subtitle)}</p>` : ''}
        </div>
        <div class="dep-card-info">
          <span class="dep-card-duration">⏱ ${esc(dep.duration)}</span>
          <span class="dep-card-price-tag">${esc(dep.price)} <em>${esc(dep.currency || 'DH')}</em></span>
        </div>
        ${dep.dates && dep.dates.length > 1 ? `
        <div class="dep-dates-row">
          <span class="dep-dates-label">Choisir une date :</span>
          <div class="dep-date-tabs">${dateButtons}</div>
        </div>` : `
        <div class="dep-dates-row">
          <span class="dep-date-single">📅 ${esc(mainDate)}</span>
        </div>`}
        <div class="dep-card-footer">
          <span class="dep-spots-chip" data-spots-id="${dep.id}">${esc(mainSpots)}</span>
          <button class="dep-detail-btn" data-dep-id="${dep.id}">Voir les détails →</button>
        </div>
      </div>
    </div>`;
  }).join('');

  // Init Swiper on each card
  setTimeout(() => {
    visible.forEach(dep => {
      const el = document.querySelector(`#dep-swiper-${dep.id}`);
      if (el && dep.images && dep.images.length > 1) {
        new Swiper(el, {
          loop: true,
          autoplay: { delay: 3500, disableOnInteraction: false },
          pagination: { el: el.querySelector('.swiper-pagination'), clickable: true },
          speed: 700,
        });
      }
    });

    // Date tab switching
    document.querySelectorAll('.dep-date-tab').forEach(btn => {
      btn.addEventListener('click', e => {
        const tabs = e.target.closest('.dep-date-tabs').querySelectorAll('.dep-date-tab');
        tabs.forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        // Update spots chip
        const card = e.target.closest('.dep-card');
        const depId = card.dataset.depId;
        const spotsEl = document.querySelector(`[data-spots-id="${depId}"]`);
        if (spotsEl) spotsEl.textContent = e.target.dataset.spots || '🟢 Places disponibles';
      });
    });

    // Open modal on card click or button click
    document.querySelectorAll('.dep-card').forEach(card => {
      card.addEventListener('click', e => {
        // Prevent Swiper pagination clicks from opening modal
        if (e.target.closest('.swiper-pagination') || e.target.closest('.dep-date-tab')) return;
        openTripModal(card.dataset.depId);
      });
    });

    // VanillaTilt on cards
    if (typeof VanillaTilt !== 'undefined') {
      VanillaTilt.init(document.querySelectorAll('.dep-card'), {
        max: 6, speed: 500, glare: true, 'max-glare': 0.10,
        perspective: 1000, scale: 1.02,
      });
    }

    // Reveal observer
    document.querySelectorAll('#dep-dynamic-grid .reveal').forEach(el => {
      revealObserver && revealObserver.observe(el);
    });
  }, 100);
}

/* ── MODAL DÉTAIL VOYAGE ──────────────────────────────────── */
/* ── PARTAGE RÉSEAUX SOCIAUX ──────────────────────────────── */
function tripShareUrl(dep) {
  const key = dep.slug || dep.id;
  return 'https://travelwithoumaima.ma/?voyage=' + encodeURIComponent(key);
}
function renderTripShare(dep) {
  const box = document.getElementById('trip-modal-share');
  if (!box) return;
  _shareDep = dep;
  const url = tripShareUrl(dep);
  const titre = dep.title + (dep.subtitle ? ' — ' + dep.subtitle : '');
  const texte = 'Découvre ce voyage 100% femmes avec Travel with Oumaima : ' + titre;
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(texte);
  const tu = encodeURIComponent(texte + ' ' + url);

  box.innerHTML =
    '<span class="share-label">Partager ce voyage</span>' +
    '<div class="share-btns">' +
      '<a class="share-btn wa" href="https://wa.me/?text=' + tu + '" target="_blank" rel="noopener" aria-label="Partager sur WhatsApp" title="WhatsApp">' +
        '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/></svg></a>' +
      '<a class="share-btn fb" href="https://www.facebook.com/sharer/sharer.php?u=' + u + '" target="_blank" rel="noopener" aria-label="Partager sur Facebook" title="Facebook">' +
        '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073"/></svg></a>' +
      '<a class="share-btn x" href="https://twitter.com/intent/tweet?text=' + t + '&url=' + u + '" target="_blank" rel="noopener" aria-label="Partager sur X" title="X">' +
        '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>' +
      '<button class="share-btn copy" onclick="copyTripLink(this,\'' + url.replace(/'/g, "\\'") + '\')" aria-label="Copier le lien" title="Copier le lien">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg></button>' +
      (navigator.share ? '<button class="share-btn native" onclick="nativeShareTrip(\'' + encodeURIComponent(titre) + '\',\'' + encodeURIComponent(texte) + '\',\'' + url.replace(/'/g, "\\'") + '\')" aria-label="Plus d\'options" title="Plus">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/></svg></button>' : '') +
    '</div>' +
    '<button class="story-btn" id="story-btn" onclick="shareStory()">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="17" height="17"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>' +
      '<span>Partager en story</span>' +
    '</button>';
}

/* Collage de photos (style galerie, liseré blanc) */
async function _drawCollage(ctx, images, area, gap, r) {
  const imgs = (images || []).filter(Boolean).slice(0, 5);
  if (!imgs.length) return;
  const layouts = {
    1: [[0,0,1,1]],
    2: [[0,0,.5,1],[.5,0,.5,1]],
    3: [[0,0,.62,1],[.62,0,.38,.5],[.62,.5,.38,.5]],
    4: [[0,0,.62,.55],[.62,0,.38,.55],[0,.55,.38,.45],[.38,.55,.62,.45]],
    5: [[0,0,.62,.6],[.62,0,.38,.3],[.62,.3,.38,.3],[0,.6,.5,.4],[.5,.6,.5,.4]]
  };
  const L = layouts[imgs.length] || layouts[5];
  for (let i = 0; i < imgs.length; i++) {
    const f = L[i];
    const cx = area.x + f[0] * area.w + gap / 2;
    const cy = area.y + f[1] * area.h + gap / 2;
    const cw = f[2] * area.w - gap;
    const ch = f[3] * area.h - gap;
    try {
      const img = await _loadImg(imgs[i]);
      ctx.save();
      _roundRect(ctx, cx, cy, cw, ch, r);
      ctx.clip();
      const s = Math.max(cw / img.width, ch / img.height);
      const dw = img.width * s, dh = img.height * s;
      ctx.drawImage(img, cx + (cw - dw) / 2, cy + (ch - dh) / 2, dw, dh);
      ctx.restore();
      ctx.strokeStyle = '#FAF6F0';
      ctx.lineWidth = 6;
      _roundRect(ctx, cx, cy, cw, ch, r);
      ctx.stroke();
    } catch (e) {}
  }
}

/* ── GÉNÉRATION D'UNE STORY (image flyer 1080×1920) ───────── */
function _loadImg(src) {
  return new Promise((res, rej) => {
    const i = new Image();
    i.crossOrigin = 'anonymous';
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
}
function _roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function _wrap(ctx, text, maxW) {
  const words = String(text).split(' ');
  const lines = []; let line = '';
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; }
    else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

async function generateStoryBlob(dep) {
  const W = 1080, H = 1920;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');

  try {
    await Promise.all([
      document.fonts.load('600 70px "Cormorant Garamond"'),
      document.fonts.load('500 44px "Cormorant Garamond"'),
      document.fonts.load('600 30px "Montserrat"'),
      document.fonts.load('700 30px "Montserrat"'),
      document.fonts.load('400 28px "Montserrat"')
    ]);
  } catch (e) {}

  // Fond crème
  ctx.fillStyle = '#FAF6F0';
  ctx.fillRect(0, 0, W, H);
  // Cadre fin
  ctx.strokeStyle = 'rgba(31,43,34,0.16)';
  ctx.lineWidth = 2;
  _roundRect(ctx, 34, 34, W - 68, H - 68, 30);
  ctx.stroke();

  ctx.textAlign = 'center';

  // Logo (ajusté dans une boîte)
  try {
    const logo = await _loadImg('images/logo/1.png');
    const boxW = 340, boxH = 300;
    const scale = Math.min(boxW / logo.width, boxH / logo.height);
    const lw = logo.width * scale, lh = logo.height * scale;
    ctx.drawImage(logo, (W - lw) / 2, 70, lw, lh);
  } catch (e) {}

  // Badge
  ctx.fillStyle = '#BC6B3D';
  ctx.font = '700 26px "Montserrat"';
  if ('letterSpacing' in ctx) ctx.letterSpacing = '3px';
  ctx.fillText('100% FEMMES · MAROC', W / 2, 410);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';

  // Collage de photos (le max — style galerie)
  const px = 90, py = 430, pw = 900, ph = 690;
  await _drawCollage(ctx, (dep.images && dep.images.length ? dep.images : ['images/hero-two.jpg']), { x: px, y: py, w: pw, h: ph }, 12, 18);

  /* ── Bloc du bas ANCRÉ (prix + tagline + site) — jamais de chevauchement ── */
  ctx.fillStyle = '#1F2B22';
  ctx.font = '700 30px "Montserrat"';
  if ('letterSpacing' in ctx) ctx.letterSpacing = '1px';
  ctx.fillText('travelwithoumaima.ma', W / 2, H - 88);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';

  if (dep.price) {
    if (dep.price_note) {
      ctx.fillStyle = '#8a948c';
      ctx.font = '400 26px "Montserrat"';
      ctx.fillText(dep.price_note, W / 2, H - 150);
    }
    ctx.fillStyle = '#BC6B3D';
    ctx.font = '600 90px "Cormorant Garamond"';
    ctx.fillText(dep.price + ' ' + (dep.currency || 'DH'), W / 2, H - 200);
  }
  const bottomLimit = dep.price ? H - 300 : H - 150;

  /* ── Contenu qui s'écoule sous la photo, borné par bottomLimit ── */
  let y = py + ph + 74;

  if (dep.subtitle) {
    ctx.fillStyle = '#BC6B3D';
    ctx.font = '700 28px "Montserrat"';
    if ('letterSpacing' in ctx) ctx.letterSpacing = '2px';
    ctx.fillText(dep.subtitle.toUpperCase(), W / 2, y);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    y += 58;
  }

  ctx.fillStyle = '#1F2B22';
  ctx.font = '600 72px "Cormorant Garamond"';
  const titleLines = _wrap(ctx, dep.title || '', W - 220).slice(0, 2);
  titleLines.forEach(line => { ctx.fillText(line, W / 2, y); y += 76; });
  y += 4;

  if (dep.duration) {
    ctx.fillStyle = '#5c675e';
    ctx.font = '400 29px "Montserrat"';
    ctx.fillText(dep.duration, W / 2, y);
    y += 46;
  }

  ctx.strokeStyle = '#3DAA70';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(W / 2 - 55, y); ctx.lineTo(W / 2 + 55, y); ctx.stroke();
  y += 50;

  // Dates : autant que la place le permet (max 4), sinon mention "+ d'autres dates"
  const allDates = dep.dates || [];
  if (allDates.length && y < bottomLimit - 60) {
    ctx.fillStyle = '#8a948c';
    ctx.font = '700 24px "Montserrat"';
    if ('letterSpacing' in ctx) ctx.letterSpacing = '2px';
    ctx.fillText('PROCHAINES DATES', W / 2, y);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    y += 46;
    ctx.fillStyle = '#1F2B22';
    ctx.font = '500 33px "Montserrat"';
    let shown = 0;
    for (const d of allDates) {
      if (y > bottomLimit - 20 || shown >= 4) break;
      ctx.fillText(d.label, W / 2, y); y += 46; shown++;
    }
    if (shown < allDates.length) {
      ctx.fillStyle = '#8a948c';
      ctx.font = 'italic 400 28px "Montserrat"';
      ctx.fillText('+ d\'autres dates disponibles', W / 2, y);
    }
  }

  return await new Promise(res => cv.toBlob(res, 'image/jpeg', 0.92));
}

async function shareStory() {
  const dep = _shareDep;
  if (!dep) return;
  const btn = document.getElementById('story-btn');
  const old = btn ? btn.innerHTML : '';
  if (btn) { btn.disabled = true; btn.innerHTML = '<span>Création de la story…</span>'; }
  try {
    const blob = await generateStoryBlob(dep);
    const fname = 'story-' + (dep.slug || dep.id) + '.jpg';
    const file = new File([blob], fname, { type: 'image/jpeg' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: dep.title,
        text: 'Voyage 100% femmes avec Travel with Oumaima'
      });
    } else {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = fname;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      alert('Image de story téléchargée ✔\nOuvre Instagram → Story → et publie l\'image.');
    }
  } catch (e) {
    if (e && e.name !== 'AbortError') alert('Impossible de générer la story. Réessaie.');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = old; }
  }
}
function copyTripLink(btn, url) {
  navigator.clipboard.writeText(url).then(() => {
    const old = btn.innerHTML;
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><path d="M20 6L9 17l-5-5"/></svg>';
    btn.classList.add('copied');
    setTimeout(() => { btn.innerHTML = old; btn.classList.remove('copied'); }, 1600);
  });
}
function nativeShareTrip(titre, texte, url) {
  navigator.share({ title: decodeURIComponent(titre), text: decodeURIComponent(texte), url: url }).catch(() => {});
}

/* Ouvre automatiquement la fiche si l'URL contient ?voyage=<slug|id> */
function openTripFromUrl() {
  const p = new URLSearchParams(location.search);
  const key = p.get('voyage');
  if (!key) return;
  const dep = _deps.find(d => String(d.slug) === key || String(d.id) === key);
  if (dep) setTimeout(() => openTripModal(dep.id), 300);
}

function openTripModal(depId) {
  const dep = _deps.find(d => String(d.id) === String(depId));
  if (!dep) return;

  // Fill title
  document.getElementById('trip-modal-title').textContent = dep.title + (dep.subtitle ? ' — ' + dep.subtitle : '');
  document.getElementById('trip-modal-duration').textContent = '⏱ ' + (dep.duration || '');
  document.getElementById('trip-modal-price').textContent = dep.price + ' ' + (dep.currency || 'DH');
  document.getElementById('trip-modal-price-note').textContent = dep.price_note || '';
  // Description + programme extrait des flyers
  const descEl = document.getElementById('trip-modal-desc');
  let descHtml = dep.description ? '<p style="margin-bottom:14px;">' + esc(dep.description) + '</p>' : '';
  if (dep.program && dep.program.length) {
    descHtml += '<div class="trip-program">';
    dep.program.forEach(day => {
      descHtml += '<div class="trip-program-day"><strong>' + esc(day.day) + '</strong><ul>';
      (day.items || []).forEach(it => { descHtml += '<li>' + esc(it) + '</li>'; });
      descHtml += '</ul></div>';
    });
    descHtml += '</div>';
  }
  if (dep.program_note) {
    descHtml += '<p class="trip-program-note">' + esc(dep.program_note) + '</p>';
  }
  descEl.innerHTML = descHtml;

  // Date buttons
  const datesContainer = document.getElementById('trip-modal-dates');
  let activeDate = dep.dates && dep.dates[0] ? dep.dates[0].label : (dep.date || '');
  datesContainer.innerHTML = (dep.dates || []).map((d, i) => `
    <button class="trip-date-btn${i === 0 ? ' active' : ''}" data-date="${esc(d.label)}">
      📅 ${esc(d.label)}
    </button>`).join('');

  datesContainer.querySelectorAll('.trip-date-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      datesContainer.querySelectorAll('.trip-date-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      activeDate = e.target.dataset.date;
      updateModalReserve();
    });
  });

  // Spots
  const spots = dep.dates && dep.dates[0] ? dep.dates[0].spots : '🟢 Places disponibles';
  document.getElementById('trip-modal-spots').textContent = spots;

  // Reserve link
  function updateModalReserve() {
    const msg = encodeURIComponent(`Bonjour, je souhaite réserver le voyage : ${dep.title}${dep.subtitle ? ' — ' + dep.subtitle : ''}\nDate : ${activeDate}\nPrix : ${dep.price} ${dep.currency || 'DH'}`);
    document.getElementById('trip-modal-reserve').href = `https://wa.me/${dep.whatsapp || '212782282073'}?text=${msg}`;
  }
  updateModalReserve();

  // Boutons de partage
  renderTripShare(dep);

  // Images slider
  const slidesContainer = document.getElementById('trip-modal-slides');
  const images = dep.images || (dep.image ? [dep.image] : []);
  slidesContainer.innerHTML = images.map(img => `
    <div class="swiper-slide">
      <img src="${esc(img)}" alt="${esc(dep.title)}" loading="lazy">
    </div>`).join('');

  // Destroy old swiper and re-init
  if (_depModalSwiper) { _depModalSwiper.destroy(true, true); _depModalSwiper = null; }
  setTimeout(() => {
    _depModalSwiper = new Swiper('#trip-modal-swiper', {
      loop: images.length > 1,
      pagination: { el: '#trip-modal-swiper .swiper-pagination', clickable: true },
      navigation: {
        nextEl: '#trip-modal-swiper .swiper-button-next',
        prevEl: '#trip-modal-swiper .swiper-button-prev',
      },
      speed: 600,
    });
  }, 50);

  // Show modal
  const modal = document.getElementById('trip-modal');
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeTripModal() {
  const modal = document.getElementById('trip-modal');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

// Close handlers
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('trip-modal-close')?.addEventListener('click', closeTripModal);
  document.getElementById('trip-modal')?.addEventListener('click', e => {
    if (e.target.id === 'trip-modal') closeTripModal();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeTripModal(); });
});

/* ── DEST CARDS CLICKABLE ─────────────────────────────────── */
function openDestModal(card) {
  const name = card.querySelector('.t-title')?.textContent?.trim() || card.dataset.name || 'cette destination';

  // Si un départ programmé correspond, ouvrir directement sa fiche complète
  const dep = _deps.find(d =>
    (d.title || '').toLowerCase().includes(name.toLowerCase()) ||
    name.toLowerCase().includes((d.slug || '###').toLowerCase())
  );
  if (dep) { openTripModal(dep.id); return; }

  // Sinon : fiche descriptive générique construite depuis la carte
  const location = card.querySelector('.dest-location')?.textContent?.trim() || '';
  const tags = [...card.querySelectorAll('.dest-tag')].map(t => t.textContent.trim());
  const images = [...card.querySelectorAll('.dest-slide img')].map(i => i.getAttribute('src')).filter(Boolean);

  document.getElementById('trip-modal-title').textContent = name;
  document.getElementById('trip-modal-duration').textContent = location;
  document.getElementById('trip-modal-price').textContent = '';
  document.getElementById('trip-modal-price-note').textContent = '';
  document.getElementById('trip-modal-dates').innerHTML = '';
  document.getElementById('trip-modal-spots').textContent = '';

  const descs = {
    'chefchaouen': 'La perle bleue du Rif. Ruelles azur, artisanat berbère, randonnées vers les cascades d\'Akchour et point de vue de la mosquée espagnole au coucher du soleil.',
    'merzouga': 'Les dunes dorées de l\'Erg Chebbi. Nuit en bivouac sous un ciel étoilé, balade à dos de dromadaire, musique autour du feu et lever de soleil sur le désert.',
    'toubkal': 'Le toit de l\'Afrique du Nord (4 167 m). Trek encadré au départ d\'Imlil, refuges de montagne, paysages du Haut Atlas et dépassement de soi garanti.',
    'imlil': 'Village berbère au pied du Toubkal. Randonnées entre noyers et cerisiers, cascades, terrasses avec vue sur les sommets et immersion dans la culture montagnarde.',
    'essaouira': 'Médina classée UNESCO, remparts face à l\'Atlantique, port de pêche, artisanat et vent de liberté. La cité des Alizés se découvre à pied, entre mer et musique.',
    'oualidia': 'Lagune turquoise et paisible de la côte Atlantique, célèbre pour ses huîtres, ses plages calmes et ses balades en barque.',
    'parapente': 'Envolez-vous ! Baptême de parapente encadré par des professionnels, sensations fortes et vue imprenable — une expérience à vivre au moins une fois.',
    'ouirgane': 'Écrin de verdure du Haut Atlas. Lac, villages berbères, balades douces et air pur à seulement 1h de Marrakech.',
    'magdaz': 'L\'un des plus beaux villages de l\'Atlas, architecture en pisé préservée, vallée de la Tessaout et hospitalité berbère authentique.',
    'tidghine': 'Sommet emblématique du Rif. Forêts de cèdres, crêtes panoramiques et randonnée hors des sentiers battus.',
    'fahs': 'Nature préservée du nord, entre collines verdoyantes et traditions rurales. Une échappée ressourçante loin de la foule.',
    'barrage': 'Paysages lacustres, pique-nique au bord de l\'eau et randonnée douce — la parenthèse détente par excellence.',
    'belyounech': 'Plage sauvage au pied du Jbel Moussa, face au détroit de Gibraltar. Eaux turquoise, plongée et dépaysement total.'
  };
  const key = Object.keys(descs).find(k => name.toLowerCase().includes(k));
  let html = '<p style="margin-bottom:14px;">' + (key ? descs[key] : 'Une destination coup de cœur de la communauté Travel with Oumaima. Contactez-nous pour connaître les prochaines sorties prévues.') + '</p>';
  if (tags.length) {
    html += '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;">' +
      tags.map(t => '<span class="dest-tag">' + esc(t) + '</span>').join('') + '</div>';
  }
  document.getElementById('trip-modal-desc').innerHTML = html;

  const msg = encodeURIComponent('Bonjour, je suis intéressée par la destination : ' + name + '. Quelles sont les prochaines sorties prévues ?');
  document.getElementById('trip-modal-reserve').href = 'https://wa.me/212782282073?text=' + msg;

  const slidesContainer = document.getElementById('trip-modal-slides');
  slidesContainer.innerHTML = images.map(img => `
    <div class="swiper-slide">
      <img src="${esc(img)}" alt="${esc(name)}" loading="lazy">
    </div>`).join('');

  if (_depModalSwiper) { _depModalSwiper.destroy(true, true); _depModalSwiper = null; }
  setTimeout(() => {
    _depModalSwiper = new Swiper('#trip-modal-swiper', {
      loop: images.length > 1,
      pagination: { el: '#trip-modal-swiper .swiper-pagination', clickable: true },
      navigation: {
        nextEl: '#trip-modal-swiper .swiper-button-next',
        prevEl: '#trip-modal-swiper .swiper-button-prev',
      },
      speed: 600,
    });
  }, 50);

  const modal = document.getElementById('trip-modal');
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.dest-card').forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', e => {
      if (e.target.closest('.dest-carousel-btn') || e.target.closest('.dest-dot')) return;
      e.preventDefault();
      openDestModal(card);
    });
  });
});


/* ── CONTACT ──────────────────────────────────────────────── */
function applyContact(c) {
  const wa = c.whatsapp || '212600000000';
  document.querySelectorAll('[data-contact="whatsapp"]').forEach(el => { el.href = 'https://wa.me/' + wa; });
  const ig = c.instagram || '';
  document.querySelectorAll('[data-contact="instagram"]').forEach(el => {
    el.href = ig ? 'https://instagram.com/' + ig : '#';
    const label = el.querySelector('[data-label]');
    if (label) label.textContent = ig ? '@' + ig : '';
  });
  const mail = c.email || '';
  document.querySelectorAll('[data-contact="email"]').forEach(el => {
    el.href = mail ? 'mailto:' + mail : '#';
    const label = el.querySelector('[data-label]');
    if (label) label.textContent = mail;
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadSiteContent);
} else {
  loadSiteContent();
}

/* ── BARRE DE RECHERCHE (hero) ────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const widget = document.getElementById('booking-widget');
  if (!widget) return;

  const destSelect = document.getElementById('booking-dest');
  const periodSel  = document.getElementById('booking-period');
  const searchBtn  = document.getElementById('booking-search');
  const tabs       = widget.querySelectorAll('.booking-tab');
  let activeType = 'all';

  // Construire la liste selon l'onglet actif (voyage / sortie / activite / all)
  function buildDestList() {
    destSelect.innerHTML = '<option value="">Toutes les destinations</option>';
    const groups = { depart: [], voyage: [], sortie: [], activite: [] };

    // 1. Les voyages programmés (chargés depuis l'admin), déjà triés par date
    (typeof _deps !== 'undefined' ? _deps : []).forEach(d => {
      if (d.visible === false || !d.title) return;
      const t = d.type || 'voyage';
      if (activeType !== 'all' && t !== activeType) return;
      if (!groups.depart.includes(d.title)) groups.depart.push(d.title);
    });

    // 2. Les destinations/activités du catalogue
    document.querySelectorAll('.dest-card').forEach(card => {
      const t = card.querySelector('.t-title');
      const label = t ? t.textContent.trim() : '';
      if (!label || label.toLowerCase() === 'soon') return;
      const cat = card.dataset.category || '';
      const g = cat.includes('activite') ? 'activite' : cat.includes('sortie') ? 'sortie' : 'voyage';
      if (activeType !== 'all' && g !== activeType) return;
      // éviter les doublons avec les départs programmés
      const dup = groups.depart.some(dt => dt.toLowerCase().includes(label.toLowerCase()) || label.toLowerCase().includes(dt.toLowerCase()));
      if (dup) return;
      if (!groups[g].includes(label)) groups[g].push(label);
    });

    [['depart', '📅 Prochains départs'], ['voyage', '🧳 Voyages'], ['sortie', '☀️ Sorties journée'], ['activite', '🪂 Activités']].forEach(([key, lab]) => {
      if (!groups[key].length) return;
      const og = document.createElement('optgroup');
      og.label = lab;
      const items = key === 'depart' ? groups[key] : groups[key].slice().sort();
      items.forEach(n => {
        const o = document.createElement('option');
        o.value = n.toLowerCase();
        o.textContent = n;
        og.appendChild(o);
      });
      destSelect.appendChild(og);
    });
  }
  buildDestList();
  // reconstruire quand les départs sont chargés depuis l'API
  window._rebuildBookingList = buildDestList;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeType = tab.dataset.type;
      buildDestList();
    });
  });

  searchBtn.addEventListener('click', () => {
    const destVal = destSelect.value;
    const period  = periodSel.value;

    // 1. Si la destination + période correspond à un départ programmé → ouvrir sa fiche
    const dep = _deps.find(d => {
      const t = (d.title || '').toLowerCase();
      const matchName = destVal && (t === destVal || t.includes(destVal) || destVal.includes(t));
      const matchPeriod = !period || (d.dates || []).some(dt => dt.label.toLowerCase().includes(period));
      return matchName && matchPeriod;
    });
    if (dep) { openTripModal(dep.id); return; }

    // 1bis. Période seule choisie → montrer les départs de cette période
    if (!destVal && period) {
      document.getElementById('departures').scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // 2. Cartes destinations présentes sur la page → filtrer sur place
    const cards = document.querySelectorAll('.dest-card');
    if (cards.length) {
      let anyVisible = false;
      cards.forEach(card => {
        const title = (card.querySelector('.t-title') || {}).textContent || '';
        const cat = card.dataset.category || '';
        const matchDest = !destVal || title.toLowerCase().includes(destVal);
        const matchType = activeType === 'all' || cat.includes(activeType);
        const show = matchDest && matchType;
        card.style.display = show ? '' : 'none';
        if (show) anyVisible = true;
      });
      const target = document.getElementById(anyVisible ? 'destinations' : 'departures');
      if (target) target.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // 3. Sinon (accueil sans catalogue) → page destinations avec filtre
    if (destVal || activeType !== 'all') {
      window.location.href = 'destinations.html?q=' + encodeURIComponent(destVal) + '&type=' + encodeURIComponent(activeType);
    } else {
      const dep = document.getElementById('departures');
      if (dep) dep.scrollIntoView({ behavior: 'smooth' });
    }
  });
});
