# Clinician Scorecard: Technical Design

Version 1.0 · 2026-09-28 · Status: DRAFT, every decision recommended and pending builder confirmation · Derived from the brief (`docs/source/metric-definitions-v0.2.md`, v0.2, owner Omar Arnaout), the design doc (`docs/designs/clinician-scorecard.md`), the user journeys (`docs/01-user-journeys.md`, v1.1) and the feature catalogue (`docs/02-features.md`, v1.1). The architecture was chosen from three proposals (a minimal batch with SQLite; a PostgreSQL ledger with a Python engine and a role-based app; a BI-hosted hybrid) scored by two judges (a staff engineer who will maintain the system; a clinical informatics and security reviewer), and this document assembles the five subsystem sections written against the adopted synthesis.

## How to read this

- `F-xx` cites a feature in `docs/02-features.md`; `F-xx AC n` its acceptance criterion; `OQ-nn` the catalogue's open questions register (OQ-59 to OQ-62 are new here); `Jn.m` a journey step in `docs/01-user-journeys.md`; `GR n` a ground rule of the brief; `D-nn` a row of the decisions register in this document; `M0` to `M7` the milestones of the catalogue.
- Table names are `schema.table` (`ledger.metric_value`); column names are in backticks; CLI commands are `scorecard <command>`; `<clinician_key>` on a command line is the roster's `person_key`.
- Metric names are the brief's, verbatim. The brief's "Work RVUs — live tracker" and its marker "(assumption — to be confirmed)" contain a dash; those verbatim quotations, and the brief's Bucket 5 sentence quoted in the Delivery surfaces section, are the only places a dash of that kind appears.
- Each subsystem section keeps its own numbered builder decisions (the Data model section's "Builder decision 1", the Metric engine section's "BD-1", the Dispute workflow section's "Builder decision 1", the Delivery surfaces section's "S-1", the Ingestion and operations section's "O-1"); every one carries its register id in its heading, and the register is the single place a default is chosen.
- Nothing here invents institutional policy. Where the brief and the catalogue are silent, the text says "proposed default" with its OQ number, or records a builder decision.

## Overview

### The system in one paragraph

The Clinician Scorecard is a read-only, per-surgeon metrics viewer for a neurosurgery department inside MGB, built around a record-level attribution ledger. Institutional extracts (the periop OR log and periop's own surgeon-level report first; Vizient, the QI database, the survey vendor, billing, attendance, HR leave, block schedule, clinic scheduling, referral and ADT feeds later) are loaded verbatim into PostgreSQL, typed, and credited to exactly one clinician per record by a versioned rule. Metric definitions are Python files, one per version, registered by content hash; a monthly `scorecard close` computes every number, every suppression reason, every anonymous peer spread and every trend marker into the ledger and refuses to publish unless the wedge numbers reconcile to periop's report, every cell has a value or a worded reason, and every record list has as many rows as its denominator. Surfaces render what the ledger holds: a plain-text email with the surgeon's own case list in months one to three, one server-rendered web app behind MGB SSO from M2, and an optional pre-suppressed export for the enterprise BI tool. A dispute is a ledger row pinned to one record, routed to the division chief or the chair by executable tests, decided with one of four outcomes, and, when sustained, applied as an override that recomputes the surgeon's numbers under an "as adjudicated" basis beside the "as logged" one and goes to the feed owner as a correction request. Every write and every view lands in an append-only audit log. The department analyst runs the whole thing from one CLI on a standing calendar entry.

### Component diagram

```
                       MGB feed owners (files by ticket)                             MGB services
  +-----------+ +-----------+ +---------+ +---------+ +---------+ +----------+    +---------+ +---------+ +-----------+
  | periop    | | Vizient   | | QI      | | survey  | | PBO     | | others   |    | SSO     | | SMTP    | | directory |
  | OR log +  | | encounter | | database| | vendor  | | wRVU    | | (attend, |    | (OIDC/  | | relay   | | (LDAP or  |
  | report    | | extract   | | events  | | extract | |         | |  HR, blk,|    |  SAML)  | |         | |  Graph)   |
  |           | |           | |         | |         | |         | |  clinic, |    |         | |         | |           |
  |           | |           | |         | |         | |         | |  ref,ADT)|    |         | |         | |           |
  +-----+-----+ +-----+-----+ +----+----+ +----+----+ +----+----+ +----+-----+    +----+----+ +----+----+ +-----+-----+
        |             |            |           |           |           |               |            ^            ^
        v             v            v           v           v           v               |            |            |
  landing/<feed_key>/<period>/   (analyst copies files in; the survey file is picked up by a path unit as svc_survey)
        |                                                                              |            |            |
        v                                                                              |            |            |
  +------------------------------------------------------------------------------------+------------+------------+---+
  |  scorecard  (one Python 3.12 package, one CLI entry point, one PostgreSQL 16 database)                            |
  |                                                                                                                  |
  |  loaders/ (13 feeds)  --> raw (verbatim) --> src (typed) --> attribution/ (one rule per record type)             |
  |                                                                  |                                               |
  |  definitions/<metric>/vN.py  --scorecard register-->  ledger.metric_definition_version (hash-immutable)           |
  |                                                                  |                                               |
  |  engine/  close: register -> versions -> availability -> frames -> compute -> suppress -> peers -> targets       |
  |           -> trend -> gates (reconcile | feed health | no blank cell | row count | exceptions)                    |
  |           recompute (dispute, roster change, version, source registered) | restate                              |
  |                                    |                                                                             |
  |     +------------------------------v---------------------------------------------------------------------+       |
  |     | PostgreSQL 16  database "scorecard"                                                                |       |
  |     |   raw  | src | ledger (system of truth: clinician, roster, attribution, overrides, definitions,   |       |
  |     |   metric values + record links, suppression decisions, peer snapshots, disputes, corrections,     |       |
  |     |   runs, reconciliation, delivery, audit_log INSERT-only) | restricted (comment text, private     |       |
  |     |   notes, peer member ids) | privileged (M6 QI events) | pub (optional, deferred)                   |       |
  |     |   roles: loader, svc_survey, engine, publisher, disputes, retention, app, analyst_ro, bi_ro      |         |
  |     +-------------------------------------------------------------+------------------------------------+       |
  |              |                                  ^                 |                                             |
  |              v                                  |                 v                                             |
  |  publish/  render -> scan -> own records ->   disputes/  file -> route -> decide -> recompute                   |
  |            gates -> directory -> transport    (service functions; CLI at M1, web at M2)                         |
  |            email + CSV | ack | dispute filed |                    |                                             |
  |            decision | re-credit | override    web/ (M2)  SSO -> roster roles -> authz matrix -> viewer-scoped   |
  |            list | status | pub                           views -> audit_log('view'); tiles, trend, spread,      |
  |                                                           record lists, dispute form, queue, definitions,        |
  |  cli.py   load | attribute | close | publish |            inbox + private notes (M4), leader view, analyst       |
  |           dispute | recompute | restate |                 screens                                                |
  |           status | audit | retention | doctor            pub.py (deferred) -> pub schema -> BI tool (bi_ro)      |
  +------------------------------------------------------------------------------------------------------------------+
        |                          |                          |                          |                      |
        v                          v                          v                          v                      v
  surgeon's MGB mailbox    chief / chair / analyst     periop and other feed      browser behind MGB SSO     BI tool
  (monthly email + CSV;    (dispute filed, deadline    owners (monthly override   (M2; one app, one SSO     (optional;
   decision, re-credit)     and status emails)         list, periop ids only)     mapping, one review)      user filter)
```

### Data flow, including the dispute and recompute loop

```
 [1] ticketed extract lands in landing/<feed_key>/<period>/
       scorecard load: sha256 (same file = no-op) -> feed_load row (ticket, as-of, model version, field checklist)
       -> raw.<feed_key> verbatim -> src.<record_type> typed -> ledger.record upsert (record_ref token)
 [2] scorecard attribute --period P
       one clinician per record (GR1) by the rule for its type; record_participant rows; attribution_exception rows
       block publish until resolved; co-surgeon rate per subspecialty against 5%
 [3] scorecard close --period P
       register (a changed hash for a registered version stops the month)
       -> effective definition version per (metric, period) -> availability (not_in_release | pending_source |
          division_site_only | governance flag unset | feed missing | field missing)
       -> frames per (clinician, site, period, basis): basis = logged for everyone; basis = adjudicated only where
          an active record_override touches the cell
       -> compute: in_scope -> exclusion_reason -> counted -> aggregate  =>  metric_value + metric_value_record
          (non-excluded rows == denominator, or the run fails)
       -> suppress: one suppression_decision per (viewer, metric, period, site, scope), fixed kind order,
          reason text from the versioned catalogue (a blank or an unfilled placeholder fails the run)
       -> peers: snapshot per viewer (viewer excluded, opt-outs removed, non-attendees kept in denominators,
          per-site rows, renders only with five peers each clearing min-n and an eligible viewer);
          sorted values in ledger, member ids in restricted; every render logged
       -> targets (Vizient, MGB average, self last year) -> trend markers (restated, version boundary, history from)
       -> gates: reconciliation against src.periop_report (unexplained delta stops publish) | feed health (a missing
          feed publishes a reason, never a zero) | no blank cell | row count | exceptions
       => ledger.run(kind='close', status='ok', gate_results)
 [4] scorecard publish --period P [--dry-run | --send | --eml]
       ClinicianArtifact per (clinician, period, site) -> plain-text body + own-rows CSV -> payload scan (G12)
       -> own-records check (G14) -> channel gate (G11) -> recipient from the directory (G13) -> relay or .eml
       -> delivery row (artifact sha256, message id) -> run.published_at = "last refreshed"
       scorecard overrides --month P --send: one correction_request list per feed owner (unconfirmed rows only)
 [5] the surgeon reads the email (M1) or the page (M2), opens the record list, finds a row, disputes it
       (M1: reply quoting record_ref; M2: "Dispute this record" button; the effect notice for the field shown first)
 [6] scorecard dispute file (M1, from reply_log R-nnnn) | POST /records/<record_ref>/dispute (M2)
       dispute + dispute_event(filed) -> route.py: tests (a) disputant is chief, (b) re-credit to chief,
       (c) chief on the record, from the dated roster and record_participant
       -> with_chief | with_chair | with_direct_leader (survey, only if the setting is on) | held (route_undefined)
       -> acknowledgement to the surgeon; adjudicator email or queue entry with the provenance panel; 14-day clock starts
 [7] decide: sustained_annotated | sustained_source_corrected | not_sustained | definition_question
       sustained -> record_override (logged value, adjudicated value, note, decider, version)
                 -> correction_request when the feed owner has a named contact
       not_sustained -> note on the row, nothing recomputed; one re-file with new evidence allowed
       definition_question -> definition_open_item on the definition page; definitions owner notified
 [8] scorecard recompute --dispute D-nnnn (same day; M2 app calls it synchronously)
       adjudicated frames for every cell the record feeds (both clinicians on a re-credit), SAME definition version
       -> new metric_value rows restating the old (ledger.restatement, reason_category = 'dispute_decision')
       -> suppression re-checked with the dispute clause -> peer snapshots rebuilt for every affected viewer
       -> reconciliation re-run (a sustained re-credit is an explained delta; a delay-reason override never is)
       -> decision email with the row text and the updated tile ("as logged 60% (6 of 10); as adjudicated 67% (6 of 9)")
       -> re-credit email to the receiving clinician, who may dispute in turn (linked)
 [9] next load of the owning feed: convergence compares each open correction_request with the re-ingested field
       -> match: override retired with history kept, correction_confirmed event
       -> next close computes logged = adjudicated; the tile shows one value; the trend keeps the restated marker
       -> back to [3]
```

### Build order: what each milestone adds to the codebase

| Milestone | Gate (catalogue) | What is added to the repository | Runs where |
|---|---|---|---|
| M0: the Assignment and step zero | Three months of periop extract and periop's report; one surgeon's printed list; faculty-meeting slot; attendance recorded | Package skeleton (`pyproject.toml`, `cli.py`, `log.py`, `settings.py`); migrations for every schema and every M1 table, `roles.sql`, `scorecard migrate`, `grants check`, `doctor`; `scorecard synth` and the synthetic fixtures; `loaders/periop_or_log.py`, `loaders/periop_report.py`, `loaders/roster.py`; `attribution/rules/case.py` and `cosurgeon.py`; `scorecard attribute`, `exceptions`, `roster load|set`, `setting set`; `definitions/_contract.py`, `_catalogue.py` and the wedge four `v1.py` files with the brief's values as `assumed` params; `engine/registry.py`, `periods.py`, `frames.py`, `compute.py`, `peers.py --summary`; the reconciliation fixture test that shows the brief's zero-minute grace window does not reconcile (D-09); requests filed for the VM, the SMTP relay, the directory lookup and the department mailboxes; `docs/RUNBOOK.md` page 1 draft | Analyst workstation, PostgreSQL on localhost (D-02) |
| M1: wedge, months one to three | Ticketed extract; privacy-office confirmation for the email; named analyst; periop contact; periop leadership sign-off on the reason sets | `engine/close.py`, `suppress.py`, `reasons.py`, `targets.py`, `reconcile.py`, `recompute.py`, `trend.py`, `availability.py`; `ledger.source_registry` with the three pending rows; `disputes/` (state, route, file, decide, rowtext, notices, provenance, queue, intake) and the `scorecard dispute` CLI; `loaders/convergence.py`; `publish/` (render, email_text, csv_rows, scan, own_records, gates, directory, transport, delivery, notify, overrides, status, adoption) and the plain-text templates; `retention.py` and the retention classes; `audit.py` and the audit triggers; the printed F-112 checklist; `docs/RUNBOOK.md` complete; the M1 test suite (definitions golden outputs, engine invariants, disputes, loaders, publish) | Analyst workstation until the VM lands; SMTP relay from the department service mailbox |
| M2: hosted view | Security review, data governance, QI determination; per-user authorization | `web/` (app.py with in-app OIDC or SAML, authz.py matrix, queries.py, views, templates, static CSS, `charts.py` inline SVG); `ledger.identity`; RLS policies on the RLS set (the Data model section, roles table); `audit.log_view()` and refused rows; deep links added to the email once `gates.hosted_open()`; `deploy/` (systemd units for the app, pg_dump timer, status timer; nginx; postgresql.conf); `scorecard-status.timer` replaces the printed daily checklist; the pub schema, `pub.py` and its contract test written and tested against fixtures but not enabled (D-36); `tests/web/` including the authorization matrix and the RLS backstop | MGB-managed RHEL VM (D-03); migration by `pg_dump` and `pg_restore` |
| M3: block schedule extract | Owner named; extract on a schedule | `loaders/block_schedule.py`; `attribution/rules/block.py` (`ATTR-BLOCK-HOLDER`); `definitions/block_utilization/v1.py` with `applicability()`; `scorecard source register` flips the registry row from `not_in_release` to `registered`; the `not_applicable` state | VM |
| M4: survey vendor extract | Per-response feed with comments; de-identification owner; copy of the faculty-meeting slide; hosted view; 30-day surgeon-first gate | `loaders/survey.py` and `survey_deid.py`; the `svc_survey` role and `scorecard-survey.path/.service`; `restricted.survey_comment`, `comment_quarantine`, `private_note`; `attribution/rules/survey.py` (`ATTR-SURVEY-NAMED`); the four Bucket 5 definitions with `year_average` aggregation and the system-scope survey group; `web/views/inbox.py` (the only reader of comment text), the leader view and the 30-day gate; the structured survey dispute form and the `direct_leader` route behind its setting; `config/faculty_slide_layout.yaml`; `scorecard survey release`; the `feed-held` catalogue key | VM (the survey path unit needs the VM; Bucket 5 cannot ship on the workstation interim, D-39) |
| M5: billing and attendance feeds | Comp office confirms the wRVU query; QR attendance system live; HR leave feed | `loaders/billing_wrvu.py`, `attendance.py`, `hr_leave.py`; `src.wrvu_month` (mirror, no records), `src.mm_session`, `src.attendance_scan`, `ledger.leave_period` from the feed; `attribution/rules/attendance.py` (`ATTR-ATTEND-SCAN`); `definitions/wrvu/v1.py` (`Kind.MIRROR`, `self_last_year` target) and `mm_attendance/v1.py` (`Kind.PACE`, leave-scaling params); the wRVU ghost-bar and M&M pace blocks on the metric page; `gate.comp_office`; `scan_present` and `removed_by_leave` overrides | VM |
| M6: Vizient and QI feeds | Encounter-level Vizient extract with model version; QI database access per site; medical staff office decision; interval rendering | `loaders/vizient.py` (model version required) and `qi.py` (the only write path to `privileged.qi_event`); `attribution/rules/admission.py` (`ATTR-ADM-INDEX`) and `qi_event.py` (`ATTR-QI-INDEX`); the Vizient four and QI four definitions with `governance_flag='allow_quality'`; `engine/intervals.py` (Wilson, exact Poisson, seeded bootstrap; D-14); `spread_intervals` and `peer_median` filled; `charts.interval_dots()`; the `index_surgeon` and `index_case_attribution` overrides and their chair-branch tests; `gate.medical_staff_office` and the `privileged` grants; `--allow-quality` | VM |
| M7: clinic, referral, ADT feeds | Clinic scheduling and sampling; referral queue with received date; ADT proxy rule | `loaders/clinic_sched.py`, `referral.py`, `adt.py` (deriving `src.icu_stay`); `attribution/rules/visit.py`, `sample.py`, `referral.py`, `icu_stay.py`; `definitions/third_next`, `new_patient_visits`, `notes_72h` `v1.py`; `scorecard source register` for `referral_to_visit` and `icu_return` with `recompute --source-registered`; the null-received-date share on every referral load | VM |

Division and site views (the retired F-105, OQ-52) add nothing to the codebase: the three measures exist only as registered definitions with `availability = 'division_site_only'` and the page text of F-104.

## Architecture decisions

### Decisions register

Every row is a recommendation. Status for every row: recommended, pending builder confirmation. "Section" names where the option set and reasoning are written out; the register is the one place the default is chosen, and the sections were edited to agree with it.

| ID | Decision | Options | Chosen or recommended | Why | Reversibility | Section |
|---|---|---|---|---|---|---|
| D-01 | Language and core stack for the batch | (a) Python 3.12, pandas, psycopg, Jinja2, pytest, one CLI entry point; (b) SQL-first with dbt and a thin Python wrapper; (c) R or SAS scripts | (a) | All three proposals converge here: the analyst can read it, numerator and denominator logic needs real code, and one package produces the email, the recompute and the page. dbt adds a second tool and does not express "old periods keep their old version" as directly as a registry table | Low cost to change before M1; the SQL schema is independent of the language | Ingestion and operations (repository layout); staff judge |
| D-02 | Database for the ledger, and where it runs at M1 | (a) PostgreSQL 16 from M1 on the department VM, on the analyst's MGB-managed workstation localhost until the VM lands; (b) SQLite on local disk, migrate at M2; (c) SQLite on the department network share; (d) SQL Server if MGB DBAs mandate it | (a); the VM requested at M0; workstation interim declared to the privacy office | SQLite on a network share is a documented corruption risk; SQLite on local disk forces a migration exactly when M2 and M4 add a web layer; Postgres on already-governed equipment avoids both without a new host in months one to three; roles, column grants, RLS and triggers are what a security review expects | (d) is a dialect pass: the schema is plain SQL with the Postgres features documented (`daterange` exclusion constraints, partial unique indexes, RLS) | Ingestion and operations (Environments); both judges |
| D-03 | Hosting infrastructure for M2 | (a) one MGB-managed RHEL VM: Postgres, gunicorn behind nginx or MGB's SSO proxy, systemd for backups and status; (b) MGB internal container platform if mandated; (c) enterprise DBA-managed Postgres plus a VM for the app | (a), requested at M0 | Tens of surgeons and thousands of cases a month need no queue, orchestrator or container platform; one VM is what the analyst fraction can patch | The CLI and app move unchanged if a platform is mandated | Ingestion and operations (Environments); staff judge |
| D-04 | Hosted surface at M2 | (a) one small server-rendered web app behind MGB SSO for tiles, trend, spread, record lists, disputes, queue, inbox and notes, with the pub export optional; (b) enterprise BI for tiles plus a trust web service (hybrid); (c) BI only over per-surgeon CSV extracts | (a); pub kept as an optional export under the hybrid's contract | Every proposal that takes the trust mechanics seriously builds the app anyway; the BI layer then buys chart rendering at the cost of a second SSO mapping, a second security review, a per-workbook RLS setting and a deep-link seam; BI over CSVs pushes case-level PHI into the BI tool. This deviates from the design doc's "hosted view on C" and is recorded there with this reasoning | pub is a few days of work whenever wanted (D-36) | Delivery surfaces (M2 web app; pub contract); both judges |
| D-05 | Web framework for the M2 app | (a) Flask + Jinja2 + psycopg, server-rendered, SQL-owned schema, no ORM; (b) Django 5 LTS with unmanaged models, `mozilla-django-oidc` or `djangosaml2`, admin disabled or fenced to analyst screens | (a), unless the builder or the analyst has taken a Django app through an MGB security review before, in which case (b). Three properties hold either way: SSO validated in-app, session variables plus RLS behind the authorization matrix, `log_view()` before every render | The staff judge recommends Flask (the schema is SQL-owned and identity comes from MGB SSO, so Django's ORM and auth are a second description); the security judge recommends Django (reviewer familiarity). The app holds no logic: views call the same service functions the CLI calls | Swap without touching the ledger, the engine or the dispute functions | Dispute workflow (decision 1); Delivery surfaces (S-1); Ingestion and operations (O-1) |
| D-06 | SSO integration pattern | (a) in-app OIDC (Entra ID) or SAML via a maintained library; (b) MGB reverse proxy injecting a UPN header | (a); (b) only if MGB IAM mandates the proxy, with the app's listener restricted to the proxy by network ACL or mTLS and a signed header | A trusted header is only as strong as the network path to the app; token validation in-app removes the review question | Library swap; the identity the app uses is `clinician.upn` either way | Delivery surfaces (S-2); security judge |
| D-07 | Definition file layout | (a) one Python file per metric version, `definitions/<metric>/v1.py`, `v2.py`, sha256 of the file is the version hash; (b) one module per metric holding all versions side by side; (c) YAML per version plus a shared evaluator | (a) | "Edits go in a new version, not here" becomes a git-visible fact; text, params and functions sit under one hash; (c) lets an evaluator edit change past versions silently (both judges); (b) makes diffs noisier | Low; the registry table is the same under (b) | Data model (decision 1); Metric engine (BD-1); both judges |
| D-08 | What the version hash covers | (a) raw file bytes; (b) a normalized form (AST, stripped comments) | (a) | Simplest to explain to a reviewer; a comment edit forcing a new version is intended, because the definition page shows the file's text | Trivial | Metric engine (BD-2) |
| D-09 | What `fcot@v1` carries before periop confirms the institutional definition | (a) register `v1` with the brief's assumed values at M0 for the Assignment's recomputation test and register `v2` with periop's confirmed values before the first close; the reconciliation gate refuses to publish under `v1` if any surgeon's number differs; (b) hold `v1` until periop confirms | (a) when the confirmation arrives after M0, (b) when it arrives before | The Assignment needs a runnable definition before periop answers; the gate guarantees no surgeon sees a number computed under an unconfirmed grace window that does not match periop's | Either path leaves the same registry and delta rows | Metric engine (BD-3) |
| D-10 | Where the signed delay and cancellation reason sets live | (a) as `Param(status='pending_signoff')` inside the definition version, so a signature is a new definition version, with `ledger.reason_set_version` as the sign-off record; (b) a separate signed table read through `ctx` | (a) | Old periods keep the labels and numerators they were computed under by construction; one hash covers the set and the code that reads it; F-100's configuration table is then the registry plus a view, not a second store | Low | Metric engine (BD-4); Data model (F-101, F-102 mapping) |
| D-11 | Computing the adjudicated basis | (a) compute `basis='adjudicated'` only for (clinician, period, metric) cells touched by an active override, with the read path coalescing to the logged row; (b) every metric for every clinician under both bases on every run | (a) | Overrides are rare; (b) doubles every row, makes the tile explain two identical numbers and doubles the audit surface. The display rule is one line: show both when an adjudicated row exists and differs | One flag in `close.py` | Data model (decision 4); Metric engine (BD-5); staff judge |
| D-12 | Which basis decides whether a peer clears min-n | (a) that peer's adjudicated value where one exists, else logged; (b) always logged | (a) | After a sustained re-credit the receiving surgeon's adjudicated list is what both surgeons see; the reconciliation gate, not the peer group, is where logged must match periop | One line in `peers.py` | Metric engine (BD-7); Data model (peer construction) |
| D-13 | How spread values are stored | (a) sorted ascending, no ids; (b) a random permutation per snapshot | (a) | The M1 text form already prints values sorted; a sorted list carries no member order and is identical on every re-render, so two artifacts cannot be diffed to leak order | Trivial | Metric engine (BD-6) |
| D-14 | Interval methods for O/E and rate metrics (OQ-28) | rates: Wilson 95% or exact binomial; count O/E: exact Poisson 95%; LOS O/E: percentile bootstrap or lognormal approximation | `wilson_95` for rates; `oe_exact_poisson_95` for readmission and mortality O/E (reproduces F-24 AC 7: observed 1, expected 0.6 gives 0.04 to 9.3); seeded `bootstrap_95` for Length of stay (O/E) | Each is standard, has no fitted parameters and is named on the definition page; a Poisson interval on summed days would be wrong for LOS | A new method is a new definition version | Metric engine (BD-8) |
| D-15 | What counts as equal in the reconciliation gate | (a) numerator and denominator equal as integers when periop reports both; value equal at periop's printed precision when it reports only a percentage; (b) value within an absolute tolerance | (a) | The wedge's claim is that the numbers are the same number; a tolerance hides the one-case attribution differences the gate exists to surface | One comparison function | Metric engine (BD-9) |
| D-16 | When rolling-12-month metrics are computed | (a) at every monthly close; (b) only at quarter-close months, four points a year | (b) | Matches the proposed trend form (OQ-25), avoids twelve near-identical restatable windows, keeps the small-count mortality series from moving every month on one event | Cadence rule in `periods.py` | Metric engine (BD-10) |
| D-17 | Wording for a spread withheld by viewer eligibility (month one, non-attendee, opt-out) | (a) three catalogue keys at v1: `spread-month-one`, `spread-not-attended`, `spread-opted-out`; (b) render nothing beyond the peer count | (a), a proposed default under OQ-09 and OQ-10 | "The screen says why instead of showing a blank" applies to the comparison cell as much as the value cell; (b) is a blank | Catalogue version | Metric engine (BD-11) |
| D-18 | The clinician natural key | (a) institutional person id as `person_key`, `upn` added at M2 from the directory; (b) `upn` from M0; (c) NPI | (a) | The email months resolve the recipient from the directory by identity at send time (F-90 AC 8), so the roster must carry an identity the directory answers to before any SSO exists; a UPN can change on a name change; NPI is absent for some roster members and is a public identifier | `upn` is unique and nullable until M2 | Data model (decision 2) |
| D-19 | The surgeon-facing record id (`record_ref`) and the URL token (`clinician_ref`) | (a) a short opaque token (base32, 6 to 8 characters, type-prefixed: `C-7K3Q9M`, `K-3F9Q2A`) generated once per source natural key; (b) the integer surrogate; (c) the source's own id | (a) | F-54 AC 3 requires a ledger surrogate that cannot be resolved to a patient without ledger access; the integer is guessable and leaks ordering and volume; the source id is a source identifier | Stable across reloads because it keys on the natural key | Data model (decision 3) |
| D-20 | Dispute routing enum and where survey-record disputes go | (a) `routed_to in ('chief','chair')` only; (b) include `'direct_leader'` now, route every dispute to the chief per GR2 by default, and switch survey-record routing to the direct leader by `department_setting.survey_route.direct_leader` if OQ-43 lands that way | (b): the predicate is coded now and off by default; the shipped behaviour is the brief-literal chief route | No schema change at M4 either way; the inbox audience is protected by the comment-withholding rule (F-72 AC 5) under either route; the owner's answer costs a signed setting, not a release | A setting | Data model (decision 5); Dispute workflow (decision 3); both judges' syntheses name the direct-leader route |
| D-21 | Raw schema shape | (a) one `raw.<feed_key>` table per feed, every allowlisted extract column as `text` plus `feed_load_id` and `line_no`; (b) one generic `raw.line (feed_load_id, line_no, row jsonb)` | (a) | The analyst can `select` a column by name in `psql` and compare it with the file; column presence is what `field_checklist` records; a new column is a reported migration, not a silent JSON key | Loader base class | Data model (decision 6) |
| D-22 | Where quality and complication records live at M6 | (a) a separate `privileged` schema for `qi_event` and any adjudication note on a quality dispute, with its own grants shaped by the medical staff office decision; (b) `src.qi_event` with a `privileged` boolean and RLS; (c) the same tables and grants as operational data | (a), created empty at M1 so `roles.sql` covers it before the feed lands | A schema is the unit of `GRANT` and of `pg_dump --exclude-schema`; if the decision is that these records are peer-review privileged, segregation must be structural. Both judges listed the missing segregation as an error in all three proposals | Moving Vizient admissions into it later is one migration | Data model (decision 7) |
| D-23 | What `delivery` keeps of a sent artifact | (a) `artifact_sha256` plus the rendered body and attachment as files under `preview/<period>/<clinician_ref>/` on the encrypted local disk with their own retention class; (b) the hash only; (c) the full text in a ledger column | (a) | The hash proves what was sent; the file lets the analyst reproduce it for a governance question; keeping PHI-bearing artifacts out of the database keeps `analyst_ro` and any pub export away from them | Retention class | Data model (decision 8) |
| D-24 | Enforcing the row-count and no-blank-cell invariants | (a) SQL gate functions `assert_row_counts` and `assert_no_blank_cells` called by `close`, `recompute` and `restate`, refused-on-fail by `publish`, results stored on the run; (b) deferred constraint triggers at commit | (a) | Both invariants span two tables and the roster and are meaningful only once a run's writes are complete; a gate function names the failing cell in the run log | Trivial | Data model (decision 9) |
| D-25 | The M1 dispute ledger | (a) a shared sheet held by the analyst as the wedge ledger (the catalogue's reading of the design doc, F-111); (b) `scorecard dispute file` writes `ledger.dispute` from day one; an optional validated `dispute import <xlsx>` only if a chief insists, deleted after load | (b) | A sheet is a second PHI copy with no state machine, no routing predicate, no immutability and a hand-applied escalation test; the ledger row with `dispute_event` is the record and nothing migrates at M2. F-111's seven criteria are each met by a stronger ledger mechanism; OQ-55 records the deviation for the owner | The import path keeps the sheet option open | Dispute workflow (decision 2); both judges |
| D-26 | Who triggers the recompute at M2 | (a) the app's decide action calls `engine/recompute.py` synchronously in the same request; (b) the analyst runs it the same day; (c) a systemd timer polls | (a), with (b) as the fallback when the recompute's gates fail | A recompute touches tens of cells and takes under a second; leaving a decided dispute waiting for a human is the "disputing is theater" failure mode | One call site | Dispute workflow (decision 4) |
| D-27 | Withdrawal of a dispute | (a) none; a mistaken filing is decided `not_sustained`; (b) the disputant may withdraw while undecided; never after a decision; a withdrawn dispute does not count toward the two-filing limit | (b), recorded under OQ-16 | The brief is silent; F-57 AC 3 already assumes a surgeon can withdraw an "awaiting row" reply; a forced ruling wastes the adjudicator's time and pollutes the F-98 counts | State machine table | Dispute workflow (decision 5) |
| D-28 | How an annotated override reaches the feed owner | (a) only `source_corrected` writes a `correction_request`; (b) both sustained outcomes write one when the feed owner has a named contact, the outcome distinguishing "asked to correct" from "informed of the adjudication"; (c) a separate "for information" list | (b) | One query produces the F-64 list and one convergence path retires overrides whichever way the source moves; `source_corrected` is refused without a named contact while `annotated` is always available and reads "no source contact named" without one | Query shape | Dispute workflow (decision 6) |
| D-29 | Email mechanism and content for months one to three | (a) plain text plus one CSV of the surgeon's own rows with minimum columns, from a department service mailbox through the internal relay, Reply-To a shared dispute mailbox restricted to the analyst, `--dry-run` preview and `.eml` fallback; (b) HTML multipart with an inline trend image and an xlsx attachment; (c) numbers and reasons only, the case list deferred | (a), with (c) as the recorded fallback (D-31) | Reads on a phone, no images or attachment types to explain to the privacy office, one chart implementation (the app's); minimum columns, an IP-restricted relay and a service mailbox are what the privacy office will ask for | Template and transport only | Delivery surfaces (M1 email); both judges |
| D-30 | Who sends the `.eml` fallback when the relay is unavailable | (a) the department service mailbox opened in Outlook by the analyst; (b) the analyst's own Outlook; (c) no fallback | (a); (c) if the service mailbox cannot be opened in Outlook | (b) leaves every surgeon's case list in a personal Sent Items folder outside the department mailbox's access list and retention policy | Runbook line | Delivery surfaces (S-3); Ingestion and operations (O-5) |
| D-31 | Fallback if the privacy office declines attachments | (a) `publish --numbers-only`: numbers, reasons and trend in the body, the case list deferred to the hosted view, with the catalogue key `no-attachment`; (b) the case list pasted into the body; (c) an encrypted attachment | (a) | (b) does not change what the privacy office is deciding about; (c) invents a key-management answer nobody asked for | Flag | Ingestion and operations (O-6); Delivery surfaces (M1 email) |
| D-32 | CSV shape | (a) one row per (metric, record) with a `metric` column; (b) one row per record with `counted_in_<metric>` columns; (c) one CSV per metric | (a) | F-90 says one attachment; F-49 AC 2 is checked by filtering one column and counting; (b) hides FCOT-only columns behind blanks | Formatter | Delivery surfaces (S-4) |
| D-33 | Where the definition text lives in the email months | (a) an appendix in the body after the tiles, rendered from the registry by version; (b) a second attachment; (c) a version reference only | (a) | F-90 says one attachment and F-50 AC 7 says the text is reachable from every version stamp; (a) keeps the tiles at the top on a phone | Template | Delivery surfaces (S-5) |
| D-34 | Recipient address resolution (F-90 AC 8, OQ-58) | (a) live directory lookup at send time (LDAPS by `person_key`, or Microsoft Graph), compared with the roster's stored address; (b) a monthly directory export loaded as a feed; (c) the roster's typed address alone | (a) where the workstation or VM can reach the directory; (b) as the fallback; (c) refused | The failure mode is a misdirected case list; two independent sources that must agree is the cheapest control | `directory.py` | Delivery surfaces (S-6); Ingestion and operations (O-7) |
| D-35 | Chart rendering | (a) server-rendered inline SVG from an in-repo module, no JavaScript, text table beneath every chart; (b) one vendored JavaScript chart file; (c) a CDN-loaded library | (a), with (b) as the fallback for animation or richer hover; (c) refused (no third-party calls in the runtime path) | The charts are a trend line, a bar spread, ghosted bars and interval dots; an SVG module is smaller to review, and the accessibility rule holds either way | Template include | Delivery surfaces (S-7) |
| D-36 | When to build the pub schema for the enterprise BI tool | (a) defer until a sponsor asks for tiles in the BI tool or the faculty-meeting slide; (b) build at M2 as the fast path if the BI team clears before the app's security review | (a), with the schema, contract test and grants written and tested against fixtures at M2 so (b) is a one-day switch (`department_setting.pub_enabled`) | A second surface has a monthly cost; the contract makes it safe whenever wanted; pub is the mandatory channel for any future division and site aggregates | Setting | Delivery surfaces (S-8); both judges |
| D-37 | Trend table orientation in the email | (a) vertical, one row per period; (b) horizontal | (a) | Twelve columns exceed 72 characters and scroll sideways on a phone; a vertical table has room for the gap reason and the restatement legend | Template | Delivery surfaces (S-9) |
| D-38 | Web session mechanism | (a) signed cookie holding only the SSO subject and expiry, roles recomputed per request; (b) server-side sessions in Postgres | (a) | Nothing surgeon-identified is in the cookie, roster changes take effect on the next request, no session table to retain | Middleware | Delivery surfaces (S-10) |
| D-39 | Who runs the survey load | (a) the analyst from the CLI like every other feed; (b) a systemd path unit on the VM runs it as `svc_survey` when a file lands; the analyst copies the file in and never holds the role | (b) | The step-zero statement that the analyst handles comments as pipeline data must be true of the pipeline and not of a human session (security judge); consequence: Bucket 5 needs the VM | Unit file | Ingestion and operations (O-2) |
| D-40 | What a de-identification hit does to a survey load | (a) fail the whole load; (b) quarantine the comment and publish the rest; (c) quarantine the comment, load everything, hold publication of that survey month until the office resolves it (F-11 AC 4) | (c), with the catalogue key `feed-held` | (a) blocks every surgeon's scores for one bad comment; (b) publishes an inbox the office has not finished | Loader flag | Ingestion and operations (O-3) |
| D-41 | Backup copies against F-113's "nothing disposed while unset" | (a) keep every nightly dump until data governance sets a period; (b) two months of nightly dumps plus the dump after each publish, on the reading that a dump is a redundant copy and the live database retains every record | (b), with the `pg_dump` and `artifact_files` retention classes set to 2 months as an interim under `reference = 'interim pending OQ-57'`; dumps are copied off the M1 workstation | Accumulating PHI copies is the finding a security reviewer writes first; a rolling window loses nothing the database holds | Retention class row | Ingestion and operations (O-4) |
| D-42 | How survey comment text is protected in storage | (a) `restricted` schema with column-level grants (only `app` can SELECT `comment_text`; `svc_survey` writes it); (b) an application-encrypted column with the key held by the app; (c) a separate file with a narrower share ACL | (a), plus the load-time de-identification check; add pgcrypto only if a key can be held outside the database (an MGB secret store) | Grants are auditable and reviewable in a migration; encryption without a key-management answer is a finding, not a control; a separate file is a convention | Migration | Data model (schema layout, roles); security judge |
| D-43 | Third-next-available sampling | (a) the scorecard queries the scheduling system and samples open slots itself; (b) clinic operations produce the sample rows on their schedule and the scorecard loads them | (b); the sampling schedule recorded in `source_registry.extract_name` | (a) makes the department a reader of the scheduling system with its own access request and a second definition of "open new-patient slot" | Loader | Ingestion and operations (O-8) |
| D-44 | CI host | (a) MGB GitHub Enterprise or GitLab with a PostgreSQL service container; (b) local pre-commit only; (c) none | (a) if any MGB git host is available, else (b); (c) refused | The hash-refusal check and the migration check are what make immutability a mechanism | Config | Ingestion and operations (O-9) |
| D-45 | M1 workstation database install | (a) native PostgreSQL 16 installer, localhost only; (b) Docker Desktop; (c) WSL2 | (a) | The workstation is MGB-managed and containers may not be permitted; a native service is what desktop support can see; the data directory sits on the MGB-encrypted system disk | Move by `pg_dump` | Ingestion and operations (O-10) |
| D-46 | Interim `expected_min_rows` for the no-zero guard | (a) no threshold until three months of history exist; (b) 70% of the smallest month in the Assignment's extract, revised by a signed setting after month three | (b) | The guard is worth having in month one and the number is one the analyst can explain | Setting | Ingestion and operations (O-11) |
| D-47 | Runtime for the M1 daily check (F-112) | (a) a printed checklist at the end of each run plus a calendar entry; (b) a Windows scheduled task on the workstation | (a); `scorecard-status.timer` at M2 | No schedulers before the VM; a scheduled task on a workstation that is sometimes off is a check that silently does not run | Timer | Ingestion and operations (O-12) |
| D-48 | `close` and `publish` as two commands behind F-79's "one command" | (a) one command that closes and sends; (b) `scorecard close` then `scorecard publish --dry-run` then `publish --send`, one runbook step | (b) | The analyst previews one email and one CSV against the suppression grid before anything is sent; the survival criterion is the runbook step, not the command count | Wrapper command | Ingestion and operations (F-79 mapping; monthly sequence) |
| D-49 | Period identity across tables | (a) dates only; (b) period labels only; (c) a period label (`2026-10`, `2026-Q4`, `2026-12-R12`, `FY2027:2026-10`) as the authoritative key, with `period_start` and `period_end` dates derived by `engine/periods.py` where a query or a constraint needs them | (c) | The definition contract, the cadence table and the reconciliation report speak in labels; exclusion constraints and range queries need dates; keeping both, derived one way, removes the ambiguity the sections had | Column pair | Assembly decision; Data model DDL; Metric engine (periods) |

### Contradictions between the sections and what was changed

The five sections were written in parallel against the same adopted architecture and disagreed on names and a few mechanisms. Each disagreement below was resolved once, and the section text was edited to match. Where the resolution is also a default, it has a register row.

| # | Where the sections disagreed | Resolution applied everywhere |
|---|---|---|
| C-01 | Two DDLs for `ledger.metric_definition_version`: the Data model section keyed it on `(metric_key, version_label)` with `code_hash`, date-typed effective windows and a separate `definition_param` table; the Metric engine section keyed it on `definition_version_id` (`fcot@v1`) with `content_sha256`, period-label windows and `params jsonb` | One table: primary key `(metric_key, version_label)`, a stored generated `definition_version_id` that every stamp references, `code_hash`, `effective_from_period` and `effective_to_period` labels plus derived `effective_from` and `effective_to` dates (D-49), `definition_param` as a table (not jsonb), `dispute_effect_notices` (not `dispute_effect`), `reason_catalogue_version` (not `reason_templates` or `reason_catalogue_ver`), the Metric engine's `availability` enum (`computed`, `pending_source`, `not_in_release`, `division_site_only`, `mirror`) replacing the Data model's `availability` plus `scope` pair, and the Metric engine's `cadence` enum (`monthly`, `quarterly`, `rolling_12`, `fiscal_year`). The engine section now points at the Data model DDL instead of restating it |
| C-02 | Two DDLs for `ledger.metric_value`: `version_label` versus `definition_version_id`; `period_type` and dates versus `period_label`; `site text` versus `site_id int`; `restatement_reason` on the row versus a `ledger.restatement` table; a derived "current" view versus an `is_current` flag | One table with `definition_version_id`, `period_type` (same enum as `cadence`), `period_label`, `period_start`, `period_end`, `site text`, `aggregation`, `expected`, `interval_method`, `no_evidence_of_diff`, `extra`, `is_current` (with the partial unique index) and the view `metric_value_current` as the read path. Restatement reasons live only in `ledger.restatement.reason_category`, whose eight values are the catalogue's (F-96 AC 1) with the dispute case spelled `dispute_decision` |
| C-03 | `metric_value_record.counted` meant "in the denominator" in the Data model section and "passed the numerator test" in the Metric engine section, which also carried `excluded` | Columns are `excluded` (not in the denominator, always with an `exclusion_reason`), `in_numerator` (the definition's `counted()` result) and `detail` jsonb (the `row_detail` output, including `test_applied` and `delay_label`; the Data model's `row_label` column is gone). The invariant is `count(not excluded) = denominator`. The CSV column `counted` is `not excluded` |
| C-04 | `suppression_decision.kind` sets differed: the Data model had `month_hidden` and `not_computable` and no `interim` or `spread_not_written`; the Metric engine folded `not_computable` into `feed_missing` and had `interim` and `spread_not_written`; the two `caused_by` shapes differed | Twelve kinds: `none`, `not_computed`, `not_in_release`, `pending_source`, `feed_missing`, `feed_held`, `not_computable`, `not_applicable`, `interim`, `min_n`, `spread_not_written`, `peer_under_five`. The Bucket 5 per-month rule is `min_n` with the `hidden-month` template. A missing field is `not_computable` (its own kind, rank 3 beside `feed_missing`); a survey month held by quarantine is `feed_held` (rank 3, D-40, template `feed-held`). Viewer eligibility (`spread_not_written`, rank 7) is tested before the five-peer count (`peer_under_five`, rank 8) so a month-one comparator line always ends with the month-two note. `caused_by_kind` plus `caused_by_ref` replace the three typed columns. `template_key`, `period_label` and `is_current` added |
| C-05 | `peer_group_snapshot` columns: `peer_count`, `peers_clearing_min_n`, `viewer_eligible`, `rendered` versus `n_peers`, `n_clearing_min_n`, `eligibility_state`, `renders`; the Data model said values are "shuffled", the engine's BD-6 chose sorted; the render rule in the Data model lacked the "own value not min-n suppressed" condition | `peer_count`, `peers_clearing_min_n`, `eligibility_state`, `rendered`, `peer_median`, `spread_values` sorted ascending (D-13); the render rule includes the own-value condition; `restricted.peer_group_member.clears_min_n` |
| C-06 | Roster flag names: `step_zero_attended_on` and `opt_out_on` (Data model) versus `_at` (Metric engine pseudo-code) | `_on` (dates) everywhere |
| C-07 | The peer clearance basis: the Data model's pseudo-code read the logged row; the engine's BD-7 reads adjudicated where present | Adjudicated where present, else logged (D-12) |
| C-08 | `ledger.source_registry`, `ledger.definition_delta`, `ledger.reconciliation_result` and `ledger.definition_open_item` each had two column sets | Merged DDL in the Data model section: `source_registry` keeps the Data model's names plus `needs_text`, `registered_by` and `effective_from_period`; `definition_delta` has an integer key, a printable `delta_ref` (`DELTA-0001`), `definition_version_id`, `kind`, `applies_from_period`, `delta_text`; `reconciliation_result` is keyed with `basis` and carries `status`, `explained_by_kind`, `delta_id`, `dispute_ids`; `definition_open_item` has `item_id`, `summary`, `logged_on`, `closed_by_definition_version_id` |
| C-09 | The periop report table was `src.periop_report` in one section and `src.periop_report_row` in two | `src.periop_report` |
| C-10 | Attribution rule ids `ATTR-ADM-INDEX` and `ATTR-ATTEND-SCAN` (Data model) versus `ATTR-ADMIT-INDEX` and `ATTR-SCAN-PERSON` (Ingestion) | The Data model's ids |
| C-11 | Third-next-available samples: the Data model said "no attribution row needed" while `metric_value_record.record_id` references `ledger.record`, so a sample list could not be linked | `third_next_sample` is a record type with the trivial rule `ATTR-SAMPLE-CLINICIAN`; the sample list is the record list (F-25) |
| C-12 | The definition contract's `record_type` values (`or_case`, `mm_session`, `block_day`, `slot_sample`, `wrvu_month`) did not match `ledger.record.record_type` | The contract uses the ledger's record types; `None` for `mirror` |
| C-13 | `metric_key` for the cancellation metric: `sameday_cancel_preventable` (three sections) versus `same_day_cancel` (the definitions directory) | `same_day_cancel` |
| C-14 | Migration file numbers were assigned independently by two sections (`0001` to `0012` versus `0007` to `0013` and `0020`) | One numbered directory, `scorecard/ledger/migrations/NNNN_<name>.sql`; no section fixes a number |
| C-15 | The web package was `scorecard/app/` in two sections and `scorecard/web/` in the Delivery surfaces section, which also holds its layout; tests were `tests/app/` versus `tests/web/`; URL patterns differed (`/dispute/new?record=` versus `/records/<record_ref>/dispute`, `/dispute/<id>` versus `/disputes/<dispute_id>`, `/definitions/<metric>/<label>` versus `/definitions/<metric_key>@<version>`) | `scorecard/web/`, `tests/web/`, and the Delivery surfaces section's URL patterns |
| C-16 | The deployment check was `scorecard web check` in one section and `scorecard doctor` in another | `scorecard doctor`, with the web checks folded in |
| C-17 | Publish flags and commands: `--no-attachment` versus `--numbers-only`; `scorecard overrides send --month` versus `scorecard overrides --month --send`; `scorecard notify deadlines` versus `scorecard status --daily --send`; the preview folder `out/<period>/{body.txt, rows.csv}` versus `preview/<period>/{email.txt, cases.csv, definitions.txt}`; publish module files `smtp.py` versus `transport.py` and `artifacts.py` versus `render.py`; `override_list.txt.j2` versus `.csv.j2` | `--numbers-only`; `scorecard overrides --month P --send`; `scorecard status --daily --send`; `preview/<period>/<clinician_ref>/{email.txt, scorecard-<period>.csv, message.eml}` plus `index.html` and the period-level files; the merged module list in the Delivery surfaces section (`render`, `email_text`, `csv_rows`, `charts`, `scan`, `own_records`, `gates`, `directory`, `transport`, `delivery`, `notify`, `overrides`, `status`, `adoption`, `pub`); `override_list.csv.j2`. Definitions ride in the body (D-33), so no `definitions.txt` |
| C-18 | Who writes `run.published_at`: the Delivery surfaces section said `scorecard close`; the Data model and Ingestion sections said the publisher after the last successful send | The publisher writes it once after the last successful send; `--resend` writes a new delivery row and does not move it |
| C-19 | `run.status` value for a finished close: `'closed'` (Ingestion) versus the enum `('running','ok','failed','dry_run')` (Data model) | `'ok'`; `publish` refuses a period whose latest close is not `ok` with every gate passed |
| C-20 | Setting and column names: `sender_mailbox` versus `service_mailbox`; `delivery.bounced_at` versus `bounce_at`; the misdirected-send record as a `setting set incident.<date>` versus `scorecard delivery incident`; the identity fix as `roster set --email-corrected` versus `--identity` | `service_mailbox`; `bounce_at`; `scorecard delivery incident --delivery <id> --reference R`; `roster set --clinician K --identity <person_key> --effective D` |
| C-21 | Dispute CLI inputs: `--filed-at` plus `--reply-message-id` (Dispute workflow) versus `--reply R-0031` (Delivery surfaces); `dispute.reply_message_id` and `decision_message_id` columns; `reply_log` held only surgeon replies | `reply_log` holds every inbound message to the dispute mailbox (`sender_kind`, `classification` including `decision`, `withdrawal`, `ndr`); `dispute.reply_id` and `decision_reply_id` reference it; `dispute file|decide|withdraw --reply R-nnnn` take the filed date and message id from the logged reply |
| C-22 | Dispute id format `D-014` versus `D-0014` | `dispute_ref` values of the form `D-0014`; `clinician_ref` and `record_ref` tokens likewise named as columns |
| C-23 | `ledger.feed_load.status` lacked the `held` state the survey quarantine (D-40) needs | `held` added to the enum |
| C-24 | `delivery` lacked the `attachment_included` and `statement_version` columns two features need | Both added |
| C-25 | Builder decisions were numbered per section with overlapping labels ("Builder decision 1" meant four different things; the Delivery surfaces section's `D1` to `D10` collided with the register's `D-nn`) | The Delivery surfaces labels are `S-1` to `S-10`; every section-local heading carries its register id; cross-section references name the section and the register id |
| C-26 | The Data model section's module layout placed `registry.py` at the package root; the Metric engine section placed it in `engine/` | `scorecard/engine/registry.py` |
| C-27 | `ClinicianArtifact.kind` used `share` where the definition contract uses `rate` and lacked `median` | `count`, `rate`, `oe`, `median`, `mirror`, `pace`, `text_only` |
| C-28 | Section references were file names (`01-data-model.md`) or numbers ("section 02") | Section names ("the Data model section", "the Metric engine section", "the Dispute workflow section", "the Delivery surfaces section", "the Ingestion and operations section") |


## Data model and attribution ledger

The ledger is the product. Every number a surgeon sees is a row in `ledger.metric_value` that points at the rows in `ledger.metric_value_record` it was computed from, at the `ledger.metric_definition_version` it was computed under (its `definition_version_id`, for example `fcot@v1`), and at the `ledger.run` that published it. Every record in those lists is credited to exactly one clinician by a row in `ledger.attribution`, and the only thing that ever changes a credited value is a row in `ledger.record_override` written by a decided dispute. Nothing in `raw` or `src` is ever edited.

This section fixes the schema layout, every entity with its key fields, the DDL for the load-bearing tables, the invariants and the mechanism that enforces each, the attribution rule per record type, the roster and peer-group rules, retention, and a mapping from every feature in the Attribution ledger, Roles and access, Audit and versioning and Admin and configuration areas of `02-features.md` to a table or column.

Conventions in this section:

- PostgreSQL 16, plain SQL, numbered migrations under `scorecard/ledger/migrations/NNNN_<name>.sql`, applied by `scorecard migrate`. No ORM owns the schema.
- DDL sketches show the columns that carry meaning. Housekeeping columns (`created_at timestamptz not null default now()`, `created_by text`) exist on every table and are omitted below.
- `text` is used for codes and labels so the analyst can read them in `psql`; enumerations are `CHECK` constraints, not Postgres enum types, so a new value is a migration rather than a type change.
- Metric names are the brief's names verbatim. `metric_key` is the short code in the definition module (`or_case_volume`, `fcot`, `duration_accuracy`, `same_day_cancel`, and so on; the full list is the package layout in the Metric engine section).
- Periods are identified by a label (`2026-10`, `2026-Q4`, `2026-12-R12`, `FY2027:2026-10`) and carry derived `period_start` and `period_end` dates where a query needs them (D-49). `<clinician_key>` on a command line is the `person_key`.
- `F-xx` cites `02-features.md`; `Jn.m` cites `01-user-journeys.md`; `OQ-nn` cites the open questions register.

### Schema layout

Six schemas, each with one job and one set of grants.

```
+-----------------------------------------------------------------------------------------------+
| PostgreSQL 16 database: scorecard                                                              |
|                                                                                               |
|  raw          extracts verbatim, one table per feed, every column text, never updated         |
|   |  typed by the loader                                                                      |
|   v                                                                                           |
|  src          typed source records per record type (case, admission, visit, ...) + periop     |
|               report; one row per source record per feed_load; never updated                  |
|   |  attribution rules (one per record type, versioned)                                       |
|   v                                                                                           |
|  ledger       the department's system of truth: clinician, roster, attribution, overrides,    |
|               definitions, metric values + record links, suppression decisions, peer          |
|               snapshots (counts and sorted values only), disputes, corrections, runs,          |
|               reconciliation, delivery, audit_log, retention                                   |
|                                                                                               |
|  restricted   survey comment text, comment quarantine, private notes, peer group MEMBER ids   |
|               (no analyst_ro grant; app role only, column-level)                               |
|                                                                                               |
|  privileged   M6: QI event records and adjudication notes on quality disputes, shaped by the  |
|               medical staff office peer-review decision (own grants; see Builder decision 7)   |
|                                                                                               |
|  pub          optional, deferred: per-viewer, pre-suppressed, identity-free rows for the       |
|               enterprise BI tool; bi_ro SELECT on pub only; contract test before publish       |
+-----------------------------------------------------------------------------------------------+
```

What lives where:

| Schema | Holds | Written by | Read by | Notes |
|---|---|---|---|---|
| `raw` | One table per `feed_key`; every allowlisted column as `text`; `feed_load_id`, `line_no` | `loader` (INSERT only); `svc_survey` for `raw.survey` | `loader`, `engine`; `analyst_ro` except `raw.survey`, `raw.vizient`, `raw.qi` | The file that produced any number can be replayed from here (F-95). The original file also stays in the landing folder with its sha256. |
| `src` | Typed source records: `case`, `case_panel`, `periop_report`, `admission`, `visit`, `third_next_sample`, `survey_response`, `mm_session`, `attendance_scan`, `block_allocation`, `referral`, `adt_transfer`, `icu_stay`, `wrvu_month` | `loader` (INSERT only) | `engine`, `app`, `analyst_ro` | One row per source record per `feed_load`. A corrected extract is a new `feed_load` whose rows supersede the old by `(record_type, source_key)`; old rows stay. |
| `ledger` | Everything the department owns (listed in the entity table below) | `loader` (feed_load, roster), `engine` (attribution, values, decisions, runs), `app` and CLI service functions (dispute, override, correction, notes pointer, audit) | `engine`, `app`, `analyst_ro` (except the columns named in the grants table) | The system of truth. |
| `restricted` | `survey_comment`, `comment_quarantine`, `private_note`, `peer_group_member` | `svc_survey` (comments, quarantine), `engine` (peer members), `app` (notes) | `app` only, column-level; `engine` reads peer members | Nothing here is joined into a metric, an export, a dispute row, a log or pub (F-11 AC 5, F-71 AC 4). |
| `privileged` | M6: `qi_event`, `quality_note` | `loader`, `app` | `engine`, `app` under the quality gate | Exists from M1 as an empty schema so the grants migration covers it before any quality feed lands. |
| `pub` | `tile`, `trend_point`, `spread_point`, `refresh` (the definition text rides on `tile.definition_stamp`) | `publisher` | `bi_ro` | Built only if a sponsor asks (staff judge). Contract: no clinician id, name, patient identifier, case id or comment text; every suppressed tile carries a reason. |

Every table in `ledger` that a surface renders from carries `run_id`, so "what did Dr. X see in October and under which definition" is one query.

### Entity catalogue

One line per entity. DDL for the load-bearing ones follows in the next subsection.

| Entity | Schema | Grain | Key fields | Milestone |
|---|---|---|---|---|
| `clinician` | ledger | one row per person, ever | `clinician_id`, `person_key` (institutional id), `display_name`, `upn` (M2, nullable), `npi` | M0 |
| `roster_membership` | ledger | SCD2 row per (clinician, site, validity window) | `site`, `subspecialty`, `division`, `role`, `chief_clinician_id`, `direct_leader_clinician_id`, `faculty_from/to`, `has_block`, `step_zero_attended_on`, `opt_out_on`, `definition_versions_presented`, `valid` (daterange) | M0 |
| `leave_period` | ledger | one row per approved leave | `clinician_id`, `leave` (daterange), `leave_type`, `approved`, `feed_load_id` | M0 (hand-entered), M5 (HR feed) |
| `department_setting` | ledger | versioned key/value | `key`, `value`, `signed_by`, `signed_on`, `reference`, `valid` (daterange) | M0 |
| `feed_load` | ledger | one row per staged file | `feed_key`, `file_name`, `sha256`, `ticket_number`, `as_of_date`, `model_version`, `period_covered`, `row_count`, `field_checklist`, `status`, `supersedes_feed_load_id` | M1 |
| `src.case` + `src.case_panel` | src | one OR-log case; one panel member | see DDL | M1 |
| `src.periop_report` | src | periop's own surgeon-level number | `clinician_raw`, `metric_key`, `period`, `numerator`, `denominator`, `value` | M1 |
| `src.admission` | src | one Vizient encounter | see DDL | M6 |
| `src.visit`, `src.third_next_sample` | src | one clinic visit; one sample (record type `third_next_sample`) | see DDL | M7 |
| `src.survey_response` | src | one survey response (scores only) | see DDL; comment text in `restricted.survey_comment` | M4 |
| `src.mm_session`, `src.attendance_scan` | src | one M&M session; one scan | see DDL | M5 |
| `src.block_allocation` | src | one block day per holder | see DDL | M3 |
| `src.referral` | src | one referral | see DDL | M7 |
| `src.adt_transfer`, `src.icu_stay` | src | one unit transfer; one derived ICU stay with step-down | see DDL | M7 |
| `privileged.qi_event` | privileged | one QI database event | `qi_event_id`, `event_type`, `event_at`, `index_case_source_key`, `implant_flag`, `site` | M6 |
| `privileged.quality_note` | privileged | one free-text note on a dispute over a `qi_event` record: the surgeon's claim or the adjudicator's decision note | `note_id`, `dispute_id`, `note_kind` (`claim`, `decision`), `note_text`, `author_clinician_id`, `written_at` | M6 |
| `src.wrvu_month` | src | one clinician-month snapshot | `clinician_id`, `service_month`, `fiscal_year`, `wrvu`, `as_of_date`, `report_date`, `prior_snapshot_wrvu`, `restatement_delta` | M5 |
| `record` | ledger | one row per source record ever seen, any type | `record_id` (surrogate), `record_type`, `source_key`, `record_ref` (surgeon-facing id), `current_src_row_id` | M1 |
| `attribution` | ledger | one current row per record | see DDL | M1 |
| `record_participant` | ledger | one row per person on a record | `record_id`, `clinician_id`, `participant_role`, `listed_order` | M1 |
| `attribution_exception` | ledger | one row per unresolved or resolved exception | `record_id`, `exception_type`, `resolution`, `resolved_clinician_id`, `reason`, `resolved_by`, `resolved_at` | M1 |
| `record_override` | ledger | one row per adjudicated field change | see DDL | M1 |
| `metric_definition_version` | ledger | one immutable row per (metric, version) | see DDL | M1 |
| `definition_param` | ledger | one row per parameter per version | `definition_version_id`, `name`, `value`, `unit`, `status` (`assumed`, `confirmed`, `pending_signoff`), `brief_value`, `confirmed_by`, `confirmed_on`, `note` | M1 |
| `definition_delta` | ledger | written difference from the brief or from periop | `delta_id`, `delta_ref`, `metric_key`, `definition_version_id`, `kind`, `applies_from_period`, `delta_text`, `author`, `created_on` | M1 |
| `definition_open_item` | ledger | definition question from a dispute or reply | `item_id`, `metric_key`, `dispute_id` or `reply_id`, `summary`, `logged_on`, `closed_by_definition_version_id` | M1 |
| `reason_set_version` | ledger | one signed set of delay or cancellation reason codes | `set_key`, `version_label`, `codes`, `signed_by`, `signed_on`, `effective_from` | M1 |
| `reason_catalogue` | ledger | one wording per state key per catalogue version | `catalogue_version`, `state_key`, `template` | M1 |
| `source_registry` | ledger | one row per source per metric | see DDL | M1 |
| `feed_owner` | ledger | one row per feed (the F-04 table) | see DDL | M1 |
| `comparison_target` | ledger | one row per (clinician, metric, period, site, target kind) | see the Metric engine section | M1 |
| `restatement` | ledger | one row per replaced `metric_value` row | see the Metric engine section | M1 |
| `metric_value` | ledger | one number per (clinician, metric, period, site, basis) per compute | see DDL | M1 |
| `metric_value_record` | ledger | one row per record behind a number | see DDL | M1 |
| `suppression_decision` | ledger | one row per (viewer, metric, period, site, scope) per run | see DDL | M1 |
| `peer_group_snapshot` | ledger | one row per (viewer, metric, period, site) per run | see DDL; member ids in `restricted.peer_group_member` | M1 |
| `dispute`, `dispute_event` | ledger | one dispute; one state transition | see DDL | M1 |
| `correction_request` | ledger | one request per sustained source-corrected override | see DDL | M1 |
| `run` | ledger | one row per command invocation that writes | see DDL | M1 |
| `reconciliation_result` | ledger | one row per (clinician, metric) per run | see DDL | M1 |
| `delivery` | ledger | one row per artifact sent | see DDL | M1 |
| `reply_log` | ledger | one row per inbound message to the dispute mailbox (surgeon or adjudicator) | `reply_id`, `reply_ref` (`R-0031`), `clinician_id`, `sender_kind` (`surgeon`, `adjudicator`, `other`), `period`, `received_at`, `classification` (`dispute`, `question`, `seen`, `awaiting_row`, `decision`, `withdrawal`, `ndr`), `entered_at`, `dispute_id`, `answered_at`, `message_id` | M1 |
| `audit_log` | ledger | one row per action or view | see DDL | M1 |
| `identity` | ledger | SSO subject to clinician | `sso_subject`, `upn` (from the directory lookup by `person_key`, never typed), `clinician_id`, `app_roles`, `logout_before`, `valid`; audited by trigger | M2 |
| `retention_class`, `disposition_log` | ledger | one class per store; one row per disposition | see Retention | M1 |
| `restricted.survey_comment` | restricted | one comment per response | `response_id`, `comment_text`, `deidentified_by`, `feed_load_id` | M4 |
| `restricted.comment_quarantine` | restricted | one quarantined comment | `response_id`, `pattern_hit`, `feed_load_id`, `released_at` | M4 |
| `restricted.private_note` | restricted | one note per (comment, author) edit chain | see DDL | M4 |
| `restricted.peer_group_member` | restricted | one member per snapshot | `snapshot_id`, `clinician_id`, `value`, `clears_min_n` | M1 |

Two entities the proposals treated as one are split on purpose:

- `record` is the identity of a source record across reloads. `src.*` rows are per `feed_load`; the record survives them. `record_ref` is the surgeon-facing stable case id (F-54 AC 3) and is never an MRN, CSN or encounter number (Builder decision 3).
- `feed_owner` (F-04) and `source_registry` (F-103) are different tables: `feed_owner` says who owns a feed and what can be corrected there; `source_registry` says when a pending metric became computable and under which join key and rule.

### DDL sketches for the load-bearing tables

#### Clinician, roster, leave, settings

```sql
create table ledger.clinician (
  clinician_id     bigint generated always as identity primary key,
  person_key       text not null unique,          -- institutional person id (Builder decision 2, D-18)
  clinician_ref    text not null unique,          -- opaque token for URLs, e.g. 'K-3F9Q2A' (Builder decision 3, D-19)
  display_name     text not null,
  npi              text,
  upn              text unique,                   -- populated at M2 from the directory
  active_from      date not null,
  active_to        date
);

create extension if not exists btree_gist;

create table ledger.roster_membership (
  roster_id                    bigint generated always as identity primary key,
  clinician_id                 bigint not null references ledger.clinician,
  site                         text not null,
  subspecialty                 text not null,
  division                     text not null,
  role                         text not null check (role in ('surgeon','chief')),
  chief_clinician_id           bigint references ledger.clinician,
  direct_leader_clinician_id   bigint references ledger.clinician,
  faculty_from                 date not null,
  faculty_to                   date,
  has_block                    boolean not null default false,
  step_zero_attended_on        date,              -- null = did not attend
  opt_out_on                   date,              -- null = participating
  definition_versions_presented text[] not null default '{}',
  valid                        daterange not null,
  feed_load_id                 bigint references ledger.feed_load,
  -- one open window per (clinician, site); a change closes the old row and opens a new one
  exclude using gist (clinician_id with =, site with =, valid with &&)
);
create index on ledger.roster_membership using gist (valid);

create table ledger.leave_period (
  leave_id       bigint generated always as identity primary key,
  clinician_id   bigint not null references ledger.clinician,
  leave          daterange not null,
  leave_type     text,
  approved       boolean not null,
  feed_load_id   bigint references ledger.feed_load,
  exclude using gist (clinician_id with =, leave with &&)
);

create table ledger.department_setting (
  setting_id   bigint generated always as identity primary key,
  key          text not null,        -- chair_clinician_id, dispute_mailbox, analyst_clinician_id,
                                     -- backup_analyst_clinician_id, month_one_period,
                                     -- gate.privacy_email.scorecard, gate.privacy_email.adjudicator,
                                     -- gate.privacy_email.recredit, gate.privacy_email.decision,
                                     -- gate.privacy_email.override_list, gate.security_review,
                                     -- gate.data_governance, gate.qi_determination,
                                     -- gate.medical_staff_office, gate.comp_office, gate.survey_pipeline,
                                     -- survey_scope_phrase, leader_sees_measures, pooled_site_row
  value        text not null,
  signed_by    text,
  signed_on    date,
  reference    text,                 -- for a gate: the ticket URL or the sha256 of the sign-off document
  confirmed_by text,                 -- a second identity (backup analyst or the brief's owner), set by
  confirmed_on date,                 --   `scorecard setting confirm` from a different scorecard.actor
  valid        daterange not null,
  exclude using gist (key with =, valid with &&)
);
```

`department_setting` is read "as of" a date, like the roster. A governance gate is a row whose `key` starts with `gate.`, whose `signed_on` is not null and whose `confirmed_by` is a second identity: the analyst records the sign-off with `scorecard setting set gate.<name> yes --signed-by X --signed-on D --reference R`, where `reference` must be a ticket URL or the sha256 of the sign-off document (a bare sentence is refused), and the backup analyst or the brief's owner confirms it with `scorecard setting confirm gate.<name> --by <identity>` from their own session, so the person a gate constrains is not the only one attesting it. `scorecard publish` and the app deployment check refuse a channel until the confirmed gate row for that channel exists (F-106 AC 1 to AC 4); `/analyst/gates` and the quarterly access recertification list every gate row with its signer, confirmer and reference. The run flags `--allow-hosted`, `--allow-survey`, `--allow-quality` are convenience switches that read those rows and refuse if they are missing; they never bypass them.

The roster is queried for a period with one helper the whole engine uses:

```sql
create function ledger.roster_as_of(p_date date)
returns setof ledger.roster_membership language sql stable as $$
  select * from ledger.roster_membership where valid @> p_date
$$;
```

"As of the period" means the last day of the period (F-99 AC 1). "As of the access date" means today (F-86 AC 5, F-88 AC 1).

#### Feed load

```sql
create table ledger.feed_load (
  feed_load_id            bigint generated always as identity primary key,
  feed_key                text not null check (feed_key in (
                            'periop_or_log','periop_report','roster','hr_leave','block_schedule',
                            'survey','billing_wrvu','attendance','vizient','qi','clinic_sched',
                            'referral','adt')),
  file_name               text not null,
  sha256                  text not null,
  ticket_number           text not null,          -- a load without a ticket is refused (F-95 AC 1)
  as_of_date              date not null,          -- the feed's own as-of (F-97)
  model_version           text,                   -- Vizient only
  period_covered          daterange,
  received_at             timestamptz not null,
  loaded_at               timestamptz,
  loaded_by               text not null,          -- db role or service account, not a person's name
  row_count               integer,
  field_checklist         jsonb not null default '{}', -- {"wheels_in": true, "delay_reason_code": false, ...}
  status                  text not null check (status in ('received','loaded','partial','failed','superseded','held')),
                                                   -- 'held': survey load with quarantined comments (D-40)
  supersedes_feed_load_id bigint references ledger.feed_load,
  unique (feed_key, sha256)                        -- reloading the same file is a no-op
);
```

Every `src.*` row, every `raw.*` row, every `ledger.attribution` row and every `ledger.metric_value` row points at a `feed_load_id`. The feed-health gate (F-82) reads `status` and `row_count` against `expected_min_rows` in `department_setting`.

#### Source record tables

All `src` tables share four columns: `src_row_id bigint identity primary key`, `feed_load_id bigint not null references ledger.feed_load`, `source_key text not null` (the source system's own id), and `record_id bigint references ledger.record` (set by the loader after upserting `ledger.record`). Unique on `(feed_load_id, source_key)`. Only the columns that carry meaning are listed.

```sql
create table src."case" (               -- record_type 'case'; feeds OR case volume, FCOT,
                                        -- Duration estimate accuracy, Same-day cancellations
  ... shared columns ...,
  site                     text not null,
  room                     text,
  date_of_surgery          date not null,
  procedure_desc           text,
  scheduled_start          timestamptz,
  wheels_in                timestamptz,
  wheels_out               timestamptz,
  booked_minutes           integer,             -- named field to confirm (OQ-39)
  actual_in_room_minutes   integer,             -- named field to confirm (OQ-39)
  first_case_in_room       boolean,             -- periop's flag if present; else derived per F-100 rule
  cancelled_same_day       boolean not null default false,
  cancellation_reason_code text,
  delay_reason_code        text,
  implant_flag             boolean              -- for the SSI 90-day window (F-09 AC 4)
);

create table src.case_panel (           -- one row per surgeon on the case, in the extract's order
  src_row_id      bigint generated always as identity primary key,
  case_src_row_id bigint not null references src."case",
  clinician_raw   text not null,
  clinician_id    bigint references ledger.clinician,   -- null when outside the roster
  panel_role      text not null,        -- 'primary', 'co_surgeon', 'assistant', ... as the extract says
  listed_order    integer not null
);

create table src.periop_report (        -- the reconciliation target, loaded like any other feed (F-81)
  ... shared columns ...,
  clinician_raw   text not null,
  clinician_id    bigint references ledger.clinician,
  metric_key      text not null,
  period_start    date not null,
  numerator       numeric,
  denominator     numeric,
  value           numeric
);

create table src.admission (            -- record_type 'admission'; Vizient encounter-level (M6)
  ... shared columns ...,
  hospital                   text not null,
  admit_at                   timestamptz not null,
  discharge_at               timestamptz,
  discharging_attending_id   bigint references ledger.clinician,
  observed_los_days          numeric,
  expected_los_days          numeric,
  observed_readmit_30d       boolean,
  expected_readmit           numeric,
  died_in_hospital           boolean,
  expected_mortality         numeric,
  relative_weight            numeric,
  model_version              text not null,
  index_case_record_id       bigint references ledger.record,   -- set by ATTR-ADM-INDEX; null = no index operation
  index_rule_version         text
);

create table src.visit (                -- record_type 'visit' (M7)
  ... shared columns ...,
  visit_at                   timestamptz not null,
  rendering_provider_raw     text,
  rendering_provider_id      bigint references ledger.clinician,
  attribution_field_used     text not null,   -- the named field from the registry (OQ-39)
  is_new_patient             boolean,
  completed                  boolean not null,
  note_signed_at             timestamptz,
  referral_source_key        text
);

create table src.third_next_sample (    -- record_type 'third_next_sample': one sample per (clinician, sample date)
  ... shared columns ...,
  clinician_id    bigint not null references ledger.clinician,
  sample_date     date not null,
  days_to_third_next integer not null
);

create table src.survey_response (      -- record_type 'survey_response' (M4); scores only, no free text
  ... shared columns ...,
  survey_month        date not null,
  provider_named_raw  text not null,
  provider_named_id   bigint references ledger.clinician,
  recommend_answer    integer,
  explained_top       boolean,
  listened_top        boolean,
  respect_top         boolean,
  has_comment         boolean not null default false,
  scope_label         text not null      -- 'outpatient provider items' from department_setting
  -- comment text is in restricted.survey_comment keyed by response source_key
);

create table src.mm_session (           -- one M&M session (M5)
  ... shared columns ...,
  session_at    timestamptz not null,
  fiscal_year   text not null,
  held          boolean not null
);

create table src.attendance_scan (      -- record_type 'attendance': one row per (session, roster member)
  ... shared columns ...,               -- the loader materialises a row per (session, clinician on faculty
  session_src_row_id  bigint not null references src.mm_session,   -- that day) so absences are records too
  clinician_raw       text,
  clinician_id        bigint not null references ledger.clinician,
  scanned_at          timestamptz,      -- null = scan absent
  removed_by_leave    boolean not null default false
);

create table src.block_allocation (     -- record_type 'block_allocation' (M3)
  ... shared columns ...,
  holder_raw         text not null,
  holder_id          bigint references ledger.clinician,
  site               text not null,
  block_date         date not null,
  allocated_minutes  integer not null,
  released_minutes   integer not null default 0,
  used_minutes       integer not null default 0
);

create table src.referral (             -- record_type 'referral' (M7, pending source)
  ... shared columns ...,
  received_at            timestamptz,   -- nullable; share of nulls reported each period (F-109 AC 6)
  target_provider_raw    text,
  resulting_visit_source_key text
);

create table src.adt_transfer (         -- raw unit transfers (M7)
  ... shared columns ...,
  encounter_source_key text not null,
  from_unit  text, to_unit text, transfer_at timestamptz not null
);

create table src.icu_stay (             -- record_type 'icu_stay': derived by the loader from adt_transfer
  ... shared columns ...,               -- under the registered proxy rule (F-110, OQ-05)
  admission_record_id  bigint references ledger.record,
  icu_in_at            timestamptz not null,
  step_down_at         timestamptz,
  return_at            timestamptz,
  hours_to_return      numeric,
  proxy_window_hours   integer not null  -- the F-100 parameter in force
);
```

`privileged.qi_event` (M6) has the same shared columns plus `event_type` (`return_or`, `ssi`, `vte`, `csf_leak`), `event_at`, `index_case_source_key`, `index_case_record_id`, `site`, `qi_database_id`. It sits in `privileged` because the medical staff office decision may make it and any notes on it peer-review material (Builder decision 7).

`src.wrvu_month` is keyed by `(clinician_id, service_month, feed_load_id)`. It has no `record_id` and no attribution row: Work RVUs — live tracker is a mirror with no record list and no dispute action in this release (F-77, OQ-33).

#### Record identity and attribution

```sql
create table ledger.record (
  record_id           bigint generated always as identity primary key,
  record_type         text not null check (record_type in (
                        'case','admission','visit','survey_response','attendance',
                        'block_allocation','referral','icu_stay','qi_event','third_next_sample')),
  source_key          text not null,             -- the source system's id, never shown to a surgeon
  record_ref          text not null unique,      -- surgeon-facing id, e.g. 'C-7K3Q9M' (Builder decision 3)
  first_feed_load_id  bigint not null references ledger.feed_load,
  current_src_row_id  bigint,                    -- latest src row; older rows stay for history
  unique (record_type, source_key)
);

create table ledger.attribution (
  attribution_id     bigint generated always as identity primary key,
  record_id          bigint not null references ledger.record,
  record_type        text not null,
  clinician_id       bigint references ledger.clinician,       -- null only while an exception is open
  rule_id            text not null,               -- 'ATTR-CASE-PRIMARY', 'ATTR-ADM-INDEX', ...
  rule_version       text not null,
  shared_flag        boolean not null default false,
  tie_break_applied  text,                        -- 'first_listed_primary' or null
  exception_type     text check (exception_type in (
                       'blank_primary','ambiguous_primary','outside_department',
                       'no_index_operation','unmapped_provider','no_index_case')),
  feed_load_id       bigint not null references ledger.feed_load,
  run_id             bigint not null references ledger.run,
  valid_from         timestamptz not null default now(),
  valid_to           timestamptz,                 -- null = current
  check ((clinician_id is not null) or (exception_type is not null))
);

-- GR1 as a constraint: exactly one current attribution per record.
create unique index attribution_one_current
  on ledger.attribution (record_id) where valid_to is null;

create table ledger.record_participant (
  record_id        bigint not null references ledger.record,
  clinician_id     bigint not null references ledger.clinician,
  participant_role text not null,   -- 'primary','co_surgeon','assistant','discharging_attending',
                                    -- 'index_surgeon','rendering_provider','provider_named','scanned_person'
  listed_order     integer,
  feed_load_id     bigint not null references ledger.feed_load,
  primary key (record_id, clinician_id, participant_role)
);

create table ledger.attribution_exception (
  exception_id           bigint generated always as identity primary key,
  record_id              bigint not null references ledger.record,
  exception_type         text not null,
  raw_fields             jsonb not null,          -- the panel or provider fields as received
  period_start           date not null,
  resolution             text check (resolution in ('assigned','excluded')),
  resolved_clinician_id  bigint references ledger.clinician,
  reason                 text check (reason is null or length(trim(reason)) > 0),
  resolved_by            text,
  resolved_at            timestamptz,
  run_id                 bigint not null references ledger.run
);
```

A reload closes the current attribution row (`valid_to = now()`) and opens a new one under the same rule, so the partial unique index is never violated and history is kept. A sustained re-credit does not touch `attribution`: it writes `record_override(field = 'credited_clinician')`, and the adjudicated basis reads attribution plus active overrides.

#### Record override and correction request

```sql
create table ledger.record_override (
  override_id             bigint generated always as identity primary key,
  dispute_id              bigint not null references ledger.dispute,
  record_id               bigint not null references ledger.record,
  record_type             text not null,
  field                   text not null check (field in (
                            'credited_clinician','delay_reason_code','cancellation_reason_code',
                            'provider_named','scan_present','removed_by_leave','index_surgeon',
                            'index_case_attribution','rendering_provider')),
  logged_value            text not null,
  adjudicated_value       text not null,
  new_clinician_id        bigint references ledger.clinician,   -- set when field = credited_clinician
  note                    text not null check (length(trim(note)) > 0),
  decided_by              bigint not null references ledger.clinician,
  decided_role            text not null check (decided_role in ('chief','chair','direct_leader')),
  definition_version_label text not null,
  override_version        integer not null default 1,
  effective_from          timestamptz not null default now(),
  correction_requested_at timestamptz,
  source_confirmed_at     timestamptz,
  retired_at              timestamptz,
  retired_by_feed_load_id bigint references ledger.feed_load
);
create index on ledger.record_override (record_id) where retired_at is null;

create table ledger.correction_request (
  correction_request_id  bigint generated always as identity primary key,
  override_id            bigint not null references ledger.record_override,
  dispute_id             bigint not null references ledger.dispute,
  feed_key               text not null references ledger.feed_owner,
  record_id              bigint not null references ledger.record,
  field                  text not null,
  logged_value           text not null,
  requested_value        text not null,
  first_sent_at          timestamptz,
  last_sent_at           timestamptz,
  sent_in_run_ids        bigint[] not null default '{}',
  confirmed_by_feed_load_id bigint references ledger.feed_load
);
```

Convergence (F-06): at every load of the owning feed, the loader compares each open request's `requested_value` with the newly ingested field on the record; on a match it sets `source_confirmed_at` and `retired_at` on the override and `confirmed_by_feed_load_id` on the request. The monthly override list (F-64) is `select ... from correction_request where confirmed_by_feed_load_id is null`, one list per `feed_key`, and a row stays on it until confirmed.

#### Metric definitions, parameters, deltas, registries

```sql
create table ledger.metric_definition_version (
  metric_key               text not null,
  version_label            text not null,           -- 'v1', 'v2'; must match the file name
  definition_version_id    text generated always as (metric_key || '@' || version_label) stored,
                                                    -- 'fcot@v1'; the stamp every metric_value carries
  file_path                text not null,           -- 'definitions/fcot/v1.py'
  code_hash                char(64) not null,       -- sha256 of the file bytes (D-08)
  git_sha                  char(40) not null,
  metric_name              text not null,           -- verbatim from the brief
  bucket                   text not null,
  kind                     text not null check (kind in ('rate','oe','count','median','mirror','pace')),
  record_type              text,                    -- ledger.record type; null for mirror and division_site_only
  cadence                  text not null check (cadence in ('monthly','quarterly','rolling_12','fiscal_year')),
  min_n                    integer,                 -- null = never count-suppressed
  min_n_unit               text,
  comparator_text          text not null,           -- brief's "Compared to" verbatim
  peer_scope               text check (peer_scope in ('site','system')),   -- null = no peer comparison
  peer_by_subspecialty     boolean,
  peer_group_word          text,                    -- 'subspecialty' | 'department', for the reason template
  targets                  text[] not null default '{}',   -- peer_spread | vizient | mgb_average | self_last_year
  direction                text not null check (direction in ('higher_is_better','lower_is_better','not_stated')),
  risk_model               text,                    -- 'vizient' or null; drives the O/E and "unadjusted" labels
  availability             text not null check (availability in
                             ('computed','pending_source','not_in_release','division_site_only','mirror')),
  governance_flag          text,                    -- 'allow_quality' | 'allow_survey' | null
  definition_text          text not null,           -- verbatim (brief or institutional source)
  institutional_source     text,
  note_text                text,
  lever_text               text not null,
  dispute_effect_notices   jsonb not null default '{}',   -- F-56, keyed by disputable field
  reason_catalogue_version text not null,           -- the F-33 catalogue version this definition pins
  record_columns           text[] not null default '{}',
  interval_method          text,
  reconcile_to             text,                    -- 'periop_report:fcot' or null
  aggregations             text[] not null default '{period}',   -- survey measures add 'year_average'
  record_list              boolean not null default true,
  disputable               boolean not null default true,
  effective_from_period    text not null,           -- period label, e.g. '2026-10' (D-49)
  effective_to_period      text,
  effective_from           date not null,           -- derived from the label by the registry, for the constraint
  effective_to             date,
  supersedes               text references ledger.metric_definition_version (definition_version_id),
  confirmed_by             text,
  confirmed_on             date,
  approved_by              text,                    -- empty until OQ-35 is answered
  diff_from_prior          text,                    -- unified diff against `supersedes`, stored at registration
  registered_at            timestamptz not null default now(),
  registered_by            text not null,
  primary key (metric_key, version_label),
  unique (definition_version_id),
  exclude using gist (metric_key with =, daterange(effective_from, effective_to, '[)') with &&)
);

create table ledger.definition_param (              -- one row per Param per version, written with the version
  definition_version_id text not null references ledger.metric_definition_version (definition_version_id),
  name          text not null,
  value         text,                               -- null while status = 'pending_signoff'
  unit          text,
  status        text not null check (status in ('assumed','confirmed','pending_signoff')),
  brief_value   text,                               -- the brief's number when the value in force came from a confirmation
  note          text,
  confirmed_by  text,
  confirmed_on  date,
  primary key (definition_version_id, name)
);

-- Immutability by mechanism: no UPDATE, no DELETE, ever.
create function ledger.refuse_change() returns trigger language plpgsql as $$
begin raise exception 'ledger.% is append-only', tg_table_name; end $$;
create trigger mdv_immutable before update or delete on ledger.metric_definition_version
  for each row execute function ledger.refuse_change();
create trigger dp_immutable before update or delete on ledger.definition_param
  for each row execute function ledger.refuse_change();
```

`scorecard register` hashes each `definitions/<metric>/<version>.py`; if `(metric_key, version_label)` exists with a different `code_hash` it exits non-zero and names the file (F-13 AC 2). The same test runs in pytest against the fixture registry. `definition_param` (one row per parameter per version, with `status` in `assumed`, `confirmed`, `pending_signoff`) is written in the same transaction from the module's `Params`, so the definition page can list every item still flagged (F-13 AC 4, AC 5). The registry converts `effective_from_period` and `effective_to_period` to the `effective_from` and `effective_to` dates the exclusion constraint needs (D-49). The module contract that produces these columns is in the Metric engine section.

```sql
create table ledger.definition_delta (      -- F-81 AC 4, F-100 AC 5
  delta_id              bigint generated always as identity primary key,
  delta_ref             text not null unique,        -- 'DELTA-0001', printed on the reconciliation table
  metric_key            text not null,
  definition_version_id text not null references ledger.metric_definition_version (definition_version_id),
  kind                  text not null check (kind in ('brief_vs_institutional','ours_vs_periop_report')),
  applies_from_period   text not null,
  applies_to_period     text,
  delta_text            text not null,               -- what differs from periop's number, or from the brief, and why
  author                text not null,               -- a delta without an author is refused (F-81 AC 4)
  created_on            date not null default current_date
);

create table ledger.definition_open_item (      -- F-63: a definition question from a dispute or from a reply
  item_id                         bigint generated always as identity primary key,
  metric_key                      text not null,
  dispute_id                      bigint references ledger.dispute,
  reply_id                        bigint references ledger.reply_log,
  summary                         text not null,
  logged_on                       date not null default current_date,
  closed_by_definition_version_id text references ledger.metric_definition_version (definition_version_id),
  check (dispute_id is not null or reply_id is not null)
);

create table ledger.reason_set_version (    -- F-101, F-102
  set_key        text not null check (set_key in ('surgeon_delay_reasons','surgeon_cancellation_reasons')),
  version_label  text not null,
  codes          text[] not null,
  includes_blank boolean not null default false,
  includes_other boolean not null default false,
  signed_by      text,                       -- null = pending periop leadership sign-off
  signed_on      date,
  effective_from date not null,
  effective_to   date,
  primary key (set_key, version_label)
);

create table ledger.source_registry (       -- F-103
  registry_id           bigint generated always as identity primary key,
  metric_key            text not null,
  status                text not null check (status in ('pending_source','not_in_release','registered')),
  feed_key              text references ledger.feed_owner,
  needs_text            text,                        -- "the block allocation and release schedule" for the not-in-release reason
  system_name           text,
  extract_name          text,                        -- also records the sampling schedule for third-next samples (D-43)
  join_key              text,
  attribution_rule_id   text,
  attribution_rule_text text,
  effective_from_period text,                        -- period label from which the metric computes
  effective_from        date,                        -- derived from the label (D-49)
  registered_on         date,
  registered_by         text,
  valid_from            timestamptz not null default now(),
  valid_to              timestamptz,
  check (status <> 'registered' or (system_name is not null and extract_name is not null and join_key is not null
                                    and attribution_rule_text is not null and effective_from_period is not null))
);
-- one registration per metric per effective date; the pending row has effective_from null
create unique index source_registry_one_per_date
  on ledger.source_registry (metric_key, coalesce(effective_from, date '0001-01-01'));

create table ledger.feed_owner (            -- F-04: one row per source feed
  feed_key             text primary key,
  record_type          text,
  attribution_rule_id  text,
  join_key             text,
  metrics_produced     text[] not null,
  owner_team           text not null,
  contact_name         text,                 -- null blocks 'source corrected' (F-61 AC 3)
  contact_mailbox      text,
  disputable_fields    text[] not null default '{}',
  override_list_recipient text,
  as_of_field          text,
  model_version_field  text,
  status               text not null check (status in ('live','registered','pending','no_ledger_record')),
  valid                daterange not null,
  exclude using gist (feed_key with =, valid with &&)
);
```

The reason catalogue (F-33) is `ledger.reason_catalogue (catalogue_version, state_key, template)`; the definition version's `reason_catalogue_version` pins the catalogue version and its `min_n_unit` and `peer_group_word` fill the templates, so old periods render under the catalogue version they were suppressed under.

#### Metric values and record links

```sql
create table ledger.metric_value (
  metric_value_id          bigint generated always as identity primary key,
  clinician_id             bigint not null references ledger.clinician,
  metric_key               text not null,
  definition_version_id    text not null references ledger.metric_definition_version (definition_version_id),
  attribution_rule_version text not null,
  suppression_rule_version text not null,
  period_type              text not null check (period_type in ('monthly','quarterly','rolling_12','fiscal_year')),
  period_label             text not null,           -- '2026-10', '2026-Q4', '2026-12-R12', 'FY2027:2026-10' (D-49)
  period_start             date not null,
  period_end               date not null,
  site                     text,                    -- per-site row for multi-site surgeons; null = system scope or no peer rule
  basis                    text not null check (basis in ('logged','adjudicated')),
  aggregation              text not null default 'period',   -- 'period' | 'year_average' (survey measures)
  numerator                numeric,
  denominator              integer,                 -- record count after exclusions; min-n compares to this; null only for mirror
  expected                 numeric,                 -- O/E only
  value                    numeric,                 -- null only when denominator = 0 or expected = 0
  interval_low             numeric,
  interval_high            numeric,
  interval_method          text,
  no_evidence_of_diff      boolean,                 -- F-24 AC 5, set once the peer median exists
  exclusions               jsonb not null default '{}',  -- {"super-long boarder": 3, "cancelled same day": 2, "excluded_at_J4.2": 1}
  extra                    jsonb not null default '{}',  -- pace fields (M&M attendance), mirror fields (wRVU)
  source_feed_load_id      bigint not null references ledger.feed_load,
  source_as_of             date not null,
  model_version            text,
  run_id                   bigint not null references ledger.run,
  restates_metric_value_id bigint references ledger.metric_value,
  is_current               boolean not null default true,
  computed_at              timestamptz not null default now()
);
create unique index metric_value_current_uq on ledger.metric_value
  (clinician_id, metric_key, period_label, coalesce(site, ''), basis, aggregation) where is_current;
create index on ledger.metric_value (clinician_id, metric_key, period_start, basis);

create table ledger.metric_value_record (
  metric_value_id  bigint not null references ledger.metric_value,
  record_id        bigint not null references ledger.record,
  record_type      text not null,
  excluded         boolean not null default false,  -- true = not in the denominator; the row is listed anyway with its reason
  exclusion_reason text,
  in_numerator     boolean,                         -- the definition's counted() result; null for count, median, oe, mirror, pace
  detail           jsonb not null default '{}',     -- row_detail output: test_applied, on_time, delay_label, rule_statement, ...
  primary key (metric_value_id, record_id),
  check (excluded = false or exclusion_reason is not null)
);

-- "current" = the row no later row restates. recompute and restate insert the new row, point it at the old one
-- through restates_metric_value_id and flip the old row's is_current; the view is the read path every surface uses.
create view ledger.metric_value_current as
  select * from ledger.metric_value where is_current;
```

The row-count invariant is a function the close and recompute commands call before writing the run's gate result and before any publish:

```sql
create function ledger.assert_row_counts(p_run_id bigint) returns void language plpgsql as $$
declare bad record;
begin
  for bad in
    select v.metric_value_id, v.denominator, count(r.record_id) filter (where not r.excluded) as rows
    from ledger.metric_value v left join ledger.metric_value_record r using (metric_value_id)
    where v.run_id = p_run_id and v.denominator is not null          -- mirror rows have no record list
    group by v.metric_value_id, v.denominator
    having count(r.record_id) filter (where not r.excluded) <> v.denominator
  loop
    raise exception 'metric_value % : counted rows % <> denominator %', bad.metric_value_id, bad.rows, bad.denominator;
  end loop;
end $$;
```

Record lists are written even when the number is suppressed (F-49 AC 3): the `metric_value` row exists with its denominator below `min_n`, the `suppression_decision` says why, and the list opens.

#### Suppression decisions and peer snapshots

```sql
create table ledger.suppression_decision (
  suppression_id           bigint generated always as identity primary key,
  clinician_id             bigint not null references ledger.clinician,   -- the viewer
  metric_key               text not null,
  period_label             text not null,
  period_start             date not null,
  site                     text,
  scope                    text not null check (scope in ('value','comparison')),
  kind                     text not null check (kind in (
                             'none','not_computed','not_in_release','pending_source','feed_missing','feed_held','not_computable',
                             'not_applicable','interim','min_n','spread_not_written','peer_under_five')),
  kind_rank                smallint not null,          -- fixed order, see below
  template_key             text,                       -- F-33 catalogue key, e.g. 'min-n', 'hidden-month'
  reason_text              text,                       -- null only when kind = 'none'
  counts                   jsonb not null default '{}', -- {"n":3,"min_n":4,"unit":"first cases"} or {"peers":7,"clearing":4,"needed":5}
  definition_version_id    text not null references ledger.metric_definition_version (definition_version_id),
  reason_catalogue_version text not null,
  rule_version             text not null,              -- suppression rule version
  caused_by_kind           text check (caused_by_kind in ('dispute','roster_change','feed_load','source_registry')),
  caused_by_ref            text,                       -- dispute_ref, roster_id, feed_load_id or registry_id
  run_id                   bigint not null references ledger.run,
  is_current               boolean not null default true,
  decided_at               timestamptz not null default now(),
  check (kind = 'none' or (reason_text is not null and length(trim(reason_text)) > 0)),  -- the 100%-reason gate (F-32 AC 6)
  check (reason_text is null or reason_text !~ '<[a-z_-]+>')                              -- no unfilled placeholder (F-33 AC 2)
);
create unique index suppression_current_uq on ledger.suppression_decision
  (clinician_id, metric_key, period_label, coalesce(site, ''), scope) where is_current;
```

The fixed order: `not_computed` (0, the division-and-site-only state, F-104), `not_in_release` (1), `pending_source` (2), `feed_missing`, `feed_held` and `not_computable` (3), `not_applicable` (4), `interim` (5, a quarterly or rolling metric between closes, F-45), `min_n` (6; the Bucket 5 per-month rule is this kind with the `hidden-month` template), `spread_not_written` (7, comparison only: month one, non-attendee, opt-out; D-17), `peer_under_five` (8, `scope = 'comparison'` only), `none` (9). Eligibility is tested before the peer count so that in month one every comparator line ends with the month-two note whatever the group size (F-90 AC 4). First match wins per `(cell, scope)`; `scope = 'value'` may be `none` while `scope = 'comparison'` is `peer_under_five`, which is the proposed default of F-32 AC 4 and OQ-11. Flipping the literal reading of GR3 is a one-line change in `suppress.py`, not a schema change. The exact template per kind is the table in the Metric engine section.

```sql
create table ledger.peer_group_snapshot (
  snapshot_id          bigint generated always as identity primary key,
  viewer_clinician_id  bigint not null references ledger.clinician,
  metric_key           text not null,
  period_label         text not null,
  period_start         date not null,
  site                 text,
  peer_scope           text not null,
  peer_by_subspecialty boolean not null,
  subspecialty         text,                    -- null when the comparator is not by subspecialty
  roster_as_of         date not null,
  peer_count           integer not null,        -- roster peers, viewer excluded, opt-outs removed; on the tile from month one (F-34 AC 2)
  peers_clearing_min_n integer not null,
  eligibility_state    text not null check (eligibility_state in ('eligible','month_one','not_attended','opted_out')),  -- F-35
  rendered             boolean not null,        -- peers_clearing_min_n >= 5 and eligible and the viewer's own value not min-n suppressed
  spread_values        numeric[],               -- sorted ascending, ids never stored here; null unless rendered (D-13)
  spread_intervals     numeric[][],             -- O/E and rate metrics at M6: [low, high] per value (F-24 AC 4)
  peer_median          numeric,
  viewer_value         numeric,
  viewer_position      integer,                 -- 1-based position among spread_values plus the viewer
  rule_version         text not null,
  run_id               bigint not null references ledger.run,
  is_current           boolean not null default true,
  rendered_at          timestamptz not null default now(),
  unique (viewer_clinician_id, metric_key, period_label, site, run_id)
);
-- This table is the render log (F-36 AC 2): one row per viewer x metric x period, written whether or not the spread renders.

create table restricted.peer_group_member (     -- audit only; never exported
  snapshot_id    bigint not null references ledger.peer_group_snapshot,
  clinician_id   bigint not null references ledger.clinician,
  value          numeric,
  clears_min_n   boolean not null,
  primary key (snapshot_id, clinician_id)
);
```

Every snapshot row is a render-log entry (F-36): `rendered` true or false with the peer count and the reason state, which is the evidence for Premise 5.

#### Disputes

```sql
create table ledger.dispute (
  dispute_id               bigint generated always as identity primary key,
  dispute_ref              text not null unique,      -- 'D-0014', the id surgeons and adjudicators see
  record_id                bigint not null references ledger.record,   -- never a metric, tile or period
  record_type              text not null,
  field                    text not null,
  filed_by_clinician_id    bigint not null references ledger.clinician,
  filed_at                 timestamptz not null,      -- reply date in the email months, not entry date
  channel                  text not null check (channel in ('email','web','sheet_import')),
  entered_by               text,                      -- analyst identity for email; null for web
  entered_at               timestamptz,
  reply_id                 bigint references ledger.reply_log,   -- the surgeon's reply (email months); F-111 AC 4
  claim_text               text,                      -- null for survey_response
  claim_structured         jsonb,                     -- survey: {"reason": "visit done by another clinician",
                                                      --          "believed_clinician_id": 42}
  claimed_clinician_id     bigint references ledger.clinician,
  version_label            text not null,             -- from the number's stamp at filing (F-55 AC 4)
  metric_keys_affected     text[] not null,
  routed_to                text not null check (routed_to in ('chief','chair','direct_leader')),
  routing_test_fired       text check (routing_test_fired in
                             ('none','a_disputant_is_chief','b_recredit_to_chief','c_chief_on_record','route_undefined')),
  adjudicator_clinician_id bigint references ledger.clinician,
  state                    text not null,             -- denormalised from dispute_event by trigger
  decision                 text check (decision in ('sustained','not_sustained','definition_question')),
                                                      -- withdrawal is a state (dispute_event.to_state), never a decision; decision stays null
  outcome                  text check (outcome in ('annotated','source_corrected')),
  decision_note            text,
  decided_by_clinician_id  bigint references ledger.clinician,
  decided_at               timestamptz,
  decision_reply_id        bigint references ledger.reply_log,   -- the adjudicator's reply, kept unaltered in the mailbox
  refile_of_dispute_id     bigint references ledger.dispute,
  linked_dispute_id        bigint references ledger.dispute,
  check (decision <> 'sustained' or outcome is not null),
  check (claim_text is null or record_type <> 'survey_response'),
  -- quality-record disputes keep their free text in privileged.quality_note (D-22; OQ-62), never here
  check (record_type <> 'qi_event' or (claim_text is null and decision_note is null)),
  check (decision is null or record_type = 'qi_event' or length(trim(decision_note)) > 0)
);

create table ledger.dispute_event (
  event_id     bigint generated always as identity primary key,
  dispute_id   bigint not null references ledger.dispute,
  from_state   text,
  to_state     text not null check (to_state in (
                 'filed','with_chief','with_chair','with_direct_leader',
                 'sustained_annotated','sustained_source_corrected','not_sustained',
                 'definition_question','withdrawn','correction_requested','correction_confirmed')),
  actor        text not null,
  actor_role   text not null,
  at           timestamptz not null default now(),
  note         text
);
create trigger dispute_event_immutable before update or delete on ledger.dispute_event
  for each row execute function ledger.refuse_change();

create table ledger.reply_log (             -- every inbound message to the dispute mailbox, surgeon or adjudicator
  reply_id        bigint generated always as identity primary key,
  reply_ref       text not null unique,     -- 'R-0031'
  clinician_id    bigint references ledger.clinician,   -- the sender when they are on the roster
  sender_kind     text not null check (sender_kind in ('surgeon','adjudicator','other')),
  period_label    text,
  received_at     timestamptz not null,     -- the mailbox's received date; dispute.filed_at copies it
  message_id      text not null unique,
  classification  text not null check (classification in
                    ('dispute','question','seen','awaiting_row','decision','withdrawal','ndr')),
  entered_at      timestamptz,              -- when the analyst logged it (F-57 AC 1 measures from received_at)
  dispute_id      bigint references ledger.dispute,
  answered_at     timestamptz
);
```

The state machine and the legality of each transition live in `scorecard/disputes/state.py` and are tested there; `ledger.dispute.state` is maintained by an AFTER INSERT trigger on `dispute_event` so the row and the history cannot disagree. A re-file is a new dispute with `refile_of_dispute_id`; a third filing on the same record by the same surgeon is refused in the service function (F-62 AC 2). `routed_to = 'direct_leader'` is in the enum so M4 needs no schema change if OQ-43 lands that way; the M4 default routing per F-58 and F-72 AC 4 is chief (Builder decision 5).

#### Run, reconciliation, delivery, audit

```sql
create table ledger.run (
  run_id            bigint generated always as identity primary key,
  kind              text not null check (kind in (
                      'migrate','load','register','attribute','close','reconcile','recompute','restate','publish',
                      'dispute','roster','setting','source_register','retention','grants_check','status','pub')),
  period_start      date,
  git_sha           text not null,
  definitions_active jsonb not null default '{}',   -- {"fcot": "v1", ...}
  catalogue_version text,
  run_by            text not null,
  started_at        timestamptz not null default now(),
  finished_at       timestamptz,
  status            text not null check (status in ('running','ok','failed','dry_run')),
  gate_results      jsonb not null default '{}',   -- {"field_presence":..,"exceptions":..,"row_count":..,
                                                   --  "reconciliation":..,"suppression":..,"feed_health":..,
                                                   --  "payload_scan":..,"grants":..}
  spread_eligibility jsonb,                        -- per clinician for the period (F-35 AC 5, F-95 AC 2)
  checklist         jsonb,                         -- F-112 printed checklist, stored
  published_at      timestamptz,                   -- the ONLY source of "last refreshed" (F-83)
  restates_run_id   bigint references ledger.run,
  log_path          text
);

create table ledger.reconciliation_result (
  run_id            bigint not null references ledger.run,
  clinician_id      bigint not null references ledger.clinician,
  metric_key        text not null,
  period_label      text not null,
  basis             text not null check (basis in ('logged','adjudicated')),
  ours_numerator    numeric, ours_denominator numeric, ours_value numeric,
  periop_numerator  numeric, periop_denominator numeric, periop_value numeric,
  delta             numeric,
  status            text not null check (status in ('match','explained','unexplained','not_reconciled')),
  explained_by_kind text check (explained_by_kind in ('definition_delta','sustained_recredit')),
  delta_id          bigint references ledger.definition_delta,
  dispute_ids       bigint[] not null default '{}',
  primary key (run_id, clinician_id, metric_key, period_label, basis)
);

create table ledger.delivery (
  delivery_id      bigint generated always as identity primary key,
  run_id           bigint not null references ledger.run,
  clinician_id     bigint references ledger.clinician,      -- null for the feed-owner override list
  channel          text not null check (channel in (
                     'scorecard_email','decision_email','dispute_filed_email','recredit_email',
                     'override_list','ack_email','deadline_email','preview')),
  recipient_kind   text not null,          -- 'surgeon','chief','chair','analyst','feed_owner'
  recipient_resolved_from text not null,   -- 'directory' (F-90 AC 8) or 'department_setting'
  self_only        boolean,
  spread_included  boolean,
  attachment_included boolean,             -- false under publish --numbers-only (D-31)
  statement_version text,                  -- the "what this is not" statement version carried (F-42)
  artifact_sha256  text not null,
  artifact_path    text,                   -- on the encrypted local disk (workstation at M1, VM at M2); Builder decision 8, D-23
  payload_scan     jsonb not null,         -- F-106 AC 7 result
  gate_checked     text not null,          -- the department_setting gate key that allowed the send
  sent_at          timestamptz,
  message_id       text,
  bounce_at        timestamptz,
  bounce_reason    text,
  incident_ref     text                    -- F-90 AC 10
);

create table ledger.audit_log (
  audit_id     bigint generated always as identity primary key,
  at           timestamptz not null default now(),
  actor        text not null,              -- db role, service account, or identity.sso_subject
  actor_role   text not null,              -- 'loader','engine','publisher','analyst','surgeon','chief',
                                           -- 'chair','direct_leader','svc_survey','other'
  action       text not null,              -- 'insert','update','view','refused','send','decide',...
  object_type  text not null,              -- table name or page name
  object_id    text,
  subject_clinician_id bigint,             -- whose data (F-107)
  outcome      text,                       -- 'allowed','refused','no_roster','no_period','error'
  details      jsonb not null default '{}' -- ids only; never names, comment text, scores, notes, claims
);
create trigger audit_log_immutable before update or delete on ledger.audit_log
  for each row execute function ledger.refuse_change();
-- plus: revoke update, delete on ledger.audit_log from public, loader, engine, publisher, app, analyst_ro;
```

Row-level triggers on `dispute`, `dispute_event`, `record_override`, `correction_request`, `metric_definition_version`, `definition_param`, `reason_set_version`, `roster_membership`, `leave_period`, `department_setting`, `feed_load`, `run`, `attribution_exception`, `identity`, `restricted.private_note` write one `audit_log` row per change. The app writes `action = 'view'` rows for every record list, inbox, dispute record and queue open, and `'refused'` rows for every refusal (F-107 AC 1). `scorecard audit --clinician X --period P` is a report over this table.

#### Private notes

```sql
create table restricted.private_note (
  note_id             bigint generated always as identity primary key,
  response_source_key text not null,          -- the comment it hangs on
  author_clinician_id bigint not null references ledger.clinician,
  text                text not null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz,
  deleted_at          timestamptz
);
```

Readable and writable only by the author through the app (F-71 AC 2, AC 3; OQ-42). Postgres RLS on this table with `author_clinician_id = current_setting('scorecard.clinician_id')::bigint` is defense in depth behind the app's authorization matrix.

### Invariants and how each is enforced

| # | Invariant | Where it is enforced | Mechanism | Test |
|---|---|---|---|---|
| I1 | Exactly one current clinician per record (GR1, F-01 AC 1) | `ledger.attribution` | Partial unique index `attribution_one_current` on `(record_id) where valid_to is null`; `CHECK (clinician_id is not null or exception_type is not null)` | pytest inserts two open rows and expects a unique violation; F-01 AC 3 idempotence test |
| I2 | Non-excluded rows equal the denominator (F-51 AC 2, J4.4) | `ledger.metric_value` + `metric_value_record` | `ledger.assert_row_counts(run_id)` called by `close`, `recompute`, `restate` before the run's gate result is written; `publish` refuses a run whose `gate_results.row_count` is not `pass` | pytest with a fixture that drops one link row and expects the run to fail |
| I3 | `audit_log`, `dispute_event`, `metric_definition_version`, `definition_param` are append-only | those tables | `ledger.refuse_change()` trigger on UPDATE and DELETE; no UPDATE or DELETE grant to any runtime role; the `migrate` owner credential that could drop the trigger is not used at runtime and at M2 is not held by the analyst. This holds against runtime roles only: at M1 the analyst installs PostgreSQL on their own workstation and is its superuser, and a DBA is one at M2. The control that holds against them is the hash-chained off-host copy of `audit_log` written by `scorecard audit export` (the Dispute workflow section, audit log design, point 4); `doctor` fails when the runtime login is a superuser or a table owner | pytest attempts an update as `app` and as `engine` and expects an exception; `test_audit_export_chain.py` breaks one link and expects the recertification check to fail |
| I4 | No blank cell: every (clinician, metric, period, site) that any surface could render has a current `metric_value` or a `suppression_decision` with non-empty reason text (F-32 AC 6, GR3) | `close`, `recompute`, `publish` | `ledger.assert_no_blank_cells(run_id)` cross-joins `roster_as_of(period_end)` with active definitions and checks each cell has a value or a decision with `kind <> 'none'` for `scope = 'value'`, and a decision row for `scope = 'comparison'`; `CHECK` constraints refuse empty text and unfilled placeholders | fixture with a removed decision row fails the gate |
| I5 | Definitions are immutable by hash (F-13 AC 2) | `scorecard register` + trigger | Registry refuses `(metric_key, version_label)` with a different `code_hash`; trigger refuses UPDATE; `git_sha` stored | pytest edits a fixture module in a temp dir and expects `register` to exit non-zero |
| I6 | Source rows are never edited (F-05 AC 1) | `raw.*`, `src.*` | `loader` has INSERT only; no role has UPDATE; DELETE belongs to the `retention` stage role alone, inside `retention run` under a set class period; corrections arrive as a new `feed_load` that supersedes; `feed_load.sha256` unique per feed | pytest compares `sha256` of the staged file before and after a decision |
| I7 | An override is never deleted; it retires (F-05 AC 3, F-06 AC 2) | `ledger.record_override` | No DELETE grant; `retired_at` and `retired_by_feed_load_id` set by the loader's convergence check | pytest reloads a corrected fixture and expects `retired_at` set, row present |
| I8 | Restatements chain, never overwrite (F-96 AC 3) | `ledger.metric_value`, `ledger.restatement` | No UPDATE grant on `metric_value` beyond the `is_current` flag held by `engine`; a restatement inserts a new row with `restates_metric_value_id` and one `ledger.restatement` row with a `reason_category`; `restate` refuses without a reason | pytest runs `restate` without `--reason` and expects refusal |
| I9 | Peer identities never reach surgeon-facing tables (GR4, F-36 AC 1) | `restricted.peer_group_member` | Member ids only in `restricted`; `peer_group_snapshot.spread_values` is a bare numeric array; `analyst_ro` and `bi_ro` have no grant on `restricted`; the pub contract test scans for id columns | pytest inspects the published artifact for any `clinician_id` other than the viewer's |
| I10 | Roster windows do not overlap per (clinician, site); leave windows do not overlap per clinician (F-99 AC 3) | `roster_membership`, `leave_period` | `EXCLUDE USING gist` constraints on `daterange` | pytest inserts an overlapping row and expects an exclusion violation |
| I11 | One current attribution per record survives reloads (F-01 AC 3) | loader | Reload closes then reopens inside one transaction; `attribute()` is a pure function of `(src rows, roster_as_of, rule_version)` | pytest runs attribution twice on the same fixture and diffs the credits |
| I12 | A dispute is pinned to one record, never a number (F-55 AC 2) | `ledger.dispute` | `record_id not null` with a foreign key; no column for metric or period | schema test |
| I13 | Every surgeon-facing artifact carries only that surgeon's records (F-106 AC 5) | `publish` | The email and the app's list queries are keyed by `attribution.clinician_id` under the requested basis; the payload scan compares the artifact's `record_ref`s with the ledger | pytest scans a rendered fixture email |
| I14 | Grants match the migration on every run (security judge item 2) | `scorecard grants check` | Compares `information_schema.role_table_grants` and column grants with `roles.sql`; a difference fails the run and is written to `run.gate_results.grants` | pytest against a scratch database |

### Attribution rules per record type

Each rule is a pure function in `scorecard/attribution/rules/<record_type>.py` with a `RULE_ID` and `RULE_VERSION` constant, a docstring quoting the brief's sentence, and a pytest module with one fixture per branch. The rule writes one `attribution` row and the `record_participant` rows for everyone named on the record; exceptions go to `attribution_exception` and block publish until resolved (F-02 AC 4).

```
scorecard/attribution/
  __init__.py          attribute(period, run_id): iterate record types with a live feed, apply the rule
  rules/
    case.py            ATTR-CASE-PRIMARY   v1
    admission.py       ATTR-ADM-INDEX      v1   (M6)
    visit.py           ATTR-VISIT-RENDER   v1   (M7)
    survey.py          ATTR-SURVEY-NAMED   v1   (M4)
    attendance.py      ATTR-ATTEND-SCAN    v1   (M5)
    block.py           ATTR-BLOCK-HOLDER   v1   (M3)
    referral.py        ATTR-REFERRAL-VISIT v1   (M7)
    icu_stay.py        ATTR-ICU-INDEX      v1   (M7)
    qi_event.py        ATTR-QI-INDEX       v1   (M6)
    sample.py          ATTR-SAMPLE-CLINICIAN v1 (M7)
  exceptions.py        list / resolve / block-publish
  cosurgeon.py         rate per subspecialty vs 5% (F-03)
```

| Rule id | Record type | Credited clinician (brief) | Tie-break | `shared_flag` | Exceptions | Participants recorded |
|---|---|---|---|---|---|---|
| `ATTR-CASE-PRIMARY` | `case` | "the primary surgeon in the OR log" | More than one `case_panel` row with `panel_role = 'primary'`: credit the one with the lowest `listed_order`; `tie_break_applied = 'first_listed_primary'` (design doc Premise 2) | true when more than one primary; visible on every row the case appears in (F-01 AC 4) | `blank_primary` (no primary row); `ambiguous_primary` (two primaries with the same `listed_order`, or no order in the extract); `outside_department` (primary not on `roster_as_of(date_of_surgery)`) | every panel row with its role and order; the chief-participant routing test (c) reads these |
| `ATTR-ADM-INDEX` | `admission` | "the surgeon who did the index operation, even if a different attending discharged the patient" | The index operation is chosen by the written index-operation rule in `definition_param` for the Vizient four (OQ-31); the admission is credited to the current `attribution.clinician_id` of that case record | inherits the index case's flag | `no_index_operation` (listed, never credited to the discharging attending, never dropped; F-08 AC 1) | `index_surgeon`, `discharging_attending` |
| `ATTR-VISIT-RENDER` | `visit` | "the rendering provider" | none: one field, named in `source_registry.attribution_rule_text` (OQ-39) | false | `unmapped_provider` (blank or not on the roster) | `rendering_provider` |
| `ATTR-SURVEY-NAMED` | `survey_response` | "the provider named on the survey" | none | false | `unmapped_provider`; a response whose provider is outside the department is listed and never dropped (F-11 AC 3) | `provider_named` |
| `ATTR-ATTEND-SCAN` | `attendance` | the scanned person; the record is the (session, roster member) pair so an absence is a record the surgeon can dispute (F-74 AC 2, F-76) | none | false | none (the loader materialises the pair for every member on faculty that day; `removed_by_leave` is set from `leave_period`) | `scanned_person` |
| `ATTR-BLOCK-HOLDER` | `block_allocation` | "the surgeon holding the block" (J4.13) | none | false | `unmapped_provider` | holder |
| `ATTR-REFERRAL-VISIT` | `referral` | "referral received date to the resulting visit's rendering provider" (J4.13) | credited to the rendering provider of `resulting_visit_source_key`'s visit record | false | `unmapped_provider` when no resulting visit; `received_at` null is an exclusion on the metric, not an attribution exception | `rendering_provider` |
| `ATTR-ICU-INDEX` | `icu_stay` | "ICU step-down and return event to the admission's index-operation surgeon" (J4.13) | inherits from `ATTR-ADM-INDEX` on `admission_record_id` | inherits | `no_index_operation` | `index_surgeon`, `discharging_attending` |
| `ATTR-QI-INDEX` | `qi_event` | the primary surgeon of the index case, not the surgeon who did the reoperation (F-09 AC 2) | inherits from the index case's attribution | inherits | `no_index_case` (listed, excluded from rates with the count stored, never dropped; F-09 AC 3) | index case's participants |
| `ATTR-SAMPLE-CLINICIAN` | `third_next_sample` | the clinician the sample was taken for (the sample row names one clinician; no brief rule needed) | none | false | `unmapped_provider` | the clinician |

Not attributed: `wrvu_month` (mirror only, no ledger record, corrections to the professional billing office; F-77). `third_next_sample` rows are records with the trivial rule `ATTR-SAMPLE-CLINICIAN` so that `metric_value_record` can link each sample to the number (the sample list is the record list, F-25).

Adjudicated crediting is not a second rule. `basis = 'adjudicated'` reads `attribution.clinician_id` unless an active `record_override` with `field = 'credited_clinician'` exists for the record, in which case `new_clinician_id` is used. Re-credit requires exactly one receiving clinician on `roster_as_of(period_end)` (F-07 AC 1) and is checked in `scorecard/disputes/decide.py`, not by the database.

Co-surgeon rate (F-03): `scorecard attribute --period P` prints, per subspecialty on the roster, `count(shared_flag) / count(*)` for cases in the period and writes it to `run.gate_results.cosurgeon_rate`; a subspecialty above 5% is flagged `premise_2_exceeded` and the run continues, since the response is an owner decision (OQ-06), not a code path.

What the extract must carry for the tie-break to exist: `case_panel` rows with a role and an order. If the periop extract arrives with one primary-surgeon column per case, `field_checklist.panel_roles = false`, `shared_flag` is always false, and the staging summary says so (staff judge, errors_found, last item; F-95 AC 4).

### Roster and peer-group membership rules

The roster is one SCD2 table read "as of" a date. Every rule below is a query over `roster_as_of(d)` plus `leave_period`, `department_setting` and the definition version's `peer_scope` and `peer_by_subspecialty`.

| Fact | Column | Used by | Rule |
|---|---|---|---|
| Site | `roster_membership.site` | peer groups, per-site metric rows | A surgeon with two open rows at two sites gets one `metric_value` and one `peer_group_snapshot` per site (F-31 AC 3, F-99 AC 4). A pooled row is off unless `department_setting.pooled_site_row = 'true'` (OQ-08). |
| Subspecialty | `roster_membership.subspecialty` | peer groups where the brief says "subspecialty peers" | Read from the definition version's `peer_by_subspecialty`. F-31 AC 1 lists which metrics. |
| Division chief | `roster_membership.chief_clinician_id` | dispute routing (F-58) | Read as of `dispute.filed_at`; a chief change dated D re-routes disputes filed on or after D (F-87 AC 3). |
| Direct leader | `roster_membership.direct_leader_clinician_id` | inbox viewer check (F-88), survey routing alternative (OQ-43) | Read as of the access date. Distinct field from chief; may hold the same person (F-87 AC 1). A surgeon with no leader has a surgeon-only inbox and appears on the run's mapping warning (F-87 AC 2). |
| Chair | `department_setting.chair_clinician_id` | routing test escalation target | Recorded once (F-87 AC 5). A dispute filed by the chair on their own record gets `routing_test_fired = 'route_undefined'` and is held (OQ-15). |
| Faculty dates | `faculty_from`, `faculty_to` | M&M denominator; artifact generation | Sessions are "held while you were on faculty" only inside the window. A row with `faculty_to` in the past stops every send and refuses hosted access from that date (F-113 AC 5). |
| Leave | `leave_period` | M&M denominator and scaled target (F-75) | A session inside an approved leave window sets `attendance_scan.removed_by_leave = true` and is out of the denominator; `T' = ceil(8 * (12 - k) / 12)` under the flagged assumption. The scaled target is never computed while leave rows exist that the load has not applied (F-75 AC 4). |
| Allocated block | `has_block` | Block utilization `not_applicable` state (F-18) | false gives `kind = 'not_applicable'`, reason "Not applicable: no allocated block this month". |
| Step-zero attendance | `step_zero_attended_on` | spread eligibility (F-35) | null: no spread written for this viewer; the viewer stays in colleagues' denominators (OQ-10). |
| Opt-out | `opt_out_on` | spread eligibility and peer membership (F-35, Premise 11) | non-null as of the publish date: self-only artifact, and excluded from every other viewer's peer group. |
| Definition versions presented | `definition_versions_presented` | definition page | What the surgeon heard at step zero (F-99 AC 2). |

Peer group construction, in `scorecard/engine/peers.py`, per (viewer, metric, period, site):

```
members   = roster_as_of(period_end)
            where site = viewer.site                              (peer_scope = 'site')
               or true                                           (peer_scope = 'system')
            and subspecialty = viewer.subspecialty               (if peer_by_subspecialty)
            and clinician_id <> viewer.clinician_id              (viewer never counted)
            and opt_out_on is null                               (Premise 11)
            -- non-attendees are kept: they count in others' groups (F-31 AC 2)
clearing  = members whose own metric_value_current for the period (adjudicated row where one
            exists, else logged; D-12) has denominator >= min_n  (metrics with min_n = null: all members)
renders   = count(clearing) >= 5 and viewer_eligible
            and the viewer's own value is not min-n suppressed
viewer_eligible = period <> month_one
              and viewer.step_zero_attended_on is not null
              and viewer.opt_out_on is null                      (as of the publish date, F-35 AC 2)
```

The month-one period is `department_setting.month_one_period`. The snapshot stores `peer_count`, `peers_clearing_min_n`, `eligibility_state`, `rendered` and the sorted values; member ids go to `restricted.peer_group_member`. When `rendered` is false the suppression engine writes, on `scope = 'comparison'`, `kind = 'spread_not_written'` when the viewer is not eligible (rank 7) and otherwise `kind = 'peer_under_five'` with counts `{peers_clearing, needed: 5}` (rank 8); the reason text comes from the catalogue template and, after a roster change, the as-of variant with the change date (F-33 AC 4, F-39 AC 2).

The chief's pre-step-zero summary (F-37) is `scorecard peers --summary --period P`: the same function over the roster alone, printing each group under five per subspecialty with counts only.

Roster maintenance is `scorecard roster load <csv> --ticket T` (SCD2 insert with the old row closed) and `scorecard roster set --clinician K --attended 2026-10-14 | --opt-out 2026-10-14 | --chief C | --leader L --effective D`. Every change is a new dated row (F-99 AC 3) and an `audit_log` entry, and the next `close` or an explicit `scorecard recompute --roster-change <roster_id>` recomputes peer groups from the change date (F-39).

### Roles and grants

One migration, `scorecard/ledger/roles.sql`, re-applied and re-checked by `scorecard grants check` on every run (I14).

Every write named anywhere in this document has a grant in this table; `scorecard grants check` (G17) fails the run on any difference between the live grants and `roles.sql`, so a write with no grant is a design error, not a runtime surprise. Every role has INSERT on `ledger.audit_log` and on `ledger.run`, and UPDATE on its own `run` row (`run_by = current_user` in the policy), which the table does not repeat per row. "Own `run` row" means `finished_at`, `status`, `gate_results`, `checklist`, `spread_eligibility`, `log_path`.

| Role | raw | src | ledger | restricted | privileged | pub | Notes |
|---|---|---|---|---|---|---|---|
| `loader` | INSERT, except `raw.survey` | INSERT, except `src.survey_response` | INSERT `feed_load`, `record`, `roster_membership`, `leave_period`, `department_setting` (non-gate rows through `roster set` and `setting set`), `dispute_event` (`correction_confirmed` only, through `convergence.py`); UPDATE `feed_load.status`, `record.current_src_row_id`, `roster_membership.valid` and `department_setting.valid` (closing the prior row), `record_override.source_confirmed_at`, `retired_at`, `retired_by_feed_load_id`, `correction_request.confirmed_by_feed_load_id` | none | INSERT `qi_event` (M6) | none | The analyst's CLI `SET ROLE loader` for every feed except survey. |
| `svc_survey` | INSERT `raw.survey` | INSERT `src.survey_response` | INSERT `feed_load`, `record`, `attribution`, `record_participant`; UPDATE `feed_load.status` | INSERT `survey_comment`, `comment_quarantine`; UPDATE `comment_quarantine.released_at` (`survey release`) | none | none | A service account on a path unit (security judge item 2); the analyst never holds this role. |
| `engine` | SELECT, except `raw.survey` | SELECT | INSERT `attribution`, `record_participant`, `attribution_exception`, `metric_value`, `metric_value_record`, `suppression_decision`, `peer_group_snapshot`, `comparison_target`, `reconciliation_result`, `restatement`, `metric_definition_version`, `definition_param`, `definition_delta`, `reason_set_version`, `source_registry`, `feed_owner`; UPDATE `attribution.valid_to`, `attribution_exception` resolution columns (`exceptions resolve`), `is_current` on `metric_value`, `suppression_decision`, `peer_group_snapshot` and `comparison_target` (restatements flip the old row), `source_registry.valid_to`, `feed_owner.valid`, `definition_open_item.closed_by_definition_version_id` (`register`) | INSERT/SELECT `peer_group_member` | SELECT `qi_event` under the quality gate | none | No grant on `survey_comment` or `private_note`: a metric cannot read them (F-11 AC 5). `register`, `delta add`, `source register` and `exceptions resolve` run as `engine`. |
| `publisher` | none | SELECT, except `src.survey_response` (the CSV rows read `src.case`) | SELECT; INSERT `delivery`, `dispute_event` (`correction_requested` only), `department_setting` (`inbox_first_available.<clinician_id>` rows only, through `publish/delivery.py`); UPDATE `run.published_at` (the only writer), `delivery.sent_at`, `message_id`, `bounce_at`, `bounce_reason`, `incident_ref`, `correction_request.first_sent_at`, `last_sent_at`, `sent_in_run_ids`, `record_override.correction_requested_at` | none | none | INSERT, TRUNCATE (optional) | `publish`, `overrides --send`, `status --send`, `notify`, `reply ingest-ndr`, `delivery incident` run as `publisher`; a command that files and sends (`dispute file --send`) switches from `disputes` to `publisher` between its write stage and its send stage. |
| `disputes` | none | SELECT, except `src.survey_response` until M4 | SELECT; INSERT `dispute`, `dispute_event`, `record_override`, `correction_request`, `reply_log`, `definition_open_item`; UPDATE `dispute.decision`, `outcome`, `decision_note`, `decided_by_clinician_id`, `decided_at`, `decision_reply_id`, `linked_dispute_id` (`decide()`, `link`), `reply_log.dispute_id`, `entered_at`, `answered_at` (`file`, `reply answer`) | none | INSERT `quality_note` under the quality gate (M6) | none | The stage role every `scorecard/disputes/*` service function runs under. At M1 the analyst's `scorecard_cli` login assumes it with `SET ROLE disputes` for `scorecard dispute file|decide|withdraw|link` and `scorecard reply log|answer`; at M2 `app` is a member of it and the web views call the same functions. `dispute.state` is written by the trigger, not by the role. |
| `app` | none | SELECT, `src.survey_response` under RLS | SELECT under RLS; the `disputes` grants by membership; INSERT/UPDATE `private_note` through the note views | SELECT `survey_comment.comment_text` (column grant, RLS); INSERT/SELECT/UPDATE `private_note` (RLS on `author_clinician_id`); no grant on `peer_group_member` | SELECT under the quality gate | none | Sets `scorecard.clinician_id` and `scorecard.role` per request. RLS policies (M2) on the RLS set, keyed on those variables, are defense in depth behind the authorization matrix. The RLS set: `ledger.metric_value`, `metric_value_record`, `suppression_decision`, `peer_group_snapshot`, `comparison_target`, `record`, `attribution`, `dispute`, `src.survey_response`, `restricted.survey_comment`, `restricted.private_note`; a policy admits the viewer as subject, the adjudicator of record on a dispute, the receiving clinician after a sustained re-credit, and, on `survey_comment` and `survey_response`, the direct leader of record as of today once `department_setting.inbox_first_available.<clinician_id>` plus 30 days has passed. For the synchronous recompute (D-26) the app opens a second, call-scoped connection as `engine`; page reads never use it. |
| `retention` | DELETE | DELETE | DELETE on every `ledger` store that has a `retention_class` row; INSERT `disposition_log` | DELETE | DELETE | none | Assumed by `scorecard retention run` only (`SET ROLE retention`); the only role with DELETE anywhere. It never runs from a timer (OQ-57). |
| `analyst_ro` | SELECT, except `raw.survey`, `raw.vizient`, `raw.qi` (encounter-level and comment-bearing extracts) | SELECT | SELECT | none | none | none | For `psql` inspection; cannot see comment text, notes, peer member ids or quality notes. Every SELECT is audited by pgaudit (the Ingestion and operations section, Roles at run time). |
| `bi_ro` | none | none | none | none | none | SELECT | Only if pub is built. |
| `migrate` | owner | owner | owner | owner | owner | owner | Used only by `scorecard migrate` from the runbook; not a runtime role. At M2 its credential is held outside the analyst's environment file (the Ingestion and operations section, Secrets). |

`audit_log` is INSERT-only for every role, including `migrate` at runtime, with the trigger blocking UPDATE and DELETE. That holds against every runtime role and not against a table owner or superuser; the independent control is the hash-chained off-host copy (the Dispute workflow section, audit log design, point 4).

### Retention and disposition

The brief and the design doc state no retention period, so every store starts as "unset" and nothing is disposed while a period is unset (F-113 AC 2, OQ-57). This is a table, not a comment.

```sql
create table ledger.retention_class (
  store            text not null,     -- 'landing_files','raw','src','ledger.attribution','ledger.record_override',
                                      -- 'ledger.dispute','reply_mailbox','ledger.delivery','artifact_files',
                                      -- 'ledger.run','ledger.metric_value','ledger.audit_log',
                                      -- 'restricted.survey_comment','restricted.private_note',
                                      -- 'restricted.peer_group_member','pg_dump'
  class            text not null,     -- 'source_extract','ledger','audit','communication','comment','note','backup'
  period_months    integer,           -- null = unset: to be set by data governance (OQ-57)
  set_by           text,
  set_on           date,
  reference        text,
  version_label    text not null,
  effective_from   date not null,
  effective_to     date,
  primary key (store, version_label)
);

create table ledger.disposition_log (
  disposition_id  bigint generated always as identity primary key,
  run_id          bigint not null references ledger.run,
  store           text not null,
  class_version   text not null,
  key_range       text not null,      -- e.g. 'feed_load_id 1..12' ; never record content
  removed_count   integer not null,
  held_count      integer not null,   -- referenced by a retained period, an open dispute or an unconfirmed override
  actor           text not null,
  at              timestamptz not null default now()
);
```

`scorecard retention run [--dry-run]` refuses any store without a class row, removes nothing whose class period is null, never removes a row referenced by a `run` still inside its own retention, by an open `dispute`, or by a `record_override` with `source_confirmed_at` null (F-113 AC 4), and writes one `disposition_log` row per store. Departed surgeons: `roster_membership.faculty_to` ends artifact generation and hosted access from that date; their `attribution`, `metric_value` and `peer_group_member` rows stay so past periods recompute identically (F-113 AC 5, AC 6); their inbox, comments and notes wait on OQ-57. The deployment check lists any table in the six schemas with no `retention_class` row (F-113 AC 1).

Backups: nightly `pg_dump` of the whole database to MGB-approved encrypted storage under the `pg_dump` retention class, with one restore drill recorded in `department_setting` before M1 is called done. A dump includes `restricted`; the security judge's point that a "notes excluded from backup" claim is false under a whole-database dump is accepted. The dump's access list at M2 is the VM's; at M1 the dump is copied off the workstation to an MGB-approved location that information security names (OQ-61) with an access list of exactly the analyst and the backup analyst, because a dump that sits on the same disk as the live database and the landing files is lost with them. Two classes carry an interim period so that copies do not accumulate while every other class waits on data governance: `pg_dump` and `artifact_files` have `period_months = 2` under `reference = 'interim pending OQ-57'` (D-41), so the quarterly `retention run` removes dumps older than two months once their `backup.<date>` checksum exists and rendered artifacts older than two months once their `delivery` rows exist, keeping the hash on `delivery`.

### Module layout and CLI surface for this subsystem

```
scorecard/
  cli.py                       one entry point: `scorecard <command>`
  ledger/
    migrations/0001_schemas.sql ... NNNN_<name>.sql      plain SQL, numbered; one directory for every section's tables
    roles.sql                  roles and grants; re-applied by `grants check`
    db.py                      psycopg connection, session variables, run row helpers
    invariants.py              assert_row_counts, assert_no_blank_cells wrappers
  loaders/
    <feed_key>.py              column map, required_fields per metric, verbatim -> raw -> src, record upsert
    convergence.py             open correction_request vs re-ingested field; retire overrides
  attribution/                 (see above)
  definitions/<metric>/vN.py   one file per version; sha256 of the file is code_hash (Metric engine section)
  roster.py                    load, set, roster_as_of helpers, mapping warnings
  engine/                      registry.py (`scorecard register`: hash, refuse changed hash, write definition_param),
                               peers.py suppress.py close.py recompute.py reconcile.py ... (Metric engine section)
  disputes/ state.py route.py file.py decide.py   (service functions; CLI at M1, web at M2; Dispute workflow section)
  publish/                     (Delivery surfaces section)
  web/                         M2 (Delivery surfaces section)
  retention.py
  audit.py                     `scorecard audit --clinician --period`
```

Commands that touch the tables in this section:

```
scorecard migrate                                   apply migrations; then roles.sql
scorecard grants check                              compare live grants with roles.sql; fail on drift
scorecard load <feed_key> <file> --ticket T --as-of YYYY-MM-DD [--model-version V]
scorecard roster load <csv> --ticket T
scorecard roster set --clinician K (--attended D | --opt-out D | --chief C | --leader L | --site S ...) --effective D
scorecard setting set <key> <value> [--signed-by X --signed-on D --reference R] --effective D
scorecard setting confirm gate.<name> --by <identity>   second identity; a gate opens nothing until confirmed
scorecard register [--check]                        hash and register definitions; refuse a changed hash
scorecard attribute --period YYYY-MM                attribution, participants, exceptions, co-surgeon rate
scorecard exceptions list --period P | resolve <exception_id> (--assign K | --exclude) --reason "..."
scorecard close --period YYYY-MM [--dry-run]        attribute, compute both bases where needed, suppress,
                                                    peers, reconcile, feed health, invariants, run row
                                                    (the full flag set is in the Ingestion and operations section)
scorecard recompute --dispute <id> | --roster-change <roster_id> | --version <metric> <label>
scorecard restate --metric M --period P --to-version V --reason <category> --note "..."
scorecard dispute file|route|decide|link|withdraw   (see the Dispute workflow section for flags)
scorecard overrides --month YYYY-MM                 the per-feed-owner list from correction_request
scorecard audit --clinician K --period P            who touched or viewed what, ids only
scorecard retention run [--dry-run]
scorecard status                                    feed health, last refreshed per source, disputes > 14 d, grants
```

### Builder decisions

Where the two judges differ or the brief and the catalogue are silent, the option set and a recommendation are recorded here rather than chosen silently.

**Builder decision 1 (D-07): definition file layout.**
Options: (a) one Python file per metric version, `definitions/<metric>/v1.py`, `v2.py`, hash of the file is the version id (staff judge, minimal batch); (b) one module per metric holding all versions side by side as dataclasses, hashed on register (ledger-engine-app; the security judge's stated preference); (c) YAML per version plus a shared evaluator (hybrid; rejected by both judges because an evaluator edit changes past versions silently).
Recommended: (a). Why: "edits go in a new version, not here" becomes a git-visible fact; one file holds text, params and the `eligible`/`counted`/`row_detail` functions under one hash; a diff between versions is `git diff v1.py v2.py`. The security judge called (a) and (b) security-neutral and left it to taste; the adopted architecture text names (a).

**Builder decision 2 (D-18): the clinician natural key.**
Options: (a) institutional person id (employee or MGB person id) as `person_key`, `upn` added at M2 from the directory; (b) `upn` as the natural key from M0 (hybrid); (c) NPI.
Recommended: (a). Why: the email months resolve the recipient from the directory by identity at send time (F-90 AC 8, OQ-58), so the roster must carry an identity the directory answers to before any SSO exists; a UPN can change on a name change and the hybrid's own risk list names the mismatch; NPI is absent for some roster members and is a public identifier. `upn` is unique and nullable until M2.

**Builder decision 3 (D-19): the surgeon-facing record id (`record_ref`).**
Options: (a) a short opaque token (base32, 6 to 8 characters, prefixed by type: `C-7K3Q9M`) generated once per `(record_type, source_key)` and stored on `ledger.record`; (b) the `record_id` integer; (c) the periop case id itself.
Recommended: (a). Why: F-54 AC 3 requires a ledger surrogate that cannot be resolved to a patient without ledger access; (c) is a source identifier and is out; (b) is guessable and leaks ordering and volume across surgeons in a reply thread. The token is stable across reloads because it keys on the source natural key, which is what the reply-to-dispute flow needs when the surgeon quotes a row.

**Builder decision 4 (D-11): computing the adjudicated basis.**
Options: (a) compute `basis = 'adjudicated'` only for (clinician, period, metric) triples touched by an active `record_override`, and let a view coalesce to the logged row otherwise (staff judge); (b) compute both bases for every cell on every run (ledger-engine-app).
Recommended: (a). The read path is the view `ledger.metric_value_current`; the coalesce is the renderer's rule (`render.py`, `trend.series()`): read the adjudicated row when one exists for the cell, else the logged row, and show both only when they differ. No database function does this. Why: overrides are rare; (b) doubles `metric_value` and the audit surface and makes every tile explain two identical numbers. The tile shows two numbers only when the two rows differ (F-47).

**Builder decision 5 (D-20): routing enum and the survey alternative.**
Options: (a) `routed_to in ('chief','chair')` only (minimal batch; the staff judge flagged this as an M4 schema change); (b) include `'direct_leader'` in the enum now, default routing per F-58 (chief), and switch survey-record routing to the direct leader by a `department_setting` flag if OQ-43 lands that way.
Recommended: (b). Why: no schema change at M4 either way; the comment-withholding rule (F-72 AC 5) is what protects the inbox audience, and it does not depend on the route.

**Builder decision 6 (D-21): raw schema shape.**
Options: (a) one `raw.<feed_key>` table per feed with every extract column as `text` plus `feed_load_id` and `line_no`; (b) one generic `raw.line (feed_load_id, line_no, row jsonb)`.
Recommended: (a). Why: the analyst can `select` a column by name in `psql` and compare it with the file; column presence is what `field_checklist` records; a new column in an extract is a migration the loader reports rather than a silent JSON key. (b) is easier to write and harder to inspect, and inspection is the survival criterion.

**Builder decision 7 (D-22): where quality and complication records live at M6.**
Options: (a) a separate `privileged` schema for `qi_event` and any adjudication note on a quality dispute, with its own grants that the medical staff office decision shapes; (b) `src.qi_event` with a `privileged` boolean and RLS; (c) same tables and grants as operational data (all three proposals; both judges listed this as an error).
Recommended: (a), created empty at M1 so `roles.sql` covers it before the feed lands. Why: a schema is the unit of `GRANT` and of `pg_dump --exclude-schema`; if the decision is that these records are peer-review privileged, segregation must be structural, and a boolean column is a convention. Vizient admissions stay in `src` because they are institutional analytics data, not department QI submissions; if the medical staff office decision covers them too, moving one table is one migration.

**Builder decision 8 (D-23): what `delivery` keeps of a sent artifact.**
Options: (a) `artifact_sha256` plus the rendered body and attachment as files under `preview/<period>/<clinician_ref>/` on the encrypted local disk (workstation at M1, VM at M2), with their own `retention_class` (`artifact_files`); (b) the hash only; (c) the full rendered text in a `ledger` column.
Recommended: (a). Why: the hash proves what was sent; the file lets the analyst reproduce it for a governance question without a replay; keeping PHI-bearing artifacts out of the database keeps `analyst_ro` and any future pub export away from them, and gives them a retention class of their own.

**Builder decision 9 (D-24): enforcing I2 and I4 as gate functions rather than constraints.**
Options: (a) SQL functions `assert_row_counts` and `assert_no_blank_cells` called by `close`, `recompute`, `restate` and refused-on-fail by `publish`, with `gate_results` stored on the run; (b) deferred constraint triggers that fire at commit.
Recommended: (a). Why: both invariants span two tables and the roster and are only meaningful once a run's writes are complete; a gate function names the failing cell in the run log, which is what the analyst needs; (b) fires the same check with a worse error message and no stored result.

### Feature mapping

Every feature in the four capability areas this section owns, plus the three cross-cutting features whose data side lives here.

| F-xx | Where it lives | Notes |
|---|---|---|
| F-01 | `ledger.attribution` (`clinician_id`, `rule_id`, `rule_version`, `shared_flag`, `tie_break_applied`), partial unique index `attribution_one_current`; `src.case_panel`; `scorecard/attribution/rules/case.py` | AC 5's per-row fields: surgeon, panel role and shared flag from `attribution` + `record_participant`; source and load date from `feed_load`; definition version and dispute state from `metric_value_record` join `dispute`. |
| F-02 | `ledger.attribution_exception` (`exception_type`, `raw_fields`, `resolution`, `resolved_clinician_id`, `reason` non-empty); `scorecard exceptions list|resolve`; `run.gate_results.exceptions` | Publish refuses while any row for the period has `resolution is null` (AC 4). Excluded cases land in `metric_value.exclusions["excluded_at_J4.2"]` (AC 3). |
| F-03 | `scorecard/attribution/cosurgeon.py`; `run.gate_results.cosurgeon_rate` (per subspecialty, flag `premise_2_exceeded`) | M0 hand count recorded in the Assignment notes; from M1 computed from `attribution.shared_flag` join `roster_as_of`. |
| F-04 | `ledger.feed_owner` (one row per `feed_key`, `attribution_rule_id`, `join_key`, `metrics_produced`, `contact_name`, `disputable_fields`, `override_list_recipient`, `as_of_field`, `model_version_field`, `status`, `valid`) | `contact_name is null` blocks `outcome = 'source_corrected'` (AC 3). The wRVU row has `status = 'no_ledger_record'` and empty `disputable_fields` (AC 4). Versioned by `valid` daterange with an exclusion constraint (AC 5). |
| F-05 | `ledger.record_override` (`logged_value`, `adjudicated_value`, `note`, `decided_by`, `decided_role`, `definition_version_label`, `override_version`, `effective_from`) | Extract immutability is I6; re-ingest survival is I7; the row state text is generated from the override plus `dispute` (F-59, other section). |
| F-06 | `ledger.record_override.correction_requested_at`, `source_confirmed_at`, `retired_at`, `retired_by_feed_load_id`; `ledger.correction_request.confirmed_by_feed_load_id`; `scorecard/loaders/convergence.py` | Runs inside every `scorecard load` of the owning feed. |
| F-07 | `record_override(field = 'credited_clinician', new_clinician_id)`; `basis = 'adjudicated'` resolution in `engine/close.py`; `scorecard recompute --dispute` | Exactly one receiver on `roster_as_of` enforced in `disputes/decide.py` (AC 1); the receiver's rows come from the same `metric_value_record` link under the adjudicated basis. |
| F-08 | `src.admission` (`index_case_record_id`, `index_rule_version`, `discharging_attending_id`, observed and expected columns, `model_version`); `attribution/rules/admission.py` (`ATTR-ADM-INDEX`); `attribution_exception(no_index_operation)`; `feed_load.model_version`, `as_of_date` | The index-operation rule text is a `definition_param` on the Vizient four; super-long boarder count goes to `metric_value.exclusions["super_long_boarder"]`. |
| F-09 | `privileged.qi_event`; `attribution/rules/qi_event.py` (`ATTR-QI-INDEX`); `attribution_exception(no_index_case)`; `loaders/qi.py` as the only write path | No table, form or command inserts a QI event except the loader (AC 1); `implant_flag` on `src.case` drives the 90-day SSI window (AC 4). |
| F-10 | `src.visit` (`rendering_provider_id`, `attribution_field_used`, `is_new_patient`, `completed`, `note_signed_at`); `src.third_next_sample`; `attribution/rules/visit.py` | The field name and new-patient rule come from `source_registry.attribution_rule_text` and `definition_param` (OQ-39). |
| F-11 | `src.survey_response` (scores, `has_comment`, `scope_label`, no text column); `restricted.survey_comment`; `restricted.comment_quarantine`; role `svc_survey`; `attribution/rules/survey.py`; `department_setting.gate.survey_pipeline` | AC 5's "no metric reads comments" is a grant (I9-style: `engine` has no grant on `restricted.survey_comment`) plus a static import check; AC 6 pipeline access is logged to `audit_log` with `actor_role = 'svc_survey'`. |
| F-85 | `ledger.identity` (`sso_subject`, `upn`, `clinician_id`, `valid`); `roster_as_of(today)`; `audit_log(action = 'view' | 'refused', outcome)`; RLS policies on the RLS set keyed on `scorecard.clinician_id` and `scorecard.role` | The four page-level outcomes (`no_roster`, `no_period`, `refused`, `error`) are `audit_log.outcome` values (AC 7). Deep link gated by `department_setting.gate.security_review`, `gate.data_governance`, `gate.qi_determination` (AC 6). |
| F-86 | `dispute.adjudicator_clinician_id`, `routed_to`; `roster_as_of(today).role`; `department_setting.chair_clinician_id`; RLS on `dispute` (`filed_by`, `adjudicator`, or `record_override.new_clinician_id` after a sustained re-credit) | A re-credited record becomes visible to the receiver only when a `record_override` with `new_clinician_id = receiver` exists (AC 3). |
| F-87 | `roster_membership.chief_clinician_id`, `direct_leader_clinician_id` (separate columns, dated by `valid`); `department_setting.chair_clinician_id`; `scorecard roster set --chief|--leader --effective D`; run mapping warning in `run.gate_results.mapping` | Routing reads the chief as of `dispute.filed_at`; inbox checks read the leader as of the access date; a practising chief has no leader access unless mapped (AC 5, OQ-41). |
| F-88 | `roster_as_of(today).direct_leader_clinician_id`; app role with a column grant on `restricted.survey_comment.comment_text`; `audit_log` rows with `actor_role in ('surgeon','direct_leader')` and `outcome` | The analyst identity has no app role for the inbox; `svc_survey` is the pipeline credential (AC 4). |
| F-89 | `department_setting` row `inbox_first_available.<clinician_id>` (date, written by the publisher on the first survey publish for that surgeon); `department_setting.leader_sees_measures` (default false); `restricted.private_note` excluded from the leader query by RLS | The 30-day gate is computed from the stored date, not from `audit_log` (F-107 AC 5). |
| F-95 | `ledger.feed_load` (`sha256`, `ticket_number`, `row_count`, `field_checklist`, `status`); `ledger.run` (`published_at`, `definitions_active`, `catalogue_version`, `spread_eligibility`, `gate_results`, `restates_run_id`); `raw.*` | A `run` row is never updated after `published_at` is set except by `publisher` writing that one column; a restatement is a new `run` with `restates_run_id` (AC 3). |
| F-96 | `ledger.metric_value.restates_metric_value_id`, `is_current`; `ledger.restatement` (`reason_category`, the eight categories of AC 1, `actor`, `cause_ref`; DDL in the Metric engine section); `ledger.run(kind = 'restate')`; `scorecard restate --reason` | The trend marker is derived: a current value whose `restates_metric_value_id` is not null renders "restated"; a change of `definition_version_id` between adjacent periods renders the boundary (AC 2). |
| F-97 | `metric_value.source_feed_load_id`, `source_as_of`, `model_version`; `feed_load.as_of_date`, `model_version`; `department_setting.survey_scope_phrase`; `suppression_decision(kind = 'feed_missing')` with the prior load's date in `counts` | The batch's "last refreshed" is `run.published_at`; the per-source date is the feed's own (AC 2). |
| F-98 | Report over `dispute` (`filed_by`, `filed_at`, `decided_at`, `decision`, `outcome`), `record_override.source_confirmed_at`, `metric_value_record` counts per surgeon-period; excludes `department_setting.brief_owner_clinician_id` | "Disputes without a record id" is zero by I12; the report asserts it anyway (AC 4). Aggregates only; no `claim_text` or `decision_note` selected (AC 5). |
| F-99 | `ledger.roster_membership` (all columns; `valid` daterange; gist exclusion), `ledger.leave_period`, `ledger.clinician`; `scorecard roster load|set` | AC 1 is `roster_as_of(period_end)`; AC 2 is `step_zero_attended_on`, `opt_out_on`, `definition_versions_presented`; AC 4 is one row per site; AC 5 is the mapping warning (F-87). |
| F-100 | `ledger.metric_definition_version` (`cadence`, `min_n`, `min_n_unit`, `comparator_text`, `peer_scope`, `peer_by_subspecialty`, `direction`, `interval_method`, `effective_from_period`, `effective_to_period`) and `ledger.definition_param` (named thresholds: `grace_minutes`, `first_case_rule`, `super_long_boarder_days`, `note_window_hours`, `mm_pace_rule`, `mm_leave_scaling`, `icu_return_window_hours`); `ledger.reason_set_version`; `ledger.definition_delta(kind = 'brief_vs_institutional')` | The configuration table and the definition registry are one store: a threshold change is a new definition version, so old periods keep the thresholds they were suppressed under (AC 3). The brief's values are the `assumed` params; periop's confirmed values are `confirmed` params in the same version with the diff stored as the version-1 delta (AC 5). |
| F-101 | `ledger.reason_set_version(set_key = 'surgeon_delay_reasons')` (`codes`, `signed_by`, `signed_on`, `effective_from`), mirrored as the `pending_signoff` param of the FCOT definition version (D-10); `metric_value_record.detail ->> 'delay_label'` | Unsigned: `signed_by is null`, `delay_label` null on every FCOT row; the numerator and denominator never read the set (AC 3). |
| F-102 | `ledger.reason_set_version(set_key = 'surgeon_cancellation_reasons')` with `includes_blank`, `includes_other`; `suppression_decision(kind = 'not_computable')` while unsigned; blank and Other share in `run.gate_results.cancellation_reason_distribution` | A change is a new version; earlier quarters keep their numerator unless `scorecard restate` is run (AC 4). |
| F-103 | `ledger.source_registry` (`status`, `system_name`, `extract_name`, `join_key`, `attribution_rule_id`, `attribution_rule_text`, `effective_from`); `feed_owner` row updated in the same transaction | A `registered` row without `join_key` or `attribution_rule_text` is refused by the CHECK (AC 1); the suppression engine reads `status` for `pending_source` and `not_in_release` (AC 5). |
| F-106 | `department_setting` rows `gate.*` (`signed_by`, `signed_on`, `reference`); `delivery.gate_checked`, `payload_scan`; `run.gate_results.payload_scan`; `ledger.record.record_ref` as the surrogate id | Data side only; the scan itself and the channel logic are in the Delivery surfaces section. |
| F-107 | `ledger.audit_log` (`actor`, `actor_role`, `action`, `object_type`, `object_id`, `subject_clinician_id`, `outcome`, `details` ids only); trigger `audit_log_immutable`; `scorecard audit` | AC 2 is enforced by never selecting text columns into `details` and by a pytest that scans `details` for any key outside an allowlist. |
| F-113 | `ledger.retention_class`, `ledger.disposition_log`; `scorecard retention run`; `roster_membership.faculty_to` | Every store in the six schemas plus the landing folder, the reply mailbox, the artifact files and `pg_dump` has a class row with `period_months` null until data governance sets it (OQ-57). |

Features in other areas that rest directly on tables defined here, for cross-reference by the sections that own them: F-12, F-13, F-29, F-30 (`metric_definition_version`, `definition_param`, `metric_value`, `metric_value_record`); F-31, F-32, F-33, F-35, F-36, F-38, F-39 (`peer_group_snapshot`, `restricted.peer_group_member`, `suppression_decision`, `reason_catalogue`); F-49, F-51, F-52 (`metric_value_record`, `record`, `feed_load`); F-55, F-56, F-58, F-59, F-60, F-61, F-62, F-63, F-64, F-111 (`dispute`, `dispute_event`, `record_override`, `correction_request`, `definition_open_item`, `reply_log`); F-70, F-71, F-72, F-73 (`restricted.survey_comment`, `restricted.private_note`, `dispute.claim_structured`); F-74, F-75, F-76 (`src.mm_session`, `src.attendance_scan`, `leave_period`); F-77, F-78 (`src.wrvu_month`); F-79, F-81, F-82, F-83, F-84, F-112 (`run`, `reconciliation_result`, `definition_delta`, `feed_load.status`, `run.published_at`, `run.checklist`); F-90 to F-94 (`delivery`, `reply_log`); F-104 (`metric_definition_version.availability = 'division_site_only'`, `suppression_decision(kind = 'not_computed')`).

## Metric engine and definitions-as-code

This section covers the part of the `scorecard` package that turns ledger rows into numbers, reasons, spreads and trend points: the definition module contract, registration by hash, the period close algorithm, suppression, peer groups, comparison targets, the reconciliation gate, recompute and restatement, and the pending-source and not-applicable states. It maps every feature in the catalogue areas "Metric engine and definitions" (F-12 to F-30, F-109, F-110) and "Suppression and peer groups" (F-31 to F-41), plus the shared features those areas read (F-43, F-44, F-45, F-47, F-51, F-80, F-81, F-82, F-84, F-96, F-100 to F-104).

Sources cited: the brief (`docs/source/metric-definitions-v0.2.md`), the design doc (`docs/designs/clinician-scorecard.md`), the journeys (J1 to J4) and the feature catalogue (F-xx, OQ-nn). Attribution, disputes, publishing, the web app and operations have their own sections; this one names the tables and functions it shares with them and does not restate them. DDL for `metric_definition_version`, `definition_param`, `metric_value`, `metric_value_record`, `suppression_decision`, `peer_group_snapshot`, `definition_delta` and `reconciliation_result` is in the Data model section; this section defines `comparison_target` and `restatement`.

Three rules from the adopted architecture govern everything below:

1. Definitions are code, one Python file per metric version, registered by content hash; a changed hash for an existing version label is refused (mechanism, not discipline).
2. Every number, reason, spread and trend marker is computed and stored in the ledger by `scorecard close` before any surface (email, app, pub) reads it. No surface composes a reason or filters a peer.
3. The run fails, before publish, on any cell with neither a value nor a suppression decision, on any record list whose row count differs from its denominator, and on any unexplained delta against periop's report.

One note on wording: the brief's metric name "Work RVUs — live tracker" and its marker "(assumption — to be confirmed)" contain a dash. They appear here only inside verbatim quotations of the brief.

### Package layout

```
scorecard/
  cli.py                      # one entry point: scorecard <command>
  definitions/
    _contract.py              # MetricDefinition, Param, Kind, Cadence, PeerRule, Target, ... (dataclasses)
    _catalogue.py             # reason text catalogue, versioned (F-33)
    fcot/v1.py                # First-case on-time start (FCOT)
    or_case_volume/v1.py      # OR case volume
    duration_accuracy/v1.py   # Duration estimate accuracy
    same_day_cancel/v1.py     # Same-day cancellations you could have prevented
    block_utilization/v1.py   # Block utilization (only if you have allocated block)     availability: not_in_release
    los_oe/v1.py              # Length of stay (O/E)                                        M6
    readmit_oe/v1.py          # 30-day readmission (O/E)                                   M6
    mortality_oe/v1.py        # In-hospital mortality (O/E)                                M6
    cmi/v1.py                 # Case mix index                                             M6
    return_to_or/v1.py  ssi/v1.py  vte/v1.py  csf_leak/v1.py                              M6
    icu_return/v1.py          # Unplanned return to ICU (pending confirmation of data source)  availability: pending_source
    third_next/v1.py  new_patient_visits/v1.py  notes_72h/v1.py                           M7
    referral_to_visit/v1.py   # Referral-to-visit days (pending confirmation of data source)  availability: pending_source
    nps/v1.py  explained/v1.py  listened/v1.py  respect/v1.py                             M4
    wrvu/v1.py                # Work RVUs — live tracker (kind: mirror)                    M5
    mm_attendance/v1.py       # M&M attendance (kind: pace)                                M5
    or_turnover/v1.py  pacu_boarding/v1.py  room_ready/v1.py   # availability: division_site_only (F-104)
  engine/
    registry.py               # register(), hash refusal, effective-version selection (F-13)
    periods.py                # cadence -> period windows; fiscal year; quarter close; rolling 12
    frames.py                 # record frame per (clinician, site, period, basis) from ledger only
    compute.py                # in_scope -> exclusion_reason -> counted -> aggregate; invariants (F-12, F-51)
    close.py                  # scorecard close: the ordered pipeline and gates (F-79)
    suppress.py               # suppression decisions in fixed order (F-32, F-38, F-41)
    reasons.py                # render catalogue templates with counts; unfilled placeholder = failure (F-33)
    peers.py                  # peer groups, eligibility, snapshots, render log, chief summary (F-31, F-35, F-36, F-37, F-39, F-40)
    targets.py                # comparison targets: peer spread, Vizient, MGB average, self last year (F-34)
    reconcile.py              # gate against periop's report; definition delta registry (F-81)
    recompute.py              # recompute after a decision; version-scoped recompute; restate (F-29, F-30, F-96)
    trend.py                  # trend series with restated and version-boundary markers (F-43, F-47)
    availability.py           # pending_source, not_in_release, not_applicable, division_site_only (F-44, F-103, F-104)
    intervals.py              # wilson_95, oe_exact_poisson_95, bootstrap_95 (F-24)
scorecard/ledger/migrations/NNNN_*.sql   the engine's tables live in the one numbered migration directory (Data model section)
tests/
  definitions/test_fcot_v1.py         # golden outputs per version from synthetic fixtures
  engine/test_registry_refusal.py     # changed hash refused
  engine/test_invariants.py           # row count == denominator; no blank cell
  engine/test_suppression_order.py    # fixed order, exact wording
  engine/test_peers.py                # viewer excluded, opt-out removed, five clearing, per-site rows
  engine/test_reconcile.py            # unexplained delta stops the run
```

### The definition module contract (F-12)

A metric version is one Python file, `definitions/<metric_key>/v<N>.py`. The file declares one `DEFINITION` object and up to six functions. Everything the surgeon reads on the definition page (F-50) and everything the engine needs to compute is in that one file, so one sha256 covers text, parameters and logic together.

**Data on `DEFINITION`** (dataclass `MetricDefinition` in `_contract.py`):

| Field | Type | Meaning | Source of the value |
|---|---|---|---|
| `metric_key` | str | Stable machine key (`fcot`) | build |
| `version_label` | str | `v1`, `v2`; the file name must match | build |
| `brief_name` | str | The brief's name, verbatim | brief |
| `bucket` | str | The brief's bucket name | brief |
| `kind` | enum | `rate`, `oe`, `count`, `median`, `mirror`, `pace` | brief "What" and "Shown as" |
| `record_type` | str or None | A `ledger.record` type: `case`, `admission`, `visit`, `survey_response`, `attendance`, `block_allocation`, `referral`, `icu_stay`, `qi_event`, `third_next_sample`; `None` for `mirror` (wRVU reads `src.wrvu_month`, which is not a record) | Data model section |
| `cadence` | enum | `monthly`, `quarterly`, `rolling_12`, `fiscal_year` | brief "Counted" |
| `min_n`, `min_n_unit` | int or None, str | The brief's minimum; `None` means never count-suppressed | brief "needs at least" |
| `comparator_text` | str | The brief's "Compared to" line, verbatim (F-34 AC 1) | brief |
| `peer_rule` | `PeerRule(scope, by_subspecialty, group_word)` or None | `scope` in `site`, `system`; `group_word` in `subspecialty`, `department` for the reason template | brief "Compared to" |
| `targets` | list | Any of `peer_spread`, `vizient`, `mgb_average`, `self_last_year` | brief "Compared to" |
| `direction` | enum | `higher_is_better`, `lower_is_better`, `not_stated` | brief; the storage rule is under the min-n table (only "Lower is better" is ever rendered) |
| `risk_model` | str or None | `vizient` or None; drives the O/E and "unadjusted" labels (F-24 AC 1) | brief Bucket 4 |
| `availability` | enum | `computed`, `pending_source`, `not_in_release`, `division_site_only`, `mirror` | brief markers; source registry |
| `governance_flag` | str or None | `allow_quality`, `allow_survey` or None; the run refuses to compute unless the flag is set in `department_setting` | adopted architecture |
| `definition_text` | str | Brief "What", verbatim, or the institutional text adopted verbatim with the brief's text kept as the flagged assumption | brief; periop |
| `institutional_source` | str or None | Who owns the institutional definition | design doc |
| `note_text`, `lever_text` | str | Brief "Note" and "You can move it by", verbatim | brief |
| `dispute_effect_notices` | dict field -> str | What a sustained dispute on each disputable field changes (F-56); stored as `dispute_effect_notices` | journeys J2.2 |
| `params` | list of `Param` | Every "to be confirmed" item and every threshold as data | brief; confirmations |
| `reason_templates` | `ReasonTemplates` | Catalogue version pinned by this definition version (F-33); stored as `reason_catalogue_version` | build |
| `record_columns` | list of str | Columns of the record list for this metric (F-49) | features per metric |
| `interval_method` | str or None | Key into `intervals.py` (F-24) | builder decision BD-8 (D-14) |
| `reconcile_to` | str or None | Which periop report series this metric must match (F-81) | design doc |
| `aggregations` | list | `period` for every metric; survey measures add `year_average` (F-28 AC 4) | brief Bucket 5 |
| `effective_from_period`, `effective_to_period` | str, str or None | Period labels; windows for one metric must not overlap; the registry derives the `effective_from` and `effective_to` dates (D-49) | analyst at registration |
| `supersedes` | str or None | Prior `definition_version_id` | analyst at registration |
| `confirmed_by`, `confirmed_on`, `approved_by` | str, date, str or None | Who confirmed the change that made this version; approver stays empty until OQ-35 is answered | definitions owner |

**`Param`**: `Param(name, value, unit=None, status, brief_value=None, note, confirmed_by=None, confirmed_on=None)` with `status` in `assumed`, `confirmed`, `pending_signoff`. `value` is what the engine uses. `brief_value` keeps the brief's number when the value in force came from an institutional confirmation, so the definition page can show both and the delta between them (F-50 AC 1, F-100 AC 5). `pending_signoff` is for the two reason sets that periop leadership signs (F-101, F-102); a `pending_signoff` param with `value=None` is readable but the functions that need it must handle `None` (FCOT labels rows only when the set exists; the cancellation metric refuses to compute).

**Functions** (all pure; they receive a pandas frame built by `frames.py` from the ledger only, and a `ctx`). The result of `counted` is stored as `metric_value_record.in_numerator`; a non-None `exclusion_reason` sets `excluded = true`; `row_detail` is stored as `detail`.

| Function | Signature | Required | Purpose |
|---|---|---|---|
| `in_scope` | `(records, ctx) -> frame` | yes | The records this metric considers for the clinician and period (the denominator candidates). |
| `exclusion_reason` | `(row, ctx) -> str or None` | no | A named reason removes the record from the denominator and counts it under that reason (F-51 AC 1). Excluded rows stay in the record list flagged excluded (F-19 AC 3). |
| `counted` | `(rows, ctx) -> bool Series` | yes for `rate`; ignored for `count`, `median`, `mirror`, `pace` | The numerator test per record. |
| `row_detail` | `(row, ctx) -> dict` | no | Per-record fields written to `metric_value_record.detail` and shown on the list (which tolerance test fired; your delay / not your delay). |
| `aggregate` | `(rows, ctx) -> Aggregate` | yes for `oe`, `median`, `mirror`, `pace`; optional for `rate` and `count` | Returns `Aggregate(numerator, denominator, value, expected=None, interval=None, extra={})`. Default for `rate`: numerator = counted rows, denominator = counted-or-not rows, value = ratio. Default for `count`: value = denominator. |
| `applicability` | `(clinician_ctx) -> str or None` | no | A non-None string is the `not_applicable` condition text ("no allocated block this month"); the engine writes that decision instead of computing (F-18 AC 3). |

`ctx` exposes: `ctx.param(name)`, `ctx.period` (`start`, `end`, `label`, `cadence`, `close_date`), `ctx.basis` (`logged` or `adjudicated`), `ctx.clinician_id`, `ctx.site`, `ctx.minutes(n)`, `ctx.interval(method, **kw)`, `ctx.fiscal_year(date)`. Nothing else. A function that imports psycopg, reads a file or touches the comments table fails the static check in `tests/engine/test_purity.py` (F-12 AC 5, F-28 AC 5).

**Worked example: `definitions/fcot/v1.py`** (F-15). The brief's text is kept verbatim; the grace window is a `Param` with status `assumed`; the delay reason set is `pending_signoff` and labels rows without changing the count (J1.5, F-101).

```python
# definitions/fcot/v1.py
# Registered by content hash (scorecard register). Never edit after registration: copy to v2.py.
from scorecard.definitions._contract import (
    MetricDefinition, Param, Kind, Cadence, PeerRule, Target, Direction, Availability, ReasonTemplates,
)

DEFINITION = MetricDefinition(
    metric_key="fcot",
    version_label="v1",
    brief_name="First-case on-time start (FCOT)",
    bucket="Efficiency",
    kind=Kind.RATE,
    record_type="case",
    cadence=Cadence.MONTHLY,
    min_n=4, min_n_unit="first cases",
    comparator_text="neurosurgeons at your site",
    peer_rule=PeerRule(scope="site", by_subspecialty=False, group_word="department"),
    targets=[Target.PEER_SPREAD],
    direction=Direction.HIGHER_IS_BETTER,
    risk_model=None,
    availability=Availability.COMPUTED,
    governance_flag=None,                       # operational OR-log data; no governance flag needed
    definition_text=(
        "of your first cases of the day, the share where the patient was wheeled into the room at or "
        "before the scheduled start time. No grace window (assumption — to be confirmed against the "
        "institutional definition)."
    ),                                          # brief v0.2, Bucket 2, verbatim
    institutional_source="periop analytics FCOT definition, adopted verbatim so the number matches periop's (design doc challenge 3)",
    note_text="the delay reason is stored on each case, so a delay that wasn't yours can be disputed",
    lever_text="arriving on time; consent, marking, and H&P done before the day",
    dispute_effect_notices={
        "delay_reason_code": "corrects the reason on the row; the case stays late and the FCOT count does not move (OQ-12)",
        "credited_clinician": "moves the case to the other surgeon; both surgeons' FCOT, OR case volume and Duration estimate accuracy recompute",
    },
    params=[
        Param("grace_minutes", value=0, unit="minutes", status="assumed", brief_value=0,
              note="Brief assumes no grace window; to be confirmed against the institutional definition (OQ-01)."),
        Param("first_case_rule", value="first_scheduled_case_in_room_where_surgeon_is_primary", status="assumed",
              note="Room eligibility to confirm with periop (design doc challenge 31; OQ-01)."),
        Param("surgeon_attributable_delay_reasons", value=None, status="pending_signoff",
              note="Signed by periop leadership (F-101, OQ-38). Labels late rows 'your delay' / 'not your delay'. Never changes the count."),
    ],
    reason_templates=ReasonTemplates.catalogue("v1"),      # F-33 wording; a wording change is a new catalogue version
    record_columns=["case_date", "room", "procedure", "scheduled_start", "wheels_in", "on_time",
                    "delay_reason_code", "delay_label", "shared_flag", "dispute_state"],
    interval_method="wilson_95",                           # used only for the M6 'no evidence of difference' label
    reconcile_to="periop_report:fcot",
    effective_from_period="2026-10",
    effective_to_period=None,
    supersedes=None,
    confirmed_by=None, confirmed_on=None, approved_by=None,
)


def in_scope(cases, ctx):
    """Denominator candidates: first scheduled case in its room on the day, credited to this clinician as
    primary under ctx.basis (frames.py applied attribution and overrides already)."""
    return cases[cases.first_case_in_room]


def exclusion_reason(row, ctx):
    if row.cancelled_same_day:
        return "cancelled same day"
    if row.wheels_in is None:
        return "wheels-in missing"
    return None


def counted(rows, ctx):
    """Numerator: wheels-in at or before scheduled start plus the grace window (0 minutes at v1)."""
    return rows.wheels_in <= rows.scheduled_start + ctx.minutes(ctx.param("grace_minutes"))


def row_detail(row, ctx):
    grace = ctx.param("grace_minutes")
    on_time = row.wheels_in <= row.scheduled_start + ctx.minutes(grace)
    reasons = ctx.param("surgeon_attributable_delay_reasons")
    if on_time or reasons is None:
        label = None                                        # F-101 AC 2: no label while unsigned
    else:
        label = "your delay" if row.delay_reason_code in reasons else "not your delay"
    return {
        "on_time": on_time,
        "delay_reason_code": row.delay_reason_code or "(blank)",   # F-15 AC 6
        "delay_label": label,
        "test_applied": f"grace_minutes={grace}",
    }
```

When periop confirms a five-minute window on 2026-12-03, the analyst copies the file to `v2.py`, changes only what changed, and registers it. `v1.py` is untouched and stays readable from every number stamped `fcot@v1`.

```python
# definitions/fcot/v2.py (only the lines that differ from v1)
    version_label="v2",
    definition_text=("<periop's institutional FCOT text, verbatim>"),
    params=[
        Param("grace_minutes", value=5, unit="minutes", status="confirmed", brief_value=0,
              confirmed_by="periop analytics", confirmed_on=date(2026, 12, 3),
              note="Institutional definition confirmed in writing; brief assumed 0 (OQ-01 closed)."),
        ...
    ],
    effective_from_period="2027-01",
    supersedes="fcot@v1",
    confirmed_by="periop analytics", confirmed_on=date(2026, 12, 3),
```

**Second example, sketch: `definitions/los_oe/v1.py`** (F-19). Shows `Kind.OE`, a named exclusion with its count on the tile, an interval, the system-scope peer rule and the quality governance flag.

```python
# definitions/los_oe/v1.py (sketch; M6)
DEFINITION = MetricDefinition(
    metric_key="los_oe", version_label="v1",
    brief_name="Length of stay (O/E)", bucket="Quality and outcomes",
    kind=Kind.OE, record_type="admission",
    cadence=Cadence.QUARTERLY, min_n=10, min_n_unit="admissions",
    comparator_text="subspecialty peers across the system, and Vizient",
    peer_rule=PeerRule(scope="system", by_subspecialty=True, group_word="subspecialty"),
    targets=[Target.PEER_SPREAD, Target.VIZIENT],
    direction=Direction.LOWER_IS_BETTER,           # brief: "below 1.0 is better"
    risk_model="vizient",
    availability=Availability.COMPUTED,
    governance_flag="allow_quality",              # medical staff office decision gates the run
    definition_text=(
        'total days your surgical patients stayed, divided by the total days Vizient expected given their '
        'diagnoses and risk. Patients who became "super-long boarders" are left out (assumed to mean more '
        'than 30 days until the institutional definition is confirmed); the screen shows how many were excluded.'
    ),
    lever_text="pathway adherence, early discharge planning, timely PT/OT orders",
    dispute_effect_notices={"credited_clinician": "moves the admission to the correct index-operation surgeon across all four Vizient-backed metrics (F-07, F-67)"},
    params=[
        Param("super_long_boarder_days", value=30, unit="days", status="assumed", brief_value=30, note="OQ-02"),
        Param("los_basis", value="whole_encounter", status="assumed", note="Brief says whole-encounter days; post-operative days is OQ-30"),
        Param("index_operation_rule", value="index_rule@v1", status="assumed", note="OQ-31; rule text lives in the Data model section"),
    ],
    reason_templates=ReasonTemplates.catalogue("v1"),
    record_columns=["encounter_ref", "index_operation_date", "index_surgeon", "discharging_attending",
                    "observed_days", "expected_days", "excluded", "rule_statement", "dispute_state"],
    interval_method="bootstrap_95",               # BD-8: LOS days are not Poisson counts
    reconcile_to=None,
    effective_from_period="2027-Q1",              # placeholder; set when the Vizient extract is registered
)


def in_scope(admissions, ctx):
    # credited to this clinician as index-operation surgeon under ctx.basis; discharged inside the quarter
    return admissions[(admissions.discharge_at >= ctx.period.start) & (admissions.discharge_at <= ctx.period.end)]


def exclusion_reason(row, ctx):
    if row.observed_los_days > ctx.param("super_long_boarder_days"):
        return "super-long boarder"               # tile: "<k> super-long boarders excluded (assumed more than 30 days ...)"
    if row.expected_los_days is None:
        return "no Vizient expected value"
    return None


def row_detail(row, ctx):
    return {"rule_statement": "credited to the index-operation surgeon by rule"
            if row.index_surgeon_id != row.discharging_attending_id else None}


def aggregate(rows, ctx):
    observed, expected = float(rows.observed_los_days.sum()), float(rows.expected_los_days.sum())
    lo, hi = ctx.interval("bootstrap_95", observed=rows.observed_los_days, expected=rows.expected_los_days)
    return Aggregate(numerator=observed, denominator=len(rows),        # denominator = admissions, for min-n and the row-count invariant
                     expected=expected, value=(observed / expected) if expected else None, interval=(lo, hi))
```

**How the other kinds use the contract**

| Kind | Metrics | numerator | denominator | value | Notes |
|---|---|---|---|---|---|
| `rate` | FCOT, Duration estimate accuracy, Same-day cancellations, Clinic notes closed within 72 hours, QI four, Unplanned return to ICU, the three top-score survey items | counted rows | rows not excluded | ratio | Duration estimate accuracy stores `test_applied` in `row_detail` (F-16 AC 2). Survey items add a `year_average` aggregation. Net promoter score is a `rate` with a custom `aggregate` (promoters minus detractors over responses, times 100; F-28 AC 1). |
| `oe` | Length of stay (O/E), 30-day readmission (O/E), In-hospital mortality (O/E) | sum observed | admissions | observed / expected | `expected` stored; `model_version` and `source_as_of` from the feed load (F-24 AC 2). |
| `count` | OR case volume, New patient visits | none | rows | rows | Never count-suppressed (`min_n=None`). |
| `median` | Third-next-available appointment, Referral-to-visit days, Case mix index (mean, declared `median` kind with `aggregate` overriding to mean) | none | samples or admissions | median or mean | Case mix index: mean Vizient relative weight (F-22 AC 1). |
| `mirror` | Work RVUs — live tracker | none | none | wRVU for the month and FYTD | No record list, no dispute action, no peer, no target (F-77); `aggregate` returns the feed value; `self_last_year` target supplies the ghosted series. |
| `pace` | M&M attendance | attended | sessions held while on faculty and not on leave | attended | `aggregate` returns `extra={remaining, target, scheduled, pace_state, scaled}` under the F-75 rule; `params` hold the leave-scaling assumption. |

### Registration by hash and the refusal rule (F-13)

`scorecard register` walks `definitions/*/v*.py`, imports each file, computes `sha256` of the file bytes, and reconciles against `ledger.metric_definition_version`.

The table is `ledger.metric_definition_version` with `ledger.definition_param` beside it (DDL in the Data model section). `definition_version_id` is `'<metric_key>@<version_label>'`, for example `fcot@v1`; `code_hash` is the sha256 of the file bytes; `params` become `definition_param` rows in the same transaction; `diff_from_prior` holds the unified diff against `supersedes`. Rows are never updated: an UPDATE or DELETE trigger raises. Effective windows for one `metric_key` must not overlap: enforced by the gist exclusion constraint and by `tests/engine/test_registry_refusal.py`. `ledger.definition_open_item` (F-63) is written by the Dispute workflow section and closed by `register` when a new version answers it.

The refusal rule, in `registry.register(file)`:

```
1. compute h = sha256(file bytes); read DEFINITION from the module
2. look up (metric_key, version_label)
   a. not found          -> INSERT row with h, git sha, diff_from_prior (against `supersedes`), registered_by; print "registered fcot@v2"
   b. found, same hash   -> no-op; print "fcot@v1 unchanged"
   c. found, other hash  -> raise DefinitionChangedError("fcot@v1 registered with hash abc..., file hashes def...;
                             edits go in a new version, not here"); exit code 2; nothing written
3. check the metric's effective windows do not overlap and that version_label matches the file name
4. check every period between the earliest effective_from and today is covered by exactly one version,
   or print the gap (a gap is allowed; `close` refuses to compute that metric for a period with no version)
```

`scorecard close` calls `register()` first, so a hand edit to a registered file stops the month before anything is computed (F-13 AC 2, F-79). The same check is `tests/engine/test_registry_refusal.py`, which edits a fixture copy of `v1.py` and asserts the refusal.

**Effective version selection** (`registry.effective_version(metric_key, period_label)`): the single row whose `[effective_from_period, effective_to_period]` covers the period. No row means the metric is not computed for that period and the run log says "no definition version effective for los_oe in 2026-Q4" (a run-level failure for a `computed` metric, a plain note for `pending_source`). A `recompute --version` or `restate --to-version` pins a version explicitly and is logged (F-30, F-96).

**Version boundaries** are visible: the trend marks the first point computed under a new version (F-96 AC 2), the definition page lists both versions with `diff_from_prior`, confirmer and date (F-50 AC 4), and the next monthly email says a definition changed and where the boundary sits (F-94).

**Builder decision BD-1 (D-07). Definition file layout.**
- Options: (a) one Python file per metric version, sha256 of the file is the version hash (minimal-batch; staff-engineer recommendation); (b) one module per metric holding all versions side by side, hash over text plus params plus `inspect.getsource` of the functions (ledger-engine-app; the clinical informatics and security judge called this security-neutral and left it to taste); (c) one YAML per version plus a shared evaluator (bi-hosted-hybrid).
- Recommended: (a).
- Why: (a) makes "edits go in a new version" a git-visible fact (a new file), keeps text, params and functions under one hash, and gives the cleanest diff for the definitions owner to review. (c) is refused because a shared evaluator edit silently changes how past versions compute (both judges flagged it). (b) works but a diff of one large module is noisier and the hash has to be assembled from parts.

**Builder decision BD-2 (D-08). What the hash covers.**
- Options: raw file bytes; a normalized form (AST or stripped comments and whitespace).
- Recommended: raw file bytes.
- Why: simplest to explain to a reviewer ("the file changed"), no normalizer to maintain, and a comment edit forcing a new version is the intended behavior: the definition page shows the file's text, so a comment is part of what the surgeon can read.

**Builder decision BD-3 (D-09). What `fcot@v1` carries when periop's confirmation is not yet in hand.**
- Options: (a) register `v1` with the brief's assumed values (grace 0, room rule assumed) at M0 for the Assignment's recomputation test, and register `v2` with periop's confirmed values before the first close; the reconciliation gate refuses to publish under `v1` if any surgeon's number differs; (b) hold `v1` until periop confirms and register it with periop's values in force and `brief_value` keeping the assumption (the literal reading of F-100 AC 5).
- Recommended: (a) when the confirmation arrives after M0, (b) when it arrives before. `Param.value`, `Param.brief_value` and `Param.status` make either honest; the definition delta registry (F-81) records the difference either way.
- Why: the Assignment needs a runnable definition before periop answers; the gate guarantees no surgeon sees a number computed under an unconfirmed grace window that does not match periop's.

**Builder decision BD-4 (D-10). Where the signed reason sets live.**
- Options: (a) as `Param(status='pending_signoff')` inside the definition version, so a signature is a new definition version; (b) a separate signed table read by the definition through `ctx`.
- Recommended: (a).
- Why: old periods keep the labels and numerators they were computed under by construction (F-101 AC 4, F-102 AC 4), and one hash covers the set and the code that reads it. F-100's "versioned metric configuration table" is then the `metric_definition_version` table plus the view `ledger.v_metric_configuration` (one row per metric per version with cadence, min-n, comparator, exclusions, reason sets and named thresholds), not a second store.

### Periods, cadences and the fiscal year

`engine/periods.py` is the only place that turns a cadence into a window. `close --period` takes a month label; the module derives which cadences close in that month.

| Cadence | Period label | Window | Closes when | Metrics (brief "Counted") |
|---|---|---|---|---|
| `monthly` | `2026-10` | calendar month | every monthly close | OR case volume; New patient visits; FCOT; Duration estimate accuracy; Block utilization; Clinic notes closed within 72 hours; Third-next-available appointment; the four Bucket 5 measures (per survey month) |
| `quarterly` | `2026-Q4` | three calendar months | the close for the quarter's last month; other months write an `interim` state with the running denominator (F-45 AC 1) | Case mix index; Same-day cancellations you could have prevented; Referral-to-visit days; Length of stay (O/E); 30-day readmission (O/E); the QI four; Unplanned return to ICU |
| `rolling_12` | `2026-12-R12` | 12 months ending at a quarter end | at quarter-close months only (BD-10) | In-hospital mortality (O/E) |
| `fiscal_year` | `FY2027:2026-10` (fiscal year, through month) | fiscal year to date | every monthly close, as a FYTD snapshot plus the month | Work RVUs — live tracker; M&M attendance |

Rules:
- Only closed periods are computed and shown (F-84). `close --period 2026-10` runs after 31 October; a period whose close date is after the run date is refused.
- Quarter boundaries are calendar quarters (the journeys' "the quarter closes 31 December", J1.8). The fiscal year start month is not in the brief. It is a `department_setting` row (`fiscal_year_start_month`) that the run refuses to compute `fiscal_year` metrics without. Recorded as **OQ-59 (new)**: confirm the fiscal year start month used by the comp plan, and whether quarters are calendar or fiscal.
- A period label is stored on every `metric_value`, `suppression_decision`, `peer_group_snapshot` and `comparison_target` row; the trend orders by `period_start`.

**Builder decision BD-10 (D-16). When rolling-12 metrics are computed.**
- Options: (a) at every monthly close, window ending that month (twelve overlapping windows a year); (b) only at quarter-close months, four points a year, the tile between closes showing the last computed window as "Rolling 12 months to <date>" (F-21 AC 4, F-45 AC 2).
- Recommended: (b).
- Why: matches the proposed trend form (four points per year, OQ-25), avoids twelve near-identical restatable windows, and keeps the small-count mortality series from moving every month on one event.

### The period close algorithm (F-79, J4.1 to J4.9)

`scorecard close --period 2026-10 [--dry-run] [--allow-quality] [--allow-survey]` runs the stages below in order, writes one `ledger.run` row (`kind='close'`, git sha, active definition versions, gate results), and stops at the first failed gate. Publishing is a separate command that refuses any run whose gates did not all pass. Stages 2 and the attribution tables belong to the Data model section; they are named here because the engine consumes their output.

```
  feed_load: periop case-level extract, periop surgeon-level report, roster (this month's ticket)
        |
        v
 [1] register()                    refuse a changed hash; record git sha                           F-13
 [2] field check                   per metric: required fields present? -> not_computable list     F-80
 [3] attribution                   attribution rows, shared flag, exception list (blocks publish)   F-01, F-02  (Data model section)
 [4] roster as-of period end       roster_membership rows; chief and leader mapping                 F-99
 [5] version selection             effective definition_version_id per (metric, period)            F-13
 [6] availability gate             division_site_only -> not_computed; pending_source; not_in_release;
                                   governance_flag unset -> not computed for this run              F-44, F-103, F-104
 [7] record frames                 per (clinician, site, period, basis) from the ledger only        F-12
 [8] compute                       in_scope -> exclusion_reason -> counted -> aggregate
                                   metric_value + metric_value_record; invariant row count == denominator   F-12, F-51
 [9] suppression                   one decision per (clinician, metric, period, site, scope), fixed order    F-32, F-33, F-41
 [10] peer groups and spreads      snapshot per viewer; eligibility; render log                     F-31, F-35, F-36
 [11] comparison targets           Vizient, MGB average, self last year                            F-34
 [12] trend series                 markers: restated, version boundary, history from               F-43, F-96
 [13] gates                        reconciliation | feed health | no-blank cell | row count | exceptions   F-81, F-82, F-32, F-51, F-02
        |
        v
  run.gate_results written; `scorecard publish --period 2026-10` reads only a run with every gate passed
```

Step by step:

**[5] Version selection.** For every metric in the registry and every period that closes this month (see cadences), `registry.effective_version()` returns one `definition_version_id`. The run row stores the full map (`definitions_active`), which is what the period record shows (F-95 AC 2).

**[6] Availability.** `availability.py` decides, before any compute, which metrics get a value attempt:

| `availability` or condition | What close does | Decision kind written | Feature |
|---|---|---|---|
| `division_site_only` | nothing computed for any clinician | `not_computed`, scope `value` | F-104 |
| `pending_source` (source registry has no registration effective for the period) | nothing computed | `pending_source` | F-44 AC 4, F-103 AC 5, F-109 AC 1, F-110 AC 1 |
| `not_in_release` (registry row with status `not_in_release`) | nothing computed | `not_in_release` | F-18 AC 1, F-44 AC 1 |
| `computed` but `governance_flag` not set in `department_setting`, or the run lacks the matching `--allow-*` flag | nothing computed; run log line "los_oe: not computed, allow_quality not signed off" | `feed_missing` with the `feed-not-received` template naming the feed and the run date (the sign-off is not a feed, but the surgeon-facing truth is the same: the data is not in this period) | F-106 (cross-cutting) |
| feed for the period missing or failed (`feed_load.status` in `failed`, absent) | nothing computed for that feed's metrics | `feed_missing` | F-82 AC 1 |
| survey month held (`feed_load.status = 'held'`, D-40) | measures computed and stored, decision written over them so nothing publishes | `feed_held` | F-11 AC 4 |
| a required field is absent from the extract | nothing computed for the dependent metrics; other metrics continue | `not_computable` with the `not-computable` template | F-80 |
| `mirror`, `pace` | computed from the feed rows with no record-list invariant (`mirror`) or with the session list (`pace`) | none | F-77, F-74 |

**[7] Record frames.** `frames.build(clinician_id, site, period, basis, record_type)` selects the records credited to the clinician under `ledger.attribution` (rows valid at the close), joins the source columns the metric declares, and, for `basis='adjudicated'`, applies every active `ledger.record_override` whose `effective_from` is at or before the run and `retired_at` is null: a `credited_clinician` override moves the record out of the original clinician's frame and into the receiver's; a field override (`delay_reason_code`, `cancellation_reason_code`, `provider_named`, `scan_present`) substitutes the adjudicated value in the frame. The frame carries `shared_flag`, `dispute_state` (from the Dispute workflow section's current-state view) and the feed load id per row.

Per-site rows: for a metric whose `peer_rule.scope` is `site`, one frame per roster site the clinician holds in the period (records at that site); for `system` scope and for metrics with no peer rule, one frame with `site` null covering all the clinician's records (OQ-08 keeps the pooled row for site-scope metrics open; this is the only place the question touches the engine).

**[8] Compute.** For each frame:

```
rows      = in_scope(frame, ctx)
reason    = rows.apply(exclusion_reason)           # None or a reason string
counted_v = counted(rows[reason.isna()], ctx)      # rate only
agg       = aggregate(rows[reason.isna()], ctx) or default_aggregate(kind, counted_v)
write ledger.metric_value(numerator, denominator, value, expected, interval, exclusions = reason.value_counts(), ...)
write ledger.metric_value_record for EVERY row in rows (excluded rows carry excluded=true and their reason;
      the rest carry in_numerator=true/false and row_detail as detail jsonb)
assert count(records where excluded=false) == denominator            # F-51 AC 2; the run fails otherwise
```

Basis: `basis='logged'` is computed for every clinician. `basis='adjudicated'` is computed only for (clinician, period, metric) triples touched by an active override on a record in that period, including the receiving clinician of a re-credit. Where no adjudicated row exists the surfaces read the logged row and show one value (F-47 AC 1).

**Builder decision BD-5 (D-11). Computing the adjudicated basis.**
- Options: (a) only where an active override touches the (clinician, period, metric) (staff-engineer recommendation); (b) every metric for every clinician under both bases every run (ledger-engine-app).
- Recommended: (a).
- Why: overrides are rare; (b) doubles every row, makes the tile explain two identical numbers, and doubles the audit surface for no information. Under (a) the display rule is one line: show both when an adjudicated row exists and differs.

`ledger.metric_value` and `ledger.metric_value_record` are defined in the Data model section. The columns the engine writes here: `definition_version_id`, `period_type`, `period_label`, `period_start`, `period_end`, `site`, `basis`, `aggregation` (`period` or `year_average`), `numerator`, `denominator` (record count after exclusions; min-n compares to this; null only for `mirror`), `expected` (O/E only), `value`, `interval_low`, `interval_high`, `interval_method`, `no_evidence_of_diff` (set at stage [11]), `exclusions`, `extra` (pace and mirror fields), `source_feed_load_id`, `source_as_of`, `model_version`, `run_id`, `restates_metric_value_id`, `is_current`. The record link carries `excluded`, `exclusion_reason`, `in_numerator` and `detail`. Invariant, checked in `close.py` and in `tests/engine/test_invariants.py`: `count(metric_value_record where not excluded) = metric_value.denominator`.

Rows are append-only. A recompute inserts a new row, points it at the old one through `restates_metric_value_id`, and flips the old row's `is_current` to false. The trend reads current rows; the restatement log (F-96) reads the chain.

**[9] to [12]** are the next four subsections. **[13] Gates**: reconciliation (below), feed health (`feed_load.status` per feed; partial loads need an explicit `--accept-partial <feed>` with a note stored on the run, F-82 AC 3), the no-blank gate (for every clinician on the roster as-of the period, every metric in the registry, every closing period and both scopes, there is either a current `metric_value` or a `suppression_decision` with non-empty `reason_text`), the row-count invariant, and the attribution exception list (zero unresolved). Each gate writes a line into `run.gate_results`; any failure sets `run.status='failed'` and `publish` refuses the period.

`--dry-run` runs every stage into a transaction that is rolled back at the end and prints the gate results, the suppression report and the peer summary, so the analyst can inspect a month before it is written (the Delivery surfaces section's preview folder is a separate `publish --dry-run`).

### Suppression decisions and reason text (F-32, F-33, F-38, F-41)

`suppress.decide()` writes exactly one `ledger.suppression_decision` row per (clinician, metric, period, site, scope) every run, including `kind='none'` (DDL in the Data model section). Scope is `value` (the surgeon's own number) or `comparison` (the peer spread). Kinds are tested in a fixed order; the first match wins for that scope. A `value`-scope suppression implies the same kind on the `comparison` scope.

| Rank | `kind` | Scope | Template key | Exact reason text | Decided from |
|---|---|---|---|---|---|
| 0 | `not_computed` | value | `not-computed` | `not computed in this cycle` | `availability = division_site_only` (F-104) |
| 1 | `not_in_release` | value | `not-in-release` | `Not in this release: needs <feed>; owner not yet named` | source registry status (F-44 AC 1) |
| 2 | `pending_source` | value | `pending-source` | `Data source pending confirmation` | source registry status (F-44 AC 4) |
| 3 | `feed_missing` | value | `feed-not-received` | `<feed> for <period> not received as of <date>` | feed health (F-82); governance flag unset |
| 3 | `feed_held` | value | `feed-held` | `MGB patient survey for <month> held: de-identification check in progress as of <date>` | `feed_load.status = 'held'` for the survey month (D-40); M4 |
| 3 | `not_computable` | value | `not-computable` | `not computable: <field> not in extract` | field check (F-80) |
| 4 | `not_applicable` | value | `not-applicable` | `Not applicable: <condition>` | `applicability()` (F-18 AC 3) |
| 5 | `interim` | value | `counted-quarterly` | `Counted quarterly; the quarter closes <date>` plus `<Unit> so far this quarter: <k>` | cadence not closing this month (F-45 AC 1) |
| 6 | `min_n` | value | `min-n` | `Not shown: <n> <unit> this <period>; needs at least <min-n>` | `denominator < min_n` (F-32 AC 3) |
| 6 | `min_n` (survey month) | value | `hidden-month` | `Hidden: <n> responses this month; needs at least 10` | Bucket 5, unit responses (F-41 AC 1) |
| 7 | `spread_not_written` | comparison | `spread-month-one` / `spread-not-attended` / `spread-opted-out` | see BD-11 | viewer eligibility (F-35); tested before the peer count |
| 8 | `peer_under_five` | comparison | `peer-under-five` | `Peer comparison not shown: <n> peers in your <group> <scope> cleared at least <min-n> <unit> this <period>; needs 5 (you are not counted)` | `peers_clearing_min_n < 5` (F-32 AC 4) |
| 8 | `peer_under_five` (roster change) | comparison | `peer-under-five-asof` | `Peer comparison not shown: <n> peers in your <group> <scope> cleared min-n as of <date>; needs 5 (you are not counted)` | `caused_by` is a roster change (F-33 AC 4, F-39 AC 2) |
| 8 | `peer_under_five` (survey coverage) | comparison | `peer-coverage-gap` | reason names the coverage gap (wording to add to the catalogue at M4) | extract covers fewer sites than the group (F-40 AC 4, OQ-45) |
| 9 | `none` | value or comparison | (none) | (value or spread shown) | |

Placeholders: `<group>` is the definition's `peer_group_word` (`subspecialty` or `department`); `<scope>` is `at this site` or `across the system` from `peer_scope`; `<unit>` and `<min-n>` come from the definition version, so old periods keep the thresholds they were suppressed under (F-32 AC 7, F-100 AC 3); `<period>` is `month` or `quarter` from the cadence. `reasons.render(key, **counts)` fills the template from `ledger.reason_catalogue` (versioned; the definition version pins the catalogue version) and raises on any unfilled placeholder, which fails the run (F-33 AC 2).

The dispute clause (F-38) is appended by `recompute`, never by `close`: `min-n` text gains ` (<n> case(s) re-credited by dispute <id> on <date>)` when a recompute crossed the threshold downward, and the cell that crosses upward carries `Now shown: <n> <unit> (<n> case(s) re-credited to you by dispute <id> on <date>)`. `caused_by_kind = 'dispute'` and `caused_by_ref` store the dispute.

The `CHECK (kind = 'none' or reason_text is not null and non-empty)` constraint on the table is the 100%-reason gate as a mechanism; the partial unique index on `(clinician_id, metric_key, period_label, site, scope) where is_current` keeps one current decision per cell and scope.

**The min-n table at version 1**, exactly as the brief states it (F-32 AC 1). The unit is the word the reason text uses.

| Metric (brief name) | min-n | unit | Cadence | Comparator (brief) | Direction |
|---|---|---|---|---|---|
| OR case volume | none | | monthly | surgeons in your subspecialty at your site | not stated |
| Case mix index | 10 | admissions | quarterly | surgeons in your subspecialty across the system, and Vizient | not stated |
| New patient visits | none | | monthly | subspecialty peers at your site | not stated |
| Work RVUs — live tracker | none | | fiscal year (FYTD and by month) | yourself last year only; no peer comparison and no target | not stated |
| First-case on-time start (FCOT) | 4 | first cases | monthly | neurosurgeons at your site | higher is better |
| Duration estimate accuracy | 5 | cases | monthly | subspecialty peers at your site | higher is better |
| Block utilization (only if you have allocated block) | none | | monthly | neurosurgeons at your site | not stated |
| Same-day cancellations you could have prevented | 10 | cases | quarterly | neurosurgeons at your site | lower is better (implied by "not counted against you"; stored `not_stated`, label not rendered) |
| Clinic notes closed within 72 hours | 10 | visits | monthly | neurosurgeons at your site | higher is better |
| Third-next-available appointment | 2 | samples | monthly | subspecialty peers at your site | lower is better |
| Referral-to-visit days (pending confirmation of data source) | 10 | visits | quarterly | subspecialty peers at your site | lower is better |
| Length of stay (O/E) | 10 | admissions | quarterly | subspecialty peers across the system, and Vizient | lower is better |
| 30-day readmission (O/E) | 10 | admissions | quarterly | subspecialty peers across the system, and Vizient | lower is better |
| In-hospital mortality (O/E) | 30 | admissions | rolling 12 months | neurosurgeons across the system, and Vizient | lower is better |
| Unplanned return to the OR within 30 days | 10 | cases | quarterly | subspecialty peers across the system | lower is better |
| Surgical site infection | 20 | cases | quarterly | neurosurgeons across the system | lower is better |
| VTE within 30 days | 20 | cases | quarterly | neurosurgeons across the system | lower is better |
| CSF leak requiring intervention (neurosurgery only) | 10 | cases | quarterly | subspecialty peers across the system | lower is better |
| Unplanned return to ICU (pending confirmation of data source) | 10 | admissions | quarterly | neurosurgeons across the system | lower is better |
| Net promoter score | 10 per month (month hidden) | responses | monthly | neurosurgeons across the system, and the MGB average | higher is better |
| "Provider explained things in a way I could understand" | 10 per month | responses | monthly | neurosurgeons across the system, and the MGB average | higher is better |
| "Provider listened carefully" | 10 per month | responses | monthly | neurosurgeons across the system, and the MGB average | higher is better |
| "Provider showed respect" | 10 per month | responses | monthly | neurosurgeons across the system, and the MGB average | higher is better |
| M&M attendance | none | | fiscal year | no peer comparison; target 8 of 12 | not stated |
| OR turnover time; PACU boarding; room-ready delays | not computed | | | division and site views only | |

Never count-suppressed: OR case volume, New patient visits, Work RVUs — live tracker, Block utilization (only if you have allocated block), M&M attendance (`min_n=None`; F-32 AC 2). Direction: `lower_is_better` where the brief prints "Lower is better"; `higher_is_better` where the metric is a share of a good outcome and the brief prints nothing (first cases on time, cases within tolerance, notes closed within 72 hours, the four top-box survey items); `not_stated` for counts, mirrors, Case mix index and Same-day cancellations you could have prevented (a share of a bad outcome with no label in the brief, kept `not_stated` rather than inferred). Only the "Lower is better" label is ever rendered, and only where the brief prints it; `higher_is_better` renders nothing and drives nothing at v1.

Under `peer_under_five` the surgeon's own value and trend stay published (scope `comparison` only). The literal reading of ground rule 3, hiding the number too, is OQ-11; flipping it is one line in `suppress.py` (write the same kind on scope `value`).

**Builder decision BD-11 (D-17). Wording for spreads withheld by viewer eligibility.**
- The catalogue (F-33) has no key for a spread withheld because the period is month one, the viewer did not attend step zero, or opted out; F-33 AC 5 forbids rendering a string that has no key.
- Options: (a) add three keys at catalogue v1: `spread-month-one` `(spread from month two)` appended to the comparator line (F-34 AC 3); `spread-not-attended` `Peer spread not shown: available after the ground-rules presentation`; `spread-opted-out` `Peer spread not shown: you opted out of the peer spread`; (b) render nothing beyond the peer count for non-attendees and opt-outs.
- Recommended: (a), marked proposed default under OQ-09 and OQ-10.
- Why: "the screen says why instead of showing a blank" applies to the comparison cell as much as the value cell; (b) is a blank.

### Peer groups and the anonymous spread (F-31, F-34, F-35, F-36, F-37, F-39, F-40)

`peers.build(viewer, metric, period, site)` runs after compute and before suppression ranks 7 and 8:

```
V   = effective definition version; if V.peer_rule is None: write no snapshot; tile says "No peer comparison" (F-34 AC 4)
M   = roster_membership rows valid on period.end                                                   F-99 AC 1
cand = M where clinician_id != viewer                                                              viewer excluded
       and (site == viewer's site      if V.peer_scope == 'site')                                 per-site rows
       and (subspecialty == viewer's   if V.peer_by_subspecialty)
       and (opt_out_on is null or opt_out_on > period.end)                                        opt-outs removed (Premise 11)
       # non-attendees stay in cand                                                                F-31 AC 2
clr  = cand whose own current metric_value(metric, period, their site row for site scope, site NULL for system scope)
       exists and has denominator >= V.min_n (min_n None: any computed value clears)              BD-7 for the basis
peer_count = len(cand); peers_clearing = len(clr)
eligible = viewer_eligible(viewer, period)                                                         F-35
rendered = peers_clearing >= 5 and eligible and viewer's own value is not min_n-suppressed
write ledger.peer_group_snapshot(peer_count, peers_clearing_min_n = peers_clearing, eligibility_state, rendered,
                                 spread_values = sorted values of clr if rendered else NULL, peer_median,
                                 viewer_value, viewer_position)
write restricted.peer_group_member (snapshot_id, clinician_id, value, clears_min_n) for every member of cand   audit only
if not eligible:          suppression_decision(kind=spread_not_written, scope=comparison, counts={state})       rank 7
elif peers_clearing < 5:  suppression_decision(kind=peer_under_five, scope=comparison, counts={peers: peer_count, clearing: peers_clearing, needed: 5})   rank 8
```

`viewer_eligible` (F-35): false for every viewer when the run's period is flagged month one (`department_setting.month_one_period`); otherwise true only when the roster row as of the publish date has `step_zero_attended_on` set and `opt_out_on` null. The decision per viewer is stored on the snapshot and copied to the period record (F-35 AC 5).

Comparator to group rule, from the brief's "Compared to" lines (F-31 AC 1):

| Brief comparator | `peer_scope` | `by_subspecialty` | `group_word` |
|---|---|---|---|
| neurosurgeons at your site | site | false | department |
| surgeons in your subspecialty at your site; subspecialty peers at your site | site | true | subspecialty |
| neurosurgeons across the system | system | false | department |
| surgeons in your subspecialty across the system; subspecialty peers across the system | system | true | subspecialty |
| no peer comparison (wRVU, M&M) | none | | |

System-scope groups need a dated roster of neurosurgeons across the system, which the department does not own today (OQ-53); until it exists, `cand` for system-scope metrics is what the roster holds and the reason names the coverage gap (the survey variant, F-40 AC 4; the same key serves quality metrics at M6).

`ledger.peer_group_snapshot` (DDL in the Data model section) is the render log (F-36 AC 2): one row per viewer x metric x period, written whether or not the spread renders, with `peer_count`, `peers_clearing_min_n`, `eligibility_state`, `rendered`, `spread_values` (sorted ascending, no ids, null unless rendered; BD-6), `spread_intervals`, `peer_median`, `viewer_value` and `viewer_position`. Member ids go only to `restricted.peer_group_member` (no grant to `analyst_ro`; `app` never reads it).

Surgeon-facing tables (`ledger.peer_group_snapshot`, `pub.*`, the email) carry counts, the sorted values, the viewer's own value and position, and nothing else. A schema test asserts no clinician identifier other than the viewer's appears in any published spread payload (F-36 AC 1, F-40 AC 5).

Reports:
- `scorecard peers --period 2026-10 --summary` prints, per subspecialty at the site, each group under five in the form `<subspecialty> at <site>: <n> peers clearing min-n for this viewer; needs 5` and which metrics will and will not show a spread; this is the chief's pre-step-zero page (F-37). At M0 the analyst computes the same page by hand from the roster; the first M1 run regenerates it and stores any difference on the period record (F-37 AC 2).
- `scorecard peers --render-report --from 2026-11 --to 2027-01` counts renders by peer-count bucket (5, 6, 7, 8, more than 8) per metric per period; the Premise 5 evidence (F-36 AC 5).

Roster change (F-39): a new dated `roster_membership` row triggers `recompute --roster-change <roster_id>`, which rebuilds snapshots and decisions for periods on or after the change date, writes `caused_by_kind='roster_change'`, uses the `peer-under-five-asof` template, and logs a restatement with category `roster_change` (F-39 AC 4).

Survey groups at M4 (F-40, F-41): the four Bucket 5 definitions declare `peer_scope='system'`, `by_subspecialty=False`, `min_n=10`, `min_n_unit='responses'`, cadence monthly; `clr` is peers with at least 10 responses that month; the spread renders as the bar chart the brief describes with the `spread-count-survey` sentence `<N> neurosurgeons across the system`; under five, the `peer-under-five` template renders with group `department`, scope `across the system`, unit `responses` (F-40 AC 3). Comment text is never in any frame the survey definitions receive (F-28 AC 5).

**Builder decision BD-6 (D-13). How spread values are stored.**
- Options: (a) sorted ascending; (b) a random permutation per snapshot.
- Recommended: (a).
- Why: the M1 plain-text form already prints values sorted (F-46 AC 6); a sorted list carries no member order and is the same on every re-render, so two artifacts for the same period cannot be diffed to leak order. "Shuffled" in the adopted architecture is satisfied: the storage order is not the roster order.

**Builder decision BD-7 (D-12). Which basis decides whether a peer "clears min-n".**
- Options: (a) that peer's adjudicated value where one exists, else logged; (b) always logged.
- Recommended: (a).
- Why: after a sustained re-credit the receiving surgeon's adjudicated list is the one both surgeons see; counting clearance on it keeps the spread consistent with the tiles (F-29 AC 5). The reconciliation gate, not the peer group, is where logged must match periop.

### Comparison targets (F-34, F-22, F-24, F-28, F-77)

`targets.build()` writes one `ledger.comparison_target` row per (clinician, metric, period, site, target kind) named in the definition's `targets`. The peer spread is the snapshot above; the other three are values from feeds or from the clinician's own history.

| Target kind | Metrics (brief) | Where the value comes from | Stored as |
|---|---|---|---|
| `peer_spread` (site or system) | every metric with a "Compared to" peer line | `peer_group_snapshot` | `reference_ref = snapshot_id` |
| `vizient` | Case mix index; Length of stay (O/E); 30-day readmission (O/E); In-hospital mortality (O/E) | the Vizient extract's comparison value for the period, with `model_version` and `source_as_of` (F-97) | `value`, `model_version`, `source_as_of` |
| `mgb_average` | the four Bucket 5 measures | the survey feed's MGB average per measure per month (F-28 AC 4; scope is OQ-44) | `value`, `source_as_of` |
| `self_last_year` | Work RVUs — live tracker | the clinician's own `metric_value` for the same month and FYTD point one fiscal year earlier (F-77 AC 1) | `reference_ref = prior metric_value_id`, `value` |

What "and Vizient" means as a comparator (a cohort benchmark O/E carried in the extract, or the 1.0 reference the brief explains) is not in the brief. Recorded as **OQ-60 (new)**. Proposed default: store the extract's benchmark value when the extract carries one; otherwise the tile shows only the `1.0 means exactly as expected; below 1.0 is better` sentence (F-24 AC 6) and no Vizient point.

For O/E and rate metrics, once the peer median exists, `targets.py` sets `metric_value.no_evidence_of_diff = interval_low <= peer_median <= interval_high` (F-24 AC 5); the tile renders `no evidence of difference from peers` from that flag. The interval on every value and trend point is computed in `intervals.py` by the definition's `interval_method`.

**Builder decision BD-8 (D-14). Interval methods (OQ-28 says a build choice to record).**
- Options per kind: rates: Wilson 95% or exact binomial; count O/E (readmissions, deaths): exact Poisson 95% on observed with expected as the divisor; LOS O/E (days, not counts): percentile bootstrap over admissions or a lognormal approximation.
- Recommended: `wilson_95` for rates; `oe_exact_poisson_95` for readmission and mortality O/E (reproduces F-24 AC 7: observed 1, expected 0.6 gives 0.04 to 9.3); `bootstrap_95` (1000 resamples, seeded from the run id so it is reproducible) for Length of stay (O/E).
- Why: each is standard, has no fitted parameters, and is stated on the definition page by name. A Poisson interval on summed days would be wrong for LOS.

```sql
-- scorecard/ledger/migrations/NNNN_comparison_target.sql
CREATE TABLE ledger.comparison_target (
  target_id            bigserial PRIMARY KEY,
  clinician_id         bigint NOT NULL REFERENCES ledger.clinician,
  metric_key           text NOT NULL,
  period_label         text NOT NULL,
  site                 text,
  target_kind          text NOT NULL CHECK (target_kind IN ('peer_spread','vizient','mgb_average','self_last_year')),
  value                numeric,
  reference_ref        text,                               -- snapshot_id or prior metric_value_id
  source_feed_load_id  bigint REFERENCES ledger.feed_load,
  source_as_of         date,
  model_version        text,
  run_id               bigint NOT NULL REFERENCES ledger.run,
  is_current           boolean NOT NULL DEFAULT true
);
CREATE UNIQUE INDEX comparison_target_current_uq ON ledger.comparison_target
  (clinician_id, metric_key, period_label, coalesce(site, ''), target_kind) WHERE is_current;
```

### Trend series with version boundaries and restatement markers (F-43, F-47, F-96)

`trend.series(clinician, metric, site, basis)` is a view over current `metric_value` rows plus the `suppression_decision` rows for periods with no value, ordered by `period_start`, with markers derived, never typed:

| Field on each trend point | Derived from |
|---|---|
| `period_label`, `value`, `numerator`, `denominator`, `interval_low`, `interval_high` | `metric_value` (adjudicated row if one exists and differs, else logged; the logged value rides along as `logged_value` for hover, F-47 AC 3) |
| `restated` | `restates_metric_value_id IS NOT NULL` |
| `version_boundary` | `definition_version_id` differs from the previous point's |
| `history_from` | the first `period_label` for which the metric's feed has a load; the tile prints `history from <date>` when the window is longer than the history (F-43 AC 2) |
| `gap_reason` | the `value`-scope decision text for a period with no value (a hidden survey month is a gap with its reason, never a zero, F-48 AC 2) |

Window per cadence: up to 12 monthly points; quarterly points for quarterly metrics; four rolling-12 points (one per quarter close) for In-hospital mortality (O/E); for Work RVUs — live tracker the monthly bars of the current fiscal year with the `self_last_year` targets as the ghosted series and the prior snapshot per month from the wRVU load (F-77 AC 2); for M&M attendance cumulative attended against cumulative held per month of the fiscal year (F-74 AC 5, OQ-25). No point is interpolated or zero-filled.

```sql
-- scorecard/ledger/migrations/NNNN_restatement.sql
CREATE TABLE ledger.restatement (
  restatement_id        bigserial PRIMARY KEY,
  metric_value_id_old   bigint NOT NULL REFERENCES ledger.metric_value,
  metric_value_id_new   bigint NOT NULL REFERENCES ledger.metric_value,
  old_value             numeric, new_value numeric,
  old_definition_version text NOT NULL, new_definition_version text NOT NULL,
  reason_category       text NOT NULL CHECK (reason_category IN ('dispute_decision','late_record','source_corrected',
                          'definition_version','model_refresh','billing_restatement','source_registered','roster_change')),
                                                             -- the eight categories of F-96 AC 1
  cause_ref             text,                              -- dispute id, feed_load id, roster id, definition_version_id
  actor                 text NOT NULL,
  note                  text,
  at                    timestamptz NOT NULL DEFAULT now()
);
-- Written only by recompute.py and restate; an INSERT here is the only way a current metric_value row is replaced.
```

### The reconciliation gate against periop's report (F-81)

Periop's surgeon-level monthly report is a feed like any other: `feed_load(feed_key='periop_report')` typed into `src.periop_report` (`clinician_raw`, `clinician_id`, `metric_key`, `period_start`, `numerator`, `denominator`, `value`; DDL in the Data model section). `reconcile.run(period)` then compares every metric whose definition declares `reconcile_to`:

```
for each clinician on the roster as-of the period, each reconciled metric:
   theirs = src.periop_report row for (clinician, metric, period); absent -> status not_reconciled
            ("not reconciled: periop does not report", F-81 AC 1; OQ-54)
   ours_logged      = current metric_value(basis=logged)
   ours_adjudicated = current metric_value(basis=adjudicated) if it exists
   compare(ours_logged, theirs):
       equal (BD-9)                                  -> match
       differs, a definition_delta covers (metric, version, period) -> explained (delta_id)
       differs otherwise                             -> unexplained: the run stops before publish
   compare(ours_adjudicated, theirs) when present:
       differs only by records with a sustained credited_clinician override naming the case and decision -> explained (dispute ids)
       differs otherwise and no delta                -> unexplained
   a delay_reason_code override is never an explanation (it does not change the count, F-81 AC 3)
write reconciliation_result rows; gate passes when no row is unexplained
```

`ledger.definition_delta` (`delta_ref` such as `DELTA-0001`, `definition_version_id`, `kind`, `applies_from_period`, `applies_to_period`, `delta_text`, `author`) and `ledger.reconciliation_result` (per run, clinician, metric, period and basis: ours, periop's, `status` in `match`, `explained`, `unexplained`, `not_reconciled`, `explained_by_kind`, `delta_id`, `dispute_ids`) are defined in the Data model section.

CLI: `scorecard reconcile --period 2026-10` (rerun the gate alone and print the per-surgeon table: ours, periop's, difference, explanation); `scorecard delta add --metric fcot --version fcot@v1 --kind ours_vs_periop_report --from 2026-10 --author "<name>" --text "<why>"` (a delta cannot be created without an author, F-81 AC 4; creating one inside a `close` is refused so the analyst has to look at the difference first).

The delta registry is also where BD-3's difference between the brief's assumed values and periop's confirmed values is written when `v2` is registered (F-100 AC 5, F-12 AC 2).

**Builder decision BD-9 (D-15). What counts as equal.**
- Options: (a) numerator and denominator equal as integers when periop reports both, and value equal after rounding to periop's printed precision when it reports only a percentage; (b) value within an absolute tolerance.
- Recommended: (a).
- Why: the wedge's claim is that the numbers are the same number; a tolerance hides exactly the one-case attribution differences the gate exists to surface.

### Recompute after a dispute, version-scoped recompute and restatement (F-29, F-30, F-96)

Three entry points, one function (`recompute.run(scope, pin_version=None, reason_category, cause_ref)`):

| Command | Scope recomputed | Version used | Restatement category |
|---|---|---|---|
| `scorecard recompute --dispute D-0014` | every (clinician, metric, period) the disputed record feeds, for the original clinician and the receiving clinician on a re-credit; every viewer whose peer group contains either | the version stamped on the original number | `dispute_decision` |
| `scorecard recompute --version fcot@v2 --from 2027-01` | the metrics the new version changed, for periods on or after its `effective_from_period` | the new version | `definition_version` |
| `scorecard recompute --roster-change <roster_id>` | peer snapshots and comparison decisions for periods on or after the change date; M&M for the clinician on a leave change | unchanged | `roster_change` |
| `scorecard restate --metric los_oe --period 2027-Q1 --to-version los_oe@v2 --reason definition_version --note "..."` | one metric and period, explicitly | the pinned version | as given; refused without a reason category (F-96 AC 3) |
| `scorecard recompute --source-registered referral_to_visit --from 2027-Q3` | the newly computable metric from its effective period | effective version | `source_registered` |

Steps for `--dispute D-0014` (same day as the decision, F-29 AC 2; the Dispute workflow section's `decide` calls it):

```
1. read the decision: outcome, field, record, original clinician, receiver (if credited_clinician), decided_at
2. if outcome = not_sustained or definition_question: nothing recomputed; return
3. build frames for basis=adjudicated for each (clinician, period, metric) the record feeds (metric_keys_affected on the dispute);
   the override is already active, so frames.py applies it
4. compute as in close [8]; new metric_value rows restate the old ones (same definition_version_id)
   - delay_reason_code override: row_detail changes (delay_label, corrected reason); numerator and denominator unchanged;
     the new row equals the old on value, so the tile shows one value and the row text changes (F-29 AC 3)
   - credited_clinician override: the record leaves the original's adjudicated frame and enters the receiver's;
     both get adjudicated rows; as logged stays periop's crediting until periop corrects it (F-29 AC 4, F-07)
   - cancellation_reason_code override: the adjudicated numerator can change (OQ-13); as logged still matches periop
5. re-run suppression for the affected cells; any cell that crossed min-n gets the dispute clause and caused_by=D-0014 (F-38)
6. rebuild peer snapshots for every viewer whose group contains an affected clinician, same period; log renders (F-29 AC 5)
7. write restatement rows (category dispute_decision, cause_ref D-0014); the trend point for the period carries restated=true
8. re-run the reconciliation gate for the period: the re-credit is an explained delta named by D-0014 (F-81 AC 3)
9. hand the affected tiles and rows to the Delivery surfaces section for the one-record decision email (F-93)
```

While a dispute is open nothing is recomputed and the published number is unchanged (F-29 AC 1, OQ-18). After periop re-ingests a corrected field, the load retires the override (`retired_by_feed_load_id`), the next close computes logged = adjudicated, the tile returns to one value, and the restatement chain keeps the history (F-06 AC 2, F-47 AC 4).

Version-scoped recompute (F-30): only the metrics whose definition changed are touched (F-30 AC 1); periods before `effective_from_period` keep their stamps unless `restate` is run for them explicitly (F-30 AC 2, OQ-35); the suppression engine and the reconciliation gate re-run for the affected periods before republish (F-30 AC 3); for Length of stay (O/E) the `super-long boarder` exclusion count is recomputed and stored under the new threshold (F-30 AC 4).

### "Pending confirmation of data source", "not in this release" and "not applicable" (F-44, F-103, F-18, F-109, F-110, F-104)

Four states, four mechanisms, all decided in `availability.py` before compute and stored as `suppression_decision` kinds so the no-blank gate holds:

| State | Mechanism | Metrics at M1 | Leaves the state when |
|---|---|---|---|
| Data source pending confirmation | `ledger.source_registry` row with `status='pending_source'` and no system, extract or join key; the definition file exists and is registered (F-109 AC 1) but `close` never calls its functions | Referral-to-visit days (pending confirmation of data source); Unplanned return to ICU (pending confirmation of data source) | `scorecard source register --metric referral_to_visit --system <..> --extract <..> --join-key <..> --rule "referral received date to the resulting visit's rendering provider" --from 2027-Q3` writes `status='registered', effective_from_period`; the metric computes from that period; earlier periods keep the pending text unless restated (F-103 AC 2) |
| Not in this release | `source_registry` row with `status='not_in_release'` and the feed name the reason needs | Block utilization (only if you have allocated block) (F-18 AC 1) | the block schedule owner is named and the extract registered (M3) |
| Not applicable | the definition's `applicability(clinician_ctx)` returns a condition string for this clinician and period; the engine writes `not_applicable` with `Not applicable: <condition>` and computes nothing for that clinician | Block utilization once registered: `no allocated block this month` when the clinician holds no allocated minutes (F-18 AC 3; OQ-34) | the condition no longer holds |
| Not computed in this cycle | `availability='division_site_only'`; no per-clinician function exists; the period record lists the three measures (F-104 AC 2) | OR turnover time; PACU boarding; room-ready delays | never on the individual view (OQ-52) |

`ledger.source_registry` (DDL in the Data model section) carries `status`, `feed_key`, `needs_text` (the feed name the `not-in-release` reason prints), `system_name`, `extract_name`, `join_key`, `attribution_rule_id`, `attribution_rule_text`, `effective_from_period` and the derived `effective_from`; a `registered` row without a system, extract, join key, rule text and effective period is refused by its CHECK (F-103 AC 1).

The metric keeps the brief's name, including its "(pending confirmation of data source)" marker, until the owner issues a new brief version (F-109, F-110). The definition page still shows the brief's text, cadence, min-n and comparator while pending (F-44 AC 4).

### CLI summary for this section

| Command | Flags | Writes | Fails on |
|---|---|---|---|
| `scorecard register` | `--check` (report only) | `metric_definition_version` | changed hash for an existing label; overlapping effective windows; label and file name differ |
| `scorecard definitions list` / `diff fcot v1 v2` / `page fcot@v1` | | (prints; `page` renders the definition text the email and app use, F-50) | |
| `scorecard close --period 2026-10` | `--dry-run`, `--allow-quality`, `--allow-survey`, `--accept-partial <feed> --note "..."`, `--reconcile-skip --note "..."`, `--restate` | `run`, `metric_value(+record)`, `suppression_decision`, `peer_group_snapshot`, `comparison_target`, `reconciliation_result` | any gate; period not closed; no definition version for a computed metric; unresolved attribution exception |
| `scorecard compute --period 2026-10 --metric fcot --clinician 42` | `--basis adjudicated` | nothing (prints the frame, rows and aggregate) | |
| `scorecard reconcile --period 2026-10` | | `reconciliation_result` | unexplained delta |
| `scorecard delta add` | `--metric --version --kind --from --author --text` | `definition_delta` | missing author; called inside `close` |
| `scorecard suppress --period 2026-10 --report` | | (prints the surgeon-by-metric grid of states and reasons, J4.6) | any blank reason |
| `scorecard peers --period 2026-10 --summary` / `--render-report --from --to` | | (prints; counts only) | |
| `scorecard recompute` | `--dispute D-0014` / `--version fcot@v2 --from 2027-01` / `--roster-change <id>` / `--source-registered <metric> --from` | new `metric_value` rows, `suppression_decision`, `peer_group_snapshot`, `restatement`, `reconciliation_result` | reconciliation after recompute |
| `scorecard restate` | `--metric --period --to-version --reason --note` | same as recompute for one cell | missing reason category |
| `scorecard source register` | `--metric --system --extract --join-key --rule --from` | `source_registry` | missing join key or rule (F-103 AC 1) |

### Tests that pin the contract

| Test | Asserts | Feature |
|---|---|---|
| `tests/definitions/test_fcot_v1.py` | golden numerator, denominator, record ids, `row_detail` for the synthetic October fixture: 5 of 7; the case on the 14th is late with reason `anesthesia` and no label while the set is unsigned; a blank reason renders `(blank)` | F-15 AC 1, 5, 6; F-101 AC 3 |
| `tests/definitions/test_duration_v1.py` | booked 60 / actual 85 counted (30-minute test); booked 200 / actual 245 not counted; `test_applied` stored | F-16 AC 1, 2 |
| `tests/definitions/test_cancel_v1.py` | refuses to compute while the cancellation set is `pending_signoff`; blank and Other outside the set | F-17 AC 5; F-102 AC 2, 3 |
| `tests/definitions/test_mortality_v1.py` | observed 1, expected 0.6: value 1.7, interval 0.04 to 9.3 | F-24 AC 7 |
| `tests/definitions/test_mm_v1.py` | a=6,h=9,r=3 on pace; a=3 cannot reach; leave k=2 gives S'=10, T'=7 and the worked off-pace case | F-75 AC 2, 3 |
| `tests/engine/test_registry_refusal.py` | editing a registered file is refused with exit 2 and nothing written; same hash is a no-op | F-13 AC 2 |
| `tests/engine/test_purity.py` | no definition function imports I/O or references the comments table; altering comment text leaves every survey value unchanged | F-12 AC 5; F-28 AC 5 |
| `tests/engine/test_invariants.py` | row count == denominator for every value; every (clinician, metric, period, scope) has a value or a decision; a fixture that breaks either fails the run before publish | F-51 AC 2; F-32 AC 6 |
| `tests/engine/test_suppression_order.py` | rank order; exact strings for every catalogue key; unfilled placeholder fails | F-32 AC 3 to 5; F-33 AC 1, 2 |
| `tests/engine/test_peers.py` | viewer excluded; opt-out removed; non-attendee kept in denominators and gets no spread; two-site surgeon gets two rows; 4 clearing suppresses, 5 renders; month one renders nothing; payload carries no peer id | F-31 AC 2 to 4; F-35 AC 1 to 3; F-36 AC 1, 3 |
| `tests/engine/test_same_function_everywhere.py` | the email generator, the app view and the gate get identical values from one call for one surgeon and month | F-12 AC 4 |
| `tests/engine/test_recompute.py` | sustained delay-reason override leaves 6 of 10; sustained re-credit gives 6 of 10 logged and 6 of 9 adjudicated for the original and moves the case to the receiver; min-n re-checked; dispute clause appended when a cell crosses; restatement rows written | F-29 AC 3 to 6; F-38 AC 1 |
| `tests/engine/test_reconcile.py` | an unexplained delta stops the run; a delta with an author explains; a re-credit dispute explains the adjudicated basis only; a delay-reason override explains nothing | F-81 AC 2 to 4 |
| `tests/engine/test_availability.py` | pending metrics compute for no one and render the exact text; registering a source computes from its effective period only; `not_applicable` for a clinician with zero allocated minutes | F-44 AC 4; F-103 AC 2; F-18 AC 3 |

### Builder decisions recorded in this section

| ID | Decision | Recommended |
|---|---|---|
| BD-1 (D-07) | Definition file layout | one Python file per metric version, hash of the file |
| BD-2 (D-08) | What the hash covers | raw file bytes |
| BD-3 (D-09) | What `fcot@v1` carries before periop confirms | brief's assumed values at M0; periop's values as `v2` (or as `v1` if confirmed first); the gate blocks publish either way until the numbers match |
| BD-4 (D-10) | Where signed reason sets live | as `Param(status='pending_signoff')` inside the definition version |
| BD-5 (D-11) | Computing the adjudicated basis | only where an active override touches the cell |
| BD-6 (D-13) | Spread value storage | sorted ascending, no ids |
| BD-7 (D-12) | Basis for a peer's min-n clearance | adjudicated where present, else logged |
| BD-8 (D-14) | Interval methods | Wilson 95% for rates; exact Poisson 95% for count O/E; seeded bootstrap 95% for Length of stay (O/E) |
| BD-9 (D-15) | Reconciliation equality | numerator and denominator exact; value at periop's printed precision when that is all periop reports |
| BD-10 (D-16) | Rolling-12 computation timing | quarter-close months only |
| BD-11 (D-17) | Wording for spreads withheld by viewer eligibility | three new catalogue keys, proposed default under OQ-09 and OQ-10 |

New open questions raised here for the brief's owner: OQ-59 (fiscal year start month; calendar or fiscal quarters) and OQ-60 (what the "Vizient" comparator value is).

### Feature mapping

| F-xx | Where it lives | Notes |
|---|---|---|
| F-12 | `definitions/_contract.py`; `definitions/<metric>/v<N>.py`; `engine/compute.py`; `engine/frames.py` | Data fields plus `in_scope`, `exclusion_reason`, `counted`, `row_detail`, `aggregate`, `applicability`; `test_purity.py`, `test_same_function_everywhere.py` |
| F-13 | `engine/registry.py`; `ledger.metric_definition_version`; `ledger.definition_open_item` | `register()` refusal rule; effective-window check; `diff_from_prior`; approver field empty pending OQ-35 |
| F-14 | `definitions/or_case_volume/v1.py` (`Kind.COUNT`, `min_n=None`) | Never count-suppressed; peer count on the tile from `peer_group_snapshot.peer_count` |
| F-15 | `definitions/fcot/v1.py` (worked example); `v2.py` on confirmation; `definition_delta` for the brief-to-institutional difference | Delay label from the `pending_signoff` param; count never moves on a delay-reason override |
| F-16 | `definitions/duration_accuracy/v1.py` | `row_detail.test_applied` records which tolerance applied; named fields as params (OQ-39) |
| F-17 | `definitions/same_day_cancel/v1.py`; cadence `quarterly`; `interim` state | Refuses to compute while the cancellation set is `pending_signoff` (F-102) |
| F-18 | `definitions/block_utilization/v1.py`; `applicability()`; `ledger.source_registry` (`not_in_release` then `registered`) | `not_applicable` decision with `Not applicable: no allocated block this month` |
| F-19 | `definitions/los_oe/v1.py` (sketch); `exclusion_reason` super-long boarder; `bootstrap_95` | Excluded count on the tile from `metric_value.exclusions`; `governance_flag='allow_quality'` |
| F-20 | `definitions/readmit_oe/v1.py` | `oe_exact_poisson_95`; OQ-29 recorded on the definition page as a param note |
| F-21 | `definitions/mortality_oe/v1.py`; cadence `rolling_12` (BD-10) | `Not shown: <n> admissions in the last 12 months; needs at least 30` via the `min-n` template with period word `12 months` |
| F-22 | `definitions/cmi/v1.py` (`aggregate` returns the mean) | System-scope group; not withheld by an at-site group under five |
| F-23 | `definitions/return_to_or`, `ssi`, `vte`, `csf_leak` `v1.py`; `risk_model=None` | "self-reported, unadjusted" label derived from `risk_model`; SSI window param (30, 90 with implant) |
| F-24 | `engine/intervals.py`; `metric_value.interval_*`, `no_evidence_of_diff`; `peer_group_snapshot.spread_intervals`, `peer_median` | Labels derived from `risk_model`; BD-8 |
| F-25 | `definitions/third_next/v1.py` (`Kind.MEDIAN`) | Samples as `third_next_sample` records (C-11); row count equals sample count |
| F-26 | `definitions/new_patient_visits/v1.py` (`Kind.COUNT`) | Never count-suppressed |
| F-27 | `definitions/notes_72h/v1.py` | 72-hour window-at-close rule as a param (OQ-24) |
| F-28 | `definitions/nps`, `explained`, `listened`, `respect` `v1.py`; `aggregations=['period','year_average']` | Comment text never in the frame; MGB average as a `comparison_target` |
| F-29 | `engine/recompute.py --dispute`; `ledger.restatement`; `frames.py` override application | BD-5, BD-7 |
| F-30 | `engine/recompute.py --version`; `registry.effective_version()` | Earlier periods frozen unless `restate` |
| F-109 | `definitions/referral_to_visit/v1.py`; `source_registry` pending row; `recompute --source-registered` | Exclusion `no reliable received date` counted and shown |
| F-110 | `definitions/icu_return/v1.py`; proxy window param; `risk_model=None` | Unadjusted label; ADT source as-of |
| F-31 | `engine/peers.py`; `ledger.peer_group_snapshot`; `restricted.peer_group_member` | Comparator-to-rule table; per-site rows; `peer_count` and `peers_clearing_min_n` |
| F-32 | `engine/suppress.py`; `ledger.suppression_decision` (CHECK constraint is the 100%-reason gate) | Min-n table from the definition versions; fixed order |
| F-33 | `definitions/_catalogue.py`; `engine/reasons.py`; `ledger.reason_catalogue` | Versioned; definition version pins the catalogue version; unfilled placeholder fails; BD-11 adds three keys |
| F-34 | `engine/targets.py`; `comparator_text` on the definition; `peer_group_snapshot.peer_count` | Brief wording verbatim; "No peer comparison" when `peer_rule` is None |
| F-35 | `peers.viewer_eligible()`; `peer_group_snapshot.eligibility_state`; `department_setting.month_one_period` | Copied to the period record |
| F-36 | `ledger.peer_group_snapshot` (the render log); `scorecard peers --render-report` | Values only in surgeon-facing rows; schema test on payloads |
| F-37 | `scorecard peers --summary` | Hand-computed at M0, regenerated at the first M1 run, difference stored on the period record |
| F-38 | `recompute.py` step 5; `suppression_decision.caused_by_kind`, `caused_by_ref`; `dispute-hidden` / `dispute-shown` templates | Appended only by recompute |
| F-39 | `recompute.py --roster-change`; `peer-under-five-asof` template; restatement category `roster_change` | M&M leave handling calls the `pace` definition |
| F-40 | Bucket 5 definitions with `peer_scope='system'`, `min_n=10 responses`; `spread-count-survey`; `peer-coverage-gap` | OQ-45 coverage gap |
| F-41 | `min_n` kind with the `hidden-month` template; `trend.gap_reason` | Hidden month stays hidden with the same text in later periods |
| F-43 (shared: Scorecard views) | `engine/trend.py`; `trend.series()` | Markers derived; `history from` |
| F-44 (shared: Scorecard views) | `engine/availability.py`; `source_registry`; decision kinds 1 to 3 | Distinct stored codes |
| F-45 (shared: Scorecard views) | `engine/periods.py`; `interim` decision kind | Running denominator in `counts` |
| F-47 (shared: Scorecard views) | `trend.series()` adjudicated-with-logged-on-hover; BD-5 display rule | One value when equal or converged |
| F-51 (shared: Drill-down) | `ledger.metric_value` provenance columns; `metric_value_record`; the row-count invariant in `close.py` | Version stamp `definition_version_id` on value and records |
| F-80 (shared: Period close) | `close.py` stage [2]; `not_computable` with `not-computable` | Field-to-metric map from each definition's `record_columns` and function inputs |
| F-81 (shared: Period close) | `engine/reconcile.py`; `ledger.definition_delta`; `ledger.reconciliation_result`; `src.periop_report` | BD-9 |
| F-82 (shared: Period close) | `close.py` stage [6] and gate [13]; `feed_missing` with `feed-not-received`; `--accept-partial` | Never a zero: no `metric_value` row is written for a missing feed |
| F-84 (shared: Period close) | `periods.py` close-date check in `close.py` | Refuses a period whose close date is after the run date |
| F-96 (shared: Audit) | `ledger.restatement`; `metric_value.restates_metric_value_id`, `is_current`; `trend.restated`, `version_boundary` | Only `recompute.py` and `restate` write it |
| F-100 (shared: Admin) | `ledger.metric_definition_version` plus view `ledger.v_metric_configuration` | BD-4: no second configuration store |
| F-101 (shared: Admin) | `Param('surgeon_attributable_delay_reasons', status='pending_signoff')` in `fcot/v<N>.py`, mirrored by `ledger.reason_set_version` for the sign-off record; `detail.delay_label` | Never changes the count (`test_fcot_v1.py`) |
| F-102 (shared: Admin) | `Param('surgeon_attributable_cancellation_reasons', status='pending_signoff')` in `same_day_cancel/v<N>.py`; `counted` refuses while unsigned | Blank and Other outside the set unless signed in |
| F-103 (shared: Admin) | `ledger.source_registry`; `scorecard source register`; `recompute --source-registered` | Present from the first M1 run with the three pending rows |
| F-104 (shared: Division and site) | `availability='division_site_only'`; `not_computed` decision; three registered definitions with no functions | Page text is the Delivery surfaces section's; the state is stored here |

Counts: 32 features in the two owned areas (F-12 to F-30, F-109, F-110; F-31 to F-41) plus 15 shared features this section implements part of, 47 mapped.

## Dispute workflow, overrides, and audit

The dispute path is the product (design doc, Problem Statement; Premise 6). This section designs it end to end: a dispute is one row in `ledger.dispute` pinned to one `ledger.record`, its life is an append-only chain of `ledger.dispute_event` rows, its only effect on a number is a `ledger.record_override` row, and every write and every view lands in `ledger.audit_log`, which nothing can update or delete. The tables are defined in the Data model section ("Disputes" and "Run, reconciliation, delivery, audit"); this section cites their columns and does not redefine them. Dispute ids are `dispute_ref` values of the form `D-0014`; reply ids are `reply_ref` values of the form `R-0031`. What is new here: the state machine and who may drive each transition, the routing predicates as code, the four outcomes and their writes, the recompute path, the two intake surfaces (M1 email plus CLI; M2 app), the 14-day clock, and the audit design.

Ground rule 2 of the brief is the contract: "A surgeon can dispute any record credited to them. Disputes go to the division chief; if the chief is involved, they go to the chair." The brief does not define "involved", does not name a second outcome, and does not give a route for definition disagreements. Where this section fills those gaps it cites the catalogue's proposed default and its OQ number, or records a Builder decision.

Module layout for this subsystem (extends the tree in the Data model section):

```
scorecard/
  disputes/
    state.py        STATES, TRANSITIONS, may_transition(actor_role, from, to); pure, tested
    route.py        route(dispute, roster_as_of, participants, settings) -> Route; pure, tested
    file.py         file_dispute(...)      service function: validate, insert dispute + events, route
    decide.py       decide(...)            service function: validate, events, override, correction_request
    recompute.py    thin wrapper over engine/recompute.py for --dispute
    rowtext.py      row_state_text(dispute, override, correction_request) -> str   (F-59 catalogue)
    notices.py      effect_notice(metric_version, field) -> str                     (F-56)
    provenance.py   provenance_panel(record) -> dict                                (F-52)
    queue.py        open_queue(adjudicator), over_days(n), trust_report(period)     (F-60, F-98, F-112)
    intake.py       M1: reply_log entry, ack rendering, adjudicator email rendering (F-57, F-92, F-111)
  audit.py          scorecard audit --clinician --period; log_view(); allowlist test for details
  web/              M2 only (Builder decision 1, D-05): routes, authorization matrix, templates (Delivery surfaces section)
```

The service functions in `disputes/` take a psycopg connection and plain arguments. The CLI calls them at M1; the app calls the same functions at M2. Neither surface contains dispute logic of its own.

### The dispute state machine

One dispute has exactly one current `state`, denormalised onto `ledger.dispute` by an AFTER INSERT trigger on `dispute_event` (Data model section). The legal transitions and the actor allowed to make each one live in `scorecard/disputes/state.py` and are enforced by `may_transition()` before any event is inserted. The database enforces the enum; the service function enforces legality and actor.

```
   (start)  surgeon on the web (M2)  |  analyst entering the surgeon's reply (M1)
              |
              v
        +-----------+  withdraw: disputant (M2) or analyst on the disputant's reply (M1)
        |   filed   |----------------------------------------------------> [withdrawn]
        +-----------+                    (allowed from filed and from any with_* state)
              |
              |  route.py, same transaction as filing. System only.
              |  The analyst cannot pick a route; a wrong route is a roster fix (F-87).
              |
   +----------+----------------------------+-------------------------------+
   | no test fired                         | test a, b or c fired          | survey record, setting
   |                                       |                               | survey_route.direct_leader
   |                                       |                               | = true, leader <> chief
   v                                       v                               v
+------------+                       +------------+               +--------------------+
| with_chief |                       | with_chair |               | with_direct_leader |
+------------+                       +------------+               +--------------------+
   division chief decides                chair decides               direct leader decides
   (M2: /disputes/<dispute_id>/decide)   (same)                      (same)
   (M1: reply; analyst transcribes)
   |                                       |                               |
   +---------------------------------------+-------------------------------+
                                           |
        +-------------------+--------------+---------------+--------------------------+
        v                   v                              v                          v
+---------------------+ +----------------------------+ +---------------+ +----------------------+
| sustained_annotated | | sustained_source_corrected | | not_sustained | | definition_question  |
+---------------------+ +----------------------------+ +---------------+ +----------------------+
  record_override         record_override                note on row       definition_open_item
  correction_request      correction_request             no recompute      no recompute
  recompute               recompute                           |            notify definitions owner
        |                        |                            | disputant re-files ONCE
        |                        |                            | (new dispute, refile_of_dispute_id;
        |                        |                            |  OQ-16)
        +-----------+------------+                            v
                    |                                   [ new dispute: filed ]
                    v
        +-----------------------+
        | correction_requested  |   publisher, when the feed-owner list carrying this
        +-----------------------+   request is sent (scorecard overrides --month --send)
                    |
                    v
        +-----------------------+
        | correction_confirmed  |   loader (loaders/convergence.py), when a later feed_load
        +-----------------------+   re-ingests the adjudicated value; override retires, history kept

Held, not a state: filed with routing_test_fired = 'route_undefined' (chair disputes a record of
their own, or the disputant has no chief mapped). Stays on the F-112 checklist until OQ-15 is
answered or the roster is fixed. No adjudicator can open it.

Side link, not a transition: a sustained re-credit lets the receiving clinician file a NEW dispute
on the same record with linked_dispute_id = this one (F-62 AC 3). Both rows show each other's id.
```

Rules the diagram encodes:

| Rule | Where enforced | Source |
|---|---|---|
| A dispute is pinned to one record; there is no state or column for a metric, tile, spread or period. | `dispute.record_id not null`, invariant I12 | F-55 AC 2 |
| Routing happens once, at filing, from data. There is no manual escalation and no "send to chair" button. | `route.py` runs inside `file_dispute()`; no service function changes `routed_to` afterwards | F-58 AC 3, J2.4 |
| A chief change re-routes disputes filed on or after the change date only; open disputes keep their adjudicator. | `roster_as_of(dispute.filed_at)` | F-87 AC 3, OQ-15 |
| Only the adjudicator named on the row may decide it; a chief cannot decide a dispute that tripped a test because such a dispute was never routed to them. | `decide()` checks `actor == adjudicator_clinician_id` (M2) or that the decision reply came from the adjudicator's address (M1, `decision_reply_id` -> `reply_log.sender_kind = 'adjudicator'`) | F-58 AC 3, F-86 AC 2 |
| A decision is immutable. A later change is a new event, never an UPDATE. | `dispute_event_immutable` trigger; `decide()` refuses when `decision is not null` | F-61 AC 4 |
| A denial can be re-filed once with new evidence; a third filing is refused; there is no appeal to the chair on disagreement. | `file_dispute()` counts prior disputes by the same filer on the record; refuses at two | F-62 AC 2, AC 4; OQ-16 |
| While a dispute is open the published number, suppression status and spread do not change. | No write to `metric_value` before a `sustained_*` event | F-29 AC 1, OQ-18 |
| Withdrawal is allowed only before a decision. | `may_transition()` | Builder decision 5 |

Actor vocabulary used by `may_transition()` and written to `dispute_event.actor_role`: `surgeon`, `chief`, `chair`, `direct_leader`, `analyst` (M1 transcription only; the event note records `on behalf of <surgeon>` or `transcribed from reply <message_id>`), `system` (routing), `publisher`, `loader`.

pytest coverage in `tests/disputes/test_state.py`: every legal transition once; every illegal (from, to, actor) triple from the full product refused; the trigger-maintained `dispute.state` equals the last event after each step; a third filing refused; decide-after-decide refused.

### Routing tests as executable predicates

`scorecard/disputes/route.py` is a pure function over the dated roster, `ledger.record_participant`, `ledger.department_setting` and the dispute being filed. It is called inside `file_dispute()`; at M1 `scorecard dispute file` prints its result so the analyst never applies the tests by hand (the J2 failure mode F-57 AC 4 guards against).

```python
# scorecard/disputes/route.py  (sketch)
from dataclasses import dataclass

@dataclass(frozen=True)
class Route:
    routed_to: str                 # 'chief' | 'chair' | 'direct_leader'
    adjudicator_clinician_id: int | None
    routing_test_fired: str        # 'none' | 'a_disputant_is_chief' | 'b_recredit_to_chief'
                                   # | 'c_chief_on_record' | 'route_undefined'
    tests: dict[str, bool]         # every test evaluated, stored on the row (F-58 AC 2)

def route(d, roster_as_of, participants_of, settings) -> Route:
    r        = roster_as_of(d.filed_at.date())          # F-58 AC 1: roster as of the filed date
    filer    = r.get(d.filed_by_clinician_id)
    chair_id = settings.chair_clinician_id              # recorded once (F-87 AC 5)
    chief_id = filer.chief_clinician_id if filer else None
    people   = {p.clinician_id for p in participants_of(d.record_id)}   # panel, index, discharging, ...

    tests = {
        # (a) the disputant is the chief
        'a_disputant_is_chief': filer is not None and (filer.role == 'chief' or chief_id == filer.clinician_id),
        # (b) the record would be re-credited to the chief
        'b_recredit_to_chief':  d.field == 'credited_clinician' and d.claimed_clinician_id == chief_id,
        # (c) the chief is a participant on the record (panel member on a case;
        #     index or discharging surgeon on an admission)
        'c_chief_on_record':    chief_id is not None and chief_id in people,
    }

    # Undefined cases are held, not guessed (OQ-15; F-87 AC 2)
    if filer is None or chief_id is None or d.filed_by_clinician_id == chair_id:
        return Route('chief', None, 'route_undefined', tests)

    fired = next((k for k, v in tests.items() if v), None)
    if fired:
        return Route('chair', chair_id, fired, tests)

    # Survey-record alternative (Builder decision 3; OQ-43). Off by default.
    if (d.record_type == 'survey_response'
            and settings.survey_route_direct_leader
            and filer.direct_leader_clinician_id not in (None, chief_id)):
        leader_id = filer.direct_leader_clinician_id
        if leader_id in people or d.claimed_clinician_id == leader_id:
            return Route('chair', chair_id, 'c_chief_on_record', tests)   # leader involved: same escalation
        return Route('direct_leader', leader_id, 'none', tests)

    return Route('chief', chief_id, 'none', tests)
```

What each predicate reads:

| Test | Reads | Note |
|---|---|---|
| (a) disputant is the chief | `roster_membership.role`, `chief_clinician_id` as of `filed_at` | A chief whose own `chief_clinician_id` is themselves or who holds `role = 'chief'` trips it. |
| (b) re-credit to the chief | `dispute.field`, `dispute.claimed_clinician_id` | Fires even when the disputant is not the chief (F-58 AC 5). Applies to `credited_clinician`, `index_surgeon` and `provider_named` claims, all of which name a clinician. |
| (c) chief on the record | `record_participant` rows for the record, any `participant_role` | `primary`, `co_surgeon`, `assistant` on a case (J2.4); `index_surgeon`, `discharging_attending` on an admission (J2.10, F-67 AC 2); `provider_named` on a survey; `scanned_person` on an attendance record. The participant table is written by the attribution rules at load, so the test never parses a panel string. |
| chair on own record | `department_setting.chair_clinician_id` | `route_undefined`, held (OQ-15). Nothing in the brief says who adjudicates the chair. |
| survey to direct leader | `roster_membership.direct_leader_clinician_id`, setting `survey_route.direct_leader` | Builder decision 3. |

`route()` returns every test's value, and `file_dispute()` stores them: `routing_test_fired` on the row and the full `tests` dict in the `filed -> with_*` event note. pytest `tests/disputes/test_route.py` has one fixture per branch, including the chief-as-co-surgeon case (c), the receiver-is-chief case (b), a chief filing on their own record (a), the chair filing (`route_undefined`), a surgeon with no chief mapped (`route_undefined` plus the F-87 mapping warning), and the survey flag on and off.

### The four outcomes and what each writes

Every decision is one call to `disputes.decide.decide(dispute_id, actor, decision, outcome, note, ...)` in one transaction. The table lists the writes in order. Every row inserted or updated here also produces an `audit_log` row by trigger.

| Decision | `dispute` columns set | `dispute_event.to_state` | `record_override` | `correction_request` | Other writes | Recompute |
|---|---|---|---|---|---|---|
| sustained, outcome annotated | `decision='sustained'`, `outcome='annotated'`, `decision_note`, `decided_by_clinician_id`, `decided_at`, `decision_reply_id` (M1) | `sustained_annotated` | one row: `field`, `logged_value`, `adjudicated_value`, `new_clinician_id` when the field names a clinician, `note`, `decided_by`, `decided_role`, `definition_version_label` = `dispute.version_label`, `override_version` = 1 + prior overrides on the record and field | one row when `feed_owner.contact_name` is named (Builder decision 6); none otherwise and the row text carries "no source contact named" (F-04 AC 3) | `delivery` rows for the decision email (F-93) and, on a re-credit, the receiver's notification (F-92) | yes, `recompute --dispute` |
| sustained, outcome source corrected | same, `outcome='source_corrected'` | `sustained_source_corrected` | same | one row, always (`decide()` refuses the outcome when no contact is named, F-04 AC 3, F-61 AC 3) | same | yes |
| not sustained | `decision='not_sustained'`, note, decider, date | `not_sustained` | none | none | decision email | no (F-29: nothing recomputed; the row keeps its history) |
| definition question | `decision='definition_question'`, note = one-line summary, decider, date | `definition_question` | none | none | `definition_open_item(metric_key, dispute_id, summary, logged_on)`; notification to the definitions owner (`department_setting.definitions_owner_clinician_id`); decision email | no |

Validation inside `decide()`, all refused with a named reason: a note shorter than one non-blank character (F-61 AC 2); a `decision_note` over 1,000 characters or in which `publish/scan.py`'s identifier value patterns hit (MRN shape, date of birth, phone, email, the display name of any patient-side field the record carries), named by pattern so the adjudicator can reword it; `sustained` without an outcome (F-61 AC 3); an actor who is not `adjudicator_clinician_id` (F-86 AC 2); a decision on a dispute already decided (F-61 AC 4); a re-credit whose `claimed_clinician_id` is not exactly one clinician on `roster_as_of(period_end)` of the record's period (F-07 AC 1); `definition_question` without `metric_key` (F-63 AC 1); a `source_corrected` outcome for a record type whose `feed_owner.contact_name` is null (F-04 AC 3).

What the override means per disputable field, which is also what the effect notice tells the surgeon before filing (F-56). Notices are stored per definition version in `metric_definition_version.dispute_effect_notices` keyed by field and change only through a new version (F-56 AC 5):

| Field | Record type | Effect of a sustained override | Effect notice text (v1) |
|---|---|---|---|
| `delay_reason_code` | case | `metric_value_record.detail ->> 'delay_label'` changes ("your delay" / "not your delay" once the reason set is signed, F-101); the case stays late; the FCOT numerator and denominator do not move under either basis (OQ-12) | "A sustained delay-reason dispute corrects the reason on this row. The case stays late and your FCOT number does not move, so it still matches periop's report." |
| `credited_clinician` | case | the record leaves the disputant's adjudicated lists for every metric it feeds (OR case volume, First-case on-time start (FCOT), Duration estimate accuracy, Same-day cancellations you could have prevented) and joins the receiver's; as logged keeps periop's crediting until periop corrects it | "A sustained dispute moves this record to one other clinician. Both surgeons' numbers recompute and show as logged and as adjudicated until periop corrects the record." |
| `cancellation_reason_code` | case (cancelled) | a corrected reason outside the surgeon-attributable set removes the case from the as-adjudicated numerator; as logged keeps periop's count (F-65 AC 3, OQ-13) | "A sustained reason-code dispute takes this cancellation out of your count as adjudicated. As logged keeps periop's count until periop corrects it." |
| `index_surgeon` | admission (M6) | the admission moves across Length of stay (O/E), 30-day readmission (O/E), In-hospital mortality (O/E) and Case mix index for both surgeons; the index-operation rule itself cannot be overridden (F-67 AC 3; a claim about the rule is a definition question) | "A sustained dispute moves this admission to the correct index-operation surgeon for all four Vizient-backed metrics. The rule is not changed." |
| `index_case_attribution` | qi_event (M6) | the event leaves the as-adjudicated rate and stays in as logged; no complication is ever written or edited (F-68 AC 2) | "A sustained dispute removes this event from your rate as adjudicated. The QI database is asked to correct it; nothing is entered by hand." |
| `provider_named` | survey_response (M4) | the response is marked attributed to another clinician; the four measures show both bases for the affected months with the 10-response rule re-checked (F-73 AC 2); the comment stays in the inbox marked with the state until a source correction re-loads the response (F-73 AC 4, OQ-43) | "Under the current default a sustained dispute marks this response as attributed to another clinician and shows the measure as logged and as adjudicated. Whether the comment leaves your inbox is an open question." |
| `scan_present`, `removed_by_leave` | attendance (M5) | attended count, sessions remaining, pace and the cannot-reach flag recompute as adjudicated; the attendance system is never written (F-76) | "A sustained dispute counts this session as attended as adjudicated. The attendance system is asked to record the scan; the as-logged count stays what it logs." |

The row-state text a surgeon sees is generated, never typed, by `disputes/rowtext.py` from the dispute, its active override and its correction request (F-59). The keys and exact texts are the F-59 catalogue and are registered in `reason_catalogue` (F-33) so email, app and decision email say the same words:

```
open_chief            "Disputed - with chief, filed <date>"
open_chair            "Disputed - with chair, filed <date>"
open_direct_leader    "Disputed - with direct leader, filed <date>"          (only if Builder decision 3 is on)
sustained_annotated   "Dispute sustained (annotated) by <role> on <date>: <note>; correction requested at <feed owner> <date>"
                      ... "; no source contact named" when no correction_request exists
sustained_corrected   "Dispute sustained (source corrected) by <role> on <date>: <note>; correction requested at <feed owner> <date>"
confirmed             "... ; correction confirmed at source <date>"           (appended once source_confirmed_at is set)
not_sustained         "Dispute not sustained by <role> on <date>: <note>"
recredited            "Re-credited from <surgeon> by <role> on <date>: <note>"   (on the receiver's row only)
definition_question   "Definition question logged <date>"
withdrawn             "Dispute withdrawn <date>"
refile_exhausted      "This record has been disputed twice; no further filing"   (F-62)
```

`<role>` is `division chief`, `chair` or `direct leader` from `record_override.decided_role` or `dispute.routed_to`. `<date>` is `decided_at::date`. The disputant's own row shows the note (OQ-17, default yes). On the receiver's row the `<surgeon>` in `recredited` is the original credited surgeon's display name, which F-49 AC 6 allows because the brief's rule requires it.

### The recompute path

`scorecard recompute --dispute <id>` (M1: run by the analyst inside `dispute decide --recompute`; M2: called by the app's decide action, Builder decision 4) does the following in one `ledger.run` of `kind = 'recompute'`. It never touches `raw`, `src`, `attribution` or the extract (F-05 AC 1, invariant I6).

```
1  affected  = { (clinician, metric_key, period, site, version_label) }
              from metric_value_record where record_id = D.record_id           (the disputant's cells)
            ∪ for a re-credit: (receiver, m, period, site, version_label)
              for every m in feed_owner.metrics_produced[record_type]         (receiver may have had
                                                                                no value: compute afresh)
2  for each cell: load definitions/<metric>/<version_label>.py by the registry's code_hash
              (SAME version the number was computed under, never the current one; F-29 AC 2)
   compute basis = 'adjudicated' from attribution + active record_override      (Builder decision 4,
                                                                                Data model section)
   insert metric_value (restates_metric_value_id = old id, run_id = this run); flip the old row's is_current;
   insert ledger.restatement (reason_category = 'dispute_decision', cause_ref = D, actor = decider)
   insert metric_value_record rows; assert_row_counts()                         (invariant I2)
   for delay_reason_code: assert numerator, denominator unchanged; only detail.delay_label differs (F-29 AC 3)
3  suppression: re-run engine/suppress.py for every affected cell, scope value and comparison,
   with caused_by_kind = 'dispute', caused_by_ref = D; reason text from the catalogue with the dispute clause
   ("... (1 case re-credited by dispute D-0014 on <date>)", F-38)
4  peers: for every viewer whose peer_group_snapshot for (metric, period, site) contains an
   affected clinician, rebuild the snapshot (peers_clearing_min_n may change), log the render (F-36);
   assert_no_blank_cells()                                                       (invariant I4)
5  reconciliation: for a re-credit, write reconciliation_result rows for the period with
   status = 'explained', explained_by_kind = 'sustained_recredit', dispute_ids = {D} (J4.5); as logged is unchanged, so the gate
   still passes; a delay-reason override writes nothing here (it is never a delta)
6  run.gate_results stored; run.status = 'ok'
7  render artifacts: decision email to the disputant (F-93) with the F-59 row text and the updated
   tile (single value, or "as logged 60% (6 of 10); as adjudicated 67% (6 of 9)", F-47, or the
   suppression reason naming the dispute); re-credit notification to the receiver (F-92 AC 2);
   delivery rows with artifact hash, payload scan and the gate that allowed the send (F-106);
   --dry-run writes them to the preview folder instead
```

Two invariants this path guarantees and pytest checks with a worked fixture (the J2 case list: ten first cases, six on time, two delay-reason disputes and one re-credit): after the two delay-reason decisions the tile reads 6 of 10 under both bases; after the re-credit it reads as logged 6 of 10, as adjudicated 6 of 9, the receiver's OR case volume rises by one, both surgeons' First-case on-time start (FCOT) are re-checked against min-n 4, and the site FCOT spread is rebuilt with the render logged.

The recompute runs the same day as the decision (OQ-18 default). At M1 the runbook step is `dispute decide ... --recompute --send`; at M2 the app runs it synchronously (Builder decision 4). If the recompute fails its gates, the decision stands (the events are committed) and the run row records the failure; the decision email is not sent until a re-run passes, and the F-112 checklist lists the dispute as "decided, recompute failed".

Convergence, the last step of the path, happens later and elsewhere: at every `scorecard load <feed_key>` the loader's `convergence.py` compares each open `correction_request.requested_value` with the re-ingested field, sets `source_confirmed_at` and `retired_at` on the override and `confirmed_by_feed_load_id` on the request, appends `correction_confirmed`, and the next `close` computes the period with one value again (F-06 AC 2, F-47 AC 4). The restatement chain keeps the marker on the trend point.

### Who sees what, and when

| Moment | Disputing surgeon | Re-credited surgeon (receiver) | Division chief | Chair | Direct leader | Analyst |
|---|---|---|---|---|---|---|
| Filing (T0) | M2: the form's confirmation and the row now reads `open_*`. M1: nothing yet; the reply date is `filed_at`. | nothing | M2: the dispute appears in their queue if routed to them; one filed email (F-92 AC 1). M1: one email carrying the F-52 record columns and provenance plus the reply instruction (F-111 AC 3). | same, only for escalations | same, only for survey records when Builder decision 3 is on | M1: enters the reply within two business days; sees the route printed. M2: one filed email (F-92 AC 1). |
| Acknowledgement | M1: "Dispute received on case C-7K3Q9M, filed <date>, routed to <chief or chair>" within two business days (F-57 AC 2). M2: immediate on the row. | nothing | nothing | nothing | nothing | `reply_log.entered_at` set; unentered replies on the F-112 checklist |
| Open (T0 to decision) | own row state; tile unchanged (F-29 AC 1); own dispute detail with state, dates, no provenance panel | nothing (F-86 AC 3) | queue entry with age in days against 14; detail with record as the surgeon saw it, claim, provenance panel (F-52); never a score, spread or peer position (F-52 AC 3, F-60 AC 5) | same for escalations | same for their routed survey disputes; comment text shown only to the direct leader of record (F-72 AC 5) | `scorecard dispute queue`; day-10 and day-14 items |
| Decision | decision email within the 14-day target with the row text and updated tile (F-93); row state changes; note visible (OQ-17) | on a sustained re-credit: one email "Case <ref> re-credited to you from <surgeon> by <role> on <date>: <note>" with a dispute action (F-92 AC 2); the record now in their lists (F-86 AC 3) | dispute moves to the closed list with decision date (F-60 AC 4) | same | same | M1: transcribes the reply; runs recompute; sends. M2: sees the run row. |
| Next monthly publish | the same row state and tile in the email attachment or page (F-93 AC 4); trend marker on the restated point (F-47 AC 3) | the record in their own list with the `recredited` text; disputable in turn (F-59 AC 5) | nothing new | nothing new | nothing new | feed-owner override list sent (F-64); trust report (F-98) |
| Convergence | row text gains "correction confirmed at source <date>"; tile back to one value | same on their row | nothing | nothing | nothing | convergence report from the load |

Two constraints hold across every cell. No leader view of any surgeon's numbers exists in the pilot: the chief's queue and dispute detail are the only chief-facing surfaces, and they show a record, never a tile (design doc Constraints; J1.1). And a chief is also a surgeon with their own scorecard: the app resolves the acting role per request from the resource, so opening `/me` uses role `surgeon` and opening `/queue` uses role `chief`, and `audit_log.actor_role` records which (F-107 AC 1).

### M1 intake: email reply, analyst CLI

Months one to three have no host. The surgeon replies to the monthly email quoting the row's `record_ref` (the opaque token from the Data model section's Builder decision 3, D-19, printed on every row of the CSV and stated in the dispute instructions with the F-56 effect notices, F-54 AC 5). The reply lands in the department dispute mailbox (`department_setting.dispute_mailbox`, restricted to the analyst and the named backup analyst). The ledger is the record from day one; there is no spreadsheet copy (Builder decision 2). Timeline and commands:

```
day 0      surgeon replies                              analyst: scorecard reply log ... -> reply_log row R-nnnn:
                                                        clinician, period, received_at, message_id,
                                                        sender_kind = 'surgeon', classification = 'dispute'
<= 2 bd    analyst: scorecard dispute file --reply R-nnnn ...   dispute row (channel='email', filed_at = the reply's
                                                        received_at, entered_by = analyst, reply_id), events
                                                        filed -> with_*; route printed; ack email and
                                                        adjudicator email rendered to the preview folder;
                                                        --send sends both through the relay: the ack under
                                                        gate.privacy_email.decision, the adjudicator email under
                                                        gate.privacy_email.adjudicator (F-106 AC 1)
day 10/14  scorecard status                             F-112: adjudicator email naming open disputes
                                                        (dispute id and record_ref only)
decision   adjudicator replies by email                 reply_log row (sender_kind = 'adjudicator',
                                                        classification = 'decision'): decision, outcome, note
<= 2 bd    analyst: scorecard dispute decide ...        events; override; correction_request;
             --reply R-nnnn --recompute --send            recompute run; decision email; receiver email
publish    scorecard overrides --month --send           feed-owner list (F-64); correction_requested events
publish    scorecard close / publish                    next monthly email carries the same row and tile
```

CLI surface (`scorecard dispute` group; every command writes a `run` row of `kind = 'dispute'` and sets the `scorecard.actor` session variable to the analyst's identity so the audit triggers record who did it):

```
scorecard dispute file --record <record_ref> --field <field> --by <clinician_key>
        --reply R-nnnn                   the logged reply: filed_at and the message id come from it
        (--claim "<text>" | --claim-reason <survey reason> --claimed-clinician <key>)
        [--claimed-clinician <key>]      required when field names a clinician
        [--refile-of D-nnnn]             second filing after a denial; third refused
        [--linked D-nnnn]                counter-dispute by a receiver
        [--dry-run] [--send]
    validates: record exists and is credited to --by under the adjudicated basis as of today;
               field in feed_owner.disputable_fields for the record type; an effect notice exists
               for (metric version, field) (F-56 AC 1); survey records take no --claim (CHECK);
               prior filings by this surgeon on this record < 2; --claim at most 1,000 characters
               and clean under scan.py's identifier value patterns (a hit names the pattern and
               the analyst asks the surgeon to reword; the reply itself stays in the mailbox)
    writes:    dispute (dispute_ref D-nnnn), dispute_event x2, reply_log.dispute_id, delivery (ack, adjudicator email)
    prints:    D-nnnn, route, tests evaluated, ack text, adjudicator email path

scorecard dispute route D-nnnn                     read-only: re-evaluate and print the tests; no write
scorecard dispute show D-nnnn                      the F-52 provenance panel and event history as text
scorecard dispute decide D-nnnn --decision (sustained|not_sustained|definition_question)
        [--outcome (annotated|source_corrected)] --note "<text>" --decided-by <clinician_key>
        --reply R-nnnn [--metric <key>] [--recompute] [--send] [--dry-run]
    validates: see decide() above; the reply sender resolves to the adjudicator on the row
    writes:    events, record_override, correction_request, definition_open_item, run, delivery
scorecard dispute withdraw D-nnnn --reply R-nnnn
scorecard dispute link D-nnnn --linked D-mmmm      only when --linked was not given at file time
scorecard dispute queue [--adjudicator <key>] [--over-days N] [--closed]
scorecard dispute import <xlsx> --delete-after     Builder decision 2: only if a chief insists; every
                                                   row passes the same validation as `file`; refused
                                                   if any row fails; file deleted after load
scorecard recompute --dispute D-nnnn [--dry-run]
scorecard overrides --month YYYY-MM [--send]       one list per feed owner from correction_request
scorecard status --daily|--weekly [--send]         daily check (F-112) and the weekly status email
```

A reply that names no row is logged `classification = 'awaiting_row'`, answered with a request for the row, and counted as unentered until the record is identified or the surgeon withdraws (F-57 AC 3). A reply classified `question` follows F-91 AC 6; a definition question in a reply writes a `definition_open_item` with `reply_id` in place of `dispute_id`.

How F-111's acceptance criteria are met when the ledger, not a sheet, is the record (Builder decision 2 maps each one):

| F-111 AC | Sheet reading | Ledger reading adopted here |
|---|---|---|
| 1 sharing list is the analyst only | sheet share list | DB roles: `app` does not exist at M1; `loader`, `engine`, `publisher` and `disputes` are stage roles the analyst's `scorecard_cli` login assumes with `SET ROLE`, and `scorecard dispute file|decide|withdraw|link` and `scorecard reply log|answer` run as `disputes`; `analyst_ro` is the only human read role, audited by pgaudit; `scorecard grants check` at every run stops on drift (invariant I14) |
| 2 no email carries the sheet link | URL scan | nothing to link; the outbound scan (F-106 AC 7) still runs |
| 3 one adjudicator email per dispute with F-52 content and the reply instruction | same | `intake.py` renders it from `provenance_panel()`; `delivery(channel = 'dispute_filed_email')` |
| 4 decision entered within two business days; reply kept unaltered; message id, date, sender on the row | same | `dispute.decision_reply_id` -> `reply_log` (message id, received date, sender); `decided_at` = reply date; the mailbox keeps the reply under its retention policy (OQ-57) |
| 5 edit history exported at publish; an edited decision without a correction row stops the run | sheet history | `dispute_event` and `audit_log` are the history and cannot be edited (triggers); `publish` refuses if any `audit_log(action = 'update', object_type = 'dispute')` row exists for the period without a later event, which by construction cannot happen |
| 6 a decision with no reply reference or entered by another identity stops the run | sheet check | `publish` gate (G18): every `dispute` with `decision is not null and channel = 'email'` has `decision_reply_id`; `audit_log.actor` on the decide action equals `department_setting.analyst_clinician_id` or the backup |
| 7 decision visible to the surgeon inside 14 days; report measures from reply date | same | `delivery(channel = 'decision_email').sent_at - dispute.filed_at` (F-93 AC 3) |

### M2 intake: the dispute button, the queue, the provenance panel

At M2 the same service functions sit behind a server-rendered app (Builder decision 1) behind MGB SSO with authorization from the dated roster. Pages in this subsystem, the role that may open each, and what the request logs:

| Page | Method | Who | Authorization check (`web/authz.py`, tested matrix) | `audit_log` row |
|---|---|---|---|---|
| `/me/<period>/metric/<metric_key>/records[?basis=logged\|adjudicated]` | GET | surgeon | `metric_value.clinician_id = session clinician`; RLS as defense in depth | `view`, `object_type = 'record_list'`, `subject = self` |
| `/records/<record_ref>/dispute` | GET | surgeon | record credited to session clinician under the adjudicated basis as of today (F-66 AC 4, F-86 AC 1) | `view`, `dispute_form` |
| `/records/<record_ref>/dispute` | POST | surgeon | same; field in `disputable_fields`; claim non-empty; survey form has no free-text field (F-72 AC 1) | `insert` by trigger; `decide`-style action row `file` |
| `/disputes/<dispute_id>` | GET | disputant; receiver after a sustained re-credit; adjudicator on the row | `filed_by = me` or `record_override.new_clinician_id = me` or `adjudicator_clinician_id = me` (F-86) | `view`, `dispute`, `subject = filed_by` |
| `/queue` and `/queue/closed` | GET | chief, chair, direct leader | `adjudicator_clinician_id = me` only; the chair sees only escalations (F-60 AC 1) | `view`, `queue` |
| `/disputes/<dispute_id>/decide` | GET, POST | adjudicator on the row | `adjudicator_clinician_id = me`; `decision is null` | `decide` |
| `/disputes/<dispute_id>/withdraw` | POST | disputant | state in (`filed`, `with_*`) | `withdraw` |
| `/definitions/<metric_key>@<version>` | GET | any roster member | none beyond SSO and roster; shows open items (F-63 AC 2) | `view`, `definition` |
| `/records/<record_ref>` | GET | credited surgeon; adjudicator of an open dispute on it; receiving clinician after a sustained re-credit | the Delivery surfaces section's record-detail row of the authorization matrix | `view`, `record`, `subject = credited clinician` |
| any URL not in the Delivery surfaces section's page inventory | any | anyone | refused | `refused` (F-85 AC 7) |

The form (F-66) shows the record identity fields for its type, the metrics the record feeds (`feed_owner.metrics_produced`), the disputed-field selector limited to `disputable_fields`, the effect notice for the selected field above the submit control (F-66 AC 5), the catalogue sentence `claim-no-identifiers` above the claim field ("Describe the record by its case id and what happened. Do not include a patient's name, MRN or date of birth."; the same sentence is in the email reply instructions and in the CSV comment line), and for survey responses exactly the three reasons and a roster picker (F-72 AC 1). A claim that trips the identifier scan is returned to the form with the pattern named and nothing written. Submit calls `file_dispute()`; the response page shows the route. No route exists to dispute a number, tile or spread (F-66 AC 4).

The queue (F-60) lists the adjudicator's open disputes oldest first: `dispute_ref`, surgeon, `record_ref`, field, filed date, age in days, a flag past 14. It shows no metric value, spread or peer position. Selecting one opens the detail with the provenance panel.

The provenance panel (F-52), `disputes/provenance.py`, is one dict per record type, rendered identically in the M1 adjudicator email, `scorecard dispute show` and the M2 detail page (`/disputes/<dispute_id>`). A missing field flags the dispute to the analyst and blocks adjudication (F-52 AC 1):

| Record type | Panel fields |
|---|---|
| all | the record columns exactly as on the surgeon's row (F-52 AC 2); source system and `feed_load.loaded_at`, `ticket_number`; attribution rule text and `rule_version` ("credited to the primary surgeon in the OR log; first-listed primary on a multi-panel case"); `shared_flag`; `version_label` and the metric and period it feeds; stored value of the disputed field; prior disputes on the record with their states |
| case | scheduled start, wheels-in, `delay_reason_code` as stored, room, `first_case_in_room`, booked and actual minutes, cancellation reason code and whether it is in the signed set (F-65 AC 2) |
| admission (M6) | Vizient encounter id, load date, index-operation rule text, `model_version`, discharging attending, observed and expected days (F-52 AC 5, F-67 AC 5) |
| survey_response (M4) | survey month, the four scores, provider named, source and load date, the structured claim; comment text only when the adjudicator is the direct leader of record, enforced server-side (F-72 AC 5); never in the M1 email |
| attendance (M5) | session date, `held`, scan present, `removed_by_leave`, leave period if any |
| qi_event (M6) | event type, event date, index case `record_ref`, QI database id; from the `privileged` schema under the quality gate |

Both judges' framework recommendations are recorded in Builder decision 1 (D-05). Whichever is chosen, three properties are fixed: SSO validated in-app (OIDC or SAML library), not by trusting a proxy header, unless MGB mandates the proxy and the listener is network-restricted to it (security judge); every query sets `scorecard.clinician_id` and `scorecard.role` and RLS policies on the RLS set (the Data model section, roles table) read them (defense in depth); every query in `web/queries.py` binds its arguments through psycopg parameters and never formats SQL from a string; every request handler calls `audit.log_view()` before rendering, and a refused request logs before returning (F-107 AC 1).

### The 14-day target and the over-14-days report

The clock starts at `dispute.filed_at` (M1: the surgeon's reply date, not the entry date, F-57 AC 1) and stops at `delivery.sent_at` of the decision email (F-93 AC 3). `decided_at` is stored separately so the report can split adjudicator time from analyst time.

```sql
-- disputes/queue.py: over_days(14); also the F-112 day-10 and day-14 items
select d.dispute_id, d.record_id, d.adjudicator_clinician_id, d.routed_to,
       current_date - d.filed_at::date as age_days
from   ledger.dispute d
where  d.decision is null
  and  d.state not in ('withdrawn')
  and  current_date - d.filed_at::date in (10, 14)      -- or >= 14 for the report
order  by d.filed_at;
```

Where it surfaces:

| Surface | Content | Recipient |
|---|---|---|
| `scorecard dispute queue --over-days 14` | dispute ref, record ref, adjudicator, age | analyst |
| `scorecard status` (daily at M1; the weekly status email at M2) | every open dispute at day 10 and day 14; unentered replies older than two business days; decided disputes whose recompute failed or whose decision email is unsent; `route_undefined` holds | analyst |
| day-10 and day-14 adjudicator email (F-112 AC 4) | "Dispute D-0014 on case C-7K3Q9M has been open 10 days; the target is 14." One email per adjudicator naming all their listed disputes; ids only; passes the F-106 AC 7 scan | adjudicator and analyst |
| M2 queue | entries past 14 days flagged in words ("over 14 days"), not by colour alone (F-108) | adjudicator |
| trust report (F-98) at publish | count filed excluding `department_setting.brief_owner_clinician_id`; median and maximum days filed to decision email; share within 14 days; disputed-record rate per surgeon per month (`count(distinct record_id) / count(metric_value_record)` for published records); outcomes by type; open overrides awaiting source; count of disputes with no `record_id` (zero by I12, asserted anyway) | analyst; OQ-50 for the chair |

The report selects no `claim_text`, `decision_note` or record content (F-98 AC 5); a pytest runs it against the fixture ledger and asserts the column set.

### Audit log design

`ledger.audit_log` (DDL in the Data model section) is the department's answer to "who changed this" and "who has looked at this". Three properties are mechanisms, not discipline:

1. INSERT-only. Every runtime role, including `migrate` at runtime, has INSERT and no UPDATE or DELETE; the `audit_log_immutable` trigger refuses UPDATE and DELETE regardless of grant; pytest attempts both as `app` and as `engine` and expects an exception (invariant I3). This is enforced against runtime roles, not against a table owner or superuser, who can drop the trigger and delete rows: at M1 the analyst is the workstation's database superuser by construction, and at M2 a DBA is. Point 4 is the control for that case.
2. Written by triggers for data changes. Row-level AFTER triggers on `dispute`, `dispute_event`, `record_override`, `correction_request`, `definition_open_item`, `metric_definition_version`, `definition_param`, `reason_set_version`, `roster_membership`, `leave_period`, `department_setting`, `feed_load`, `run`, `attribution_exception`, `reply_log`, `delivery`, `identity` and `restricted.private_note` write one row each with `actor = current_setting('scorecard.actor')` (the CLI sets it to the analyst identity; the app to the SSO subject; loaders to the role name) and `details` holding ids and the changed column names only.
3. Written by the app for views. `audit.log_view(page, subject_clinician_id, outcome)` is called by every handler that returns surgeon-identified content and by every refusal. A page that lists several subjects (the queue, `/queue/closed`, `/leader`, `/analyst/disputes`) writes one `view` row with `subject_clinician_id` null and `details.subject_ids` holding every subject listed, so "who looked at Dr. X's dispute list" is answerable from the log for queue opens too.
4. Copied off-host, hash-chained. `scorecard audit export` (run inside `status --daily` at M1 and by `scorecard-status.timer` at M2) writes every `audit_log` row since the last export as one batch whose header carries the sha256 of the previous batch, and sends it to the MGB log platform (syslog forwarding at M2) or, until that exists, to an MGB-approved write-once location that information security names and on which the analyst holds append-only rights (OQ-61). `doctor` fails when the newest batch is older than 24 hours; the quarterly access recertification re-hashes the chain against the database and records the result in `department_setting.access_recert.<date>`. The trigger and the grants hold against every runtime role; the exported chain is what holds when the actor is the M1 workstation superuser or a DBA.

What is logged, by action:

| `action` | `object_type` | When | `details` (ids only) |
|---|---|---|---|
| `insert`, `update` | table name | trigger on the tables above | `{"columns": [...], "dispute_id": ..}` |
| `file`, `decide`, `withdraw`, `link` | `dispute` | service functions, one row per call in addition to the trigger rows | `{"dispute_id", "record_id", "routed_to", "routing_test_fired"}` or `{"decision", "outcome"}` |
| `recompute` | `run` | `recompute --dispute` | `{"run_id", "dispute_id", "cells": n}` |
| `send` | `delivery` | every outbound email and the override list | `{"delivery_id", "channel", "gate_checked"}` |
| `view` | `record_list`, `dispute`, `queue`, `dispute_form`, `definition`, `inbox` (M4), `leader_landing` (M4), `tile_page` | every app request that renders surgeon-identified data | `{"metric_key", "period", "basis"}` or `{"dispute_id"}`; `subject_clinician_id` = whose data; for a page listing several subjects (`queue`, `leader_landing`, `/analyst/disputes`) `subject_clinician_id` is null and `details.subject_ids` lists every subject shown |
| `refused` | the page attempted | every authorization refusal, with `outcome in ('refused','no_roster','no_period','error')` (F-85 AC 7) | `{"path_kind": ..}` never the full URL if it carries a ref |
| `pipeline_read` | `restricted.survey_comment` | `svc_survey` loads and the inbox path (M4) | `{"job_id"}` (F-107 AC 3) |
| `grants_check`, `retention` | `run` | each run | result summary |

What is never in `audit_log.details`: names, comment text, scores, private notes, claim text, decision notes, free-text fields of any source. A pytest scans every `details` key in the fixture ledger against an allowlist (F-107 AC 2). The log is not shown to surgeons or leaders by default; "last viewed by your direct leader on <date>" would be a `department_setting` change (F-107 AC 4, OQ-42). Retention of the log is OQ-57; nothing is disposed until data governance sets it.

The scorecard audit report, `scorecard audit --clinician <key> --period YYYY-MM [--format text|csv]`, is the governance-facing query over this table and the tables it references. It answers, for one surgeon and one period, with ids and roles only:

```
Runs        : close, recompute and publish runs that wrote this surgeon's values; git sha; published_at
Values      : each metric_value with definition_version_id, basis, restates chain and the restatement reason_category
Suppression : each suppression_decision with kind and caused_by
Peers       : each peer_group_snapshot with rendered flag and peer counts (member ids not shown)
Disputes    : each dispute on the surgeon's records: state history with actor roles and dates,
              routing test fired, override and correction_request ids, convergence dates
Deliveries  : every artifact sent to or about this surgeon: channel, sent_at, artifact_sha256,
              gate_checked, payload_scan result
Views       : every audit_log row with subject_clinician_id = this surgeon or with this surgeon in
              details.subject_ids: actor_role, page, outcome, timestamp  (who has looked at this)
Reads       : every pgaudit SELECT line by analyst_ro or scorecard_cli on a table holding this surgeon's
              rows in the period: role, table, timestamp (table-level; the row is not identified)
Identity    : ledger.identity rows for this surgeon with their validity ranges and how the UPN was resolved
Refusals    : every refused attempt naming this surgeon's data
```

It runs under `analyst_ro` (no grant on `restricted`, so it cannot print a comment or a note even by mistake) and its own execution is an `audit_log` row.

### Builder decisions

**Builder decision 1 (D-05): web framework for the M2 dispute surfaces.**
Options: (a) Flask + Jinja2 + psycopg, server-rendered, SQL-owned schema, no ORM, a small vendored chart library; SSO via an in-app OIDC or SAML library. (b) Django 5 LTS, server-rendered, unmanaged models over the SQL-owned schema, `mozilla-django-oidc` or `djangosaml2`; Django admin disabled or restricted to analyst screens that exclude `restricted` and `privileged`.
Recommendations recorded, as the adopted architecture asks: the staff engineer judge recommends (a), because the schema is owned by SQL migrations and identity comes from MGB SSO, so Django's ORM and auth become a second description of the tables and a second identity layer; choose Django only if the team already runs it. The clinical informatics and security judge recommends (b), because Django's auth, sessions, CSRF and permission machinery are what hospital security reviewers have already seen, and Flask is acceptable provided SSO is validated in-app rather than by a trusted header.
This section's position: framework-neutral by construction. The dispute logic is in `scorecard/disputes/*` service functions with no framework import; the authorization matrix is a pure function with a pytest; RLS is behind both. The register's recommendation (D-05) is Flask unless the builder or the analyst has taken a Django app through an MGB security review; the pick is recorded in the runbook. The three fixed properties (in-app SSO validation, session variables plus RLS, `log_view()` before render) apply to either.

**Builder decision 2 (D-25): the M1 dispute ledger is the database, not a shared sheet.**
Options: (a) the catalogue's reading of the design doc: a shared sheet held by the analyst alone is the wedge ledger, with sharing list and edit history as the audit trail (F-55, F-111 as written). (b) both judges and the adopted architecture: `scorecard dispute file` writes `ledger.dispute` from day one; an optional `dispute import <xlsx>` exists only if a chief insists, validates every row as `file` does, and deletes the sheet after load.
Recommended: (b). Why: a sheet is a second PHI copy with no state machine, no routing predicate, no immutability and a hand-applied escalation test, which is the J2 failure mode; the ledger row with `dispute_event` is the record and nothing migrates at M2. F-111's seven acceptance criteria are each satisfied by a stronger ledger mechanism (table above). The catalogue's AC text that names "the sheet" should be re-read as "the ledger" when the PRD cites it; OQ-55 is answered by this decision pending the owner's confirmation.

**Builder decision 3 (D-20): where survey-record disputes route.**
Options: (a) the division chief per ground rule 2, with the comment withheld from any adjudicator who is not the direct leader of record (catalogue F-58 AC 1, F-72 AC 4, AC 5). (b) the direct leader when the leader and the chief differ, with the involvement tests applied to the leader (journeys J3.7 proposed default; both judges' syntheses; the adopted architecture's wording).
Recommended: implement (b) as a predicate behind `department_setting.survey_route.direct_leader`, default false, so the shipped behaviour is (a), the brief-literal reading, until OQ-43 is answered; flipping the setting is a signed configuration change with no code change and no schema change (`routed_to` already includes `direct_leader`; the Data model section's Builder decision 5, the same D-20). Why: the brief's text routes every dispute to the chief; the inbox audience is protected by the comment-withholding rule (F-72 AC 5) under either route; coding the predicate now means the owner's answer costs a setting, not a release. This does not choose against the judges; it defers the choice to the brief's owner with the mechanism ready.

**Builder decision 4 (D-26): who triggers the recompute at M2.**
Options: (a) the app's decide action calls `engine/recompute.py` synchronously in the same request and transaction as the decision (hybrid; ledger-engine-app). (b) the app writes the decision only; the analyst runs `scorecard recompute --dispute` the same day (minimal batch's posture carried into M2). (c) a systemd timer polls for decided-not-recomputed disputes.
Recommended: (a), with (b) kept as the fallback path when the recompute's gates fail (the decision is committed, the run row records the failure, the checklist names it, the analyst re-runs). Why: a recompute touches tens of cells and takes under a second; the adopted architecture allows systemd only for `pg_dump` and the weekly status email; leaving a decided dispute waiting for a human is the "disputing is theater" failure mode Premise 6 warns about. The decision email is rendered in the same call and sent under the gate; at M2 it carries the deep link (F-93 AC 5).

**Builder decision 5 (D-27): withdrawal.**
Options: (a) no withdrawal; a mistaken filing is decided `not_sustained` by the adjudicator. (b) the disputant may withdraw while the dispute is undecided (`filed`, `with_*`); recorded as an event; never after a decision; a withdrawn dispute does not count toward the two-filing limit.
Recommended: (b). Why: the brief is silent; F-57 AC 3 already assumes a surgeon can withdraw an "awaiting row" reply; forcing a chief to rule on a filing the surgeon no longer stands behind wastes the adjudicator's time and pollutes the F-98 outcome counts. Recorded as OQ-16 territory for the owner.

**Builder decision 6 (D-28): how an annotated override reaches the feed owner.**
Options: (a) only `source_corrected` writes a `correction_request`; annotated overrides never reach the feed owner (contradicts F-05 AC 5, F-64 AC 1 and the J2.8 row text "correction requested at periop"). (b) both sustained outcomes write a `correction_request` when the feed owner has a named contact; the dispute's `outcome` distinguishes "asked to correct their record" from "informed of the department's adjudication"; convergence applies to both; the monthly list groups by outcome. (c) annotated overrides go on a separate "for information" list from `record_override` alone.
Recommended: (b). Why: one query produces the F-64 list, one convergence path retires overrides whichever way the source moves (F-05 AC 3, F-06 AC 2), the row text catalogue needs no third variant, and the difference between the outcomes is preserved where it matters: `source_corrected` is refused without a named contact (F-04 AC 3) while `annotated` is always available and, without a contact, writes no request and reads "no source contact named". Design doc Constraints say "sustained overrides go to periop monthly as a correction request" without distinguishing the two, which (b) honours.

### Feature mapping

Owned by this section: every feature in the Dispute workflow and Drill-down and provenance areas (21). A second table maps the features from other areas that this section designs in part, so the owning sections can cross-reference.

| F-xx | Where it lives | Notes |
|---|---|---|
| F-49 | `metric_value_record` join `record`, `attribution`, `record_participant`, `feed_load`, active `record_override`, `dispute`; M1: the CSV attachment section per tile; M2: `/me/<period>/metric/<metric_key>/records`; `record_ref` on every row; `assert_row_counts()` gate | The list opens for a suppressed number because `metric_value_record` rows are written whether or not a `suppression_decision` exists (AC 3). The only identities beyond the viewer's are those AC 6 allows: discharging attending, re-credited-from surgeon. Work RVUs — live tracker has no rows (OQ-33). |
| F-50 | `metric_definition_version` (text, params with `assumed` or `confirmed`, `definition_delta`), `reason_set_version`, `definition_open_item`; M1: the definitions appendix of the email body keyed by `definition_version_id`; M2: `/definitions/<metric_key>@<version>` | Open items from F-63 and from F-91 questions render with their date and close with a link to the version that answered them. The version reached from a tile stamp is that version's text, never the latest (AC 4). |
| F-51 | `metric_value` (`version_label`, `numerator`, `denominator`, `exclusions`, `source_feed_load_id`, `source_as_of`, `model_version`, `run_id`, restatement chain), `metric_value_record`; tile text "Definition: <name>, version <v> (<source>)"; invariant I2 | Traceability AC 4 is the join chain tile -> `metric_value` -> `metric_value_record` -> `record` -> `feed_load`; `scorecard audit` prints it. |
| F-52 | `disputes/provenance.py`; M1: adjudicator email body and `scorecard dispute show`; M2: `/disputes/<dispute_id>` for the adjudicator | AC 1 missing-field block; AC 3 no score anywhere on the panel; AC 4 version and load date equal the number's stamps because they are read from the same rows. |
| F-53 | `src.survey_response` (scores, `has_comment`, provider named; no text column); M2: `/me/<period>/metric/<metric_key>/records` for `record_type = 'survey_response'`; dispute action opens the F-72 form | AC 1 and AC 3 are a schema fact (the comment column is in `restricted`, not selected) plus the payload scan. |
| F-54 | `record_ref` (Data model section Builder decision 3) on every row; `feed_owner.disputable_fields`; M1: instruction text and reply address in the attachment; M2: "Dispute this record" button on every row of every list | AC 1 list generation refuses a row without `record_ref`; AC 2 volume and duration rows carry the action because every record type in `feed_owner` does; AC 4 wRVU has no ledger record. |
| F-55 | `ledger.dispute`, `ledger.dispute_event` | AC 3's "sheet" reading replaced by the ledger (Builder decision 2); AC 4 `version_label` (the number's `definition_version_id`) copied from the stamp in `file_dispute()`; AC 5 satisfied by `dispute import` validating a sheet into the same schema. |
| F-56 | `metric_definition_version.dispute_effect_notices` (jsonb by field); `disputes/notices.py`; shown in the M1 instructions and above the M2 submit control | Table of notices above; a field with no notice cannot be disputed (AC 1). |
| F-57 | `reply_log`; `scorecard dispute file`; `intake.py` ack rendering; `delivery(channel = 'ack_email')`; `route.py` result stored on the row | AC 4 the test is applied by code and printed, not by hand; AC 5 unentered replies on `scorecard status`. |
| F-58 | `disputes/route.py`; `dispute.routed_to`, `routing_test_fired`, `adjudicator_clinician_id`; `roster_as_of(filed_at)`; `record_participant`; `department_setting.chair_clinician_id` | AC 3 self-assignment is impossible because assignment happens once, at filing, by the system. |
| F-59 | `disputes/rowtext.py`; keys registered in `reason_catalogue`; rendered on the M1 CSV row, the decision email and the M2 row | Catalogue above; AC 6 history via `/disputes/<dispute_id>` and `dispute_event`. |
| F-60 | `disputes/queue.py`; M1: one adjudicator email per dispute plus `scorecard dispute queue`; M2: `/queue`, `/queue/closed` | AC 1 chair sees `routed_to = 'chair'` only; AC 5 no values on the page. |
| F-61 | `disputes/decide.py`; `dispute.decision`, `outcome`, `decision_note`, `decided_by_clinician_id`, `decided_at`, `decision_reply_id`; `dispute_event` | AC 4 immutability by trigger; M1 reply kept unaltered in the mailbox and referenced by message id. |
| F-62 | `dispute.refile_of_dispute_id`, `linked_dispute_id`; `file_dispute()` filing count; `may_transition()` | AC 4 no appeal: there is no transition from a decided state to `with_chair`. |
| F-63 | `definition_open_item`; `decide(decision = 'definition_question', metric_key)`; definitions-owner notification; `/definitions/<metric_key>@<version>` | AC 4 closing on a new version is done by `scorecard register` setting `closed_by_definition_version_id`. |
| F-64 | `correction_request` where `confirmed_by_feed_load_id is null`, grouped by `feed_key` and `dispute.outcome`; `scorecard overrides --month --send`; `delivery(channel = 'override_list')`; `run.gate_results` and the F-112 checklist | Builder decision 6; AC 3 a feed owner without a contact blocks `source_corrected` at decide time; AC 5 the command only reads and writes `delivery`. |
| F-65 | `record_override(field = 'cancellation_reason_code')`; `reason_set_version`; provenance panel case fields; recompute adjudicated numerator | AC 4 as logged stays periop's count; `reconciliation_result` unaffected (OQ-13). |
| F-66 | M2 `/records/<record_ref>/dispute` (GET, POST); `web/authz.py`; `file_dispute()` | AC 2 field selector from `feed_owner.disputable_fields`. |
| F-67 | `record_override(field = 'index_surgeon')`; `record_participant(index_surgeon, discharging_attending)` drives test (c); recompute across the Vizient four for both surgeons; provenance admission fields | AC 3 a claim about the rule becomes `definition_question`. M6. |
| F-68 | `record_override(field = 'index_case_attribution')`; `privileged.qi_event` read under the quality gate; `correction_request(feed_key = 'qi')`; no write path to `qi_event` outside the loader | AC 2 by grants: `app` and `engine` have no INSERT on `privileged`. M6. |
| F-111 | Builder decision 2 table: DB roles and `grants check` (AC 1), payload scan (AC 2), `intake.py` adjudicator email (AC 3), `decision_reply_id` and `decided_at` (AC 4), `dispute_event` and `audit_log` immutability (AC 5), publish gate on missing reply reference or wrong actor (AC 6), `delivery.sent_at - filed_at` (AC 7) | The ledger is the custody model; OQ-55 records the deviation from "a shared sheet" for the owner. |

Features from other areas designed in part here:

| F-xx | Where it lives in this section | Owning section |
|---|---|---|
| F-05 | outcome writes table; `record_override` columns per decision; row text | Data model |
| F-06 | convergence step of the recompute path; `correction_confirmed` event by the loader | Data model |
| F-07 | re-credit validation in `decide()`; affected-cell union in the recompute path; receiver notification | Data model |
| F-29 | the recompute path, steps 1 to 6; same-version rule; delay-reason assertion | Metric engine |
| F-38 | recompute step 3: `caused_by_dispute_id` and the dispute clause on the reason | Suppression |
| F-47 | recompute step 7: tile text with both bases; trend marker from the restatement chain | Scorecard views |
| F-72, F-73 | survey branch of `route.py` (Builder decision 3); `claim_structured`; provenance survey fields; comment withheld server-side; row text on the response and the inbox entry | Patient experience |
| F-76 | `scan_present`, `removed_by_leave` overrides and their effect notices | Citizenship |
| F-86 | the M2 page table and `web/authz.py` matrix; RLS on `dispute` | Roles and access |
| F-91 | `reply_log` classification and the `awaiting_row` and `question` paths in `intake.py` | Delivery |
| F-92 | filed email (M1 adjudication surface) and re-credit email rendered in recompute step 7 | Delivery |
| F-93 | decision email content and the 14-day clock stop | Delivery |
| F-98 | `disputes/queue.py: trust_report()`; column set; aggregates only | Audit and versioning |
| F-107 | audit log design; `audit.log_view()`; allowlist test; `scorecard audit` | Cross-cutting |
| F-112 | day-10 and day-14 query and adjudicator email; unentered replies; recompute failures; `route_undefined` holds on `scorecard status` | Period close and publish |

Open questions this section depends on and does not answer: OQ-12 (delay-reason annotation only), OQ-13, OQ-14, OQ-15, OQ-16, OQ-17, OQ-18, OQ-19, OQ-20, OQ-21, OQ-22, OQ-33, OQ-42, OQ-43, OQ-50, OQ-55, OQ-56, OQ-57. Each is implemented at its catalogue default with the alternative reachable by a setting or a new version, never by editing a decided row.

## Delivery surfaces: email, web app, inbox, BI export

Every surface renders the same ledger rows. `scorecard close` (the Metric engine section) has already written every value, reason, spread, trend marker and dispute state before any surface runs; the code in this section reads `ledger.*` and formats it. No surface computes a number, composes a reason or filters a peer. That rule is what lets the email, the hosted page, the decision email and the optional BI tile say the same words for the same cell (F-33 AC 3), and it is why every surface below is a renderer over one artifact model.

Three surfaces, in milestone order:

| Surface | Milestone | What it is | Who it reaches | Gate (department_setting key) |
|---|---|---|---|---|
| Monthly email | M1 | One plain-text email per surgeon plus one CSV of their own rows; decision, acknowledgement, dispute-filed, re-credit and deadline emails; the feed-owner override list | Surgeon's own MGB mailbox; chief, chair, analyst, periop contact | `gate.privacy_email.*` per channel (F-106 AC 1) |
| Web app | M2 | One server-rendered app behind MGB SSO over the same tables: tiles, trend, spread, definitions, record lists with a dispute button, dispute detail, chief and chair queue, analyst screens; from M4 the Patient experience page, the inbox with private notes and the direct-leader inbox view; from M5 the wRVU tracker and M&M pace | Roster identities only, by role | `gate.security_review`, `gate.data_governance`, `gate.qi_determination` (F-106 AC 2); `gate.survey_pipeline` for Bucket 5; `gate.medical_staff_office` for Bucket 4; `gate.comp_office` for wRVU |
| BI pub export | Deferred | Optional `pub` schema of per-viewer, pre-suppressed, peer- and patient-identity-free tile rows for the enterprise BI tool | Whatever the BI tool's user filter admits | Same three hosted gates plus a BI-workbook security review |

The sections below cover the email in full (template, CSV, dry run, fallback, relay, delivery rows), the web app (page inventory, authorization matrix, SSO, stack, charts, states, accessibility), the three display contracts the brief prescribes (Patient experience and inbox; Work RVUs — live tracker; M&M attendance), the pub contract, the module and CLI surface, builder decisions, and the feature mapping.

Conventions: table and column names are those of the Data model section; `F-xx` cites `02-features.md`; `Jn.m` cites `01-user-journeys.md`; `OQ-nn` cites the open questions register; "the brief" is `docs/source/metric-definitions-v0.2.md`. The brief's metric name "Work RVUs — live tracker" contains a dash; it and the brief's Bucket 5 sentence are quoted verbatim, and those quotations are the only places a dash of that kind appears here.

### The artifact model every surface renders

`scorecard/publish/render.py` builds one `ClinicianArtifact` per (clinician, period, site) from the ledger and hands it to whichever formatter is asked for. The email formatter, the web views and the pub builder all consume this object; a test renders one fixture through all three and compares the tile strings (F-12 AC 4, F-33 AC 3, F-85 AC 1).

```
ClinicianArtifact
  clinician_ref, display_name, site_label, period (start, label), run_id
  last_refreshed            # run.published_at of the run being rendered (F-83)
  what_this_is_not          # catalogue entry, version id (F-42)
  self_only                 # run.spread_eligibility[clinician] (F-35)
  definition_changes[]      # registry diff summaries effective this period (F-94)
  decisions_this_period[]   # dispute rows decided since the last publish (F-93 AC 4)
  buckets[]                 # 1..6 in the brief's order
    tiles[]
      metric_key, metric_name (brief text verbatim), kind (count|rate|oe|median|mirror|pace|text_only)
      display_state         # value | reason  (exactly one)
      value_text            # "5 of 7 first cases on time (71%)"  or  "19 operations as primary surgeon"
      logged / adjudicated  # both present only when they differ (F-47)
      reason_text           # catalogue text with counts filled (F-33), or null
      comparator_line       # "Compared to: <brief text> (<k> surgeons; spread from month two)" (F-34)
      spread                # null, or {sentence, peer_values[], own_value} (F-46)
      definition_stamp      # "Definition: <name>, version <v> (<source>)" (F-51 AC 3)
      source_line           # "last refreshed <date>" or per-source as-of text (F-97)
      cadence_note          # "Counted quarterly; the quarter closes <date>." etc. (F-45)
      trend[]               # {period_label, value_text, n_text, restated, version_boundary, gap_reason} (F-43)
      record_list_ref       # (metric_key, row_count) ; row_count == denominator (F-49 AC 2)
      extra                 # kind-specific: wRVU ghost series and snapshot deltas; M&M pace fields;
                            # Bucket 5 year average, three months, MGB average, hidden months
    bucket_notes[]          # F-104 text for bucket 2; "Not in this release" tiles are ordinary tiles
  record_lists{metric_key: rows[]}   # own rows only; columns per record type (F-49, F-90 AC 5)
```

`render.py` never reaches `restricted.*`. The inbox has its own reader (`web/views/inbox.py`) that is the only code path with a grant on `restricted.survey_comment.comment_text` (F-70 AC 3).

### M1: the monthly email

#### Flow

```
scorecard publish --period 2026-10 [--dry-run | --send | --eml]
      |
      v
 run row (kind='publish') ---- refuses unless close run for the period passed every gate (F-90 AC 7)
      |
      v
 for each clinician on the roster as of the period (roster end date honoured, F-113 AC 5):
      render.py  -> ClinicianArtifact
      email_text.py -> body (Jinja2, templates/scorecard_email.txt.j2)
      csv_rows.py   -> own-rows CSV
      scan.py       -> minimum-necessary payload scan (F-106 AC 7); a hit blocks THIS send only
      gates.py      -> gate.privacy_email.scorecard signed? (F-106 AC 1)
      own_records.py-> every record_ref in the artifact is credited to this surgeon (G14)
      directory.py  -> recipient resolved from the institutional directory by roster identity (F-90 AC 8)
      transport.py  -> --dry-run: write preview/<period>/<clinician_ref>/{email.txt, scorecard-<period>.csv, message.eml}
                       --eml:     as dry-run, plus a "ready to send" manifest for the shared mailbox
                       --send:    SMTP relay, capture Message-ID
      delivery.py   -> the delivery row
      delivery row  -> artifact_sha256, message_id or bounce, payload_scan, gate_checked
      |
      v
 overrides.py -> one list per feed owner (F-64); delivery row with clinician_id null
 run.finished_at, printed F-112 checklist stored on the run
```

`--dry-run` is the default. Nothing is sent unless `--send` is passed. The runbook says: run `--dry-run`, open `preview/<period>/index.html` (an index of every body with its scan result and recipient), read at least one email end to end, then run `--send`.

#### The plain-text template

The body is plain text, 72 characters wide at most, no hyperlink in months one to three (F-90 AC 3), tiles in the brief's bucket order, one blank line between blocks. Everything in angle brackets is filled from the artifact model; everything else is literal. Suppression, spread and page-state wording comes from the catalogue by key and is never typed in the template (F-33 AC 5). The order, the envelope and the grammar are the PRD's (R-116, R-122, R-123, R-124; section 9.6): no ruler line anywhere (R-94: no run of five or more `=` or `-`, because a ruler wraps on a phone and a screen reader announces it as a count of symbols), headings as one upper-case line followed by a blank line, indentation at most four spaces, one fact per line, the case id first on every record row. Amended 2026-09-29 by the impeccable pass (`docs/reviews/impeccable-design.md`) to match the PRD; the earlier form of this block, with rulers and separate post-tile decision and definition blocks, is superseded.

```
Subject: Your October 2026 scorecard and case list, from <analyst name>
From:    <analyst name>, Department of Neurosurgery <service mailbox>
Reply-To: <dispute mailbox>

Four numbers from periop's OR log and your own case list.
Only you receive this email.

Clinician Scorecard for Dr. <Name>
October 2026 at <site label>
last refreshed 12 November 2026

<what-this-is-not one-line text, statement version v<n>>

Your first cases and cancellations are below; the full list is
attached as scorecard-2026-10.csv. To dispute a row, see "How to
dispute" below.

FIRST MONTHLY EMAIL

First monthly email. Four numbers from periop's OR log for October,
and your own case list. Only you receive this email; your chief or
chair sees one of your rows only when you dispute it.

THIS MONTH

OR case volume: 19 operations as primary surgeon
First-case on-time start (FCOT): 5 of 7 first cases on time (71%)
  Of the 2 late: 1 your delay, 1 not your delay (both counted under
  periop's definition)
Duration estimate accuracy: 11 of 14 cases within tolerance (79%)
Same-day cancellations you could have prevented: Counted quarterly;
  the quarter closes 31 December 2026. Scheduled cases so far: 24.

YOUR FIRST CASES AND CANCELLATIONS

C-2B8XT1  2026-10-03  on time
C-7K3Q9M  2026-10-14  late  not your delay (anesthesia)
C-5PW2ZR  2026-10-20  late  your delay (surgeon late)
C-9QL4WD  2026-10-21  cancelled same day  <reason as stored>; not in
  your set
Full list attached (7 first cases, 3 cancellations).
To dispute a row, reply with its case id (first on the line) and what
happened. The template is under How to dispute.

BUCKET 1  VOLUME AND MIX

OR case volume
  October: 19 operations as primary surgeon.
  Records: 19 rows in the attachment under OR case volume
  Compared to: surgeons in your subspecialty at your site
    (4 surgeons; spread from month two)
  definition v1; source periop OR log; as of 12 November 2026
  Trend (operations as primary surgeon, closed months)
    2025-11   17
    2025-12   14
    2026-01   21
    ...
    2026-10   19

BUCKET 2  EFFICIENCY

First-case on-time start (FCOT)
  October: 5 of 7 first cases on time (71%).
  Of the 2 late: 1 your delay, 1 not your delay (both counted under
    periop's definition)
  Records: 7 rows in the attachment under First-case on-time start
    (FCOT)
  Compared to: neurosurgeons at your site
    (9 surgeons; spread from month two)
  definition v1; source periop OR log; as of 12 November 2026
  Trend (first cases on time / first cases, closed months)
    2025-11   83%   5/6
    2025-12   Not shown: 3 first cases this month; needs at least 4
    2026-01   80%   4/5
    ...
    2026-09   86%   6/7   restated after your dispute on case C-3H8VQ2;
      as logged 71% 5/7
    2026-10   71%   5/7

Duration estimate accuracy
  October: 11 of 14 cases within tolerance (79%). Needs at least 5
    cases.
  Records: 14 rows in the attachment under Duration estimate accuracy
  Compared to: subspecialty peers at your site
    (4 surgeons; spread from month two)
  definition v1; source periop OR log; as of 12 November 2026
  Trend (cases within tolerance / cases, closed months)
    ...

Block utilization (only if you have allocated block)
  Not in this release: needs the block allocation and release
  schedule; no owner of that data has been named yet

Same-day cancellations you could have prevented
  Counted quarterly; the quarter closes 31 December 2026.
  Scheduled cases so far this quarter: 24.
  3 same-day cancellations so far; 1 in the surgeon-attributable set
  Records: 3 rows in the attachment under Same-day cancellations you
    could have prevented
  Compared to: neurosurgeons at your site
    (9 surgeons; spread from month two)
  definition v1; source periop OR log; as of 12 November 2026
  Trend (cancellations counted / scheduled cases, closed quarters)
    history from 2025-10
    2025-Q4   1.6%   1/61
    2026-Q1   0.0%   0/58
    2026-Q2   3.3%   2/60
    2026-Q3   1.7%   1/59

OR turnover time, PACU boarding and room-ready delays are not on any
individual scorecard because a surgeon cannot move them alone. They
will appear only on division and site views.

BUCKETS 3 TO 6

Buckets 3 to 6 are not in this release. Each metric's definition and
the feed it needs are on the definition pages below.
<the metric names, in the brief's order, one line each>

HOW TO DISPUTE

Reply to this email with three lines:
Case id: (the first token on the row, for example C-7K3Q9M)
What is wrong: delay reason / on time / not my case / cancellation
  reason / something else
What happened: (describe the record by its case id; do not include a
  patient's name, MRN or date of birth)

How a dispute proceeds: your division chief decides, or the chair if
the chief is involved. The target is 14 days. The decision is one of:
sustained, not sustained, or a definition question. A sustained
decision corrects the row or credits the case to the right surgeon;
the reason you gave and the decision stay on the row. Periop is asked
to correct its record; until it does, both values show.

DEFINITIONS IN FORCE THIS PERIOD

<for each tile: the definition page text rendered by
 `scorecard definitions page <metric>@<version>`: What, Counted,
 Compared to, Shown as, You can move it by, recorded assumptions
 with status, reason sets in force or pending, version history>

Source: periop OR log, reconciled to periop's October report.
Sent by <analyst name> from the department mailbox; reply to dispute
or ask a question.
```

Month-two variant. The FIRST MONTHLY EMAIL block is replaced, in the same slot, by WHAT CHANGED SINCE SEPTEMBER 2026 (R-115): decisions on the surgeon's own disputes since the last email (each as its row text, F-59), restatements with both values (R-98), definition version changes ("First-case on-time start (FCOT) definition changed from v1 to v2 effective November: institutional grace window confirmed. The boundary is marked on your trend."), and the count of new records; "No changes since September 2026." when nothing changed. The two blocks never render together (a test fails on both or neither). When `self_only` is false and a group renders, each tile with a comparator gains the three lines of F-46 AC 6 immediately under the comparator line, in the metric's unit, the "You" line first (R-48), peers sorted ascending, nothing else:

```
  Neurosurgeons at your site: 7 peers, each with at least 4 first
    cases. Names are hidden, not people.
  You: 71%
  Peers: 43%, 57%, 60%, 67%, 75%, 80%, 86%
```

When the group does not render, the comparator line ends with the catalogue text instead: `Peer comparison not shown: only 4 other neurosurgeons at this site had 5 or more cases this month; 5 are needed for a comparison` (R-125, as reworded by the impeccable pass); when the surgeon is the only member of the group, `Peer comparison not shown: you are the only neurosurgeon in your subspecialty at this site` (`sole-peer`, R-129). In month one every comparator line ends `(spread from month two)` and no email contains a `Peers:` line (F-90 AC 4, F-35 AC 1); a test scans every month-one body for the string `Peers:` and fails on a hit.

Suppressed tile (F-32 AC 3, F-49 AC 3):

```
First-case on-time start (FCOT)
  October: Not shown: 3 first cases this month; needs at least 4
  Records: 3 rows in the attachment under First-case on-time start
    (FCOT)
```

The tile keeps its records line because the list opens even when the number is suppressed, and the row count equals the count in the reason. When no first case was credited, the reason reads `Not shown: no first cases were credited to you in October; needs at least 4`. When no tile in the email carries a value, the two preview lines read `Your October case list from periop's OR log. Only you receive this email.` (R-129) so the preview promises nothing the body cannot show.

As logged and as adjudicated (F-47 AC 1, AC 5), only when they differ:

```
  October: as logged 60% (6 of 10) · as adjudicated 67% (6 of 9).
  Records: 9 rows counted as adjudicated; 10 rows in the attachment
    (the re-credited row reads "not counted (re-credited)")
```

Trend table rules (F-43, F-108 AC 1, R-45): one row per closed period, vertical, so the widest line stays under 72 characters on a phone; up to 12 monthly rows, up to four quarterly rows, four rolling-12 rows for In-hospital mortality (O/E) when that metric ships; a period with no value carries its `gap_reason` text in place of a number; a restated row appends `restated <cause>` where the cause names the surgeon's own case id ("restated after your dispute on case C-3H8VQ2"), never a dispute id (R-126); a line `--- definition v2 from 2027-01 ---` marks a version boundary; `history from <date>` appears once above the first real row when the window is longer than the history (F-43 AC 2). No zero-filled or interpolated rows. A record row or trend row that must wrap at 72 characters continues on the next line indented two further spaces, so a continuation cannot be read as a new row (R-129).

The "what this is not" one-line text (F-42 AC 2) is the catalogue entry `what-this-is-not-line`, versioned with the statement; the current statement version reads: "Not a comp input, not a rank, not an OPPE record. Only you see it. Your chief sees one of your records only when you dispute it. No leader view exists in the pilot. A dispute changes your record list." The publish scan fails an artifact that lacks it.

Definitions appendix: F-90 says one attachment and F-50 AC 7 says the definition text is in the email months' artifact, so the definitions ride in the body, after the tiles, rendered from the registry by version (Builder decision S-5). A surgeon who reads on a phone sees the tiles first and the definitions last. Whether the full text must ride in every email or only in month one and on a version change is an open question for the catalogue owner (PRD 16.7).

#### The CSV of the surgeon's own rows

One file, `scorecard-<period>.csv`, UTF-8 with BOM (so iOS and Android mail clients and Excel open it, F-90 AC 6), one row per (metric, record). Row counts per `metric` value equal the tile denominators (F-49 AC 2); a case that feeds two metrics appears twice with different `metric` values (Builder decision S-4). No patient identifier of any kind (F-90 AC 11): no name, MRN, date of birth, CSN, encounter number, phone, or source free text. `case_id` is the `record_ref` surrogate of the Data model section, Builder decision 3 (D-19).

| Column | Type | Source | Notes |
|---|---|---|---|
| `metric` | text | tile | The metric name as the brief writes it (`OR case volume`, `First-case on-time start (FCOT)`, `Duration estimate accuracy`, `Same-day cancellations you could have prevented`), never the engine key (R-126); the email's records line names the same words |
| `period` | text | tile | `2026-10` or `2026-Q4` |
| `case_id` | text | `ledger.record.record_ref` | The id the surgeon quotes in a reply (F-54 AC 3, AC 5) |
| `date` | date | `src.case.date_of_surgery` | |
| `room` | text | `src.case.room` | |
| `procedure` | text | `src.case.procedure_desc` | Procedure description as periop stores it; scanned as a free-text field for identifiers before send (F-106 AC 7) |
| `scheduled_start` | time | `src.case.scheduled_start` | FCOT rows |
| `wheels_in` | time | `src.case.wheels_in` | FCOT rows |
| `on_time` | yes/no | `metric_value_record.in_numerator` (also `detail ->> 'on_time'`) | FCOT rows |
| `delay_reason` | text | `src.case.delay_reason_code` | As stored; never changed by the label |
| `delay_label` | text | reason set version (F-101) | `your delay`, `not your delay`, or `pending periop leadership sign-off` |
| `booked_minutes`, `actual_minutes` | int | `src.case` | Duration rows |
| `within_20pct`, `within_30min`, `test_applied` | yes/no, yes/no, text | row detail (F-16) | Duration rows |
| `cancelled_same_day`, `cancellation_reason`, `in_attributable_set` | yes/no, text, yes/no | `src.case`, reason set (F-102) | Cancellation rows |
| `counted` | yes/no | `not metric_value_record.excluded` | `no` for "not counted" rows (cancellations outside the set; re-credited rows under the adjudicated basis) |
| `shared` | yes/no | `ledger.attribution.shared_flag` | F-01, F-49 AC 5 |
| `credited_to` | text | attribution | `you`; on a receiving surgeon's list a re-credited row still reads `you` and `dispute_state` names the source surgeon (F-49 AC 6, F-59 AC 5) |
| `source`, `load_date` | text, date | `feed_load` | `periop OR-log extract`, ticket omitted from the surgeon copy |
| `definition_version` | text | `metric_value.definition_version_id` | Same stamp as the tile (F-51 AC 3) |
| `dispute_state` | text | `ledger.dispute.state` rendered by F-59 catalogue | Empty when never disputed; otherwise the exact row state text |

The last line of the email's records instruction and the first comment line of the CSV both carry the F-56 effect notices for the disputable fields of this record type, verbatim from the definition version: "A sustained delay-reason dispute corrects the reason on this row. The case stays late and your FCOT number does not move, so it still matches periop's report." and the credited-surgeon notice (F-56 AC 4). CSV readers show the comment line as row 1, which is acceptable; a builder who dislikes it can move the notices to the body (Builder decision S-4 records both).

Numbers-only fallback (recorded in the runbook, security judge decision 4; D-31): if the privacy office declines attachments, `scorecard publish --numbers-only` sends the body alone with each `Records:` line replaced by "Your case list is available from the department analyst on request until the hosted view opens", and the delivery row records `attachment_included = false`. This is a fallback, not the plan.

#### Dry run, preview and the .eml fallback

`--dry-run` writes, per clinician, `email.txt`, `scorecard-<period>.csv` and `message.eml` (a complete RFC 5322 message with the attachment, built by `email.message.EmailMessage`) under `preview/<period>/<clinician_ref>/`, plus `preview/<period>/index.html`, an index the analyst opens locally, and the period-level files the analyst checks the emails against (`reconciliation.txt`, `suppression.txt`, `chief_summary.txt`, `override_list_<feed_key>.csv`, `checklist.txt`): recipient as resolved, scan result, self-only flag, byte sizes, and the body inline. The delivery row is written with `channel = 'preview'` and `sent_at` null, so the artifact hash of what was previewed is on record before the send.

`--eml` is the fallback when the SMTP relay is unavailable or the relay request has not landed by month one. It writes the same `.eml` files and a `manifest.csv` (clinician_ref, recipient, sha256, path). The analyst opens the department shared mailbox in Outlook (the same mailbox `--send` uses as sender) and sends each `.eml` from there. Never from a personal mailbox: the security judge flagged that a case list in a personal Sent Items folder is outside the department mailbox's access list and retention policy (Builder decision S-3). After sending, `scorecard publish --record-eml-sent --period P --manifest manifest.csv` writes `sent_at` on each delivery row with `message_id = 'eml:<sha256>'` because Outlook does not hand the Message-ID back.

#### SMTP relay and mailboxes

| Item | Value | Where recorded |
|---|---|---|
| Sender | Department service mailbox (a shared Exchange mailbox, not a person), for example `neurosurgery-scorecard@...` | `department_setting.service_mailbox` |
| Reply-To | Dispute mailbox, a shared Exchange mailbox whose membership is the analyst and the named backup analyst only, with an Exchange retention policy set by data governance (OQ-57) | `department_setting.dispute_mailbox` |
| Relay | MGB internal SMTP relay, IP-restricted to the VM (or the analyst's workstation in the M1 interim), STARTTLS, no credentials in the repo; host and port in `department_setting.smtp_relay` | Relay request ticket recorded at M0 in `department_setting.smtp_relay_ticket` |
| Recipient | Resolved at send time from the institutional directory by the roster identity (`clinician.person_key`), never typed on the roster (F-90 AC 8, OQ-58); a mismatch between the roster's stored address and the directory blocks that surgeon's send and lists it on the F-112 checklist | `delivery.recipient_resolved_from = 'directory'` |
| Headers | `Message-ID` captured after `smtplib.SMTP.send_message`; `X-Scorecard-Run: <run_id>`; `X-Scorecard-Artifact: <sha256>`; `Auto-Submitted: auto-generated` on decision and acknowledgement emails only (the monthly email invites a reply) | `delivery.message_id` |
| Bounces | The service mailbox receives NDRs (`Return-Path` set to it, not to the dispute mailbox, so a bounced case list returns to the mailbox that already holds it as sent and never lands beside surgeon replies); `scorecard reply ingest-ndr` reads that mailbox over IMAP, classifies an NDR as a bounce, writes `delivery.bounce_at`, `bounce_reason` (F-90 AC 9) and then deletes the NDR message so the returned artifact does not accumulate as a second copy; retry with `publish --resend --clinician K` only after `scorecard roster set --clinician K --identity <person_key> --effective D` fixes the identity | `delivery`, F-112 checklist item (f) |
| Misdirected send | `scorecard delivery incident --delivery <id> --reference <procedure ref>` records the incident (F-90 AC 10); the procedure itself is OQ-58 | `delivery.incident_ref` |

The directory lookup mechanism (LDAP query against MGB Active Directory versus a Microsoft Graph call) is Builder decision S-6.

#### Delivery rows

`ledger.delivery` is defined in the Data model section. The publisher writes one row per artifact per channel and never updates a row except to set `sent_at`, `message_id`, `bounce_*` and `incident_ref`. What each channel stores:

| Channel | `clinician_id` | `recipient_kind` | Artifact hashed | Gate checked |
|---|---|---|---|---|
| `preview` | surgeon | `surgeon` | body + CSV | none |
| `scorecard_email` | surgeon | `surgeon` | body + CSV (`.eml` bytes) | `gate.privacy_email.scorecard` |
| `ack_email` | surgeon | `surgeon` | body | `gate.privacy_email.decision` (same channel class; OQ-47) |
| `dispute_filed_email` | disputant | `chief`, `chair`, `analyst` | body (record columns and provenance, F-52) | `gate.privacy_email.adjudicator` |
| `recredit_email` | receiving clinician | `surgeon` | body | `gate.privacy_email.recredit` |
| `decision_email` | disputant | `surgeon` | body | `gate.privacy_email.decision` |
| `override_list` | null | `feed_owner` | list | `gate.privacy_email.override_list` |
| `deadline_email` | null | `chief`, `chair`, `analyst` | body (ids only) | none needed: carries no record content (F-112 AC 8), scanned anyway |

`scorecard delivery show --period P` prints the send log with one row per surgeon (F-90 user-facing behavior). `run.published_at` is written once by `publisher` after the last successful send of the period; `--resend --clinician K` writes a new `delivery` row and does not move "last refreshed" (F-83 AC 3).

#### Reply intake and the adoption log

Replies to the dispute mailbox are read by the analyst in Outlook; nothing polls the mailbox automatically at M1 (the mailbox is not the record; the ledger is). The analyst logs each reply within two business days:

```
scorecard reply log --clinician K --period 2026-10 --received 2026-11-14 \
    --class dispute|question|seen --message-id "<...>"
scorecard dispute file --reply R-0031 --record C-7K3Q9M --field delay_reason_code --by <clinician_key> \
    --claim "I was in the room at 07:20; anesthesia induction started 07:38"
scorecard notify ack --dispute D-0014           # "Dispute received on case C-7K3Q9M, filed 2026-11-14, routed to chief"
scorecard reply answer --reply R-0032 --answered 2026-11-15 [--definition-item fcot "grace window"]
```

`ledger.reply_log` (the Data model section) carries `classification`, `entered_at`, `dispute_id`, `answered_at` and `message_id`. A reply with no case id is logged with `classification = 'awaiting_row'` and counts as unentered on the F-112 checklist until resolved (F-57 AC 3). `scorecard adoption report --period P` reads `reply_log`, the month-three interview answers (`scorecard interview record --clinician K --opened-list yes --when 2027-01-20`) and, from M2, `audit_log` view rows, and prints the F-91 AC 4 figures with the kill flag.

#### The other M1 emails

All are plain text, one record each, rendered from `templates/*.txt.j2`, scanned, gated and logged like the monthly email. None carries a peer identity, a spread, another surgeon's value or a survey comment (F-92 AC 3, AC 4).

| Email | Trigger | To | Body | Feature |
|---|---|---|---|---|
| Acknowledgement | `dispute file` | disputant | "Dispute received on case <id>, filed <date>, routed to <chief or chair>." | F-57 AC 2 |
| Dispute filed | `dispute file` | adjudicator and analyst | "Dispute filed on case <id> by <surgeon>: <claim>." then the record columns exactly as on the surgeon's row and the provenance block (source, load date, ticket, attribution rule, definition version, stored value, metrics and period fed, shared flag, prior disputes), then the reply instruction: "Reply with three elements: decision (sustained / not sustained / definition question), outcome when sustained (annotated / source corrected), and a note." No metric value of anyone. | F-92 AC 5, F-52, F-111 AC 3 |
| Re-credit | sustained re-attribution | receiving clinician | "Case <id> re-credited to you from <surgeon> by <role> on <date>: <note>." plus the record columns and "To dispute this record, reply quoting the case id." | F-92 AC 2 |
| Decision | `dispute decide` then `recompute` | disputant | "Decision on case <id>: <F-59 row text>." then the updated tile block in the monthly format (value or as logged / as adjudicated or reason; denominator; definition version; as-of). At M2 a deep link to `/records/<record_ref>`. | F-93 |
| Deadline | `scorecard status --daily --send`, day 10 and day 14 | adjudicator and analyst | "Dispute D-0014 on case C-7K3Q9M has been open 10 days; the target is 14." Ids only. | F-112 AC 4 |
| Override list | `publish` | feed-owner contact | One table: case id (periop id, the Data model section `record.source_key`), field, logged value, adjudicated value, decider role, decision date, definition version, dispute id. Every unconfirmed override, including prior months. | F-64 |
| Weekly status | systemd timer (`scorecard status --weekly --send`) | analyst | feed health, last refreshed per source, disputes over 14 days, grants check | Ingestion and operations section |

### M2: the web app

#### Shape

One server-rendered app, one process, one VM, one SSO mapping, one security review. The design doc recommended building this hosted view on the enterprise BI tool (its Approach C, "for hosting only") once governance clears; D-04 chooses the app instead and keeps pub as the optional BI export, because the dispute button, the queue, the inbox and the private notes need per-request authorization and service-function calls a BI workbook cannot make, and a BI layer would add a second SSO mapping, a second security review and a per-workbook RLS setting for chart rendering the app already does. No single-page front end, no client-side data store, no JavaScript needed to read any page. Every request resolves the SSO identity to a roster row as of today, computes the viewer's roles, and every query is scoped by the resolved clinician id; Postgres RLS on the RLS set (`metric_value`, `metric_value_record`, `suppression_decision`, `peer_group_snapshot`, `comparison_target`, `record`, `attribution`, `dispute`, `src.survey_response`, `restricted.survey_comment`, `restricted.private_note`; the Data model section, roles table) reads the session variables the app sets as defense in depth, so a query bug in `web/views/inbox.py` returns no other surgeon's comments even with the matrix bypassed. Every statement in `web/queries.py` is parameterized through psycopg; `tests/web/test_no_sql_strings.py` greps `web/` for f-strings, `%` formatting and concatenation that build SQL and fails on any hit.

```
 browser --TLS--> [MGB SSO: OIDC or SAML] --> web/app.py (gunicorn behind nginx on the VM)
                                                |
                                                | before_request:
                                                |   identity = sso.subject (upn, person_key)
                                                |   roster   = roster_as_of(today, identity)      -> none => `not-on-roster`
                                                |   roles    = {surgeon, chief_of[...], chair, direct_leader_of[...], analyst}
                                                |   db.set_session(clinician_id, role)             -> RLS context
                                                |
                                                v
                                       authz.allow(viewer, role, resource, subject)   (tested matrix)
                                                |  refused => `not-authorized` page + audit_log('refused')
                                                v
                                       view: viewer-scoped SQL -> ClinicianArtifact / rows -> Jinja2 -> HTML
                                                |
                                                v
                                       audit_log('view', page, subject_clinician_id, outcome)   (F-107)
```

The app reads the same `ledger` rows `publish` read; for any surgeon and period the tile values, denominators, reasons and version ids are identical in the email and the page (F-85 AC 1), which a test asserts by rendering both from one fixture.

#### Page inventory and URL patterns

`<period>` is `YYYY-MM`. `<clinician_ref>` is the opaque roster token (`K-...`, the Data model section's Builder decision 3, D-19), never a name or an integer id. `<record_ref>` is the surgeon-facing case id. Pages are listed with the earliest milestone at which they exist.

| URL | Page | Viewer | Milestone | What it shows | Features |
|---|---|---|---|---|---|
| `/` | Redirect to `/me` | any roster identity | M2 | | |
| `/me` and `/me/<period>` | Scorecard home | surgeon (self) | M2 | Period picker (closed periods only, F-84); "last refreshed"; the what-changed aside (R-115), which carries `first-hosted-visit` when `audit_log` holds no prior `view` by this identity and `run-missed` when the expected period has not published (R-127); the six buckets as sections in the brief's order with every tile in compact form (value or reason, comparator line, definition stamp, the records link with its open-dispute count); the F-104 text in bucket 2; the "what this is not" line in the footer | F-42, F-43, F-44, F-45, F-46, F-47, F-83, F-84, F-104 |
| `/me/<period>/bucket/<n>` | Bucket page | surgeon | M2 | Full tiles for one bucket; for bucket 5 the Patient experience layout (below) | F-69 (bucket 5) |
| `/me/<period>/metric/<metric_key>` | Metric tile | surgeon | M2 | Value or reason; as logged / as adjudicated when they differ; comparator line and peer count; spread chart with the three-line text form beneath it; trend chart with the vertical text table beneath it; definition stamp linking to the definition page; source and as-of line; "Records: <n> rows" link, reading "Records: <n> rows (<k> disputed)" while any dispute the viewer filed on that list is open (R-127; the count is the viewer's own, never a peer's); for wRVU and M&M the kind-specific block | F-34, F-43, F-46, F-47, F-51, F-97, F-77, F-74 |
| `/me/<period>/metric/<metric_key>/records` | Record list | surgeon | M2 | Table with the CSV columns for the record type; row count in the heading equals the denominator; a "Dispute this record" button on every row; dispute state text on the row; opens for suppressed metrics; sortable by column header without JavaScript (query string) | F-49, F-54, F-59, F-53 (survey) |
| `/records/<record_ref>` | Record detail | credited surgeon; adjudicator of an open dispute on it; receiving clinician after a re-credit | M2 | The row's columns, provenance block, every dispute ever filed on it in order with states (F-62 AC 1), the re-file control when allowed | F-52, F-59, F-62 |
| `/records/<record_ref>/dispute` | Dispute form (GET shows, POST files) | credited surgeon only | M2 | Record identity, metrics fed, disputable-field selector limited by F-04, claim text (or the structured survey form), the F-56 effect notice above the submit control; on submit: `disputes.file()` then redirect to `/disputes/<id>` | F-66, F-56, F-58, F-72 (M4) |
| `/disputes/<dispute_id>` | Dispute detail | disputant; adjudicator; analyst | M2 | Surgeon view: claim, state, decision, note, linked disputes. Adjudicator view: the F-52 provenance panel, the decision form (decision, outcome when sustained, note required), no metric value of anyone. Survey record (M4): comment shown only when the adjudicator is the direct leader of record (F-72 AC 5) | F-52, F-61, F-62, F-63, F-86 |
| `/queue` and `/queue/closed` | Adjudicator queue | chief, chair | M2 | Open disputes routed to the signed-in adjudicator, oldest first, age in days, flagged past 14; closed list with decision dates; no values, spreads or positions | F-60, F-86 |
| `/definitions/<metric_key>@<version>` | Definition page | any roster identity | M2 | Text verbatim with version and source; cadence; min-n; comparator; brief notes and "You can move it by"; recorded assumptions with status; reason sets in force or the exact pending text; version history with confirmer and date; open items from disputes; for M&M attendance the scaled-target formula. The page for `v1` keeps showing `v1` after `v2` exists | F-50, F-63, F-13 |
| `/definitions` | Definition index | any roster identity | M2 | Every metric, its version in force per period, availability state | F-50 |
| `/whats-not` | "What this is not" | any roster identity | M2 | The one-page statement, current version and date | F-42 |
| `/me/inbox` | Patient feedback inbox | surgeon | M4 | Comments newest first with same-survey scores; private notes under each; note form; dispute status beside a disputed response; survey scope label; no count, badge, tally or summary anywhere including navigation | F-70, F-71, F-73, F-88 |
| `/me/inbox/<response_ref>/note` | Private note (POST create, PUT edit, DELETE) | surgeon (author) | M4 | | F-71 |
| `/leader/<clinician_ref>/inbox` | Direct leader inbox view | direct leader of record, from day 30 | M4 | Same comment list, no notes, no note controls; measures and chart only when `leader_sees_measures` is true (default off) | F-89, F-88 |
| `/leader` | Leader landing | direct leader | M4 | The surgeons for whom the viewer is direct leader of record, each with the date their inbox becomes available to the leader | F-89 AC 1 |
| `/analyst/runs`, `/analyst/runs/<run_id>` | Runs | analyst | M2 | Run rows, gate results, checklist, stored preview index | F-95, F-112 |
| `/analyst/feeds` | Feed health | analyst | M2 | `feed_load` rows per source, status, as-of, field checklist | F-82, F-80 |
| `/analyst/exceptions` | Attribution exceptions | analyst | M2 | Open exception list with resolve controls calling the the Data model section service functions | F-02 |
| `/analyst/suppression/<period>` | Suppression grid | analyst | M2 | Surgeon by metric states and reasons; render report by peer-count bucket | F-32, F-36 |
| `/analyst/reconciliation/<period>` | Reconciliation | analyst | M2 | Per-surgeon table: ours, periop's, delta, explanation | F-81 |
| `/analyst/disputes` | All disputes | analyst | M2 | Every dispute with state, age, adjudicator; the F-98 trust report; no comment text ever (analyst has no grant) | F-98, F-60 |
| `/analyst/roster` | Roster | analyst | M2 | Dated roster rows, mapping check (chief, direct leader, chair), attendee and opt-out flags | F-87, F-99 |
| `/analyst/registry` | Definitions and configuration | analyst | M2 | Versions, hashes, params with status, deltas, reason sets and sign-off state | F-13, F-100, F-101, F-102 |
| `/analyst/gates` | Governance gates | analyst | M2 | `gate.*` rows with signed_by, signed_on, confirmed_by, confirmed_on, reference (opened as a link when it is a ticket URL); which channels are open; the governance reviewer reads this page at recertification | F-106 |
| `/analyst/deliveries/<period>` | Send log | analyst | M2 | `delivery` rows, bounces, incidents | F-90 AC 9, AC 10 |
| `/analyst/audit` | Access audit | analyst | M2 | `scorecard audit` as a page: who viewed whose data, ids only | F-107 |
| `/healthz` | Liveness | nginx only | M2 | 200 and the git sha; no data | |

Analyst screens are the app's own pages over `analyst_ro`-visible tables through the `app` role's service functions; they exclude `restricted` and `privileged` (security judge: Django admin, if Django is chosen, is disabled or restricted to exactly these screens).

Deep links. The monthly email carries a link only after the three hosted gates are recorded (F-85 AC 6): `https://<host>/me/<period>` in the header and `/me/<period>/metric/<metric_key>/records` on each `Records:` line; the decision email carries `/records/<record_ref>` (F-93 AC 5). The link is added by `email_text.py` reading `gates.hosted_open()`, never hand-edited into a template.

#### Authorization matrix (viewer x role x resource)

Roles are computed per request from the dated roster as of today (F-85 AC 2, F-86 AC 5): `surgeon` (the identity is a roster clinician), `chief_of(S)` (division chief of S), `chair`, `direct_leader_of(S)`, `analyst` (identity equals `department_setting.analyst_clinician_id` or the backup). A person can hold several. "Subject" is the surgeon whose data the resource belongs to. `authz.allow()` returns allow or a refusal code, and `tests/web/test_authz_matrix.py` iterates every cell below with fixture identities (F-86, F-88, F-89).

| Resource | Self (subject = viewer) | Chief of subject | Chair | Direct leader of subject | Analyst | Other roster identity | Not on roster |
|---|---|---|---|---|---|---|---|
| Home, bucket, metric tile, trend, spread (`/me/...`) | allow | refuse `not-authorized` | refuse | refuse (default; `leader_sees_measures` flips only bucket 5 tiles, F-89 AC 4) | refuse | refuse | `not-on-roster` |
| Record list (`/me/.../records`) | allow | refuse | refuse | refuse | refuse | refuse | `not-on-roster` |
| Record detail (`/records/<ref>`) | allow when credited | allow only while a dispute on it is routed to them, and only that record | same rule for chair-routed disputes | refuse | refuse (analyst uses `/analyst/...`) | allow only as receiving clinician after a sustained re-credit (F-86 AC 3) | refuse |
| Dispute form (POST) | allow when credited (F-66 AC 4) | refuse | refuse | refuse | refuse | refuse | refuse |
| Dispute detail (`/disputes/<id>`) | allow as disputant (and as receiving clinician on a linked counter-dispute) | allow when adjudicator; comment text withheld unless also direct leader (F-72 AC 5) | allow when adjudicator (escalated only) | refuse unless adjudicator by the survey routing setting (D-20) | allow, minus comment text and minus values of anyone | refuse | refuse |
| Decide (POST) | refuse | allow when adjudicator and no routing test fired (F-58 AC 3) | allow when adjudicator | per routing | refuse | refuse | refuse |
| Queue (`/queue`) | n/a | allow, own routed disputes only | allow, escalated only | per routing | refuse (uses `/analyst/disputes`) | refuse | refuse |
| Definition pages, `/whats-not` | allow | allow | allow | allow | allow | allow | allow (no surgeon data on them) |
| Inbox (`/me/inbox`) | allow | refuse unless also direct leader, via `/leader/...` | refuse | via `/leader/...` only | refuse (no viewer role; F-88 AC 4) | refuse | refuse |
| Private notes (create, edit, delete, read) | allow, author only | refuse | refuse | refuse (F-71 AC 3) | refuse | refuse | refuse |
| Leader inbox view (`/leader/<ref>/inbox`) | n/a | refuse unless direct leader of record | refuse | allow from `inbox_first_available + 30 days`, else `leader-gate` (F-89 AC 1) | refuse | refuse | refuse |
| Leader landing (`/leader`) | n/a | refuse unless direct leader of at least one surgeon | refuse | allow; lists only the surgeons for whom the viewer is direct leader of record as of today, with each inbox's available-from date; writes one `view` row with `details.subject_ids` | refuse | refuse | refuse |
| Analyst screens | refuse | refuse | refuse | refuse | allow | refuse | refuse |

Every refusal renders the catalogue text for its code and writes an `audit_log` row with `action = 'refused'` and the outcome code (F-85 AC 7, F-107 AC 1). Every allowed open of a record list, record detail, dispute, queue, inbox or leader view writes `action = 'view'` with `subject_clinician_id`. Home and tile opens write `view` too because they are surgeon-identified pages (F-85 AC 5).

Refusal payloads contain nothing from the subject: the `not-authorized` page is the same bytes for "record exists but is not yours" and "record does not exist" so a URL cannot be used to probe (F-88 AC 1).

#### SSO integration

| Option | How it works | Judge view |
|---|---|---|
| (a) In-app OIDC (Entra ID) or SAML, via a maintained library | The app is a registered client; the library validates the token or assertion signature, audience, issuer and expiry; the app keeps a signed session cookie holding only the SSO subject and its expiry | Security judge: recommended ("token validation in-app removes the question of how a request reaches the app without the proxy") |
| (b) MGB SAML reverse proxy or App Proxy injecting a UPN header | The proxy authenticates; the app trusts `X-MGB-UPN` from the proxy | Staff judge's Flask option assumed this; security judge: acceptable only if the app's listener is reachable solely from the proxy (network ACL or mTLS) and the header is signed |

Recommended: (a). If MGB IAM mandates (b), the app binds to a loopback or private interface reachable only from the proxy, verifies a signed header (HMAC or the proxy's JWT) and refuses any request without it; this is Builder decision S-2. Either way, the identity the app uses is `upn` mapped to `ledger.clinician.upn` (nullable until M2, the Data model section, Builder decision 2 (D-18)), and a UPN that matches no roster row as of today gets `not-on-roster` (F-85 AC 7).

Sessions: a signed cookie with `subject`, `issued_at`, `expires_at` (idle 30 minutes, absolute 8 hours) and nothing else; roles are recomputed per request from the roster, never cached in the cookie, so a roster change takes effect on the next request (F-87 AC 4, F-88 AC 3). CSRF token on every POST form. `Cache-Control: no-store` on every surgeon-identified page.

What a security review asks next, fixed here:

| Item | Rule |
|---|---|
| Cookie attributes | `Secure`, `HttpOnly`, `SameSite=Strict`, `Path=/`, no `Domain`; the name carries the `__Host-` prefix |
| Signing key | In `/etc/scorecard/env`; rotated on a 90-day runbook item and on any suspected exposure; two keys accepted during a rotation window so open sessions are not cut |
| Logout | `/logout` clears the cookie and redirects to the IdP's end-session endpoint (OIDC RP-initiated logout or SAML SLO); an IdP-initiated logout invalidates the subject's sessions by writing `identity.logout_before` and the next request compares `issued_at` |
| Headers | `Strict-Transport-Security` (one year, `includeSubDomains`), `Content-Security-Policy: default-src 'self'` (inline SVG needs no exception; no scripts unless the S-7 fallback is taken, then a hashed source), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer` |
| IdP disable inside the 8-hour window | The app revalidates the subject against the IdP at every idle boundary (a silent OIDC re-authentication or a SAML re-auth) and refuses a disabled account then; a roster end (`faculty_to`) is honoured on the next request because roles come from the roster. MGB IAM may ask for a shorter window; it is a setting |
| How `ledger.identity` and `clinician.upn` are populated | Only from the directory lookup by `person_key` (D-34, `directory.py`): `scorecard roster set --clinician K --identity <person_key>` resolves the UPN through the directory and writes `identity` and `clinician.upn` from the answer, and the first SSO login of a subject is matched to a roster row through the same lookup, never by a typed value. A hand-typed UPN is refused, because a typo would bind another person's SSO account to a surgeon's scorecard |
| Audit of identity | `ledger.identity` is in the audit-trigger list and in `scorecard audit` (the Dispute workflow section) |

#### Stack: Flask versus Django, recorded with each judge's recommendation

| | Flask + Jinja2 + psycopg | Django 5 LTS |
|---|---|---|
| Staff engineer judge | Recommended. "The schema is owned by SQL migrations and identity comes from MGB's SSO, so Django's ORM and auth become a second description of the tables and a second identity layer. Flask keeps one builder's app small." | Acceptable "only if the team already runs Django and wants the admin for analyst screens" |
| Clinical informatics and security judge | Acceptable "provided SSO is validated in-app rather than by a trusted header" | Recommended. "Django's auth, sessions, CSRF and permission machinery are what hospital security reviewers have already seen; one builder maintains engine and app in one language." Admin disabled or restricted to analyst screens excluding restricted and privileged schemas |
| SSO libraries | `authlib` (OIDC) or `python3-saml` | `mozilla-django-oidc` or `djangosaml2` |
| Schema | SQL migrations own it; `psycopg` queries in `web/queries.py`, parameter-bound only; no ORM | SQL migrations own it; unmanaged models are a second description of every table (both judges note it) |
| Sessions, CSRF | `itsdangerous`-signed cookie; `flask-wtf` CSRF or a 20-line middleware | Built in |
| Admin | None; analyst screens are ordinary views | Built in; must be disabled or fenced |
| Templates | Jinja2, shared with the email templates | Django templates, or the Jinja2 backend so the email and app share macros |

Both are recorded. The rest of this section is written against Flask, with the Django equivalents being the same views and templates under Django's URL conf. Tie-break for the builder (Builder decision S-1): choose Django if the builder or the analyst has taken a Django app through an MGB security review before, because the reviewer's familiarity is worth the ORM duplication; otherwise choose Flask, because the app is a dozen viewer-scoped queries and a template set, the schema is already owned by SQL, and the SSO library validates in-app either way. Whichever is chosen, the views call the same service functions the CLI calls (`scorecard/disputes/*.py`, `scorecard/publish/render.py`), so the framework holds no logic and can be swapped without touching the ledger.

#### Charts

The brief asks for a trend line, a count with a trend line, an anonymous bar chart with the viewer's own bar highlighted, and monthly bars with last year's bars ghosted. The design doc adds interval or funnel charts for O/E and rate metrics. Everything else is text.

Recommended (Builder decision S-7, D-35): server-rendered inline SVG from a small in-repo module `scorecard/publish/charts.py` (about 300 lines): `trend_line()`, `bar_spread()`, `ghost_bars()`, `interval_dots()`. No third-party JavaScript, no CDN, no build step; hover text for the logged value and restatement note comes from SVG `<title>` elements (F-47 AC 3), and every chart is followed by the same text table the email carries (F-108 AC 2). Fallback: a single vendored file (`static/vendor/uplot.min.js` or `chart.umd.js`) checked into the repo with its licence and hash, loaded only on metric pages, with the SVG or text table still rendered server-side so the page reads without JavaScript. The adopted architecture's phrase "a small vendored library" is satisfied either way; the in-repo SVG module is the smaller review surface.

Chart rules, enforced by `tests/web/test_charts.py`:

- No peer label, id or initials anywhere in a spread; only `is_viewer` is styled (F-46 AC 2).
- The viewer's own marker is distinguished by shape and by an adjacent text label "You", never by colour alone (F-108).
- O/E and rate charts draw the interval; a bar chart of point estimates for those metrics fails the test (design doc Constraints, F-24).
- Restated points carry a marker and a legend; version boundaries a vertical rule with version ids (F-96 AC 2).
- Ghosted series (wRVU last year, prior snapshot) use a hatched fill and a legend entry, not a lighter tint alone.
- Strokes, marker sizes and shapes follow `DESIGN.md` (Rule stroke 1.5 px; 12 px hollow peer circles; the surgeon as a 12 px filled square; restated points as filled diamonds). On a strip plot, tied peer values stack vertically to a cap of four; a fifth tied value thickens the marker's stroke and the text table carries the count ("4 peers at 75%").
- Charts carry `role="img"` and an `aria-describedby` pointing at the text table.

#### Empty, loading, error and suppressed states per page

There is no client-side loading state: pages are server-rendered in one request. "Loading" below means the request took longer than the nginx timeout or the render failed midway; the app never streams a partial page (F-85 AC 7 `load-failure`).

| Page | No published period | Identity not on roster | Suppressed cell | Not authorized | Load failure | Empty (legitimately nothing) |
|---|---|---|---|---|---|---|
| Home, bucket, tile | `no-period`: "No period has been published yet. The first period publishes after <date>." | `not-on-roster`: "No scorecard: your identity is not on the department roster as of today. Contact <analyst mailbox>." | The catalogue reason text in the value position; the tile keeps its comparator line, definition stamp and records link (F-32 AC 4, F-49 AC 3) | `not-authorized` | `load-failure`: "The page could not be loaded. Your data has not changed. Try again or contact <analyst mailbox>." | A tile whose metric is `not_in_release` or `pending_source` renders that reason; never a blank (F-44) |
| Record list | `no-period` | `not-on-roster` | List renders with the same columns and dispute buttons; heading "3 rows (Not shown: 3 first cases this month; needs at least 4)" | `not-authorized` | `load-failure` | Zero rows only when the denominator is 0 and the feed loaded: "No rows: the October extract loaded and credited no cases to you" (F-14 AC 3, wording per R-126); a failed feed renders `feed-not-received` instead |
| Dispute form | n/a (a record implies a period) | `not-on-roster` | n/a | `not-authorized` (record not yours, F-66 AC 4) | `load-failure` | Field selector empty is impossible: a record type with no disputable field has no button (F-56 AC 1) |
| Dispute detail | n/a | `not-on-roster` | n/a | `not-authorized` | `load-failure` | Survey dispute: "Comment withheld: shown only to the direct leader of record" in the comment position for other adjudicators (F-72 AC 5) |
| Queue | "No open disputes routed to you." | `not-on-roster` | n/a | `not-authorized` (not a chief or chair) | `load-failure` | "No open disputes routed to you." with the closed list link |
| Definition page | Renders regardless of periods | Renders (no surgeon data) | n/a | n/a | `load-failure` | Unknown metric or version: 404 page with the definition index link |
| Inbox | `no-period` variant: "No survey month has been published for you yet." | `not-on-roster` | A hidden survey month affects measures, not the inbox; comments from a hidden month still list (F-41 AC 5 analogue) | `not-authorized` (payload holds no comment text, F-88 AC 1) | `load-failure` | "No comments about you in the loaded survey months." No count anywhere else (F-70 AC 2) |
| Leader inbox view | as inbox | `not-on-roster` | as inbox | `not-authorized`, or `leader-gate`: "Available to the direct leader from <date>" | `load-failure` | as inbox |
| Analyst screens | Runs page shows "no runs" | `not-on-roster` | n/a | `not-authorized` | `load-failure` | Plain "none" per table |

Every state string above is a catalogue key rendered by `reasons.render()`; a template that types one of these strings fails `tests/web/test_state_strings.py`, which greps `web/templates` for the literal texts.

Wording fixed by the impeccable pass (PRD section 9.4, R-126, R-127; `docs/reviews/impeccable-design.md`): `not-authorized` reads "This page is not available to you. If you think it should be, contact <analyst mailbox>." and is the same bytes whether the resource is another surgeon's or does not exist; `period-not-published-for-you` takes its reason from a fixed set of catalogue sentences ("your roster entry ended before this period"; "your identity could not be matched to the directory"; "the publish for this period was held"), never from `run` text; `run-missed` ("The November scorecard has not been published yet. This page shows October, last refreshed 12 November 2026.") renders in the what-changed aside when `today` is past the expected publish date for the next period and no publish run exists; `first-hosted-visit` ("First visit. This page shows the same numbers as your October email, plus the records behind each one and a dispute button on every row.") renders once, decided by the absence of a prior `view` row for the identity. The dispute form shows "A dispute on this field is already open (filed <date>). What you write here is added to it." when an open dispute exists on the record and field, and its POST is idempotent on that triple (R-128). The record detail adds "You may file once more on this record with new evidence." under a not-sustained decision while the re-file is allowed (F-62).

Error handling: an unhandled exception renders `load-failure` with a correlation id shown on the page as "Reference <8 characters>" so a surgeon can quote it to the analyst (R-129), writes an `audit_log` row `outcome = 'error'` and an application log line with ids only (no names, procedures, comments, claims). No stack trace reaches the browser. The database connection uses a statement timeout of 10 seconds; a timeout is a `load-failure`, never a partial table.

#### Accessibility baseline

The institution's standard is OQ-51; the floor that does not depend on it (F-108):

- Semantic HTML: one `h1` per page, `h2` per bucket, `h3` per tile; tables with `<th scope>` and a `<caption>` naming the metric and period; forms with `<label for>`.
- Every state, marker and interval is text on the page, not only colour, icon or position: suppressed cells are the reason sentence; restated points carry "restated" in the text table; the viewer's marker has the label "You"; "no evidence of difference" is a sentence (F-24).
- Colour contrast 4.5:1 for text; charts use two shapes plus text, not two hues. Colours, faces, sizes, the focus ring and every component's states are the tokens and inventory in `DESIGN.md` at the repository root (R-120); every template cites a component name from it.
- CI renders every page at 360 px and 1280 px, and at 1280 px under 200% zoom; a `forced-colors` rule set gives tables and the dispute-state cell 1 px `CanvasText` borders so structure survives Windows high-contrast mode (R-129).
- Keyboard: every button and link reachable in order; skip link to the tile list; the dispute form submits with Enter.
- No JavaScript required to read, navigate, file a dispute, decide, or write a note.
- Phone width: single column at 360 px, tables scroll inside their own container, tiles stack; nothing is hidden at narrow width (F-108 AC 3). Desktop-first per the design doc; both widths tested with a headless browser screenshot per page.
- Email: plain text, lines 72 characters or fewer, no tab characters, ASCII rules and separators; opens on iOS Mail, Outlook for iOS and Android Gmail without horizontal scroll (F-108 AC 1); the CSV opens in Numbers, Excel and Google Sheets.

### Display contracts the brief prescribes

#### Patient experience and the inbox (Bucket 5, M4, hosted only)

The brief's contract, quoted: "Each measure is shown exactly the way you already see it at faculty meeting — your year average, each of the past three months separately, and the MGB average — plus one new thing: the anonymous bar chart of everyone in your peer group with your own bar highlighted, available any time instead of twice a year. A month with fewer than 10 responses is hidden for that month only." And for the inbox: "every de-identified free-text comment about you, newest first, with the scores from the same survey, in one place. Who sees it: you and your direct leader only. Comments are never counted, compared, or rolled up into anything. You can: read, reflect, and add private notes."

Bucket 5 page (`/me/<period>/bucket/5`), one block per measure in the brief's order: Net promoter score; "Provider explained things in a way I could understand"; "Provider listened carefully"; "Provider showed respect".

```
+------------------------------------------------------------------------------+
| "Provider listened carefully"                Definition: v1 (survey vendor)  |
| MGB patient survey, outpatient provider items, as of 2027-02-10              |
| (responses lag four to eight weeks)                                          |
|                                                                              |
|  <col 1 label>   <col 2 label>   <col 3 label>   <col 4 label>   <col 5 label>|
|  year average    2026-11         2026-12         2027-01         MGB average |
|  81%             84%             Hidden: 7       78%             80%         |
|                                  responses this                              |
|                                  month; needs                                |
|                                  at least 10                                 |
|                                                                              |
|  41 neurosurgeons across the system                                          |
|  [bar chart: 41 unlabelled bars sorted ascending, one hatched bar "You"]     |
|  Peers: 61%, 63%, ... 92%     You: 78%                                       |
|                                                                              |
|  Trend (monthly, 12 survey months)  [line chart] + text table with gaps      |
|  Records: 23 rows (responses, January)     Open the inbox                    |
+------------------------------------------------------------------------------+
```

Rules and where each is enforced:

| Rule | Source | Enforcement |
|---|---|---|
| Column order and header labels come from the faculty-meeting slide copy, held as `config/faculty_slide_layout.yaml` (columns in order, header text per column, which is the year average, the three months, the MGB average) | F-69 AC 2, J3 precondition, OQ-40 | `tests/web/test_bucket5_layout.py` compares rendered `<th>` text to the file; the file is versioned in `department_setting.slide_layout_version` |
| Exactly these cells per measure: year average, three most recent survey months as separate cells, MGB average; nothing else numeric | F-69 AC 1, AC 4 | Template has five cells; a scan for a count badge, rank, target or sentiment element fails |
| A month under 10 responses shows `Hidden: <n> responses this month; needs at least 10` in that cell only; other cells and the year average render (whether the year average includes hidden months is OQ-44) | Brief; F-41 | `suppression_decision(kind='min_n', template='hidden-month')` per month; the cell renders the stored text |
| The bar chart is neurosurgeons across the system, viewer excluded, own bar highlighted, no labels, the `spread-count-survey` sentence above it; under five qualifying peers the chart is replaced by the `peer-under-five` text with group "department", scope "across the system", unit "responses"; a coverage gap names the gap | F-40 | `peer_group_snapshot` for the survey group; `charts.bar_spread()`; the text lines beneath |
| Three-month window rolls forward; the oldest month leaves the tile and stays on the trend; hidden months stay hidden with their reason; version boundaries marked | F-48 | `trend.series()` with `gap_reason` |
| Source and scope label on the measures, the response list and the inbox | F-97 AC 1 | `department_setting.survey_scope_phrase` |
| Each tile links to its definition page and to the per-response record list (survey month, four scores, comment present yes/no, provider named; no comment text; dispute action per row) | F-69 AC 3, F-53 | `/me/<period>/metric/<key>/records` for `record_type = 'survey_response'` |
| No Bucket 5 content in any email | F-69 AC 5 | `email_text.py` renders bucket 5 as `not_in_release` or omits it; a test asserts no survey string in any email |

Inbox (`/me/inbox`):

```
Patient feedback inbox
MGB patient survey, outpatient provider items, as of 2027-02-10 (responses lag four to eight weeks)

Survey month 2027-01                                     [Dispute this record]
  Explained 2 of 5   Listened 5 of 5   Respect 5 of 5   Would recommend: 6
  "<comment text>"
  Your private notes
    2027-02-12  "Post-op visit ran late; use teach-back for drain care."  [edit] [delete]
    [ add a note ]

Survey month 2026-12                                     Disputed - with chief, filed 2027-02-03
  ...
```

- Ordered by survey month descending, then load order (F-70 AC 1). No count in the heading, the navigation, the page title or the browser tab; no unread state; no sentiment; no summary; no comparison (F-70 AC 2, `tests/web/test_inbox_no_count.py` asserts the absence of every such element and that the nav entry reads exactly "Patient feedback inbox").
- Comment text is read by one query in `web/views/inbox.py` under the `app` role's column grant on `restricted.survey_comment.comment_text`; `tests/web/test_comment_isolation.py` greps the package for `survey_comment` and `comment_text` and allows only `loaders/survey.py`, `web/views/inbox.py` and their tests (F-70 AC 3, F-11 AC 5).
- Private notes (F-71): `restricted.private_note` rows, author only, editable and deletable by the author, timestamps shown; the leader's query joins no note; a leader POST to the note route is refused by the matrix and by RLS.
- Dispute on a response (F-72): the button opens `/records/<response_ref>/dispute` with the structured form (reason from the fixed list; clinician picker from the roster; no free-text field) and the F-56 notice that the annotated outcome marks the response as attributed to another clinician and shows the measure as logged and as adjudicated, and that removal of the comment is OQ-43. The row and the inbox entry show the F-73 state text while open and after decision.
- The viewer check (F-88) runs before the query, server-side, on the direct-leader mapping as of today; the analyst identity, the chair, an administrator and a non-leader chief get `not-authorized` with a payload holding no comment or score.
- Direct leader view (F-89): `department_setting` row `inbox_first_available.<clinician_id>` is written by the publisher on the first survey publish for that surgeon; the leader route compares today with that date plus 30 days and renders `leader-gate` until then; the leader sees comments and same-survey scores, newest first, no notes, no note form, no tally; measure tiles and the chart only when `leader_sees_measures` is true (default false, OQ-42). Nothing from the 1:1 is stored (J3.9).

#### Work RVUs — live tracker (M5, hosted only)

The brief: "your billed wRVUs, fiscal year to date and by month. Compared to: yourself last year only. No peer comparison and no target. Shown as: year-to-date against the same point last year, plus monthly bars with last year's bars ghosted behind them. The as-of date reflects billing lag."

```
Work RVUs — live tracker                              Definition: v1 (PBO)
source: PBO report dated 2027-03-04
Fiscal year 2027 (from <FY start month>, OQ-59)

Fiscal year to date: 4,812 wRVUs        Same point last year: 4,560
No peer comparison. No target.
Your comp target is in your comp letter; this page does not show it.
Corrections to billed wRVUs go to the professional billing office; this page mirrors their report.

[ghost bars: FY2027 monthly bars in front, FY2026 bars hatched behind;
 the two most recent months carry a hatched "prior snapshot" overlay]

  Month     This year   Last year   Note
  2026-07     640         590
  ...
  2027-01     560         610       as of 2027-03-04, may increase (prior snapshot 540, +20)
  2027-02     410         600       as of 2027-03-04, may increase (prior snapshot 0, +410)
```

Rules: FYTD against the same point last year and monthly bars with last year ghosted (F-77 AC 1) from `src.wrvu_month` and the `self_last_year` comparison target (the Metric engine section); the current month and the one before carry "as of <billing as-of date>, may increase" with the prior snapshot ghosted and the delta stored (F-77 AC 2, F-78 AC 1); the exact texts "source: PBO report dated <date>", "No peer comparison", no target, "Your comp target is in your comp letter; this page does not show it." (proposed default, OQ-33) and "Corrections to billed wRVUs go to the professional billing office; this page mirrors their report" (F-77 AC 3, AC 4); no record list and no dispute button, and the definition page records this as a deviation from GR5 and GR2 pending OQ-33 (F-77 AC 4); never count-suppressed (F-78 AC 3); the tile is `not_in_release` until `gate.comp_office` carries the comp office's written confirmation (F-77 AC 6). A reply about wRVUs is logged as `classification = 'question'` and answered with the billing-office route; `dispute file` refuses `record_type = 'wrvu_month'` (F-77 AC 5).

#### M&M attendance pace display (M5, hosted only)

The brief: "Shown as: attended so far, sessions remaining, on pace or off pace, and a clear flag when 8 can no longer be reached this year. No peer comparison."

```
M&M attendance                                        Definition: v1 (comp plan)
Source: attendance system, as of 2027-03-01
Fiscal year 2027

Attended 6 of 9 sessions held while on faculty and not on approved leave.
3 sessions remaining. On pace for 8 of 12.
No peer comparison.

  [cumulative attended vs cumulative held, one point per month of the fiscal year]
  Month    Held to date   Attended to date
  2026-07      1               1
  ...
  2027-03      9               6

Records: 12 rows (every session scheduled this fiscal year)
```

The pace line is one of exactly three strings from F-75 AC 2 and AC 3, computed in the definition version and stored on the `metric_value` row's `extra` field, never in the template: `On pace for <T> of <S>`; `Off pace`; `<T> of <S> cannot be reached this year: <r> sessions remain and <T - a> are needed` rendered as its own line in the text colour at value size, so the flag is counts and words, not colour (R-129). When leave applies: `Target adjusted for your leave: <a> of <T'> (this adjustment is not yet confirmed; see the definition page)` (R-125) with the formula, k, S' and T' on the definition page and in the record list header (F-75 AC 3, F-50 AC 6). Session record list columns: date, held yes/no, scan present/absent, removed by leave yes/no, counted yes/no (F-74 AC 2), dispute button per row with disputable fields `scan present` and `removed by leave` (F-76 AC 1). The trend is cumulative attended against cumulative held per month (F-74 AC 5, OQ-25). Never count-suppressed; no peer count (F-74 AC 4).

### The optional BI pub contract (deferred)

Built only if a sponsor asks for tiles in the enterprise BI tool, or for the faculty-meeting slide (staff judge), or if the BI team clears before the app's security review and the department wants tiles sooner (security judge); Builder decision S-8 records the two positions. Whenever it is built, this is the only sanctioned shape.

What pub may hold: one row per (viewer, metric, period, site) with a value or a reason, trend points, sorted spread points, definition version, source label and as-of, last refreshed. What it may never hold: a clinician id or name other than the viewer's own UPN key, a patient identifier, a case id, a record row, a comment, a note, a claim. It is free of peer and patient identity, not of the viewer's; the security judge's correction stands: a misconfigured BI user filter exposes every surgeon's suppressed tiles by UPN to every viewer, bounded to tile level, so the filter must be a published-data-source-level filter a workbook editor cannot remove.

```sql
-- scorecard/ledger/migrations/NNNN_pub.sql (applied only when department_setting.pub_enabled = true)
create schema if not exists pub;

create table pub.tile (
  viewer_upn        text not null,
  metric_key        text not null,
  metric_name       text not null,        -- brief text verbatim
  bucket            smallint not null,
  period_start      date not null,
  period_label      text not null,
  site_label        text,
  basis             text not null check (basis in ('logged','adjudicated')),
  display_state     text not null check (display_state in ('value','reason')),
  value             numeric,
  numerator         numeric,
  denominator       numeric,
  unit              text,
  ci_low            numeric, ci_high numeric,
  reason_text       text,
  comparator_line   text not null,
  definition_stamp  text not null,
  source_line       text not null,
  restated          boolean not null default false,
  version_boundary  boolean not null default false,
  last_refreshed    date not null,
  run_id            bigint not null,
  primary key (viewer_upn, metric_key, period_start, site_label, basis),
  check ((display_state = 'value' and value is not null and reason_text is null)
      or (display_state = 'reason' and value is null and reason_text is not null))
);

create table pub.trend_point (
  viewer_upn text not null, metric_key text not null, site_label text,
  period_start date not null, period_label text not null,
  value numeric, ci_low numeric, ci_high numeric, gap_reason text,
  restated boolean not null, version_boundary boolean not null,
  primary key (viewer_upn, metric_key, site_label, period_start)
);

create table pub.spread_point (
  viewer_upn text not null, metric_key text not null, site_label text, period_start date not null,
  point_seq smallint not null, point_value numeric not null, is_viewer boolean not null,
  spread_sentence text not null,          -- F-46 AC 1 text
  primary key (viewer_upn, metric_key, site_label, period_start, point_seq)
);

create table pub.refresh (run_id bigint primary key, last_refreshed date not null, built_at timestamptz not null);
```

`scorecard pub build --period P` runs inside one transaction: truncate, insert from `ledger` for every viewer eligible for a hosted view, then run the contract test and roll back on failure:

| Contract check | Fails when |
|---|---|
| Forbidden columns | Any `pub` column name matches `%clinician_id%`, `%name%` (other than `metric_name`), `%mrn%`, `%csn%`, `%encounter%`, `%case%`, `%record%`, `%comment%`, `%note%`, `%claim%` |
| Forbidden values | Any text cell matches a roster display name, a `record_ref` pattern, or the payload scan's identifier patterns |
| Reason completeness | Any `tile` row with `display_state = 'reason'` and null or unfilled `reason_text` |
| Suppression parity | Any `tile` row whose `display_state` disagrees with the `value`-scope `suppression_decision` for that cell |
| Eligibility | Any `spread_point` row for a viewer whose `run.spread_eligibility` is false, or any spread with fewer than five non-viewer points |
| Grants | `bi_ro` has any privilege outside `pub`; `scorecard grants check` |

BI-side rules, recorded in the runbook and the BI security review: per-viewer filtering by a data-source-level user filter (`viewer_upn = USERNAME()` in Tableau, an RLS role `[viewer_upn] = USERPRINCIPALNAME()` in Power BI), not Postgres RLS, because the BI server connects with one service credential (both judges); live connection preferred; export, download and "view data" disabled on the project or workspace; one workbook owned by the analyst; tiles deep-link to the app for record lists and disputes; case-level record lists never enter BI. Pub is also the mandatory channel for any future division and site aggregates (OQ-52), which is out of scope here.

### Module layout and CLI surface for this section

```
scorecard/
  publish/
    render.py          ClinicianArtifact from ledger only; shared by email, web, pub
    email_text.py      Jinja2 -> plain-text body; deep links only when gates.hosted_open()
    csv_rows.py        own-rows CSV per record type; BOM; column sets per metric kind
    charts.py          inline SVG: trend_line, bar_spread, ghost_bars, interval_dots; text tables
    scan.py            minimum-necessary payload scan (F-106 AC 7); patterns versioned
    gates.py           reads department_setting gate.* rows; hosted_open(), channel_open(ch)
    own_records.py     every record_ref in an artifact is credited to its recipient (G14)
    directory.py       resolve_mailbox(person_key) -> address (D-34)
    transport.py       relay send with Message-ID capture; .eml writer; manifest; NDR ingest
    delivery.py        delivery rows: channel, sent_at, message_id, artifact_sha256, gate_checked, payload_scan
    notify.py          ack, dispute_filed, recredit, decision, deadline emails
    overrides.py       per-feed-owner list from correction_request (F-64)
    status.py          F-112 checklist; daily and weekly status
    adoption.py        F-91 report; interview records
    pub.py             optional pub build + contract test
    templates/
      scorecard_email.txt.j2  decision_email.txt.j2  ack_email.txt.j2  dispute_filed_email.txt.j2
      recredit_email.txt.j2   deadline_email.txt.j2  override_list.csv.j2  status_email.txt.j2
      preview_index.html.j2
  web/
    app.py             create_app(); SSO (authlib OIDC or python3-saml); session; before_request identity->roster->roles
    authz.py           allow(viewer, roles, resource, subject) -> Allow | Refuse(code); the matrix as data
    queries.py         viewer-scoped SQL (every function takes clinician_id first)
    views/
      home.py  metric.py  records.py  definitions.py  disputes.py  queue.py
      inbox.py (the only reader of comment text)  leader.py  analyst.py  errors.py
    templates/
      base.html.j2  _tile.html.j2  _trend.html.j2  _spread.html.j2  _state.html.j2  _record_table.html.j2
      home.html.j2  bucket.html.j2  bucket5.html.j2  metric.html.j2  records.html.j2  record.html.j2
      dispute_form.html.j2  dispute.html.j2  queue.html.j2  definition.html.j2  whats_not.html.j2
      inbox.html.j2  leader_inbox.html.j2  analyst/*.html.j2  errors/*.html.j2
    static/
      scorecard.css   print.css   vendor/ (empty unless Builder decision S-7 fallback is taken)
  config/
    faculty_slide_layout.yaml   column order and header labels copied from the slide (F-69 AC 2)
tests/
  publish/test_email_template.py     month-one no "Peers:"; every tile has value xor reason; 72-col lines; no link before gates
  publish/test_csv_rows.py           row counts per metric equal denominators; forbidden columns absent
  publish/test_scan.py               MRN column fixture blocked; procedure free text scanned
  publish/test_artifact_parity.py    email, web, pub render one fixture to identical tile strings
  web/test_authz_matrix.py           every cell of the matrix
  web/test_states.py                 the four page states write four audit rows; no partial page
  web/test_state_strings.py          templates carry no typed catalogue text
  web/test_inbox_no_count.py         no count, badge, unread, sentiment, summary, comparison element
  web/test_comment_isolation.py      comment_text read only in the allowed modules
  web/test_bucket5_layout.py         headers match the slide layout file
  web/test_charts.py                 no peer labels; intervals drawn for O/E; text table follows every chart
  web/test_leader_gate.py            day 29 refused with leader-gate, day 30 allowed; notes absent
  web/test_wrvu_mm.py                exact tile texts; no dispute button on wRVU; pace strings
```

CLI:

```
scorecard publish --period 2026-10                     dry run (default): preview/<period>/... + index.html
scorecard publish --period 2026-10 --send              relay send; delivery rows with message ids
scorecard publish --period 2026-10 --eml               .eml files + manifest for the shared mailbox
scorecard publish --period 2026-10 --record-eml-sent --manifest preview/2026-10/manifest.csv
scorecard publish --period 2026-10 --resend --clinician K     after an identity fix; new delivery row
scorecard publish --period 2026-10 --numbers-only      numbers-only fallback (runbook only)
scorecard notify ack|decision|recredit|filed --dispute D-0014 [--dry-run]
scorecard status --daily [--send]                      the F-112 daily check; deadline emails at day 10 and 14
scorecard reply log|answer|ingest-ndr ...              reply_log rows; bounces
scorecard interview record --clinician K --opened-list yes|no --when D
scorecard adoption report --period P                   F-91 AC 4 figures and the kill flag
scorecard overrides --month 2026-10 --send             one list per feed owner (F-64)
scorecard delivery show --period P | incident --delivery <id> --reference R
scorecard definitions page fcot@v1                     the text the email appendix and the page render
scorecard pub build --period P [--check-only]          only when pub_enabled; contract test
scorecard doctor                                       deployment check (Ingestion and operations section): gates
                                                       recorded, SSO config present, no surgeon-identified route
                                                       reachable unauthenticated, static dir holds no data files
                                                       (F-85 AC 3, F-106 AC 2)
gunicorn 'scorecard.web.app:create_app()'              behind nginx; systemd unit in the Ingestion and operations section
```

### Builder decisions recorded in this section

**Builder decision S-1 (D-05): web framework.** Options: (a) Flask + Jinja2 + psycopg, SSO validated in-app (staff judge's recommendation); (b) Django 5 LTS, unmanaged models, `mozilla-django-oidc` or `djangosaml2`, admin disabled or fenced to analyst screens (security judge's recommendation). Recommended: (b) if the builder or analyst has taken a Django app through an MGB security review before; otherwise (a). Why: the two judges weigh reviewer familiarity against duplication of a SQL-owned schema; neither is wrong, and the app holds no logic either way because views call the same service functions as the CLI. Recorded, not chosen silently.

**Builder decision S-2 (D-06): SSO integration.** Options: (a) in-app OIDC (Entra ID) or SAML via a maintained library; (b) MGB reverse proxy injecting a UPN header, with the app's listener restricted to the proxy by network ACL or mTLS and a signed header. Recommended: (a); (b) only if MGB IAM mandates the proxy, with the restrictions named. Why: the security judge's point that a trusted header is only as strong as the network path; the staff judge's Flask option assumed (b) but did not depend on it.

**Builder decision S-3 (D-30): who sends the .eml fallback.** Options: (a) the analyst opens the department shared mailbox profile in Outlook and sends each `.eml` from it, then records the manifest; (b) the analyst's own Outlook (minimal batch as written). Recommended: (a). Why: (b) leaves every surgeon's case list in a personal Sent Items folder outside the department mailbox's access list and retention policy (security judge). If the shared mailbox cannot be opened in Outlook, the fallback is `--numbers-only` from the analyst's mailbox, not the case list.

**Builder decision S-4 (D-32): CSV shape.** Options: (a) one row per (metric, record) with a `metric` column, so a case that feeds two metrics appears twice and each metric's row count equals its denominator by filtering one column; (b) one row per record with `counted_in_<metric>` yes/no columns; (c) one CSV per metric as separate attachments. Recommended: (a). Why: F-90 says one attachment; F-49 AC 2 is checked by filtering one column and counting; (b) hides the FCOT-only columns behind blanks on non-first cases and makes the row count a formula. The F-56 effect notices ride as the first comment line of the CSV and in the body; a builder who finds the comment line ugly moves them to the body only.

**Builder decision S-5 (D-33): where the definition text lives in the email months.** Options: (a) an appendix in the body, rendered from the registry by version, after the tiles; (b) a second attachment `definitions-<period>.txt`; (c) a version reference only. Recommended: (a). Why: F-90 says one attachment and F-50 AC 7 says the definition text is reachable from every tile's version stamp on every artifact; (c) fails F-50 AC 7; (a) keeps the tiles at the top on a phone and satisfies both.

**Builder decision S-6 (D-34): recipient resolution mechanism.** Options: (a) LDAP query of MGB Active Directory by `person_key` (employee id) returning `mail`; (b) Microsoft Graph `users/{id}` with an app registration; (c) the roster's typed address (rejected by F-90 AC 8). Recommended: (a) if the VM can reach the directory over LDAPS; otherwise (b). Why: both answer the identity-to-mailbox question at send time; (a) needs no app registration or token and is what most department scripts already do; the choice waits on OQ-58 and the M0 network request.

**Builder decision S-7 (D-35): chart rendering.** Options: (a) server-rendered inline SVG from an in-repo module, no JavaScript, `<title>` hover, text table beneath every chart; (b) one vendored JavaScript chart file (uPlot or Chart.js) checked into `static/vendor` with licence and hash, with the text table still rendered server-side; (c) a CDN-loaded library (rejected: no third-party calls in the runtime path). Recommended: (a), with (b) as the fallback if the builder wants animation or richer hover. Why: the charts are a trend line, a bar spread, ghosted bars and interval dots; an SVG module is smaller to review than a vendored library and the accessibility rule (text beside every chart) holds either way.

**Builder decision S-8 (D-36): when to build pub.** Options: (a) defer until a sponsor asks for tiles in the BI tool or the faculty-meeting slide (staff judge); (b) build at M2 as the fast path if the BI team clears before the app's security review (security judge). Recommended: (a), with the schema, contract test and grants written and tested against fixtures at M2 so (b) is a one-day switch (`department_setting.pub_enabled`). Why: a second surface to keep in sync has a monthly cost; the contract makes it safe whenever it is wanted.

**Builder decision S-9 (D-37): trend table orientation in the email.** Options: (a) vertical, one row per period; (b) horizontal, months as columns. Recommended: (a). Why: twelve columns exceed 72 characters and scroll sideways on a phone (F-108 AC 1); a vertical table also has room for the gap reason text and the restatement legend on the same line.

**Builder decision S-10 (D-38): session mechanism.** Options: (a) signed cookie holding only the SSO subject and expiry, roles recomputed per request; (b) server-side sessions in Postgres. Recommended: (a). Why: nothing surgeon-identified is in the cookie, roster changes take effect on the next request, and there is no session table to retain or purge (F-113); (b) adds a store with no benefit at this size.

New open questions raised here: none beyond those already registered; OQ-47 (which bodies gate the acknowledgement and decision channels), OQ-51, OQ-57, OQ-58 and OQ-59 are the ones this section depends on.

### Feature mapping

Every feature in the Scorecard views, Patient experience and inbox, Citizenship (M&M), wRVU tracker, Delivery and notifications, and Roles and access (app side) areas, followed by the features from other areas that this section renders or that another area's section cites into it.

| F-xx | Where it lives | Notes |
|---|---|---|
| F-42 | `what-this-is-not` and `what-this-is-not-line` catalogue entries; `templates/scorecard_email.txt.j2` footer; `base.html.j2` footer; `/whats-not`; `scan.py` fails an artifact without the line; `tests/publish/test_email_template.py` scans for rank, composite or target fields | Statement version id stored in `delivery.statement_version` |
| F-43 | `ClinicianArtifact.tiles[].trend` from `trend.series()`; email vertical text table; `charts.trend_line()` plus the same table on `metric.html.j2`; `history from` line; restated `*` and version boundary rule | Window per cadence from the Metric engine section; no zero-filled point |
| F-44 | Tiles whose `suppression_decision.kind` is `not_in_release`, `pending_source`, `feed_missing`, `feed_held` or `not_computable` render the stored text in the value position on email and page | Bucket 3 to 6 lines in the email; never blank |
| F-45 | `cadence_note` on the tile: `Counted quarterly; the quarter closes <date>.` plus running denominator; `Rolling 12 months to <date>`; fiscal year named on wRVU and M&M | Spread first renders at quarter close because the snapshot does not exist before it |
| F-46 | Email: the three lines under the comparator line (F-46 AC 6); page: `charts.bar_spread()` or `interval_dots()` plus the same three lines; no labels; render logged by the Metric engine section | Month one: `self_only` true for all, no `Peers:` line |
| F-47 | `value_text` shows one value or `as logged ... ; as adjudicated ...`; record list heading names the count shown; trend `*` with the logged value in the legend and in `<title>` hover on the page | Same text in email tile and page tile (F-47 AC 5) |
| F-48 | `bucket5.html.j2` three-month cells from the three most recent survey months; `trend.series()` with `gap_reason` for hidden months; version boundary marker | M4 |
| F-69 | `/me/<period>/bucket/5`; `config/faculty_slide_layout.yaml`; `tests/web/test_bucket5_layout.py`; definition and record links per measure; no email content | M4; slide copy is a precondition (OQ-40) |
| F-70 | `/me/inbox`; `web/views/inbox.py` sole reader of `restricted.survey_comment.comment_text`; `tests/web/test_inbox_no_count.py`; `tests/web/test_comment_isolation.py`; scope label from `department_setting` | M4 |
| F-71 | `/me/inbox/<response_ref>/note` create, edit, delete; `restricted.private_note`; author-only in the matrix and RLS; leader query joins no note | M4; OQ-42 |
| F-72 | `dispute_form.html.j2` structured variant for `survey_response`: fixed reasons, roster picker, no free text; effect notice text; `disputes.file()` with `claim_structured`; adjudicator view withholds the comment unless direct leader of record | M4; routing per F-58 and the Data model section, Builder decision 5 (D-20) |
| F-73 | F-59 state text on the response row and beside the inbox entry; measure tile shows as logged and as adjudicated after a sustained decision; override list to the patient experience office via `overrides.py` | M4; OQ-43 |
| F-74 | `metric.html.j2` M&M block: tile text form, session record list with dispute button, source and as-of, `No peer comparison`, fiscal year, cumulative trend | M5 |
| F-75 | Pace string and scaled-target fields come from the definition version via `metric_value.extra`; the page renders them and the definition page shows the formula | M5; never rendered while leave dates exist unapplied (the run fails) |
| F-76 | Session rows carry the dispute button with fields `scan present` and `removed by leave`; F-56 notices for both; decision annotates and recomputes pace; correction on the attendance owner's override list | M5 |
| F-77 | `metric.html.j2` wRVU block: FYTD vs same point last year, `charts.ghost_bars()`, "as of <date>, may increase" on the two most recent months with prior snapshot, the four exact texts, no records link, no dispute button; `not_in_release` until `gate.comp_office` | M5; OQ-33 |
| F-78 | Rendered from `src.wrvu_month` (current, prior snapshot, delta, as-of, report date) and the restatement log; the page shows the delta beside each restated month | M5 |
| F-85 | `web/app.py` identity to roster; `authz.py`; viewer-scoped `queries.py`; `scorecard doctor` deployment check (no static surgeon files, gates recorded); view rows to `audit_log`; deep link added only when `gates.hosted_open()`; the four page states | M2 |
| F-86 | Matrix rows for record detail, dispute form, dispute detail, decide, queue; receiving clinician visibility only after the sustained event; every dispute open logged | M2 |
| F-87 | Roles computed per request from `roster_membership` chief and direct-leader fields as of today; `/analyst/roster` mapping check; prior leader refused from the change date | M1 data, M2 enforcement in the app |
| F-88 | `authz.allow('inbox', ...)` admits only the subject and the direct leader of record as of today; refusal payload has no comment or score; analyst has no inbox role; survey pipeline access is `svc_survey`, logged | M4 |
| F-89 | `/leader/<ref>/inbox`; `department_setting.inbox_first_available.<clinician_id>` written by the publisher; `leader-gate` text before day 30; no notes, no note controls; `leader_sees_measures` default false | M4; OQ-42 |
| F-90 | `scorecard publish`; `render.py`, `email_text.py`, `csv_rows.py`, `scan.py`, `own_records.py`, `gates.py`, `directory.py`, `transport.py`, `delivery.py`; the template above; `delivery` rows; directory-resolved recipient; bounce and incident handling; `tests/publish/*` | M1; OQ-23, OQ-58 |
| F-91 | Reply-To header on every email; `ledger.reply_log`; `scorecard reply log|answer`; `scorecard interview record`; `scorecard adoption report`; from M2 `audit_log` view rows feed the same report; definition questions from replies go to `definition_open_item` | M1 |
| F-92 | `notify.py` dispute_filed (adjudicator and analyst) and recredit emails; F-52 content in the adjudicator email; reply instruction naming the three elements; gates per channel; scan | M1; OQ-21 |
| F-93 | `notify.py` decision email with the F-59 row text and the recomputed tile block; time from filed date to decision email stored for F-98; deep link at M2; next monthly email carries the same row and tile via `decisions_this_period` | M1; OQ-20 |
| F-94 | `ClinicianArtifact.definition_changes` from the registry diff summary for versions effective this period; "DEFINITION CHANGES" block in the email and a notice band on `/me/<period>` | M1; OQ-21 |
| F-33 | Every absent-cell, spread, dispute-clause and page-state string on every surface is `reasons.render(key, counts)`; `tests/web/test_state_strings.py` forbids typed copies in templates | Owned by the Metric engine section; consumed here |
| F-34 | `comparator_line` on every tile: brief text verbatim, peer count, `(spread from month two)` in month one, else spread or peer-under-five text; `No peer comparison` on wRVU and M&M | |
| F-40, F-41 | Bucket 5 bar chart and hidden-month cell text, rendered from the Metric engine section decisions | M4 |
| F-49 | `Records:` line and CSV rows (email); `/me/<period>/metric/<key>/records` (page); opens for suppressed tiles; row count equals denominator; credited clinician, source, load date, shared flag columns | wRVU is the recorded exception (OQ-33) |
| F-50 | `/definitions/<metric_key>@<version>`; email appendix rendered by `scorecard definitions page`; reachable from every version stamp | |
| F-52 | Adjudicator view of `/disputes/<id>` and the dispute-filed email body: provenance panel fields per record type; no values of anyone | |
| F-53 | Record list page for `survey_response`: survey month, four scores, comment present, provider named; no comment text; dispute button; opens for hidden months | M4 |
| F-54 | Case id column and reply instruction (email); "Dispute this record" button on every row (page); no button on wRVU | |
| F-56 | Effect notice per disputable field from the definition version: CSV comment line and body instruction (M1); above the submit control on the form (M2) | |
| F-57 | Reply intake commands, `awaiting_row` classification, acknowledgement email within two business days | M1 |
| F-59 | `dispute_state` column in the CSV; row state text on the record list and record detail; in the decision email; generated from the ledger, never typed | |
| F-60 | `/queue`, `/queue/closed` (M2); at M1 the adjudicator's one-email-per-dispute set plus `/analyst/disputes` view by adjudicator | |
| F-62 | Record detail lists every dispute on the record in order; re-file control offered once; counter-dispute link shown on both | |
| F-63 | "Definition question logged <date>" on the row and decision email; open item on the definition page | |
| F-64 | `overrides.py`, `scorecard overrides --month --send`; delivery row with `clinician_id` null; send date on the F-112 checklist | |
| F-66 | `/records/<record_ref>/dispute` form (GET, POST) | M2 |
| F-83 | `last refreshed <date>` in the email subject, header and every page header from `run.published_at`; never the send or render date | |
| F-97 | `source_line` per tile: OR-log via last refreshed; PBO, Vizient, QI, survey, attendance texts per F-97 AC 1; stale as-of plus reason when a later feed is missed | M4 onward |
| F-98 | `/analyst/disputes` trust report; time to decision from `filed_at` to the decision `delivery.sent_at` | |
| F-104 | Fixed text in bucket 2 of the email and the home and bucket pages; no tile, no value | |
| F-106 | `gates.py` per channel and per hosted surface; `scan.py` on every outbound artifact; `scorecard doctor`; gate records and scan results stored on the run | Governance bodies and lead times are OQ-47 |
| F-107 | `audit_log` view and refused rows written by every surgeon-identified view; `/analyst/audit`; `scorecard audit`; no comment text, scores, notes or claims in `details` | M2 |
| F-108 | Accessibility baseline above; plain-text email at 72 columns; text beside every chart; phone-width layout; `tests/web/test_charts.py` and screenshot tests | OQ-51 |
| F-111 | Dispute-filed email as the adjudicator surface; decision by reply entered with `dispute decide --reply R-nnnn`; no sheet link in any email (scan pattern); the sheet, if a chief insists, is a one-off import | M1; OQ-55 |
| F-112 | `scorecard status --daily --send`; deadline emails at day 10 and 14; checklist printed by `publish` and stored on the run; bounces and unsent override lists listed | M1 form is the printed checklist plus calendar entries (OQ-56) |

Count: 27 features in the six named areas (F-42 to F-48; F-69 to F-73; F-74 to F-76; F-77, F-78; F-85 to F-89; F-90 to F-94) plus 27 cited from other areas: 54 features in 53 rows (F-40 and F-41 share a row).

## Ingestion, operations, security, and testing

This section is the operating manual for the ledger the other sections define. It fixes how each of the thirteen feeds gets in, what the analyst runs each month and what stops the run, where the system lives at M1 and at M2, which database role can touch what, what never leaves the pipeline, how survey comments are checked and quarantined, how governance sign-offs are enforced as data, what the runbook says, how the package is tested without PHI, and how the repository is laid out.

Conventions, shared with the Data model, Metric engine and Dispute workflow sections:

- Table and column names are those of the Data model section (`ledger.feed_load`, `ledger.run`, `ledger.department_setting`, `restricted.comment_quarantine`, and so on). Definition modules and engine stages are those of the Metric engine section. Dispute commands are those of the Dispute workflow section. Nothing here renames them.
- `F-xx` cites `02-features.md`; `Jn.m` cites `01-user-journeys.md`; `OQ-nn` cites the open questions register; `BD-n` cites a builder decision in the Metric engine section; decisions recorded here are numbered `O-n` with their register id (`D-nn`) beside them.
- Reason text is quoted from the F-33 catalogue with its key in backticks. The publish check refuses any absent-cell string that is not a catalogue key (F-33 AC 5), so no wording in this section is typed at the surface.
- The brief is cited, not restated. Where the brief is silent and the catalogue has no proposed default, the item is a Builder decision or an OQ.

### Ingestion: one loader per feed

Every feed goes through the same six steps, in one module per `feed_key` under `scorecard/loaders/`. The steps are the same for the periop extract at M1 and for the ADT extract at M7; only the column map, the required-field list and the attribution rule differ.

```
 landing/<feed_key>/<YYYY-MM>/<file>          ticket number and as-of date on the command line
        |
        v
 [1] fingerprint    sha256 of the bytes; unique (feed_key, sha256) in ledger.feed_load
        |             same hash  -> "already loaded as feed_load 41 on 2026-11-03"; exit 0; nothing written
        v
 [2] receive        feed_load row: status 'received', ticket, as_of_date, model_version, loaded_by = db role
        |
        v
 [3] allowlist+raw  columns not in the feed's ACCEPTED_COLUMNS are dropped before anything is stored; their
        |             names go to feed_load.field_checklist.dropped_columns and the staging summary (F-95 AC 4);
        |             the rest go verbatim into raw.<feed_key> (all columns text, line_no); never updated
        |
        v
 [4] field check    required_fields per metric -> feed_load.field_checklist {"wheels_in": true, ...}
        |             a missing field marks the dependent metrics 'not_computable'; the load continues (F-80 AC 4)
        v
 [5] type + record  src.<record_type> rows typed and validated; ledger.record upserted by (record_type, source_key);
        |             a corrected extract is a new feed_load whose rows supersede by source_key; old rows stay
        v
 [6] attribute      attribution rule for the record type (the Data model section); record_participant rows;
        |             attribution_exception rows; open correction_request rows compared with the re-ingested
        |             field (convergence, F-06 AC 2); feed_load.status -> 'loaded' | 'partial' | 'failed'
        v
 run row (kind 'load') + audit_log rows; the console prints the staging summary of F-95 AC 4
```

Three rules hold for every feed:

0. Only allowlisted columns are stored. Each loader declares `ACCEPTED_COLUMNS` (its `REQUIRED_FIELDS` plus the named optional columns its `src` table carries). A column the file carries that is not on the list is dropped at step 3 before `raw` is written, its name is recorded in `feed_load.field_checklist.dropped_columns` and printed in the staging summary, and the feed owner is asked to remove it at source. No patient name, MRN, date of birth, address, phone or notes column is on any allowlist, so an identifier a feed happens to carry never reaches `raw`, `analyst_ro` or a CSV; the `procedure` name is the one free-text column accepted, and only for `periop_or_log`. `tests/loaders/test_column_allowlist.py` loads a fixture with an `mrn` and a `patient_name` column and asserts neither exists in `raw` and both names are in the checklist.
1. Nothing in `raw` or `src` is ever edited. A correction is a new `feed_load` (from the source) or a `record_override` (from a decided dispute). The loader has INSERT and no UPDATE on those schemas (the Data model section, roles table), so this is a grant, not a habit.
2. Reloading the same file is a no-op and reloading a corrected file supersedes. `feed_load.supersedes_feed_load_id` links the two; `src` rows from the superseded load keep their `feed_load_id`; `ledger.record.current_src_row_id` moves to the new row. Any published `metric_value` still points at the load it was computed from, so a superseding load never silently changes a published number: it is a restatement only if `scorecard restate` is run (F-96 AC 3).

#### File contract per feed

Thirteen `feed_key` values (the CHECK constraint on `ledger.feed_load`). Owners are the design doc's expected owners and are unconfirmed (OQ-48). "One row per" is the unit the loader validates; a file that does not have that grain is refused at step 5 with the grain named. Required fields are the field checklist; the loader records presence, never a proxy.

| feed_key | Owner (expected) | Cadence and history | File contract (one row per) | Required fields (field checklist) | As-of and version capture | Join key and attribution rule | Metrics | Milestone and gate |
|---|---|---|---|---|---|---|---|---|
| `periop_or_log` | Periop analytics (ticketed request, Premise 1) | Monthly; 12 months of history on first load | Two files: `cases` (one row per case) and `panel` (one row per case x clinician x role x listed order). A single-file shape with one primary-surgeon column is accepted but sets `field_checklist.panel_roles = false`, and the shared flag and tie-break are then `not_computable` (staff judge error 12) | case id, site, room, date_of_surgery, procedure (periop's scheduled procedure name), scheduled_start, wheels_in, wheels_out or actual in-room minutes, booked minutes, first-case-in-room flag or the fields to derive it, delay_reason_code, cancelled_same_day, cancellation_reason_code; panel: clinician id (institutional person id), role, listed_order | `as_of_date` = extract date printed by periop; no model version | `source_key` = periop case id. `ATTR-CASE-PRIMARY` (the Data model section): primary surgeon in the OR log, first-listed primary on a multi-panel case, `shared_flag` (F-01) | OR case volume; First-case on-time start (FCOT); Duration estimate accuracy; Same-day cancellations you could have prevented | M1. No governance gate for the load (operational data); email channel gated at publish |
| `periop_report` | Periop analytics | Monthly, same ticket as the extract | One row per surgeon x metric x month (periop's own surgeon-level FCOT and cancellation report; volume and duration where periop reports them, OQ-54) | surgeon id, month, metric name as periop prints it, numerator, denominator, value | `as_of_date` = report date | `src.periop_report`; read only by `engine/reconcile.py` (F-81). Never attributed; never a record | Reconciliation target for the wedge four | M1 |
| `roster` | Department administrator, maintained by the analyst (OQ-36) | On change; loaded as a full snapshot | One row per clinician x site x validity window | person_key (institutional person id, the Data model section, Builder decision 2 (D-18)), display name, site, subspecialty, division, chief person_key, direct leader person_key, faculty_from, faculty_to, has_allocated_block | `as_of_date` = the date the snapshot is true for | `roster_membership` SCD2 insert; old row closed. Attendance and opt-out are set by `scorecard roster set`, not by file (F-99) | None directly; every peer group, route and authorization reads it | M0 |
| `hr_leave` | HR (OQ-36, OQ-49) | On change or monthly | One row per approved leave period | person_key, start, end, leave_type, approved flag | `as_of_date` = extract date | `leave_period`; exclusion constraint on overlapping periods per clinician | M&M attendance (session removal and scaled target, F-75) | M5 |
| `block_schedule` | Not yet named (OQ-34) | Monthly once registered | One row per block day per block holder | holder person_key, site, block_date, allocated_minutes, released_minutes, used_minutes | `as_of_date` = extract date | `src.block_allocation`; `ATTR-BLOCK-HOLDER` "block minutes to the surgeon holding the block" (J4.13); a clinician with no rows in the month gets `not_applicable` (F-18 AC 3) | Block utilization (only if you have allocated block) | M3; `source_registry` row moves from `not_in_release` to `registered` (F-103) |
| `survey` | Patient experience office; de-identification owned by that office (OQ-40) | Monthly; responses lag four to eight weeks | Per-response file (one row per response) plus a per-measure MGB-average file (one row per measure x month). An aggregate-only file is refused at step 5 and Bucket 5 renders `pending-source` text per F-11 AC 2 | response_id, survey_month, provider named (person_key), recommend score, the three item scores, comment text (nullable); MGB average per measure per month | `as_of_date` = vendor extract date; `department_setting.survey_scope_phrase` stamped on every row (F-97 AC 5) | `source_key` = response_id. `ATTR-SURVEY-NAMED`: the provider named on the survey (GR1). Comment text goes to `restricted.survey_comment` only; scores to `src.survey_response` with `has_comment` | Net promoter score; "Provider explained things in a way I could understand"; "Provider listened carefully"; "Provider showed respect"; Patient feedback inbox | M4; load refused until `gate.survey_pipeline` is signed (F-106 AC 4); runs as `svc_survey` (see "Survey comments") |
| `billing_wrvu` | Professional billing office | Monthly; prior fiscal year on first load | One row per clinician x service month | person_key, service_month, wrvu, feed as-of date, source report date | `as_of_date` = billing as-of; `source_report_date` kept separately; prior snapshot per month and `restatement_delta` written on change (F-78 AC 1) | `src.wrvu_month`; no `ledger.record` row (mirror; no record list, F-77 AC 4) | Work RVUs — live tracker | M5; tile publish refused until `gate.comp_office` is signed (F-77 AC 6) |
| `attendance` | Attendance system owner (OQ-49) | Monthly | Two files: `sessions` (one row per session: session_id, session_at, fiscal_year, held) and `scans` (one row per session x person_key x scanned_at) | as listed | `as_of_date` = attendance system export date | `src.mm_session`, `src.attendance_scan`; `ATTR-ATTEND-SCAN`: the scanned person; held-while-on-faculty-and-not-on-leave is computed at `close` from roster and `leave_period` (F-75 AC 1) | M&M attendance | M5 |
| `vizient` | Hospital quality analytics (Premise 3) | Quarterly, two to three months lag; restated on model refresh | One row per encounter | encounter id (HAR or CSN), hospital, admit_at, discharge_at, discharging attending person_key, observed LOS days, expected LOS days, readmit-30 flag, expected readmissions, died-in-hospital flag, expected mortality, relative weight, **model version (required; a file without it is refused)** | `as_of_date` = extract date; `feed_load.model_version` and `metric_value.model_version` (F-24 AC 2); a new model version on re-load writes restatements with reason `model_refresh` (F-96 AC 1) | `source_key` = encounter id. `ATTR-ADM-INDEX`: index-operation surgeon under the versioned index-operation rule joining `src.admission` to `src."case"` by the CSN/HAR crosswalk (OQ-31); unmatched admissions to the exception list, never to the discharger (F-08 AC 1); super-long boarder flag from the F-100 threshold | Length of stay (O/E); 30-day readmission (O/E); In-hospital mortality (O/E); Case mix index | M6; compute refused until `gate.medical_staff_office` is signed and `--allow-quality` is passed |
| `qi` | Department QI coordinator | Quarterly (or on the QI database's export cadence) | One row per event | qi event id, event_type in (`return_or`, `ssi`, `vte`, `csf_leak`), event date, index case reference (periop case id), implant flag on the index case, site | `as_of_date` = QI database export date | `privileged.qi_event`; `ATTR-QI-INDEX`: credited to the primary surgeon of the index case (F-09 AC 2); no index case -> exception list, never dropped (F-09 AC 3). This loader is the only write path; a code search test asserts no other (F-09 AC 1) | Unplanned return to the OR within 30 days; Surgical site infection; VTE within 30 days; CSF leak requiring intervention (neurosurgery only) | M6; same gate as `vizient` |
| `clinic_sched` | Clinic operations (OQ-36) | Monthly | Two files: `visits` (one row per visit) and `samples` (one row per third-next-available sample: sample date, person_key, days to third next open new-patient slot) | visits: visit id, visit date, the rendering-provider field named in `source_registry.attribution_rule_text` (OQ-39), visit type, completed flag, note_signed_at, referral id (nullable); samples: as listed | `as_of_date` = extract date | `src.visit`, `src.third_next_sample`; `ATTR-VISIT-RENDER`: the rendering provider under the named field; blank or unmapped provider -> exception list (F-10 AC 1); `ATTR-SAMPLE-CLINICIAN` for samples | New patient visits; Clinic notes closed within 72 hours; Third-next-available appointment | M7 |
| `referral` | Referral work queue owner (OQ-04) | Quarterly | One row per referral | referral id, received date (nullable), target provider person_key, resulting visit id | `as_of_date` = extract date; the share of null received dates is printed on every load and stored on the run (F-109 AC 6) | `src.referral`; `ATTR-REFERRAL-VISIT` "referral received date to the resulting visit's rendering provider" (J4.13); computes only from the `source_registry.effective_from` period | Referral-to-visit days (pending confirmation of data source) | M7; `pending_source` until `scorecard source register` |
| `adt` | ADT feed owner (OQ-05) | Quarterly | One row per unit transfer | encounter id, from unit, to unit, transfer timestamp | `as_of_date` = extract date | `src.adt_transfer`; `src.icu_stay` derived per encounter (ICU in, step-down, return within the F-100 proxy window); `ATTR-ICU-INDEX` "ICU step-down and return event to the admission's index-operation surgeon" (J4.13) | Unplanned return to ICU (pending confirmation of data source) | M7; `pending_source` until registered |

Two things are not feeds. The institutional directory lookup that resolves a surgeon's mailbox at send time (F-90 AC 8) is a publish-time query, not a load (Builder decision O-7). The signed reason sets (F-101, F-102) are definition parameters (BD-4), entered by `scorecard register`, not loaded from a file.

#### The field checklist and "not computable"

Each loader declares `REQUIRED_FIELDS: dict[metric_key, list[column]]`. Step 4 evaluates it against the file's header and writes `feed_load.field_checklist`. The engine reads the checklist at `close`: a metric whose required column is absent gets a `suppression_decision` of kind `not_computable` with the `not-computable` template, "not computable: <field> not in extract", and no `metric_value` (F-80 AC 1, AC 2). The staging summary also prints the fixed sentence for what the periop extract is known not to carry (F-80 AC 3): block allocation and release minutes; OR turnover time, PACU boarding, room-ready delays.

For the wedge the map is:

```
REQUIRED_FIELDS = {
  "or_case_volume":              ["case_id", "date_of_surgery", "panel_roles"],
  "fcot":                        ["case_id", "room", "scheduled_start", "wheels_in", "first_case_in_room",
                                  "delay_reason_code", "panel_roles"],
  "duration_accuracy":           ["case_id", "booked_minutes", "actual_in_room_minutes", "panel_roles"],
  "same_day_cancel":  ["case_id", "cancelled_same_day", "cancellation_reason_code", "panel_roles"],
}
```

`panel_roles` is a derived presence flag: true only when the `panel` file exists and carries `role` and `listed_order`. Without it the loader still credits the single named surgeon, but `attribution.tie_break_applied` and `shared_flag` are null and the co-surgeon monitor (F-03) prints "panel roles not in extract: rate not computable". The Assignment (M0) is where this shape is discovered; the checklist makes it visible on every later load.

#### As-of dates and model versions

Every `feed_load` carries the feed's own `as_of_date`, given on the command line from the document the owner sent (the ticket, the report header, the vendor export date). It is never the load date. `metric_value.source_as_of` and `metric_value.model_version` are copied from the load at compute time, so a tile can say "Vizient model version <x>, as of <date>" and "source: PBO report dated <date>" (F-97 AC 1, AC 2) while the batch's "last refreshed" stays `run.published_at` (F-83). A later-feed period whose load is missing renders the previous load's `as_of_date` with the `feed-not-received` template (F-97 AC 3).

`--model-version` is required for `vizient` and refused for every other feed. A `vizient` load whose model version differs from the previous load's for the same encounters writes one `restatement` per affected `metric_value` with reason `model_refresh` when `scorecard restate --reason model_refresh` is run; `close` prints the count of encounters whose expected values changed so the analyst knows a restatement is due.

#### Feed health and the no-zero rule

The feed-health gate (F-82) runs inside `close` before any number is written and reads three things per feed the period needs: `feed_load.status`, `row_count` against `department_setting.expected_min_rows.<feed_key>` (set from the first three months and revised by a signed setting change), and `period_covered` against the period being closed.

| Condition | `feed_load.status` | What `close` does | What the surgeon sees |
|---|---|---|---|
| No load for the feed covering the period | (none) | every metric from that feed gets `suppression_decision(kind='feed_missing')`; run continues; publish allowed | `feed-not-received`: "<feed> for <period> not received as of <date>" |
| Load failed at step 5 (grain or type errors) | `failed` | as above; the failure detail is on the run row | same |
| Row count below `expected_min_rows` or `period_covered` truncated | `partial` | run stops with gate `feed_health` unless `--accept-partial <feed_key> --note "..."` is passed; the note is stored on the run (F-82 AC 3, OQ-37) | after acceptance: numbers publish; the analyst's note is on the period record, not on the tile |
| Survey load with quarantined comments (D-40, M4) | `held` | the scores are loaded and the four measures compute, but `close` writes `suppression_decision(kind='feed_held')` on `scope = 'value'` for every Bucket 5 cell of that survey month, so the no-blank gate holds and `publish` renders the reason, never the value; the hold lifts when the office re-delivers or releases and the next `close` computes the month normally | `feed-held`: "MGB patient survey for <month> held: de-identification check in progress as of <date>" |
| Load complete | `loaded` | normal | numbers |

The guard that distinguishes "no records loaded" from "zero records credited" (F-82 AC 2) is structural: `metric_value` rows are written only for metrics whose feed has a `loaded` (or accepted `partial`) load whose `period_covered` contains the period. A surgeon with zero cases in a loaded month gets OR case volume 0 (F-14 AC 3); a surgeon in a month with no load gets the reason. `tests/loaders/test_feed_health.py` runs an empty extract through `close` and asserts every wedge tile carries the reason text and no `metric_value` exists.

A missed run is visible without any of this: "last refreshed" is `run.published_at`, so a month nobody closed shows the previous month's date on every artifact (F-83 AC 2).

#### source_registry for pending sources

`ledger.source_registry` (DDL in the Data model section) holds, from the first M1 run, one row per metric that is pending or not in this release (F-103 AC 5):

| metric_key | status at M1 | Reason rendered (F-33 key) | Registration that flips it |
|---|---|---|---|
| `referral_to_visit` | `pending_source` | `pending-source` "Data source pending confirmation" | `scorecard source register --metric referral_to_visit --system <queue> --extract <name> --join-key referral_id --rule "referral received date to the resulting visit's rendering provider" --from 2027-Q3` |
| `icu_return` | `pending_source` | same | `... --join-key encounter_id --rule "ICU step-down and return event to the admission's index-operation surgeon" --from ...` plus the proxy window as an F-100 parameter (OQ-05) |
| `block_utilization` | `not_in_release` | `not-in-release` "Not in this release: needs block allocation and release schedule; owner not yet named" | `... --metric block_utilization --system <block system> --join-key holder_person_key --rule "block minutes to the surgeon holding the block" --from 2027-01` |

A registration missing `--join-key` or `--rule` is refused by the CHECK (F-103 AC 1). After registration the metric computes only for periods on or after `effective_from`; earlier periods keep the pending text unless `scorecard recompute --source-registered <metric> --from <period>` is run, which writes restatements with reason `source_registered` (F-103 AC 2, F-96). The registration updates the `feed_owner` row in the same transaction (F-103 AC 3) and is an `audit_log` row.

#### Feed-specific notes

- **periop_or_log.** The first load carries 12 months so the trend has history; the tile reads `history-from` "history from <date>" when it has less (F-43). The loader prints, per subspecialty, the shared-case rate against 5% (F-03) and the delay and cancellation reason-code distribution including the blank and Other share (the Assignment's counts, re-run every month). The `procedure` column is periop's scheduled procedure name as printed; the loader refuses a column that looks like a notes field (over 120 characters or containing line breaks) because that column reaches the surgeon's CSV (see "PHI minimization").
- **periop_report.** Loaded with the same ticket as the extract. `close` refuses to reconcile a period whose `periop_report` load is missing unless `--reconcile-skip --note "..."` is passed, and then every wedge tile carries the analyst-facing `not-reconciled` mark on the period record; the surgeon-facing tile drops the "Reconciled to periop's <Month> report" sentence (F-15 AC 2) rather than asserting it.
- **roster.** A snapshot load closes rows that are absent from the file with `faculty_to = as_of_date - 1 day` only when `--close-missing` is passed; otherwise absence is reported and nothing is closed. Departures are deliberate (F-113 AC 5).
- **survey.** See "Survey comments" below for the service account, the de-identification check and the hold.
- **vizient and qi.** Both land in one governance envelope: the loads are accepted any time (the data is on MGB storage either way), but `close` computes nothing from them until `gate.medical_staff_office` is signed and `--allow-quality` is passed, and `privileged` grants are the only read path (the Data model section, Builder decision 7 (D-22)).
- **clinic_sched samples.** The scorecard does not sample the scheduling system itself (Builder decision O-8). It loads the sample rows clinic operations produce, with the sampling schedule recorded in `source_registry.extract_name`.
- **adt.** `src.icu_stay` is derived at load from consecutive transfers; the "unexpected return" proxy window is `definition_param icu_return.window_hours` (F-110 AC 7), so changing it is a new definition version, not a loader change.
- **attendance.** A scan for a person not on the roster as of the session date goes to the exception list; the session still counts as held.
- **billing_wrvu.** No `ledger.record` rows and no attribution; the loader writes `src.wrvu_month` and the restatement delta. The comp office's written confirmation is `gate.comp_office` with the query text stored in `reference` (F-77 AC 6).

### The run pipeline: commands, gates, exit codes

One entry point, `scorecard`, with subcommands. Every command opens one connection, sets `scorecard.actor` to the analyst's identity (or the service account's), writes one `ledger.run` row of its `kind`, prints what it did, and exits with one of five codes.

| Exit code | Meaning | Examples |
|---|---|---|
| 0 | Done; or nothing to do | published; same file already loaded (no-op); `--dry-run` completed |
| 1 | A gate failed; nothing surgeon-facing was written or sent; the gate is named on the last line | unexplained reconciliation delta; unresolved attribution exception; blank cell; row count mismatch; payload scan hit |
| 2 | Refused by an immutability or governance rule; nothing written | changed hash for a registered version (BD-2); period already published without `--restate`; channel gate not signed; `--allow-quality` without `gate.medical_staff_office`; a load without `--ticket` |
| 3 | Input error | file not found; wrong grain; unknown feed_key; bad period format; missing `--model-version` for `vizient` |
| 4 | Environment error | database unreachable; `grants check` drift; migrations behind; SMTP relay refused; landing folder not writable |

The runbook maps each code to an action (1: read the gate line and fix the data or record the delta; 2: this is a rule, do not work around it; 3: fix the command; 4: call the builder or MGB support).

#### Command reference

```
setup and checks
  scorecard migrate                                   apply scorecard/ledger/migrations/*.sql, then roles.sql
  scorecard grants check                              diff live grants against roles.sql; exit 4 on drift
  scorecard doctor                                    deployment check: migrations current, grants, gates
                                                      (signed and confirmed), retention classes, listener
                                                      bound to localhost (M1) or TLS on (M2), restricted
                                                      unreachable by analyst_ro, runtime login not a
                                                      superuser or table owner, pgaudit loaded, newest audit
                                                      export and newest off-host dump within 24 hours,
                                                      no surgeon-identified static file served (F-85 AC 3),
                                                      restore drill recorded, backup timer active
  scorecard register [--check]                        hash definitions; refuse a changed hash (F-13)

data in
  scorecard load <feed_key> <file> [<file2>] --ticket T --as-of YYYY-MM-DD [--model-version V]
                 [--period YYYY-MM] [--supersedes <feed_load_id>] [--close-missing]
  scorecard roster load <csv> --ticket T --as-of D [--close-missing]
  scorecard roster set --clinician K (--attended D | --opt-out D | --chief C | --leader L | --site S) --effective D
  scorecard setting set <key> <value> [--signed-by X --signed-on D --reference R] --effective D
  scorecard setting confirm gate.<name> --by <identity>     second identity (backup analyst or brief owner)
  scorecard source register --metric M --system S --extract E --join-key J --rule "..." --from YYYY-MM

monthly close
  scorecard attribute --period YYYY-MM                attribution, participants, exceptions, co-surgeon rate
  scorecard exceptions list --period P
  scorecard exceptions resolve <id> (--assign K | --exclude) --reason "..."
  scorecard close --period YYYY-MM [--dry-run] [--allow-quality] [--allow-survey]
                 [--accept-partial <feed_key> --note "..."] [--reconcile-skip --note "..."]
  scorecard reconcile --period P                      re-run the gate alone; prints ours / periop's / delta / explanation
  scorecard delta add --metric M --version V --from P --author X --text "..."
  scorecard suppress --period P --report              surgeon x metric grid of states and reasons (J4.6)
  scorecard peers --period P --summary | --render-report --from --to

publish
  scorecard publish --period YYYY-MM [--dry-run] [--send] [--eml] [--numbers-only]
                 [--only <clinician_key>] [--resend --clinician <clinician_key>]
                 [--record-eml-sent --manifest <file>] [--allow-hosted] [--pub]
  scorecard overrides --month YYYY-MM [--send]        one list per feed owner (F-64)
  scorecard status --daily | --weekly [--send]        F-112 checklist and deadline emails; weekly status email
  scorecard notify ack|decision|recredit|filed --dispute D-nnnn [--dry-run]   re-render one notification
  scorecard reply log|answer|ingest-ndr ...           reply_log rows; bounces (Delivery surfaces section)
  scorecard delivery show --period P | incident --delivery <id> --reference R
  scorecard interview record ... | adoption report --period P               F-91
  scorecard definitions list | diff M v1 v2 | page M@vN
  scorecard compute --period P --metric M --clinician K [--basis adjudicated]   prints one cell, writes nothing
  scorecard pub build --period P [--check-only]       only when pub_enabled (D-36)
  scorecard survey release <response_id> --reference R   M4, runs as svc_survey

after publish
  scorecard dispute file | route | show | decide | withdraw | link | queue | import   (the Dispute workflow section)
  scorecard recompute --dispute D | --roster-change R | --version M@vN --from P | --source-registered M --from P
  scorecard restate --metric M --period P --to-version V --reason <category> --note "..."
  scorecard audit --clinician K --period P [--format text|csv]
  scorecard audit export                              hash-chained audit_log batch to the off-host copy (run by status --daily)
  scorecard retention run [--dry-run]                 SET ROLE retention; the only path that deletes

development only (never on the VM)
  scorecard synth --seed N --surgeons 12 --months 14 --out fixtures/synth/    synthetic extracts, no PHI
```

`--allow-quality`, `--allow-survey` and `--allow-hosted` are acknowledgements, not overrides: each reads the matching `gate.*` row in `department_setting` and exits 2 if it is missing (the Data model section). Without the flag the bucket is not computed even when the gate is signed, so the analyst names what the run is about to do.

#### The monthly sequence

```
 business day 1..5          extract and periop report land through the ticket (F-112 check a)
        |
        v
 scorecard load periop_or_log cases.csv panel.csv --ticket T --as-of D     exit 0 / 3
 scorecard load periop_report report.csv --ticket T --as-of D
 scorecard roster set ...  (only if something changed)
        |
        v
 scorecard close --period 2026-10 --dry-run          runs every stage in a transaction that is rolled back;
        |                                            prints gate results, suppression grid, peer summary, checklist
        |  fix: exceptions resolve / delta add / roster set / setting set
        v
 scorecard close --period 2026-10                    stages (the Metric engine section): field check -> attribution -> roster
        |                                            as-of -> compute -> reconcile -> suppress -> peers ->
        |                                            feed health -> invariants -> run row (status 'ok')
        |  exit 1: gate named; nothing published; re-run after the fix
        v
 scorecard publish --period 2026-10 --dry-run        preview/2026-10/<clinician_ref>/{email.txt, scorecard-2026-10.csv,
        |                                            message.eml} + index.html + reconciliation.txt + suppression.txt
        |                                            + chief_summary.txt + override_list_periop_or_log.csv + checklist.txt
        |  analyst opens one email and one CSV and checks them against the grid (runbook step)
        v
 scorecard publish --period 2026-10 --send           gates: run closed and all gates passed; channel gate
        |                                            signed; payload scan per artifact; address resolved;
        |                                            delivery row with sha256 and message id; run.published_at
        v
 scorecard overrides --month 2026-10 --send          periop list; send date on the period record (F-64 AC 4)
 scorecard status --daily                            prints the F-112 checklist; stored on the period record
        |
 business day <= 10         published (F-83 AC 4 computes the business days from close to publish)
```

`publish` refuses a period whose latest `close` run has `status <> 'ok'` or any failed gate (exit 2) and a period that already has `published_at` unless `--restate` was used on the close (F-79 AC 4). `close` refuses a period whose month has not ended (F-84).

#### Gates

| # | Gate | Where | Stops the run? | Stored where | Feature |
|---|---|---|---|---|---|
| G1 | Ticket present, as-of present, file readable, grain correct | `load` | yes (exit 2 or 3) | `feed_load` | F-95 AC 1 |
| G2 | Field checklist | `load` | no; marks metrics `not_computable` | `feed_load.field_checklist` | F-80 |
| G3 | Feed health (missing, failed, partial) | `close` | partial only, unless accepted with a note | `run.gate_results.feed_health` | F-82 |
| G4 | Attribution exceptions all resolved | `close` | yes | `run.gate_results.exceptions` | F-02 AC 4 |
| G5 | Governance flag for each computed bucket | `close` | yes (exit 2) | `run.gate_results.governance` | F-106 AC 3, AC 4 |
| G6 | Reconciliation: every delta explained by a `definition_delta` or a sustained re-credit | `close`, `reconcile`, `recompute` | yes | `reconciliation_result`, `run.gate_results.reconciliation` | F-81 |
| G7 | Row count equals denominator for every value | `close`, `recompute` | yes | `run.gate_results.invariants` | F-51 AC 2 |
| G8 | Every (clinician, metric, period, scope) has a value or a decision with non-empty reason; no unfilled placeholder | `close`, `recompute` | yes | same | F-32 AC 6, F-33 AC 2 |
| G9 | Mapping: every roster surgeon has a chief and a direct leader | `close` | no; warning listed | `run.gate_results.mapping` | F-87 AC 2 |
| G10 | Period not already published | `close` | yes (exit 2) unless `--restate` | `run` | F-79 AC 4 |
| G11 | Channel gate signed (`gate.privacy_email.*`, `gate.security_review` and siblings for `--allow-hosted`) | `publish`, `dispute --send`, `overrides --send` | yes (exit 2) | `delivery.gate_checked` | F-106 AC 1, AC 2 |
| G12 | Payload scan per artifact | every send | yes; the artifact and field are named | `delivery.payload_scan`, `run.gate_results.payload_scan` | F-106 AC 7 |
| G13 | Recipient resolved from the directory and equal to the roster's stored address | `publish --send`, per surgeon | that surgeon only; others send | `delivery.recipient_resolved_from`; blocked sends on the checklist | F-90 AC 8 |
| G14 | Own-records check: every record_ref in an artifact is credited to its recipient | every send | yes | `run.gate_results.own_records` | F-106 AC 5, F-90 AC 1 |
| G15 | No composite, rank or target in any artifact (text scan for the forbidden patterns of F-42) | `publish` | yes | `run.gate_results.what_this_is_not` | F-42 |
| G16 | pub contract: no forbidden column, no suppressed tile with a null reason | `publish --pub` | yes | `run.gate_results.pub_contract` | adopted architecture (hybrid) |
| G17 | Grants match `roles.sql` | every command | yes (exit 4) | `audit_log(action='grants_check')` | the Data model section invariant I14 |
| G18 | Email-months custody: every decided dispute of `channel='email'` has a `decision_reply_id`; decide actor is the analyst or backup | `publish` | yes | `run.gate_results.custody` | F-111 AC 5, AC 6 (ledger reading, the Dispute workflow section, Builder decision 2 (D-25)) |

#### The publish stage in detail

`scorecard/publish/` (templates and body content are the Delivery surfaces section's; this is the transport and the gates):

```
scorecard/publish/                (the full module list is in the Delivery surfaces section)
  render.py        ClinicianArtifact from metric_value, suppression_decision, peer_group_snapshot, definitions
  email_text.py    plain-text body; csv_rows.py the own-rows CSV
  scan.py          payload_scan(artifact) -> ScanResult      column allowlist + value patterns (see PHI section)
  own_records.py   assert_own_records(artifact, clinician_id)
  gates.py         department_setting gate.* rows; channel_open(ch), hosted_open()
  directory.py     resolve_mailbox(person_key) -> address   (Builder decision O-7, D-34)
  transport.py     send(message) via smtplib to department_setting.smtp_relay from
                   department_setting.service_mailbox; reply-to department_setting.dispute_mailbox;
                   .eml writer for --eml; NDR ingest
  delivery.py      delivery row: channel, sent_at, message_id, artifact_sha256, gate_checked, payload_scan
  overrides.py     per-feed-owner list from correction_request (F-64)
  status.py        F-112 checklist; daily and weekly status email
  pub.py           optional pub schema publisher + contract test (deferred; D-36)
```

Behaviours fixed here:

- `--dry-run` writes every artifact to `preview/<period>/` on the encrypted local disk (workstation at M1, VM at M2) and nothing else. The preview folder is in the `artifact_files` retention class, which carries the two-month interim period of D-41, so the quarterly `retention run` removes rendered files older than two months whose `delivery` rows exist and keeps only the hash on `delivery`; it is never on a network share.
- `--send` sends through the MGB internal relay from the department service mailbox (`department_setting.service_mailbox`), never from a person's account, with `Reply-To` set to the dispute mailbox. Plain text body, one CSV attachment, no HTML, no images, no link in months one to three (F-90 AC 3).
- `--eml` writes RFC 822 files to `preview/<period>/eml/` for the case where the relay is unavailable. The runbook says these are opened from the department service mailbox in Outlook and sent from that mailbox, so nothing lands in a personal Sent Items folder (security judge error 14; Builder decision O-5).
- `--numbers-only` drops the CSV and adds the `no-attachment` sentence from the catalogue (a new key; Builder decision O-6); the definitions appendix stays in the body (D-33). This is the recorded fallback if the privacy office declines attachments (adopted architecture item 7).
- Bounces and non-delivery reports arrive in the service mailbox (`Return-Path`); `scorecard reply ingest-ndr` (run by `status --daily`; IMAP) writes `delivery.bounce_at` and `bounce_reason` and deletes the NDR after recording it, so the returned case list is not kept a second time; a bounced send is retried with `publish --resend --clinician K` only after `roster set --clinician K --identity <person_key> --effective D` and the retry is a new `delivery` row (F-90 AC 9).
- A send to any address other than the resolved one cannot happen by construction (the address is computed, not typed), but if a misdirection is discovered the analyst records it with `scorecard delivery incident --delivery <id> --reference <procedure ref>` (OQ-58 names the procedure); the checklist lists it until resolved (F-90 AC 10, F-112 AC 7).
- `published_at` is written once per period by `publisher`, after the last successful send; if a send fails midway, the period is not published, the successful `delivery` rows stay, and `publish --send` resumes with the surgeons who have no `delivery` row (F-90 AC 7).

#### status, audit, recompute, restate

- `scorecard status --daily` prints and stores the F-112 checklist (extract not staged by business day 5; not published by business day 10; disputes at day 10 and day 14; unentered replies and unanswered questions over two business days; override list not sent; bounces and incidents). With `--send` it emails each adjudicator one message naming their listed disputes by id and record_ref only (F-112 AC 4, AC 8). `--weekly` adds feed health per source, last refreshed per source, open overrides awaiting source, and the grants check result, and mails the analyst and the backup. At M1 the daily check is a calendar entry; at M2 `scorecard-status.timer` runs it (F-112 AC 9).
- `scorecard audit` is defined in the Dispute workflow section. It runs under `analyst_ro`.
- `scorecard recompute` and `scorecard restate` are defined in the Metric engine section. Both re-run G6, G7 and G8 and write `restatement` rows; both refuse a period with no prior `close`.
- `scorecard retention run` is defined in the Data model section. It is a runbook quarterly step and never runs from a timer until data governance sets the periods (OQ-57).

### Environments

#### M1: the analyst's workstation

The VM is requested at M0 (D-02, D-03). Until it lands, the whole system runs on the analyst's MGB-managed workstation with a local PostgreSQL that listens on localhost only. This is a declared interim (security judge synthesis item 1): the privacy office is told where the ledger is, and the move to the VM is one `pg_dump` and one `pg_restore`.

```
+------------------------------------------------------------------------------------+
| Analyst workstation (MGB-managed image, MGB disk encryption and patching; confirm  |
| both with information security, OQ-47)                                             |
|                                                                                    |
|  C:\scorecard\              git checkout, Python 3.12 venv, .env (DB and relay      |
|                             credentials, never in git)                              |
|  C:\scorecard\landing\      <feed_key>\<YYYY-MM>\<files>   copied in from the ticket |
|  C:\scorecard\preview\      publish --dry-run output; cleared by retention run (O-4) |
|  C:\scorecard\backups\      pg_dump -Fc per write day; copied off-host (O-4)           |
|                                                                                    |
|  PostgreSQL 16 (native installer)  listen_addresses = 'localhost'                   |
|    database scorecard: raw / src / ledger / restricted / privileged(empty) / pub(empty)|
|    roles: loader, engine, publisher, disputes, retention, analyst_ro; svc_survey M4 |
|    login role scorecard_cli with SET ROLE per stage (see Roles)                     |
|    scram-sha-256; password in .env; no network listener; no pg_hba host lines       |
+------------------------------------------------------------------------------------+
        |  smtplib, port 25/587 as the relay requires, from the department service mailbox
        v
  MGB internal SMTP relay (IP-restricted)  --->  surgeons' MGB mailboxes
  Department dispute mailbox (shared Exchange mailbox; members: analyst, backup analyst;
  retention policy set by Exchange administrators, OQ-57)
```

What the workstation does not do: no scheduled tasks (the monthly close is a calendar entry, F-79), no web listener, no file share exposure of the data directory, no copy of anything to a personal drive or a laptop. `scorecard doctor` fails if `listen_addresses` is not `localhost` or if the data directory is on a network path.

#### M2 and later: the MGB-managed VM

```
+------------------------------------------------------------------------------------+
| MGB-managed RHEL VM (department allocation; encrypted disk; MGB monitoring agent;   |
| patched by MGB; 4 vCPU / 16 GB is enough for tens of surgeons)                      |
|                                                                                    |
|  /opt/scorecard/            venv, git checkout at a tagged release                  |
|  /srv/scorecard/landing/    as at M1 (analyst copies files in over the MGB share    |
|                             mount or scp; permissions 0770 scorecard:scorecard)     |
|  /srv/scorecard/preview/    publish --dry-run                                       |
|  /srv/scorecard/backups/    nightly pg_dump -Fc -> MGB-approved encrypted storage    |
|                                                                                    |
|  PostgreSQL 16  localhost, ssl = on, scram; same schemas and roles as M1            |
|  gunicorn (app role) behind nginx with TLS, or behind MGB's SSO proxy               |
|      SSO validated in-app (OIDC via Entra ID or SAML library); if MGB mandates a    |
|      header-injecting proxy, nginx accepts connections only from the proxy address   |
|      and the header is signed (security judge decision 5)                            |
|  systemd:                                                                          |
|      scorecard-pgdump.timer     nightly   pg_dump + sha256 + copy to storage          |
|      scorecard-status.timer     weekly    scorecard status --weekly --send            |
|      scorecard-survey.path/.service (M4)  runs `scorecard load survey` as svc_survey   |
|                                          when a file lands in landing/survey/        |
|      scorecard-app.service              gunicorn, Restart=always                     |
|  Logs: journald, ids only; shipped to the MGB log platform if the security review    |
|  requires it                                                                        |
+------------------------------------------------------------------------------------+
```

The monthly close stays a human-run command on the VM (`ssh` as the analyst's own account, which is a member of the `scorecard` group), not a timer: the analyst reviews the gates (staff judge synthesis item 7). systemd carries only backups, the status email, the survey path unit and the app.

Secrets: `.env` (M1) or `/etc/scorecard/env` (M2, mode 0640, owner root, group scorecard) holds the runtime database passwords, the relay credential if the relay requires one, the IMAP credential for the service mailbox, and the OIDC client secret. The `migrate` owner credential is not in that file at M2: it lives in `/etc/scorecard/migrate.env` (mode 0600, owner root), read by `sudo scorecard migrate` from the runbook, so the analyst's everyday session cannot drop a trigger or delete an audit row; at M1 the analyst is the workstation's superuser by construction and the off-host audit copy is the compensating control (invariant I3). Nothing in git; `tests/test_no_secrets.py` greps the tree for the patterns. TLS: Postgres `ssl = on` and `sslmode=require` in the connection string at M2; nginx TLS with an MGB-issued certificate.

#### Backups and the restore drill

- `pg_dump -Fc` of the whole database nightly (M2 timer; M1 a runbook step after every write day, at minimum after each `close`, `publish` and `dispute decide`, closing the minimal-batch gap the staff judge named in error 5). The dump includes `restricted` and `privileged`; the security judge's point that "notes excluded from backup" would be false is accepted. At M2 the dump's access list is the VM's. At M1 a dump left in `C:\scorecard\backups\` shares a disk with the live database and the landing files, so the runbook step copies it, with its sha256, to an MGB-approved encrypted location off the workstation (a department share with a named ACL or the enterprise backup service; information security names it, OQ-61) whose access list is exactly the analyst and the backup analyst; `doctor` fails when the newest off-host copy is older than 24 hours since the last write day, and the restore drill before M1 restores from the off-host copy, not the local one.
- Each dump is checksummed and the checksum written to `backups/MANIFEST` and to `department_setting.backup.<date>` on the next run.
- Restore drill, before M1 is called done and quarterly after: restore the newest dump to a scratch database (`scorecard_restore`), run `scorecard doctor --db scorecard_restore`, run `scorecard compute --period <last published> --metric fcot --clinician <one>` on both databases and compare, drop the scratch database, record `department_setting.restore_drill.<date>` with the elapsed time. `doctor` warns when the newest drill is older than 120 days.
- The workstation-to-VM move is the same procedure with the target being the VM's database, plus `scorecard grants check`, a row-count comparison per table printed by `scorecard doctor --compare <dsn>`, and one published period recomputed on the VM to identical values before the workstation copy is wiped (`retention run --store workstation_copy`, a one-off class).

### Roles, grants, restricted and privileged schemas

The role table is the Data model section's. This subsection fixes how the roles are used at run time.

- **One login for the CLI, one per service.** The analyst's CLI connects as login role `scorecard_cli`, a member of `loader`, `engine`, `publisher`, `disputes` and `retention` with `NOINHERIT`. Each stage issues `SET ROLE <stage role>` before its first statement, so a loader bug cannot write a `metric_value`, an engine bug cannot mark a period published, and only `retention run` can delete. `svc_survey` is its own login role, held by the systemd unit's credential file and by no person. `app` is the gunicorn login role, a member of `disputes`, with a second call-scoped connection as `engine` for the synchronous recompute (D-26). `analyst_ro` is what the analyst uses in `psql`. `migrate` is used only by `scorecard migrate` from the runbook. `doctor` fails when any runtime login is a superuser or owns a table.
- **Audited reads.** `pgaudit` is loaded with object-level SELECT auditing on `ledger`, `src`, `raw` and `privileged` for `analyst_ro` and `scorecard_cli`, with `log_connections` and `log_disconnections` on, so every `psql` read of surgeon-identified or patient-level rows is a log line carrying role, table and timestamp and never a row value. The lines ship with the application logs (below) and `scorecard audit --clinician K --period P` prints the audited `psql` reads of the tables that hold that surgeon's rows beside the app's `view` rows (F-107). Without this the app's `log_view()` would cover the web app only while the largest standing reader of identified data is the `psql` session. The quarterly access recertification includes `psql` access and the pgaudit log's presence.
- **Grants as a migration.** `scorecard/ledger/roles.sql` is idempotent (`REVOKE ALL` then `GRANT` per role) and is re-applied by `migrate`. `scorecard grants check` reads `information_schema.role_table_grants` and `column_privileges`, compares them with the grants parsed from `roles.sql`, and exits 4 on any difference. It runs at the start of every command (G17) and its result is an `audit_log` row.
- **Session variables and RLS.** Every connection sets `scorecard.actor`; the app also sets `scorecard.clinician_id` and `scorecard.role` from the SSO subject resolved through `ledger.identity` and `roster_as_of(today)`. RLS policies on the RLS set (the Data model section, roles table: eleven tables including `restricted.survey_comment` and `src.survey_response`) read them. The policies are defense in depth behind the application's authorization matrix; the matrix is the first check and is tested as a matrix (see Tests), and `tests/web/test_rls_backstop.py` covers every table in the RLS set. `web/queries.py` uses psycopg parameter binding only (`tests/web/test_no_sql_strings.py`).
- **restricted.** `survey_comment.comment_text` has a column grant to `app` only; `peer_group_member` is readable by `engine` and `app` never; `private_note` is `app` only with RLS on `author_clinician_id`. `analyst_ro` has no grant on the schema at all, so `scorecard audit` cannot print a comment even by mistake. The load path for comments is `svc_survey`, on a timer, logged as `pipeline_read` (F-107 AC 3). The step-zero statement that the analyst handles comments as pipeline data (J1.1, J4.10) is true of file handling in the landing folder and false of any database read; the runbook says so in those words.
- **privileged.** Exists empty from the first migration so the grants migration covers it before a quality feed lands. At M6 it holds `qi_event` and `quality_note` (the claim and decision text of every dispute on a `qi_event` record; `ledger.dispute` carries null in those columns by CHECK, so the structural segregation covers the dispute text and not only the event). `engine`, `disputes` and `app` touch it only while the session variable `scorecard.quality_gate` is set, which `close --allow-quality` and the app set only after reading the confirmed `gate.medical_staff_office` row; `analyst_ro` has no grant. What the segregation does not yet cover is the data derived from a QI event: the `ledger.record` row of type `qi_event`, the `metric_value` and `metric_value_record` rows of the QI four, and the `record_override` on a quality dispute, all of which `analyst_ro` can read. Whether those are peer-review material is the medical staff office's call, recorded as **OQ-62 (new)** and answered before M6; if they are, the mechanism is an RLS policy `privileged_derived` on those four tables that hides rows whose `record_type = 'qi_event'` or whose `metric_key` is one of the QI four from every role but `engine`, `app` under the quality gate and `disputes`, and a `pg_dump --exclude-schema privileged` variant for any copy that leaves the department. The schema boundary is what makes that a grant and policy change rather than a redesign (the Data model section, Builder decision 7 (D-22)).
- **pub.** Not built unless a sponsor asks. If built: `publisher` writes it in one transaction tagged with `run_id`; `bi_ro` has SELECT on `pub` and nothing else; the BI user filter is a data-source-level filter on `viewer_upn` in the BI tool, never Postgres RLS on a service connection (both judges' correction); export, download and "view data" disabled in the workbook. G16 runs before every `--pub`.

### PHI minimization

The rule: an artifact carries the surgeon's own records and only the columns the tile needs; everything else is an id. Enforcement is the payload scan (G12), the own-records check (G14), the loader's column allowlist, and the logging rules.

| Channel or store | Carries | Never carries | Enforced by |
|---|---|---|---|
| Monthly email body (F-90) | the four tile lines (value or reason), comparator and peer count, trend as a text table, definition version, "last refreshed", reply-to address, "what this is not" line | any record row; any peer identity; any link in months one to three; a composite, rank or target | G12, G14, G15; F-33 key check |
| Own-cases CSV (F-90 AC 5) | `record_ref`; date; room; procedure (periop's scheduled procedure name); scheduled start; wheels-in; on-time yes/no; delay reason as stored; booked and actual minutes; cancellation reason where applicable; shared flag; dispute status | patient name, MRN, DOB, CSN, HAR, encounter number, phone, any source notes column, another surgeon's records | column allowlist per metric in `csv_rows.py`; G12 value scan; G14 |
| Adjudicator email (F-92, F-52) | one record's columns as the surgeon saw them; provenance ids; the claim; the reply instruction | any metric value of any surgeon; any spread; any comment text | G12; F-72 AC 5 for survey records |
| Decision and re-credit emails (F-93, F-92) | one record's row text and the disputant's updated tile | comment text; other surgeons' values | G12 |
| Override list (F-64) | periop case id, field, logged and adjudicated value, decider role, decision date, version, dispute id | patient identifiers beyond the periop id; claim text | G12 |
| Chief summary (F-37), trust report (F-98), status email (F-112) | counts, dispute ids, record_refs, adjudicator names | record content, claim or note text, surgeon-level values | G12; the report queries select no text columns |
| Application logs (journald, run logs) | ids (`feed_load_id`, `run_id`, `record_ref`, `dispute_id`), role names, counts, gate names | names, procedure text, comment text, claim text, addresses, source keys that are MRNs | `scorecard/log.py` formatter with an allowlist of structured fields; psycopg errors are wrapped so a failing row's values are not echoed; `--debug` is refused on the VM |
| Preview folder | the exact artifacts | anything more than the artifacts | same scans as the send; encrypted local disk; emptied by retention |
| pg_dump | the whole database | (n/a) | M2: the VM's access list; M1: copied off the workstation to MGB-approved storage with an ACL of the analyst and backup analyst (OQ-61); checksum; two-month interim class |
| Analyst `psql` (analyst_ro) | ledger, src, raw except `raw.survey`, `raw.vizient`, `raw.qi` | `restricted`, `privileged`, the three raw tables that carry comment text or encounter-level identifiers | grants; every SELECT audited by pgaudit |
| Dispute mailbox and `dispute.claim_text`, `decision_note` | surgeon and adjudicator free text about one record, scanned at entry | patient names, MRNs, dates of birth (refused by the scan at `file_dispute()` and `decide()`) | scan at entry; the mailbox is a PHI store with the `reply_mailbox` retention class and its membership in the quarterly recertification |
| Ad hoc exports | none defined | (n/a) | there is no export command; any export the department later wants is a feature with its own scan (OQ-46) |
| pub (if built) | viewer_upn, metric, period, value-or-reason, trend points, sorted spread points, version, as-of | clinician id, name, patient identifier, case id, comment text | G16 |

The payload scan (`publish/scan.py`) is two passes. The column pass rejects any column whose name is not on the artifact's allowlist. The value pass runs on every cell: an MRN-shaped token (the institutional pattern, recorded in `department_setting.mrn_pattern`, to be supplied by the privacy office), a date of birth (a full date more than 18 years before the period in a non-date column), a phone number, an email address other than the recipient's, and any cell over 120 characters or containing a line break (a free-text field). Two fields are exempt from the 120-character rule because they are free text by design: `dispute.claim_text` and `decision_note`, which are capped at 1,000 characters and were already scanned by the value patterns when `file_dispute()` and `decide()` accepted them; the send-time scan runs the value patterns on them again and not the length rule. A hit blocks the send, names the artifact and field, and is logged (F-106 AC 7). `tests/publish/test_scan.py` feeds a fixture CSV with an MRN column and asserts the block.

`record_ref` is the only record identifier a surgeon ever sees. It is the opaque token from the Data model section, Builder decision 3 (D-19); it resolves to a patient only through `ledger.record` under a database role (F-54 AC 3), and the test in the Data model section proves it.

Patient-level fields per store (F-106 AC 6, made concrete). "Patient-level" means a value that identifies an encounter or a person other than a roster clinician.

| Store | Patient-level fields it holds | Who can read them |
|---|---|---|
| Landing folder | Whatever the owner sent, until the allowlist drops the rest at load; the file stays for replay with its sha256 | analyst (file handling only); `svc_survey` for `landing/survey/` |
| `raw.periop_or_log`, `raw.periop_report`, `raw.clinic_sched`, `raw.referral`, `raw.adt` | periop case id, visit id, referral id, encounter id used as a join key, timestamps, the scheduled procedure name | `loader`, `engine`, `analyst_ro` (audited) |
| `raw.vizient`, `raw.qi` (M6) | encounter id (HAR or CSN), QI event id, index case id | `loader`, `engine` under the quality gate; never `analyst_ro` |
| `raw.survey` (M4) | response id, comment text verbatim, the provider named | `svc_survey` only |
| `src.*` except `survey_response` | `source_key` (periop case id, encounter id, visit id), timestamps, procedure name | `loader`, `engine`, `publisher`, `disputes`, `app` (RLS), `analyst_ro` (audited) |
| `src.survey_response` | response id, scores, provider named; no text | `svc_survey`, `engine`, `app` (RLS), `analyst_ro` (audited) |
| `restricted.survey_comment`, `comment_quarantine` | de-identified comment text; quarantined text with the pattern name | `app` column grant under RLS (the viewer and the direct leader of record after day 30); `svc_survey` |
| `ledger.record` | `source_key` behind every `record_ref` | `engine`, `disputes`, `app` (RLS), `analyst_ro` (audited) |
| `ledger.dispute.claim_text`, `decision_note` | free text about one record, scanned at entry, capped at 1,000 characters | `disputes`, `app` (RLS: disputant, adjudicator, receiver), `analyst_ro` (audited); null for `qi_event` records (the text lives in `privileged.quality_note`) |
| `privileged.qi_event`, `privileged.quality_note` (M6) | QI event with its index case id; the claim and decision text of a quality-record dispute | `loader` and `disputes` write; `engine` and `app` read under `gate.medical_staff_office`; never `analyst_ro` |
| `preview/`, `pg_dump`, the mailboxes | as the table above | as the table above |

### Survey comments: de-identification check and quarantine

Ownership first: de-identification is the patient experience office's step before delivery (design doc Dependencies; F-11). The department's loader checks that it happened; it does not become the de-identification step. If the office cannot deliver de-identified text, that is a new processing purpose with its own governance ask (security judge error 13) and the inbox waits.

The path at M4:

```
 analyst copies the vendor file to landing/survey/<YYYY-MM>/   (file handling only; declared at step zero)
        |
        v  scorecard-survey.path fires; scorecard-survey.service runs `scorecard load survey ...` as svc_survey
        |
   [gate] department_setting.gate.survey_pipeline signed?  no -> exit 2, file left in place, checklist item
        |
        v
   raw.survey (verbatim, restricted to svc_survey)  ->  src.survey_response (scores, has_comment, scope_label)
        |
        v  per comment: deid_check(text) in scorecard/loaders/survey_deid.py
        |     patterns (minimum, F-11 AC 4): names from the patient fields of the same row if the vendor
        |     file carries any; MRN pattern; date of birth; phone; email; a full date; street address shape
        |
        +-- pass -> restricted.survey_comment (response_id, comment_text, deidentified_by = 'patient experience office')
        |
        +-- hit  -> restricted.comment_quarantine (response_id, pattern_hit = pattern NAME only, feed_load_id)
                    the text is stored in quarantine, readable by svc_survey only; nothing in ledger or a log
                    holds the text or the matched value
        |
        v
   feed_load.status = 'held' when quarantine_count > 0 (Builder decision O-3)
   load report to the analyst and to the office contact: counts per pattern name, never the text (F-11 AC 4)
```

While a survey load is `held`:

- The scores are loaded and the four measures compute (comments are not an input to any measure; `engine` has no grant on the text), but `close` writes a `suppression_decision` of kind `feed_held` (rank 3, the Metric engine section's fixed order) on every Bucket 5 cell of that survey month, so nothing from the month publishes until the hold is released and the surgeon does not see measures for a month whose inbox is incomplete. The tile carries the `feed-held` sentence (a new catalogue key; Builder decision O-3): "MGB patient survey for <month> held: de-identification check in progress as of <date>". The feed-health table above has the `held` row.
- The office reviews the quarantined responses in its own system (it holds the identified copy) and either re-delivers the file with corrected text, which supersedes the load and re-runs the check, or confirms in writing that a flagged comment is a false positive; the analyst records that with `scorecard survey release <response_id> --reference <ticket>` (runs as `svc_survey` through the same path unit), which moves the row to `survey_comment` with `released_at` and the reference. A comment the office withdraws is deleted from quarantine by the superseding load; the quarantine row keeps `pattern_hit` and dates for the audit.
- Quarantined text never enters the inbox, a metric, a dispute row, an export, a log or pub (F-11 AC 5; the grant makes this true for every role but `svc_survey`).

`tests/loaders/test_survey_deid.py` runs a synthetic file with one comment per pattern and one clean comment and asserts: one quarantine row per pattern, the clean comment loaded, status `held`, measures computed, nothing published, the report carrying pattern names only.

### Governance flags in department_setting

Sign-offs are rows, not memory (F-106). A gate row is `key = 'gate.<name>'` with `signed_by`, `signed_on`, `reference` (a ticket URL or the sha256 of the sign-off document; free text is refused), `confirmed_by` and `confirmed_on` (a second identity, recorded by `scorecard setting confirm` from a session whose `scorecard.actor` differs from the signer's recorder) and a validity range. A row without a confirmer opens nothing. Publishing paths read them; the `--allow-*` flags acknowledge them and never bypass them. The reviewer's question, how a recorded gate differs from a typed one, is answered by the reference the reviewer can open and the second identity in the audit trail.

| Gate key | What it opens | Read by | Flag | Refusal text (exit 2) |
|---|---|---|---|---|
| `gate.privacy_email.scorecard` | the monthly email with the own-cases CSV (F-90) | `publish --send` | none | "channel scorecard_email is not open: gate.privacy_email.scorecard not recorded" |
| `gate.privacy_email.adjudicator` | the adjudicator email (F-92) | `dispute file --send` | none | same pattern |
| `gate.privacy_email.recredit` | the receiver notification (F-92) | `dispute decide --send` | none | |
| `gate.privacy_email.decision` | the decision email (F-93) | `dispute decide --send` | none | |
| `gate.privacy_email.override_list` | the feed-owner list (F-64) | `overrides --send` | none | |
| `gate.security_review`, `gate.data_governance`, `gate.qi_determination` | the hosted app reachable; the deep link in the email (F-85 AC 6); pub | `doctor`, `scorecard-app.service` start (refuses to bind), `publish --allow-hosted`, `publish --pub` | `--allow-hosted` | "hosted view is not open: gate.data_governance not recorded" |
| `gate.medical_staff_office` | computing and publishing any Bucket 4 metric; reading `privileged` (F-106 AC 3) | `close --allow-quality`, app quality pages | `--allow-quality` | "quality metrics not computed: gate.medical_staff_office not recorded"; tiles carry `not-in-release` until then |
| `gate.survey_pipeline` | `scorecard load survey`; computing Bucket 5 (F-106 AC 4) | `svc_survey` load, `close --allow-survey` | `--allow-survey` | "survey load refused: gate.survey_pipeline not recorded" |
| `gate.comp_office` | publishing the Work RVUs — live tracker tile (F-77 AC 6); `reference` holds the confirmed query | `close`, `publish` | none | tile carries `not-in-release` until recorded |

Non-gate governance rows that `doctor` checks and the runbook maintains: `restore_drill.<date>`; `access_recert.<date>` (quarterly review of roster-derived roles, DB roles including `psql` access and the pgaudit log, the `scorecard` OS group, the dispute and service mailbox membership, every gate row with its reference and confirmer, and the audit export chain re-hashed; adopted architecture item 10); `backup.<date>`; `retention_class` rows for every store (F-113 AC 1); `month_one_period`; `analyst_clinician_id` and `backup_analyst_clinician_id`; `dispute_mailbox`, `service_mailbox`, `smtp_relay`; `expected_min_rows.<feed_key>`; `mrn_pattern`; `incident.<date>`.

Every `setting set` is an `audit_log` row, and a gate row cannot be deleted, only closed by a new row with a later validity start (the table's exclusion constraint and the audit triggers make an in-place edit visible).

### Runbook outline

Two pages, `docs/RUNBOOK.md`, written for the named analyst and read by the backup analyst. The survival criterion is that someone who is not the builder runs two months from it unassisted (design doc; F-79 AC 3).

```
Page 1: the monthly close (standing calendar entry, business day 5 to 10)
  1. What arrives and where it goes         ticket -> landing/<feed_key>/<period>/; record the ticket number
  2. Load                                   scorecard load periop_or_log ...; scorecard load periop_report ...
  3. Roster changes this month?             scorecard roster set ...; scorecard roster load ... (with the ticket)
  4. Dry run                                scorecard close --period P --dry-run; read the gate lines
  5. If a gate stops you                    G3 partial feed: decide, then --accept-partial with a note
                                            G4 exceptions: scorecard exceptions list / resolve
                                            G6 reconciliation: read reconcile output; a written delta needs an
                                              author; a delay-reason override is never a delta; call periop
                                            G7/G8 invariants: this is a bug; stop; call the builder
  6. Close                                  scorecard close --period P
  7. Preview                                scorecard publish --period P --dry-run; open one email and one CSV
                                            and check them against suppress --report
  8. Send                                   scorecard publish --period P --send; then overrides --month P --send
  9. Checklist and backup                   scorecard status --daily; pg_dump (M1) ; note the publish date
  10. Exit codes                            0 done; 1 gate (fix data); 2 rule (do not work around); 3 command;
                                            4 environment (builder or MGB support)

Page 2: between closes and quarterly
  A. Disputes (within two business days)   dispute file ... --send; dispute decide ... --recompute --send;
                                            a reply with no row: reply_log 'awaiting_row' and ask for the row
  B. Daily check                            scorecard status --daily (M1 by hand; M2 timer)
  C. Definition or configuration change    new vN.py from the confirmed item; scorecard register; recompute
                                            --version ... --from; never edit an old file (exit 2 if you do)
  D. Registering a source                  scorecard source register ...; recompute --source-registered
  E. Recording a sign-off                  scorecard setting set gate.<name> yes --signed-by --signed-on --reference <ticket URL or sha256>;
                                            then the backup analyst (or the brief's owner): scorecard setting confirm gate.<name> --by
  F. Quarterly                              restore drill; access recertification; retention run --dry-run;
                                            review expected_min_rows
  G. Fallbacks                              relay down: --eml from the department service mailbox only;
                                            attachments declined: --numbers-only; VM not ready: workstation
                                            interim (declared to the privacy office)
  H. Where things are                       paths, mailboxes, the ticket queue, who the periop contact is,
                                            who the backup analyst is, what the analyst must never do
                                            (open restricted, copy landing files elsewhere, hand-edit an extract)
```

### Test strategy

No PHI is needed to develop or test. `scorecard synth` generates a coherent synthetic department (roster with sites, subspecialties, chiefs and leaders; 12 to 14 months of cases with panels, first cases, delay and cancellation codes; a matching periop report computed under the institutional definition with a known grace window; later feeds on demand) from a seed, and the test suite runs against a fresh PostgreSQL created by the migrations. The judges' "synthetic fixtures only in git" is a test: `tests/test_fixtures_synthetic.py` asserts every fixture file carries the `SYNTHETIC` header row the generator writes.

```
tests/
  conftest.py                         fresh database per session: scorecard migrate; roles.sql; synth fixtures loaded
  test_no_secrets.py                  no credential patterns in the tree
  test_fixtures_synthetic.py          every fixture is generator output
  definitions/                        golden outputs per definition version (the Metric engine section table)
  engine/                             registry refusal, purity, invariants, suppression order, peers, reconcile,
                                      recompute, availability, same-function-everywhere (the Metric engine section table)
  disputes/                           state machine, routing predicates, outcomes, refile and link, withdrawal
  loaders/
    test_idempotent.py                same file twice -> one feed_load, exit 0, no new rows;
                                      corrected file -> supersedes, old rows kept, record.current moves
    test_column_allowlist.py          a fixture with mrn and patient_name columns -> neither in raw; both names in the checklist
    test_field_checklist.py           remove one mapped column -> exactly the dependent metrics not_computable
    test_feed_health.py               empty extract -> reason on every wedge tile, no metric_value;
                                      short extract -> partial, run stops, --accept-partial with note proceeds
    test_grain.py                     one-primary-column periop file -> panel_roles false, shared flag null
    test_vizient.py                   model version required; model change -> restatement count printed
    test_qi_only_path.py              code search: no form, import or API writes privileged.qi_event but the loader
    test_survey_deid.py               one comment per pattern -> quarantine, held, measures computed, nothing published
    test_convergence.py               open correction_request matched by re-ingested field -> override retired, history kept
  publish/
    test_scan.py                      MRN column blocked; long free-text cell blocked; allowlisted CSV passes
    test_own_records.py               a fixture artifact with another surgeon's record_ref fails G14
    test_gates.py                     four of five privacy gates recorded -> exactly the fifth channel refused (F-106 AC 1)
    test_month_one.py                 no spread section in any month-one artifact; attendee gets spread in month two
    test_catalogue_strings.py         every absent-cell string in every generated artifact matches a catalogue key
    test_what_this_is_not.py          G15: a fixture artifact with a rank line fails
    test_last_refreshed.py            a period closed but not published leaves the previous published_at on artifacts
    test_pub_contract.py              (if pub is built) forbidden column and null-reason refusal
  web/                                (M2)
    test_authz_matrix.py              viewer x role x resource matrix: surgeon self / other; chief queue only;
                                      chair escalations only; leader inbox only after 30 days; analyst no inbox;
                                      no-roster, no-period, refused, error outcomes each write one audit row (F-85 AC 7)
    test_rls_backstop.py              with the matrix bypassed, RLS still returns nothing for another surgeon, on every
                                      table of the RLS set including survey_comment and survey_response
    test_no_sql_strings.py            no f-string, % or concatenated SQL anywhere under web/
    test_view_logging.py              every handler that renders surgeon-identified content wrote a view row
  ops/
    test_migrations_fresh.py          all migrations apply to an empty database; roles.sql applies; grants check clean
    test_migrations_replay.py         migrations apply on top of the previous tagged release's schema
    test_grants_drift.py              an extra GRANT -> grants check exits 4
    test_audit_immutable.py           UPDATE and DELETE on audit_log raise as app and as engine
    test_audit_export_chain.py        a broken link in the exported chain fails the recertification check
    test_runtime_not_owner.py         doctor fails when the runtime login is a superuser or owns a table
    test_retention_unset.py           every class unset -> retention run changes nothing
    test_doctor.py                    listener not localhost (M1) or no TLS (M2) -> doctor fails
    test_restore_roundtrip.py         pg_dump -> pg_restore -> compute one cell identical
```

Golden outputs per definition version are the Metric engine section's tests; they are listed here because CI runs one suite. The reconciliation fixtures are the synthetic periop report: the generator computes periop's number with the institutional grace window so the wedge's FCOT reconciles when `fcot@v1` carries periop's confirmed values and fails the gate when it carries the brief's zero-minute assumption (BD-3). That failure is a test, not an accident: `tests/engine/test_reconcile.py::test_brief_assumption_does_not_reconcile`.

The migration check is three tests: fresh apply, replay on the prior release, grants clean. A pull request that adds a migration without bumping `SCHEMA_VERSION` in `scorecard/ledger/db.py` fails `test_migrations_fresh.py`.

### Repository layout

```
clinician_scorecard/
  pyproject.toml                    package 'scorecard'; entry point scorecard = scorecard.cli:main;
                                    pins: python 3.12, pandas, psycopg[binary], jinja2, pytest; ruff
  README.md                         what this is (and is not), how to install, link to the runbook
  docs/
    RUNBOOK.md                      the two pages above
    source/metric-definitions-v0.2.md   the brief, verbatim
    designs/clinician-scorecard.md  the design doc
    01-user-journeys.md  02-features.md  03-technical-design.md  (this document)
  scorecard/
    cli.py                          argparse; one subcommand per command above; exit codes
    log.py                          structured logging with the ids-only allowlist
    settings.py                     .env / /etc/scorecard/env loader; never logs values
    ledger/
      migrations/0001_schemas.sql ... NNNN_*.sql     plain SQL, numbered (Data model section; the Metric engine
                                                     section's tables live in the same directory)
      roles.sql                     roles and grants; idempotent
      db.py                         connection, SET ROLE, session variables, run rows, SCHEMA_VERSION
      invariants.py                 assert_row_counts, assert_no_blank_cells
    loaders/
      _base.py                      the six steps; sha256; raw; field checklist; supersession
      periop_or_log.py  periop_report.py  roster.py  hr_leave.py  block_schedule.py  survey.py
      survey_deid.py  billing_wrvu.py  attendance.py  vizient.py  qi.py  clinic_sched.py  referral.py  adt.py
      convergence.py
    attribution/                    rules/<record_type>.py (the Data model section)
    definitions/<metric_key>/vN.py  one file per version (the Metric engine section); _contract.py; _catalogue.py
    engine/                         registry, periods, frames, compute, close, suppress, reasons, peers,
                                    targets, reconcile, recompute, trend, availability, intervals (the Metric engine section)
    disputes/                       state, route, file, decide, recompute, rowtext, notices, provenance,
                                    queue, intake (the Dispute workflow section)
    publish/                        render, email_text, csv_rows, charts, scan, own_records, gates, directory,
                                    transport, delivery, notify, overrides, status, adoption, pub; templates/
                                    (Delivery surfaces section)
    web/                            M2: app.py (create_app, SSO), authz.py (the matrix), queries.py, views/,
                                    templates/, static/ (Delivery surfaces section)
    audit.py  roster.py  retention.py  doctor.py  synth.py
  deploy/
    systemd/scorecard-pgdump.{service,timer}  scorecard-status.{service,timer}
            scorecard-survey.{path,service}   scorecard-app.service
    nginx/scorecard.conf            TLS, proxy to gunicorn, proxy-only allowlist if MGB's SSO proxy is used
    postgresql/postgresql.conf.d/scorecard.conf   listen_addresses, ssl, logging (no statement logging)
    env.example                     the keys .env needs, no values
  fixtures/synth/                   generator output committed for fast tests; regenerated by `scorecard synth`
  tests/                            as above
  .github/workflows/ci.yml          if MGB GitHub Enterprise is available (Builder decision O-9)
  .pre-commit-config.yaml           the same checks locally
```

Deploy is `git pull` at a tag, `pip install -e .`, `scorecard migrate`, `scorecard grants check`, `scorecard doctor`, `systemctl restart scorecard-app` (M2). The runbook has these six lines.

### CI

If the department has a git host (MGB GitHub Enterprise or GitLab; OQ-48 territory, none is named), CI runs on every pull request with a PostgreSQL 16 service container:

1. `ruff check` and `ruff format --check`.
2. `scorecard register --check` against a fresh database: a changed hash on a registered label fails the build, which is how "edits go in a new version, not here" becomes a review rule.
3. `pytest` (the whole suite; under five minutes on synthetic data).
4. Migration check: fresh apply, replay on the prior tag, grants clean.
5. Secret scan and the synthetic-fixture assertion.
6. A pull request that touches `definitions/` requires review by the definitions owner (a CODEOWNERS line), which is the minimal-batch proposal's one good process idea.

If there is no git host, `.pre-commit-config.yaml` runs the same six steps on the builder's and analyst's machines against a local database, and the runbook says a release is tagged only after `pre-commit run --all-files` passes. Either way, no PHI, no credentials and no real extract is ever in the repository, and the VM never runs anything but a tagged release.

### Builder decisions

Where the two judges differ, or the brief and the catalogue are silent, the options and a recommendation are recorded here rather than chosen silently.

**O-1 (D-05). Web stack for the M2 hosted surface (deployment view).** Options: (a) Flask + Jinja2 + psycopg, server-rendered, SQL-owned schema, in-app OIDC/SAML; (b) Django 5 LTS with unmanaged models, `mozilla-django-oidc` or `djangosaml2`, admin disabled or restricted to analyst screens that exclude `restricted` and `privileged`. The staff engineer judge recommends (a): the schema is SQL-owned and identity comes from MGB SSO, so Django's ORM and auth are a second description of the tables. The clinical informatics and security judge recommends (b): Django's auth, session, CSRF and permission machinery are what hospital security reviewers have seen; Flask is acceptable if SSO is validated in-app. Recommended here: the builder's taste, recorded in the runbook, under three fixed properties that apply to either: SSO validated in-app (a header-injecting proxy is accepted only with a network ACL to the proxy and a signed header), session variables plus RLS behind the authorization matrix, and `log_view()` before every render. The deployment unit (`scorecard-app.service`, gunicorn, nginx) is the same for both. The Dispute workflow section BD 1 says the same.

**O-2 (D-39). Who runs the survey load.** Options: (a) the analyst runs `scorecard load survey` from the CLI like every other feed (both proposals as written; the security judge's error 8 says this makes "the analyst has no grant on comments" false); (b) a systemd path unit on the VM runs the load as `svc_survey` when a file lands; the analyst copies the file in and never holds the role. Recommended: (b). Why: the claim at step zero must be true of the pipeline and not of a human session; file handling is declared, database reads are impossible by grant. Consequence: Bucket 5 cannot ship on the workstation interim; M4 requires the VM, which the milestone table already implies (hosted view is an M4 gate).

**O-3 (D-40). What a de-identification hit does to the load.** Options: (a) fail the whole load (hybrid as written); (b) quarantine the comment, load everything else, publish measures and inbox without it; (c) quarantine the comment, load everything, hold publication of that survey month until the office resolves the quarantine. F-11 AC 4 says quarantine and hold. Recommended: (c). Why: (a) blocks every surgeon's scores for one bad comment; (b) publishes an inbox the office has not finished, and a surgeon who later sees a comment appear will not know why. (c) needs one catalogue key, `feed-held`, proposed above; recorded for the definitions owner as an F-33 addition.

**O-4 (D-41). Backup copies and F-113's "nothing disposed while unset".** Options: (a) keep every nightly dump until data governance sets a period (accumulating full copies of the ledger, the minimal-batch finding); (b) keep two months of dumps plus the dump taken after each publish, on the reading that a dump is a redundant copy and the live database retains every record. Recommended: (b), with the classes `pg_dump` and `artifact_files` given `period_months = 2` by the builder as an interim under `reference = 'interim pending OQ-57'`, so `retention run` governs the dumps and the rendered artifact files like any store and data governance can change it; one number, the class period, is the retention statement everywhere. The rendered artifacts get the same treatment because every surgeon's case list would otherwise accumulate under `preview/` for as long as the dumps would have. At M1 the dump is copied off the workstation (Backups, above). Why: accumulating PHI copies is the finding a security reviewer will write first; a rolling window loses nothing the database holds.

**O-5 (D-30). Fallback when the relay is unavailable.** Options: (a) `.eml` files sent from the analyst's own Outlook (minimal batch; the security judge's error 14: every case list lands in a personal Sent Items); (b) `.eml` files opened and sent from the department service mailbox in Outlook, so they sit under that mailbox's access list and retention policy; (c) no fallback, wait for the relay. Recommended: (b), and the runbook says so; (c) if the service mailbox cannot be opened in Outlook by the analyst.

**O-6 (D-31). Fallback if the privacy office declines attachments.** Options: (a) numbers, reasons and trend in the body, the case list deferred to the hosted view (adopted architecture item 7); (b) the case list pasted into the body as text (same content, no attachment policy issue, worse on a phone); (c) an encrypted attachment. Recommended: (a) as `publish --numbers-only`, with a new catalogue key `no-attachment`: "Your case list is not attached in this release; reply to this email to request any record by its metric and date." Why: (b) does not change what the privacy office is deciding about; (c) invents a key-management answer nobody has asked for. The sentence is a proposed default for the definitions owner.

**O-7 (D-34). Resolving the recipient address (F-90 AC 8, OQ-58).** Options: (a) a live directory lookup at send time (LDAP against the MGB directory, or the Graph API if MGB exposes it) by `person_key`, compared with the roster's stored address; (b) a directory export file loaded as a feed each month; (c) the roster's typed address alone. Recommended: (a) where the workstation or VM can reach the directory, with (b) as the fallback and (c) refused: a mismatch between the resolved and stored address blocks that surgeon's send and lists them (F-90 AC 8). Why: the failure mode is a misdirected case list; two independent sources that must agree is the cheapest control.

**O-8 (D-43). Third-next-available sampling.** Options: (a) the scorecard queries the scheduling system and samples open slots itself; (b) clinic operations produce the sample rows on their schedule and the scorecard loads them. The brief says "sampled regularly and reported as the median" and names no sampler. Recommended: (b). Why: (a) makes the department a reader of the scheduling system with its own access request and a second definition of "open new-patient slot"; (b) keeps the source of record with its owner and the scorecard as a loader. The sampling schedule is recorded in `source_registry.extract_name`. OQ-36 stands for the owner.

**O-9 (D-44). CI host.** Options: (a) MGB GitHub Enterprise or GitLab with a PostgreSQL service container; (b) local pre-commit only; (c) no CI. Recommended: (a) if any MGB git host is available (both proposals assume one; none is confirmed), else (b); (c) refused because the hash-refusal check and the migration check are what make immutability a mechanism. Whichever applies, the VM runs only tagged releases and the repository holds no PHI.

**O-10 (D-45). M1 workstation database install.** Options: (a) native PostgreSQL 16 Windows installer, localhost only; (b) Docker Desktop container; (c) WSL2 Postgres. Recommended: (a). Why: the workstation is MGB-managed and Docker Desktop or WSL2 may not be permitted; a native service is what MGB desktop support can see; the data directory sits on the MGB-encrypted system disk. Whether the workstation's disk encryption satisfies information security for an interim PHI store is OQ-47, to confirm before the first load.

**O-11 (D-46). Interim `expected_min_rows`.** Options: (a) no partial-load threshold until three months of history exist; (b) set from the Assignment's three-month extract at M0 (70% of the smallest month). Recommended: (b), revised by a signed `setting set` after month three. Why: the no-zero guard is worth having in month one, and 70% of the smallest known month is a threshold the analyst can explain.

**O-12 (D-47). Runtime for the M1 daily check.** Options: (a) a printed checklist at the end of each run plus a calendar entry (F-112 as written); (b) a Windows scheduled task running `scorecard status --daily` on the workstation. Recommended: (a). Why: the adopted architecture allows no schedulers before the VM; a scheduled task on a workstation that is sometimes off is a check that silently does not run. Automation arrives with `scorecard-status.timer` at M2 (F-112 AC 9).

### Feature mapping

Every feature this section names, with the command, module or control that carries it.

| F-xx | Where it lives | Notes |
|---|---|---|
| F-01 | `loaders/periop_or_log.py` step 6 -> `attribution/rules/case.py`; `panel_roles` checklist flag | Rule and index are the Data model section's; the loader supplies the panel grain |
| F-02 | `scorecard exceptions list` and `scorecard exceptions resolve`; G4 in `close` | Publish blocked while unresolved |
| F-03 | `scorecard attribute` prints the per-subspecialty shared-case rate; `run.gate_results.cosurgeon_rate` | "panel roles not in extract" when the file has one primary column |
| F-04 | `ledger.feed_owner`; the feed table above; `scorecard setting set feed_owner.<key>.contact` | `source_corrected` refused without a contact (the Dispute workflow section, Builder decision 6 (D-28)) |
| F-06 | `loaders/convergence.py` at every load; `tests/loaders/test_convergence.py` | Override retires on match; history kept |
| F-08 | `loaders/vizient.py` (model version required); `attribution/rules/admission.py`; join report on the run | Exception list for no index operation; super-long boarder flag from F-100 |
| F-09 | `loaders/qi.py` -> `privileged.qi_event`; `tests/loaders/test_qi_only_path.py` | The only write path, proven by a code search test |
| F-10 | `loaders/clinic_sched.py` (visits and samples); `attribution/rules/visit.py` | Builder decision O-8 for sampling |
| F-11 | `loaders/survey.py`, `survey_deid.py`; `svc_survey`; `scorecard-survey.path`; `restricted.comment_quarantine`; `scorecard survey release` | Builder decisions O-2, O-3 |
| F-18 | `loaders/block_schedule.py`; `source_registry` row `not_in_release` -> `registered`; `not_applicable` decision | M3 registration flips the reason |
| F-37 | `publish --dry-run` writes `chief_summary.txt` from `engine/peers.py`; G12 scan (counts only) | M0 hand version compared on first run (the Metric engine section) |
| F-42 | G15 text scan in `publish/scan.py`; the one-line statement rendered from `_catalogue.py` | Composite, rank or target anywhere fails the run |
| F-57 | Dispute mailbox (`department_setting.dispute_mailbox`, analyst and backup only); `reply_log`; `scorecard dispute file` within two business days; `status --daily` lists unentered replies | The Dispute workflow section owns the commands |
| F-64 | `scorecard overrides --month --send`; `publish/overrides.py`; `gate.privacy_email.override_list`; G12; send date on the period record | One list per feed owner per publish |
| F-75 | `loaders/attendance.py`, `loaders/hr_leave.py`; held-while-on-faculty computed at `close` from `leave_period` | Pace and scaling rules are definition params (the Metric engine section) |
| F-78 | `loaders/billing_wrvu.py`: `src.wrvu_month`, prior snapshot, `restatement_delta`; `gate.comp_office` | No `ledger.record` rows; no attribution |
| F-79 | `scorecard close` and `scorecard publish` (two commands, one procedure in RUNBOOK page 1); `run` row per invocation with `run_by`; G10 | The catalogue's "one command" is one runbook step; `close` and `publish` are separate so the analyst previews before anything is sent |
| F-80 | Loader step 4; `REQUIRED_FIELDS`; `feed_load.field_checklist`; `not-computable` decision | Runs before attribution; never aborts |
| F-81 | `loaders/periop_report.py`; `engine/reconcile.py` (the Metric engine section); G6; `--reconcile-skip --note` | A missing periop report is a recorded skip, never silent |
| F-82 | Feed-health gate G3; `department_setting.expected_min_rows.<feed_key>`; `--accept-partial <feed> --note`; `feed_missing` decisions | Builder decision O-11 |
| F-83 | `run.published_at` written once by `publisher`; every template reads it; `tests/publish/test_last_refreshed.py` | A closed-but-unpublished period does not advance the stamp |
| F-84 | `close` refuses a period whose month has not ended; `engine/periods.py` | |
| F-85 | `scorecard doctor` (no static surgeon-identified file; gates recorded before bind); `web/authz.py`; `tests/web/test_authz_matrix.py`; view rows via `audit.log_view()` | Deep link only after the three hosted gates |
| F-86 | Same matrix; RLS backstop test | |
| F-87 | G9 mapping warning in `close`; `scorecard roster set --chief` or `--leader` | |
| F-88 | Matrix rows for inbox: surgeon self, direct leader of record, everyone else refused; `svc_survey` for pipeline access | |
| F-89 | `department_setting.inbox_first_available.<clinician_id>` written by `publisher` on the first survey publish; matrix reads it | 30 days computed from the stored date, not the log |
| F-90 | `publish/render.py`, `email_text.py`, `csv_rows.py`, `transport.py`, `delivery.py`; `gate.privacy_email.scorecard`; G12, G13, G14, G15; `--numbers-only`, `--eml` | Builder decisions O-5, O-6, O-7 |
| F-91 | Dispute mailbox as reply-to; `reply_log`; adoption report from `reply_log` and (M2) view rows | |
| F-92 | `dispute file --send`, `dispute decide --send`; `gate.privacy_email.adjudicator`, `.recredit`; G12 | |
| F-93 | `dispute decide --send`; `gate.privacy_email.decision`; G12 | |
| F-94 | `publish/render.py` builds `definition_changes` from `metric_definition_version` diffs for the first period after `effective_from` | |
| F-95 | `ledger.feed_load` (sha256, ticket, as-of, row count, checklist); `ledger.run` (gate results, versions, eligibility, published_at); loader step 2 and every command's run row | A load without a ticket is exit 2 |
| F-96 | `scorecard restate`; `recompute --source-registered`; `vizient` model-change count; `restatement` rows | The Metric engine section owns the markers |
| F-97 | `feed_load.as_of_date`, `model_version` copied to `metric_value`; `department_setting.survey_scope_phrase`; `feed-not-received` with the prior as-of | |
| F-98 | `disputes/queue.py::trust_report` run at publish; G12 scan (aggregates only) | |
| F-99 | `loaders/roster.py` (SCD2 snapshot, `--close-missing`); `scorecard roster set` | |
| F-100 | `definition_param` through `scorecard register` (the Metric engine section); `department_setting` for non-metric parameters | |
| F-101, F-102 | `Param(status='pending_signoff')` in `fcot/vN.py` and `same_day_cancel/vN.py`, signed by a new version with `signed_by`/`signed_on` (BD-4); `test_cancel_v1.py` | Not loaded from a file |
| F-103 | `ledger.source_registry`; `scorecard source register`; `recompute --source-registered` | Table of the three rows above |
| F-104 | `metric_definition_version.availability = 'division_site_only'`; `suppression_decision(kind='not_computed')`; `not-computed` on the period record; page text from the catalogue | Nothing computed, nothing loaded |
| F-105 | Retired; no command, table or control | Listed so the mapping is complete |
| F-106 | `department_setting.gate.*`; G5, G11, G12, G14; `delivery.gate_checked`, `payload_scan`; `publish/scan.py`; the channel-per-store table in "PHI minimization" | AC 6's channel per store: landing folder and preview on the encrypted local disk; database on localhost (M1) or the VM (M2); dumps on MGB-approved storage; email through the internal relay from the service mailbox; replies in the shared mailbox |
| F-107 | `ledger.audit_log` (INSERT-only, triggers); `audit.log_view()`; `pipeline_read` rows for `svc_survey`; `scorecard audit`; `tests/ops/test_audit_immutable.py` | The Dispute workflow section owns the design |
| F-108 | Plain-text email and CSV; `tests/publish/test_catalogue_strings.py` proves every state is present as text; the app's phone-width check is the Delivery surfaces section's | The institutional accessibility standard is OQ-51 |
| F-111 | Ledger reading (the Dispute workflow section, Builder decision 2 (D-25)): G18 custody gate at publish; `dispute.decision_reply_id`; `audit_log.actor` on decide equals the analyst or backup | No sheet exists to share |
| F-112 | `scorecard status --daily` or `--weekly`, with `--send`; `publish/status.py`; checklist stored on the period record; `scorecard-status.timer` at M2 | Builder decision O-12 for M1 |
| F-113 | `ledger.retention_class`, `disposition_log`; `scorecard retention run`; `doctor` lists stores without a class; roster `faculty_to` ends sends and access | Builder decision O-4 for backup copies |

Features in this table that another section defines (F-01, F-02, F-06, F-64, F-85 to F-89, F-96, F-100 to F-104, F-107, F-111) are mapped here only for the command, timer or gate that operates them; their tables, algorithms and state machines stay in the Data model, Metric engine and Dispute workflow sections.

New items raised here for the brief's owner or the catalogue: two proposed catalogue keys (`feed-held`, `no-attachment`, Builder decisions O-3 and O-6); the interim backup retention (O-4, under OQ-57); whether the workstation's managed encryption satisfies information security for the M1 interim (under OQ-47); and the MRN pattern and the incident procedure reference the privacy office must supply (under OQ-58).

## Feature to component traceability

Every ID in the catalogue's at-a-glance table, in the catalogue's order. "Section" names the subsystem section whose feature-mapping table carries the detail. 113 IDs: 112 active, one retired.

| F-xx | Milestone | Component, module, table or page | Section |
|---|---|---|---|
| F-01 | M1 | `ledger.attribution` (partial unique index `attribution_one_current`, `shared_flag`, `tie_break_applied`); `src.case_panel`; `attribution/rules/case.py` (`ATTR-CASE-PRIMARY`); `loaders/periop_or_log.py` panel grain | Data model; Ingestion and operations |
| F-02 | M1 | `ledger.attribution_exception`; `scorecard exceptions list|resolve`; gate G4 in `close`; `/analyst/exceptions` | Data model; Ingestion and operations |
| F-03 | M0 | `attribution/cosurgeon.py`; `scorecard attribute` output; `run.gate_results.cosurgeon_rate` (`premise_2_exceeded`) | Data model |
| F-04 | M1 | `ledger.feed_owner` (`contact_name`, `disputable_fields`, `override_list_recipient`, `valid`); the feed table | Data model; Ingestion and operations |
| F-05 | M1 | `ledger.record_override`; invariants I6 and I7; `disputes/decide.py` writes; `disputes/rowtext.py` | Data model; Dispute workflow |
| F-06 | M1 | `record_override.correction_requested_at`, `source_confirmed_at`, `retired_at`, `retired_by_feed_load_id`; `correction_request.confirmed_by_feed_load_id`; `loaders/convergence.py` | Data model; Ingestion and operations |
| F-07 | M1 | `record_override(field = 'credited_clinician', new_clinician_id)`; adjudicated basis in `engine/frames.py`; `disputes/decide.py` receiver validation; `scorecard recompute --dispute` | Data model; Metric engine; Dispute workflow |
| F-08 | M6 | `src.admission`; `attribution/rules/admission.py` (`ATTR-ADM-INDEX`); `attribution_exception(no_index_operation)`; `feed_load.model_version`; `loaders/vizient.py` | Data model; Ingestion and operations |
| F-09 | M6 | `privileged.qi_event`; `attribution/rules/qi_event.py` (`ATTR-QI-INDEX`); `loaders/qi.py` as the only write path; `tests/loaders/test_qi_only_path.py` | Data model; Ingestion and operations |
| F-10 | M7 | `src.visit`, `src.third_next_sample`; `attribution/rules/visit.py`, `sample.py`; `loaders/clinic_sched.py` | Data model; Ingestion and operations |
| F-11 | M4 | `src.survey_response`; `restricted.survey_comment`, `comment_quarantine`; role `svc_survey`; `loaders/survey.py`, `survey_deid.py`; `scorecard-survey.path`; `gate.survey_pipeline` | Data model; Ingestion and operations |
| F-12 | M1 | `definitions/_contract.py`; `definitions/<metric>/vN.py`; `engine/compute.py`, `frames.py`; `tests/engine/test_purity.py`, `test_same_function_everywhere.py` | Metric engine |
| F-13 | M1 | `engine/registry.py` (hash refusal, effective windows, `diff_from_prior`); `ledger.metric_definition_version`, `definition_param`; `/analyst/registry` | Metric engine; Data model |
| F-14 | M1 | `definitions/or_case_volume/v1.py` (`Kind.COUNT`); tile and record list | Metric engine |
| F-15 | M1 | `definitions/fcot/v1.py` (worked example), `v2.py` on confirmation; `definition_delta`; tile and first-case list | Metric engine |
| F-16 | M1 | `definitions/duration_accuracy/v1.py`; `detail.test_applied` | Metric engine |
| F-17 | M1 | `definitions/same_day_cancel/v1.py`; `interim` decision kind; refuses to compute while the cancellation set is unsigned | Metric engine |
| F-18 | M3 | `definitions/block_utilization/v1.py` with `applicability()`; `loaders/block_schedule.py`; `source_registry` row `not_in_release` then `registered`; `not_applicable` decision | Metric engine; Ingestion and operations |
| F-19 | M6 | `definitions/los_oe/v1.py` (sketch); super-long boarder exclusion; `bootstrap_95` | Metric engine |
| F-20 | M6 | `definitions/readmit_oe/v1.py`; `oe_exact_poisson_95` | Metric engine |
| F-21 | M6 | `definitions/mortality_oe/v1.py`; cadence `rolling_12` (D-16) | Metric engine |
| F-22 | M6 | `definitions/cmi/v1.py` (mean relative weight); system-scope group | Metric engine |
| F-23 | M6 | `definitions/return_to_or`, `ssi`, `vte`, `csf_leak` `v1.py`; `risk_model=None` drives the "self-reported, unadjusted" label | Metric engine |
| F-24 | M6 | `engine/intervals.py`; `metric_value.interval_*`, `no_evidence_of_diff`; `peer_group_snapshot.spread_intervals`, `peer_median`; `charts.interval_dots()` | Metric engine; Delivery surfaces |
| F-25 | M7 | `definitions/third_next/v1.py` (`Kind.MEDIAN`); `third_next_sample` records | Metric engine; Data model |
| F-26 | M7 | `definitions/new_patient_visits/v1.py` (`Kind.COUNT`) | Metric engine |
| F-27 | M7 | `definitions/notes_72h/v1.py`; 72-hour window-at-close param | Metric engine |
| F-28 | M4 | `definitions/nps`, `explained`, `listened`, `respect` `v1.py`; `aggregations=['period','year_average']`; `comparison_target(mgb_average)` | Metric engine |
| F-29 | M1 | `engine/recompute.py --dispute`; `ledger.restatement`; `frames.py` override application; the recompute path | Metric engine; Dispute workflow |
| F-30 | M1 | `engine/recompute.py --version`; `registry.effective_version()`; earlier periods frozen unless `restate` | Metric engine |
| F-109 | M7 | `definitions/referral_to_visit/v1.py`; `source_registry` pending row; `loaders/referral.py`; `recompute --source-registered` | Metric engine; Ingestion and operations |
| F-110 | M7 | `definitions/icu_return/v1.py`; `src.icu_stay` derived by `loaders/adt.py`; proxy window param | Metric engine; Ingestion and operations |
| F-31 | M1 | `engine/peers.py`; `ledger.peer_group_snapshot`; `restricted.peer_group_member`; `roster_as_of()` | Metric engine; Data model |
| F-32 | M1 | `engine/suppress.py`; `ledger.suppression_decision` (CHECK constraint is the 100%-reason gate); min-n table; `/analyst/suppression/<period>` | Metric engine |
| F-33 | M1 | `definitions/_catalogue.py`; `engine/reasons.py`; `ledger.reason_catalogue`; `tests/web/test_state_strings.py`; `tests/publish/test_catalogue_strings.py` | Metric engine; Delivery surfaces |
| F-34 | M1 | `engine/targets.py`; `comparator_text`; `peer_group_snapshot.peer_count`; `comparator_line` on every tile | Metric engine; Delivery surfaces |
| F-35 | M1 | `peers.viewer_eligible()`; `peer_group_snapshot.eligibility_state`; `department_setting.month_one_period`; `run.spread_eligibility` | Metric engine |
| F-36 | M1 | `ledger.peer_group_snapshot` as the render log; `scorecard peers --render-report`; schema test on payloads | Metric engine |
| F-37 | M0 | `scorecard peers --period P --summary`; `chief_summary.txt` in the preview folder | Metric engine; Ingestion and operations |
| F-38 | M1 | `recompute.py` suppression step; `suppression_decision.caused_by_kind`, `caused_by_ref`; `dispute-hidden`, `dispute-shown` templates | Metric engine; Dispute workflow |
| F-39 | M1 | `scorecard recompute --roster-change`; `peer-under-five-asof` template; restatement category `roster_change` | Metric engine; Data model |
| F-40 | M4 | Bucket 5 definitions (`peer_scope='system'`, `min_n=10 responses`); `spread-count-survey`, `peer-coverage-gap`; `charts.bar_spread()` on `/me/<period>/bucket/5` | Metric engine; Delivery surfaces |
| F-41 | M4 | `min_n` kind with the `hidden-month` template; `trend.gap_reason`; the hidden cell on the Bucket 5 page | Metric engine; Delivery surfaces |
| F-42 | M0 | `what-this-is-not` and `what-this-is-not-line` catalogue entries; email footer; `base.html.j2`; `/whats-not`; gate G15 in `publish/scan.py`; `delivery.statement_version` | Delivery surfaces; Ingestion and operations |
| F-43 | M1 | `engine/trend.py`; email vertical text table (D-37); `charts.trend_line()`; `history from` line | Metric engine; Delivery surfaces |
| F-44 | M1 | `engine/availability.py`; `not_in_release`, `pending_source`, `feed_missing`, `feed_held`, `not_computable` kinds rendered in the value position | Metric engine; Delivery surfaces |
| F-45 | M1 | `engine/periods.py`; `interim` kind; `cadence_note` on the tile | Metric engine; Delivery surfaces |
| F-46 | M1 | Three text lines under the comparator line (email); `charts.bar_spread()` or `interval_dots()` plus the same lines (page); `tests/web/test_charts.py` | Delivery surfaces |
| F-47 | M1 | `value_text` with both bases when they differ; record list heading; trend `*` with the logged value on hover; `trend.series()` | Delivery surfaces; Metric engine; Dispute workflow |
| F-48 | M4 | `bucket5.html.j2` three-month cells; `trend.series()` with `gap_reason`; version boundary marker | Delivery surfaces |
| F-49 | M1 | `metric_value_record` join `record`, `attribution`, `record_participant`, `feed_load`, `record_override`, `dispute`; CSV rows (M1); `/me/<period>/metric/<metric_key>/records` (M2); `assert_row_counts()` | Dispute workflow; Delivery surfaces; Data model |
| F-50 | M1 | `metric_definition_version`, `definition_param`, `definition_delta`, `reason_set_version`, `definition_open_item`; email definitions appendix (D-33); `/definitions/<metric_key>@<version>`; `scorecard definitions page` | Dispute workflow; Delivery surfaces |
| F-51 | M1 | `metric_value` provenance columns; `metric_value_record`; tile definition stamp; invariant I2; `scorecard audit` join chain | Dispute workflow; Metric engine; Data model |
| F-52 | M1 | `disputes/provenance.py`; adjudicator email body; `scorecard dispute show`; adjudicator view of `/disputes/<dispute_id>` | Dispute workflow |
| F-53 | M4 | `src.survey_response` (no text column); record list page for `survey_response`; dispute action opens the F-72 form | Dispute workflow; Delivery surfaces |
| F-54 | M1 | `ledger.record.record_ref` (D-19); `feed_owner.disputable_fields`; CSV `case_id` column and reply instruction; "Dispute this record" button on every row; none on wRVU | Dispute workflow; Delivery surfaces |
| F-55 | M1 | `ledger.dispute`, `ledger.dispute_event`; `disputes/file.py` | Dispute workflow; Data model |
| F-56 | M1 | `metric_definition_version.dispute_effect_notices`; `disputes/notices.py`; CSV comment line and body instruction (M1); above the submit control (M2) | Dispute workflow; Delivery surfaces |
| F-57 | M1 | `ledger.reply_log`; `scorecard reply log`; `scorecard dispute file --reply`; `intake.py` acknowledgement; `delivery(channel='ack_email')`; `awaiting_row` classification | Dispute workflow; Delivery surfaces |
| F-58 | M1 | `disputes/route.py` (tests a, b, c); `dispute.routed_to`, `routing_test_fired`, `adjudicator_clinician_id`; `record_participant`; `department_setting.chair_clinician_id` | Dispute workflow |
| F-59 | M1 | `disputes/rowtext.py`; keys in `reason_catalogue`; `dispute_state` CSV column; row text on lists, record detail and the decision email | Dispute workflow; Delivery surfaces |
| F-60 | M1 | `disputes/queue.py`; one adjudicator email per dispute plus `scorecard dispute queue` (M1); `/queue`, `/queue/closed` (M2) | Dispute workflow; Delivery surfaces |
| F-61 | M1 | `disputes/decide.py`; `dispute.decision`, `outcome`, `decision_note`, `decided_by_clinician_id`, `decided_at`, `decision_reply_id`; `dispute_event` immutability | Dispute workflow |
| F-62 | M1 | `dispute.refile_of_dispute_id`, `linked_dispute_id`; filing count in `file_dispute()`; `may_transition()`; record detail lists every dispute | Dispute workflow |
| F-63 | M1 | `ledger.definition_open_item`; `decide(decision='definition_question')`; definitions-owner notification; open items on the definition page; `register` closes them | Dispute workflow; Data model |
| F-64 | M1 | `ledger.correction_request` where unconfirmed, grouped by `feed_key` and outcome; `publish/overrides.py`; `scorecard overrides --month --send`; `delivery(channel='override_list')`; `gate.privacy_email.override_list` | Dispute workflow; Delivery surfaces; Ingestion and operations |
| F-65 | M1 | `record_override(field='cancellation_reason_code')`; `reason_set_version`; provenance case fields; adjudicated numerator recompute | Dispute workflow |
| F-66 | M2 | `/records/<record_ref>/dispute` (GET, POST); `web/authz.py`; `file_dispute()` | Dispute workflow; Delivery surfaces |
| F-67 | M6 | `record_override(field='index_surgeon')`; `record_participant(index_surgeon, discharging_attending)` drives test (c); recompute across the Vizient four | Dispute workflow |
| F-68 | M6 | `record_override(field='index_case_attribution')`; `privileged.qi_event` read under the quality gate; `correction_request(feed_key='qi')` | Dispute workflow |
| F-111 | M1 | The ledger custody model (D-25): DB roles and `grants check`; payload scan; `intake.py` adjudicator email; `decision_reply_id`; `dispute_event` and `audit_log` immutability; gate G18 at publish | Dispute workflow; Ingestion and operations |
| F-69 | M4 | `/me/<period>/bucket/5`; `config/faculty_slide_layout.yaml`; `tests/web/test_bucket5_layout.py` | Delivery surfaces |
| F-70 | M4 | `/me/inbox`; `web/views/inbox.py` (sole reader of `restricted.survey_comment.comment_text`); `tests/web/test_inbox_no_count.py`; `tests/web/test_comment_isolation.py` | Delivery surfaces |
| F-71 | M4 | `restricted.private_note`; `/me/inbox/<response_ref>/note`; author-only matrix row and RLS | Delivery surfaces; Data model |
| F-72 | M4 | Structured survey variant of the dispute form (`claim_structured`); survey branch of `route.py` behind the setting (D-20); comment withheld from any adjudicator who is not the direct leader | Delivery surfaces; Dispute workflow |
| F-73 | M4 | F-59 state text on the response row and the inbox entry; measure tile shows both bases after a sustained decision; override list to the patient experience office | Delivery surfaces; Dispute workflow |
| F-74 | M5 | M&M block on `metric.html.j2`; session record list; `src.mm_session`, `src.attendance_scan` | Delivery surfaces; Data model |
| F-75 | M5 | `definitions/mm_attendance/v1.py` (`Kind.PACE`, leave-scaling params); `loaders/attendance.py`, `hr_leave.py`; `ledger.leave_period`; `metric_value.extra` pace fields | Delivery surfaces; Ingestion and operations; Data model |
| F-76 | M5 | `record_override(field in ('scan_present','removed_by_leave'))` and their effect notices; dispute button on session rows | Dispute workflow; Delivery surfaces |
| F-77 | M5 | wRVU block on `metric.html.j2` (`charts.ghost_bars()`, the four exact texts); no records link, no dispute button; `not_in_release` until `gate.comp_office`; `dispute file` refuses `wrvu_month` | Delivery surfaces |
| F-78 | M5 | `loaders/billing_wrvu.py`; `src.wrvu_month` (prior snapshot, `restatement_delta`, as-of, report date); restatement category `billing_restatement` | Ingestion and operations; Data model |
| F-79 | M1 | `scorecard close` then `scorecard publish` as one runbook step (D-48); `ledger.run` per invocation; gate G10; `docs/RUNBOOK.md` page 1 | Ingestion and operations; Metric engine |
| F-80 | M1 | Loader step 4; `REQUIRED_FIELDS` per loader; `feed_load.field_checklist`; `not_computable` decision with the `not-computable` template | Ingestion and operations; Metric engine |
| F-81 | M1 | `loaders/periop_report.py`; `src.periop_report`; `engine/reconcile.py`; `ledger.definition_delta`, `reconciliation_result`; gate G6; `scorecard reconcile`, `delta add`; `/analyst/reconciliation/<period>` | Metric engine; Ingestion and operations |
| F-82 | M1 | Feed-health gate G3; `department_setting.expected_min_rows.<feed_key>` (D-46); `--accept-partial`; `feed_missing` decisions; no `metric_value` row for a missing feed | Ingestion and operations; Metric engine |
| F-83 | M1 | `run.published_at` written once by `publisher`; `last_refreshed` on every artifact; `tests/publish/test_last_refreshed.py` | Delivery surfaces; Ingestion and operations |
| F-84 | M1 | `engine/periods.py` close-date check; `close` refuses an unended month; period picker lists closed periods only | Metric engine; Delivery surfaces |
| F-112 | M1 | `scorecard status --daily|--weekly [--send]`; `publish/status.py`; `disputes/queue.py` day-10 and day-14 query; checklist stored on the run; `scorecard-status.timer` at M2 (D-47) | Ingestion and operations; Dispute workflow; Delivery surfaces |
| F-85 | M2 | `web/app.py` identity to roster; `web/authz.py`; viewer-scoped `web/queries.py`; `ledger.identity`; RLS policies; `audit_log` view and refused rows; deep links only when `gates.hosted_open()`; `scorecard doctor` | Delivery surfaces; Data model; Ingestion and operations |
| F-86 | M2 | Authorization matrix rows for record detail, dispute form, dispute detail, decide and queue; RLS on `dispute`; receiver visibility after the sustained event | Delivery surfaces; Dispute workflow |
| F-87 | M1 | `roster_membership.chief_clinician_id`, `direct_leader_clinician_id` (dated); `department_setting.chair_clinician_id`; `scorecard roster set --chief|--leader`; gate G9 mapping warning; `/analyst/roster` | Data model; Ingestion and operations; Delivery surfaces |
| F-88 | M4 | `authz.allow('inbox', ...)`; column grant on `restricted.survey_comment.comment_text` to `app` only; `svc_survey` for pipeline access; refusal payload carries nothing | Delivery surfaces; Data model |
| F-89 | M4 | `/leader/<clinician_ref>/inbox`; `department_setting.inbox_first_available.<clinician_id>` written by the publisher; `leader-gate` before day 30; `leader_sees_measures` default false | Delivery surfaces; Data model |
| F-90 | M1 | `scorecard publish`; `publish/render.py`, `email_text.py`, `csv_rows.py`, `scan.py`, `own_records.py`, `gates.py`, `directory.py`, `transport.py`, `delivery.py`; the plain-text template; `ledger.delivery`; gates G11 to G15 | Delivery surfaces; Ingestion and operations |
| F-91 | M1 | Reply-To dispute mailbox; `ledger.reply_log`; `scorecard reply log|answer`; `scorecard interview record`; `scorecard adoption report` (`publish/adoption.py`); view rows from M2 | Delivery surfaces |
| F-92 | M1 | `publish/notify.py` dispute-filed and re-credit emails; `gate.privacy_email.adjudicator`, `.recredit`; rendered in the recompute path | Delivery surfaces; Dispute workflow |
| F-93 | M1 | `publish/notify.py` decision email with the F-59 row text and the recomputed tile; 14-day clock stop at `delivery.sent_at`; deep link at M2 | Delivery surfaces; Dispute workflow |
| F-94 | M1 | `ClinicianArtifact.definition_changes` from the registry diff; "DEFINITION CHANGES" block in the email; notice band on `/me/<period>` | Delivery surfaces |
| F-95 | M1 | `ledger.feed_load` (sha256, ticket, as-of, row count, checklist, status); `ledger.run` (gate results, versions, eligibility, `published_at`, `restates_run_id`); `raw.*`; `/analyst/runs`, `/analyst/feeds` | Data model; Ingestion and operations |
| F-96 | M1 | `ledger.restatement`; `metric_value.restates_metric_value_id`, `is_current`; `trend.restated`, `version_boundary`; `scorecard restate --reason` | Metric engine; Data model |
| F-97 | M4 | `metric_value.source_feed_load_id`, `source_as_of`, `model_version`; `feed_load.as_of_date`, `model_version`; `department_setting.survey_scope_phrase`; `source_line` per tile | Data model; Delivery surfaces; Ingestion and operations |
| F-98 | M1 | `disputes/queue.py::trust_report()` at publish; `/analyst/disputes`; aggregates only | Dispute workflow; Delivery surfaces |
| F-99 | M0 | `ledger.roster_membership` (SCD2, gist exclusion), `leave_period`, `clinician`; `loaders/roster.py`; `scorecard roster load|set` | Data model; Ingestion and operations |
| F-100 | M1 | `ledger.metric_definition_version` plus `definition_param` (named thresholds) and the view `ledger.v_metric_configuration`; `ledger.reason_set_version`; `definition_delta(kind='brief_vs_institutional')` | Data model; Metric engine |
| F-101 | M1 | `Param('surgeon_attributable_delay_reasons', status='pending_signoff')` in `fcot/vN.py` (D-10); `reason_set_version(set_key='surgeon_delay_reasons')`; `detail.delay_label` | Metric engine; Data model |
| F-102 | M1 | `Param('surgeon_attributable_cancellation_reasons', status='pending_signoff')` in `same_day_cancel/vN.py`; `reason_set_version(set_key='surgeon_cancellation_reasons')`; `counted` refuses while unsigned | Metric engine; Data model |
| F-103 | M1 | `ledger.source_registry`; `scorecard source register`; `recompute --source-registered`; the three pending rows from the first M1 run | Data model; Metric engine; Ingestion and operations |
| F-104 | M1 | Three registered definitions with `availability='division_site_only'` and no functions; `suppression_decision(kind='not_computed')`; fixed page text in bucket 2 of the email and the home and bucket pages | Metric engine; Delivery surfaces |
| F-105 | Retired | Retired in catalogue v1.1; no command, table, page or control; scope boundary in OQ-52 | Ingestion and operations (listed for completeness) |
| F-106 | M1 | `department_setting` rows `gate.*` (`signed_by`, `signed_on`, `reference`); `publish/gates.py`; `publish/scan.py` (G12); `own_records.py` (G14); gates G5 and G11; `delivery.gate_checked`, `payload_scan`; `scorecard doctor`; `/analyst/gates` | Ingestion and operations; Data model; Delivery surfaces |
| F-107 | M2 | `ledger.audit_log` (INSERT-only, triggers); `audit.log_view()`; `pipeline_read` rows for `svc_survey`; `scorecard audit`; `/analyst/audit`; `tests/ops/test_audit_immutable.py` | Dispute workflow; Data model; Ingestion and operations |
| F-108 | M1 | Plain-text email at 72 columns; text beside every chart; phone-width layout; the accessibility baseline; `tests/web/test_charts.py`; `tests/publish/test_catalogue_strings.py` | Delivery surfaces; Ingestion and operations |
| F-113 | M1 | `ledger.retention_class`, `disposition_log`; `scorecard retention run`; `roster_membership.faculty_to` ends sends and access; `doctor` lists stores without a class; backup class interim (D-41) | Data model; Ingestion and operations |

Counts: 113 rows; 112 active features mapped to at least one component; F-105 listed as retired. Every capability area of the catalogue has an owning section: Attribution ledger, Roles and access (data side), Audit and versioning and Admin and configuration in the Data model section; Metric engine and definitions and Suppression and peer groups in the Metric engine section; Dispute workflow and Drill-down and provenance in the Dispute workflow section; Scorecard views, Patient experience and inbox, Citizenship (M&M), wRVU tracker, Delivery and notifications and Roles and access (app side) in the Delivery surfaces section; Period close and publish, Division and site views and Cross-cutting in the Ingestion and operations section.

## Non-functional requirements

### Expected data volume

| Quantity | Expected order | Basis |
|---|---|---|
| Surgeons on the roster | 10 to 40 per site; 40 to 80 across the system when system-scope groups exist | design doc: "tens of surgeons" |
| OR-log cases per month | 1,000 to 5,000 case rows; 2 to 4 panel rows per case | brief: monthly counts; design doc Assignment |
| History | 12 months on first load; 5 years of history after five years of operation: about 300,000 case rows, 1,000,000 panel rows | design doc: extract with at least 12 months of history |
| `metric_value` rows per monthly close | surgeons x metrics x periods closing x sites x bases: under 5,000 at M1; under 20,000 with every bucket live | 25 metrics; adjudicated rows only where an override exists (D-11) |
| `metric_value_record` rows per close | one per (number, record): tens of thousands at M1; a few hundred thousand once admissions, visits and responses are in | every list row is a ledger row |
| `suppression_decision` and `peer_group_snapshot` rows per close | one per (viewer, metric, period, site, scope) and one per (viewer, metric, period, site): a few thousand | one row per cell every run |
| Disputes | several per month across the pilot in months one to three, then occasional (J2) | journeys |
| Database size | under 5 GB after five years including `raw` | every column `text` in `raw`; no images or documents stored |

### Performance targets

| Operation | Target | Where measured |
|---|---|---|
| `scorecard load periop_or_log` (one month, two files) | under 60 seconds on the workstation; under 30 seconds on the VM | `run.started_at` to `finished_at` |
| `scorecard close --period P` at M1 (four metrics, one site) | under 2 minutes end to end on the workstation, including every gate; under 1 minute on the VM | `run` row; the runbook's business-day-10 deadline needs minutes, not hours |
| `scorecard close` with every bucket live (M7) | under 10 minutes on the VM for a quarter-close month; a full five-year `restate` of one metric under 30 minutes | `run` row |
| `scorecard recompute --dispute` | under 5 seconds; the M2 app calls it synchronously in the decide request (D-26) | `run` row; app request time |
| `scorecard publish --dry-run` then `--send` for 40 surgeons | under 5 minutes to render and scan; send time bounded by the relay | `delivery.sent_at` |
| Web page render (tile, record list, queue, inbox) | p95 under 1 second at 40 concurrent users; statement timeout 10 seconds, after which the page is `load-failure`, never partial | nginx access log, ids only |
| `scorecard audit --clinician K --period P` | under 10 seconds | `run` row |
| Restore drill (`pg_dump` to scratch database and one recompute) | under 1 hour wall clock | `department_setting.restore_drill.<date>` with elapsed time |
| Test suite on synthetic data | under 5 minutes in CI | CI job |

Nothing in the system needs an index beyond the ones in the DDL at this volume; the first index review is a runbook item after the first quarter close with Vizient data.

### Availability

| Surface | Expectation | Rationale |
|---|---|---|
| Monthly batch (M1 onward) | No uptime target. The obligation is a published period within 10 business days of month close for three consecutive months (design doc Freshness criterion); a missed run is visible by construction because "last refreshed" is `run.published_at` (F-83) | The batch is a human-run calendar entry |
| Web app (M2 onward) | Business-hours availability on a best-effort basis, target 99% per month measured by `/healthz`, excluding MGB-scheduled VM maintenance; `Restart=always` on `scorecard-app.service`; a down app loses nothing, because every value is in the ledger and the monthly email still reaches every surgeon | One VM, no redundancy; the design doc accepts email as the delivery channel |
| Email | Delivery through the MGB relay; a relay outage falls back to `.eml` from the department service mailbox (D-30); bounces are logged and retried after an identity fix (F-90 AC 9) | |
| Database | Single instance on the VM; failure is recovered by restore (below) | |

### Backup and restore objectives

| Objective | Value | Mechanism |
|---|---|---|
| Recovery point (RPO) | 24 hours from the nightly dump; at M1 additionally after every `close`, `publish` and `dispute decide` (runbook step) | `scorecard-pgdump.timer` (M2); runbook page 1 step 9 (M1, including the copy off the workstation); `pg_dump -Fc` with sha256 to MGB-approved encrypted storage; `doctor` fails when the newest off-host dump is older than the RPO |
| Recovery time (RTO) | 4 hours from a decision to restore to a working database and app, measured by the restore drill | `pg_restore` into a fresh database, `scorecard migrate` to confirm the schema version, `grants check`, `doctor`, one published cell recomputed and compared |
| Restore drill | Before M1 is called done and quarterly after; `doctor` warns when the newest drill is older than 120 days | `department_setting.restore_drill.<date>` |
| Dump retention | Two months of nightly dumps plus the dump after each publish: the `pg_dump` retention class at 2 months interim pending OQ-57 (D-41); the same interim applies to `artifact_files` | `ledger.retention_class`; `scorecard retention run` |
| Loss tolerance | Any published artifact is reproducible from `raw` plus the registry plus the override and dispute tables; the artifact file and its sha256 on `delivery` prove what was sent | The ledger is the system of truth; nothing lives only in email |

### Security controls summary

| Control | Mechanism | Where specified |
|---|---|---|
| Least privilege in the database | Roles `loader`, `svc_survey`, `engine`, `publisher`, `disputes`, `retention`, `app`, `analyst_ro`, `bi_ro`, `migrate` as a migration; `SET ROLE` per stage; `scorecard grants check` on every command (gate G17); `doctor` refuses a superuser or table-owner runtime login | Data model (Roles and grants); Ingestion and operations |
| Segregation of sensitive data | `restricted` (comment text, private notes, peer member ids) with column-level grants and no analyst grant (D-42); `privileged` for M6 quality records (D-22); `pub` isolated with `bi_ro` SELECT only | Data model (schema layout) |
| Immutability by mechanism | Content-hashed definition versions with refusal on a changed hash; INSERT-only `audit_log`, `dispute_event`, `metric_definition_version`, `definition_param` with triggers; source rows never updated; overrides retire, never delete; restatements chain | Data model (invariants I3, I5 to I8) |
| Authorization, not authentication alone | SSO validated in-app (D-06); roles computed per request from the dated roster; a tested viewer x role x resource matrix; RLS on the eleven tables of the RLS set (including `restricted.survey_comment`) as defense in depth; parameterized SQL only; refusal payloads identical for "not yours" and "does not exist" | Delivery surfaces (authorization matrix, SSO) |
| Audit of access | Every open of surgeon-identified data and every refusal logged with identity, role, subject (or the subject list of a queue page), outcome; pipeline reads of comments logged; `psql` reads by `analyst_ro` and `scorecard_cli` logged by pgaudit; the log copied off-host as a hash chain that a superuser cannot rewrite; `scorecard audit` report | Dispute workflow (audit log design); Ingestion and operations (Roles at run time) |
| PHI minimization | Column allowlist per feed at load, so identifiers never enter `raw`; payload scan on every outbound artifact (G12); own-records check (G14); column allowlist per artifact; claim and decision text scanned at entry; ids-only application logs; `record_ref` surrogate as the only record id a surgeon sees | Ingestion and operations (Ingestion; PHI minimization) |
| Governance as data | `department_setting.gate.*` rows with signer, date, a ticket URL or document hash as the reference, and a second identity's confirmation; channel and bucket publishing refused until recorded and confirmed; `--allow-*` flags acknowledge and never bypass | Ingestion and operations (Governance flags) |
| Survey comment handling | De-identified by the patient experience office; load-time pattern check with quarantine and a held month (D-40); comment text readable by one code path; structured survey disputes with no free text | Ingestion and operations (Survey comments); Delivery surfaces (inbox) |
| Transport and storage | TLS to Postgres and nginx at M2; localhost-only listener at M1; MGB disk encryption; secrets outside git; IP-restricted internal SMTP relay from a service mailbox; shared dispute mailbox restricted to the analyst and backup | Ingestion and operations (Environments) |
| Supply chain and runtime | No third-party SaaS or LLM calls in the runtime path; charts as inline SVG (D-35); synthetic fixtures only in git; tagged releases only on the VM; CI runs the hash-refusal and migration checks (D-44) | Ingestion and operations (Test strategy, CI) |
| Retention | Every store has a retention class; nothing disposed while a period is unset, except the two-month interim on dumps and rendered artifact files (D-41); M1 dumps copied off the workstation; departed surgeons stop receiving artifacts and lose hosted access at `faculty_to` | Data model (Retention and disposition) |
| Recertification | Quarterly access recertification (roster roles, DB roles, OS group, mailbox membership) recorded in `department_setting.access_recert.<date>` | Ingestion and operations (Governance flags) |

### Accessibility baseline

The institution's standard is OQ-51. The floor that does not depend on it (F-108): the email is plain text, 72 characters wide, readable on iOS Mail, Outlook for iOS and Android Gmail without horizontal scroll, with a CSV that opens in Numbers, Excel and Google Sheets; every state, marker and interval on any surface is present as text, never conveyed by colour, icon or position alone (the viewer's marker is labelled "You"; a restated point says "restated"; "no evidence of difference" is a sentence); semantic HTML with one `h1` per page, table captions and `<th scope>`, labelled forms; 4.5:1 text contrast; every action reachable by keyboard; no JavaScript needed to read, navigate, file a dispute, decide or write a note; the hosted view is desktop-first and usable at 360 px without hiding any tile, reason text or record list; charts carry `role="img"` and `aria-describedby` pointing at the text table beneath them. When the institutional standard is named, conformance is added as a new version of F-108.

### Observability

| Signal | What it carries | Who reads it | Where |
|---|---|---|---|
| `ledger.run` | One row per command that writes: kind, period, git sha, active definition versions, catalogue version, gate results per gate, spread eligibility, checklist, `published_at`, status, log path | Analyst (`/analyst/runs`); builder; governance reviewer | Data model; Ingestion and operations |
| `scorecard status --daily` (printed checklist at M1; `scorecard-status.timer` at M2) | Extract not staged by business day 5; not published by business day 10; disputes at day 10 and 14; unentered replies and unanswered questions over two business days; override list not sent; bounces and incidents; decided disputes whose recompute failed; `route_undefined` holds | Analyst; adjudicators receive their own day-10 and day-14 items by email (ids only) | Ingestion and operations; Dispute workflow |
| `scorecard status --weekly --send` (the status email) | Feed health per source, last refreshed per source, open overrides awaiting source, disputes over 14 days, grants check result, backup and restore-drill age | Analyst and backup analyst | Ingestion and operations |
| `scorecard audit --clinician K --period P` | Runs, values with their restatement chain, suppression decisions, peer snapshots (counts only), disputes with state history, deliveries with artifact hashes, views and refusals, ids and roles only | Analyst (`analyst_ro`); governance reviewer | Dispute workflow |
| `scorecard doctor` | Migrations current, grants clean, gates recorded and confirmed, retention classes present, listener and TLS posture, runtime login neither superuser nor owner, pgaudit loaded, age of the newest off-host dump and audit export, no static surgeon-identified file, restore drill age, backup timer active | Analyst before every deploy; the deployment review | Ingestion and operations |
| Reports at publish | Reconciliation table (ours, periop's, delta, explanation); suppression grid; peer render report by peer-count bucket (the Premise 5 evidence); chief pre-step-zero summary; dispute trust report (F-98); adoption report (F-91) | Analyst; chief (summary); OQ-50 for the chair | Metric engine; Delivery surfaces |
| `ledger.delivery` | One row per artifact per channel: sha256, message id, gate checked, scan result, bounce, incident | Analyst (`/analyst/deliveries/<period>`, `scorecard delivery show`) | Delivery surfaces |
| Application and journald logs | Ids, role names, counts, gate names; no names, procedure text, comments, claims or addresses; shipped to the MGB log platform if the security review requires it | Builder; MGB security | Ingestion and operations |

## Open questions and assumptions

### Catalogue open questions the design depends on

Each row names the default the design implements and what changes in this document if the owner's answer differs. Answers land as new definition or configuration versions, settings or roster rows; none needs an edit to a decided row.

| OQ | Question (short) | Default built | What changes if the answer differs |
|---|---|---|---|
| OQ-01 | FCOT grace window and room eligibility | `fcot@v1` with the brief's values as `assumed` params; `v2` with periop's confirmed values (D-09); the gate blocks publish until the numbers match | A different institutional rule is a new definition version and a `definition_delta`; the trend marks the boundary; nothing else moves |
| OQ-02 | Super-long boarder threshold; restate LOS history? | 30 days as an `assumed` param; earlier periods frozen unless `scorecard restate` | A confirmed threshold is `los_oe@v2`; restating history is an explicit logged `restate` per period |
| OQ-03 | M&M leave scaling and pace rule | The F-75 rule as params of `mm_attendance@v1` | A new version; the pace strings come from the definition, so the page does not change |
| OQ-04 | Referral-to-visit data source | `pending_source` row; the definition registered but never called | `scorecard source register` from the effective period; a referral loader column map |
| OQ-05 | Unplanned return to ICU source and proxy window | `pending_source`; window as an F-100 param | Registration plus a new definition version for the window |
| OQ-06 | Co-surgeon cases: one clinician with tie-break, or credit both | One clinician, first-listed primary, `shared_flag`; the rate printed against 5% | Crediting both breaks the partial unique index on `attribution` (I1) and the row-count invariant; it would need a new attribution rule version, a per-metric "shared cases excluded" exclusion in FCOT and Duration estimate accuracy, and a delta against periop's number |
| OQ-07 | Peer-group counting rule | Peers excluding the viewer; at least five each clearing min-n | A one-line change in `peers.py`; the snapshot columns already hold both counts |
| OQ-08 | Multi-site surgeons: pooled row? | Per-site rows only; `department_setting.pooled_site_row` off | Turning the setting on adds a `site = null` frame for site-scope metrics; the reconciliation gate needs periop's pooled number or a delta |
| OQ-09 | Opt-out: voluntary; effect on a group of five; opt back in | Voluntary; excluded from every group; `opt_out_on` on the roster; opting back in is a new dated roster row | A different rule is a `peers.py` change; the render log already records the peer count per period |
| OQ-10 | Non-attendance at step zero | Spread withheld; surgeon stays in denominators; `spread-not-attended` text (D-17) | Removing non-attendees from groups is one condition in `cand`; the reason text is a catalogue key |
| OQ-11 | Peer-under-five hides the number too? | Own value stays; comparison withheld | Write the same kind on scope `value`: one line in `suppress.py` |
| OQ-12 | Sustained delay-reason dispute: annotation only? | Annotation only; the count never moves; never a reconciliation delta | An "as adjudicated" FCOT that excludes non-surgeon delays would be a labelled department variant with its own `metric_key`, never `fcot`, and a delta the gate carries |
| OQ-13 | Cancellation reason-code correction and the gate | As logged matches periop; adjudicated shown beside it | None in code; the gate already treats a sustained override on the adjudicated basis as explained |
| OQ-14 | Bucket 6 "displays what the system of record logs" for every bucket? | Both bases shown | If only the logged value may be shown for some bucket, the tile hides the adjudicated value by a per-definition flag; the override and the correction request still exist |
| OQ-15 | Involvement tests; chair on own record; chief change and open disputes | Tests (a) (b) (c); `route_undefined` held; open disputes keep their adjudicator | A fourth test is one predicate in `route.py`; a route for the chair's own records is a new `routed_to` value or a setting |
| OQ-16 | Re-file once; appeal; receiver may dispute in turn | Once, no appeal, yes (D-27 adds withdrawal) | Limits are constants in `file_dispute()`; an appeal would be a new transition in `state.py` |
| OQ-17 | Chief's note visible to the surgeon | Yes | A per-role template condition |
| OQ-18 | Pending disputes held out of the number? Recompute timing | Unchanged until decided; same day (D-26) | Holding a record out while a dispute is open would be a temporary override kind; recompute-at-next-close is the fallback path already present |
| OQ-19 | Time limit for filing | None | A constant in `file_dispute()` |
| OQ-20 | Email-months dispute workflow | Analyst entry within two business days plus a one-record decision email | The intake commands are the same; only the checklist thresholds change |
| OQ-21 | Notifications | One email per dispute event; receiver notified; definition-change notice | Each is a `notify.py` template behind a channel gate; switching one off is a setting |
| OQ-22 | Definition and peer-group disputes | Logged to the definitions owner as `definition_open_item` | A different route is a new outcome value |
| OQ-23 | Email format and adoption signal | Plain text plus CSV (D-29); replies and interview | A tracked link needs the hosted gates; `email_text.py` already adds links only when `gates.hosted_open()` |
| OQ-24 | In-progress months; 72-hour window at close | Closed months only; window rule as a param | `periods.py` close-date check; a definition version for the window |
| OQ-25 | Trend window and form; M&M trend | Up to 12 monthly points; quarterly points; four rolling points (D-16); M&M cumulative | `trend.series()` window constants and the pace definition |
| OQ-26 | Form of the spread | Sorted values, own marker (D-13); text lines in email; bars or interval dots on the page | `charts.py` function choice; the ledger holds the values either way |
| OQ-27 | Mortality on the individual view | Individual view with interval and "no evidence of difference" | Moving it off the individual view is `availability = 'division_site_only'` on a new version |
| OQ-28 | Interval method | D-14 | A new method in `intervals.py` and a new definition version |
| OQ-29 | Readmission observed universe versus Vizient expected | Brief's definition as written | A different observed source is a new loader column and definition version; the "unadjusted" label follows `risk_model` |
| OQ-30 | LOS whole-encounter or post-operative | Whole encounter as a param | New definition version |
| OQ-31 | Index-operation rule; encounter-to-case join | Written rule as a param of the Vizient four; unmatched admissions listed | New rule version in `attribution/rules/admission.py`; the exception list already carries the unmatched |
| OQ-32 | QI comparisons restricted to site; NHSN for SSI | Brief's cross-system comparator with the "self-reported, unadjusted" label | `peer_scope` change is a new definition version; NHSN is a new feed and loader |
| OQ-33 | wRVU mirror with no record list or dispute action; target; wording | Mirror only; no records; exact texts | A charge-level list means `src.wrvu_charge` as a record type with a trivial attribution rule and `disputable = false` or a billing-office route; the tile texts are catalogue entries |
| OQ-34 | Block utilization tile with no block; feed owner and schedule | `not_applicable` tile present | Absence instead of the state is a template condition; the loader waits on the owner |
| OQ-35 | Who confirms and approves a version; restate earlier periods | `approved_by` empty; earlier periods frozen | A required approver is a `register` check; restating is `scorecard restate` |
| OQ-36 | Roster source and maintainer; clinic and leave sources | Analyst-maintained dated dimension; loaders per named source | A roster feed is `loaders/roster.py` with `--close-missing`; other sources are column maps |
| OQ-37 | Publish on a partial feed | Analyst decision with a note (`--accept-partial`) | A stricter rule removes the flag |
| OQ-38 | Reason set contents; blank and Other | Outside the set unless signed in | A signed set is a new definition version (D-10) |
| OQ-39 | Named duration, visit attribution, new-patient and note timestamp fields | Named in `source_registry` and params once confirmed | Loader column maps and definition params |
| OQ-40 | Survey feed with comments; who de-identifies; analyst pipeline role; inpatient items; slide copy | Per-response feed required; office de-identifies; `svc_survey` (D-39); slide layout file | An aggregate-only feed cannot ship Bucket 5 (the loader refuses it); a department de-identification step is a new processing purpose with its own gate |
| OQ-41 | Direct leader versus chief; leader of a practising chief | Separate roster fields; no leader access unless mapped | Roster rows only |
| OQ-42 | Private notes visibility; leader sees measures; view indicator | Surgeon-only notes; inbox only; no indicator | Matrix rows and `leader_sees_measures`; "last viewed by" is a setting over `audit_log` |
| OQ-43 | Survey-record dispute route; response reference; comment removal | Chief per GR2 with the comment withheld; the direct-leader route coded behind a setting (D-20); annotated outcome keeps both marked | The setting; removal of a comment would be a new outcome effect on `restricted.survey_comment` |
| OQ-44 | Year average and hidden months; MGB average scope; promoter and detractor values; trend beyond three months | Trend shown; `year_average` aggregation per definition | Definition versions for the survey measures |
| OQ-45 | Survey extract coverage | `peer-coverage-gap` reason | None in code; the reason names the gap |
| OQ-46 | Export or print for annual review | None defined; `print.css` only | Any export is a feature with its own payload scan |
| OQ-47 | Hosted view: BI or app; approving bodies and lead times; email gates; workstation encryption | One app (D-04); gates as `department_setting` rows; workstation interim declared | Lead times change the calendar, not the code; a different gate list is more `gate.*` rows |
| OQ-48 | Named analyst, periop contact, owners of the twelve sources | Blockers, not defaults; `feed_owner.contact_name` null blocks `source_corrected` | Rows in `feed_owner` and `department_setting` |
| OQ-49 | QR attendance system live; HR leave source | Pending | Loaders at M5 |
| OQ-50 | Who reads the trust report | Analyst only | A recipient setting on the report |
| OQ-51 | Accessibility standard | The floor above | New version of F-108 and template work |
| OQ-52 | Division and site views | Out of scope; `not_computed` state; page text | Any specification uses pub as the mandatory channel and must not name surgeons in a subspecialty under five |
| OQ-53 | System-wide subspecialty roster | Unknown; system-scope groups are what the roster holds with the coverage-gap reason | A system roster feed into `roster_membership` with its own `feed_key` |
| OQ-54 | Periop reports volume and duration at surgeon level; distributes lists already | `not_reconciled: periop does not report` | Nothing in code; the gate covers whatever periop reports |
| OQ-55 | Wedge ledger custody | The ledger is the record (D-25); optional validated import | Confirming the sheet reading would reintroduce a second PHI copy; the import path exists for a chief who insists |
| OQ-56 | Deadline thresholds and form | Business day 5 and 10; day 10 and 14; printed checklist at M1 (D-47) | Constants in `status.py` |
| OQ-57 | Retention periods; departed-surgeon inbox, comments and notes | Every class unset; departed surgeons stop receiving artifacts and lose access at `faculty_to`; dump class interim (D-41) | `retention_class` rows; a disposition rule for inbox content |
| OQ-58 | Recipient resolution; misdirected-send procedure; MRN pattern | Directory lookup (D-34); `delivery incident` with a reference; `mrn_pattern` from the privacy office | `directory.py` mechanism; `scan.py` pattern row |
| OQ-59 (new) | Fiscal year start month used by the comp plan; calendar or fiscal quarters | `department_setting.fiscal_year_start_month` required before any `fiscal_year` metric computes; quarters are calendar quarters | A fiscal-quarter rule is a `periods.py` change and a restatement of quarterly history if applied retroactively |
| OQ-60 (new) | What the "Vizient" comparator value is (a cohort benchmark in the extract, or the 1.0 reference) | Store the extract's benchmark when it carries one; otherwise show only the "1.0 means exactly as expected" sentence | A different benchmark source is a `comparison_target` loader column |
| OQ-61 (new) | Which MGB-approved location holds the off-workstation copies at M1 (the nightly dump and the hash-chained audit export): a department share with a named ACL, the enterprise backup service, or the MGB log platform; owner: information security | The runbook step copies both there with an access list of the analyst and backup analyst; `doctor` checks their age | A different location is a path in `.env`; if none is granted, M1 cannot be called done because the restore drill and the audit chain both need a copy the workstation superuser cannot alter |
| OQ-62 (new) | Whether data derived from a QI event (the `qi_event` record row, the QI four's `metric_value` and `metric_value_record` rows, the override on a quality dispute) is peer-review privileged; owner: the medical staff office, before M6 | `privileged.qi_event` and `privileged.quality_note` are segregated structurally; derived rows are not | If privileged: the `privileged_derived` RLS policy on `record`, `metric_value`, `metric_value_record` and `record_override` and a dump variant excluding `privileged` (the Ingestion and operations section, Roles at run time) |

### Technical assumptions

Each is a fact the design relies on that no document confirms. Each names what changes if it is false.

| TA | Assumption | If false |
|---|---|---|
| TA-01 | MGB will allocate one RHEL VM in the department allocation with Postgres 16 installable, requested at M0 and landing before M2 | M2 waits; M1 runs on the workstation interim as designed; if no VM is ever granted, the enterprise-managed database plus a small app host (D-03 option c) is the fallback and the schema is unchanged |
| TA-02 | The analyst's MGB-managed workstation may run a native PostgreSQL 16 service on localhost and its disk encryption satisfies information security for an interim PHI store (under OQ-47) | If a local database is refused, M1 needs the VM before the first load and the calendar moves; the code does not |
| TA-03 | The MGB internal SMTP relay accepts mail from the workstation or VM on behalf of a department service mailbox, and a shared dispute mailbox with a retention policy can be created | `--eml` from the service mailbox (D-30) until the relay request lands; without a shared mailbox the dispute channel cannot open and M1 disputes wait |
| TA-04 | The institutional directory is reachable over LDAPS (or Microsoft Graph) from the workstation or VM to resolve a mailbox by `person_key` | Monthly directory export loaded as a feed (D-34 fallback); the typed address alone is refused |
| TA-05 | The periop extract carries a panel with roles and listed order, wheels-in, a first-case flag or the fields to derive it, delay and cancellation reason codes, and 12 months of history | Each missing field marks its metrics `not_computable` (F-80) and the staging summary says so; one primary-surgeon column disables the tie-break and shared flag; less history shows `history from <date>` |
| TA-06 | Periop's surgeon-level report is obtainable at the same grain as the extract and reports FCOT and cancellations per surgeon per month | Metrics periop does not report carry `not_reconciled`; if the report is unobtainable, `--reconcile-skip --note` is recorded on every period and the design doc's reconciliation criterion cannot be met |
| TA-07 | MGB SSO offers OIDC (Entra ID) or SAML to a registered application; the SSO subject maps to a UPN the roster can carry | If only a header-injecting proxy is offered, D-06 option (b) with the network restriction and a signed header |
| TA-08 | Python 3.12 with pandas, psycopg, Jinja2 and pytest can be installed on the workstation and the VM from an MGB-approved package source | Version pins move; a mirrored index is a `pyproject.toml` setting |
| TA-09 | A git host (MGB GitHub Enterprise or GitLab) with a CI runner is available to the department | Local pre-commit runs the same checks (D-44); releases are tagged only after they pass |
| TA-10 | Data governance will accept "retention period unset, nothing disposed" as the starting state and set periods per store within the first year | Storage grows unbounded but stays inside the VM's disk for years at this volume; the dump class interim (D-41) bounds backup copies |
| TA-11 | Vizient extracts carry a model version on every row and expected values for LOS, readmission and mortality per encounter | A file without a model version is refused (loader rule); missing expected values become a named exclusion with its count on the tile |
| TA-12 | The survey vendor can deliver a per-response file with the provider named and de-identified comment text, plus a per-measure MGB-average file | An aggregate-only file is refused at load and Bucket 5 renders `pending-source`; comments arriving identified are quarantined and the month held (D-40) |
| TA-13 | Tens of surgeons and thousands of cases a month: no metric needs more than pandas on one machine | If a system-wide roster and Vizient extract raise the volume by an order of magnitude, the compute stage is per (clinician, metric) and can be batched; the ledger schema does not change |
| TA-14 | MGB mail policy blocks automatic forwarding of internal mail to external addresses, requires MDM on any phone that reads MGB mail, and lets Exchange administrators set a retention policy on the service and dispute mailboxes; the email channel relies on all three and the privacy-email gate reference (`gate.privacy_email.scorecard`) cites the policy | If any is false the case-list attachment cannot be sent to a mailbox that may forward or sync unmanaged, and `publish --numbers-only` (D-31) is the channel until it is; the retention gap is OQ-57 |

## Glossary

| Term | Meaning in this design |
|---|---|
| Adjudicated basis | See basis |
| Artifact | One rendered output for one surgeon and period: the monthly email body and CSV, a decision email, a page render, a pub row set. `ClinicianArtifact` is the object every surface renders from |
| As-of date | The feed's own date, given on the command line from the document the owner sent (`feed_load.as_of_date`), copied to `metric_value.source_as_of`. Never the load date. Distinct from "last refreshed" |
| Attribution | The `ledger.attribution` row that credits a record to exactly one clinician under a named rule version (GR1). Exactly one current row per record, enforced by a partial unique index. Adjudicated crediting is not a second attribution; it is an override read beside it |
| Attribution exception | A record the rule could not credit (blank primary, ambiguous primary, outside the department, no index operation, unmapped provider, no index case), held in `attribution_exception` until the analyst assigns or excludes it with a reason; publish is blocked while any is unresolved |
| Basis | Which crediting and field values a number was computed under: `logged` (the source as loaded and attributed) or `adjudicated` (the logged frame with every active override applied). Adjudicated rows exist only where an override touches the cell; a tile shows both only when they differ |
| Catalogue (reason catalogue) | `ledger.reason_catalogue`: the versioned set of templates (F-33) every absent-cell, spread, dispute-clause and page-state string is rendered from. A definition version pins a catalogue version. No surface types a reason |
| Cell | One (clinician, metric, period, site) that a surface could render; every cell has a value or a suppression decision on both scopes, or the run fails |
| Convergence | The loader step that compares each open correction request with the re-ingested field on the next load of the owning feed and retires the override, with history, when the source now carries the adjudicated value |
| Correction request | A `ledger.correction_request` row written by a sustained decision when the feed owner has a named contact; grouped per feed owner into the monthly override list; open until a load confirms it |
| Definition delta | A written, authored explanation of a difference: between the brief's assumption and the institutional definition, or between the department's number and periop's report. The only thing besides a sustained re-credit that can explain a reconciliation difference |
| Definition parameter (param) | A named value on a definition version (`grace_minutes`, `super_long_boarder_days`, a signed reason set) with a status of `assumed`, `confirmed` or `pending_signoff`, the brief's value kept beside the value in force. Changing one is a new version |
| Definition version | One immutable Python file `definitions/<metric>/vN.py`, registered by the sha256 of its bytes as `<metric_key>@vN` in `ledger.metric_definition_version`, with an effective period window. Every number carries the id it was computed under; old periods keep theirs |
| Dispute | A `ledger.dispute` row pinned to one record and one field, filed by the credited surgeon, routed once by executable tests, decided once by the named adjudicator. Never a dispute of a number, tile, spread or period |
| Dispute event | An append-only `ledger.dispute_event` row for each state transition; `dispute.state` is maintained from it by trigger |
| Effect notice | The sentence, stored per definition version and disputable field, that tells the surgeon before filing what a sustained dispute changes (for example that a delay-reason correction does not move the FCOT count) |
| Feed | One institutional source with a `feed_key`, a loader, a file contract, a required-field list, an as-of capture rule and an attribution rule. Thirteen are named |
| Feed load | One staged file: `ledger.feed_load` with sha256 (same file is a no-op), ticket number, as-of date, model version, row count, field checklist and status; a corrected file is a new load that supersedes the old and keeps its rows |
| Field checklist | Per load, which required columns were present; a missing column makes the dependent metrics `not_computable` rather than computed from a proxy |
| Frame | The pandas table `frames.py` builds for one (clinician, site, period, basis, record type) from the ledger only, with overrides applied for the adjudicated basis; the only input a definition function sees |
| Gate | A check that stops a run or a send: G1 to G18 in the Ingestion and operations section (reconciliation, feed health, row count, no blank cell, exceptions, channel gate, payload scan, own records, grants, custody, and so on). A governance gate is a `department_setting` row with a signer and date that opens a channel or a bucket |
| Interim | The suppression kind for a quarterly or rolling metric between its closes: the tile says when the period closes and how many records so far |
| Kind (definition) | The shape of a metric: `rate`, `oe`, `count`, `median`, `mirror`, `pace` |
| Kind (suppression) | Why a cell shows a reason instead of a value or a spread: one of twelve fixed values tested in a fixed order |
| Last refreshed | `run.published_at` of the publish run being rendered; the only source of the date on every artifact, so a missed month shows the previous month's date |
| Logged basis | See basis |
| Override (record override) | A `ledger.record_override` row written by a sustained decision: the disputed field, its logged value, its adjudicated value, the decider and note, the definition version. The only mutation layer: source rows are never edited. Retires, never deletes, when the source converges |
| Override list | The monthly list per feed owner of unconfirmed correction requests (periop ids and fields only), sent under its own privacy gate |
| Peer snapshot | `ledger.peer_group_snapshot`: per viewer, metric, period and site, the roster peer count, how many clear min-n, the viewer's eligibility state, whether the spread rendered, the sorted peer values and the viewer's own value and position. Member identities go only to `restricted.peer_group_member`. Every snapshot is a render-log entry |
| Period label | The text key of a period: `2026-10`, `2026-Q4`, `2026-12-R12`, `FY2027:2026-10`; dates are derived from it (D-49) |
| Provenance panel | The fields an adjudicator sees with a dispute: the record's columns as the surgeon saw them, source and load date, attribution rule text, definition version, stored value of the disputed field, prior disputes; never a score |
| Publish | `scorecard publish`: render every artifact for a closed period, scan and gate each one, resolve the recipient, send or preview, write delivery rows, then set `published_at` |
| Reconciliation | The gate that compares each wedge number with periop's own surgeon-level report loaded as a feed; any difference must be a written delta or a sustained re-credit, or nothing publishes |
| Record | The identity of one source record across reloads (`ledger.record`): a case, admission, visit, survey response, attendance pair, block day, referral, ICU stay, QI event or third-next sample. `record_ref` is the opaque surgeon-facing id |
| Record participant | Every person named on a record with their role (panel member, index surgeon, discharging attending, provider named, scanned person); what the routing tests read |
| Restatement | A new `metric_value` row that replaces a current one, linked by `restates_metric_value_id` and described by a `ledger.restatement` row with one of eight reason categories; the trend marks the point as restated. Nothing is overwritten |
| Roster (dated roster) | `ledger.roster_membership`, a slowly changing dimension read "as of" a date: site, subspecialty, chief, direct leader, faculty dates, block, step-zero attendance, opt-out. Peer groups read it as of the period end; access reads it as of today; routing reads it as of the filing date |
| Route | The result of `route.py` at filing: chief, chair (a test fired), direct leader (survey, setting on) or held (`route_undefined`) |
| Run | One `ledger.run` row per command invocation that writes: kind, period, git sha, active definition versions, gate results, status, `published_at` |
| Scope (suppression) | Which part of a cell a decision covers: `value` (the surgeon's own number) or `comparison` (the peer spread) |
| Source registry | `ledger.source_registry`: per metric, whether its source is pending confirmation, not in this release, or registered with a system, extract, join key, attribution rule and effective period |
| Spread | The anonymous peer comparison: sorted peer values and the viewer's own marker, never identities; rendered only with five peers each clearing min-n and an eligible viewer |
| Suppression decision | A `ledger.suppression_decision` row per cell and scope every run, including `kind = 'none'`, with the kind, the catalogue template, the counts and the rendered reason text; the mechanism behind "the screen says why instead of showing a blank" |
| Version (feed, definition, catalogue, rule, setting) | Every changeable input is versioned as data: definition versions by hash, reason catalogue versions, attribution rule versions, suppression rule versions, reason set versions, retention class versions, and dated `department_setting` and roster rows. A change is a new version; old numbers keep the version they were computed under |
| Viewer | The clinician a snapshot, decision or artifact is rendered for; peer groups exclude the viewer; the web app scopes every query by the viewer resolved from SSO and the roster |
| Wedge | The first delivery: one site, all neurosurgeons, periop's case-level extract, four metrics (OR case volume; First-case on-time start (FCOT); Duration estimate accuracy; Same-day cancellations you could have prevented), by email for months one to three |

## Review log

Two audits were applied on 2026-09-29: a traceability and internal-consistency pass (seven mechanical checks against the catalogue, the brief and the design doc) and a hospital information security and data governance review. Decision IDs and section order are unchanged. Every name fix was applied file-wide; the contradictions table (C-12, C-15, C-17) keeps the old names only as history.

| # | Finding | Severity | Decision | Change made |
|---|---|---|---|---|
| T-01 | Grants table did not cover writes the other sections assign to the same roles; G17 makes drift a run failure; no role could file a dispute at M1 | material | ACCEPT | Roles table rewritten: every write named in the document has a grant; `publisher` gains INSERT `run`, `dispute_event` (`correction_requested`), `department_setting` (`inbox_first_available` rows) and the `delivery` and `correction_request` send columns; `loader` gains `dispute_event` (`correction_confirmed`) and the roster and setting rows; `engine` gains `is_current` on the four restated tables, the registry tables and `exceptions resolve`; new stage roles `disputes` (the `scorecard dispute` CLI at M1, inherited by `app` at M2) and `retention` (the only DELETE); `app` holds a call-scoped `engine` connection for the synchronous recompute; F-111 AC 1 row, both environment diagrams, the CLI login paragraph and the security summary updated |
| T-02 | `held` survey month had no suppression kind, no rank and no feed-health row | material | ACCEPT | `feed_held` added to the DDL CHECK, the fixed order (rank 3), C-04 (twelve kinds), the suppression table (template `feed-held`), the availability table, the feed-health table (`held` row), the survey hold text, F-44 in two mappings and the glossary |
| T-03 | Three rows named `publish/artifacts.py`, a module C-17 renamed | minor | ACCEPT | `render.py`, `email_text.py`, `csv_rows.py` in F-90; `render.py` builds `definition_changes` in F-94; allowlist in `csv_rows.py` in the PHI table |
| T-04 | F-104 mapped to `metric_definition_version.scope`, a column C-01 removed | minor | ACCEPT | `availability = 'division_site_only'` |
| T-05 | F-25 said `slot_sample` records | minor | ACCEPT | `third_next_sample` (C-11) |
| T-06 | Two URLs used `/dispute/<id>` | minor | ACCEPT | `/disputes/<dispute_id>` and `/disputes/<dispute_id>/decide` in the state diagram and F-59 |
| T-07 | F-53 named a URL absent from the page inventory | minor | ACCEPT | `/me/<period>/metric/<metric_key>/records` for `survey_response` |
| T-08 | Survey `aggregations` value was `month` in two places and `period` in three | minor | ACCEPT | `period` in the contract table and the F-28 engine mapping |
| T-09 | `run.gate_results.cosurgeon` versus `cosurgeon_rate` | minor | ACCEPT | `cosurgeon_rate` in the Ingestion F-03 row |
| T-10 | `scorecard restate` had two flag sets | minor | ACCEPT | Data model CLI line now `--metric --period --to-version --reason --note` |
| T-11 | `scorecard register --check-only` versus `--check` | minor | ACCEPT | `--check` in the Data model CLI list |
| T-12 | `src.roster_import`, `privileged.quality_note` and `pub.definition` defined nowhere | minor | ACCEPT | `roster_import` and `pub.definition` dropped from the layout table (definition text rides on `tile.definition_stamp`); `privileged.quality_note` added to the entity catalogue with grain and key fields and given a job under S-06 |
| T-13 | Comment-isolation test at two paths | minor | ACCEPT | `tests/web/test_comment_isolation.py` in all four places |
| T-14 | `peer_under_five` (rank 7) tested before `spread_not_written` (rank 8) contradicted the month-one email rule | minor | ACCEPT | Ranks swapped: eligibility (`spread_not_written`, 7) before the peer count (`peer_under_five`, 8) in the fixed order, the DDL CHECK order, the suppression table, `peers.build` and the roster-rule text; the Delivery sentence now holds |
| T-15 | Direction rule said `not_stated` wherever the brief is silent; the table and `fcot/v1.py` stored `higher is better` for metrics the brief gives no direction | minor | ACCEPT | Rule rewritten: `lower_is_better` where the brief prints it, `higher_is_better` inferred for share-of-good-outcome rates and never rendered, `not_stated` otherwise (cancellations kept `not_stated`); the contract table points at the rule |
| T-16 | The dispute section's catch-all refused the `/records/<record_ref>` page the Delivery section defines | minor | ACCEPT | Record-detail GET row added with its three viewers; catch-all reworded to "any URL not in the page inventory" |
| T-17 | The acknowledgement email was gated by two different keys | minor | ACCEPT | M1 intake timeline: ack under `gate.privacy_email.decision`, adjudicator email under `gate.privacy_email.adjudicator` |
| T-18 | `dispute.decision` admitted `withdrawn`, which no path sets and the CHECK would then demand a note for | minor | ACCEPT | `withdrawn` removed from the `decision` enum with a comment that withdrawal is a state; the 14-day query is unchanged and now consistent |
| T-19 | D-04 said its deviation from the design doc's "hosted view on C" was recorded in the Delivery section, which never mentioned it | minor | ACCEPT | One passage added to "M2: the web app, Shape" naming the design doc's recommendation, the choice and the reasons |
| T-20 | `ledger.metric_value_by_basis(...)` named once and never defined | minor | ACCEPT | Name dropped from Builder decision 4; the coalesce is stated as the renderer's rule over `metric_value_current` |
| S-01 | Audit-log immutability holds only against runtime roles; the M1 analyst is the superuser and the `migrate` credential sat in the same `.env`; no copy left the database | material | ACCEPT | I3 and audit design point 1 say so plainly; new point 4: `scorecard audit export` writes a hash-chained batch to the MGB log platform or an MGB-approved write-once location (OQ-61) with `doctor` checking its age and the recertification re-hashing the chain; `migrate` credential moved to `/etc/scorecard/migrate.env` at M2; `doctor` refuses a superuser or table-owner runtime login; two ops tests added |
| S-02 | `analyst_ro` reads of surgeon- and patient-level rows in `psql` were unaudited | material | ACCEPT | pgaudit object-level SELECT auditing on `ledger`, `src`, `raw`, `privileged` for `analyst_ro` and `scorecard_cli` with connection logging, shipped with the application logs; `scorecard audit` prints the audited reads; `postgresql.conf` note, PHI table, roles table note, recertification and the security summary updated |
| S-03 | No ingestion-time column allowlist; `raw.survey` grant contradiction; F-106 AC 6 not concrete per store | material | ACCEPT | Loader step 3 drops columns not in `ACCEPTED_COLUMNS` before `raw` and records their names in `field_checklist.dropped_columns` (rule 0; test added); `analyst_ro` loses `raw.survey`, `raw.vizient`, `raw.qi`; a per-store table of patient-level fields and readers added to PHI minimization; the schema layout `raw` row and D-21 say "allowlisted" |
| S-04 | RLS covered four tables and not `restricted.survey_comment`, `src.survey_response` or the other app-read tables; parameterized SQL not stated | material | ACCEPT | "The RLS set" of eleven tables defined once in the roles table with its admission rule (viewer, adjudicator, receiver, direct leader after day 30) and referenced from the M2 milestone, F-85, the dispute section, the web app shape, the runtime roles bullet and the security summary; `test_rls_backstop.py` covers every table in the set; `web/queries.py` binds parameters only and `test_no_sql_strings.py` enforces it |
| S-05 | `claim_text` and `decision_note` were unscanned free text, emailed and mailed, and either blocked by the 120-character rule or silently exempt | material | ACCEPT | Both scanned by the identifier value patterns in `file_dispute()` and `decide()` and capped at 1,000 characters; exempt from the send-time length rule, not from the value patterns; the `claim-no-identifiers` sentence on the form, in the email reply instructions and the CSV comment line; the dispute mailbox listed as a PHI store in the PHI table with its retention class and recertification |
| S-06 | Segregation stopped at `privileged.qi_event`; derived rows and quality-dispute text sat in `ledger` under `analyst_ro` | material | PARTIAL | Structural part accepted now: `privileged.quality_note` holds the claim and decision text of every `qi_event` dispute and `ledger.dispute` carries null there by CHECK; `disputes` writes it under the gate. The derived-data question (record rows, the QI four's values, the override) is the medical staff office's decision, recorded as OQ-62 with the mechanism named (`privileged_derived` RLS policy and a dump variant) rather than decided here, because the design does not invent institutional policy |
| S-07 | M1 dumps sat on the same workstation disk as the live database; the M1 access list was unstated | material | ACCEPT | Runbook step copies each dump with its sha256 off the workstation to an MGB-approved location (OQ-61) with an ACL of the analyst and backup analyst; `doctor` fails when the newest off-host dump is older than the RPO; the restore drill restores from the off-host copy; the "same as the VM's" sentence corrected in three places |
| S-08 | `artifact_files` had no period so preview folders could never be emptied; dump retention stated two ways | minor | ACCEPT | `artifact_files` gets the same two-month interim as `pg_dump` (D-41, O-4); "rolling 35 days" replaced by the class period everywhere (register, diagram, O-4, NFR table); the preview-folder sentences say "cleared by the quarterly `retention run`" |
| S-09 | Gates were self-attested by the person they constrain with a free-text reference | minor | ACCEPT | `department_setting` gains `confirmed_by`, `confirmed_on`; a gate opens nothing until `scorecard setting confirm gate.<name> --by` is run from a second identity; `reference` must be a ticket URL or a document sha256; `/analyst/gates` shows all of it and the recertification lists every gate row |
| S-10 | SSO and session handling omitted cookie flags, key rotation, logout, headers, IdP disable and how `identity.upn` is populated; `identity` was not audited | minor | ACCEPT | A table added to the SSO subsection covering each item; `identity.upn` populated only from the directory lookup by `person_key` (D-34), a hand-typed UPN refused; `identity` added to both audit-trigger lists, to the entity catalogue note and to `scorecard audit` |
| S-11 | Queue and leader-landing opens could not be attributed to subjects; `/leader` had no matrix row | minor | ACCEPT | Multi-subject pages write `details.subject_ids` with `subject_clinician_id` null (audit design point 3 and the action table); `/leader` row added to the authorization matrix; `scorecard audit` reads `subject_ids` |
| S-12 | Mail-policy dependencies unnamed; NDRs returned full case lists into the dispute mailbox | minor | ACCEPT | TA-14 records the no-external-forwarding, MDM and Exchange-retention assumptions and ties them to the privacy-email gate reference; `Return-Path` moved to the service mailbox, and `ingest-ndr` deletes the NDR after recording the bounce |

Counts: 32 findings; 31 accepted, 1 partial (S-06), 0 rejected.

2026-09-29, `/impeccable` (critique, harden, onboard, clarify; planning-only): the "Delivery surfaces" section was amended in place (the plain-text template rewritten to the PRD's order and grammar, the CSV `metric` column, the page inventory's records link and home aside, the states paragraph, the accessibility and chart bullets, the M&M strings). The full list is the Review log in `docs/reviews/impeccable-design.md`. The Metric engine section's catalogue table still prints the pre-R-125 peer-under-five template text; the PRD (section 9.4) is the current wording and the table is due a version when the catalogue is registered.
