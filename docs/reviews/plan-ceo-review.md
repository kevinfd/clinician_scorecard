# /plan-ceo-review: Clinician Scorecard PRD

Target: `docs/PRD.md` (v0.2, DRAFT) · Date: 2026-09-29 · Run: headless (gstack spawned-session rule; no human present) · Review depth: implementation-ready · Mode chosen: SCOPE EXPANSION (see 0E) · Status of the plan after this review: DRAFT. Nothing here is approved; every decision below was auto-chosen and is listed under "Headless decisions" for the human to reverse.

How to read this: findings use `[SEVERITY] (confidence: N/10) location: description`. Severities are CRITICAL GAP, WARNING and OK. Citations are to features `F-xx`, requirements `R-xx`, technical decisions `D-xx`, journey steps `J1.4`, open questions `OQ-nn`, design-doc premises `P1` to `P12`, technical assumptions `TA-nn`, run gates `G1` to `G18` (the technical design's; goals are written "goal G1" to "goal G8") and privacy requirements `PS-n`. Metric names are the brief's exact names; the brief's "Work RVUs — live tracker" carries a dash inside its name and that quotation is the only place one appears in this file.

---

## Pre-review system audit

| Check | Result |
|---|---|
| Repo state | Documents only. No application code, no `pyproject.toml`, no migrations. `git log` shows eight commits from the source brief to the technical design. |
| In-flight work | One uncommitted change: `docs/PRD.md` v0.1 to v0.2 (275 insertions, 42 deletions: section 10 filled from the technical design; OQ-59 to OQ-62 added; three deviations recorded on R-71, R-82, R-112). No stashes. No branches beyond the working one. This review builds on the uncommitted v0.2 text. |
| TODO markers | None in `docs/`. No `TODOS.md` exists; deferred items from this review are recorded in "NOT in scope" below and should be moved to `TODOS.md` when one is created. |
| CLAUDE.md | Present; gstack install notes only. No project conventions that constrain this review. |
| Design doc | Found at `docs/designs/clinician-scorecard.md` (headless `/office-hours`, revised after a 31-challenge adversarial review). Used as the source of truth for the problem, constraints and approach. No paused CEO handoff note exists. |
| Prior review logs | Journeys: 18 findings (16 accepted, 2 partial). Catalogue: 20 findings, all accepted, including the two blocking ones (F-111 wedge ledger custody, F-106 per-channel gates). Technical design: 32 findings (31 accepted, 1 partial, S-06). None of those accepted changes is altered by this review. |
| Retrospective check | Two areas were reworked in earlier reviews and recur here: dispute custody in the email months (journeys finding 10, catalogue finding 10, D-25) and the analyst as a single operator (design doc challenge 10, catalogue finding 13). Both recur in this review's findings (the backup analyst; duplicate and unmatched replies). Flagged as the plan's structural weak spot: everything in months one to three passes through one person's mailbox and calendar. |
| UI scope | Yes. The plan has a plain-text email contract (section 9.1), an M2 web app with page states (9.2, 9.4) and an accessibility baseline (9.5). Section 11 runs. |
| Taste references | Good patterns to copy: the reason catalogue (F-33) as the single source of every absent-cell string; definitions as hash-registered files (D-07); the run gates table with exit codes. Patterns to avoid: none in code yet; in documents, the 4,900-line technical design's size is the pattern not to copy into the runbook. |
| Landscape check | Search not run in this pass (headless, no web tool budget requested). Proceeding with the design doc's own prior-art section, which already covers report-card gaming, OPPE attribution and Vizient O/E. |

What this plan touches, blocks and unlocks: it touches nothing existing (greenfield). It blocks `/plan-design-review` (needs a sketch, section 9) and `/plan-eng-review` (the shipping gate). It unlocks M0 (the Assignment), which is the first work anyone should do.

---

## Step 0

### 0A Premise challenge

**The real problem.** Not "surgeons lack a dashboard." The problem the design doc found is that two numbers for the same surgeon reach the same faculty meeting from different owners, and the surgeon has no case list to check and no dispute that changes anything. The brief's six ground rules are a specification for fixing that, written before anyone tested them on a real surgeon.

**Target outcome.** By month three of M1: every wedge number matches periop's report or carries a written definition delta (goal G1); at least half the pilot surgeons come back unprompted (goal G2); at least two disputes by non-owners are decided inside 14 days and show up on the row (goal G3); an analyst who is not the builder runs the close (goal G6); a feed owner outside the department authorizes the next feed (goal G7).

**Do-nothing cost.** Unmeasured (P10). Faculty-meeting minutes spent arguing, chief hours assembling packets, and a report-card program somebody else builds later with a composite and a rank. The PRD is honest that the cost is unmeasured and makes measuring demand the M0 Assignment.

**Direct or proxy.** The plan solves the surgeon's pain directly: the case list, the delay reason on each case, the dispute with a written outcome. It solves the chair's pain (arguments at faculty meeting) only by proxy: nothing in M1 puts the reconciled number in front of the meeting, and the design doc deliberately keeps leader views out of the wedge (D5). That is the right call for trust and it means goal G2 and goal G3, not goal G1, are the evidence the chair will act on.

**Premises accepted, premises questioned.**
- Accepted: P1 (periop ticket), P6 (a dispute must visibly change the list), P7 (email needs no host, to confirm), P8 (survival needs a named analyst), P11 (opt-out), P12 (intervals on O/E).
- Questioned but not overturned: P5 (small-group anonymity is fake). The plan already handles this the right way: say it out loud at step zero, log every render, decide with data. No change.
- One premise the PRD does not state and should: the plan assumes periop's report carries all four wedge numbers. TA-06 says it may not (OQ-54). Goal G1 is written as if it does. Finding in Section 1.

### 0B Existing code reuse

Greenfield: no repo helper exists. The reuse ladder (repo helper > standard library > platform feature > installed dependency > new code) applied to the sub-problems, with the enterprise systems the technical design names:

| Sub-problem | Ladder rung used | What is reused | New code |
|---|---|---|---|
| Authentication (M2) | Platform | MGB SSO, OIDC or SAML via a maintained library (D-06); directory lookup (D-34) | Roster-to-identity mapping only |
| Authorization | Platform + new | PostgreSQL row-level security as a backstop (S-04); tested authz matrix | The matrix and viewer scoping |
| Email transport | Platform | MGB internal SMTP relay, service mailbox, shared dispute mailbox, Exchange retention (TA-03, TA-14) | `transport.py`, NDR ingest |
| The reconciliation target | Platform | Periop's own surgeon-level report, loaded as a feed (F-81, D-15) | The gate |
| Risk adjustment | Platform | Vizient expected values and model version (P3); no in-house model | Interval methods (D-14) |
| Data store, immutability, audit | Installed dependency + platform | PostgreSQL 16 triggers, INSERT-only tables, pgaudit (S-02), pg_dump | Schema, roles, retention classes |
| Compute | Installed dependency | pandas, psycopg, Jinja2, pytest (D-01) | Definitions, engine, suppression, peers |
| Hosted charts | Platform | Inline SVG with text tables (D-35); no JS library | `charts.py` |
| Hosted BI surface | Platform (deferred) | Enterprise BI tool with RLS via the `pub` schema (D-36) | Contract test only until a sponsor asks |
| Dispute workflow | New | Nothing institutional does this; the design doc says BI tools do it badly | State machine, routing predicates, outcomes, recompute |

Rebuild justification: the only "rebuild" candidate is the hosted view, where the design doc recommended the BI tool (C) and the technical design chose a small Flask app (D-04). The reason given is one SSO mapping and one security review instead of two, and no case-level PHI in the BI tool. That is a defensible deviation and it is recorded; the cost is that the department owns a web app's security lifecycle (Section 10).

### 0C Dream state mapping

```
CURRENT STATE                    THIS PLAN (M0 to M7)                        12-MONTH IDEAL
-------------                    --------------------                        --------------
Five silos, five owners,   --->  M0: measure co-surgeon rate,          --->  Every surgeon opens their
five definitions.                hand one surgeon their list,                own numbers any time; every
No case list behind any          hold step zero.                             number has a list, a
number. No dispute path.         M1: four OR-log numbers by email,           definition version, a trend,
Patient-experience twice         reconciled to periop, own case list,        a spread with five peers,
a year. Arguments at             dispute by reply, decision on the           a dispute button on every
faculty meeting about            row, one-command close.                     row; sustained overrides
whose number is right.           M2: hosted view behind SSO with             flow back to feed owners
                                 authorization and audit.                    monthly; the semiannual
                                 M3 to M7: one feed at a time as             patient-experience slide
                                 each owner and gate clears.                 and the annual review
                                                                             packet are generated from
                                                                             the ledger; a second site
                                                                             is on the same ledger; no
                                                                             composite, no rank, ever.

Direction: toward the ideal. The plan is the ideal's first four modules
(ledger, definitions as code, suppression, disputes) built on the one feed
that exists. What it does not move toward: division and site views (OQ-52,
no specification) and department outputs generated from the ledger (P8's
survival story; no requirement row exists for the slide or the packet).
```

### 0D Alternatives

Called only where a decision was required. Each decision below is in the ledger with its options and the auto-chosen answer. Kind-note: most candidate expansions differ in kind, not coverage, so no completeness score is given unless options differ in coverage.

### 0E Mode selection

Heuristic: greenfield, so SCOPE EXPANSION is auto-recommended. Planned file count is not a usable signal here (no files exist; the technical design's repository layout names roughly 90 modules, all new), so the count-based SCOPE REDUCTION trigger does not apply to a plan that is itself the full build.

**Recommendation: SCOPE EXPANSION, because** the PRD's 112 requirement rows already cover every one of the brief's 25 items and its six ground rules, and the non-goals table forbids the only large additions anyone could propose (composite, rank, target, leader views, hand-entered complications). Expansion therefore cannot mean more metrics or more surfaces. It means completeness inside the accepted M0 and M1 blast radius (P1, P2): the plan's own gate table shows places where a stated guarantee has an escape hatch (`--reconcile-skip` against R-84), where one person is a single point of failure for a 14-day promise (the analyst), and where the surgeon's 30-second read of the monthly email could be made obviously better (a "what changed" block). Holding scope would run the same 11 sections but surface none of those; reduction would cut a plan whose milestones are already gated one feed at a time.

Note on autoplan: the autoplan pipeline forces its CEO phase into SELECTIVE EXPANSION. The practical difference here is nil: every candidate is dispositioned individually either way, and the brief's non-goals cap the ceiling. SCOPE EXPANSION was taken because the task's heuristic names it for greenfield; recorded in Headless decisions.

**Auto-decided review mode -> SCOPE EXPANSION** (provenance: greenfield rule; no explicit user words). Selecting the mode approves no scope change.

### 0F Expansion framing

Ten candidates prepared for 0G. Effort is given on both scales (human team / AI-assisted). Blast radius = files the M1 plan already names plus their direct importers; "under one day AI-assisted" per the autoplan rule (<5 files, no new infrastructure).

| # | Candidate | User experience after | Concrete addition | Effort (human / AI) | Risk | Impact |
|---|---|---|---|---|---|---|
| E1 | Backup analyst as a named role | A surgeon's dispute is acknowledged inside two business days even when the analyst is out; a gate can be confirmed by a second identity the runbook names | Section 4 role row; new R-114 in 7.11; R-88 alerts to both; goal G6 adds one backup dry run | S (~2 h / ~5 min) | low | High: removes the single point of failure on every M1 deadline |
| E2 | `--reconcile-skip` restricted to metrics periop does not report; a late or missing periop report holds publish | The surgeon never sees a wedge number that periop's report contradicts; a late month shows as a stale "last refreshed" | R-84 amended; the day-10 miss lands on the F-112 checklist | S (~1 h / ~5 min) | medium: trades goal G5 freshness for goal G1 reconciliation in a late month | High: keeps D6 a guarantee instead of a default |
| E3 | Restatement notice in the next email for every restatement category | The surgeon learns from the email, not from a moved trend point, that October's FCOT was restated and why | R-98 widened from definition changes to all eight restatement categories (R-100) | S (~2 h / ~10 min) | low | Medium: closes a silent-change path |
| E4 | Adoption denominator = delivered emails | Goal G2 is measured against surgeons who received the email, with bounces reported | R-95 and section 14 amended | S (~1 h / ~5 min) | low | Medium: the kill criterion cannot be tripped by a bounce |
| E5 | Zero-dispute interpretation at month three | If nobody disputes, the interview records whether each surgeon checked the list and found nothing, or did not check | R-95 interview question | S (~30 min / ~2 min) | low | Medium: goal G3 stops conflating "no disputes" with "trust" |
| E6 | "What changed since last month" block at the top of the email | The surgeon reads five lines and knows whether to open the CSV: decisions on their disputes, restated points, a definition version change, new cases | New R-115 in 7.12; section 9.1 bullet; `render.py` and the template | S (~1 day / ~30 min) | low | High: the 30-second read |
| E7 | Structured reply template in the email body | The surgeon copies three labelled lines (Case id, Field, What happened); the analyst enters it without guessing; the no-identifiers instruction sits on the line the surgeon fills in | Section 9.1 bullet; R-94 | S (~1 h / ~5 min) | low | Medium: faster intake, fewer `awaiting_row` holds, less PHI in replies |
| E8 | Preview diff in `publish --dry-run` | Before sending, the analyst sees per surgeon which tiles changed state since last month (shown to suppressed, spread on to off, peer count changed) and catches a roster error before 40 emails go out | New R-113 in 7.10; `publish/status.py` or a new `preview_diff.py` | M (~2 days / ~1 h) | low | High: the risk table's "roster errors" row gets a pre-send check |
| E9 | First-send rehearsal | Before the first real send, the whole runbook runs on the synthetic department through the real relay to the analyst's and backup's own mailboxes | R-82 and the M1 gate in section 13 | S (~2 h / ~5 min) | low | Medium: the first thing a surgeon receives has been received by someone first |
| E10 | Goal G1 wording matches TA-06 | The success criterion can be met when periop's report carries only two of the four wedge numbers | Section 3.1 goal G1 | S (~15 min / ~1 min) | low | Medium: an unmeetable criterion is a criterion nobody measures |

Larger candidates considered and framed (X-series) are dispositioned in 0G.

### 0G Mode-specific analysis and per-item dispositions

**10x check.** 10x value for 2x effort exists in one place: the email's first five lines (E6). Everything else in the plan is already the 10x version of a dashboard (ledger, dispute loop, reasons instead of blanks); adding to it would be 1.1x for 1.5x.

**Platonic ideal.** The best engineer with unlimited time and perfect taste would build exactly the ledger and the dispute loop the technical design describes, and would spend the remaining time on two things: the surgeon's first 30 seconds with each email (E6, E7) and the analyst's last five minutes before pressing send (E8, E9). They would not add a metric, a chart type or a leader view before month three.

**Delight scan (at least five 30-minute improvements).** d1 "what changed" block (E6, accepted); d2 structured reply lines (E7, accepted); d3 the subject line already carries "last refreshed" (exists, F-83); d4 the CSV's first comment line already carries the effect notices (exists, D-32); d5 a "resend my last email" reply class (deferred, X6 below); d6 "history from <date>" on short trends (exists, F-43); d7 the definitions appendix in the email body (exists, D-33). Two new, five already in the plan: the catalogue did most of this work.

**Per-item dispositions.** Rule applied: in blast radius and under one day AI-assisted -> auto-approve (P2); outside -> defer; duplicate of existing -> skip (P4); borderline or a real tradeoff -> Taste, auto-chosen with the recommended option and flagged for the human.

| # | Candidate | Options | Chosen | Classification | Reason |
|---|---|---|---|---|---|
| E1 | Backup analyst | A) Add B) Defer C) Skip | A (recommended) | Mechanical | In blast radius (roles, R-88); the technical design already assumes the role in six places; P1 |
| E2 | Reconcile-skip restriction | A) Restrict and hold publish (recommended) B) Keep the skip with a note C) Skip the metric only | A | Taste (flagged) | Preserves R-84 and D6 as written ("or the run stops"); the cost is a late month under goal G5, which the checklist records. B weakens a stated guarantee; C is A for metrics periop does not report and is included in A |
| E3 | Restatement notice | A) Add B) Defer C) Skip | A (recommended) | Mechanical | Prime directive: zero silent failures; in blast radius (R-98, `render.py`) |
| E4 | Adoption denominator | A) Add B) Skip | A (recommended) | Mechanical | Measurement correctness; one sentence |
| E5 | Zero-dispute question | A) Add B) Skip | A (recommended) | Mechanical | Measurement correctness; the interview already exists (F-91) |
| E6 | "What changed" block | A) Add B) Defer C) Skip | A (recommended) | Mechanical | In blast radius (template, `render.py`); P1; under one day |
| E7 | Reply template | A) Add B) Skip | A (recommended) | Mechanical | One template block; reduces `awaiting_row` |
| E8 | Preview diff | A) Add (recommended) B) Defer to M2 C) Skip | A | Taste (flagged) | New analyst tool, M effort, still under one day AI-assisted and inside `publish/`; the human may prefer B to keep M1 smaller |
| E9 | First-send rehearsal | A) Add B) Skip | A (recommended) | Mechanical | Deployment safety; no code |
| E10 | Goal G1 wording | A) Amend B) Keep | A (recommended) | Mechanical | An unmeetable criterion |
| X1 | Hosted view at M1 instead of email | A) Add B) Defer C) Skip | C | Mechanical | The design doc ruled it out (governance, P7); would reverse an active decision |
| X2 | Block utilization in the wedge | A) Add B) Defer C) Skip | C | Mechanical | Design doc challenge 24: second extract, second owner, not named (OQ-34) |
| X3 | Second site in M1 | A) Add B) Defer C) Skip | B | Mechanical | Goal G7 makes a second site the greenlight evidence after month three, not before; outside blast radius (new feed owner) |
| X4 | Automated nightly ETL with failed-run alert | A) Add B) Defer C) Skip | B | Mechanical | The design doc marks it "required for B"; the M1 close is a human-run command by design (goal G6) |
| X5 | Chair's monthly counts-only digest | A) Add B) Defer C) Skip | C | Mechanical | Contradicts D5 (no leader view in the wedge) and duplicates F-98 whose reader is OQ-50 |
| X6 | "resend" reply class | A) Add B) Defer C) Skip | B | Mechanical | `publish --resend` exists for the analyst; a surgeon-triggered path is a nicety outside month one to three's contract |
| X7 | Show the surgeon both FCOT counts (brief assumption and institutional) | A) Add B) Defer C) Skip | C | Mechanical | Two numbers for the same metric is the failure design doc challenge 3 exists to prevent (D6) |
| X8 | Print or export for annual review | A) Add B) Defer C) Skip | B | Mechanical | Already OQ-46; no owner answer yet |

Holds (accepted work the review considered deferring and kept): the `pub` schema contract test written at M2 but not enabled (D-36): keep, it is the only sanctioned path to division and site aggregates. RLS as a backstop behind the tested matrix (S-04): keep, defense in depth for PHI is not over-engineering. Ten database roles at M1 on one workstation: keep, the grants check (G17) makes the cost visible and the security review will ask for it anyway.

---

## Decision ledger

Status values: accepted (headless), deferred, declined, unresolved. "Accepted (headless)" means auto-chosen under the spawned-session rule; it is not human approval. The plan stays DRAFT.

| ID and owner | Contract and evidence | Current | Proposed | Status | Exact approval and scope |
|---|---|---|---|---|---|
| L-01 (Step 0) | Review depth | none | implementation-ready (default) | accepted (headless) | Task text; applies to every section |
| L-02 (0E) | Review mode | none | SCOPE EXPANSION | accepted (headless) | Greenfield rule; approves no scope change |
| L-03 (E1, 7.11) | Backup analyst exists in the technical design (status email, dump ACL, gate confirmer) but not in PRD section 4, goal G6 or R-88 | Single named analyst | Section 4 row; R-114; R-88 to both; goal G6 adds one backup dry run | accepted (headless) | Mechanical, P1+P2; scope: roles, alerts, goal G6 only |
| L-04 (E2, 7.10) | R-84 says "or the run stops"; technical design `--reconcile-skip --note` publishes anyway (TA-06) | Skip allowed for any period | Skip allowed only for metrics periop's report does not carry; a missing or late report holds publish; miss recorded on the F-112 checklist | accepted (headless), Taste flagged | Preserves a stated requirement; the human may prefer freshness over reconciliation in a late month |
| L-05 (E3, 7.12) | R-98 notifies only on definition change; R-100 logs eight restatement categories | Trend marker only | R-98 covers every restatement category with metric, period, reason and both values | accepted (headless) | Mechanical; zero silent failures |
| L-06 (E4, 14) | Goal G2 denominator unstated when a send bounces | Roster count implied | Delivered emails; bounces reported | accepted (headless) | Mechanical; R-95 and section 14 |
| L-07 (E5, 14) | Goal G3 needs two disputes; zero disputes is ambiguous | Not measured | Interview records checked-and-found-nothing vs did-not-check | accepted (headless) | Mechanical; R-95 |
| L-08 (E6, 9.1) | No summary at the top of the email | Tiles in bucket order after the preamble | R-115 "what changed" block | accepted (headless) | Mechanical; email template and `render.py` |
| L-09 (E7, 9.1) | Reply instructions are prose | Prose paragraph | Three labelled lines to copy | accepted (headless) | Mechanical; R-94 and 9.1 |
| L-10 (E8, 7.10) | No pre-send state diff against the prior period | Analyst reads one email and the grid | R-113 preview diff | accepted (headless), Taste flagged | Borderline size; the human may defer to M2 |
| L-11 (E9, 13) | No rehearsal before the first real send | None | R-82 and M1 gate: full run on synthetic data through the real relay to the analyst and backup mailboxes | accepted (headless) | Mechanical |
| L-12 (E10, 3.1) | Goal G1 requires all four wedge numbers to match periop; TA-06 and OQ-54 say periop may not report two of them | "The four wedge numbers match" | "Every wedge number periop's report carries matches; a number it does not carry is labelled not reconciled and checked against the M0 recount" | accepted (headless) | Mechanical |
| L-13 (S3, 7.12) | CSV cells from source text (procedure, reason as stored) can begin with `=`, `+`, `-`, `@` | Unstated | R-94: formula-leading cells are escaped so the CSV is safe to open in Excel | accepted (headless) | Mechanical; one function in `csv_rows.py` |
| L-14 (S4, 7.6) | A second reply on the same record and field while a dispute is open would file a second dispute and consume the re-file (two-filing limit) | Unstated | R-64: attaches to the open dispute as added evidence; only after a decision does a reply count as a re-file | accepted (headless) | Mechanical; `intake.py` |
| L-15 (S2, 7.6) | Technical design handles a reply naming no row (`awaiting_row`, ask for the row); R-59 does not say so | Silent in the PRD | R-59 states the acknowledgement asks for the case id and holds the reply as unentered | accepted (headless) | Documentation of existing mechanism |
| L-16 (S4) | No named mechanism serializes `close` for period N+1 against `dispute decide --recompute` on period N (M2 app calls recompute in-request, D-26) | Unstated | Per-period advisory lock or a documented single-writer rule | deferred to `/plan-eng-review` | Mechanism choice belongs to the eng gate (P5+P3); task T7 |
| L-17 (S2) | CLI exit codes cover gates, rules, input and environment; an unexpected exception has no named code or run status | Unstated | Exit 4, `run.status = 'error'`, log path on the run row, ids only | deferred to `/plan-eng-review` | Task T8 |
| L-18 (S3) | A decision by email reply is the record in M1; sender authenticity relies on MGB internal mail | Sender address matched to the adjudicator's | Information security confirms internal-mail authenticity at the M2 review; M1 mitigation: the analyst transcribes with the message id kept | unresolved (owner: information security) | Not a PRD change; recorded as an unknown risk |
| L-19 (S4) | A surgeon on approved leave for a whole month receives an email with zero counts and "Not shown: 0 first cases" | Brief silent; PRD silent | Owner decides whether to send, skip, or send with a leave note | unresolved (owner: definitions owner) | Not added to the PRD's OQ register (the register lives in the catalogue); listed in Unresolved decisions |
| L-20 to L-27 | X1 to X8 | see 0G | see 0G | declined (X1, X2, X5, X7); deferred (X3, X4, X6, X8) | 0G table |
| L-28 (Outside voice) | Independent second opinion | not run | run after the 11 sections as a fresh-context Claude subagent (not an outside model) | completed; coverage native only | Every consensus cell N/A; five verdict disagreements to Taste; dispositions T-01 to T-10 at the end of this file; no clean-review credit |

Approval readiness: checked headless. Every accepted row carries an auto-decision reference (0G table) and the PRD applies only that row's stated scope; declined, deferred and unresolved rows produced no PRD change. No human approval exists for any row.

---

## Section 1: Architecture review

Current scope (mode handoff): SCOPE EXPANSION; accepted rows L-03 to L-15; deferred L-16, L-17; unresolved L-18, L-19.

**Dependency graph (M1).**

```
 periop files (ticket) ---> loaders/ ---> raw ---> src ---> attribution/ ---> ledger.attribution
 periop report (ticket) --> loaders/periop_report ---------------------------> ledger.periop_report
 roster (csv/set) --------> loaders/roster --------------------------------> ledger.roster_membership
                                                                                     |
 definitions/<metric>/vN.py --register--> ledger.metric_definition_version           |
                                                   |                                 v
                                                   +------> engine/close --------> metric_value, suppression_decision,
                                                                 |                 peer_group_snapshot, reconciliation_result
                                                                 |                 run (gate results)
                                                                 v
                                             publish/ (render -> scan -> own_records -> gates -> directory -> transport)
                                                    |                                   |
                                                    v                                   v
                                             surgeon mailbox (email + CSV)      periop contact (override list)
                                                    |
                                             reply (dispute mailbox) ---> disputes/intake (analyst CLI) ---> dispute, dispute_event
                                                                                       |
                                                                     decide ---> record_override ---> engine/recompute ---> metric_value (adjudicated)
                                                                                                                              |
                                                                                                             notify decision email; next month's email
```

**Four data paths for the M1 close.**

```
 HAPPY:  files present, ticket, as-of -> load ok -> attribute (0 exceptions) -> close: G3 ok, G4 ok, G5 ok,
         G6 every delta explained, G7 rows = denominators, G8 every cell has value or reason -> run ok -> publish
 NIL:    no periop file for the period -> close: G3 feed_health = missing -> every wedge tile carries
         "<feed> for <period> not received as of <date>" (R-85) -> publish is allowed with reasons, never zeros
         [after L-04: if the periop REPORT is missing, publish holds; if the EXTRACT is missing, reasons publish]
 EMPTY:  file present, zero rows -> G3 partial/empty -> reason on every wedge tile, no metric_value
         (tests/loaders/test_feed_health.py) -> same as NIL for the surgeon
 ERROR:  wrong grain, missing --ticket, unreadable -> exit 2 or 3 at load; nothing written -> analyst fixes the command
         (unexpected exception mid-compute: no named path; L-17)
```

**State machines.** Two new stateful objects: the dispute (technical design state diagram: filed -> with_chief | with_chair | with_direct_leader -> sustained_annotated | sustained_source_corrected | not_sustained | definition_question -> correction_requested -> correction_confirmed; withdrawn from any pre-decision state; a "held" non-state for route_undefined) and the period run (loaded -> closed (ok | gate failed) -> published; `--restate` reopens). Impossible transitions and what prevents them: decide-after-decide (refused by `decide()` and the immutable event trigger); a third filing on one record by one filer (counted in `file_dispute()`); publish on a period whose close failed a gate (G10, exit 2); an UPDATE on `audit_log` (trigger). The period run has no diagram in the PRD; the technical design's monthly sequence is the diagram. Adequate.

**Coupling.** Everything couples to the ledger schema and to the definition contract; that is the point (one function per metric, same function for CLI and web, D-05). New coupling introduced by accepted items: E6 and E8 read `metric_value`, `suppression_decision` and `dispute` for two periods instead of one; no new tables.

**Scaling.** 10x (400 surgeons, 50,000 cases a month): pandas per (clinician, metric) still fits one machine (TA-13); the payload scan and render for 400 emails would take under an hour. 100x: the single VM and the synchronous recompute in the decide request (D-26) break first; a queue would be needed. Not a concern for a one-site pilot.

**Single points of failure.** (1) The analyst: every M1 deadline runs through one calendar and one mailbox. Addressed by L-03. (2) The workstation at M1 holding the only live database: addressed by the off-host dump and restore drill (OQ-61), which cannot be called done until information security names the location. (3) Periop's ticket: if the extract stops, nothing publishes, which is the correct behavior (reasons, never zeros). (4) The SMTP relay: `.eml` fallback (D-30).

**Security architecture per endpoint (M1 has no endpoints; M2).** Who can call what is the technical design's authorization matrix (viewer x role x resource), tested, with RLS behind it. For M1 the "endpoints" are commands: every command runs as the analyst's login with `SET ROLE` per stage (G17). The dispute mailbox is the one inbound surface: any MGB sender can write to it; what a message can change is bounded by the analyst's transcription and by the sender-address check on decisions (L-18).

**Production failure scenarios per integration point.**

| Integration | Realistic failure | Handled? |
|---|---|---|
| Periop extract | Column renamed in a new export | G2 marks dependent metrics "not computable: <field> not in extract"; publish proceeds with reasons. Yes |
| Periop report | Report arrives after business day 10 | After L-04: publish holds, day-10 miss on the checklist. Before L-04: `--reconcile-skip` would have published unreconciled numbers. Now yes |
| Directory | LDAPS unreachable at send time | G13 blocks every send; D-34 fallback loads a directory export as a feed. Yes, with a manual step |
| SMTP relay | Refuses after 20 of 40 sends | `published_at` not written; delivery rows kept; `--send` resumes with surgeons lacking a delivery row (F-90 AC 7). Yes; test gap in Section 6 |
| Dispute mailbox | Surgeon replies with a colleague's case id | `awaiting_row` if no match; if it matches another surgeon's record, `file_dispute()` must refuse because the filer is not the credited clinician; the technical design's I12 pins a dispute to a record but the PRD does not say the filer must be the credited surgeon in the email months. See Section 3 |
| Roster | Chief mapping missing for one surgeon | G9 warns, does not stop; a dispute from that surgeon is held `route_undefined` on the checklist. Yes |

**Rollback posture.** Before the first send: nothing to roll back; re-run `close` after a fix. After a send: an email cannot be recalled. Rollback is a restatement (R-100) plus the notice accepted in L-05, and, for a misdirected send, the incident procedure (PS-8, OQ-58). Time: one close and one publish, under 10 minutes on the workstation for the wedge.

**What would make this elegant to a new engineer.** The technical design's rule "surfaces only render what the ledger holds" and "one function per metric" are the two sentences to keep on the README. **Platform infrastructure:** the `pub` schema contract (D-36) and the source registry (F-103) are what later feeds and any division view plug into.

Findings:

- [WARNING] (confidence: 8/10) R-84, section 10.4 `periop_report` row, TA-06: `--reconcile-skip --note` lets a period publish with wedge numbers that never reconciled, contradicting R-84 ("or the run stops") and D6. Resolved by L-04 (R-84 amended).
- [WARNING] (confidence: 7/10) section 3.1 goal G1 versus TA-06 and OQ-54: goal G1 cannot be met if periop's report carries only First-case on-time start (FCOT) and Same-day cancellations you could have prevented. Resolved by L-12.
- [WARNING] (confidence: 7/10) section 4, goal G6, R-88: the backup analyst the technical design relies on is not a PRD role, is not alerted, and is not part of the survival criterion. Resolved by L-03.
- [OK] Everything else examined (component boundaries, the four paths, the two state machines, coupling, rollback) matches the technical design and the journeys; the run gates table is the strongest part of the plan.

Decision gate: Analyze done (three false-or-incomplete claims corrected above); Resolve through L-03, L-04, L-12; Apply: PRD amended (section 3.1, section 4, R-84, R-88, R-114).

---

## Section 2: Error and rescue map

No LLM or third-party call exists in the runtime path (technical design "Security controls summary"), so the malformed, empty, hallucinated and refusal modes do not apply. Catch-all handlers: none are specified; the web app's "unhandled exception renders load-failure with a correlation id" is a top-level handler with a user-visible message and an audit row, which is the acceptable form. The CLI has no equivalent statement (L-17).

```
  METHOD/CODEPATH                    | WHAT CAN GO WRONG                          | EXCEPTION CLASS (proposed names)
  -----------------------------------|--------------------------------------------|----------------------------------
  loaders.load(feed, file)           | file missing / unreadable                  | InputError (exit 3)
                                     | missing --ticket or --as-of                | RuleError (exit 2)
                                     | wrong grain (one primary column)           | accepted with panel_roles=false
                                     | same sha256 already loaded                 | no-op (exit 0)
                                     | required column absent                     | FieldMissing -> not_computable (G2)
                                     | column that looks like notes (>120 chars)  | LoaderRefusal (exit 2)
  attribution.run(period)            | blank / multiple / out-of-dept primary     | AttributionException row (G4 blocks close)
                                     | co-surgeon rate > 5% in a subspecialty     | printed; P2 withdrawal is a human decision
  engine.close(period)               | month not ended                            | RuleError (exit 2)
                                     | feed missing / partial                     | FeedHealth -> reasons (G3)
                                     | reconciliation delta unexplained           | GateFailed G6 (exit 1)
                                     | row count <> denominator                   | GateFailed G7 (exit 1)
                                     | blank reason on a suppressed cell          | GateFailed G8 (exit 1)
                                     | gate.* row missing for a bucket            | RuleError G5 (exit 2)
                                     | already published without --restate        | RuleError G10 (exit 2)
                                     | pandas / psycopg failure mid-stage         | UNNAMED (L-17)
  publish.send(period)               | close not ok                               | RuleError (exit 2)
                                     | channel gate unsigned or unconfirmed       | RuleError G11 (exit 2)
                                     | payload scan hit on one artifact           | GateFailed G12 (that send blocked, named)
                                     | record_ref not the recipient's             | GateFailed G14 (exit 1)
                                     | forbidden pattern (rank, composite)        | GateFailed G15 (exit 1)
                                     | directory mismatch or unreachable          | G13 blocks that surgeon (or all, if down)
                                     | relay refuses mid-run                      | EnvironmentError (exit 4); resume later
  publish.ingest_ndr()               | IMAP unreachable                           | EnvironmentError (exit 4); bounce unseen until next run
  disputes.intake(reply)             | no case id in the reply                    | awaiting_row; ask for the id (L-15)
                                     | case id not credited to the sender         | must refuse (Section 3 finding)
                                     | second reply on an open dispute            | UNSTATED before L-14; now attaches
                                     | third filing on one record                 | refused (F-62 AC 2)
                                     | claim text with an identifier pattern      | refused at entry, capped 1,000 chars (S-05)
  disputes.route()                   | no chief mapped / chair's own record       | route_undefined; held on checklist
  disputes.decide()                  | actor is not the adjudicator               | refused (F-58 AC 3)
                                     | decision already recorded                  | refused (immutable event)
                                     | decision reply from a non-adjudicator addr | sender_kind <> adjudicator -> refused (L-18)
  engine.recompute(dispute)          | fails after the decision event is written  | listed on the daily checklist ("decided disputes whose recompute failed")
                                     | overlaps a close on another period         | UNNAMED mechanism (L-16)
  web (M2) any handler               | unhandled exception / statement timeout    | load-failure page, correlation id, audit row
  -----------------------------------|--------------------------------------------|----------------------------------

  EXCEPTION CLASS            | RESCUED? | RESCUE ACTION                                  | USER SEES
  ---------------------------|----------|------------------------------------------------|-----------------------------------
  InputError (3)             | Y        | print cause; nothing written                   | analyst: message; surgeon: nothing
  RuleError (2)              | Y        | print rule; nothing written; runbook: do not    | analyst: rule named
                             |          | work around                                     |
  GateFailed (1)             | Y        | print gate on last line; nothing surgeon-facing | analyst: gate; surgeon: stale
                             |          | written; fix data or record a delta             | "last refreshed" if the month slips
  FeedHealth (G3)            | Y        | worded reason on every affected tile            | surgeon: "<feed> for <period> not received"
  FieldMissing (G2)          | Y        | "not computable: <field> not in extract"        | surgeon: the reason on the tile
  G12 payload hit            | Y        | that send blocked; artifact and field named     | surgeon: no email until fixed; analyst: named
  G13 directory              | Y        | that surgeon blocked; checklist                 | surgeon: nothing; analyst: listed
  EnvironmentError (4)       | Y        | stop; resume later; .eml fallback for relay     | analyst: call support; surgeon: later email
  awaiting_row               | Y        | ack asks for the case id; counted unentered     | surgeon: ack email (L-15)
  duplicate reply            | Y after  | attach to open dispute                          | surgeon: ack naming the existing dispute id
                             | L-14     |                                                 |
  recompute failed after     | Y        | daily checklist item; re-run `recompute`        | surgeon: decision email delayed; analyst: listed
  decision                   |          |                                                 |
  UNNAMED mid-compute        | N <- GAP | proposed: exit 4, run.status='error', log path  | analyst: traceback in log; surgeon: nothing
  (L-17)                     |          |                                                 | (never a partial publish because publish
                             |          |                                                 |  checks run.status)
  close/recompute overlap    | N <- GAP | proposed: per-period advisory lock              | nobody, silently (L-16)
  (L-16)                     |          |                                                 |
```

Findings:

- [WARNING] (confidence: 6/10) technical design "The run pipeline": an unexpected exception inside `close` or `publish` has no named exit code or run status. Publish cannot proceed (it checks `run.status`), so the surgeon-facing risk is nil, but the analyst's runbook has no row for it. Deferred to eng review as T8 (L-17).
- [WARNING] (confidence: 6/10) R-29, D-26: a `recompute` on period N overlapping a `close` on period N+1 has no named serialization mechanism. At M1 one analyst runs both serially; at M2 the app's in-request recompute can overlap. Deferred to eng review as T7 (L-16). Failure Modes Registry marks it a CRITICAL GAP until a mechanism is named, because it is unrescued, untested and silent.
- [OK] The gate scheme rescues every named failure with a user-visible message or a named analyst action, and the "reasons, never zeros" rule holds on every nil and empty path examined.

Decision gate: Analyze done; Resolve: L-14, L-15 applied to the PRD; L-16, L-17 deferred with owners; Apply: R-59, R-64 amended.

---

## Section 3: Security and threat model

| Finding | Threat | Likelihood | Impact | Mitigated by plan? |
|---|---|---|---|---|
| Inbound dispute mailbox | Any MGB sender writes a "decision" from a chief's address; the reply is the record in M1 | Low (internal Exchange; TA-14) | High (a forged sustained decision moves a record and a count) | Partly: sender address must match the adjudicator (`sender_kind`); the analyst transcribes and keeps the message id. Internal-mail authenticity is an MGB control nobody has confirmed. Owner: information security (L-18) |
| Filer identity in email months | A surgeon replies quoting a case id credited to a colleague (typo or deliberate) and the analyst files it | Medium (typo) | Medium (a dispute on someone else's record; provenance shown to a chief) | Not stated in the PRD. The technical design pins a dispute to one record and the intake runs as the analyst; whether `file_dispute()` checks that the reply's sender is the credited clinician is not written. Finding below; R-59 amended |
| CSV formula injection | A source cell (procedure name, reason as stored) begins with `=`, `+`, `-` or `@`; Excel executes it on the surgeon's laptop | Low | Medium | Not stated. L-13: R-94 requires formula-leading cells to be escaped |
| IDOR (M2) | A surgeon edits a record_ref in a URL | Medium | High | Yes: opaque type-prefixed tokens (D-19), viewer scoping, RLS backstop, identical refusal payloads for "not yours" and "missing" |
| PHI in raw | A feed carries an MRN column | Medium | High | Yes: column allowlist at load (S-03), test |
| PHI in outbound artifacts | Procedure text carries a name | Low | High | Yes: G12 value scan on the one free-text column; a hit blocks that send |
| Secrets | `.env` on the workstation with the migrate credential | Medium at M1 | Medium | Partly at M1 (S-01 fixed at M2); the M1 interim is declared to the privacy office (TA-02) |
| Dependency risk | pandas, psycopg, Jinja2, Flask, pytest | Low | Medium | Mainstream; no third-party SaaS; pins in `pyproject.toml`; a mirrored index (TA-08) |
| Audit | Every open, refusal, decision and restatement logged; hash-chained export off-host | n/a | n/a | Yes (PS-3, OQ-61 pending location) |
| Prompt injection | No LLM in the runtime path | n/a | n/a | Not applicable |
| Input validation (M2 forms) | claim text: nil, empty, too long, unicode, HTML | Medium | Low | Yes: scanned for identifier patterns, capped at 1,000 characters (S-05); structured survey claims with no free text (F-72). HTML escaping is Jinja2's default and should be named in the eng review |
| Data classification | PHI-derived, surgeon-identified; peer-review privilege for QI-derived rows undecided | n/a | High | Segregated schemas (`restricted`, `privileged`); OQ-62 open |

Findings:

- [WARNING] (confidence: 7/10) R-59 and technical design "M1 intake": the PRD does not require that a reply-filed dispute is accepted only when the sender is the clinician credited on the quoted record. The hosted view scopes this by construction (F-86); the email months rely on the analyst. Resolved by amending R-59 (L-15 widened): the intake refuses a case id not credited to the sender and answers with the `awaiting_row` acknowledgement.
- [WARNING] (confidence: 7/10) R-94, section 9.1: CSV formula injection unaddressed. Resolved by L-13.
- [WARNING] (confidence: 5/10) technical design "Who sees what": decision-by-reply authenticity depends on MGB internal-mail controls that no document confirms. Left unresolved with an owner (L-18); no PRD change, because the mitigation is an institutional control, not a product requirement.
- [OK] Attack surface at M1 is one mailbox and one workstation; at M2 one app behind SSO with a tested matrix and RLS. Authorization, audit, PHI minimization and governance-as-data are specified to a level most production systems never reach.

Decision gate: Analyze done; Resolve: L-13, L-15; Apply: R-59, R-94 amended.

---

## Section 4: Data flow and interaction edge cases

**Data flow with shadow paths (M1 close and publish).**

```
 INPUT (periop files, ticket, as-of)
   | nil file ---------------> exit 3, nothing written
   | empty file -------------> G3 empty -> reasons on tiles
   | wrong type (one-column)-> accepted, panel_roles=false, shared flag not_computable
   | too long (notes column)-> loader refusal, exit 2
   | duplicate sha ----------> no-op
   v
 VALIDATION (allowlist, field checklist, grain)
   | column missing ---------> dependent metrics not_computable (G2)
   | stale as-of ------------> accepted; "as of" shown from the owner's date (R-101)
   v
 TRANSFORM (attribute, compute, suppress, peers, trend)
   | exception unresolved ---> G4 stops close
   | delta unexplained ------> G6 stops close
   | rows <> denominator ----> G7 stops close
   | reason blank -----------> G8 stops close
   | roster mid-period ------> peer groups as of period end; new suppression text carries the as-of (R-41)
   | opted-out viewer -------> self-only; excluded from every group (R-37)
   v
 PERSIST (metric_value, suppression_decision, peer_group_snapshot, run)
   | conflict (period already published) -> G10 exit 2 unless --restate
   | lock with a concurrent recompute --> UNNAMED (L-16)
   v
 OUTPUT (render -> scan -> own-records -> gate -> directory -> send)
   | scan hit ---------------> that send blocked, named
   | not the recipient's ----> G14 stops
   | directory mismatch -----> that send blocked
   | relay dies mid-run -----> resume; published_at unset until the last send
   | bounce -----------------> logged; retried only after an identity fix
```

**Async ordering proof.** Invariant: for a given (clinician, metric, period, site, basis) there is exactly one current `metric_value` row, and every published artifact's hash matches the rows it was rendered from. Boundary: from the start of `engine.close(N+1)` to its run row, and from the start of `recompute(dispute on N)` to its restatement rows. Both write `metric_value` for the same clinician (different periods) and both rebuild `peer_group_snapshot` and trend markers that span periods. Schedule A (close finishes, then recompute): trend markers rebuilt by recompute include N+1; consistent. Schedule B (recompute writes restatement rows for N and its trend markers while close is mid-way through the trend stage for N+1): the trend stage of close may read N's pre-restatement rows and write a marker set that omits the restated point. Mechanism preventing B: none named. At M1 the single analyst runs commands one at a time (a human serialization, not a mechanism). At M2 the app's in-request recompute (D-26) can start while the analyst's close is running. Regression proof required: a test that pauses `close` after the compute stage, runs `recompute` on the prior period, resumes, and asserts the restated marker is present and `is_current` is unique. Recorded as T7 for the eng review; CRITICAL GAP in the registry until the mechanism is named.

**Interaction edge cases.**

| Interaction | Edge case | Handled? | How |
|---|---|---|---|
| Surgeon replies to dispute | Reply names no case id | Y | `awaiting_row`; ack asks for it (L-15) |
| | Reply names a colleague's case id | Y after L-15 | Refused; ack asks for the surgeon's own case id |
| | Second reply on the same open dispute | Y after L-14 | Attaches as evidence; does not consume the re-file |
| | Reply after the decision, with new evidence | Y | One re-file linked to the first (R-64) |
| | Reply "seen" | Y | Logged, classified, no dispute (R-95) |
| | Reply quoting the whole CSV back (PHI in the mailbox) | Partly | The dispute mailbox is a PHI store with a retention class (S-05); the reply template (L-09) asks for three lines only |
| Chief decides by reply (M1) | Two replies with different decisions | Y | First recorded decision is immutable; the second is logged and the analyst asks |
| | Chief replies from a personal address | Y | `sender_kind <> adjudicator`; not a decision |
| M2 decide button | Double-click | Y | `decide()` refuses when `decision is not null` |
| | Navigate away during the 5-second recompute | Partly | Recompute is in-request (D-26); the decision event is written first, the recompute failure lands on the checklist; the page state after navigation is not described. Eng review item |
| Analyst runs `publish --send` | Relay dies at surgeon 20 of 40 | Y | Resume with surgeons lacking a delivery row; `published_at` unset until done |
| | Runs `--send` twice | Y | Second run finds delivery rows and sends nothing (needs the test named in Section 6) |
| | Roster error puts a surgeon in the wrong site | Partly | Chief's under-five summary before step zero (F-37); the preview diff (L-10) catches state changes month to month |
| Zero, large, changing lists | Surgeon with zero cases in a month | Y | Count 0 with an empty list for volume; "Not shown: 0 first cases this month; needs at least 4" |
| | Surgeon on leave for the whole month | Unstated | Email still sent with zeros; L-19 for the owner |
| | Surgeon leaves the department mid-month | Y | Roster end date; past periods stay; no further send (R-112) |
| | 12 months of history absent on first load | Y | "history from <date>" (R-45) |
| Jobs | A late periop correction after publish | Y | New load supersedes; restatement logged and marked (R-100); now also emailed (L-05) |
| | Override list to periop bounces | Y | Bounce logged; checklist |

Findings:

- [CRITICAL GAP] (confidence: 6/10) R-29, D-26, technical design "Recompute after a dispute": no mechanism serializes recompute against close. Unrescued, untested, silent. Deferred to eng review with a named regression test (T7); the CRITICAL GAP label stays until the eng review names the lock.
- [WARNING] (confidence: 7/10) R-64: duplicate reply on an open dispute consumes the two-filing limit. Resolved by L-14.
- [WARNING] (confidence: 5/10) R-94, R-112: a surgeon on approved leave for the whole month receives an all-zero email. Not a defect; a choice the brief does not make. Unresolved, owner named (L-19).
- [OK] Every other shadow path examined ends in a named gate, a worded reason or a refusal with an acknowledgement.

Decision gate: Analyze done; Resolve: L-14 applied, L-16 deferred, L-19 unresolved; Apply: R-64 amended.

---

## Section 5: Code quality review

No code exists; this section reviews the patterns the technical design commits to and the accepted additions.

- Organization: one package, one CLI, subsystem folders (`loaders/`, `attribution/`, `definitions/`, `engine/`, `disputes/`, `publish/`, `web/`). Views call the same functions the CLI calls (D-05). Fits.
- DRY: the reason catalogue (F-33) is the single source of every absent-cell string; the definition contract is the single source of cadence, min-n and comparator; the artifact model is rendered by every surface. The accepted E6 block must read those same rows, not re-derive state; stated in R-115.
- Naming: `metric_value`, `suppression_decision`, `peer_group_snapshot`, `record_override`, `correction_request` name what, not how. `_catalogue.py` and `_contract.py` are fine. One smell: run gates G1 to G18 and goals G1 to G8 share a prefix in the PRD; the PRD disambiguates in prose ("goal G1"). Keep the convention.
- Error handling: exit codes by class; no catch-all named. The web app's top-level handler is the acceptable shape.
- Over-engineering check: 18 gates, 10 roles, 12 suppression kinds in a fixed order, RLS plus a matrix. Each is traceable to a requirement or a security finding; none is an abstraction for a problem that does not exist yet. The one place to watch is `definitions/_contract.py`: a contract with `Kind.MIRROR`, `Kind.PACE`, `applicability()`, `year_average` and `availability` before any later feed exists could grow into a framework. Acceptable because every field maps to a brief item.
- Under-engineering: the M1 email-months intake is deliberately manual (analyst transcription). Not fragility, a recorded interim (D-25).
- Cyclomatic complexity: the routing predicates (three tests plus the survey setting) and the suppression order (12 kinds) are the two branchy places; both are tabled and tested by enumeration in the technical design. Fine.

Findings:

- [OK] Examined the module layout, the single-source rules, naming, the gate and exit-code scheme and the two branchy functions. Nothing flagged; the technical design's traceability pass already removed the naming drift (T-03 to T-11).

Decision gate: nothing to resolve; Apply: no change.

---

## Section 6: Test review

**Diagram of every new thing (M1) and its test.**

```
 NEW THING                               | TYPE        | IN PLAN?                          | HAPPY / FAILURE / EDGE
 ----------------------------------------|-------------|-----------------------------------|----------------------------------------------
 loaders (idempotent, allowlist, grain)  | unit+integ  | Y (tests/loaders/*)               | same file twice; mrn column; one-column shape
 field checklist -> not_computable       | integ       | Y (test_field_checklist)          | remove one column -> exactly the dependents
 feed health -> reasons never zeros      | integ       | Y (test_feed_health)              | empty; short; --accept-partial
 attribution + exceptions + co-surgeon   | unit        | Y (engine/)                       | blank primary; multi-panel; >5% printed
 definitions golden outputs              | unit        | Y (definitions/)                  | per version; brief values vs institutional
 registry hash refusal                   | unit        | Y (engine/)                       | edit a registered file -> exit 2
 suppression order + 100% reasons        | unit        | Y                                 | each kind; blank reason -> G8
 peer groups, opt-out, month one         | unit+integ  | Y (peers; test_month_one)         | attendee vs non-attendee; opt-out both directions: NAMED? see gap 2
 reconciliation gate                     | integ       | Y (test_reconcile; brief assumption does not reconcile) | delta explained; unexplained -> exit 1
 reconcile-skip restriction (L-04)       | integ       | N -> T3                           | skip refused for a metric periop reports
 recompute after decision                | integ       | Y (engine/)                       | as logged + as adjudicated; min-n crossing
 close vs recompute ordering (L-16)      | integ       | N -> T7                           | pause/resume schedule B
 render + catalogue strings              | unit        | Y (test_catalogue_strings)        | every absent-cell string is a key
 "what changed" block (L-08)             | unit        | N -> T5                           | decision, restatement, version change, none
 restatement notice (L-05)               | unit        | N -> T5                           | each of eight categories
 payload scan                            | unit        | Y (test_scan)                     | MRN; long free text; allowlisted passes
 CSV formula escape (L-13)               | unit        | N -> T4                           | cell starting with =, +, -, @
 own-records check G14                   | unit        | Y (test_own_records)              | another surgeon's record_ref
 channel gates G11                       | integ       | Y (test_gates)                    | four of five signed -> fifth refused
 G15 forbidden patterns                  | unit        | Y (test_what_this_is_not)         | a rank line fails
 directory resolution G13                | integ       | partly (F-90 AC 8 in features)    | mismatch blocks one surgeon only: NAME IT (T6)
 send resume after relay failure         | integ       | N -> T6                           | fail at 20 of 40; resume sends 20; --send twice sends 0
 last refreshed after a missed month     | unit        | Y (test_last_refreshed)           | closed-not-published keeps the old date
 dispute state machine                   | unit        | Y (test_state)                    | every legal; every illegal triple
 routing predicates                      | unit        | Y                                 | each test; route_undefined
 intake: awaiting_row, wrong filer,      | unit        | partly -> T6                      | no id; colleague's id; second reply on open
   duplicate reply (L-14, L-15)          |             |                                   |
 decision by reply, sender check         | unit        | Y (F-58 AC 3 reading)             | non-adjudicator address refused
 decision email + 14-day measurement     | integ       | Y (F-93)                          | day 13 vs day 15 in the trust report
 F-112 checklist                         | unit        | Y (status)                        | each deadline; business-day arithmetic: FLAKINESS, freeze time
 preview diff (L-10)                     | unit        | N -> T5                           | suppressed->shown; spread on->off; no change
 first-send rehearsal (L-11)             | manual      | N -> T9 (runbook step)            | synthetic department through the real relay
 audit immutability, grants drift        | integ       | Y (ops/)                          | UPDATE raises; extra GRANT -> exit 4
 restore round trip                      | integ       | Y (test_restore_roundtrip)        | one cell identical
 web authz matrix + RLS backstop (M2)    | integ       | Y (tests/web/)                    | every viewer x role x resource; bypass -> nothing
```

**Assertion check on the accepted requirements.** Goal G1 (amended): assertion = for every (surgeon, metric periop reports, period), ours == periop's at periop's precision, or a `definition_delta` or sustained re-credit row exists; rejects a one-case difference with no delta. R-84 (amended): assertion = `close --reconcile-skip` exits 2 when the metric is in periop's report; rejects a skip on FCOT. R-64 (amended): assertion = a second reply on an open dispute adds one `dispute_event` of kind `evidence_added` and zero `dispute` rows; rejects a second `dispute` row. R-94 (amended): assertion = every CSV cell whose first character is one of `= + - @` is written with a leading apostrophe (or equivalent); rejects a raw `=` cell. R-98 (amended): assertion = an email rendered after a restatement of any category contains the metric, period, category and both values; rejects an email with the marker only. R-115: assertion = the block lists exactly the decisions, restatements, version changes and new-case count since the prior published period for that surgeon, and reads "No changes since <period>" when none; rejects a block that omits a decided dispute. R-113: assertion = the diff names every (surgeon, tile) whose suppression kind or spread eligibility changed; rejects a missed suppressed-to-shown change. R-114: assertion = the F-112 alert list has two recipients; a gate confirm by the primary analyst's own identity is refused.

**Test ambition.** 2am Friday test: `test_reconcile` plus `test_own_records` plus `test_scan` green on the synthetic department, and the rehearsal email (T9) in the analyst's own inbox. Hostile QA test: a surgeon's reply quoting a colleague's case id, a chief's "sustained" from a personal address, a roster with two chiefs for one surgeon, a procedure name of `=HYPERLINK(...)`. Chaos test: kill the relay at surgeon 20 of 40 and re-run `--send`; then run `recompute` while `close` is paused after compute (T7).

**Pyramid.** Many unit (definitions, suppression, state machine, scan), fewer integration (loaders, gates, publish, web matrix), one manual E2E (rehearsal). Right shape.

**Flakiness.** Business-day arithmetic (F-83, F-112) and the 30-day leader gate (F-89) depend on today's date: freeze time. Directory and relay are external: mock at the `directory.py` and `transport.py` boundary. Ordering: the fresh database per session avoids it.

**Load tests.** None needed at 40 surgeons; the NFR table's targets are measured from run rows in the first real month.

**LLM eval suites.** None; no prompt or LLM change.

Findings:

- [WARNING] (confidence: 8/10) technical design "Test strategy": the resume-after-partial-send behavior (F-90 AC 7) and the `--send` twice no-op have no named test. T6.
- [WARNING] (confidence: 7/10) the opt-out rule (R-37) needs a test in both directions (opted-out viewer gets self-only; opted-out surgeon absent from every other viewer's denominator); the plan names `peers` tests without that pair. T6.
- [WARNING] (confidence: 8/10) each accepted amendment (L-04, L-05, L-08, L-10, L-13, L-14) needs its assertion above turned into a test; none exists yet. T3, T4, T5.
- [OK] The named suite covers every M1 gate, the state machine by enumeration and the two immutability rules; the synthetic generator removes PHI from CI. The eng review owns the test plan on disk.

Decision gate: Analyze done; Resolve: no new decision (tests follow accepted rows); Apply: tasks T3 to T7, T9.

---

## Section 7: Performance review

- N+1: the engine is pandas frames per period, not ORM traversal; the record-list render reads `metric_value_record` by (value id), one query per tile. At 40 surgeons x 4 tiles that is 160 queries per publish; fine. At M2 the record-list page is one query. Nothing flagged.
- Memory: the largest frame is one month of panel rows (2 to 4 per case, up to 20,000 rows) or a five-year restate of one metric (about 1,000,000 panel rows in TA-13's five-year figure); pandas on a workstation handles both. Nothing flagged.
- Indexes: the technical design says the DDL's indexes suffice at this volume and schedules an index review after the first Vizient quarter. Accept.
- Caching: nothing worth caching; the ledger is the cache (surfaces render stored rows).
- Background jobs: none at M1 (human-run); at M2 the status timer and the nightly dump. The synchronous recompute in the decide request (D-26) is the only latency-visible path: under 5 seconds target, 10-second statement timeout renders `load-failure` with the decision already written. Accept.
- Top three slow paths and p99: (1) five-year restate of one metric, target under 30 minutes, p99 unknown until measured; (2) `publish --dry-run` render plus scan for 40 surgeons, under 5 minutes; (3) M1 `close`, under 2 minutes on the workstation. All measured from run rows, none estimated.
- Connection pools: one connection per CLI command; the app uses a small pool with a call-scoped `engine` connection for recompute. No Redis, no queue.

Findings:

- [OK] Examined every new data structure's maximum size, the one in-request computation and the three slowest paths against the NFR table; nothing exceeds a single machine at 100x the pilot volume, and the plan measures rather than estimates. The accepted E8 preview diff reads two periods instead of one and adds seconds, not minutes.

Decision gate: nothing to resolve.

---

## Section 8: Observability and debuggability review

- Logging: `ledger.run` per command with gate results; application logs ids-only with a formatter allowlist; psycopg errors wrapped so row values are not echoed. Entry, exit and each gate are logged by construction. Good.
- Metrics that say working vs broken: `published_at` within 10 business days (working); a gate name on the last line (broken); feed health per source in the weekly email; the reconciliation table; the suppression grid; the peer render report (the P5 evidence); the trust and adoption reports. Good.
- Tracing: single process at M1; at M2 the web app's correlation id on errors and the audit row per view. Adequate for one VM.
- Alerts: the F-112 checklist (printed at M1, timer at M2) covers every deadline. After L-03 it reaches two people.
- Day-1 dashboard panels (M2 `/analyst/runs`): last close status and gate results; last publish date and delivered count vs roster; bounces and incidents; open disputes by age bucket (0 to 9, 10 to 13, 14+); replies unentered over two business days; feed health per source; off-host dump and audit export age. All are already stored rows; the panel list is a runbook item.
- Three-weeks-later debuggability: `scorecard audit --clinician K --period P` reconstructs runs, values with their restatement chain, suppression decisions, snapshots (counts), disputes with state history, deliveries with hashes, views and refusals. A surgeon who says "my October number changed" can be answered from that report alone. Yes.
- Admin tooling: every operational task has a CLI command (`exceptions resolve`, `delta add`, `setting set`, `roster set`, `publish --resend`, `delivery incident`, `retention run --dry-run`). No admin UI needed at M1.
- Runbooks: `docs/RUNBOOK.md` page 1 (monthly), page 2 (disputes, definitions), quarterly section. Each exit code maps to an action. After L-17 the unexpected-exception row needs adding.
- What would make this a joy to operate (expansion addition): the preview diff (L-10) and a one-line "since last publish" summary at the top of `status --weekly` (rows changed, disputes decided, restatements). The second is a P3 nicety, not accepted.

Findings:

- [OK] Examined logs, metrics, alerts, dashboards, the audit report and the runbook outline against every M1 failure mode in Section 2; each has a stored signal and a named reader. The only gap (unexpected-exception runbook row) is already T8.

Decision gate: nothing new to resolve.

---

## Section 9: Deployment and rollout review

- Migration safety: greenfield at M1 (fresh database). `test_migrations_fresh` and `test_migrations_replay` exist; `SCHEMA_VERSION` bump enforced. Workstation-to-VM move by `pg_dump` and `pg_restore` at M2 with `doctor` after. Zero-downtime is moot for a batch.
- Feature flags: governance gates are data (`gate.*` rows with a second confirmer) and `--allow-*` flags acknowledge, never bypass. That is the right shape for a regulated environment: the flag is an audit fact.
- Rollout order (M1): install, `migrate`, `grants check`, `doctor`, load 12 months, `attribute`, resolve exceptions, `close --dry-run`, `close`, `publish --dry-run`, read one email and one CSV, rehearsal (L-11), `publish --send`, `overrides --send`, `status --daily`, dump off-host.
- Rollback: pre-send, re-run after a fix (nothing surgeon-facing written). Post-send, restatement plus the L-05 notice; misdirected send, the OQ-58 incident procedure. There is no "unsend"; the plan says so.
- Deploy-time risk window: single process; none.
- Environment parity: synthetic department in CI and on the workstation; the real relay and directory are exercised only by the rehearsal (L-11). That is the parity gap the rehearsal closes.
- First five minutes after `--send`: `delivery` rows equal roster count minus blocked; `published_at` set; `status --daily` clean; the analyst's own rehearsal copy readable on a phone. First hour: `ingest-ndr` shows zero bounces or each is on the checklist; the dispute mailbox has no `awaiting_row` older than the run. Smoke tests: `doctor`; `publish --dry-run --only <one clinician>`; `compute --period P --metric fcot --clinician K` equals the tile.
- Deploy infrastructure that would make shipping routine (expansion addition): `scorecard doctor` already is that; at M2, `deploy/` systemd units and the tagged-release rule. Nothing to add.

Findings:

- [WARNING] (confidence: 7/10) section 13 M1 gate, R-82: no rehearsal of the real relay and directory before the first real send; the first surgeon-facing email would be the first message ever to leave the system. Resolved by L-11.
- [OK] Migrations, gates-as-data, the rollout sequence and the resume behavior are specified; rollback is honest about email.

Decision gate: Resolve: L-11; Apply: R-82 and section 13 amended.

---

## Section 10: Long-term trajectory review

- Technical debt introduced: (code) the M1 email-months intake is manual transcription, retired by M2's dispute button; the optional sheet import (D-25) is debt only if a chief insists on it. (operational) the workstation interim (TA-02) until the VM lands. (testing) none beyond the gaps in Section 6. (documentation) a 4,900-line technical design that the runbook must not copy; the runbook's page-1 draft is an M0 deliverable, which is right.
- Path dependency: choosing a Flask app over the BI tool (D-04) means the department owns a web app's patching, SSO registration and security review for as long as the hosted view exists. Recorded and reversible at the cost of the M2 build (the `pub` schema keeps the BI path open, D-36). Definitions as hashed files make every later definition change a git-visible fact; that is path dependency in the good direction.
- Knowledge concentration: the builder and the analyst. The runbook, the synthetic generator and the definitions-as-code convention are the mitigations; L-03 adds a second operator.
- Reversibility (1 = one-way door, 5 = easily reversible): definitions as files 5; PostgreSQL schema 4; Flask vs BI 3; the workstation interim 4 (one dump moves it); the first email to surgeons 1 (trust, once lost at step zero or month one, does not come back; the design doc's sequencing is the mitigation); the choice to reconcile to periop's number rather than compute a rival 2 (a department FCOT would be hard to introduce later, and should be).
- Ecosystem fit: Python, PostgreSQL, systemd, plain text. Fits an MGB-managed RHEL VM and an analyst who can read the code.
- The 1-year question: a new engineer reads the README's two sentences, the run gates table and one definition file and understands the system. Yes.
- Phase 2 and 3: M2 hosted view; M3 to M7 one feed at a time; each feed adds a loader, a rule and definitions to a schema that does not change (TA-13). The architecture supports the trajectory; what it does not yet support is the P8 survival story (the slide and the packet generated from the ledger), which has no requirement row and no milestone. Deferred: it needs the owner's answer to Q6.
- Platform potential: the source registry, the definition contract and the `pub` schema are the three things later features plug into. A second site is a roster change and a ticket, not a build.

Findings:

- [WARNING] (confidence: 6/10) P8, design doc Q6, PRD section 3 and 13: the survival story (department outputs generated from the ledger) has no requirement or milestone. Not added: it depends on the chair's answer (Q6) and on the M4 survey feed; recorded in NOT in scope as deferred with an owner.
- [OK] Debt, reversibility and the one-year question were examined; the plan's one-way door (the first email) is the design doc's explicit sequencing concern and is handled by step zero and month-one self-only.

Decision gate: nothing to resolve in the PRD; deferral recorded.

---

## Section 11: Design and UX review

UI scope: yes (plain-text email, M2 web app, page states, accessibility baseline). No wireframe exists; the PRD says a one-to-three-screen sketch precedes `/plan-design-review`. This section checks design intent, not pixels.

**Information architecture.** Email, in order: subject with "last refreshed"; preamble (what this carries, how to dispute); the "what this is not" line; then tiles in bucket order. After L-08 the "what changed" block sits between the preamble and the first tile, so the second thing the surgeon sees is whether anything about them changed. Hosted view (M2): scorecard page with tiles; each tile opens its record list and definition page; dispute form per row; the queue for adjudicators; the inbox at M4. First, second, third for a surgeon: my numbers, my list, my disputes. Right order.

**Interaction state coverage.**

| Feature | LOADING | EMPTY | ERROR | SUCCESS | PARTIAL |
|---|---|---|---|---|---|
| Email tile | n/a (static) | "Not shown: 0 <unit> this <period>; needs at least <min-n>" or count 0 with list | "<feed> for <period> not received as of <date>"; "not computable: <field> not in extract" | value, comparator, version, trend | "Counted quarterly; the quarter closes <date>" with the count so far; "history from <date>" |
| Email spread (month two) | n/a | "Peer comparison not shown: <n> peers ... needs 5 (you are not counted)" | n/a | three-line plain-text spread | n/a |
| Case list CSV | n/a | header row only, effect notices in the comment line | not attached under `--numbers-only` with the catalogue sentence | rows = denominators | n/a |
| Dispute row state | n/a | no dispute | n/a | "Disputed - with chief, filed <date>"; sustained/not sustained with note and date | "correction requested at source" until re-ingest |
| Hosted scorecard page (M2) | server-rendered; no spinner; 10-second statement timeout | "no period published yet" (catalogue key) | "The page could not be loaded. Your data has not changed. Try again or contact <analyst mailbox>." | identical values to the email | never partial (timeout renders the error state) |
| Adjudicator queue | as above | "No open disputes" (needs a catalogue key; design review item) | as above | rows with age in days against 14 | n/a |
| Direct-leader inbox (M4) | as above | "Available to the direct leader from <date>" before the gate; then no comments yet | as above | comments newest first, no notes | n/a |

**Emotional arc (storyboard).** Step zero: wary ("is this a report card?"), answered by the "what this is not" page and the sentence about recognizing a colleague. Month one: curiosity, then the check of one's own list, then, for some, the sting of a record that is wrong. Reply: relief that the reply address is a person who answers within two business days with a case id. Decision email inside 14 days: closure, and the row says so. Month two: the spread, expected because step zero said it would come. Month three: the interview. The arc depends on the two-business-day acknowledgement and the 14-day decision; both now have two named operators (L-03).

**AI slop risk.** Low. The email template is specific to the character (72 columns, bucket order, catalogue strings). The M2 pages are described by a page inventory with URL patterns, not "a dashboard with cards". Charts are inline SVG with the text table beneath, which is a decision, not a default.

**DESIGN.md alignment.** No DESIGN.md exists. The accessibility baseline (9.5) and the catalogue-strings rule are the de facto design system. Recommend that `/plan-design-review` produces one.

**Responsive intention.** Email: 72 characters, tested on three phone mail clients, CSV opens on both platforms. Hosted: desktop-first, usable at 360 px without hiding any tile, reason or list. Intentional, not an afterthought.

**Accessibility basics.** Every state as text; 4.5:1 contrast; keyboard reachable; no JavaScript needed to read, dispute, decide or write a note; `role="img"` with `aria-describedby` on charts; institutional standard pending OQ-51. Above baseline.

**User flow (required diagram).**

```
 [step zero]        [month-one email]         [reply]              [ack <= 2 business days]
 definitions,  -->  4 tiles, trend,     -->  Case id / Field / -->  case id + filed date;
 what this is       own CSV, reasons,        What happened         or "which case id?"
 not, opt-out       reply address                 |
                          |                        v
                          |                 [chief or chair decides <= 14 days]
                          |                        |
                          |          +-------------+-----------------+
                          |          v             v                 v
                          |     sustained      not sustained    definition question
                          |     (row + count   (row + note)     (open item on the
                          |      or row only)                    definition page)
                          |          |             |                 |
                          v          v             v                 v
                    [decision email: row text + updated tile]  [next month's email: what changed block]
                          |
                          v
                    [month-two email: + three-line spread for eligible surgeons]
                          |
                          v
                    [month three: interview; adoption and trust reports; greenlight decision]
                          |
                          v
                    [M2: same numbers on a hosted page; dispute button per row; queue; deep link in the email]
```

**What would make this UI feel inevitable.** The "what changed" block (accepted) and one thing not accepted: the reply address answering "seen" with nothing, which is right, and answering a question within two business days by a person, which the plan already promises. **30-minute touches:** the reply template (accepted); a catalogue key for the empty queue ("No open disputes"); the subject line naming the number of new cases ("19 cases; 1 dispute decided"), which is E6's content and should stay in the body to keep the subject stable for filtering.

Findings:

- [WARNING] (confidence: 6/10) section 9.4: the adjudicator queue's empty state has no catalogue key; F-33 AC 5 requires every page-state wording to be registered. Design review item (T10), not a PRD requirement change.
- [OK] Information architecture, state coverage, responsive and accessibility intent are specified to a level a designer can work from. Recommend running `/plan-design-review` on this plan once the one-to-three-screen sketch exists, and `/design-review` on the live M2 pages after implementation.

Decision gate: Resolve: none needed; Apply: T10 recorded.

---

## Outside voice (placeholder from the section pass)

Not run when the 11 sections above were written. Run afterwards as a fresh-context Claude subagent; a Claude subagent is not an outside model, so OUTSIDE COVERAGE: native only, and no consensus cell is CONFIRMED. The verbatim answers, the consensus table and the dispositions are the last three sections of this file. A `/plan-eng-review` run should include its own outside voice.

---

## Dream state delta

After this plan lands through M1, the department has the ledger, definitions as code, self-explaining suppression, a dispute path with a written outcome, and four reconciled numbers by email, with two operators and a rehearsed send. Relative to the 12-month ideal it lacks the hosted view (M2, gated on three sign-offs), every later feed (M3 to M7, each gated on an owner), intervals on quality metrics (M6), and the department's own recurring outputs generated from the ledger (no milestone; owner's Q6). Division and site views remain unspecified (OQ-52). The plan moves toward the ideal on every axis it touches and sideways on none.

## NOT in scope

Deferred (recorded here for `TODOS.md` when one exists), one sentence each:
- X3 Second site in M1: goal G7 makes a second site the greenlight evidence after month three, not part of the wedge; owner: chair.
- X4 Automated nightly ETL with a failed-run alert: required for the full build (design doc Approach B), contradicts the human-run close that goal G6 measures; revisit after M2.
- X6 A surgeon-triggered "resend" reply class: `publish --resend` exists for the analyst; add if month-three interviews ask for it.
- X8 Print or export for annual review: already OQ-46, pending the owner.
- P8 outputs (semiannual slide, annual packet generated from the ledger): no requirement row; depends on the chair's answer to Q6 and the M4 survey feed.
- L-16 close/recompute serialization and L-17 unexpected-exception exit code: mechanism choices deferred to `/plan-eng-review` (T7, T8).

Declined (no TODO), one sentence each:
- X1 Hosted view at M1: reverses the design doc's email-first decision and P7.
- X2 Block utilization in the wedge: design doc challenge 24; the block schedule has no owner (OQ-34).
- X5 Chair's monthly counts-only digest: contradicts D5 and duplicates F-98 (reader is OQ-50).
- X7 Two FCOT counts on the tile: the two-numbers failure D6 exists to prevent.

## What already exists

| Sub-problem | Existing thing | Reused by the plan? |
|---|---|---|
| The reconciliation target | Periop's surgeon-level report | Yes, loaded as a feed (F-81) |
| Institutional definitions | Periop's FCOT with its grace window | Yes, verbatim as parameters (F-15, F-100) |
| Risk models | Vizient expected values | Yes (M6) |
| Identity, mail, directory | MGB SSO, SMTP relay, LDAPS or Graph | Yes (M1 mail; M2 SSO) |
| Row-level security, audit | PostgreSQL RLS, pgaudit | Yes (M2 backstop; M1 read audit) |
| Hosted BI with RLS | Enterprise BI tool | Kept open through `pub` (D-36), not used at M2 |
| The faculty-meeting slide | Patient experience office's semiannual slide | Copied as the layout (F-69); not generated from the ledger yet |
| Attendance | QR system (not confirmed live) | M5, if live (OQ-49) |
| Prior documents | Design doc, journeys, catalogue, technical design, three review logs | All read; no accepted change reversed |

## Error and rescue registry

The Section 2 tables are the registry. Summary counts: 34 named failure rows; 32 rescued with a named action and a user-visible or analyst-visible result; 2 gaps (unexpected mid-compute exception, close/recompute overlap), both deferred to the eng review with tasks.

## Failure modes registry

```
  CODEPATH                          | FAILURE MODE                         | RESCUED? | TEST? | USER SEES?                    | LOGGED?
  ----------------------------------|--------------------------------------|----------|-------|-------------------------------|--------
  loaders.load                      | file missing / wrong grain / no ticket| Y        | Y     | analyst: message               | Y (run)
  loaders.load                      | required column absent               | Y        | Y     | surgeon: "not computable"      | Y
  loaders.load                      | identifier column in file            | Y        | Y     | analyst: checklist             | Y
  engine.close                      | feed missing or partial              | Y        | Y     | surgeon: worded reason         | Y
  engine.close                      | unresolved attribution exception     | Y        | Y     | analyst: G4                    | Y
  engine.close                      | unexplained reconciliation delta     | Y        | Y     | analyst: G6; surgeon: stale    | Y
  engine.close                      | periop REPORT missing (after L-04)   | Y        | N->T3 | analyst: hold; surgeon: stale  | Y
  engine.close                      | rows <> denominator / blank reason   | Y        | Y     | analyst: G7 / G8               | Y
  engine.close                      | unexpected exception mid-stage       | N        | N     | analyst: traceback in log      | partial  <- GAP (T8; not silent to the analyst)
  engine.recompute                  | overlaps close on another period     | N        | N     | Silent                         | N        <- CRITICAL GAP (T7)
  engine.recompute                  | fails after decision written         | Y        | Y     | analyst: checklist             | Y
  publish.send                      | payload scan hit                     | Y        | Y     | analyst: named artifact        | Y
  publish.send                      | own-records mismatch                 | Y        | Y     | analyst: G14                   | Y
  publish.send                      | forbidden pattern (rank etc.)        | Y        | Y     | analyst: G15                   | Y
  publish.send                      | directory mismatch / unreachable     | Y        | N->T6 | analyst: checklist             | Y
  publish.send                      | relay fails mid-run                  | Y        | N->T6 | analyst: exit 4; resume        | Y
  publish.send                      | bounce                               | Y        | Y     | analyst: checklist             | Y
  publish.send                      | misdirected send                     | Y (proc) | n/a   | analyst: incident              | Y
  publish.csv_rows                  | formula-leading cell (L-13)          | Y after  | N->T4 | surgeon: safe CSV              | n/a
  publish.render                    | restatement without notice (L-05)    | Y after  | N->T5 | surgeon: notice in email       | Y
  disputes.intake                   | reply with no case id                | Y        | Y     | surgeon: ack asks for id       | Y
  disputes.intake                   | case id not the sender's (L-15)      | Y after  | N->T6 | surgeon: ack asks for own id   | Y
  disputes.intake                   | duplicate reply on open dispute      | Y after  | N->T6 | surgeon: ack names dispute     | Y
  disputes.route                    | route undefined                      | Y (held) | Y     | analyst: checklist             | Y
  disputes.decide                   | wrong actor / second decision        | Y        | Y     | actor: refused                 | Y
  disputes.decide (M1)              | spoofed adjudicator address          | partial  | N     | nobody                         | Y (msg id) <- unresolved (L-18)
  status --daily                    | analyst absent (before L-03)         | N        | n/a   | Silent                         | n/a      <- closed by L-03
  status --daily                    | IMAP unreachable for NDRs            | Y        | N     | analyst: exit 4                | Y
  web (M2) any                      | unhandled exception / timeout        | Y        | Y     | user: load-failure + id        | Y
```

Rows with RESCUED=N, TEST=N and USER SEES=Silent: one (recompute/close overlap), the CRITICAL GAP carried to the eng review as T7. The analyst-absence row was a critical gap before L-03 and is closed by it.

## Scope expansion decisions

- Accepted: E1 backup analyst (R-114, section 4, goal G6, R-88); E2 reconcile-skip restriction (R-84, Taste flagged); E3 restatement notice (R-98); E4 adoption denominator (R-95, section 14); E5 zero-dispute question (R-95); E6 "what changed" block (R-115, 9.1); E7 reply template (9.1, R-94); E8 preview diff (R-113, Taste flagged); E9 first-send rehearsal (R-82, section 13); E10 goal G1 wording; plus the three rigor fixes L-13 (R-94), L-14 (R-64), L-15 (R-59).
- Deferred: X3, X4, X6, X8, P8 outputs, L-16, L-17.
- Skipped: X1, X2, X5, X7.

## Diagrams

1. System architecture: Section 1 dependency graph (and PRD section 10.1).
2. Data flow with shadow paths: Section 4.
3. State machine: technical design "The dispute state machine", summarized in Section 1; the period run's states are the monthly sequence.
4. Error flow: Section 2 tables.
5. Deployment sequence: Section 9 rollout order.
6. Rollback flowchart:

```
 published number wrong?
   |-- found before --send ------> fix data / delta / roster -> re-run close -> publish
   |-- found after --send
         |-- source data changed ---> new load supersedes -> restatement (R-100) -> notice in next email (R-98) -> trend marked
         |-- definition wrong -------> new vN.py -> register -> recompute --version --from -> notice (R-98)
         |-- adjudication -----------> dispute path (R-63) -> recompute -> decision email (R-97)
         |-- sent to the wrong person -> delivery incident (PS-8, OQ-58) -> checklist until resolved
   no unsend exists; the email is plain text with the surgeon's own rows only, which bounds the damage of every branch.
```

## Stale diagram audit

Diagrams in files this review touches: PRD section 10.1 component diagram (copied from the technical design; still accurate; the accepted E6 and E8 add modules inside `publish/`, which the diagram lists by folder, so no change). Design doc: no ASCII diagrams. This review's diagrams are new.

## Implementation tasks

Synthesized from findings. Human and AI-assisted effort shown; ratios assume tests about 50x and features about 30x.

- [ ] **T1 (P1, human: ~2h / CC: ~5min)**: PRD: Apply the accepted amendments (done in this run; verify the diff)
  - Surfaced by: Sections 1, 3, 4, 9; ledger L-03 to L-15
  - Files: `docs/PRD.md`
  - Verify: `git diff docs/PRD.md` shows sections 3.1, 4, 7.6, 7.10, 7.11, 7.12, 9.1, 13, 14, 17 changed and appendix D carries the ceo block
- [ ] **T2 (P1, human: ~1 day / CC: ~30min)**: publish/render: "What changed since last month" block (R-115) and the restatement notice (R-98)
  - Surfaced by: 0G E3, E6
  - Files: `scorecard/publish/render.py`, `scorecard/publish/email_text.py`, `templates/scorecard_email.txt.j2`, `_catalogue.py` (new keys)
  - Verify: `tests/publish/test_what_changed.py`: decided dispute, restated point, version change, new-case count, and the "No changes since <period>" line
- [ ] **T3 (P1, human: ~2h / CC: ~10min)**: engine/reconcile: Restrict `--reconcile-skip` to metrics absent from periop's report; hold publish on a missing report (R-84)
  - Surfaced by: Section 1 finding 1; L-04
  - Files: `scorecard/engine/reconcile.py`, `scorecard/engine/close.py`, `docs/RUNBOOK.md`
  - Verify: `tests/engine/test_reconcile.py::test_skip_refused_for_reported_metric` exits 2; `::test_missing_report_holds_publish`
- [ ] **T4 (P1, human: ~1h / CC: ~5min)**: publish/csv_rows: Escape formula-leading cells (R-94)
  - Surfaced by: Section 3; L-13
  - Files: `scorecard/publish/csv_rows.py`
  - Verify: `tests/publish/test_csv_formula.py`: cells starting with `=`, `+`, `-`, `@` are prefixed; row counts unchanged
- [ ] **T5 (P2, human: ~2 days / CC: ~1h)**: publish/preview_diff: Per-surgeon state diff against the prior published period in `publish --dry-run` (R-113)
  - Surfaced by: 0G E8; risk table "Roster errors"
  - Files: `scorecard/publish/preview_diff.py` (new), `scorecard/publish/status.py`, `preview/<period>/index.html`
  - Verify: `tests/publish/test_preview_diff.py`: suppressed-to-shown, spread on-to-off, peer count changed, no change
- [ ] **T6 (P1, human: ~1 day / CC: ~20min)**: tests: Name the missing M1 tests: resume after partial send and `--send` twice; opt-out in both directions; directory mismatch blocks one surgeon; intake refuses a colleague's case id; duplicate reply attaches (R-64)
  - Surfaced by: Section 6 findings 1 to 3; L-14, L-15
  - Files: `tests/publish/test_send_resume.py`, `tests/engine/test_peers_optout.py`, `tests/publish/test_directory.py`, `tests/disputes/test_intake.py`
  - Verify: each test fails against a stub that omits the behavior and passes against the implementation
- [ ] **T7 (P1, human: ~4h / CC: ~30min)**: engine: Name and implement the serialization between `close` and `recompute` (per-period advisory lock or documented single-writer rule); write the pause/resume regression test
  - Surfaced by: Section 4 async ordering proof; L-16 (deferred to `/plan-eng-review` for the mechanism choice)
  - Files: `scorecard/engine/close.py`, `scorecard/engine/recompute.py`, `tests/engine/test_ordering.py`
  - Verify: schedule B (recompute during a paused close) leaves `is_current` unique and the restated marker present
- [ ] **T8 (P2, human: ~2h / CC: ~10min)**: cli: Unexpected-exception path: exit 4, `run.status='error'`, log path on the run row, ids only; runbook row
  - Surfaced by: Section 2; L-17
  - Files: `scorecard/cli.py`, `scorecard/log.py`, `docs/RUNBOOK.md`
  - Verify: `tests/ops/test_unexpected_exception.py`: a raised error inside a stage exits 4 and writes the run row; publish then refuses the period
- [ ] **T9 (P1, human: ~2h / CC: n/a, manual)**: runbook: First-send rehearsal step on the synthetic department through the real relay to the analyst and backup mailboxes (R-82)
  - Surfaced by: Section 9; L-11
  - Files: `docs/RUNBOOK.md` page 1
  - Verify: the rehearsal email and CSV received and opened on a phone by both operators; recorded as `department_setting.rehearsal.<date>`
- [ ] **T10 (P3, human: ~30min / CC: ~2min)**: catalogue: Register an empty-queue page-state key ("No open disputes") per F-33 AC 5
  - Surfaced by: Section 11
  - Files: `scorecard/definitions/_catalogue.py`, `web/templates/queue.html`
  - Verify: `tests/publish/test_catalogue_strings.py` covers the queue page

_No new tasks from Sections 5, 7, 8 and 10._

Tasks JSONL: not persisted (no `~/.gstack` project store is configured in this environment; the markdown list above is the record).

## Completion summary

```
 MEGA PLAN REVIEW: COMPLETION SUMMARY
 -----------------------------------------------------------------------
 Target                 docs/PRD.md v0.2 -> v0.4 (DRAFT; not approved)
 Mode                   SCOPE EXPANSION (auto-decided; greenfield)
 Review depth           implementation-ready
 System audit           documents only; one uncommitted PRD edit; no TODOS.md
 Sections               11 run in full; Section 11 ran (UI scope)
 Findings by severity   CRITICAL GAP 1 (close/recompute ordering, deferred to eng with T7)
                        WARNING 17
                        OK 11 (sections or sub-areas examined, nothing flagged)
 Scope proposals        18 candidates: 13 accepted (10 expansions E1..E10 + 3 rigor fixes),
                        7 deferred (X3, X4, X6, X8, P8 outputs, L-16, L-17), 4 declined (X1, X2, X5, X7)
 Taste items flagged    7 (L-04 reconcile-skip restriction; L-10 preview diff; T-01 M1 as script and sheet;
                        T-02 M0 stop on fewer than two disputed-number stories; T-03 reconciliation threshold;
                        T-06 wRVU mirror tile before M5; T-10 step zero by video)
 Unresolved (owner)     2 (L-18 information security; L-19 definitions owner)
 Registries             Error and rescue: 34 rows, 2 gaps. Failure modes: 29 rows, 1 CRITICAL GAP
 Tasks                  10 (P1: 7, P2: 2, P3: 1)
 PRD rows               added R-113, R-114, R-115; changed R-59, R-64, R-82, R-84, R-88, R-94, R-95, R-98;
                        sections 3.1 (goals G1, G6), 4, 9.1, 13, 14, 17A, 17C, 17D changed
                        outside-voice close (v0.4): R-82, R-84, R-95, R-105, R-106 amended; sections 2, 10.8, 11,
                        13, 14, 15, 16.6 (new), 17A, 17C, 17D changed; no row removed
 CEO archive            not persisted (no ~/.gstack store); this file is the record
 Outside voice          Claude subagent, fresh context; coverage native only; consensus N/A on 6 of 6
                        dimensions (5 verdict disagreements to Taste, 1 same verdict); no clean-review credit
 Tensions               10 dispositioned: 1 accepted, 8 partial, 1 rejected; 0 User Challenges
 Lake score             10/10 on the ten coverage decisions where options differed in coverage
 Diagrams               6 produced; stale audit clean
 Status                 DONE_WITH_CONCERNS: seven Taste items and two owner questions await a human
 -----------------------------------------------------------------------
```

## Unresolved decisions

- L-04 (Taste): reconcile-skip restricted and a late periop report holds publish. Alternative: keep the skip and publish unreconciled with a note; downstream impact: R-84 and D6 become defaults, goal G1 weakens.
- L-10 (Taste): preview diff in M1. Alternative: defer to M2; downstream impact: the roster-error risk is caught only by the chief's pre-step-zero summary and the analyst's manual read.
- L-18 (owner: information security): authenticity of decision-by-reply inside MGB mail; M1 mitigation recorded.
- L-19 (owner: definitions owner): whether a surgeon on approved leave for a whole month receives an all-zero email.
- T-01 (Taste, outside voice): M1 as one script, a shared sheet and a mailbox, with the ledger, roles and audit moved to M2. Rejected headless; alternative kept for the human. Downstream impact if taken: D-25, F-111, R-57, R-61, R-99 and section 10 move to M2, and goal G3's "outcome visible on the row" is a spreadsheet cell for three months.
- T-02 (Taste, outside voice): whether fewer than two disputed-number stories at M0 stops M1. Recorded as an owner decision in section 13; alternative: an automatic stop.
- T-03 (Taste, outside voice, with L-04): zero-tolerance reconciliation (D-15) versus an owner-set threshold printed on the tile. Zero tolerance kept until the M0 diff shows an unexplainable difference (R-84).
- T-06 (Taste, outside voice): the Work RVUs — live tracker mirror tile in the M1 email instead of M5. Kept at M5; the comp office is asked at M0 whether goal G8 can precede M1 (OQ-33).
- T-10 (Taste, outside voice): step zero satisfied by a recorded video plus an emailed acknowledgement. Not taken; changes the design doc's trust sequencing; owner decides under OQ-10.

## Headless decisions

Every decision point was auto-chosen under the spawned-session rule. Recorded for the human to reverse.

1. Review depth: implementation-ready (the default; the task said so).
2. Mode: SCOPE EXPANSION by the greenfield rule. Noted that autoplan's CEO phase would force SELECTIVE EXPANSION; the per-item dispositions would be identical.
3. Expansion candidates E1 to E10: each took the option marked recommended (Add), by P1 completeness and P2 boil lakes; E2 and E8 are flagged Taste because a reasonable human could pick the alternative.
4. X1 to X8: Skip or Defer as the recommended option per candidate; no expansion outside the M0 and M1 blast radius was accepted.
5. Rigor findings L-13, L-14, L-15: applied to the PRD (Mechanical; each preserves or documents an existing guarantee).
6. L-16 and L-17: deferred to `/plan-eng-review` rather than choosing a mechanism here (the eng tiebreakers P5 and P3 own mechanism choices).
7. L-18 and L-19: left unresolved with owners rather than inventing an institutional answer.
8. Outside voice: dispatched after the 11 sections as a fresh-context Claude subagent, because no outside model was available; coverage recorded as native only, every consensus cell N/A, no clean-review credit claimed.
9. No destructive or irreversible option was available or taken; the PRD was amended in place with a new history row and the earlier review logs untouched.
10. Approval: none granted. The PRD's status stays DRAFT; the ceo block in appendix D lists accepted obligations, not approvals.
11. Next skill: `/plan-eng-review docs/PRD.md` (the shipping gate), after the one-to-three-screen sketch for `/plan-design-review` if the human wants the design gate first.
12. Consensus scoring: every cell N/A because the second voice is a Claude subagent (autoplan rule: primary cannot replace outside). The five verdict disagreements were classed Taste, not User Challenge, because the native review joined none of them; the user's direction (the brief, the design doc's wedge and sequencing) stands everywhere.
13. T-01 (the outside voice's blocking scope finding) rejected by the autoplan rule that the CEO phase never reduces scope on a complete plan and by the 0G Holds; recorded as Taste with its downstream impact so the human can take it.
14. T-02 to T-07, T-09 and T-10 taken as PARTIAL: the evidence half of each fix (questions with owners, records, gate conditions) went into the PRD because it is in blast radius and costs meetings, not code; the half that would change the design doc's direction (a new automatic kill criterion, a threshold instead of zero tolerance, the wRVU tile in M1, the workstation interim refused by default, step zero by video) was held for the owner.
15. T-08 accepted: one paragraph stating month six.
16. No institutional fact was asserted in any amendment: what the institution runs, what its policies allow and what periop's report can do are written as M0 questions with named owners, per the PRD's rule against inventing policy the brief does not state.

---

## Outside voice

### OUTSIDE VOICE (Claude subagent)

Provider: a Claude subagent in a fresh context, given the autoplan CEO adversarial prompt and the PRD's implementation plan only. It is the same model family as the native reviewer, so under the autoplan rule ("primary cannot replace outside") this is native-only coverage: no consensus cell below is CONFIRMED and no clean-review credit is claimed. The answers are copied verbatim from the subagent's JSON; nothing is paraphrased or trimmed. The dispositions that follow are the native reviewer's, made headless.

**steelman**

> Every neurosurgeon in this department is judged on numbers from four different owners (periop, comp, patient experience, medical staff office), none of which comes with the case list behind it or a way to correct a wrong record, so faculty meetings are spent arguing about whose number is right. This plan gives each surgeon their own records first, adopts the institution's definitions verbatim so it never creates a competing number, and makes correction a visible, adjudicated change to the list rather than a complaint that goes nowhere. By shipping as a plain-text email with four periop-derived metrics before any hosted page, it sidesteps the governance queue, tests whether surgeons actually engage before a platform is built, grows one feed at a time only where the owning team has authorized it in writing, and kills itself cheaply if nobody opens month two.

**most_revealing_element**

> R-71 together with M0 in section 13. R-71 says that in M1 (the entire first three months of surgeon-facing life) the dispute path is a surgeon replying to an email, an analyst typing it into a shared sheet, and a chief answering by email reply. M0 says the demand test is one printed case list handed to one surgeon. Read together, the actual product for the first six months is: a CSV of your own cases, a mailbox, a spreadsheet, and a named analyst with a chief's ear. Everything in section 10 (PostgreSQL with six schemas and ten roles, pgaudit, RLS on eleven tables, hash-chained audit export, restore drills, quarterly recertification, thirteen loaders) is infrastructure for a product that has not yet earned it. The PRD knows this, which is why the survival criterion is 'the analyst runs it unassisted', but it then specifies an ops burden that no department analyst on a time fraction will carry. What should actually be built is the printed list, the diff against periop, and the mailbox; the ledger is M2 work if month two is opened.

**premises_challenged**

1. **premise:** P6 and section 1: 'the ledger and the dispute path are the product.' Surgeons will dispute individual records on FCOT, duration accuracy and same-day cancellations, and a sustained dispute visibly changing the list is what builds trust and drives return visits.
   **why_wrong:** Surgeons dispute numbers that carry consequences: wRVUs in the comp letter, block reallocation, OPPE. The wedge four have no target, no rank and, by design, no consequence. A surgeon will not spend ten minutes filing a structured dispute on a delay reason for a 60% FCOT that the plan itself says changes nothing (R-58: 'a delay-reason correction changes the row and not the count'). The one metric the brief calls 'live' and ties to comp, Work RVUs, is deferred to M5 with no record list and no dispute action. The plan puts the dispute machinery on the metrics surgeons care least about and withholds it from the one they care most about.
   **evidence_that_would_prove_it:** In M0, the surgeon reviewing the printed list marks fewer than two records and asks 'what happens if I dispute this?' rather than disputing. In M1, the reply log shows under three disputes across all pilot surgeons in three months, and month-three interviews say some version of 'I'd look if it were my wRVU number.' Conversely, a surgeon keeping their own FCOT spreadsheet or a chief who has spent two hours on one surgeon's periop number would prove me wrong; the PRD admits nobody has found either.

2. **premise:** D-15, R-84, G1: the four wedge numbers can and should reconcile to periop's report with zero tolerance (numerator and denominator equal as integers) before any surgeon sees a number.
   **why_wrong:** Periop's report is produced from a different snapshot date, with late OR-log edits, add-on cases, cases in rooms outside the neurosurgery block, and periop's own first-case and room-eligibility rules that are not in the case-level extract. The technical design already ships a fixture test proving the brief's own FCOT definition does not reconcile (D-09). A zero-tolerance integer gate will stop publish every month on one-case deltas and turn the analyst's job into authoring 'definition deltas' for each surgeon. Reconciliation is the right instinct; a hard stop at zero tolerance is the wrong mechanism.
   **evidence_that_would_prove_it:** In M0, the FCOT recomputation matches periop's per surgeon for fewer than all pilot surgeons, and at least one difference cannot be explained from the extract alone (snapshot timing, a case periop excluded by a rule not in the extract). If every surgeon reconciles to the integer on the first try, I am wrong and the gate is cheap.

3. **premise:** Section 2, 'the real competitor is the periop report plus the OPPE packet plus the faculty-meeting slide.' No institutional tool already does this.
   **why_wrong:** MGB runs Epic. Clinic notes closed within 72 hours is an Epic Signal measure; third-next-available and new-patient visits are standard Cogito/Slicer Dicer reports; Epic ships provider efficiency profiles; periop analytics almost certainly already publishes in the enterprise BI tool (Tableau or Power BI) with row-level security that has already passed security review. Vizient's own portal shows O/E by attending. The PRD never mentions Epic and never asks whether periop could add a per-surgeon case-list tab to the report it already produces. If they can, the 'product' collapses to a dispute mailbox and a definitions page, which is a far better outcome than a department-owned Postgres.
   **evidence_that_would_prove_it:** One meeting with periop analytics and the enterprise BI team in M0 answering: does your existing surgeon-level report have a case-level drill, and could a surgeon-scoped view of it be published with row-level security in the tool you already run? If the answer to either is yes, the M2 hosted view and most of section 10 should not be built by the department.

4. **premise:** P7 and TA-02: emailing a surgeon's case list as a CSV needs no new host or governance path, and the M1 database can live as a local PostgreSQL with PHI on the analyst's workstation.
   **why_wrong:** Every AMC information-security policy I have worked under prohibits PHI databases on endpoints, even encrypted ones, and treats a case-level CSV attachment (dates, rooms, procedures, surgeon) as PHI-adjacent operational data that the privacy office wants in an approved enclave, not a mailbox. The plan's own fallback (D-31, numbers-only email) concedes the risk, and if that fallback fires, goal G2's 'open their case list' cannot be measured until M2, which is gated on a VM that has not been requested yet.
   **evidence_that_would_prove_it:** The privacy office or information security takes more than six weeks to answer, answers with a condition (enclave, no attachments, no local database), or both. If they say yes in writing within two weeks with no conditions, the premise holds.

**dimension_verdicts**

| dimension | verdict | reason |
|---|---|---|
| premises valid | partial | The brief's six ground rules are sound and unusually well thought through for a departmental brief (min-n, anonymity, drill to records, O/E only where a model exists, no hand-entered complications). But the plan's own core premises are untested: demand is tagged UNKNOWN with no surgeon quoted; P6 (disputes drive trust) is asserted for metrics with no consequence; P7 (email needs no governance) and TA-02 (local PHI database) are optimistic for an AMC; D-15 zero-tolerance reconciliation is likely infeasible. The document is honest that these are unconfirmed, which is to its credit, but it then specifies 112 requirements on top of them. |
| right problem | partial | The underlying problem is real and correctly named: surgeons cannot see the records behind the numbers used about them and cannot correct a wrong one. But the plan converts that problem into 'the department builds and operates its own record-level data platform' when the shortest path may be getting periop to distribute the case list it already has and adding a dispute mailbox. It also solves for the metrics surgeons care least about first and defers the comp-linked wRVU number that would actually get the email opened. |
| scope calibration | disagree | M1 alone is 68 features, and the 'wedge' carries a six-schema PostgreSQL ledger with ten database roles, RLS on eleven tables, pgaudit, a hash-chained audit export, nightly dumps, restore drills, quarterly access recertification and thirteen loaders, to send a plain-text email with four numbers whose dispute path is an email reply and a spreadsheet. The 927-line PRD (with 62 open questions and 49 technical decisions) was derived from a 215-line brief without a human in the loop. A wedge that is this thick is not a wedge; it is a platform with a small first feature. |
| alternatives explored | disagree | The non-goals show the alternatives ruled out were about sequencing (start with quality, static pages, competing FCOT), not about whether the department should build at all. Missing entirely: asking periop analytics to add a per-surgeon case-list drill to their existing report; publishing a surgeon-scoped view in the enterprise BI tool that already has row-level security and a passed security review; using Epic's existing provider dashboards for the clinic and access metrics; a three-month paper-and-mailbox pilot with no database; leading with the wRVU mirror because it is the number surgeons open. Epic is not mentioned once. |
| competitive or market risks | partial | The report-card literature risks (gaming, case selection, small-n noise, fake anonymity) are handled better than in most hospital plans: no composite, no rank, intervals, opt-out, 'the spread hides names, not people.' What is missing is the institutional risk: periop analytics is asked to ship an extract, sign reason sets, receive monthly override lists and be reconciled against with zero tolerance, and gets nothing in return; they will read this as a department auditing their report. Enterprise analytics and Epic governance may see a shadow data warehouse holding PHI on a workstation. Those two groups can end the project without a surgeon ever opening an email. |
| six-month trajectory | partial | The kill and pause criteria are genuinely good and rare in an internal-tools plan. But the realistic six-month state, given M0 before code, a ticketed extract, a privacy-office answer, a VM request and a named analyst on a chair-approved fraction, is: M0 done, one or two emails sent, a Postgres on an analyst's laptop, and a runbook only the builder can execute. M3 through M7 are not a six-month trajectory; they are a wishlist gated on eight external owners, and the document does not say so plainly. Section 13 should state what month six looks like if everything goes right, and it is 'three emails and a decision on whether to keep going.' |

**top_findings**

1. **severity:** blocking
   **finding:** The M1 build is a data platform for a product that is an email, a CSV, a mailbox and a spreadsheet. Sixty-eight features, a six-schema database with ten roles, RLS, pgaudit, hash-chained audit, restore drills and recertification are specified for months one to three, while the dispute path in those same months is an analyst typing email replies into a sheet (R-71). The survival goal (G6, an analyst on a time fraction runs it unassisted) is contradicted by the operational load in 10.5 and 10.6.
   **location:** Section 13 (M1 row), section 10.5, section 10.6, R-71, G6
   **fix:** Redefine M1 as: one script that reads periop's extract, attributes cases, computes the four numbers, diffs them against periop's report, and writes one plain-text email and one CSV per surgeon to a folder; a shared sheet as the dispute ledger; a mailbox. No database, no roles, no audit chain. Move the ledger, roles and audit to M2, where a hosted view actually needs them, and only if month two clears the kill criterion.

2. **severity:** blocking
   **finding:** No surgeon and no chief has been interviewed; demand is tagged UNKNOWN and the only planned test is one printed list to one surgeon. The plan then commits 112 requirements against that unknown. The PRD names the evidence that would change its position (a surgeon who disputed a number and had nothing to point at; a chief who spent two hours on one surgeon's numbers) and has not gone looking for it.
   **location:** Section 2 (Demand evidence and its gaps), section 13 (M0)
   **fix:** Before any M0 code: five 20-minute conversations with surgeons across subspecialties and two with chiefs, one question each ('tell me about the last number about you that you thought was wrong; what did you do?'). Record the answers in the PRD. Make 'at least two surgeons describe a specific disputed number' a gate for M0, and expand M0's printed-list test from one surgeon to three.

3. **severity:** material
   **finding:** Zero-tolerance reconciliation to periop's report (integer numerator and denominator equality, no tolerance) will block publish monthly on snapshot-timing and rule differences that are not visible in the extract. The technical design already ships a fixture proving the brief's own FCOT definition does not reconcile.
   **location:** R-84, D-15, G1, section 10.2 (M0 row, D-09)
   **fix:** Keep the reconciliation report, drop the hard stop at zero. Publish when unexplained differences are under a stated threshold (for example, one case per surgeon per metric) and print 'differs from periop by N cases: <reason>' on the tile. Escalate to a stop only when an unexplained difference exceeds the threshold.

4. **severity:** material
   **finding:** Epic and the enterprise BI tool are never considered as alternatives. Clinic notes within 72 hours, third-next-available and new-patient visits are standard Epic Signal/Cogito measures; periop's surgeon-level report likely already lives in Tableau or Power BI with row-level security that has passed security review. If periop can add a per-surgeon case-list tab to its existing report, most of section 10 should not be built.
   **location:** Section 2 (Status quo), section 15, section 3.2
   **fix:** Add an M0 task: one meeting with periop analytics and enterprise analytics asking (a) does your report have a case-level drill, (b) can a surgeon-scoped view be published in your tool with row-level security, (c) which of the brief's 25 metrics already exist in Epic dashboards. Record the answers as a new subsection of section 2 and re-scope M2 and M7 against them.

5. **severity:** material
   **finding:** Periop analytics is the only real dependency for the wedge and is treated purely as a supplier: it ships the extract, signs two reason sets, receives a monthly override list and is reconciled against with no tolerance. Nothing in the plan gives periop a reason to say yes or to keep saying yes after the first override list arrives.
   **location:** Section 11 (Periop OR log row), R-66, R-105, R-106, section 15 (Definition disputes)
   **fix:** Make periop a co-owner of the wedge: their name on the email as the source, a co-authored FCOT definition page, shared credit at the faculty meeting where the numbers land, and an explicit statement that the department's number is theirs. Ask them what they want back (for example, fewer ad-hoc requests from chiefs) and put it in the plan.

6. **severity:** material
   **finding:** The one metric the brief calls 'live' and links to the comp plan, Work RVUs, is deferred to M5, with no record list and no dispute action, while the four wedge metrics have no consequence for anyone. The adoption goal (half of surgeons open month two unprompted) depends on the email containing something a surgeon wants to see.
   **location:** R-80, R-81, OQ-33, section 13 (M5), G2
   **fix:** After M0, evaluate wRVU as the second tile in the month-one email: the PBO report already exists monthly, a mirror tile with as-of date needs no records, and the comp office confirmation (G8) is a one-meeting ask. If the comp office says no, keep the deferral, but decide it on evidence rather than sequencing preference.

7. **severity:** material
   **finding:** A local PostgreSQL holding surgeon-identified case data on an analyst's workstation, and case-level CSV attachments by email, are assumed to need no governance beyond a privacy-office confirmation. In most AMCs, information security prohibits PHI databases on endpoints regardless of encryption, and the plan's own fallback (numbers-only email) would defeat the case-list goal.
   **location:** D-02, TA-02, P7, D-31, section 10.6 (Environments)
   **fix:** Ask information security in week one whether an existing departmental or research enclave, or the enterprise BI platform, can host the M1 data; treat 'PHI on a workstation' as unavailable until they say otherwise. Write the M1 script so it runs anywhere with a CSV in and a folder out, so the enclave question does not block the printed-list test.

8. **severity:** minor
   **finding:** The 'one command' survival criterion is three commands plus a multi-page runbook, a daily checklist, a weekly status email, a nightly dump, a quarterly restore drill and a quarterly access recertification. G6 will not be met by a department analyst on a time fraction.
   **location:** R-82, D-48, section 10.6, G6
   **fix:** Cap the M1 runbook at one printed page and count the steps in it; anything that does not fit moves to M2 or is deleted. Have the named analyst, not the builder, run the second month from that page and time it.

9. **severity:** minor
   **finding:** Adoption (G2) is measured by 'reply to or report opening' a plain-text email with no tracking, so the kill criterion rests on self-report collected at a month-three interview that is not yet designed. Step zero attendance also creates two classes of surgeons on the same email (attendees get a spread, non-attendees stay in denominators without one, R-37).
   **location:** G2, R-95, R-37, section 14 (Adoption)
   **fix:** Write the month-three interview instrument now (five questions, ten minutes) and put it in section 14. Allow step zero to be satisfied by a recorded five-minute video plus an emailed acknowledgment so a missed faculty meeting does not split the pilot cohort.

**what_i_would_build_first**

> Forty-eight hours, one engineer, no database. Hour 0 to 4: get periop's case-level extract for the last three months (or, if the ticket has not landed, the synthetic fixture with the same columns) and their surgeon-level report for the same months. Hour 4 to 20: a single Python script, under 400 lines, that reads the extract, credits each case to the first-listed primary surgeon and flags multi-panel cases, computes OR case volume, FCOT (with grace window and room eligibility as two parameters at the top of the file), duration estimate accuracy and same-day cancellations per surgeon per month, prints the co-surgeon rate per subspecialty, and writes one plain-text email body plus one CSV of that surgeon's own cases to a folder per surgeon, with the four-line 'what this is not' text and 'last refreshed' at the bottom. Hour 20 to 28: a second function that diffs each surgeon's four numbers against periop's report and prints the table of differences, so we learn in M0 whether reconciliation is a one-case problem or a definition problem. Hour 28 to 36: create the dispute mailbox and a one-tab shared sheet (case id, field, claim, filed, chief, decision, date, note); print the half-page 'what this is not.' Hour 36 to 48: hand one printed case list and the half-page to one surgeon with the chief in the room, watch them read it, write down every mark they make and what they expected to happen next, and ask the chief what they would do with each mark. The deliverable is not code; it is the co-surgeon rate, the reconciliation diff table, and one surgeon's red-pen marks. Those three facts decide whether anything in section 10 gets built.

Note on the verbatim text: the outside voice names products (Epic, Cogito, Slicer Dicer, Tableau, Power BI) and states what "every AMC" policy does. Those are the reviewer's claims, kept verbatim because the rule is verbatim; no PRD amendment repeats them. Every PRD change below is written as a question to an owner, because the brief and the design doc do not say what the institution runs or what its policies allow.

---

## CEO consensus table

The native review has no six-dimension verdict table of its own, so the Claude column is derived from the sections that cover each dimension (0A, 0B, 0C, 0E, 0G, Section 10, the pre-review landscape check). Coverage: native completed (11 sections); outside not available, replaced by a Claude subagent, which the autoplan rule counts as native only. Consequence: every consensus cell is N/A, none is CONFIRMED, and a verdict disagreement becomes a Taste decision carried by the disposition rows below. Single-voice critical findings flagged: the two blocking findings (T-01, T-02) were raised by one voice only.

| Dimension | Claude (native review) | Outside (Claude subagent) | Consensus |
|---|---|---|---|
| Premises valid | agree: 0A accepted P1, P6, P7, P8, P11, P12; questioned P5 without overturning it; found and fixed the one unstated premise (goal G1 versus TA-06, L-12) | partial: demand UNKNOWN with no surgeon quoted; P6 asserted for consequence-free metrics; P7 and TA-02 optimistic; D-15 likely infeasible | N/A, native only. Verdicts differ: DISAGREE, Taste; carried by T-02, T-03, T-07 |
| Right problem | agree: 0A names the problem (two numbers, no list, no dispute that changes anything) and finds the plan solves the surgeon's pain directly and the chair's by proxy | partial: the problem is real, but converted into a department-built platform; the comp-linked number is deferred | N/A, native only. DISAGREE, Taste; carried by T-04, T-06 |
| Scope calibration | agree: 0E chose SCOPE EXPANSION; 0G "Holds" kept ten roles, RLS and the pub contract at M1; X1 to X8 dispositioned | disagree: 68 M1 features and a six-schema ledger to send an email whose dispute path is a sheet | N/A, native only. DISAGREE, Taste; carried by T-01 |
| Alternatives explored | partial: 0B ran the reuse ladder and recorded the Flask-over-BI deviation (D-04); 0D called alternatives only where a decision was required; the landscape search was not run | disagree: no build-versus-ask alternative; periop's own report, the enterprise BI tool, the EHR's dashboards, a paper pilot and a wRVU-first email never considered | N/A, native only. DISAGREE, Taste; carried by T-04, with T-01 and T-06 |
| Competitive or market risks | partial: report-card risks covered through the design doc's prior art; the landscape search was not run; institutional risk (periop, enterprise analytics) not examined | partial: report-card risks handled; institutional risk from periop and enterprise analytics unaddressed | N/A, native only. Same verdict, different gap named; carried by T-05, T-07 |
| Six-month trajectory | agree with one WARNING: Section 10 found the P8 survival story has no milestone; 0C shows movement toward the ideal on every axis touched | partial: kill criteria good; the realistic month six is M0 plus two emails; section 13 should say so | N/A, native only. DISAGREE, Taste; carried by T-08 |

Summary: 0 CONFIRMED; 5 DISAGREE to Taste; 1 same verdict (N/A, native only); 0 User Challenges (no item where both voices want to change the user's stated direction).

---

## Cross-model tension dispositions

Rule applied (headless): where the native review already made a recommendation, keep it and record the disagreement as a Taste item; where it made none, apply the CEO tiebreakers (P1 completeness, P2 boil lakes) and accept what is in blast radius and under a day; never invent institutional policy; never reduce scope on a complete plan (autoplan Mechanical rule). "Blast radius" here is the PRD's sections 2, 11, 13, 14, 15 and 16 and the requirement rows named; no code exists yet.

| ID | Source | Outside position (short) | Native position (cited) | Decision | Principle and reason | PRD change | Held for the human |
|---|---|---|---|---|---|---|---|
| T-01 | Finding 1, blocking; dimension "scope calibration" | Redefine M1 as one script, a shared sheet and a mailbox; move the ledger, roles and audit to M2 | 0G Holds kept ten roles, RLS and the pub contract at M1; L-20 declined X1; the catalogue's blocking finding on F-111 and D-25 put the dispute ledger at day one; P6 needs a sustained dispute to change the list, which is a ledger write | REJECT | Autoplan CEO rule: reducing scope on a complete plan is always no (Mechanical); P1 completeness; a native recommendation exists and is kept. The valid part of the point (goal G6 against the 10.5 and 10.6 load) is taken through T-09 | None for M1 scope; R-82 via T-09 | Yes, Taste. Alternative: the script-and-sheet M1. Downstream impact: D-25, F-111, R-57, R-61, R-99 and section 10 move to M2; goal G3's "outcome visible on the row" is a spreadsheet cell for three months; the hash-immutable definitions (D-07) and the reconciliation gate (F-81) would need a home outside the ledger |
| T-02 | Finding 2, blocking; dimension "premises valid" | Interview five surgeons and two chiefs before M0 code; gate M0 on two surgeons describing a disputed number; expand the printed list from one surgeon to three | 0A: demand is UNKNOWN and M0 is designed to find the evidence; no native recommendation to add conversations | PARTIAL | P1, P2: in blast radius (sections 2, 13, 14, 15), no code, one week of calendar. The conversations, the record in section 2 and three printed lists are accepted. A hard stop on fewer than two stories is a new kill criterion on the owner's Assignment; recorded as an owner decision in the kill column and held as Taste | Section 2 "Evidence M0 collects"; section 13 M0 gate, exit and kill; section 14 Demand row; section 15 Demand row | Yes, Taste: whether fewer than two disputed-number stories stops M1 automatically |
| T-03 | Finding 3, material; dimension "premises valid" | Drop the zero-tolerance hard stop; publish under a stated threshold with the difference printed on the tile | Section 1 finding 1 and L-04 strengthened R-84; D-15 endorsed in PRD section 10.3 ("surfaces one-case attribution differences instead of hiding them"); X7 declined | PARTIAL | Headless rule: the native recommendation (keep the hard stop) exists and is kept; the outside point is valid and is tested rather than argued: the M0 diff marks each difference explainable from the extract or not, and the owner confirms zero tolerance or sets a threshold before the first M1 close. Extends L-04's Taste item | R-84; section 13 M0 exit and kill; section 15 "Reconciliation blocks monthly"; 16.6 | Yes, Taste (with L-04): zero tolerance versus an owner-set threshold |
| T-04 | Finding 4, material; dimensions "alternatives explored", "right problem" | Ask periop analytics and enterprise analytics three questions at M0; re-scope M2 and M7 against the answers | 0B kept the BI path open (D-36) and recorded the Flask deviation; the landscape check was not run; design doc Q2 and OQ-54 already ask whether periop distributes surgeon-level lists | PARTIAL | P1, P2: one meeting and a record, in blast radius. Pre-committing to re-scope M2 and M7 on an unknown answer is not taken; the PRD records the condition under which M2 is re-scoped. No PRD sentence asserts what the institution runs | Section 2; section 13 M0 gate, exit and kill; section 15 "An institutional tool already does part of this"; 16.6 | No (Mechanical once the answers exist) |
| T-05 | Finding 5, material; dimension "competitive or market risks" | Make periop a co-owner: name on the email as the source, co-authored definition page, shared credit at the faculty meeting, ask what they want back | Not examined by the native review; section 11, R-66, R-105 and R-106 treat periop as a supplier with sign-offs | PARTIAL | P1, P2: the source on the tile already exists (F-51, F-97; section 9.3); periop's review of the definition page text and periop's ask cost one meeting each. Shared credit at the faculty meeting is the chair's call and is not written as a requirement | R-105, R-106; section 11 periop row; section 15 "Periop analytics as supplier only" | No |
| T-06 | Finding 6, material; dimension "right problem" | Evaluate Work RVUs — live tracker as the second tile of the month-one email after M0 | Not examined; the design doc sequences wRVU to M5 behind goal G8 and OQ-33; the brief's owner holds the deviation | PARTIAL | Headless rule: no native recommendation; the design doc's sequencing is the user's direction and one voice wants to change it, so Taste, not a User Challenge. The comp office is asked at M0 whether goal G8 can precede M1; R-80 and R-81 stay at M5 | Section 11 wRVU row; section 13 M0 gate and exit; 16.6 | Yes, Taste: the mirror tile in the M1 email under OQ-33; downstream impact: the PBO loader, `Kind.MIRROR` and `gate.comp_office` move from M5 to M1 |
| T-07 | Finding 7, material; dimensions "premises valid", "competitive or market risks" | Ask information security in week one; treat PHI on a workstation as unavailable until they say otherwise; make the M1 script run anywhere with a CSV in and a folder out | Section 1 single point of failure (2) and Section 3 secrets row keep the workstation interim declared to the privacy office (TA-02); OQ-61 already asks information security for the off-host location | PARTIAL | P1, P2: the question is added to M0 beside OQ-61 and the answer becomes an M1 gate condition. Flipping the default would invent institutional policy the brief does not state (TA-02 is a fact to confirm, PRD 10.8). The M0 recount runs from the extract files, so the printed list does not wait on the answer | PRD 10.8; section 13 M0 and M1 gates; section 15 "Workstation interim refused"; 16.6 | No |
| T-08 | Dimension "six-month trajectory" | Section 13 should state what month six looks like if everything goes right | Section 10 flagged the missing P8 milestone; 0C direction toward the ideal | ACCEPT | P1: one paragraph, in blast radius; an honest calendar costs nothing and prevents the plan being read as seven milestones in six months | Section 13 "Month six, if everything goes right" | No |
| T-09 | Finding 8, minor | Cap the M1 runbook at one page; the analyst, not the builder, runs month two and times it | R-82 and D-48 (three commands as one runbook step); goal G6 already names an analyst who is not the builder | PARTIAL | P2: in blast radius (R-82, section 14); the page cap and the timed run are added. The quarterly items in 10.5 and 10.6 (dump, restore drill, recertification) stay because the security review will ask for them (0G Holds) | R-82; section 14 Survival row | No |
| T-10 | Finding 9, minor | Write the month-three interview instrument now; allow step zero by recorded video plus an emailed acknowledgement | L-07 added the zero-dispute question (R-95); R-37 keeps non-attendees out of the spread (OQ-10) | PARTIAL | P1: the instrument is added to R-95 and section 14. Step zero by video changes the design doc's trust sequencing (the meeting is where "the spread hides names, not people" is said aloud); held for the owner under OQ-10 | R-95; section 13 M1 gate; section 14 Adoption row | Yes, Taste: step zero by video and acknowledgement (OQ-10) |

Counts: 10 tensions dispositioned. ACCEPT 1 (T-08). PARTIAL 8 (T-02, T-03, T-04, T-05, T-06, T-07, T-09, T-10). REJECT 1 (T-01). Of the seven blocking or material findings: 0 accepted whole, 6 partial, 1 rejected. User Challenges: 0. New Taste items for the human: 5 (T-01, T-02, T-03, T-06, T-10), listed under Unresolved decisions with L-04 and L-10.

What the PRD gained, by section: section 2 "Evidence M0 collects before code"; section 13 M0 row (three printed lists, seven conversations, the periop and enterprise analytics meeting, the information security and comp office questions, the per-surgeon reconciliation diff, three owner decisions in the kill column), M1 gate (periop's page review, the interim-store answer, the interview instrument) and "Month six, if everything goes right"; R-82, R-84, R-95, R-105, R-106 amended; section 11 periop and wRVU rows; section 14 Adoption, Survival and a Demand row; section 15 Demand amended and four rows added; 16.6 new; 10.8 TA-02 note; appendix A count, appendix C row 0.4, appendix D prose and the ceo block extended. Nothing was removed and no earlier accepted row was altered.

Status: DONE_WITH_CONCERNS.
