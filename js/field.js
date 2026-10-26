/* ==========================================================================
   field.js — the hero ground.

   A live noise wavefield behind the product, cancelled by its own phase-
   inverted counter-wave as the reader scrolls. It starts turbulent and ends
   flat, which is the page's whole argument rendered rather than asserted.

   Raw WebGL, no library, one fragment shader. Everything is optional:

   - `prefers-reduced-motion: reduce`  -> never initialised, CSS wash instead
   - no WebGL context                  -> never initialised, CSS wash instead
   - JavaScript off                    -> the canvas is never inserted at all

   The CSS fallback (`.field-wrap` in page.css) is a static reading of the same
   ramp, so the hero is composed either way rather than merely not broken.

   Lazy: the context is created only when the hero is near the viewport, and
   the rAF loop stops whenever the hero scrolls out of view. Nothing renders
   for a reader who never looks at it.
   ========================================================================== */

(function (global) {
  'use strict';

  var VERT = [
    'attribute vec2 p;',
    'void main(){ gl_Position = vec4(p, 0.0, 1.0); }'
  ].join('\n');

  /* Ashima's simplex noise, trimmed to the 2D case. Public domain / MIT. */
  var FRAG = [
    'precision highp float;',
    'uniform vec2  u_res;',
    'uniform float u_time;',
    'uniform float u_prog;',

    'vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }',
    'vec2 mod289(vec2 x){ return x - floor(x * (1.0/289.0)) * 289.0; }',
    'vec3 permute(vec3 x){ return mod289(((x*34.0)+1.0)*x); }',
    'float snoise(vec2 v){',
    '  const vec4 C = vec4(0.211324865, 0.366025404, -0.577350269, 0.024390244);',
    '  vec2 i  = floor(v + dot(v, C.yy));',
    '  vec2 x0 = v - i + dot(i, C.xx);',
    '  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);',
    '  vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1;',
    '  i = mod289(i);',
    '  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));',
    '  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);',
    '  m = m*m; m = m*m;',
    '  vec3 x  = 2.0 * fract(p * C.www) - 1.0;',
    '  vec3 h  = abs(x) - 0.5;',
    '  vec3 ox = floor(x + 0.5);',
    '  vec3 a0 = x - ox;',
    '  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);',
    '  vec3 g;',
    '  g.x  = a0.x  * x0.x  + h.x  * x0.y;',
    '  g.yz = a0.yz * x12.xz + h.yz * x12.yw;',
    '  return 130.0 * dot(m, g);',
    '}',

    /* Two octaves is enough: this is a ground, not a light show. */
    'float wave(vec2 uv, float t){',
    '  return snoise(uv * 2.2 + vec2(t * 0.055, t * 0.035)) * 0.62',
    '       + snoise(uv * 4.7 - vec2(t * 0.031, t * 0.044)) * 0.30;',
    '}',

    /* The same four stops as --g-proof, so the ground and the proof bars are
       one system rather than two decorations. */
    'vec3 ramp(float t){',
    '  vec3 c0 = vec3(0.965, 0.851, 0.741);',
    '  vec3 c1 = vec3(0.851, 0.541, 0.353);',
    '  vec3 c2 = vec3(0.561, 0.420, 0.847);',
    '  vec3 c3 = vec3(0.431, 0.549, 1.000);',
    '  t = clamp(t, 0.0, 1.0);',
    '  if (t < 0.30) return mix(c0, c1, t / 0.30);',
    '  if (t < 0.62) return mix(c1, c2, (t - 0.30) / 0.32);',
    '  return mix(c2, c3, (t - 0.62) / 0.38);',
    '}',

    'void main(){',
    '  vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;',

    /* The incoming field, and the counter-wave the processor generates: the
       same field, phase-inverted and fractionally offset. Their sum is what
       is left over, and u_prog is how much of the counter-wave is applied. */
    /* The ambient field: what the room is doing. */
    '  float ambient = wave(uv, u_time);',

    /* The counter-wave, emanating from the driver — the same point the hero
       diagram separates out. Concentric fronts, falling off with distance. */
    '  vec2  src  = vec2(0.40, -0.03);',
    '  float d    = length((uv - src) * vec2(1.0, 1.25));',
    /* The noise displaces the fronts slightly, so they read as a wave meeting
       a room rather than as a test pattern. */
    '  float ring = sin(d * 22.0 - u_time * 1.25 + ambient * 0.9);',
    /* Sharpen the fronts a little; a raw sine reads as haze at this alpha. */
    '  ring = sign(ring) * pow(abs(ring), 0.72);',
    '  float counter = ring * smoothstep(1.6, 0.02, d);',

    /* Applying the counter-wave IS the scroll. What is left is the residual,
       and the whole field decays to the chapter ground as it lands. */
    '  float sig = ambient * 0.85 - u_prog * 1.75 * counter;',
    '  sig *= pow(1.0 - u_prog, 1.15);',

    /* Fade per axis. A single radial vignette leaves hard horizontal edges on
       a canvas this wide, because uv.y never reaches the falloff radius. */
    '  float vig = smoothstep(1.42, 0.22, abs(uv.x)) * smoothstep(0.60, 0.02, abs(uv.y));',

    /* Colour carries the semantics rather than decorating them: the ambient
       field sits at the warm end of the ramp, the counter-wave at the cool
       end. Cancellation is visibly the cool thing arriving over the warm one. */
    '  float ink = clamp(abs(sig) * 2.3, 0.0, 1.0) * vig * 0.72;',
    '  vec3  col = ramp(0.38 - ambient * 0.30 + u_prog * counter * 0.85);',
    '  gl_FragColor = vec4(col, ink);',
    '}'
  ].join('\n');

  function compile(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      if (global.console) console.warn('field: ' + gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  var state = {
    on: false, gl: null, canvas: null, prog: 0, raf: 0, t0: 0, visible: false,
    u: {}
  };

  function resize() {
    if (!state.canvas) return;
    /* Capped at 1.5 rather than devicePixelRatio: this is a soft field, and a
       3x buffer on a phone buys nothing but heat. */
    var dpr = Math.min(global.devicePixelRatio || 1, 1.5);
    var r = state.canvas.getBoundingClientRect();
    var w = Math.max(1, Math.round(r.width * dpr));
    var h = Math.max(1, Math.round(r.height * dpr));
    if (state.canvas.width === w && state.canvas.height === h) return;
    state.canvas.width = w;
    state.canvas.height = h;
    state.gl.viewport(0, 0, w, h);
  }

  function frame() {
    state.raf = 0;
    if (!state.on || !state.visible) return;
    var gl = state.gl;
    resize();
    gl.uniform2f(state.u.res, state.canvas.width, state.canvas.height);
    gl.uniform1f(state.u.time, (Date.now() - state.t0) / 1000);
    gl.uniform1f(state.u.prog, state.prog);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    state.raf = global.requestAnimationFrame(frame);
  }

  function tick() {
    if (state.on && state.visible && !state.raf) {
      state.raf = global.requestAnimationFrame(frame);
    }
  }

  function init(host) {
    if (state.on || !host) return false;

    var canvas = document.createElement('canvas');
    canvas.className = 'field-canvas';
    canvas.setAttribute('aria-hidden', 'true');

    var opts = { alpha: true, antialias: false, premultipliedAlpha: false,
                 powerPreference: 'low-power', failIfMajorPerformanceCaveat: true };
    var gl = canvas.getContext('webgl', opts) || canvas.getContext('experimental-webgl', opts);
    if (!gl) return false;   /* the CSS wash is already showing; leave it */

    var vs = compile(gl, gl.VERTEX_SHADER, VERT);
    var fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return false;

    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    state.u = {
      res:  gl.getUniformLocation(prog, 'u_res'),
      time: gl.getUniformLocation(prog, 'u_time'),
      prog: gl.getUniformLocation(prog, 'u_prog')
    };

    host.appendChild(canvas);
    state.canvas = canvas;
    state.gl = gl;
    state.on = true;
    state.t0 = Date.now();
    host.setAttribute('data-field', 'live');   /* CSS drops the wash */

    /* Nothing renders while the hero is off-screen. */
    if (global.IntersectionObserver) {
      new global.IntersectionObserver(function (entries) {
        state.visible = entries[0].isIntersecting;
        tick();
      }, { rootMargin: '120px' }).observe(host);
    } else {
      state.visible = true;
    }

    global.addEventListener('resize', tick);
    tick();
    return true;
  }

  function setProgress(p) {
    state.prog = p < 0 ? 0 : p > 1 ? 1 : p;
    tick();
  }

  /* Deferred until the hero is close: a WebGL context is not free to create. */
  function mount(host) {
    if (!host) return;
    if (global.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    if (!global.IntersectionObserver) { init(host); return; }
    var io = new global.IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      init(host);
    }, { rootMargin: '400px' });
    io.observe(host);
  }

  global.Field = { mount: mount, setProgress: setProgress };
}(window));
