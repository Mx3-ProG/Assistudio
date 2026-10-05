/* ==========================================================================
   Garage Du Lac — Logique du tableau de bord administrateur
   ========================================================================== */
(function () {
  'use strict';

  var G = window.GDL, S = window.GDL_Store, C = window.GDL_Catalog;

  /* ------------------------------------------------- Garde de session ---- */
  var session = S.getSession();
  if (!session) { location.replace('login.html'); return; }
  var isSuper = session.role === 'superadmin';

  var $ = function (id) { return document.getElementById(id); };

  var PANELS = [
    { id: 'overview', key: 'navOverview', icon: 'chart' },
    { id: 'orders',   key: 'navOrders',   icon: 'clipboard' },
    { id: 'clients',  key: 'navClients',  icon: 'users' },
    { id: 'products', key: 'navProducts', icon: 'wrench' },
    { id: 'logs',     key: 'navLogs',     icon: 'activity' },
    { id: 'settings', key: 'navSettings', icon: 'settings' }
  ];

  var current = (location.hash || '#overview').slice(1);
  if (!PANELS.some(function (p) { return p.id === current; })) current = 'overview';

  /* ---------------------------------------------------------- Utilitaires */
  function fmtDate(ts) {
    var locale = { fr: 'fr-CH', en: 'en-GB', de: 'de-CH', es: 'es-ES', it: 'it-CH' }[G.getLang()] || 'fr-CH';
    return new Date(ts).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
  }
  function fmtDateTime(ts) {
    var locale = { fr: 'fr-CH', en: 'en-GB', de: 'de-CH', es: 'es-ES', it: 'it-CH' }[G.getLang()] || 'fr-CH';
    return new Date(ts).toLocaleString(locale, { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  }
  function money(n) { return Number(n || 0).toLocaleString('fr-CH') + '.– CHF'; }
  function statusChip(st) {
    var label = { pending: 'stPending', accepted: 'stAccepted', refused: 'stRefused', done: 'stDone' }[st] || 'stPending';
    return '<span class="st st-' + st + '">' + G.t('dash.' + label) + '</span>';
  }
  function serviceName(id) {
    var p = S.getProduct(id);
    return p ? C.title(p) : '—';
  }

  /* ------------------------------------------------------ Barre latérale */
  function renderSidebar() {
    $('uAvatar').textContent = (session.name || session.user).charAt(0).toUpperCase();
    $('uName').textContent = session.name || session.user;
    $('uRole').textContent = G.t(isSuper ? 'dash.roleSuper' : 'dash.roleAdmin');
    $('helloName').textContent = session.name || session.user;

    $('dashNav').innerHTML = PANELS.map(function (p) {
      return '<button type="button" data-panel="' + p.id + '"' + (p.id === current ? ' class="active"' : '') + '>' +
        G.icon(p.icon) + '<span>' + G.t('dash.' + p.key) + '</span></button>';
    }).join('');

    $('dashNav').querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () { show(b.getAttribute('data-panel'), true); });
    });
  }

  function show(id, scroll) {
    current = id;
    history.replaceState(null, '', '#' + id);
    document.querySelectorAll('.panel').forEach(function (p) {
      p.classList.toggle('active', p.id === 'p-' + id);
    });
    $('dashNav').querySelectorAll('button').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-panel') === id);
    });
    if (scroll) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ------------------------------------------------------------- KPI ---- */
  function renderKpis() {
    var orders = S.getOrders();
    var pending  = orders.filter(function (o) { return o.status === 'pending'; });
    var accepted = orders.filter(function (o) { return o.status === 'accepted' || o.status === 'done'; });
    var revenue  = accepted.reduce(function (s, o) { return s + (Number(o.amount) || 0); }, 0);

    var rows = [
      { key: 'kpiRequests', icon: 'clipboard', value: orders.length,  sub: G.t('dash.thisMonth') },
      { key: 'kpiPending',  icon: 'bell',      value: pending.length, sub: G.t('dash.stPending') },
      { key: 'kpiAccepted', icon: 'checkCir',  value: accepted.length, sub: G.t('dash.stAccepted') },
      { key: 'kpiRevenue',  icon: 'card',      value: money(revenue), sub: G.t('dash.thisMonth') }
    ];

    $('kpiRow').innerHTML = rows.map(function (r) {
      return '<div class="kpi"><div class="kpi__top"><span>' + G.t('dash.' + r.key) + '</span>' +
        '<span class="kpi__ico">' + G.icon(r.icon) + '</span></div>' +
        '<strong>' + r.value + '</strong><small>' + r.sub + '</small></div>';
    }).join('');
  }

  /* ------------------------------------------------- Tableau des demandes */
  function ordersTable(el, limit) {
    var orders = S.getOrders();
    if (limit) orders = orders.slice(0, limit);

    if (!orders.length) {
      el.innerHTML = '<tbody><tr><td class="empty">' + G.t('dash.noData') + '</td></tr></tbody>';
      return;
    }

    var head = '<thead><tr>' +
      '<th>' + G.t('dash.colClient') + '</th>' +
      '<th>' + G.t('dash.colService') + '</th>' +
      (limit ? '' : '<th>' + G.t('dash.colVehicle') + '</th><th>' + G.t('dash.colDate') + '</th>') +
      '<th>' + G.t('dash.colAmount') + '</th>' +
      '<th>' + G.t('dash.colStatus') + '</th>' +
      '<th>' + G.t('dash.colActions') + '</th>' +
      '</tr></thead>';

    var body = '<tbody>' + orders.map(function (o) {
      var actions = '';
      if (o.status === 'pending') {
        actions += '<button class="btn btn-dark btn-sm" data-act="accept" data-id="' + o.id + '">' + G.t('dash.accept') + '</button>';
        actions += '<button class="btn btn-ghost btn-sm" data-act="refuse" data-id="' + o.id + '">' + G.t('dash.refuse') + '</button>';
      }
      actions += '<button class="btn btn-ghost btn-sm" data-act="relance" data-id="' + o.id + '" title="' +
                 C.esc(G.t('dash.relanceSoon')) + '">' + G.icon('bell') + '</button>';

      return '<tr>' +
        '<td><b>' + C.esc(o.name) + '</b><br><span class="muted" style="font-size:.8rem">' +
          C.esc(o.email || '') + (o.phone ? ' · ' + C.esc(o.phone) : '') + '</span></td>' +
        '<td>' + C.esc(serviceName(o.service)) + '</td>' +
        (limit ? '' :
          '<td><span style="font-size:.85rem">' + C.esc(o.vehicle || '—') + '</span>' +
          (o.plate ? '<br><span class="log-tag">' + C.esc(o.plate) + '</span>' : '') + '</td>' +
          '<td>' + (o.date ? C.esc(o.date) : '—') + '</td>') +
        '<td><b>' + money(o.amount) + '</b></td>' +
        '<td>' + statusChip(o.status) + '</td>' +
        '<td><div class="row-actions">' + actions + '</div></td>' +
      '</tr>';
    }).join('') + '</tbody>';

    el.innerHTML = head + body;

    el.querySelectorAll('[data-act]').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-id'), act = b.getAttribute('data-act');

        if (act === 'relance') {
          alert(G.t('dash.relanceSoon'));                       // fonction avancée verrouillée
          return;
        }
        if (act === 'refuse' && !confirm(G.t('dash.confirmRefuse'))) return;

        S.setOrderStatus(id, act === 'accept' ? 'accepted' : 'refused');
        S.log(session.user, 'order.' + act, 'Demande ' + (act === 'accept' ? 'acceptée' : 'refusée') + ' — ' + id);
        renderAll();
      });
    });
  }

  /* -------------------------------------------------- Journal (extraits) */
  function renderRecentLogs() {
    var logs = S.getLogs().slice(0, 7);
    $('recentLogs').innerHTML = logs.map(function (l) {
      return '<li style="display:flex;gap:10px;align-items:flex-start;padding:10px 8px;border-bottom:1px solid var(--color-border)">' +
        '<span class="log-tag" data-kind="' + C.esc(l.what) + '">' + C.esc(l.what) + '</span>' +
        '<span style="flex:1;font-size:.84rem">' + C.esc(l.detail) +
        '<br><span class="muted" style="font-size:.74rem">' + fmtDateTime(l.at) + ' · ' + C.esc(l.who) + '</span></span>' +
      '</li>';
    }).join('') || '<li class="empty">' + G.t('dash.noData') + '</li>';
  }

  /* --------------------------------------------------------- Clients ---- */
  function renderClients() {
    var clients = S.getClients();
    var el = $('clientsTable');
    if (!clients.length) { el.innerHTML = '<tbody><tr><td class="empty">' + G.t('dash.noData') + '</td></tr></tbody>'; return; }

    el.innerHTML =
      '<thead><tr>' +
        '<th>' + G.t('dash.colClient') + '</th>' +
        '<th>' + G.t('dash.colContact') + '</th>' +
        '<th>' + G.t('dash.colVehicle') + '</th>' +
        '<th>' + G.t('dash.colOrders') + '</th>' +
        '<th>' + G.t('dash.colTotal') + '</th>' +
        '<th>' + G.t('dash.colLast') + '</th>' +
        '<th>' + G.t('dash.colActions') + '</th>' +
      '</tr></thead><tbody>' +
      clients.map(function (c) {
        return '<tr>' +
          '<td><b>' + C.esc(c.name) + '</b></td>' +
          '<td><span style="font-size:.83rem">' + C.esc(c.email || '—') + '<br>' + C.esc(c.phone || '—') + '</span></td>' +
          '<td><span style="font-size:.83rem">' + C.esc(c.vehicle || '—') + '</span></td>' +
          '<td>' + c.count + '</td>' +
          '<td><b>' + money(c.total) + '</b></td>' +
          '<td>' + fmtDate(c.last) + '</td>' +
          '<td><div class="row-actions">' +
            '<a class="btn btn-ghost btn-sm" href="mailto:' + C.esc(c.email || '') + '">' + G.icon('mail') + '</a>' +
            '<a class="btn btn-ghost btn-sm" href="tel:' + C.esc((c.phone || '').replace(/\s/g, '')) + '">' + G.icon('phone') + '</a>' +
            '<button class="btn btn-dark btn-sm" data-relance>' + G.t('dash.relance') + '</button>' +
          '</div></td>' +
        '</tr>';
      }).join('') + '</tbody>';

    el.querySelectorAll('[data-relance]').forEach(function (b) {
      b.addEventListener('click', function () { alert(G.t('dash.relanceSoon')); });
    });
  }

  /* ------------------------------------------------------ Prestations --- */
  function renderProducts() {
    var products = S.getProducts();

    $('productList').innerHTML = products.map(function (p) {
      return '<div class="prod-edit" data-id="' + p.id + '">' +
        '<button class="prod-edit__head" type="button">' +
          '<span class="card__icon">' + G.icon(p.icon || 'wrench') + '</span>' +
          '<b>' + C.title(p) + '</b>' +
          '<span class="chip chip--live">' + money(p.price) + '</span>' +
          G.icon('chevD', 'chev') +
        '</button>' +
        '<div class="prod-edit__body">' +
          '<div class="form-row">' +
            '<div class="field"><label>' + G.t('dash.pName') + '</label>' +
              '<input class="input" data-f="titleOverride" value="' + C.esc(p.titleOverride || C.title(p)) + '"></div>' +
            '<div class="field"><label>' + G.t('dash.pPrice') + '</label>' +
              '<input class="input" type="number" min="0" step="5" data-f="price" value="' + Number(p.price) + '"></div>' +
          '</div>' +
          '<div class="field"><label>' + G.t('dash.pImg') + '</label>' +
            '<input class="input" data-f="img" placeholder="https://…" value="' + C.esc(p.img || '') + '">' +
            '<p class="hint">' + G.t('upsell.lockedNote') + '</p></div>' +
          '<div class="field"><label>' + G.t('dash.pShort') + '</label>' +
            '<input class="input" maxlength="160" data-f="shortOverride" value="' + C.esc(p.shortOverride || C.short(p)) + '">' +
            '<p class="hint">' + G.t('dash.pShortHint') + '</p></div>' +
          '<div class="field"><label>' + G.t('dash.pLong') + '</label>' +
            '<textarea class="textarea" data-f="longOverride">' + C.esc(p.longOverride || C.long(p)) + '</textarea>' +
            '<p class="hint">' + G.t('dash.pLongHint') + '</p></div>' +
          '<button class="btn btn-primary" data-save>' + G.t('common.save') + '</button>' +
        '</div>' +
      '</div>';
    }).join('');

    $('productList').querySelectorAll('.prod-edit').forEach(function (box) {
      box.querySelector('.prod-edit__head').addEventListener('click', function () {
        box.classList.toggle('open');
      });
      box.querySelector('[data-save]').addEventListener('click', function () {
        var patch = { id: box.getAttribute('data-id') };
        box.querySelectorAll('[data-f]').forEach(function (input) {
          var f = input.getAttribute('data-f');
          patch[f] = f === 'price' ? Number(input.value) || 0 : input.value.trim();
        });
        S.saveProduct(patch);
        S.log(session.user, 'product.update', 'Prestation modifiée — ' + (patch.titleOverride || patch.id));
        var ok = $('saveOk');
        ok.classList.remove('hidden');
        ok.scrollIntoView({ block: 'center', behavior: 'smooth' });
        setTimeout(function () { ok.classList.add('hidden'); }, 3200);
        renderProducts();
      });
    });
  }

  /* ----------------------------------------------- Journal / superadmin - */
  function renderLogs() {
    var gate = $('logsGate');

    if (!isSuper) {
      gate.innerHTML =
        '<div class="locked">' +
          '<div class="locked__head"><strong>' + G.icon('lock') + G.t('dash.logsT') + '</strong>' +
          '<span class="chip chip--soon">' + G.t('dash.logsSuperOnly') + '</span></div>' +
          '<p>' + G.t('dash.logsSuperOnly') + '</p>' +
        '</div>';
      return;
    }

    var logs = S.getLogs();

    gate.innerHTML =
      '<div class="table-wrap"><table>' +
        '<thead><tr>' +
          '<th>' + G.t('dash.colWhen') + '</th>' +
          '<th>' + G.t('dash.colWho') + '</th>' +
          '<th>' + G.t('dash.colWhat') + '</th>' +
          '<th>' + G.t('dash.colIp') + '</th>' +
        '</tr></thead><tbody>' +
        logs.map(function (l) {
          return '<tr>' +
            '<td><span style="font-size:.83rem">' + fmtDateTime(l.at) + '</span></td>' +
            '<td><b>' + C.esc(l.who) + '</b></td>' +
            '<td><span class="log-tag" data-kind="' + C.esc(l.what) + '">' + C.esc(l.what) + '</span>' +
              '<br><span style="font-size:.83rem">' + C.esc(l.detail) + '</span></td>' +
            '<td><span class="muted" style="font-size:.8rem">' + C.esc(l.ip) + '</span></td>' +
          '</tr>';
        }).join('') +
      '</tbody></table></div>' +

      /* Visiteurs identifiés — la partie nominative est une fonction à venir */
      '<h3 class="mt-6" style="margin-bottom:6px">' + G.t('dash.visitorsT') + '</h3>' +
      '<p class="muted" style="font-size:.9rem">' + G.t('dash.visitorsD') + '</p>' +
      '<div class="table-wrap mt-4"><table>' +
        '<thead><tr>' +
          '<th>' + G.t('dash.colClient') + '</th>' +
          '<th>' + G.t('dash.colContact') + '</th>' +
          '<th>' + G.t('dash.colWhen') + '</th>' +
          '<th>' + G.t('dash.colIp') + '</th>' +
        '</tr></thead><tbody>' +
        S.getClients().map(function (c) {
          return '<tr><td><b>' + C.esc(c.name) + '</b></td>' +
            '<td><span style="font-size:.83rem">' + C.esc(c.email || '—') + '<br>' + C.esc(c.phone || '—') + '</span></td>' +
            '<td>' + fmtDate(c.last) + '</td>' +
            '<td><span class="muted blurred" style="font-size:.8rem">CH · 84.226.117.043</span></td></tr>';
        }).join('') +
      '</tbody></table></div>' +

      '<div class="locked mt-5">' +
        '<div class="locked__head"><strong>' + G.icon('users') + G.t('dash.visitorsT') + '</strong>' +
        '<span class="chip chip--soon">' + G.t('upsell.lockedBadge') + '</span></div>' +
        '<p>' + G.t('dash.trackingSoon') + '</p>' +
        '<a class="btn btn-primary btn-sm mt-4" href="../contact.html?sujet=modules">' + G.t('common.unlockNow') + '</a>' +
      '</div>';
  }

  /* ------------------------------------------------------------ Rendu --- */
  function renderAll() {
    renderSidebar();
    renderKpis();
    ordersTable($('recentTable'), 5);
    ordersTable($('ordersTable'));
    renderRecentLogs();
    renderClients();
    renderProducts();
    renderLogs();
    C.paintInlineIcons();
    show(current);
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderAll();
    $('logoutBtn').addEventListener('click', function () {
      S.log(session.user, 'logout', 'Déconnexion');
      S.clearSession();
      location.href = 'login.html';
    });
  });

  document.addEventListener('gdl:lang', function () {
    if ($('dashNav')) renderAll();
  });
})();
