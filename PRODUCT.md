# Product

A single-surface marketing page for the Sony WH-1000XM6 wireless noise-cancelling headphones, built
as an **independent design exercise** — not affiliated with, endorsed by, or produced for Sony Group
Corporation. The product truth below is Sony's, sourced and footnoted on the page itself; the design
is not.

## Platform

`web` — a static single page. No framework, no bundler, no runtime dependencies.

## Stack

Hand-written HTML, CSS and ES5-compatible JavaScript. Two stylesheets (`css/tokens.css`,
`css/page.css`) and two scripts (`js/scrub.js`, `js/scenes.js`). Inter variable is the only external
request; the page degrades to `system-ui` offline. Served with `py -m http.server`.

## Users

Someone deciding between flagship over-ear noise-cancelling headphones who has already narrowed the
field and now wants evidence: what changed since the previous model, whether the improvement is
measured or asserted, and what the specification actually says. They are comparison-shopping with
other tabs open, and they are sceptical of unattributed multipliers.

## Product Purpose

Persuade by evidence. The visitor's success is deciding — either to buy or to rule the product out —
on figures they can trace, rather than on adjectives.

## Positioning

The claim is not "premium sound". It is **measured against a named baseline**: the QN3 processor
against the QN1 in the WH-1000XM5, twelve microphones against eight, USB PD quick charge against a
standard supply. Everything the page asserts numerically it also cites, including where the citation
is secondary rather than from Sony directly.

## Operating Context

Desktop and mobile browsers, cold visit, no session state. Nothing is personalised, nothing is
stored, no analytics. The page must be fully readable with JavaScript disabled — a `<noscript>`
block flattens every scene to its end state.

## Capabilities and Constraints

- **One conversion goal**, three placements: sticky local nav, specification sheet, footer. No
  second competing ask.
- **No product photography exists** for this build, and none is licensed. Both product views are
  hand-drawn inline SVG, which is also what makes them scriptable.
- **Every numeric claim must be footnotable.** A claim that cannot cite a source and, where one is
  published, a method, does not appear as a figure — it is demoted to copy or dropped.
- **The proof module needs a named baseline.** Without one it would not ship at all.
- Not published to a shared URL: a page carrying Sony's name and claims would function as an
  imitation of a real company's marketing.

## Brand Commitments

Product names are reproduced exactly as Sony publishes them — *HD Noise Cancelling Processor QN3*,
*Adaptive NC Optimizer*, *DSEE Extreme*, *360 Reality Audio*, *360 Upmix for Cinema*,
*Scene-based Listening*, *Speak-to-Chat*. Names Sony does not use are not invented: "Cinematic
Sound" was rejected during research because the real feature name is *360 Upmix for Cinema*.

## Evidence on Hand

Sony Help Guide specifications and operating times; Sony's US press release of 15 May 2025;
Engadget and Notebookcheck for the QN1 baseline attribution that Sony's US release omits. The full
claim-by-claim table with source classes is in `DESIGN.md` under **Content truth**, and the page's
own disclaimer block repeats it for the reader.

Deliberately excluded as unverified: ear-cushion material, any dB figure for ANC improvement, and
the $459.99 MSRP variant.

## Product Principles

1. **A multiplier without a baseline is not evidence.** Show the configuration it was measured from,
   at 1.0×, next to it.
2. **Cite the weaker link out loud.** Where Sony states "seven times faster than the previous model"
   without naming the chip, the page says so and attributes the QN1 identification to the reviews
   that carried it.
3. **Cut rather than fill.** A section whose question has no honest answer is removed, not padded —
   which is why the proof module runs two bars per tab and why there is no two-product comparison.
4. **Motion is operated, not played.** Scenes are scrubbed, so scroll position is the timeline and
   the reader controls it in both directions.

## Accessibility & Inclusion

- WCAG 2.2 AA is the floor. Every gradient stop that fills type clears 4.5:1 against its ground;
  muted text below 24px uses `#6e6e73` rather than the reference token's lighter grey.
- `prefers-reduced-motion: reduce` is decided per effect at build time, in JavaScript — each scene
  is called once at its narrative peak and no scroll listener is attached.
- The tab list is a real tab list: arrow keys, Home and End, roving `tabindex`.
- One `<h1>`, complete heading order, one link per card, no interactive node nested inside an anchor.
- Both SVGs carry `<title>` and `<desc>`; decorative geometry is `aria-hidden`.
- Footnote markers carry `aria-label="Footnote N"` and resolve to a real in-page target.
