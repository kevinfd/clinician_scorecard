# /impeccable: design evaluation of the Clinician Scorecard specification

Date: 2026-09-29. Run headless by the impeccable skill (v4.4.0) with no human present. Planning-only: no code exists, so every finding is against text: PRD section 9 (`docs/PRD.md`), the M1 plain-text email template and the M2 page inventory, authorization matrix and states (`docs/03-technical-design.md`, "Delivery surfaces"). Commands applied: `critique`, `harden`, `onboard`, `clarify`. Companion artifacts written in the same run: `PRODUCT.md` (init), `DESIGN.md` (new-work, seed), `docs/design/briefs/m1-email.md` and `docs/design/briefs/m2-web-app.md` (shape).

What could not run, and why:

- `impeccable context` ran once (NO_PRODUCT_MD at the time; PRODUCT.md was then written). `concept-seed --scope direction --mode operate` ran twice, sandboxed and unsandboxed; both times the roll service was unreachable, so the roll is degraded: assigned index 6, seed key 20b5df25, no challengers, no quality-bar boards. The decision page (`serve-question`) was not started: no browser or human could open it, and no structured question tool is exposed, so the assigned direction was taken unattended with assumptions stated in `DESIGN.md` and the briefs.
- `impeccable detect --json docs` ran and returned `[]`: there is no markup to scan. The detector half of critique therefore reports "no scannable target", which critique.md counts as a real attempt.
- Critique's Assessment A and B must run as two isolated sub-agents; this session exposes no sub-agent tool, so the critique below is a degraded single-context run and says so on its first line. No `.impeccable/critique/` snapshot was persisted: `critique-storage slug docs/PRD.md` resolves to `docs-prd-md`, but the target is a document, not a surface, and polish would find nothing to fix in it.
- `craft-floor.md` was read but not applied: it governs UI edits, and this run makes none.
- Image generation: none available; the build path is code-first for this session and nothing is recorded in `.impeccable/config.json`.

Accepted fixes are amended into `docs/PRD.md` (section 9 and new rows R-126 to R-129 in section 7) and `docs/03-technical-design.md` ("Delivery surfaces") and are listed in the Review log at the end. Held fixes are named as held with the decision they wait on.

---

## 1. Critique

⚠️ DEGRADED: single-context (no sub-agent tool exposed in this session; the detector ran against `docs/` and found no markup to scan)

Target: PRD section 9 plus the technical design's M1 email template, M2 page inventory and states. Mode: Operate. All ten heuristics apply.

### Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | A missed run leaves "last refreshed" stale with no sentence saying the run was missed; an open dispute on a metric is invisible from the metric page until the surgeon opens the list (C-03, C-04) |
| 2 | Match between system and real world | 3 | The email's records line prints an internal key ("metric = fcot"); the restated legend names a dispute id ("D-0014") the surgeon never sees elsewhere (C-01) |
| 3 | User control and freedom | 3 | Withdraw, re-file and back links exist; note deletion has no undo (C-08) |
| 4 | Consistency and standards | 2 | The technical design's template still carries ruler lines and the separate post-tile blocks the PRD removed (R-94, R-115, R-116), and its peer-under-five and M&M strings predate R-125; two documents, two emails (C-02) |
| 5 | Error prevention | 3 | Effect notice before filing, identifier scan, case id as first token, note required on a decision; the claim cap is shown; nothing prevents disputing a row already under an open dispute except the intake rule (R-64), which the form does not state (C-09) |
| 6 | Recognition rather than recall | 3 | "How to dispute" sits about 150 lines below the rows it refers to; the rows block itself carries no instruction (C-05) |
| 7 | Flexibility and efficiency | 2 | One rigid path by design (no bulk decisions, no shortcuts); sortable headers and deep links are the only accelerators. Honest for an M2 that forbids JavaScript |
| 8 | Aesthetic and minimalist design | 3 | Tiles as rows, no cards, dead buckets collapsed; the full definitions text rides in every monthly email (C-07) |
| 9 | Help users recognise, diagnose and recover from errors | 3 | `load-failure` names the recovery; `claim-identifier` names the pattern; `awaiting-row` names the fix; `period-not-published-for-you` leaks the run record's text (C-06) |
| 10 | Help and documentation | 2 | Definition pages and "what this is not" exist; nothing surgeon-facing explains how a dispute proceeds end to end (states, the 14-day target, what "sustained" changes) (C-10) |
| **Total** | | **27/40** | **Acceptable** (68%). After the accepted fixes below, the re-read scores 4, 4, 3, 3, 3, 4, 2, 3, 3, 3 = 32/40, Good |

### Design specificity verdict

**LLM assessment:** the specification is authored for this product. Tiles as definition-list rows, a suppression reason in the value position, "as logged · as adjudicated" on one line, a strip plot with hollow peers and a filled "You" square, a queue that shows no value of anyone, an inbox with no count: none of these could be lifted into an unrelated product unchanged. What was category-interchangeable before the design review (no face, no scale, no colour) is now a proposal (R-120) that `DESIGN.md` replaces with a committed world. Missed opportunities for character remain in the copy (internal keys and ids leaking onto surgeon-facing lines) and in the two documents disagreeing about the email's shape.

**Deterministic scan:** `impeccable detect --json docs` returned no findings because there is no HTML or CSS to scan. No overlay exists.

### Overall impression

The plan already refuses the two things that kill tools like this: the score and the blank. Its weakness is drift between the PRD and the technical design after two reviews amended the PRD, and a handful of strings that still speak the ledger's language rather than the surgeon's. Both are cheap to fix and both are fixed below.

### What's working

- **"The screen says why", implemented as a versioned catalogue.** Every absent cell has a stored decision with counts; no template types a reason; the same string renders on email, page and analyst report. This is the product's spine and it is specified to the test.
- **The dispute arc reaches the surgeon three times** (acknowledgement with who decides and the due date, the day-10 note, the decision email quoting the row before and after). Silence, the failure mode Premise 6 names, is designed out.
- **The hosted view is honest about its constraints.** Server-rendered, no JavaScript to read or act, refusals with identical bytes, charts with a text twin: the accessibility floor is a property of the architecture, not a later pass.

### Priority issues

- **[P1] C-01 Internal keys and ids on surgeon-facing lines.** "Records: 7 rows in the attachment, metric = fcot"; the CSV `metric` column carrying `fcot`, `or_case_volume`; the restated legend "restated on 2026-11-12 (dispute D-0014)". Why it matters: a surgeon never sees `fcot` or `D-0014` anywhere else; the first reads as a code, the second as a file number. Fix: the records line reads "Records: 7 rows in the attachment under First-case on-time start (FCOT)"; the CSV `metric` column carries the metric name as the brief writes it; a restated cause names the case id ("restated after your dispute on case C-7K3Q9M"). Accepted as R-126. Suggested command: `/impeccable clarify`.
- **[P1] C-02 The technical design's email template disagrees with the PRD.** It still draws `=====` rulers, keeps separate "Decisions on your disputes" and "Definition changes" blocks after the tiles, lacks the "This month" block, the body rows and the orientation slot, prints "(you are not counted)" and "Target scaled to <T'> (assumption, to be confirmed)". Why it matters: a builder reading the technical design ships an email the PRD's tests fail. Fix: rewrite the template block and the two strings to R-94, R-115, R-116, R-122, R-123, R-124 and R-125. Accepted; amended in the technical design in place. Suggested command: `/impeccable polish` at build.
- **[P1] C-03 A missed run is silent.** The stale state is "last refreshed <date> older than expected" with no sentence. Why it matters: the surgeon reads October's page in December and assumes November was a bad month, or that the tool died. Fix: when the current period's publish has not happened by the expected date, the what-changed aside (page) and the What changed slot (email, which cannot be sent, so the page only) carry `run-missed`: "The November scorecard has not been published yet. This page shows October, last refreshed 12 November 2026." Accepted as R-127.
- **[P1] C-04 An open dispute is invisible from the metric page.** The tile is unchanged while a dispute is open (J2.3, proposed default) and the state lives on the row. Why it matters: the surgeon returns to the metric, sees the same number, and concludes nothing is happening. Fix: the records link reads "Records: 7 rows (1 disputed)" while any dispute on that list is open, on the metric page and the home tile; the count is the surgeon's own disputes and never a peer's. Accepted as R-127.
- **[P2] C-05 The dispute instruction is far from the rows.** The rows block at position 6 says nothing; "How to dispute" is at position 10. Fix: one line directly after the body rows: "To dispute a row, reply with its case id (first on the line) and what happened; the template is under How to dispute." Accepted into section 9.1 and R-116's order. Suggested command: `/impeccable onboard`.
- **[P2] C-06 `period-not-published-for-you` prints "<reason from the run record>".** Run-record text is the analyst's. Fix: the reason is one of a fixed set of catalogue sentences ("your roster entry ended before this period"; "your identity could not be matched to the directory"; "the publish for this period was held"). Accepted as R-126.
- **[P2] C-07 The full definitions text rides in every monthly email.** About 100 lines, last, every month. Fix considered: full text in month one and whenever a version changes, otherwise one stamp line per metric ("First-case on-time start (FCOT): definition v1, unchanged since your October email"). Held: it changes F-50 AC 7 ("definition text is in the email months' artifact"), which is the catalogue owner's call; recorded in section 16.7 as a question, not amended.
- **[P2] C-08 Note deletion has no undo.** clarify.md prefers undo over confirmation when recovery is safe. Fix: "Note deleted." followed by a "Restore it" link valid until the next note action, backed by a soft-delete flag on `restricted.private_note`. Accepted as R-128 (M4).
- **[P2] C-09 The dispute form does not say that a second dispute on the same field attaches to the open one.** R-64 defines it for replies. Fix: when a dispute is open on the record and field, the form shows "A dispute on this field is already open (filed 14 Nov 2026). What you write here is added to it." above the claim. Accepted as R-128.
- **[P2] C-10 No surgeon-facing account of how a dispute proceeds.** Fix: a "How a dispute proceeds" section on `/whats-not` and in the email's "How to dispute" block, five catalogue sentences: who decides, the 14-day target, the three outcomes in plain words, what a sustained decision changes, that the row keeps its history. Accepted as R-128.

### Cognitive load

Checklist: single focus, pass (one object per page); chunking, fail (a full email tile carries up to eight elements: name, value, decomposition, records, comparator, three-line spread, provenance, up to twelve trend rows); grouping, pass; visual hierarchy, pass (R-116 order); one thing at a time, pass; minimal choices, pass (home offers four live rows and four collapsed lines); working memory, fail in M1 (the surgeon copies a case id from a row into a reply; mitigated by the id being first on the row and first in the template); progressive disclosure, pass (compact tiles on home, full on the metric page). Two failures: moderate. The email tile's chunking is inherent to plain text and is bounded by the "This month" block carrying the four values first.

### Emotional journey

Peak: finding the late case from the 14th and reading "not your delay (anesthesia)" beside it without having to dispute anything (R-123, R-124). Valley: the first five seconds of an unexpected service-mailbox email with an attachment (addressed by R-122 and the step-zero showing). End: the decision email quoting the row before and after (R-97). The valley the plan does not yet close is the silent missed month (C-03).

### Persona red flags

**Alex (power user; the division chief in the queue):** no keyboard shortcuts, none expected. The queue sorts oldest first only; the closed queue has no filter by surgeon or metric. One dispute per page by design; acceptable, since each decision needs a note. Red flag: the decision form's three radios have no default, which is right, but a submit with nothing chosen must preserve the note (R-118 covers input preservation for the claim; extended to the decision note in R-128).

**Sam (screen reader, keyboard only):** the strongest persona in this plan. Red flags: every home tile's records link has the same accessible name ("Records: 19 rows") across many tiles, so a links list reads as a run of identical entries; fix: the link's accessible name ends with the metric name ("Records: 19 rows, OR case volume"), accepted as R-126. The period picker's "Go" button and skip link are specified. The strip plot's `aria-describedby` points at visible text, correct.

**Casey (phone, one thumb, interrupted):** the dispute button is a 44 px full-width control in the final column of a table that scrolls inside its container at tablet width; at 360 px the key columns fit. Red flag: a claim typed on a phone and lost to `session-expired` (30 minutes idle) is stated, not prevented; a draft cannot be kept server-side without a store the PRD forbids. Kept as stated.

**Project persona, the surgeon who recognises a colleague in a seven-marker spread (J1.11):** nothing on the surface claims otherwise; "Names are hidden, not people." Correct. Red flag: none.

**Project persona, the chief who is party to a record (J2.4):** the routing tests fire before the chief can see it; the queue never lists it. Correct.

### Minor observations

- Trend rows use `2026-10`; headers use "October 2026"; record rows use `2026-10-14`. Keep ISO on rows and prose in sentences; state the rule once (DESIGN.md, Email grammar).
- The email's "Records: <n> rows in the attachment" line does not say the CSV opens in a spreadsheet; the rehearsal on three phone clients (R-82) answers whether that matters.
- The technical design's inbox mock shows the NPS item as "Would recommend: 6" beside "2 of 5" items; both are real scales; leave as is.
- The strip plot at 30 peers with many ties stacks circles vertically without a cap (see harden H-11).

### Questions to consider

- What if the metric page led with the records table and put the value above it as a caption, since the rows are the product?
- Does month two need the "Peers:" list at all when the count sentence carries the range and the hosted strip plot carries the values? (Held: TD-06.)
- What would the chief's queue look like if it were the surgeon's own record list with a decision column, so the two roles learned one table?

Questions skipped: no human is present to answer; the three questions above are recorded for the next attended `/impeccable critique`.

---

## 2. Clarify: copy pass on every prescribed surgeon-facing string

Rules applied from clarify.md: one fact the user needs now; a specific verb and object; name the problem and the recovery; no internal codes; the same noun for the same concept; say each idea once; tone matched to consequence. Metric names stay exactly as the brief writes them. "Sustained" is kept as the decision word because the brief's owner, the journeys and the ledger use it; "annotated" and "source corrected" leave the row and stay on the record detail, where the provenance explains them.

| Key or place | Before | After | Rule | Disposition |
|---|---|---|---|---|
| Subject (R-122) | Your October 2026 scorecard and case list, from <analyst name> | unchanged | Product name is a taste decision (TD-13) | Kept |
| Preview lines (R-122) | Four numbers from periop's OR log and your own case list. Only you receive this email. | unchanged; a variant when no tile carries a value: "Your October case list from periop's OR log. Only you receive this email." | Do not promise what the body cannot show | Accepted (R-129, variant) |
| Header line 1 | Clinician Scorecard for Dr. <Name> | unchanged | TD-13 | Kept |
| `month-one-orientation` | First monthly email. Four numbers from periop's OR log for October, and your own case list. Only you receive this email; your chief or chair sees one of your rows only when you dispute it. | unchanged | Already one fact per sentence | Kept |
| `what-this-is-not-line` | This scorecard is not a comp input, not a rank and not an OPPE record. It is visible to you; your chief sees a record only when you dispute it; no leader view exists in the pilot; disputes change the record list. | Not a comp input, not a rank, not an OPPE record. Only you see it. Your chief sees one of your records only when you dispute it. No leader view exists in the pilot. A dispute changes your record list. | Short sentences; the same nouns as the orientation block | Accepted (catalogue version) |
| Rows-and-attachment line | Your first cases and cancellations are below; the full list is attached as scorecard-2026-10.csv. To dispute a row, see "How to dispute". | unchanged | | Kept |
| New line after the body rows (C-05) | (none) | To dispute a row, reply with its case id (first on the line) and what happened. The template is under How to dispute. | Instruction at the point of use | Accepted (section 9.1) |
| Records line (email) | Records: 7 rows in the attachment, metric = fcot | Records: 7 rows in the attachment under First-case on-time start (FCOT) | No internal codes | Accepted (R-126) |
| CSV `metric` column values | fcot, or_case_volume, duration_accuracy, same_day_cancel | the metric name as the brief writes it | Same words everywhere | Accepted (R-126) |
| Records link (page) | Records: 19 rows | Records: 19 rows (accessible name ends ", OR case volume"); "Records: 7 rows (1 disputed)" while a dispute is open | Distinct link names; visible status | Accepted (R-126, R-127) |
| Min-n suppression | Not shown: 3 first cases this month; needs at least 4 | unchanged | Counts, threshold, one sentence | Kept |
| Min-n at zero | Not shown: 0 first cases this month; needs at least 4 | Not shown: no first cases were credited to you in October; needs at least 4 | Zero is a fact about crediting, not a count | Accepted (section 9.4) |
| Peer-under-five (R-125) | Peer comparison not shown: only 4 other neurosurgeons at this site had 5 or more cases this month; needs 5 | Peer comparison not shown: only 4 other neurosurgeons at this site had 5 or more cases this month; 5 are needed for a comparison | "needs 5" reads as an instruction to the surgeon | Accepted (R-125 amended in 9.3 and 9.4) |
| Sole peer (new) | (the above with "only 0 other") | Peer comparison not shown: you are the only neurosurgeon in your subspecialty at this site | Zero peers is a different fact | Accepted (R-129) |
| Hidden month | Hidden: 7 responses this month; needs at least 10 | unchanged | | Kept |
| Not applicable | Not applicable: no allocated block this month | unchanged | | Kept |
| Not in this release | Not in this release: needs the block allocation and release schedule; owner not yet named | Not in this release: needs the block allocation and release schedule; no owner of that data has been named yet | "owner" without "of that data" reads as a person missing from the roster | Accepted (section 9.4) |
| Pending source | Data source pending confirmation | Not yet available: the data source has not been confirmed | Leading label matches the other absences | Accepted (section 9.4) |
| Not computable | not computable: <field> not in extract | Not shown: the OR-log extract for October did not include <field in plain words>, so this cannot be computed as defined | Names the cause in the surgeon's words; sentence case | Accepted (section 9.4) |
| Feed not received | <feed> for <period> not received as of <date> | Not shown: the OR-log extract for October had not arrived as of 12 November 2026. This is not a zero. | Names what failed and prevents the misreading the no-zero rule exists for | Accepted (section 9.4) |
| Counted quarterly | Counted quarterly; the quarter closes 31 December 2026. Scheduled cases so far this quarter: 24. | unchanged | | Kept |
| `late-breakdown` | Of the 2 late: 1 your delay, 1 not your delay (all 2 counted under periop's definition) | unchanged; zero variant: "No late first cases." | | Accepted (zero variant, section 9.4) |
| `run-missed` (new) | (none) | The November scorecard has not been published yet. This page shows October, last refreshed 12 November 2026. | Visibility of status | Accepted (R-127) |
| Disputed row | Disputed - with chief, filed 14 Nov 2026 | unchanged | Fixed by tests; short; the hyphen is a plain-text separator | Kept |
| Sustained row | Dispute sustained (annotated) by division chief on 3 Dec 2026: delay reason corrected to anesthesia; correction requested at periop 12 Dec 2026. | Dispute sustained by your division chief on 3 Dec 2026: delay reason corrected to anesthesia on this row; periop asked to correct its record on 12 Dec 2026. | "annotated" is ledger vocabulary; the outcome word stays on the record detail | Accepted (R-126; F-59 row text version) |
| Not sustained row | Dispute not sustained by division chief on <date>: <note> | Dispute not sustained by your division chief on 3 Dec 2026: <note>. Record detail adds: "You may file once more on this record with new evidence." | Recovery stated where the action is | Accepted (R-128) |
| Withdrawn | Withdrawn by you on <date>. | unchanged | | Kept |
| Restated legend (email) | * restated on 2026-11-12 (dispute D-0014); as logged 71% 5/7 | restated after your dispute on case C-7K3Q9M; as logged 71% 5/7 | No internal ids | Accepted (R-126) |
| `dispute-filed` and R-59 acknowledgement | Dispute received on case <id>, filed <date>, routed to <chief or chair>. / Dispute received on case <id>, filed <date>. <Chief or chair> decides; decision due <date>. | Dispute received on case C-7K3Q9M, filed 14 Nov 2026. Your division chief decides; decision due 28 Nov 2026. | One string on both surfaces; "routed" is ledger vocabulary | Accepted (R-126) |
| `dispute-day-10` | Still with your <chief or chair>; decision due <date>. | unchanged | | Kept |
| Effect notice | A sustained delay-reason dispute corrects the reason on this row. The case stays late and your FCOT number does not move, so it still matches periop's report. | unchanged; R-58's second sentence stands | | Kept |
| Open-dispute notice on the form (new, C-09) | (none) | A dispute on this field is already open (filed 14 Nov 2026). What you write here is added to it. | Prevents a second filing | Accepted (R-128) |
| `claim-required` | (unspecified) | Write what happened before filing. | Verb and object | Accepted (section 9.4) |
| `claim-too-long` | (with the cap and the count) | Your claim is 1,240 characters; the limit is 1,000. | Specific | Accepted (section 9.4) |
| `claim-identifier` | Your claim appears to contain a patient identifier (<pattern name>). Describe the record by its case id and what happened, then file again. | unchanged | Already names problem and recovery | Kept |
| `session-expired` | Your session ended after 30 minutes idle. Sign in again; the claim you typed was not saved. | unchanged | | Kept |
| `period-not-published-for-you` | No scorecard was published for you for <period>: <reason from the run record>. | No scorecard was published for you for October 2026: <one of three catalogue reasons>. | No internal text | Accepted (R-126) |
| `not-authorized` | (catalogue text unspecified) | This page is not available to you. If you think it should be, contact <analyst mailbox>. | Same bytes for not yours and not found; a recovery | Accepted (section 9.4) |
| `load-failure` | The page could not be loaded. Your data has not changed. Try again or contact <analyst mailbox>. | unchanged | | Kept |
| `not-on-roster`, `no-period`, `queue-empty`, `leader-none`, `leader-gate`, note states | as in R-118 | unchanged | | Kept |
| `decision-recorded` | Decision recorded <date>. <Surgeon>'s <metric> for <period> was recomputed; the decision email was sent. | unchanged | | Kept |
| Records, zero rows | 0 rows; the October extract loaded with no cases credited to you | No rows: the October extract loaded and credited no cases to you | Sentence, not a code-like fragment | Accepted (section 9.7) |
| M&M unreachable flag | Flag: cannot reach 8 this year | 8 of 12 cannot be reached this year: 4 sessions remain and 5 are needed | Counts carry the flag; "Flag:" was a label doing a colour's job | Accepted (section 9.3) |
| M&M leave-adjusted target | Target adjusted for your leave: <a> of <T'> (this adjustment is not yet confirmed; see the definition page) | unchanged (R-125); the technical design's older "Target scaled to <T'> (assumption, to be confirmed)" replaced | Consistency | Accepted (technical design) |
| wRVU two sentences | Your comp target is in your comp letter; this page does not show it. / Corrections to billed wRVUs go to the professional billing office; this page mirrors their report | unchanged (OQ-33) | | Kept |
| Spread count sentence | Neurosurgeons at your site: 7 peers, each with at least 4 first cases. Names are hidden, not people. | unchanged; adding the range ("from 43% to 86%") is held with TD-06 | | Held |
| Buckets 3 to 6 paragraph | Buckets 3 to 6 are not in this release. Each metric's definition and the feed it needs are on the definition pages below. | unchanged | | Kept |
| Reply template | Case id: / What is wrong: / What happened: | unchanged | | Kept |
| Footer | Source: periop OR log, reconciled to periop's October report. Sent by <analyst name> from the department mailbox; reply to dispute or ask. | unchanged | | Kept |
| "How a dispute proceeds" (new, C-10) | (none) | Your division chief decides, or the chair if the chief is involved. The target is 14 days. The decision is one of: sustained, not sustained, or a definition question. A sustained decision corrects the row or credits the case to the right surgeon; the reason you gave and the decision stay on the row. Periop is asked to correct its record; until it does, both values show. | Task-focused help at the point of need | Accepted (R-128) |

Counts: 49 strings read; 27 rewritten or added and accepted; 1 held (the spread count sentence's range clause, with TD-06); 21 kept.

---

## 3. Onboard: empty, first-run and activation flows

The aha moment: a surgeon finds a late first case in their own list and reads why it was counted, without asking anyone. Everything before that moment is in the way; everything after it is the product. Users are experts in the domain and beginners in the tool; motivation is "required by nothing", so the first email must earn a second.

### First run: the month-one email (J1.1, J1.2)

| Onboard.md principle | What the plan does | Finding and fix |
|---|---|---|
| Show, don't tell | Step zero shows the exact synthetic email (R-122); the email itself carries the four values and the rows | Pass |
| Time to value | The first phone screen ends at "This month" (R-116) | Pass |
| Context over ceremony | The orientation block is three lines in the slot "What changed" later occupies (R-122) | Pass |
| Respect intelligence | No tour, no welcome, no tips | Pass |
| Empty state teaches | A month with every tile suppressed still sends; each reason has counts | O-01: the preview line promises "Four numbers" when none can show. Fix: the preview variant (R-129) |
| Contextual help at the point of use | "How to dispute" is at position 10 | O-02: the row-adjacent instruction (C-05, accepted) |
| Don't show the same thing twice | Month two replaces the orientation with What changed (R-115) | Pass |

### First hosted visit (M2, from the email's deep link)

| Principle | What the plan does | Finding and fix |
|---|---|---|
| Welcome without a welcome screen | The page opens at `/me/<period>` with the stamp, What changed and the tiles | O-03: nothing tells a first visitor that the page and the email agree, or that rows now have buttons. Fix: `first-hosted-visit`, rendered in the what-changed aside when the access audit log holds no prior `view` by this identity: "First visit. This page shows the same numbers as your October email, plus the records behind each one and a dispute button on every row." Shown once, because the audit log is the record (R-127) |
| Empty states by type | `no-period` (first use), "No rows" (no results), `not-authorized` and `leader-gate` (permissions), `load-failure` (error) are distinct | Pass; each names the next action |
| Progressive disclosure | Home compact, metric full, records table, record detail with history | Pass |
| Returning user | What changed since <period> under the stamp | Pass |
| Feature discovery | The definition stamp and records link sit directly under the value | Pass; no badges or "new" markers, by rule |

### First dispute (J2.2, J2.3)

| Principle | What the plan does | Finding and fix |
|---|---|---|
| Teach when needed | The effect notice sits above the submit control and says what will and will not change (F-56, R-58) | Pass |
| First success confirmed | `dispute-filed` names the case id, the date, who decides and the due date (merged string, R-126) | Pass after the merge |
| Clear next step | The day-10 note and the decision email (R-88, R-97) | Pass |
| Prevent the wrong first action | The claim cap and identifier scan are stated; an open dispute on the field is not | O-04: the open-dispute notice (C-09, accepted) |
| Explain the process once | Nothing explains outcomes before the first decision arrives | O-05: "How a dispute proceeds" (C-10, accepted) |

### Adjudicator's first queue (J2.5)

| Principle | What the plan does | Finding and fix |
|---|---|---|
| Empty state | `queue-empty` with the closed-list link | Pass |
| First decision | The provenance panel, the decision form with a required note, `decision-recorded` | O-06: a chief who is also a surgeon lands on their own scorecard (`/` redirects to `/me`); the queue is one nav entry away and the deep link in the dispute-filed email goes to `/disputes/<id>`. Pass; no change |

### Direct leader's first visit (M4)

`/leader` lists each surgeon with the date their inbox opens (F-89 AC 1); `leader-gate` names the date; `leader-none` names the condition. Pass. O-07: the leader's view has no line saying notes are the surgeon's and are not shown; fix: one line under the leader inbox header, "Private notes are the surgeon's and are not shown here." (R-128, M4).

### Activation measure

Adoption is read from disputes, questions and the month-three interview (R-95), never a "seen" reply (TD-12). O-08: the hosted view's access audit log gives an open rate from M2; the PRD already counts hosted opens (section 13, M2 exit). Pass.

Findings: 8 (O-01 to O-08); 6 accepted and amended (O-01, O-02, O-03, O-04, O-05, O-07); 2 pass with no change (O-06, O-08).

---

## 4. Harden: edge cases, errors, extreme data

Assessed against harden.md's dimensions. Internationalisation is not required: one language (English), one institution, one time zone; this is stated as a product fact in `PRODUCT.md`, so the RTL, CJK, pluralisation and translation-expansion checks are recorded as not applicable rather than skipped. Number formatting is fixed at en-US (1,000; 71%).

| # | Case | What the plan does | Finding and fix | Disposition |
|---|---|---|---|---|
| H-01 | 47-character and longer procedure names (periop free text) | The procedure rides in the CSV and in the record table; never in the email body rows (R-124) | Table: the `procedure` cell wraps (`overflow-wrap: anywhere`), the `case_id` column never wraps and has `white-space: nowrap`; CSV: no limit. Email body rows carry date, state and label only, so a long name cannot break the 72-character line | Accepted (DESIGN.md record table; R-129) |
| H-02 | Long delay or cancellation reason as stored (40 or more characters) | Body row: `<case id>  <date>  late  not your delay (<reason as stored>)` | At 72 characters the row wraps to a second line; acceptable because the id is first on the first line. Rule: a wrapped continuation is indented two spaces so it cannot be mistaken for a new row. Page: the reason cell wraps | Accepted (R-129) |
| H-03 | A long surgeon name in the header and subject ("Clinician Scorecard for Dr. <Name>") | Header at 72 characters; the subject truncates on a phone at about 40 characters | Header: a name longer than 44 characters wraps after "for"; subject: the surgeon's own words lead ("Your October 2026 scorecard...") so truncation loses the analyst's name, not the meaning | Accepted (R-129) |
| H-04 | Zero peers (the surgeon is the only one in the subspecialty at the site) | The peer-under-five string would read "only 0 other neurosurgeons" | `sole-peer` variant: "Peer comparison not shown: you are the only neurosurgeon in your subspecialty at this site." The comparator line's peer count reads "(no other surgeons)" | Accepted (R-129) |
| H-05 | Every tile suppressed in a month | The email still sends; "This month" is four reason lines | The preview variant (O-01); the orientation block in month one is unchanged. The page's What changed aside says nothing extra; the four reasons carry it | Accepted (R-129) |
| H-06 | A surgeon with no cases in the month (leave, sabbatical) | OR case volume 0 only when the feed loaded; other tiles "no first cases were credited to you"; record lists "No rows" | The CEO block left the whole-month-leave email with the definitions owner. Held: the HR leave feed is M5; until then the email sends with the zero-crediting sentences and no claim about leave | Held (definitions owner; carried from appendix D ceo block) |
| H-07 | Error: page load failure, statement timeout, unhandled exception | `load-failure` with "Your data has not changed", correlation id in the log, no stack trace | Pass. Add: the correlation id is shown as "Reference <8 characters>" so a surgeon can quote it to the analyst | Accepted (section 9.4) |
| H-08 | Stale data: a missed monthly run | "last refreshed" keeps the prior date | `run-missed` sentence (C-03) | Accepted (R-127) |
| H-09 | Feed not received, feed held, not computable | Distinct states; never a zero | Strings rewritten in plain words (clarify) | Accepted |
| H-10 | Time zones for "last refreshed", "as of", filed and decided dates | Not stated | Rule: every date and time on a surface is the department's local time (one zone, stored as `department_setting.time_zone`); dates render without a zone suffix; "as of" values are dates, not instants; the publish timestamp is stored in UTC and rendered in the department zone. No surgeon is expected to read the tool from another zone (assumption; confirm) | Accepted (R-129) |
| H-11 | 30 peers with ties on the strip plot | Ties stack vertically without a cap | Cap the stack at four; a fifth tied value widens the circle's stroke and the text table carries the count ("4 peers at 75%") | Accepted (DESIGN.md spread) |
| H-12 | 120-row record list; 200-comment inbox | No pagination in M2 or M4 | Acceptable for one surgeon's quarter and one year of comments; state the assumption; revisit above 200 rows | Recorded as an assumption (briefs) |
| H-13 | Double submission of the dispute form | CSRF token; R-64 attaches a second reply | The form's POST is idempotent on (record, field, open dispute): a second submit lands on the same dispute detail; the open-dispute notice (C-09) shows on a reload | Accepted (R-128) |
| H-14 | Special characters in procedure names and claims (`<`, `&`, quotes, emoji) | Jinja2 autoescape; CSV formula escape (R-94) | Pass; claims are scanned, capped and escaped; emoji in a claim are stored and rendered as text | Pass |
| H-15 | Interrupted gestures | No custom drag, slider or gesture exists | Not applicable | n/a |
| H-16 | 200% zoom and 360 px | R-121 tests every page at 360 px; zoom untested | Add 200% zoom at 1280 px to the CI screenshot set | Accepted (R-129) |
| H-17 | Print for annual review | OQ-46 deferred | Held; a print stylesheet is one file when the owner asks | Held (OQ-46) |
| H-18 | Extreme O/E intervals (0.04 to 9.3) | Interval dots | Log axis with the clip named in the text table (assumption in the M2 brief) | Recorded as an assumption (M6) |
| H-19 | Bounced email, misdirected send | Bounce logged, retry after correction, incident procedure (OQ-58) | Pass | Pass |
| H-20 | High-contrast mode (Windows) | Words carry every state; hairlines vanish in forced colours | Add `forced-colors` rules: 1 px `CanvasText` borders on tables and the dispute-state cell | Accepted (DESIGN.md, Browser surfaces) |

Findings: 20 cases; 14 accepted, 3 held or recorded as assumptions, 3 pass or not applicable.

---

## 5. Review log

Every amendment made to `docs/PRD.md` and `docs/03-technical-design.md` in this run. Existing IDs are unchanged; appendix D's ceo and design blocks are untouched.

| File | Location | Change |
|---|---|---|
| docs/PRD.md | Section 9 preamble | One sentence noting the impeccable pass and where its artifacts live |
| docs/PRD.md | Section 9.1, bullets | Records line names the metric, not a key; a one-line dispute instruction directly after the body rows; the preview variant when no tile carries a value; the "How a dispute proceeds" sentences in the "How to dispute" block; the restated legend names the case id |
| docs/PRD.md | Section 9.3, "The screen says why" row | Peer-under-five wording ends "5 are needed for a comparison"; sole-peer variant |
| docs/PRD.md | Section 9.3, "M&M pace and unreachable flag" row | The unreachable flag in counts |
| docs/PRD.md | Section 9.4 | Rows rewritten: Empty (zero variant), Suppressed (peer-under-five), Not in this release, Pending source, Not computable, Feed not received, Page error (reference id), Disputed (decided row text), Period not published for you, Dispute filed (merged), Claim validation. Rows added: Sole peer, Run missed, First hosted visit, Open dispute on the field, Not authorized, Late cases decomposed (zero variant), How a dispute proceeds |
| docs/PRD.md | Section 9.7, Record list row | "No rows" wording |
| docs/PRD.md | Section 9.9 | The token set and component inventory now live in `DESIGN.md` at the repository root; night scheme and one authored motion noted as assumptions held for the human |
| docs/PRD.md | Section 7.4, R-120 | Amended: `DESIGN.md` at the repository root holds the token set and the component inventory; the face and accent recorded there as proposals; the review's IBM Plex and #1d4ed8 values superseded pending the human's choice |
| docs/PRD.md | Section 7.4, new rows R-126, R-127, R-128 | R-126 no internal keys or ids on surgeon-facing surfaces (records line, CSV metric column, restated cause, merged acknowledgement, catalogue reasons for period-not-published, distinct link names); R-127 status visibility (open-dispute count on the records link, `run-missed`, `first-hosted-visit`); R-128 dispute-process help and safeguards ("How a dispute proceeds", open-dispute notice, re-file sentence on a denial, decision note preserved, note-deletion undo, leader-view notes line) |
| docs/PRD.md | Section 7.12, new row R-129 | Hardening: preview variant, sole-peer variant, wrapped-row indentation, long-name wrap, time-zone rule, 200% zoom in CI, forced-colours rules, procedure-cell wrapping |
| docs/PRD.md | Section 7.16 count line | Requirement count 125 to 129 |
| docs/PRD.md | Section 16.7 | One open question added: whether the full definitions text must ride in every email (C-07, F-50 AC 7) |
| docs/PRD.md | Appendix C | Row 0.7 |
| docs/PRD.md | Appendix D, after the design block | One line: impeccable design artifacts exist and where |
| docs/03-technical-design.md | "M1: the monthly email", "The plain-text template" | Template rewritten to the PRD's order and grammar (R-94, R-115, R-116, R-122, R-123, R-124): no ruler lines, envelope and preview lines, orientation or what-changed slot, "This month" block, body rows with the row-adjacent instruction, one provenance line per tile, no separate post-tile decision or definition blocks, records line without an internal key, restated legend naming the case id; month-two spread with "You" first and "Names are hidden, not people."; peer-under-five string per R-125 and this pass |
| docs/03-technical-design.md | "The CSV of the surgeon's own rows" | `metric` column carries the brief's metric name |
| docs/03-technical-design.md | "Page inventory", metric tile and record list rows | Open-dispute count on the records link; `first-hosted-visit` on home |
| docs/03-technical-design.md | "Empty, loading, error and suppressed states per page" | `not-authorized` text; `load-failure` reference id; `run-missed`; zero-rows wording; period-not-published reasons from the catalogue |
| docs/03-technical-design.md | "Accessibility baseline" (web) | Pointer to `DESIGN.md` tokens; 200% zoom and forced-colours checks |
| docs/03-technical-design.md | "Charts" | Marker and stroke treatment per `DESIGN.md`; tie-stack cap |
| docs/03-technical-design.md | "M&M attendance pace display" | Leave-adjusted target string per R-125; unreachable flag in counts |
| docs/03-technical-design.md | "Review log" | One line pointing at this file |
| README.md | Documents table; "Continuing with gstack" | Rows for PRODUCT.md, DESIGN.md, docs/design/briefs/, this file; one sentence routing frontend design through /impeccable |
