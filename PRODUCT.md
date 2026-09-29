# Product

<!-- impeccable:product-schema 1 -->

Written by `/impeccable init` on 2026-09-29 with no human present. No structured question tool was exposed in the session, so every fact below comes from `docs/` (the brief `docs/source/metric-definitions-v0.2.md`, the design doc, the journeys, the PRD and the technical design). Facts the documents state are cited. Facts this file inferred are marked "(inferred from docs; confirm)". Nothing here is approved until the brief's owner says so.

## Platform

web

## Stack

delegated: server-rendered Python web app per docs/03-technical-design.md D-05 (Flask + Jinja2 + psycopg, or Django 5 LTS if the builder has taken a Django app through an MGB security review), pending builder confirmation. The M1 surface is not an app at all: one plain-text email per surgeon plus one CSV, rendered by Jinja2 from the same artifact model. Inline server-rendered SVG for charts (D-35); no client-side framework; no JavaScript needed to read any page. `Content-Security-Policy: default-src 'self'`, so fonts are self-hosted.

## Users

- **Attending neurosurgeon** at one pilot site (tens of surgeons; the roster confirms the count). The "you" of the brief. Every case, admission, visit, survey and attendance record is credited to exactly one of them. Job: "see my own list before anyone else does" (design doc Q3); check a number against the case list behind it; dispute a record that is not theirs. Situation: reads the monthly email on a phone, often at night (inferred from docs; confirm: the journeys say "opens the month-one email on a phone" and the design doc says "email readable on a phone; hosted view desktop-first"); opens the hosted view at a desk before an annual review. Fear: being charged for a delay, case or survey that was not theirs; a number that moves for a reason they cannot see; a tool read as a comp input or a rank; being recognised in a five-marker spread.
- **Division chief**: first-line adjudicator of disputes; also a surgeon with their own scorecard. Sees the record, its provenance and the claim, never a score.
- **Department chair**: adjudicates when the chief is involved; buyer of the pilot (design doc Q3).
- **Direct leader**: the only person besides the surgeon who may read the Patient feedback inbox; no earlier than 30 days after the surgeon first had it. Whether this is the division chief is open (OQ-41).
- **Department analyst** and a named backup: run the monthly batch, enter email disputes into the ledger, send decision emails; see comments as pipeline data only.
- **Feed owners** (periop analytics first): receive a monthly override list.

## Product Purpose

A read-only, per-surgeon metrics viewer for a neurosurgery department inside MGB. It mirrors institutional numbers that already exist (periop's OR-log report first) and adds what their owners cannot give a surgeon: the record-level list behind every number, a dispute path with a written outcome that shows up in the list, minimum-n and peer-under-five suppression that explains itself, an anonymous peer spread, and a trend on every metric. "The charts are the surface. The ledger and the dispute path are the product." (design doc). Success: the wedge's four numbers match periop's report before any surgeon sees them (G1); half of pilot surgeons return unprompted in months two and three (G2); at least two disputes by surgeons who are not the brief's owner are decided within 14 days with the outcome visible on the row (G3); every missing number says why (G4).

## Positioning

The only surgeon-facing number in the department that comes with its own case list, a reason for every absence, and a dispute that changes the list. A periop report, an OPPE packet, a comp letter or a faculty-meeting slide gives the number; none gives the record behind it or a way to correct it that lands anywhere. This product never computes a rival number: institutional definitions are adopted verbatim and reconciled before publish (D6). It is not a scorecard in the sense the word implies: no composite score, no rank, no target except M&M attendance's 8 of 12.

## Operating Context

- Delivery in milestones: M0 the Assignment and step zero (a faculty meeting presenting definitions, ground rules and "what this is not" before any peer data renders); M1 months one to three, one monthly plain-text email per surgeon with a CSV of their own rows, no host, no link; M2 a hosted per-surgeon web app behind MGB SSO once security review, data governance and a QI determination are recorded; M3 to M7 add feeds (block schedule, survey vendor, billing and attendance, Vizient and QI, clinic and referral) each gated on an owner outside the department.
- Cadence: OR-log metrics refreshed within 10 business days of month close; quarterly metrics close at quarter end; Vizient lags two to three months; surveys lag four to eight weeks; billing lags and restates.
- Rituals the product must fit: the semiannual patient-experience faculty-meeting slide (Bucket 5 copies its column order and labels); the annual faculty review; the comp letter (wRVU is a read-only mirror of the billing office's report); M&M conference attendance logged by QR scan.
- Disputes in the email months: the surgeon replies quoting a case id; the analyst enters it within two business days; the chief or chair decides; a one-record decision email closes the loop inside a 14-day target.
- Devices: email on a phone (iOS Mail, Outlook for iOS, Android Gmail are the rehearsal clients); hosted view desktop-first, usable at 360 px.
- The analyst runs one documented three-command runbook step monthly; a missed run shows as a stale "last refreshed" date on every artifact.

## Capabilities and Constraints

Confirmed capabilities (PRD section 7; the wedge four in M1, the rest by milestone):

- Attribution ledger: every record credited to exactly one clinician under a named rule version, with a visible "shared" flag on multi-panel cases.
- Metric engine: definitions as versioned code; every number carries its definition version, source and as-of date; trends mark version boundaries and restated points.
- Suppression: minimum n per metric (4 first cases for FCOT; 5 for Duration estimate accuracy; 10 for quarterly cancellations; 10 to 30 for later buckets; 10 responses per survey month) and peer-under-five; every suppressed cell renders the reason with counts, never a blank. Record lists open even when the number is suppressed.
- Anonymous spread: sorted peer values and the surgeon's own marker; peers exclude the viewer; renders only when at least five peers each clear min-n; the render is logged.
- Drill-down: every number links to its definition page and to the list of records behind it; row count equals the denominator.
- Dispute workflow: a dispute is pinned to one record and one field; routed to the chief, or the chair when an involvement test fires; outcomes "sustained (annotated)", "sustained (source corrected)", "not sustained", "definition question"; overrides visible, versioned, never silent; "as logged" and "as adjudicated" shown side by side when a count moves.
- Patient experience (M4): the faculty-meeting layout plus a cross-system bar chart; the Patient feedback inbox with private notes, visible to the surgeon and direct leader only; comments never counted, compared or rolled up.
- wRVU mirror (M5): fiscal-year-to-date against last year, monthly bars with last year ghosted, "as of <date>, may increase"; no peer, no target, no record list, no dispute.
- M&M attendance (M5): attended, remaining, on pace or off pace, a clear flag when 8 cannot be reached; no peer comparison.

Binding constraints:

- **The six ground rules (brief):** (1) exactly one clinician per record; (2) any record can be disputed, to the chief, then the chair; (3) no number below min-n or with fewer than five peers, and the screen says why instead of showing a blank; (4) peer comparisons always anonymous; (5) every number links to its definition and its records; (6) every metric shows a trend.
- **No composite score, no rank, no target** except M&M attendance's 8 of 12. An automated scan fails any artifact that carries one (R-44).
- **"The screen says why."** Every absent number is a worded reason with counts from one versioned catalogue; the same string on email, page and analyst report. No surface types a reason.
- **Anonymity stated honestly:** "Names are hidden, not people." No surface claims a spread is unidentifiable (D8).
- **Never a comp or OPPE system of record.** Comp-relevant numbers are a read-only mirror labelled with source and date (D4). The "what this is not" statement is carried as one line on every email and page.
- **Surgeon first:** a surgeon sees any number at least 30 days before any leader view exists (D5). No leader view in the pilot.
- **Reconcile, do not compete:** institutional definitions verbatim; the number matches periop's before anyone sees it (D6).
- **PHI:** surgeon-identified, PHI-derived data inside a hospital. No patient identifier in any email, CSV or page payload (no name, MRN, date of birth, encounter number, phone, free text); a minimum-necessary payload scan blocks a send. Comment text is read by one code path only. `Cache-Control: no-store` on every surgeon-identified page. Governance gates (privacy office for email; security review, data governance, QI determination for the hosted view; medical staff office before any quality metric) open channels; nothing renders before its gate.
- **SSO:** hosted identity comes from MGB SSO mapped to a dated roster row; roles computed per request; every refusal is the same bytes for "not yours" and "does not exist" and is logged.
- **Plain text email in M1:** 72-character lines, no hyperlink in months one to three, no ruler lines, one CSV attachment, tiles in the brief's bucket order.
- **No JavaScript required** to read, dispute, decide or write a note. Charts are inline SVG with a text twin.
- **Milestone gates** are owned by people outside the department; no surface may assume a later feed exists. Tiles for absent feeds read "Not in this release: needs <feed>; owner not yet named" or "Data source pending confirmation".

### Terminology

Terms surgeons see on a surface, with the meaning fixed by the technical design glossary and PRD appendix B. Use these words and no synonyms.

| Term | Meaning on the surface |
|---|---|
| Metric names | Exactly as the brief writes them: "OR case volume", "First-case on-time start (FCOT)", "Duration estimate accuracy", "Same-day cancellations you could have prevented", "Block utilization (only if you have allocated block)", "Work RVUs — live tracker" (the brief's dash is kept), "M&M attendance", "Length of stay (O/E)", "30-day readmission (O/E)", "In-hospital mortality (O/E)", "Net promoter score", the three quoted survey items, "Patient feedback inbox", and the rest of the brief's headings |
| Bucket | One of the brief's six groups, in the brief's order: Volume and mix; Efficiency; Access; Quality and outcomes; Patient experience; Citizenship |
| Case id | The opaque record token a surgeon quotes to dispute a row, for example C-7K3Q9M; never a name or MRN |
| Records: <n> rows | The list behind a number; the count equals the tile's denominator |
| Not shown: <n> <unit> this <period>; needs at least <min-n> | A min-n suppression; the surgeon's own value is withheld |
| Peer comparison not shown | A peer-under-five suppression; the surgeon's own value and trend stay |
| Compared to | The brief's comparator text plus the peer count |
| You / Peers | The surgeon's own marker and the sorted anonymous peer values |
| Names are hidden, not people. | The closing sentence of every spread-count line |
| as logged / as adjudicated | The value from the source as loaded, and the value after sustained overrides; shown together only when they differ |
| Disputed - with chief, filed <date> | A row's open dispute state; "with chair" when escalated |
| Dispute sustained (annotated) / (source corrected) / Dispute not sustained | The three decided states, always with the decider role, date and note |
| restated | A trend point recomputed after a decision, version change or feed restatement; both values named |
| definition v<n> | The short definition version stamp on a tile; the full id lives on the definition page and in the CSV header |
| last refreshed <date> | The publish date of the run being rendered; a missed month shows the previous month's date |
| as of <date> | The feed's own date (billing, Vizient, survey), distinct from "last refreshed" |
| Counted quarterly; the quarter closes <date> | The interim state of a quarterly metric with the count so far |
| Not in this release / Data source pending confirmation / Not applicable | The three "why not shown" states that are not suppression |
| What this is not | The versioned statement: not a comp input, not a rank, not an OPPE record; visible to you; your chief sees a record only when you dispute it; no leader view in the pilot; disputes change the record list |
| Hidden: <n> responses this month; needs at least 10 | A hidden survey month in Bucket 5 |
| no evidence of difference from peers | The O/E label when the surgeon's interval includes the peer median |
| self-reported, unadjusted | The label on QI-database rates with no risk model |
| shared | The flag on a multi-panel case credited to the first-listed primary surgeon |
| Step zero | The faculty meeting before any peer data renders |
| Wedge | One site, all neurosurgeons, periop's extract, four metrics, by email for months one to three |

Words that never appear on a surgeon-facing surface: score, rank, target (except M&M's 8 of 12), grade, performance, leaderboard, percentile position, "coming soon", any internal field or table name.

### Open decisions

Product facts the documents leave to the brief's owner. None is decided here.

- Whether "Clinician Scorecard" stays the surgeon-facing name; the design doc's own statement is "not a scorecard" (TD-13, held as taste).
- The peer line: sorted values or range and median (TD-06).
- The late-case decomposition line on the tile versus labels on rows only (TD-03).
- Per-tile provenance line versus footer only (TD-04).
- Record list at phone width: table (current) versus one card per record (TD-09).
- Whether MGB has a web design standard the hosted view must follow (OQ-63) and which accessibility standard applies (OQ-51).
- FCOT grace window; peer-group counting rule; opt-out mechanics; mortality on the individual view; wRVU record list; M&M trend; dark mode (deferred by the design review, reopened as an assumption in DESIGN.md).

## Brand Commitments

- Name in the documents: "Clinician Scorecard" (repository and brief). Product statement: "not a scorecard, and not a competing number" (design doc). Held as a taste decision (TD-13).
- No logo, wordmark, colour, typeface or imagery exists. No institutional brand asset is on hand; nothing here claims to be MGB's.
- **Voice (per TD-10 and TD-13, and the brief):** plain and specific. The brief writes in the second person ("You can move it by") and in counts ("5 of 7 first cases on time"). Surfaces speak the same way: name the count, the denominator, the period, the source and the date; say why a number is absent; say what a dispute will and will not change before the surgeon files. No scorekeeping language (score, rank, target, grade, performance, streak, badge), no cheer, no apology, no exclamation marks, no internal field names, no "(you are not counted)" or "(assumption, to be confirmed)" in a surgeon-facing string (R-125 moved those to definition pages). Every surgeon-facing string is a versioned catalogue entry read aloud with two surgeons before the month-one send (R-125).

## Evidence on Hand

- The brief, v0.2, owner Omar Arnaout, verbatim at `docs/source/metric-definitions-v0.2.md`: ~25 metric definitions with min-n, cadence, comparator and "You can move it by" levers.
- The design doc's status-quo inventory of numbers that already exist (periop reports, OPPE packets, Vizient CDB, QI database, survey vendor portal, comp letters), marked expected, not confirmed.
- Demand evidence: **unproven** (design doc Q1: "UNKNOWN"). No surgeon is quoted; no one has asked for this; the only evidenced pain is contractual (M&M attendance counts toward comp) and cadence ("available any time instead of twice a year"). The Assignment (M0) collects the first evidence: printed case lists handed to three surgeons, five surgeon and two chief conversations.
- Synthetic examples the documents author for illustration (Dr. Name, C-7K3Q9M, "5 of 7 first cases on time (71%)", seven peers at 43% to 86%, 41 neurosurgeons across the system, 6 of 9 M&M sessions): usable as demonstration data, labelled synthetic wherever a viewer could mistake them for real.
- Absent, and never to be fabricated: testimonials, named customers or sites, a surgeon's real numbers, periop's real definitions text (adopted verbatim once received), the faculty-meeting slide layout (a precondition to copy, not to invent), MGB brand assets, an institutional accessibility or web standard, governance lead times, the comp office's wRVU query.

## Product Principles

1. **The record before the number.** Every value is a doorway to its list; the list is where trust is won and where a dispute starts.
2. **Say why, in counts.** An absent number is information, not an error; it is rendered at value size with the count and the threshold.
3. **One number per metric.** Reconcile to the institution's figure; never show two rates for the same thing; counts may decompose, rates may not.
4. **Nothing moves silently.** Overrides, restatements and version boundaries are visible, dated and attributed; a tile shows both bases when they differ.
5. **The surgeon reads first, and alone.** No leader view before day 30; no comparison before step zero; no identity in a spread; the inbox is two people.

## Accessibility & Inclusion

- Every state (suppressed, disputed, restated, "You", intervals, "no evidence of difference") is text on the surface; never colour, icon or position alone (F-108, R-111).
- Email: plain text, 72-character lines, no ruler lines; opens on iOS Mail, Outlook for iOS and Android Gmail without horizontal scroll; one dated trend row per line so a screen reader hears dated rows.
- Hosted view: 4.5:1 text contrast, 3:1 chart strokes, 16 px body minimum, 44 px targets, visible focus ring never removed, one `h1` per page, landmarks, tables with `<caption>` and `<th scope>`, charts `role="img"` with `aria-describedby` pointing at visible text, every page rendered at 360 px and 1280 px in CI (R-121).
- Reading conditions: tired eyes, a phone at night, office light by day (inferred from docs; confirm). Identifiers such as C-7K3Q9M must be unambiguous glyph by glyph.
- The institution's accessibility standard is not named (OQ-51); conformance is added when it is. Localisation is not required: one language (English), one institution (inferred from docs; confirm).
