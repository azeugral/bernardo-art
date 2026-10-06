/* Mármore de tinta: campo de ruído deformado, cortado em faixas de tinta preta sobre papel.
   Move devagar, desvia do cursor, para fora da tela e respeita movimento reduzido. */
(function () {
  "use strict";

  var canvases = document.querySelectorAll("canvas[data-tinta]");
  if (!canvases.length) return;

  var reduz = window.matchMedia("(prefers-reduced-motion: reduce)");

  var VERT =
    "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";

  var FRAG = [
    "precision highp float;",
    "uniform vec2 r;uniform float t;uniform vec2 m;uniform float s;uniform float d;uniform vec4 z;uniform float zf;",
    "float h(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}",
    "float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);",
    "return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}",
    "float fb(vec2 p){float v=0.,a=.5;mat2 k=mat2(1.6,1.2,-1.2,1.6);",
    "for(int i=0;i<4;i++){v+=a*n(p);p=k*p;a*=.5;}return v;}",
    "void main(){",
    "  vec2 p0=(gl_FragCoord.xy-.5*r)/min(r.x,r.y);",
    /* o cursor empurra a tinta em volta dele: deslocamento radial centrado no ponteiro */
    "  vec2 q=p0-m; float e=exp(-dot(q,q)*16.)*d;",
    "  vec2 p=(p0-normalize(q+1e-4)*e*.16)*1.05+vec2(s*7.13,s*3.71);",
    "  float T=t*.035;",
    "  vec2 a=vec2(fb(p+vec2(0.,T)),fb(p+vec2(5.2,1.3)-T*.7));",
    "  vec2 b=vec2(fb(p+2.2*a+vec2(1.7,9.2)+T*.6),fb(p+2.2*a+vec2(8.3,2.8)-T*.4));",
    "  float w=fb(p+2.6*b);",
    /* faixas de mármore: seno sobre a coordenada deformada */
    "  float v=sin((p.x*1.1+p.y*.55+w*5.2)*2.15);",
    /* área livre (o nome): a tinta recua em volta dela, com borda orgânica e nítida */
    "  float liv=0.;",
    "  if(z.z>0.){vec2 dz=abs(gl_FragCoord.xy-z.xy)-z.zw;",
    "    float sd=length(max(dz,0.))+min(max(dz.x,dz.y),0.);",
    "    sd+=(w-.5)*zf*1.6;",
    "    liv=1.-smoothstep(0.,zf,sd);}",
    "  float lim=.36+liv*.95;",
    "  float ev=v-lim; float aa=fwidth(ev)*1.1;",
    "  float ink=smoothstep(-aa,aa,ev);",
    "  aa=fwidth(v)*1.2;",
    "  float veio=smoothstep(-.82-aa,-.82+aa,v)*(1.-smoothstep(-.74-aa,-.74+aa,v))*step(liv,.3);",
    "  ink=max(ink,veio*.85);",
    "  vec3 papel=vec3(.91,.894,.863); vec3 tinta=vec3(.051,.051,.047);",
    "  float grao=(h(gl_FragCoord.xy+fract(t))-.5)*.025;",
    "  vec3 c=mix(papel,tinta,ink)+grao;",
    "  gl_FragColor=vec4(c,1.);",
    "}"
  ].join("\n");

  function iniciar(cv) {
    var gl = cv.getContext("webgl", { antialias: false, alpha: false, preserveDrawingBuffer: false });
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
    var uM = gl.getUniformLocation(prog, "m");
    var uS = gl.getUniformLocation(prog, "s");
    var uD = gl.getUniformLocation(prog, "d");
    var uZ = gl.getUniformLocation(prog, "z");
    var uZF = gl.getUniformLocation(prog, "zf");
    var area0 = cv.closest("[data-tinta-area]") || cv.parentNode;
    var livre = area0.querySelector("[data-tinta-livre]");
    var zona = [0, 0, 0, 0], zf = 1;

    gl.uniform1f(uS, parseFloat(cv.dataset.semente || "0"));

    var w = 0, hgt = 0, visivel = true, rodando = false, ultimo = 0, tempo = 12;
    var alvo = { x: 0, y: 0, d: 0 }, mouse = { x: 0, y: 0, d: 0 };

    function medir() {
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      var r = cv.getBoundingClientRect();
      w = Math.max(1, Math.round(r.width * dpr));
      hgt = Math.max(1, Math.round(r.height * dpr));
      if (cv.width !== w || cv.height !== hgt) {
        cv.width = w; cv.height = hgt;
        gl.viewport(0, 0, w, hgt);
      }
      if (livre) {
        var lr = livre.getBoundingClientRect(), k = w / r.width;
        var folga = -4;
        zona = [
          (lr.left - r.left + lr.width / 2) * k,
          (r.bottom - lr.bottom + lr.height / 2) * k,
          (lr.width / 2 + folga) * k,
          (lr.height / 2 + folga) * k
        ];
        zf = Math.min(w, hgt) * 0.07;
      }
      desenhar();
    }

    function desenhar() {
      gl.uniform2f(uR, w, hgt);
      gl.uniform1f(uT, tempo);
      var mn = Math.min(w, hgt);
      gl.uniform2f(uM, mouse.x / mn, mouse.y / mn);
      gl.uniform1f(uD, mouse.d);
      gl.uniform4f(uZ, zona[0], zona[1], zona[2], zona[3]);
      gl.uniform1f(uZF, zf);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    function quadro(agora) {
      if (!visivel || reduz.matches || document.hidden) { rodando = false; return; }
      var dt = Math.min(0.05, (agora - (ultimo || agora)) / 1000);
      ultimo = agora;
      tempo += dt;
      mouse.x += (alvo.x - mouse.x) * 0.14;
      mouse.y += (alvo.y - mouse.y) * 0.14;
      mouse.d += (alvo.d - mouse.d) * 0.04;
      desenhar();
      requestAnimationFrame(quadro);
    }

    function ligar() {
      if (rodando || reduz.matches) return;
      rodando = true; ultimo = 0;
      requestAnimationFrame(quadro);
    }

    var area = cv.closest("[data-tinta-area]") || cv;
    area.addEventListener("pointermove", function (e) {
      var r = cv.getBoundingClientRect();
      var dpr = w / r.width;
      alvo.x = (e.clientX - r.left - r.width / 2) * dpr;
      alvo.y = (r.height / 2 - (e.clientY - r.top)) * dpr;
      alvo.d = 1;
    });
    area.addEventListener("pointerleave", function () { alvo.d = 0; });

    new IntersectionObserver(function (es) {
      visivel = es[0].isIntersecting;
      if (visivel) ligar();
    }).observe(cv);

    document.addEventListener("visibilitychange", function () { if (!document.hidden) ligar(); });
    if (reduz.addEventListener) reduz.addEventListener("change", function () { reduz.matches ? desenhar() : ligar(); });

    var espera;
    window.addEventListener("resize", function () { clearTimeout(espera); espera = setTimeout(medir, 120); });

    medir();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(medir);
    cv.classList.add("pronto");
    ligar();
  }

  canvases.forEach(iniciar);
})();
