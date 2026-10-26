/* ==========================================================================
   scrub.js — the anchor-expression keyframe DSL, implemented directly.
   No GSAP, no dependency. See freedom/reference/scroll-scenes.md section 2.

   Timing is authored in the markup, not here:

     <div data-scene="hero"
          data-keyframe='{"start": "t - 60vh", "end": "b - 20vh"}'>

   Grammar
     t          anchor top, in document coordinates
     b          anchor bottom
     h          anchor height
     a0t, a1h   indexed into the `anchors` array — anchor 0's top, anchor 1's height
     vh, px     units, combined with + / - arithmetic
     disabledWhen   capability flag that switches the whole scene off

   Retiming a scene is a one-attribute edit. That is the whole reason to build
   this rather than scatter numbers through a timeline file.

   Reduced motion is decided here, once, in JavaScript — a CSS media query
   never sees scroll-driven motion. Under `reduce`, every registered scene is
   called exactly once at its declared static progress and never again.
   ========================================================================== */

(function (global) {
  'use strict';

  var reduceQuery = global.matchMedia('(prefers-reduced-motion: reduce)');
  var scenes = [];
  var handlers = Object.create(null);
  var ticking = false;

  /* --- Expression evaluation -------------------------------------------- */

  function docTop(el) {
    var top = 0;
    while (el) { top += el.offsetTop; el = el.offsetParent; }
    return top;
  }

  /* Resolve one `a<N><prop>` or bare `<prop>` token against the anchor list. */
  function anchorValue(token, anchors) {
    var index = 0;
    var prop = token;
    var indexed = /^a(\d+)([tbh])$/.exec(token);

    if (indexed) {
      index = parseInt(indexed[1], 10);
      prop = indexed[2];
    }

    var el = anchors[index];
    if (!el) return 0;

    var top = docTop(el);
    if (prop === 't') return top;
    if (prop === 'h') return el.offsetHeight;
    if (prop === 'b') return top + el.offsetHeight;
    return 0;
  }

  /* "a0t + a1h - 200vh" -> a pixel offset. Left-to-right, + and - only, which
     is all the grammar has. Re-evaluated on resize rather than cached. */
  function evaluate(expression, anchors) {
    var parts = String(expression).replace(/\s+/g, ' ').trim().split(' ');
    var total = 0;
    var sign = 1;

    for (var i = 0; i < parts.length; i++) {
      var token = parts[i];
      if (token === '+') { sign = 1; continue; }
      if (token === '-') { sign = -1; continue; }

      var value;
      var vh = /^(-?[\d.]+)vh$/.exec(token);
      var px = /^(-?[\d.]+)(px)?$/.exec(token);

      if (vh) {
        value = parseFloat(vh[1]) / 100 * global.innerHeight;
      } else if (px && token !== '') {
        value = parseFloat(px[1]);
      } else {
        value = anchorValue(token, anchors);
      }

      total += sign * value;
      sign = 1;
    }
    return total;
  }

  /* --- Registration ------------------------------------------------------ */

  /* handler(progress, element) — progress is 0..1, clamped, and runs backwards
     when the reader scrolls backwards. staticProgress is what it is called with
     once under prefers-reduced-motion: the scene's narrative peak, never 0. */
  function scene(name, handler, staticProgress) {
    handlers[name] = {
      run: handler,
      still: typeof staticProgress === 'number' ? staticProgress : 1
    };
  }

  function collect() {
    scenes = [];
    var nodes = document.querySelectorAll('[data-scene][data-keyframe]');

    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var handler = handlers[el.getAttribute('data-scene')];
      if (!handler) continue;

      var keyframe;
      try {
        keyframe = JSON.parse(el.getAttribute('data-keyframe'));
      } catch (err) {
        continue;   /* a malformed attribute disables its own scene, nothing else */
      }

      if (keyframe.disabledWhen === 'no-enhance') continue;

      var anchors = [el];
      if (keyframe.anchors) {
        anchors = [];
        for (var a = 0; a < keyframe.anchors.length; a++) {
          anchors.push(document.querySelector(keyframe.anchors[a]));
        }
      }

      scenes.push({
        el: el,
        handler: handler,
        anchors: anchors,
        startExpr: keyframe.start || 't',
        endExpr: keyframe.end || 'b',
        start: 0,
        end: 0,
        last: -1
      });
    }
    measure();
  }

  function measure() {
    for (var i = 0; i < scenes.length; i++) {
      var s = scenes[i];
      s.start = evaluate(s.startExpr, s.anchors);
      s.end = evaluate(s.endExpr, s.anchors);
      if (s.end <= s.start) s.end = s.start + 1;
      s.last = -1;   /* force a redraw at the new geometry */
    }
  }

  function frame() {
    ticking = false;
    var y = global.scrollY || global.pageYOffset;

    for (var i = 0; i < scenes.length; i++) {
      var s = scenes[i];
      var p = (y - s.start) / (s.end - s.start);
      if (p < 0) p = 0;
      if (p > 1) p = 1;

      /* Skip sub-pixel repeats; a scene that has settled at 0 or 1 still gets
         its one final write so it never stalls a fraction short. */
      if (Math.abs(p - s.last) < 0.0005) continue;
      s.last = p;
      s.handler.run(p, s.el);
    }
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    global.requestAnimationFrame(frame);
  }

  /* --- Start ------------------------------------------------------------- */

  function start() {
    if (reduceQuery.matches) {
      /* Every scene at its narrative peak, once. No listeners are attached, so
         nothing is scrubbed, slowed, or played back at a reduced amplitude. */
      var nodes = document.querySelectorAll('[data-scene]');
      for (var i = 0; i < nodes.length; i++) {
        var h = handlers[nodes[i].getAttribute('data-scene')];
        if (h) h.run(h.still, nodes[i]);
      }
      document.documentElement.setAttribute('data-motion', 'still');
      return;
    }

    document.documentElement.setAttribute('data-motion', 'scrub');
    collect();
    frame();

    global.addEventListener('scroll', onScroll, { passive: true });
    global.addEventListener('resize', function () { measure(); onScroll(); });
    global.addEventListener('load', function () { measure(); onScroll(); });
  }

  /* A change of preference mid-session re-runs the decision rather than
     leaving the page in whichever mode it happened to load in. */
  if (reduceQuery.addEventListener) {
    reduceQuery.addEventListener('change', function () { global.location.reload(); });
  }

  global.Scrub = { scene: scene, start: start, evaluate: evaluate };
}(window));
