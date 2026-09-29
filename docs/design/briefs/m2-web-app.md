# Surface brief: the M2 hosted web app

Written by `/impeccable shape` on 2026-09-29 with no human present. No structured question tool was exposed, so the discovery interview was answered from the documents; readings a human would normally confirm are marked "assumption". Cites `F-xx` (`docs/02-features.md`), `R-xx` (`docs/PRD.md` section 7) and `Jn.m` (`docs/01-user-journeys.md`). Source of truth for pages and states: `docs/03-technical-design.md`, "M2: the web app" (page inventory, authorization matrix, states) and PRD sections 9.2, 9.6, 9.7, 9.9.

## 1. Job and audience

- **Who arrives:** the same surgeon, now behind MGB SSO, following the deep link from the monthly email (`/me/<period>`) or the decision email (`/records/<ref>`), or opening the app before an annual review (J1.13 to J1.20). Also: the division chief or chair opening `/queue` to decide a dispute (J2.5, J2.6); from M4 the direct leader opening `/leader`; the analyst on `/analyst/*`.
- **Context and state of mind:** desktop-first at a desk (design doc Distribution Plan), and at phone width from the email link (assumption; the link is in a phone email). Tired eyes; a specific question ("was the 14th counted against me?"); low tolerance for anything that reads as a score.
- **Need:** the identical numbers to the email (F-85 AC 1), the list behind each, the definition, the spread where it renders, the trend, and a dispute button on every row that leads to a form that says what will change before they file (F-56).
- **Visitor mode:** Operate. Definition pages, "what this is not" and the inbox are Read pages inside the Operate app (PRD 9.9).

## 2. Outcome and proof

- **Primary task:** open a metric, open its records, dispute one row; or, as adjudicator, open the queue, read the provenance panel, record a decision with a note (J2.2, J2.3, J2.5, J2.6).
- **Success:** the surgeon reaches the row from the home page in three clicks (home, metric, records) and files in one form; the confirmation names the case id, the filed date, who decides and the due date (R-118 `dispute-filed`, R-59). The chief sees the record, not a score (F-52).
- **Real evidence:** the ledger rows the email already carried; provenance (source, load date, attribution rule, definition version, stored value, prior disputes); dispute history on every record; the versioned definition text; from M4 the faculty-meeting layout copied from the slide and the inbox; from M5 the wRVU mirror and M&M pace; from M6 O/E values with intervals.
- **Product-specific truth:** every absent number is a worded reason in the value position at value size (R-119); "as logged 60% (6 of 10) · as adjudicated 67% (6 of 9)" on one line (R-49); the strip plot with hollow peers and a filled "You" square, three-line text beneath (R-119); the queue shows no value of any surgeon (F-60); the inbox has no count anywhere (F-70).

## 3. Selected direction

- **Visual authority:** none incumbent; `DESIGN.md` defines "The OR list and the pen". The hosted view is where the world becomes visible: the printed list (neutral ink, ruled rows, tabular figures, stamped header) and the pen (one accent reserved for what a person did: dispute, decision, note, the "You" marker's label).
- **Structural thesis:** every page is a list with a stamp. Home is the month's list of tiles as definition-list rows under the header stamp; a metric page is one tile expanded with its rows link directly under the value; a record list is the OR list itself; a dispute form is the annotation being written; the queue is the chief's list of annotations awaiting a signature.
- **Sequence:** header (product, person, period picker); What changed (R-115); live buckets with tile rows; dead buckets as one line each (R-117). Metric page: value or reason; both bases if they differ; Records link; Compared to and the spread; Trend and its text table; definition stamp; source and as-of. Records: caption with the count; table; dispute button per row. Record detail: the row, provenance, dispute history, re-file control. Dispute form: record identity, metrics fed, disputable field, the effect notice, the claim, one primary button.
- **Focal moment:** on the records table, pressing "Dispute this record C-7K3Q9M" and landing on a page whose first line is "Dispute received on case C-7K3Q9M, filed 14 November 2026. Your division chief decides; decision due 28 November 2026." That line is the one authored motion in the app (DESIGN.md, Motion).
- **Implementation consequence:** Jinja2 templates over `ClinicianArtifact`; `scorecard/publish/charts.py` inline SVG for the strip plot, trend line, Bucket 5 bars, ghost bars and interval dots; `web/static/scorecard.css` holding the DESIGN.md tokens as custom properties; every template cites a component name from DESIGN.md (R-120); every page rendered at 360 px and 1280 px in CI (R-121).

### Direction contract

THESIS: The app is the surgeon's own OR list with the department's annotations beside it, and it refuses the analytics-dashboard arrangement (KPI cards, sparklines, coloured deltas, a sidebar of filters) and its soft opposite (a coaching app with encouragement and progress rings).

OWN-WORLD: Tinted cool neutrals on a paper-light surface; one accent, a pen's ink, used only for links, focus, the primary button and the label of what a person wrote (dispute states, decisions, notes, the "You" label); hairline rules between rows; tabular figures everywhere a number sits; a stamped header (product, person, period, last refreshed) on every page; tiles as rows, never cards; suppression reasons in the value position in ink, not grey; annotations as dated, attributed clauses. Recognisable with the content removed: a ruled sheet with a stamp at the top and a few lines in a second ink.

STORY: The surgeon understands that the page and the email say the same thing, that every number opens its rows, that a missing number is a counted reason, and that pressing the dispute button starts a dated, attributed record. They believe it because the row, its provenance and its history are on one page. They do one thing: file, or close the page.

FIRST VIEWPORT: At 1280 px: the header stamp on one line (product name left, person and period picker right); beneath it the What changed aside as a short ruled block; then Bucket 1 as an `h2` and its tile rows (name left, value in tabular figures right, one small line beneath: "Records: 19 rows · Compared to: subspecialty peers at your site (4 surgeons)"); Bucket 2's four rows follow within the first 800 px of height. No chart on home. At 360 px: the stamp wraps to three lines; each tile row becomes the value on its own 18 px line above the name (R-121). The primary action on home is the tile row itself (a link).

FORM: The OR daily case list, annotated by pen, candidate 6 of 7 on the grounded list; seed key 20b5df25 (degraded roll, no challengers). Raised by two declined grounded candidates: the lab report's reference-range strip for the spread (a horizontal strip in the metric's unit, min and max labelled, "You" marked, no verdict); the operative note's addendum rule for overrides and restatements (append, date, sign; never edit).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## 4. Scope and boundaries

- **Fidelity:** production templates for M2 pages, with M4 (Bucket 5, inbox, leader), M5 (wRVU, M&M) and M6 (intervals) composed in the same system and gated on their milestones.
- **Breadth:** the page inventory in the technical design: `/me`, bucket, metric, records, record detail, dispute form, dispute detail (surgeon and adjudicator), queue and closed queue, definition page and index, `/whats-not`, inbox and notes (M4), leader landing and inbox view (M4), nine analyst screens. Page states: `no-period`, `not-on-roster`, `not-authorized`, `load-failure`, `leader-gate`, `period-not-published-for-you`, `session-expired`.
- **Interactivity:** server-rendered, one request per page; forms POST; sorting by query string; no JavaScript required for anything (F-85). Charts are inline SVG with `<title>` hover text only.
- **Named targets:** `web/templates/*.html.j2`, `web/static/scorecard.css`, `scorecard/publish/charts.py`.
- **Untouched:** the authorization matrix; the catalogue strings (except rewrites recorded in the PRD amendment); the URL patterns; the CSV.
- **Anti-goals:** cards; icons; badges; colour as the only carrier of a state; a bar chart of O/E point estimates; a tooltip that names a peer; a count on the inbox; a dashboard home with charts; a modal for the dispute form; a spinner or skeleton; a "coming soon".

## 5. States and ranges

Ranges (illustrative, from the brief and the technical design):

| Item | Minimum | Typical | Maximum | Where the range bites |
|---|---|---|---|---|
| Tiles on home | 4 live plus 21 as dead-bucket lines (M2) | 4 to 9 live | 25 live (all feeds) | Home must read at 4 live rows and at 25; dead buckets collapse to one line each (R-117) |
| Peer markers on a strip plot | 5 | 6 to 12 | about 30 | Ties stack vertically; at 30 the strip is dense but unlabelled, so it still reads |
| Six-peer spread (the canonical fixture) | 6 hollow circles, 1 filled square, one "You" label | | | Test: six circles, one square, one text label, nothing else (R-119) |
| Bucket 5 bars | 5 | 20 to 41 | 60 | Ascending bars at full width; at 60 each bar is under 12 px wide on desktop; the surgeon's bar hatched and labelled |
| Trend points | 1 | 12 monthly, 4 quarterly, 4 rolling-12 | 24 (two fiscal years of wRVU) | Text table beneath has the same count; gaps carry their reason |
| Record list rows | 0 | 5 to 40 | about 120 (a quarter of scheduled cases) | No pagination in M2 (assumption: one surgeon's quarter fits one page); sortable headers; the table scrolls inside its container at tablet width |
| Procedure name in a record table cell | 6 characters | 20 to 35 | 47 characters and longer | The column wraps within its cell; the case id column never wraps |
| Delay or cancellation reason as stored | blank | 1 to 3 words | 40 or more characters | Wraps; "reason not recorded" for blank |
| Claim text | 1 character | 100 to 300 | 1,000 characters (cap, S-05) | The form shows the cap and the count |
| Decision note | 1 | 50 to 200 | 1,000 | Shown on the row and the record detail |
| Queue rows | 0 | 0 to 5 | 30 (month-one burst) | Oldest first; "past 14" as text |
| Dispute history on one record | 0 | 0 or 1 | 3 (original, re-file, counter-dispute) | Linked disputes listed in order |
| Inbox comments | 0 | 5 to 30 | 200 over a year | Newest first; no pagination in M4 (assumption); no count anywhere |
| Private notes per comment | 0 | 0 or 1 | 5 | Beneath the comment, dated |
| wRVU months | 12 | 24 (this year and last) | 24 | Ghost bars; two most recent months carry the "may increase" note |
| M&M sessions | 1 | 9 | 12 | Cumulative chart; session table of 12 rows |
| O/E interval width | 0.9 to 1.1 | 0.5 to 2.0 | 0.04 to 9.3 (one death, 0.6 expected) | The interval dot chart must draw a 0.04 to 9.3 interval legibly on a log or clipped axis (assumption: log axis with the clip stated in the text table) |

Material states, all catalogue keys (PRD 9.4, 9.7; technical design states table): every tile state the email has; `restatement-pending`; `dispute-filed`; `dispute-withdrawn`; `decision-recorded`; `queue-empty`; `claim-required`, `claim-too-long`, `claim-identifier`; `session-expired`; `note-saved`, `note-deleted`, `note-required`; `leader-none`; `leader-gate`; `not-authorized` (same bytes for not yours and not found); `load-failure` with "Your data has not changed"; `no-period`; `not-on-roster`; unknown definition version (404 with the index link); comment withheld for a non-leader adjudicator; "recompute did not complete; the analyst has been alerted".

## 6. Interaction and layout intent

- **Hierarchy per page:** stamp header; the page's one object (tile row, value, table, form); its provenance; its history. One `h1` per page. One primary button per page.
- **Topology:** header and role-based nav (Scorecard, Definitions, What this is not; plus Patient feedback inbox, Queue, Leaders, Analyst by role); breadcrumb; the trunk test passes from the header alone (R-117). Home to bucket to metric to records to record to dispute to dispute detail is one straight path.
- **Responsiveness (structural, per R-121):** desktop one column at 1100 px maximum; tablet the same with the record table scrolling in its container and `case_id` and `date` sticky; phone the tile value on its own line above the name, the strip plot full width with min, max and the surgeon's value as the only axis labels, the record table with key columns first and the dispute button a 44 px full-width control in the final column.
- **Affordances:** every control is a `<button>` or `<a>`; sortable headers are links carrying `aria-sort`; the period picker is a `<select>` in a form with "Go"; the dispute button's accessible name includes the case id.
- **Feedback:** page-level, in words, at the top of the page that follows a POST (`dispute-filed`, `decision-recorded`, `note-saved`). Validation errors inline beside the field, input preserved. The browser's own loading indicator is the only loading state.
- **Transitions:** one authored moment (the confirmation line settling on the dispute detail page, 180 ms ease-out, honours `prefers-reduced-motion`); nothing else moves.

## 7. Constraints and open decisions

- **Platform and delivery:** server-rendered Python app behind MGB SSO on an MGB-managed VM; `Content-Security-Policy: default-src 'self'` (fonts self-hosted, no CDN); `Cache-Control: no-store` on surgeon-identified pages; no client-side data store.
- **Accessibility:** R-121 in full: landmarks, one `h1`, `<caption>` and `<th scope>` on every table, charts `role="img"` with `aria-describedby` on visible text, 4.5:1 text and 3:1 strokes, 16 px body, 44 px targets, visible focus ring, "Skip to scorecard" first, Enter submits the dispute form.
- **Localisation:** not required.
- **Reusable components (DESIGN.md inventory):** stamp header; nav; breadcrumb; what-changed aside; bucket section; tile row; value line with bases; reason line; decomposition line; records link; comparator line; strip plot; Bucket 5 bar spread; interval dots; trend line with text table; ghost bars; pace block; definition stamp; source line; record table; record row; dispute state cell; dispute button; dispute form; effect notice; provenance panel; queue row; decision form; definition page; inbox item; private note; page-state banner; primary and secondary button; select; text area; focus ring.
- **Open decisions a builder must not invent:** the face and accent are proposals until the human approves (R-120, DESIGN.md); whether MGB has a web standard (OQ-63) or accessibility standard (OQ-51); record list as a table or cards at 360 px (TD-09); the interval chart's axis for extreme O/E intervals (assumption above); dark scheme at M2 (DESIGN.md assumption, reversing the review's deferral); pagination thresholds for record lists and the inbox (assumption: none in M2 and M4); whether the direct leader sees the four measures (OQ-42); the surgeon-facing product name (TD-13).
