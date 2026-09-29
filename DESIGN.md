---
name: Clinician Scorecard
description: The OR list and the pen. A per-surgeon metrics viewer set as a printed case list with dated, attributed annotations.
colors:
  ink: "#1b2130"
  ink-muted: "#4f5868"
  rule: "#6f7887"
  hairline: "#c9ced6"
  surface: "#f6f7f9"
  panel: "#eceef2"
  paper: "#ffffff"
  pen: "#0b5c6b"
  pen-on-dark: "#5cc3d4"
  disputed-ink: "#6b4200"
  disputed-wash: "#fbf1dc"
  sustained-ink: "#1d5a2e"
  sustained-wash: "#e4f2e7"
  night-surface: "#151a22"
  night-panel: "#1d232d"
  night-ink: "#e6e9ee"
  night-ink-muted: "#a6adba"
  night-rule: "#6b7482"
  night-hairline: "#3a4250"
  night-disputed-ink: "#f2c46a"
  night-disputed-wash: "#3a2a08"
  night-sustained-ink: "#8fd6a1"
  night-sustained-wash: "#10301a"
typography:
  headline:
    fontFamily: "Atkinson Hyperlegible Next, Atkinson Hyperlegible, Source Sans 3, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Atkinson Hyperlegible Next, Atkinson Hyperlegible, Source Sans 3, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "normal"
  value:
    fontFamily: "Atkinson Hyperlegible Next, Atkinson Hyperlegible, Source Sans 3, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "normal"
    fontFeature: "tnum, zero"
  body:
    fontFamily: "Atkinson Hyperlegible Next, Atkinson Hyperlegible, Source Sans 3, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Atkinson Hyperlegible Next, Atkinson Hyperlegible, Source Sans 3, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  none: "0px"
  control: "2px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
  section: "48px"
components:
  button-primary:
    backgroundColor: "{colors.pen}"
    textColor: "{colors.paper}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "10px 20px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "10px 20px"
    height: "44px"
  button-secondary-hover:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
  input-text:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
    height: "44px"
  tile-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "12px 0"
  state-disputed:
    backgroundColor: "{colors.disputed-wash}"
    textColor: "{colors.disputed-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "2px 6px"
  state-sustained:
    backgroundColor: "{colors.sustained-wash}"
    textColor: "{colors.sustained-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "2px 6px"
  page-banner:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "16px"
  stamp-header:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "12px 16px"
---

<!-- SEED: established by /impeccable new-work on 2026-09-29 before implementation, with no human present and a degraded direction roll (seed key 20b5df25, no challengers). Tokens are provisional until the human approves a face and an accent (PRD R-120, OQ-63); re-run /impeccable document once there is code to capture the actual tokens and components. -->

# Design System: Clinician Scorecard

## Overview

**Creative North Star: "The OR list and the pen"**

Every surgeon reads one printed object every working day: the OR list. Room, time, surgeon, procedure, in fixed columns under a stamped date, one case per line, pinned at the front desk and folded into a pocket. When a case moves or cancels, someone writes on it: a line through the row, a reason, initials, a time. Nobody mistakes the sheet for a verdict; it is the record of the day, and the pen marks are what people did to it afterwards.

This product is that sheet for a month. The machine prints the list in one neutral ink: the stamp (who, period, site, last refreshed), the totals line, the rows, the definitions. A second ink, the pen, is reserved for what a person did: filed a dispute, decided it, wrote a note, marked "You". The pen never decorates. Suppression reasons are printed, not written: they sit in the value position in the same ink and size as a value, because "Not shown: 3 first cases this month; needs at least 4" is the day's information, not an error.

The direction was chosen for a clinical operations tool read on a desk by day and on a phone at night by tired surgeons who may dispute what they see. Familiarity is a feature here (Operate mode): the interface should disappear into the task, and its brand lives in precise details: the stamp, the ruled rows, tabular figures, the annotation clause, one restrained pen colour. The two ruts this category ships, the KPI dashboard of cards with sparklines and coloured deltas, and the soft coaching app with progress rings, are refused. The roll landed on the OR list (candidate 6 of 7 on the grounded list); the top-ranked candidate, the lab report, donated its reference-range discipline to the spread, and the operative note donated its addendum rule (append, date, sign; never edit) to overrides and restatements. Both raises are visible below as named rules.

**Key Characteristics:**
- Two inks: printed neutral for the record, one pen colour for human acts.
- Rows, never cards. Hairline rules, no borders, no shadows, no icons.
- Tabular figures wherever a number sits; every value with its denominator.
- The reason in the value's place, at the value's size.
- Annotations as dated, attributed clauses; nothing is edited, only appended.
- One authored motion in the whole app; none in email.
- Light paper by day; a true night scheme for a phone in a dark room.

## Colors

A cool-tinted neutral ramp for the printed sheet, one teal-ink pen, and two washes for the two decided dispute states; nothing else carries meaning by colour.

### Primary
- **Pen** (#0b5c6b): the only accent. Links, the focus ring, the primary button, and the label text of what a person wrote: the "You" label on a spread, the dispute state words on a row, the decider clause on a decision, the note's date. 7.1:1 on Surface. Rare by rule (see The Second Ink Rule).
- **Pen on dark** (#5cc3d4): the same role in the night scheme; 8.5:1 on Night surface.

### Neutral
- **Ink** (#1b2130): every value, heading, row and reason. 15:1 on Surface. Suppression reasons use Ink, never Ink muted.
- **Ink muted** (#4f5868): the small line under a tile (records count, comparator), provenance lines, table captions, "Not applicable", "Data source pending confirmation", "Not in this release", "opted out". 6.7:1 on Surface; 6.2:1 on Panel.
- **Rule** (#6f7887): chart strokes, the trend line, peer circle outlines, interval bars. 4.2:1 on Surface, above the 3:1 stroke floor.
- **Hairline** (#c9ced6): 1 px rules between tile rows and table rows, the rule under a table header, the boundary of the stamp header. Decorative only; never carries a state.
- **Surface** (#f6f7f9): the page. Slightly cool, so white paper reads as the second layer.
- **Panel** (#eceef2): the stamp header, the what-changed aside, page-state banners, the provenance panel. A second neutral layer, cooler than the surface.
- **Paper** (#ffffff): inputs, buttons' secondary face, the record detail sheet, the inbox comment block.

### Semantic states
- **Disputed** (#6b4200 on #fbf1dc): the dispute-state cell on a row while a dispute is open or after a "not sustained" decision; the words carry the state ("Disputed - with chief, filed 14 Nov 2026"). 7.8:1.
- **Sustained** (#1d5a2e on #e4f2e7): the dispute-state cell after "Dispute sustained (annotated)" or "(source corrected)". 7.1:1.
- **Not sustained**: Disputed wash with the words "Dispute not sustained by <role> on <date>". No third colour; the decision text is the difference.
- **Suppressed** (min-n, peer-under-five): Ink, value size, no wash, no icon, no italic. Information, not error.
- **Not applicable, Pending source, Not in this release, Opted out, Not attended**: Ink muted, value size, no wash.
- **Restated**: no colour. A filled diamond marker on the trend point plus the word "restated" in the text table and on the row.
- **Page error** (`load-failure`, `not-authorized`, `session-expired`): Panel banner in Ink. No red anywhere in the system.

### Night scheme
Declared with `color-scheme: light dark` and `@media (prefers-color-scheme: dark)`, redefining the same token names: Night surface (#151a22), Night panel (#1d232d), Night ink (#e6e9ee, 14.4:1), Night ink muted (#a6adba, 7.7:1), Night rule (#6b7482, 3.7:1), Night hairline (#3a4250), Pen on dark, Night disputed (#f2c46a on #3a2a08, 8.5:1), Night sustained (#8fd6a1 on #10301a, 8.4:1). Assumption (reverses the design review's deferral): the use scene includes a phone in a dark call room, so the night scheme ships with M2 rather than later; it costs one token block. Confirm with the human.

### Named Rules
**The Second Ink Rule.** Pen appears only on links, focus, the one primary button per page, and the words of a human act (dispute state, decision, note date, "You"). Never on a value, a heading, a chart stroke, a hairline or a background. If more than roughly 5% of a page is Pen, something is being decorated.

**The Printed Reason Rule.** A suppression reason is set in Ink at value size in the value's position. Grey, italic, a smaller size, an icon or a wash would turn information into an apology.

**The No Red Rule.** No red, orange or green carries a verdict. Disputed and Sustained are washes behind words; the words are the state. A page error is a Panel banner in Ink.

## Typography

**Text Font:** Atkinson Hyperlegible Next (with Atkinson Hyperlegible, then Source Sans 3, then sans-serif), self-hosted under `web/static/fonts/` with licence and hash (the CSP forbids a CDN).
**Display Font:** none. One family carries headings, values, labels, body and data (Operate mode).
**Mono Font:** none. Case ids (C-7K3Q9M) set in the text face with tabular figures and slashed zero; monospace would be a costume.

**Character:** a humanist sans built by the Braille Institute to keep 1, l and I, 0 and O, 3 and 8 apart at small sizes and low contrast. Chosen because the product's most consequential strings are identifiers and denominators read on a phone by tired eyes at night, and because an identifier misread by one glyph files a dispute on the wrong case. It is not Inter, Arial or the system stack (which would read as an unfinished intranet page) and it is not IBM Plex Sans (the design review's proposal; Plex is one of the faces a model reaches for by default and no reason here demands it; the tabular figures Plex offered are available in this face). Verification at M2: confirm the self-hosted build exposes `tnum` and `zero`; if it does not, numeric cells fall to Source Sans 3 (OFL, tabular figures confirmed) and this file is amended.

### Hierarchy
- **Headline** (600, 1.75rem / 28px, 1.2): the page `h1` only ("First-case on-time start (FCOT)", "Dispute on case C-7K3Q9M"). One per page.
- **Title** (600, 1.25rem / 20px, 1.25): `h2` bucket headings and `h3` tile names on bucket pages.
- **Value** (500, 1.125rem / 18px, 1.3, `tnum zero`): every metric value and every reason in the value position; the "You <value>" label; the row count in a table caption.
- **Body** (400, 1rem / 16px, 1.5): everything else, including table cells. Never below 16px on a phone. Prose measure 65 to 72ch on Read pages (definitions, "what this is not", inbox comments).
- **Label** (400, 0.875rem / 14px, 1.4): the one small line under a tile (records and comparator) and provenance lines only. Never carries a state.

Scale ratio about 1.125 to 1.2 between steps, fixed rem, not fluid (Operate mode). Tabular figures (`font-variant-numeric: tabular-nums slashed-zero`) on every numeric cell, value, trend table and case id.

### Named Rules
**The Denominator Rule.** A rate is never set without its count: "5 of 7 first cases on time (71%)". The percentage is not larger than the count.

**The Stamp Rule.** Every page and every email begins with the same header in the same order: product, person, period and site, last refreshed. Body weight, not display. It is a stamp, not a hero.

## Layout

One column at 1100px maximum on desktop (1024px and up), centred, 24px side gutters; the same on tablet (768 to 1023px) with record tables scrolling inside their container and `case_id` and `date` sticky; one column at phone width (360 to 767px) with 16px gutters and no horizontal page scroll. Responsive behaviour is structural, not fluid type: tables re-order their columns (key columns first), the tile row moves its value above its name, the strip plot drops its axis labels to minimum, maximum and the surgeon's value.

Spacing scale: 4, 8, 12, 16, 24, 32, 48px. More space above a heading than below it: 24px above an `h2`, 8px below; 16px above an `h3`, 4px below; 48px between buckets. A tile row is 12px of vertical padding with a hairline beneath. Table rows are 8px of vertical padding, dense but readable; 120ch tables are acceptable inside their container.

Page anatomy, top to bottom: skip link; stamp header; nav; breadcrumb; `<main>` with one `h1`; the page's one object; its provenance; its history; footer with the "what this is not" line and the analyst mailbox. No sidebar. No card grid. Dense where the data is dense (record tables), quiet where it is read (definitions).

Density rules: home shows every live tile as one row and every dead bucket as one line; a metric page shows one tile expanded; a record list shows every row of the period without pagination in M2 (assumption; revisit above about 200 rows); an inbox shows every comment in the loaded months without a count.

## Elevation & Depth

Flat. No shadows anywhere. Depth is two neutral layers: Panel for the stamp header, asides, banners and the provenance panel; Paper for inputs, buttons and the record detail sheet; Surface for the page. A hairline rule marks a boundary; a wash marks a dispute state behind its words. Nothing lifts, glows or blurs.

### Named Rules
**The Ruled Sheet Rule.** Structure is drawn with 1px Hairline rules and Panel blocks, never with borders around groups, drop shadows or nested containers. A card inside a card does not exist here.

## Shapes

Rectangular. 0px radius on every block, table, panel and banner; 2px radius on buttons and text inputs so they read as controls and not as slabs. No pill, no circle except the 12px hollow peer marker on a strip plot; the surgeon's marker is a 12px filled square; the restated marker is a filled diamond. Icons do not exist in this system; every control is named in words.

## Components

Component names below are the names templates cite (PRD R-120). Each lists its character, its states and its exact treatment. Every interactive component has default, hover, focus, active and disabled; loading is the browser's own; error and empty are page-level words.

### Stamp header
- **Character:** the printed stamp at the top of every page and every email.
- **Treatment:** Panel block, Ink, Body; one line on desktop ("Clinician Scorecard · Dr. <Name> · October 2026 at <site> · last refreshed 12 November 2026" with the period as a `<select>` and a "Go" button); three lines at 360px.
- **States:** stale (last refreshed older than expected: the date is unchanged and the what-changed aside says the run was missed); no period (`no-period` banner replaces everything below the stamp).

### Navigation and breadcrumb
- **Treatment:** text links in Body, Pen underline offset 3px; the current section in Ink with `aria-current="page"` and a 2px Ink underline, never colour alone. Entries computed from the authorization matrix. Breadcrumb in Label, Ink muted, separated by " / ".
- **States:** hover (underline thickens to 2px); focus (ring); active section.

### What-changed aside
- **Treatment:** Panel block under the stamp, `<aside aria-labelledby>`, heading "What changed since September 2026" in Title; one line per change in Body; "No changes since September 2026" when empty. Month one: the orientation text instead.

### Bucket section and tile row
- **Character:** the totals line of the OR list. A tile is a row in a definition list, never a card.
- **Treatment:** `h2` bucket heading in Title; each tile a `<div>` pair: name (Body, Ink, a link) left, value (Value, tabular, Ink) right; beneath, one Label line in Ink muted: "Records: 19 rows · Compared to: subspecialty peers at your site (4 surgeons)". Hairline beneath each row. At 360px the value moves above the name on its own line.
- **States:** value; reason (same size, Ink, in the value position); both bases ("as logged 60% (6 of 10) · as adjudicated 67% (6 of 9)" on one line); interim ("Counted quarterly; the quarter closes 31 December 2026. Scheduled cases so far: 24."); not in this release, pending source, not applicable (Ink muted); restatement pending; dead bucket (one line: "Bucket 3 Access: 2 metrics, not in this release", a link).

### Value line, reason line, decomposition line
- **Value line:** Value size, tabular; count before percentage.
- **Reason line:** the catalogue sentence in the value position, Ink, Value size.
- **Decomposition line:** Body, Ink, directly under the FCOT or cancellation value: "Of the 2 late: 1 your delay, 1 not your delay (both counted under periop's definition)". Counts only; never a second rate.

### Records link, comparator line, definition stamp, source line
- **Records link:** "Records: 19 rows", Pen link, the line directly under the value on a metric page.
- **Comparator line:** Label, Ink muted: "Compared to: neurosurgeons at your site (9 surgeons)"; from month two followed by the spread.
- **Definition stamp:** Label, "Definition: institutional FCOT, version 1 (periop)", the version a link.
- **Source line:** Label, "Source: periop OR log · as of 12 November 2026" or the per-source text.

### Spread (strip plot)
- **Character:** the lab report's reference range, donated to this world: a horizontal strip in the metric's unit, no verdict.
- **Treatment:** inline SVG, full content width, one horizontal axis in Rule at 1.5px; peers as 12px hollow circles stroked in Rule, ties stacked vertically to a cap of four (a fifth tied value thickens the marker's stroke to 2.5px and the text table names the count, "4 peers at 75%"); the surgeon as a 12px filled square in Ink with the text label "You 71%" in Pen beside it; axis labels at minimum, maximum and the surgeon's value; the count sentence above in Body ("Neurosurgeons at your site: 7 peers, each with at least 4 first cases. Names are hidden, not people."); beneath, the three-line text ("You: 71%", "Peers: 43%, 57%, 60%, 67%, 75%, 80%, 86%") as the `aria-describedby` target. No peer label, tooltip or hover.
- **Screen-reader sentence (the chart's `<title>`):** "Your value 71% among 7 peers ranging from 43% to 86%." The visible three-line text carries the values.
- **States:** rendered; peer-under-five (the reason sentence replaces the chart; own value stays); opted out; not attended; month one ("spread from month two" on the comparator line, no chart). Six-peer fixture: six circles, one square, one "You" label, nothing else.

### Bucket 5 bar spread and interval dots
- **Bar spread:** ascending unlabelled bars in Rule fill at 60% opacity, the surgeon's bar hatched (Ink 45° hatch, 3px pitch) and labelled "You"; the count sentence above; "Peers:" and "You:" lines beneath.
- **Interval dots (O/E and rates):** one row per period; a horizontal interval bar in Rule 1.5px with 1px end caps; the point as a filled square; the peer median as a vertical hairline; "1.0 means exactly as expected; below 1.0 is better" above; "no evidence of difference from peers" as a sentence when it applies; never a bar of point estimates. Extreme intervals (0.04 to 9.3) draw on a log axis with the clip stated in the text table (assumption).

### Trend line with text table
- **Treatment:** inline SVG, Rule stroke 1.5px, points as 6px filled squares in Ink; restated points as filled diamonds; a version boundary as a vertical hairline with "v2 from 2027-01" in Label; a gap period as a break in the line. Beneath, always, a `<table>` with one dated row per point ("2026-10 | 71% | 5/7 | restated (dispute D-0014)"), the primary reading at phone width. `<title>`: "71% in October 2026, down from 86% in September 2026."
- **States:** history from <date> (fewer points, no zero fill); gap rows with their reason; restated; boundary.

### Ghost bars (Work RVUs — live tracker)
- **Treatment:** this year's monthly bars in Rule fill; last year's bars hatched in Ink muted behind them, offset 4px, with a legend entry "last year (hatched)"; the two most recent months carry a second hatched overlay "prior snapshot" and the note "as of 4 March 2027, may increase (prior snapshot 540, +20)" in the text table; "No peer comparison. No target." in Body above; the two sentences about the comp letter and the billing office in Body.

### Pace block (M&M attendance)
- **Treatment:** Value line "Attended 6 of 9 sessions held while on faculty and not on approved leave." then Body "3 sessions remaining. On pace for 8 of 12." One of three pace strings; the unreachable case reads "8 of 12 cannot be reached this year: 4 sessions remain and 5 are needed" in Ink, Value size, no colour (R-129: counts carry the flag; the earlier "Flag:" label is superseded). Cumulative attended against held as a trend line with its table; the session table beneath.

### Record table and record row
- **Character:** the OR list itself.
- **Treatment:** `<table>` with `<caption>` "First-case on-time start (FCOT), October 2026: 7 rows" in Value; `border-collapse`; header row Body 600 with a Hairline rule beneath; no zebra; 8px row padding; numerals right-aligned, tabular; the case id as `<th scope="row">` in the first column, never wrapping; `procedure` wraps within its cell (47-character names and longer are ordinary); `delay_reason` wraps; a blank reason renders "reason not recorded"; the dispute state as its own text column; the dispute button in the final column. Key columns first per R-121. Sortable headers are links with `aria-sort`; the sorted header carries a 2px Ink underline.
- **States:** rows; zero rows ("0 rows; the October extract loaded with no cases credited to you"); feed not received; suppressed metric (the heading reads "3 rows (Not shown: 3 first cases this month; needs at least 4)" and the table still renders); re-credited row ("not counted (re-credited)" in the counted column); shared flag as the word "shared"; disputed row (state cell washed).
- **Phone (360px):** `case_id`, `date`, `on_time`, `delay_reason`, dispute state, dispute button; the remaining columns follow in the same row and scroll inside the container; the dispute button is a 44px full-width control in the final column.

### Dispute state cell
- **Treatment:** Label inside a wash: Disputed wash for "Disputed - with chief, filed 14 Nov 2026" and "Dispute not sustained by division chief on 3 Dec 2026: <note>"; Sustained wash for "Dispute sustained (annotated) by division chief on 3 Dec 2026: <note>" and "(source corrected)"; "Withdrawn by you on <date>." and "correction requested at source, <date>" in Ink muted with no wash. The words carry the state; the wash is secondary.

### Dispute button
- **Treatment:** secondary button ("Dispute this record"), accessible name "Dispute this record C-7K3Q9M"; 44px high; full width at phone; repeated on the record detail page.
- **States:** default; hover (Panel face); focus (ring); active (Ink face, Paper text); disabled only when the record type has no disputable field, in which case the button is absent, not disabled (F-56 AC 1).

### Dispute form
- **Treatment:** one page, not a modal. Stamp header; `h1` "Dispute on case C-7K3Q9M"; the record's row as a two-column definition list; "Feeds: First-case on-time start (FCOT), October 2026"; the disputable field as radio buttons in plain words (delay reason / on time / not my case / something else), or as text when only one applies; the effect notice in a Panel block above the submit control ("A sustained delay-reason dispute corrects the reason on this row. The case stays late and your FCOT number does not move, so it still matches periop's report."); the claim as a `<textarea>` with a persistent label, the 1,000-character cap and the live count ("312 of 1,000"), and the no-identifiers line beneath; one primary button "File dispute"; a secondary link "Back to the records".
- **States:** default; validation (`claim-required`, `claim-too-long`, `claim-identifier` beside the field, input preserved, `aria-describedby`); `session-expired` banner; success (redirect to the dispute detail whose first line is `dispute-filed`).

### Effect notice
- **Treatment:** Panel block, Body, Ink, no icon; two sentences: what a sustained dispute does not change and what it does change.

### Provenance panel (adjudicator)
- **Treatment:** Panel block, a definition list: source and load date; attribution rule text; definition version; the stored value of the disputed field; metrics and period fed; shared flag; prior disputes. No metric value of anyone. For survey records, the comment position reads "Comment withheld: shown only to the direct leader of record" unless the viewer is that leader.

### Queue row and decision form
- **Queue:** a record table (Case id, Metric and period, Filed, Age in days, Route), oldest first; "past 14" appended as text to the age; no value of any surgeon; `queue-empty` sentence with the closed-list link when empty.
- **Decision form:** radio buttons (sustained / not sustained / definition question); outcome radios when sustained (annotated / source corrected); note `<textarea>` required, with cap and count; one primary button "Record decision"; success line `decision-recorded`; partial state "recompute did not complete; the analyst has been alerted" as a Panel banner.

### Definition page (Read)
- **Treatment:** 72ch measure, Body 1.5 line height; `h1` the metric name; the definition text verbatim in a Paper block; then What, Counted, Compared to, Shown as, You can move it by as `h3` Title with Body beneath; recorded assumptions with status; reason sets in force or the exact pending text; version history as a table; open items from disputes as a list with dates. The version in force is stated in the stamp; older versions keep rendering.

### Inbox item and private note (M4)
- **Inbox item:** Paper block per response; the survey month in Title; the four scores on one Body line above the comment ("Explained 2 of 5 · Listened 5 of 5 · Respect 5 of 5 · Would recommend: 6"); the comment in Body at 65 to 72ch, as a quotation, never in a table cell; "Dispute attribution" as a secondary button with the helper line "The comment cannot be disputed; only who it is credited to."; the dispute state cell when disputed. No count, badge, tally, sentiment or summary anywhere, including the nav entry and the `<title>`.
- **Private note:** beneath the comment, Label date in Pen, Body text, "edit" and "delete" as secondary links; "[ add a note ]" as a secondary button; `note-saved` line "Note saved 12 Feb 2027 14:02. Visible to you only."; `note-deleted`; `note-required` beside the field.
- **Leader view:** the same items, no notes, no note controls, no measures unless `leader_sees_measures`; the header line "Your direct leader (<name>) can read this inbox from <date>" on the surgeon's own inbox.

### Page-state banner
- **Treatment:** Panel block at the top of `<main>`, Body, Ink, no icon, no colour: `no-period`, `not-on-roster`, `not-authorized` (same bytes for not yours and not found), `load-failure` ("The page could not be loaded. Your data has not changed. Try again or contact <analyst mailbox>."), `leader-gate`, `period-not-published-for-you`, `session-expired`, `feed-held`. The banner is the page's `h1` region when nothing else can render.

### Buttons
- **Shape:** 2px radius; 44px minimum height; 20px horizontal padding; Body weight 500.
- **Primary:** Pen face, Paper text; hover Ink face; active Ink face with a 1px inset Paper rule; one per page ("File dispute", "Record decision", "Save note", "Go").
- **Secondary:** Paper face, 1px Ink border, Ink text; hover Panel face; active Ink face with Paper text.
- **Disabled:** Panel face, Ink muted text, no border; used only while a POST is in flight (the button is disabled by the form submission itself, no script required beyond the browser's own).

### Inputs
- **Text and textarea:** Paper face, 1px Rule border, 2px radius, 44px minimum height, persistent `<label for>` above in Body 600; helper text beneath in Label, Ink muted.
- **Focus:** the focus ring (below).
- **Error:** the message beneath the field in Body, Ink, prefixed by the field name ("Claim: your claim appears to contain a patient identifier (MRN pattern). Describe the record by its case id and what happened, then file again."); the border becomes 2px Ink. No red.
- **Select (period picker):** the browser's own `<select>` styled with the same border and height, inside a `<form>` with a secondary "Go" button.

### Focus ring
2px solid Pen, 2px offset, on every focusable element, via `:focus-visible`; never removed; on Panel and Paper alike. In the night scheme, Pen on dark.

### Browser surfaces
`::selection` Pen at 20% opacity; `caret-color` Pen; `scrollbar-color: var(--rule) var(--panel)` on scrolling containers; `text-underline-offset: 3px` on links; `font-variant-numeric: tabular-nums slashed-zero` on `td`, `.value` and `.case-id`. Under `@media (forced-colors: active)` tables, the dispute-state cell and the page banner gain 1px `CanvasText` borders and the "You" marker keeps its label, so structure and state survive Windows high-contrast mode. Long cells: `overflow-wrap: anywhere` on `procedure`, reason and claim cells; `white-space: nowrap` on the case id column only.

### Motion
One authored moment: on the dispute detail page reached after "File dispute", the first line (`dispute-filed`) settles in over 180ms, opacity 0 to 1 and 2px upward translate, `cubic-bezier(0.16, 1, 0.3, 1)` (exponential ease-out), from an already-visible default (the line is visible without the animation; the animation only adds the settle). Under `prefers-reduced-motion: reduce` there is no animation. Nothing else moves: no hover transitions beyond the browser's instant state change, no page-load sequence, no chart animation. Email has no motion.

### Email grammar (M1, plain text)
The world in plain text, fixed in PRD section 9.6 and repeated here as components a template cites: stamp (three header lines); block heading (upper-case line, blank line after); value line ("October: 5 of 7 first cases on time (71%)."); reason line; decomposition line; records line ("Records: 7 rows in the attachment under First-case on-time start (FCOT)"; never an engine key, R-126); comparator line; three-line spread (count sentence ending "Names are hidden, not people.", "You: 71%", "Peers: 43%, 57%, ..."); provenance line ("definition v1; source periop OR log; as of 12 November 2026"); trend row (`2026-10  71%  5/7` with `  restated <cause>` appended); record row (`C-7K3Q9M  2026-10-14  late  not your delay (anesthesia)`); annotation clause ("Dispute sustained (annotated) by division chief on 3 December 2026: delay reason corrected to anesthesia; correction requested at periop 12 December 2026."); reply template (Case id / What is wrong / What happened); footer. No ruler, no symbol run, no indentation past four spaces, lines at most 72 characters, one fact per line, the id first on every row. A row that must wrap continues on the next line indented two further spaces so a continuation cannot be read as a new row. Dates: ISO (`2026-10-14`, `2026-10`) on record and trend rows; prose ("12 November 2026", "October 2026") in sentences and the stamp.

## Do's and Don'ts

### Do:
- **Do** set every rate with its count: "5 of 7 first cases on time (71%)"; the count precedes the percentage (The Denominator Rule).
- **Do** render a suppression reason in Ink at Value size in the value position (The Printed Reason Rule).
- **Do** reserve Pen for links, focus, the primary button and the words of a human act (The Second Ink Rule).
- **Do** build every tile as a row in a definition list with a hairline beneath, and every list as a `<table>` with a caption and row headers at every width.
- **Do** draw charts in inline SVG with Rule strokes at 1.5px, two marker shapes plus a text label, and a text table beneath as the `aria-describedby` target.
- **Do** write annotations as "<state> by <role> on <date>: <note>" and append them; a corrected row keeps its history.
- **Do** declare `color-scheme: light dark` and redefine the same tokens for the night scheme (assumption pending the human).
- **Do** keep one primary button per page and 44px targets everywhere.

### Don't:
- **Don't** use cards, nested containers, shadows, gradients, icons, emoji, badges, progress rings or sparklines; the detector and the PRD (R-117, R-119) both forbid them.
- **Don't** carry a state by colour, position or icon alone; the words carry it, the wash is secondary.
- **Don't** use red, orange or green as a verdict; the system has no error colour.
- **Don't** draw a bar chart of O/E point estimates, label a peer, or add a tooltip that names anyone.
- **Don't** set a percentage larger than its count, or show two rates for the same metric; counts may decompose, rates may not.
- **Don't** put a count, badge or summary on the Patient feedback inbox anywhere, including the nav entry and the `<title>`.
- **Don't** use `system-ui`, Inter, Arial or IBM Plex as the text face; the face is Atkinson Hyperlegible Next until the human chooses otherwise.
- **Don't** add motion beyond the one authored moment, and never in email.
- **Don't** use a modal for the dispute form or any other task.

## Reconciliation with the gstack design review's token proposal (PRD R-120)

The design review (`docs/reviews/plan-design-review.md`, Pass 5) proposed a token set as a PRD row, pending a DESIGN.md. This file is that DESIGN.md. What it keeps, changes and adds:

| Review proposal | Here | Why |
|---|---|---|
| IBM Plex Sans and IBM Plex Mono, self-hosted, `tnum` | Atkinson Hyperlegible Next, one family, `tnum zero`; no mono | Plex is a model-default face; the product's real need is glyph disambiguation for identifiers; a mono for case ids is a costume when the text face already separates the glyphs |
| Type scale 16 / 18 / 20 / 24 / 32, line heights 1.5 and 1.25 | Kept, with the `h1` at 28px instead of 32px and Value at 18px 500 | A stamp, not a hero; the value is the loudest thing on a tile |
| `--ink #1a1a1a` on `#ffffff`, `--ink-muted #555555`, `--hairline #d4d4d4` | Tinted neutrals: Ink #1b2130, Surface #f6f7f9, Panel #eceef2, Paper #ffffff, Ink muted #4f5868, Rule #6f7887, Hairline #c9ced6 | Pure grey on white reads as an unfinished page; the cool tint is the printed sheet; a second neutral layer (Panel) was missing |
| `--accent #1d4ed8` for links and focus only | Pen #0b5c6b for links, focus, the primary button and the words of a human act | Tailwind's blue-700 is a default; the accent gains a semantic role (the pen) and a rule bounding its share of a page |
| Disputed #7a4a00 on #fff4d6; sustained #1f5e2c on #e6f4ea | Disputed #6b4200 on #fbf1dc; sustained #1d5a2e on #e4f2e7 | Same roles, retuned to the tinted ramp; all pairs above 7:1 |
| Restated: no colour, filled diamond plus the word | Kept | |
| Suppressed: no colour, Ink at value size | Kept and named (The Printed Reason Rule) | |
| "You" marker: filled square, label "You <value>" | Kept; the label text in Pen | The label is a human-facing mark |
| Spacing 4 to 48; headings closer to what follows | Kept | |
| Radius 2px on controls, 0 elsewhere | Kept | |
| Focus ring 2px accent, 2px offset, never removed | Kept, `:focus-visible` | |
| Buttons 44px, one primary per page | Kept; hover and active states added | |
| Tables: collapse, bold header with hairline, no zebra, numerals right | Kept; 8px row padding and phone column order added | |
| Selection, caret in accent; default scrollbars | Kept; scrolling containers get `scrollbar-color` | |
| Motion: none | One authored moment (the `dispute-filed` line), ease-out, reduced-motion honoured; none in email | The craft floor asks for one authored moment; a confirmation is where it belongs on an Operate surface |
| Dark mode: not provided at M2; `color-scheme: light` | Night scheme tokens defined; `color-scheme: light dark` | The use scene includes a phone at night; the cost is one token block. Assumption held for the human |
| Charts: Ink 1.5px strokes, hollow peers, filled You, hatched ghost, intervals with end caps | Kept, strokes in Rule (4.2:1) rather than Ink so the data marks outrank the axes | |

Nothing here asserts an MGB standard (OQ-63, OQ-51). The face and the accent remain proposals until a human approves them; the PRD's R-120 row records that this file is where they now live.
