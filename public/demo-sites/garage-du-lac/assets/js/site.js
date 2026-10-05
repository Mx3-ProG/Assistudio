/* ==========================================================================
   Garage Du Lac — Runtime commun
   i18n · header sticky · footer · scroll-to-top · cookies · thème · formulaires
   ========================================================================== */
(function () {
  'use strict';

  var LANGS = window.GDL_LANGS;
  var DICT  = window.GDL_I18N;
  var Store = window.GDL_Store;
  var K     = Store.keys;

  /* ---------------------------------------------------------------- Icônes */
  var ICONS = {
    wrench:   '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.1-2.1 2.7-2.5Z"/>',
    phone:    '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.1a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/>',
    mail:     '<path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/><path d="m22 6-10 7L2 6"/>',
    pin:      '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    clock:    '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    star:     '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21l1.2-6.9-5-4.9 6.9-1L12 2Z" fill="currentColor" stroke="none"/>',
    check:    '<path d="M20 6 9 17l-5-5"/>',
    checkCir: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    arrowR:   '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    arrowUp:  '<path d="M12 19V5"/><path d="m5 12 7-7 7 7"/>',
    chevD:    '<path d="m6 9 6 6 6-6"/>',
    chevR:    '<path d="m9 18 6-6-6-6"/>',
    plus:     '<path d="M12 5v14"/><path d="M5 12h14"/>',
    lock:     '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    globe:    '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20Z"/>',
    menu:     '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
    x:        '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    sun:      '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon:     '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>',
    shield:   '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    bell:     '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
    card:     '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
    file:     '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/>',
    users:    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/>',
    chart:    '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/>',
    activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 7 19.4a1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 15a1.7 1.7 0 0 0-1.5-1H1a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 3 9a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 9 3.6V3a2 2 0 1 1 4 0v.1A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 20.4 9H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
    logout:   '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    sparkles: '<path d="m12 3 1.9 4.6L18.5 9l-4.6 1.9L12 15l-1.9-4.1L5.5 9l4.6-1.4L12 3Z"/><path d="M19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z"/>',
    bolt:     '<path d="M13 2 3 14h8l-1 8 10-12h-8l1-8Z"/>',
    oil:      '<path d="M3 14h4l2-3h8l4 3v4a1 1 0 0 1-1 1h-1a2 2 0 0 1-4 0H9a2 2 0 0 1-4 0H4a1 1 0 0 1-1-1v-4Z"/><path d="M12 3v5"/>',
    brake:    '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v4M12 17v4M3 12h4M17 12h4"/>',
    tyre:     '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="m12 3 1 5M21 12l-5 1M12 21l-1-5M3 12l5-1"/>',
    chip:     '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
    clipboard:'<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
    snow:     '<path d="M12 2v20M4.9 6.5l14.2 11M19.1 6.5 4.9 17.5"/><path d="m9 4 3 2 3-2M9 20l3-2 3 2"/>',
    exhaust:  '<path d="M3 15h11a4 4 0 0 0 0-8H8"/><circle cx="18" cy="15" r="3"/><path d="M3 11h3"/>',
    van:      '<path d="M3 17V7a1 1 0 0 1 1-1h9v11"/><path d="M13 9h4l4 4v4h-2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M9 17h6"/>',
    battery:  '<rect x="2" y="7" width="18" height="11" rx="2"/><path d="M22 11v3"/><path d="M7 10v5M10 12h-6"/><path d="M15 10v5M18 12h-6"/>',
    image:    '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
    info:     '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    alert:    '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
    external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>'
  };

  function icon(name, cls) {
    var p = ICONS[name] || '';
    return '<svg class="' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
           'stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
  }

  /* ------------------------------------------------------------------ i18n */
  function detectLang() {
    var saved = Store.get(K.lang, null);
    if (saved && DICT[saved]) return saved;
    var qp = new URLSearchParams(location.search).get('lang');
    if (qp && DICT[qp]) return qp;
    var nav = (navigator.language || 'fr').slice(0, 2).toLowerCase();
    return DICT[nav] ? nav : 'fr';
  }

  var lang = detectLang();

  function t(path, fallback) {
    var parts = String(path).split('.');
    var cur = DICT[lang];
    for (var i = 0; i < parts.length; i++) {
      if (cur == null) break;
      cur = cur[parts[i]];
    }
    if (cur == null && lang !== 'fr') {                  // repli sur le français
      cur = DICT.fr;
      for (var j = 0; j < parts.length; j++) {
        if (cur == null) break;
        cur = cur[parts[j]];
      }
    }
    return (cur == null) ? (fallback !== undefined ? fallback : path) : cur;
  }

  function applyI18n(root) {
    (root || document).querySelectorAll('[data-i18n]').forEach(function (el) {
      var val = t(el.getAttribute('data-i18n'));
      if (typeof val !== 'string') return;
      if (el.hasAttribute('data-i18n-html')) el.innerHTML = val;
      else el.textContent = val;
    });
    (root || document).querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      // format : "placeholder:form.namePh|aria-label:common.book"
      el.getAttribute('data-i18n-attr').split('|').forEach(function (pair) {
        var bits = pair.split(':');
        if (bits.length === 2) el.setAttribute(bits[0].trim(), t(bits[1].trim()));
      });
    });
    document.documentElement.lang = lang;
    var metaKey = document.body.getAttribute('data-meta');
    if (metaKey) {
      var m = t('meta.' + metaKey);
      if (m && m.t) {
        document.title = m.t;
        var d = document.querySelector('meta[name="description"]');
        if (d) d.setAttribute('content', m.d);
      }
    }
    document.dispatchEvent(new CustomEvent('gdl:lang', { detail: { lang: lang } }));
  }

  function setLang(code) {
    if (!DICT[code]) return;
    lang = code;
    Store.set(K.lang, code);
    applyI18n();
    renderLangMenu();
  }

  /* ----------------------------------------------------------------- Thème */
  function initTheme() {
    var saved = Store.get(K.theme, null);
    var prefers = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = saved || (prefers ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  }
  function toggleTheme() {
    var cur = document.documentElement.getAttribute('data-theme');
    var next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    Store.set(K.theme, next);
    paintThemeIcon();
  }
  function paintThemeIcon() {
    var dark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.querySelectorAll('[data-theme-icon]').forEach(function (el) {
      el.innerHTML = icon(dark ? 'sun' : 'moon');
    });
  }

  /* ------------------------------------------------------- Header / Footer */
  var BASE = document.body.getAttribute('data-base') || '';
  var PAGE = document.body.getAttribute('data-page') || '';

  var NAV = [
    { key: 'home',     href: 'index.html',    id: 'home' },
    { key: 'services', href: 'services.html', id: 'services' },
    { key: 'about',    href: 'about.html',    id: 'about' },
    { key: 'blog',     href: 'blog.html',     id: 'blog' },
    { key: 'faq',      href: 'faq.html',      id: 'faq' },
    { key: 'contact',  href: 'contact.html',  id: 'contact' }
  ];

  function brandMarkup(inFooter) {
    return '<a class="brand" href="' + BASE + 'index.html">' +
      '<span class="brand__mark">' + icon('wrench') + '</span>' +
      '<span class="brand__txt">Garage Du Lac<small data-i18n="biz.tagline"></small></span></a>';
  }

  function renderHeader() {
    var host = document.getElementById('site-header');
    if (!host) return;
    var navHtml = NAV.map(function (n) {
      return '<a href="' + BASE + n.href + '"' + (PAGE === n.id ? ' class="active" aria-current="page"' : '') +
             ' data-i18n="nav.' + n.key + '"></a>';
    }).join('');

    host.className = 'header';
    host.innerHTML =
      '<div class="container header__inner">' +
        brandMarkup() +
        '<nav class="nav" aria-label="Navigation principale">' + navHtml + '</nav>' +
        '<div class="header__actions">' +
          '<div class="lang" id="langWrap">' +
            '<button class="lang__btn" id="langBtn" aria-haspopup="true" aria-expanded="false" data-i18n-attr="aria-label:common.langLabel">' +
              icon('globe') + '<span id="langCur">FR</span>' + icon('chevD', 'chev') +
            '</button>' +
            '<div class="lang__menu" id="langMenu" role="menu"></div>' +
          '</div>' +
          '<button class="icon-btn" id="themeBtn" data-i18n-attr="aria-label:common.theme"><span data-theme-icon></span></button>' +
          '<a class="btn btn-primary btn-sm hide-sm" href="' + BASE + 'contact.html" data-i18n="common.bookShort"></a>' +
          '<button class="icon-btn burger" id="burger" aria-expanded="false" data-i18n-attr="aria-label:nav.menu">' + icon('menu') + '</button>' +
        '</div>' +
      '</div>';

    // Tiroir mobile
    var drawer = document.createElement('div');
    drawer.className = 'drawer';
    drawer.id = 'drawer';
    drawer.innerHTML =
      NAV.map(function (n) {
        return '<a href="' + BASE + n.href + '"><span data-i18n="nav.' + n.key + '"></span>' + icon('chevR') + '</a>';
      }).join('') +
      '<a href="' + BASE + 'admin/login.html"><span data-i18n="nav.admin"></span>' + icon('lock') + '</a>' +
      '<a class="btn btn-primary" href="' + BASE + 'contact.html" data-i18n="common.book"></a>' +
      '<a class="btn btn-ghost" href="tel:+41244811734" style="margin-top:12px">' + icon('phone') + '<span data-i18n="common.call"></span></a>';
    document.body.appendChild(drawer);

    document.getElementById('themeBtn').addEventListener('click', toggleTheme);

    var burger = document.getElementById('burger');
    burger.addEventListener('click', function () {
      var open = drawer.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
      burger.innerHTML = icon(open ? 'x' : 'menu');
      document.body.style.overflow = open ? 'hidden' : '';
    });

    var langBtn = document.getElementById('langBtn');
    var langWrap = document.getElementById('langWrap');
    langBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = langWrap.classList.toggle('open');
      langBtn.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', function () {
      langWrap.classList.remove('open');
      langBtn.setAttribute('aria-expanded', 'false');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        langWrap.classList.remove('open');
        if (drawer.classList.contains('open')) burger.click();
      }
    });

    renderLangMenu();
    paintThemeIcon();

    // Ombre au défilement
    var onScroll = function () {
      host.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function renderLangMenu() {
    var menu = document.getElementById('langMenu');
    var cur = document.getElementById('langCur');
    if (!menu) return;
    menu.innerHTML = LANGS.map(function (l) {
      return '<button role="menuitem" data-lang="' + l.code + '" aria-current="' + (l.code === lang) + '">' +
             '<span class="lang__flag">' + l.flag + '</span>' + l.label + '</button>';
    }).join('');
    menu.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () { setLang(b.getAttribute('data-lang')); });
    });
    var active = LANGS.filter(function (l) { return l.code === lang; })[0] || LANGS[0];
    if (cur) cur.textContent = active.short;
  }

  function renderFooter() {
    var host = document.getElementById('site-footer');
    if (!host) return;
    var year = new Date().getFullYear();

    host.className = 'footer';
    host.innerHTML =
      '<div class="container">' +
        '<div class="footer__grid">' +
          '<div>' + brandMarkup(true) +
            '<p data-i18n="footer.about"></p>' +
            '<p class="flex items-center gap-2 wrap" style="margin-top:16px">' +
              '<span class="badge badge--stars">' + icon('star') + ' 5,0 · 37</span>' +
              '<a class="btn btn-ghost btn-sm" id="footerRateBtn" target="_blank" rel="noopener">' +
                icon('star') + '<span data-i18n="reviews.rateShort"></span>' +
              '</a>' +
            '</p>' +
          '</div>' +
          '<div><h4 data-i18n="footer.navT"></h4><ul>' +
            NAV.map(function (n) {
              return '<li><a href="' + BASE + n.href + '" data-i18n="nav.' + n.key + '"></a></li>';
            }).join('') +
          '</ul></div>' +
          '<div><h4 data-i18n="footer.servT"></h4><ul id="footerServices"></ul></div>' +
          '<div><h4 data-i18n="footer.contactT"></h4><ul>' +
            '<li><a href="https://maps.google.com/?q=Garage+Du+Lac+Rte+Cantonale+98+1898+Saint-Gingolph" target="_blank" rel="noopener" data-i18n="biz.address"></a></li>' +
            '<li><a href="tel:+41244811734">+41 24 481 17 34</a></li>' +
            '<li><a href="mailto:contact@garagedulac.ch">contact@garagedulac.ch</a></li>' +
            '<li><span data-i18n="biz.hours"></span></li>' +
            '<li><a href="' + BASE + 'admin/login.html" data-i18n="footer.adminLink"></a></li>' +
          '</ul></div>' +
        '</div>' +
        '<div class="footer__bottom">' +
          '<div>© ' + year + ' Garage Du Lac · <span data-i18n="footer.rights"></span></div>' +
          '<nav class="footer__legal" aria-label="Pages légales">' +
            '<a href="' + BASE + 'legal/cookies.html" data-i18n="footer.cookies"></a>' +
            '<a href="' + BASE + 'legal/rgpd.html" data-i18n="footer.rgpd"></a>' +
            '<a href="' + BASE + 'legal/confidentialite.html" data-i18n="footer.privacy"></a>' +
            '<a href="' + BASE + 'legal/cgu.html" data-i18n="footer.terms"></a>' +
          '</nav>' +
        '</div>' +
        '<p class="footer__pub" data-i18n="footer.pub" data-i18n-html></p>' +
      '</div>';

    renderFooterServices();
    document.addEventListener('gdl:lang', renderFooterServices);

    var rate = document.getElementById('footerRateBtn');
    if (rate && window.GDL_Catalog) rate.href = window.GDL_Catalog.GOOGLE_REVIEWS_URL;
  }

  /* Liste des prestations du footer — reflète les titres saisis en back-office */
  function renderFooterServices() {
    var host = document.getElementById('footerServices');
    if (!host || !window.GDL_Catalog) return;
    host.innerHTML = Store.getProducts().slice(0, 6).map(function (p) {
      return '<li><a href="' + BASE + 'services.html#' + p.key + '">' +
             window.GDL_Catalog.title(p) + '</a></li>';
    }).join('');
  }

  /* ----------------------------------------------------- Scroll to top btn */
  function renderScrollTop() {
    var btn = document.createElement('button');
    btn.className = 'to-top';
    btn.id = 'toTop';
    btn.setAttribute('data-i18n-attr', 'aria-label:scrollTop|title:scrollTop');
    btn.innerHTML = icon('arrowUp');
    document.body.appendChild(btn);

    btn.addEventListener('click', function () {
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
    window.addEventListener('scroll', function () {
      btn.classList.toggle('show', window.scrollY > 420);
    }, { passive: true });
  }

  /* ------------------------------------------------------- Bandeau cookies */
  function renderCookie() {
    if (Store.get(K.consent, null)) return;
    var bar = document.createElement('div');
    bar.className = 'cookie';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-live', 'polite');
    bar.innerHTML =
      '<p data-i18n="cookie.text" data-i18n-html></p>' +
      '<div class="cookie__actions">' +
        '<button class="btn btn-ghost btn-sm" data-consent="refused" data-i18n="cookie.refuse"></button>' +
        '<button class="btn btn-dark btn-sm" data-consent="accepted" data-i18n="cookie.accept"></button>' +
        '<a class="btn btn-ghost btn-sm" href="' + BASE + 'legal/cookies.html" data-i18n="cookie.more"></a>' +
      '</div>';
    document.body.appendChild(bar);
    applyI18n(bar);
    setTimeout(function () { bar.classList.add('show'); }, 900);
    bar.querySelectorAll('[data-consent]').forEach(function (b) {
      b.addEventListener('click', function () {
        Store.set(K.consent, { value: b.getAttribute('data-consent'), at: Date.now() });
        Store.log('visiteur', 'cookie.consent', 'Choix : ' + b.getAttribute('data-consent'));
        bar.classList.remove('show');
        setTimeout(function () { bar.remove(); }, 500);
      });
    });
  }

  /* ------------------------------------------------------------- Accordéon */
  function initAccordions(root) {
    (root || document).querySelectorAll('.acc').forEach(function (acc) {
      var btn = acc.querySelector('.acc__btn');
      var panel = acc.querySelector('.acc__panel');
      if (!btn || !panel || btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.setAttribute('aria-expanded', 'false');
      btn.addEventListener('click', function () {
        var open = acc.classList.toggle('open');
        btn.setAttribute('aria-expanded', String(open));
        panel.style.maxHeight = open ? panel.scrollHeight + 'px' : '0px';
      });
    });
    document.addEventListener('gdl:lang', function () {
      (root || document).querySelectorAll('.acc.open .acc__panel').forEach(function (p) {
        p.style.maxHeight = p.scrollHeight + 'px';
      });
    });
  }

  /* ------------------------------------------------------ Reveal on scroll */
  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e, i) {
        if (!e.isIntersecting) return;
        var delay = parseInt(e.target.getAttribute('data-delay') || '0', 10);
        setTimeout(function () { e.target.classList.add('in'); }, delay);
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* -------------------------------------------------------- Validation form */
  function validateField(field) {
    var input = field.querySelector('.input, .select, .textarea, input[type="checkbox"]');
    if (!input) return true;
    var errEl = field.querySelector('.field-error');
    var ok = true, msg = '';

    if (input.type === 'checkbox') {
      ok = !input.required || input.checked;
      msg = t('form.errConsent');
    } else {
      var v = (input.value || '').trim();
      if (input.required && !v) { ok = false; msg = t('form.errRequired'); }
      else if (v && input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v)) { ok = false; msg = t('form.errEmail'); }
      else if (v && input.type === 'tel' && !/^[+0-9 ()./-]{8,22}$/.test(v)) { ok = false; msg = t('form.errPhone'); }
    }
    field.classList.toggle('invalid', !ok);
    if (errEl && !ok) errEl.textContent = msg;
    input.setAttribute('aria-invalid', String(!ok));
    return ok;
  }

  function initForms() {
    document.querySelectorAll('form[data-gdl-form]').forEach(function (form) {
      form.setAttribute('novalidate', '');

      form.querySelectorAll('.field').forEach(function (field) {
        var input = field.querySelector('.input, .select, .textarea, input[type="checkbox"]');
        if (!input) return;
        input.addEventListener('blur', function () { if (field.classList.contains('invalid') || input.value) validateField(field); });
        input.addEventListener('input', function () { if (field.classList.contains('invalid')) validateField(field); });
      });

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var fields = Array.prototype.slice.call(form.querySelectorAll('.field'));
        var valid = fields.map(validateField).every(Boolean);
        if (!valid) {
          var first = form.querySelector('.field.invalid');
          if (first) { first.scrollIntoView({ block: 'center', behavior: 'smooth' }); first.querySelector('input,select,textarea').focus(); }
          return;
        }

        var btn = form.querySelector('[type="submit"]');
        var label = btn ? btn.innerHTML : '';
        if (btn) { btn.disabled = true; btn.textContent = t('common.sending'); }

        var data = {};
        new FormData(form).forEach(function (v, k) { data[k] = v; });

        setTimeout(function () {
          var product = Store.getProduct(data.service);
          Store.addOrder({
            name: data.name, email: data.email, phone: data.phone,
            vehicle: data.vehicle || '', plate: data.plate || '',
            service: data.service || '', date: data.date || '',
            amount: product ? product.price : 0,
            message: data.message || ''
          });

          form.reset();
          if (btn) { btn.disabled = false; btn.innerHTML = label; }

          var ok = form.querySelector('[data-form-success]');
          if (ok) {
            ok.classList.remove('hidden');
            ok.scrollIntoView({ block: 'center', behavior: 'smooth' });
            ok.setAttribute('tabindex', '-1');
            ok.focus();
          }
        }, 650);
      });
    });
  }

  /* ---------------------------------------------------------------- Année */
  function fillYear() {
    document.querySelectorAll('[data-year]').forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  /* -------------------------------------------------------------- Amorçage */
  initTheme();

  function boot() {
    renderHeader();
    renderFooter();
    renderScrollTop();
    applyI18n();
    renderCookie();
    initAccordions();
    initReveal();
    initForms();
    fillYear();
    Store.log('visiteur', 'page.view', location.pathname.split('/').pop() + ' (lang: ' + lang + ')');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  /* ------------------------------------------------------- Exports publics */
  window.GDL = {
    t: t, icon: icon, applyI18n: applyI18n, setLang: setLang,
    getLang: function () { return lang; }, base: BASE,
    initAccordions: initAccordions, initReveal: initReveal
  };
})();
