(function () {
  "use strict";

  var style = document.createElement("style");
  style.textContent = ".studio-demo-strip{position:fixed;top:0;left:0;right:0;z-index:9999;background:#17130e;color:#fff;padding:8px 48px 8px 16px;text-align:center;font:600 12px/1.4 Inter,Arial,sans-serif;letter-spacing:.02em}.studio-demo-strip button{position:absolute;right:12px;top:5px;border:0;background:transparent;color:#fff;font-size:20px;cursor:pointer}.studio-demo-toast{position:fixed;left:50%;bottom:24px;z-index:10000;transform:translate(-50%,16px);max-width:min(92vw,520px);padding:14px 18px;border-radius:14px;background:#17130e;color:#fff;box-shadow:0 18px 50px rgba(0,0,0,.25);font:500 13px/1.45 Inter,Arial,sans-serif;opacity:0;pointer-events:none;transition:.25s}.studio-demo-toast.is-visible{opacity:1;transform:translate(-50%,0)}body{padding-top:32px}";
  document.head.appendChild(style);

  var strip = document.createElement("div");
  strip.className = "studio-demo-strip";
  strip.innerHTML = "Démonstration Studio ATS · Les appels, emails et formulaires sont simulés <button type=\"button\" aria-label=\"Fermer\">×</button>";
  document.body.prepend(strip);
  strip.querySelector("button").addEventListener("click", function () {
    strip.remove();
    document.body.style.paddingTop = "0";
  });

  var toast = document.createElement("div");
  toast.className = "studio-demo-toast";
  toast.setAttribute("role", "status");
  document.body.appendChild(toast);
  var timer;
  function notify(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(timer);
    timer = setTimeout(function () { toast.classList.remove("is-visible"); }, 3600);
  }

  document.addEventListener("click", function (event) {
    var link = event.target.closest("a[href]");
    if (!link) return;
    var href = link.getAttribute("href") || "";
    if (href.indexOf("tel:") === 0 || href.indexOf("mailto:") === 0) {
      event.preventDefault();
      event.stopImmediatePropagation();
      notify("Action simulée : aucun appel ni email réel n’a été envoyé.");
    }
  }, true);

  document.addEventListener("submit", function (event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    var form = event.target;
    var status = form.querySelector(".form-status");
    if (status) {
      status.className = "form-status visible success";
      status.textContent = "Merci ! Cette demande de démonstration a été simulée et ne sera pas enregistrée.";
    }
    notify("Demande simulée : aucune donnée n’a été transmise.");
  }, true);
})();
