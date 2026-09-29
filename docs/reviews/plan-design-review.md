# /plan-design-review: Clinician Scorecard PRD

Target: `docs/PRD.md` (v0.4, DRAFT) · Date: 2026-09-29 · Run: headless (gstack spawned-session rule; no human present) · Mockups: none (deferred; see Step 0.5) · Outside voice: run after the passes as a fresh-context Claude subagent (native-only coverage; no consensus cell CONFIRMED; see "Outside voice", "Design consensus table" and "Cross-model tension dispositions" at the end of this file) · Status of the plan after this review: DRAFT. Nothing here is approved; every decision below was auto-chosen and is listed under "Headless decisions" for the human to reverse.

Scope gate: plan mode, auto-selected B (reviewing `docs/PRD.md`). Announced in one line per the digest.

How to read this: six passes are rated 0 to 10 with a gap statement, a recommended fix, and a re-rating after the fix was applied to the PRD. Pass 7 is an unscored register. Citations are to features `F-xx`, requirements `R-xx`, technical decisions `D-xx`, journey steps `J1.4`, open questions `OQ-nn` and design-doc premises `P1` to `P12`. Metric names are the brief's exact names; the brief's "Work RVUs — live tracker" carries a dash inside its name and that quotation is the only place one appears in this file.

---

## Pre-review system audit

| Check | Result |
|---|---|
| Repo state | Documents only. No application code, no templates, no CSS. `git log` shows eight commits from the brief to the technical design; the PRD's v0.3 and v0.4 (CEO review) are in the working tree. |
| Plan read | `docs/PRD.md` in full: sections 4 (roles), 9 (experience requirements, states, accessibility) and appendix D (CEO block) closely. |
| Supporting docs read | Journeys J1 to J3 with failure modes; technical design "Delivery surfaces" (artifact model, email template, CSV, page inventory, authorization matrix, charts, page states, accessibility baseline, Bucket 5, wRVU and M&M display contracts); the brief's Bucket 5, Bucket 6 and ground-rule display contracts; the design doc's Distribution Plan (devices line). |
| DESIGN.md | Absent. No design tokens, no component vocabulary, no font. Pass 5 has nothing to align to; a minimum token set is proposed there as a decision. |
| Existing UI patterns | None in code. In documents: the reason catalogue (F-33) as the single source of every state string; the artifact model (`ClinicianArtifact`) as the one object every surface renders; the plain-text email template and the CSV column list; the page inventory with URL patterns; the page-state table; the accessibility floor (F-108). These are the de facto design system and are reused, not reinvented, below. |
| Prior design reviews | None. The CEO review's section 11 rated design intent as specified "to a level a designer can work from" and left one item (T10: a catalogue key for the empty queue). Retrospective rule applied: the queue's empty state and everything else the CEO review marked "design review item" is reviewed harder here. |
| UI scope | Yes. M1: plain-text email plus CSV; decision, acknowledgement and re-credit emails. M2: server-rendered web app (home, bucket, metric, record list, record detail, dispute form and detail, adjudicator queue, definition pages, "what this is not", analyst screens). M4: Bucket 5 page, per-response list, Patient feedback inbox with private notes, direct-leader landing and inbox view. M5: wRVU tracker and M&M pace blocks. |

---

## Step 0: Design scope assessment

### 0A Overall design completeness: 6/10

It is a 6 because the plan says, for every cell, what words the user sees (the catalogue), and says which pages exist and who may open them (the inventory and the matrix), but it does not say what the user sees first on any of them, how a tile is laid out against its neighbours, how a spread of six peers is drawn, what a surgeon sees after pressing "Dispute this record", or what any of it looks like at 360 px beyond "tiles stack". A 10 for this plan would have: an information hierarchy per surface (first, second, third), a state table that covers success and validation states as well as the product's own states, the journeys storyboarded with the emotional beat each screen must land, the M2 pages described specifically enough that two builders would produce the same page, a named token set, and per-viewport layouts with keyboard and screen-reader behaviour for the spread and the record tables.

### 0B DESIGN.md status

Absent. Universal principles apply. `/design-consultation` is the recommended next skill; under the headless rule no skill is chained, so Pass 5 proposes the minimum token set and records it as a decision for the human.

### 0C Existing design reuse

Reuse, do not reinvent: the catalogue keys (every new state below is a new key, not a typed string); the `ClinicianArtifact` fields (every hierarchy below is an ordering of fields that already exist); the three-line plain-text spread (F-46 AC 6) as the screen-reader text of every hosted spread; the page-state table in the technical design as the base of the Pass 2 table; the authorization matrix as the source of who sees which navigation entry.

### 0D Focus

All seven passes (headless default).

### Surfaces, screens, states and roles in scope

| Surface | Screens | Roles |
|---|---|---|
| M1 email | Monthly email body; CSV attachment; acknowledgement; decision; re-credit; dispute-filed (to adjudicator) | Surgeon; chief; chair; analyst |
| M2 web app | `/me` home; bucket page; metric page; record list; record detail; dispute form; dispute detail (surgeon and adjudicator views); queue and closed queue; definition page and index; "what this is not"; nine analyst screens; page states (no period, not on roster, not authorized, load failure, leader gate) | Surgeon; chief; chair; analyst |
| M4 additions | Bucket 5 page in the faculty-meeting layout; per-response list; Patient feedback inbox; private note create, edit, delete; structured survey dispute form; leader landing; leader inbox view | Surgeon; direct leader; chief or chair for survey disputes (comment withheld) |
| M5 additions | wRVU ghost-bar block; M&M pace block and session list | Surgeon |

### Step 0.5 Visual mockups

Deferred. No designer binary is available in this session and no human can rate a comparison board. No variants were generated; nothing is recorded as approved. The passes below are text-only, which the digest allows as a progressive-enhancement fallback. Recorded in "Headless decisions" and "NOT in scope".

---

## Pass 1: Information architecture

### Rating before: 6/10

It is a 6 because the page inventory says what each page shows but not in what order, the email template puts a seven-line instruction paragraph and the "what this is not" line above the first number, and no navigation is specified at all (no nav entries, no breadcrumb, no way for a chief to move between their own scorecard and the queue). The trunk test fails on the metric page: covering the URL, nothing on the described page says which period or which surgeon it belongs to. A 10 would have first, second, third for every screen, a navigation model per role that passes the trunk test, and the email ordered so that a surgeon on a phone sees their four values inside the first screen.

### Findings

1. **Email: the first screen is instructions, not numbers.** The template's first 14 lines after the subject are the header, a seven-line paragraph about how to dispute, and the "what this is not" line. On a phone at default type the first screen holds about 18 lines, so the surgeon reads instructions before any value. Then each tile carries a 12-row trend table, so the fourth value is roughly 90 lines down. Constraint worship: if the surgeon can see three things, they are their four values, whether anything changed, and how to open the list. (Recommended, applied) Add a "This month" block of four lines directly after the three-line header, one per wedge tile, carrying `metric_name` and `value_text` or `reason_text` from the same artifact field the full tile uses; move the seven-line dispute instruction below the tiles and keep one line at the top: "Your case list is attached as scorecard-<period>.csv; to dispute a row, see 'How to dispute' below." Keep the "what this is not" line at the top (F-42 requires it on every artifact; it is one line). New R-116.
2. **Email: three sections say the same thing after R-115.** The template has "Decisions on your disputes since the last email" and "Definition changes" as separate blocks after the tiles, and R-115 adds a "What changed since <prior period>" block before the first tile that carries the same rows. (Recommended, applied, P4) One block, R-115's, in R-115's position; the two later blocks are removed from the template. Recorded on R-115.
3. **Email: buckets 3 to 6 are 21 lines of "Not in this release".** One line per metric in the brief's order, between the wedge tiles and the definitions appendix. On a phone that is a full screen of the same sentence. (Recommended, applied) One paragraph: "Buckets 3 to 6 are not in this release. Each metric's definition and the feed it needs are on the definition pages below." followed by the metric names as one comma-separated paragraph, so every brief item is still named (R-108 and F-44 keep the stored state per metric; only the email's rendering is compressed). Recorded on R-116.
4. **Email: the definitions appendix is longer than the scorecard.** Rendering every definition page in full (What, Counted, Compared to, Shown as, You can move it by, assumptions, reason sets, version history) for four metrics is roughly 80 lines. It is required in the email months (F-50 AC 7) because there is no host. (Recommended, applied) Keep it, last, under one heading "Definitions in force this period", with each definition's "What", "Counted", "Compared to" and "You can move it by" lines first and the assumption and version-history lines after, so the phone reader who scrolls that far meets the plain-language text first. No requirement change; template ordering recorded on R-116.
5. **Web app: no navigation model.** The inventory has 30 URLs and no statement of what the surgeon can reach from where. (Recommended, applied) Global navigation per role, computed from the same roles the authorization matrix computes, with the trunk-test elements on every page: site name, the signed-in person's name, the current period, and a breadcrumb. New R-117 and the diagram below.
6. **Web app: the home page buries the four live metrics under 21 dead tiles.** "The six buckets as sections in the brief's order with every tile in compact form" at M2 renders 25 tiles of which 21 read "Not in this release". (Recommended, applied) Buckets with no computed metric collapse to one line per bucket on the home page ("Bucket 3 Access: 2 metrics, not in this release"), linking to the bucket page where the full "Not in this release" tiles live; buckets with at least one computed metric show every tile. Bucket 2 keeps the F-104 sentence. Recorded on R-117.
7. **Metric page: the record list link sits last.** The inventory lists "Records: <n> rows" after the trend, definition and source lines. The list is the product (PRD section 1). (Recommended, applied) The records link is the line directly under the value line on the metric page and on the home tile. Recorded on R-117.

### Information hierarchy: the M1 email (phone, plain text)

```
Subject: Your scorecard, October 2026 (last refreshed 12 November 2026)

 1  Clinician Scorecard for Dr. <Name>            <- who and when: three lines
    October 2026 at <site label>
    last refreshed 12 November 2026
 2  <what-this-is-not one line, statement v<n>>   <- F-42, one line
 3  Your case list is attached as scorecard-2026-10.csv.
    To dispute a row, see "How to dispute" below.
 4  WHAT CHANGED SINCE SEPTEMBER 2026             <- R-115, month two on
      (decisions, restatements with both values,
       definition changes, new-record count, or
       "No changes since September 2026")
 5  THIS MONTH                                    <- R-116: four lines
      OR case volume: 19 operations as primary surgeon
      First-case on-time start (FCOT): 5 of 7 first cases on time (71%)
      Duration estimate accuracy: 11 of 14 cases within tolerance (79%)
      Same-day cancellations you could have prevented: Counted quarterly;
        the quarter closes 31 December 2026. Scheduled cases so far: 24.
 6  BUCKET 1  VOLUME AND MIX                      <- full tiles, brief order
      OR case volume
        value line
        Records: 19 rows in the attachment, metric = or_case_volume
        Compared to: ... (4 surgeons; spread from month two)
        [month two: three-line spread]
        Definition: ..., version 1 (brief v0.2)
        Trend (vertical, up to 12 rows, * restated, boundary lines)
 7  BUCKET 2  EFFICIENCY
      FCOT, Duration estimate accuracy, Block utilization (only if you
      have allocated block) "Not in this release", Same-day cancellations
      you could have prevented; then the F-104 sentence
 8  BUCKETS 3 TO 6                                <- one paragraph
 9  HOW TO DISPUTE                                <- moved down; R-94 template
      Case id:
      Field:
      What happened: (no patient name, MRN or date of birth)
      Replies go to <dispute mailbox> and are read by the analyst.
10  DEFINITIONS IN FORCE THIS PERIOD              <- F-50 AC 7, last
11  footer: sent by the department mailbox; reply to dispute or ask
```

First, second, third on a phone: who and when; whether anything changed; the four values. Everything after line 5 is confirmation and drill-down.

### Screen and navigation diagram: the M2 web app

```
                    +-----------------------------------------------------------+
  every page:       | Clinician Scorecard   Dr. <Name>   [period: October 2026] |
  header +          | Scorecard | Definitions | What this is not                |
  role-based nav    |   + Patient feedback inbox (M4, surgeon)                  |
  + breadcrumb      |   + Queue (chief, chair)   + Leaders (M4, direct leader)   |
                    |   + Analyst (analyst)                                     |
                    +-----------------------------------------------------------+

  /me/<period>  Scorecard home                       breadcrumb: Scorecard > October 2026
  +-------------------------------------------------------------------------+
  | last refreshed 12 November 2026        <what this is not, one line>     |
  | What changed since September 2026 (R-115 block, or "No changes")        |
  | BUCKET 1  VOLUME AND MIX                                                |
  |   OR case volume ................ 19 operations as primary surgeon      |
  |     Records: 19 rows  |  Compared to: ... (4 surgeons)                  |
  |   Case mix index ................ Not in this release: needs Vizient ...|
  |   New patient visits ............ Not in this release: needs ...        |
  |   Work RVUs — live tracker ...... Not in this release: needs PBO ...    |
  | BUCKET 2  EFFICIENCY                                                    |
  |   First-case on-time start (FCOT) 5 of 7 first cases on time (71%)     |
  |     Records: 7 rows  |  Compared to: neurosurgeons at your site (9)    |
  |   ... (all five Bucket 2 tiles; then the F-104 sentence)                |
  | Bucket 3 Access: 2 metrics, not in this release  -> bucket page         |
  | Bucket 4 Quality and outcomes: 8 metrics, not in this release           |
  | Bucket 5 Patient experience: 5 items, not in this release               |
  | Bucket 6 Citizenship: 1 metric, not in this release                     |
  +-------------------------------------------------------------------------+
        |                       |                          |
        v                       v                          v
  /me/<p>/bucket/<n>     /me/<p>/metric/<key>        /definitions/<key>@<v>
  Bucket page            Metric page                 Definition page (READ)
  (bucket 5 = faculty    1 value or reason           text verbatim, version,
   layout, M4)           2 as logged | as adjudicated (when they differ)
                         3 Records: <n> rows  ----------------+
                         4 Compared to + spread (chart + 3 lines)
                         5 Trend (chart + vertical text table)
                         6 Definition stamp -> definition page
                         7 Source and as-of; last refreshed
                                                              v
                                          /me/<p>/metric/<key>/records  Record list
                                          caption "<metric>, October 2026: 7 rows"
                                          key columns first; [Dispute this record] per row
                                                              |
                                                              v
                                          /records/<ref>  Record detail (row, provenance,
                                                          every dispute on it, re-file control)
                                                              |
                                                              v
                                          /records/<ref>/dispute  Dispute form
                                          field selector; effect notice; claim; [File dispute]
                                                              |
                                                              v
                                          /disputes/<id>  Dispute detail
                                          surgeon: state, claim, decision, note, linked
                                          adjudicator: provenance panel + decision form

  chief / chair                     direct leader (M4)              analyst
  /queue  open, oldest first,       /leader  surgeons + the date    /analyst/runs, feeds,
          age in days, past-14      each inbox opens to the leader   exceptions, suppression,
          flagged; /queue/closed    /leader/<ref>/inbox  comments,   reconciliation, disputes,
  -> /disputes/<id> (decide)        scores, no notes, no controls    roster, registry, gates,
                                                                     deliveries, audit
  surgeon (M4)
  /me/inbox  comments newest first, same-survey scores, private notes under each,
             [Dispute attribution] per response, "Your direct leader can read this
             inbox from <date>"; nav entry reads exactly "Patient feedback inbox"
```

Trunk test on every page: the header names the product, the person and the period; the breadcrumb names the page; the nav marks the current section with `aria-current="page"` and an underline, never colour alone.

### Rating after: 9/10

It is a 9 because every surface now has a first, second, third, a navigation model exists per role, the home page shows live metrics before dead ones, and the email leads with the values. It is not a 10 because no mockup exists to check the hierarchy against a rendered page (deferred), and the bucket page and analyst screens are ordered by inventory, not by a stated hierarchy (analyst screens are out of scope for this pass; see NOT in scope).

---

## Pass 2: Interaction state coverage

### Rating before: 7/10

It is a 7 because the product's own absent-cell states are the best-specified part of the plan (section 9.4 and the technical design's page-state table cover no period, not on roster, suppressed, not authorized, load failure and empty for eight page groups), but success states are absent everywhere: what the surgeon sees after filing a dispute, what the chief sees after deciding, what a saved note looks like, what a validation failure on the claim field says, what an expired session does to a half-typed claim, and what an opted-out surgeon reads where the spread would be. Counting: 21 surfaces by 5 states is 105 cells; 61 were specified, 44 were not, and 9 of the product's own states (suppressed with reason, not applicable, pending source, interim, disputed, restated, opted out, month hidden, awaiting row) were specified for the email and only partly for the app. A 10 would fill every cell with what the user sees, in catalogue wording, including the success and validation states.

### The state table

Cells quote the catalogue key or the string. "n/a (server-rendered)" for LOADING means the browser's own loading indicator; no spinner, skeleton or partial page is ever drawn (technical design, F-85 AC 7). New keys added by this review are marked (new).

| Feature | LOADING | EMPTY | ERROR | SUCCESS | PARTIAL |
|---|---|---|---|---|---|
| Email: header and "This month" block (R-116) | n/a (static) | never empty: a tile with no value shows its reason in the value position | a missed run: "last refreshed" shows the prior period's date (R-86) | four lines, one per wedge tile | a held publish (R-84) sends nothing; the analyst's checklist lists it |
| Email: "What changed" block (R-115) | n/a | "No changes since <period>" | n/a | decisions with row text; restatements with both values; definition changes; new-record count | month one: block absent (nothing to compare) |
| Email: tile | n/a | "Not shown: 0 <unit> this <period>; needs at least <min-n>"; never-suppressed metrics show count 0 with its list, only when the feed loaded | "<feed> for <period> not received as of <date>"; "not computable: <field> not in extract" | value, records line, comparator, definition, trend | "Counted quarterly; the quarter closes <date>" with the count so far; "history from <date>"; as logged and as adjudicated when they differ |
| Email: spread (month two on) | n/a | "Peer comparison not shown: <n> peers in your <group> <scope> cleared at least <min-n> <unit> this <period>; needs 5 (you are not counted)" | n/a | three lines: spread-count sentence; "Peers: <ascending>"; "You: <value>" | month one: comparator line ends "(spread from month two)"; non-attendee: `spread-not-attended` text (D-17); opted out: `spread-opted-out` (new): "Peer comparison not shown: you opted out of the peer spread (recorded <date>). Ask the department analyst to opt back in." |
| Email: CSV attachment | n/a | header row plus the effect-notice comment line; zero data rows only when every denominator is 0 and the feed loaded | `--numbers-only`: every Records line reads "Your case list is available from the department analyst on request until the hosted view opens" | rows per metric equal the tile denominators; key columns first (R-121) | a re-credited row reads "not counted (re-credited)" under the adjudicated basis |
| Email: acknowledgement | n/a | n/a | reply with no usable case id: "awaiting row" acknowledgement asking for the sender's own case id (R-59) | "Dispute received on case <id>, filed <date>, routed to <chief or chair>." | further reply on an open dispute: acknowledged with the existing dispute id (R-64) |
| Email: decision | n/a | n/a | recompute failed after a decision: the decision email is held and the analyst's checklist lists it; the surgeon's next monthly email carries the decision once recompute passes | "Decision on case <id>: <F-59 row text>." then the updated tile block | definition question: "marked as a definition question; open item on the <metric> definition page dated <date>" |
| Web: home `/me/<period>` | n/a (server-rendered) | `no-period`: "No period has been published yet. The first period publishes after <date>." | `not-on-roster`; `not-authorized`; `load-failure`: "The page could not be loaded. Your data has not changed. Try again or contact <analyst mailbox>." | header, what changed, live tiles first, collapsed buckets after (R-117) | a period in the picker that was closed but not published for this viewer (whole-month leave, roster end): `period-not-published-for-you` (new): "No scorecard was published for you for <period>: <reason from the run record>." |
| Web: period picker | n/a | one period: picker renders as text, not a control | n/a | closed, published periods only, newest first (F-84) | n/a |
| Web: bucket page | n/a | every tile in the bucket "Not in this release": tiles render with their reason; the page is never blank | as home | full tiles; Bucket 5 in the faculty layout (M4) | Bucket 2 keeps the F-104 sentence in every state |
| Web: metric page | n/a | suppressed: reason text in the value position; comparator line, definition stamp and records link stay (F-32 AC 4) | as home; unknown metric key: 404 with the definitions index link | value; both bases when they differ; records link second; spread; trend; stamps | `restatement-pending` (new): "Decided <date>; your number is being recomputed. This tile shows the value published <date>." shown when a sustained decision's recompute has not completed |
| Web: spread chart | n/a | replaced by the peer-under-five text | n/a | strip plot with unlabelled peer markers and the "You" marker, three-line text beneath (R-119) | opted out or not attended: the text key in the chart's position; no chart |
| Web: trend chart | n/a | "history from <date>" above a one- or two-point series; never zero-filled | n/a | line with restated markers and version boundary rules; vertical text table beneath | gap periods carry their `gap_reason` text in the table and a gap in the line |
| Web: record list | n/a | "0 rows; the <period> extract loaded with no cases credited to you"; failed feed renders `feed-not-received` instead | as home; sort parameter unknown: default order, no error | caption "<metric>, <period>: <n> rows" equal to the denominator; dispute button per row; dispute state in its own column | suppressed metric: heading "3 rows (Not shown: 3 first cases this month; needs at least 4)"; sorted state carries `aria-sort` on the header |
| Web: record detail | n/a | never disputed: "No disputes on this record." | `not-authorized` (same bytes for not yours and not found) | row columns; provenance block; dispute history in order; re-file control when allowed | after a decision: the row state text; "You may re-file once with new evidence" when R-64 allows; "correction requested at source, <date>" while open |
| Web: dispute form (GET) | n/a | record type with no disputable field: no button, no form (F-56 AC 1) | `not-authorized` when not credited | record identity, metrics fed, field selector, effect notice above the submit control, claim field with a character cap shown | one field disputable: selector renders as text |
| Web: dispute form (POST) | n/a | empty claim: `claim-required` (new) beside the field: "Say what happened; the chief reads this." | claim over the cap: `claim-too-long` (new) with the cap and the count; identifier pattern hit: `claim-identifier` (new): "Your claim appears to contain a patient identifier (<pattern name>). Describe the record by its case id and what happened, then file again."; session expired on POST: `session-expired` (new): "Your session ended after 30 minutes idle. Sign in again; the claim you typed was not saved." | redirect to `/disputes/<id>` whose first line is the acknowledgement text "Dispute received on case <id>, filed <date>, routed to <chief or chair>." (`dispute-filed`, new; same string as the email) | n/a |
| Web: dispute detail (surgeon) | n/a | n/a | as home | claim, state, decider, date, note, linked disputes | withdrawn (D-27): row and detail read `dispute-withdrawn` (new): "Withdrawn by you on <date>." |
| Web: dispute detail (adjudicator) | n/a | n/a | routing test fired for this chief: `not-authorized` (F-58 AC 3) | provenance panel; decision form (decision, outcome when sustained, note required); after POST: `decision-recorded` (new): "Decision recorded <date>. <Surgeon>'s <metric> for <period> was recomputed; the decision email was sent." | survey record, adjudicator not the direct leader: "Comment withheld: shown only to the direct leader of record" in the comment position; recompute failed: "Decision recorded; recompute did not complete; the analyst has been alerted" |
| Web: queue | n/a | `queue-empty` (new): "No open disputes routed to you." with the closed-list link (CEO T10) | `not-authorized` for a non-adjudicator | oldest first; age in days; "past 14 days" as text in the age cell; no values or spreads anywhere | closed list: decision dates; a re-filed dispute linked to its first |
| Web: definition page | n/a | n/a | unknown version: 404 with the index link | text verbatim, version, source, cadence, min-n, comparator, levers, assumptions with status, reason sets, version history, open items | reason set pending: the exact pending text; `v1` page unchanged after `v2` exists |
| Web: "what this is not" | n/a | n/a | n/a | the current statement, version and date | n/a |
| Web: Bucket 5 page (M4) | n/a | measure with fewer than five qualifying peers: chart replaced by the peer-under-five text with group "department", scope "across the system" | as home; `feed-held` when the survey month is quarantined (D-40) | five cells per measure in the slide's column order; bar chart; three lines; trend; records link; scope label | hidden month: "Hidden: <n> responses this month; needs at least 10" in that cell only |
| Web: per-response list (M4) | n/a | "0 responses in <period>" | as home | survey month, four scores, comment present yes or no, provider named; dispute action per row; no comment text | disputed row: F-73 state text |
| Web: Patient feedback inbox (M4) | n/a | "No comments about you in the loaded survey months."; no count anywhere else | `not-authorized` with no comment or score in the payload | comments newest first with same-survey scores; notes under each; note form; "Your direct leader (<name>) can read this inbox from <date>" (R-118) | disputed response: "Disputed - with chief, filed <date>" beside it; the comment stays until OQ-43 is answered |
| Web: private note (POST, PUT, DELETE) | n/a | no notes: "[ add a note ]" only | empty note: `note-required` (new): "Write the note before saving."; session expired: `session-expired` | after save: the note listed with its timestamp and `note-saved` (new): "Note saved <timestamp>. Visible to you only."; after delete: `note-deleted` (new): "Note deleted." | n/a |
| Web: leader landing (M4) | n/a | `leader-none` (new): "You are not the direct leader of record for any surgeon as of today." | `not-authorized` | surgeons for whom the viewer is direct leader, each with "inbox available to you from <date>" | a surgeon whose gate has not opened: the date only, no link |
| Web: leader inbox view (M4) | n/a | as inbox | `leader-gate`: "Available to the direct leader from <date>" | comments and same-survey scores newest first; no notes; no note controls | measures and chart only when `leader_sees_measures` is on (OQ-42) |
| Web: analyst screens | n/a | "none" per table; runs page: "no runs" | `not-authorized` | tables over `analyst_ro`-visible rows | n/a |

### The product's own states, on every surface

| Product state | Email | Web app | Screen-reader text |
|---|---|---|---|
| Suppressed with reason (min-n) | reason in the value position; records line kept | same; the record list opens | the sentence itself |
| Suppressed with reason (peer-under-five) | comparator line ends with the reason; own value and trend stay | same; chart position carries the reason text | the sentence |
| Not applicable | "Not applicable: no allocated block this month" | same | the sentence |
| Not in this release; pending source | "Not in this release: needs <feed>; owner not yet named"; "Data source pending confirmation" | same tile text; collapsed to one line per bucket on home | the sentence |
| Interim (correction requested at source; not reconciled to periop's report; restatement pending) | row: "correction requested at source, <date>"; tile: "not reconciled to periop's report" | same; plus `restatement-pending` on the tile | the sentence |
| Disputed | row: "Disputed - with chief, filed <date>; target decision by <date>" (R-61 as amended, taste) | same in the dispute-state column and on record detail | the sentence |
| Restated | `*` after the trend row and a legend line naming the cause; both values in the what-changed block | marker on the point; "restated" in the text table; both values in the what-changed block | "restated on <date> (<cause>); as logged <value>" |
| Opted out | `spread-opted-out` where the spread would be | same | the sentence |
| Month hidden (Bucket 5) | not in email (F-69 AC 5) | "Hidden: <n> responses this month; needs at least 10" in the cell | the sentence |
| Awaiting row | acknowledgement asking for the case id | n/a (the hosted form is pinned to a record) | n/a |

### Rating after: 9/10

It is a 9 because every cell now names what the user sees, the ten new keys are catalogue entries (F-33 AC 5 applies to them), and the product's own states are mapped to both surfaces and to screen-reader text. It is not a 10 because two states differ in kind and were left as Pass 7 decisions rather than filled by default: what the analyst does when recompute fails after a decision (the surgeon-facing text exists; the operating rule does not), and what a surgeon on whole-month leave receives (CEO review left it with the definitions owner).

---

## Pass 3: User journey and emotional arc

### Rating before: 6/10

It is a 6 because the journeys are the strongest documents in the set (each step has a failure mode and a success outcome) and the CEO review's section 11 wrote the arc in prose, but the plan never checks the arc against what each screen actually shows: the surgeon's first five seconds on the month-one email are spent on instructions; finding "the case on the 14th" in a 25-column CSV on a phone is not walked; the dispute form tells the surgeon the number will not move without saying what will; a filed dispute has no visible expected-by date; the inbox never tells the surgeon when the leader can read it. A 10 would storyboard J1 to J3 with the feeling each step must land and a plan line for each.

### Storyboard: J1, month one and month two

| Step | User does | User feels | Plan specifies? |
|---|---|---|---|
| J1.1 | Sits through step zero; hears "not a comp input, not a rank"; hears "the spread hides names, not people"; decides on opt-out | Wary, then reassured by the plainness of the "what this is not" page | Yes: F-42, roster flags (F-99) |
| J1.2 (5 seconds) | Opens the month-one email on a phone in a corridor | Wants to know "is anything about me wrong?" in one glance | Before: no; instructions first. After: R-116 header, what-this-is-not, "This month" block inside the first screen |
| J1.3 (5 minutes) | Reads the FCOT tile: 5 of 7 (71%), definition version, "reconciled to periop's October report" | Trusts the number a little because it says it matches periop and shows the denominator | Yes: F-51, F-81, J1.3 text |
| J1.4 | Opens the CSV to find the late first case from the 14th | Frustrated if the CSV opens on 25 columns and the date is column five | Before: column order unspecified. After: R-121 key columns first (`metric`, `case_id`, `date`, `on_time`, `delay_reason`, `delay_label`, `dispute_state`), rows sorted by metric then date |
| J1.5 | Opens the definition text (in the email appendix) and reads "the institutional definition is used so the number matches periop's" | Understands why the anesthesia delay counted; may still feel it is unfair | Yes: R-52; the effect notice on the CSV comment line says what a delay-reason dispute changes |
| J1.7 | Reads OR case volume: 19; "4 surgeons; spread from month two" | Notes that a spread of four will never render; not surprised later | Yes: F-34, J1.7 |
| J1.8 | Reads "Counted quarterly; the quarter closes 31 December. Scheduled cases so far: 24." | Calm; the metric is not hiding | Yes: F-45 |
| J1.9 | Sees "Not in this release" once, not 21 times | Not fatigued | Before: 21 lines. After: one paragraph (R-116) |
| J1.10 (month two) | Opens the email; reads "What changed since October"; reads the three-line spread under FCOT: 7 peers, Peers ascending, You: 71% | Locates self at a glance; the count sentence says nobody was hidden | Yes: R-115, F-46 AC 6 |
| J1.11 | Recognises the chief in the seven markers | Unsurprised, because step zero said so; no claim of anonymity to be broken | Yes: F-46 AC 3, P5 |
| J1.12 | Replies "seen", or asks a question, or files (to J2) | Knows a person reads the reply within two business days | Yes: R-95 |

### Storyboard: J2, dispute to outcome

| Step | User does | User feels | Plan specifies? |
|---|---|---|---|
| J2.1 | Opens the month-three FCOT list at 60%; finds "surgeon late" on a day they waited on anesthesia, a blank reason, and Dr. Y's case | Alarm, then focus: "which rows are wrong?" | Yes: row columns, shared flag (F-01, F-49) |
| J2.2 | Reads the effect notice before filing: "your FCOT number does not move" | Deflated: "then why bother?" | Before: notice states only what does not change. After: R-58 amended: the notice also states what does change ("The row will read 'not your delay' on every artifact and the correction goes to periop on the monthly list") |
| J2.2 (form) | Writes the claim; the form caps length and warns off identifiers | Slight anxiety about PHI; the label says how to describe the record | After: `claim-identifier`, `claim-required`, `claim-too-long` (R-118) |
| J2.3 | Submits; lands on the dispute detail | Wants confirmation it went somewhere and when to expect an answer | Before: redirect only. After: `dispute-filed` first line with the routed-to role; row state carries "target decision by <date>" (R-61, taste) |
| J2.3a (email months) | Replies quoting the case id; gets the acknowledgement within two business days | Relief that a person answered with the id and date | Yes: R-59 |
| J2.5 | Chief opens the queue: oldest first, age in days, "past 14 days" as text | Chief sees a record, not a score; no defensiveness about a colleague's number | Yes: F-60; `queue-empty` added |
| J2.6 | Chief decides "sustained (annotated)" and writes a note | Chief wants to know the note reached the surgeon and the number is updated | After: `decision-recorded` names the recompute and the decision email |
| J2.8 | Surgeon returns: row reads "Dispute sustained (annotated) by division chief on <date>: delay reason corrected to anesthesia; correction requested at periop <date>"; the case is still late | Closure on the row, mild dissatisfaction that the number stayed; the effect notice pre-empted it | Yes: F-59, F-56 |
| J2.8a | Denial: row reads "Dispute not sustained by division chief on <date>: <note>"; the surgeon may re-file once | Disagreement, but the note is visible and the path is stated | Yes: R-64; record detail states the re-file allowance |
| J2.9 | Re-attribution sustained: tile reads "as logged 60% (6 of 10); as adjudicated 67% (6 of 9)" side by side; Dr. Y receives the re-credit email | Vindication; Dr. Y is not ambushed | Yes: F-47, F-92 AC 2; R-119 fixes how the two values sit (same line, logged first, both denominators, adjudicated repeated on the trend point) |
| J2.12 | Files "the grace window should be five minutes" | Heard, not dismissed: the definition page shows the open item with a date | Yes: F-63 |

### Storyboard: J3, inbox and leader view

| Step | User does | User feels | Plan specifies? |
|---|---|---|---|
| J3.1 | Opens Bucket 5: year average, three months, MGB average in the slide's order; 41 unlabelled bars, one marked "You" | Recognition ("this is the slide I know") plus the one new thing | Yes: F-69, F-40; R-119 draws the bars |
| J3.2 | Sees "Hidden: 7 responses this month; needs at least 10" in one cell | Understands it is a small month, not a bad one | Yes: F-41 |
| J3.4 | Opens the Patient feedback inbox: comments newest first, scores beside each, nothing counted, no badge | Bracing for criticism; reassured that nothing is tallied | Yes: F-70; nav entry text fixed |
| J3.5 | Reads a critical drain-care comment next to 5 of 5 on respect | Sting, then perspective from the same-survey scores | Yes: J3.5; R-120 sets the READ measure (65 to 75 characters) so the comment reads as prose, not a table cell |
| J3.6 | Writes a private note; saves | Needs to be sure it is private and saved | After: `note-saved` states "Visible to you only." |
| J3.7 | Finds an APP's visit; presses the action beside the comment | Hesitates: "am I disputing the patient's words?" | Before: button reads "Dispute this record". After: on survey responses the action reads "Dispute attribution" with the helper line "The comment cannot be disputed; only who it is credited to." (R-118) |
| J3.8 | Leader opens the landing: surgeons with the date each inbox opens; opens one after day 30 | Leader sees comments, no notes, nothing counted | Yes: F-89; `leader-none` added |
| J3.8 (surgeon side) | Surgeon wonders whether the leader has read it | Uneasy if nothing says when the leader gets access | Before: no. After: the inbox header states "Your direct leader (<name>) can read this inbox from <date>" (R-118); whether a view indicator exists stays OQ-42 |
| J3.10 | Returns next month: three-month window rolled; hidden month still hidden with its reason | Continuity | Yes: F-48 |

### Time horizons

- Five seconds: the email's first screen (R-116) and the home page's header and what-changed block (R-117).
- Five minutes: the list, the row, the dispute form with its effect notice, the acknowledgement.
- Five years: the trend with restated markers and version boundaries, the definition page's version history, and the record's full dispute history (F-62 AC 1). The plan already covers the long horizon well; the fixes above are all at five seconds and five minutes.

### Rating after: 8/10

It is an 8 because the three journeys are storyboarded, every "no" in the plan column has a fix applied, and the two beats that drain goodwill fastest (instructions before numbers; "the number will not move" with nothing gained) are repaired. It is not a 10 because the fixes are text, unverified against a rendered screen, and because the R-61 target-date line is a taste decision that could be reversed.

---

## Pass 4: AI slop risk

### Surface classification

HYBRID, classified per section: the web app's home, bucket, metric, record and queue pages are OPERATE; definition pages, "what this is not" and the inbox are READ; the email is plain text and can only fail on copy. There is no PERSUADE surface anywhere in this product and none should be added.

### Rating before: 7/10

It is a 7 because the plan is already unusually specific for a plan: catalogue strings, a 72-column template, inline SVG with a text table beneath, a page inventory with URLs. It loses three points because the words "tile" and "tiles in compact form" are the only description of the home page, and a builder reading "25 tiles in six sections" will produce a card grid (hard rejection: app UI made of stacked cards instead of layout); because no spread form is chosen for share and count metrics (OQ-26), so the default is a bar chart of point estimates with a highlighted bar, which is every dashboard's peer chart; because nothing names a font, so `system-ui` becomes the display voice by default; and because "as logged" and "as adjudicated" side by side is stated but not drawn.

### Hard rejections checked

| Hard rejection | Hit? | Evidence |
|---|---|---|
| Generic SaaS card grid as first impression | Risk, resolved | "tiles" undefined; R-117 defines a tile as a row in a definition list, not a card |
| Beautiful image with weak brand | No | No imagery anywhere |
| Strong headline with no clear action | No | The home page's action is the records link on every live tile |
| Busy imagery behind text | No | None |
| Sections repeating the same mood statement | Risk, resolved | 21 "Not in this release" tiles; collapsed by R-116 and R-117 |
| Carousel with no narrative purpose | No | None; the period picker is a select, not a carousel |
| App UI made of stacked cards instead of layout | Risk, resolved | R-117 |

### Blacklist audit

| Item | Email | Web app | Disposition |
|---|---|---|---|
| Purple, violet or indigo gradients; blue-to-purple | n/a | unspecified | R-120: one accent, no gradients |
| Three-column icon-in-circle feature grid | n/a | unspecified | R-117: no icons in the app; state is text |
| Icons in coloured circles as decoration | n/a | unspecified | R-117: no icons |
| Centered everything | n/a | unspecified | R-120: left-aligned text, right-aligned numerals in value columns |
| Uniform bubbly border radius | n/a | unspecified | R-120: radius 2 px on controls only |
| Decorative blobs, floating circles, wavy dividers | n/a | unspecified | R-120: hairlines only |
| Emoji as design elements | the `*` restated marker is punctuation, not emoji | unspecified | R-120: no emoji; markers are shapes with text labels |
| Coloured left border on cards | n/a | unspecified | R-117: no cards |
| Generic hero copy | none ("This email carries your own numbers and your own case list, and nothing else.") | none | keep |
| Cookie-cutter section rhythm | n/a | n/a | not a marketing page |
| `system-ui` or `-apple-system` as display font | n/a | unspecified, so it would be the default | R-120 names a self-hosted face |

Litmus checks (evidence, not a score): the product is unmistakable in the first screen because the first line is the surgeon's name and period and the second is the "what this is not" sentence; the visual anchor on a metric page is the value line; the home page is understandable from headings alone (bucket names, metric names, values); each section has one job; cards are not necessary; there is no motion; nothing depends on decorative shadow.

### Rewritten descriptions (generic to specific)

**What the surgeon sees first on `/me/<period>`.** Line one: "Clinician Scorecard, Dr. <Name>, October 2026 at <site>" as the `h1`, with "last refreshed 12 November 2026" beside it. Line two: the "what this is not" sentence, in body type, not a banner. Then the "What changed since September 2026" block as a short list, or "No changes since September 2026". Then "BUCKET 1 VOLUME AND MIX" as an `h2`, and the tiles.

**A tile is a row, not a card.** Each metric is one row of a definition list inside its bucket: metric name on the left in the text face, medium weight; value on the right in tabular numerals, or the reason sentence in the value position in the same size; beneath, one line of small text: "Records: 7 rows" then "Compared to: neurosurgeons at your site (9 surgeons; spread from month two)". A hairline separates buckets, not tiles. No border, background, shadow, icon or colour on a tile. The whole metric name is the link to the metric page; the records text is a second link to the list.

**As logged and as adjudicated, side by side.** On one value line, in this order and this wording: "as logged 60% (6 of 10) · as adjudicated 67% (6 of 9)", separated by a middle dot with a space either side, both in tabular numerals, the adjudicated pair in the same weight as a single value. The records line beneath reads "Records: 9 rows counted as adjudicated; 10 rows in the list" and the list carries a "counted" column. On the trend, the October point is the adjudicated value with a restated marker; the text table row reads "2026-10 67% 6/9 restated on 2026-11-12 (dispute D-0014); as logged 60% 5/7". Never two tiles, never a toggle.

**Suppression reasons, exact wording, in the value position.** "Not shown: 3 first cases this month; needs at least 4" replaces the value; the comparator, definition stamp and records link stay. "Peer comparison not shown: 4 peers in your subspecialty at this site cleared at least 5 cases this month; needs 5 (you are not counted)" replaces the spread; the value stays. Same size and face as a value; no grey-out, no icon, no italic.

**How the spread is drawn for six peers (share and count metrics, hosted).** A strip plot: one horizontal axis in the metric's unit spanning the full content width, ticks at round values, no vertical axis, no bars. Six hollow circles for the peers, 12 px, placed at their values; ties stack vertically. One filled square, 12 px, for the surgeon, with the text label "You 71%" beside it. The spread-count sentence above the plot; the three-line text form beneath it as the `aria-describedby` target. No peer label, initial, tooltip or hover on peer markers. This is the versioned form recorded under OQ-26 for share and count metrics (R-119). Bucket 5 stays a bar chart of all system neurosurgeons sorted ascending with the surgeon's bar hatched and labelled "You" (F-40); Bucket 4 stays interval dots (F-24). Ghosted wRVU bars stay hatched with a legend entry (technical design chart rules).

**How "Not in this release" reads.** On the bucket page, a full tile whose value position reads "Not in this release: needs the block allocation and release schedule; owner not yet named". On the home page, one line per bucket with no live metric. Never a lock icon, a badge, a "coming soon" or a greyed card.

**The queue.** A table, not a list of cards: columns Case id, Metric and period, Filed, Age (days), Route; rows oldest first; the age cell reads "16 (past 14)" as text; the case id is the link. Above it: "Open disputes routed to you: 3". Below: "Closed disputes" link. No value, spread or position of any surgeon anywhere on the page.

### Rating after: 9/10

It is a 9 because every hard rejection risk is resolved by a stated layout, every blacklist item has a token or rule against it, and the four descriptions the task asked for are now specific enough that two builders produce the same page. It is not a 10 because the three-looks calibration cannot be checked without a rendered page: the choices above avoid the three default looks (no cream and serif, no neon on black, no broadsheet hairlines and italic serif) but only a mockup would show whether the result reads as this product rather than as a generic intranet table.

---

## Pass 5: Design system alignment

### Rating before: 2/10

It is a 2 because no DESIGN.md exists and the plan names no token: no font, no scale, no colour, no spacing, no focus ring, no radius. The two points are for the rules that behave like tokens already: 4.5:1 contrast, 16 px body minimum, "never colour alone", inline SVG with a text table, `Content-Security-Policy: default-src 'self'` (which forbids a CDN font and so forces a self-hosted one). A 10 would have a DESIGN.md that every screen cites by token path.

### Finding

8. **No token set.** (Recommended, applied as a proposal, not an approval) The minimum set the M2 app needs, written as CSS custom properties in `web/static/scorecard.css` and recorded in the PRD as R-120, pending `/design-consultation` and the human's choice. Proposed values:

| Token | Value | Why |
|---|---|---|
| `--font-text` | IBM Plex Sans, self-hosted in `web/static/fonts/` (OFL), with `font-feature-settings: "tnum"` on every numeric cell | A humanist sans with tabular figures so values align in columns; self-hosting satisfies the CSP; not `system-ui` |
| `--font-mono` | IBM Plex Mono, self-hosted | Case ids (`C-7K3Q9M`) and version hashes |
| Type scale | 16 px body; 18 px tile value; 20 px `h3`; 24 px `h2`; 32 px `h1`; small text 14 px only for the records and comparator lines under a tile and never below 14 px; line height 1.5 for body, 1.25 for headings | Body never under 16 px (universal rule); one step per level |
| Measure | READ pages (definitions, "what this is not", inbox comments) max 72 characters; OPERATE pages max 1100 px content width | READ mode rule; tables need width |
| `--ink` | `#1a1a1a` on `--surface` `#ffffff` | 16:1 |
| `--ink-muted` | `#555555` | 7.5:1 on white; comparator and records lines |
| `--hairline` | `#d4d4d4` | bucket separators, table rules |
| `--accent` | `#1d4ed8` | links and the focus ring only; 6.3:1 on white; one accent, no gradient |
| `--state-disputed` | text `#7a4a00` on `#fff4d6` | dispute-state cell background only; the words carry the state |
| `--state-restated` | no colour; a filled diamond marker plus "restated" in text | the marker is a shape, not a hue |
| `--state-suppressed` | no colour; the reason sentence in `--ink` at value size | suppression is information, not an error |
| `--state-sustained` | text `#1f5e2c` on `#e6f4ea` | dispute-state cell only |
| `--you` marker | filled square, `--ink`, label "You <value>" | shape plus text, never colour alone |
| Spacing | 4, 8, 12, 16, 24, 32, 48 px; 24 px above an `h2`, 8 px below; 16 px above an `h3`, 4 px below | headings closer to what follows than what precedes |
| Radius | 2 px on buttons and inputs; 0 elsewhere | no bubbly radius |
| Focus ring | 2 px solid `--accent`, 2 px offset, on every focusable element; never removed | visible without hover |
| Buttons | 44 px minimum height; primary ("File dispute", "Record decision") filled `--accent` with white text; secondary ("Dispute this record", "edit", "delete", "add a note") outlined `--ink` on white | one primary per page |
| Tables | `border-collapse`; header row bold with `--hairline` rule beneath; zebra off; numerals right-aligned | dense but readable |
| Selection, caret, scrollbar | `::selection` in `--accent` at 20% alpha; caret `--accent`; default scrollbars | themed browser surfaces |
| Motion | none authored; no transitions | an OPERATE surface for numbers a surgeon may dispute; nothing should move |
| Dark mode | not provided at M2; `color-scheme: light` declared | deferred; the use scene is a desk under office light |
| Charts | stroke `--ink` 1.5 px; peer markers hollow `--ink`; "You" filled; ghosted series hatched `--ink-muted`; intervals as 1.5 px horizontal lines with 1 px end caps | two shapes plus text, not two hues |

### Rating after: 7/10

It is a 7 because the app now has a named face, scale, colours, spacing, focus ring, control sizes and chart strokes that every screen description above cites, and none of them is a blacklist default. It is not higher because the set is a proposal in a PRD row, not a DESIGN.md, nobody has approved a font or a colour, and `/design-consultation` has not run. A declined or unmade choice keeps this pass below 8 by the digest's rule.

---

## Pass 6: Responsive and accessibility

### Rating before: 7/10

It is a 7 because the accessibility floor is above most plans (semantic HTML, one `h1`, `<th scope>`, captions, labels, 4.5:1, keyboard, no JavaScript needed, `role="img"` with `aria-describedby`, 360 px without hiding anything). It loses points because "tables scroll inside their own container, tiles stack" is the whole phone specification; because the email's 70-character ruler lines wrap into two lines of `=` on a phone and a screen reader announces them as seventy equals signs; because no touch-target size, no ARIA landmark set, no keyboard pattern for the sortable headers and no screen-reader text for the spread beyond "the text table" are named; and because the CSV's column order defeats a phone reader.

### Findings

9. **Email rulers.** (Recommended, applied) Remove the `=====` and `-----` ruler lines. Section headings are the upper-case line followed by one blank line. On iOS Mail portrait at default type, plain text wraps near 45 characters, so a 70-character ruler becomes two ragged lines; VoiceOver reads it as a count of symbols. Trend rows ("2025-11   83%   5/6", 19 characters) and the "Peers:" line (about 45 characters for seven percentages) fit. Recorded on R-94 and R-121.
10. **CSV on a phone.** (Recommended, applied) Column order by what the surgeon looks for: `metric`, `case_id`, `date`, `on_time`, `delay_reason`, `delay_label`, `dispute_state`, `counted`, `shared`, then `room`, `procedure`, `scheduled_start`, `wheels_in`, `booked_minutes`, `actual_minutes`, `within_20pct`, `within_30min`, `test_applied`, `cancelled_same_day`, `cancellation_reason`, `in_attributable_set`, `credited_to`, `source`, `load_date`, `definition_version`, `period`; rows sorted by `metric` then `date`. The row count per metric is unchanged. Recorded on R-121.
11. **Per-viewport layouts.** (Recommended, applied) Recorded on R-121:

| Viewport | Home and bucket | Metric page | Record list | Queue | Inbox |
|---|---|---|---|---|---|
| Desktop (1024 px and up) | one column, 1100 px max; tile as a definition-list row with name left and value right | value line full width; records link beneath; spread and trend stacked full width; text tables beneath each chart | full table; dispute button as the last column | full table | comments in a 72-character measure; scores as one line above the comment; notes indented |
| Tablet (768 to 1023 px) | as desktop; 16 px gutters | as desktop | full table, horizontal scroll inside the table container when wider than the viewport; the first two columns (`case_id`, `date`) sticky with `position: sticky` (CSS only) | as desktop | as desktop |
| Phone (360 to 767 px) | name and value on two lines, value first in 18 px, name beneath; the records and comparator lines wrap; collapsed buckets stay one line | value line; records link; spread as the strip plot at full width with the axis labels reduced to the minimum, the maximum and the surgeon's value; trend chart kept at full width with the text table beneath it as the primary reading; nothing hidden (F-108 AC 3) | the table keeps table semantics; key columns first (R-121) so `case_id`, `date`, `on_time`, `delay_reason` fit in 360 px without scrolling; the dispute button is a 44 px-high full-width control in a final column reached by horizontal scroll, and is repeated as a link on the record detail page | one row per dispute with the age wrapped beneath the id | as desktop with the measure at the viewport width minus 32 px |

12. **Keyboard.** (Recommended, applied) Skip link ("Skip to scorecard") first in the tab order; the nav, then the period picker (a `<select>` in a `<form>` with a "Go" button so no JavaScript is required), then the content in reading order; sortable column headers are links that change the query string and carry `aria-sort` on the sorted column; the dispute form's submit is the last control and Enter submits; every button is a `<button>` or `<a>`, never a `<div>`; focus ring per R-120 on every focusable element. Recorded on R-121.
13. **ARIA landmarks.** (Recommended, applied) `<header>` with the product name, person and period; `<nav aria-label="Scorecard">` for the role-based navigation; `<main>` containing one `h1`; each bucket a `<section aria-labelledby>` its `h2`; the what-changed block an `<aside aria-labelledby>`; `<footer>` with the "what this is not" line and the analyst mailbox. Charts `role="img"` with `aria-describedby` pointing at the three-line spread text or the trend text table; the trend chart's `<title>` states the metric and period. Recorded on R-121.
14. **Touch targets and contrast.** (Recommended, applied) Every link in a tile, every button, the period picker, the note edit and delete controls and the row dispute button are at least 44 by 44 px; inline links in prose are exempt but carry 8 px vertical padding. Text contrast 4.5:1 minimum (all R-120 pairs exceed it); chart strokes 3:1 against `--surface`. Body text 16 px minimum; the 14 px small text is limited to the two lines under a tile and never carries a state. Recorded on R-121.
15. **Table semantics for record lists.** (Recommended, applied) `<table>` with `<caption>` "<metric>, <period>: <n> rows"; `<thead>` with `<th scope="col">`; the case id cell is `<th scope="row">`; the dispute state is its own column with the full state text, never a tooltip or an icon; the dispute button's accessible name is "Dispute this record <case id>". Recorded on R-121.
16. **Screen-reader text for the spread.** (Recommended, applied) The `aria-describedby` target is the three-line text form (F-46 AC 6) rendered as a `<p>` per line, not a visually hidden element, so sighted and non-sighted readers get the same words. Recorded on R-121.

### Rating after: 9/10

It is a 9 because each viewport now has intentional changes, keyboard, landmarks, targets, contrast, table semantics and the spread's screen-reader text are specified, and the email's two phone failures are fixed. It is not a 10 because the institutional accessibility standard is still unnamed (OQ-51) and no page has been rendered and tested.

---

## Pass 7: Unresolved design decisions register (unscored)

Each row cites an in-scope element. "Auto-chosen" rows were taken at the recommended option under the headless rule and applied to the PRD; the human can reverse them. "Unresolved" rows differ in kind and were left open.

| # | Decision needed | If deferred, what happens | Disposition |
|---|---|---|---|
| 1 | The email's first screen: a "This month" block of four lines above the full tiles, or the full tiles alone | The engineer ships the technical design's template; the surgeon reads instructions and a 12-row trend before the second value | Auto-chosen: add the block (R-116); P5 explicit |
| 2 | The hosted spread form for share and count metrics (OQ-26): strip plot, bar chart, or box | The engineer ships `bar_spread()` for every metric; a bar chart of point estimates with one highlighted bar, which is every dashboard's peer chart | Auto-chosen: strip plot (R-119), recorded as the versioned form under OQ-26 |
| 3 | The display face: IBM Plex Sans self-hosted, another OFL face, or the system stack | `system-ui` becomes the display voice (blacklist item) and numerals do not align | Auto-chosen as a proposal (R-120); flagged for `/design-consultation` |
| 4 | Whether the row's dispute state shows "target decision by <filed + 14 days>" to the surgeon | The surgeon sees "with chief, filed <date>" with no expectation; a missed 14 days is invisible on the row and only the analyst's checklist knows | Auto-chosen: show it (R-61); flagged Taste: it makes a department target a visible promise |
| 5 | Whether the surgeon's inbox states the date the direct leader can read it | The surgeon does not know when the leader gains access; OQ-42's view indicator stays open either way | Auto-chosen: state the date (R-118); the indicator stays OQ-42 |
| 6 | The label of the dispute action on a survey response | "Dispute this record" beside a patient's words reads as disputing the comment | Auto-chosen: "Dispute attribution" with the helper line (R-118) |
| 7 | What a tile shows between a sustained decision and a completed recompute | The tile shows the old value with no cue, or the new value before the decision email; the row and the tile disagree | Auto-chosen: `restatement-pending` text (R-118); the operating rule for a failed recompute stays with `/plan-eng-review` |
| 8 | What a surgeon on whole-month approved leave receives, and what the period picker shows for a period with no publish for them | An email of four "0" values, or a missing period with no reason | Partly auto-chosen: `period-not-published-for-you` (R-118) for the picker; the email content stays with the definitions owner (CEO review, unresolved) |
| 9 | Session expiry on a half-typed claim: discard with a message, or preserve the draft through re-authentication | A silent redirect to sign-in; the claim is lost and the surgeon does not know | Auto-chosen: `session-expired` message and a note on the form "Sessions end after 30 minutes idle"; preserving drafts needs client state and is out of scope (P3) |
| 10 | Whether opted-out surgeons see a specific text where the spread would be | The engineer reuses the peer-under-five text, which is untrue for them | Auto-chosen: `spread-opted-out` (R-118) |
| 11 | Whether buckets with no live metric collapse to one line on the home page | 21 "Not in this release" tiles above the fold at M2 | Auto-chosen: collapse (R-117) |
| 12 | Dark mode for the M2 app | Nothing; `prefers-color-scheme: dark` shows the light page | Deferred: `color-scheme: light` declared (R-120); NOT in scope |
| 13 | Print or export for annual review (OQ-46) | A surgeon prints the browser page; charts and sticky columns print badly | Unresolved with the definitions owner; a print stylesheet is a one-day task once decided |
| 14 | Mockups: three variants per screen for the home, metric, record list and inbox pages | Every layout above stays text; the three-looks calibration and the hierarchy remain unverified | Deferred (headless); NOT in scope |
| 15 | Whether the "What changed" block appears on the home page as well as in the email (R-115 says every email) | The page and the email disagree on the second thing the surgeon sees | Auto-chosen: on the home page too (R-117), rendered from the same artifact fields |

Decisions: 15 (12 auto-chosen, 1 partly, 2 deferred or unresolved).

---

## NOT in scope

- Mockups and the comparison board: deferred to the next interactive session; every layout in this review is text and unverified.
- `/design-consultation` and a DESIGN.md: R-120 is a proposal; the skill is not chained under the headless rule.
- Dark mode: no use scene calls for it at M2; declared light.
- Print stylesheet for annual review: waits on OQ-46.
- Analyst screens' hierarchy: nine pages over `analyst_ro` tables read by one or two operators; the inventory and "none per table" empty states are enough for M2; reviewed as a group in Pass 2 only.
- The BI pub export's visual form: deferred until a sponsor asks (D-36).
- The institution's accessibility standard: OQ-51; conformance is a new version of F-108 when named.
- Division and site views: no specification exists (OQ-52).

## What already exists

- The reason catalogue (F-33): every string in this review is or becomes a catalogue key.
- `ClinicianArtifact` (technical design): every hierarchy above is an ordering of its fields.
- The plain-text template, CSV column list, page inventory, authorization matrix, page-state table, chart rules and accessibility baseline (technical design "Delivery surfaces"): amended, not replaced.
- F-108 and R-111: the accessibility floor this review extends.
- The three-line spread (F-46 AC 6): reused as the screen-reader text for every hosted spread.
- The CEO review's user-flow diagram and section 11: the starting point for Pass 3.

## Implementation tasks

Effort is for a builder with the technical design in hand; nothing here is code in this session.

- [ ] **T1 (P1, human: ~3h / CC: ~20m)** - `publish/email_text.py`, `templates/scorecard_email.txt.j2` - Reorder the email per R-116: header, what-this-is-not, attachment line, what-changed (R-115), "This month" block, tiles, one-paragraph buckets 3 to 6, "How to dispute", definitions; remove the two duplicate post-tile blocks; drop ruler lines. Surfaced by: Pass 1 findings 1 to 4, Pass 6 finding 9. Verify: `tests/publish/test_email_order.py` asserts the block order and that no line contains five consecutive `=` or `-`; a month-one fixture has no "What changed" block; the "This month" values equal the tile `value_text`.
- [ ] **T2 (P1, human: ~1h / CC: ~10m)** - `publish/csv_rows.py` - Column order and row sort per R-121. Surfaced by: Pass 3 J1.4, Pass 6 finding 10. Verify: `tests/publish/test_csv_columns.py` checks header order and per-metric row counts unchanged.
- [ ] **T3 (P1, human: ~4h / CC: ~30m)** - `web/templates/base.html.j2`, `web/authz.py` - Header, role-based nav, breadcrumb, landmarks, skip link, `aria-current` per R-117 and R-121. Surfaced by: Pass 1 finding 5, Pass 6 finding 13. Verify: `tests/web/test_nav.py` renders each fixture role and asserts the nav entries match the matrix; an HTML validator run on every page.
- [ ] **T4 (P1, human: ~4h / CC: ~30m)** - `web/templates/home.html.j2`, `metric.html.j2` - Tile as a definition-list row; live buckets full, dead buckets collapsed; records link second; what-changed block on home; as logged and as adjudicated on one line per Pass 4. Surfaced by: Pass 1 findings 6 and 7, Pass 4. Verify: `tests/web/test_home_layout.py` (fixture with four live metrics renders four rows and four collapsed lines; no `<div class="card">` anywhere; grep for "card" in templates fails on a hit).
- [ ] **T5 (P1, human: ~3h / CC: ~20m)** - `definitions/_catalogue.py` - Add keys `spread-opted-out`, `period-not-published-for-you`, `restatement-pending`, `claim-required`, `claim-too-long`, `claim-identifier`, `session-expired`, `dispute-filed`, `dispute-withdrawn`, `decision-recorded`, `queue-empty`, `note-required`, `note-saved`, `note-deleted`, `leader-none` per R-118. Surfaced by: Pass 2. Verify: `tests/web/test_state_strings.py` extended; every template state string is a key.
- [ ] **T6 (P1, human: ~2h / CC: ~15m)** - `web/views/disputes.py`, `templates/dispute_form.html.j2` - Validation states, the amended effect notice (R-58), the "Dispute attribution" action and helper line on survey responses, the session-expiry note. Surfaced by: Pass 3 J2.2, J3.7. Verify: `tests/web/test_dispute_form.py` (empty claim, over-cap, identifier hit, survey label).
- [ ] **T7 (P2, human: ~6h / CC: ~45m)** - `publish/charts.py` - `strip_spread()` per R-119 (hollow circles, filled square "You <value>", stacked ties, axis in the unit, no peer labels); `aria-describedby` to the three-line text; chart stroke tokens. Surfaced by: Pass 4. Verify: `tests/web/test_charts.py` extended: six-peer fixture yields six `<circle>` and one `<rect>` with a `<text>` "You"; no `<text>` other than axis ticks and "You".
- [ ] **T8 (P2, human: ~4h / CC: ~30m)** - `web/static/scorecard.css`, `web/static/fonts/` - Tokens per R-120 as custom properties; fonts vendored with licence and hash; focus ring; 44 px controls; `color-scheme: light`. Surfaced by: Pass 5. Verify: a contrast check script over the token pairs; `tests/web/test_csp.py` asserts no external font or script URL.
- [ ] **T9 (P2, human: ~4h / CC: ~30m)** - `web/templates/records.html.j2` - Table semantics (caption, `th scope`, row header on case id, dispute-state column), key columns first, sticky first two columns at tablet, sortable headers as links with `aria-sort`. Surfaced by: Pass 6 findings 12 and 15. Verify: `tests/web/test_records_table.py`; a 360 px and a 1280 px headless screenshot per page in CI (technical design already plans both widths).
- [ ] **T10 (P2, human: ~2h / CC: ~15m)** - `web/views/inbox.py`, `templates/inbox.html.j2` - Leader-available-from line, note success and error states, 72-character measure, no count anywhere. Surfaced by: Pass 3 J3.6, J3.8. Verify: `tests/web/test_inbox_no_count.py` extended; the from-date equals `inbox_first_available + 30 days`.
- [ ] **T11 (P2, human: ~1h / CC: ~10m)** - `disputes/rowtext.py` - Row state "target decision by <date>" and "Withdrawn by you on <date>". Surfaced by: Pass 3 J2.3, Pass 2. Verify: `tests/disputes/test_rowtext.py`. Taste: the human may drop the target date.
- [ ] **T12 (P3, human: ~2h / CC: ~15m)** - `docs/DESIGN.md` - Write the token set from R-120 as the DESIGN.md that `/design-consultation` would produce, once the human has chosen the face and the accent. Surfaced by: Pass 5. Verify: every template cites a token; no literal colour in any template.
- [ ] **T13 (P3, human: ~1h / CC: ~10m)** - `web/static/print.css` - Print stylesheet once OQ-46 is answered. Surfaced by: Pass 7 row 13. Verify: a print-to-PDF of the metric page shows the text tables.

_No new tasks from Step 0.5 (mockups deferred) or from "What already exists"._

## Completion summary

| Item | Result |
|---|---|
| System audit | Greenfield; no DESIGN.md; no prior design review; CEO review section 11 read and its T10 taken up |
| Step 0 | Design completeness 6/10; all seven passes; mockups deferred |
| Pass 1 Information architecture | 6 -> 9 |
| Pass 2 Interaction state coverage | 7 -> 9 |
| Pass 3 User journey and emotional arc | 6 -> 8 |
| Pass 4 AI slop risk | 7 -> 9 |
| Pass 5 Design system alignment | 2 -> 7 |
| Pass 6 Responsive and accessibility | 7 -> 9 |
| Pass 7 | 15 decisions: 12 auto-chosen, 1 partly, 2 deferred or unresolved |
| NOT in scope | 8 items |
| What already exists | 6 items reused |
| TODOS proposed | None written: no `TODOS.md` exists; deferred items are listed under NOT in scope for the human to move |
| Approved mockups | 0 generated, 0 approved |
| Decisions made (auto) | 16 per-pass fixes applied; 12 Pass 7 rows |
| Decisions deferred | Pass 7 rows 8 (part), 12, 13, 14 |
| Overall design score (lowest pass) | 2 -> 7 |
| Review status | issues_open (overall below 8; unresolved decisions exist); the plan stays DRAFT |
| Outside voices | Run after the passes as a Claude subagent: native-only coverage, no clean claim; 13 findings dispositioned (4 accept, 8 partial, 1 reject); 5 new Taste items |

### Unresolved decisions

- Pass 7 row 8: what a surgeon on whole-month approved leave receives (definitions owner; carried from the CEO review).
- Pass 7 row 13: print or export for annual review (OQ-46).
- Pass 7 row 14: mockups (next interactive session).
- Pass 5: the face and the accent (R-120 is a proposal; `/design-consultation`).
- Pass 3 and Pass 7 row 4: the visible "target decision by" date (Taste).
- Outside-voice close (TD-03, TD-04, TD-06, TD-09, TD-13): the late-case decomposition line beside D6; the per-tile provenance line versus a footer; sorted peer values versus range and median; the record table versus one card per record at phone width; a plain surgeon-facing name.

## Headless decisions

Every decision point was auto-chosen under the spawned-session rule. Recorded for the human to reverse.

1. Scope gate: B, `docs/PRD.md`, announced in one line.
2. Step 0D focus: all seven passes.
3. Step 0.5 mockups: skipped; no designer binary and no human to rate a board; nothing recorded as approved.
4. Outside voices: not run; no Codex or subagent tooling was requested for this session; recorded as unavailable, never as clean.
5. Pass 1 findings 1 to 7: each took its recommended fix (P5 explicit over clever, P1 completeness); all are ordering and rendering changes inside the M1 email and the M2 templates, under one day of AI-assisted effort each (P2).
6. Pass 2: fifteen new catalogue keys added as recommended; the recompute-failure operating rule and the whole-month-leave email left open because they differ in kind (P3).
7. Pass 3: the effect-notice second sentence, the "target decision by" date (flagged Taste), the leader-available-from line, the "Dispute attribution" label and the validation states applied as recommended.
8. Pass 4: the strip plot chosen for share and count metrics as the versioned OQ-26 form; a bar chart of point estimates rejected because the design doc forbids it for O/E and the same objection applies to a highlighted-bar rank chart.
9. Pass 5: a token set proposed and recorded as R-120 with "proposal" status; no font or colour is approved; the pass is capped below 8 by that rule.
10. Pass 6: all eight findings applied as recommended; dark mode declined (no use scene).
11. Pass 7: recommended option taken on 12 rows; rows 8 (part), 12, 13 and 14 recorded as deferred or unresolved rather than defaulted.
12. TODOS: none written because no `TODOS.md` exists; items listed under NOT in scope.
13. Next-step menu: E) skip; no skill chained. The human's next call is `/plan-eng-review docs/PRD.md` (the shipping gate) and, if the design gate matters first, `/design-consultation` then a mockup session.
14. No destructive or irreversible option was available or taken. The PRD was amended in place with a new history row (0.5); the ceo block in appendix D is untouched; a design block was appended after it.
15. Approval: none granted. The PRD's status stays DRAFT.
16. No institutional fact was asserted: no font or colour is claimed to be MGB's; the accessibility standard stays OQ-51; the 14-day target shown on the row is the department's own target from the design doc, not policy.
17. Outside voice: run as a fresh-context Claude subagent after the passes, because no outside model was available; recorded as native-only coverage, never as CONFIRMED or clean. Item 4 above describes the state before this close.
18. Outside findings dispositioned under the design tiebreakers (P5 explicit, then P1 completeness), keeping every native recommendation and recording each disagreement as Taste: ACCEPT 4 (TD-02 body rows, TD-05 orientation block, TD-07 the surgeon-facing dispute arc, TD-12 no "seen" solicitation); PARTIAL 8 (TD-01, TD-03, TD-04, TD-06, TD-08, TD-09, TD-10, TD-11); REJECT 1 (TD-13 the name, a single-voice direction change, held as Taste).
19. R-122 to R-125 added and fifteen rows amended in the PRD; the ceo block is untouched; the design block is extended with the outside-voice close; history row 0.6 added. The card-per-record phone layout and the pre-filled per-row templates were rejected as duplicates (P4); the six-point trend cap was not taken (R-45 keeps the cadence's history).
20. Evidence rather than argument for the four premises: the two-rendering printed list at M0, the phone find-and-copy timing at the R-82 rehearsal and at step zero, the interview question "What is this email for, and who else sees it?", and the monthly awaiting-row share read before the month-two kill criterion. None decides a premise; 16.7 records the position until the evidence lands.
21. No User Challenge: no item had both voices wanting to change the user's stated direction. No destructive option was taken.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|---|---|---|---|---|---|
| CEO Review | done | plan-level product review | 1 | issues_open | see `docs/reviews/plan-ceo-review.md` |
| Outside Review | done (native only) | no outside model available; a fresh-context Claude subagent ran the design prompt | 1 | native only | 13 findings: 4 accept, 8 partial, 1 reject; 5 Taste items |
| Eng Review | pending | the shipping gate | 0 | pending | `/plan-eng-review docs/PRD.md` |
| Design Review | done | UI scope: email, M2 app, M4 inbox | 1 | issues_open | score: 2/10 -> 7/10, 16 decisions |
| DX Review | not applicable | no developer-facing surface | 0 | n/a | |

OUTSIDE COVERAGE: native only (a Claude subagent ran the outside prompt; no consensus cell CONFIRMED).

VERDICT: the plan is design-reviewable and now carries a hierarchy, a state table, storyboards, specific page descriptions, a proposed token set and an accessibility specification; it is not design-complete (Pass 5 at 7) and stays DRAFT.

**UNRESOLVED DECISIONS:**
- Whole-month-leave email content (definitions owner).
- Print or export for annual review (OQ-46).
- Mockups for the home, metric, record list and inbox pages (next interactive session).
- The display face and accent colour (`/design-consultation`).
- The visible "target decision by" date on the row (Taste).
- From the outside-voice close (Taste): the late-case decomposition line (TD-03); per-tile provenance line versus footer (TD-04); sorted peer values versus range and median (TD-06); record table versus cards at phone width (TD-09); a plain surgeon-facing name (TD-13).

---

## Outside voice

Run after the seven passes above as a fresh-context Claude subagent, prompted as a designer who had not read this file. A Claude subagent is not an outside model: OUTSIDE COVERAGE is native only, no consensus cell below is CONFIRMED, and every verdict disagreement is a Taste item. The answer is reproduced verbatim; the consensus table and the dispositions follow it.

### OUTSIDE VOICE (Claude subagent)

```json
{
 "steelman": "On the tenth business day of every month a surgeon gets a short plain email from a person they know, carrying four numbers that already match what periop will show the chair, with their own first-case and cancellation rows underneath and every late case already marked \"your delay\" or \"not your delay\"; nothing in it is a score, a rank, or a comparison to a named colleague. Anything that looks wrong is disputed in a one-minute reply pinned to one row, the surgeon hears back within two days with who is deciding and by when, gets a decision inside fourteen days, and the next email opens with what changed because of it. Over three months that email becomes the one place a surgeon's own numbers are trustworthy, so the faculty meeting stops arguing about whose number is right and the surgeon stops keeping a private spreadsheet.",
 "most_revealing_element": "The per-row \"your delay / not your delay\" label on the first-case list (R-105). It is the only thing in the plan that answers the surgeon's real first question on open (\"is this number blaming me for something that wasn't mine?\"), and the plan buries it as a CSV column in an attachment while each tile carries seven lines of provenance (comparator, peer count, definition version id, source, as-of, last refreshed, cadence text). What the surgeon needs on first open is exoneration at a glance, not provenance; the plan has the right ingredient and puts it in the wrong place.",
 "premises_challenged": [
  {
   "premise": "Provenance density builds trust: every tile carrying comparator text, peer count, definition version id, source, as-of date, 'last refreshed' and cadence text (section 9.1, 9.3 'Comparator and provenance on every tile').",
   "why_wrong": "Surgeons trust a number when it matches what they remember and when the first thing they thought was unfair is already acknowledged. Seven lines of metadata per number in a 72-column plain-text email reads as defensive and institutional, pushes the four numbers below the first screen on a phone, and makes the email look like a compliance packet, which is exactly the OPPE-packet feeling the design doc says is the competitor. A version id like 'fcot v1' means nothing to a surgeon and everything to the analyst.",
   "evidence_that_would_prove_it": "In the M0 printed-list test, hand three surgeons two versions of the same page: one with the full per-tile metadata stack and one with value, reason, trend and a single provenance footer. Time to first comment on a number, and ask which they would read next month. If two of three prefer the sparse version and nobody asks 'what version is this', the stack goes to the footer and the CSV header."
  },
  {
   "premise": "The case list as a CSV attachment is how a surgeon 'opens their case list' (section 9.1, goal G2, D-29).",
   "why_wrong": "iOS Mail and Outlook iOS render a CSV as unformatted comma text; a 12-column case list (date, room, procedure, scheduled start, wheels-in, on-time, delay reason, booked, actual, cancellation reason, shared flag, dispute status) is unreadable on the phone the plan says the email is read on. Opening the attachment also cannot be observed in the email months, so G2's 'three open their case list' is measured by self-report only. The disputable rows (first cases and cancellations, typically 4 to 15 rows) belong in the body with the case id first on the line.",
   "evidence_that_would_prove_it": "Send the rehearsal .eml (R-82) to three surgeons' phones, ask them to find the late first case from the 14th and copy its case id into a reply, and time it. If fewer than two of three finish unaided in under two minutes, or anyone opens the CSV and closes it, the attachment is not the case list."
  },
  {
   "premise": "A one-line 'what this is not' statement on every artifact neutralises the report-card framing (F-42, R-44), while the surgeon-facing product is called 'Clinician Scorecard'.",
   "why_wrong": "The name is read before the disclaimer, in the subject line, at step zero and in every faculty-meeting mention; a product whose one-line statement is 'not a scorecard' and whose name is 'Scorecard' has already lost the framing argument. A footer disclaimer in plain text is the least-read line of any email. Surgeons will file it mentally next to OPPE and comp, and case-selection behaviour follows the mental filing, not the footer.",
   "evidence_that_would_prove_it": "At the month-three interview ask every surgeon, unprompted, 'what is this email for and who else sees it?'. If more than one names comp, OPPE or the chair as a reader, the disclaimer failed and the name must change on the surgeon-facing surface."
  },
  {
   "premise": "Dispute by email reply with a three-line template (Case id, Field, What happened) is a viable interaction for months one to three (R-94, F-57).",
   "why_wrong": "It asks a surgeon on a phone to open an attachment, find a row, copy an opaque token, know the internal name of a field, type a claim without identifiers, and then wait two business days for an acknowledgement and up to fourteen for a decision with no surface in between; the row state 'with chief, filed <date>' only appears in the next monthly email. The product statement says the dispute is the product, and the plan makes it the hardest action in the email and the quietest afterwards.",
   "evidence_that_would_prove_it": "Count in the M1 reply log how many replies arrive with no case id or a wrong field name (held as 'awaiting row'). If more than a quarter of disputes need a second round trip, the reply design is the bottleneck, not surgeon demand, and the month-two kill criterion will misread friction as apathy."
  }
 ],
 "dimension_verdicts": [
  {
   "dimension": "information architecture",
   "verdict": "partial",
   "reason": "The states catalogue (9.4), the per-role M2 surfaces (9.2) and the rule that every surface renders the same ledger object are strong. But the email, which is the whole product for three months, has no subject line, no sender identity and no stated tile order; the disputable rows live in an attachment while provenance lives on the tiles; and the FCOT tile carries no decomposition of late cases into 'your delay' and 'not your delay', which is the one fact the surgeon reads the tile for."
  },
  {
   "dimension": "interaction state coverage",
   "verdict": "partial",
   "reason": "Absent-data states are the most complete I have seen (empty, min-n, peer-under-five, hidden month, not applicable, not in release, pending source, not computable, feed not received, counted quarterly, restated, disputed, page error, stale). Surgeon-facing dispute states are thin: nothing between the two-day acknowledgement and the decision email, no 'awaiting row' message design, no withdrawal (D-27) surface, no attached-evidence confirmation (R-64), and the hosted dispute form has no validation, duplicate-filing or submitted-confirmation states specified."
  },
  {
   "dimension": "user journey and emotional arc",
   "verdict": "partial",
   "reason": "The 'What changed since <prior period>' block (R-115) and the effect notice before filing (R-58) are the right instincts, and 'a sustained dispute visibly changes the list' is the right emotional payoff. But month one opens cold with a raw percentage, no orientation block and no exoneration line; the peer spread arrives as a sorted list that reads as a rank with 'You' last; and the dispute goes silent for up to fourteen days. The plan designs the arc for the analyst (gates, deadlines) and leaves the surgeon's arc to the step-zero meeting."
  },
  {
   "dimension": "AI slop risk",
   "verdict": "partial",
   "reason": "Low at runtime: no LLM in the path (D-35), one versioned string catalogue (F-33), templated plain text. High on the surface: the strings were authored headless and never read by a surgeon, and spec language already leaks into them ('Target scaled to <T'> (assumption, to be confirmed)', '(you are not counted)', definition version ids on every tile, the 'not reconciled to periop's report' label). The email risks reading like the PRD, which is the slop signature: exhaustive, correct and unread."
  },
  {
   "dimension": "design system alignment",
   "verdict": "disagree",
   "reason": "No design system is named for either surface. The plain-text email needs a monospace grammar (what a tile, a reason, a six-point trend and a spread look like in 72 columns) and none is specified. M2 is 'static CSS, inline SVG, no JavaScript' with no component inventory, no typography or colour tokens, and no mention of MGB's brand or an existing MGB web standard. The string catalogue is the only system-like asset and it is a content system, not a visual one."
  },
  {
   "dimension": "responsive and accessibility",
   "verdict": "partial",
   "reason": "Words-not-colour, 4.5:1, keyboard reachable, no-JS reading and disputing, 360px, and 'every marker present as text' are the right baseline. Unsolved: the CSV on a phone mail client; a 12-column record list 'without loss of any list' at 360px with no card-list design; a 12-point trend as a run of numbers, which a screen reader announces as noise; a spread as eight bare values; and no institutional standard named (OQ-51), so 'conformance' has no target."
  }
 ],
 "top_findings": [
  {
   "severity": "blocking",
   "finding": "The email contract specifies everything except the first three things a surgeon sees: subject line, sender identity and preview text. An unexpected message from a department service mailbox with a CSV attachment and a 'reply with your case id' request is the exact shape MGB phishing training teaches surgeons to ignore or report; the first send could be deleted or forwarded to security before anyone reads a tile.",
   "location": "docs/PRD.md section 9.1 (the M1 email contract); R-94; D-29 (service mailbox, Reply-To shared dispute mailbox)",
   "fix": "Add to the 9.1 contract: a fixed subject pattern with no numbers ('Your <Month> OR cases, from <analyst name>'), a named human sender with the analyst's display name on the service mailbox, the first two lines of the body as the preview ('Four numbers from periop's OR log and your own case list. Nobody else receives this.'), and a step-zero slide that shows the exact email so it is recognised on arrival. Have the chair or the owner send a one-paragraph personal note the day before month one."
  },
  {
   "severity": "blocking",
   "finding": "The case list, which is the product's claimed differentiator and half of goal G2, is a CSV attachment that phone mail clients render as unformatted comma text. A surgeon on a phone cannot find the late case from the 14th, cannot copy its case id, and the plan cannot observe whether the attachment was opened.",
   "location": "docs/PRD.md section 9.1 (attachment bullet); goal G2; D-29; D-31",
   "fix": "Put the disputable rows in the body as a fixed-width block: first cases and cancellations only, case id as the first token on each line, then date, on-time yes or no, and 'your delay' / 'not your delay' / reason; keep the full 12-column CSV as the attachment for the desk. Cap the inline block at 20 rows and say 'full list attached'. Rehearse it on iOS Mail, Outlook iOS and Android Gmail (R-82) before the first real send."
  },
  {
   "severity": "blocking",
   "finding": "The FCOT tile shows '6 of 10 on time' while the reason-set labels (R-105) mark late cases 'not your delay' only on the row and never on the tile. A surgeon whose three late cases were anaesthesia or room delays reads 60% as an accusation, and the plan's answer is 'reconciles to periop, dispute it'. This is the single most likely trigger for 'this number is unfair, I am ignoring this email'.",
   "location": "docs/PRD.md R-15, R-105, section 9.3 'As logged / as adjudicated'; F-47 shows both values only after a sustained dispute",
   "fix": "Add a one-line decomposition to the FCOT tile from month one, no dispute required: '6 of 10 on time. Of the 4 late: 1 your delay, 3 not your delay (counted anyway under periop's definition).' Same shape for cancellations ('3 cancelled; 1 in the surgeon-attributable set'). The count still reconciles; the surgeon no longer has to dispute to be exonerated."
  },
  {
   "severity": "material",
   "finding": "Each tile carries seven metadata lines (comparator text, peer count, definition version id, source, as-of, last refreshed, cadence text). In 72 columns on a phone the four numbers fall below the first screen and the email reads as a compliance packet, the very artefact the design doc names as the competitor.",
   "location": "docs/PRD.md section 9.1 first bullet; section 9.3 'Comparator and provenance on every tile'; R-36, R-52, R-53, R-86",
   "fix": "Per tile: name, value with denominator, one reason line if suppressed, a six-point trend line. One provenance footer per email: 'Source: periop OR log, reconciled to periop's <Month> report. Definitions v1 (unchanged). Refreshed <date>.' Version ids move to the CSV header and the definition page. Peer count appears only on the spread line from month two."
  },
  {
   "severity": "material",
   "finding": "Month one opens cold. The 'What changed' block (R-115) starts at month two, the 'what this is not' line is at the bottom, and the first thing a surgeon reads is a percentage with no orientation and no comparator. The emotional first beat is 'am I in trouble?' with nobody in the email to answer it.",
   "location": "docs/PRD.md section 9.1 (fourth bullet, 'From month two'); R-115; F-42 placement",
   "fix": "Month one opens with a three-line orientation block in the same slot R-115 will occupy: 'First monthly email. Four numbers from periop's OR log for <Month>, and your own case list. Only you receive this; your chief sees a row only if you dispute it.' Then the tiles, then the reply template, then the footer. Make the block the month-one instance of the R-115 slot so the layout does not shift in month two."
  },
  {
   "severity": "material",
   "finding": "The three-line plain-text spread ('Peers: <values ascending>' then 'You: <value>') is a sorted list with the surgeon's value read last, which is a rank in everything but name. With five to eight peers a surgeon reads 'I am seventh of eight' before anything else, and the design doc's own re-identification premise (P5) says they will name the other seven.",
   "location": "docs/PRD.md section 9.1 (spread bullet); R-48 (F-46); OQ-26",
   "fix": "Render position without an ordered list: 'You: 60%. 7 neurosurgeons at this site: 62% to 91%, median 75%. Names are hidden, not people.' Range plus median plus own value is 'the spread and where you sit' as the brief requires, and leaks less than eight sorted values. Keep the sorted list for the M2 chart with intervals."
  },
  {
   "severity": "material",
   "finding": "The surgeon-facing dispute arc goes silent: an acknowledgement inside two business days, then nothing until a decision inside fourteen, and the row state 'with chief, filed <date>' appears only in the next monthly email. The analyst gets day-10 and day-14 alerts; the surgeon gets none. P6 says disputing must visibly change things; silence reads as theatre.",
   "location": "docs/PRD.md R-59, R-62, R-88, R-97; section 9.4 'Disputed' state; F-112 recipients",
   "fix": "The acknowledgement names the decider and the expected decision date ('With Dr <chief>, decision by <date>'). Add a surgeon-facing day-10 note when undecided ('Still with your chief; due <date>'), same catalogue string as the analyst alert. The decision email quotes the row before and after."
  },
  {
   "severity": "material",
   "finding": "The reply template asks for 'Field:' with no list of fields. A surgeon does not know the internal names (delay reason, on-time, primary surgeon, cancellation reason); the plan's own R-59 predicts the result, replies held as 'awaiting row' and a second round trip, and the month-two kill criterion will read that friction as low demand.",
   "location": "docs/PRD.md R-94 (three-line reply template); R-59; section 9.1",
   "fix": "Template becomes: 'Case id: (first token on the row)', 'What is wrong: delay reason / on time / not my case / cancellation reason / other', 'What happened (no patient details):'. Pre-fill the template once per inline row for the two or three rows most likely disputed (late cases marked 'your delay')."
  },
  {
   "severity": "material",
   "finding": "No design system exists for either surface. M2 is 'static CSS, inline SVG, no JS' with no component inventory, tokens or brand; the plain-text email has no monospace grammar. Every screen will be invented ad hoc by whoever builds it, and the 12-column record list has no 360px design, contradicting R-111's 'usable at phone width without loss of any list'.",
   "location": "docs/PRD.md section 9.5; R-111; section 10.2 M2 row ('static CSS', 'charts.py inline SVG'); section 10.7 Accessibility",
   "fix": "Before M2 code, a one-page component inventory: tile, reason line, trend (SVG with a text twin), spread (interval dots with a text twin), record list (table on desktop, one card per record at phone width with case id and dispute action first), dispute form, queue row, page-state banner. Name MGB's web standard if one exists (ask at M0 beside OQ-51); otherwise fix one typeface, one text scale, two neutral tones and one accent and write them as tokens. Specify the email's monospace grammar in the same page."
  },
  {
   "severity": "material",
   "finding": "Spec language leaks onto the surgeon's surface: 'Target scaled to <T'> (assumption, to be confirmed)', '(you are not counted)' on the peer-under-five reason (ambiguous: sounds like the surgeon's cases are excluded), 'not reconciled to periop's report' as a tile label, and definition version ids on tiles. These are the slop signature: strings written by the spec for the spec.",
   "location": "docs/PRD.md section 9.3 'M&M pace and unreachable flag', 'The screen says why'; goal G1 label; R-36",
   "fix": "One read-aloud pass of every catalogue string with two surgeons at step zero, recorded as a setting row like the interview instrument. Rewrite: 'Target adjusted for your leave: 6 of 9' with the assumption on the definition page; 'Peer comparison not shown: only 4 other neurosurgeons at this site had 5 or more cases; needs 5'; drop 'not reconciled' from the tile and put the reconciliation sentence in the footer."
  },
  {
   "severity": "minor",
   "finding": "Trend-as-text is unspecified: 'up to 12 monthly points' in 72 columns with restatement markers, and later intervals, has no format, and a screen reader announces it as a run of numbers.",
   "location": "docs/PRD.md section 9.1 first bullet; R-45; R-100",
   "fix": "Specify now: 'Last 6 months: 85 82 90 88 75* 60 (%; * restated Aug, see What changed)'. Six points in the body, twelve in the CSV, and a sentence form for screen readers on M2 ('down from 75% in August')."
  },
  {
   "severity": "minor",
   "finding": "The adoption signal in email months depends on surgeons replying 'seen' or self-reporting at interview. Asking a surgeon to reply 'seen' to an automated email reads as attendance-taking and will itself depress replies.",
   "location": "docs/PRD.md R-95; section 14 Adoption row",
   "fix": "Do not ask for 'seen'. Measure the two things that matter and can be observed: replies that are disputes or questions, and the month-three interview's 'did you check the list' answer. Treat a question reply as engagement equal to a dispute."
  },
  {
   "severity": "minor",
   "finding": "The surgeon-facing product name 'Clinician Scorecard' contradicts the one-line product statement 'not a scorecard' before the disclaimer is ever read.",
   "location": "docs/PRD.md section 1 (summary and product statement); F-42 'what this is not'",
   "fix": "Keep the repo name; give the surgeon-facing email and page a plain name that describes the object ('Your OR month' or 'My cases and numbers') and never print 'scorecard' on a surface."
  }
 ],
 "what_i_would_build_first": "The month-one and month-two email as real .eml files rendered on iOS Mail, Outlook iOS and Android Gmail at 72 columns, not a wireframe: subject and sender, a three-line orientation block, the four tiles with the FCOT 'of the 4 late: 3 not your delay' decomposition and a six-point text trend, the disputable rows inline with the case id first, the reply template, and one provenance footer; month two adds the 'What changed' block and the range-plus-median spread line. Then sit with three surgeons and their phones, ask them to find the late case from the 14th and dispute it, and time it. Everything else in the plan (ledger, gates, reconciliation, hosted view) is invisible to the surgeon until that email is read and replied to, and this prototype costs a day."
}
```

---

## Design consensus table

Coverage: native completed (seven passes, ratings after fixes); outside not available, replaced by a Claude subagent, which the autoplan rule counts as native only. Consequence: every consensus cell is N/A, none is CONFIRMED, and every verdict difference is a Taste item carried by the disposition rows below. The Claude column is the pass's after-fix rating read as a verdict (9 to 10 agree; 7 to 8 partial; below 7 disagree). Single-voice critical findings flagged: the three blocking findings (TD-01, TD-02, TD-03) were raised by one voice only; the native review did not examine the envelope, the body rows or the late-case decomposition.

| Dimension | Claude (native review) | Outside (Claude subagent) | Consensus |
|---|---|---|---|
| Information architecture | agree (Pass 1, 9/10): R-116 puts the four values on the first phone screen, R-117 gives the app a navigation model and a trunk test | partial: no subject, sender or preview; disputable rows in the attachment while provenance sits on the tiles; no late-case decomposition on the FCOT tile | N/A, native only. DISAGREE, Taste; carried by TD-01, TD-02, TD-03, TD-04 |
| Interaction state coverage | agree (Pass 2, 9/10): 105 cells filled, fifteen new catalogue keys, the product's own states mapped to both surfaces | partial: absent-data states complete; surgeon-facing dispute states thin between acknowledgement and decision; the hosted form's validation and confirmation states not seen by the outside voice (they are R-118, section 9.7) | N/A, native only. DISAGREE, Taste; carried by TD-07; the form states are already R-118 |
| User journey and emotional arc | partial (Pass 3, 8/10): J1 to J3 storyboarded; fixes are text, unverified on a rendered screen | partial: month one opens cold; the spread reads as a rank with "You" last; the dispute goes silent for up to fourteen days | N/A, native only. Same verdict, different gaps named; carried by TD-05, TD-06, TD-07 |
| AI slop risk | agree (Pass 4, 9/10): no card grid, no default face, specific page descriptions; only the three-looks calibration is unverified | partial: low at runtime, high on the surface; catalogue strings authored headless and never read by a surgeon; spec language on tiles | N/A, native only. DISAGREE, Taste; carried by TD-10 |
| Design system alignment | partial (Pass 5, 7/10): R-120 token set is a proposal; no DESIGN.md; no face or accent approved | disagree: no component inventory, no email grammar, no MGB web standard named; the record list has no phone design | N/A, native only. DISAGREE, Taste; carried by TD-09 |
| Responsive and accessibility | agree (Pass 6, 9/10): per-viewport layouts, keyboard, landmarks, targets, table semantics, the spread's text twin | partial: the CSV on a phone; the record table at 360 px; the trend as a run of numbers; no institutional standard (OQ-51) | N/A, native only. DISAGREE, Taste; carried by TD-02, TD-09, TD-11 |

Summary: 0 CONFIRMED; 5 DISAGREE to Taste; 1 same verdict (N/A, native only); 0 User Challenges (no item where both voices want to change the user's stated direction; TD-13 is one voice).

---

## Cross-model tension dispositions

Rule applied (headless): where the native review already made a recommendation, keep it and record the disagreement as a Taste item; where it made none, apply the design tiebreakers (P5 explicit over clever, then P1 completeness) and accept what is in blast radius and under a day; never invent institutional policy; never reduce scope. Blast radius here is PRD section 9, the requirement rows named, sections 13, 14 and 16, and appendix D; no code exists yet. The ceo block in appendix D is not edited; where a disposition touches a ceo-accepted requirement (goal G1's label, R-59, R-82, R-88, R-94, R-95, R-115) the design block states the extension and the ceo wording stands.

| ID | Source | Outside position (short) | Native position (cited) | Decision | Principle and reason | PRD change | Held for the human |
|---|---|---|---|---|---|---|---|
| TD-01 | Finding 1, blocking; "information architecture" | Fixed subject with no number, a named human sender on the service mailbox, the first two body lines as preview, the exact email shown at step zero, a personal note from the chair or owner the day before month one | Pass 1 drew a subject line ("Your scorecard, October 2026 (last refreshed ...)") and no sender or preview; D-29 names a service mailbox; nothing examined the phishing shape | PARTIAL | P5: three explicit lines cost nothing and the failure (deleted or reported unread) is total. Subject pattern, sender display name, preview lines and the step-zero showing accepted as R-122. The personal note is the chair's or the owner's own act and is recorded as a recommendation in section 13, not a requirement | Section 9.1 envelope bullet; 9.6 diagram; R-94 pointer; new R-122; section 13 M1 gate | No |
| TD-02 | Finding 2, blocking; premise 2; "information architecture", "responsive and accessibility" | First-case and cancellation rows in the body, case id first, capped at 20 with "full list attached"; the CSV stays for the desk; rehearse on iOS Mail, Outlook for iOS and Android Gmail | Pass 3 J1.4 and Pass 6 finding 10 fixed the CSV's column order (R-121) and left the attachment as the list; R-82 rehearses on the operators' phones; section 10.7 already names the three clients | ACCEPT | P1: the rows are already in the payload and already pass the scan (the CSV carries the same fields); a body block is the only form a phone mail client renders as rows. Condition: the privacy office's confirmation (section 13, M1 gate) names the body rows as well as the attachment; if body rows are refused, the block renders the D-31 sentence and goal G2's case-list count waits, as D-31 already says | Section 9.1 rows bullet; 9.6 diagram and grammar; new R-124; R-82; R-116 order; section 13 M1 gate; 9.8 J1.4 row | No |
| TD-03 | Finding 3, blocking; "information architecture" | One decomposition line on the FCOT tile from month one, no dispute required: of the late cases, how many "your delay" and how many "not your delay"; the same for cancellations | R-105 labels the rows and never the tile; F-47 shows both values only after a sustained re-attribution; the CEO review declined X7 (two FCOT counts on the tile) under the design doc's two-numbers failure D6 | PARTIAL | P5, P1: a count line is explicit and complete, and it is not a second FCOT number because it states no rate; the tile still reconciles. Accepted as R-123 with three limits: counts only, never a second percentage; the labels come from the signed reason set (R-105) and a blank or unsigned reason reads "reason not recorded"; the line is a catalogue string. Held as Taste because it sits beside D6 and X7 and the owner may read any second line as a second number | Section 9.1; 9.6 diagram; R-15; R-105; new R-123; 9.8 J1.3 row | Yes, Taste: the decomposition line versus the tile value alone. Alternative: labels stay on rows only. Downstream impact: none on counts; one catalogue string and one artifact field |
| TD-04 | Finding 4, material; premise 1; "information architecture" | Per tile only name, value, reason, trend; one provenance footer per email; version ids to the CSV header and definition page; peer count only on the spread line | R-116 already puts the four values in a "This month" block on the first screen, so the numbers no longer fall below it; section 9.3 "Comparator and provenance on every tile" is the brief's display contract (F-34, F-51, F-83, F-97); R-36, R-53 and R-86 keep comparator, provenance and "last refreshed" on every tile and artifact | PARTIAL | Headless rule: the native recommendation (R-116) exists and is kept, and the brief's contract is not removed. In the email the per-tile provenance is compressed to one line ("definition v<n>; source periop OR log; as of <date>") with the full version id in the CSV header and on the definition page; "last refreshed" stays in the header and the reconciliation sentence goes to the footer. The M0 printed-list test hands each surgeon both renderings (dense and sparse) and records which they read first, which is the evidence the outside voice asked for | Section 9.1 tiles bullet; 9.6 diagram and footer; R-116; section 13 M0 gate and exit; 16.7 | Yes, Taste: the per-tile provenance line versus a footer only. Downstream impact: section 9.3's contract row and R-36 if the footer wins |
| TD-05 | Finding 5, material; "user journey and emotional arc" | A three-line orientation block in month one, in the slot R-115 occupies from month two | R-115 is absent in month one ("nothing to compare"); Pass 3 J1.2 fixed the first screen with R-116 and left month one without an opening sentence | ACCEPT | P5, P1: one catalogue string in an existing slot; the layout does not shift between months. Wording fixed so it asserts only what the authorization matrix guarantees: "Only you receive this email; your chief or chair sees one of your rows only when you dispute it." | Section 9.1; 9.4 `month-one-orientation`; 9.6 diagram; R-115; R-122; 9.8 J1.2 row | No |
| TD-06 | Finding 6, material; "user journey and emotional arc" | Replace the sorted "Peers:" line with range plus median and put "You" first; keep the sorted values for the M2 chart | F-46 AC 6's three-line form is the catalogue's acceptance criterion and the screen-reader twin of every hosted spread (R-121); Pass 3 J1.10 kept it; R-44's scan forbids a rank and the sorted list carries no position number | PARTIAL | Headless rule: the native recommendation exists and is kept as the provisional choice; the outside point (a sorted list with "You" last reads as a rank under P5) is valid and is a Taste item. Two amendments that keep the form: the "You" line precedes the "Peers" line, and the count sentence ends "Names are hidden, not people." (the design doc's own step-zero sentence) | Section 9.1 spread bullet; R-48; 9.6 diagram | Yes, Taste: sorted values versus range and median. Downstream impact: F-46 AC 6, the hosted spread's text twin (R-121) and the F-36 render log's evidence for P5 |
| TD-07 | Finding 7, material; "interaction state coverage", "user journey and emotional arc" | The acknowledgement names the decider and the due date; a surgeon-facing day-10 note; the decision email quotes the row before and after | R-59 acknowledges with case id and filed date; R-61 shows "target decision by <date>" on the row (Taste); R-88 alerts the analyst at days 10 and 14; R-97 carries the row text and the updated tile; nothing reaches the surgeon between acknowledgement and decision | ACCEPT | P1, P5: three catalogue strings, no new mechanism; the day-10 note reuses the R-88 checklist row and the same date R-61 already shows, so the two stand or fall together with the R-61 Taste item. In M1 the analyst sends the note from the checklist; at M2 it is automated with the alerts (OQ-56) | R-59; R-88; R-97; 9.4 `dispute-day-10` and awaiting-row wording; section 9.1 closing paragraph; 9.8 J2.3a row | No new item; rides on the R-61 Taste decision |
| TD-08 | Finding 8, material; premise 4; "information architecture" | "What is wrong:" with the disputable fields listed in plain words; "Case id: (first token on the row)"; pre-filled templates for the two or three rows most likely disputed | R-94's three-line template names "Field" with no list; R-59 already predicts "awaiting row" replies; F-56 AC 1 defines which fields are disputable per record type | PARTIAL | P5: the list of fields is explicit and the case-id hint follows from R-124. Pre-filled per-row templates are rejected under P4: they duplicate the row block, add lines to the phone screen and are the M2 form's job. The awaiting-row share is reported monthly and read before the month-two kill criterion, so friction is not read as apathy | R-94; section 9.1 template bullet; R-59; section 13 M1 kill; section 14 Trust row; 16.7 | No |
| TD-09 | Finding 9, material; dimension "design system alignment" (DISAGREE) | A one-page component inventory before M2 code; the email's monospace grammar; ask whether MGB has a web standard; one card per record at phone width | Pass 5 proposed R-120 as tokens only; R-117 and R-119 describe the tile, spread and queue; R-121 keeps the record list a table at 360 px with key columns first; Pass 7 row 14 deferred mockups; T12 (DESIGN.md) is P3 | PARTIAL | P5, P1: the inventory, the email grammar and the M0 question are accepted (a question is not a policy assertion; recorded as OQ-63). The card-per-record phone layout is rejected: R-121 keeps table semantics so a screen reader keeps row and column headers, and the four key columns fit at 360 px; a card list would be a second markup for the same rows (P4). T12 moves from P3 to a condition of M2 code | R-120; R-121; section 9.5; 9.6 grammar; 9.9; 16.7 (OQ-63); section 13 M0 gate | Yes, Taste: table at phone width (native) versus one card per record (outside). Downstream impact: `records.html.j2` and the R-121 CI screenshot at 360 px |
| TD-10 | Finding 10, material; "AI slop risk" | A read-aloud pass of every catalogue string with two surgeons at step zero; rewrite three strings; drop "not reconciled" from the tile | No native finding; Pass 4 checked layout, not copy; F-33 makes every string a versioned catalogue entry, so a rewrite is a version, not a template edit; goal G1's tile label is a ceo-accepted requirement | PARTIAL | P5: the pass and two rewrites are accepted (peer-under-five wording; the leave-adjusted target in plain words with the assumption on the definition page, the flag kept on the tile because the M5 exit criterion requires it). Goal G1's label stays on the tile (ceo block, not edited); its surgeon-facing wording becomes a plain catalogue sentence and the reconciliation sentence also goes to the footer | Section 9.3 two strings; 9.4 peer-under-five row; R-44; new R-125; section 13 M1 gate | No |
| TD-11 | Finding 11, minor; "responsive and accessibility" | A horizontal six-point trend line in the body, twelve in the CSV, and a sentence form for screen readers on M2 | R-121 fixed vertical trend rows (19 characters each) because they fit a phone; R-45 keeps up to 12 points; no row format was written | PARTIAL | P5: the vertical row is kept (a screen reader reads one dated row per line, which is not a run of numbers) and its format is now fixed; the hosted chart gains a one-sentence summary in its `<title>`. A six-point cap is not taken (R-45 and F-43 say the cadence's full history; the "This month" block already keeps the values on the first screen) | R-45; R-121; 9.6 grammar; section 9.5 | No |
| TD-12 | Finding 12, minor | Never ask for a "seen" reply; measure disputes, questions and the interview | R-95 classifies replies as dispute, question or seen; goal G2 counts "reply to or report opening"; Pass 3 J1.12 kept "seen" | ACCEPT | P5: the email stops soliciting "seen"; the classification stays for replies that arrive; goal G2's wording is unchanged because "reply to" already covers disputes and questions | R-95; section 9.1 closing paragraph; section 14 Adoption row | No |
| TD-13 | Finding 13, minor; premise 3 | A plain surgeon-facing name; never print "scorecard" on a surface | The name is the brief's and the repo's; the native review's header line is "Clinician Scorecard for Dr. <Name>"; the design doc's product statement is "not a scorecard" | REJECT | Headless rule: one voice wants to change the user's stated direction (the product name), so the direction stands and the item is Taste, not a User Challenge. The evidence the outside voice asked for is taken: the month-three interview adds the unprompted question "What is this email for, and who else sees it?" (R-95, within the five-question cap) | R-95; 16.7 | Yes, Taste: a plain surgeon-facing name. Downstream impact: the subject pattern (R-122), the email header, the app header and `<title>` |
| TD-P1 to TD-P4 | Premises 1 to 4 | The four evidence tests | Not examined as premises | ACCEPT (evidence only) | Each test is a recorded observation with no code: the two-rendering printed list at M0 (P1, in TD-04); the phone find-and-copy task at the R-82 rehearsal and at step zero (P2, in TD-02); the interview question (P3, in TD-13); the awaiting-row share (P4, in TD-08). None decides the premise; 16.7 records the position until the evidence lands | Section 13 M0 and M1; R-82; R-95; section 14; 16.7 | No |
| TD-B | "What I would build first" | Real `.eml` files for month one and month two on three phone clients, then three surgeons timed on find-and-dispute | R-82 rehearses the real send on the operators' phones; Pass 7 row 14 deferred mockups | ACCEPT | P1: the rehearsal already produces the `.eml`; opening it in the three named clients and timing the task is one afternoon. The three-surgeon timing runs at step zero on the synthetic month-one email; nothing is sent to a surgeon before the privacy office confirms the channel (R-109) | R-82; section 13 M1 gate | No |

Counts: 13 findings and 5 further rows dispositioned. Of the 13 findings: ACCEPT 4 (TD-02, TD-05, TD-07, TD-12); PARTIAL 8 (TD-01, TD-03, TD-04, TD-06, TD-08, TD-09, TD-10, TD-11); REJECT 1 (TD-13). Of the ten blocking or material findings: 3 accepted whole (TD-02, TD-05, TD-07), 7 partial, 0 rejected. The one DISAGREE dimension (design system alignment) is carried by TD-09. User Challenges: 0. New Taste items for the human: 5 (TD-03, TD-04, TD-06, TD-09, TD-13), listed under Unresolved decisions with the R-61 date and the R-120 face and accent.

What the PRD gained, by section: section 9.1 (envelope, body rows, decomposition line, orientation block, template fields, "You" line first, no "seen" solicitation, the dispute arc's three surgeon-facing messages); 9.3 (two strings in plain words); 9.4 (`month-one-orientation`, `dispute-day-10`, the awaiting-row wording, the peer-under-five rewrite); 9.5 (email grammar row); 9.6 (the email diagram redrawn with envelope, preview, rows block, decomposition and footer; the plain-text grammar); 9.8 (four beats); 9.9 (component inventory); R-15, R-44, R-45, R-48, R-59, R-82, R-88, R-94, R-95, R-97, R-105, R-115, R-116, R-120 and R-121 amended; R-122 to R-125 added; section 13 M0 and M1 rows; section 14 Adoption and Trust rows; 16.7 new with OQ-63; appendix A counts, appendix C row 0.6, appendix D prose and the design block extended. Nothing was removed and no ceo-accepted row was altered.

Status: DONE_WITH_CONCERNS.
