/* =========================================
   Inès Darges Conciergerie — Interactions
   ========================================= */

(function () {
  'use strict';

  document.body.classList.add('js-ready');

  /* ---------- Favicon transparent, dérivé du logo ---------- */
  if (!document.querySelector('link[rel~="icon"]')) {
    const script = document.currentScript;
    const scriptSrc = script ? script.getAttribute('src') : 'js/main.js';
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.type = 'image/svg+xml';
    favicon.href = scriptSrc.replace(/js\/main\.js(?:\?.*)?$/, 'assets/favicon.svg');
    document.head.appendChild(favicon);
  }

  /* ---------- Header scroll state ---------- */
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => {
      if (window.scrollY > 20) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Mobile menu toggle ---------- */
  const toggle = document.querySelector('.menu-toggle');
  const navList = document.querySelector('.nav-list');
  const closeMenu = () => {
    if (!toggle || !navList) return;
    toggle.classList.remove('open');
    navList.classList.remove('open');
    document.body.style.overflow = '';
  };
  if (toggle && navList) {
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = toggle.classList.toggle('open');
      navList.classList.toggle('open');
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    navList.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', closeMenu);
    });
    document.addEventListener('click', (e) => {
      if (!navList.classList.contains('open')) return;
      if (!navList.contains(e.target) && !toggle.contains(e.target)) closeMenu();
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 980) closeMenu();
    });
  }

  /* ---------- Mark active nav link ---------- */
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach((link) => {
    const href = link.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  /* ---------- Scroll reveal (IntersectionObserver) ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  const revealAll = () => {
    revealEls.forEach((el) => el.classList.add('visible'));
  };

  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );
    revealEls.forEach((el) => io.observe(el));
    window.addEventListener('load', () => {
      setTimeout(() => {
        revealEls.forEach((el) => {
          if (!el.classList.contains('visible')) el.classList.add('visible');
        });
      }, 150);
    }, { once: true });
  } else {
    revealAll();
  }

  /* ---------- Counter animation on stats ---------- */
  const counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window && counters.length) {
    const co = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const target = parseInt(el.dataset.count, 10);
          const suffix = el.dataset.suffix || '';
          const duration = 1400;
          const start = performance.now();
          const step = (now) => {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.floor(eased * target) + suffix;
            if (p < 1) requestAnimationFrame(step);
            else el.textContent = target + suffix;
          };
          requestAnimationFrame(step);
          co.unobserve(el);
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((el) => co.observe(el));
  }

  /* ---------- Supabase client ---------- */
  const supabase = (window.supabase && window.SUPABASE_URL
    && window.SUPABASE_ANON_KEY
    && !window.SUPABASE_URL.startsWith('REMPLACER'))
    ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY)
    : null;

  /* IP cache (récupérée une seule fois par session, et seulement si l'utilisateur a accepté tous les cookies) */
  let cachedIp = null;
  const fetchIp = async () => {
    if (cachedIp !== null) return cachedIp;
    if (!window.InesConsent || !window.InesConsent.analytics()) { cachedIp = ''; return ''; }
    try {
      const r = await fetch('https://api.ipify.org?format=json', { cache: 'no-store' });
      const j = await r.json();
      cachedIp = j.ip || '';
    } catch (e) { cachedIp = ''; }
    return cachedIp;
  };

  /* ---------- Contact form ---------- */
  const form = document.querySelector('.contact-form');
  if (form) {
    const statusBox = form.querySelector('.form-status');
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnHTML = submitBtn ? submitBtn.innerHTML : '';

    const setStatus = (kind, text) => {
      if (!statusBox) return;
      statusBox.className = 'form-status visible ' + kind;
      statusBox.textContent = text;
    };

    const mailtoFallback = (d) => {
      const subject = d.type_service || 'Demande de service';
      const lines = [
        `Bonjour Inès,`,
        ``,
        d.message || '',
        ``,
        `---`,
        `${d.prenom || ''} ${d.nom || ''}`.trim(),
        d.telephone ? `Tél : ${d.telephone}` : '',
        d.email ? `Email : ${d.email}` : '',
        d.adresse ? `Adresse : ${d.adresse}` : '',
      ].filter(Boolean).join('\r\n');
      window.location.href = `mailto:conciergerie-66@outlook.fr?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines)}`;
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Honeypot anti-bot
      const honeypot = form.querySelector('input[name="website"]');
      if (honeypot && honeypot.value) {
        setStatus('success', 'Merci, votre message a bien été envoyé.');
        form.reset();
        return;
      }

      const data = new FormData(form);
      const payload = {
        prenom: (data.get('prenom') || '').toString().trim(),
        nom: (data.get('nom') || '').toString().trim(),
        email: (data.get('email') || '').toString().trim(),
        telephone: (data.get('telephone') || '').toString().trim(),
        adresse: (data.get('adresse') || '').toString().trim() || null,
        type_service: (data.get('subject') || '').toString(),
        message: (data.get('message') || '').toString().trim(),
        user_agent: navigator.userAgent.slice(0, 500),
        page_origin: window.location.pathname,
      };

      if (submitBtn) {
        submitBtn.classList.add('is-loading');
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Envoi en cours…';
      }
      if (statusBox) statusBox.className = 'form-status';

      // Si Supabase n'est pas configuré → fallback mailto direct
      if (!supabase) {
        mailtoFallback(payload);
        if (submitBtn) {
          submitBtn.classList.remove('is-loading');
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnHTML;
        }
        return;
      }

      payload.ip_address = await fetchIp();

      try {
        const { error } = await supabase.from('contact_submissions').insert([payload]);
        if (error) throw error;
        setStatus('success', 'Merci ! Votre demande a bien été envoyée. Inès revient vers vous sous 24h.');
        form.reset();
      } catch (err) {
        // Fallback gracieux : on n'a pas perdu la lead
        setStatus('error', "Souci d'envoi automatique — votre client mail va s'ouvrir pour finaliser la demande.");
        setTimeout(() => mailtoFallback(payload), 800);
      } finally {
        if (submitBtn) {
          submitBtn.classList.remove('is-loading');
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnHTML;
        }
      }
    });
  }

  /* ---------- Tracking clics tel: / mailto: (fire-and-forget) ---------- */
  const trackInteraction = async (eventType, href) => {
    if (!window.InesConsent || !window.InesConsent.analytics() || !supabase) return; // pas de log sans consentement
    try {
      const ip = await fetchIp();
      supabase.from('interaction_events').insert([{
        event_type: eventType,
        page_origin: window.location.pathname,
        ip_address: ip,
        user_agent: navigator.userAgent.slice(0, 500),
        metadata: { href: (href || '').slice(0, 250) }
      }]);
    } catch (e) { /* silencieux */ }
  };

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (href.startsWith('tel:')) trackInteraction('call_click', href);
    else if (href.startsWith('mailto:')) trackInteraction('email_click', href);
  }, { passive: true });

  /* ---------- Cookie consent ----------
     La bannière et l'état de consentement sont gérés par js/consent.js
     (window.InesConsent). Ici on se contente de lire l'état pour la mesure
     d'audience (voir fetchIp et trackInteraction plus haut). */

  /* ---------- Smooth anchor offset (account for fixed header) ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const targetId = a.getAttribute('href');
      if (targetId.length <= 1) return;
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 76;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();
