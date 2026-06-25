/* ============================================================
   TRAVEL WITH OUMAIMA — Main JS
   ============================================================ */

/* PAGE LOADER */
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('loader')?.classList.add('done');
  }, 1900);
});

/* NAVBAR SCROLL + TOP BAR HIDE */
const navbar = document.getElementById('navbar');
const topBar = document.getElementById('top-bar');
const topBarH = topBar ? topBar.offsetHeight : 0;
window.addEventListener('scroll', () => {
  const scrolled = window.scrollY > 60;
  navbar.classList.toggle('scrolled', scrolled);
  if (topBar) {
    if (window.scrollY > topBarH) {
      topBar.style.transform = 'translateY(-100%)';
      navbar.style.top = '0';
    } else {
      topBar.style.transform = '';
      navbar.style.top = topBarH + 'px';
    }
  }
}, { passive: true });

/* MOBILE MENU */
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');
const mobileClose = document.getElementById('mobile-close');

hamburger?.addEventListener('click', () => mobileMenu.classList.add('open'));
mobileClose?.addEventListener('click', () => mobileMenu.classList.remove('open'));
mobileMenu?.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => mobileMenu.classList.remove('open'));
});

/* REVEAL ON SCROLL */
const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
revealEls.forEach(el => revealObserver.observe(el));

/* PARALLAX HERO */
const heroBg = document.querySelector('.hero-bg');
window.addEventListener('scroll', () => {
  if (heroBg && window.scrollY < window.innerHeight) {
    heroBg.style.transform = `scale(1.05) translateY(${window.scrollY * 0.25}px)`;
  }
}, { passive: true });

/* DESTINATION CAROUSELS */
document.querySelectorAll('.dest-carousel').forEach(carousel => {
  const slides = carousel.querySelector('.dest-slides');
  const dots = carousel.querySelectorAll('.dest-dot');
  const total = carousel.querySelectorAll('.dest-slide').length;
  let current = 0;
  let autoTimer;

  function goTo(idx) {
    current = (idx + total) % total;
    slides.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  carousel.querySelector('.prev')?.addEventListener('click', () => { goTo(current - 1); resetAuto(); });
  carousel.querySelector('.next')?.addEventListener('click', () => { goTo(current + 1); resetAuto(); });
  dots.forEach((d, i) => d.addEventListener('click', () => { goTo(i); resetAuto(); }));

  function resetAuto() {
    clearInterval(autoTimer);
    autoTimer = setInterval(() => goTo(current + 1), 4000);
  }

  // Touch swipe
  let touchStartX = 0;
  carousel.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  carousel.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) goTo(current + (diff > 0 ? 1 : -1));
    resetAuto();
  }, { passive: true });

  resetAuto();
  goTo(0);
});

/* MASONRY GALLERY + LIGHTBOX */
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const masonryItems = document.querySelectorAll('.masonry-item');
let currentLBIdx = 0;

const galleryImgs = Array.from(masonryItems).map(item => item.querySelector('img')?.src);

function openLightbox(idx) {
  currentLBIdx = idx;
  lightboxImg.src = galleryImgs[idx];
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
}

masonryItems.forEach((item, idx) => {
  item.addEventListener('click', () => openLightbox(idx));
});
document.getElementById('lightbox-close')?.addEventListener('click', closeLightbox);
document.getElementById('lb-prev')?.addEventListener('click', () => {
  openLightbox((currentLBIdx - 1 + galleryImgs.length) % galleryImgs.length);
});
document.getElementById('lb-next')?.addEventListener('click', () => {
  openLightbox((currentLBIdx + 1) % galleryImgs.length);
});
lightbox?.addEventListener('click', e => {
  if (e.target === lightbox) closeLightbox();
});
document.addEventListener('keydown', e => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') openLightbox((currentLBIdx - 1 + galleryImgs.length) % galleryImgs.length);
  if (e.key === 'ArrowRight') openLightbox((currentLBIdx + 1) % galleryImgs.length);
});

/* TESTIMONIALS SLIDER */
const testiTrack = document.querySelector('.testi-track');
const testiSlides = document.querySelectorAll('.testi-slide');
const testiDots = document.querySelectorAll('.testi-dot');
let testiCurrent = 0;
let testiTimer;

function goTesti(idx) {
  testiCurrent = (idx + testiSlides.length) % testiSlides.length;
  testiTrack.style.transform = `translateX(-${testiCurrent * 100}%)`;
  testiDots.forEach((d, i) => d.classList.toggle('active', i === testiCurrent));
}

document.getElementById('testi-prev')?.addEventListener('click', () => { goTesti(testiCurrent - 1); resetTesti(); });
document.getElementById('testi-next')?.addEventListener('click', () => { goTesti(testiCurrent + 1); resetTesti(); });
testiDots.forEach((d, i) => d.addEventListener('click', () => { goTesti(i); resetTesti(); }));

function resetTesti() {
  clearInterval(testiTimer);
  testiTimer = setInterval(() => goTesti(testiCurrent + 1), 5000);
}
resetTesti();

/* DESTINATION FILTER */
const filterBtns = document.querySelectorAll('.dest-filter-btn');
const destCards = document.querySelectorAll('.dest-card');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;

    destCards.forEach(card => {
      const cat = card.dataset.category || '';
      const show = filter === 'all' || cat.includes(filter);
      card.style.transition = 'opacity 0.4s, transform 0.4s';
      if (show) {
        card.style.opacity = '1';
        card.style.transform = '';
        card.style.display = '';
      } else {
        card.style.opacity = '0';
        card.style.transform = 'scale(0.96)';
        setTimeout(() => {
          if (!show) card.style.display = 'none';
        }, 400);
      }
    });
  });
});

/* SMOOTH COUNTER ANIMATION */
document.querySelectorAll('.count-up').forEach(el => {
  const target = parseInt(el.dataset.target);
  const obs = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    obs.unobserve(el);
    let start = 0;
    const step = target / 60;
    const timer = setInterval(() => {
      start = Math.min(start + step, target);
      el.textContent = Math.floor(start) + (el.dataset.suffix || '');
      if (start >= target) clearInterval(timer);
    }, 16);
  }, { threshold: 0.5 });
  obs.observe(el);
});

/* NEWSLETTER FORM */
document.querySelector('.newsletter-form')?.addEventListener('submit', e => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]') || e.target.querySelector('button');
  const original = btn.textContent;
  btn.textContent = '✓ Merci !';
  btn.style.background = 'var(--forest)';
  btn.style.color = 'white';
  setTimeout(() => {
    btn.textContent = original;
    btn.style.background = '';
    btn.style.color = '';
    e.target.reset();
  }, 3000);
});

/* SEARCH BOX */
document.querySelector('.search-submit')?.addEventListener('click', () => {
  const dest = document.querySelector('#search-dest')?.value;
  const type = document.querySelector('#search-type')?.value;

  if (dest || type) {
    destCards.forEach(card => {
      const cat = card.dataset.category || '';
      const name = card.dataset.name?.toLowerCase() || '';
      const matchDest = !dest || dest === 'all' || name.includes(dest.toLowerCase());
      const matchType = !type || type === 'all' || cat.includes(type);
      card.style.display = (matchDest && matchType) ? '' : 'none';
    });
    document.getElementById('destinations')?.scrollIntoView({ behavior: 'smooth' });
  }
});

/* VIDEO TESTIMONIALS — play/pause on click, autoplay on hover */
document.querySelectorAll('.vtesti-item').forEach(item => {
  const video = item.querySelector('.vtesti-video');
  item.addEventListener('click', () => {
    if (video.paused) {
      video.play();
      item.classList.add('playing');
    } else {
      video.pause();
      item.classList.remove('playing');
    }
  });
  item.addEventListener('mouseenter', () => { video.play(); item.classList.add('playing'); });
  item.addEventListener('mouseleave', () => { video.pause(); item.classList.remove('playing'); });
});

document.getElementById('vtesti-load-more')?.addEventListener('click', function() {
  document.querySelectorAll('.vtesti-more, #vtesti-more-toggle').forEach(el => el.style.display = '');
  this.style.display = 'none';
});
