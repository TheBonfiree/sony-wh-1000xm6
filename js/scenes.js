/* ==========================================================================
   scenes.js — the three scrubbed scenes, plus the proof module's tab list.

   Motion budget, from DESIGN.md: 3 scrubbed scenes, 0 raster frame sequences,
   no animation library. Every transform below is written inline each frame;
   there is not a single `.reveal` / `.in-view` / `.animate-in` class on this
   page, which is the register's actual tell.

   Each scene declares the static progress it holds at under
   prefers-reduced-motion — the frame at its narrative peak, never the start.
   ========================================================================== */

(function () {
  'use strict';

  var $  = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  /* Progress remapped into a sub-range, clamped. Used to stagger one scene's
     internal beats without registering three scenes for one stage. */
  function span(p, from, to) {
    if (to === from) return p >= to ? 1 : 0;
    var v = (p - from) / (to - from);
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }


  /* ======================================================================
     Scene 1 — Hero: the right earcup assembles.
     Narrative peak is 0.42, not 1: partially separated is the frame that
     shows both the finished product and the driver inside it.
     ====================================================================== */

  var band = document.getElementById('hero-band');
  var bandLength = 0;
  if (band && band.getTotalLength) {
    bandLength = band.getTotalLength();
    band.style.strokeDasharray = bandLength;
  }

  var heroParts = {
    rig:     document.getElementById('hero-rig'),
    pad:     document.getElementById('hero-layer-pad'),
    baffle:  document.getElementById('hero-layer-baffle'),
    driver:  document.getElementById('hero-layer-driver'),
    notePad:    document.getElementById('hero-note-pad'),
    noteBaffle: document.getElementById('hero-note-baffle'),
    noteDriver: document.getElementById('hero-note-driver'),
    notes:   document.getElementById('hero-annotations')
  };

  window.Scrub.scene('hero', function (p) {
    var e = easeOut(p);

    /* The ground runs on the same clock as the assembly: the counter-wave is
       applied as the processor comes together, and the field goes flat as the
       product closes. One authored moment, not two. */
    if (window.Field) window.Field.setProgress(p);

    /* The three inner layers converge, each on its own staggered window so
       they arrive one after another rather than bunching into a single blob.
       Offsets are picked so nothing leaves the 1200-unit viewBox at p = 0:
       the driver's furthest point is 870 + 430 − 190 = 1110. */
    var padDX    = 170 * (1 - easeOut(span(p, 0.00, 0.60)));
    var baffleDX = 300 * (1 - easeOut(span(p, 0.10, 0.75)));
    var driverDX = 430 * (1 - easeOut(span(p, 0.20, 0.90)));
    /* The whole rig drifts back to centre as the parts come home. */
    var rigDX    = -190 * (1 - e);

    if (heroParts.rig)    heroParts.rig.setAttribute('transform', 'translate(' + rigDX.toFixed(2) + ' 0)');
    if (heroParts.pad)    heroParts.pad.setAttribute('transform', 'translate(' + padDX.toFixed(2) + ' 0)');
    if (heroParts.baffle) heroParts.baffle.setAttribute('transform', 'translate(' + baffleDX.toFixed(2) + ' 0)');
    if (heroParts.driver) heroParts.driver.setAttribute('transform', 'translate(' + driverDX.toFixed(2) + ' 0)');

    /* The headband draws on early, so the static peak frame is never a
       half-finished stroke. */
    if (band && bandLength) {
      band.style.strokeDashoffset = (bandLength * (1 - span(p, 0, 0.25))).toFixed(2);
    }

    /* Annotations track their layer, then leave once the diagram closes. */
    if (heroParts.notePad)    heroParts.notePad.setAttribute('transform', 'translate(' + padDX.toFixed(2) + ' 0)');
    if (heroParts.noteBaffle) heroParts.noteBaffle.setAttribute('transform', 'translate(' + baffleDX.toFixed(2) + ' 28)');
    if (heroParts.noteDriver) heroParts.noteDriver.setAttribute('transform', 'translate(' + driverDX.toFixed(2) + ' 56)');
    if (heroParts.notes)      heroParts.notes.style.opacity = (1 - span(p, 0.45, 0.78)).toFixed(3);
  }, 0.42);


  /* ======================================================================
     Scene 2 — Sticky spec stage: the camera crosses the earcup.
     Starts tight on the control surface, pulls back onto the microphone ring.
     ====================================================================== */

  var stage = {
    camera: document.getElementById('stage-camera'),
    touch:  document.getElementById('stage-touch'),
    mics:   document.getElementById('stage-mics'),
    subA:   document.getElementById('stage-sub-touch'),
    subB:   document.getElementById('stage-sub-mics')
  };

  window.Scrub.scene('stage', function (p) {
    var e = easeOut(p);
    var scale = 1.55 - 0.55 * e;
    var lift  = 46 * (1 - e);

    if (stage.camera) {
      stage.camera.setAttribute('transform',
        'translate(0 ' + lift.toFixed(2) + ') scale(' + scale.toFixed(4) + ')');
    }
    if (stage.touch) stage.touch.style.opacity = (1 - 0.62 * span(p, 0.30, 0.62)).toFixed(3);
    if (stage.mics)  stage.mics.style.opacity  = (0.18 + 0.82 * span(p, 0.32, 0.70)).toFixed(3);

    /* The two labelled sub-sections cross-fade rather than stack. Under
       reduced motion the CSS forces both to opacity 1 and static position, so
       these writes are inert there. */
    if (stage.subA) stage.subA.style.opacity = (1 - span(p, 0.34, 0.50)).toFixed(3);
    if (stage.subB) stage.subB.style.opacity = span(p, 0.50, 0.66).toFixed(3);
  }, 1);


  /* ======================================================================
     Scene 3 — Proof bars.
     Scrubbed rather than triggered, because the reader can scroll them
     backwards. The datum stays in data-bar-width on the mask; this only maps
     it to a width. The inner track is sized in pixels so the ramp keeps its
     full span on every bar instead of compressing into the short ones.
     ====================================================================== */

  var proof = $('.proof');
  var barProgress = 0;

  function paintBars() {
    if (!proof) return;
    $$('.panel', proof).forEach(function (panel) {
      var rows = $$('.bar-row', panel);
      var max = 0;
      rows.forEach(function (row) {
        var v = parseFloat($('.bar-mask', row).getAttribute('data-bar-width')) || 0;
        if (v > max) max = v;
      });
      if (!max) return;

      /* One track width for the whole panel, taken from the widest row. The
         rows' own containers differ by a few pixels because the badge column
         is max-content, and a per-row track would give each bar its own ramp
         scale — which is exactly the thing the single ramp is meant to avoid. */
      var track = 0;
      rows.forEach(function (row) {
        var c = $('.bar-content-container', row);
        if (c && c.offsetWidth > track) track = c.offsetWidth;
      });

      rows.forEach(function (row) {
        var mask = $('.bar-mask', row);
        var bar  = $('.bar', row);
        var v    = parseFloat(mask.getAttribute('data-bar-width')) || 0;
        var full = (v / max) * 100;

        /* Hidden panels report zero width; leave their track alone until they
           are shown, or the ramp collapses to nothing. */
        if (track) bar.style.width = track + 'px';
        mask.style.width = (full * barProgress).toFixed(2) + '%';
      });
    });
  }

  window.Scrub.scene('bars', function (p) {
    barProgress = p;
    paintBars();
  }, 1);

  window.addEventListener('resize', paintBars);


  /* ======================================================================
     Proof module tab list.
     ul[role="tablist"] with a[role="tab"], tabindex 0 on current and -1 on the
     rest. Arrow keys move, Home and End jump, the panel follows.
     ====================================================================== */

  var tabs = $$('[role="tab"]', proof);

  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var panel = document.getElementById(t.getAttribute('aria-controls'));
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.setAttribute('tabindex', on ? '0' : '-1');
      if (panel) panel.hidden = !on;
    });
    if (focus) tab.focus();
    /* The newly shown panel has a measurable width only now. */
    paintBars();
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function (event) {
      event.preventDefault();
      selectTab(tab, false);
    });

    tab.addEventListener('keydown', function (event) {
      var next = null;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = tabs[(i + 1) % tabs.length];
      if (event.key === 'ArrowLeft'  || event.key === 'ArrowUp')   next = tabs[(i - 1 + tabs.length) % tabs.length];
      if (event.key === 'Home') next = tabs[0];
      if (event.key === 'End')  next = tabs[tabs.length - 1];
      if (!next) return;
      event.preventDefault();
      selectTab(next, true);
    });
  });


  /* ====================================================================== */

  if (window.Field) window.Field.mount(document.getElementById('field-wrap'));

  window.Scrub.start();

  /* Fonts land after first paint and change the track width under the bars. */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(paintBars);
  }
}());
