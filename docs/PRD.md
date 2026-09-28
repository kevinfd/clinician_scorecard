# Clinician Scorecard: Product Requirements Document

Version 0.1 · 2026-09-28 · Status: DRAFT · Derived from `docs/source/metric-definitions-v0.2.md` (the brief), `docs/designs/clinician-scorecard.md` (the design doc), `docs/01-user-journeys.md` (the journeys) and `docs/02-features.md` (the feature catalogue).

How to read this document: features are cited as `F-xx`, journey steps as `J1.4`, open questions as `OQ-nn` (from the catalogue register) and design-doc premises as `P1` to `P12`. Metric names are quoted exactly as the brief writes them. The brief's name "Work RVUs — live tracker" and its marker "(assumption — to be confirmed)" contain a dash; those verbatim quotations are the only places a dash of that kind appears here. Where this document says "proposed default", the brief is silent, the catalogue proposes a buildable answer, and the brief's owner can reverse it.

---

## 1. Summary

The Clinician Scorecard is a read-only, per-surgeon metrics viewer for a neurosurgery department inside MGB, covering the 25 items in the brief across six buckets: volume and mix, efficiency, access, quality and outcomes, patient experience, and citizenship. Behind every number it keeps a record-level attribution ledger, a dispute path with a written outcome that shows up in the record list, suppression that says why a number is missing, an anonymous peer spread, and a trend. It ships first as a monthly email carrying four OR-log metrics and the surgeon's own case list, and grows one feed at a time as each feed's owner and governance gate clears.

The one-line product statement, from the design doc: **not a scorecard, and not a competing number.** There is no composite score, no rank, and no target except M&M attendance. It reconciles to the institutional numbers that already exist and adds what their owners cannot give a surgeon: the case list, the dispute, the reason, the spread and the trend. The ledger and the dispute path are the product; the charts are the surface.

The brief (v0.2, 2026-09-09) is owned by Omar Arnaout. The brief is preserved verbatim; edits go in a new version, not in place.

Status: DRAFT. Nothing in this document is approved. The design doc was produced headless with no human present, and every decision it records is marked for the human to reverse.

How this PRD relates to the supporting documents: this is the document a team builds from. The design doc holds the problem framing, the premises, the approaches considered and the recommended wedge; this PRD cites it and does not restate it. The journeys (J1 to J4) are the behavior a builder derives features from. The feature catalogue (F-01 to F-113, 112 active) holds one feature at a time with acceptance criteria a tester can run; this PRD maps each feature to a requirement, a milestone and a priority, and does not restate acceptance criteria. The technical design (`docs/03-technical-design.md`) maps features to components and tables; section 10 is a placeholder until it exists.

---

## 2. Background and problem

**Status quo.** A surgeon today sees a few numbers about themselves, each from a different owner with its own definition: patient-experience scores twice a year at faculty meeting, wRVUs in the comp letter, periop efficiency numbers when block is reallocated, and OPPE numbers when the medical staff office sends a packet. None comes with the case list behind it, and none has a dispute path that changes anything. The design doc's per-bucket inventory (Status Quo table) lists the expected owner and definition for each; owners and definitions are expected, not confirmed, and confirming them is part of the Assignment (section 13, M0). The real competitor is the periop report plus the OPPE packet plus the faculty-meeting slide, held side by side at a meeting where two numbers for the same surgeon disagree.

**Demand evidence and its gaps.** The design doc tags demand as UNKNOWN, partially answered from the brief for comp-linked metrics. The brief quotes a comp-plan link ("Target: 8 of 12 per fiscal year, per the comp plan") and a cadence complaint ("available any time instead of twice a year"). No surgeon is quoted. Nobody is on record disputing a periop or OPPE number, keeping a spreadsheet, or asking when this ships. The demand this system can own, per the design doc, is "see my own list before anyone else does" (the surgeon) and "stop spending faculty-meeting time arguing about whose number is right" (the chair). Evidence that would change the position: a surgeon who disputed a number in the last year and had nothing to point at; a chief who spent more than two hours on one surgeon's numbers; a surgeon keeping their own spreadsheet. The Assignment (M0) is designed to find that evidence or its absence before code.

**Cost of doing nothing.** Faculty-meeting minutes spent arguing about whose number is right, and chief hours assembling numbers for comp and OPPE conversations without record-level backing. Both are unmeasured (P10).

**Why now.** Three things line up: a written v0.2 brief with an owner and six ground rules that already contain the corrections the report-card literature asks for (O/E where a risk model exists, "unadjusted" labels, min-n, no rank, dispute path, drill to records); a new QR-code M&M attendance system tied to the comp plan; and a periop analytics team that already produces a surgeon-level report whose case-level extract is the fastest real data available. The design doc's warning stands: the report-card failure mode (risk aversion, case-selection gaming, mistrust of attribution) is what the ground rules are designed against, and they have not yet been tested on a real surgeon.

---

## 3. Goals and non-goals

### 3.1 Goals

Reworded from the design doc's success criteria. None can be satisfied by the champion alone.

| # | Goal | Number | Milestone |
|---|---|---|---|
| G1 | Reconcile before anyone sees a number | The four wedge numbers match periop's report for every pilot surgeon in the pilot month, or every difference is explained by a written definition delta (F-81) | M1 |
| G2 | Surgeons come back unprompted | At least half of pilot surgeons reply to or report opening the month-two and month-three email with no chief reminder; at least three open their case list (F-91) | M1 |
| G3 | Disputes change the record list | At least two disputes filed by surgeons who are not the brief's owner, each decided within 14 days with the outcome visible on the row; the disputed-record rate per surgeon falls from month one to month three; zero "the number is just wrong" outcomes (F-98) | M1 |
| G4 | Every missing number says why | 100% of below-threshold cells carry the rule that suppressed them; none is blank (F-32, F-33) | M1 |
| G5 | Fresh on a schedule | OR-log metrics refreshed within 10 business days of month close for three consecutive months (F-83, F-112) | M1 |
| G6 | Survives its champion | A named department analyst who is not the builder runs the monthly batch unassisted for two consecutive months from a one-command procedure; the chair approves a standing time fraction; the extract arrives through the owning team's ticketed process (F-79, P8) | M1 |
| G7 | Earn the next feed | Within 30 days of the month-three review, a feed the department does not own is authorized in writing by its owner outside the department | M1 exit |
| G8 | Mirror the comp number exactly | The comp office confirms in writing that the scorecard's wRVU query matches theirs before the wRVU tile is first published (F-77) | M5 |

### 3.2 Non-goals

The product does not do these. Each is enforced by a feature or held by an open question; none is a gap.

| Non-goal | Enforced by | Source |
|---|---|---|
| A composite score | F-42 scans every artifact | Design doc Constraints |
| Ranking of surgeons | F-42; F-46 shows position, never named order | Design doc Constraints; GR4 |
| Any target other than M&M attendance (8 of 12) | F-42; F-77 states "no target" on the wRVU tile | Brief Bucket 1 and 6 |
| Hand-entered complications | F-09 exposes no entry path; F-68 corrections go to the QI coordinator | Brief Bucket 4 |
| OR turnover time, PACU boarding, room-ready delays on any individual view | F-104 carries page text only; no per-surgeon value exists | Brief Bucket 2 |
| Division and site views until a specification exists | No feature (F-105 retired); OQ-52 carries the anonymity guard | Brief Bucket 2; design doc Open Questions |
| Being a comp or OPPE system of record | Comp and OPPE numbers are a read-only mirror with source and date on the tile (F-77, F-74, F-97) | Design doc Constraints; P8 |
| Static per-surgeon pages behind SSO | F-85 requires per-user authorization | Design doc challenge 14 |
| A department-computed FCOT that differs from periop's | F-15 adopts the institutional definition verbatim; F-81 gates publish on reconciliation | Design doc challenge 3 |
| Leader, chief, chair or division views in the wedge | Surgeon sees any number 30 days before any leader view; F-60 (chief queue) is the only chief-facing screen in M1 | Design doc Constraints |
| Starting with the quality bucket | Sequenced to M6 behind the medical staff office decision | Design doc Approaches "Ruled out" |
| Sentiment scoring, summarizing or tallying survey comments | F-70 and F-11 enforce with static checks | Brief Bucket 5 |
| Hand-editing an extract to fix a record | Corrections live in the ledger (F-05) or at source (F-06) | Design doc Constraints |
| Excluding non-surgeon delays from the FCOT count | Would not reconcile to periop; OQ-12; if chosen it is a labelled department variant, never FCOT | Journeys J1.5, J2.7, J4.5 |
| An in-progress month on any tile | F-84 closed periods only; OQ-24 | Journeys J1 failure modes |
| Charge-level wRVU record list and wRVU disputes in this release | Deviation from GR5 and GR2 held as OQ-33 for the owner, not settled | Journeys J1.13, J2.11 |

---

## 4. Users and roles

| Actor | Who they are | May see | May do | Source |
|---|---|---|---|---|
| Attending neurosurgeon | The "you" of the brief; the one clinician every record is credited to | Their own tiles, trends, reasons, record lists, definition pages and spread position; their own Patient feedback inbox and private notes | Dispute any record credited to them; add, edit and delete private notes on comments (proposed default); opt out of the peer spread (P11) | Brief; J1, J2, J3 |
| Division chief | First-line adjudicator; also a surgeon with their own scorecard | Their own scorecard as a surgeon; the record, its provenance and the claim for each dispute routed to them (F-52, F-60); before step zero, a counts-only summary of which under-five groups will render (F-37) | Decide sustained (annotated or source corrected) or not sustained with a note (F-61); mark a definition question (F-63). Cannot self-assign a record that trips an involvement test (F-58) | Brief GR2; J2.5, J2.6 |
| Department chair | Adjudicates when the chief is involved; buyer of the pilot | Only escalated disputes, with the same evidence the chief would see; their own scorecard | Decide escalated disputes; approve the analyst time fraction; present step zero | Brief GR2; design doc Q3; J2.4, J2.10 |
| Direct leader | The only person besides the surgeon who may read the Patient feedback inbox; whether this is the division chief is OQ-41 | The surgeon's inbox no earlier than 30 days after the surgeon first had it (F-89); not the surgeon's private notes (proposed default, OQ-42) | Read comments with same-survey scores. Cannot write notes (brief grants notes to "you") | Brief Bucket 5; J3.8 |
| Department analyst (data steward) | Named role on a chair-approved time fraction; not in the brief | Extracts, the ledger, the dispute sheet (M1 sole editor, F-111), suppression and reconciliation reports, gate records, access and disposition logs; survey comments as pipeline data only, with no viewer role (stated at step zero, F-42) | Run the monthly batch (F-79); enter email disputes into the ledger within two business days (F-57); apply escalation tests by hand in M1 (J2.3a); send decision emails (F-93); register sources and definition versions (F-103, F-13) | Design doc P8; J4 |
| Feed owners | Periop analytics contact (M1); later hospital quality analytics, QI coordinator, patient experience office, professional billing office, attendance system owner, clinic operations, HR | The monthly sustained-override list for their feed (F-64), containing only records from that feed | Correct records at source; confirm definitions in writing | Design doc Dependencies; J2.11, J4.10 |
| Definitions owner (Omar Arnaout) | Owner of the brief | Definition registry, open items on definition pages (F-63) | Confirm "to be confirmed" items as new versions; answer open questions | Brief header; J4.11 |
| Sponsor | The person outside the department whose greenlight is the intrapreneurship goal; role UNKNOWN (design doc Q3) | A demo with real surgeons' data at the month-three review | Authorize a feed the department does not own (G7) | Design doc Q4, Success Criteria |

**The two-person boundary for the Patient feedback inbox.** The inbox is visible to the surgeon and their direct leader only (brief Bucket 5). F-88 refuses and logs every other identity, including the chair, an administrator and a chief who is not the direct leader. Comments are never counted, compared or rolled up (F-70). A survey dispute is filed on the provider-named field, never on the comment, with a structured claim and no free text, and the comment is never shown to an adjudicator who is not the direct leader (F-72). The one system-level exception is the analyst's pipeline role, which is stated out loud at step zero (F-42, OQ-40).

---

## 5. Product principles

The brief's six ground rules are product invariants. Every artifact inherits them; the features named enforce them.

| # | Invariant (brief wording, short) | Enforced by |
|---|---|---|
| GR1 | Every record is credited to exactly one clinician: primary surgeon in the OR log; index-operation surgeon for admissions even if another attending discharged; rendering provider for visits; provider named on the survey | F-01, F-02, F-03, F-04, F-07, F-08, F-09, F-10, F-11 |
| GR2 | A surgeon can dispute any record credited to them; disputes go to the division chief, or the chair if the chief is involved | F-54, F-55, F-56, F-57, F-58, F-59, F-60, F-61, F-62, F-63, F-64, F-65, F-66, F-67, F-68, F-72, F-76, F-111; one deviation (Work RVUs — live tracker) held under OQ-33 |
| GR3 | A number is not shown below the metric's minimum n or when the peer group has fewer than five surgeons; the screen says why instead of showing a blank | F-31, F-32, F-33, F-37, F-38, F-41, F-44, F-45, F-80, F-82, F-104 |
| GR4 | Peer comparisons are always anonymous: the spread and the surgeon's position, never who is who | F-35, F-36, F-40, F-46 |
| GR5 | Every number links to its definition and to the list of records behind it | F-12, F-13, F-49, F-50, F-51, F-52, F-53; F-77 deviation held under OQ-33 |
| GR6 | Every metric shows a trend, not just a snapshot | F-43, F-45, F-48, F-74, F-96 |

Additions from the design doc, held to the same standard:

| # | Invariant | Enforced by | Source |
|---|---|---|---|
| D1 | Participation in the peer spread is voluntary per surgeon; an opted-out surgeon gets the self-only view and is excluded from every peer group; a spread renders only if five participating peers clear min-n | F-35, F-99, F-31 | P11; OQ-09 |
| D2 | Every O/E and rate metric renders with an interval; the spread is an interval or funnel chart, never a bar chart of point estimates; a surgeon whose interval includes the peer median is labeled "no evidence of difference from peers" | F-24 | P12; design doc Constraints (Uncertainty) |
| D3 | Definitions are versioned code; assumptions the brief flags (grace window, room eligibility, super-long boarder threshold, leave scaling, reason sets) are named parameters with the brief's value as the flagged assumption; a confirmed item lands as a new version beside the old, never an edit; the trend marks the boundary | F-12, F-13, F-30, F-94, F-100 | Design doc Constraints; brief header |
| D4 | Never a comp or OPPE system of record; comp-relevant numbers are a read-only mirror labeled with source and date | F-42, F-77, F-74, F-97 | P8; design doc Constraints |
| D5 | Surgeon first: a surgeon sees any number at least 30 days before any leader view of it exists | F-89, F-42; no leader view in M1 | Design doc Constraints |
| D6 | Reconcile, do not compete: institutional definitions adopted verbatim; the number matches periop's before any surgeon sees it | F-15, F-17, F-81 | Design doc challenge 3 |
| D7 | Overrides are visible, versioned, never silent; "as logged" and "as adjudicated" side by side; the department does not wait for the feed owner | F-05, F-06, F-47, F-64 | Design doc Constraints (Disputes); P6 |
| D8 | Anonymity is stated honestly: "the spread hides names, not people"; every spread render is logged so the department can decide P5 with data | F-42, F-36, F-46 | P5 |

---

## 6. User journeys

Full text: `docs/01-user-journeys.md`. Four journeys, 60 steps (J1: 20; J2: 14 including J2.3a and J2.8a; J3: 10; J4: 16). Step IDs are stable and cited throughout.

**J1. Month posted (20 steps).** The surgeon attends step zero, hears the definitions and the "what this is not" page, and decides whether to opt out. The month-one email arrives on a phone with four tiles, a trend, the definition version and their own case list; the surgeon finds the late first case from the 14th and sees why it counted under the institutional definition. Month two adds the anonymous spread for attendees, with the peer count shown; a surgeon who recognizes a colleague is not surprised, because step zero said so. Part B (J1.13 to J1.20) walks the later buckets at quarter close and annual review: the wRVU mirror with its as-of date, M&M pace, Length of stay (O/E) with an interval and an excluded count, the hard mortality case (35 admissions, one death, 0.6 expected, "no evidence of difference"), the QI-sourced rates labeled "self-reported, unadjusted", and which numbers are final and which are waiting.

**J2. A record is wrong (14 steps).** The month-three FCOT sits at 60% against a year near 85%. The surgeon opens the list, disputes three records individually (a wrong delay reason, a blank reason, a case Dr. Y led), and the form says before filing what a sustained dispute on that field will do. The chief sees the record and its provenance, not a score, and rules; the analyst recomputes the same day. A sustained delay-reason dispute corrects the row and leaves the count at 6 of 10 so it still reconciles to periop; the sustained re-attribution moves the count to 6 of 9 "as adjudicated" beside 6 of 10 "as logged". A denial leaves its note on the row. Periop receives one monthly list of sustained overrides. In the email months (J2.3a) the analyst enters replies within two business days and sends a one-record decision email inside 14 days.

**J3. What patients said (10 steps).** The surgeon opens Bucket 5 in the faculty-meeting layout any time instead of twice a year, sees a hidden month with its reason ("Hidden: 7 responses this month; needs at least 10"), opens the per-response record list, reads the Patient feedback inbox newest first with same-survey scores and nothing counted, leaves a private note, and disputes a response that was an APP's visit on the provider-named field only. The direct leader reads the same inbox no earlier than 30 days later, sees no notes and nothing aggregated, and coaches from the comment.

**J4. Close and publish a period (16 steps).** The analyst runs one command: stages the extract with its ticket, checks field presence, reviews the attribution exception list and the co-surgeon rate, computes peer groups from the dated roster, computes the four metrics with version stamps and the row-count invariant, runs the reconciliation gate against periop's report, reviews the suppression report (100% reasons), writes only anonymous spreads, checks feed health (never a zero), publishes one email per surgeon and one override list to periop. Part B (J4.11 to J4.16) lands a confirmed definition as a new version, registers a pending source, recomputes only the effective periods with a boundary on the trend, and records a roster change with dated peer-group recompute.

**Coverage claim.** Every one of the 25 items in the brief has at least one cell in the journeys' coverage matrix, and the three division-and-site-only measures appear as page text and as "not computed", which is all the brief specifies for them. All six ground rules are exercised in every journey (journeys "Ground rules by journey"). Every journey step maps to at least one feature (catalogue "Journey step traceability"); the two steps with no system behavior of their own (J1.11, J3.9) are covered by acceptance criteria on the features listed there.

---

## 7. Requirements by capability area

Priority key: **Must** for M0 and M1 features and for cross-cutting invariants; **Should** for M2 to M5; **Could** for M6 and M7, pending their gates. Milestones are the earliest at which the feature must exist (catalogue milestone key). Every active feature (F-01 to F-113 except the retired F-105) appears in at least one row.

### 7.1 Attribution ledger

Intent: the ledger is the record-level store every number is computed from. One clinician per record by the rule for its type; exceptions listed; overrides live here, never in the extract.

| R-id | Requirement | Features | Milestone | Priority |
|---|---|---|---|---|
| R-01 | Every case, admission, visit, survey and attendance record is credited to exactly one clinician by the rule for its type; a multi-panel OR case takes the first-listed primary with a visible "shared" flag on the record. | F-01 | M1 | Must |
| R-02 | Cases with a blank, multiple or out-of-department primary surgeon are listed as exceptions and resolved or excluded with a recorded reason before the period publishes. | F-02 | M1 | Must |
| R-03 | The co-surgeon rate is counted per subspecialty each period; when any subspecialty exceeds 5%, "handle by dispute" is withdrawn and the owner is asked (P2). | F-03 | M0 | Must |
| R-04 | Every feed has a registered attribution rule and a named owner to whom source corrections route; a feed with no owner cannot publish. | F-04 | M1 | Must |
| R-05 | A sustained "annotated" outcome stores the adjudicator's note and an override flag on the record; the extract is never edited by hand. | F-05 | M1 | Must |
| R-06 | A sustained "source corrected" outcome creates a correction request to the feed owner, flags the record "correction requested at source" until re-ingest confirms the change, then retires the override with its history kept. | F-06 | M1 | Must |
| R-07 | A sustained re-attribution moves the record to exactly one other clinician across every metric it feeds and recomputes both surgeons against min-n. | F-07 | M1 | Must |
| R-08 | Vizient encounters are joined to the index operation under a written index-operation rule, with a report of admissions re-credited away from the discharging attending and a list of admissions with no index operation found. | F-08 | M6 | Could |
| R-09 | Complication events are accepted only from the QI feed and tied to their index case; events with no index case are flagged and never dropped silently; no entry path exists. | F-09 | M6 | Could |
| R-10 | Clinic visits are credited to the rendering provider under a named field; third-next-available slots are sampled on a schedule and reported as the monthly median. | F-10 | M7 | Could |
| R-11 | Survey responses are ingested per response, credited to the provider named, with comments stored outside every count; the load is refused unless comments arrive de-identified from a named owner. | F-11 | M4 | Should |

### 7.2 Metric engine and definitions

Intent: one versioned function per metric, the brief's numbers exactly, institutional definitions verbatim where periop already reports the number, and a recompute that never silently rewrites history.

| R-id | Requirement | Features | Milestone | Priority |
|---|---|---|---|---|
| R-12 | Every computed metric is one versioned function carrying its definition text, cadence, min-n, comparator and version; no number publishes without one. | F-12 | M1 | Must |
| R-13 | Definition versions are immutable; a confirmed item lands as a new version beside the old with effective period, confirmer and date, and every published number links to the version it was computed under. | F-13 | M1 | Must |
| R-14 | OR case volume is the monthly count of operations where the surgeon was primary surgeon, with a trend line and a case list showing the shared flag. | F-14 | M1 | Must |
| R-15 | First-case on-time start (FCOT) is computed under the institutional definition verbatim (grace window and room eligibility as parameters, OQ-01) with min-n 4 first cases; the first-case list shows scheduled start, wheels-in, on-time yes or no and the delay reason as stored. | F-15 | M1 | Must |
| R-16 | Duration estimate accuracy is the monthly share of cases with actual in-room time within 20% of booked or within 30 minutes, whichever is more forgiving, min-n 5 cases; the list shows which test applied per case. | F-16 | M1 | Must |
| R-17 | Same-day cancellations you could have prevented is the quarterly share of scheduled cases cancelled same day with a reason code in the surgeon-attributable set, min-n 10 cases; cancellations outside the set are listed and marked "not counted". | F-17 | M1 | Must |
| R-18 | Block utilization (only if you have allocated block) reads "Not in this release" until the block schedule is registered, then "Not applicable: no allocated block this month" for a surgeon without block, else used over allocated minutes after released block is removed, with a block-day list. | F-18 | M3 | Should |
| R-19 | Length of stay (O/E) is quarterly total observed days over Vizient expected days, min-n 10 admissions, super-long boarders excluded (assumed more than 30 days, OQ-02) with the excluded count shown. | F-19 | M6 | Could |
| R-20 | 30-day readmission (O/E) is quarterly readmissions within 30 days to any MGB hospital, any service, over Vizient expected, min-n 10 admissions (OQ-29). | F-20 | M6 | Could |
| R-21 | In-hospital mortality (O/E) is deaths during the surgical admission over Vizient expected, rolling 12 months only, min-n 30 admissions, always with an interval (OQ-27). | F-21 | M6 | Could |
| R-22 | Case mix index is the quarterly average Vizient relative weight per admission, min-n 10 admissions, compared to subspecialty peers across the system and Vizient. | F-22 | M6 | Could |
| R-23 | Unplanned return to the OR within 30 days (min-n 10 cases), Surgical site infection (min-n 20 cases), VTE within 30 days (min-n 20 cases) and CSF leak requiring intervention (neurosurgery only) (min-n 10 cases) are quarterly rates from the QI database labeled "self-reported, unadjusted; source: department QI database, as of <date>". | F-23 | M6 | Could |
| R-24 | Every O/E and rate metric stores and shows an interval on the tile and every trend point; the spread is an interval or funnel chart; "no evidence of difference from peers" is shown when the interval includes the peer median; O/E tiles state "1.0 means exactly as expected; below 1.0 is better" (P12). | F-24 | M6 | Could |
| R-25 | Third-next-available appointment is the monthly median days to the third next open new-patient slot, min-n 2 samples, "Lower is better", with the sample list. | F-25 | M7 | Could |
| R-26 | New patient visits is the monthly count of completed new-patient clinic visits with a trend line and visit list. | F-26 | M7 | Could |
| R-27 | Clinic notes closed within 72 hours is the monthly share of clinic visits with the note signed within 72 hours, min-n 10 visits, with a visit list showing note-signed time. | F-27 | M7 | Could |
| R-28 | The four Bucket 5 measures are versioned code: Net promoter score is promoters minus detractors on "would you recommend this provider"; the three quoted items are the share of responses giving the top score; each yields the year average, each of the past three months and the MGB average. | F-28 | M4 | Should |
| R-29 | A sustained decision triggers a same-day recompute under the same definition version, storing "as logged" and "as adjudicated" values, re-checking min-n and rebuilding the spread (proposed default, OQ-18). | F-29 | M1 | Must |
| R-30 | A new definition version recomputes only the periods it is effective for; earlier periods keep their original stamp unless explicitly restated, and a restatement is logged. | F-30 | M1 | Must |
| R-31 | Referral-to-visit days (pending confirmation of data source) renders "Data source pending confirmation" until a source is registered, then the quarterly median days from referral received to visit, min-n 10 visits, "Lower is better". | F-109 | M7 | Could |
| R-32 | Unplanned return to ICU (pending confirmation of data source) renders "Data source pending confirmation" until a source is registered, then the quarterly share of ICU patients returned unexpectedly after step-down, min-n 10 admissions, labeled unadjusted. | F-110 | M7 | Could |

### 7.3 Suppression and peer groups

Intent: the brief's min-n table exactly, the five-peer rule, the viewer excluded, and a worded reason with counts in every absent cell.

| R-id | Requirement | Features | Milestone | Priority |
|---|---|---|---|---|
| R-33 | Peer groups are computed from the dated roster as of the period: same site (and subspecialty where the brief says so), viewer excluded, per-site rows for multi-site surgeons (proposed defaults, OQ-07, OQ-08). | F-31 | M1 | Must |
| R-34 | The suppression engine applies the brief's min-n table exactly and the five-peer rule, keeps the surgeon's own value visible under peer-under-five (proposed default, OQ-11), and fails the run if any suppressed cell has a blank reason. | F-32 | M1 | Must |
| R-35 | One versioned catalogue holds every "why not shown" wording, spread-count sentence, dispute clause and page-level state, and every artifact renders the identical string for a given cell. | F-33 | M1 | Must |
| R-36 | Every tile states its comparator and peer count, or "No peer comparison" for Work RVUs — live tracker and M&M attendance. | F-34 | M1 | Must |
| R-37 | No spread is written in month one; from month two a spread is written only for step-zero attendees who did not opt out; non-attendees stay in peer denominators; opted-out surgeons are excluded from every group (P11, OQ-09, OQ-10). | F-35 | M1 | Must |
| R-38 | Surgeon-facing data holds only the viewer's value and anonymous peer values; every spread render is logged with its peer count so the department can decide P5. | F-36 | M1 | Must |
| R-39 | Before step zero the chief receives a counts-only summary of which under-five groups will and will not render a comparison. | F-37 | M0 | Must |
| R-40 | When a dispute moves a metric across min-n in either direction, the reason names the dispute and date that caused it. | F-38 | M1 | Must |
| R-41 | A roster change recomputes peer membership and size from its date, and the reason text on any newly suppressed cell carries the as-of date. | F-39 | M1 | Must |
| R-42 | Each Bucket 5 measure renders an anonymous bar chart of neurosurgeons across the system with the surgeon's own bar highlighted and the peer count shown, replaced by a reason when fewer than five peers are in the extract (OQ-45). | F-40 | M4 | Should |
| R-43 | A survey month with fewer than 10 responses is hidden for that month only, with the cell reading "Hidden: <n> responses this month; needs at least 10"; the year average and MGB average still show. | F-41 | M4 | Should |

### 7.4 Scorecard views

Intent: the same tile, reason, trend and spread mechanics for every metric, and the "what this is not" line on every artifact.

| R-id | Requirement | Features | Milestone | Priority |
|---|---|---|---|---|
| R-44 | A versioned "what this is not" statement is presented at step zero and carried as one line on every email and hosted page; an automated scan finds no composite, rank or target other than M&M attendance's 8 of 12 on any artifact. | F-42 | M0 | Must |
| R-45 | Every metric shows a trend at its cadence, and a tile with short history reads "history from <date>". | F-43 | M1 | Must |
| R-46 | Feed not in this release, required field missing, feed not received and data source pending are distinct stored states with the catalogue's wording; none renders blank or zero. | F-44 | M1 | Must |
| R-47 | Quarterly, rolling-12-month and fiscal-year tiles name their window and, outside a close month, read "Counted quarterly; the quarter closes <date>" with the count so far. | F-45 | M1 | Must |
| R-48 | A rendered spread carries the peer-count sentence, unlabeled peer markers and the surgeon's own marker only, makes no unidentifiability claim, and has a three-line plain-text form for the email (OQ-26). | F-46 | M1 | Must |
| R-49 | When adjudication moves a count, the tile shows "as logged" and "as adjudicated" side by side with both denominators, and the restated trend point is marked. | F-47 | M1 | Must |
| R-50 | The Bucket 5 three-month view rolls forward monthly; a hidden month stays hidden with its reason; a trend beyond three months is shown (proposed default, OQ-44). | F-48 | M4 | Should |

### 7.5 Drill-down and provenance

Intent: every number opens its records and its definition; every number knows where it came from.

| R-id | Requirement | Features | Milestone | Priority |
|---|---|---|---|---|
| R-51 | Every number opens a record list whose row count equals the tile denominator, including when the number is suppressed; the one deviation (Work RVUs — live tracker) is held under OQ-33. | F-49 | M1 | Must |
| R-52 | Every number links to a definition page showing the definition text verbatim with version and source, cadence, min-n, comparator, "You can move it by" text, flagged assumptions, and open items. | F-50 | M1 | Must |
| R-53 | Every published number stores its source, per-source as-of date, definition version, record ids, denominator and exclusion counts; a row count that differs from the denominator fails the run. | F-51 | M1 | Must |
| R-54 | A dispute detail shows the record exactly as the surgeon saw it, the claim, and a provenance panel: source system, load date, attribution rule applied, definition version, and the metrics the record feeds. | F-52 | M1 | Must |
| R-55 | Each Bucket 5 measure opens a per-response de-identified record list (survey month, four item scores, comment present yes or no, provider named) whose row count equals the response count; no patient identifiers. | F-53 | M4 | Should |

### 7.6 Dispute workflow

Intent: a dispute is pinned to one record, reaches the right adjudicator, ends in one of two sustained outcomes or a denial, and shows up on the row. This is the product.

| R-id | Requirement | Features | Milestone | Priority |
|---|---|---|---|---|
| R-56 | Every row of every record list carries a dispute action pinned to that record, never to a number; the case id is a ledger surrogate. | F-54 | M1 | Must |
| R-57 | A dispute is a ledger record with case id, field disputed, surgeon claim, filed date, definition version, adjudicator, decision, decision date and outcome. | F-55 | M1 | Must |
| R-58 | Before filing, the form states what a sustained dispute on that field does: a delay-reason correction changes the row and not the count; a re-attribution moves the record and the count. | F-56 | M1 | Must |
| R-59 | In the email months a reply to the dispute address is entered into the ledger within two business days and acknowledged with the case id and filed date (OQ-20). | F-57 | M1 | Must |
| R-60 | A dispute routes to the surgeon's division chief, or to the chair when the disputant is the chief, the record would be re-credited to the chief, or the chief is a participant on the record (proposed default, OQ-15); the hosted view applies the tests automatically. | F-58 | M1 | Must |
| R-61 | The record row shows the dispute state: with chief or chair and filed date; sustained (annotated or source corrected) with decider, date and note; not sustained with note and date. | F-59 | M1 | Must |
| R-62 | The adjudicator's queue lists open disputes with age in days against a 14-day target and opens each to the record and its provenance, never a score. | F-60 | M1 | Must |
| R-63 | A decision is recorded as sustained (annotated or source corrected) or not sustained, with decider, date and note. | F-61 | M1 | Must |
| R-64 | Dispute history stays on the record; one re-file with new evidence is linked to the first; a re-credited clinician's counter-dispute is linked (proposed defaults, OQ-16). | F-62 | M1 | Must |
| R-65 | A dispute that is a definition disagreement is marked "definition question", logged to the definitions owner and shown as a dated open item on the definition page (OQ-22). | F-63 | M1 | Must |
| R-66 | At each publish, one list of sustained overrides per feed owner is sent, containing only that feed's records; the department does not wait for the source correction. | F-64 | M1 | Must |
| R-67 | A same-day cancellation record can be disputed on its reason code; the as-logged rate matches periop and the adjudicated rate is shown beside it (OQ-13). | F-65 | M1 | Must |
| R-68 | The hosted view offers a "Dispute this record" form pinned to one record from every row. | F-66 | M2 | Should |
| R-69 | An admission record can be disputed with the chair branch when the chief was the discharging attending; a sustained re-credit moves the admission out of all four Vizient-backed metrics for both surgeons. | F-67 | M6 | Could |
| R-70 | A QI event record can be disputed; the correction is a request to the QI coordinator and is never hand-entered into the scorecard. | F-68 | M6 | Could |
| R-71 | In M1 the analyst is the sole editor of the shared dispute sheet, chiefs decide by email reply which is kept as the record, and the sharing list and edit history are exported at each publish (OQ-55). | F-111 | M1 | Must |

### 7.7 Patient experience and inbox

Intent: the faculty-meeting layout any time, plus an inbox that is never a tally and is read by two people only.

| R-id | Requirement | Features | Milestone | Priority |
|---|---|---|---|---|
| R-72 | Bucket 5 shows each measure as the year average, each of the past three months separately, and the MGB average, in the column order and labels of the current faculty-meeting slide; hosted view only; no count badge. | F-69 | M4 | Should |
| R-73 | The Patient feedback inbox shows every de-identified free-text comment newest first with the scores from the same survey; comments are never counted, compared or rolled up; no badge, tally or sentiment figure exists. | F-70 | M4 | Should |
| R-74 | The surgeon can add, edit and delete private notes attached to a comment; notes are visible to the surgeon only (proposed default, OQ-42). | F-71 | M4 | Should |
| R-75 | A survey response is disputed on the provider-named field only, with a structured claim and no free text; the comment is never shown to an adjudicator who is not the direct leader (OQ-43). | F-72 | M4 | Should |
| R-76 | A survey dispute's status and outcome show on the response row, in the inbox and on the measure; the annotated outcome applies until the owner answers OQ-43. | F-73 | M4 | Should |

### 7.8 Citizenship (M&M)

Intent: display what the attendance system logs, with the pace and the flag the brief asks for and no peer comparison.

| R-id | Requirement | Features | Milestone | Priority |
|---|---|---|---|---|
| R-77 | The M&M attendance tile shows attended out of sessions held while on faculty and not on approved leave, sessions remaining, the pace text, a session-level list with a dispute action per session, "Source: attendance system, as of <date>" and "No peer comparison"; it is never count-suppressed. | F-74 | M5 | Should |
| R-78 | Attendance scans and leave dates are loaded; the target is 8 of 12 per fiscal year, scaled proportionally and rounded up when approved leave removes sessions (flagged assumption, OQ-03); on pace, off pace and "Cannot reach 8 this year" follow the proposed rule; nothing is computed while leave dates exist unapplied. | F-75 | M5 | Should |
| R-79 | A session record can be disputed; a failed scan is corrected in the attendance system by its owner, never hand-entered. | F-76 | M5 | Should |

### 7.9 wRVU tracker

Intent: a read-only mirror of the billing office's number, compared to yourself last year only.

| R-id | Requirement | Features | Milestone | Priority |
|---|---|---|---|---|
| R-80 | Work RVUs — live tracker shows fiscal-year-to-date wRVUs against the same point last year and monthly bars with last year's bars ghosted; recent months read "as of <billing as-of date>, may increase" with the prior snapshot ghosted; "source: PBO report dated <date>"; no peer comparison, no target; no record list and no dispute action in this release (deviation held under OQ-33); the comp office's written confirmation of the query is recorded before first publish. | F-77 | M5 | Should |
| R-81 | The wRVU feed is loaded by month with its as-of date, and the restatement delta against the prior snapshot is stored per month. | F-78 | M5 | Should |

### 7.10 Period close and publish

Intent: one command, gates before publish, reasons instead of zeros, and a date on everything.

| R-id | Requirement | Features | Milestone | Priority |
|---|---|---|---|---|
| R-82 | The monthly batch runs from one documented command that the named analyst can run unassisted. | F-79 | M1 | Must |
| R-83 | The run checks that every field a metric needs is present in the extract; a missing field marks that metric "not computable: <field> not in extract" and no proxy is used. | F-80 | M1 | Must |
| R-84 | Before publish, each surgeon's computed numbers are compared with periop's report; every difference must be explained by a registered definition delta or a named adjudicated override, or the run stops. | F-81 | M1 | Must |
| R-85 | A failed or partial feed publishes a worded reason for every affected metric and never a zero (OQ-37). | F-82 | M1 | Must |
| R-86 | Every artifact carries "last refreshed <date>" from the period record; a missed run shows as a stale date. | F-83 | M1 | Must |
| R-87 | Only closed periods are shown (proposed default, OQ-24). | F-84 | M1 | Must |
| R-88 | The analyst is alerted when the extract, publish, a dispute decision, a reply entry, an override list or a bounce is late against its deadline (extract business day 5, publish day 10, disputes at 10 and 14 days, replies at two business days); a checklist in M1, automated at M2 (OQ-56). | F-112 | M1 | Must |

### 7.11 Roles and access

Intent: authorization, never authentication alone; the roster decides who may see what, as of the date.

| R-id | Requirement | Features | Milestone | Priority |
|---|---|---|---|---|
| R-89 | The hosted view serves the same published data as the email with per-user authorization (BI row-level security or app layer); a request for another surgeon's record is refused and logged; page-level states use the catalogue wording; the deep link is added to the email only after the three governance sign-offs are recorded. | F-85 | M2 | Should |
| R-90 | In the hosted view a surgeon files and reads only their own disputes, an adjudicator sees only disputes routed to them, and the analyst sees the queue; every refused attempt is logged. | F-86 | M2 | Should |
| R-91 | The roster maps each surgeon to their division chief and direct leader; dispute routing and inbox access follow the mapping from the change date. | F-87 | M1 | Must |
| R-92 | The Patient feedback inbox is readable by the surgeon and their direct leader only; every other identity is refused and logged. | F-88 | M4 | Should |
| R-93 | The direct leader's inbox view opens no earlier than 30 days after the surgeon first had it, shows no private notes, and allows no writing (D5; OQ-42). | F-89 | M4 | Should |

### 7.12 Delivery and notifications

Intent: months one to three are an email; every dispute event reaches the surgeon inside the 14-day target.

| R-id | Requirement | Features | Milestone | Priority |
|---|---|---|---|---|
| R-94 | One plain-text email per surgeon per published period, to their MGB mailbox, carrying the contract in section 9.1; the address is resolved from the institutional directory at send time; bounces are logged and retried only after correction; a misdirected send is recorded as an incident (OQ-58). | F-90 | M1 | Must |
| R-95 | Every email carries a monitored reply-to-dispute address; replies are logged and classified (dispute, question, seen), questions are answered within two business days, and an adoption report measures G2 and the kill criterion. | F-91 | M1 | Must |
| R-96 | The analyst and adjudicator are notified when a dispute is filed, and a re-credited clinician is notified of the re-credit (proposed default, OQ-21). | F-92 | M1 | Must |
| R-97 | Every decision reaches the surgeon as a one-record decision email carrying the row text and the updated tile; the 14-day criterion is measured to that email. | F-93 | M1 | Must |
| R-98 | When a definition changes, the next email says so and names where the boundary sits on the trend (proposed default, OQ-21). | F-94 | M1 | Must |

### 7.13 Audit and versioning

Intent: every load, decision and restatement is a recorded fact with a date.

| R-id | Requirement | Features | Milestone | Priority |
|---|---|---|---|---|
| R-99 | Every extract is staged with its load date and ticket number, and each period has a run record holding gate results, payload-scan results and per-surgeon send dates. | F-95 | M1 | Must |
| R-100 | Every restatement (late record, override, version change, model refresh, wRVU snapshot) is logged, and the affected trend point is marked as restated on every artifact. | F-96 | M1 | Must |
| R-101 | Every later-feed tile carries its own source, as-of date and, for Vizient, model version; Vizient, survey and billing tiles are exempt from the 10-business-day freshness goal. | F-97 | M4 | Should |
| R-102 | A monthly dispute trust report is generated from the ledger with aggregates only: disputes by non-owner, days to decision against 14, disputed-record rate per surgeon, outcomes by type, overrides awaiting source, and zero disputes without a record id. | F-98 | M1 | Must |

### 7.14 Admin and configuration

Intent: the roster, the thresholds and the reason sets are versioned data, not code edits.

| R-id | Requirement | Features | Milestone | Priority |
|---|---|---|---|---|
| R-103 | The department roster is a dated dimension holding site, subspecialty, faculty dates, approved leave, block, division chief, direct leader, step-zero attendance, opt-out flag and end date (OQ-36). | F-99 | M0 | Must |
| R-104 | A versioned configuration table holds per metric its cadence, min-n, comparator, exclusions, reason sets and named parameters (grace-window minutes, room eligibility, boarder threshold, leave scaling); any change is a new version so old periods keep the thresholds they were suppressed under. | F-100 | M1 | Must |
| R-105 | The surgeon-attributable delay reason set is versioned, signed by periop leadership, and labels first-case rows "your delay" or "not your delay" without changing the FCOT count (OQ-38, OQ-12). | F-101 | M1 | Must |
| R-106 | The surgeon-attributable cancellation reason set is versioned, signed by periop leadership, and defines the numerator of Same-day cancellations you could have prevented; blank and "Other" are outside the set unless explicitly included (OQ-38). | F-102 | M1 | Must |
| R-107 | A source registry holds every pending and later feed with its system, extract, join key, attribution rule, owner and effective period; a pending metric is computable only from its effective period. | F-103 | M1 | Must |

### 7.15 Division and site views

Intent: say where the three measures will live; build nothing until a specification exists.

| R-id | Requirement | Features | Milestone | Priority |
|---|---|---|---|---|
| R-108 | Every scorecard states that OR turnover time, PACU boarding and room-ready delays are not on any individual scorecard because a surgeon cannot move them alone and will appear only on division and site views; the run records them as "not computed in this cycle". (F-105, division and site views, is retired; OQ-52.) | F-104 | M1 | Must |

### 7.16 Cross-cutting

Intent: invariants every screen, artifact and batch job inherits. These are Must at whatever milestone their feature lands.

| R-id | Requirement | Features | Milestone | Priority |
|---|---|---|---|---|
| R-109 | No surgeon-identified artifact leaves the pipeline before the recorded gate for its channel: a privacy-office confirmation per email channel; information security, data governance and a QI determination before any hosted page; a medical staff office decision before any Bucket 4 metric; data governance sign-off before the pipeline handles survey comments; and every outbound artifact passes a minimum-necessary payload scan (OQ-47). | F-106 | M1 | Must |
| R-110 | Every open of and every refused attempt on surgeon-identified data is logged with identity, resolved role, subject surgeon, resource, timestamp and outcome; the log holds no comment, score, note or claim text. | F-107 | M2 | Must |
| R-111 | The email is readable on a phone; the hosted view is desktop-first and usable at phone width; every state is conveyed in words, never by color, icon or position alone; conformance to the institution's accessibility standard is added when it is named (OQ-51). | F-108 | M1 | Must |
| R-112 | Every store has a retention class; nothing is disposed until data governance sets the period (OQ-57); a departed surgeon's records stay for past periods, no further artifact is sent, and hosted access ends at the roster end date. | F-113 | M1 | Must |

Requirement count: 112 (R-01 to R-112). Features cited: 112 active plus F-105 noted as retired.

---

## 8. Metric specifications

All 25 items in the brief, plus the three division-and-site-only measures. Numbers are the brief's, exactly. "Brief TBC" marks the brief's own "assumption — to be confirmed" and "pending confirmation of data source" items. Display contracts common to every metric (comparator statement, definition link, record list, version stamp, "last refreshed", trend) are in section 9 and not repeated per row.

| Metric (brief name) | Bucket | Definition (brief wording, short) | Cadence | Minimum n | Peer group | Comparison | Display | Data source | Milestone | To be confirmed; OQ refs |
|---|---|---|---|---|---|---|---|---|---|---|
| OR case volume | 1 Volume and mix | Number of operations where you were the primary surgeon | Monthly | None | Surgeons in your subspecialty at your site | Anonymous spread | Count with a trend line; case list with shared flag | Periop OR log | M1 | OQ-06 (co-surgeon); OQ-54 (does periop report it) |
| Case mix index | 1 Volume and mix | Average Vizient relative weight per inpatient admission | Quarterly | 10 admissions | Surgeons in your subspecialty across the system | Anonymous spread and Vizient | Value against the peer spread, with trend | Vizient CDB encounter extract joined to the index operation | M6 | OQ-31 (index rule); OQ-53 (system-wide roster) |
| New patient visits | 1 Volume and mix | Completed new-patient clinic visits | Monthly | None | Subspecialty peers at your site | Anonymous spread | Count with a trend line; visit list | Clinic scheduling | M7 | OQ-36 (source); OQ-39 (new-patient rule, attribution field) |
| Work RVUs — live tracker | 1 Volume and mix | Billed wRVUs, fiscal year to date and by month | Monthly; fiscal year to date | None | None: yourself last year only | Self, prior fiscal year; no peer, no target | YTD against the same point last year; monthly bars with last year's bars ghosted; as-of date reflects billing lag | Professional billing | M5 | OQ-33 (no target confirmed; mirror-only deviation; table year, modifiers, DOS vs posting, comp office query) |
| First-case on-time start (FCOT) | 2 Efficiency | Share of your first cases of the day where the patient was wheeled into the room at or before the scheduled start; no grace window | Monthly | 4 first cases | Neurosurgeons at your site | Anonymous spread | Share with trend; delay reason stored on each case | Periop OR log (case-level extract behind periop's report) | M1 | Brief TBC: grace window (OQ-01); OQ-12 (delay-reason dispute); OQ-38 (delay reason set) |
| Duration estimate accuracy | 2 Efficiency | Share of your cases where actual in-room time was within 20% of what was booked, or within 30 minutes, whichever is more forgiving | Monthly | 5 cases | Subspecialty peers at your site | Anonymous spread | Share with trend; tolerance test shown per case | Periop OR log | M1 | OQ-39 (booked vs actual fields); OQ-54 |
| Block utilization (only if you have allocated block) | 2 Efficiency | Minutes used in your own block as a share of minutes allocated, after removing released block | Monthly | None | Neurosurgeons at your site | Anonymous spread | Share with trend; "Not applicable" without block; block-day list | Block allocation and release schedule | M3 | OQ-34 (owner, schedule, tile state) |
| Same-day cancellations you could have prevented | 2 Efficiency | Same-day cancellations whose reason code is in the surgeon-attributable set, as a share of your scheduled cases | Quarterly | 10 cases | Neurosurgeons at your site | Anonymous spread | Share with trend; non-attributable cancellations listed as "not counted" | Periop OR log cancellation reason codes | M1 | OQ-38 (cancellation reason set); OQ-13 (adjudicated delta at the gate) |
| Clinic notes closed within 72 hours | 2 Efficiency | Share of your clinic visits with the note signed within 72 hours | Monthly | 10 visits | Neurosurgeons at your site | Anonymous spread | Share with trend; visit list with note-signed time | Clinic system (note timestamps) | M7 | OQ-39 (timestamp field); OQ-24 (visits inside the window at month close) |
| Third-next-available appointment | 3 Access | Days until your third next open new-patient slot, sampled regularly, reported as the median | Monthly | 2 samples | Subspecialty peers at your site; lower is better | Anonymous spread | Median with trend; sample list | Clinic scheduling, sampling process | M7 | OQ-36 (sampling process and system) |
| Referral-to-visit days (pending confirmation of data source) | 3 Access | Median days from when a referral is received to when the patient is seen | Quarterly | 10 visits | Subspecialty peers at your site; lower is better | Anonymous spread | "Data source pending confirmation" until registered; then median with trend | Referral work queue (pending) | M7 | Brief TBC: data source (OQ-04; share of referrals with no reliable received date) |
| Length of stay (O/E) | 4 Quality and outcomes | Total days your surgical patients stayed divided by Vizient expected days; super-long boarders excluded (assumed more than 30 days); excluded count shown | Quarterly | 10 admissions | Subspecialty peers across the system, and Vizient | Interval or funnel spread | O/E with interval and trend; admission list with index and discharging surgeon | Vizient encounter extract; OR log for the index operation | M6 | Brief TBC: super-long boarder threshold (OQ-02); OQ-30 (whole-encounter vs post-op); OQ-31 |
| 30-day readmission (O/E) | 4 Quality and outcomes | Readmissions within 30 days to any MGB hospital, any service, divided by Vizient's expected number | Quarterly | 10 admissions | Subspecialty peers across the system, and Vizient | Interval or funnel spread | O/E with interval and trend | Vizient | M6 | OQ-29 (observed universe vs hospital-scoped expected) |
| In-hospital mortality (O/E) | 4 Quality and outcomes | Deaths during the surgical admission divided by Vizient's expected number | Rolling 12 months only | 30 admissions | Neurosurgeons across the system, and Vizient | Interval or funnel spread | O/E with interval; four rolling points, one per quarter close | Vizient; QI database | M6 | OQ-27 (individual view or not); OQ-28 (interval method) |
| Unplanned return to the OR within 30 days | 4 Quality and outcomes | Share of your cases needing an unplanned reoperation within 30 days, by any surgeon, per the QI database | Quarterly | 10 cases | Subspecialty peers across the system; lower is better | Interval or funnel spread | Rate with interval and trend; "self-reported, unadjusted" | Department QI database | M6 | OQ-32 (cross-site capture rules) |
| Surgical site infection | 4 Quality and outcomes | Infections within 30 days (90 days with an implant), per the QI database, as a share of your cases | Quarterly | 20 cases | Neurosurgeons across the system; lower is better | Interval or funnel spread | Rate with interval and trend; "self-reported, unadjusted" | Department QI database | M6 | OQ-32 (NHSN as alternative source) |
| VTE within 30 days | 4 Quality and outcomes | DVT or PE within 30 days of surgery, per the QI database, as a share of your cases | Quarterly | 20 cases | Neurosurgeons across the system; lower is better | Interval or funnel spread | Rate with interval and trend; "self-reported, unadjusted" | Department QI database | M6 | OQ-32 |
| CSF leak requiring intervention (neurosurgery only) | 4 Quality and outcomes | Cranial or spinal cases with a CSF leak needing reoperation, a lumbar drain, or readmission within 30 days, per the QI database, as a share of eligible cases | Quarterly | 10 cases | Subspecialty peers across the system; lower is better | Interval or funnel spread | Rate with interval and trend; "self-reported, unadjusted" | Department QI database | M6 | OQ-32 |
| Unplanned return to ICU (pending confirmation of data source) | 4 Quality and outcomes | Share of your ICU patients transferred back to the ICU unexpectedly after stepping down | Quarterly | 10 admissions | Neurosurgeons across the system; lower is better | Interval or funnel spread | "Data source pending confirmation" until registered; then rate with interval, unadjusted | ADT unit transfers (pending) | M7 | Brief TBC: data source (OQ-05; proxy window 48 to 72 hours) |
| Net promoter score | 5 Patient experience | On "would you recommend this provider", the percentage of promoters minus the percentage of detractors | Monthly as survey months post; year average, each of the past three months, MGB average | A month with fewer than 10 responses is hidden for that month only | Neurosurgeons across the system, and the MGB average | Anonymous bar chart, own bar highlighted | Faculty-meeting layout; per-response record list | MGB patient survey (vendor extract) | M4 | OQ-40 (per-response feed, slide copy); OQ-44 (promoter and detractor values, year average, MGB average scope); OQ-45 |
| "Provider explained things in a way I could understand" | 5 Patient experience | Share of responses giving the top score | As above | As above | Neurosurgeons across the system, and the MGB average | Anonymous bar chart, own bar highlighted | Faculty-meeting layout | MGB patient survey | M4 | OQ-40, OQ-44, OQ-45 |
| "Provider listened carefully" | 5 Patient experience | Share of responses giving the top score | As above | As above | Neurosurgeons across the system, and the MGB average | Anonymous bar chart, own bar highlighted | Faculty-meeting layout | MGB patient survey | M4 | OQ-40, OQ-44, OQ-45 |
| "Provider showed respect" | 5 Patient experience | Share of responses giving the top score | As above | As above | Neurosurgeons across the system, and the MGB average | Anonymous bar chart, own bar highlighted | Faculty-meeting layout | MGB patient survey | M4 | OQ-40, OQ-44, OQ-45 |
| Patient feedback inbox | 5 Patient experience | Every de-identified free-text comment about you, newest first, with the scores from the same survey | As comments arrive with survey months | None; never counted | None | None; never compared or rolled up | Inbox; read, reflect, add private notes; surgeon and direct leader only | MGB patient survey; de-identification owner | M4 | OQ-40 (comments in feed, de-identification); OQ-41 (direct leader); OQ-42 (notes); OQ-43 (survey disputes) |
| M&M attendance | 6 Citizenship | Sessions attended out of sessions held while you were on faculty and not on approved leave, logged by QR-code scan; target 8 of 12 per fiscal year per the comp plan | Fiscal year, updated per session | None | None; no peer comparison | Target 8 of 12 only | Attended so far, sessions remaining, on pace or off pace, clear flag when 8 can no longer be reached; session list | QR attendance system; HR leave; roster faculty dates | M5 | Brief TBC: leave scaling (OQ-03, pace rule); OQ-49 (QR system live, owner, HR feed); OQ-25 (trend form) |
| OR turnover time | 2 Efficiency (division and site views only) | Not on the individual scorecard: a surgeon cannot move it alone | None on individual view | Not applicable | Not applicable | Not applicable | Page text only (F-104) | Periop timing feeds | None; out of scope | OQ-52 |
| PACU boarding | 2 Efficiency (division and site views only) | As above | None on individual view | Not applicable | Not applicable | Not applicable | Page text only (F-104) | Periop timing feeds | None; out of scope | OQ-52 |
| Room-ready delays | 2 Efficiency (division and site views only) | As above | None on individual view | Not applicable | Not applicable | Not applicable | Page text only (F-104) | Periop timing feeds | None; out of scope | OQ-52 |

Bucket 4 rule, from the brief: where Vizient has a risk model the metric is shown as observed divided by expected (O/E); 1.0 means exactly as expected; below 1.0 is better; where there is no risk model the number is labeled "unadjusted"; complications come from the department's QI database, never entered by hand (F-23, F-24).

---

## 9. Experience requirements

This section states contracts, not screens. No wireframe exists yet; the design doc asks for a one-to-three-screen sketch of the email and the case list before `/plan-design-review`.

### 9.1 The M1 email contract (F-90, F-91, F-42, F-83, F-46)

One plain-text email per surgeon per published period, to the surgeon's own MGB mailbox, readable on a phone, containing:

- Four tiles named exactly "OR case volume", "First-case on-time start (FCOT)", "Duration estimate accuracy" and "Same-day cancellations you could have prevented", each with a value (numerator and denominator) or a catalogue reason, its comparator text and peer-group size, its definition version id, and a trend at its cadence (up to 12 monthly points; up to four quarterly points for cancellations) or "history from <date>".
- The surgeon's own case list as one attachment: date, room, procedure, scheduled start, wheels-in, on-time yes or no, delay reason as stored, booked and actual minutes, cancellation reason where applicable, shared flag, dispute status; row counts equal the tile denominators.
- "last refreshed <date>", the reply-to-dispute address, and the one-line "what this is not" text.
- Page text for Block utilization (only if you have allocated block) ("Not in this release: needs the block allocation and release schedule; owner not yet named") and for the three division-and-site-only measures.
- No hyperlink in months one to three. No peer spread in month one. From month two, for eligible surgeons, a three-line plain-text spread per rendering metric: the spread-count sentence, "Peers: <values ascending>", "You: <value>".
- No composite, rank or target anywhere. Only the surgeon's own records; every email passes the minimum-necessary payload scan (no patient name, MRN, date of birth, encounter number, phone number or free text).

A reply to the address is a dispute, a question or "seen". A dispute reply is acknowledged within two business days with the case id and filed date, and every decision comes back as a one-record decision email (F-57, F-93).

### 9.2 M2 web app surfaces per role (F-85, F-86, F-60, F-88, F-89)

| Role | Surfaces |
|---|---|
| Surgeon | Their own scorecard (identical values, reasons, versions and "last refreshed" to the email); record list per number with "Dispute this record" on every row; definition page per number; dispute detail for their own disputes; from M4, Bucket 5 in the faculty-meeting layout, the per-response list and the Patient feedback inbox with private notes |
| Division chief and chair | Their own scorecard as a surgeon; the adjudicator queue (age in days against 14) and dispute detail with provenance for disputes routed to them; nothing else about any other surgeon |
| Direct leader | The mapped surgeon's Patient feedback inbox, no earlier than 30 days after the surgeon first had it; no notes; the four measures only if the owner says so (OQ-42) |
| Department analyst | Run summary, gate records, suppression and reconciliation reports, dispute queue, adoption and trust reports, source and definition registries, retention table; survey comments as pipeline data only |
| Anyone else | Refused with the catalogue's "Not authorized" text; logged |

Page-level states are fixed wording from the catalogue: identity not on the roster, no period published yet, not authorized, direct-leader gate ("Available to the direct leader from <date>"), and load failure with "Your data has not changed" (F-33, F-85).

### 9.3 Display contracts the brief prescribes

| Contract | Requirement | Features |
|---|---|---|
| Patient experience layout | Each measure shown exactly as at faculty meeting: your year average, each of the past three months separately, and the MGB average, in the column order and labels copied from the current slide; plus the anonymous bar chart of everyone in your peer group with your own bar highlighted, available any time. A month with fewer than 10 responses reads "Hidden: <n> responses this month; needs at least 10". Label: "MGB patient survey, outpatient provider items, as of <date> (responses lag four to eight weeks)". | F-69, F-40, F-41, F-48, F-97 |
| wRVU ghosted bars and as-of | Year-to-date against the same point last year; monthly bars with last year's bars ghosted behind them; the current month and the one before marked "as of <billing as-of date>, may increase" with the prior snapshot ghosted; "source: PBO report dated <date>"; "Your comp target is in your comp letter; this page does not show it" (proposed, OQ-33); "Corrections to billed wRVUs go to the professional billing office; this page mirrors their report". | F-77, F-78, F-96 |
| M&M pace and unreachable flag | "Attended <a> of <h> sessions held while on faculty and not on approved leave. <r> sessions remaining." then "On pace for 8 of 12", "Off pace", or a clear "Cannot reach 8 this year" flag; when leave applies, "Target scaled to <T'> (assumption, to be confirmed)" with the computation in the drill-down; "Source: attendance system, as of <date>"; "No peer comparison". | F-74, F-75 |
| "The screen says why" | Every absent number is a worded reason with counts from one catalogue: "Not shown: 3 first cases this month; needs at least 4"; "Peer comparison not shown: 4 peers in your subspecialty at this site cleared at least 5 cases this month; needs 5 (you are not counted)"; the same string on email, hosted view and analyst report. A dispute that moves a cell across min-n names the dispute. | F-32, F-33, F-38, F-44 |
| O/E and rates | "1.0 means exactly as expected; below 1.0 is better"; interval on the value and every trend point; "no evidence of difference from peers" when the interval includes the peer median; "self-reported, unadjusted" where no risk model exists; Vizient model version and as-of on the tile. | F-24, F-23, F-97 |
| As logged / as adjudicated | When an attribution decision moves a count: both values with both denominators, the trend point marked restated, the logged value in the list. A delay-reason correction changes the row, not the count. | F-47, F-56, F-59 |
| Anonymous spread | Peer-count sentence, unlabeled markers, own marker; no claim of unidentifiability; Bucket 5 as bars, Bucket 4 as intervals, other forms versioned under OQ-26. | F-46, F-36 |
| Comparator and provenance on every tile | Comparator text and peer count; definition version; source and as-of; "last refreshed"; "Counted quarterly; the quarter closes <date>" outside a close month. | F-34, F-51, F-83, F-97, F-45 |

### 9.4 States

| State | Wording (catalogue key) | Features |
|---|---|---|
| Empty (no records this period) | "Not shown: 0 <unit> this <period>; needs at least <min-n>" for min-n metrics; a count of 0 with its list for never-suppressed metrics, only when the feed loaded | F-32, F-82 |
| Suppressed (min-n) | "Not shown: <n> <unit> this <period>; needs at least <min-n>" | F-32, F-33 |
| Suppressed (peer-under-five) | "Peer comparison not shown: <n> peers in your <group> <scope> cleared at least <min-n> <unit> this <period>; needs 5 (you are not counted)"; own value and trend stay | F-32, F-33 |
| Hidden month (Bucket 5) | "Hidden: <n> responses this month; needs at least 10" | F-41 |
| Not applicable | "Not applicable: no allocated block this month" | F-18 |
| Not in this release | "Not in this release: needs <feed>; owner not yet named" | F-44 |
| Pending source | "Data source pending confirmation" | F-44, F-103 |
| Not computable | "not computable: <field> not in extract" | F-80, F-44 |
| Feed not received | "<feed> for <period> not received as of <date>"; never a zero | F-82, F-44 |
| Counted quarterly | "Counted quarterly; the quarter closes <date>" with the count so far | F-45 |
| Restated | Trend point marked; restatement logged | F-96, F-47 |
| Disputed | Row reads "Disputed - with chief, filed <date>" and the decision text after it | F-59 |
| Page error | "The page could not be loaded. Your data has not changed. Try again or contact <analyst mailbox>." | F-85, F-33 |
| Stale | "last refreshed <date>" older than expected after a missed run | F-83, F-112 |

### 9.5 Accessibility baseline (F-108)

The email renders as plain text with no horizontal scrolling on iOS and Android mail clients and the attachment opens on both. The hosted view is desktop-first and usable at phone width without loss of any tile, reason or list. Every state, dispute state, interval label and the surgeon's own marker is present as text, so a text-only rendering carries the same information as the graphical one. The institution's accessibility standard is not named in the brief or the design doc (OQ-51); conformance is added by a new version of F-108 when it is.

---

## 10. Technical approach

To be completed from docs/03-technical-design.md: architecture summary, decisions register D-xx, data sources and ingestion, security and privacy controls, operations.

---

## 11. Data sources, dependencies and gates

Twelve sources. Owners are roles, and "unknown" where the design doc says the owner is not yet named. The Assignment (M0) and OQ-48 exist to name them.

| Source | Owner (role) | What it must provide | Gate to clear | Milestone | OQ refs |
|---|---|---|---|---|---|
| Periop OR log (case-level extract behind periop's surgeon-level report) | Periop analytics contact (named person unknown) | Surgeon by panel and role, room, scheduled and actual times, wheels-in, booked duration, delay reason events, cancellation reason code, at least 12 months of history; periop's own FCOT and cancellation report for the same months | Ticket through the standard request process with number recorded; written confirmation of the FCOT and utilization definitions; a named contact who receives the monthly override list; periop leadership sign-off on the surgeon-attributable delay and cancellation reason sets | M0 (three months), M1 | OQ-01, OQ-38, OQ-39, OQ-48, OQ-54 |
| Block allocation and release schedule | Unknown | Allocated, released and used block minutes per surgeon per block day | Owner named; extract on a schedule | M3 | OQ-34 |
| Survey vendor extract | Patient experience office | Per-response records with the four items, free-text comment, provider named, survey month; MGB average; system-wide coverage | Per-response feed confirmed (aggregate-only cannot ship J3); de-identification owner named and check in place; data governance sign-off for pipeline handling of comments; copy of the current faculty-meeting slide; hosted view live; 30-day surgeon-first gate | M4 | OQ-40, OQ-44, OQ-45 |
| Professional billing (wRVU) | Professional billing office | Billed wRVUs by month with as-of date; prior fiscal year; the comp office's source query | Comp office confirms in writing that the scorecard's query matches theirs | M5 | OQ-33 |
| QR-code M&M attendance system | Attendance system owner (unknown; not confirmed live) | Scan log per session per surgeon; session schedule | System live and owned | M5 | OQ-49 |
| HR leave | HR (unknown feed) | Approved-leave dates and faculty-status dates per surgeon | Feed identified; leave-scaling rule confirmed | M5 | OQ-03, OQ-36, OQ-49 |
| Vizient CDB encounter-level extract | Hospital quality analytics (institutional Vizient owner) | Encounter id, observed and expected values (LOS, readmission, mortality), relative weight, model version, as-of date | Extract authorized; encounter-to-case join written (index-operation rule); medical staff office peer-review decision before any Bucket 4 metric is shown; interval rendering built | M6 | OQ-27, OQ-28, OQ-29, OQ-30, OQ-31, OQ-53 |
| Department QI database | Department QI coordinator | Reoperation, SSI, VTE and CSF leak events tied to an index case; as-of date | Access per site; medical staff office decision; capture-rule difference across sites answered | M6 | OQ-32 |
| Clinic scheduling | Clinic operations | Completed new-patient visits with rendering provider; note-signed timestamps; regular samples of the third next open new-patient slot | System and fields named; sampling process defined | M7 | OQ-36, OQ-39, OQ-24 |
| Referral work queue | Unknown | Referral received date joined to the resulting visit | Source confirmed; share of referrals with no reliable received date measured | M7 | OQ-04 |
| ADT unit transfers | Unknown | ICU step-down and return events per admission | Source confirmed; proxy rule for "unexpected" (48 to 72 hours) confirmed | M7 | OQ-05 |
| Dated department roster | Department analyst (source system unknown) | Site, subspecialty, faculty dates, leave, block, chief, direct leader, attendance and opt-out flags, end date, as a slowly changing dimension | Maintained and dated before step zero | M0 | OQ-36, OQ-41 |

Non-data dependencies that gate the wedge: a chair-approved analyst fraction and a named analyst; a sponsor willing to sit through a demo with real data; a faculty-meeting slot for step zero; privacy-office confirmation that a surgeon's own case list may be emailed to their MGB mailbox (P7); for the hosted view, security review, data governance sign-off and a QI determination (OQ-47).

---

## 12. Privacy, security and governance

Requirements only. Technical controls (channels, encryption, row-level security policy, service credentials) belong in the technical design.

| # | Requirement | Features |
|---|---|---|
| PS-1 | PHI minimization: every surgeon-facing artifact contains only records credited to that surgeon; the case id is a ledger surrogate; every outbound artifact is scanned for patient name, MRN, date of birth, encounter number, phone number and source free text, and a hit blocks the send. | F-106, F-90, F-54 |
| PS-2 | Access by role: identity resolves to a roster record as of the access date; a surgeon sees their own records only; the chief and chair see records only through disputes routed to them; the direct leader sees the inbox only, after the 30-day gate; the analyst has no viewer role for comments. | F-85, F-86, F-87, F-88, F-89 |
| PS-3 | Audit: every open of and refused attempt on surgeon-identified data, every dispute decision and every restatement is logged with identity, role, subject, timestamp and outcome; logs hold no comment, score, note or claim text. | F-107, F-95, F-96 |
| PS-4 | De-identification: survey comments are loaded only when they arrive de-identified from a named owner; the per-response list carries no patient identifiers; a survey dispute carries a structured claim and never the comment. | F-11, F-53, F-72 |
| PS-5 | Governance sign-offs as gates: a privacy-office confirmation per email channel before that channel sends; information security review, data governance sign-off and a QI determination before any hosted page; a medical staff office peer-review decision before any Bucket 4 metric; data governance sign-off before the pipeline handles comments. Each is a recorded fact the publish step checks; a publish to an ungated channel is refused with the gate named. | F-106 |
| PS-6 | Anonymity at storage: surgeon-facing data holds only anonymous peer values; no peer identity reaches any surgeon-facing artifact; renders are logged. | F-36, F-46 |
| PS-7 | Retention: every store has a retention class; nothing is disposed until data governance sets the period; disposition is logged without content; a departed surgeon's records stay for past periods and their access and sends end at the roster end date. | F-113 |
| PS-8 | Delivery safety: the recipient address is resolved from the institutional directory at send time; a roster mismatch blocks that send only; bounces are logged and retried after correction; a misdirected send is recorded as an incident under the institution's procedure. | F-90, F-93, F-112 |
| PS-9 | Never a comp or OPPE system of record: comp-relevant tiles are labeled as read-only mirrors with source and date; wRVU never appears on an override list. | F-77, F-74, F-42 |

The design doc keeps the wedge on efficiency metrics, which are operational, so the first governance ask is small. Quality and complication data wait for the medical staff office decision. Approving bodies and their lead times are unobserved and recorded as OQ-47, not estimated.

---

## 13. Delivery plan

Milestones from the catalogue's key. Feature counts are active features whose earliest milestone is that one. Kill and pause criteria are the design doc's.

| Milestone | Gate | Scope (features; headline capabilities) | Exit criteria | Kill or pause |
|---|---|---|---|---|
| M0 The Assignment and step zero (before code) | Periop extract for the last three months plus periop's own report; one surgeon's printed list handed to them; faculty-meeting slot; attendance recorded | 4 features (F-03, F-37, F-42, F-99): co-surgeon rate counted by hand; under-five summary to the chief; "what this is not" page; dated roster with attendance and opt-out | Counts recorded: co-surgeon share per subspecialty, multi-site surgeons, delay and cancellation code distribution including blank and Other, whether the FCOT recomputation matches periop's per surgeon. One surgeon has checked their printed list unaided; every disputed record, what they expected next, and time spent written down; the chief asked what they would do with each. Step zero held with attendance and opt-outs recorded | If the case-level extract with reason codes is not obtainable, the wedge becomes M&M attendance if the QR system is live. If co-surgeon rate exceeds 5% in any subspecialty, "handle by dispute" is withdrawn and the owner decides (P2). If the chair will not fund the analyst fraction, build nothing beyond the email (P8) |
| M1 Wedge, months one to three | Ticketed extract; privacy-office confirmation for the email; named analyst; periop contact for the override list; periop leadership sign-off on the reason sets | 68 features: ledger, definitions as code, four OR-log metrics, suppression with reasons, month-one self-only email, month-two spread for eligible surgeons, dispute sheet with two outcomes and decision email, reconciliation gate, one-command batch, override list, trust and adoption reports, PHI gates, retention, deadline checklist | G1 to G6 met; G7 within 30 days of the month-three review | Kill: if under half of pilot surgeons reply to or report opening month two's email unprompted, stop and return to the demand question |
| M2 Hosted view | Security review, data governance sign-off, QI determination; per-user authorization (BI row-level security or app layer) | 4 features (F-66, F-85, F-86, F-107): the same numbers on a hosted per-surgeon page; dispute button and queue; access audit log; deadline alerts automated | Deep link live from the email; hosted opens feed the adoption report; four page-level states tested | Pause until all three sign-offs are recorded; no static pages meanwhile |
| M3 Block schedule extract | Owner named; extract on a schedule | 1 feature (F-18): Block utilization (only if you have allocated block) with "not applicable" | Tile renders for block holders; "not applicable" for others | Pause until owner named (OQ-34) |
| M4 Survey vendor extract | Per-response feed with comments; de-identification owner; slide copy; hosted view; 30-day surgeon-first gate | 14 features: Bucket 5 in the faculty-meeting layout, cross-system bar chart, hidden months, per-response list, Patient feedback inbox with private notes, survey disputes on the provider field, two-person access, direct-leader gate, per-source as-of | The semiannual slide can be generated from the ledger; inbox two-person boundary tested; leader gate at 30 days | Cannot ship on an aggregate-only feed; pause until per-response feed and de-identification owner exist (OQ-40) |
| M5 Billing and attendance feeds | Comp office confirms the wRVU query in writing; QR attendance system live and owned; HR leave feed | 5 features: Work RVUs — live tracker mirror; M&M attendance tile, pace, flag and scaled target; session disputes | Comp office confirmation recorded (G8); leave-scaling assumption confirmed or still flagged on the tile | Pause until the QR system is live (OQ-49) |
| M6 Vizient and QI feeds | Encounter-level Vizient extract with expected values and model version; QI database access per site; medical staff office decision; interval rendering built | 10 features: index-operation join, QI-only ingestion, Length of stay (O/E), 30-day readmission (O/E), In-hospital mortality (O/E), Case mix index, the QI four, intervals and "no evidence of difference", admission and QI disputes with the chair branch | No Bucket 4 tile publishes without an interval; unmatched admissions listed; owner has answered OQ-27 and OQ-29 or the defaults are recorded | Pause until the medical staff office decides; no quality metric shown before then |
| M7 Clinic, referral, ADT feeds | Clinic scheduling and sampling process; referral queue with a reliable received date; ADT proxy rule | 6 features: New patient visits, Clinic notes closed within 72 hours, Third-next-available appointment, Referral-to-visit days, Unplanned return to ICU, clinic feed load | Pending sources registered with effective periods; earlier periods keep "pending" | Pause per source until registered (OQ-04, OQ-05, OQ-36) |

Build order inside M1, from the design doc: ledger schema, metric functions and dispute table first (they are reused); reconciliation to periop's report second (numbers must match before any surgeon sees them); email third; hosted view when governance lands. Trust sequencing: step zero before any peer data renders; month one self-only; month two spread for attendees who did not opt out.

Division and site views have no milestone. They wait on a specification the brief does not contain (OQ-52).

---

## 14. Success metrics

| Metric | Number | How it is measured |
|---|---|---|
| Adoption | At least half of pilot surgeons reply to or report opening the month-two and month-three email unprompted, with no chief reminder; at least three open their case list | Reply log classified dispute, question or seen (F-91); month-three interview answer per surgeon; in M2, page and case-list opens (F-85); the adoption report records that no chief reminder was sent |
| Trust | At least two disputes filed by surgeons who are not the brief's owner; each decided within 14 days with the outcome visible on the row; disputed-record rate per surgeon falls from month one to month three; zero disputes not anchored to a reproducible record | Dispute trust report from the ledger (F-98): count by disputant, median and maximum days from filed to decision (measured to the decision email in M1), disputed records over published records per surgeon per month, count of disputes without a record id |
| Suppression | 100% of below-threshold cells carry the rule that suppressed them; zero blanks | Suppression report and the run's blank-reason gate (F-32); catalogue-key check on every generated artifact (F-33) |
| Freshness | OR-log metrics refreshed within 10 business days of month close for three consecutive months; Vizient, survey and billing tiles exempt and showing their own as-of date | Send date per surgeon on the period record against month close (F-83, F-95); deadline checklist (F-112); per-source as-of on later-feed tiles (F-97) |
| Survival | A named analyst who is not the builder has run the batch unassisted for two consecutive months from the one-command procedure; "last refreshed" on every artifact; chair-approved time fraction on record; extract arriving on schedule with the ticket number recorded | Run records naming the operator (F-95, F-79); the chair's approval recorded; ticket numbers on the staged extracts |
| Greenlight | Within 30 days of the month-three review, a feed the department does not own (periop extract for a second site, Vizient encounter-level extract, or survey vendor extract) is authorized in writing by its owner outside the department | The written authorization recorded in the source registry (F-103) with date |
| Reconciliation | The four wedge numbers match periop's report for every pilot surgeon in the pilot month, or every difference is explained by a written definition delta | Reconciliation gate result stored with the period (F-81) |
| Comp mirror | The comp office confirms in writing that the scorecard's wRVU query matches theirs before the tile is first published | Confirmation recorded on F-77 before first publish |
| Anonymity evidence (decides P5) | How often a spread renders at each peer count between five and eight | Spread render log (F-36) |

---

## 15. Risks and mitigations

| Risk | What goes wrong | Mitigation | Source |
|---|---|---|---|
| Feed access | The periop case-level extract with reason codes is not obtainable, or lacks wheels-in or delay reason per case; FCOT cannot be computed as defined or disputed as promised | Ticket through the standard process from week one (P1); field-presence check marks the metric "not computable" rather than using a proxy (F-80); fallback wedge is M&M attendance if the QR system is live | Design doc Q4, P1; J1 failure modes |
| Governance lead time | Security review, data governance, the QI determination and the medical staff office decision take months; the hosted view and quality bucket stall | Email-first for months one to three needs no host (P7, to confirm with the privacy office in week one); governance path runs in parallel from week one; gates are recorded facts, not estimates (F-106, OQ-47) | Design doc Constraints, Distribution Plan |
| Small-group re-identification (P5) | In a five-to-eight surgeon group everyone knows who is who; anonymity is fake and the promise is broken at the first spread | Say it out loud at step zero ("the spread hides names, not people"); no artifact claims unidentifiability; opt-out honored (P11); every render logged so the department decides P5 with data (F-42, F-46, F-36) | P5; J1.11 |
| Vizient re-attribution (P3) | Encounter-to-case join fails across entities; admissions with no index operation are mis-credited or dropped; expected values restate on model refresh and the trend moves without a boundary | Written index-operation rule with unmatched admissions listed (F-08, OQ-31); per-source as-of and model version on every tile (F-97); restatement log and trend markers (F-96); Vizient exempt from the 10-day freshness goal | P3; design doc challenge 18, 19 |
| Champion departure (P8) | The batch is run only by the builder; the system dies at the first reorg | Named analyst on a chair-approved fraction runs two months unassisted from one command (F-79); the department's recurring outputs generated from the ledger; definitions as versioned code; build nothing beyond the email if the chair will not fund the fraction | P8; Success Criteria (Survival) |
| Gaming and case-selection response | Surgeons read a "developmental" tool as a comp input in waiting and avoid high-risk cases; quality point estimates at small n read as verdicts | No composite, rank or target (F-42); never a comp or OPPE system of record, said on the "what this is not" page; quality bucket last, behind the medical staff office; intervals and "no evidence of difference" on every O/E (F-24, P12); mortality's place on the individual view held as OQ-27 | Design doc Prior Art; Constraints |
| Analyst capacity | Replies sit unentered in the dispute mailbox; disputes age past 14 days; the override list is late; the surgeon concludes disputing is theater (P6) | Deadline checklist and alerts (F-112); two-business-day entry and acknowledgement (F-57); dispute trust report at every publish (F-98); a backup analyst named (OQ-55) | J2 failure modes; P6 |
| Definition disputes | A department FCOT differs from periop's; two numbers reach the same faculty meeting; the delay-reason set is decided by engineers | Institutional definitions adopted verbatim with parameters (F-15, F-100); reconciliation gate before publish (F-81); reason sets signed by periop leadership (F-101, F-102); definition disagreements go to the definitions owner, not the chief (F-63); confirmed items land as versions with a boundary on the trend (F-13, F-30, F-94) | Design doc challenge 3, 15; J4.5 |
| Co-surgeon cases (P2) | Multi-panel spine and skull-base cases are routine; the first thing a surgeon finds in their list is a case they did not lead | Rate measured in M0 before any rule is chosen (F-03); tie-break and visible shared flag (F-01); re-attribution moves the record across every metric (F-07); over 5% withdraws "handle by dispute" (OQ-06) | P2; J1 failure modes |
| Survey feed is aggregate-only | The inbox and per-response list cannot be built; the four measures would ship without the record list the ground rules require | Per-response feed is the gate for M4; J3 does not ship on aggregates (F-11, OQ-40) | J3 failure modes |
| Roster errors | A surgeon in the wrong site or subspecialty; a spread renders that should have suppressed, or the wrong leader opens an inbox | Dated roster as a first-class dimension with recompute on change (F-99, F-39); chief and leader mapping with access follow-through (F-87); under-five summary reviewed by the chief before step zero (F-37) | J1, J3 failure modes |
| Demand is hypothetical | Nobody opens month two's email; the viewer is a tool nobody asked for | The Assignment tests demand on one surgeon before code; kill criterion at month two (G2); the greenlight criterion demands a feed owner outside the department | Design doc Q1; Success Criteria |

---

## 16. Open questions and assumptions

Each question names the owner role and the decision it blocks. Answers land as new definition or configuration versions (F-13, F-100), never as edits to old ones.

### 16.1 The brief's five "to be confirmed" items

| Item | Question | Owner | Blocks | OQ |
|---|---|---|---|---|
| FCOT grace window | The brief assumes no grace window; the wedge adopts the institutional definition verbatim (grace window and room eligibility as parameters) so the number matches periop's. Confirm. | Definitions owner, with periop analytics | FCOT version 1 delta; reconciliation gate | OQ-01 |
| Super-long boarder threshold | Assumed more than 30 days. Confirm; say whether LOS history is restated when confirmed. | Definitions owner, with hospital quality analytics | Length of stay (O/E) exclusions; restatement policy | OQ-02 |
| M&M leave scaling | Target scales proportionally and rounds up when leave removes sessions. Confirm; also confirm the pace rule proposed in J1.14. | Definitions owner, with the department administrator and the comp plan | M&M attendance pace and "cannot reach" flag | OQ-03 |
| Referral-to-visit days data source | Which system supplies the referral received date, and what share of referrals lack a reliable one. | Definitions owner; referral queue owner (unknown) | Whether the metric is ever computed | OQ-04 |
| Unplanned return to ICU data source | Which system supplies step-down and return events, and the proxy window for "unexpected" (48 to 72 hours). | Definitions owner; ADT owner (unknown) | Whether the metric is ever computed | OQ-05 |

### 16.2 The design doc's open questions for the brief's owner

| Question | Owner | Blocks | OQ |
|---|---|---|---|
| Does "the scorecard displays what the system of record logs" (Bucket 6) apply to every bucket, and is an adjudicated override beside the logged value acceptable? Position: show both. | Definitions owner | Dispute outcome display (F-05, F-47) | OQ-14 |
| Co-surgeon cases: one clinician with tie-break and shared flag, or credit both attendings in volume and exclude shared cases from FCOT and duration accuracy? The M0 rate decides urgency. | Definitions owner | Attribution rule (F-01, F-07) | OQ-06 |
| FCOT: institutional definition verbatim (see 16.1). | Definitions owner | FCOT | OQ-01 |
| Readmission: observed "to any MGB hospital" against a hospital-scoped Vizient expected inflates O/E by construction. Vizient's system-level module for both, or observed from Epic labeled "unadjusted"? | Definitions owner, with hospital quality analytics | 30-day readmission (O/E) definition | OQ-29 |
| Mortality O/E at min-n 30 (0.6 expected deaths at 2%) cannot support individual inference. Keep on the individual view with an interval, or move to division and site views? | Definitions owner | In-hospital mortality (O/E) placement | OQ-27 |
| QI-database complications compared across the system while each department's capture rules differ; NHSN for SSI? Restrict to the site whose database it is until a shared registry exists? | Definitions owner, with QI coordinator and infection control | QI four comparator | OQ-32 |
| LOS: whole-encounter days (brief) or post-operative days? | Definitions owner | Length of stay (O/E) numerator | OQ-30 |
| wRVU shown with no target while M&M is shown with one; both comp-linked. Confirm intended; if so the tile says the comp target is in the comp letter. | Definitions owner | wRVU tile wording | OQ-33 |
| Peer-group counting rule: roster members or surgeons who clear min-n; viewer included or excluded. Position: peers excluding the viewer, at least five each clearing min-n. | Definitions owner | Peer groups (F-31) | OQ-07 |
| Opt-out: is pilot peer-spread participation voluntary, and what happens to a group of five when one surgeon opts out (P11)? | Definitions owner and chair | Spread eligibility (F-35) | OQ-09 |
| Multi-site surgeons: per-site rows only, or also a pooled row? | Definitions owner | Peer groups (F-31) | OQ-08 |

Unknowns from the design doc's diagnostic, each an Assignment or a dependency rather than a design choice: has any surgeon or chief asked for this (Q1); does periop already distribute surgeon-level lists (Q2, OQ-54); the named sponsor and the owner of each source (Q3, OQ-48); will the chair fund the analyst fraction and have the slide and review packet generated from the ledger (Q6); the approving bodies and lead times for a hosted view, and whether emailing a case list needs any of them (OQ-47); the encounter-to-case join (OQ-31); the survey extract's comments and de-identification (OQ-40); pending-feed proxies (OQ-04, OQ-05); HR leave (OQ-49); whether the QR system is live and who owns it (OQ-49); division and site views (OQ-52).

### 16.3 The catalogue's register, consolidated by theme

All 58 questions are in `docs/02-features.md` "Open questions register". They group as follows; OQ-01 to OQ-05 are the brief's items above.

| Theme | Questions (short) | Owner | Blocks | OQ ids |
|---|---|---|---|---|
| Attribution and joins | Co-surgeon rule; index-operation rule and cross-entity join; named booked vs actual, visit attribution, new-patient and note timestamp fields; whether a system-wide subspecialty roster exists | Definitions owner; periop analytics; hospital quality analytics; clinic operations | F-01, F-07, F-08, F-16, F-26, F-27, F-22, F-31 | OQ-06, OQ-31, OQ-39, OQ-53 |
| Peer groups and suppression | Counting rule; multi-site rows; opt-out; non-attendance at step zero; whether peer-under-five hides the own value; survey extract coverage | Definitions owner; chair | F-31, F-32, F-35, F-40, F-46 | OQ-07, OQ-08, OQ-09, OQ-10, OQ-11, OQ-45 |
| Dispute rules | Delay-reason dispute effect on the count; cancellation delta at the gate; system-of-record wording across buckets; involvement tests and chair-filed disputes; re-filing, appeal and counter-disputes; note visibility; pending disputes in the number and recompute timing; filing time limit; email-months workflow; where definition and peer-group disputes go; wedge sheet custody | Definitions owner; division chiefs; chair | F-15, F-29, F-47, F-55, F-56, F-58, F-61, F-62, F-63, F-65, F-81, F-111 | OQ-12, OQ-13, OQ-14, OQ-15, OQ-16, OQ-17, OQ-18, OQ-19, OQ-20, OQ-22, OQ-55 |
| Notifications and delivery | Which notifications exist; plain text plus attachment or a tracked link; deadline thresholds and form; directory-resolved addresses and the incident procedure | Definitions owner; department analyst; privacy office | F-90, F-91, F-92, F-93, F-94, F-112 | OQ-21, OQ-23, OQ-56, OQ-58 |
| Display, trend and states | Closed months only and the 72-hour window at month close; trend window and form, including M&M; spread form; export or print for annual review; accessibility standard; block utilization tile state | Definitions owner; institution (accessibility) | F-43, F-46, F-74, F-84, F-108, F-18 | OQ-24, OQ-25, OQ-26, OQ-34, OQ-46, OQ-51 |
| Quality metrics | Mortality on the individual view; interval method; readmission universe; LOS numerator; QI comparator and NHSN | Definitions owner; hospital quality analytics; QI coordinator; medical staff office | F-19, F-20, F-21, F-23, F-24 | OQ-27, OQ-28, OQ-29, OQ-30, OQ-32 |
| wRVU | Mirror-only deviation from GR5 and GR2, or a charge-level list; no target confirmed; table year, modifiers, DOS vs posting, comp office query | Definitions owner; professional billing office | F-77, F-78, F-49, F-54 | OQ-33 |
| Definitions governance | Who confirms and approves a version; restate or freeze earlier periods; reason-set content and sign-off, including blank and Other | Definitions owner; chair; periop leadership | F-13, F-30, F-101, F-102 | OQ-35, OQ-38 |
| Roster, sources and owners | Roster source and maintainer; which systems supply faculty status, leave, visits, timestamps, samples; named analyst and fraction; periop contact; owner of each of the twelve sources; QR system and HR feed; whether periop reports volume and duration accuracy | Chair; department analyst; feed owners | F-99, F-04, F-64, F-79, F-74, F-75, F-81 | OQ-36, OQ-48, OQ-49, OQ-54 |
| Feed health | Publish on a partial load, and with what wording | Department analyst; definitions owner | F-44, F-82 | OQ-37 |
| Survey and inbox | Per-response feed and de-identification owner; analyst pipeline role stated at step zero; inpatient items; slide copy; direct leader identity; notes visibility and retention; leader sees measures or inbox only; view indicator; survey dispute route and what a sustained dispute removes; year average and hidden months; MGB average scope; promoter and detractor values | Definitions owner; patient experience office; chair | F-11, F-28, F-41, F-48, F-69, F-70, F-71, F-72, F-73, F-87, F-88, F-89 | OQ-40, OQ-41, OQ-42, OQ-43, OQ-44 |
| Governance, hosting and retention | BI row-level security or app layer; approving bodies and lead times; whether the email needs any of them; who reads the trust report; retention period per store and departed-surgeon handling | Information security; data governance; privacy office; medical staff office; chair | F-85, F-106, F-98, F-107, F-113 | OQ-47, OQ-50, OQ-57 |
| Division and site views | A specification the brief does not contain, with the under-five anonymity guard | Definitions owner; chair | F-104; any future view | OQ-52 |

### 16.4 Assumptions this PRD builds on

Provisionally accepted from the design doc, each falsifiable: P1 (periop delivers the extract through its ticket process), P2 (co-surgeon rate measured before a rule is chosen), P3 (Vizient encounter-level extract with expected values and model version), P4 (all neurosurgeons at the pilot site form a group of at least five), P5 (small-group anonymity does not prevent re-identification), P6 (surgeons accept a number they can trace and dispute, only if a sustained dispute visibly changes the list), P7 (email needs no new host or governance path, to confirm), P8 (survival needs a named analyst on a chair-approved fraction), P9 (more frequent patient-experience access will be used), P10 (doing nothing has a real cost), P11 (peer-spread participation is voluntary), P12 (O/E point estimates at the brief's min-n read as signal when they are noise).

---

## 17. Appendices

### A. Traceability summary

| From | To | Count |
|---|---|---|
| Brief items | Journeys | 25 items, each with at least one coverage-matrix cell; 3 division-and-site measures as page text |
| Brief ground rules | Journeys | 6 rules, each exercised in all four journeys |
| Journeys | Steps | 4 journeys, 60 steps (J1: 20; J2: 14; J3: 10; J4: 16) |
| Steps | Features | 60 steps, each mapped to at least one feature; 2 human-only steps (J1.11, J3.9) covered by acceptance criteria |
| Features | Active | 113 IDs, 112 active, 1 retired (F-105) |
| Features by milestone | M0 to M7 | M0 4; M1 68; M2 4; M3 1; M4 14; M5 5; M6 10; M7 6 |
| Features | Requirements | 112 active features cited in 112 requirement rows (R-01 to R-112), one feature per row, across 15 areas plus cross-cutting; F-105 noted as retired in R-108 |
| Requirements by priority | Must / Should / Could | Must 73 (M0 and M1 plus F-107); Should 23 (M2 to M5 except F-107); Could 16 (M6 and M7) |
| Metrics | Specifications | 25 brief items plus 3 division-and-site measures in section 8 |
| Open questions | Register | 58 in the catalogue; 5 are the brief's own; consolidated into 13 themes in section 16 |
| Goals | Success metrics | 8 goals; 9 measured metrics in section 14 |

### B. Glossary

| Term | Meaning here |
|---|---|
| Annotated | A sustained dispute outcome where the record stays as logged and the adjudicator's note and an override flag are shown; the metric shows "as logged" and "as adjudicated" side by side |
| As logged / as adjudicated | The value from the source as loaded, and the value after sustained overrides are applied |
| As-of date | The date the source's data was current; distinct from "last refreshed" |
| Attribution ledger | The record-level store every number is computed from, with surgeon, role, shared flag, source, version and dispute state per record |
| Bucket | One of the brief's six groups: Volume and mix; Efficiency; Access; Quality and outcomes; Patient experience; Citizenship |
| Definition version | An immutable record of a metric's definition text, parameters, cadence, min-n and comparator, with effective period and confirmer |
| Direct leader | The one person besides the surgeon who may read the Patient feedback inbox; whether this is the division chief is OQ-41 |
| GR1 to GR6 | The brief's six ground rules as numbered in the journeys |
| Index operation | The department operation that credits an admission to its surgeon, under a written rule (OQ-31) |
| Last refreshed | The date the period was published, shown on every artifact |
| Minimum n (min-n) | The smallest count at which a metric's number is shown; below it the screen says why |
| O/E | Observed divided by expected, where Vizient supplies the expected value; 1.0 is exactly as expected |
| Peer group | Dated-roster members with the same site (and subspecialty where the brief says so) as of the period, excluding the viewer (proposed default, OQ-07) |
| Peer-under-five | The rule that a comparison is withheld when fewer than five peers each clear min-n |
| Period | A closed month, quarter, rolling 12 months or fiscal year, per the metric's cadence |
| Reconciliation gate | The publish check that the department's computed numbers match periop's report or carry a written definition delta |
| Shared flag | A visible mark on a multi-panel case credited to the first-listed primary surgeon |
| Source corrected | A sustained dispute outcome routed to the feed owner; the annotation applies until re-ingest confirms the change |
| Spread | The anonymous distribution of peer values with the surgeon's own position marked |
| Step zero | The faculty meeting at which definitions, ground rules and the "what this is not" page are presented before any peer data renders |
| Wedge | The design doc's first release: one site, all neurosurgeons, periop's case-level extract, four metrics, email for months one to three |
| Wedge four | OR case volume; First-case on-time start (FCOT); Duration estimate accuracy; Same-day cancellations you could have prevented |
| "What this is not" | The versioned statement: not a comp input, not a rank, not an OPPE record; visible to you; your chief sees a record only when you dispute it; no leader view in the pilot; disputes change the record list |

### C. Document history

| Version | Date | Change |
|---|---|---|
| 0.1 | 2026-09-28 | First draft, derived from brief v0.2, design doc (revised after adversarial review), journeys v1.1 and feature catalogue v1.1. Section 10 is a placeholder pending the technical design. |

### D. gstack review record

Pending: /plan-ceo-review, /plan-design-review, /plan-eng-review
