/* =========================================================================
   booking.js — widget public de prise de rendez-vous
   Appelle les Edge Functions get-availability puis book-appointment.
   Ne lit jamais directement la base : seuls des créneaux libres transitent.
   ========================================================================= */
(function () {
  'use strict';

  var BASE = (window.SUPABASE_URL || '') + '/functions/v1/';
  var ANON = window.SUPABASE_ANON_KEY || '';

  var els = {
    service: document.getElementById('bk-service'),
    dates: document.getElementById('bk-dates'),
    slots: document.getElementById('bk-slots'),
    slotsHint: document.getElementById('bk-slots-hint'),
    formCard: document.getElementById('booking-form-card'),
    form: document.getElementById('booking-form'),
    recap: document.getElementById('bk-recap'),
    status: document.getElementById('bk-status'),
    submit: document.getElementById('bk-submit'),
    success: document.getElementById('booking-success')
  };

  var state = { days: [], selectedDate: null, selectedSlot: null, timezone: 'Europe/Paris' };

  var DOW = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  var MON = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

  function esc(v) {
    return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function callFn(name, body) {
    return fetch(BASE + name, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + ANON, 'apikey': ANON },
      body: JSON.stringify(body || {})
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (data) {
        if (!r.ok || (data && data.ok === false)) throw new Error((data && data.error) || ('Erreur ' + r.status));
        return data;
      });
    });
  }

  // Si Supabase n'est pas configuré → bascule vers le formulaire de contact
  if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
    els.dates.innerHTML = fallbackMsg();
    els.service.parentNode.style.display = 'none';
    return;
  }

  // ---- Chargement des disponibilités ----
  callFn('get-availability', {})
    .then(function (data) {
      state.timezone = data.timezone || 'Europe/Paris';
      state.days = (data.days || []).filter(function (d) { return d.slots && d.slots.length; });

      var services = data.services && data.services.length ? data.services : ['Conciergerie privée', 'Autre demande'];
      els.service.innerHTML = services.map(function (s) { return '<option>' + esc(s) + '</option>'; }).join('');

      renderDates();
    })
    .catch(function (err) {
      els.dates.innerHTML = '<div class="booking-empty">Impossible de charger les disponibilités.<br>' + fallbackMsg() + '</div>';
      console.error(err);
    });

  function renderDates() {
    if (!state.days.length) {
      els.dates.innerHTML = '<div class="booking-empty">Aucun créneau disponible pour le moment.<br>' + fallbackMsg() + '</div>';
      return;
    }
    els.dates.innerHTML = '<div class="date-scroll">' + state.days.map(function (d) {
      var dt = new Date(d.date + 'T12:00:00Z');
      return '<div class="date-chip" data-date="' + d.date + '">' +
        '<div class="dc-dow">' + DOW[dt.getUTCDay()] + '</div>' +
        '<div class="dc-day">' + dt.getUTCDate() + '</div>' +
        '<div class="dc-mon">' + MON[dt.getUTCMonth()] + '</div></div>';
    }).join('') + '</div>';

    els.dates.querySelectorAll('.date-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        els.dates.querySelectorAll('.date-chip').forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        selectDate(chip.getAttribute('data-date'));
      });
    });
  }

  function selectDate(date) {
    state.selectedDate = date;
    state.selectedSlot = null;
    var day = state.days.find(function (d) { return d.date === date; });
    els.slotsHint.textContent = 'Créneaux du ' + longDate(date);
    els.slots.innerHTML = '<div class="slot-grid">' + day.slots.map(function (s) {
      return '<button type="button" class="slot-btn" data-start="' + s.start_at + '" data-end="' + s.end_at + '">' + esc(s.label) + '</button>';
    }).join('') + '</div>';

    els.slots.querySelectorAll('.slot-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        els.slots.querySelectorAll('.slot-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        state.selectedSlot = { start_at: btn.getAttribute('data-start'), end_at: btn.getAttribute('data-end') };
        showForm();
      });
    });
  }

  function showForm() {
    els.formCard.style.display = 'block';
    els.recap.innerHTML = 'Rendez-vous : <strong>' + esc(els.service.value) + '</strong><br>' +
      '<strong>' + esc(fullDateTime(state.selectedSlot.start_at)) + '</strong>';
    els.formCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // ---- Soumission ----
  els.form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!state.selectedSlot) { setStatus('err', 'Merci de choisir un créneau.'); return; }

    var payload = {
      prenom: val('bk-prenom'), nom: val('bk-nom'), email: val('bk-email'),
      telephone: val('bk-tel'), message: val('bk-message'), service: els.service.value,
      start_at: state.selectedSlot.start_at, end_at: state.selectedSlot.end_at,
      website: val('bk-website')
    };

    els.submit.disabled = true;
    els.submit.textContent = 'Envoi en cours…';
    setStatus('', '');

    callFn('book-appointment', payload)
      .then(function () {
        els.formCard.style.display = 'none';
        els.success.style.display = 'block';
        els.success.scrollIntoView({ behavior: 'smooth', block: 'center' });
      })
      .catch(function (err) {
        setStatus('error', err.message || 'Une erreur est survenue. Réessayez ou contactez-nous.');
        els.submit.disabled = false;
        els.submit.textContent = 'Confirmer la demande de rendez-vous';
        // Si le créneau vient d'être pris, on recharge les dispos
        if (/réservé/i.test(err.message || '')) location.reload();
      });
  });

  // ---- utils ----
  function val(id) { var e = document.getElementById(id); return e ? e.value.trim() : ''; }
  function setStatus(kind, text) {
    els.status.className = 'form-status' + (text ? ' visible ' + kind : '');
    els.status.textContent = text;
  }
  function longDate(date) {
    return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: state.timezone }).format(new Date(date + 'T12:00:00Z'));
  }
  function fullDateTime(iso) {
    return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: state.timezone }).format(new Date(iso));
  }
  function fallbackMsg() {
    return 'Vous pouvez <a href="contact.html" style="color:var(--accent);">nous écrire</a> ou appeler le <a href="tel:+33626468983" style="color:var(--accent);">06 26 46 89 83</a>.';
  }
})();
