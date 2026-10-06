(function () {
  "use strict";

  /* topo: fica sólido depois da abertura */
  var topo = document.querySelector("[data-topo]");
  if (topo && !topo.classList.contains("topo--fixo")) {
    var abertura = document.querySelector(".abertura");
    var limite = function () { return abertura ? abertura.offsetHeight - 80 : 40; };
    var aoRolar = function () { topo.classList.toggle("solido", window.scrollY > limite()); };
    window.addEventListener("scroll", aoRolar, { passive: true });
    aoRolar();
  }

  /* menu no celular */
  var btn = document.querySelector("[data-menu-btn]");
  if (btn && topo) {
    var fechar = function () { topo.classList.remove("aberto"); btn.setAttribute("aria-expanded", "false"); btn.textContent = "Menu"; };
    btn.addEventListener("click", function () {
      var abre = !topo.classList.contains("aberto");
      topo.classList.toggle("aberto", abre);
      btn.setAttribute("aria-expanded", String(abre));
      btn.textContent = abre ? "Fechar" : "Menu";
    });
    topo.querySelectorAll(".menu a").forEach(function (a) { a.addEventListener("click", fechar); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") fechar(); });
  }

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* agenda */
  var alvo = document.querySelector("[data-agenda]");
  if (alvo && window.AGENDA) {
    var anos = {};
    window.AGENDA.forEach(function (a) { (anos[a.ano] = anos[a.ano] || []).push(a); });
    var html = "";
    Object.keys(anos).sort().forEach(function (ano) {
      var lista = anos[ano];
      var abertas = lista.filter(function (a) { return a.aberta; });
      var fechadas = lista.filter(function (a) { return !a.aberta; });
      html += '<div class="agenda-ano" data-revela><div class="agenda-ano__titulo"><b>' + ano + '</b><span class="rotulo">' +
        (abertas.length ? abertas.length + (abertas.length > 1 ? " meses abertos" : " mês aberto") : "fechada") + "</span></div>";
      html += '<ul class="agenda-lista">';
      abertas.forEach(function (a) {
        var q = "agendar.html?quando=" + encodeURIComponent(a.mes + " " + a.ano + " · " + a.local);
        html += '<li><a class="agenda-linha" href="' + q + '"><span class="mes">' + esc(a.mes) + '</span><span class="local">' + esc(a.local) + '</span><span class="estado">Pedir data →</span></a></li>';
      });
      html += "</ul>";
      if (fechadas.length) {
        html += '<details class="agenda-fechadas"><summary>' + fechadas.length + " " + (fechadas.length > 1 ? "meses fechados" : "mês fechado") + '</summary><ul class="agenda-lista">';
        fechadas.forEach(function (a) {
          html += '<li><div class="agenda-linha fechada"><span class="mes">' + esc(a.mes) + '</span><span class="local">' + esc(a.local) + '</span><span class="estado">Fechada</span></div></li>';
        });
        html += "</ul></details>";
      }
      html += "</div>";
    });
    alvo.innerHTML = html;
  }

  /* trabalhos */
  var obras = document.querySelector("[data-obras]");
  if (obras) {
    var lista = window.OBRAS || [];
    var h = "";
    if (lista.length) {
      lista.forEach(function (o, i) {
        h += '<figure class="obra" data-revela><img src="' + esc(o.src) + '" alt="' + esc(o.alt || "Tatuagem de Bernardo Lacerda") + '" width="' + (o.w || 1200) + '" height="' + (o.h || 1500) + '" loading="' + (i < 3 ? "eager" : "lazy") + '" decoding="async">' +
          (o.legenda ? "<figcaption>" + esc(o.legenda) + "</figcaption>" : "") + "</figure>";
      });
    } else {
      for (var i = 1; i <= 6; i++) h += '<div class="obra obra--vaga" data-revela><span>Foto ' + (i < 10 ? "0" + i : i) + "</span></div>";
    }
    obras.innerHTML = h;
  }

  /* revelar ao rolar */
  var itens = document.querySelectorAll("[data-revela]");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("visto"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    itens.forEach(function (el) { io.observe(el); });
  } else {
    itens.forEach(function (el) { el.classList.add("visto"); });
  }

  var ano = document.querySelector("[data-ano]");
  if (ano) ano.textContent = new Date().getFullYear();
})();
