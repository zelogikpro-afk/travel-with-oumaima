/* ============================================================
   TRAVEL WITH OUMAIMA — GSAP + Three.js 3D Animations
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

/* ── VANILLA TILT 3D CARDS ───────────────────────────────── */
function initTilt() {
  if (typeof VanillaTilt === 'undefined') return;

  VanillaTilt.init(document.querySelectorAll('.dest-card'), {
    max: 14, speed: 600, glare: true, 'max-glare': 0.18,
    perspective: 900, scale: 1.05, gyroscope: true,
  });

  VanillaTilt.init(document.querySelectorAll('.dep-card'), {
    max: 8, speed: 500, glare: true, 'max-glare': 0.12,
    perspective: 1000, scale: 1.03, gyroscope: true,
  });
}

/* ── HERO CINÉMATIQUE 3D ─────────────────────────────────── */
window.addEventListener('load', () => {
  initTilt();

  const tl = gsap.timeline({ delay: 0.8 });
  gsap.set(['.hero-badge', '.hero-title', '.hero-subtitle-text', '.hero-ctas a', '.hero-scroll-hint'], {
    transformPerspective: 900
  });

  tl.from('.hero-badge', {
    y: 40, rotationX: 40, opacity: 0, duration: 0.9, ease: 'power3.out'
  })
  .from('.hero-title', {
    y: 80, rotationX: 50, opacity: 0, duration: 1.2,
    stagger: 0.14, ease: 'power3.out', transformOrigin: 'center bottom'
  }, '-=0.5')
  .from('.hero-subtitle-text', {
    y: 30, rotationX: 25, opacity: 0, duration: 0.8, ease: 'power2.out'
  }, '-=0.6')
  .from('.hero-ctas a', {
    y: 35, rotationX: 20, opacity: 0, scale: 0.88,
    duration: 0.7, stagger: 0.15, ease: 'back.out(1.7)'
  }, '-=0.5')
  .from('.hero-scroll-hint', { opacity: 0, duration: 0.5 }, '-=0.2');
});

/* ── SECTION HEADERS 3D ──────────────────────────────────── */
document.querySelectorAll('.t-script, .t-title, .t-body').forEach(el => {
  gsap.set(el, { transformPerspective: 800 });
  gsap.from(el, {
    scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    y: 55, rotationX: el.classList.contains('t-title') ? 35 : 20,
    opacity: 0, duration: 1.0, ease: 'power3.out',
    transformOrigin: 'center bottom',
    delay: el.classList.contains('t-title') ? 0.1 : el.classList.contains('t-body') ? 0.2 : 0
  });
});

/* ── DEPARTURE CARDS 3D ──────────────────────────────────── */
ScrollTrigger.batch('.dep-card', {
  start: 'top 85%', once: true,
  onEnter: els => gsap.from(els, {
    y: 90, rotationX: 25, rotationY: -8, opacity: 0, scale: 0.92,
    duration: 1.0, stagger: 0.14, ease: 'power3.out',
    transformPerspective: 900, transformOrigin: 'center bottom',
    clearProps: 'all',
  })
});

/* ── DESTINATION CARDS 3D ────────────────────────────────── */
ScrollTrigger.batch('.dest-card', {
  start: 'top 85%', once: true,
  onEnter: els => {
    gsap.from(els, {
      y: 70, rotationX: 20,
      rotationY: (i) => (i % 2 === 0 ? -10 : 10),
      opacity: 0, scale: 0.94,
      duration: 0.9, stagger: 0.09, ease: 'power2.out',
      transformPerspective: 900, transformOrigin: 'center bottom',
      clearProps: 'all',
    });
  }
});

/* ── WHY STRIP 3D ────────────────────────────────────────── */
ScrollTrigger.batch('.why-item', {
  start: 'top 88%', once: true,
  onEnter: els => gsap.from(els, {
    y: 50, rotationY: 20, opacity: 0,
    duration: 0.8, stagger: 0.1, ease: 'power2.out',
    transformPerspective: 700
  })
});

/* ── PHILOSOPHY STATS ────────────────────────────────────── */
document.querySelectorAll('.phil-stat').forEach(stat => {
  gsap.set(stat, { transformPerspective: 600 });
  gsap.from(stat, {
    scrollTrigger: { trigger: stat, start: 'top 85%', once: true },
    scale: 0.7, rotationX: 40, opacity: 0,
    duration: 0.8, ease: 'back.out(1.8)', transformOrigin: 'center center'
  });
});

/* ── COMMUNITY PARALLAX 3D ───────────────────────────────── */
const commBg = document.querySelector('.community-bg img');
if (commBg) {
  gsap.to(commBg, {
    scrollTrigger: { trigger: '#community', start: 'top bottom', end: 'bottom top', scrub: true },
    y: -100, scale: 1.1, ease: 'none'
  });
}

/* ── VIDEO TESTIMONIALS ──────────────────────────────────── */
gsap.from('#video-testimonials .section-header > *', {
  scrollTrigger: { trigger: '#video-testimonials', start: 'top 80%', once: true },
  y: 50, rotationX: 30, opacity: 0, stagger: 0.15,
  duration: 0.9, ease: 'power2.out', transformPerspective: 800
});

/* ── NEWSLETTER ──────────────────────────────────────────── */
gsap.from('#newsletter .container > *', {
  scrollTrigger: { trigger: '#newsletter', start: 'top 80%', once: true },
  y: 60, rotationX: 25, opacity: 0, stagger: 0.12,
  duration: 0.9, ease: 'power3.out', transformPerspective: 800
});

/* ── FOOTER ──────────────────────────────────────────────── */
gsap.from('footer .footer-col', {
  scrollTrigger: { trigger: 'footer', start: 'top 90%', once: true },
  y: 40, rotationY: 15, opacity: 0, stagger: 0.1,
  duration: 0.7, ease: 'power2.out', transformPerspective: 700
});

/* ── MAGNETIC BUTTONS 3D ─────────────────────────────────── */
document.querySelectorAll('.btn-primary-hero, .btn-ghost-hero, .dep-reserve-btn').forEach(btn => {
  btn.addEventListener('mousemove', e => {
    const r = btn.getBoundingClientRect();
    const x = e.clientX - r.left - r.width  / 2;
    const y = e.clientY - r.top  - r.height / 2;
    gsap.to(btn, {
      x: x * 0.35, y: y * 0.35,
      rotationY: x * 0.05, rotationX: -y * 0.05,
      duration: 0.3, ease: 'power2.out', transformPerspective: 600
    });
  });
  btn.addEventListener('mouseleave', () => {
    gsap.to(btn, { x: 0, y: 0, rotationY: 0, rotationX: 0, duration: 0.6, ease: 'elastic.out(1, 0.5)' });
  });
});

/* ── SCROLL HINT BOUNCE ──────────────────────────────────── */
gsap.to('.hero-scroll-hint', {
  y: 12, duration: 1.3, repeat: -1, yoyo: true, ease: 'power1.inOut'
});
