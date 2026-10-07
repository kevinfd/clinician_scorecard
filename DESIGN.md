---
name: Clinician Scorecard
description: A surgeon performance cockpit in the NeuroScore family. Slate canvas, white bordered cards, a teal accent for you and for action, violet for external references, and a guided tour for every user journey.
colors:
  canvas: "#f8fafc"        # slate-50
  card: "#ffffff"
  border: "#e2e8f0"        # slate-200
  divider: "#f1f5f9"       # slate-100
  ink: "#0f172a"           # slate-900, headings and values
  body: "#334155"          # slate-700
  muted: "#64748b"         # slate-500
  faint: "#94a3b8"         # slate-400, footers and captions
  accent: "#0d9488"        # teal-600, you, links, primary action
  accent-soft: "#f0fdfa"   # teal-50
  accent-bright: "#2dd4bf" # teal-400, selection wash (25%) and the tour spotlight pulse (45%)
  reference: "#7c3aed"     # violet-600, MGB average, Vizient, restated points
  disputed-wash: "#fffbeb" # amber-50 with amber-200 ring, amber-900 text
  sustained-wash: "#ecfdf5" # emerald-50 with emerald-200 ring, emerald-900 text
  brand-tile: "#0f172a"
typography:
  family: "Geist Sans (self-hosted by the geist package), Geist Mono for record ids and the email"
  page-title: "24px / 600 / tracking-tight"
  card-title: "15px / 600"
  metric-value: "26px on cards, 36px on the metric page / 600 / tabular"
  body: "13 to 15px / 400"
  label: "11px / 500 / uppercase / 0.05em tracking, used only as a label inside a card or above a page title"
rounded:
  card: "12px"
  control: "8px"
  chip: "6px"
spacing: "Tailwind 4px scale; cards p-4 to p-6; grids gap-4 to gap-6; sections gap-8"
---

# Design System: Clinician Scorecard

## Revision 2 (29 September 2026)

The first seed of this file ("The OR list and the pen": ruled rows, one ink, no cards) was replaced at the product owner's direction. The owner asked for a more appealing interface in the style of NeuroScore (`kevinfd/neuro-score`), with a better logo, section names instead of "Bucket 1 to 6", and a guided walkthrough of each user journey. The brief wins: this revision adopts NeuroScore's visual family and keeps every product rule that was not visual.

### Pre-demo changes (7 October 2026)

- Disputes hidden behind a flag; no dispute wording on any page, tour or email while it is off.
- Demo cast of six in the home list and the switcher; the other clinicians are anonymous peers only.
- Advanced practice providers: a "Provider scorecard" label, only the measures that apply, and a one-line note under Volume and mix saying what is left off and why.
- Department view: the same cards, tables and sparklines as the scorecard; anonymous dot plots (teal dots, violet dashed median) for spread of practice; reading chips stay neutral, teal or amber, never red or green.

## What carried over unchanged

These are product rules, not styling, and the redesign keeps all of them:

- **The screen says why.** A number that cannot be shown is replaced by its reason in words, in the value's place, never a blank or a zero.
- **Counts with rates.** A rate is shown with its count ("9 of 15 first cases on time").
- **No verdict colors.** There are no percentile bands, no traffic lights, no rank. Amber and emerald appear only as dispute-state washes behind words, never on a value.
- **Anonymous peers.** Peers are hollow slate marks with no labels; only "You" is labeled.
- **Every chart has a text equivalent** on the page (a sentence, sorted values, or a table).
- **44px targets** for primary controls, visible focus rings, and tabular numbers wherever a value sits.

## Brand

**Mark.** A navy rounded tile (#0f172a) holding an open "C" drawn as a gradient arc (mint #6ee7b7 to teal #0d9488) that ends in a mint dot, cradling three rising bars. The C is the clinician; the dot is the point where a number meets its record; the bars are the six areas read as one small chart. It is the NeuroScore construction (navy tile, gradient stroke, terminal dot) with its own letter and meaning. Source: `src/components/Logo.tsx`, favicon `app/icon.svg`.

**Wordmark.** "Clinician Scorecard" in Geist 15px semibold, with the line "Every number, every record" in 9px tracked uppercase from 1280px up.

## Layout

- Sticky white top bar: mark and wordmark, role-aware links, a synthetic-data chip, a Tours link, and the identity switcher (avatar, name, role).
- Page canvas slate-50, content up to 1400px (reading pages 1024px), 16px side padding on phones and 24px from 640px.
- Pages open with a small label, a 24px title and one line of context, then cards.
- The scorecard groups metrics under plain section names: Volume and mix, Efficiency, Access, Quality and outcomes, Patient experience, Citizenship. Four cards per row on wide screens, two on tablets, one on phones.

## Components

- **Metric card** (`MetricCard.tsx`): name, a large value with a teal sparkline, one detail line (count, interval, denominator), an optional violet reference line, and a footer with the period, record count and comparison group. The whole card links to the metric page. A reason card shows an info icon and the reason sentence in the value's place; a muted reason (not applicable, source pending) is slate-500.
- **Card** (`ui.tsx`): white, 1px slate-200 border, 12px radius, no shadow at rest; a hover lifts to `shadow-sm` only on links.
- **Chip and state pill**: 6px radius, a 1px ring and a wash; the words carry the state.
- **Table**: white card, slate-50 header with 11px uppercase labels, slate-100 row dividers, tabular numbers, record ids in Geist Mono.
- **Buttons**: teal primary, violet primary (the dispute journey only), white secondary with a slate border, and ghost.
- **Charts** (`Charts.tsx`): the strip plot (hollow slate peers, a teal "You" square and label), the trend (teal line, soft teal area, violet diamonds for restated points), wRVU bars (teal this year, slate last year), and survey bars (slate peers, a teal "You" bar, a dashed violet MGB average). Each renders at 360, 760 and 1240 native widths so labels stay 12 to 14px on screen.

## Guided tours

Tours launched from the home page or the Tours link: Month posted (12 steps), A clinic provider's month (9), What patients said (8), The department at a glance (8) and Close the month (6). Dispute a record (10) returns when `ENABLE_DISPUTES=true`. An odd last card spans both columns. A step spotlights a `data-tour` element, dims and blocks everything else, and shows a card with the step title, body, an optional call to action and progress dots. Tours switch identity when the journey changes hands (surgeon to chief to another surgeon) through `/tour/go`. Keyboard: arrows move, Escape ends. Definitions live in `src/lib/tours.ts`.

## Motion

Card hover transitions (150ms), the tour card fade-in (160ms) and spotlight pulse, and one rise-in for the dispute acknowledgement and decision confirmation. All are removed under `prefers-reduced-motion`.

## Do's and Don'ts

- **Do** put the reason in the value's place when a number is withheld.
- **Do** keep teal for "you" and for action, and violet for external references.
- **Do** name sections by what they are. Never "Bucket 1".
- **Don't** add percentile bands, rank badges, or green/red coloring of a value.
- **Don't** label any peer mark or bar.
- **Don't** put a count or badge on the patient feedback inbox.
