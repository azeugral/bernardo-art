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
    "uniform vec2 r;uniform float t;uniform float s;uniform vec4 z[" + MAX_ZONAS + "];uniform float zf;",
    "float h(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}",
    "float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);",
    "return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}",
    "float fb(vec2 p){float v=0.,a=.5;mat2 k=mat2(1.6,1.2,-1.2,1.6);",
    "for(int i=0;i<4;i++){v+=a*n(p);p=k*p;a*=.5;}return v;}",
    "void main(){",
    "  vec2 fc=gl_FragCoord.xy, mn=vec2(min(r.x,r.y));",
    /* áreas livres: a tinta desvia delas como um fluido em volta de um obstáculo.
       1) o campo é empurrado para fora (deslocamento na direção normal da área);
       2) dentro e na borda, o limiar sobe aos poucos e as manchas afinam até sumir. */
    "  vec2 desvio=vec2(0.); float liv=0.;",
    "  for(int i=0;i<" + MAX_ZONAS + ";i++){",
    "    vec4 Z=z[i];",
    "    if(Z.z>0.){",
    "      vec2 q=clamp(fc,Z.xy-Z.zw,Z.xy+Z.zw);",
    "      vec2 dz=abs(fc-Z.xy)-Z.zw;",
    "      float sd=length(max(dz,0.))+min(max(dz.x,dz.y),0.);",
    "      vec2 nrm=fc-q; float ln=length(nrm);",
    "      nrm=ln>.5?nrm/ln:normalize(fc-Z.xy+1e-3);",
    "      float em=exp(-max(sd,0.)/(zf*2.2));",
    "      desvio+=nrm*em*zf*1.4;",
    "      liv=max(liv,1.-smoothstep(-zf*.4,zf*2.4,sd));",
    "    }",
    "  }",
    "  vec2 p=((fc-desvio)-.5*r)/mn*1.05+vec2(s*7.13,s*3.71);",
    "  float T=t*.035;",
    "  vec2 a=vec2(fb(p+vec2(0.,T)),fb(p+vec2(5.2,1.3)-T*.7));",
    "  vec2 b=vec2(fb(p+2.2*a+vec2(1.7,9.2)+T*.6),fb(p+2.2*a+vec2(8.3,2.8)-T*.4));",
    "  float w=fb(p+2.6*b);",
    /* faixas de mármore: seno sobre a coordenada deformada */
    "  float v=sin((p.x*1.1+p.y*.55+w*5.2)*2.15);",
    "  float lv=liv*liv*(3.-2.*liv);",
    "  float ev=v-(.36+lv*.98); float aa=fwidth(ev)*1.1;",
    "  float ink=smoothstep(-aa,aa,ev);",
    /* veios finos: a faixa estreita até zero perto das áreas livres, sem corte */
    "  float lw=.08*(1.-lv); aa=fwidth(v)*1.2;",
    "  float veio=lw>.004?smoothstep(-.82-aa,-.82+aa,v)*(1.-smoothstep(-.82+lw-aa,-.82+lw+aa,v)):0.;",
    "  ink=max(ink,veio*.85);",
    "  vec3 papel=vec3(.91,.894,.863); vec3 tinta=vec3(.051,.051,.047);",
    "  float grao=(h(gl_FragCoord.xy+fract(t))-.5)*.025;",
    "  gl_FragColor=vec4(mix(papel,tinta,ink)+grao,1.);",
    "}"
  ].join("\n");

  function iniciar(cv) {
    var gl = cv.getContext("webgl", { antialias: false, alpha: false });
    if (!gl) { cv.classList.add("sem-gl"); return; }
    gl.getExtension("OES_standard_derivatives");

    function sh(tipo, src) {
      var o = gl.createShader(tipo);
      gl.shaderSource(o, src);
      gl.compileShader(o);
      if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(o);
      return o;
    }

    var prog = gl.createProgram();
    try {
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, "#extension GL_OES_standard_derivatives : enable\n" + FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw gl.getProgramInfoLog(prog);
    } catch (err) {
      cv.classList.add("sem-gl");
      return;
    }
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

    var area = cv.closest("[data-tinta-area]") || cv.parentNode;
    var livres = Array.prototype.slice.call(area.querySelectorAll("[data-tinta-livre]"), 0, MAX_ZONAS);
    var zonas = new Float32Array(MAX_ZONAS * 4), zf = 1;

    var w = 0, hgt = 0, visivel = true, rodando = false, ultimo = 0, tempo = 12;

    function medir() {
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      var r = cv.getBoundingClientRect();
      w = Math.max(1, Math.round(r.width * dpr));
      hgt = Math.max(1, Math.round(r.height * dpr));
      if (cv.width !== w || cv.height !== hgt) {
        cv.width = w; cv.height = hgt;
        gl.viewport(0, 0, w, hgt);
      }
      var k = w / r.width;
      zonas.fill(0);
      livres.forEach(function (el, i) {
        var lr = el.getBoundingClientRect();
        if (!lr.width) return;
        var folga = parseFloat(el.dataset.tintaFolga || "-4");
        zonas[i * 4] = (lr.left - r.left + lr.width / 2) * k;
        zonas[i * 4 + 1] = (r.bottom - lr.bottom + lr.height / 2) * k;
        zonas[i * 4 + 2] = (lr.width / 2 + folga) * k;
        zonas[i * 4 + 3] = (lr.height / 2 + folga) * k;
      });
      zf = Math.min(w, hgt) * 0.07;
      desenhar();
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
      var dt = Math.min(0.05, (agora - (ultimo || agora)) / 1000);
      ultimo = agora;
      tempo += dt;
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
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(medir);
    cv.classList.add("pronto");
    ligar();
  }

  canvases.forEach(iniciar);
})();
