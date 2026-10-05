/* ==========================================================================
   Garage Du Lac — Couche de données (démonstration : localStorage)
   Remplacer les fonctions read/write par des appels API pour passer en prod.
   ========================================================================== */
(function () {
  'use strict';

  var NS = 'gdl:';
  var K = {
    orders:   NS + 'orders',
    products: NS + 'products',
    logs:     NS + 'logs',
    session:  NS + 'session',
    lang:     NS + 'lang',
    theme:    NS + 'theme',
    consent:  NS + 'consent'
  };

  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  }
  function uid(prefix) {
    return (prefix || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  /* --- Catalogue de prestations par défaut -------------------------------- */
  var DEFAULT_PRODUCTS = [
    { id: 'srv-service',   key: 's1', price: 180, img: '', icon: 'oil',      order: 1 },
    { id: 'srv-brakes',    key: 's2', price: 240, img: '', icon: 'brake',    order: 2 },
    { id: 'srv-tyres',     key: 's3', price: 90,  img: '', icon: 'tyre',     order: 3 },
    { id: 'srv-diag',      key: 's4', price: 120, img: '', icon: 'chip',     order: 4 },
    { id: 'srv-inspect',   key: 's5', price: 150, img: '', icon: 'clipboard',order: 5 },
    { id: 'srv-ac',        key: 's6', price: 130, img: '', icon: 'snow',     order: 6 },
    { id: 'srv-exhaust',   key: 's7', price: 200, img: '', icon: 'exhaust',  order: 7 },
    { id: 'srv-camper',    key: 's8', price: 260, img: '', icon: 'van',      order: 8 },
    { id: 'srv-battery',   key: 's9', price: 160, img: '', icon: 'battery',  order: 9 }
  ];

  /* --- Demandes de démonstration ------------------------------------------ */
  function seedOrders() {
    var now = Date.now(), D = 86400000;
    return [
      { id: uid('ord'), name: 'Sophie Berthod', email: 'sophie.berthod@example.ch', phone: '+41 79 214 55 08',
        vehicle: 'VW Golf VII 2.0 TDI · 2017', plate: 'VS 148 902', service: 'srv-brakes',
        date: new Date(now + 2 * D).toISOString().slice(0, 10), amount: 240, status: 'pending',
        message: 'Bruit métallique au freinage à froid.', createdAt: now - 1 * D },
      { id: uid('ord'), name: 'Laurent Curdy', email: 'l.curdy@example.fr', phone: '+33 6 71 09 44 12',
        vehicle: 'Fiat Ducato camping-car · 2015', plate: 'AB-482-KL', service: 'srv-camper',
        date: new Date(now + 5 * D).toISOString().slice(0, 10), amount: 260, status: 'pending',
        message: 'Révision avant départ en Italie fin du mois.', createdAt: now - 2 * D },
      { id: uid('ord'), name: 'Anita Rossier', email: 'anita.rossier@example.ch', phone: '+41 78 660 31 77',
        vehicle: 'Toyota Yaris Hybrid · 2020', plate: 'VS 77 415', service: 'srv-service',
        date: new Date(now + 1 * D).toISOString().slice(0, 10), amount: 180, status: 'accepted',
        message: 'Service annuel + contrôle avant hiver.', createdAt: now - 4 * D },
      { id: uid('ord'), name: 'Marc Delaloye', email: 'marc.delaloye@example.ch', phone: '+41 76 402 18 63',
        vehicle: 'Audi A4 Avant 2.0 TFSI · 2019', plate: 'VD 301 588', service: 'srv-diag',
        date: new Date(now - 3 * D).toISOString().slice(0, 10), amount: 120, status: 'done',
        message: 'Voyant moteur orange fixe depuis 3 jours.', createdAt: now - 9 * D },
      { id: uid('ord'), name: 'Céline Vuadens', email: 'c.vuadens@example.ch', phone: '+41 79 883 90 27',
        vehicle: 'Renault Clio IV · 2014', plate: 'VS 202 774', service: 'srv-tyres',
        date: new Date(now + 8 * D).toISOString().slice(0, 10), amount: 90, status: 'pending',
        message: 'Permutation + équilibrage, pneus fournis.', createdAt: now - 6 * 3600000 },
      { id: uid('ord'), name: 'Pedro Almeida', email: 'p.almeida@example.ch', phone: '+41 77 512 66 04',
        vehicle: 'Ford Transit L2H2 · 2018', plate: 'VS 90 233', service: 'srv-exhaust',
        date: new Date(now - 8 * D).toISOString().slice(0, 10), amount: 200, status: 'refused',
        message: 'Ligne d\'échappement percée — véhicule finalement vendu.', createdAt: now - 12 * D }
    ];
  }

  function seedLogs() {
    var now = Date.now();
    return [
      { id: uid('log'), at: now - 900000,    who: 'admin',      what: 'login.success',    detail: 'Connexion administrateur', ip: 'CH · 84.226.xxx.xxx' },
      { id: uid('log'), at: now - 3600000,   who: 'visiteur',   what: 'form.submit',      detail: 'Demande de rendez-vous — Pneus & géométrie', ip: 'CH · 178.196.xxx.xxx' },
      { id: uid('log'), at: now - 7200000,   who: 'visiteur',   what: 'page.view',        detail: '/services.html (lang: de)', ip: 'DE · 91.61.xxx.xxx' },
      { id: uid('log'), at: now - 10800000,  who: 'admin',      what: 'order.accept',     detail: 'Demande acceptée — Anita Rossier', ip: 'CH · 84.226.xxx.xxx' },
      { id: uid('log'), at: now - 86400000,  who: 'superadmin', what: 'product.update',   detail: 'Prix modifié — Freins & sécurité (220 → 240 CHF)', ip: 'CH · 84.226.xxx.xxx' },
      { id: uid('log'), at: now - 90000000,  who: 'inconnu',    what: 'login.failed',     detail: 'Échec d\'authentification (3 tentatives)', ip: 'NL · 45.83.xxx.xxx' },
      { id: uid('log'), at: now - 172800000, who: 'visiteur',   what: 'page.view',        detail: '/index.html (lang: en)', ip: 'FR · 92.184.xxx.xxx' }
    ];
  }

  /* --- API publique -------------------------------------------------------- */
  var Store = {
    keys: K,
    uid: uid,

    init: function () {
      if (!localStorage.getItem(K.products)) write(K.products, DEFAULT_PRODUCTS);
      if (!localStorage.getItem(K.orders))   write(K.orders, seedOrders());
      if (!localStorage.getItem(K.logs))     write(K.logs, seedLogs());
    },

    /* Prestations */
    getProducts: function () {
      var list = read(K.products, DEFAULT_PRODUCTS);
      return list.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    },
    getProduct: function (id) {
      return this.getProducts().filter(function (p) { return p.id === id; })[0] || null;
    },
    saveProduct: function (product) {
      var list = read(K.products, DEFAULT_PRODUCTS);
      var i = list.findIndex(function (p) { return p.id === product.id; });
      if (i > -1) list[i] = Object.assign({}, list[i], product);
      else list.push(Object.assign({ id: uid('srv'), order: list.length + 1 }, product));
      write(K.products, list);
      return true;
    },

    /* Demandes / commandes */
    getOrders: function () {
      return read(K.orders, []).slice().sort(function (a, b) { return b.createdAt - a.createdAt; });
    },
    addOrder: function (order) {
      var list = read(K.orders, []);
      var entry = Object.assign({ id: uid('ord'), status: 'pending', createdAt: Date.now() }, order);
      list.push(entry);
      write(K.orders, list);
      this.log('visiteur', 'form.submit', 'Nouvelle demande — ' + (entry.name || 'anonyme'));
      return entry;
    },
    setOrderStatus: function (id, status) {
      var list = read(K.orders, []);
      var i = list.findIndex(function (o) { return o.id === id; });
      if (i < 0) return false;
      list[i].status = status;
      write(K.orders, list);
      return true;
    },

    /* Clients dérivés des demandes */
    getClients: function () {
      var map = {};
      this.getOrders().forEach(function (o) {
        var key = (o.email || o.phone || o.name || '').toLowerCase();
        if (!key) return;
        if (!map[key]) {
          map[key] = { name: o.name, email: o.email, phone: o.phone, vehicle: o.vehicle,
                       count: 0, total: 0, last: 0 };
        }
        map[key].count += 1;
        if (o.status === 'accepted' || o.status === 'done') map[key].total += (Number(o.amount) || 0);
        if (o.createdAt > map[key].last) map[key].last = o.createdAt;
      });
      return Object.keys(map).map(function (k) { return map[k]; })
        .sort(function (a, b) { return b.last - a.last; });
    },

    /* Journal */
    getLogs: function () {
      return read(K.logs, []).slice().sort(function (a, b) { return b.at - a.at; });
    },
    log: function (who, what, detail) {
      var list = read(K.logs, []);
      list.push({ id: uid('log'), at: Date.now(), who: who, what: what, detail: detail || '', ip: 'local · navigateur' });
      if (list.length > 300) list = list.slice(-300);
      write(K.logs, list);
    },

    /* Session admin */
    getSession: function () { return read(K.session, null); },
    setSession: function (s) { write(K.session, s); },
    clearSession: function () { localStorage.removeItem(K.session); },

    /* Préférences */
    get: function (key, fb) { return read(key, fb); },
    set: function (key, val) { return write(key, val); },
    raw: { read: read, write: write }
  };

  Store.init();
  window.GDL_Store = Store;
})();
