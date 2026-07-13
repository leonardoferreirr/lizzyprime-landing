/* ============================================================
   LIZZY PRIME — motion engine
   Lenis + GSAP/ScrollTrigger com failsafes de visibilidade.
   ============================================================ */
(function () {
  'use strict';

  window.__lzReady = true;
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGSAP = typeof window.gsap !== 'undefined';
  var hasST = hasGSAP && typeof window.ScrollTrigger !== 'undefined';

  /* ---------- Lenis smooth scroll ---------- */
  var lenis = null;
  if (typeof window.Lenis !== 'undefined' && !reduce) {
    lenis = new window.Lenis({ duration: 1.05, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1.4 });
    window.__lenis = lenis;
    if (hasST) {
      lenis.on('scroll', window.ScrollTrigger.update);
      window.gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      window.gsap.ticker.lagSmoothing(0);
    } else {
      requestAnimationFrame(function raf(time) { lenis.raf(time); requestAnimationFrame(raf); });
    }
  }

  function scrollToId(id) {
    var el = document.querySelector(id);
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: -70 });
    else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }

  if (hasST) window.gsap.registerPlugin(window.ScrollTrigger);

  /* ---------- Hero parallax (título/fades revelam por CSS) ---------- */
  if (hasGSAP && !reduce && hasST) {
    window.gsap.to('.hero__media', {
      yPercent: 12, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
    window.gsap.to('.hero__inner', {
      yPercent: -6, opacity: 0.4, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
    var hero = document.querySelector('.hero');
    var media = document.querySelector('.hero__media');
    if (hero && media && window.matchMedia('(hover:hover)').matches) {
      hero.addEventListener('mousemove', function (e) {
        var rx = (e.clientX / window.innerWidth - 0.5);
        var ry = (e.clientY / window.innerHeight - 0.5);
        window.gsap.to(media, { x: rx * -20, y: ry * -12, duration: 0.9, ease: 'power2.out', overwrite: 'auto' });
      });
    }
  }
  requestAnimationFrame(function () { root.classList.add('is-loaded'); });

  /* ---------- Reveal genérico ---------- */
  function revealObserver(threshold, rootMargin) {
    return new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); obs.unobserve(en.target); }
      });
    }, { threshold: threshold, rootMargin: rootMargin });
  }
  if ('IntersectionObserver' in window && !reduce) {
    var ioReveal = revealObserver(0.15, '0px 0px -8% 0px');
    document.querySelectorAll('[data-reveal]').forEach(function (el) { ioReveal.observe(el); });
    var ioMask = revealObserver(0, '0px 0px -14% 0px');
    document.querySelectorAll('[data-reveal-mask]').forEach(function (el) { ioMask.observe(el); });
  } else {
    document.querySelectorAll('[data-reveal],[data-reveal-mask]').forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Counters ---------- */
  function animateCount(el) {
    var target = parseFloat(el.dataset.count);
    if (isNaN(target) || reduce) return;
    var dur = 1500, t0 = null;
    function fmt(n) { return Math.round(n).toLocaleString('pt-BR'); }
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * eased);
      if (p < 1) requestAnimationFrame(step); else el.textContent = fmt(target);
    }
    el.textContent = '0';
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window && !reduce) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { animateCount(en.target); cio.unobserve(en.target); } });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq__item').forEach(function (item) {
    var btn = item.querySelector('.faq__q');
    var ans = item.querySelector('.faq__a');
    if (!btn || !ans) return;
    btn.addEventListener('click', function () {
      var open = item.classList.contains('is-open');
      if (open) {
        ans.style.height = ans.scrollHeight + 'px';
        requestAnimationFrame(function () { ans.style.height = '0px'; });
        item.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
      } else {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
        ans.style.height = ans.scrollHeight + 'px';
        ans.addEventListener('transitionend', function te() { if (item.classList.contains('is-open')) ans.style.height = 'auto'; ans.removeEventListener('transitionend', te); });
      }
    });
  });

  /* ---------- Depoimentos em vídeo: pausa os outros ao dar play ---------- */
  (function depoVideos() {
    var vids = Array.prototype.slice.call(document.querySelectorAll('.vcard__video video'));
    vids.forEach(function (v) {
      v.addEventListener('play', function () {
        vids.forEach(function (o) { if (o !== v) o.pause(); });
      });
    });
  })();

  /* ---------- Header: solid + progress + scrollspy + wa-float ---------- */
  var header = document.getElementById('siteHeader');
  var progress = document.getElementById('scrollProgress');
  var waFloat = document.querySelector('.wa-float');
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('[data-nav]'));
  var sections = navLinks.map(function (a) { return document.querySelector(a.getAttribute('href')); });

  function onScroll() {
    var y = window.scrollY;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    if (header) header.classList.toggle('is-solid', y > 40);
    if (progress) progress.style.width = (h > 0 ? (y / h * 100) : 0) + '%';
    if (waFloat) waFloat.classList.toggle('is-in', y > 500);
    var cur = '';
    sections.forEach(function (s) { if (s && s.getBoundingClientRect().top <= 140) cur = '#' + s.id; });
    navLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === cur); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Anchor smooth scroll ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length > 1 && document.querySelector(id)) { e.preventDefault(); closeMenu(); scrollToId(id); }
    });
  });

  /* ---------- Burger / mobile menu ---------- */
  var burger = document.getElementById('burger');
  var mobileMenu = document.getElementById('mobileMenu');
  function closeMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.remove('is-open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    if (burger) burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
  if (burger && mobileMenu) {
    burger.addEventListener('click', function () {
      var open = mobileMenu.classList.toggle('is-open');
      mobileMenu.setAttribute('aria-hidden', open ? 'false' : 'true');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
  }

  /* ---------- Sonho pré-selecionado + Form -> WhatsApp ---------- */
  var sonhoSelect = document.getElementById('sonho');
  document.querySelectorAll('[data-sonho]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (!sonhoSelect) return;
      var v = btn.dataset.sonho;
      for (var i = 0; i < sonhoSelect.options.length; i++) {
        if (sonhoSelect.options[i].text === v) { sonhoSelect.selectedIndex = i; break; }
      }
    });
  });

  var form = document.getElementById('leadForm');
  if (form) {
    // mini-simulador: atualiza o valor exibido e o preenchimento visual do slider
    var credito = document.getElementById('credito');
    var simValue = document.getElementById('simValue');
    var fmtBRL = function (n) { return 'R$ ' + Number(n).toLocaleString('pt-BR'); };
    if (credito && simValue) {
      var updateSim = function () {
        simValue.textContent = fmtBRL(credito.value);
        var pct = (credito.value - credito.min) / (credito.max - credito.min) * 100;
        credito.style.setProperty('--pct', pct + '%');
      };
      credito.addEventListener('input', updateSim);
      updateSim();
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      ['nome', 'whats'].forEach(function (id) {
        var f = document.getElementById(id);
        var wrap = f.closest('.field');
        if (!f.value.trim()) { wrap.classList.add('field--err'); wrap.classList.remove('field--ok'); ok = false; }
        else { wrap.classList.remove('field--err'); wrap.classList.add('field--ok'); }
      });
      if (!ok) return;

      var msg = 'Olá! Quero simular meu consórcio na Lizzy Prime.%0A%0A'
        + 'Nome: ' + encodeURIComponent(document.getElementById('nome').value) + '%0A'
        + 'Telefone: ' + encodeURIComponent(document.getElementById('whats').value) + '%0A'
        + 'Valor do crédito: ' + encodeURIComponent(credito ? fmtBRL(credito.value) : '');
      window.open('https://wa.me/5511911913845?text=' + msg, '_blank');
    });
  }

  if (hasST) {
    window.addEventListener('load', function () { window.ScrollTrigger.refresh(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { window.ScrollTrigger.refresh(); });
  }
})();
