/* ==========================================================================
   Garage Du Lac — Rendu partagé : prestations, articles, sélecteurs, icônes
   ========================================================================== */
(function () {
  'use strict';

  var G = window.GDL, S = window.GDL_Store;

  /* Fiche Google du garage — onglet « Avis » ouvert directement.
     Une seule source de vérité : à modifier ici si la fiche change. */
  var GOOGLE_REVIEWS_URL = 'https://www.google.com/maps/place/Garage+Du+Lac/@46.387419,6.847672,17z/data=!4m18!1m9!3m8!1s0x478e9f318137e3b3:0x2d1b7753dd6f8a1a!2sGarage+Du+Lac!8m2!3d46.387419!4d6.847672!9m1!1b1!16s%2Fg%2F11j0z51q7f!3m7!1s0x478e9f318137e3b3:0x2d1b7753dd6f8a1a!8m2!3d46.387419!4d6.847672!9m1!1b1!16s%2Fg%2F11j0z51q7f?entry=ttu';

  /* Articles du blog — le contenu textuel vit dans translations.js (blog.pN) */
  var POSTS = [
    { id: 'p1', date: '2026-02-18', read: 6, icon: 'snow' },
    { id: 'p2', date: '2026-01-30', read: 4, icon: 'alert' },
    { id: 'p3', date: '2026-01-12', read: 7, icon: 'clipboard' },
    { id: 'p4', date: '2025-12-04', read: 5, icon: 'oil' },
    { id: 'p5', date: '2025-11-19', read: 5, icon: 'van' },
    { id: 'p6', date: '2025-11-02', read: 3, icon: 'chip' }
  ];

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* Titre / descriptions d'une prestation : la saisie admin prime sur l'i18n */
  function title(p)  { return p.titleOverride ? esc(p.titleOverride) : esc(G.t('services.' + p.key + '.t')); }
  function short(p)  { return p.shortOverride ? esc(p.shortOverride) : esc(G.t('services.' + p.key + '.d')); }
  function long(p)   { return p.longOverride  ? esc(p.longOverride)  : esc(G.t('services.' + p.key + '.d')); }

  /* --------------------------------------------------- Cartes prestations */
  function cards(products, linkBase, opts) {
    opts = opts || {};
    return products.map(function (p, i) {
      var media = p.img
        ? '<div class="card__icon" style="width:100%;height:150px;border-radius:14px;background-image:url(' + esc(p.img) +
          ');background-size:cover;background-position:center"></div>'
        : '<div class="card__icon">' + G.icon(p.icon || 'wrench') + '</div>';

      return '<article class="card card--hover reveal" data-delay="' + (i % 3) * 70 + '">' +
        media +
        '<h3>' + title(p) + '</h3>' +
        '<p>' + short(p) + '</p>' +
        '<div class="price-tag">' + G.t('common.from') + ' ' + Number(p.price) + '.– <small>CHF</small></div>' +
        (opts.cta === false ? '' :
          '<a class="post__link" style="margin-top:16px" href="' + (linkBase || 'services.html') + '#' + esc(p.key) + '">' +
          G.t('common.learnMore') + G.icon('arrowR') + '</a>') +
        '</article>';
    }).join('');
  }

  /* ----------------------------------------------------- Fiches détaillées */
  function detail(p) {
    return '<article class="card reveal" id="' + esc(p.key) + '" style="scroll-margin-top:96px">' +
      '<div class="flex items-center gap-3 wrap" style="justify-content:space-between">' +
        '<div class="flex items-center gap-3">' +
          '<div class="card__icon" style="margin:0">' + G.icon(p.icon || 'wrench') + '</div>' +
          '<div><h3 style="margin:0">' + title(p) + '</h3>' +
          '<span class="chip chip--live">' + G.t('common.from') + ' ' + Number(p.price) + '.– CHF</span></div>' +
        '</div>' +
        '<a class="btn btn-primary btn-sm" href="contact.html?service=' + esc(p.id) + '">' +
          G.t('services.quoteCta') + '</a>' +
      '</div>' +
      '<p style="margin-top:18px">' + long(p) + '</p>' +
    '</article>';
  }

  /* ------------------------------------------------------------- Articles */
  function posts(ids) {
    var list = POSTS.filter(function (p) { return !ids || ids.indexOf(p.id) > -1; });
    return list.map(function (p, i) {
      var d = new Date(p.date);
      var locale = { fr: 'fr-CH', en: 'en-GB', de: 'de-CH', es: 'es-ES', it: 'it-CH' }[G.getLang()] || 'fr-CH';
      var dateTxt = d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
      return '<article class="card card--hover post reveal" data-delay="' + (i % 3) * 70 + '">' +
        '<div class="post__img">' + G.icon(p.icon) + '</div>' +
        '<div class="post__body">' +
          '<div class="post__meta"><span class="chip chip--new">' + esc(G.t('blog.' + p.id + '.c')) + '</span>' +
            '<span>' + dateTxt + '</span><span>·</span><span>' + p.read + ' ' + G.t('blog.readTime') + '</span></div>' +
          '<h3>' + esc(G.t('blog.' + p.id + '.t')) + '</h3>' +
          '<p class="muted" style="font-size:.9rem">' + esc(G.t('blog.' + p.id + '.e')) + '</p>' +
          '<span class="post__link">' + G.t('common.readMore') + G.icon('arrowR') + '</span>' +
        '</div></article>';
    }).join('');
  }

  /* ------------------------------------------------ Avis clients --------- */

  /* Les 3 avis Google mis en avant */
  function reviews(keys) {
    return (keys || ['r1', 'r2', 'r3']).map(function (k, i) {
      var author = G.t('reviews.' + k + '.a');
      var stars = '';
      for (var s = 0; s < 5; s++) stars += G.icon('star');
      return '<article class="card reveal review" data-delay="' + (i * 70) + '">' +
        '<div class="review__stars" aria-label="5/5">' + stars + '</div>' +
        '<blockquote>« ' + esc(G.t('reviews.' + k + '.q')) + ' »</blockquote>' +
        '<div class="review__who"><span class="review__av" aria-hidden="true">' + esc(author.charAt(0)) + '</span>' +
        '<span><b>' + esc(author) + '</b><span>' + esc(G.t('reviews.' + k + '.m')) + '</span></span></div>' +
      '</article>';
    }).join('');
  }

  /* Bloc « Nous noter sur Google » — accompagne chaque section d'avis */
  function reviewCta() {
    var stars = '';
    for (var s = 0; s < 5; s++) stars += G.icon('star');

    return '<div class="review-cta reveal">' +
      '<div class="review-cta__score">' +
        '<strong>5,0</strong>' +
        '<span class="review__stars" aria-hidden="true">' + stars + '</span>' +
        '<small>37 ' + (G.getLang() === 'fr' ? 'avis Google' : G.getLang() === 'de' ? 'Google-Bewertungen'
                        : G.getLang() === 'es' ? 'reseñas de Google' : G.getLang() === 'it' ? 'recensioni Google'
                        : 'Google reviews') + '</small>' +
      '</div>' +
      '<div class="review-cta__txt">' +
        '<h3>' + esc(G.t('reviews.ctaTitle')) + '</h3>' +
        '<p>' + esc(G.t('reviews.ctaLead')) + '</p>' +
      '</div>' +
      '<div class="review-cta__actions">' +
        '<a class="btn btn-primary" href="' + GOOGLE_REVIEWS_URL + '" target="_blank" rel="noopener">' +
          G.icon('star') + '<span>' + esc(G.t('reviews.rate')) + '</span>' + G.icon('external') +
        '</a>' +
        '<a class="btn btn-ghost btn-sm" href="' + GOOGLE_REVIEWS_URL + '" target="_blank" rel="noopener">' +
          '<span>' + esc(G.t('reviews.readAll')) + '</span>' +
        '</a>' +
        '<p class="review-cta__note">' + esc(G.t('reviews.rateNote')) + '</p>' +
      '</div>' +
    '</div>';
  }

  /* ------------------------------------------ Remplissage des <select> ---- */
  function fillServiceSelects() {
    var products = S.getProducts();
    document.querySelectorAll('[data-service-select]').forEach(function (sel) {
      var current = sel.value;
      sel.innerHTML = '<option value="" disabled selected>' + G.t('form.servicePick') + '</option>' +
        products.map(function (p) {
          return '<option value="' + esc(p.id) + '">' + title(p) + ' — ' + Number(p.price) + '.– CHF</option>';
        }).join('');
      // pré-sélection via ?service=…
      var qp = new URLSearchParams(location.search).get('service');
      var wanted = current || qp;
      if (wanted) sel.value = wanted;
    });
  }

  /* ------------------------------------------------- Icônes déclaratives -- */
  function paintInlineIcons(root) {
    root = root || document;
    root.querySelectorAll('[data-icon]').forEach(function (el) {
      if (el.dataset.iconDone) return;
      el.insertAdjacentHTML('afterbegin', G.icon(el.getAttribute('data-icon')));
      el.dataset.iconDone = '1';
    });
    root.querySelectorAll('[data-icon-btn]').forEach(function (el) {
      if (el.dataset.iconDone) return;
      el.insertAdjacentHTML('afterbegin', G.icon(el.getAttribute('data-icon-btn')));
      el.dataset.iconDone = '1';
    });
    root.querySelectorAll('[data-alert-icon]').forEach(function (el) {
      el.innerHTML = G.icon(el.getAttribute('data-alert-icon'));
    });
  }

  window.GDL_Catalog = {
    POSTS: POSTS,
    GOOGLE_REVIEWS_URL: GOOGLE_REVIEWS_URL,
    reviews: reviews,
    reviewCta: reviewCta,
    cards: cards,
    detail: detail,
    posts: posts,
    fillServiceSelects: fillServiceSelects,
    paintInlineIcons: paintInlineIcons,
    title: title, short: short, long: long, esc: esc
  };

  document.addEventListener('DOMContentLoaded', function () { paintInlineIcons(); });
})();
