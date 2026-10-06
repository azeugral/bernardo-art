/* Pedido de agendamento: etapas, validação, rascunho no navegador, fotos comprimidas e envio.
   O envio é um POST multipart para o FormSubmit (ver ENVIO), que entrega por e-mail com anexos. */
(function () {
  "use strict";

  var ENVIO = {
    // Depois da ativação, trocar o e-mail pelo apelido que o FormSubmit gera (esconde o endereço).
    destino: "https://formsubmit.co/bernardoart2019@gmail.com",
    maxFotos: 3,
    ladoMax: 1600,
    qualidade: 0.82
  };
  var CHAVE = "bernardo-pedido-v1";

  var form = document.querySelector("[data-pedido]");
  if (!form) return;
  form.action = ENVIO.destino;

  var etapas = Array.prototype.slice.call(form.querySelectorAll("[data-etapa]"));
  var passos = Array.prototype.slice.call(document.querySelectorAll("[data-passos] li"));
  var btnVoltar = form.querySelector("[data-voltar]");
  var btnAvancar = form.querySelector("[data-avancar]");
  var btnEnviar = form.querySelector("[data-enviar]");
  var barra = document.querySelector("[data-progresso]");
  var alerta = form.querySelector("[data-alerta]");
  var rascunho = form.querySelector("[data-rascunho]");
  var atual = 0, maxVisto = 0;
  var fotos = []; // { file, url }

  function $(sel, raiz) { return (raiz || form).querySelector(sel); }
  function $$(sel, raiz) { return Array.prototype.slice.call((raiz || form).querySelectorAll(sel)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* ---------- opções de data a partir da agenda ---------- */
  var caixaQuando = $("[data-quando]");
  var outroQuando = $("#quando-outro");
  (window.AGENDA || []).filter(function (a) { return a.aberta; }).forEach(function (a) {
    var v = a.mes + " " + a.ano + " · " + a.local;
    caixaQuando.insertAdjacentHTML("beforeend",
      '<label class="escolha"><input type="radio" name="Cidade e mês" value="' + esc(v) + '" required><span><small>' + esc(a.mes) + " " + a.ano + "</small><b>" + esc(a.local) + "</b></span></label>");
  });
  caixaQuando.insertAdjacentHTML("beforeend",
    '<label class="escolha"><input type="radio" name="Cidade e mês" value="Outra data"><span><small>Lista de espera</small><b>Outra data</b></span></label>');
  caixaQuando.addEventListener("change", function () {
    var outro = $('input[name="Cidade e mês"]:checked').value === "Outra data";
    outroQuando.hidden = !outro;
    if (outro) outroQuando.focus();
  });

  /* ---------- texto de ajuda muda com o tipo de projeto ---------- */
  var ajudaIdeia = $("[data-ajuda-ideia]");
  var ajudas = {
    "Tem um significado": "Seja o mais detalhista possível e, se se sentir à vontade, conte um pouco da sua história: o motivo e o que essa tatuagem significa para você.",
    "Sem significado, tema definido": "Descreva o tema com clareza. Por exemplo: abstrato livre, um rosto feminino, um animal. Quanto mais definido, melhor."
  };
  $$('input[name="x-tipo"]').forEach(function (r) {
    r.addEventListener("change", function () { ajudaIdeia.textContent = ajudas[r.value]; });
  });

  /* ---------- contador ---------- */
  var ideia = $("#ideia"), contador = $("[data-contador]");
  function contar() { var n = ideia.value.trim().length; contador.textContent = n + (n === 1 ? " caractere" : " caracteres"); }
  ideia.addEventListener("input", contar);

  /* ---------- régua ---------- */
  var tamanho = $("#tamanho"), trilho = $("[data-regua]"), marca = $("[data-regua-marca]"), leitura = $("[data-regua-leitura]");
  var MAXR = 100;
  (function montarRegua() {
    var h = "";
    for (var cm = 0; cm <= MAXR; cm += 5) {
      var palmo = cm % 25 === 0;
      h += '<i class="' + (palmo ? "palmo" : "") + '" style="left:' + (cm / MAXR * 100) + '%"></i>';
      if (palmo && cm > 0) h += '<b style="left:' + (cm / MAXR * 100) + '%' + (cm === MAXR ? ';transform:translateX(-100%)' : '') + '">' + (cm / 25) + (cm === 25 ? " palmo" : " palmos") + "</b>";
    }
    trilho.insertAdjacentHTML("beforeend", h);
  })();
  function regua() {
    var v = parseFloat(tamanho.value);
    if (!v || v <= 0) { marca.style.width = "0"; leitura.textContent = "Digite um tamanho"; return; }
    marca.style.width = Math.min(100, v / MAXR * 100) + "%";
    var palmos = v / 22.5;
    var txt = v + " cm ≈ " + (palmos < 0.5 ? "menos de meio palmo" : (Math.round(palmos * 2) / 2).toString().replace(".", ",") + (palmos >= 1.25 ? " palmos" : " palmo"));
    if (v <= 40) txt += " · costuma dar para tatuar no mesmo dia";
    else txt += " · projeto grande, pode pedir mais de um dia";
    leitura.textContent = txt;
  }
  tamanho.addEventListener("input", regua);

  /* ---------- fotos ---------- */
  var inputArq = $("#arquivos"), lista = $("[data-fotos-lista]"), zona = $("[data-fotos]");
  function desenharFotos() {
    lista.innerHTML = fotos.map(function (f, i) {
      return '<figure class="foto"><img src="' + f.url + '" alt=""><figcaption>' + (i + 1) + '</figcaption><button type="button" data-tirar="' + i + '" aria-label="Remover imagem ' + (i + 1) + '">×</button></figure>';
    }).join("");
  }
  function addArquivos(arqs) {
    var aviso = false;
    Array.prototype.forEach.call(arqs, function (f) {
      if (!/^image\//.test(f.type)) return;
      if (fotos.length >= ENVIO.maxFotos) { aviso = true; return; }
      fotos.push({ file: f, url: URL.createObjectURL(f) });
    });
    desenharFotos();
    if (aviso) mostrarAlerta("Dá para mandar até " + ENVIO.maxFotos + " imagens. Se precisar de mais, eu peço depois.");
  }
  inputArq.addEventListener("change", function () { addArquivos(inputArq.files); inputArq.value = ""; });
  lista.addEventListener("click", function (e) {
    var b = e.target.closest("[data-tirar]");
    if (!b) return;
    var i = +b.dataset.tirar;
    URL.revokeObjectURL(fotos[i].url);
    fotos.splice(i, 1);
    desenharFotos();
  });
  ["dragenter", "dragover"].forEach(function (t) { zona.addEventListener(t, function (e) { e.preventDefault(); zona.classList.add("arrastando"); }); });
  ["dragleave", "drop"].forEach(function (t) { zona.addEventListener(t, function (e) { e.preventDefault(); zona.classList.remove("arrastando"); }); });
  zona.addEventListener("drop", function (e) { if (e.dataTransfer) addArquivos(e.dataTransfer.files); });

  function comprimir(file) {
    return new Promise(function (ok) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        var esc = Math.min(1, ENVIO.ladoMax / Math.max(img.naturalWidth, img.naturalHeight));
        var cv = document.createElement("canvas");
        cv.width = Math.round(img.naturalWidth * esc);
        cv.height = Math.round(img.naturalHeight * esc);
        cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
        URL.revokeObjectURL(url);
        cv.toBlob(function (blob) {
          if (!blob || blob.size > file.size) { ok(file); return; }
          var nome = file.name.replace(/\.[^.]+$/, "") + ".jpg";
          ok(new File([blob], nome, { type: "image/jpeg" }));
        }, "image/jpeg", ENVIO.qualidade);
      };
      img.onerror = function () { URL.revokeObjectURL(url); ok(file); };
      img.src = url;
    });
  }

  /* ---------- validação ---------- */
  function marcar(el, ok) {
    var campo = el.closest(".campo, .confirma, [data-grupo]");
    if (campo) campo.classList.toggle("erro", !ok);
    return ok;
  }
  function algumMarcado(grupo) { return $$('[data-grupo="' + grupo + '"] input[type="checkbox"]:checked').length > 0; }

  function validar(i) {
    var et = etapas[i], ok = true, primeiro = null;
    function falha(el) { ok = false; if (!primeiro) primeiro = el; }

    $$("input[required], textarea[required]", et).forEach(function (el) {
      if (el.type === "radio" || el.type === "checkbox") return;
      var v = el.value.trim();
      var bom = v.length > 0;
      if (bom && el.type === "email") bom = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
      if (bom && el.type === "tel") bom = v.replace(/\D/g, "").length >= 10;
      if (bom && el.type === "number") bom = +v > 0;
      if (bom && el.minLength > 0) bom = v.length >= el.minLength;
      if (!marcar(el, bom)) falha(el);
    });

    var radios = {};
    $$('input[type="radio"][required]', et).forEach(function (r) { radios[r.name] = r; });
    Object.keys(radios).forEach(function (nome) {
      var r = radios[nome];
      var bom = !!$('input[name="' + nome + '"]:checked', et);
      if (bom && nome === "Cidade e mês" && $('input[name="Cidade e mês"]:checked').value === "Outra data") bom = outroQuando.value.trim().length > 0;
      if (!marcar(r, bom)) falha(r);
    });

    if (et.querySelector('[data-grupo="local"]')) {
      var bomLocal = algumMarcado("local") || $("#local-obs").value.trim().length > 0;
      if (!marcar($("#local-obs"), bomLocal)) falha($('[data-grupo="local"] input'));
    }
    if (et.querySelector('[data-grupo="dias"]')) {
      if (!marcar($("#dias-obs"), algumMarcado("dias"))) falha($('[data-grupo="dias"] input'));
    }
    $$('.confirma input[required]', et).forEach(function (c) { if (!marcar(c, c.checked)) falha(c); });

    if (!ok) {
      mostrarAlerta("Faltou preencher alguns campos desta etapa.");
      if (primeiro) {
        var alvo = primeiro.closest(".campo, .confirma, [data-grupo]") || primeiro;
        alvo.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
        setTimeout(function () { primeiro.focus({ preventScroll: true }); }, 350);
      }
    } else {
      esconderAlerta();
    }
    return ok;
  }

  form.addEventListener("input", function (e) {
    var c = e.target.closest(".erro");
    if (c) c.classList.remove("erro");
  });
  form.addEventListener("change", function (e) {
    var c = e.target.closest(".erro");
    if (c) c.classList.remove("erro");
  });

  function mostrarAlerta(t) { alerta.textContent = t; alerta.hidden = false; }
  function esconderAlerta() { alerta.hidden = true; }

  /* ---------- navegação entre etapas ---------- */
  function ir(i, foco) {
    atual = Math.max(0, Math.min(etapas.length - 1, i));
    maxVisto = Math.max(maxVisto, atual);
    etapas.forEach(function (et, k) {
      et.hidden = k !== atual;
      et.classList.toggle("entra", k === atual);
    });
    passos.forEach(function (p, k) {
      if (k === atual) p.setAttribute("aria-current", "step"); else p.removeAttribute("aria-current");
      p.classList.toggle("feito", k < atual || (k <= maxVisto && k !== atual));
    });
    btnVoltar.hidden = atual === 0;
    btnAvancar.hidden = atual === etapas.length - 1;
    btnEnviar.hidden = atual !== etapas.length - 1;
    barra.style.transform = "scaleX(" + ((atual + 1) / etapas.length) + ")";
    if (atual === etapas.length - 1) montarRevisao();
    esconderAlerta();
    if (foco !== false) {
      var topo = document.querySelector(".agendar__form");
      var y = topo.getBoundingClientRect().top + window.scrollY - 70;
      if (window.scrollY > y) window.scrollTo({ top: y, behavior: "auto" });
      etapas[atual].querySelector("h2").setAttribute("tabindex", "-1");
      etapas[atual].querySelector("h2").focus({ preventScroll: true });
    }
  }

  btnAvancar.addEventListener("click", function () { if (validar(atual)) { salvar(); ir(atual + 1); } });
  btnVoltar.addEventListener("click", function () { ir(atual - 1); });
  document.querySelectorAll("[data-ir]").forEach(function (b) {
    b.addEventListener("click", function () {
      var alvo = +b.dataset.ir;
      if (alvo <= atual) { ir(alvo); return; }
      for (var k = atual; k < alvo; k++) { if (!validar(k)) { ir(k); validar(k); return; } }
      ir(alvo);
    });
  });
  form.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && e.target.tagName === "INPUT" && e.target.type !== "checkbox" && e.target.type !== "radio") {
      e.preventDefault();
      if (atual < etapas.length - 1) btnAvancar.click();
    }
  });

  /* ---------- composição dos campos para o e-mail ---------- */
  function valoresMarcados(grupo) { return $$('[data-grupo="' + grupo + '"] input[type="checkbox"]:checked').map(function (c) { return c.value; }); }
  function compor() {
    var local = valoresMarcados("local");
    var det = $("#local-obs").value.trim();
    $('[data-composto="local"]').value = local.join(", ") + (det ? (local.length ? " · " : "") + det : "");
    $('[data-composto="dias"]').value = valoresMarcados("dias").join(", ");
    var tipo = $('input[name="x-tipo"]:checked');
    $('[data-composto="tipo"]').value = tipo ? tipo.value : "";
  }

  function valorQuando() {
    var q = $('input[name="Cidade e mês"]:checked');
    if (!q) return "";
    return q.value === "Outra data" ? "Outra data: " + outroQuando.value.trim() : q.value;
  }

  function montarRevisao() {
    compor();
    var g = function (sel) { var el = $(sel); return el ? el.value.trim() : ""; };
    var obsDias = g("#dias-obs");
    var linhas = [
      ["Nome", g("#nome"), 0],
      ["Idade", g("#idade"), 0],
      ["Cidade", g("#cidade"), 0],
      ["Contato", [g("#telefone"), g("#email"), g("#insta")].filter(Boolean).join("\n"), 0],
      ["Tipo", $('[data-composto="tipo"]').value, 1],
      ["Ideia", g("#ideia"), 1],
      ["Local", $('[data-composto="local"]').value, 1],
      ["Tamanho", g("#tamanho") ? g("#tamanho") + " cm" : "", 1],
      ["Imagens", fotos.length ? fotos.length + (fotos.length > 1 ? " imagens" : " imagem") : "Nenhuma", 1],
      ["Quando", valorQuando(), 2],
      ["Dias", $('[data-composto="dias"]').value + (obsDias ? "\n" + obsDias : ""), 2]
    ];
    $("[data-revisao]").innerHTML = linhas.map(function (l) {
      return '<div class="revisao__grupo"><dt>' + l[0] + "</dt><dd>" + esc(l[1] || "—") + '</dd><button type="button" data-editar="' + l[2] + '">Editar</button></div>';
    }).join("");
  }
  $("[data-revisao]").addEventListener("click", function (e) {
    var b = e.target.closest("[data-editar]");
    if (b) ir(+b.dataset.editar);
  });

  /* ---------- rascunho ---------- */
  function lerTudo() {
    var dados = {};
    $$("input, textarea").forEach(function (el) {
      if (el.type === "file" || el.type === "hidden" || el.name === "_honey") return;
      if (el.type === "checkbox" || el.type === "radio") {
        var g = el.name || (el.closest("[data-grupo]") || {}).dataset;
        dados[(el.name || (g && g.grupo)) + "|" + el.value] = el.checked;
      } else if (el.id) dados[el.id] = el.value;
    });
    return dados;
  }
  function aplicar(dados) {
    $$("input, textarea").forEach(function (el) {
      if (el.type === "file" || el.type === "hidden") return;
      if (el.type === "checkbox" || el.type === "radio") {
        var k = (el.name || (el.closest("[data-grupo]") || {}).dataset.grupo) + "|" + el.value;
        if (k in dados) el.checked = !!dados[k];
      } else if (el.id && el.id in dados) el.value = dados[el.id];
    });
  }
  var tSalvar;
  function salvar() {
    try {
      localStorage.setItem(CHAVE, JSON.stringify({ d: lerTudo(), e: maxVisto, t: Date.now() }));
      rascunho.textContent = "Rascunho salvo neste navegador";
    } catch (err) { /* sem armazenamento: segue sem rascunho */ }
  }
  form.addEventListener("input", function () { clearTimeout(tSalvar); tSalvar = setTimeout(salvar, 600); });
  form.addEventListener("change", function () { clearTimeout(tSalvar); tSalvar = setTimeout(salvar, 300); });

  var restaurado = false;
  try {
    var bruto = localStorage.getItem(CHAVE);
    if (bruto) {
      var r = JSON.parse(bruto);
      if (r && r.d && Date.now() - r.t < 1000 * 60 * 60 * 24 * 30) {
        aplicar(r.d);
        maxVisto = r.e || 0;
        restaurado = true;
        rascunho.textContent = "Continuando de onde você parou";
      }
    }
  } catch (err) { /* ignora */ }

  /* data vinda da agenda da home (?quando=...) */
  var q = new URLSearchParams(location.search).get("quando");
  if (q) {
    $$('input[name="Cidade e mês"]').forEach(function (r) { if (r.value === q) r.checked = true; });
  }

  var sel = $('input[name="x-tipo"]:checked');
  if (sel) ajudaIdeia.textContent = ajudas[sel.value];
  if ($('input[name="Cidade e mês"]:checked') && $('input[name="Cidade e mês"]:checked').value === "Outra data") outroQuando.hidden = false;
  contar(); regua();
  ir(0, false);
  if (restaurado) passos.forEach(function (p, k) { p.classList.toggle("feito", k > 0 && k <= maxVisto); });

  /* ---------- envio ---------- */
  var enviando = false;
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (enviando) return;
    for (var k = 0; k < etapas.length; k++) {
      if (!validar(k)) { ir(k); validar(k); return; }
    }
    if (form.elements._honey.value) return;

    enviando = true;
    btnEnviar.disabled = true;
    btnEnviar.firstChild.textContent = "Enviando… ";
    compor();

    var nome = $("#nome").value.trim().split(/\s+/)[0];
    form.elements._subject.value = "Agendamento · " + $("#nome").value.trim() + " · " + valorQuando();
    form.elements._next.value = new URL("obrigado.html", location.href).href;

    Promise.all(fotos.map(function (f) { return comprimir(f.file); })).then(function (arqs) {
      var caixa = $("[data-anexos]");
      caixa.innerHTML = "";
      var suportaDT = true;
      arqs.forEach(function (arq, i) {
        var inp = document.createElement("input");
        inp.type = "file";
        inp.name = "Imagem " + (i + 1);
        caixa.appendChild(inp);
        try {
          var dt = new DataTransfer();
          dt.items.add(arq);
          inp.files = dt.files;
        } catch (err) { suportaDT = false; caixa.removeChild(inp); }
      });
      if (!suportaDT && arqs.length) {
        $("#duvidas").value += "\n\n(As imagens não puderam ser anexadas por este navegador; vou mandar pelo Instagram ou e-mail.)";
      }
      /* campos auxiliares não vão no e-mail */
      $$('input[name="x-tipo"], [data-grupo="local"] input[type="checkbox"], [data-grupo="dias"] input[type="checkbox"], #arquivos').forEach(function (el) { el.disabled = true; });
      try { sessionStorage.setItem("bernardo-nome", nome); localStorage.removeItem(CHAVE); } catch (err) { /* ignora */ }
      HTMLFormElement.prototype.submit.call(form);
    });
  });
})();
