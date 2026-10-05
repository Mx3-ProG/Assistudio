(function () {
  "use strict";

  var script = document.currentScript;
  var name = (script && script.getAttribute("data-demo-name")) || "ce site";
  var slug = script && script.getAttribute("data-demo-slug");
  var adminHref = script && script.getAttribute("data-demo-admin-href");
  var isAdmin = /\/admin(?:\/|$)/.test(window.location.pathname) || /^#\/admin(?:\/|$)/.test(window.location.hash);

  function toast(message) {
    var current = document.getElementById("studio-demo-toast");
    if (current) current.remove();
    var node = document.createElement("div");
    node.id = "studio-demo-toast";
    node.textContent = message;
    node.style.cssText = "position:fixed;left:50%;bottom:24px;z-index:2147483647;max-width:min(92vw,520px);transform:translateX(-50%);padding:13px 18px;border:1px solid rgba(255,255,255,.18);border-radius:999px;background:rgba(10,10,12,.94);color:#fff;font:600 13px/1.35 system-ui,sans-serif;text-align:center;box-shadow:0 18px 60px rgba(0,0,0,.32);backdrop-filter:blur(16px)";
    document.body.appendChild(node);
    window.setTimeout(function () { node.remove(); }, 3600);
  }

  function addBadge() {
    var badge = document.createElement("button");
    badge.type = "button";
    badge.setAttribute("aria-label", "Informations sur la démonstration");
    badge.textContent = "PRO · Démo Studio ATS";
    badge.style.cssText = "position:fixed;left:14px;bottom:14px;z-index:2147483646;padding:9px 12px;border:1px solid rgba(255,255,255,.18);border-radius:999px;background:rgba(10,10,12,.8);color:#fff;font:700 10px/1 system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;box-shadow:0 10px 34px rgba(0,0,0,.22);backdrop-filter:blur(14px);cursor:pointer";
    badge.addEventListener("click", function () {
      toast(name + " fonctionne avec des données fictives : aucun envoi, appel ou paiement réel.");
    });
    document.body.appendChild(badge);

    if (slug && adminHref && !isAdmin) {
      var admin = document.createElement("a");
      admin.href = adminHref;
      admin.target = "_top";
      admin.textContent = "Ouvrir le dashboard démo";
      admin.style.cssText = "position:fixed;left:14px;bottom:58px;z-index:2147483646;padding:11px 14px;border:1px solid rgba(255,255,255,.2);border-radius:999px;background:#fff;color:#111;font:750 11px/1 system-ui,sans-serif;text-decoration:none;box-shadow:0 12px 38px rgba(0,0,0,.25);cursor:pointer";
      document.body.appendChild(admin);
    }
  }

  document.addEventListener("submit", function (event) {
    if (isAdmin) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    toast("Action simulée — aucune donnée n'a été envoyée.");
  }, true);

  document.addEventListener("click", function (event) {
    if (isAdmin) return;
    var target = event.target instanceof Element ? event.target.closest("a") : null;
    if (!target) return;
    var href = target.getAttribute("href") || "";
    var external = /^https?:\/\//i.test(href) && !href.startsWith(window.location.origin);
    var protectedAction = /^(tel:|mailto:)/i.test(href) || /\/auth(?:\/|$)/i.test(href);
    if (!external && !protectedAction) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    toast("Lien neutralisé dans la démonstration — aucune action réelle.");
  }, true);

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", addBadge, { once: true });
  else addBadge();
})();
