# Clinician Scorecard: Feature Catalogue

Version 1.1 · 2026-09-28 · Revised after audit (see "Review log") · Derived from `docs/source/metric-definitions-v0.2.md` (the brief), `docs/designs/clinician-scorecard.md` (the design doc) and `docs/01-user-journeys.md` (the journeys). Merged from four per-journey feature lists (134 raw features) into 108 catalogue features; version 1.1 adds F-109 to F-113 and retires F-105, for 112 active features.

## Purpose

This document is the canonical list of what the Clinician Scorecard must do, one feature at a time, with acceptance criteria a tester can run. Every feature traces back to at least one journey step and forward to the metrics it serves. The technical design and the PRD cite features by ID and do not restate them. Where the brief is silent, the feature records a proposed default and an open question; it does not invent policy.

The product, restated from the design doc: a read-only per-surgeon metrics viewer with a record-level attribution ledger behind every number, a dispute path with a written outcome, self-explaining suppression, anonymous peer spread, and trend on every metric. The ledger and the dispute path are the product; the charts are the surface.

## How to read this

- **IDs.** Features are numbered F-01 to F-113, grouped by capability area in a fixed order (Attribution ledger; Metric engine and definitions; Suppression and peer groups; Scorecard views; Drill-down and provenance; Dispute workflow; Patient experience and inbox; Citizenship (M&M); wRVU tracker; Period close and publish; Roles and access; Delivery and notifications; Audit and versioning; Admin and configuration; Division and site views; Cross-cutting). Features added after version 1.0 (F-109 to F-113) take the next unused number and sit at the end of their capability area, so IDs past F-108 are not in document order. IDs are stable: do not renumber. A retired feature keeps its ID and is marked retired (F-105).
- **Milestone key** (from the journeys document "Delivery sequencing"). Each feature carries the earliest milestone at which it must exist. A feature's Dependencies name only features at the same or an earlier milestone; a feature at a later milestone that reads this one is listed under Later consumers and is never a prerequisite.

| Key | Milestone | Gate (short) |
|---|---|---|
| M0 | The Assignment and step zero | Periop extract for three months; one surgeon's printed list; faculty-meeting slot; attendance recorded |
| M1 | Wedge, months one to three | Ticketed extract; privacy-office confirmation for email; named analyst; periop contact; periop leadership sign-off on the reason sets. Four OR-log metrics by email |
| M2 | Hosted view | Security review, data governance, QI determination; per-user authorization |
| M3 | Block schedule extract | Owner named; extract on a schedule |
| M4 | Survey vendor extract | Per-response feed with comments; de-identification owner; copy of the faculty-meeting slide; hosted view; 30-day surgeon-first gate |
| M5 | Billing and attendance feeds | Comp office confirms the wRVU query; QR attendance system live; HR leave feed |
| M6 | Vizient and QI feeds | Encounter-level Vizient extract; QI database access per site; medical staff office decision; interval rendering |
| M7 | Clinic, referral, ADT feeds | Clinic scheduling and sampling; referral queue with received date; ADT proxy rule |

M8 (division and site views) was dropped from the key in version 1.1: no specification exists, the one feature under it (F-105) is retired, and the scope boundary lives in "Explicitly out of scope" and OQ-52.

- **Fields per feature.** Milestone; Description; User-facing behavior; Acceptance criteria (numbered, each a pass/fail statement); Data required; Rules enforced (short citations: "GR n" is ground rule n of the brief; "brief: Bucket k" and "design doc: <section>" name the source); Journey steps; Metrics; Dependencies (other F-xx at the same or an earlier milestone, plus external gates in plain words); Later consumers (present only where a later-milestone feature reads this one); Open questions (each also appears in the register at the end).
- **Ground rules** as numbered in the journeys document: GR1 single-clinician attribution; GR2 dispute to chief, then chair; GR3 min-n and peer-under-five suppression with the reason shown; GR4 anonymous spread; GR5 definition and record drill-down; GR6 trend.
- **Metric names** are quoted exactly as the brief writes them. The brief's name "Work RVUs — live tracker" contains a dash, as does the brief's marker "(assumption — to be confirmed)"; those verbatim quotations are the only places a dash of that kind appears in this document. Shorthand used in tables: **Wedge four** = OR case volume; First-case on-time start (FCOT); Duration estimate accuracy; Same-day cancellations you could have prevented. **Vizient four** = Length of stay (O/E); 30-day readmission (O/E); In-hospital mortality (O/E); Case mix index. **QI four** = Unplanned return to the OR within 30 days; Surgical site infection; VTE within 30 days; CSF leak requiring intervention (neurosurgery only). **Bucket 5 measures** = Net promoter score; "Provider explained things in a way I could understand"; "Provider listened carefully"; "Provider showed respect". **All** = every metric in the brief.
- **How the PRD and technical design cite this document.** Cite `F-xx` (for example "per F-15 AC 2"). Acceptance criteria are numbered within a feature and cited as `F-xx AC n`. Open questions are cited as `OQ-nn` from the register. The technical design maps each F-xx to components and tables; the PRD maps each F-xx to a milestone and a success criterion. Neither restates acceptance criteria.
- **Proposed defaults.** Where the brief does not specify a behavior, the feature says "proposed default" and names the open question. A proposed default is buildable now and reversible by the brief's owner. Where this catalogue departs from an explicit brief rule (Work RVUs — live tracker with no record list or dispute action), it says "deviation" and names the open question; it never presents the departure as settled.
- **Acceptance criteria are build-time tests.** Multi-month operational outcomes (two unassisted runs by the analyst, three consecutive months within 10 business days, disputes resolved within 14 days) are PRD success criteria. The criteria here hold only what a tester can verify at build: the procedure exists, the dates are recorded, the report is computable.

## Feature catalogue at a glance

| ID | Name | Capability area | Milestone | Journey steps | Metrics |
|---|---|---|---|---|---|
| F-01 | Single-clinician attribution with tie-break and shared flag | Attribution ledger | M1 | J1.4, J1.7, J4.2 | Wedge four |
| F-02 | Attribution exception list with recorded resolution | Attribution ledger | M1 | J1.4, J4.2 | Wedge four |
| F-03 | Co-surgeon rate monitor with 5% threshold | Attribution ledger | M0 | J4.2 | OR case volume; First-case on-time start (FCOT); Duration estimate accuracy |
| F-04 | Per-feed attribution and feed-owner routing table | Attribution ledger | M1 | J2.6, J2.11, J4.10, J4.13 | All (one row per feed) |
| F-05 | Record-level override annotation | Attribution ledger | M1 | J2.6, J2.8, J2.9 | All with a record list |
| F-06 | Source correction request and convergence | Attribution ledger | M1 | J2.6, J2.8, J2.9, J2.11 | All with a record list |
| F-07 | Re-attribution outcome across all fed metrics | Attribution ledger | M1 | J2.9, J2.10 | Wedge four; Vizient four |
| F-08 | Vizient encounter join under the index-operation rule | Attribution ledger | M6 | J1.15, J1.16, J1.18, J4.10 | Vizient four |
| F-09 | QI-feed-only complication ingestion with orphan flagging | Attribution ledger | M6 | J4.10 | QI four |
| F-10 | Clinic feed load with rendering-provider attribution and third-next-available sampling | Attribution ledger | M7 | J4.10 | New patient visits; Clinic notes closed within 72 hours; Third-next-available appointment |
| F-11 | Survey per-response ingestion, de-identification gate and provider-named attribution | Attribution ledger | M4 | J3.1, J3.4, J3.7, J4.10 | Bucket 5 measures; Patient feedback inbox |
| F-12 | Definitions as code: one versioned function per metric | Metric engine and definitions | M1 | J4.4, J4.11, J4.12 | All computed metrics |
| F-13 | Definition registry with immutable versions | Metric engine and definitions | M1 | J4.11, J4.15 | All |
| F-14 | OR case volume tile and case list | Metric engine and definitions | M1 | J1.7, J4.4 | OR case volume |
| F-15 | First-case on-time start (FCOT) tile and first-case record list | Metric engine and definitions | M1 | J1.3, J1.4, J1.5, J4.4 | First-case on-time start (FCOT) |
| F-16 | Duration estimate accuracy tile and record list | Metric engine and definitions | M1 | J1.6, J4.4 | Duration estimate accuracy |
| F-17 | Same-day cancellations you could have prevented tile and record list | Metric engine and definitions | M1 | J1.8, J4.4 | Same-day cancellations you could have prevented |
| F-18 | Block utilization: schedule load, tile, block-day list and "not applicable" state | Metric engine and definitions | M3 | J1.9, J4.1, J4.10, J4.13 | Block utilization (only if you have allocated block) |
| F-19 | Length of stay (O/E) tile and admission record list | Metric engine and definitions | M6 | J1.15 | Length of stay (O/E) |
| F-20 | 30-day readmission (O/E) tile and admission list | Metric engine and definitions | M6 | J1.18 | 30-day readmission (O/E) |
| F-21 | In-hospital mortality (O/E) tile and record list | Metric engine and definitions | M6 | J1.16 | In-hospital mortality (O/E) |
| F-22 | Case mix index tile | Metric engine and definitions | M6 | J1.18 | Case mix index |
| F-23 | QI-sourced complication metrics with "self-reported, unadjusted" label | Metric engine and definitions | M6 | J1.17 | QI four |
| F-24 | Risk-model labeling, intervals and "no evidence of difference" | Metric engine and definitions | M6 | J1.15, J1.16, J1.17, J1.18, J4.10 | All O/E and rate metrics (Bucket 4) |
| F-25 | Third-next-available appointment tile and sample list | Metric engine and definitions | M7 | J1.19 | Third-next-available appointment |
| F-26 | New patient visits tile and visit list | Metric engine and definitions | M7 | J1.19 | New patient visits |
| F-27 | Clinic notes closed within 72 hours tile and visit list | Metric engine and definitions | M7 | J1.19 | Clinic notes closed within 72 hours |
| F-28 | Survey measure definitions as versioned code | Metric engine and definitions | M4 | J3.1, J3.2, J3.10 | Bucket 5 measures |
| F-29 | Decision-triggered recompute, as logged and as adjudicated | Metric engine and definitions | M1 | J2.3, J2.7, J2.9, J2.10 | All with a record list |
| F-30 | Version-scoped recompute | Metric engine and definitions | M1 | J4.14 | All |
| F-109 | Referral-to-visit days tile and referral list | Metric engine and definitions | M7 | J1.19, J4.13 | Referral-to-visit days (pending confirmation of data source) |
| F-110 | Unplanned return to ICU tile and step-down list | Metric engine and definitions | M7 | J1.17, J4.13 | Unplanned return to ICU (pending confirmation of data source) |
| F-31 | Peer group computation from the dated roster | Suppression and peer groups | M1 | J1.7, J1.10, J4.3 | All with a peer comparison |
| F-32 | Suppression engine with the brief's min-n table and 100%-reason gate | Suppression and peer groups | M1 | J1.3, J1.6, J1.7, J1.8, J1.10, J1.16, J1.17, J4.6, J4.12 | All with a min-n or a peer comparison |
| F-33 | "Why not shown" reason text catalogue | Suppression and peer groups | M1 | J4.1, J4.6, J4.8, J4.10, J4.13, J4.16 | All |
| F-34 | Comparator statement and peer count on every tile | Suppression and peer groups | M1 | J1.3, J1.6, J1.7, J1.8, J1.10 | All |
| F-35 | Spread eligibility at publish: month one, attendee, opt-out | Suppression and peer groups | M1 | J1.10, J4.3, J4.7, J4.9 | All with a peer comparison |
| F-36 | Anonymized spread storage and render log | Suppression and peer groups | M1 | J1.10, J1.11, J4.7 | All with a peer comparison |
| F-37 | Under-five groups report and chief pre-step-zero summary | Suppression and peer groups | M0 | J4.3, J4.6 | Wedge four |
| F-38 | Dispute-caused suppression reason | Suppression and peer groups | M1 | J2.7, J2.10 | All with a min-n or a peer comparison |
| F-39 | Roster change with dated peer-group recompute | Suppression and peer groups | M1 | J4.3, J4.16 | All with a peer comparison; M&M attendance |
| F-40 | Anonymous cross-system survey peer bar chart | Suppression and peer groups | M4 | J3.1, J3.10 | Bucket 5 measures |
| F-41 | Per-month under-10 response suppression with reason text | Suppression and peer groups | M4 | J3.2, J3.10 | Bucket 5 measures |
| F-42 | "What this is not" statement | Scorecard views | M0 | J1.1, J1.2 | All |
| F-43 | Trend on every metric with history-start disclosure | Scorecard views | M1 | J1.2, J1.3, J1.6, J1.7, J1.13, J1.15, J1.16, J1.17, J1.18, J1.19 | All |
| F-44 | "Why not shown" states for unavailable and pending data | Scorecard views | M1 | J1.9, J1.17, J1.19, J4.10, J4.13 | Block utilization (only if you have allocated block); Referral-to-visit days (pending confirmation of data source); Unplanned return to ICU (pending confirmation of data source); any metric whose feed fails |
| F-45 | Quarterly and rolling-window cadence tile states | Scorecard views | M1 | J1.8, J1.15, J1.16, J1.17, J1.18 | All quarterly, rolling-12-month and fiscal-year metrics |
| F-46 | Anonymous peer spread rendering | Scorecard views | M1 | J1.10, J1.11, J1.15, J1.18 | All with a peer comparison |
| F-47 | As logged / as adjudicated tile display with restated trend marker | Scorecard views | M1 | J2.7, J2.8 | All with a record list |
| F-48 | Survey measure trend and three-month roll-forward | Scorecard views | M4 | J3.1, J3.10 | Bucket 5 measures |
| F-49 | Record list drill-down from every number | Drill-down and provenance | M1 | J1.4, J1.6, J1.7, J1.8, J1.14, J1.15, J1.16, J1.17, J1.19, J2.1 | All except Work RVUs — live tracker |
| F-50 | Metric definition page | Drill-down and provenance | M1 | J1.5, J1.6, J1.13, J1.14, J1.19, J3.3, J3.9, J4.11, J4.15 | All |
| F-51 | Number provenance stamp, definition version stamp and row-count invariant | Drill-down and provenance | M1 | J1.2, J1.3, J1.5, J1.13, J1.20, J4.4, J4.10 | All |
| F-52 | Dispute detail with provenance panel | Drill-down and provenance | M1 | J2.5, J2.10 | All with a record list |
| F-53 | Per-response de-identified survey record list | Drill-down and provenance | M4 | J3.3, J3.7 | Bucket 5 measures |
| F-54 | Dispute action on every record row | Dispute workflow | M1 | J2.1, J2.2, J2.11 | All except Work RVUs — live tracker |
| F-55 | Dispute ledger record | Dispute workflow | M1 | J2.2, J2.3, J2.3a, J2.6, J2.8a, J2.9, J2.12 | All except Work RVUs — live tracker |
| F-56 | Dispute effect notice per disputed field | Dispute workflow | M1 | J2.2, J2.7, J2.8 | All except Work RVUs — live tracker |
| F-57 | Email-months dispute intake and acknowledgement | Dispute workflow | M1 | J1.12, J2.3a, J2.4 | Wedge four |
| F-58 | Dispute routing and chair-escalation tests | Dispute workflow | M1 | J2.3, J2.4, J2.9, J2.10 | All except Work RVUs — live tracker |
| F-59 | Dispute state shown on the record row | Dispute workflow | M1 | J1.4, J1.12, J2.3, J2.4, J2.8, J2.8a, J2.9, J2.12 | All with a record list |
| F-60 | Adjudicator dispute queue | Dispute workflow | M1 | J2.5 | All except Work RVUs — live tracker |
| F-61 | Decision recording with two sustained outcomes | Dispute workflow | M1 | J2.6, J2.8a, J2.12 | All except Work RVUs — live tracker |
| F-62 | Dispute history, re-filing and linkage on a record | Dispute workflow | M1 | J2.8a, J2.9 | All except Work RVUs — live tracker |
| F-63 | Definition-question outcome and definition-page open items | Dispute workflow | M1 | J2.12 | All |
| F-64 | Monthly sustained-override list per feed owner | Dispute workflow | M1 | J2.6, J2.7, J2.9, J2.11, J4.9 | All except Work RVUs — live tracker |
| F-65 | Same-day cancellation record dispute | Dispute workflow | M1 | J2.11 | Same-day cancellations you could have prevented |
| F-66 | Hosted dispute filing form pinned to one record | Dispute workflow | M2 | J2.2, J2.3 | All except Work RVUs — live tracker |
| F-67 | Admission record dispute with chair branch | Dispute workflow | M6 | J2.10 | Vizient four |
| F-68 | QI event record dispute | Dispute workflow | M6 | J2.11 | QI four |
| F-111 | Wedge ledger custody and decision intake | Dispute workflow | M1 | J2.3a, J2.5, J2.6 | Wedge four |
| F-69 | Patient experience measures in the faculty-meeting layout | Patient experience and inbox | M4 | J3.1, J3.10 | Bucket 5 measures |
| F-70 | Patient feedback inbox | Patient experience and inbox | M4 | J3.4, J3.5, J3.10 | Patient feedback inbox |
| F-71 | Private notes on comments | Patient experience and inbox | M4 | J3.6, J3.8 | Patient feedback inbox |
| F-72 | Survey response dispute on the provider-named field | Patient experience and inbox | M4 | J2.11, J3.7 | Bucket 5 measures; Patient feedback inbox |
| F-73 | Survey dispute status and outcome on the row, the inbox and the measure | Patient experience and inbox | M4 | J3.7, J3.10 | Bucket 5 measures; Patient feedback inbox |
| F-74 | M&M attendance tile and session record list | Citizenship (M&M) | M5 | J1.14 | M&M attendance |
| F-75 | Attendance and leave load, pace rule, cannot-reach flag and leave-scaled target | Citizenship (M&M) | M5 | J1.14, J4.10, J4.15, J4.16 | M&M attendance |
| F-76 | M&M session record dispute | Citizenship (M&M) | M5 | J2.11 | M&M attendance |
| F-77 | Work RVUs — live tracker tile: read-only mirror with no dispute action | wRVU tracker | M5 | J1.13, J1.20, J2.11 | Work RVUs — live tracker |
| F-78 | wRVU feed load with as-of date and restatement delta | wRVU tracker | M5 | J4.10, J4.14 | Work RVUs — live tracker |
| F-79 | One-command monthly batch runner | Period close and publish | M1 | J4.1, J4.9 | All |
| F-80 | Extract field-presence check and "not computable" state | Period close and publish | M1 | J4.1 | Wedge four; Block utilization (only if you have allocated block) |
| F-81 | Reconciliation gate against periop's report with definition delta registry | Period close and publish | M1 | J4.5 | Wedge four |
| F-82 | Feed health check and no-zero guard | Period close and publish | M1 | J4.8 | All |
| F-83 | "Last refreshed" date on every artifact | Period close and publish | M1 | J1.2, J1.20, J4.8, J4.9 | All |
| F-84 | Closed-periods-only display | Period close and publish | M1 | J1.3, J1.8, J1.19 | All |
| F-112 | Deadline alerts to the analyst | Period close and publish | M1 | J2.3a, J2.5, J4.1, J4.9 | All |
| F-85 | Hosted per-surgeon authorized view with open logging | Roles and access | M2 | J1.4, J1.12, J4.9 | All |
| F-86 | Dispute role-based access in the hosted view | Roles and access | M2 | J2.2, J2.5, J2.9, J2.11 | All except Work RVUs — live tracker |
| F-87 | Chief and direct-leader mapping with access follow-through | Roles and access | M1 | J3.4, J3.7, J3.8, J4.3, J4.16 | Patient feedback inbox; dispute routing for all |
| F-88 | Inbox two-person viewer authorization | Roles and access | M4 | J3.4, J3.8 | Patient feedback inbox |
| F-89 | Direct leader inbox view with the 30-day surgeon-first gate | Roles and access | M4 | J3.8, J3.9 | Patient feedback inbox |
| F-90 | Monthly per-surgeon scorecard email | Delivery and notifications | M1 | J1.2, J1.10, J1.12, J4.9 | Wedge four |
| F-91 | Reply-to-dispute address and adoption signal log | Delivery and notifications | M1 | J1.2, J1.12 | Wedge four |
| F-92 | Dispute filed and re-credit notifications | Delivery and notifications | M1 | J2.3, J2.9 | All with a record list |
| F-93 | One-record decision email | Delivery and notifications | M1 | J1.12, J2.3a, J2.8, J2.8a, J2.12 | All with a record list |
| F-94 | Definition-change notification in the next email | Delivery and notifications | M1 | J4.15 | All |
| F-95 | Extract staging and period run record | Audit and versioning | M1 | J4.1, J4.5, J4.9 | All |
| F-96 | Restatement log and trend markers | Audit and versioning | M1 | J4.8, J4.13, J4.14 | All |
| F-97 | Per-source as-of date and model version on every tile | Audit and versioning | M4 | J1.13, J1.14, J1.15, J1.16, J1.17, J1.18, J1.20, J3.1 | All later-feed metrics |
| F-98 | Dispute trust metrics report | Audit and versioning | M1 | J2.3a, J2.5, J2.8 | All with a record list |
| F-99 | Dated department roster dimension with step-zero attendance and opt-out flags | Admin and configuration | M0 | J1.1, J4.3, J4.16 | None directly (all peer groups, routing and access read it) |
| F-100 | Versioned metric configuration table | Admin and configuration | M1 | J4.12 | All |
| F-101 | Surgeon-attributable delay reason set (row labels only) | Admin and configuration | M1 | J1.4, J1.5 | First-case on-time start (FCOT) |
| F-102 | Surgeon-attributable cancellation reason set (numerator rule) | Admin and configuration | M1 | J1.8 | Same-day cancellations you could have prevented |
| F-103 | Source registry for pending and later feeds | Admin and configuration | M1 | J4.10, J4.13 | Referral-to-visit days (pending confirmation of data source); Unplanned return to ICU (pending confirmation of data source); Block utilization (only if you have allocated block) |
| F-104 | Division-and-site-only measures: page text and "not computed in this cycle" | Division and site views | M1 | J1.9, J4.1, J4.9 | OR turnover time; PACU boarding; room-ready delays |
| F-105 | Division and site views (retired in version 1.1; scope moved to "Explicitly out of scope" and OQ-52) | Division and site views | Retired | none | none |
| F-106 | PHI handling and governance gates | Cross-cutting | M1 | J1.2, J2.3, J2.3a, J3.4, J4.9, J4.10 | All |
| F-107 | Access audit log for surgeon-identified data | Cross-cutting | M2 | J1.12, J2.5, J3.4, J3.8, J4.9 | All |
| F-108 | Device and accessibility baseline | Cross-cutting | M1 | J1.2, J3.1 | All |
| F-113 | Retention and disposition | Cross-cutting | M1 | J4.1, J4.16 | All |

Counts: 113 IDs, 112 active features, 1 retired (F-105). By milestone (active): M0 4; M1 68; M2 4; M3 1; M4 14; M5 5; M6 10; M7 6. By area (IDs): Attribution ledger 11; Metric engine and definitions 21; Suppression and peer groups 11; Scorecard views 7; Drill-down and provenance 5; Dispute workflow 16; Patient experience and inbox 5; Citizenship (M&M) 3; wRVU tracker 2; Period close and publish 7; Roles and access 5; Delivery and notifications 5; Audit and versioning 4; Admin and configuration 5; Division and site views 2 (1 active, 1 retired); Cross-cutting 4.

---

## Attribution ledger

The ledger is the record-level store every number is computed from. Every record is credited to exactly one clinician by the rule for its type (GR1). Overrides from disputes live here, never in the extract.

### F-01 Single-clinician attribution with tie-break and shared flag

- **Milestone:** M1
- **Description:** Every OR-log case in the ledger is credited to exactly one surgeon, the primary surgeon in the OR log. A case with more than one attending in a primary role is credited to the first-listed primary by a deterministic tie-break and carries a visible "shared" flag on every row it appears in. Each ledger row stores surgeon, panel role, shared flag, source system, load date, definition version id and dispute state.
- **User-facing behavior:** The surgeon sees a "shared" marker on any list row where more than one attending held a primary role and knows the case is disputable on attribution. The analyst sees every case with its credited surgeon and flag; re-running attribution gives the same credit every time.
- **Acceptance criteria:**
  1. For every case in a published period exactly one credited clinician is stored; the sum of credited cases across surgeons equals the count of credited cases, and no case appears in two surgeons' record lists for the same period and version.
  2. A case with two attendings in a primary role is credited to the first-listed primary and stored with shared = true; a case with one primary is stored with shared = false.
  3. Running the attribution step twice on the same extract produces identical credits and flags.
  4. The shared flag is visible on every row of every list the case appears in (First-case on-time start (FCOT), Duration estimate accuracy, OR case volume, cancellations).
  5. Every ledger row carries surgeon, panel role, shared flag, source system, load date, definition version id and dispute state (default "none"); a row missing any of these fails the run.
- **Data required:** Periop case-level extract (surgeon by panel and role, case id, room, times); department roster for the in-department check; definition version id.
- **Rules enforced:** GR1 ("Surgical cases go to the primary surgeon in the OR log"); design doc Constraints (Attribution): deterministic tie-break in code and a visible "shared" flag; design doc Premise 2.
- **Journey steps:** J1.4, J1.7, J4.2
- **Metrics:** Wedge four
- **Dependencies:** F-95 (staged extract); F-02 (exceptions); F-03 (co-surgeon rate); the Assignment's measured co-surgeon rate.
- **Open questions:** OQ-06 (co-surgeon cases: one clinician with tie-break and shared flag, or credit both attendings).

### F-02 Attribution exception list with recorded resolution

- **Milestone:** M1
- **Description:** An analyst-facing list of cases that cannot be credited by rule: blank primary surgeon, more than one primary with no deterministic order, or a primary outside the department. Each is assigned or excluded with a recorded reason; excluded cases count in the period's exclusion counts. Nothing is dropped silently or credited twice.
- **User-facing behavior:** After attribution the analyst opens the list, sees each case with its raw panel fields and exception type, and assigns a clinician or excludes it with a typed reason. Publish is blocked while any exception is unresolved. Surgeons never see an unresolved case.
- **Acceptance criteria:**
  1. Every case with a blank primary, ambiguous multiple primaries, or an out-of-department primary appears on the list with its exception type named; a test extract with one of each yields three rows.
  2. Every resolution stores analyst, date, action (assigned to <surgeon> or excluded) and a free-text reason; a resolution with an empty reason is refused.
  3. Excluded cases are added to the "excluded at J4.2" exclusion count stored on each affected number (F-51).
  4. The publish stage is blocked while any exception for the period is unresolved; the run log names the count.
- **Data required:** Periop extract panel fields; roster department membership as of the period.
- **Rules enforced:** GR1; journeys J4 failure mode "an OR-log case with a blank or multi-surgeon primary field is silently dropped or double-credited".
- **Journey steps:** J1.4, J4.2
- **Metrics:** Wedge four
- **Dependencies:** F-01, F-99, F-51.
- **Open questions:** none.

### F-03 Co-surgeon rate monitor with 5% threshold

- **Milestone:** M0
- **Description:** Counts, per subspecialty and period, the share of cases with more than one attending in a primary role and flags any subspecialty above 5%, at which point "handle by dispute" is withdrawn and the brief's owner is asked. At M0 (the Assignment, before code) the count is made by hand from the three-month extract and written into the Assignment notes; from M1 the same count is computed from ledger rows on every run.
- **User-facing behavior:** The analyst sees a table: subspecialty, cases, shared cases, rate; a row above 5% reads "Premise 2 threshold exceeded: ask the owner". Not surgeon-facing.
- **Acceptance criteria:**
  1. For each subspecialty on the roster the monitor reports shared-case count divided by case count for the period.
  2. A subspecialty with rate above 5% is flagged; at M0 the flag is written into the dated Assignment notes, and from M1 it is written to the period record (F-95).
  3. At M0 the rate is counted by hand from the extract's panel fields with the count and date recorded; from M1 it is computed from ledger rows with shared = true (F-01), not from a separate count; a fixture with 3 shared cases of 40 yields 7.5% and a flag under either method.
- **Data required:** Ledger shared flag; roster subspecialty per surgeon.
- **Rules enforced:** Design doc Premise 2 ("If the rate exceeds 5% in any subspecialty, 'handle by dispute' is withdrawn"); design doc The Assignment.
- **Journey steps:** J4.2
- **Metrics:** OR case volume; First-case on-time start (FCOT); Duration estimate accuracy
- **Dependencies:** F-99 (roster subspecialty); the Assignment extract.
- **Later consumers:** F-01 and F-95 (M1) supply the ledger rows and the period record the monitor writes to from M1.
- **Open questions:** OQ-06.

### F-04 Per-feed attribution and feed-owner routing table

- **Milestone:** M1
- **Description:** One registry with one row per source feed (twelve in all) recording record type, the attribution rule applied at load, join key, metrics produced, feed owner and named correction contact, disputable fields, the recipient of the monthly override list, the per-source as-of date field and the model-version field where one exists. The periop row is live in the wedge; the rest are registered as pending or not yet available. Dispute routing, the override list and "source corrected" eligibility read this table, never hard-coded values.
- **User-facing behavior:** The analyst maintains the table: OR-log case and cancellation to periop analytics; admission index surgeon to periop (OR-log crosswalk); survey response provider field to the patient experience office; M&M session scan to the attendance system owner; QI event to the QI coordinator; wRVU to the professional billing office, outside the ledger.
- **Acceptance criteria:**
  1. The table contains rows for all twelve sources named in the design doc (OR log, block schedule, Vizient CDB, QI database, survey vendor, professional billing, clinic scheduling, referral work queue, ADT, HR leave, roster, QR attendance) with status live, registered or pending.
  2. Each row stores record type, attribution rule text, join key, metrics produced, owner, contact, disputable fields, list recipient, as-of date field and model-version field (nullable); a metric cannot be computed from a feed whose row lacks an attribution rule and join key.
  3. A record type without a row cannot be disputed; "source corrected" is selectable in a decision only when the row's contact is named, otherwise the decision falls to "annotated" and the row reads "no source contact named".
  4. The Work RVUs — live tracker row is marked "no ledger record; corrections to the professional billing office" and has no disputable fields.
  5. Changes to the table are versioned with effective dates.
- **Data required:** Source metadata per feed; named contacts per feed owner; source registry (F-103).
- **Rules enforced:** GR1 per record type; design doc Problem Statement (twelve sources); design doc Dependencies (named periop contact); brief: Bucket 4 (complications never hand-entered); brief: Bucket 6 (displays what the system of record logs); journeys J2.11 (the correction lands where the record lives).
- **Journey steps:** J2.6, J2.11, J4.10, J4.13
- **Metrics:** All (one row per feed)
- **Dependencies:** F-103; named contacts from each feed owner.
- **Open questions:** OQ-48 (owner of each of the twelve sources).

### F-05 Record-level override annotation

- **Milestone:** M1
- **Description:** A sustained dispute is stored as an override on the ledger record (adjudicated field value, logged value, override flag, note, decider, date, definition version, override version), never as an edit to the extract. The override survives re-ingest of the same period and is visible on the row.
- **User-facing behavior:** The row shows the corrected value (delay reason "anesthesia") with the override flag and note beside the value as logged ("surgeon late").
- **Acceptance criteria:**
  1. Extract files are immutable after staging (hash recorded); a sustained dispute writes only to ledger override fields, and a test that compares the staged file hash before and after a decision finds no change.
  2. Each override stores adjudicated value, logged value, note, decider, date, definition version and an override version number.
  3. Re-ingesting the same period leaves the override in place and re-applies it unless the source now matches (F-06).
  4. An override always changes the row state text (F-59); no override is silent.
  5. Every active override appears on the monthly feed-owner list (F-64).
- **Data required:** Ledger records with logged and adjudicated field values; extract hashes and load dates.
- **Rules enforced:** Design doc Constraints (Disputes): "Overrides are visible, versioned, never silent"; journeys J2 failure mode (corrections live in the ledger or at source, never in the extract); brief: Bucket 6 (logged value shown beside adjudicated).
- **Journey steps:** J2.6, J2.8, J2.9
- **Metrics:** All with a record list
- **Dependencies:** F-55, F-61, F-51.
- **Open questions:** OQ-14 (does "displays what the system of record logs" apply to every bucket; is an override beside the logged value acceptable).

### F-06 Source correction request and convergence

- **Milestone:** M1
- **Description:** For "source corrected" outcomes the record is flagged "correction requested at <feed owner>, <date>"; the annotation applies immediately, and at each later load the re-ingested field is compared with the adjudicated value. On a match the source-confirmed date is set, the override retires and the history stays readable. The department does not wait for the source.
- **User-facing behavior:** The row reads "...; correction requested at periop <date>" and, after periop corrects the field and the next load re-ingests it, "...; correction confirmed at source <date>" with a single value on the tile.
- **Acceptance criteria:**
  1. On "source corrected" the record gets the flag and the correction-requested date; the annotated value applies immediately, not on confirmation.
  2. At each load every open correction request is compared with the newly ingested field; a match sets the source-confirmed date, retires the override and keeps logged, adjudicated and confirmed values with dates readable on the row.
  3. After convergence the tile shows one value (F-47).
  4. An unconfirmed request stays on every subsequent monthly feed-owner list until confirmed (F-64).
- **Data required:** Ledger override fields; re-ingested extract fields per load; feed-owner table (F-04).
- **Rules enforced:** Design doc Constraints (Disputes): "Sustained overrides go to periop monthly as a correction request; the department does not wait for them"; journeys J4.8 (late-arriving records restate the period with the restatement logged).
- **Journey steps:** J2.6, J2.8, J2.9, J2.11
- **Metrics:** All with a record list
- **Dependencies:** F-05, F-64, F-96.
- **Open questions:** none.

### F-07 Re-attribution outcome across all fed metrics

- **Milestone:** M1
- **Description:** A sustained credited-surgeon dispute re-credits the record to exactly one other roster clinician. The record leaves every adjudicated list of the original surgeon that it fed, appears in the receiver's lists with its dispute history text, both surgeons recompute, and "as logged" keeps the source's crediting until the source corrects it. For admissions (M6) the same mechanism moves the admission across all four Vizient-backed metrics.
- **User-facing behavior:** The late first case disappears from the surgeon's adjudicated First-case on-time start (FCOT), OR case volume and Duration estimate accuracy lists and appears in Dr. Y's with "Re-credited from <surgeon> by division chief on <date>: <note>"; the shared flag stays on the row.
- **Acceptance criteria:**
  1. A re-credit requires exactly one receiving clinician on the dated roster; zero or two receivers is rejected.
  2. The record is removed from the original surgeon's adjudicated lists for every metric it feeds and added to the receiver's adjudicated lists for the same metrics and period.
  3. The receiver's row shows the history text; the original surgeon's list shows the record only under "as logged".
  4. Both surgeons' affected metrics recompute and min-n is re-checked (F-29); the receiver is notified (F-92) and may dispute in turn (F-62).
  5. The correction request appears on the feed owner's monthly list until the source credits the receiver (F-06, F-64).
- **Data required:** Ledger record with credited surgeon (logged and adjudicated); dated roster; metrics fed per record type (F-04).
- **Rules enforced:** GR1 (exactly one clinician before and after); GR2; design doc Premise 2.
- **Journey steps:** J2.9, J2.10
- **Metrics:** Wedge four; Vizient four
- **Dependencies:** F-01, F-05, F-29, F-61, F-92, F-62.
- **Open questions:** OQ-06; OQ-16 (receiving clinician may dispute in turn).

### F-08 Vizient encounter join under the index-operation rule

- **Milestone:** M6
- **Description:** Loads the Vizient encounter-level extract (observed and expected values, relative weight, model version, hospital encounter id) and joins each admission to its index operation in the OR-log ledger under a written, versioned index-operation rule. The index surgeon is credited even when a different attending discharged; the row states the rule when they differ. Admissions with no index operation are listed, never credited to the discharging attending and never dropped. Super-long boarders are excluded from Length of stay (O/E) with the count stored.
- **User-facing behavior:** The analyst sees a join report: admissions joined, count re-credited away from the discharging attending, list of admissions with no index operation found, super-long boarders excluded. In the Length of stay (O/E) list the surgeon finds a 25-day admission discharged by a different attending and reads "credited to the index-operation surgeon by rule".
- **Acceptance criteria:**
  1. Every admission in the extract ends in exactly one of: credited to an index surgeon under the rule text in the definition registry, or listed as "no index operation found" with its encounter id; none is credited to the discharging attending by default and none is dropped.
  2. Each admission row stores observed days, expected days, expected readmissions, expected deaths, relative weight, model version, Vizient as-of date, index operation date, index surgeon and discharging attending.
  3. When index surgeon and discharging attending differ the surgeon-facing row reads "credited to the index-operation surgeon by rule"; the join report stores the count of such admissions per load.
  4. Admissions over the super-long boarder threshold (30 days until confirmed, read from F-100) are excluded from Length of stay (O/E) and the excluded count is stored on the number's exclusion counts (F-51).
- **Data required:** Vizient encounter-level extract with expected values and model version; OR-log ledger with case dates and encounter or CSN crosswalk; written index-operation rule (versioned); super-long boarder threshold (configuration).
- **Rules enforced:** GR1 ("Admissions go to the surgeon who did the index operation, even if a different attending discharged the patient"); brief: Bucket 4 LOS (super-long boarders left out; "the screen shows how many were excluded"); design doc Premise 3; journeys J4 failure mode (admission with no index operation credited to the discharging attending or dropped without a trace).
- **Journey steps:** J1.15, J1.16, J1.18, J4.10
- **Metrics:** Vizient four
- **Dependencies:** F-01, F-04, F-24, F-103, F-13; hospital quality analytics extract; medical staff office peer-review decision.
- **Open questions:** OQ-31 (index-operation rule for zero or multiple operations; encounter-to-case join across entities); OQ-30 (LOS whole-encounter or post-operative days); OQ-02 (super-long boarder threshold); OQ-29 (readmission expected-value universe).

### F-09 QI-feed-only complication ingestion with orphan flagging

- **Milestone:** M6
- **Description:** Loads complication events (return to OR, SSI, VTE, CSF leak) only from the department QI database feed, ties each event to its index case in the OR-log ledger and credits it to that case's primary surgeon. Events with no index case go to an exception list and are never dropped silently. No hand-entry path exists anywhere in the system.
- **User-facing behavior:** The analyst sees per event: QI event id, event type, index case, credited surgeon, or "no index case found". There is no screen to add a complication. Surgeons later see rows such as a reoperation by a partner stating "counts by any surgeon, per definition".
- **Acceptance criteria:**
  1. The only write path for complication events is the QI feed load; a code search and a UI check find no form, import or API for manual complication entry.
  2. Every event is credited to the primary surgeon of its index case, not the surgeon who performed the reoperation; a fixture reoperation by surgeon B on surgeon A's index case counts against A.
  3. Events with no matching index case appear on an exception list with the QI event id and are excluded from rates with the count stored; none disappear.
  4. SSI uses a 30-day window, or 90 days when an implant is recorded on the index case; VTE, return to OR and CSF leak use 30 days.
- **Data required:** QI database extract (event type, dates, index case reference, implant flag); OR-log ledger; QI as-of date.
- **Rules enforced:** Brief: Bucket 4 ("Complications come from the department's QI database, never entered by hand into the scorecard"; return to OR "by any surgeon"; SSI 30 days, 90 with an implant); journeys J4.10 (orphans flagged, never dropped).
- **Journey steps:** J4.10
- **Metrics:** QI four
- **Dependencies:** F-01, F-04, F-24; QI database access per site.
- **Open questions:** OQ-32 (restrict QI comparisons to the site whose database it is; NHSN for SSI).

### F-10 Clinic feed load with rendering-provider attribution and third-next-available sampling

- **Milestone:** M7
- **Description:** Loads clinic scheduling data crediting each visit to the rendering provider under a named field, identifies new-patient visits under a named rule, captures note-signed timestamps for the 72-hour measure, and stores the regular samples of days to the third next open new-patient slot.
- **User-facing behavior:** The analyst sees visit rows (rendering provider, new-patient yes/no, visit date, note-signed time) and sample rows (sample date, days). Surgeons later see counts, shares and medians with record lists.
- **Acceptance criteria:**
  1. Each visit is credited to exactly one rendering provider from the field named in the definition registry; visits with a blank provider go to an exception list with a recorded resolution.
  2. New patient visits counts only completed visits flagged new-patient under the configured rule; a fixture with one incomplete new-patient visit excludes it.
  3. Each third-next-available sample is stored with its date and days; the month's value is the median of samples and "lower is better" is stored on the metric.
  4. Note-signed minus visit time is stored per visit; visits still inside their 72-hour window at period close are handled per the versioned rule in F-100 and are not counted as failed by default.
- **Data required:** Clinic scheduling extract (rendering provider field, visit type, completion status, note-signed timestamp); third-next-available sampling process output.
- **Rules enforced:** GR1 ("Clinic visits go to the rendering provider"); brief: Bucket 3 Third-next-available ("sampled regularly and reported as the median"); brief: Bucket 2 Clinic notes closed within 72 hours.
- **Journey steps:** J4.10
- **Metrics:** New patient visits; Clinic notes closed within 72 hours; Third-next-available appointment
- **Dependencies:** F-04, F-103, F-100.
- **Open questions:** OQ-36 (which systems supply visits, note timestamps and samples); OQ-39 (visit attribution field, new-patient rule, note timestamp); OQ-24 (72-hour window at month close).

### F-11 Survey per-response ingestion, de-identification gate and provider-named attribution

- **Milestone:** M4
- **Description:** Analyst-run load of the survey vendor per-response extract: stages the file with load date, feed as-of date and request reference; checks required fields; refuses an aggregate-only extract; credits each response to exactly one clinician, the provider named, mapped to the roster with an exception list; checks that comments arrive de-identified and quarantines any that fail; stores comments in a table separate from scores that no metric function reads. The analyst handles comments as pipeline data with no viewer role.
- **User-facing behavior:** The analyst sees field check results, the attribution exception list, the de-identification result with quarantined comments counted (not shown), and the as-of date recorded. The analyst has no screen that lists comment text. Surgeons see the four measures and the inbox only after a load passes.
- **Acceptance criteria:**
  1. The load requires response id, survey month, provider named, the four item scores and comment text (nullable); a missing required field marks the affected measures "not computable: <field> not in extract" and never publishes a zero.
  2. An extract without per-response rows is refused and Bucket 5 renders "Data source pending confirmation: per-response survey feed not available" for every surgeon (wording proposed).
  3. Each response is credited to exactly one clinician, the provider named mapped to the roster; responses whose provider is blank, unmapped or outside the department appear on an exception list with a recorded resolution and are never dropped silently.
  4. Comments are checked against the de-identification owner's rule (at minimum patterns for names from patient fields, MRN, date of birth, phone); any failing comment is quarantined, excluded from the inbox, and counted to the analyst and the owner; a load with failures is held and the hold is recorded on the period record.
  5. Comments are written to a separate table keyed by response id; the scores table carries only a comment-present flag; a static check confirms no metric function, rollup, export or division/site view reads the comments table, and a runtime test with comment text altered produces identical measure values.
  6. The analyst role has no read permission on comment text in the hosted view; pipeline access to comments uses a service credential and is logged (F-107).
  7. The load records feed as-of date, load date and request reference, and every measure computed from it carries that as-of date (F-97).
- **Data required:** Survey vendor per-response extract (monthly); dated roster with provider identifiers; de-identification rule from the named owner; source registry entry.
- **Rules enforced:** GR1 ("Surveys go to the provider named on the survey"); brief: Bucket 5 Patient feedback inbox (de-identified; "never counted, compared, or rolled up into anything"; "you and your direct leader only"); design doc Dependencies (survey extract with comments and a de-identification step); journeys J4.10 (analyst as pipeline handler with no viewer role); journeys J4.8 (a failed feed publishes a reason, never a zero).
- **Journey steps:** J3.1, J3.4, J3.7, J4.10
- **Metrics:** Bucket 5 measures; Patient feedback inbox
- **Dependencies:** F-04, F-103, F-99, F-106; survey extract authorized by the patient experience office; named de-identification owner; data governance sign-off for pipeline handling of comments.
- **Open questions:** OQ-40 (per-response feed with comments; de-identification owner; analyst pipeline role; inpatient items).

---

## Metric engine and definitions

One versioned function per metric, matched to the institutional definition where one exists, with the brief's min-n, cadence and comparator as data. Per-metric features carry the tile text and record-list columns for that metric; shared behaviors (trend, drill-down, suppression) live in their own features and are not repeated.

### F-12 Definitions as code: one versioned function per metric

- **Milestone:** M1
- **Description:** The contract every metric function obeys: it exposes its definition text, version id, min-n, cadence, comparator, exclusions and risk-model attribute as data; it computes from ledger rows only; it returns numerator, denominator, record ids and exclusion counts; the same function serves the email, the hosted view and the reconciliation gate, so there is one number per metric.
- **User-facing behavior:** The analyst runs the compute stage and sees, per surgeon and metric, numerator, denominator, record count and version id. Surgeons see one number for a metric on every artifact.
- **Acceptance criteria:**
  1. Every computed metric is implemented as one function registered against a definition version id; a metric with no registered function cannot publish.
  2. Each function exposes definition text, version id, min-n, cadence, comparator and exclusions as data readable by the definition page (F-50) and the configuration table (F-100); a diff of the exposed values against the brief is empty at version 1, except where the design doc adopts an institutional definition verbatim (First-case on-time start (FCOT) grace window and room eligibility; Same-day cancellations you could have prevented under periop's definition), in which case the diff against the brief's text is stored as the version-1 delta in the registry (F-13, F-100 AC 5) and cited by the reconciliation gate (F-81).
  3. Each function returns numerator, denominator, the list of record ids used and exclusion counts by reason; a return missing record ids fails the run.
  4. The email generator, the hosted view and the reconciliation gate call the same function for the same period and version and receive identical values; a test compares all three outputs for one surgeon and month.
  5. No function reads any field outside the ledger (including the comments table, F-11).
- **Data required:** Ledger rows; definition registry (F-13); configuration table (F-100).
- **Rules enforced:** Design doc Approach A ("one function per metric with its min-n, peer rule, definition text and version, matched to the institutional definition"); design doc: "two numbers for the same metric" ruled out; GR5.
- **Journey steps:** J4.4, J4.11, J4.12
- **Metrics:** All computed metrics
- **Dependencies:** F-13, F-100, F-01.
- **Open questions:** none.

### F-13 Definition registry with immutable versions

- **Milestone:** M1
- **Description:** Each metric definition is a versioned record: text, diff from the prior version, effective period, who confirmed it and when, an approver field, and an assumption flag (retained or cleared). A new version is created beside the old; the old version is never edited and stays readable from any number computed under it. Also holds the interval method, the index-operation rule, the reason sets' sign-off and definition-question open items.
- **User-facing behavior:** The analyst drafts a new version from a confirmed item (periop confirms the FCOT grace window) and sees old and new side by side with the diff and effective period. Any number's definition link resolves to the version it was computed under.
- **Acceptance criteria:**
  1. Creating a version requires text, effective-from period, confirmer and confirmation date; the approver field exists and may be empty until the owner decides who approves.
  2. An attempt to modify the text of an existing version is refused; the only write is a new version with a stored diff against the prior one.
  3. A number stamped with version v1 resolves its definition link to v1 text after v2 is published.
  4. The assumption flag is stored per version and its clearing is dated; the registry lists every item still flagged "assumption, to be confirmed" and every metric marked "pending confirmation of data source".
  5. Every "(assumption — to be confirmed)" and "(pending confirmation of data source)" wording in the brief exists as a flagged item at version 1: FCOT grace window; super-long boarder threshold; M&M leave scaling; Referral-to-visit days source; Unplanned return to ICU source.
- **Data required:** Definition text per metric; confirmation records from the definitions owner; version store.
- **Rules enforced:** Brief header ("edits go in a new version, not here"); GR5; journeys J4 failure mode (old version edited in place).
- **Journey steps:** J4.11, J4.15
- **Metrics:** All
- **Dependencies:** none (foundation).
- **Open questions:** OQ-35 (who confirms an institutional definition and who approves a new version).

### F-14 OR case volume tile and case list

- **Milestone:** M1
- **Description:** Monthly count of operations where the surgeon was primary surgeon, never count-suppressed, with a 12-month trend, the subspecialty peer-group size on the tile from month one, and a list of every credited case with the shared flag.
- **User-facing behavior:** "October: 19 operations as primary surgeon. Trend: 12 months. Compared to: surgeons in your subspecialty at your site (4 surgeons; spread from month two)."
- **Acceptance criteria:**
  1. Value = count of cases credited to the surgeon as primary surgeon (F-01) in the closed month; a fixture of 19 credited cases yields 19.
  2. Tile text form: "<Month>: <n> operations as primary surgeon. Trend: 12 months." followed by the comparator line "Compared to: surgeons in your subspecialty at your site" (the brief's wording for this metric, verbatim per F-34 AC 1) with peer-group size.
  3. The tile is never count-suppressed; a month with zero credited cases shows 0 only when the extract for that month loaded successfully, otherwise the F-44 feed-not-received state.
  4. The case list contains every credited case with date, room, procedure and shared flag; row count equals n.
  5. Where periop reports surgeon-level volume, the value reconciles to it or a written delta exists (F-81).
- **Data required:** OR-log cases credited under F-01; peer-group size (F-31).
- **Rules enforced:** Brief: Bucket 1 OR case volume ("the number of operations where you were the primary surgeon"; monthly; "surgeons in your subspecialty at your site"; count with a trend line); GR1, GR5, GR6; journeys J4.6 (metrics with no min-n are never count-suppressed).
- **Journey steps:** J1.7, J4.4
- **Metrics:** OR case volume
- **Dependencies:** F-01, F-12, F-49, F-34, F-31, F-43.
- **Open questions:** none.

### F-15 First-case on-time start (FCOT) tile and first-case record list

- **Milestone:** M1
- **Description:** Monthly FCOT computed under the institutional definition verbatim (including any grace window and room-eligibility rule periop uses) so it reconciles to periop's report, min-n 4 first cases, numerator and denominator on the tile, and a first-case record list whose row count equals the denominator. The delay reason is shown on every row; it never changes the count.
- **User-facing behavior:** "First-case on-time start (FCOT), October: 5 of 7 first cases on time (71%). Definition: institutional FCOT, version 1 (periop). Reconciled to periop's October report. Compared to: neurosurgeons at your site (spread from month two)." The list of seven shows the 14th with wheels-in 07:41 against 07:30, on-time no, delay reason "anesthesia".
- **Acceptance criteria:**
  1. Numerator = first cases where wheels-in is at or before the scheduled start under the institutional definition, with the grace-window minutes and the room-eligibility rule read from the named parameters in F-100 (periop's confirmed values; the brief's 0 minutes kept as the flagged assumption); denominator = first cases credited to the surgeon in the month; for every surgeon and month the value equals periop's report or a written definition delta exists (F-81) before publish.
  2. Tile text form: "First-case on-time start (FCOT), <Month>: <n> of <d> first cases on time (<pct>%). Definition: institutional FCOT, version <v> (periop). Reconciled to periop's <Month> report. Compared to: neurosurgeons at your site (spread from month two)."
  3. With fewer than 4 first cases the tile shows the F-32 text with the actual count, for example "Not shown: 3 first cases this month; needs at least 4".
  4. Record list columns: date, room, procedure, scheduled start, wheels-in, on-time yes/no, delay reason as stored by periop, "your delay / not your delay" label once F-101 is signed, shared flag; row count equals d.
  5. A late first case with a non-surgeon delay reason (for example "anesthesia") shows on-time = no, shows the reason, and is still counted late.
  6. A blank stored delay reason renders as "(blank)" on the row, not as an omitted field.
- **Data required:** Periop extract (room, scheduled start, wheels-in timestamp, panel roles, delay reason events); periop's surgeon-level FCOT report; institutional FCOT definition text and version.
- **Rules enforced:** Brief: Bucket 2 FCOT (share of first cases wheeled in at or before scheduled start; monthly; needs at least 4 first cases; compared to neurosurgeons at your site; delay reason stored on each case); GR3, GR5, GR6; design doc (institutional definition verbatim; a department FCOT that differs from periop's is ruled out).
- **Journey steps:** J1.3, J1.4, J1.5, J4.4
- **Metrics:** First-case on-time start (FCOT)
- **Dependencies:** F-01, F-12, F-49, F-32, F-81, F-101; periop written confirmation of the FCOT definition.
- **Open questions:** OQ-01 (grace window and room eligibility, brief "to be confirmed"); OQ-12 (sustained delay-reason dispute and the count).

### F-16 Duration estimate accuracy tile and record list

- **Milestone:** M1
- **Description:** Monthly share of cases where actual in-room time was within 20% of booked or within 30 minutes, whichever is more forgiving, min-n 5 cases, with a record list showing both tests and which applied per case.
- **User-facing behavior:** "October: 11 of 14 cases within tolerance (79%). Needs at least 5 cases. Compared to: subspecialty peers at your site (spread from month two, if five or more)."
- **Acceptance criteria:**
  1. A case is within tolerance when |actual − booked| is at most 20% of booked minutes or at most 30 minutes, whichever is more forgiving; a fixture with booked 60, actual 85 is within tolerance (30-minute test); booked 200, actual 245 is not (45 minutes, 22.5%).
  2. The applied test is stored per case and shown in the list (F-12 return includes it).
  3. Tile text form: "<Month>: <n> of <d> cases within tolerance (<pct>%). Needs at least 5 cases." plus the comparator line.
  4. Record list columns: date, procedure, booked minutes, actual in-room minutes, within 20% yes/no, within 30 minutes yes/no, test applied, counted yes/no, shared flag; row count equals d.
  5. With fewer than 5 cases the tile shows the F-32 text with the actual count.
  6. The booked and actual fields used are the named periop fields recorded in the definition registry, and the definition page names them.
- **Data required:** Periop extract booked duration and actual in-room interval (named fields to confirm); cases credited under F-01.
- **Rules enforced:** Brief: Bucket 2 Duration estimate accuracy ("within 20% of what was booked (or within 30 minutes, whichever is more forgiving)"; monthly; needs at least 5 cases; subspecialty peers at your site); GR3, GR5, GR6.
- **Journey steps:** J1.6, J4.4
- **Metrics:** Duration estimate accuracy
- **Dependencies:** F-01, F-12, F-49, F-32; periop confirmation of the duration fields (design doc challenge 31).
- **Open questions:** OQ-39 (named booked vs actual duration fields).

### F-17 Same-day cancellations you could have prevented tile and record list

- **Milestone:** M1
- **Description:** Quarterly share of scheduled cases cancelled same-day for a reason code in the signed surgeon-attributable set, min-n 10 scheduled cases, an interim state in non-quarter-close months, and a record list of every same-day cancellation marked counted or not counted. Computed under periop's institutional definition verbatim.
- **User-facing behavior:** Mid-quarter: "Counted quarterly; the quarter closes 31 December. Scheduled cases so far this quarter: 24." At quarter close: "Q4: 1 of 61 scheduled cases cancelled same-day for a surgeon-attributable reason (1.6%). Needs at least 10 scheduled cases."
- **Acceptance criteria:**
  1. Denominator = scheduled cases in the quarter credited to the surgeon; numerator = same-day cancellations whose stored reason code is in the signed set (F-102); with d below 10 the F-32 text shows.
  2. In a non-quarter-close month the tile reads "Counted quarterly; the quarter closes <date>. Scheduled cases so far this quarter: <k>." and no partial rate (F-45).
  3. At quarter close the tile reads "Q<q>: <n> of <d> scheduled cases cancelled same-day for a surgeon-attributable reason (<pct>%). Needs at least 10 scheduled cases."
  4. Record list: every scheduled case that cancelled same-day with date, procedure, reason code as stored, in the surgeon-attributable set yes/no, counted against you yes/no; out-of-set rows read "not counted"; exclusion counts are stored with the number (F-51).
  5. Until F-102 is signed the tile renders "not computable: surgeon-attributable cancellation reason set pending periop leadership sign-off" and no rate is published.
  6. The quarterly value reconciles to periop's cancellation report for the same quarter or a written delta exists (F-81).
- **Data required:** Periop extract (scheduled cases, same-day cancellation flag, cancellation reason code); signed cancellation reason set; periop cancellation report.
- **Rules enforced:** Brief: Bucket 2 Same-day cancellations (reason code in the surgeon-attributable set as a share of scheduled cases; "Cancellations for reasons outside your control are not counted against you"; quarterly; needs at least 10 cases; neurosurgeons at your site); GR3, GR5, GR6; proposed default for the interim wording, derived from GR3's "the screen says why".
- **Journey steps:** J1.8, J4.4
- **Metrics:** Same-day cancellations you could have prevented
- **Dependencies:** F-01, F-12, F-102, F-45, F-49, F-32, F-81.
- **Open questions:** OQ-38 (which codes are surgeon-attributable; blank and Other); OQ-13 (sustained reason-code correction and the reconciliation gate).

### F-18 Block utilization: schedule load, tile, block-day list and "not applicable" state

- **Milestone:** M3
- **Description:** Until the block allocation and release schedule owner is named, the tile reads "Not in this release: needs the block allocation and release schedule; owner not yet named". Once registered, block minutes are attributed to the surgeon holding the block, released block is removed from the denominator, a surgeon with no allocated block sees "Not applicable: no allocated block this month" (a distinct stored state), and a block-day record list is stored. Never count-suppressed.
- **User-facing behavior:** A surgeon with block reads used over allocated minutes after released block is removed and opens a list of block days with allocated, released and used minutes; a surgeon without block reads "Not applicable".
- **Acceptance criteria:**
  1. Before this feature exists, the "Not in this release" text on every surgeon's Block utilization cell is owned by F-44 AC 1 (M1); this feature does not restate it. After registration (F-103) the cell shows a number or the "Not applicable" state below, never the F-44 text.
  2. After registration, utilization = used minutes in own block / (allocated minutes − released minutes) per month, credited to the surgeon holding the block, shown as a percentage with trend; comparator "neurosurgeons at your site" with peer count.
  3. A surgeon with zero allocated minutes in the month sees "Not applicable: no allocated block this month", stored as a state code distinct from suppression and feed-unavailable states; a surgeon with any allocated minutes never sees it; the tile stays present with the text (proposed default).
  4. Block-day record list: date, allocated minutes, released minutes, used minutes, counted yes/no; row count equals the number of block days in the denominator.
  5. The tile is never count-suppressed (no min-n in the brief).
- **Data required:** Block allocation and release schedule extract (allocated, released minutes per surgeon per block day); OR-log in-block used minutes; roster block flag.
- **Rules enforced:** Brief: Bucket 2 Block utilization ("minutes you used in your own block as a share of minutes allocated, after removing any block you released"; "(only if you have allocated block)"; monthly; neurosurgeons at your site); design doc challenge 24 (separate extract, separate owner); journeys J1.9 (three distinct "why not shown" states); GR5, GR6.
- **Journey steps:** J1.9, J4.1, J4.10, J4.13
- **Metrics:** Block utilization (only if you have allocated block)
- **Dependencies:** F-103, F-33, F-44, F-49, F-43; block schedule extract with a named owner.
- **Open questions:** OQ-34 ("not applicable" or absent; owner and schedule of the block extract).

### F-19 Length of stay (O/E) tile and admission record list

- **Milestone:** M6
- **Description:** Quarterly total observed days over Vizient expected days for the surgeon's included admissions, excluding super-long boarders with the excluded count shown, min-n 10 admissions, an interval, the system-wide subspecialty spread as an interval or funnel chart, the Vizient value, model version and as-of date, and an admission record list.
- **User-facing behavior:** Four quarters of O/E with intervals; "3 super-long boarders excluded (assumed more than 30 days until the institutional definition is confirmed)"; the admission list with a 25-day admission stating "credited to the index-operation surgeon by rule".
- **Acceptance criteria:**
  1. O/E = sum of observed days / sum of Vizient expected days over the quarter's included admissions; with fewer than 10 admissions the F-32 text shows; the tile shows the interval and the "no evidence of difference from peers" label when applicable (F-24).
  2. Admissions over the super-long boarder threshold are excluded and the tile reads "<k> super-long boarders excluded (assumed more than 30 days until the institutional definition is confirmed)".
  3. Record list columns: admission, index operation date, index surgeon, discharging attending, observed days, expected days, excluded yes/no, rule statement where applicable; counted rows equal the denominator and excluded rows are shown flagged.
  4. The tile shows the spread of subspecialty peers across the system as an interval or funnel chart, the Vizient value, and "Vizient model version <x>, as of <date>".
  5. Trend: four quarters of O/E, each with its interval.
- **Data required:** Vizient extract (observed days, expected days, model version, as-of); admissions credited under F-08; super-long boarder threshold (F-100).
- **Rules enforced:** Brief: Bucket 4 Length of stay (O/E) (total days over Vizient expected; super-long boarders left out, assumed more than 30 days; excluded count shown; quarterly; needs at least 10 admissions; subspecialty peers across the system and Vizient); GR1, GR3, GR4, GR5, GR6; design doc Constraints (Uncertainty).
- **Journey steps:** J1.15
- **Metrics:** Length of stay (O/E)
- **Dependencies:** F-08, F-24, F-97, F-49, F-32, F-12.
- **Open questions:** OQ-02 (threshold; restating LOS history when confirmed); OQ-30 (whole-encounter or post-operative days).

### F-20 30-day readmission (O/E) tile and admission list

- **Milestone:** M6
- **Description:** Quarterly readmissions within 30 days to any MGB hospital, any service, over Vizient's expected number, min-n 10 admissions, with an interval, the system-wide subspecialty spread, the Vizient value, model version and as-of, and a quarterly trend with intervals.
- **User-facing behavior:** The readmission O/E with its interval and the peer spread, the model version and as-of date, and an admission list showing which admissions readmitted and where.
- **Acceptance criteria:**
  1. Observed = readmissions within 30 days to any MGB hospital, any service, for the surgeon's admissions; expected = Vizient's expected number; O/E shown with an interval; with fewer than 10 admissions the F-32 text shows.
  2. The tile shows the spread of subspecialty peers across the system per F-24, the Vizient value, and "Vizient model version <x>, as of <date>".
  3. Trend: quarterly O/E points with intervals.
  4. Record list of admissions with readmitted yes/no, readmitting hospital, days to readmission and a dispute action; row count equals the denominator.
- **Data required:** Vizient extract with expected readmissions; MGB-wide readmission events per admission; admissions credited under F-08.
- **Rules enforced:** Brief: Bucket 4 30-day readmission (O/E) ("readmissions within 30 days to any MGB hospital, any service, divided by Vizient's expected number"; quarterly; needs at least 10 admissions; subspecialty peers across the system and Vizient); GR3, GR4, GR6.
- **Journey steps:** J1.18
- **Metrics:** 30-day readmission (O/E)
- **Dependencies:** F-08, F-24, F-97, F-49, F-32.
- **Open questions:** OQ-29 (observed universe any MGB hospital against a hospital-scoped expected value).

### F-21 In-hospital mortality (O/E) tile and record list

- **Milestone:** M6
- **Description:** Rolling-12-month deaths during the surgical admission over Vizient expected deaths, min-n 30 admissions, an interval and the "no evidence of difference" label, a record list of each death with QI and Vizient provenance and a dispute action, and a trend of four rolling-12-month points at quarter closes (proposed default).
- **User-facing behavior:** Case A: "Not shown: 24 admissions in the last 12 months; needs at least 30." Case B: "O/E 1.7, interval 0.04 to 9.3; no evidence of difference from peers." with the one death listed with its provenance.
- **Acceptance criteria:**
  1. The window is rolling 12 months; with fewer than 30 admissions the tile reads "Not shown: <n> admissions in the last 12 months; needs at least 30".
  2. With 35 admissions, 1 death and 0.6 expected the tile reads "O/E 1.7, interval 0.04 to 9.3; no evidence of difference from peers".
  3. The record list shows each death with QI database and Vizient provenance, model version, as-of date and a dispute action for use if the index operation was not the surgeon's (F-67).
  4. Trend: four rolling-12-month points, one per quarter close, each with its interval.
  5. Comparator line: "neurosurgeons across the system, and Vizient"; the tile states "Rolling 12 months to <date>" (F-45).
- **Data required:** Vizient expected deaths per admission with model version; QI database death events; admissions credited under F-08.
- **Rules enforced:** Brief: Bucket 4 In-hospital mortality (O/E) (deaths during the surgical admission over Vizient expected; "rolling 12 months only, because counts are small"; needs at least 30 admissions; neurosurgeons across the system and Vizient); GR2, GR3, GR5, GR6; design doc Premise 12.
- **Journey steps:** J1.16
- **Metrics:** In-hospital mortality (O/E)
- **Dependencies:** F-08, F-24, F-97, F-49, F-32, F-45.
- **Open questions:** OQ-27 (mortality on the individual view or moved to division and site views); OQ-25 (trend form).

### F-22 Case mix index tile

- **Milestone:** M6
- **Description:** Quarterly mean Vizient relative weight over the surgeon's admissions, min-n 10 admissions, shown against the anonymous spread of subspecialty peers across the system and the Vizient value, with trend. Compared across the system, so it is not withheld by an at-site group under five.
- **User-facing behavior:** The surgeon's CMI against the system-wide subspecialty spread and Vizient, with a quarterly trend, and an admission list with the relative weight per admission.
- **Acceptance criteria:**
  1. Value = mean Vizient relative weight per admission over the quarter; with fewer than 10 admissions the F-32 text shows.
  2. The comparator is subspecialty peers across the system and Vizient; the group is computed system-wide (F-31) and a test with an at-site subspecialty group of 3 and a system-wide group of 12 renders the spread.
  3. Trend: quarterly points.
  4. Record list of admissions with relative weight per admission and a dispute action; row count equals the denominator.
- **Data required:** Vizient relative weight per admission; admissions credited under F-08; system-wide roster by subspecialty.
- **Rules enforced:** Brief: Bucket 1 Case mix index (Vizient relative weight per admission; quarterly; needs at least 10 admissions; subspecialty peers across the system and Vizient; "your value against the anonymous peer spread, with trend"); GR3, GR4, GR6.
- **Journey steps:** J1.18
- **Metrics:** Case mix index
- **Dependencies:** F-08, F-31, F-46, F-49, F-32.
- **Open questions:** OQ-53 (does a system-wide subspecialty roster exist as a dated dimension outside the department).

### F-23 QI-sourced complication metrics with "self-reported, unadjusted" label

- **Milestone:** M6
- **Description:** Unplanned return to the OR within 30 days, Surgical site infection, VTE within 30 days and CSF leak requiring intervention (neurosurgery only), each computed as a share of the surgeon's cases from QI database events only (F-09), labeled "self-reported, unadjusted; source: department QI database, as of <date>", with an interval, a quarterly trend with intervals, the brief's min-n and comparator, and row statements for events performed by another surgeon. Unplanned return to ICU (pending confirmation of data source) is not computed here; it is F-110.
- **User-facing behavior:** Four rates with intervals; on the return-to-OR list a reoperation performed by a partner carries "counts by any surgeon, per definition".
- **Acceptance criteria:**
  1. Each metric is computed only from QI events joined to the surgeon's index cases (F-09); a fixture event with no index case is excluded and counted on the exception list.
  2. Min-n per the brief: Unplanned return to the OR within 30 days 10 cases; Surgical site infection 20 cases; VTE within 30 days 20 cases; CSF leak requiring intervention (neurosurgery only) 10 eligible cases; below min-n the F-32 text shows.
  3. Every tile carries exactly "self-reported, unadjusted; source: department QI database, as of <date>" and "Lower is better".
  4. The rate shows an interval and the trend is quarterly points with intervals; the spread follows F-24 against the brief's comparator (subspecialty peers across the system for return to OR and CSF leak; neurosurgeons across the system for SSI and VTE).
  5. A return-to-OR row whose reoperation was by another surgeon reads "counts by any surgeon, per definition"; every record list row carries a dispute action.
  6. This feature computes nothing for Unplanned return to ICU (pending confirmation of data source); that tile renders F-44's pending text until F-103 registers a source, after which F-110 computes it.
- **Data required:** QI database events with index case id and as-of date; implant flag per case; cases credited under F-01.
- **Rules enforced:** Brief: Bucket 4 (complications from the QI database, never hand-entered; "Where there is no risk model the number is labeled 'unadjusted'"; the four definitions, windows and min-n); design doc Constraints ("self-reported, unadjusted" label); GR3, GR5, GR6.
- **Journey steps:** J1.17
- **Metrics:** QI four
- **Dependencies:** F-09, F-24, F-97, F-49, F-32.
- **Open questions:** OQ-32 (site-restricted QI comparison; NHSN for SSI).

### F-24 Risk-model labeling, intervals and "no evidence of difference"

- **Milestone:** M6
- **Description:** Each metric declares whether a risk model backs it. Where Vizient has a model the number is stored and shown as observed divided by expected with the model version and Vizient as-of date; where no model exists the number carries "unadjusted". Every O/E and rate metric stores and renders an interval on the tile value and every trend point; the peer spread for these metrics is an interval or funnel chart, never a bar chart of point estimates; a surgeon whose interval includes the peer median is labeled "no evidence of difference from peers"; O/E tiles explain the 1.0 reference.
- **User-facing behavior:** With 35 admissions, one death and 0.6 expected the surgeon reads "O/E 1.7, interval 0.04 to 9.3; no evidence of difference from peers" rather than a bar showing 1.7.
- **Acceptance criteria:**
  1. Every metric in the registry has a risk-model attribute (Vizient model, none); the label rendered is derived from it, never typed per tile.
  2. O/E numbers store observed, expected, ratio, interval bounds, model version and Vizient as-of date; a Vizient model refresh that changes expected values writes a restatement (F-96).
  3. Every O/E metric and every rate metric shows an interval on the tile value and on every trend point; a published O/E or rate without interval bounds fails the run.
  4. The peer spread for these metrics is drawn as an interval or funnel chart; an automated scan of generated artifacts finds no bar chart of point estimates for any Bucket 4 metric.
  5. When the surgeon's interval includes the peer median the tile carries "no evidence of difference from peers" and the flag is stored with the number.
  6. Every O/E tile carries "1.0 means exactly as expected; below 1.0 is better".
  7. The worked case reproduces: observed 1, expected 0.6 renders "O/E 1.7, interval 0.04 to 9.3" (95% exact interval); the interval method is recorded in the definition registry (F-13).
- **Data required:** Observed and expected counts per surgeon per period; peer median per group; interval method as versioned configuration; Vizient model version; QI as-of date.
- **Rules enforced:** Brief: Bucket 4 (O/E where Vizient has a risk model; "unadjusted" where not; 1.0 means exactly as expected); design doc Constraints (Uncertainty); design doc Premise 12.
- **Journey steps:** J1.15, J1.16, J1.17, J1.18, J4.10
- **Metrics:** All O/E and rate metrics (Bucket 4)
- **Dependencies:** F-08, F-09, F-13, F-46, F-43, F-51.
- **Open questions:** OQ-27; OQ-28 (interval method, a build choice to record).

### F-25 Third-next-available appointment tile and sample list

- **Milestone:** M7
- **Description:** Monthly median, over regular samples, of days until the surgeon's third next open new-patient slot, min-n 2 samples, "Lower is better", compared to subspecialty peers at the site, with a monthly trend line and a sample list.
- **User-facing behavior:** Median days with "Lower is better", the monthly trend, and the samples behind the median.
- **Acceptance criteria:**
  1. Value = median across the month's samples of days to the third next open new-patient slot; a fixture of samples 9, 12, 30 yields 12.
  2. With fewer than 2 samples the tile reads "Not shown: <n> samples this month; needs at least 2".
  3. The tile carries "Lower is better" and the comparator "subspecialty peers at your site" with peer count.
  4. Trend: monthly line. Record list: one row per sample with sample date and days; row count equals the sample count.
- **Data required:** Sampling process output (sample date, days) from F-10.
- **Rules enforced:** Brief: Bucket 3 Third-next-available appointment ("third next open new-patient slot, sampled regularly and reported as the median"; monthly; needs at least 2 samples; subspecialty peers at your site; "Lower is better"); GR3, GR5, GR6.
- **Journey steps:** J1.19
- **Metrics:** Third-next-available appointment
- **Dependencies:** F-10, F-103, F-49, F-32, F-43.
- **Open questions:** OQ-36 (sampling system and schedule).

### F-26 New patient visits tile and visit list

- **Milestone:** M7
- **Description:** Monthly count of completed new-patient clinic visits credited to the rendering provider under a named field, never count-suppressed, with a monthly trend line and a visit record list.
- **User-facing behavior:** The count of new-patient visits with a trend and the list of visits.
- **Acceptance criteria:**
  1. Value = count of completed new-patient visits in the month credited to the surgeon as rendering provider under the named field (F-10).
  2. The tile is never count-suppressed; comparator "subspecialty peers at your site" with peer count.
  3. Trend: monthly line. Record list: one row per visit with date and the new-patient rule applied; row count equals the count.
- **Data required:** Clinic visits with rendering provider field and new-patient rule (F-10).
- **Rules enforced:** Brief: Bucket 1 New patient visits ("completed new-patient clinic visits"; monthly; subspecialty peers at your site; count with a trend line); GR1, GR5, GR6.
- **Journey steps:** J1.19
- **Metrics:** New patient visits
- **Dependencies:** F-10, F-103, F-49, F-43.
- **Open questions:** OQ-39 (visit attribution field and new-patient rule).

### F-27 Clinic notes closed within 72 hours tile and visit list

- **Milestone:** M7
- **Description:** Monthly share of the surgeon's clinic visits with the note signed within 72 hours, min-n 10 visits, compared to neurosurgeons at the site, with a monthly trend line and a visit-level list showing note-signed time and met or not met.
- **User-facing behavior:** The share with its trend and a list of visits showing when each note was signed and whether it met 72 hours.
- **Acceptance criteria:**
  1. Value = visits with note signed within 72 hours of the visit / visits in the closed month; a fixture with 8 of 10 met yields 80%.
  2. With fewer than 10 visits the tile reads "Not shown: <n> visits this month; needs at least 10".
  3. Record list columns: visit date, note-signed timestamp, hours to signature, met yes/no; row count equals the denominator; dispute action on every row.
  4. Trend: monthly line; comparator "neurosurgeons at your site".
  5. Only closed months are shown (F-84); visits still inside their 72-hour window at month close are handled by the versioned rule in F-100.
- **Data required:** Clinic visits with rendering provider and note-signed timestamp (field to confirm), from F-10.
- **Rules enforced:** Brief: Bucket 2 Clinic notes closed within 72 hours ("the share of your clinic visits with the note signed within 72 hours"; monthly; needs at least 10 visits; neurosurgeons at your site); GR3, GR5, GR6.
- **Journey steps:** J1.19
- **Metrics:** Clinic notes closed within 72 hours
- **Dependencies:** F-10, F-103, F-84, F-49, F-32, F-43, F-100.
- **Open questions:** OQ-39 (which timestamp defines "signed"); OQ-24 (72-hour window at month close).

### F-28 Survey measure definitions as versioned code

- **Milestone:** M4
- **Description:** The four Bucket 5 measures computed per response from the survey extract as one versioned function each: Net promoter score (percent promoters minus percent detractors on "would you recommend this provider") and the three item measures (share of responses giving the top score). Each is computed per survey month and as the surgeon's year average, and carried beside the MGB average from the feed. Comment text is never an input.
- **User-facing behavior:** The surgeon sees each measure's value with its definition version and can follow it to the definition and the response list. The analyst sees per surgeon and month the four values, response count, version id and as-of date.
- **Acceptance criteria:**
  1. Net promoter score for a month = (promoters minus detractors) / responses × 100 from per-response scores; a fixture of 20 responses with 12 promoters and 3 detractors yields 45.
  2. Each item measure = top-score responses / responses in the month; a fixture of 7 top scores of 10 yields 70%.
  3. Every stored number carries a definition version id, the response ids, the response count and the source as-of date; a number missing any of the four fails the load before publish.
  4. The year average and the MGB average are stored as separate values with their basis recorded; changing how either is computed creates a new definition version.
  5. A static check confirms no measure function reads the comments table; a runtime test with comment text altered produces identical values.
- **Data required:** Per-response extract (response id, survey month, provider named, four item scores, comment-present flag); vendor scale and promoter/detractor thresholds; MGB average per measure per month; definition registry entries.
- **Rules enforced:** Brief: Bucket 5 (year average, each of the past three months, MGB average; Net promoter score definition; item measures "the share of responses giving the top score"; comments "never counted, compared, or rolled up"); brief header (versioned definitions); GR5.
- **Journey steps:** J3.1, J3.2, J3.10
- **Metrics:** Bucket 5 measures
- **Dependencies:** F-11, F-12, F-13.
- **Open questions:** OQ-44 (MGB average scope; year average and hidden months; promoter and detractor thresholds).

### F-29 Decision-triggered recompute, as logged and as adjudicated

- **Milestone:** M1
- **Description:** On a decision the metric engine recomputes, same day, every metric and period the record feeds for the surgeon (and the receiving clinician on a re-attribution) under the definition version stamped on the original number, producing an "as logged" count from the source crediting and an "as adjudicated" count from the overrides; re-checks min-n and suppression; rebuilds the peer spread; restates the trend point. Pending disputes leave the number unchanged. A delay-reason override changes the row label, never the FCOT count.
- **User-facing behavior:** After the two delay-reason disputes are sustained the tile still reads 6 of 10 (60%); after the re-attribution is sustained it reads as logged 60% (6 of 10), as adjudicated 67% (6 of 9).
- **Acceptance criteria:**
  1. While a dispute is open the published number, suppression status and spread are unchanged.
  2. Within the same business day of a decision every metric and period the record feeds is recomputed for every affected surgeon under the definition version stamped on the original number.
  3. A sustained delay-reason override leaves as logged equal to as adjudicated for First-case on-time start (FCOT) and changes only the row's corrected reason and "your delay / not your delay" label.
  4. A sustained re-attribution produces as logged and as adjudicated counts and denominators for both surgeons; the record appears in exactly one surgeon's adjudicated lists.
  5. Min-n and the five-peer rule are re-evaluated for both surgeons; the spread for the period is rebuilt and its render logged (F-36).
  6. The recompute is logged as a restatement of the period with the dispute id as cause (F-96); the trend history for that period is recomputed, never left stale.
- **Data required:** Ledger records with overrides; metric functions (F-12); roster peer groups as of the period; trend history.
- **Rules enforced:** GR3, GR4, GR6; design doc Constraints (Disputes): "as logged" and "as adjudicated" side by side; design doc: institutional FCOT verbatim, "two numbers for the same metric" ruled out; journeys J4.5 (a re-attribution is an expected reconciliation delta; a delay-reason override is never a delta).
- **Journey steps:** J2.3, J2.7, J2.9, J2.10
- **Metrics:** All with a record list
- **Dependencies:** F-12, F-32, F-36, F-05, F-96.
- **Open questions:** OQ-18 (immediate or next-load recompute; pending disputes held out of the number); OQ-12.

### F-30 Version-scoped recompute

- **Milestone:** M1
- **Description:** When a new definition or configuration version is published, recomputes the affected metrics for the periods the version is effective for, stamping numbers and record lists with the new version id. Earlier periods keep their original stamp unless explicitly restated. The Length of stay (O/E) excluded count is recomputed under a confirmed threshold.
- **User-facing behavior:** The analyst selects the version, sees which metrics and periods will recompute, runs it, and sees new numbers stamped with the version. Surgeon trends show the version boundary (F-96).
- **Acceptance criteria:**
  1. Only metrics whose definition or configuration changed in the version are recomputed; unaffected metrics keep their stamps.
  2. Recomputed numbers and record lists carry the new version id; periods before effective-from keep their prior version id unless a restatement is explicitly requested and logged.
  3. The recompute re-runs the suppression engine (F-32) and the reconciliation gate (F-81) for the affected periods before republish.
  4. For Length of stay (O/E) the excluded super-long-boarder count is recomputed and stored under the new threshold.
- **Data required:** Definition registry versions; configuration versions; ledger records for affected periods.
- **Rules enforced:** GR5, GR6; journeys J4.14 ("Earlier periods keep their original stamp unless explicitly restated").
- **Journey steps:** J4.14
- **Metrics:** All
- **Dependencies:** F-13, F-100, F-96, F-81, F-32.
- **Open questions:** OQ-35 (restate earlier periods or freeze them).

### F-109 Referral-to-visit days tile and referral list

- **Milestone:** M7
- **Description:** Quarterly median days from the date a referral is received to the date the patient is seen, over referrals whose resulting completed visit is credited to the surgeon as rendering provider, min-n 10 visits, "Lower is better", compared to subspecialty peers at your site, with a quarterly trend and a referral record list. The function is registered from M1 but invoked only for periods on or after the effective-from date F-103 records for the referral work queue (attribution rule: "referral received date to the resulting visit's rendering provider"); until then every tile carries F-44's pending text. The metric keeps the brief's name, including its "(pending confirmation of data source)" marker, until the owner issues a new brief version.
- **User-facing behavior:** Before registration: "Data source pending confirmation" with the definition link. After: "Q2: median 18 days from referral to visit (23 visits). Lower is better. Compared to: subspecialty peers at your site (spread at quarter close)." with a list of referrals and days.
- **Acceptance criteria:**
  1. Until F-103 holds a registration with an effective-from period for this metric, the function is registered (F-12 AC 1) but not invoked, and every surgeon's tile carries the exact F-44 text "Data source pending confirmation"; after registration it computes only for periods on or after effective-from, and earlier periods keep the pending text unless explicitly restated (F-96).
  2. Value = median over the quarter of (visit date minus referral received date) in days, over referrals whose resulting completed visit is credited to the surgeon as rendering provider under the F-10 field; a fixture with days 5, 12, 18, 30, 41 yields 18.
  3. With fewer than 10 counted visits in the quarter the tile shows the F-32 text "Not shown: <n> visits this quarter; needs at least 10".
  4. The tile carries "Lower is better", the comparator "subspecialty peers at your site" with peer count (F-34), and the F-45 interim text in non-quarter-close months.
  5. Record list columns: referral received date, visit date, days, counted yes/no with the exclusion reason where not counted ("no reliable received date"; "visit not completed"); counted rows equal the denominator; every row carries a dispute action with "rendering provider" as the disputable field.
  6. Referrals with no reliable received date are excluded, the count is stored on the number (F-51) and the tile reads "<k> referrals excluded: no received date"; the share of such referrals per period is reported to the analyst (design doc challenge 30).
  7. Trend: quarterly points (F-43).
- **Data required:** Referral work queue extract (referral id, received date, resulting visit id); clinic visits credited under F-10; source registry row (F-103).
- **Rules enforced:** Brief: Bucket 3 Referral-to-visit days ("median days from when a referral is received to when the patient is seen"; quarterly; needs at least 10 visits; subspecialty peers at your site; "Lower is better"; "(pending confirmation of data source)"); GR1 ("Clinic visits go to the rendering provider"); GR3, GR5, GR6; journeys J4.13 attribution rule; design doc challenge 30.
- **Journey steps:** J1.19, J4.13
- **Metrics:** Referral-to-visit days (pending confirmation of data source)
- **Dependencies:** F-103, F-10, F-12, F-32, F-34, F-43, F-44, F-45, F-49, F-51.
- **Open questions:** OQ-04 (data source; share of referrals with no reliable received date).

### F-110 Unplanned return to ICU tile and step-down list

- **Milestone:** M7
- **Description:** Quarterly share of the surgeon's ICU admissions that returned to the ICU unexpectedly after stepping down, where "unexpectedly" is the ADT proxy rule registered in F-103 (attribution rule: "ICU step-down and return event to the admission's index-operation surgeon"; proxy window a named F-100 parameter, OQ-05), min-n 10 admissions, "Lower is better", compared to neurosurgeons across the system, with an interval and quarterly trend per F-24 and an admission-level step-down list. It is not a QI-database metric and has no risk model, so it carries the brief's "unadjusted" label and its ADT source and as-of date. Pending text until registration; the brief's name and marker are kept until a new brief version.
- **User-facing behavior:** Before registration: "Data source pending confirmation". After: "Q2: 2 of 14 ICU admissions returned to the ICU unexpectedly after step-down (14%, interval <lo> to <hi>). Lower is better. Unadjusted; source: ADT transfers, as of <date>. Compared to: neurosurgeons across the system (<N> surgeons)."
- **Acceptance criteria:**
  1. Until F-103 holds a registration with an effective-from period for this metric, the function is registered but not invoked and every surgeon's tile carries the exact F-44 text "Data source pending confirmation"; after registration it computes only for periods on or after effective-from.
  2. Denominator = admissions credited to the surgeon under the index-operation rule (F-08) with at least one ICU stay and a step-down in the quarter; numerator = those with a return to the ICU within the registered proxy window after step-down (F-100 parameter); a fixture with 14 such admissions, 2 returns inside the window and 1 outside it yields 2 of 14.
  3. With fewer than 10 admissions the tile shows the F-32 text "Not shown: <n> admissions this quarter; needs at least 10".
  4. The tile carries "Lower is better", "unadjusted", "source: ADT transfers, as of <date>" (F-97), the comparator "neurosurgeons across the system" with peer count (F-34), an interval and the spread form per F-24, and the F-45 interim text in non-quarter-close months.
  5. Record list columns: admission, index operation date, index surgeon, step-down date, return date or "none", hours from step-down to return, counted yes/no; counted rows equal the denominator; every row carries a dispute action with "index-operation surgeon" as the disputable field, routed under F-67's rule (chair when the chief is the index or discharging surgeon).
  6. Trend: quarterly points, each with its interval (F-24, F-43).
  7. The proxy window is a named parameter in F-100; a change is a new version with the boundary marked on the trend (F-96).
- **Data required:** ADT unit transfer extract (admission id, unit, transfer-in and transfer-out timestamps); admissions credited under F-08; source registry row (F-103); proxy window (F-100).
- **Rules enforced:** Brief: Bucket 4 Unplanned return to ICU ("the share of your ICU patients who were transferred back to the ICU unexpectedly after stepping down"; quarterly; needs at least 10 admissions; neurosurgeons across the system; "Lower is better"; "(pending confirmation of data source)"); brief: Bucket 4 ("Where there is no risk model the number is labeled 'unadjusted'"); GR1 (index-operation surgeon); GR3, GR4, GR5, GR6; design doc Open Questions (ADT proxy rule for "unexpected" ICU return); journeys J4.13 attribution rule.
- **Journey steps:** J1.17, J4.13
- **Metrics:** Unplanned return to ICU (pending confirmation of data source)
- **Dependencies:** F-103, F-08, F-12, F-24, F-32, F-34, F-43, F-44, F-45, F-49, F-67, F-97, F-100.
- **Open questions:** OQ-05 (data source; ADT proxy window).

---

## Suppression and peer groups

Suppression is written as code-level rules with the brief's min-n table. Every suppressed cell carries a worded reason with counts; no cell is ever blank. Peer groups come from the dated roster and exclude the viewer.

### F-31 Peer group computation from the dated roster

- **Milestone:** M1
- **Description:** Per viewer, metric and period: the peer group is dated-roster members with the same site (and subspecialty where the brief says so) as of the period, excluding the viewer and any opted-out surgeon; non-attendees of step zero stay in denominators but are flagged as no-spread viewers; multi-site surgeons get one row per site; cross-system metrics use the comparator the brief names. The output stores membership, size and the count of peers clearing the metric's min-n.
- **User-facing behavior:** The surgeon sees the peer count on each tile and, from month two, a spread only when the group qualifies. The analyst sees per surgeon and metric the comparator, roster peer count, count clearing min-n, and whether a spread renders.
- **Acceptance criteria:**
  1. For First-case on-time start (FCOT), Same-day cancellations you could have prevented and Block utilization (only if you have allocated block) the group is neurosurgeons at the viewer's site; for OR case volume and Duration estimate accuracy it is subspecialty peers at the site; for cross-system metrics it is the comparator named in the brief; a diff of comparators against the brief is empty.
  2. The viewer is never counted in their own group; a surgeon with opt_out = yes is excluded from every group; a non-attendee remains in others' groups and is flagged no-spread.
  3. A surgeon on the roster at more than one site receives one peer-group row per site; no pooled row is produced by default.
  4. The output stores, per viewer-metric-period, the number of peers clearing that metric's min-n; a spread is eligible only if that number is at least 5.
  5. Group membership and size are stored per period with an effective date; a roster change triggers recomputation from the change date (F-39).
- **Data required:** Dated roster (site, subspecialty, faculty dates, opt-out, attendee); per-surgeon record counts per metric (F-32); comparator per metric (F-100).
- **Rules enforced:** GR3 (peer group under five); GR4; design doc Constraints (Suppression): dated-roster members with the same site (and subspecialty where the brief says so), excluding the viewer; at least five peers each clearing min-n; per-site rows; design doc Premise 11.
- **Journey steps:** J1.7, J1.10, J4.3
- **Metrics:** All with a peer comparison
- **Dependencies:** F-99, F-100, F-32.
- **Open questions:** OQ-07 (counting rule); OQ-08 (pooled row for multi-site surgeons); OQ-09 (opt-out and a group of five); OQ-10 (non-attendance).

### F-32 Suppression engine with the brief's min-n table and 100%-reason gate

- **Milestone:** M1
- **Description:** For each surgeon and metric, compares the record count with the metric's min-n and the peer group with the five-peer rule, stores a suppression state (shown, count-suppressed, peer-suppressed) and a reason text with counts from the catalogue (F-33), produces the analyst's suppression report, and fails the run if any suppressed cell has a blank reason. Under peer-under-five the surgeon's own value and trend stay visible (proposed default). Metrics with no min-n are never count-suppressed.
- **User-facing behavior:** Instead of a blank the surgeon reads "Not shown: 3 first cases this month; needs at least 4" or "Peer comparison not shown: 4 peers in your subspecialty at this site cleared at least 5 cases this month; needs 5 (you are not counted)". The analyst sees a surgeon-by-metric grid of states.
- **Acceptance criteria:**
  1. The min-n table matches the brief exactly: Case mix index 10 admissions; First-case on-time start (FCOT) 4 first cases; Duration estimate accuracy 5 cases; Same-day cancellations you could have prevented 10 cases; Clinic notes closed within 72 hours 10 visits; Third-next-available appointment 2 samples; Referral-to-visit days (pending confirmation of data source) 10 visits; Length of stay (O/E) 10 admissions; 30-day readmission (O/E) 10 admissions; In-hospital mortality (O/E) 30 admissions; Unplanned return to the OR within 30 days 10 cases; Surgical site infection 20 cases; VTE within 30 days 20 cases; CSF leak requiring intervention (neurosurgery only) 10 cases; Unplanned return to ICU (pending confirmation of data source) 10 admissions; Bucket 5 measures a month with fewer than 10 responses hidden for that month only.
  2. OR case volume, New patient visits, Work RVUs — live tracker, Block utilization (only if you have allocated block) and M&M attendance are never count-suppressed.
  3. A metric below min-n stores state "count-suppressed" with the text "Not shown: <count> <unit> this <period>; needs at least <min-n>" using the metric's own unit and the surgeon's actual count.
  4. A metric whose peer group has fewer than five peers clearing min-n stores "peer-suppressed" with the F-33 `peer-under-five` template "Peer comparison not shown: <k> peers in your <group> <scope> cleared at least <min-n> <unit> this <period>; needs 5 (you are not counted)", with <scope> "at this site" or "across the system" from the metric's comparator; the surgeon's own value and trend remain published.
  5. The identical reason string for a given cell appears on the email, the hosted view and the suppression report.
  6. 100% of suppressed cells carry a non-empty reason; the run fails on any blank.
  7. Thresholds are read from the versioned configuration table (F-100) so old periods keep the thresholds they were suppressed under.
- **Data required:** Record counts per surgeon-metric-period (F-51); peer-group output (F-31); configuration min-n and comparator; reason catalogue (F-33).
- **Rules enforced:** GR3 ("A number is not shown if it is based on too few cases ... or if the peer group has fewer than five surgeons. The screen says why instead of showing a blank"); brief min-n values; brief: Bucket 5 (a month with fewer than 10 responses hidden for that month only); design doc Success Criteria (Suppression).
- **Journey steps:** J1.3, J1.6, J1.7, J1.8, J1.10, J1.16, J1.17, J4.6, J4.12
- **Metrics:** All with a min-n or a peer comparison
- **Dependencies:** F-31, F-51, F-33, F-100.
- **Open questions:** OQ-11 (does "a number is not shown" hide the surgeon's own value or only the comparison).

### F-33 "Why not shown" reason text catalogue

- **Milestone:** M1
- **Description:** A single versioned catalogue, keyed by state, of every worded reason a cell shows instead of a number, every spread-count sentence, every dispute clause appended to a reason, and every page-level refusal or error text, with count placeholders, used identically on every artifact (email, hosted view, chief summary, definition page, analyst reports). States: min-n suppression; peer-under-five (site or system scope); hidden month (Bucket 5); spread count; dispute clause; not computable (field missing); feed not received; not in this release; not applicable; data source pending confirmation; counted quarterly; history from <date>; restated; not computed in this cycle; not reconciled; page-level states (identity not on roster, no published period, not authorized, leader gate, load failure). Any feature that introduces a new wording of these kinds registers it here.
- **User-facing behavior:** Wherever a number is absent the reader sees catalogue text with counts filled in; the wording is the same in the email and the hosted view.
- **Acceptance criteria:**
  1. The catalogue contains at least these templates, by key, with this exact wording. Cell states: `min-n` "Not shown: <n> <unit> this <period>; needs at least <min-n>"; `peer-under-five` "Peer comparison not shown: <n> peers in your <group> <scope> cleared at least <min-n> <unit> this <period>; needs 5 (you are not counted)", where <group> is "subspecialty" or "department" and <scope> is "at this site" or "across the system", both derived from the metric's comparator in F-100 (so "4 peers in your subspecialty at this site" and "3 peers in your department across the system" are both instances); `hidden-month` "Hidden: <n> responses this month; needs at least 10" (Bucket 5, F-41); `not-computable` "not computable: <field> not in extract"; `feed-not-received` "<feed> for <period> not received as of <date>"; `not-in-release` "Not in this release: needs <feed>; owner not yet named"; `not-applicable` "Not applicable: <condition>"; `pending-source` "Data source pending confirmation"; `counted-quarterly` "Counted quarterly; the quarter closes <date>"; `history-from` "history from <date>"; `not-computed` "not computed in this cycle". Spread sentences: `spread-count` "<Comparator group>: <k> peers, each with at least <min-n> <unit> (you are not counted). Your position marked." (F-46); `spread-count-survey` "<N> neurosurgeons across the system" (F-40). Dispute clauses appended to any cell state (F-38): `dispute-hidden` " (<n> case(s) re-credited by dispute <id> on <date>)"; `dispute-shown` "Now shown: <n> <unit> (<n> case(s) re-credited to you by dispute <id> on <date>)". Analyst-facing: `not-reconciled` "not reconciled: periop does not report" (F-81). Page-level (hosted, F-85, F-88, F-89): `leader-gate` "Available to the direct leader from <date>"; `not-on-roster` "No scorecard: your identity is not on the department roster as of today. Contact <analyst mailbox>."; `no-period` "No period has been published yet. The first period publishes after <date>."; `not-authorized` "Not authorized for this record."; `load-failure` "The page could not be loaded. Your data has not changed. Try again or contact <analyst mailbox>."
  2. Every template renders with its placeholders filled; a rendered reason containing an unfilled placeholder fails the run.
  3. The email generator, the hosted view, the chief summary, the analyst reports and the decision email read the same catalogue entry by key; a wording change is a new catalogue version recorded with date; a test renders each key on each artifact type and compares the strings.
  4. The roster-change variant carries the as-of date: "Peer comparison not shown: <n> peers in your <group> <scope> cleared min-n as of <date>; needs 5 (you are not counted)".
  5. Any absent-cell, spread-count, refusal or page-state string in a generated artifact that does not match a catalogue key fails the publish check; a feature that needs a new wording adds it here by a new catalogue version before it can render.
- **Data required:** Catalogue store (versioned); counts from the suppression engine, field check and feed health check.
- **Rules enforced:** GR3 ("The screen says why instead of showing a blank"); journeys J4.6 (same wording on every artifact); journeys J1.9 (three distinct "why not shown" states, never a blank).
- **Journey steps:** J4.1, J4.6, J4.8, J4.10, J4.13, J4.16
- **Metrics:** All
- **Dependencies:** none (foundation).
- **Later consumers:** F-40, F-41 (M4); F-85, F-88 (M2 and M4) read the survey and page-level keys.
- **Open questions:** OQ-34 (block utilization "not applicable" or absent).

### F-34 Comparator statement and peer count on every tile

- **Milestone:** M1
- **Description:** Every tile states its comparator in the brief's words and, from month one, the number of surgeons in the viewer's peer group for that metric (excluding the viewer), so the surgeon knows before month two whether a spread can ever render. Self-only metrics say "No peer comparison".
- **User-facing behavior:** "Compared to: subspecialty peers at your site (4 surgeons; spread from month two)."
- **Acceptance criteria:**
  1. Every tile with a comparator shows "Compared to: <comparator>" using the brief's comparator text for that metric verbatim.
  2. From month one the tile shows the count of surgeons in the viewer's peer group for that metric (F-31), excluding the viewer.
  3. In month one every comparator line ends "(spread from month two)"; from month two it ends with the spread or the F-32 peer-under-five text.
  4. Work RVUs — live tracker and M&M attendance show "No peer comparison" and no peer count.
- **Data required:** Comparator per metric (F-100); peer-group size per viewer per metric per period (F-31).
- **Rules enforced:** Brief "Compared to" line per metric; brief: Bucket 1 wRVU ("yourself last year only. No peer comparison and no target"); brief: Bucket 6 ("No peer comparison"); GR4.
- **Journey steps:** J1.3, J1.6, J1.7, J1.8, J1.10
- **Metrics:** All
- **Dependencies:** F-31, F-100.
- **Open questions:** OQ-07 (counting rule affects the count shown).

### F-35 Spread eligibility at publish: month one, attendee, opt-out

- **Milestone:** M1
- **Description:** Decides per surgeon and period whether the anonymous spread is written into their artifact: never in month one; from month two only for step-zero attendees who did not opt out. Non-attendees receive the self-only artifact but stay in colleagues' peer denominators; opted-out surgeons receive the self-only artifact and are excluded from every group. Evaluated from roster flags as of the publish date.
- **User-facing behavior:** An attendee's month-two email carries spreads where groups render; a non-attendee's or an opted-out surgeon's email looks like month one. The analyst sees an eligibility column per surgeon in the publish summary.
- **Acceptance criteria:**
  1. For the period flagged month one, eligibility is false for every surgeon regardless of flags, and no artifact contains a spread.
  2. From month two, eligibility is true only when attended = yes and opt_out = no on the roster as of the publish date; a flag change after publish affects only the next period.
  3. A non-attendee's numbers are still counted in other surgeons' peer groups; an opted-out surgeon's numbers are counted in no peer group.
  4. If an opt-out reduces a group below five qualifying peers, the remaining surgeons' tiles show the F-32 peer-under-five text with the new count.
  5. The eligibility decision per surgeon and period is stored on the period record (F-95).
- **Data required:** Roster attendee and opt-out flags (F-99); period month-one flag; peer-group output (F-31).
- **Rules enforced:** Design doc Recommended Approach ("month one self-only; month two peer spread for attendees only; opt-out honored per Premise 11"); design doc Premise 11; journeys J4.9 proposed default (non-attendees stay in peer groups; review log finding 1).
- **Journey steps:** J1.10, J4.3, J4.7, J4.9
- **Metrics:** All with a peer comparison
- **Dependencies:** F-99, F-31, F-95.
- **Open questions:** OQ-09; OQ-10.

### F-36 Anonymized spread storage and render log

- **Milestone:** M1
- **Description:** For each metric whose group renders, writes to surgeon-facing data only the viewer's own position and the anonymous spread (values with no identities, no labels other than the viewer's marker), and logs every spread written or withheld with period, metric, viewer, peer count, group definition, eligibility state and suppression state. In month one no spread is written. The log decides Premise 5.
- **User-facing behavior:** Not surgeon-facing beyond the spread itself. The analyst and chair can produce a report of spread renders by peer-count bucket (5, 6, 7, 8, more than 8) per metric per period.
- **Acceptance criteria:**
  1. Surgeon-facing spread data contains no surgeon identifier other than the viewer's own; a schema check on the published artifact fails the run if any peer id, name or label is present.
  2. Each spread written logs period, metric, viewer id, peer count, group definition (site, subspecialty), attendee and opt-out state, publish date; each spread withheld logs the same plus the suppression state code and the count of peers who cleared min-n.
  3. When the period is flagged month one the log contains zero renders for that period.
  4. A spread is written only when the peer-group output shows at least 5 peers clearing min-n and the viewer is eligible (F-35).
  5. A report of render frequency by peer-count bucket per metric per period is producible on demand; the log stores peer counts, never peer identities.
- **Data required:** Peer-group output (F-31); computed numbers per peer; render log store.
- **Rules enforced:** GR4 ("never who is who"); design doc Anonymity rule for A (log how often each spread renders; that number decides Premise 5).
- **Journey steps:** J1.10, J1.11, J4.7
- **Metrics:** All with a peer comparison
- **Dependencies:** F-31, F-32, F-35.
- **Open questions:** OQ-26 (form of the spread for share and count metrics).

### F-37 Under-five groups report and chief pre-step-zero summary

- **Milestone:** M0
- **Description:** Lists every comparator group under five in the adopted counting form and produces, before step zero, a dated one-page summary for the division chief of which comparisons surgeons in each under-five subspecialty will and will not see. At M0 (before code) the analyst computes it by hand from the dated roster using the F-31 rule and dates it; from the first M1 run it is regenerated from the F-31 output and compared with the hand version. It carries counts only, never a record or a surgeon-level value.
- **User-facing behavior:** The analyst hands the chief one page: per subspecialty at the site, which metrics will show a spread and which will read "Peer comparison not shown: <n> peers ...; needs 5". The chief says so at the faculty meeting.
- **Acceptance criteria:**
  1. The report lists each group under five as "<subspecialty> at <site>: <n> peers clearing min-n for this viewer; needs 5".
  2. At M0 the summary is computed from the dated roster by the F-31 rule (site, subspecialty, viewer excluded, opt-outs removed), dated and signed by the analyst; from the first M1 run it is regenerated from the F-31 output and any difference from the hand version is recorded on the period record.
  3. The summary names, per subspecialty, the metrics whose spread will render and those whose spread will not, given the current roster.
  4. The summary contains counts per subspecialty and metric only; a scan of the artifact finds no case id, patient field, surgeon name or surgeon-level value (F-106 AC 7).
- **Data required:** Peer-group output (F-31); roster.
- **Rules enforced:** GR3; journeys J4.6 (chief summary before step zero); journeys Provenance (leadership-first J3 step 4 relocated here because no leader view exists in the first milestone).
- **Journey steps:** J4.3, J4.6
- **Metrics:** Wedge four
- **Dependencies:** F-99 (dated roster).
- **Later consumers:** F-31 and F-33 (M1) regenerate the summary and supply the reason wording from the first run.
- **Open questions:** none.

### F-38 Dispute-caused suppression reason

- **Milestone:** M1
- **Description:** When a recompute after a decision moves a metric across min-n or changes a peer group's clearance, the suppression reason names the dispute as the cause so a vanished number is not read as punishment.
- **User-facing behavior:** "Not shown: 3 first cases this month; needs at least 4 (1 case re-credited by dispute <id> on <date>)" or "Now shown: 4 first cases (1 case re-credited to you by dispute <id> on <date>)".
- **Acceptance criteria:**
  1. A metric that crosses min-n in either direction because of a decision shows the count, the threshold, and the dispute id and date in its reason text.
  2. A peer spread newly suppressed or newly rendered because a re-attribution changed a peer's clearance shows the standard peer reason text with counts as of the recompute.
  3. The text uses the F-33 wording family with the dispute clause appended.
  4. 100% of suppressed cells after a recompute carry a reason; none is blank.
- **Data required:** Recompute results (F-29); suppression rules and min-n table; dispute id and decision date.
- **Rules enforced:** GR3; design doc Success Criteria (Suppression); journeys J2 failure mode (a recompute flips the metric across min-n and the surgeon reads the disappearance as punishment).
- **Journey steps:** J2.7, J2.10
- **Metrics:** All with a min-n or a peer comparison
- **Dependencies:** F-32, F-33, F-29.
- **Open questions:** none.

### F-39 Roster change with dated peer-group recompute

- **Milestone:** M1
- **Description:** Recording a roster change (site move, subspecialty change, chief change, leave start or end, faculty start or end, block change) dates the change and recomputes peer-group membership and size for every comparator from that date. Any newly suppressed cell names the rule and the change date. M&M sessions during leave are removed and the target rescaled under the flagged assumption (F-75).
- **User-facing behavior:** The analyst records the change with its effective date and sees which groups changed size and which cells flipped. A surgeon whose comparison disappears reads "Peer comparison not shown: 4 peers in your subspecialty at this site cleared min-n as of <date>; needs 5 (you are not counted)".
- **Acceptance criteria:**
  1. A roster change is refused without an effective date; peer groups for periods before the date are unchanged and periods on or after it use the new membership.
  2. Any cell that becomes peer-suppressed because of the change renders the F-33 as-of variant; any cell that becomes shown logs the change that caused it.
  3. For a leave start or end, M&M sessions inside the leave window are removed from the denominator from the next compute and the scaled target is recomputed with the assumption flag shown (F-75).
  4. The change and its downstream recompute are written to the restatement log (F-96) with reason category "roster change".
- **Data required:** Dated roster (F-99); peer-group engine (F-31); suppression engine (F-32); M&M computation (F-75).
- **Rules enforced:** GR3, GR4; brief: Bucket 6 (sessions held while on faculty and not on approved leave); journeys J4 failure mode (roster error puts a surgeon in the wrong peer group).
- **Journey steps:** J4.3, J4.16
- **Metrics:** All with a peer comparison; M&M attendance
- **Dependencies:** F-99, F-31, F-32, F-33, F-96.
- **Open questions:** OQ-36 (roster source and maintainer); OQ-08.

### F-40 Anonymous cross-system survey peer bar chart

- **Milestone:** M4
- **Description:** For each Bucket 5 measure, an anonymous bar chart of neurosurgeons across the system with the surgeon's own bar highlighted and no names, plus the peer count in words. Peer group is dated-roster neurosurgeons across the system as of the survey month, excluding the viewer and opted-out surgeons, each clearing the 10-response month minimum (proposed default). Under five peers the chart is replaced by the reason text and the surgeon's own value stays. If the extract covers fewer sites than the group requires, the reason names the coverage gap.
- **User-facing behavior:** The surgeon sees where their bar sits, reads "41 neurosurgeons across the system", and recognizes no names.
- **Acceptance criteria:**
  1. The peer group for each measure and month is computed from the dated roster as neurosurgeons across the system as of that month, excluding the viewer and opted-out surgeons; each counted peer has at least 10 responses that month.
  2. The chart renders one bar per peer with no names or labels other than the viewer's highlighted bar, and shows the F-33 `spread-count-survey` sentence "<N> neurosurgeons across the system".
  3. With fewer than five qualifying peers the cell reads the F-33 `peer-under-five` template with group "department", scope "across the system" and unit "responses": "Peer comparison not shown: <n> peers in your department across the system cleared at least 10 responses this month; needs 5 (you are not counted)"; the surgeon's own value, year average and MGB average stay visible.
  4. When the loaded extract covers fewer sites than the system-wide group requires, the reason names the coverage gap rather than "fewer than five".
  5. The surgeon-facing payload contains peer values only; a test inspects the response for surgeon ids other than the viewer's.
  6. Every render is logged with metric, month and peer count (F-36).
- **Data required:** Dated roster; per-surgeon per-month values and response counts for all neurosurgeons across the system; extract coverage metadata; render log.
- **Rules enforced:** GR3, GR4; brief: Bucket 5 ("the anonymous bar chart of everyone in your peer group with your own bar highlighted"; "neurosurgeons across the system"); design doc suppression rule; design doc Premise 11.
- **Journey steps:** J3.1, J3.10
- **Metrics:** Bucket 5 measures
- **Dependencies:** F-28, F-41, F-31, F-36, F-99.
- **Open questions:** OQ-07 (counting rule for survey measures); OQ-45 (extract coverage site vs system); OQ-10 (whether non-attendance withholds the survey spread).

### F-41 Per-month under-10 response suppression with reason text

- **Milestone:** M4
- **Description:** A survey month with fewer than 10 responses for the surgeon is hidden for that month only; the cell shows the reason with the real count. The year average, the MGB average and the other months still render. The hidden month stays hidden with the same reason in later periods, and its response list remains openable.
- **User-facing behavior:** "Hidden: 7 responses this month; needs at least 10" in place of one month's value, with the neighbouring months and the year average still showing.
- **Acceptance criteria:**
  1. A month with fewer than 10 responses renders the F-33 `hidden-month` template "Hidden: <n> responses this month; needs at least 10" with the actual count; a fixture with 7 responses yields "Hidden: 7 responses this month; needs at least 10".
  2. Only that month's cell is hidden; the other two months, the year average and the MGB average render their values for the same measure.
  3. A hidden cell is never rendered as blank, zero, dash or omitted; the publish step fails if any below-threshold cell lacks reason text.
  4. In a later period the same month stays hidden with the same reason text.
  5. The per-response record list for a hidden month opens and lists its rows (F-53).
- **Data required:** Per-surgeon per-month response counts; catalogue entry `hidden-month` (F-33).
- **Rules enforced:** Brief: Bucket 5 ("A month with fewer than 10 responses is hidden for that month only"); GR3; design doc Success Criteria (Suppression).
- **Journey steps:** J3.2, J3.10
- **Metrics:** Bucket 5 measures
- **Dependencies:** F-28, F-32, F-33, F-53.
- **Open questions:** OQ-44 (year average and hidden months).

---

## Scorecard views

What every tile shows regardless of metric. Per-metric tile text lives in the metric feature; these features are the shared surface.

### F-42 "What this is not" statement

- **Milestone:** M0
- **Description:** A versioned fixed text presented at step zero as a one-page statement and carried as one line on every email and hosted page: not a comp input, not a rank, not an OPPE record; visible to you; your chief sees a record only when you dispute it; no leader view exists in the pilot; disputes change the record list. Includes the two plain statements about re-identification in small groups and the analyst's pipeline role for survey comments. Backed by a scan that no artifact carries a composite, rank or target.
- **User-facing behavior:** The surgeon hears the page at the meeting and sees the one-line version at the foot of every monthly email and every hosted page.
- **Acceptance criteria:**
  1. The one-page text contains all seven clauses listed in J1.1 and both plain statements verbatim: "In a group of five to eight you may recognise a colleague; the spread hides names, not people" and "The department analyst handles survey comments as pipeline data under the data-governance sign-off and has no viewer role".
  2. Every generated surgeon email and hosted page carries the one-line version; an artifact without it fails the publish check.
  3. The text is versioned; a wording change produces a new version with a date, and each artifact records which version it carried.
  4. No artifact shows a composite score, a rank, or a target other than M&M attendance's 8 of 12; an automated scan of generated artifacts for rank or composite fields returns none.
- **Data required:** Statement text and version; publish pipeline hook.
- **Rules enforced:** Design doc Constraints (no composite score, no ranking, no target except M&M attendance; never a comp or OPPE system of record, shown to faculty on the "what this is not" page); design doc Premise 5 said out loud; design doc Distribution Plan step zero; brief: Bucket 5 (analyst exception stated).
- **Journey steps:** J1.1, J1.2
- **Metrics:** All
- **Dependencies:** faculty-meeting slot.
- **Later consumers:** F-90 (M1) and F-85 (M2) carry the one-line version on every artifact.
- **Open questions:** OQ-40 (confirm the analyst pipeline role is stated at step zero).

### F-43 Trend on every metric with history-start disclosure

- **Milestone:** M1
- **Description:** Every metric tile shows a trend of closed periods at the metric's cadence. When the source carries fewer periods than the window the tile says "history from <date>" and shows only real points. Restated periods and version boundaries are marked. O/E and rate points carry intervals; the wRVU trend is monthly bars with last year ghosted; M&M attendance shows cumulative attended against cumulative held by month within the fiscal year (proposed default so GR6 holds; OQ-25).
- **User-facing behavior:** Under each tile a 12-month line (monthly metrics), quarterly points (quarterly metrics) or four rolling-12-month points (mortality), with a note when history is short.
- **Acceptance criteria:**
  1. Every metric tile shows a trend of closed periods at its cadence: up to 12 monthly points, quarterly points for quarterly metrics, one point per quarter close for rolling-12-month metrics.
  2. When the source carries fewer periods than the window the tile shows "history from <first period>" and no zero-filled or interpolated points; a fixture with 3 months of history shows 3 points and the text.
  3. A period restated after a decision or a version change is marked on the trend (F-96).
  4. For O/E and rate metrics each trend point carries its interval (F-24); for Work RVUs — live tracker the trend is monthly bars with last year's bars ghosted (F-77).
  5. A published metric without a trend fails the publish check, M&M attendance included; its trend is cumulative attended against cumulative held, one point per month of the fiscal year (F-74 AC 5), until the owner answers OQ-25.
- **Data required:** Per-period numbers with cadence; first available period per source; restatement markers.
- **Rules enforced:** GR6 ("Every metric shows a trend, not just a snapshot"); brief cadences (monthly, quarterly, rolling 12 months, fiscal year to date).
- **Journey steps:** J1.2, J1.3, J1.6, J1.7, J1.13, J1.15, J1.16, J1.17, J1.18, J1.19
- **Metrics:** All
- **Dependencies:** F-96, F-84; extract with at least 12 months of history.
- **Open questions:** OQ-25 (trend window and form; M&M trend).

### F-44 "Why not shown" states for unavailable and pending data

- **Milestone:** M1
- **Description:** Distinct, stored, worded tile states for data that is not there: feed not yet in this release; required field missing from the extract; feed not received or partially loaded; data source pending confirmation. Metrics the brief marks "pending confirmation of data source" are registered with no source, computed for no one, and render "Data source pending confirmation" until a source is registered with an effective period. None is a blank and none is a zero.
- **User-facing behavior:** Block utilization reads "Not in this release: needs the block allocation and release schedule; owner not yet named"; Referral-to-visit days (pending confirmation of data source) reads "Data source pending confirmation" with the definition link still available; a failed October extract reads "periop extract for October not received as of <date>".
- **Acceptance criteria:**
  1. A metric whose feed is not registered renders "Not in this release: needs <feed>; owner not yet named" (for Block utilization, exactly the J1.9 text).
  2. A metric whose required field is missing renders "not computable: <field> not in extract" and never a value computed from a proxy (F-80).
  3. A metric whose feed failed or loaded partially renders "<feed> for <period> not received as of <date>" and never 0 (F-82).
  4. Referral-to-visit days (pending confirmation of data source) and Unplanned return to ICU (pending confirmation of data source) exist in the registry with status "pending source", invoke no compute function while pending, and render the exact text "Data source pending confirmation" for every surgeon; their definition pages still show the brief's text, cadence, min-n and comparator; the status changes only through the source registry (F-103, present from the first M1 run) and the change is dated, after which F-109 and F-110 compute them from the effective period.
  5. Each state is a distinct stored code, separate from suppression (F-32) and "not applicable" (F-18); no cell is ever rendered blank; the analyst's run log lists pending metrics as pending, not failed.
- **Data required:** Source registry status per metric; field checklist result (F-80); feed health result (F-82); catalogue (F-33).
- **Rules enforced:** GR3; brief: Bucket 3 and Bucket 4 ("pending confirmation of data source"); journeys J4.10 (pending metrics computed for no one); design doc challenge 24.
- **Journey steps:** J1.9, J1.17, J1.19, J4.10, J4.13
- **Metrics:** Block utilization (only if you have allocated block); Referral-to-visit days (pending confirmation of data source); Unplanned return to ICU (pending confirmation of data source); any metric whose feed fails
- **Dependencies:** F-80, F-82, F-103, F-33, F-13.
- **Open questions:** OQ-37 (publish on a partial load, and wording); OQ-04, OQ-05 (the two pending sources).

### F-45 Quarterly and rolling-window cadence tile states

- **Milestone:** M1
- **Description:** Tiles for metrics counted quarterly, over rolling 12 months, or fiscal year to date state their cadence and window, show interim text with the running denominator between closes, and render their spread only at the cadence close.
- **User-facing behavior:** Between quarter closes: "Counted quarterly; the quarter closes <date>" with cases so far; mortality: "Rolling 12 months to <date>"; wRVU and M&M name the fiscal year.
- **Acceptance criteria:**
  1. Every quarterly metric in a non-quarter-close month shows "Counted quarterly; the quarter closes <date>." plus its running denominator and no partial rate.
  2. In-hospital mortality (O/E) states "Rolling 12 months to <date>" on the tile.
  3. Work RVUs — live tracker and M&M attendance state the fiscal year they cover.
  4. A quarterly metric's peer spread first renders at quarter close, never mid-quarter; a month-two email shows no cancellation spread.
- **Data required:** Cadence per metric (F-100); period and quarter close dates; running denominators.
- **Rules enforced:** Brief cadences ("Counted: quarterly" for Case mix index, Same-day cancellations, Referral-to-visit days, Length of stay, 30-day readmission, return to OR, SSI, VTE, CSF leak, ICU return; "rolling 12 months" for mortality; fiscal year to date for wRVU and M&M); GR3 principle.
- **Journey steps:** J1.8, J1.15, J1.16, J1.17, J1.18
- **Metrics:** All quarterly, rolling-12-month and fiscal-year metrics
- **Dependencies:** F-100, F-84, F-33.
- **Open questions:** none.

### F-46 Anonymous peer spread rendering

- **Milestone:** M1
- **Description:** When a group qualifies and the viewer is eligible, the artifact shows the peer count sentence, the anonymous spread of peers and the surgeon's own marker, with no names or labels. The page makes no claim of unidentifiability. Bucket 5 renders as the bar chart the brief describes (F-40); O/E and rate metrics render per F-24.
- **User-facing behavior:** From month two: "Neurosurgeons at your site: 7 peers, each with at least 4 first cases (you are not counted). Your position marked." and seven unlabeled markers plus their own. A surgeon who recognizes a colleague sees nothing change; the render is logged.
- **Acceptance criteria:**
  1. The spread carries the F-33 `spread-count` sentence "<Comparator group>: <k> peers, each with at least <min-n> <unit> (you are not counted). Your position marked." with k at least 5.
  2. No name, initials, identifier or label other than the viewer's own marker appears; the data written by F-36 contains only the viewer's value and the anonymous peer values.
  3. No artifact text claims the spread is unidentifiable; the step-zero sentence "the spread hides names, not people" is the only statement about anonymity.
  4. Bucket 5 measures render as a bar chart with the viewer's own bar highlighted; O/E and rate metrics render as an interval or funnel chart; the form for other share and count metrics is recorded as an open question and the chosen form is versioned.
  5. Every render is logged per F-36.
  6. M1 plain-text form (the versioned build choice under OQ-26; F-90 AC 6): three lines, the `spread-count` sentence, then "Peers: <v1>, <v2>, ... <vk>" with the k peer values sorted ascending in the metric's unit, then "You: <value>"; no other marks or labels. A fixture with 7 peers yields exactly those three lines, and the same three lines appear as the text form of the hosted chart (F-108 AC 2).
- **Data required:** Anonymous peer values per group per metric per period; viewer's own value; peer count.
- **Rules enforced:** GR4 ("the surgeon sees the spread of their peers and where they sit in it, never who is who"); design doc Anonymity rule for A; design doc Premise 5 (treated as expected, not a bug).
- **Journey steps:** J1.10, J1.11, J1.15, J1.18
- **Metrics:** All with a peer comparison
- **Dependencies:** F-31, F-35, F-36.
- **Open questions:** OQ-26.

### F-47 As logged / as adjudicated tile display with restated trend marker

- **Milestone:** M1
- **Description:** When a decision moves a count, the tile shows both values with their denominators; the record list row count equals the denominator of whichever count is displayed; the trend shows the adjudicated value with a restatement marker and the logged value on hover or in the list. When the values are equal, or converge after source correction, the tile shows one value.
- **User-facing behavior:** "FCOT October: as logged 60% (6 of 10); as adjudicated 67% (6 of 9)." The October trend point carries a marker; hovering shows "as logged 60%".
- **Acceptance criteria:**
  1. When as logged equals as adjudicated the tile shows one value; when they differ both are shown with numerator and denominator each.
  2. The record list row count equals the denominator of the count currently displayed; switching between counts changes the list accordingly.
  3. A restated period's trend point carries a visible marker; the logged value is shown in the record list on every artifact and, in the hosted view, also on hover.
  4. After source convergence (F-06) the tile returns to a single value and the trend marker keeps the restatement history.
  5. The same display is used in the email tile text and the hosted tile.
- **Data required:** Recomputed counts (F-29); restatement log (F-96); trend series.
- **Rules enforced:** Design doc Constraints (Disputes): "as logged" and "as adjudicated" side by side; GR5 (row count equals denominator); GR6; journeys J4.14 (boundary so a step change is not read as a change in practice).
- **Journey steps:** J2.7, J2.8
- **Metrics:** All with a record list
- **Dependencies:** F-29, F-43, F-49, F-96.
- **Open questions:** OQ-14.

### F-48 Survey measure trend and three-month roll-forward

- **Milestone:** M4
- **Description:** On each survey load the three-month window advances, the highlighted bar re-renders for the new period, hidden months keep their reason, and a monthly trend line of each measure is shown beyond the three faculty-meeting months so the surgeon can see whether a dip recovered (proposed default to satisfy GR6). Definition-version boundaries are marked.
- **User-facing behavior:** Returning in later months the surgeon sees the newest month in the right-hand cell, the oldest of the three gone from the tile but still on the trend line, the hidden month still marked hidden, and whether "Provider listened carefully" recovered.
- **Acceptance criteria:**
  1. After a new survey month loads, the three-month cells show the three most recent survey months and the previous oldest month remains a point on the trend.
  2. The trend line plots monthly values for up to 12 survey months where history exists; a month hidden under the 10-response rule is a gap carrying its reason on hover, never a zero.
  3. With fewer than 12 months of history the trend carries "history from <date>".
  4. A definition-version boundary is marked on the trend at the effective date (F-96).
  5. The highlighted bar and peer count re-render for the new period, and a spread that stops or starts rendering shows the reason text (F-40).
- **Data required:** Per-surgeon per-month values with version ids across history; survey load history; version effective dates.
- **Rules enforced:** GR6; brief: Bucket 5 ("each of the past three months separately"); GR3 per month.
- **Journey steps:** J3.1, J3.10
- **Metrics:** Bucket 5 measures
- **Dependencies:** F-28, F-69, F-40, F-41, F-43, F-96.
- **Open questions:** OQ-44 (monthly trend beyond three months required?); OQ-25.

---

## Drill-down and provenance

Every number links to its definition and to the list of records behind it (GR5). These features are the framework; per-metric column sets live in the metric features.

### F-49 Record list drill-down from every number

- **Milestone:** M1
- **Description:** Each number links to the list of records it was computed from; the row count equals the tile's denominator; the list opens even when the number is suppressed; every row carries a dispute action and shows its credited clinician, source and shared flag. Work RVUs — live tracker has no record list in this release: a deviation from GR5, which the brief states for every number with no exception, recorded as OQ-33 for the owner and not treated as settled.
- **User-facing behavior:** From any tile the surgeon opens the list (attachment section in the email months, page in the hosted view), counts the rows against the denominator, and finds the dispute action on each row. A tile reading "Not shown: 3 first cases this month; needs at least 4" still opens the list of those 3 cases.
- **Acceptance criteria:**
  1. Every number on every artifact links to the list of records it was computed from; the only number without a list is Work RVUs — live tracker, whose tile states the deviation and the billing-office route (F-77 AC 4) pending OQ-33.
  2. The row count of every record list equals the denominator shown on its tile; a mismatch fails the publish run (F-51).
  3. Every suppressed tile links to or attaches its record list; the suppressed list's row count equals the count in the suppression reason text; rows in a suppressed list carry the same columns and dispute action as rows in a shown list; a suppressed metric with no openable list is a publish failure.
  4. Every row carries a dispute action: in the email months a stable case id the surgeon quotes to the reply-to-dispute address; in the hosted view a "Dispute this record" button (F-54).
  5. Every row shows the credited clinician, the source system and load date, and the shared flag where the record type has one.
  6. No row shows another surgeon's identity except where the brief's rule requires it (discharging attending on an admission; the re-credited-from surgeon on a dispute row).
- **Data required:** Ledger records with ids, credited clinician, source, load date, shared flag; record-to-number linkage (F-51).
- **Rules enforced:** GR5; GR2; GR1; design doc ledger invariant (row count equals denominator); journeys J2 failure mode (suppressed number whose list is not openable).
- **Journey steps:** J1.4, J1.6, J1.7, J1.8, J1.14, J1.15, J1.16, J1.17, J1.19, J2.1
- **Metrics:** All except Work RVUs — live tracker
- **Dependencies:** F-01, F-51, F-54, F-59, F-32.
- **Open questions:** OQ-33 (wRVU: mirror only or a charge-level list).

### F-50 Metric definition page

- **Milestone:** M1
- **Description:** One page per metric reached from the tile's version stamp: the definition text verbatim with version and source; cadence; min-n; comparator; the brief's notes and "You can move it by" text verbatim; every brief assumption shown as a recorded assumption with status; the reason sets in force or pending; the version history with confirmer and date; open definition items logged from disputes; and for M&M attendance how a scaled target was computed. In the email months the version id is printed on each tile and the page content is attached or referenced by version.
- **User-facing behavior:** The surgeon opens the FCOT definition and reads the institutional text, min-n of 4, the comparator, the delay-reason note, the lever text, and that "no grace window" is an open question resolved by adopting the institutional definition. For "Provider listened carefully" they read "sitting down, not interrupting, confirming concerns".
- **Acceptance criteria:**
  1. For each metric the page shows: definition text verbatim with version and source; cadence; min-n; comparator; the brief's notes; and the brief's "You can move it by" text verbatim; a diff against the brief's text is empty at version 1 except where an institutional definition is adopted verbatim (F-12 AC 2), in which case the page shows the brief's text as the flagged assumption, the institutional text in force, and the stored delta between them.
  2. Every "(assumption — to be confirmed)" or "pending confirmation" wording from the brief is shown as a recorded assumption with status "Open Question for the brief's owner" and, for First-case on-time start (FCOT), the sentence "the institutional definition is used so the number matches periop's".
  3. The surgeon-attributable delay and cancellation reason sets are listed with their version, or the exact text "surgeon-attributable delay reason set: pending periop leadership sign-off" (respectively cancellation) while unsigned, together with what the set does (labels rows for delay; sets the numerator for cancellations).
  4. The version history lists each version with confirmer, date and diff summary; following a tile's version stamp shows the text of that version, not the latest.
  5. Definition questions logged from disputes (F-63) appear as open items with their date.
  6. The M&M attendance page shows the scaled-target formula with the leave sessions removed and the flagged assumption text.
  7. The page is reachable from every tile's version stamp on every artifact (email: a definition section in the attachment; hosted view: a link).
- **Data required:** Definition registry (F-13); configuration table (F-100); open items from F-63; M&M scaled-target record (F-75).
- **Rules enforced:** GR5; brief metric text (What, Counted, Compared to, Shown as, You can move it by) reproduced verbatim; design doc (institutional definition verbatim; reason sets as versioned dependencies); journeys J4.15.
- **Journey steps:** J1.5, J1.6, J1.13, J1.14, J1.19, J3.3, J3.9, J4.11, J4.15
- **Metrics:** All
- **Dependencies:** F-13, F-100, F-51, F-101, F-102, F-63.
- **Open questions:** OQ-35; OQ-22 (definition and peer-group disputes shown here).

### F-51 Number provenance stamp, definition version stamp and row-count invariant

- **Milestone:** M1
- **Description:** Every computed number is stored with the definition version id, the ids of the records it was computed from, its denominator, its exclusion counts by reason, its source system, its per-source as-of date and, where a risk model applies, the model version. Every tile and record list displays the version stamp, which resolves to the exact definition text in force at computation. The run enforces that the record list row count equals the denominator and fails otherwise.
- **User-facing behavior:** The surgeon reads "Definition: institutional FCOT, version 1 (periop)" on the tile and can open that exact version. A chief opening a disputed record sees source, load date, attribution rule and definition version. The analyst sees a provenance block per number.
- **Acceptance criteria:**
  1. Every stored number carries: definition version id, list of record ids, denominator, exclusion counts keyed by reason ("outside surgeon-attributable set", "excluded at J4.2", "super-long boarder" later), source system, as-of date; model version is present for Vizient-backed metrics and null otherwise; a number missing any required field fails the publish check.
  2. For every published number, count(record ids) = denominator; a mismatch fails the run before publish.
  3. Every tile displays the version in the form "Definition: <name>, version <v> (<source>)" and each record list carries the same version id as its tile; the version shown resolves to the text the number was computed under even after a newer version exists.
  4. A number can be traced from the tile to its record ids to the ledger rows and their load date without any manual lookup.
  5. Record lists remain openable for suppressed numbers (F-49).
- **Data required:** Computed numbers (F-12); ledger record ids; exclusion outcomes (F-02, F-17, F-08); definition registry (F-13).
- **Rules enforced:** GR5; journeys J4.4 ledger invariant ("Row count of each record list equals the denominator of its tile; the run fails if not"); brief header ("edits go in a new version, not here"); design doc Constraints (per-source as-of date and model version).
- **Journey steps:** J1.2, J1.3, J1.5, J1.13, J1.20, J4.4, J4.10
- **Metrics:** All
- **Dependencies:** F-12, F-13.
- **Open questions:** none.

### F-52 Dispute detail with provenance panel

- **Milestone:** M1
- **Description:** The adjudicator's view of one dispute: the record exactly as the surgeon saw it, the surgeon's claim, and the record's provenance from the ledger (source system, load date and ticket, attribution rule applied, definition version id, stored field value, which metric and period it feeds, shared flag, prior disputes). For Vizient admissions the panel adds encounter id, index-operation rule, model version, discharging attending, observed and expected days. The chief sees the record, not a score. In the wedge this is the content of the adjudicator email and sheet; in the hosted view a screen.
- **User-facing behavior:** The chief reads: source "periop OR-log extract, loaded <date>, ticket <n>"; attribution "credited to the primary surgeon in the OR log; first-listed primary on a multi-panel case"; definition "institutional FCOT v1"; stored delay reason "surgeon late"; feeds "FCOT, October".
- **Acceptance criteria:**
  1. The panel shows every listed provenance field for the record type; a record with a missing provenance field cannot be adjudicated and is flagged to the analyst.
  2. The record columns shown to the adjudicator are identical to those on the surgeon's list row.
  3. No metric value, spread, peer position or trend of any surgeon is shown on the panel.
  4. The definition version id and load date on the panel equal the stamps stored with the number (F-51).
  5. For an admission record: Vizient encounter id, load date, index-operation rule text, model version, definition version, discharging attending, observed days and expected days are shown.
- **Data required:** Ledger provenance (F-51); record fields per type; prior dispute rows.
- **Rules enforced:** GR5; GR1 (attribution rule stated per record type); design doc challenge 1 (the chief sees the record).
- **Journey steps:** J2.5, J2.10
- **Metrics:** All with a record list
- **Dependencies:** F-51, F-55, F-60.
- **Open questions:** none.

### F-53 Per-response de-identified survey record list

- **Milestone:** M4
- **Description:** The record list behind each Bucket 5 measure and month: one row per de-identified response with survey month, the four item scores, comment present yes or no, and provider named. Row count equals the response count used in the number. No patient identifiers and no comment text. Every row carries a dispute action and shows its dispute status when one exists.
- **User-facing behavior:** The surgeon opens the list behind "Provider listened carefully" for a month, counts the rows against the tile's response count, sees each response's scores and whether it carried a comment, and can dispute any row.
- **Acceptance criteria:**
  1. Each row shows exactly: survey month, the four item scores, comment present (yes or no), provider named; a test asserts no other columns and no comment text.
  2. Row count equals the response count stored with the measure for that month; the publish step fails on any mismatch.
  3. A scan of the list payload for name, MRN, date of birth and free-text fields returns nothing.
  4. Every row has a dispute action that opens the structured survey dispute (F-72); a row with an open or decided dispute shows its status text (F-73).
  5. The list opens for a month whose value is hidden under the 10-response rule.
- **Data required:** Per-response records (response id, month, four scores, comment-present flag, provider named, credited surgeon); dispute ledger rows keyed by response id.
- **Rules enforced:** GR5; GR1 ("Surveys go to the provider named on the survey"); GR2; design doc (comments handled as pipeline data outside every count).
- **Journey steps:** J3.3, J3.7
- **Metrics:** Bucket 5 measures
- **Dependencies:** F-11, F-49, F-72, F-85.
- **Open questions:** OQ-43 (stable reference to a de-identified response).

---

## Dispute workflow

A dispute is a ledger record pinned to one record, never to a number. It goes to the division chief, or to the chair when the chief is involved (GR2). Every decision has a decider, a date and a note, and its outcome shows on the row. In the wedge the ledger is a shared sheet fed by email replies, held by the analyst alone with decisions arriving by email reply (F-111); in the hosted view it is a table with the same schema.

### F-54 Dispute action on every record row

- **Milestone:** M1
- **Description:** Every row of every record list behind every metric carries a dispute entry point, not only FCOT rows that carry a delay reason. In the email months the entry point is a stable case id on the row plus the reply-to-dispute address; in the hosted view a "Dispute this record" button. Work RVUs — live tracker has no dispute action in this release: a deviation from GR2 ("any record credited to them"), recorded as OQ-33 and not treated as settled.
- **User-facing behavior:** The surgeon opens any record list (first cases, duration cases, volume cases, cancellations, later admissions, QI events, survey responses, M&M sessions) and sees on each row a case id and the dispute instruction (email) or a dispute button (hosted).
- **Acceptance criteria:**
  1. 100% of rows in every published record list for every metric with a record list carry a dispute action; list generation fails if any row lacks a case id or the action.
  2. OR case volume and Duration estimate accuracy rows carry the action, not only First-case on-time start (FCOT) rows.
  3. Each row carries a stable case id that resolves to exactly one ledger record across periods and republishes; the id is a ledger surrogate generated by the system, never an MRN, CSN, encounter number or other source patient identifier, and a test confirms it cannot be resolved to a patient without ledger access (F-106 AC 7).
  4. The Work RVUs — live tracker tile has no record list and no dispute action in this release (F-77; deviation pending OQ-33).
  5. The email case-list attachment states the reply-to-dispute address and the instruction to quote the case id.
- **Data required:** Ledger record ids per record type; record list rows per metric and period; reply-to-dispute mailbox address.
- **Rules enforced:** GR2 ("A surgeon can dispute any record credited to them"); GR5; design doc (wRVU read-only mirror).
- **Journey steps:** J2.1, J2.2, J2.11
- **Metrics:** All except Work RVUs — live tracker
- **Dependencies:** F-49, F-51, F-91.
- **Open questions:** OQ-19 (time limit for filing).

### F-55 Dispute ledger record

- **Milestone:** M1
- **Description:** The append-only dispute ledger: one row per dispute pinned to exactly one record, with the design doc's fields plus status, outcome, linkage and correction-tracking fields. A shared sheet with these columns is sufficient in the wedge; the hosted view uses a table with the same schema and status vocabulary.
- **User-facing behavior:** The analyst (wedge) or the system (hosted) creates a row when a dispute is filed and updates its status as it moves; surgeons and adjudicators see the state through the row and the queue.
- **Acceptance criteria:**
  1. Every dispute creates exactly one ledger row with: dispute id, record id, record type, field disputed, surgeon claim, disputant, filed date, definition version id of the number the record fed, adjudicator, escalation test fired (if any), status, decision, outcome, decider, decision date, note, correction-requested date, source-confirmed date, linked dispute id.
  2. A dispute row without a record id is rejected; a dispute cannot be pinned to a metric, tile, spread or period.
  3. Hosted (M2): rows are never deleted; every state change is a new event with a timestamp. Wedge (M1): the sheet is append-only by procedure (F-111), a correction is a new row citing the first, and the sheet's exported edit history is the record of state changes (F-111 AC 5).
  4. The definition version field is populated automatically from the published number's version stamp at filing time.
  5. The wedge shared sheet carries the same column set and status vocabulary as the hosted table; a test loads a sheet export into the table schema without transformation.
- **Data required:** Ledger record ids and types; version stamps (F-51); roster roles.
- **Rules enforced:** Design doc Constraints (Disputes): "a dispute is a ledger record (case id, field, surgeon claim, adjudicator, decision, date, definition version)"; GR2; design doc Approach A ("a shared sheet is enough for four metrics").
- **Journey steps:** J2.2, J2.3, J2.3a, J2.6, J2.8a, J2.9, J2.12
- **Metrics:** All except Work RVUs — live tracker
- **Dependencies:** F-51, F-13, F-99.
- **Open questions:** none.

### F-56 Dispute effect notice per disputed field

- **Milestone:** M1
- **Description:** Fixed text, versioned with the definition, that tells the surgeon before filing what a sustained dispute on each field does. Delay reason: the reason on the row is corrected, the case stays late, the FCOT number does not move. Credited surgeon: the record moves to one other clinician and both surgeons' numbers recompute as logged and as adjudicated. Shown on the hosted form and in the email case-list dispute instructions.
- **User-facing behavior:** Before filing a delay-reason dispute the surgeon reads: "A sustained delay-reason dispute corrects the reason on this row. The case stays late and your FCOT number does not move, so it still matches periop's report."
- **Acceptance criteria:**
  1. A notice exists for every disputable field of every record type in F-04; a field with no notice cannot be disputed.
  2. The delay-reason notice states that the case stays late and the FCOT number does not move.
  3. The credited-surgeon notice states that the record moves to one other clinician and that both numbers recompute as logged and as adjudicated.
  4. The notice appears in the email case-list instructions (wedge) and on the hosted form above the submit control.
  5. Each notice carries the definition version it applies to and changes only through a new definition version (F-13).
- **Data required:** Definition registry entries; disputable fields per record type (F-04).
- **Rules enforced:** Brief: Bucket 2 FCOT (late means wheeled in after the scheduled start, no exclusion by reason); design doc ("two numbers for the same metric" ruled out); GR5; journeys J1 failure mode (a surgeon disputes a delay reason expecting the number to move).
- **Journey steps:** J2.2, J2.7, J2.8
- **Metrics:** All except Work RVUs — live tracker
- **Dependencies:** F-13, F-04.
- **Open questions:** OQ-12.

### F-57 Email-months dispute intake and acknowledgement

- **Milestone:** M1
- **Description:** The wedge dispute front door: a monitored reply-to-dispute mailbox, analyst entry of each reply into the shared-sheet ledger within two business days, an acknowledgement email quoting the case id and filed date, and hand application of the escalation tests with the fired test recorded. Replaced by F-66 and automatic routing in the hosted view.
- **User-facing behavior:** The surgeon replies to the monthly email quoting a row; within two business days they receive "Dispute received on case <id>, filed <date>, routed to <chief or chair>".
- **Acceptance criteria:**
  1. Every reply to the dispute address is entered into the ledger within two business days of receipt; filed date is the reply date, not the entry date.
  2. An acknowledgement email quoting the case id and filed date is sent within two business days of the reply.
  3. A reply that does not identify a case id receives, within two business days, a request for the row rather than a ledger row; the reply is logged as "awaiting row" and counts as unentered in the F-112 check until the case is identified or the surgeon withdraws it.
  4. The analyst records on the ledger row which escalation test fired, or "none" (F-58); no dispute is decided by a chief when a test is true.
  5. Replies not yet entered after two business days are visible on a sheet check (count of unentered replies).
- **Data required:** Reply mailbox; shared-sheet ledger (F-55); roster chief mapping and chair; record participant fields.
- **Rules enforced:** GR2; design doc Trust criterion (resolved within 14 days with the outcome visible in the record list); design doc Premise 6; journeys J2.3a proposed default.
- **Journey steps:** J1.12, J2.3a, J2.4
- **Metrics:** Wedge four
- **Dependencies:** F-91, F-55, F-58, F-99; named analyst on a chair-approved time fraction; privacy-office confirmation for email.
- **Open questions:** OQ-20 (is analyst entry within two business days plus a decision email acceptable until the hosted view exists).

### F-58 Dispute routing and chair-escalation tests

- **Milestone:** M1
- **Description:** Assigns each dispute to the surgeon's division chief from the dated roster as of the filed date, or to the chair when any involvement test is true (proposed default for "involved"): (a) the disputant is the chief; (b) the record would be re-credited to the chief; (c) the chief is a participant on the record (panel member on a case; index or discharging surgeon on an admission). Applied by the analyst in the email months and automatically in the hosted view.
- **User-facing behavior:** After filing, the row reads "Disputed - with chief, filed <date>" or "Disputed - with chair, filed <date>". In the hosted view a chief cannot self-assign a dispute that trips a test.
- **Acceptance criteria:**
  1. The default adjudicator is the disputant's division chief per the roster as of the filed date; the chair is named from the roster (F-87).
  2. The dispute routes to the chair when any of tests (a), (b), (c) is true; each test is evaluated and its result stored on the ledger row.
  3. Hosted view: tests are evaluated automatically from roster roles and record participant fields at filing; a chief attempting to self-assign a dispute that trips a test is refused.
  4. Email months: the analyst records the fired test on the ledger row.
  5. A re-attribution dispute naming the chief as the intended clinician (test b) routes to the chair even when the disputant is not the chief.
- **Data required:** Dated roster (surgeon, division chief, chair, roles as of date); record participant fields; ledger row.
- **Rules enforced:** GR2 ("Disputes go to the division chief; if the chief is involved, they go to the chair"); journeys J2.4 proposed default.
- **Journey steps:** J2.3, J2.4, J2.9, J2.10
- **Metrics:** All except Work RVUs — live tracker
- **Dependencies:** F-99, F-87, F-55.
- **Open questions:** OQ-15 (confirm the three tests; chair-filed disputes on the chair's own record; rerouting when the chief changes).

### F-59 Dispute state shown on the record row

- **Milestone:** M1
- **Description:** A fixed catalogue of row state texts generated from the ledger, shown on the record row in the hosted list and in the emailed case-list attachment, so an open, sustained, denied, re-credited or definition-question dispute is always distinguishable and a denial leaves a trace. In the email months the state appears in the decision email and on the next monthly case list.
- **User-facing behavior:** The row reads one of: "Disputed - with chief, filed <date>"; "Disputed - with chair, filed <date>"; "Dispute sustained (annotated) by division chief on <date>: <note>; correction requested at periop <date>"; "Dispute sustained (source corrected) ...; correction confirmed at source <date>"; "Dispute not sustained by division chief on <date>: <note>"; "Re-credited from <surgeon> by division chief on <date>: <note>"; "Definition question logged <date>".
- **Acceptance criteria:**
  1. Every record with a ledger row shows the state text matching its current ledger status; the text is generated from the ledger, never typed.
  2. The catalogue covers: open with chief, open with chair, sustained annotated, sustained source corrected, correction confirmed at source, not sustained, re-credited (on the receiving surgeon's row), definition question.
  3. A denied dispute shows "Dispute not sustained by <role> on <date>: <note>" and is visually distinct from an open dispute; a denied dispute is distinguishable from an unread one.
  4. The state text appears on the row in the hosted list, in the decision email (F-93) and in the next emailed case-list attachment for the same period.
  5. A re-credited case on the receiving surgeon's list reads "Re-credited from <surgeon> by <role> on <date>: <note>" and is disputable in turn.
  6. A row never loses its dispute history; prior states remain viewable (F-62).
- **Data required:** Ledger status, decider role, decision date, note, correction dates; record list rows.
- **Rules enforced:** Design doc Premise 6 (a sustained dispute visibly changes the record list); design doc Constraints (overrides visible, versioned, never silent); GR2; GR5.
- **Journey steps:** J1.4, J1.12, J2.3, J2.4, J2.8, J2.8a, J2.9, J2.12
- **Metrics:** All with a record list
- **Dependencies:** F-55, F-61, F-49, F-93.
- **Open questions:** OQ-17 (chief's note visible to the surgeon).

### F-60 Adjudicator dispute queue

- **Milestone:** M1
- **Description:** The chief's (and chair's) queue of open disputes routed to them, with age in days and the 14-day target, from which a dispute opens to its detail and provenance (F-52). In the wedge (M1) the chief's queue is the set of one-dispute emails sent to them (F-92) and the analyst's view of the shared sheet filtered by adjudicator (F-111); no chief or chair holds the sheet. The hosted screen (M2) is the only chief-facing screen.
- **User-facing behavior:** The chief opens the queue and sees each open dispute with surgeon, case id, field, filed date and age; disputes past 14 days are flagged; selecting one opens the record and its provenance.
- **Acceptance criteria:**
  1. Hosted (M2): the queue lists only disputes whose adjudicator is the signed-in chief or chair; the chair's queue shows only escalated disputes. Wedge (M1): each adjudicator receives only the disputes routed to them, one email each (F-92); the analyst's sheet view filtered by adjudicator lists the same set with age in days, and the F-112 checklist names any dispute at day 10 and day 14.
  2. Each entry shows age in days from the filed date and the 14-day target; entries over 14 days are visually flagged.
  3. Entries are ordered oldest first by default.
  4. Decided disputes are excluded from the open queue and available in a closed list with decision date.
  5. The queue shows no metric values, spreads or peer positions.
- **Data required:** Ledger rows (adjudicator, filed date, status); roster roles.
- **Rules enforced:** GR2; design doc Trust criterion (14 days); design doc Constraints (J2.5 is the only chief-facing screen in the wedge; no leader view for 30 days after any number).
- **Journey steps:** J2.5
- **Metrics:** All except Work RVUs — live tracker
- **Dependencies:** F-55, F-58, F-52, F-92, F-111.
- **Later consumers:** F-86 (M2) authorizes the hosted screen.
- **Open questions:** OQ-55 (wedge custody).

### F-61 Decision recording with two sustained outcomes

- **Milestone:** M1
- **Description:** The adjudicator records a decision on the ledger row: "sustained" with outcome "annotated" or "source corrected", "not sustained", or "definition question"; a note is required; decider and date are stored. The decision is immutable; any later change is a new ledger event.
- **User-facing behavior:** The chief picks a decision, picks an outcome when sustaining, writes a short note, and saves; the row shows decider, date and note.
- **Acceptance criteria:**
  1. A decision must be one of: sustained (annotated), sustained (source corrected), not sustained, definition question; nothing else is accepted.
  2. A note of at least one character, the decider identity and the decision date are stored on every decision.
  3. A sustained decision without an outcome is rejected; "source corrected" is selectable only when the record type has a named feed contact (F-04).
  4. Hosted (M2): a recorded decision cannot be edited or deleted; a later change creates a new ledger event linked to the original. Wedge (M1): the adjudicator's decision email is kept unaltered as the record of decision and the sheet row is its transcription (F-111 AC 4); a later change is a new row citing the first, and an edit to an entered decision row without such a row is flagged at publish (F-111 AC 5).
  5. The decision, decider, date and note are visible to the disputing surgeon on the row (proposed default).
- **Data required:** Ledger row; adjudicator identity from the roster; feed-owner table.
- **Rules enforced:** Design doc Constraints (Disputes): two outcomes, "source corrected" or "annotated"; overrides visible, versioned, never silent; GR2.
- **Journey steps:** J2.6, J2.8a, J2.12
- **Metrics:** All except Work RVUs — live tracker
- **Dependencies:** F-55, F-04, F-05.
- **Open questions:** OQ-17.

### F-62 Dispute history, re-filing and linkage on a record

- **Milestone:** M1
- **Description:** A record keeps every dispute ever filed on it. After a denial the surgeon may re-file once with new evidence, linked to the first dispute (proposed default). A re-credited clinician may dispute in turn; the counter-dispute is linked to the original. There is no appeal to the chair on disagreement with a ruling (proposed default).
- **User-facing behavior:** A row with a denied dispute still shows "Dispute not sustained..." and offers "Re-file with new evidence" once; a second denial ends the path with "This record has been disputed twice; no further filing". Dr. Y's counter-dispute shows "linked to dispute <id>".
- **Acceptance criteria:**
  1. All dispute rows for a record are viewable from the row in filing order with their states.
  2. A second filing on the same record by the same surgeon is accepted only once and stores the first dispute's id as linked dispute; a third is refused with explanatory text.
  3. A dispute filed by the receiving clinician on a re-credited record stores the original dispute id as linked dispute, and both rows show each other's id and state.
  4. A denial cannot be escalated to the chair unless an F-58 involvement test is true.
- **Data required:** Ledger linked dispute id; record dispute history.
- **Rules enforced:** GR2 (chair only when the chief is involved); design doc (overrides versioned, never silent); journeys J2.8a.
- **Journey steps:** J2.8a, J2.9
- **Metrics:** All except Work RVUs — live tracker
- **Dependencies:** F-55, F-59.
- **Open questions:** OQ-16 (re-filing limit; appeal route; counter-dispute).

### F-63 Definition-question outcome and definition-page open items

- **Milestone:** M1
- **Description:** A dispute that is really a definition disagreement is marked "definition question" by the adjudicator instead of being decided; it is logged to the definitions owner with its date and appears on the metric's definition page as an open item. The record is unchanged and nothing recomputes. Proposed default; the brief gives a route only for records.
- **User-facing behavior:** The chief marks "the grace window should be five minutes" as a definition question; the FCOT definition page shows "Open item (logged <date>): grace window"; the surgeon's row reads "Definition question logged <date>".
- **Acceptance criteria:**
  1. "Definition question" is a selectable decision that requires the metric and a one-line summary; the record's override fields stay empty and no recompute runs.
  2. The item is written to the definition registry (F-13) as an open item with date, dispute id and metric, and shown on that metric's definition page (F-50).
  3. The definitions owner is notified with the item; the surgeon's row and decision email carry "Definition question logged <date>".
  4. When a new definition version lands the open item is closed with a link to the version.
- **Data required:** Definition registry; ledger; definitions owner contact.
- **Rules enforced:** Brief header ("edits go in a new version, not here"); GR5; GR2 gives a route only for records, so this is a proposed default.
- **Journey steps:** J2.12
- **Metrics:** All
- **Dependencies:** F-13, F-61, F-50.
- **Open questions:** OQ-22 (where definition and peer-group disputes go).

### F-64 Monthly sustained-override list per feed owner

- **Milestone:** M1
- **Description:** At publish, one list per feed owner (periop in the wedge) of every sustained override not yet confirmed at source: case id, field, logged value, adjudicated value, decider, decision date, definition version, dispute id. Sent to the named contact with the send date recorded on the period record. The department does not wait for the source; nothing is hand-edited.
- **User-facing behavior:** The periop contact receives one email per month, never per dispute. The analyst sees the list and its send date on the period record; the surgeon's row continues to read "correction requested at periop <date>" until re-ingest confirms the change.
- **Acceptance criteria:**
  1. Exactly one list per feed owner per publish, containing every override with no source-confirmed date, including those from prior months; nothing is omitted because the source has not yet changed.
  2. Each item carries case id, field, logged value, adjudicated value, decider role, decision date, definition version and dispute id.
  3. The list is addressed to the contact named in F-04; a feed owner with no named contact blocks "source corrected" outcomes rather than producing an unsent list.
  4. Send date and recipient are stored on the period record (F-95).
  5. This feature only reports; a test confirms no ledger record or extract value changes when the list is produced.
  6. The list is sent only after the privacy-office gate for the feed-owner channel is recorded and passes the minimum-necessary payload scan (F-106 AC 1, AC 7); the send date, or the reason it was not sent, is on the F-112 checklist at publish.
- **Data required:** Ledger overrides; feed-owner table; publish record; re-ingested values for the convergence check (F-06).
- **Rules enforced:** Design doc Constraints (Disputes): "Sustained overrides go to periop monthly as a correction request; the department does not wait for them"; design doc Dependencies (named periop contact); GR2.
- **Journey steps:** J2.6, J2.7, J2.9, J2.11, J4.9
- **Metrics:** All except Work RVUs — live tracker
- **Dependencies:** F-04, F-05, F-06, F-95; a named periop analytics contact.
- **Open questions:** OQ-48 (named periop contact).

### F-65 Same-day cancellation record dispute

- **Milestone:** M1
- **Description:** Disputes on same-day cancellation rows where the disputable field is the reason code. Provenance shows the stored code, the surgeon-attributable reason-set version, and whether it counted. The correction lands at periop. Unlike FCOT, the reason enters the count, so a sustained correction moves the "as adjudicated" rate.
- **User-facing behavior:** The surgeon disputes a cancellation coded to a surgeon-attributable reason that belonged to anesthesia; after a sustained decision the row shows the corrected reason and "not counted against you (as adjudicated)".
- **Acceptance criteria:**
  1. Cancellation rows carry a dispute action with "reason code" as the disputable field; the effect notice for it exists (F-56).
  2. The provenance panel shows the stored reason code, whether it is in the surgeon-attributable set, the reason-set version, and "counted yes/no".
  3. A sustained correction to a reason outside the set removes the case from the "as adjudicated" numerator while "as logged" keeps periop's count; the tile shows both (F-47).
  4. The correction request goes to periop on the monthly list; the as-logged count matches periop's report until periop corrects it (F-81).
- **Data required:** OR-log cancellation records with reason code; versioned reason set (F-102); ledger override.
- **Rules enforced:** Brief: Bucket 2 ("Cancellations for reasons outside your control are not counted against you"); GR2; design doc Dependencies (periop leadership sign-off on the reason set).
- **Journey steps:** J2.11
- **Metrics:** Same-day cancellations you could have prevented
- **Dependencies:** F-102, F-05, F-29, F-47, F-81.
- **Open questions:** OQ-13 (how the reconciliation gate treats an adjudicated cancellation delta).

### F-66 Hosted dispute filing form pinned to one record

- **Milestone:** M2
- **Description:** The hosted view's "Dispute this record" form: shows the record's identity and the metrics it feeds, lets the surgeon pick the disputed field and write the claim, shows the effect notice (F-56), and creates the ledger row on submit with automatic routing (F-58).
- **User-facing behavior:** The surgeon presses "Dispute this record" on a row, sees date, room, procedure, scheduled start, wheels-in, stored delay reason, credited surgeon and the metrics the record feeds, chooses "delay reason" or "credited surgeon", writes the claim, and submits.
- **Acceptance criteria:**
  1. The form displays the record identity fields for its record type and the metrics the record feeds (for an OR-log attribution dispute: OR case volume, First-case on-time start (FCOT), Duration estimate accuracy).
  2. The disputed-field selector offers only fields defined as disputable for that record type in F-04.
  3. A claim of at least one character is required; submit creates a ledger row with status "open" and the definition version populated.
  4. The form can be opened only from a record row credited to the signed-in surgeon; there is no route to dispute a number, tile or spread.
  5. The effect notice for the selected field is displayed above the submit control.
- **Data required:** Ledger record with identity fields and fed metrics; disputable fields per record type; signed-in identity mapped to the roster.
- **Rules enforced:** GR2; GR1; design doc challenge 14 (per-user authorization).
- **Journey steps:** J2.2, J2.3
- **Metrics:** All except Work RVUs — live tracker
- **Dependencies:** F-55, F-56, F-58, F-04, F-85, F-86.
- **Open questions:** none.

### F-67 Admission record dispute with chair branch

- **Milestone:** M6
- **Description:** Disputes on admission rows in the Vizient-backed lists: the disputable field is the index-operation surgeon (a data error in the OR-log crosswalk), never the index-operation rule itself. When the chief is the discharging attending or index surgeon, test (c) routes to the chair. A sustained re-credit moves the admission out of all four Vizient-backed metrics for the period for both surgeons.
- **User-facing behavior:** The surgeon disputes a 25-day admission where the chief discharged; the row reads "Disputed - with chair"; the chair sees the Vizient provenance and rules on the index surgeon; the admission moves to the correct index surgeon's four lists.
- **Acceptance criteria:**
  1. Admission rows in the four Vizient-backed record lists carry a dispute action with "index-operation surgeon" as the disputable field.
  2. Test (c) fires automatically when the chief is the discharging attending or index surgeon; the row reads "Disputed - with chair, filed <date>".
  3. The form and decision cannot change the index-operation rule; a claim about the rule is recorded as a definition question (F-63).
  4. A sustained re-credit removes the admission from Length of stay (O/E), 30-day readmission (O/E), In-hospital mortality (O/E) and Case mix index for the period for the original surgeon and adds it for the receiver, each recomputed with min-n re-checked (10, 10, 30, 10 admissions).
  5. The provenance panel shows Vizient encounter id, load date, index-operation rule text, model version, definition version, discharging attending, observed and expected days (F-52).
- **Data required:** Vizient extract; OR-log index-operation crosswalk (F-08); roster roles.
- **Rules enforced:** GR1 ("Admissions go to the surgeon who did the index operation, even if a different attending discharged the patient"); GR2; GR3 min-n.
- **Journey steps:** J2.10
- **Metrics:** Vizient four
- **Dependencies:** F-08, F-58, F-52, F-07, F-29; medical staff office peer-review decision.
- **Open questions:** OQ-31.

### F-68 QI event record dispute

- **Milestone:** M6
- **Description:** Disputes on QI-database events (return to OR, SSI, VTE, CSF leak) where the surgeon claims the index case was not theirs. The correction lands with the QI coordinator; the scorecard annotates and never accepts a hand-entered complication.
- **User-facing behavior:** The surgeon disputes a return-to-OR event tied to a partner's index case; the row shows "annotated: index case not this surgeon's per chief's note; correction requested at QI database <date>" and the rate shows as logged and as adjudicated.
- **Acceptance criteria:**
  1. QI event rows carry a dispute action with "index case attribution" as the disputable field.
  2. No decision path writes a complication into the scorecard or edits a QI event; corrections are requests to the QI coordinator only.
  3. A sustained annotation moves the event out of the "as adjudicated" rate and keeps it in "as logged"; the interval and min-n (10, 20, 20, 10) are re-checked.
  4. When a later QI load no longer attributes the event to the surgeon's index case, the override retires with history (F-06).
- **Data required:** QI events joined to index cases (F-09); ledger override; QI coordinator contact (F-04).
- **Rules enforced:** Brief: Bucket 4 ("Complications come from the department's QI database, never entered by hand into the scorecard"); GR1, GR2, GR3.
- **Journey steps:** J2.11
- **Metrics:** QI four
- **Dependencies:** F-09, F-04, F-05, F-06, F-29.
- **Open questions:** OQ-32.

### F-111 Wedge ledger custody and decision intake

- **Milestone:** M1
- **Description:** Who holds the wedge dispute ledger (the shared sheet) and how a chief's decision gets into it. Proposed default (OQ-55), because the design doc says only that "a shared sheet is enough": the department analyst is the sole editor of the sheet and the only identity on its sharing list (plus a named backup analyst if the chair funds one); chiefs, the chair and surgeons never receive the sheet link; each dispute reaches its adjudicator as one email (F-92) carrying the record and its provenance (F-52 content); the adjudicator returns the decision by reply stating decision, outcome (when sustained) and note; the analyst enters it within two business days and keeps the reply, unaltered, as the record of decision; the sheet's sharing list and edit history are exported at every publish and stored on the period record as the M1 audit trail. Replaced at M2 by F-60's hosted queue, F-61's immutable decisions and F-86's role-based access.
- **User-facing behavior:** The chief receives one email per dispute, replies with "sustained (annotated): delay reason was anesthesia per the timing log" and hears nothing more until the next dispute; the chief never sees the sheet or any other surgeon's disputes. The analyst sees the sheet, its sharing list of one, and at publish an export of its edit history.
- **Acceptance criteria:**
  1. The sheet's sharing list contains exactly the analyst identity (and the named backup analyst where one is recorded on the roster); the publish run exports the sharing list to the period record (F-95) and stops if any other identity is on it.
  2. No email to a chief, the chair or a surgeon carries the sheet link; a scan of every outbound email for the sheet URL returns nothing (F-106 AC 7 scan set).
  3. Each dispute reaches its adjudicator as one F-92 email carrying the F-52 record columns and provenance and the reply instruction; a reply missing decision, outcome (when sustained) or note is answered with a request for the missing element within one business day and is not entered as a decision.
  4. The analyst enters a complete decision reply within two business days of its receipt; the decision date on the ledger row is the reply date; the reply's message id, date and sender are stored on the row as the record of decision, and the reply itself is kept unaltered in the dispute mailbox.
  5. The sheet's edit history for the period is exported at publish and stored on the period record; a decision row edited after entry without a later correction row citing it is flagged in the publish summary and the run stops until the analyst records the correction row.
  6. A decision row with no stored reply reference, or entered by an identity other than the analyst, is flagged by the publish check and the run stops.
  7. The chief's decision, once entered, is visible to the surgeon through F-93 and F-59 within the same 14-day target; the F-98 report measures time from reply date, not entry date.
- **Data required:** Shared sheet with sharing metadata and edit history export; dispute mailbox (message ids, dates, senders); roster (analyst, backup analyst, chiefs, chair); period record.
- **Rules enforced:** GR2; design doc Approach A ("a shared sheet is enough for four metrics"); design doc Constraints (Disputes: overrides visible, versioned, never silent); design doc Constraints (no leader view in the pilot; J2.5 is the only chief-facing screen); journeys J2.3a proposed default; journeys J2 failure mode (a reply sits unentered; the chief's queue goes unwatched).
- **Journey steps:** J2.3a, J2.5, J2.6
- **Metrics:** Wedge four
- **Dependencies:** F-55, F-57, F-92, F-95, F-52; named analyst on a chair-approved time fraction; MGB email.
- **Later consumers:** F-60, F-61, F-86 (M2) replace the sheet with the hosted queue and immutable decisions.
- **Open questions:** OQ-55 (custody model; backup analyst; whether a chief may hold the sheet read-only).

---

## Patient experience and inbox

Bucket 5: the four measures in the layout faculty already trust, plus the inbox that only the surgeon and their direct leader can see. Comments are never counted.

### F-69 Patient experience measures in the faculty-meeting layout

- **Milestone:** M4
- **Description:** Bucket 5 page showing, for each of the four measures, the surgeon's year average, each of the past three survey months as separate cells, and the MGB average, in the column order and labels of the current semiannual faculty-meeting slide (copied from the slide, held as a configuration artifact). Each tile links to its definition page and response list and shows its version. No composite, rank, target or count badge. Hosted view only.
- **User-facing behavior:** The surgeon opens Bucket 5 and sees the four measures laid out as at faculty meeting, any time instead of twice a year, with a definition link and a record link on each.
- **Acceptance criteria:**
  1. For each of the four measures the tile shows exactly: the year average, each of the past three survey months as separate cells, and the MGB average.
  2. Rendered column order and header labels match the slide-layout configuration artifact; a test compares rendered headers to the artifact and fails on any difference.
  3. Each tile shows its definition version id and links to the definition page (F-50) and the record list (F-53).
  4. No composite score, rank, target, count badge or sentiment figure appears anywhere on the page.
  5. The page is served only on the hosted, per-user-authorized view; no Bucket 5 content is emitted in the monthly email.
- **Data required:** Per-surgeon per-month values with year average and MGB average (F-28); slide-layout configuration artifact; definition version per measure.
- **Rules enforced:** Brief: Bucket 5 ("shown exactly the way you already see it at faculty meeting"); GR5; design doc Constraints (no composite, rank, target).
- **Journey steps:** J3.1, J3.10
- **Metrics:** Bucket 5 measures
- **Dependencies:** F-28, F-97, F-41, F-85; a copy of the current faculty-meeting slide.
- **Open questions:** OQ-40 (slide copy as precondition).

### F-70 Patient feedback inbox

- **Milestone:** M4
- **Description:** Every de-identified free-text comment about the surgeon, newest first, each displayed with the item scores from the same survey, in one place. No count badge, no unread count, no sentiment score, no tally, no summary, no peer view, nothing rolled into Citizenship or any other bucket. Comments live in a store no metric function reads.
- **User-facing behavior:** The surgeon opens the inbox and reads the newest comment (critical of a drain-care explanation) next to that survey's scores: top score on respect and listening, low on explained. Nothing is counted.
- **Acceptance criteria:**
  1. The inbox lists every comment from responses whose provider named maps to the viewer's surgeon record, ordered newest survey month first, each with the four item scores of the same response.
  2. The inbox page and its navigation entry carry no count, badge, unread indicator, sentiment label, summary or comparison; a UI test asserts none of these elements exist.
  3. Comments are stored in a table separate from response scores; a static check confirms no metric function, rollup, export or division/site view reads it (F-11).
  4. The inbox carries the survey source and scope label (F-97).
  5. A comment with an open or sustained dispute on its response shows the dispute status text (F-73) beside it.
- **Data required:** De-identified comments table (comment id, response id, survey month, text, credited surgeon); per-response scores.
- **Rules enforced:** Brief: Bucket 5 Patient feedback inbox ("every de-identified free-text comment about you, newest first, with the scores from the same survey, in one place"; "Comments are never counted, compared, or rolled up into anything").
- **Journey steps:** J3.4, J3.5, J3.10
- **Metrics:** Patient feedback inbox
- **Dependencies:** F-11, F-88, F-85, F-97.
- **Open questions:** OQ-40 (does the vendor feed include comments per response).

### F-71 Private notes on comments

- **Milestone:** M4
- **Description:** The surgeon can attach a private note to a comment; the note is stored with comment id, surgeon, text and timestamp, visible to the surgeon only (proposed default). The surgeon can edit or delete their notes (proposed default). Notes are never counted, exported, rolled up, shown in the record list or copied into the dispute ledger.
- **User-facing behavior:** Under the drain-care comment the surgeon writes "Post-op visit ran late; use teach-back for drain care." and sees it saved with a timestamp; the direct leader never sees it.
- **Acceptance criteria:**
  1. Adding a note stores a row with comment id, surgeon id, text and timestamp, and the note renders beneath that comment on the surgeon's next open.
  2. The direct leader's inbox response for the same surgeon contains no note rows; a test compares the two payloads.
  3. The surgeon can edit a note (timestamp updated) and delete it; a leader identity attempting to create, edit or delete a note is refused.
  4. Notes appear in no record list, dispute ledger row, export, rollup or metric; a static check confirms no reader outside the inbox service.
- **Data required:** Notes table (comment id, surgeon id, text, created and updated timestamps).
- **Rules enforced:** Brief: Bucket 5 ("You can: read, reflect, and add private notes"; never counted, compared or rolled up).
- **Journey steps:** J3.6, J3.8
- **Metrics:** Patient feedback inbox
- **Dependencies:** F-70, F-88.
- **Open questions:** OQ-42 (leader visibility; leader notes; editability; retention).

### F-72 Survey response dispute on the provider-named field

- **Milestone:** M4
- **Description:** The dispute action on a response row opens a dispute pinned to that response's provider-named field, never to the comment. The claim is structured: a reason from a fixed list ("visit done by another clinician", "not my patient", "other") plus the clinician the surgeon believes was seen, chosen from the roster; no free text, so the comment cannot be quoted into the ledger. Routed by F-58 unchanged: to the division chief, or to the chair when an involvement test fires (GR2); the adjudicator sees survey month, scores, provider named, source and load date and the structured claim; the comment is never shown to an adjudicator who is not the surgeon's direct leader (AC 5), which is what keeps the dispute path from widening the inbox audience. The correction goes to the patient experience office.
- **User-facing behavior:** The surgeon finds a comment describing a visit the APP did, opens its row, selects "Dispute this record", picks "visit done by another clinician" and the APP's name, reads what a sustained dispute will do, and submits. The row reads "Disputed - with chief".
- **Acceptance criteria:**
  1. The dispute form for a survey response offers exactly the reasons "visit done by another clinician", "not my patient", "other" and a clinician picker from the roster, and has no free-text field.
  2. Submitting creates a ledger row with response id, field disputed = provider named, structured claim (reason, believed clinician), filed date, definition version, adjudicator, and empty decision fields; the row and every notification contain no comment text.
  3. The form states before submission that under the annotated default a sustained dispute marks the response as attributed to another clinician and shows the measure as logged and as adjudicated, and that removal of the comment from the inbox is an open question.
  4. Routing applies F-58 unchanged: the adjudicator is the disputant's division chief per the roster as of the filed date, or the chair when an involvement test fires; the row reads "Disputed - with chief" (or "with chair") with the filed date; no survey exception exists in F-58 AC 1 or F-87 AC 3.
  5. The adjudicator view shows survey month, the four scores, provider named, source "survey vendor extract" with load date, and the structured claim; the comment is included only when the adjudicator identity is the surgeon's direct leader of record, enforced server-side.
  6. The analyst and the adjudicator are notified on filing (F-92); no notification contains the comment.
- **Data required:** Dispute ledger with survey-record fields; roster (direct leader, chief, chair; clinician list); per-response record (F-11).
- **Rules enforced:** GR2; GR1 ("Surveys go to the provider named on the survey"); brief: Bucket 5 ("you and your direct leader only"; the dispute path must not widen it); design doc Constraints (dispute as a ledger record); journeys review log finding 10.
- **Journey steps:** J2.11, J3.7
- **Metrics:** Bucket 5 measures; Patient feedback inbox
- **Dependencies:** F-53, F-87, F-55, F-58, F-04, F-85.
- **Open questions:** OQ-43 (the direct-leader routing alternative; reference to a de-identified response; what the office can change); OQ-41.

### F-73 Survey dispute status and outcome on the row, the inbox and the measure

- **Milestone:** M4
- **Description:** Dispute state shown on the response row and beside the comment in the inbox while open and after decision. Under the annotated default a sustained dispute marks the response "disputed: attributed to another clinician per chief's note", the four measures show as logged and as adjudicated for the affected months with the 10-response rule re-checked, and the override goes on the patient experience office's monthly list; a not-sustained decision shows on the row with the note and changes nothing. If the office corrects the provider field at source, the re-loaded response leaves the surgeon's list, inbox and measures and the override retires with history.
- **User-facing behavior:** The row changes from "Disputed - with chief, filed <date>" to the decision text; the measure tile shows "as logged" and "as adjudicated" if sustained; a denial is visible with the note.
- **Acceptance criteria:**
  1. While open, the row and the inbox entry read "Disputed - with chief, filed <date>" (or "with chair") and the measure values are unchanged.
  2. On "sustained (annotated)", the row reads "disputed: attributed to another clinician per chief's note" with decider role and decision date; each affected measure and month shows as logged and as adjudicated side by side, the adjudicated value excluding that response, and the 10-response rule is re-checked with the reason naming the dispute if the month crosses the threshold (F-38).
  3. On "not sustained", the row reads "Dispute not sustained by <role> on <date>: <note>", no value is recomputed, and the history stays on the row.
  4. Under the annotated default the comment remains in the inbox marked with the dispute status; it is removed only when a source correction re-loads the response with another provider named, after which the override retires and its history is kept.
  5. Each sustained override is added to the patient experience office's monthly list (F-64) with response id, field and decision date, never the comment text.
  6. The surgeon is notified of the decision (F-93) and the notification carries the row text, not the comment.
- **Data required:** Ledger decision fields; record-level override on the response; recompute of measure values (F-29); monthly override list (F-64).
- **Rules enforced:** GR2; design doc Constraints (two outcomes; overrides visible; as logged and as adjudicated side by side); design doc Premise 6; journeys J2.11 (the correction is to the provider field, never the comment).
- **Journey steps:** J3.7, J3.10
- **Metrics:** Bucket 5 measures; Patient feedback inbox
- **Dependencies:** F-72, F-28, F-29, F-38, F-59, F-64, F-93.
- **Open questions:** OQ-43 (does a sustained dispute remove the comment and the response); OQ-17.

---

## Citizenship (M&M)

The scorecard displays what the attendance system logs, with the brief's 8 of 12 target and no peer comparison.

### F-74 M&M attendance tile and session record list

- **Milestone:** M5
- **Description:** Attended out of sessions held while on faculty and not on approved leave, sessions remaining, the pace text from F-75, a session-level record list with a dispute action per session, the attendance-system source and as-of date, and no peer comparison. Never count-suppressed.
- **User-facing behavior:** "Attended 6 of 9 sessions held while on faculty and not on approved leave. 3 sessions remaining. On pace for 8 of 12." and a list of sessions showing scan present or absent.
- **Acceptance criteria:**
  1. Tile text form: "Attended <a> of <h> sessions held while on faculty and not on approved leave. <r> sessions remaining. <pace text from F-75>."
  2. Session record list columns: date, held yes/no, scan present/absent, removed by leave yes/no, counted yes/no; rows cover every session scheduled in the fiscal year and the counted rows equal h.
  3. Every session row carries a dispute action (F-76); a sustained scan dispute is corrected in the attendance system by its owner, never hand-entered.
  4. The tile carries "Source: attendance system, as of <date>" and "No peer comparison"; it is never count-suppressed; it names the fiscal year (F-45).
  5. Trend (proposed default, OQ-25): one point per month of the fiscal year showing cumulative attended against cumulative held to that month; a fixture with sessions held in months 1 to 9 and 6 attended yields nine points ending at 6 of 9; no cross-year or peer series is drawn.
- **Data required:** QR-code attendance scan log per session per surgeon; session schedule; faculty-status and approved-leave dates from the roster.
- **Rules enforced:** Brief: Bucket 6 M&M attendance (sessions attended out of sessions held while on faculty and not on approved leave; shown as attended so far, sessions remaining, on pace or off pace, clear flag; no peer comparison; "The scorecard displays what the system of record logs"); GR2, GR5.
- **Journey steps:** J1.14
- **Metrics:** M&M attendance
- **Dependencies:** F-75, F-49, F-97, F-45; QR attendance system live and owned; HR leave feed.
- **Open questions:** OQ-25 (does M&M attendance show a trend); OQ-49 (QR system live; owner; HR leave feed).

### F-75 Attendance and leave load, pace rule, cannot-reach flag and leave-scaled target

- **Milestone:** M5
- **Description:** Loads QR-scan attendance records per session, joins faculty-status and approved-leave dates from the roster to determine sessions held while on faculty and not on leave, computes attended, remaining, and the 8-of-12 target scaled proportionally and rounded up when leave removes sessions (flagged assumption), and stores the pace state under the proposed rule: on pace if attended plus remaining is at least the target and attended over held is at least target over scheduled; off pace otherwise; "cannot reach" when attended plus remaining is below the target. The drill-down records the computation.
- **User-facing behavior:** "On pace for 8 of 12", "Off pace", or a clear "Cannot reach 8 this year" flag; when leave applied, "Target scaled to 7 (assumption, to be confirmed)" with the computation in the drill-down.
- **Acceptance criteria:**
  1. A session counts in the denominator only if it was held while the surgeon was on faculty and not on approved leave per the roster as of the session date.
  2. With attended a, held h, remaining r, target T (8 when no leave applies) and scheduled S (12 when no leave applies): on pace iff a + r is at least T and a/h is at least T/S; off pace otherwise; "Cannot reach <T> this year" iff a + r is below T. Worked case a=6, h=9, r=3 yields on pace; a=3, h=9, r=3 yields cannot reach.
  3. When approved leave removes k sessions, both terms scale: S' = 12 − k and T' = ceil(8 × (12 − k) / 12), and the pace test in AC 2 uses T' and S'; the tile reads "Target scaled to <T'> (assumption, to be confirmed)" and the drill-down shows the formula, k, S', T' and the flagged assumption text. Worked case with leave: k=2 gives S'=10 and T'=7; a=4, h=6, r=4 yields a + r = 8 (at least 7) but a/h = 0.67 below T'/S' = 0.70, so off pace (the unscaled S=12 would wrongly give on pace); a=5, h=7, r=3 yields on pace.
  4. The scaled target and the cannot-reach flag are never computed while leave dates exist in the roster but have not been applied; such a run fails for that surgeon.
  5. Each session row stores date, held yes/no, scan present/absent, removed by leave yes/no and source as-of date; no peer group is computed; the pace and scaling rules are versioned configuration (F-100).
- **Data required:** QR attendance scan log; session schedule; roster faculty-status and approved-leave dates (F-99).
- **Rules enforced:** Brief: Bucket 6 ("Target: 8 of 12 per fiscal year, per the comp plan. If approved leave removes sessions, the target scales down proportionally and rounds up (assumption — to be confirmed)"; "a clear flag when 8 can no longer be reached"; "The scorecard displays what the system of record logs"); journeys J1.14 proposed pace rule.
- **Journey steps:** J1.14, J4.10, J4.15, J4.16
- **Metrics:** M&M attendance
- **Dependencies:** F-99, F-04, F-13, F-100, F-39.
- **Open questions:** OQ-03 (leave scaling, brief "to be confirmed"; pace rule).

### F-76 M&M session record dispute

- **Milestone:** M5
- **Description:** Disputes on session rows (a scan not recorded; a session during approved leave not removed). The correction lands in the attendance system (scan) or the roster (leave); the scorecard annotates until the source changes; pace recomputes on decision.
- **User-facing behavior:** The surgeon disputes a session marked "scan absent" they attended; on a sustained decision the row reads "annotated: attended per chief's note; correction requested at attendance system <date>" and the pace line updates.
- **Acceptance criteria:**
  1. Session rows carry a dispute action with disputable fields "scan present" and "removed by leave".
  2. A sustained decision annotates the session; attended count, sessions remaining, pace and the cannot-reach flag are recomputed as adjudicated.
  3. The correction request is sent to the attendance system owner on that owner's monthly list (F-64); the annotation retires when the scan log shows the scan (F-06).
  4. The scorecard never writes to the attendance system; the as-logged count remains what the system of record logs.
- **Data required:** Attendance scan log; roster leave dates; ledger override.
- **Rules enforced:** Brief: Bucket 6 ("The scorecard displays what the system of record logs"); GR2.
- **Journey steps:** J2.11
- **Metrics:** M&M attendance
- **Dependencies:** F-74, F-75, F-04, F-05, F-06, F-64.
- **Open questions:** OQ-14 (adjudicated attended count beside the logged count).

---

## wRVU tracker

A read-only mirror of the billing office's report: self-comparison only, no peer, no target (brief). No record list and no dispute action in this release, which is a deviation from GR5 and GR2 recorded as OQ-33, not a settled design. Never a comp system of record.

### F-77 Work RVUs — live tracker tile: read-only mirror with no dispute action

- **Milestone:** M5
- **Description:** Fiscal-year-to-date billed wRVUs against the same point last year, monthly bars with last year's bars ghosted, recent months marked "as of <billing as-of date>, may increase" with the prior snapshot ghosted, the PBO source and date, no peer comparison, no target (brief), and in this release no record list and no dispute action: a deviation from GR5 and GR2, which the brief states without exception, recorded as OQ-33 for the owner and not treated as settled. A wRVU question sent to the dispute address opens no ledger row.
- **User-facing behavior:** In the last quarter the surgeon reads FYTD wRVUs against last year, sees the two most recent months visibly short with the "may increase" note, and reads that corrections go to the professional billing office.
- **Acceptance criteria:**
  1. The tile shows FYTD wRVUs against the same point in the prior fiscal year, and monthly bars for the current fiscal year with the prior year's bars ghosted behind them.
  2. The current month and the one before carry "as of <billing as-of date>, may increase" with the prior snapshot ghosted; the delta between snapshots is stored per month (F-78).
  3. The tile carries "source: PBO report dated <date>", shows no peer comparison and no target, and the exact text "Your comp target is in your comp letter; this page does not show it." (proposed default; OQ-33).
  4. In this release there is no record list and no dispute action; the tile reads "Corrections to billed wRVUs go to the professional billing office; this page mirrors their report" and links only to the definition page; the definition page records this as a deviation from GR5 and GR2 pending OQ-33.
  5. A reply to the dispute address about wRVUs creates no ledger row; the analyst replies with the billing-office route; wRVU never appears on any feed-owner override list.
  6. The comp office's written confirmation that the scorecard's wRVU query matches theirs is recorded before the tile is first published.
- **Data required:** Billing wRVU feed by month with as-of date (F-78); prior fiscal year by month; prior snapshot per month; comp office confirmation.
- **Rules enforced:** Brief: Bucket 1 Work RVUs — live tracker (FYTD and by month; "yourself last year only. No peer comparison and no target"; "The as-of date reflects billing lag"); design doc Constraints (never a comp system of record; "as of <date>, may increase" with prior snapshot ghosted and delta logged); GR6; GR5 applied to the definition link only and GR2 not applied: a deviation inherited from journeys J1.13, pending OQ-33.
- **Journey steps:** J1.13, J1.20, J2.11
- **Metrics:** Work RVUs — live tracker
- **Dependencies:** F-78, F-97, F-96, F-50, F-43.
- **Open questions:** OQ-33 (deviation from GR5 and GR2: mirror only, or a charge-level list; no target intended; tile wording pending the owner; table year, modifiers, DOS vs posting).

### F-78 wRVU feed load with as-of date and restatement delta

- **Milestone:** M5
- **Description:** Loads billed wRVUs by month from the professional billing feed with the feed's as-of date and source report date, keeps the prior snapshot per month, and logs the restatement delta between snapshots. Stores the prior fiscal year for the self-comparison; no peer group or target is stored or computed.
- **User-facing behavior:** The analyst sees per surgeon-month: current wRVU, prior snapshot, delta, as-of date, source report date.
- **Acceptance criteria:**
  1. Each surgeon-month stores the current value, the feed as-of date, the source report date and the prior snapshot value; the delta is written to the restatement log (F-96) whenever the value changes.
  2. The prior fiscal year's monthly values are stored; no peer group or target is stored or computed for this metric.
  3. The tracker never count-suppresses; months are published with the as-of date even when values are known to be incomplete.
  4. The comp office's written confirmation of the query is recorded before the tile ships (F-77).
- **Data required:** Professional billing wRVU feed by month with as-of date; prior fiscal year values; comp office source query.
- **Rules enforced:** Brief: Bucket 1 wRVU; design doc Constraints (wRVU); design doc Success Criteria (comp office confirms the query in writing).
- **Journey steps:** J4.10, J4.14
- **Metrics:** Work RVUs — live tracker
- **Dependencies:** F-04, F-96, F-97.
- **Open questions:** OQ-33.

---

## Period close and publish

The analyst's monthly job: stage, attribute, compute, reconcile, suppress, check feeds, publish. One command; every gate stops the run before any surgeon sees a number.

### F-79 One-command monthly batch runner

- **Milestone:** M1
- **Description:** A single documented command that runs the whole period close in order (stage, attribute, roster, compute, reconcile, suppress, spread, feed health, publish) and stops at any failed gate. Runnable by the named department analyst without the builder, on a standing calendar entry.
- **User-facing behavior:** The analyst runs one command after the extract lands; the console prints each stage and its gate result and ends with "published <period> on <date>" or the name of the gate that stopped the run. A run log is written per invocation.
- **Acceptance criteria:**
  1. One command with the period as its only required argument executes every stage J4.1 to J4.9 in that order and writes a run log naming each stage and its outcome.
  2. If the reconciliation gate (F-81), the row-count invariant (F-51), the blank-reason gate (F-32) or an unresolved attribution exception (F-02) fails, the run stops before publish and no surgeon artifact is generated.
  3. A written one-command procedure exists; a named analyst who is not the builder runs the batch for one test period from that procedure alone, with no question to the builder, and the run log records who ran it. (Two consecutive unassisted production months is the PRD's survival criterion, measured from run logs, not tested here.)
  4. Re-running the command for an already published period is refused unless an explicit restate flag is passed, and a restatement is then logged (F-96).
- **Data required:** Periop extract; dated roster; definitions as code; run log store.
- **Rules enforced:** Design doc Distribution Plan (Operations); design doc Survival criterion (named analyst, one-command documented procedure, two consecutive months).
- **Journey steps:** J4.1, J4.9
- **Metrics:** All
- **Dependencies:** F-95, F-81, F-32, F-82, F-90, F-02.
- **Open questions:** OQ-48 (named analyst and time fraction).

### F-80 Extract field-presence check and "not computable" state

- **Milestone:** M1
- **Description:** Checks that each field a metric needs is present in the staged extract; if a field is missing, the metric for that period is marked "not computable: <field> not in extract" and the run continues for the other metrics. Records what is known not to be in the periop extract (block minutes; turnover, PACU and room-ready timing feeds). No proxy is ever computed.
- **User-facing behavior:** The analyst sees a per-metric field checklist. A missing field yields "not computable: wheels-in timestamp not in extract" on that metric for that period, which flows to the surgeon tile as its reason.
- **Acceptance criteria:**
  1. A field-to-metric map exists for the four wedge metrics (wheels-in, delay reason, booked and actual duration, cancellation reason code, room, panel roles); removing any mapped field from a test extract marks exactly the dependent metrics "not computable: <field> not in extract" and the other metrics still compute.
  2. A metric marked "not computable" never publishes a number or a zero; the surgeon tile shows the reason text verbatim.
  3. The staging summary states "not in this extract: block allocation and release minutes; OR turnover time, PACU boarding, room-ready delays" for the periop extract.
  4. The check runs before attribution; the run continues rather than aborting when a field is missing.
- **Data required:** Periop extract schema; field-to-metric map per definition version.
- **Rules enforced:** GR3; journeys J1 failure mode (a tile with a reason, never a number computed from a proxy); design doc challenges 24 and 31.
- **Journey steps:** J4.1
- **Metrics:** Wedge four; Block utilization (only if you have allocated block)
- **Dependencies:** F-95, F-33, F-44.
- **Open questions:** OQ-39; OQ-01 (room eligibility).

### F-81 Reconciliation gate against periop's report with definition delta registry

- **Milestone:** M1
- **Description:** Per surgeon, compares computed First-case on-time start (FCOT) and Same-day cancellations you could have prevented (and OR case volume and Duration estimate accuracy where periop reports them) with periop's own surgeon-level report for the month. Every difference must match a written definition delta in the registry, or a sustained re-attribution in the dispute ledger, or the run stops before publish. A delay-reason override is never a delta. The gate result is stored with the period.
- **User-facing behavior:** The analyst sees a per-surgeon table: our number, periop's number, difference, explanation (none / delta id / dispute id). Any unexplained difference blocks publish with the surgeon and metric named.
- **Acceptance criteria:**
  1. The gate ingests periop's surgeon-level report for the same month and compares per surgeon for each metric periop reports; a metric periop does not report is marked with the F-33 `not-reconciled` text "not reconciled: periop does not report" rather than passing silently.
  2. A difference with no matching written definition delta and no sustained re-attribution stops the run before publish; the run log names the surgeon and metric.
  3. A sustained re-attribution is accepted as an expected delta only when the ledger names the case id and the decision; a sustained delay-reason override is never accepted as a delta.
  4. The definition delta registry stores delta id, metric, text of the difference, author and date; a delta cannot be created during the run without an author.
  5. The gate result (pass, or list of explained differences) is stored on the period record (F-95).
- **Data required:** Periop surgeon-level FCOT and cancellation report; computed numbers (F-12); dispute ledger decisions; definition delta registry.
- **Rules enforced:** Design doc Success Criteria (Reconciliation); design doc challenge 3 (a department FCOT that differs from periop's is ruled out); journeys J4.5 proposed default.
- **Journey steps:** J4.5
- **Metrics:** Wedge four
- **Dependencies:** F-12, F-51, F-95, F-55.
- **Open questions:** OQ-12 (adjudicated FCOT excluding non-surgeon delays as a labelled department variant); OQ-54 (does periop report volume and duration at surgeon level).

### F-82 Feed health check and no-zero guard

- **Milestone:** M1
- **Description:** Before publish, checks whether each feed for the period loaded fully, partially or not at all. A failed or partial feed causes every affected metric to publish a worded reason instead of a number, never a zero. The guard distinguishes "no records loaded" from "zero records credited".
- **User-facing behavior:** The analyst sees a feed status line per source (received rows vs expected, load date). If the periop extract is missing, tiles read the reason; no surgeon sees 0 operations for a month whose data did not arrive.
- **Acceptance criteria:**
  1. A period with no staged extract for a feed publishes, for every metric from that feed, "<feed> for <period> not received as of <date>" and no numeric value.
  2. A metric whose denominator is zero because the feed failed is never published as 0 or 0%; a fixture with an empty extract yields the reason text on every wedge tile.
  3. A partial load (row count below a configurable expected minimum or a truncated date range) flags the period and requires an explicit analyst decision to publish with wording, recorded on the period record.
  4. The feed status is stored on the period record (F-95).
- **Data required:** Staged extract row counts and date range; expected volume baseline per feed.
- **Rules enforced:** Journeys J4.8 (a failed feed publishes a reason and never a zero); journeys J1 failure mode (OR case volume publishes as 0).
- **Journey steps:** J4.8
- **Metrics:** All
- **Dependencies:** F-95, F-33, F-44.
- **Open questions:** OQ-37.

### F-83 "Last refreshed" date on every artifact

- **Milestone:** M1
- **Description:** Every email and hosted page carries "last refreshed <date>" from the period record, set by the publish step and stored with the extract ticket number. A missed run shows the prior refresh date, never a blank, today's date or the send date. Per-source as-of dates for later feeds render separately (F-97).
- **User-facing behavior:** "last refreshed 12 November 2026" at the top of the email and page; if December's run does not happen, January's page still says 12 November.
- **Acceptance criteria:**
  1. Every email and every hosted page shows "last refreshed <date>" equal to the publish date of the most recent successful run for the period shown.
  2. If the monthly run is missed, the next artifact shows the previous publish date, never a blank and never the send or render date; a run that did not publish does not advance the stamp.
  3. The date is set by the publish step, not by email send time or page render time; the publish date and extract ticket number are stored with the period and retrievable by the analyst.
  4. The period record stores the month close date and the publish date, and a freshness report computes business days between them per period, so the PRD's criterion (OR-log metrics within 10 business days for three consecutive months) is measurable from stored dates; a fixture with close 31 October and publish 12 November reports 8 business days.
  5. Per-source as-of dates for Vizient, survey and billing render separately on their tiles and are not replaced by the batch's last-refreshed date.
- **Data required:** Period record publish date and ticket (F-95); per-source as-of dates.
- **Rules enforced:** Design doc Survival criterion ("every email and page shows 'last refreshed'"); design doc Distribution Plan (Operations: a missed run shows as a stale date); design doc Success Criteria (Freshness).
- **Journey steps:** J1.2, J1.20, J4.8, J4.9
- **Metrics:** All
- **Dependencies:** F-95.
- **Later consumers:** F-97 (M4) renders per-source as-of dates beside this stamp.
- **Open questions:** none.

### F-84 Closed-periods-only display

- **Milestone:** M1
- **Description:** Tiles, record lists and trends show only periods that closed before the publish date. In-progress months are never shown (proposed default), so a surgeon does not over-react to a 2-of-3 FCOT month.
- **User-facing behavior:** The surgeon never sees a partial month; a quarterly metric mid-quarter shows the interim text from F-45 instead of a partial value.
- **Acceptance criteria:**
  1. No tile, list or trend shows a period whose close date is after the publish date.
  2. A quarterly metric in a non-quarter-close month shows the interim cadence text, never a partial rate.
  3. The most recent period on any artifact equals the period the batch closed, not the calendar month of sending.
- **Data required:** Period close dates; publish date.
- **Rules enforced:** Brief "Counted: monthly" / "Counted: quarterly" (proposed default derived from it); journeys J1 failure mode (in-progress month shown without a cue).
- **Journey steps:** J1.3, J1.8, J1.19
- **Metrics:** All
- **Dependencies:** F-95, F-45.
- **Open questions:** OQ-24 (are in-progress months ever shown; 72-hour window visits).

### F-112 Deadline alerts to the analyst

- **Milestone:** M1
- **Description:** Every deadline the wedge's success criteria depend on becomes a dated check that the batch prints at the end of each run and that a one-command daily check prints on demand, with the adjudicator copied on dispute-age items. Nothing here is surgeon-facing. M1 form (proposed default, OQ-56): calendar entries for the extract and publish dates plus the printed checklist; at M2 the same checks are sent automatically. The design doc defers an automated failed-run alert to Approach B and says a missed run shows as a stale date; that is the surgeon's symptom, and this feature is the operator's signal. Checks: (a) extract not staged by business day 5 after month close (proposed default: leaves five business days for the 10-day publish target); (b) no successful publish by business day 10; (c) any open dispute at day 10 and at day 14 from its filed date without a decision; (d) a reply not entered within two business days (F-57) or a question not answered within two business days (F-91); (e) the feed-owner override list not sent at publish (F-64); (f) a bounced, blocked or misdirected send (F-90 AC 8 to AC 10).
- **User-facing behavior:** The analyst runs the daily check and reads, for example: "extract not staged: October, due business day 5 (1 day overdue)"; "dispute D-014 with chief Dr. X, day 10"; "2 replies unentered (received 3 Nov, 4 Nov)". The chief receives "Dispute D-014 on case <id> has been open 10 days; the target is 14."
- **Acceptance criteria:**
  1. A daily check command exists and prints every item below with its date and days overdue; the batch prints the same checklist at the end of every run; every printed checklist is stored with its date on the period record (F-95).
  2. On business day 6 after month close with no staged extract for the period, the checklist lists "extract not staged: <period>, due business day 5" (fixture calendar).
  3. On business day 11 after month close with no successful publish, the checklist lists "period not published: <period>, due business day 10".
  4. Every open ledger row at day 10 and at day 14 from its filed date is listed with dispute id, adjudicator and age, and on each of those days one email per adjudicator naming their listed disputes (case id and dispute id only) goes to that adjudicator and the analyst; a fixture with two disputes filed 10 days ago for the same chief yields one email naming both.
  5. Every reply unentered after two business days, every "awaiting row" reply older than two business days (F-57 AC 3) and every question unanswered after two business days (F-91 AC 6) is listed with its received date.
  6. After a publish with sustained overrides and no F-64 send date recorded, the checklist lists "override list not sent: <feed owner>".
  7. Every bounce, blocked send and open send incident from F-90 is listed until the period record shows it resolved.
  8. The checklist and the adjudicator emails contain no record content beyond case ids and dispute ids; the adjudicator email passes the F-106 AC 7 scan.
  9. At M2 the same items are sent automatically to the same recipients on the same days; the stored checklist remains the record.
- **Data required:** Period records (close date, staging date, publish date, send log, override-list send date); dispute ledger (filed dates, decisions); reply log; business-day calendar.
- **Rules enforced:** Design doc Success Criteria (Freshness: 10 business days; Trust: 14 days); design doc Distribution Plan (Operations: standing calendar entry; failed-run alert required for B); journeys J2 failure modes (the chief's queue goes unwatched; a reply sits in the dispute mailbox unentered).
- **Journey steps:** J2.3a, J2.5, J4.1, J4.9
- **Metrics:** All
- **Dependencies:** F-95, F-55, F-57, F-64, F-79, F-90, F-91.
- **Open questions:** OQ-56 (business-day thresholds; adjudicator copied at day 10; M1 checklist and calendar as the form).

---

## Roles and access

Per-user authorization, never static pages behind SSO. A surgeon sees their own data; a chief sees a record only through the dispute queue; the direct leader sees only the inbox, and only after the surgeon has had it for 30 days.

### F-85 Hosted per-surgeon authorized view with open logging

- **Milestone:** M2
- **Description:** When governance clears, the same published numbers, reasons, spreads and record lists are served as a hosted per-surgeon view with per-user authorization (BI row-level security or an app layer mapping SSO identity to the surgeon record). Every row has a "Dispute this record" button; page and case-list opens are logged. Deep link from the email only after the governance sign-offs are recorded.
- **User-facing behavior:** The surgeon follows a deep link, signs in with MGB SSO, sees only their own scorecard with the same values, versions and "last refreshed" as the email, opens a case list, and presses "Dispute this record" on a row. Any attempt to open another surgeon's record returns nothing.
- **Acceptance criteria:**
  1. The hosted view reads from the same published period data as the email; for any surgeon and period the tile values, denominators, reasons and version ids are identical in both.
  2. Authorization is per user: an authenticated surgeon can retrieve only records where credited surgeon = their roster identity as of the access date; a request for another surgeon's record id or page is refused and logged.
  3. No static per-surgeon file is served; the deployment check fails if surgeon-identified content is reachable without the authorization layer.
  4. Every record-list row shows a "Dispute this record" button that opens F-66 pinned to that record.
  5. Page opens and case-list opens are logged per surgeon with timestamp and feed the adoption report (F-91).
  6. The deep link is added to the email only after information security review, data governance sign-off and the QI determination are recorded (F-106); before that the email carries no link.
  7. Page-level states use the F-33 keys with their fixed wording and each writes an F-107 log row with the named outcome code: an authenticated identity that resolves to no roster row as of today (a resident, APP, new hire or a surgeon whose roster row ended) sees `not-on-roster` (outcome `no_roster`); a request before any period is published sees `no-period` (outcome `no_period`); a request for another surgeon's record or page sees `not-authorized` (outcome `refused`); a server or data failure sees `load-failure` (outcome `error`) and never a partial page. A test exercises all four and finds four log rows.
- **Data required:** Published period data; SSO identity to roster mapping; row-level security policy or app authorization layer; open log.
- **Rules enforced:** Design doc challenge 14 (static pages behind SSO give authentication, not authorization); design doc Constraints (PHI-derived data requires information security, data governance and a QI determination before hosting; surgeon first, leader views out of scope for A); design doc Distribution Plan (hosted view desktop-first).
- **Journey steps:** J1.4, J1.12, J4.9
- **Metrics:** All
- **Dependencies:** F-51, F-90, F-99, F-49, F-66, F-91, F-106, F-107; enterprise BI tool or app layer; governance sign-offs.
- **Open questions:** OQ-47 (BI RLS vs app layer; approving bodies and lead times).

### F-86 Dispute role-based access in the hosted view

- **Milestone:** M2
- **Description:** Per-user authorization for the dispute surfaces: a surgeon may file only on records credited to them; a chief sees only disputes routed to them with the record and provenance and no scores; the chair sees only escalations; a re-credited clinician sees the record only after the re-credit; the analyst administers the ledger with no viewer role on comments. In the email months the analyst enforces this by hand.
- **User-facing behavior:** A chief opening the queue sees their routed disputes and nothing else; opening another surgeon's list or tile is refused; SSO identity maps to the roster record as of today.
- **Acceptance criteria:**
  1. A request to file a dispute on a record not credited to the signed-in surgeon is refused.
  2. A chief can open only disputes whose adjudicator is them; the chair only escalated disputes; neither can open any surgeon's tiles, lists or spreads through the dispute surfaces.
  3. A re-credited record becomes visible to the receiving clinician only after the sustained decision is recorded.
  4. Every open of a dispute record is logged with viewer identity and time (F-107).
  5. Authorization uses the roster mapping as of the access date.
- **Data required:** SSO identity to roster mapping; roster roles as of date; access log.
- **Rules enforced:** Design doc challenge 14; design doc Constraints (no leader view for 30 days after any number; J2.5 is the only chief-facing screen); GR4.
- **Journey steps:** J2.2, J2.5, J2.9, J2.11
- **Metrics:** All except Work RVUs — live tracker
- **Dependencies:** F-85, F-99, F-87, F-107; security review, data governance, QI determination.
- **Open questions:** none.

### F-87 Chief and direct-leader mapping with access follow-through

- **Milestone:** M1
- **Description:** The roster names each surgeon's division chief (dispute routing) and direct leader (inbox access) as dated facts, distinct fields that may hold the same person; the run confirms both exist per surgeon; a chief change re-routes disputes filed from the change date; inbox access follows the new direct-leader mapping from the change date subject to the 30-day gate. A surgeon with no leader recorded has a surgeon-only inbox and appears on an exception list. The chair is recorded once.
- **User-facing behavior:** The analyst sees a per-surgeon mapping check (chief, direct leader, chair) and a warning for any gap. After a leader change the previous leader can no longer open that surgeon's inbox and the new leader can, subject to the 30-day gate.
- **Acceptance criteria:**
  1. The roster stores division chief and direct leader per surgeon with effective-from dates, as separate fields; both can be the same person or different people.
  2. Every surgeon on the roster as of the period has a division chief and a direct leader recorded; the run warns and lists any gap before publish; a surgeon with no direct leader has a surgeon-only inbox until one is recorded.
  3. Dispute routing (F-58) reads the chief mapping as of the filing date; a chief change dated D re-routes disputes filed on or after D.
  4. Inbox viewer checks (F-88) read the direct-leader mapping as of the access date; the prior leader is refused from the change date and the new leader is admitted no earlier than 30 days after the surgeon first had the inbox (F-89).
  5. The chair is recorded once on the roster and used by the F-58 escalation tests; until OQ-41 is answered, a practising chief's inbox has no leader access unless a direct leader is explicitly mapped.
- **Data required:** Dated roster (chief, direct leader, chair); dispute ledger routing field; inbox access check.
- **Rules enforced:** GR2; brief: Bucket 5 ("you and your direct leader only"); design doc Constraints (surgeon sees any number at least 30 days before any leader view).
- **Journey steps:** J3.4, J3.7, J3.8, J4.3, J4.16
- **Metrics:** Patient feedback inbox; dispute routing for all
- **Dependencies:** F-99.
- **Open questions:** OQ-41 (is the direct leader the division chief; leader of a practising chief); OQ-36.

### F-88 Inbox two-person viewer authorization

- **Milestone:** M4
- **Description:** Server-side viewer check on every inbox request: the SSO identity is resolved to a surgeon record, and the inbox is returned only when the viewer is that surgeon or the surgeon's direct leader of record as of today. Chair, administrators, a chief who is not the direct leader, and the analyst receive a refusal with no comment data.
- **User-facing behavior:** The surgeon and their direct leader open the inbox; anyone else sees the F-33 `not-authorized` refusal page and no comments.
- **Acceptance criteria:**
  1. A request for surgeon S's inbox succeeds only when the authenticated identity resolves to S, or to the surgeon recorded as S's direct leader as of the request date; all other identities receive a refusal whose payload contains no comment text or scores.
  2. The check is enforced server-side: a request that bypasses the UI and calls the inbox endpoint directly with a chair, administrator, analyst or non-direct-leader chief identity is refused.
  3. After a direct-leader change dated D, the previous leader is refused on the first request after D and the new leader is allowed from D (subject to F-89).
  4. The analyst identity has no inbox viewer role; pipeline access to comments is a separate service credential.
- **Data required:** SSO identity to surgeon-record mapping; dated roster direct-leader field (F-87).
- **Rules enforced:** Brief: Bucket 5 ("Who sees it: you and your direct leader only"); design doc challenge 14; journeys J4.10 (analyst has no viewer role).
- **Journey steps:** J3.4, J3.8
- **Metrics:** Patient feedback inbox
- **Dependencies:** F-87, F-85, F-106, F-107.
- **Open questions:** OQ-41; OQ-40 (analyst pipeline role).

### F-89 Direct leader inbox view with the 30-day surgeon-first gate

- **Milestone:** M4
- **Description:** The direct leader of record can open the surgeon's inbox no earlier than 30 days after the date the inbox first became available to the surgeon (stored per surgeon). The leader sees comments with same-survey scores, newest first, nothing aggregated, no private notes, and has no note-writing control. Whether the leader also sees the four measures and the bar chart is an open question; default off.
- **User-facing behavior:** The direct leader opens the surgeon's inbox after day 30, reads the drain-care comment next to its scores, sees no tally and no notes, and raises it in the 1:1. Nothing is stored from the 1:1.
- **Acceptance criteria:**
  1. The date the inbox first became available to each surgeon is stored; a direct-leader request before that date plus 30 days is refused with the F-33 `leader-gate` text "Available to the direct leader from <date>"; a request on or after that date succeeds.
  2. The leader's view shows comments with same-survey scores, newest first, and carries no count, badge, summary, sentiment or comparison.
  3. The leader's payload contains no private notes, and any note create, edit or delete by the leader identity is refused (F-71).
  4. With the default configuration the leader's view does not include the four measure tiles or the bar chart; enabling them is a versioned configuration change.
  5. Chair, administrator and a chief who is not the direct leader are refused (F-88).
- **Data required:** Per-surgeon inbox first-available date; dated roster direct-leader mapping; configuration flag (leader sees measures, default off).
- **Rules enforced:** Brief: Bucket 5 ("you and your direct leader only"; notes granted to "you"); design doc Constraints ("a surgeon sees any number at least 30 days before any leader view of it exists").
- **Journey steps:** J3.8, J3.9
- **Metrics:** Patient feedback inbox
- **Dependencies:** F-70, F-71, F-88, F-87.
- **Open questions:** OQ-42 (leader sees measures and chart; notes; whether the surgeon sees leader views).

---

## Delivery and notifications

Months one to three are an email to the surgeon's own MGB mailbox with no link. Every notification carries one record, never a spread or another surgeon's value.

### F-90 Monthly per-surgeon scorecard email

- **Milestone:** M1
- **Description:** One plain-text email per surgeon per published period to the surgeon's MGB mailbox carrying the four wedge tiles (value or worded reason), a 12-month trend, the definition version per tile, the surgeon's own case list as one attachment, "last refreshed <date>", the reply-to-dispute address, and the one-line "what this is not" text. No link in months one to three; no spread in month one; spread from month two for eligible surgeons. Sent only for a period whose run passed all gates.
- **User-facing behavior:** The surgeon opens the email on a phone, reads four tiles with values or reasons, sees the trend and version, opens the attached case list, and can reply to dispute a record. The analyst sees a send log with one row per surgeon.
- **Acceptance criteria:**
  1. Exactly one email per roster surgeon per published period, addressed only to that surgeon's MGB mailbox, containing only that surgeon's numbers and records; a test comparing attachment record ids with the ledger finds no record credited to another surgeon.
  2. The body contains tiles named exactly "OR case volume", "First-case on-time start (FCOT)", "Duration estimate accuracy" and "Same-day cancellations you could have prevented", each with a value (numerator and denominator) or a catalogue reason, the comparator text, the definition version id, and a trend at the metric's cadence per F-43 AC 1 (up to 12 monthly points for the three monthly metrics; up to four quarterly points for Same-day cancellations you could have prevented) or "history from <date>".
  3. The email contains "last refreshed <date>", the reply-to-dispute address and the "what this is not" line; in months one to three the body and attachment contain no hyperlink.
  4. In month one no email contains a peer spread section for any surgeon.
  5. The attached case list carries per row: date, room, procedure, scheduled start, wheels-in, on-time yes/no, delay reason as stored, booked vs actual minutes, cancellation reason where applicable, shared flag, dispute status; row counts equal the tile denominators.
  6. The email is plain text and the attachment opens in iOS and Android mail clients.
  7. No email is generated for a period whose run did not pass all gates; the send date per surgeon is stored on the period record so the PRD's 10-business-day criterion is measurable (F-83 AC 4).
  8. The recipient address is resolved at send time from the institutional directory by the surgeon's roster identity (proposed default; OQ-58), not typed on the roster; when the roster's stored address and the directory differ, that surgeon's send is blocked and listed for the analyst, and no other surgeon's send is affected.
  9. Non-delivery and bounce notices are logged against the period record per surgeon and appear on the F-112 checklist; a bounced send is retried only after the address is corrected, and the retry date is recorded; a surgeon is never silently skipped.
  10. A send to any mailbox other than the credited surgeon's own is recorded as an incident (date, recipient, the artifact's record ids) and handled under the institution's incident procedure (OQ-58); the procedure reference is stored with the incident.
  11. Every email and attachment passes the minimum-necessary payload scan before send (F-106 AC 7): no patient name, MRN, date of birth, CSN or encounter number, phone number or source free-text field; the case id is the ledger surrogate (F-54 AC 3).
- **Data required:** Published period per surgeon; roster identity and directory-resolved email; own case list per metric; publish date; reply-to-dispute address; reason catalogue; bounce notices.
- **Rules enforced:** GR5, GR6; design doc Approach A and Distribution Plan (month one self-only; "last refreshed" on every artifact; no host until governance clears); design doc Premise 7 (privacy-office confirmation); design doc Constraints (no composite, rank or target).
- **Journey steps:** J1.2, J1.10, J1.12, J4.9
- **Metrics:** Wedge four
- **Dependencies:** F-42, F-83, F-51, F-43, F-49, F-32, F-33, F-14, F-15, F-16, F-17, F-35, F-91, F-95, F-106; privacy-office confirmation that a surgeon's own case list may be emailed; institutional directory lookup by identity.
- **Open questions:** OQ-23 (plain text plus attachment is a proposed default; tracked link); OQ-58 (directory resolution; incident procedure).

### F-91 Reply-to-dispute address and adoption signal log

- **Milestone:** M1
- **Description:** A monitored reply-to address carried on every email, with each reply logged and classified (dispute, question, seen), the month-three interview answer stored per surgeon, and an adoption report against the design doc's success and kill criteria. In the hosted view, page and case-list opens are logged instead.
- **User-facing behavior:** The surgeon replies to the email to dispute a record, ask a question, or say "seen"; nothing else is asked of them until the month-three interview.
- **Acceptance criteria:**
  1. Every surgeon email carries the same monitored reply-to-dispute address in the body.
  2. Each reply is logged with surgeon, period, received date and one classification (dispute, question, seen); a dispute reply is handed to F-57 within two business days.
  3. The month-three interview answer to "did you open your case list, and when" is stored per surgeon.
  4. An adoption report shows, for months two and three: the share of pilot surgeons with an unprompted reply or a confirmed case-list open (target at least half); the count of surgeons who opened their case list (target at least three); a kill flag when fewer than half replied to or reported opening month two's email unprompted; and a record that no chief reminder was sent.
  5. In the hosted view, page opens and case-list opens are logged per surgeon with timestamp (F-85) and feed the same report.
  6. A reply classified "question" is answered by the analyst within two business days and the response date is logged against the reply; a question about a definition is also recorded as an open item on that metric's definition page through the F-63 open-item mechanism (F-63 AC 2, with the reply id in place of a dispute id) so it reaches the definitions owner; a question unanswered after two business days appears on the F-112 checklist. A "seen" reply needs no response and is logged only.
- **Data required:** Reply mailbox; reply log; interview record per surgeon; hosted open events.
- **Rules enforced:** GR2 (dispute entry point); design doc Success Criteria (Adoption) restated for the email months in journeys J1.12.
- **Journey steps:** J1.2, J1.12
- **Metrics:** Wedge four
- **Dependencies:** F-90, F-57, F-63.
- **Later consumers:** F-85 (M2) feeds hosted opens into the same report; F-112 (M1) reads the reply log.
- **Open questions:** OQ-23 (reply and interview, or a tracked link).

### F-92 Dispute filed and re-credit notifications

- **Milestone:** M1
- **Description:** One email per dispute event (proposed default; the brief defines no notification): on filing, to the analyst and the assigned adjudicator with the record identity, claim and provenance; on a sustained re-attribution, to the receiving clinician with the record and its dispute history and a dispute action. Never contains peer identities, spreads, another surgeon's value, or a survey comment.
- **User-facing behavior:** The chief receives "Dispute filed on case <id> by <surgeon>: <claim>" with the record and provenance; Dr. Y receives "Case <id> re-credited to you from <surgeon> by division chief on <date>: <note>".
- **Acceptance criteria:**
  1. Every filed dispute produces exactly one notification to the analyst and one to the assigned adjudicator within one business day of the ledger row's creation.
  2. Every sustained re-attribution produces one notification to the receiving clinician carrying the record, the history text and a dispute action.
  3. No notification contains peer identities, spreads, or any metric value of a surgeon other than the record's credited surgeon.
  4. For survey responses, no notification contains the comment text.
  5. In the wedge the adjudicator email is the adjudication surface (F-111): it carries the record columns and provenance of F-52 and a reply instruction naming the three elements a decision reply must state (decision, outcome when sustained, note).
  6. No notification is sent until the privacy-office gate for its channel (adjudicator email; re-credit notification) is recorded, and every notification passes the minimum-necessary payload scan (F-106 AC 1, AC 7).
- **Data required:** Ledger events; roster email addresses (surgeon, chief, chair, analyst); record provenance.
- **Rules enforced:** GR2; GR4; brief: Bucket 5 (inbox for you and your direct leader only).
- **Journey steps:** J2.3, J2.9
- **Metrics:** All with a record list
- **Dependencies:** F-55, F-58, F-52, F-106; MGB email.
- **Open questions:** OQ-21 (one email per dispute; receiving clinician notified).

### F-93 One-record decision email

- **Milestone:** M1
- **Description:** On every decision, the disputing surgeon receives a single-record email carrying the row text from F-59 and the surgeon's updated tile (value, or as logged and as adjudicated, or the suppression reason), inside the 14-day target. The next monthly email carries the same row and tile. In the hosted milestone the email carries a deep link to the record.
- **User-facing behavior:** "Decision on case <id>: Dispute sustained (annotated) by division chief on <date>: delay reason corrected to anesthesia; correction requested at periop <date>. FCOT October: 6 of 10 (60%), unchanged."
- **Acceptance criteria:**
  1. A decision email is sent for every decision type (sustained annotated, sustained source corrected, not sustained, definition question) to the disputant, quoting the case id.
  2. The email carries the exact row state text from F-59 and the updated tile with its value or reason, denominator, definition version and as-of date (F-29 recompute).
  3. Time from filed date (email months: the surgeon's reply date) to decision email is recorded per dispute and reported against the 14-day target (F-98).
  4. The next monthly email's tile and case-list attachment carry the same row state and tile values as the decision email.
  5. In the hosted milestone the email carries a deep link to the record.
  6. The decision email is sent only after the privacy-office gate for the decision-email channel is recorded and the email passes the minimum-necessary payload scan (F-106 AC 1, AC 7); the recipient address is resolved as in F-90 AC 8.
- **Data required:** Ledger decision event; recomputed tile (F-29); row state text (F-59); surgeon email resolved from the directory by roster identity.
- **Rules enforced:** Design doc Trust criterion (resolved within 14 days with the outcome visible in the record list); design doc Premise 6; GR2; journeys J2.3a proposed default.
- **Journey steps:** J1.12, J2.3a, J2.8, J2.8a, J2.12
- **Metrics:** All with a record list
- **Dependencies:** F-59, F-29, F-61, F-57, F-98, F-106, F-111.
- **Open questions:** OQ-20.

### F-94 Definition-change notification in the next email

- **Milestone:** M1
- **Description:** When a definition or configuration version is published, the next monthly email to each affected surgeon states that a definition changed, which metric, the version ids, and where the boundary sits on the trend. Proposed default.
- **User-facing behavior:** "First-case on-time start (FCOT) definition changed from v1 to v2 effective November: institutional grace window confirmed. The boundary is marked on your trend."
- **Acceptance criteria:**
  1. Every email for the first period after a new version's effective-from carries the change notice for each changed metric with old and new version ids and the effective period.
  2. The notice is generated from the registry diff summary (F-13), not typed.
  3. No notice is sent for a version that changed no metric the surgeon receives.
- **Data required:** Definition registry versions and diff summaries; email generator.
- **Rules enforced:** Journeys J4.15 proposed default; GR6 (boundary visible).
- **Journey steps:** J4.15
- **Metrics:** All
- **Dependencies:** F-90, F-13, F-96.
- **Open questions:** OQ-21 (are surgeons notified when a definition changes).

---

## Audit and versioning

Every period, extract, restatement and access is recorded so any number can be reproduced and any change explained.

### F-95 Extract staging and period run record

- **Milestone:** M1
- **Description:** Stages each incoming extract with its load date, source system, row count, hash and the periop ticket number, and records for each period the publish date, the ticket number, the definition and configuration version ids in effect, spread eligibility per surgeon, and the stored results of every gate. Immutable after publish; a restatement creates a new version linked to the prior one.
- **User-facing behavior:** The analyst sees a staging summary (source, ticket, load date, rows) at the start of the run and a period record at the end listing publish date, ticket, versions in effect and each gate's result. Any later reader can open the period record and see what the run was computed from.
- **Acceptance criteria:**
  1. Every staged extract stores source system, load date, row count, hash and ticket number; a run without a ticket number is refused.
  2. The period record stores publish date, ticket number, definition version ids, configuration version id, spread eligibility per surgeon, and the reconciliation, suppression, feed-health and exception-list gate results.
  3. The period record is immutable after publish; a restatement creates a new period record version linked to the prior one.
  4. The staging summary lists which required fields (wheels-in, delay reason, booked and actual duration, cancellation reason code, room, panel roles) are present.
- **Data required:** Extract file and ticket number; definition registry; configuration table; gate outputs.
- **Rules enforced:** Design doc Survival criterion (extract arrives through the owning team's standard request process with the ticket number recorded); design doc Premise 1.
- **Journey steps:** J4.1, J4.5, J4.9
- **Metrics:** All
- **Dependencies:** none (foundation).
- **Open questions:** none.

### F-96 Restatement log and trend markers

- **Milestone:** M1
- **Description:** Any change to an already published number (late-arriving records after a dispute, a source correction re-ingested, a new definition version applied to a prior period, a Vizient model refresh, a wRVU restatement, a source registered for a pending metric, a roster change) is logged with who, when, why, old value, new value and version ids, and the affected trend point is marked as restated or as a version boundary so a step change is not read as a change in practice.
- **User-facing behavior:** The analyst sees a restatement entry per changed number. The surgeon's trend shows a marker on a restated point and a boundary line where a definition version changed, with the old value on hover or in the list.
- **Acceptance criteria:**
  1. Every restatement stores number id, old value, new value, old and new definition version ids, reason category (late record, source corrected, definition version, model refresh, billing restatement, source registered, roster change, dispute decision), actor and timestamp.
  2. A restated trend point renders with a "restated" marker; a period boundary between definition versions renders as a boundary marker with the version ids on either side.
  3. Earlier periods are never restated implicitly; a restatement requires an explicit restate action and is refused without a reason category.
  4. The restatement log is readable from the number's provenance (F-51) and from the definition page (F-50).
- **Data required:** Provenance stamps (F-51); definition registry versions; restatement log store.
- **Rules enforced:** GR6; design doc Constraints (Disputes: overrides visible, versioned, never silent; wRVU: prior snapshot ghosted and restatement delta logged); journeys J4 failure mode (a version change restates old periods silently).
- **Journey steps:** J4.8, J4.13, J4.14
- **Metrics:** All
- **Dependencies:** F-51, F-13.
- **Open questions:** OQ-35 (restate or freeze earlier periods); OQ-18.

### F-97 Per-source as-of date and model version on every tile

- **Milestone:** M4
- **Description:** Every number stores and every tile shows the source it came from, that source's own as-of date, and for Vizient the risk model version, so the surgeon knows which numbers are final and which will change. Survey artifacts carry the exact scope label. Complements the batch-level "last refreshed" (F-83). A missed later-feed load shows the stale as-of date and a reason, never a blank or zero.
- **User-facing behavior:** Walking into annual review the surgeon reads "source: PBO report dated <date>", "Vizient model version <x>, as of <date>", "source: department QI database, as of <date>", "Source: attendance system, as of <date>", "MGB patient survey, outpatient provider items, as of <date> (responses lag four to eight weeks)", and knows which numbers may still move.
- **Acceptance criteria:**
  1. Every tile shows its source and as-of in the form for its feed: OR-log metrics via "last refreshed"; wRVU "source: PBO report dated <date>"; Vizient-backed metrics "Vizient model version <x>, as of <date>"; QI metrics "source: department QI database, as of <date>"; survey measures, the response list and the inbox "MGB patient survey, outpatient provider items, as of <date> (responses lag four to eight weeks)"; M&M "Source: attendance system, as of <date>".
  2. Source, as-of date and (for Vizient) model version are stored per number and retrievable with the record ids (F-51); the as-of date is the feed's own date stored at load and differs from the OR-log "last refreshed" date when the two loads differ.
  3. When a later feed's load for a period is missed, the label shows the previous load's as-of date and the metric shows "<feed> for <period> not received as of <date>"; no cell shows a blank or zero.
  4. A Vizient model version change or a wRVU restatement marks the boundary on the trend (F-96).
  5. The survey scope phrase "outpatient provider items" is a versioned configuration value that changes only by a new version once inpatient attribution is confirmed.
- **Data required:** Per-feed as-of dates and model versions at load; survey load record; configuration (scope phrase, lag phrase); restatement markers.
- **Rules enforced:** Design doc Constraints (Vizient, survey and billing metrics carry their own per-source as-of date and model version; patient experience labeled with the survey scope); design doc Freshness criterion (Vizient, survey and billing exempt from 10 days and show their own as-of); brief: Bucket 1 wRVU ("The as-of date reflects billing lag").
- **Journey steps:** J1.13, J1.14, J1.15, J1.16, J1.17, J1.18, J1.20, J3.1
- **Metrics:** All later-feed metrics
- **Dependencies:** F-04, F-51, F-83, F-96, F-11.
- **Open questions:** OQ-40 (inpatient survey items); OQ-46 (export or print for annual review).

### F-98 Dispute trust metrics report

- **Milestone:** M1
- **Description:** A monthly aggregate report from the ledger that measures the design doc's trust criteria: disputes filed (excluding the brief's owner), time to decision against 14 days, disputed-record rate per surgeon per month, outcomes by type, open overrides awaiting source, and the count of disputes not anchored to a reproducible record (must be zero). Aggregates only.
- **User-facing behavior:** The analyst runs the report at publish: "5 disputes filed by 4 surgeons; median 6 days to decision; 100% within 14 days; disputed-record rate 1.2% (month 1: 3.4%); outcomes: 2 annotated, 1 source corrected, 2 not sustained; 3 overrides awaiting periop".
- **Acceptance criteria:**
  1. The report is generated from the ledger at each publish with no hand-entered figures.
  2. It reports count of disputes by disputant excluding the brief's owner, median and maximum days from filed date to decision, and share decided within 14 days.
  3. It reports disputed records as a share of published records per surgeon per month, so the month-one to month-three trend is readable.
  4. It reports zero disputes without a record id; any non-zero count fails the report.
  5. It contains aggregates only: no claim text, note text or record content.
- **Data required:** Ledger; published record counts per surgeon and period.
- **Rules enforced:** Design doc Trust criterion (at least two disputes by non-owners resolved within 14 days; disputed-record rate falls month one to three; zero "the number is just wrong" outcomes).
- **Journey steps:** J2.3a, J2.5, J2.8
- **Metrics:** All with a record list
- **Dependencies:** F-55, F-95.
- **Open questions:** OQ-50 (who reads the report beyond the analyst).

---

## Admin and configuration

The roster, the configuration table, the signed reason sets and the source registry: the dated facts every other feature reads.

### F-99 Dated department roster dimension with step-zero attendance and opt-out flags

- **Milestone:** M0
- **Description:** The roster as a slowly changing dimension: per surgeon, effective-dated site, subspecialty, faculty status dates, approved leave dates, allocated block (yes/no), direct leader, division chief, institutional identity (from which the MGB mailbox is resolved at send time, F-90 AC 8), step-zero attendee flag with date, opt-out flag with date, and the definition versions presented at the meeting. Queryable "as of" any period. The analyst enters attendance and opt-out after the step-zero meeting.
- **User-facing behavior:** The analyst maintains roster facts with effective dates and can ask "who was on the roster at site A in October, with which subspecialty, chief and leader". Nothing renders to surgeons from the roster itself; the month-two email reflects the flags.
- **Acceptance criteria:**
  1. Each roster fact carries an effective-from date and optional effective-to date; a query for a period returns the values effective on the last day of that period.
  2. Every roster row has attended (yes/no), opt_out (yes/no), a recorded date for each, and the set of definition version ids presented at the meeting; all four combinations of attended and opt_out can be stored.
  3. A later change to either flag creates a new dated roster row; the earlier value remains readable as of its period.
  4. A surgeon can hold more than one site row concurrently; the peer-group step (F-31) receives one row per site.
  5. The roster names, for every surgeon as of the period, a division chief and a direct leader; the run warns on any surgeon missing either (F-87).
- **Data required:** Department roster source; faculty-meeting date and attendee list; HR leave dates (later); block allocation flag (later).
- **Rules enforced:** Design doc Dependencies (dated roster with site and subspecialty as a slowly changing dimension; blocker for peer groups); design doc Premise 11 (opt-out recorded); design doc Distribution Plan (record who attended step zero); design doc Constraints (no leader view for at least 30 days).
- **Journey steps:** J1.1, J4.3, J4.16
- **Metrics:** None directly (all peer groups, routing and access read it)
- **Dependencies:** none (foundation); faculty-meeting slot.
- **Open questions:** OQ-36 (roster source and maintainer; systems for faculty status and leave); OQ-09; OQ-10 (opt back in; make-up presentation).

### F-100 Versioned metric configuration table

- **Milestone:** M1
- **Description:** Per metric: cadence (monthly, quarterly, rolling 12 months, fiscal year to date), min-n as the brief states it, comparator, exclusions, reason sets, risk-model attribute, and named thresholds and rule parameters: the FCOT grace-window minutes and room-eligibility rule, the super-long boarder cutoff, the 72-hour window rule, the M&M pace and scaling rules, and the ADT proxy window for Unplanned return to ICU once registered. Any change is a new configuration version with an effective period so old numbers keep the thresholds they were suppressed under.
- **User-facing behavior:** The analyst reviews one table and sees every metric's cadence, min-n, comparator, exclusions and reason sets with the version id; editing any value produces a new version with an effective period.
- **Acceptance criteria:**
  1. The table holds a row for all 25 items in the brief with cadence, min-n, comparator and exclusions matching the brief text; a diff against the brief's values is empty at version 1 except the stored FCOT delta in AC 5.
  2. The surgeon-attributable delay reason set and cancellation reason set are stored as versioned lists with the periop leadership sign-off recorded; a set with no sign-off is marked "pending periop leadership sign-off" and the dependent metric label says so.
  3. Any change creates a new configuration version with effective-from period; the suppression engine (F-32) reads the version effective for the period being computed, so a prior period's suppression reason is unchanged after a threshold change.
  4. The table is readable by the definition page (F-50) so a surgeon can see the min-n and comparator in force for a given period.
  5. FCOT grace-window minutes and the FCOT room-eligibility rule are named parameters. The brief's values (0 minutes; first case of the day where the surgeon is primary) are stored as the flagged assumption; the values in force at version 1 are periop's confirmed values, entered from periop's written confirmation with its date, and the diff between the two is stored as the version-1 delta that F-12 AC 2, F-50 AC 1 and F-81 cite. A later change to either parameter is a new version, and the F-56 notice and the F-81 delta registry cite that version.
- **Data required:** Brief metric parameters; periop's written FCOT confirmation; reason sets with sign-off records; configuration version store.
- **Rules enforced:** GR3 (min-n per metric); brief per-metric "Counted" and "Compared to" values; design doc Dependencies (reason sets versioned with the metric code).
- **Journey steps:** J4.12
- **Metrics:** All
- **Dependencies:** F-13; periop's written confirmation of the FCOT definition.
- **Open questions:** OQ-38; OQ-02; OQ-01.

### F-101 Surgeon-attributable delay reason set (row labels only)

- **Milestone:** M1
- **Description:** A versioned set of delay reason codes signed by periop leadership. Once signed it labels each late FCOT row "your delay" or "not your delay"; it never changes the FCOT count, which stays the institutional count so it reconciles to periop's. While unsigned the pending state is shown.
- **User-facing behavior:** On the FCOT list the surgeon sees "not your delay" on the anesthesia row, and on the definition page sees which reasons count as surgeon-attributable or that the set is pending sign-off.
- **Acceptance criteria:**
  1. The set is stored with a version id, an effective period, and the periop leadership signer and date.
  2. While unsigned, the definition page shows "surgeon-attributable delay reason set: pending periop leadership sign-off" and FCOT rows carry no your/not-your label.
  3. Once signed, every late row is labeled "your delay" or "not your delay" by membership of the stored reason in the set; the FCOT numerator and denominator are unchanged by the label (a test recomputes with and without the set and gets the same count).
  4. A change to the set is a new version; earlier periods keep the labels computed under their version.
- **Data required:** Periop delay reason code list with distribution (blank and Other share, from the Assignment); signed set with version.
- **Rules enforced:** Brief: Bucket 2 FCOT note ("the delay reason is stored on each case, so a delay that wasn't yours can be disputed"); design doc Dependencies (periop leadership sign-off, versioned with the metric code); journeys J1.5 proposed default (the set labels rows and does not change the number).
- **Journey steps:** J1.4, J1.5
- **Metrics:** First-case on-time start (FCOT)
- **Dependencies:** F-15, F-100; periop leadership sign-off.
- **Open questions:** OQ-38; OQ-12.

### F-102 Surgeon-attributable cancellation reason set (numerator rule)

- **Milestone:** M1
- **Description:** A versioned set of same-day cancellation reason codes signed by periop leadership that defines the numerator of Same-day cancellations you could have prevented. Until signed the metric is not computed from an engineer-chosen set.
- **User-facing behavior:** The surgeon sees on the definition page which reason codes count against them, or that the set is pending sign-off and the tile shows a reason instead of a number.
- **Acceptance criteria:**
  1. The set is stored with a version id, an effective period, and the periop leadership signer and date.
  2. Until signed, the cancellation tile renders "not computable: surgeon-attributable cancellation reason set pending periop leadership sign-off" and no rate is published.
  3. Blank and "Other" reason codes are outside the set unless periop leadership explicitly includes them; their share of same-day cancellations is reported to the analyst each period.
  4. A change to the set is a new version; earlier quarters keep the numerator computed under their version unless explicitly restated with a logged restatement (F-96).
- **Data required:** Periop cancellation reason code list with distribution including blank and Other share; signed set with version.
- **Rules enforced:** Brief: Bucket 2 ("Cancellations for reasons outside your control are not counted against you"); design doc Dependencies (periop leadership sign-off; blocker for the metric); journeys J1 failure mode (a set decided by engineers).
- **Journey steps:** J1.8
- **Metrics:** Same-day cancellations you could have prevented
- **Dependencies:** F-17, F-100; periop leadership sign-off.
- **Open questions:** OQ-38.

### F-103 Source registry for pending and later feeds

- **Milestone:** M1
- **Description:** The registry of sources for metrics marked pending or not yet available. It exists from the first M1 run, holding the pending rows for Referral-to-visit days (pending confirmation of data source) and Unplanned return to ICU (pending confirmation of data source) and the not-in-this-release row for Block utilization (only if you have allocated block), which is what F-44 reads to render their states. A registration records the system, the extract, the join key, the attribution rule and the effective-from period; the metric becomes computable from that period (F-18, F-109, F-110); earlier periods keep their "pending" or "not in this release" reason unless the analyst explicitly restates them, which is logged. The first live registration is the block schedule (M3).
- **User-facing behavior:** The analyst fills in system, extract, join key, attribution rule ("referral received date to the resulting visit's rendering provider"; "ICU step-down and return event to the admission's index-operation surgeon"; "block minutes to the surgeon holding the block") and effective period. From the next run the metric computes for periods on or after that date; earlier tiles still read the pending text.
- **Acceptance criteria:**
  1. Registration requires all of: system, extract name, join key, attribution rule text, effective-from period; a registration missing the join key or attribution rule is refused.
  2. After registration the metric computes only for periods on or after effective-from; a run for an earlier period still renders the prior reason unless an explicit restate is requested and logged (F-96).
  3. The registration is dated and appears in the per-feed table (F-04) as a new or updated row.
  4. The three registrations named in J4.13 (referral, ICU return, block) each carry the attribution rule text from the journey.
  5. From the first M1 run the registry holds a row per pending or not-yet-available metric with status "pending source" or "not in this release" and no system, extract or join key; F-44 renders each state from that row, and the run log lists them as pending, not failed.
- **Data required:** Feed metadata; attribution rule text; effective period.
- **Rules enforced:** GR1 applied per record type at registration; journeys J4 failure mode (a pending-source metric backfilled from a source without the join key).
- **Journey steps:** J4.10, J4.13
- **Metrics:** Referral-to-visit days (pending confirmation of data source); Unplanned return to ICU (pending confirmation of data source); Block utilization (only if you have allocated block)
- **Dependencies:** F-04, F-44, F-96.
- **Later consumers:** F-18 (M3), F-109 and F-110 (M7) compute from the registered effective period.
- **Open questions:** OQ-04; OQ-05; OQ-34.

---

## Division and site views

The brief names three measures for these views and nothing else. F-104 is the individual-view text. F-105 was the placeholder for the views themselves and is retired; the scope boundary lives in "Explicitly out of scope" and OQ-52.

### F-104 Division-and-site-only measures: page text and "not computed in this cycle"

- **Milestone:** M1
- **Description:** OR turnover time, PACU boarding and room-ready delays are registered as metrics never computed for an individual; each period marks them "not computed in this cycle" and every surgeon artifact carries fixed text explaining that they will appear only on division and site views.
- **User-facing behavior:** Looking for the rest of the efficiency bucket, the surgeon reads: "OR turnover time, PACU boarding and room-ready delays are not on any individual scorecard because a surgeon cannot move them alone. They will appear only on division and site views." The analyst's run log lists the three as not computed.
- **Acceptance criteria:**
  1. The three measures exist in the metric registry with scope = "division and site only" and no per-surgeon function.
  2. Every period record lists the three as "not computed in this cycle".
  3. The efficiency section of every surgeon artifact carries the text above verbatim and shows no number, blank or zero for the three measures; no per-surgeon value for them exists in the ledger.
- **Data required:** Metric registry scope flag; catalogue text (F-33).
- **Rules enforced:** Brief: Bucket 2 closing note ("Deliberately not on the individual scorecard: OR turnover time, PACU boarding, room-ready delays. A surgeon cannot move these alone, so they appear only on division and site views").
- **Journey steps:** J1.9, J4.1, J4.9
- **Metrics:** OR turnover time; PACU boarding; room-ready delays
- **Dependencies:** F-33, F-95.
- **Open questions:** OQ-52.

### F-105 Division and site views (retired)

- **Milestone:** none (retired in version 1.1; the ID is kept and not reused)
- **Status:** Retired. Version 1.0 held a placeholder here for the division and site views the brief implies for OR turnover time, PACU boarding and room-ready delays. Its acceptance criteria said only what not to build, it traced to no journey step that describes a view, and its scope boundary is already carried by F-104 (the surgeon-facing text), the "Explicitly out of scope" table and OQ-52. Retired per the catalogue's own rule for placeholders with no testable criterion (review log finding 16).
- **Where its content went:** the scope statement (three measures on division and site views only; periop timing feeds; Approach B scope; a specification the brief does not contain) is in "Explicitly out of scope"; the guard that any future division or site view naming surgeons in a subspecialty under five would undercut the anonymity promised on their own page is recorded in OQ-52 as a condition on any specification.
- **Journey steps:** none
- **Metrics:** none

---

## Cross-cutting requirements

Requirements every screen, artifact and batch job inherits. Four are features of their own (F-106 to F-108, F-113); the rest are existing features that apply everywhere and are listed here so the PRD and technical design can cite one place.

| Requirement | Feature(s) | What every screen or job inherits |
|---|---|---|
| PHI handling and governance gates | F-106 | No surgeon-identified artifact leaves the pipeline before the gate for its channel is recorded, and every outbound artifact passes the minimum-necessary payload scan |
| SSO and per-user authorization | F-85, F-86, F-88 | Identity resolves to a roster record as of the access date; authorization, never authentication alone |
| Access and action audit | F-107, F-95, F-96 | Every open of surgeon-identified data, every decision and every restatement is logged |
| Empty and error states | F-33, F-44, F-32, F-82, F-80 | No blank, no zero from a failed feed, a worded reason with counts in every absent cell |
| As-of dates | F-83, F-97 | "last refreshed" from the period record on every artifact; per-source as-of and model version on later-feed tiles |
| Definition and version stamps | F-51, F-50, F-13 | Every number links to the version it was computed under |
| No composite, rank or target | F-42 | Automated scan of every artifact |
| Device and accessibility baseline | F-108 | Email readable on a phone; hosted view desktop-first; nothing conveyed by color alone |
| Trend on every metric | F-43 | Every tile, every cadence, history start disclosed |
| Dispute action on every row | F-54, F-49 | Every record list, every row; one deviation (Work RVUs — live tracker) pending OQ-33 |
| Deadlines the analyst owns | F-112 | Extract, publish, dispute age, reply entry, override list and bounces checked against dates on every run and every business day |
| Retention and disposition | F-113 | Every store has a retention class; nothing is disposed until data governance sets the period; departed surgeons stop receiving artifacts |

### F-106 PHI handling and governance gates

- **Milestone:** M1
- **Description:** The gates the design doc names, enforced as recorded facts the publish pipeline checks before each channel opens: a privacy-office confirmation per email channel (the surgeon's scorecard email with case list; the adjudicator dispute email; the decision email; the re-credit notification; the feed-owner override list) before that channel sends anything carrying record-level data; information security review, data governance sign-off and a QI determination before any hosted surgeon-identified page; a medical staff office peer-review decision before any quality metric (Bucket 4) is shown; data governance sign-off before the analyst pipeline handles survey comments. A minimum-necessary payload scan runs on every outbound artifact. No surgeon-identified content is reachable outside these channels. Each artifact carries only the surgeon's own records. The design doc's Premise 7 names only the surgeon's own email; the per-channel gates for the other four email channels are this catalogue's extension of it, recorded as gates to obtain rather than as policy.
- **User-facing behavior:** Not surgeon-facing beyond the channel opening. The analyst sees, per channel and per bucket, the gate name, whether it is recorded, by whom and on what date; a publish to an ungated channel is refused with the missing gate named.
- **Acceptance criteria:**
  1. The publish step refuses to send on any email channel until a privacy-office confirmation record (channel, body, date, reference) exists for that channel; the five channels are the surgeon scorecard email with case list (F-90), the adjudicator dispute email (F-92), the re-credit notification (F-92), the decision email (F-93) and the feed-owner override list (F-64); a refusal names the channel and the gate, and a test with four of five gates recorded finds exactly the fifth channel refused.
  2. The hosted view is unreachable until information security review, data governance sign-off and the QI determination are each recorded with date and reference; the deployment check fails otherwise.
  3. No Bucket 4 metric is published on any channel until a medical staff office decision is recorded; until then the tiles carry "not in this release" text from F-33.
  4. The survey load (F-11) is refused until the data governance sign-off for pipeline handling of comments is recorded.
  5. Every surgeon-facing artifact contains only records credited to that surgeon (plus the identities the brief's rules require, F-49 AC 6); a scan of each artifact's record ids against the ledger finds no other surgeon's record.
  6. Extract files, ledger tables and logs holding patient-level fields are stored and transmitted only through the institution's approved channels; the technical design names the channel per store and the check is part of the deployment review.
  7. Minimum-necessary payload: every outbound artifact (the F-90 email and attachment, F-92 and F-93 emails, the F-64 list, the F-37 summary, the F-98 report) is scanned before send for patient name, MRN, date of birth, CSN or encounter number, phone number and any source free-text field; a hit blocks the send, names the artifact and field, and is logged; a fixture attachment with an MRN column is blocked. The stable case id on every row is a ledger surrogate generated by the system (F-54 AC 3), and a test confirms it resolves to a patient only through the ledger.
  8. Gate records and payload-scan results per artifact are stored on the period record (F-95) and are listed in the analyst's publish summary.
- **Data required:** Gate records (channel or bucket, body, date, reference); artifact record ids; ledger; payload scan rules.
- **Rules enforced:** Design doc Constraints (PHI-derived, surgeon-identified data: information security review, data governance sign-off, QI-vs-research determination, medical staff office decision for quality data); design doc Premise 7; design doc Distribution Plan (governance path).
- **Journey steps:** J1.2, J2.3, J2.3a, J3.4, J4.9, J4.10
- **Metrics:** All
- **Dependencies:** F-95, F-33, F-54.
- **Later consumers:** F-90, F-92, F-93, F-64 (M1, gated senders); F-85 (M2); F-11 (M4).
- **Open questions:** OQ-47 (approving bodies and lead times; whether emailing a surgeon's own case list, or the adjudicator, decision and override-list emails, need any of them).

### F-107 Access audit log for surgeon-identified data

- **Milestone:** M2
- **Description:** Every open of a surgeon-identified page, record list, dispute record or inbox, and every refused attempt, is logged with the authenticated identity, the role resolved (surgeon, chief, chair, direct leader, analyst, other), the subject surgeon, the timestamp and the outcome. The log holds no comment text, scores, notes or claim text. Pipeline access to comments by service credential is logged too. Not shown to surgeons or leaders by default.
- **User-facing behavior:** No surgeon-facing surface by default. The analyst or a governance reviewer can list who opened which surgeon's data and when, and which attempts were refused. Whether a surgeon can see when their leader viewed the inbox is an open question the log makes answerable without a rebuild.
- **Acceptance criteria:**
  1. Each request for a surgeon-identified page, list, dispute record or inbox writes one log row: identity, resolved role, subject surgeon, resource type, timestamp, outcome (allowed or refused); a test opens an inbox as surgeon, as direct leader and as chair and finds three rows with the expected outcomes.
  2. Log rows contain no comment text, scores, notes or claim text.
  3. Pipeline access to the comments table by the analyst service credential is logged with timestamp and job id.
  4. The log is not shown to the surgeon or the leader by default; exposing "last viewed by your direct leader on <date>" is a versioned configuration change.
  5. The 30-day gate (F-89) is computed from the stored first-available date, not from the access log.
- **Data required:** Access log table; SSO identity and resolved role per request.
- **Rules enforced:** Brief: Bucket 5 ("you and your direct leader only": access must be demonstrable); design doc Constraints (information security review and data governance for a hosted surgeon-identified view); journeys J2.5 and J3.4 viewer checks.
- **Journey steps:** J1.12, J2.5, J3.4, J3.8, J4.9
- **Metrics:** All
- **Dependencies:** F-85, F-86.
- **Later consumers:** F-88, F-89 (M4) write inbox rows to this log.
- **Open questions:** OQ-42 (does the surgeon see leader views); OQ-51 and OQ-57 (retention period for the log).

### F-108 Device and accessibility baseline

- **Milestone:** M1
- **Description:** The email is readable on a phone; the hosted view is desktop-first and usable at phone width; every state the catalogue defines is conveyed in words, not by color, icon or position alone; charts carry the peer count, the surgeon's own value and any interval as text as well as graphics. The institution's accessibility standard is not stated in the brief or the design doc and is an open question; these criteria are the floor that does not depend on it.
- **User-facing behavior:** A surgeon reading the email on a phone sees four tiles and can open the attachment; a surgeon using the hosted view without color perception can still tell a suppressed cell, a restated point and their own marker from the text.
- **Acceptance criteria:**
  1. The monthly email renders as plain text with no horizontal scrolling on iOS and Android mail clients and the attachment opens on both (F-90 AC 6).
  2. Every catalogue state (F-33), dispute state (F-59), interval and "no evidence of difference" label (F-24) and the surgeon's own marker on a spread (F-46) is present as text in the artifact, so a text-only rendering of any page or email carries the same information as the graphical one.
  3. The hosted view is usable at desktop width and at phone width without loss of any tile, reason text or record list.
  4. When the institution's accessibility standard is named (OQ-51), conformance to it is added as a criterion here by a new version of this feature.
- **Data required:** None beyond the artifacts.
- **Rules enforced:** Design doc Distribution Plan (Devices: "email readable on a phone; hosted view desktop-first"); GR3 ("The screen says why", in words).
- **Journey steps:** J1.2, J3.1
- **Metrics:** All
- **Dependencies:** F-90, F-33.
- **Later consumers:** F-85 (M2) inherits the hosted-view criteria.
- **Open questions:** OQ-51 (institutional accessibility standard).

### F-113 Retention and disposition

- **Milestone:** M1
- **Description:** Every store that holds patient-level or surgeon-identified data has a retention class in a versioned configuration, and a disposition job removes records only when the class's period is set and has elapsed, recording what it removed. The brief and the design doc state no retention period, so every class starts with the period "unset: to be set by data governance (OQ-57)" and nothing is disposed while a period is unset. Stores: staged extracts (F-95); attribution ledger and overrides (F-01, F-05); dispute ledger, the wedge sheet and the reply mailbox (F-55, F-57, F-111); sent artifacts and send logs (F-90, F-92, F-93, F-64); period records and the restatement log (F-95, F-96); access log (F-107); comments table and private notes (F-11, F-71); adoption and trust reports (F-91, F-98). Departed surgeons (proposed default, OQ-57): the roster row ends with a date; their records stay in the ledger for the periods they belong to, because peer groups are computed as of the period; no artifact is generated or sent from the end date; hosted access is refused from the end date (F-85); reply-mailbox threads are closed; what happens to their inbox, comments and notes waits on OQ-57.
- **User-facing behavior:** Not surgeon-facing. The analyst sees one table of stores, classes and periods (most "unset" until data governance answers), the disposition log, and a held list of records the job could not remove. A surgeon who leaves the department receives no further email from the end date.
- **Acceptance criteria:**
  1. The retention configuration lists every store named in the technical design with a class and a period or "unset"; the disposition job refuses to run against a store with no class, and the deployment check lists any store without one.
  2. While a class's period is unset no record in that store is disposed; a test with every period unset runs the job and finds no change in any store.
  3. When a period is set and has elapsed for a record, the job removes it and writes a disposition log row (store, key range, count, class version, date, actor); the log holds no record content.
  4. The job never removes a record referenced by a period record still within its own retention, by an open dispute, or by an unconfirmed override; a fixture with an elapsed extract row referenced by a retained period record leaves it in place and lists it as held.
  5. A roster row with an end date stops all artifact generation and sends for that surgeon from that date: a run after the end date generates no email for them, and a hosted request resolves to F-33 `not-on-roster` (F-85 AC 7).
  6. A departed surgeon's ledger records remain, and recomputing a past period after the end date gives the same peer counts and values as before it.
  7. Any change to a class or period is a new configuration version with an effective date; earlier disposition log rows keep the class version they ran under.
- **Data required:** Retention configuration; store inventory from the technical design; roster end dates (F-99); disposition log; period records.
- **Rules enforced:** Design doc Constraints (PHI-derived, surgeon-identified data inside a hospital; data governance sign-off as a prerequisite, F-106 AC 2); brief header (versions, not edits); GR3 (peer groups as of the period; a departure does not rewrite history).
- **Journey steps:** J4.1, J4.16 (no journey walks disposition; derived from the design doc's governance constraint and F-106)
- **Metrics:** All
- **Dependencies:** F-95, F-96, F-99, F-100, F-55.
- **Open questions:** OQ-57 (retention period per class from the data-governance body; departed-surgeon inbox, comments and notes).

---

## Metric coverage

Every item in the brief (25) plus the three division-and-site-only measures. Shared sets, to keep cells readable:

- **Shared display set (D):** F-34 comparator; F-43 trend; F-49 record list; F-50 definition page; F-51 version stamp; F-83 last refreshed; F-84 closed periods; plus F-46 spread where a peer comparison exists and F-97 as-of for later feeds.
- **Shared dispute set (X):** F-54 action on every row; F-55 ledger; F-56 effect notice; F-58 routing; F-59 row state; F-61 decision; F-62 history; F-64 override list; F-05 override; F-06 convergence; F-29 recompute; F-47 as logged / as adjudicated; F-92, F-93 notifications; F-57, F-111, F-112 (email months); F-66, F-86 (hosted).
- **Shared suppression set (S):** F-31 peer groups; F-32 engine and min-n table; F-33 catalogue; F-35 eligibility; F-36 spread storage; F-38 dispute-caused reason; F-39 roster change.

| Metric (brief name) | Computing feature(s) | Display feature(s) | Dispute feature(s) | Suppression rule feature(s) |
|---|---|---|---|---|
| OR case volume | F-01, F-12, F-14, F-81 | F-14, D, F-46 | X, F-07 | Never count-suppressed (F-32 AC 2); peer-under-five S |
| Case mix index | F-08, F-12, F-22 | F-22, F-45, F-97, D, F-46 | X, F-67, F-07 | S (min-n 10 admissions; system-wide group, F-22 AC 2) |
| New patient visits | F-10, F-12, F-26 | F-26, D | X | Never count-suppressed; peer-under-five S |
| Work RVUs — live tracker | F-78 | F-77, F-43, F-45, F-50, F-97 | None in this release: deviation from GR5 and GR2 pending OQ-33 (F-77 AC 4, AC 5; F-04 AC 4) | Never suppressed; "No peer comparison" (F-34 AC 4) |
| First-case on-time start (FCOT) | F-01, F-12, F-15, F-101, F-81 | F-15, D, F-46, F-47 | X, F-07, F-101 | S (min-n 4 first cases) |
| Duration estimate accuracy | F-01, F-12, F-16, F-81 | F-16, D, F-46, F-47 | X, F-07 | S (min-n 5 cases) |
| Block utilization (only if you have allocated block) | F-18, F-103 | F-18, F-44, D, F-46 | X | Never count-suppressed; "not applicable" F-18; "not in this release" F-44; peer S |
| Same-day cancellations you could have prevented | F-01, F-12, F-17, F-102, F-81 | F-17, F-45, D, F-46, F-47 | X, F-65 | S (min-n 10 scheduled cases) |
| Clinic notes closed within 72 hours | F-10, F-12, F-27 | F-27, D | X | S (min-n 10 visits) |
| Third-next-available appointment | F-10, F-12, F-25 | F-25, D | X | S (min-n 2 samples) |
| Referral-to-visit days (pending confirmation of data source) | F-109, F-12 (invoked only from the F-103 effective period; F-10 for visits) | F-44 ("Data source pending confirmation") until registered; then F-109, F-45, D, F-46 | X (rendering provider field, F-109 AC 5) | F-44 pending state; S (min-n 10 visits) |
| Length of stay (O/E) | F-08, F-12, F-24, F-19 | F-19, F-24, F-45, F-97, D, F-46 | X, F-67, F-07 | S (min-n 10 admissions) |
| 30-day readmission (O/E) | F-08, F-12, F-24, F-20 | F-20, F-24, F-45, F-97, D, F-46 | X, F-67, F-07 | S (min-n 10 admissions) |
| In-hospital mortality (O/E) | F-08, F-12, F-24, F-21 | F-21, F-24, F-45, F-97, D, F-46 | X, F-67, F-07 | S (min-n 30 admissions, rolling 12 months) |
| Unplanned return to the OR within 30 days | F-09, F-12, F-24, F-23 | F-23, F-24, F-45, F-97, D, F-46 | X, F-68 | S (min-n 10 cases) |
| Surgical site infection | F-09, F-12, F-24, F-23 | F-23, F-24, F-45, F-97, D, F-46 | X, F-68 | S (min-n 20 cases) |
| VTE within 30 days | F-09, F-12, F-24, F-23 | F-23, F-24, F-45, F-97, D, F-46 | X, F-68 | S (min-n 20 cases) |
| CSF leak requiring intervention (neurosurgery only) | F-09, F-12, F-24, F-23 | F-23, F-24, F-45, F-97, D, F-46 | X, F-68 | S (min-n 10 eligible cases) |
| Unplanned return to ICU (pending confirmation of data source) | F-110, F-12, F-24 (invoked only from the F-103 effective period; F-08 for admissions) | F-44 ("Data source pending confirmation") until registered; then F-110, F-24, F-45, F-97, D, F-46 | X, F-67 rule (index-operation surgeon field, F-110 AC 5) | F-44 pending state; S (min-n 10 admissions) |
| Net promoter score | F-11, F-12, F-28 | F-69, F-48, F-40, F-53, F-50, F-97 | F-72, F-73, X | F-41 (month under 10 responses); F-40 (peer-under-five); S |
| "Provider explained things in a way I could understand" | F-11, F-12, F-28 | F-69, F-48, F-40, F-53, F-50, F-97 | F-72, F-73, X | F-41; F-40; S |
| "Provider listened carefully" | F-11, F-12, F-28 | F-69, F-48, F-40, F-53, F-50, F-97 | F-72, F-73, X | F-41; F-40; S |
| "Provider showed respect" | F-11, F-12, F-28 | F-69, F-48, F-40, F-53, F-50, F-97 | F-72, F-73, X | F-41; F-40; S |
| Patient feedback inbox | None (never counted; F-11 stores comments outside every count) | F-70, F-71, F-88, F-89, F-97 | F-72, F-73 (on the provider-named field, never the comment) | None (no count, no comparison); access rule F-88 |
| M&M attendance | F-75 | F-74, F-45, F-50, F-97, F-43 (trend: cumulative by month, F-74 AC 5; OQ-25) | F-76, X | Never count-suppressed; "No peer comparison" (F-34 AC 4); leave removal F-39, F-75 |
| OR turnover time (division and site views only) | None (F-104: not computed) | F-104 page text; the views are out of scope (OQ-52) | None | None (not computed) |
| PACU boarding (division and site views only) | None (F-104) | F-104; views out of scope (OQ-52) | None | None |
| room-ready delays (division and site views only) | None (F-104) | F-104; views out of scope (OQ-52) | None | None |

---

## Journey step traceability

Every step ID in the journeys document. A step with no feature of its own says why. Two steps (J1.11, J3.9) are human actions with no system behavior of their own; they are covered by acceptance criteria on the features listed.

| Step | Feature IDs | Note |
|---|---|---|
| J1.1 | F-42, F-99 | Faculty meeting is a human action; the system records attendance, opt-out and the statement version |
| J1.2 | F-42, F-43, F-51, F-83, F-90, F-91, F-106, F-108 | |
| J1.3 | F-15, F-32, F-34, F-43, F-51, F-84 | |
| J1.4 | F-01, F-02, F-15, F-49, F-59, F-85, F-101 | |
| J1.5 | F-15, F-50, F-51, F-101 | |
| J1.6 | F-16, F-32, F-34, F-43, F-49, F-50 | |
| J1.7 | F-01, F-14, F-31, F-32, F-34, F-43, F-49 | |
| J1.8 | F-17, F-32, F-34, F-45, F-49, F-84, F-102 | |
| J1.9 | F-18, F-44, F-104 | The division and site views themselves have no feature (F-105 retired); the step's page text is F-104 |
| J1.10 | F-31, F-32, F-34, F-35, F-36, F-46, F-90 | |
| J1.11 | F-36, F-46 | No feature of its own: the surgeon recognizes a colleague and nothing changes. Covered by F-46 AC 3 (no unidentifiability claim) and F-36 AC 2 (render logged) |
| J1.12 | F-57, F-59, F-85, F-90, F-91, F-93, F-107 | |
| J1.13 | F-43, F-50, F-51, F-77, F-97 | |
| J1.14 | F-49, F-50, F-74, F-75, F-97 | |
| J1.15 | F-08, F-19, F-24, F-43, F-45, F-46, F-49, F-97 | |
| J1.16 | F-08, F-21, F-24, F-32, F-43, F-45, F-49, F-97 | |
| J1.17 | F-23, F-24, F-32, F-43, F-44, F-45, F-49, F-97, F-110 | |
| J1.18 | F-08, F-20, F-22, F-24, F-43, F-45, F-46, F-97 | |
| J1.19 | F-25, F-26, F-27, F-43, F-44, F-49, F-50, F-84, F-109 | |
| J1.20 | F-51, F-77, F-83, F-97 | Export or print is an open question (OQ-46), not a feature |
| J2.1 | F-49, F-54 | |
| J2.2 | F-54, F-55, F-56, F-66, F-86 | |
| J2.3 | F-29, F-55, F-58, F-59, F-66, F-92, F-106 | |
| J2.3a | F-55, F-57, F-93, F-98, F-106, F-111, F-112 | |
| J2.4 | F-57, F-58, F-59 | |
| J2.5 | F-52, F-60, F-86, F-98, F-107, F-111, F-112 | |
| J2.6 | F-04, F-05, F-06, F-55, F-61, F-64, F-111 | |
| J2.7 | F-29, F-38, F-47, F-56, F-64 | |
| J2.8 | F-05, F-06, F-47, F-56, F-59, F-93, F-98 | |
| J2.8a | F-55, F-59, F-61, F-62, F-93 | |
| J2.9 | F-05, F-06, F-07, F-29, F-55, F-58, F-59, F-62, F-64, F-86, F-92 | |
| J2.10 | F-07, F-29, F-38, F-52, F-58, F-67 | |
| J2.11 | F-04, F-06, F-54, F-64, F-65, F-68, F-72, F-76, F-77, F-86 | |
| J2.12 | F-55, F-59, F-61, F-63, F-93 | |
| J3.1 | F-11, F-28, F-40, F-48, F-69, F-97, F-108 | |
| J3.2 | F-28, F-41 | |
| J3.3 | F-50, F-53 | |
| J3.4 | F-11, F-70, F-87, F-88, F-106, F-107 | |
| J3.5 | F-70 | |
| J3.6 | F-71 | |
| J3.7 | F-11, F-53, F-72, F-73, F-87 | |
| J3.8 | F-71, F-87, F-88, F-89, F-107 | |
| J3.9 | F-50, F-89 | No feature of its own: the 1:1 conversation is a human action; nothing is stored and the brief defines no write-back. The lever text comes from F-50 and the leader's read access from F-89 |
| J3.10 | F-28, F-40, F-41, F-48, F-69, F-70, F-73 | |
| J4.1 | F-18, F-33, F-79, F-80, F-95, F-104, F-112, F-113 | |
| J4.2 | F-01, F-02, F-03 | |
| J4.3 | F-31, F-35, F-37, F-39, F-87, F-99 | |
| J4.4 | F-12, F-14, F-15, F-16, F-17, F-51 | |
| J4.5 | F-81, F-95 | |
| J4.6 | F-32, F-33, F-37 | |
| J4.7 | F-35, F-36 | |
| J4.8 | F-33, F-82, F-83, F-96 | |
| J4.9 | F-35, F-64, F-79, F-83, F-85, F-90, F-95, F-104, F-106, F-107, F-112 | |
| J4.10 | F-04, F-08, F-09, F-10, F-11, F-18, F-24, F-33, F-44, F-51, F-75, F-78, F-103, F-106 | |
| J4.11 | F-12, F-13, F-50 | |
| J4.12 | F-12, F-32, F-100 | |
| J4.13 | F-04, F-18, F-33, F-44, F-96, F-103, F-109, F-110 | |
| J4.14 | F-30, F-78, F-96 | |
| J4.15 | F-13, F-50, F-75, F-94 | |
| J4.16 | F-33, F-39, F-75, F-87, F-99, F-113 | |

---

## Explicitly out of scope

| Item | Reason | Source |
|---|---|---|
| A composite score | The brief has none; the literature the design doc cites says composite scores and rankings cause case-selection gaming. F-42 scans every artifact for one. | Design doc Constraints; Approaches "Ruled out" |
| Ranking of surgeons | Same as above. The anonymous spread shows position, never rank order with names. | Design doc Constraints; GR4 |
| Hand-entered complications | "Complications come from the department's QI database, never entered by hand into the scorecard." F-09 exposes no entry path; F-68 corrections are requests to the QI coordinator. | Brief: Bucket 4 |
| Any target other than M&M attendance | The brief gives one target (8 of 12). Work RVUs — live tracker has none by the brief's own text; F-77 says so on the tile. | Brief: Bucket 1, Bucket 6; design doc Constraints |
| OR turnover time, PACU boarding, room-ready delays on any individual view | "A surgeon cannot move these alone, so they appear only on division and site views." F-104 carries the page text; no per-surgeon value exists. | Brief: Bucket 2 |
| Division and site views themselves | Implied by the brief ("they appear only on division and site views"), never specified; they need periop timing feeds and are Approach B scope. No feature exists for them (F-105 retired) and no milestone is assigned. Any specification must carry the guard in OQ-52: a view that names surgeons in a subspecialty under five would undercut the anonymity promised on their own page. | Brief: Bucket 2; design doc Open Questions; journeys Delivery sequencing and J1 failure modes |
| Being a comp or OPPE system of record | Comp- and OPPE-relevant numbers are a read-only mirror with source and date on the tile. The billing office and the medical staff office keep their records. | Design doc Constraints; Premise 8 |
| Static per-surgeon pages behind SSO | Authentication without authorization for PHI. The hosted view needs per-user authorization (F-85). | Design doc challenge 14 |
| A department-computed FCOT that differs from periop's | Two numbers for the same metric loses at faculty meeting. F-15 adopts the institutional definition verbatim; F-81 gates publish on reconciliation. | Design doc challenge 3; Constraints |
| Leader, chief, chair or division views in the wedge | A surgeon sees any number at least 30 days before any leader view exists; the chief's queue (F-60) is the only chief-facing screen. | Design doc Constraints (Surgeon first) |
| Starting with the quality bucket | Highest stakes, weakest attribution, smallest n, peer-review privilege; sequenced to M6. | Design doc Approaches "Ruled out" |
| Sentiment scoring, summarizing or tallying survey comments | "Comments are never counted, compared, or rolled up into anything." F-70 and F-11 enforce it with static checks. | Brief: Bucket 5 |
| Hand-editing an extract to fix a record | Corrections live in the ledger (annotated) or at source (corrected), never in the extract (F-05). | Design doc Constraints (Disputes); journeys J2 failure modes |
| Excluding non-surgeon delays from the FCOT count | Would produce a number that does not reconcile to periop's. Recorded as OQ-12 for the owner; if chosen, it must be a labelled department variant, never FCOT (F-81). | Journeys J1.5, J2.7, J4.5 |
| An in-progress month on any tile | Proposed default: closed months only (F-84); OQ-24. | Journeys J1 failure modes |
| Charge-level wRVU record list and wRVU disputes (this release) | A deviation from GR5 and GR2, which the brief states for every number and every record with no exception; inherited from journeys J1.13 and held as OQ-33 for the owner, not settled here. Corrections go to the professional billing office (F-77). If the owner asks, a charge-level list (date of service, CPT, wRVU) with corrections still routed to the billing office is the proposed form. | Brief GR2, GR5; journeys J1.13, J2.11 |

---

## Open questions register

Deduplicated across all features. "(brief)" marks the brief's own "assumption — to be confirmed" and "pending confirmation of data source" items. Each question names the features that depend on its answer. Answers land as new definition or configuration versions (F-13, F-100), never as edits to old ones.

| ID | Question | Proposed default in this catalogue | Depends on it |
|---|---|---|---|
| OQ-01 | FCOT grace window and room eligibility (brief). The brief assumes no grace window; the institutional definition is adopted verbatim so the number matches periop's, with grace-window minutes and room eligibility as named parameters and the diff from the brief stored as the version-1 delta. Confirm. | Institutional definition verbatim as F-100 parameters | F-12, F-15, F-50, F-80, F-81, F-100, F-101 |
| OQ-02 | Super-long boarder threshold (brief): assumed more than 30 days. Is LOS history restated when confirmed? | 30 days; restate only by explicit versioned action | F-08, F-19, F-30, F-100 |
| OQ-03 | M&M leave scaling (brief): target scales proportionally and rounds up. Also confirm the pace rule proposed in J1.14. | As stated in F-75 | F-74, F-75 |
| OQ-04 | Referral-to-visit days data source (brief). Share of referrals with no reliable received date. | Pending state until registered; then F-109 computes the brief's definition | F-44, F-103, F-109 |
| OQ-05 | Unplanned return to ICU data source (brief). ADT proxy rule for "unexpected" (return within 48 to 72 hours of step-down); the window is an F-100 parameter. | Pending state until registered; then F-110 computes the brief's definition, labeled unadjusted | F-44, F-100, F-103, F-110 |
| OQ-06 | Co-surgeon cases: one clinician with tie-break and shared flag, or credit both attendings in volume and exclude shared cases from FCOT and duration accuracy? Owner decides when any subspecialty exceeds 5%. | One clinician, first-listed primary, shared flag | F-01, F-03, F-07 |
| OQ-07 | Peer-group counting rule: roster members or surgeons who clear min-n; viewer included or excluded. Same question for survey measures (10-response month minimum). | Peers excluding the viewer; at least five each clearing min-n | F-31, F-34, F-40 |
| OQ-08 | Multi-site surgeons: per-site rows only, or also a pooled "all sites" row? | Per-site rows only | F-31, F-39 |
| OQ-09 | Opt-out: is pilot peer-spread participation voluntary? What happens to a group of five when one surgeon opts out? Can a surgeon opt back in mid-pilot? | Voluntary; opted-out surgeon excluded from every group; remaining tiles show the new count | F-31, F-35, F-99 |
| OQ-10 | Non-attendance at step zero: withhold the spread only, or remove the surgeon from colleagues' groups? Does a make-up presentation count? Does non-attendance withhold the survey spread too? | Withhold the spread only; surgeon stays in denominators | F-31, F-35, F-40, F-99 |
| OQ-11 | Peer-under-five: does "a number is not shown" hide the surgeon's own value or only the comparison? | Own value stays; comparison withheld with the reason | F-32, F-46 |
| OQ-12 | Sustained delay-reason dispute: annotation only (count unchanged, matches periop), or exclusion of non-surgeon delays from an "as adjudicated" FCOT that will not reconcile? | Annotation only | F-15, F-29, F-56, F-81, F-101 |
| OQ-13 | Cancellation reason-code correction moves the "as adjudicated" rate; how does the reconciliation gate treat that delta against periop's report? | As-logged matches periop; adjudicated shown beside it | F-65, F-81 |
| OQ-14 | Does "the scorecard displays what the system of record logs" (Bucket 6) apply to every bucket, and is an adjudicated override beside the logged value acceptable? | Show both | F-05, F-47, F-76 |
| OQ-15 | Confirm the three involvement tests (a)(b)(c); any other situation that counts as involved; who adjudicates a dispute filed by the chair on a record of their own; is an open dispute rerouted when the chief changes? | Three tests as stated; reroute from the change date for new filings | F-58, F-87 |
| OQ-16 | After a denial: may the surgeon re-file with new evidence (once, linked)? Is there any appeal to the chair? May the receiving clinician in a re-attribution dispute in turn? | Once; no appeal unless a test is true; yes | F-07, F-62, F-92 |
| OQ-17 | Is the chief's (or leader's) note visible to the surgeon? | Yes | F-59, F-61, F-73 |
| OQ-18 | Are pending disputes held out of the number with a reason, or does the number stay as published until decided? Is the recompute immediate or at the next period load? | Unchanged until decided; same-day recompute | F-29, F-96 |
| OQ-19 | Time limit for filing a dispute after a period is published? The brief sets none. | None | F-54 |
| OQ-20 | Email months: is analyst entry within two business days plus a one-record decision email acceptable as the dispute workflow until the hosted view exists? | Yes | F-57, F-93 |
| OQ-21 | Notifications: one email per dispute event; receiving clinician notified on re-credit; surgeons notified when a definition changes. The brief defines none. | Yes to all three | F-92, F-94 |
| OQ-22 | Where do definition and peer-group disputes go? | Logged to the definitions owner and shown on the definition page | F-50, F-63 |
| OQ-23 | Email format (plain text plus one attachment) and adoption signal (reply and interview), or a minimal tracked link that needs a host? | Plain text, attachment, reply and interview | F-85, F-90, F-91 |
| OQ-24 | Are in-progress months ever shown? Are clinic visits still inside their 72-hour window at month close excluded? | Closed months only; window rule versioned | F-10, F-27, F-84 |
| OQ-25 | Trend window (rolling 12 months, fiscal year to date, all history) and trend form (quarterly points with intervals; monthly line for access and clinic metrics; four rolling points for mortality). Does M&M attendance show a trend, and in what form? GR6 says every metric does; the brief's M&M "Shown as" list names none. | As stated in F-43; M&M attendance shows cumulative attended against held by month (F-74 AC 5) until the owner says otherwise | F-21, F-24, F-43, F-48, F-74 |
| OQ-26 | Form of the spread for share and count metrics (dots, bars, box), and the plain-text form for the email months. | Recorded as a versioned build choice; M1 text form is the three lines in F-46 AC 6 | F-36, F-46, F-90 |
| OQ-27 | Mortality O/E at min-n 30: keep on the individual view with an interval, or move to division and site views (which have no specification, OQ-52)? | Individual view with interval and "no evidence of difference" | F-21, F-24 |
| OQ-28 | Interval method for O/E and rates (not in the brief; a build choice to record). | 95% exact interval, recorded in the registry | F-24 |
| OQ-29 | Readmission: observed "to any MGB hospital" against a hospital-scoped Vizient expected value inflates O/E by construction. Use Vizient's system-level module, or compute observed from Epic and label "unadjusted"? | Brief's definition as written; question open | F-08, F-20 |
| OQ-30 | LOS: whole-encounter days or post-operative days? | Whole-encounter (brief) | F-08, F-19 |
| OQ-31 | Index-operation rule for admissions with zero or multiple department operations; encounter-to-case join across entities. | Written rule in the registry; unmatched admissions listed | F-08, F-67 |
| OQ-32 | Restrict QI-database comparisons to the site whose database it is until a shared registry exists? Consider NHSN for Surgical site infection? | Brief's cross-system comparator with the "self-reported, unadjusted" label | F-09, F-23, F-68 |
| OQ-33 | wRVU: the catalogue ships Work RVUs — live tracker as a mirror with no charge-level record list and no dispute action, which deviates from GR5 ("Every number links to ... the list of records behind it") and GR2 ("any record credited to them"); the brief carves out no exception. Confirm the deviation, or ask for a charge-level list (date of service, CPT, wRVU) with corrections still routed to the billing office. Also confirm "no target" is intended and the tile wording; table year, modifier treatment, date-of-service vs posting basis, comp office source query. | Deviation held open, not settled; wording as in F-77 | F-49, F-54, F-77, F-78 |
| OQ-34 | Block utilization tile once the feed exists: "not applicable" for a surgeon with no block, or absent? Who owns the block allocation and release schedule, and on what schedule does it arrive? | "Not applicable", tile present | F-18, F-33, F-103 |
| OQ-35 | Who confirms an institutional definition and who approves a new version: the owner alone, the chiefs, the chair? Are earlier periods restated under a new version or frozen at their version? | Approver field left empty; earlier periods frozen unless explicitly restated | F-13, F-30, F-50, F-96 |
| OQ-36 | Where does the roster come from and who maintains it? Which systems supply faculty status, approved leave, new-patient visits, note timestamps and third-next-available samples? | Analyst-maintained dated dimension | F-10, F-25, F-26, F-27, F-39, F-87, F-99 |
| OQ-37 | Should a period publish when a feed loaded partially, and with what wording? | Analyst decision recorded on the period record | F-44, F-82 |
| OQ-38 | Surgeon-attributable delay and cancellation reason sets: content and periop leadership sign-off; are blank or Other ever surgeon-attributable? | Outside the set unless explicitly included | F-17, F-100, F-101, F-102 |
| OQ-39 | Named booked vs actual duration fields (scheduled procedure length vs in-room interval); visit attribution field; new-patient rule; note timestamp field. | Named in the registry once confirmed | F-16, F-26, F-27, F-80 |
| OQ-40 | Does the survey vendor feed include free-text comments per response, and who de-identifies them? Confirm the analyst may handle comments as pipeline data with no viewer role, stated at step zero. Does any inpatient survey item carry provider attribution? A copy of the current faculty-meeting slide is a precondition. | Per-response feed required; analyst pipeline role stated at step zero | F-11, F-42, F-69, F-70, F-88, F-97 |
| OQ-41 | Is the direct leader the division chief? Who is the direct leader of a chief who practices? | Separate roster fields; a practising chief has no leader access unless mapped | F-72, F-87, F-88 |
| OQ-42 | Can the direct leader see the surgeon's private notes or write notes? Are notes editable, deletable, retained, and for how long? Does the leader see the four measures and the bar chart, or only the inbox? Does the surgeon see whether or when the leader viewed the inbox? | Surgeon-only notes, editable and deletable; leader sees inbox only; no view indicator | F-71, F-89, F-107 |
| OQ-43 | Survey-record disputes route to the division chief per GR2 (F-58), with the comment withheld from any adjudicator who is not the direct leader (F-72 AC 5). Alternative for the owner: route to the direct leader when the two differ (the journeys' J3.7 proposed default), which would need a survey exception in F-58 AC 1 and F-87 AC 3 and a row text naming the direct leader. Also: how is a de-identified response referenced (stable id)? What can the patient experience office change on a de-identified response? Does a sustained dispute remove the comment from the inbox and the response from the measures? | Chief per GR2; annotated outcome, both stay marked | F-53, F-58, F-72, F-73, F-87 |
| OQ-44 | Does the year average include months hidden for fewer than 10 responses? Is "the MGB average" all providers system-wide or neurosurgery-specific? Which vendor scale values are promoter and detractor? Is a monthly trend beyond the three faculty-meeting months required? | Trend beyond three months shown; others open | F-28, F-41, F-48 |
| OQ-45 | Does the department's survey extract cover the whole system or only its site? If site-only the cross-system spread cannot honestly render as specified. | Reason names the coverage gap | F-40 |
| OQ-46 | Export or print for annual review, and what the chief will hold (the OPPE packet is outside this system). | None defined | F-97, F-108 |
| OQ-47 | Hosted view: enterprise BI tool with row-level security or a thin app layer? Which bodies approve a hosted surgeon-identified view and what are their lead times? Does emailing a surgeon's own case list need any of them? | Recorded as gates; no estimate | F-85, F-106 |
| OQ-48 | Named analyst and chair-approved time fraction; named periop analytics contact for the override list; owner of each of the twelve sources. | None; these are blockers, not defaults | F-04, F-64, F-79 |
| OQ-49 | Is the QR-code attendance system live, and who owns it? HR leave feed source. | Pending | F-74, F-75 |
| OQ-50 | Who reads the dispute trust report beyond the analyst (the chair as buyer of the pilot)? | Analyst only | F-98 |
| OQ-51 | The institution's accessibility standard. (Retention for the access log moved to OQ-57 with every other store.) | Not stated | F-108 |
| OQ-52 | Division and site views: a specification the brief does not contain (screens, comparators, cadence, access) for OR turnover time, PACU boarding and room-ready delays. Condition on any specification: a view that names surgeons in a subspecialty under five undercuts the anonymity promised on their own page (journeys J1 failure mode). No feature or milestone exists until a specification is approved (F-105 retired). | Out of scope; F-104 carries the page text | F-104 |
| OQ-53 | Does a system-wide subspecialty roster exist as a dated dimension outside the department (needed for Case mix index and other cross-system comparators)? | Unknown | F-22, F-31 |
| OQ-54 | Does periop report OR case volume and Duration estimate accuracy at surgeon level (design doc Q2 unknown)? Does periop already distribute case-level lists to surgeons? | Gate marks "not reconciled: periop does not report" | F-81 |
| OQ-55 | Wedge ledger custody: the analyst is the sole editor of the shared sheet, chiefs decide by email reply and never hold the sheet, and the sharing list and edit history are the M1 audit trail. Confirm; name a backup analyst; say whether a chief may hold the sheet read-only. | Analyst sole editor; decision by reply | F-55, F-60, F-61, F-111 |
| OQ-56 | Deadline alerts: extract due business day 5 after month close; publish due business day 10; adjudicator copied at day 10 and day 14 of a dispute; M1 as a printed checklist plus calendar entries, automated at M2. Confirm the thresholds and the form. | As stated in F-112 | F-112 |
| OQ-57 | Retention period per store (staged extracts, ledger and overrides, dispute ledger and reply mailbox, sent artifacts, period records and logs, access log, comments and notes), to be set by the data-governance body; nothing is disposed until set. Departed surgeons: records stay for past periods, no further artifacts, access ends at the roster end date; what happens to their inbox, comments and notes? | Periods unset; departed-surgeon handling as in F-113 | F-107, F-113 |
| OQ-58 | Email delivery: is the recipient address resolved from the institutional directory by identity at send time, as F-90 AC 8 proposes? Which incident procedure applies to a misdirected send? | Directory resolution; roster mismatch blocks the send | F-90, F-93, F-99 |

---

## Appendix: merge record

How the four per-journey lists (J1: 45, J2: 31, J3: 17, J4: 41; 134 raw features) map to the 108 version-1.0 catalogue features, plus the five added and the one retired in version 1.1. A raw feature listed under two IDs (J1-F30) was split: its acknowledgement criterion went to F-57 and its decision-email criteria to F-93. Where two raw features from different areas merged, the catalogue area is the one that owns the data (feed loads under Attribution ledger; dispute variants under the bucket they serve).

| ID | Merged from |
|---|---|
| F-01 | J1-F13, J4-F04 |
| F-02 | J4-F05 |
| F-03 | J4-F06 |
| F-04 | J4-F24, J2-F23 |
| F-05 | J2-F14 |
| F-06 | J2-F15 |
| F-07 | J2-F21 |
| F-08 | J4-F25, J1-F37 |
| F-09 | J4-F26 |
| F-10 | J4-F27 |
| F-11 | J3-F15, J4-F28 |
| F-12 | J4-F10 |
| F-13 | J4-F34 |
| F-14 | J1-F17 |
| F-15 | J1-F14 |
| F-16 | J1-F16 |
| F-17 | J1-F19 |
| F-18 | J1-F22, J1-F12, J4-F31 |
| F-19 | J1-F38 |
| F-20 | J1-F41 |
| F-21 | J1-F39 |
| F-22 | J1-F42 |
| F-23 | J1-F40 |
| F-24 | J4-F33, J1-F36 |
| F-25 | J1-F43 |
| F-26 | J1-F44 |
| F-27 | J1-F45 |
| F-28 | J3-F01 |
| F-29 | J2-F17 |
| F-30 | J4-F37 |
| F-31 | J1-F24, J4-F08 |
| F-32 | J4-F13, J1-F10 |
| F-33 | J4-F14 |
| F-34 | J1-F18 |
| F-35 | J1-F26, J4-F20 |
| F-36 | J4-F15, J1-F27 |
| F-37 | J4-F09 |
| F-38 | J2-F19 |
| F-39 | J4-F40 |
| F-40 | J3-F03 |
| F-41 | J3-F05 |
| F-42 | J1-F02 |
| F-43 | J1-F06 |
| F-44 | J1-F11, J4-F32 |
| F-45 | J1-F21 |
| F-46 | J1-F25 |
| F-47 | J2-F18 |
| F-48 | J3-F14 |
| F-49 | J1-F08, J2-F02 |
| F-50 | J1-F09, J4-F38, J3-F06 |
| F-51 | J4-F11, J1-F05 |
| F-52 | J2-F12 |
| F-53 | J3-F07 |
| F-54 | J2-F01 |
| F-55 | J2-F03 |
| F-56 | J2-F05 |
| F-57 | J2-F06, J1-F30 |
| F-58 | J2-F07 |
| F-59 | J1-F29, J2-F08 |
| F-60 | J2-F11 |
| F-61 | J2-F13 |
| F-62 | J2-F20 |
| F-63 | J2-F29 |
| F-64 | J2-F16, J4-F21 |
| F-65 | J2-F24 |
| F-66 | J2-F04 |
| F-67 | J2-F22 |
| F-68 | J2-F26 |
| F-69 | J3-F02 |
| F-70 | J3-F08 |
| F-71 | J3-F10 |
| F-72 | J3-F11, J2-F27 |
| F-73 | J3-F12 |
| F-74 | J1-F33 |
| F-75 | J1-F34, J4-F30 |
| F-76 | J2-F25 |
| F-77 | J1-F32, J2-F28 |
| F-78 | J4-F29 |
| F-79 | J4-F01 |
| F-80 | J4-F03 |
| F-81 | J4-F12 |
| F-82 | J4-F16 |
| F-83 | J1-F04, J4-F17 |
| F-84 | J1-F07 |
| F-85 | J1-F31, J4-F23 |
| F-86 | J2-F30 |
| F-87 | J4-F41, J3-F16 |
| F-88 | J3-F09 |
| F-89 | J3-F13 |
| F-90 | J1-F03, J4-F19 |
| F-91 | J1-F28 |
| F-92 | J2-F09 |
| F-93 | J2-F10, J1-F30 |
| F-94 | J4-F39 |
| F-95 | J4-F02 |
| F-96 | J4-F18 |
| F-97 | J1-F35, J3-F04 |
| F-98 | J2-F31 |
| F-99 | J4-F07, J1-F01 |
| F-100 | J4-F35 |
| F-101 | J1-F15 |
| F-102 | J1-F20 |
| F-103 | J4-F36 |
| F-104 | J1-F23, J4-F22 |
| F-105 | New in version 1.0 (placeholder derived from the design doc); retired in version 1.1 (review log finding 16) |
| F-106 | New (cross-cutting or placeholder; derived from the design doc, not a per-journey list) |
| F-107 | J3-F17 |
| F-108 | New (cross-cutting or placeholder; derived from the design doc, not a per-journey list) |
| F-109 | New in version 1.1 (review log finding 1; brief Bucket 3, journeys J1.19, J4.13) |
| F-110 | New in version 1.1 (review log finding 1; brief Bucket 4, journeys J1.17, J4.13) |
| F-111 | New in version 1.1 (review log finding 10; journeys J2.3a, J2.5, J2.6) |
| F-112 | New in version 1.1 (review log finding 13; design doc Success Criteria and Distribution Plan) |
| F-113 | New in version 1.1 (review log finding 14; design doc Constraints) |

---

## Review log

Audit of version 1.0, two lenses (traceability and correctness; completeness critic). Decision key: ACCEPT = document changed as proposed; PARTIAL = changed more narrowly, reason given; REJECT = not changed, reason given.

| # | Finding (short) | Severity | Decision | Change made |
|---|---|---|---|---|
| 1 | Referral-to-visit days and Unplanned return to ICU have no computing feature; F-12 AC 1 means they could never publish | material | ACCEPT | New F-109 and F-110 (M7) with the brief's definition, cadence, min-n, comparator, "Lower is better", tile text, record list columns, row-count invariant and dispute field, each gated on F-103 registration and rendering F-44's pending text until then. Coverage table, traceability (J1.17, J1.19, J4.13), F-23 (ICU removed), F-44 AC 4 and OQ-04, OQ-05 updated. |
| 2 | F-72 routes survey disputes to the direct leader, overriding GR2 and contradicting F-58 AC 1 and F-87 AC 3 | material | ACCEPT | F-72 description and AC 4 route by F-58 unchanged (chief, chair on a test); AC 5 kept as the comment-protection rule; the direct-leader route moved to OQ-43 as an alternative for the owner with the changes it would need. |
| 3 | wRVU exemption from GR5 and GR2 worded as settled ("by design", "single stated exception") | material | ACCEPT | Relabel option taken: F-49, F-54, F-77, the wRVU section header, the cross-cutting table, the coverage row, the out-of-scope row and OQ-33 now say "deviation from GR5 and GR2 pending OQ-33, not settled"; the charge-level list is named in OQ-33 as the proposed form if the owner asks. F-77 AC 3 wRVU requirements unchanged (no peer, no target). |
| 4 | Thirteen dependency edges point to later-milestone features; F-60 milestone non-canonical | material | ACCEPT | F-103 moved to M1 (registry holds pending rows from the first run; block schedule is the first live registration). F-03 and F-37 state the M0 by-hand computation and the M1 regeneration. Dependencies split: a new "Later consumers" field on F-03, F-37, F-42, F-60, F-83, F-91, F-103, F-106, F-107, F-108; "How to read this" defines the rule. F-60 milestone is M1. |
| 5 | F-33 template hardcodes "at this site"; F-40, F-41, F-46 wordings not in the catalogue | minor | ACCEPT | F-33 AC 1 rewritten as a keyed catalogue with <group> and <scope> parameters, the `hidden-month`, `spread-count` and `spread-count-survey` templates; F-40, F-41, F-46 cite keys. |
| 6 | F-14 comparator text is not the brief's OR case volume wording | minor | ACCEPT | F-14 user-facing text and AC 2 use "surgeons in your subspecialty at your site" verbatim. |
| 7 | F-43 AC 5 exempts M&M attendance from GR6 | minor | ACCEPT | Exemption dropped; default trend is cumulative attended against held by month (F-43 AC 5, F-74 AC 5); OQ-25 keeps the question for the owner. |
| 8 | Multi-month and hedged criteria are not build-time tests (F-79 AC 3, F-83 AC 4, F-90 AC 7, F-77 AC 3, F-105 AC 3, F-75 AC 2-3) | minor | ACCEPT | F-79 AC 3, F-83 AC 4 and F-90 AC 7 restated as build-time checks with the multi-month criterion named as the PRD's; F-77 AC 3 unconditional with "pending the owner" in OQ-33; F-75 AC 3 scales S with k and adds a worked leave case; F-105 AC 3 gone with the retirement (finding 16); "How to read this" states the rule. |
| 9 | F-90 AC 2 demands a 12-month trend on the quarterly cancellation tile; F-18 AC 1 duplicates F-44 AC 1 | minor | ACCEPT | F-90 AC 2 reads "a trend at the metric's cadence per F-43 AC 1"; F-18 AC 1 is a cross-reference to F-44 AC 1 as the single M1 owner. |
| 10 | No feature defines who holds the M1 shared sheet or how a chief's decision enters it; sheet cannot enforce F-55 AC 3, F-60 AC 1, F-61 AC 4 | blocking | ACCEPT | New F-111 Wedge ledger custody and decision intake (M1, proposed default, OQ-55): analyst sole editor, no chief holds the link, one dispute per email, decision by reply kept as the record, sharing list and edit history exported at publish. F-55 AC 3, F-60 AC 1 and F-61 AC 4 split into hosted (M2) and wedge (M1) terms; F-92 AC 5 names the email as the wedge adjudication surface. |
| 11 | Only the surgeon's own email is PHI-gated; adjudicator, decision, feed-owner and re-credit emails carry record-level data with no gate or minimum-necessary rule | blocking | PARTIAL | F-106 AC 1 now requires one privacy-office gate record per email channel (five channels) and AC 7 adds the minimum-necessary payload scan applied to F-90, F-92, F-93, F-64, F-37 and F-98, with the case id defined as a ledger surrogate (F-54 AC 3). The chief summary (F-37) gets the payload check but not a channel gate, because F-37 AC 4 makes it counts only with no record-level data; gating it would add an approval for an artifact that carries nothing gate-worthy. |
| 12 | FCOT grace window is not a parameter; F-12 AC 2 and F-50 AC 1 ("diff empty at version 1") contradict F-15 (institutional verbatim) | material | ACCEPT | F-100 AC 5 names grace-window minutes and room eligibility as parameters with the brief's values as the flagged assumption and periop's confirmed values in force, the diff stored as the version-1 delta; F-12 AC 2, F-15 AC 1 and F-50 AC 1 amended to cite it; OQ-01 updated. |
| 13 | Nothing alerts anyone when an extract, publish, dispute, reply or override list is late | material | ACCEPT | New F-112 Deadline alerts to the analyst (M1, proposed default, OQ-56): extract by business day 5, publish by day 10, disputes at day 10 and 14 to adjudicator and analyst, replies and questions at two business days, override list at publish, bounces; printed checklist and calendar at M1, automated at M2. Cross-referenced from F-57, F-60, F-64, F-90, F-91. |
| 14 | No retention or disposition feature; departed surgeons unhandled | material | ACCEPT | New F-113 Retention and disposition (M1): retention class per store with periods unset until data governance answers (OQ-57), disposition log, guards for retained periods and open disputes, departed-surgeon handling as a proposed default. Retention for the access log moved from OQ-51 to OQ-57. |
| 15 | Email address unverified; bounces and misdirected sends unhandled | material | ACCEPT | F-90 AC 8 to AC 11: directory-resolved address at send time, roster mismatch blocks the send, bounces logged and listed (F-112), misdirected send recorded as an incident under the institution's procedure (OQ-58), payload scan before send; F-93 AC 6 and F-99 follow. |
| 16 | F-105 is a placeholder whose criteria say not to build it and trace to no journey step; creates an M8 with one entry | material | ACCEPT | F-105 retired (ID kept, marked retired); scope statement moved to "Explicitly out of scope" and the under-five anonymity guard to OQ-52; M8 dropped from the key; at-a-glance, coverage, traceability, OQ-27 and the merge record updated. |
| 17 | F-33 omits wordings other features define with exact text (Hidden month, dispute clause, not reconciled, leader gate) | minor | ACCEPT | Added to F-33 AC 1 as keyed templates; F-33 AC 5 requires any new absent-cell, refusal or page-state wording to be registered before it can render; F-38, F-81, F-89 cite the keys. |
| 18 | Month-two spread is specified only as graphics while M1 is plain text | minor | ACCEPT | F-46 AC 6 defines the three-line plain-text form as the versioned build choice under OQ-26; F-47 AC 3 restated as "in the record list on every artifact, on hover in the hosted view". |
| 19 | Hosted page-level states undefined (identity not on roster, no published period, refusal wording, load failure) | minor | ACCEPT | F-33 page-level keys with fixed wording; F-85 AC 7 defines the four states with F-107 outcome codes; F-88 and F-89 cite the keys. |
| 20 | Milestone dependencies point forward (F-03, F-37, F-04, F-44 to F-103) | minor | ACCEPT | Same changes as finding 4: F-103 at M1; M0 by-hand notes on F-03 and F-37; Later consumers field. |
| 21 | Question replies and unidentified-case replies have no owner or target | minor | ACCEPT | F-91 AC 6: questions answered within two business days, logged, definition questions recorded as F-63 open items; F-57 AC 3: request for the row within two business days with the reply held as "awaiting row"; both listed by F-112 when overdue. |

Counts: 20 accepted, 1 partial, 0 rejected. Feature IDs 113 (112 active, F-105 retired); five features added (F-109 to F-113); no ID renumbered. Milestone counts (active): M0 4; M1 68; M2 4; M3 1; M4 14; M5 5; M6 10; M7 6. The at-a-glance table, the metric coverage table and the journey step traceability table were re-checked against the feature sections after the edits.
