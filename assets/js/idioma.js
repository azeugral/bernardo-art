/* Idioma da página e caminhos. Carregar antes dos outros scripts.
   - window.EN: true nas páginas em inglês (<html lang="en">)
   - window.T(pt, en): devolve o texto no idioma da página
   - window.RAIZ: caminho até a raiz do site (as páginas em /en/ ficam um nível abaixo)
   - traduções da agenda (meses e cidades) e aviso de versão em inglês nas páginas em português */
(function () {
  "use strict";

  var lang = (document.documentElement.lang || "pt").toLowerCase();
  var EN = lang.indexOf("en") === 0;
  window.EN = EN;
  window.T = function (pt, en) { return EN ? en : pt; };

  /* fontes prontas (Forum): títulos e animação aparecem juntos, sem troca de fonte visível */
  window.FONTES = new Promise(function (ok) {
    var feito = function () { document.documentElement.classList.add("fontes"); ok(); };
    setTimeout(feito, 1600);
    if (document.fonts && document.fonts.load) document.fonts.load("1em Forum").then(function () { return document.fonts.ready; }).then(feito, feito);
    else feito();
  });

  var eu = document.currentScript && document.currentScript.src;
  window.RAIZ = eu ? eu.replace(/assets\/js\/idioma\.js.*$/, "") : "";

  var MESES = {
    "Janeiro": "January", "Fevereiro": "February", "Março": "March", "Abril": "April",
    "Maio": "May", "Junho": "June", "Julho": "July", "Agosto": "August",
    "Setembro": "September", "Outubro": "October", "Novembro": "November", "Dezembro": "December",
    "Maio e junho": "May and June"
  };
  var LOCAIS = { "Brasil": "Brazil", "Paris / Berlim": "Paris / Berlin" };
  window.mesNoIdioma = function (m) { return EN ? (MESES[m] || m) : m; };
  window.localNoIdioma = function (l) { return EN ? (LOCAIS[l] || l) : l; };

  /* página em português aberta por quem não lê português: oferece a versão em inglês */
  if (!EN) {
    var troca = document.querySelector("[data-idioma-en]");
    var langs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || "pt"])
      .map(function (l) { return String(l).toLowerCase(); });
    var falaPt = langs.some(function (l) { return l.indexOf("pt") === 0; });
    var dispensou = false;
    try { dispensou = localStorage.getItem("bernardo-idioma") === "pt"; } catch (e) {}
    if (troca && !falaPt && !dispensou) {
      var montar = function () {
        var aviso = document.createElement("div");
        aviso.className = "aviso-idioma";
        aviso.setAttribute("role", "region");
        aviso.setAttribute("aria-label", "Language");
        aviso.setAttribute("lang", "en");
        aviso.innerHTML = '<span>This site is also available in English.</span>' +
          '<a href="' + troca.getAttribute("href") + '" hreflang="en">English <span aria-hidden="true">→</span></a>' +
          '<button type="button" aria-label="Keep Portuguese">×</button>';
        aviso.querySelector("button").addEventListener("click", function () {
          try { localStorage.setItem("bernardo-idioma", "pt"); } catch (e) {}
          aviso.remove();
        });
        document.body.appendChild(aviso);
      };
      if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", montar); else montar();
    }
  }
})();
