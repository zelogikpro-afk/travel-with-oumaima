/* ============================================================
   TRAVEL WITH OUMAIMA — GSAP Cinematic Animations
   ============================================================ */

gsap.registerPlugin(ScrollTrigger);

/* ── CURSOR PERSONNALISÉ ──────────────────────────────────── */
const cursor = document.createElement('div');
cursor.id = 'gsap-cursor';
cursor.innerHTML = '<div class="cursor-dot"></div><div class="cursor-ring"></div>';
document.body.appendChild(cursor);

const dot  = cursor.querySelector('.cursor-dot');
const ring = cursor.querySelector('.cursor-ring');
let mx = 0, my = 0;

window.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  gsap.to(dot,  { x: mx, y: my, duration: 0.1 });
  gsap.to(ring, { x: mx, y: my, duration: 0.35, ease: 'power2.out' });
});

document.querySelectorAll('a, button, .dep-card, .dest-card, .vtesti-slide').forEach(el => {
  el.addEventListener('mouseenter', () => ring.classList.add('grow'));
  el.addEventListener('mouseleave', () => ring.classList.remove('grow'));
});

/* ── HERO CINÉMATIQUE ─────────────────────────────────────── */
window.addEventListener('load', () => {
  const tl = gsap.timeline({ delay: 2 });

  tl.from('.hero-badge', { y: 30, opacity: 0, duration: 0.8, ease: 'power3.out' })
    .from('.hero-title', {
      y: 60, opacity: 0, duration: 1.1, ease: 'power3.out',
      stagger: 0.12
    }, '-=0.4')
    .from('.hero-subtitle-text', { y: 20, opacity: 0, duration: 0.7, ease: 'power2.out' }, '-=0.5')
    .from('.hero-ctas a', { y: 25, opacity: 0, duration: 0.6, stagger: 0.15, ease: 'back.out(1.7)' }, '-=0.4')
    .from('.hero-scroll-hint', { opacity: 0, duration: 0.5 }, '-=0.2');
});

/* ── SECTION HEADERS — texte révélé par lignes ───────────── */
document.querySelectorAll('.t-script, .t-title, .t-body').forEach(el => {
  gsap.from(el, {
    scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    y: 48, opacity: 0, duration: 0.9,
    ease: 'power3.out',
    delay: el.classList.contains('t-title') ? 0.1 : el.classList.contains('t-body') ? 0.2 : 0
  });
});

/* ── DEPARTURE CARDS ─────────────────────────────────────── */
ScrollTrigger.batch('.dep-card', {
  start: 'top 85%',
  once: true,
  onEnter: els => gsap.from(els, {
    y: 80, opacity: 0, scale: 0.94,
    duration: 0.9, stagger: 0.12,
    ease: 'power3.out'
  })
});

/* ── DESTINATION CARDS ───────────────────────────────────── */
ScrollTrigger.batch('.dest-card', {
  start: 'top 85%',
  once: true,
  onEnter: els => gsap.from(els, {
    y: 60, opacity: 0, scale: 0.96,
    duration: 0.8, stagger: 0.08,
    ease: 'power2.out'
  })
});

/* ── WHY STRIP — items cascade ───────────────────────────── */
ScrollTrigger.batch('.why-item', {
  start: 'top 88%',
  once: true,
  onEnter: els => gsap.from(els, {
    y: 40, opacity: 0,
    duration: 0.7, stagger: 0.1,
    ease: 'power2.out'
  })
});

/* ── PHILOSOPHY STATS — compteur animé ──────────────────── */
document.querySelectorAll('.phil-stat').forEach(stat => {
  const numEl = stat.querySelector('[id^="phil-stat"]');
  if (!numEl) return;
  gsap.from(stat, {
    scrollTrigger: { trigger: stat, start: 'top 85%', once: true },
    scale: 0.8, opacity: 0, duration: 0.7,
    ease: 'back.out(1.5)'
  });
});

/* ── COMMUNITY SECTION — parallax image ─────────────────── */
const commBg = document.querySelector('.community-bg img');
if (commBg) {
  gsap.to(commBg, {
    scrollTrigger: { trigger: '#community', start: 'top bottom', end: 'bottom top', scrub: true },
    y: -80, ease: 'none'
  });
}

/* ── VIDEO TESTIMONIALS ──────────────────────────────────── */
gsap.from('#video-testimonials .section-header > *', {
  scrollTrigger: { trigger: '#video-testimonials', start: 'top 80%', once: true },
  y: 40, opacity: 0, stagger: 0.15, duration: 0.8, ease: 'power2.out'
});

/* ── NEWSLETTER — scale in ───────────────────────────────── */
gsap.from('#newsletter .container > *', {
  scrollTrigger: { trigger: '#newsletter', start: 'top 80%', once: true },
  y: 50, opacity: 0, stagger: 0.12, duration: 0.8, ease: 'power3.out'
});

/* ── FOOTER LINKS ────────────────────────────────────────── */
gsap.from('footer .footer-col', {
  scrollTrigger: { trigger: 'footer', start: 'top 90%', once: true },
  y: 30, opacity: 0, stagger: 0.1, duration: 0.6, ease: 'power2.out'
});

/* ── MAGNETIC BUTTONS ────────────────────────────────────── */
document.querySelectorAll('.btn-primary-hero, .btn-ghost-hero, .dep-reserve-btn').forEach(btn => {
  btn.addEventListener('mousemove', e => {
    const r = btn.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top  - r.height / 2;
    gsap.to(btn, { x: x * 0.3, y: y * 0.3, duration: 0.3, ease: 'power2.out' });
  });
  btn.addEventListener('mouseleave', () => {
    gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.5)' });
  });
});

/* ── HORIZONTAL SCROLL HINT ──────────────────────────────── */
gsap.to('.hero-scroll-hint', {
  y: 10, duration: 1.2,
  repeat: -1, yoyo: true,
  ease: 'power1.inOut'
});
