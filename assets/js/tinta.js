/* Mármore de tinta: campo de ruído deformado, cortado em faixas de tinta preta sobre papel.
   Move devagar, contorna os elementos marcados com [data-tinta-livre], para fora da tela
   e respeita movimento reduzido. */
(function () {
  "use strict";

  var canvases = document.querySelectorAll("canvas[data-tinta]");
  if (!canvases.length) return;

  var reduz = window.matchMedia("(prefers-reduced-motion: reduce)");
  var MAX_ZONAS = 3;

  var VERT = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";

  var FRAG = [
    "precision highp float;",
    "uniform vec2 r;uniform float t;uniform float s;uniform vec4 z[" + MAX_ZONAS + "];uniform float zf;uniform float ciclo;uniform float gr;",
    "float h(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}",
    "float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);",
    "return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}",
    "float fb(vec2 p){float v=0.,a=.5;mat2 k=mat2(1.6,1.2,-1.2,1.6);",
    "for(int i=0;i<4;i++){v+=a*n(p);p=k*p;a*=.5;}return v;}",
    "void main(){",
    "  vec2 fc=gl_FragCoord.xy, mn=vec2(min(r.x,r.y));",
    "  float T=t*.035;",
    "  vec2 o1=vec2(0.,T),o2=vec2(-T*.7),o3=vec2(T*.6),o4=vec2(-T*.4);",
    /* modo ciclo: o tempo anda num círculo no espaço do ruído, então o fim emenda no começo */
    "  if(ciclo>0.){float th=6.2831853*t/ciclo,Rc=.035*ciclo/6.2831853;",
    "    o1=Rc*vec2(cos(th),sin(th));o2=Rc*.7*vec2(cos(th+2.1),sin(th+2.1))*1.41;",
    "    o3=Rc*.6*vec2(cos(th+4.2),sin(th+4.2))*1.41;o4=Rc*.4*vec2(cos(th+1.3),sin(th+1.3))*1.41;}",
    /* áreas livres: a tinta desvia delas como um fluido em volta de um obstáculo.
       1) o campo é empurrado para fora (deslocamento na direção normal da área);
       2) dentro e na borda, o limiar sobe aos poucos e as manchas afinam até sumir;
       3) a borda ondula devagar, para nunca virar uma linha reta. */
    "  vec2 desvio=vec2(0.); float liv=0.;",
    "  float onda=(fb(fc/mn*1.3+vec2(7.,3.)+o1*2.)-.5)*zf*4.;",
    "  for(int i=0;i<" + MAX_ZONAS + ";i++){",
    "    vec4 Z=z[i];",
    "    if(Z.z>0.){",
    "      float R=min(zf*1.4,min(Z.z,Z.w));",
    "      vec2 q=clamp(fc,Z.xy-Z.zw+R,Z.xy+Z.zw-R);",
    "      vec2 nrm=fc-q; float ln=length(nrm);",
    "      float sd=ln-R+onda;",
    /* o empurrão cresce suave a partir do miolo: sem salto, sem fio */
    "      nrm=nrm/max(ln,1e-3)*smoothstep(0.,R,ln);",
    "      float em=exp(-max(sd,0.)/(zf*2.2));",
    "      desvio+=nrm*em*zf*1.4;",
    "      liv=max(liv,1.-smoothstep(-zf*.4,zf*2.4,sd));",
    "    }",
    "  }",
    "  vec2 c0=((fc-desvio)-.5*r)/mn;",
    /* tela em pé: gira o desenho para manter a composição da tela deitada */
    "  if(r.y>r.x*1.05) c0=vec2(c0.y,-c0.x);",
    "  vec2 p=c0*1.05+vec2(s*7.13,s*3.71);",
    "  vec2 a=vec2(fb(p+o1),fb(p+vec2(5.2,1.3)+o2));",
    "  vec2 b=vec2(fb(p+2.2*a+vec2(1.7,9.2)+o3),fb(p+2.2*a+vec2(8.3,2.8)+o4));",
    "  float w=fb(p+2.6*b);",
    /* faixas de mármore: seno sobre a coordenada deformada */
    "  float v=sin((p.x*1.1+p.y*.55+w*5.2)*2.15);",
    "  float lv=liv*liv*(3.-2.*liv);",
    "  float ev=v-(.36+lv*.98); float aa=min(fwidth(ev),.06)*1.1;",
    "  float ink=smoothstep(-aa,aa,ev);",
    /* veios finos: a faixa estreita até zero perto das áreas livres, sem corte */
    /* veios: estreitam até virar ponta, como o fim de uma pincelada; só o último subpixel desbota */
    "  aa=min(fwidth(v),.06)*1.1; float lw=.08*(1.-smoothstep(.05,.75,lv));",
    "  float veio=smoothstep(-.82-aa,-.82+aa,v)*(1.-smoothstep(-.82+lw-aa,-.82+lw+aa,v))*clamp(lw/(aa*2.5+1e-4),0.,1.);",
    "  ink=max(ink,veio*.92);",
    "  vec3 papel=vec3(.91,.894,.863); vec3 tinta=vec3(.051,.051,.047);",
    "  float grao=(h(gl_FragCoord.xy+fract(t))-.5)*.025*gr;",
    "  gl_FragColor=vec4(mix(papel,tinta,ink)+grao,1.);",
    "}"
  ].join("\n");

  /* fontes: a animação e os títulos só aparecem quando a Forum carregou (sem troca de fonte na frente
     do visitante e sem a área livre pular). Limite de 1,6 s para não segurar a página. */
  var fontes = window.FONTES || new Promise(function (ok) {
    var feito = function () { document.documentElement.classList.add("fontes"); ok(); };
    setTimeout(feito, 1600);
    if (document.fonts && document.fonts.load) document.fonts.load("1em Forum").then(function () { return document.fonts.ready; }).then(feito, feito);
    else feito();
  });

  function iniciar(cv) {
    var gravar = cv.hasAttribute("data-tinta-gravar");
    var gl = cv.getContext("webgl", { antialias: false, alpha: false, preserveDrawingBuffer: gravar });
    if (!gl) { cv.classList.add("sem-gl"); return; }
    gl.getExtension("OES_standard_derivatives");
    /* compila em segundo plano quando o navegador permite: a página não trava */
    var paralelo = gl.getExtension("KHR_parallel_shader_compile");

    var prog = gl.createProgram();
    var vs = gl.createShader(gl.VERTEX_SHADER), fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(vs, VERT);
    gl.shaderSource(fs, "#extension GL_OES_standard_derivatives : enable\n" + FRAG);
    gl.compileShader(vs); gl.compileShader(fs);
    gl.attachShader(prog, vs); gl.attachShader(prog, fs);
    gl.linkProgram(prog);

    function quandoCompilar(feito) {
      if (!paralelo || gravar) { feito(); return; }
      (function espera() {
        if (gl.getProgramParameter(prog, paralelo.COMPLETION_STATUS_KHR)) feito();
        else requestAnimationFrame(espera);
      })();
    }

    quandoCompilar(function () {
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { cv.classList.add("sem-gl"); return; }
      if (gravar) { montar(); return; }
      fontes.then(montar);
    });

    function montar() {
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    var uR = gl.getUniformLocation(prog, "r");
    var uT = gl.getUniformLocation(prog, "t");
    var uZ = gl.getUniformLocation(prog, "z");
    var uZF = gl.getUniformLocation(prog, "zf");
    gl.uniform1f(gl.getUniformLocation(prog, "s"), parseFloat(cv.dataset.semente || "0"));
    gl.uniform1f(gl.getUniformLocation(prog, "ciclo"), gravar ? parseFloat(cv.dataset.tintaGravar || "24") : 0);
    gl.uniform1f(gl.getUniformLocation(prog, "gr"), gravar ? 0 : 1);

    var area = cv.closest("[data-tinta-area]") || cv.parentNode;
    var livres = Array.prototype.slice.call(area.querySelectorAll("[data-tinta-livre]"), 0, MAX_ZONAS);
    /* zonas: o shader recebe "zonas"; mudanças de layout mexem em "alvo" e as zonas deslizam até lá */
    var zonas = new Float32Array(MAX_ZONAS * 4), alvo = new Float32Array(MAX_ZONAS * 4), zf = 1, primeira = true;

    var w = 0, hgt = 0, visivel = true, rodando = false, ultimo = 0, tempo = 12, inicio = 0;

    /* resolução: telas de toque começam em 1x; se o aparelho não sustentar ~45 fps, baixa sozinho
       (só mede depois que a página assentou, para não confundir a carga inicial com aparelho lento) */
    var toque = window.matchMedia("(pointer: coarse)").matches;
    var escala = toque ? 1 : 1.5, amostras = [], ajustes = 0;

    function medir() {
      var dpr = Math.min(window.devicePixelRatio || 1, escala);
      var r = cv.getBoundingClientRect();
      var nw = Math.max(1, Math.round(r.width * dpr)), nh = Math.max(1, Math.round(r.height * dpr));
      var k0 = w ? nw / w : 1;
      w = nw; hgt = nh;
      if (cv.width !== w || cv.height !== hgt) {
        cv.width = w; cv.height = hgt;
        gl.viewport(0, 0, w, hgt);
        /* mudou a resolução: as zonas atuais acompanham a escala, sem salto */
        if (k0 !== 1) for (var j = 0; j < zonas.length; j++) zonas[j] *= k0;
      }
      var k = w / r.width;
      alvo.fill(0);
      livres.forEach(function (el, i) {
        var lr = el.getBoundingClientRect();
        if (!lr.width) return;
        /* data-tinta-livre-min: largura de tela a partir da qual a área livre vale */
        if (el.dataset.tintaLivreMin && window.innerWidth < +el.dataset.tintaLivreMin) return;
        var folga = parseFloat(el.dataset.tintaFolga || "-4");
        alvo[i * 4] = (lr.left - r.left + lr.width / 2) * k;
        alvo[i * 4 + 1] = (r.bottom - lr.bottom + lr.height / 2) * k;
        alvo[i * 4 + 2] = (lr.width / 2 + folga) * k;
        alvo[i * 4 + 3] = (lr.height / 2 + folga) * k;
      });
      zf = Math.min(w, hgt) * 0.07;
      if (primeira || !rodando) { zonas.set(alvo); primeira = false; }
      desenhar();
    }

    function aproximar() {
      for (var j = 0; j < zonas.length; j++) {
        var d = alvo[j] - zonas[j];
        zonas[j] = Math.abs(d) < 0.5 ? alvo[j] : zonas[j] + d * 0.12;
      }
    }

    function desenhar() {
      gl.uniform2f(uR, w, hgt);
      gl.uniform1f(uT, tempo);
      gl.uniform4fv(uZ, zonas);
      gl.uniform1f(uZF, zf);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    function quadro(agora) {
      if (!visivel || reduz.matches || document.hidden) { rodando = false; return; }
      var bruto = ultimo ? agora - ultimo : 16.7;
      var dt = Math.min(0.05, bruto / 1000);
      ultimo = agora;
      if (!inicio) inicio = agora;
      if (ajustes < 3 && agora - inicio > 2500) {
        amostras.push(bruto);
        if (amostras.length === 60) {
          amostras.sort(function (a, b) { return a - b; });
          if (amostras[30] > 22 && escala > 0.5) { escala = Math.max(0.5, escala * 0.75); ajustes++; medir(); }
          amostras = [];
        }
      }
      tempo += dt;
      aproximar();
      desenhar();
      requestAnimationFrame(quadro);
    }

    function ligar() {
      if (rodando || reduz.matches) return;
      rodando = true; ultimo = 0;
      requestAnimationFrame(quadro);
    }

    new IntersectionObserver(function (es) {
      visivel = es[0].isIntersecting;
      if (visivel) ligar();
    }).observe(cv);

    document.addEventListener("visibilitychange", function () { if (!document.hidden) ligar(); });
    if (reduz.addEventListener) reduz.addEventListener("change", function () { reduz.matches ? desenhar() : ligar(); });

    var espera;
    var remedir = function () { clearTimeout(espera); espera = setTimeout(medir, 80); };
    window.addEventListener("resize", remedir);
    if (window.ResizeObserver) new ResizeObserver(remedir).observe(area);

    medir();
    if (gravar) {
      cv.classList.add("pronto");
      window.__tintaQuadro = function (seg) { tempo = seg; desenhar(); gl.finish(); return true; };
      return;
    }
    /* o primeiro quadro já está desenhado: só então começa o fade */
    requestAnimationFrame(function () { cv.classList.add("pronto"); ligar(); });
    }
  }

  var celular = window.matchMedia("(pointer: coarse)").matches &&
    Math.min(screen.width, screen.height) < 600;

  function emVideo(cv) {
    var v = document.createElement("video");
    v.setAttribute("data-tinta", "");
    v.setAttribute("aria-hidden", "true");
    v.muted = true; v.loop = true; v.playsInline = true;
    v.setAttribute("muted", ""); v.setAttribute("playsinline", ""); v.setAttribute("loop", "");
    v.preload = "auto";
    /* cada seção tem o seu vídeo, gravado com a área do texto já livre */
    var nome = cv.closest(".final, .simples") ? "tinta-final" : cv.closest(".agendar__lado") ? "tinta-agendar" : "tinta";
    var raiz = window.RAIZ || "";
    v.poster = raiz + "assets/video/" + nome + ".jpg";
    v.className = "tinta-video tinta-video--" + nome;
    var src = document.createElement("source");
    src.src = raiz + "assets/video/" + nome + ".mp4?v=60"; src.type = "video/mp4";
    v.appendChild(src);
    cv.parentNode.replaceChild(v, cv);
    v.addEventListener("loadeddata", function () { v.classList.add("pronto"); });
    if (reduz.matches) return;
    new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
      else v.pause();
    }).observe(v);
    v.classList.add("pronto");
  }

  canvases.forEach(function (cv) {
    if (celular && !cv.hasAttribute("data-tinta-gravar")) emVideo(cv); else iniciar(cv);
  });
})();
