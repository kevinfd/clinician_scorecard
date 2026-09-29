# /plan-eng-review: Clinician Scorecard PRD

Target: `docs/PRD.md` (v0.7, DRAFT) with `docs/03-technical-design.md` (v1.0) as its architecture and `DESIGN.md` as its frontend system. Date: 2026-09-29. Run headless by the gstack plan-eng-review methodology with no human present; every decision point took the recommended option, else P5 (explicit over clever) then P3 (pragmatic); every auto-chosen decision is listed under "Headless decisions". This review runs last in the autoplan order and reads the plan as amended by the CEO review, the design review and the impeccable pass. It is the only review that gates shipping. Nothing here is APPROVED; the plan stays DRAFT.

Scope gate: plan mode, auto-selected B (reviewing `docs/PRD.md`). Design doc check: `docs/designs/clinician-scorecard.md` (office-hours, DRAFT) read as the source of the problem, constraints and approach; `DESIGN.md` read as the frontend system. Retrospective learning: `git log --oneline` shows ten commits, all documents, none reverted; no application path exists yet, so history proves nothing about any path ("not available").

**MODE: FULL_REVIEW.** The complexity selectors trip (M1 alone is about 60 source files, 30 ledger tables, ten database roles and four new services: loaders, engine, disputes, publish), which is the STOP condition for Scope Challenge B. Headless, the autoplan rule "scope challenge: never reduce on a complete plan" applies, every feature-cut question was asked and answered No (below), and the structure question found no smaller arrangement that keeps every accepted contract. Scope is accepted as-is: FULL_REVIEW, not SCOPE_REDUCED.

How to read findings: `[SEVERITY] (confidence: N/10) location: description`, with the design text that motivates it quoted. Unquoted findings are capped at confidence 5 (pre-emit verification gate). Citations use F-xx, R-xx, D-xx, J1.4, OQ-nn, G1 to G18 (the technical design's run gates; goals are written "goal G1"), PS-n and TA-nn. Metric names are the brief's, verbatim.

---

## Scope Challenge

### A. Assess the target

**What already solves each sub-problem.** Greenfield: no code, no helper in this repo. The reuse ladder therefore starts at the standard library and the platform (Section 2 applies it per proposed library). The three earlier reviews and the impeccable pass have already settled product scope, the email and page contracts and the token set; this review does not reopen them.

**Minimum changes that achieve the goal.** The goal for the shipping unit (M1) is: three monthly emails on real periop data, reconciled to periop's report, with a dispute path that changes the record list. The technical design's M1 column (section 10.2) lists what that takes. Everything in it traces to a Must requirement or to a cross-cutting invariant (PS-1 to PS-9). Nothing in M1 is deferrable without breaking an accepted contract from the ceo or design block in appendix D.

**Complexity check.** M0 plus M1, counted from the technical design's repository layout and module lists:

| Unit | Count | Where counted |
|---|---|---|
| Python modules (M1) | about 60 (`cli`, `log`, `settings`, `ledger/db`, `ledger/invariants`, 3 loaders + `_base` + `convergence`, `attribution/` 4 files, `definitions/` 2 shared + 4 wedge + 3 division-only + 2 pending + 1 block, `engine/` 13, `disputes/` 10, `publish/` 15, `roster`, `audit`, `retention`, `doctor`, `synth`) | "Repository layout"; "Package layout"; "Module layout and CLI surface" |
| SQL migrations and roles | about 30 tables across `raw`, `src`, `ledger`, `restricted`, `privileged` (empty), `pub` (empty); `roles.sql`; trigger functions | "Entity catalogue"; "DDL sketches" |
| Database roles | 10 (`loader`, `svc_survey`, `engine`, `publisher`, `disputes`, `retention`, `app`, `analyst_ro`, `bi_ro`, `migrate`) plus the `scorecard_cli` login | "Roles and grants" |
| Templates | 8 plain-text (`templates/*.txt.j2`, `override_list.csv.j2`, `preview_index.html.j2`) | "Module layout and CLI surface for this section" |
| Test modules | about 45 named for M1 | "Test strategy"; "Tests that pin the contract" |
| CLI subcommands | about 35 | "Command reference" |
| M2 adds | `web/` (app, authz, queries, 10 views, 20 templates, CSS, fonts, charts), `ledger.identity`, RLS policies on 11 tables, `deploy/` (4 systemd units, nginx, postgresql.conf), about 15 test modules | M2 row of the build order |

Both selectors trip (8+ files; 2+ new services). Fewer moving parts were examined: the sections below name the ones that could merge and why they do not.

**Search check (built-ins and current practice), labelled per the digest.**

| Pattern in the plan | Layer | Verdict |
|---|---|---|
| Append-only ledger with `is_current` flags, restatement chain, partial unique indexes | [Layer 1] tried and true | Keep. The partial unique index is the Postgres idiom for "one current row"; the trigger-refused UPDATE is standard |
| Definitions as hashed Python files, one per version | [Layer 3] first principles, defended in D-07 against YAML plus evaluator | Keep. The same mechanism as a migration file, applied to metric logic |
| SCD2 roster with `daterange` and gist exclusion | [Layer 1] | Keep |
| Stage roles with `SET ROLE` per stage, `NOINHERIT` login | [Layer 1] | Keep |
| RLS as defense in depth behind a tested matrix | [Layer 1] | Keep; extend the RLS set (Section 1, finding 5) |
| Synchronous recompute inside an HTTP request (D-26) | [Layer 2] new and popular for small apps; scrutinized in Section 1 finding 8 and Section 4 | Keep with the send decoupled from the request |
| Advisory locks for engine serialization | [Layer 1]; the plan omits it (CEO review L-16, T7) | Add (Section 1, finding 1) |
| Inline SVG charts from an in-repo module (D-35) | [Layer 3] | Keep; 300 lines is smaller than any vendored library's review surface |
| Plain-text email with one CSV, no HTML (D-29) | [Layer 1] | Keep |
| Hash-chained off-host audit export | [Layer 1] (syslog forwarding plus a chain) | Keep |

No [EUREKA] item: nowhere do first principles contradict conventional practice.

**TODOS.md cross-reference.** No `TODOS.md` exists. The CEO and design reviews listed deferred items under "NOT in scope" and said so. This review writes `TODOS.md` at the repository root with every deferred item from all three phases (autoplan's Eng-phase rule), and lists its contents under "NOT in scope" below.

**Completeness check.** Every shortcut the plan could take that would save only AI minutes has been refused: full gate coverage, full state-machine enumeration, every catalogue string as a test. Two shortcuts the plan does take are called out in Section 3 as gaps: no end-to-end run of runbook page 1 on the synthetic department in CI, and no transport tests.

**Distribution check.** The artifact is a Python package installed with `pip install -e .` at a tagged release on an MGB-managed workstation (M1) then a RHEL VM (M2), Python 3.12 from an MGB-approved package source (TA-08); CI on MGB GitHub Enterprise or GitLab if available, else pre-commit (D-44). No public distribution, no installer, no container. The gap: no `SCHEMA_VERSION` and package-version coupling is stated for the workstation-to-VM move; `doctor --compare <dsn>` covers row counts, and `test_migrations_replay.py` covers schema replay. Adequate for one deployment.

### B. Complexity selectors (M1 the shipping unit; M2 the hosted view)

Each proposed cut or deferral was asked as its own question and answered headless with the recommended option (never reduce a complete plan; P1 completeness):

| Question | Answer | Why |
|---|---|---|
| M1: defer the dispute ledger, roles and audit to M2 and run M1 as a script, a sheet and a mailbox (the CEO outside voice's T-01)? | No (held as Taste for the human, unchanged) | D-25's reasoning stands: a sheet is a second PHI copy with no state machine; the ceo block keeps the ledger |
| M1: defer `retention.py` and the retention classes? | No | PS-7 and F-113 are Must at M1; the interim two-month class on dumps (D-41) is what stops PHI copies accumulating from month one |
| M1: defer `recompute --version` and `restate` to the first confirmed definition? | No | D-09 says `fcot@v2` may be registered before the first close; the version boundary must render from month one |
| M1: defer the preview state diff (R-113)? | No (Taste flagged by the ceo block, unchanged) | Roster errors are the M1 risk the diff catches |
| M1: defer the `.eml` fallback and NDR ingest? | No | TA-03 says the relay may not have landed by month one; the fallback is the channel then |
| M1: drop `pandas` and compute in SQL plus plain Python? | No (P3 follow-up) | The definition contract is written against frames and the fixtures are golden outputs; changing the contract now costs more than the dependency |
| M2: build the hosted view on the BI tool instead of an app (design doc Approach C)? | No | D-04's reasoning; the dispute button and queue need per-request authorization |
| M2: ship the night scheme (DESIGN.md assumption) with M2? | Kept as DESIGN.md states, Taste for the human | One token block; DESIGN.md supersedes R-120 where they differ (R-120 says so) |

**Structure question (same feature list, contracts and fixes; only file and class arrangement varies).**

Original arrangement: five packages (`loaders`, `attribution`, `definitions` plus `engine`, `disputes`, `publish`) plus `web` at M2, one CLI, one migrations directory.

Smaller arrangement considered: fold `attribution/` into `loaders/` (the rule runs at load step 6) and fold `disputes/` into `engine/` (recompute is the only engine call disputes make).

Answer: keep the original. Reasons: `attribution/rules/*.py` are pure functions with `RULE_ID` and `RULE_VERSION` that `record_participant`, routing test (c) and the provenance panel all read by name; folding them into loaders hides the versioned rule behind a file that also does I/O and breaks `test_purity`-style checks. `disputes/` runs under its own database role (`disputes`) with its own grants; a package boundary that matches a role boundary is the property the security review will look for. Neither fold saves a contract; both cost a boundary. Note: options differ in kind, not coverage; no completeness score.

### C. Resolve findings

1. [P2] (confidence: 9/10) technical design "Repository layout": `cli.py` is one argparse file for about 35 subcommands across five packages; five parallel lanes will all edit it. Remedy: each package exposes `register_cli(subparsers)` and `cli.py` only imports and calls them. Auto-chosen (recommended); P5.
2. [P2] (confidence: 9/10) technical design C-14: "One numbered directory, `scorecard/ledger/migrations/NNNN_<name>.sql`; no section fixes a number". Parallel lanes will collide on numbers. Remedy: reserve ranges per lane at kickoff (0001 to 0019 schemas, roles, run, audit; 0020 to 0039 raw and src; 0040 to 0059 ledger core; 0060 to 0079 engine tables; 0080 to 0099 disputes and delivery; 0100 onward M2). Auto-chosen; P3.
3. [P3] (confidence: 8/10) technical design "Package layout": `definitions/_catalogue.py` and `ledger.reason_catalogue` are two stores for one versioned set, and the technical design's own review log says "The Metric engine section's catalogue table still prints the pre-R-125 peer-under-five template text". Remedy in Section 2 finding 1 (register the Python catalogue by hash, as definitions are). Auto-chosen; P4.

**Scope record.** Accepted scope: M0 plus M1 as the technical design's build order states them, unchanged; M2 as stated; MODE FULL_REVIEW. Structure: original arrangement, with the two mechanical arrangements above (CLI registration per package; migration number ranges). Pending remedies: none; the three findings are accepted as tasks (T14, T15, T9). No feature cut, no deferral, no User Challenge.

---

## Section 1: Architecture review

Boundaries examined: analyst workstation or VM to MGB services (relay, directory, SSO); CLI stages to database roles; engine to surfaces (the artifact model); dispute service functions to the two intakes; the `restricted` and `privileged` schemas to everything else. Data flow examined: the nine-step flow in "Data flow, including the dispute and recompute loop". State transitions examined: dispute (state.py), run (`running`, `ok`, `failed`, `dry_run`), `metric_value.is_current`, override (`active`, `retired`), feed_load (`received`, `loaded`, `partial`, `failed`, `superseded`, `held`). Trust boundaries examined: the authorization matrix and the RLS set; the payload scan; the directory lookup; the gates as data.

The component boundaries are sound: one package, one database, stage roles that match package boundaries, and a rule ("no surface computes a number, composes a reason or filters a peer") that makes the artifact model the only seam between the engine and every renderer. The findings below are the eight places where the design says two things, or says nothing, on a path a tired analyst or the M2 app will hit.

### Findings

**1. [P1] (confidence: 8/10) technical design "The recompute path" and "Roles, grants, restricted and privileged schemas": no mechanism serializes `recompute` against `close`, `restate` or another `recompute`.** Quoted: "`scorecard recompute --dispute <id>` (M1: run by the analyst inside `dispute decide --recompute`; M2: called by the app's decide action, Builder decision 4) does the following in one `ledger.run` of `kind = 'recompute'`" and "`app` is the gunicorn login role, a member of `disputes`, with a second call-scoped connection as `engine` for the synchronous recompute (D-26)". Two engine writers can run at once at M2 (two chiefs deciding in the same minute; a chief deciding while the analyst's `close` for the next period is mid-way). Both flip `is_current` on `metric_value`, `suppression_decision` and `peer_group_snapshot` for overlapping viewers; the partial unique indexes will raise on the loser and the CEO review's schedule B (trend markers written from pre-restatement rows) is silent. Carried from the CEO review as its one CRITICAL GAP (L-16, T7).
Decision D1 (auto-chosen, recommended; P5): one session-level engine writer lock, `pg_advisory_xact_lock(hashtext('scorecard.engine'))`, taken as the first statement of every `close`, `recompute` and `restate` transaction. Per-period locks were considered and rejected: peer snapshots and trend markers span periods, so a per-period lock does not cover schedule B, and a global lock costs nothing at this volume (a recompute is under 5 seconds; a close under 2 minutes). At M2 the app's recompute waits up to 30 seconds (`lock_timeout`) and otherwise returns the already-documented fallback ("decided, recompute failed"; the analyst re-runs). The regression test the CEO review named (pause `close` after compute, run `recompute` on the prior period, resume) becomes the second writer blocking until the first commits, plus a two-recompute test. Recorded as R-130 and T1.

**2. [P1] (confidence: 9/10) technical design "The run pipeline: commands, gates, exit codes" and `ledger.run` DDL: an unexpected exception has no exit code, no run status and no publish refusal by name.** Quoted: the exit-code table has rows 0 to 4 and none for an unhandled error; the DDL reads `status text not null check (status in ('running','ok','failed','dry_run'))`. A `psycopg` or `pandas` error mid-stage leaves the run row at `running` forever; `publish` refuses because the status is not `ok`, so the surgeon-facing risk is nil, but the analyst's runbook has no row and `status --daily` has no item for a run stuck in `running`. Carried from the CEO review (L-17, T8).
Decision D2 (auto-chosen, recommended; P5): a top-level handler in `cli.py` catches any exception from a stage, sets `run.status = 'error'` (the CHECK gains `'error'`), writes `log_path` with an ids-only traceback (the `log.py` allowlist formatter, so a failing row's values are never echoed; the design already says "psycopg errors are wrapped so a failing row's values are not echoed"), prints "stage <name> failed; see <log_path>; publish is refused for <period>" and exits 4. `status --daily` lists any run in `running` or `error` older than 10 minutes. Recorded as R-131 and T2.

**3. [P1] (confidence: 8/10) technical design "Disputes" DDL and "Roles and grants": the trigger that denormalises `dispute.state` cannot run under the grants as written.** Quoted: "`ledger.dispute.state` is maintained by an AFTER INSERT trigger on `dispute_event` so the row and the history cannot disagree" and, in the roles table for `disputes`: "UPDATE `dispute.decision`, `outcome`, `decision_note`, `decided_by_clinician_id`, `decided_at`, `decision_reply_id`, `linked_dispute_id` ... `dispute.state` is written by the trigger, not by the role." A PL/pgSQL trigger function runs with the privileges of the invoking role unless declared `SECURITY DEFINER`; without the UPDATE grant on `state`, the first `dispute_event` insert raises and no dispute can ever be filed. The same applies to the `audit_log` triggers, which the design covers ("Every role has INSERT on `ledger.audit_log`"), and to `refuse_change()`, which needs no grant. `grants check` (G17) compares grants to `roles.sql`, so it would pass while the trigger fails.
Decision D3 (auto-chosen, recommended; P5): declare the state trigger function `SECURITY DEFINER` owned by `migrate`, with `SET search_path = ledger, pg_temp`, and add a schema test that files a dispute as `disputes` on a fresh database and reads `state` back. Recorded in R-57's verification (T3). No PRD row text changes.

**4. [P2] (confidence: 8/10) technical design "The reconciliation gate against periop's report" versus the F-65 feature mapping: a sustained cancellation-reason override makes the adjudicated basis fail the gate.** Quoted, the gate: "compare(ours_adjudicated, theirs) when present: differs only by records with a sustained credited_clinician override naming the case and decision -> explained (dispute ids); differs otherwise and no delta -> unexplained". Quoted, F-65: "a corrected reason outside the surgeon-attributable set removes the case from the as-adjudicated numerator; as logged keeps periop's count (F-65 AC 3, OQ-13)" and "AC 4 as logged stays periop's count; `reconciliation_result` unaffected (OQ-13)". The recompute path step 5 then re-runs the gate and the adjudicated row differs from periop by a field override, not a re-credit: unexplained, run status failed, decision email held. The same applies at M5 to `scan_present` and at M4 to `provider_named`.
Decision D4 (auto-chosen, recommended; P5): `explained_by_kind` gains `sustained_override`; on the adjudicated basis any difference accounted for by active `record_override` rows on records in the cell is explained with their dispute ids; the logged basis is never explained by an override (F-81 AC 3 keeps its meaning: a delay-reason override changes no count on either basis and is not a delta because there is no difference). Recorded as an amendment to R-84 and T4.

**5. [P2] (confidence: 7/10) technical design "Roles and grants", the `app` row: the RLS set omits four tables the app reads that carry one surgeon's data.** Quoted: "The RLS set: `ledger.metric_value`, `metric_value_record`, `suppression_decision`, `peer_group_snapshot`, `comparison_target`, `record`, `attribution`, `dispute`, `src.survey_response`, `restricted.survey_comment`, `restricted.private_note`". Not in the set: `ledger.record_override` (the note and the decider), `ledger.correction_request`, `ledger.reply_log` (the surgeon's reply classification) and `ledger.dispute_event` (notes on transitions, including "on behalf of <surgeon>"). `app` holds SELECT on all of `ledger` by membership of `disputes`. The matrix is the first check and is tested, so this is defense in depth only; but the design's own claim is that "a query bug in `web/views/inbox.py` returns no other surgeon's comments even with the matrix bypassed", and the same bug in `views/disputes.py` would return another surgeon's override note.
Decision D5 (auto-chosen, recommended; P5): add `record_override`, `correction_request`, `reply_log` and `dispute_event` to the RLS set with the dispute policy (disputant, adjudicator of record, receiver); `test_rls_backstop.py` covers fifteen tables. Recorded as an amendment to R-89 and T11.

**6. [P2] (confidence: 9/10) technical design gate G13 versus "SMTP relay and mailboxes": the recipient check names a second source that the roster does not carry.** Quoted G13: "Recipient resolved from the directory and equal to the roster's stored address". Quoted, the relay table: "Recipient: Resolved at send time from the institutional directory by the roster identity (`clinician.person_key`), never typed on the roster (F-90 AC 8, OQ-58); a mismatch between the roster's stored address and the directory blocks that surgeon's send". The roster file contract lists no address column, and the S-10 fix says "a hand-typed UPN is refused". With no stored address the "equal" test is either vacuous (every send passes) or impossible (every send blocks). The failure mode is the design's own worst case: a misdirected case list.
Decision D6 (auto-chosen, recommended; P5): the second source is the address the directory returned at the last successful send for that clinician, held on `ledger.delivery.recipient_address` (new column, publisher-written, never typed); a difference between the two blocks that surgeon's send and lists it; on the first send there is no prior address, so the dry-run index lists every resolved address and the runbook step says the analyst reads them before `--send` (which the design already says for the body). `roster set --identity` does not type an address either; it re-resolves. Recorded as R-135 and T5.

**7. [P2] (confidence: 8/10) technical design "Peer groups" DDL: `peer_group_snapshot` has an `is_current` flag with no partial unique index, unlike `metric_value` and `suppression_decision`.** Quoted: `is_current boolean not null default true` and `unique (viewer_clinician_id, metric_key, period_label, site, run_id)`. With `site` nullable and no `coalesce`, two current system-scope snapshots for one viewer can coexist after a recompute that fails between the insert and the flip (finding 1 makes this rarer; finding 2 makes it visible), and `render.py` reading "the current snapshot" is then undefined. Decision D7 (auto-chosen; P5): `create unique index peer_group_snapshot_current_uq on ledger.peer_group_snapshot (viewer_clinician_id, metric_key, period_label, coalesce(site, '')) where is_current;` and the same on `comparison_target` (which already has it) and `suppression_decision` (already has it). T15.

**8. [P2] (confidence: 8/10) technical design "Builder decision 4 (D-26)" and "The recompute path" step 7: the M2 decide request performs a relay send inside the same request as the decision and the recompute.** Quoted: "the app's decide action calls `engine/recompute.py` synchronously in the same request and transaction as the decision" and step 7 "render artifacts: decision email to the disputant (F-93) ... delivery rows with artifact hash, payload scan and the gate that allowed the send". With a 10-second statement timeout, a 5-second recompute budget and an SMTP relay whose latency is not bounded, the request can time out after the recompute committed and before the delivery row is written; the surgeon then gets `load-failure` on a decision that stands, and the checklist item "decided, recompute failed" is wrong (the recompute succeeded; the send did not). The state table in PRD section 9.7 already anticipates "recompute did not complete; the analyst has been alerted" but not "sent later".
Decision D8 (auto-chosen, recommended; P3 then P5): three commits, not one: (1) the decision events and override; (2) the recompute run; (3) the delivery row written as `pending` before the send, then `sent_at` after. A send that fails or times out leaves `pending`; `status --daily` (and the M2 timer) retries pending decision emails and lists them; the adjudicator's success page reads `decision-recorded` with "the decision email is being sent" when the delivery is pending (a catalogue key, `decision-recorded-sending`). Recorded as R-136 and T10.

Examined and not flagged: the six-schema layout and the grants table are internally consistent after the T-01 rewrite; every write named in the document has a grant, and G17 turns drift into a run failure. The `record_ref` token (D-19) is generated once per natural key, which is what the reply-to-dispute flow needs. The gates-as-data design (`gate.*` rows with a second identity) is the right shape for a hospital review. The `restricted` column grant on `comment_text` to `app` only, with `engine` holding no grant, makes "no metric reads comments" a grant, not a habit. The single VM with no queue is right for tens of surgeons. The email path has no third-party call. Nothing in the trust boundaries lets a surgeon reach another surgeon's row without both the matrix and RLS failing.

Dispositions: findings 1 to 8 accepted as decisions D1 to D8 (ledger, below) with tasks T1 to T5, T10, T11, T15.

---

## Section 2: Code quality review (greenfield)

There is no code to read. What the technical design fixes as conventions was examined instead, because those conventions are what every file will be written against: the package layout, the migrations rule, definitions-as-code, the CLI surface, the web app shape and the `DESIGN.md` tokens.

### Conventions the technical design fixes

| Convention | Where fixed | Verdict |
|---|---|---|
| One package `scorecard`, one CLI entry point, subpackages per stage role | "Repository layout" | Sound; matches the role boundaries. Add per-package `register_cli()` (Scope C finding 1) |
| Plain SQL migrations, numbered, applied by `scorecard migrate`; `roles.sql` idempotent; no ORM | "Data model", conventions; C-14 | Sound. Reserve number ranges per lane (Scope C finding 2); a PR that adds a migration without bumping `SCHEMA_VERSION` fails CI (stated) |
| `text` codes with CHECK constraints, not enum types | "Data model", conventions | Sound; a new value is a migration |
| Definitions: one file per version, sha256 of bytes, `DEFINITION` dataclass plus up to six pure functions, `ctx` as the only I/O | "The definition module contract" | Sound. The purity test is the mechanism; keep `ctx` closed (no `ctx.query`) |
| Reason catalogue: `_catalogue.py` in the package, `ledger.reason_catalogue` in the database, pinned by `reason_catalogue_version` on the definition version | "Package layout"; F-33 mapping | Two stores for one thing (finding 1 below) |
| Service functions in `disputes/` take a connection and plain arguments; CLI and app call the same functions | "Dispute workflow", module layout | Sound; framework-neutral by construction |
| `web/queries.py` with parameter binding only; `test_no_sql_strings.py` greps for f-strings | "Shape" | Sound. The grep is a smell test, not a proof; keep it and add `psycopg.sql` composition for any dynamic column (sortable headers) |
| Server-rendered Jinja2, no JavaScript needed, inline SVG | D-35; "Accessibility baseline" | Sound |
| `DESIGN.md` frontmatter as the token list; every template cites a component name | R-120; DESIGN.md "Components" | Sound in shape; two strings drift (finding 4 below) |
| Logging: `log.py` allowlist formatter, ids only, `--debug` refused on the VM | "PHI minimization" | Sound |

### Reuse ladder applied to every proposed library

| Proposed | Ladder rung | Alternative considered | Verdict |
|---|---|---|---|
| `hashlib`, `email.message`, `smtplib`, `imaplib`, `csv`, `argparse`, `logging`, `datetime`, `secrets` (token) | 2, standard library | none needed | Use |
| PostgreSQL 16 constraints, triggers, RLS, `daterange`, gist exclusion, advisory locks, pgaudit | 3, native platform | application-level checks | Use; the design already prefers DB constraints over app code (I1, I10) and this review adds the advisory lock the same way |
| `psycopg` 3 | 4 (to be installed; [Layer 1]) | `psycopg2` | Use psycopg 3; server-side binding is what `test_no_sql_strings` wants |
| `pandas` | 4 ([Layer 1]) | plain SQL plus Python for 5,000 rows a month | Keep for M1 (the contract and golden fixtures are written against frames); revisit as a P3 follow-up when a definition needs nothing pandas gives |
| `Jinja2` | 4 ([Layer 1]) | `string.Template` | Use; shared between email and app templates |
| `pytest` | 4 | `unittest` | Use |
| `ruff` | 4 | `flake8` plus `black` | Use |
| Flask or Django (D-05), `authlib` or `python3-saml` (D-06) | 4 ([Layer 1]) | header-injecting proxy | Use; the pick waits on the builder's security-review history, recorded in the runbook |
| Chart library | none; in-repo SVG module (D-35) | uPlot vendored | In-repo; 300 lines is the smaller review surface |
| Atkinson Hyperlegible Next, self-hosted | DESIGN.md | IBM Plex (design review) | As DESIGN.md proposes, pending the human (OQ-63) |

No new dependency is added for a few lines anywhere. No LLM or third-party call exists in the runtime path.

### Shared-code rubric

**The definition module contract (`MetricDefinition` plus `in_scope`, `exclusion_reason`, `counted`, `row_detail`, `aggregate`, `applicability`).** Verified first-party callers, from the technical design: `engine/compute.py` at close stage [8] ("rows = in_scope(frame, ctx) ... counted_v = counted(rows[reason.isna()], ctx)"); `engine/recompute.py` step 2 ("load definitions/<metric>/<version_label>.py by the registry's code_hash ... compute basis = 'adjudicated'"); the `scorecard compute --period --metric --clinician` CLI ("prints the frame, rows and aggregate"); and `tests/engine/test_same_function_everywhere.py` ("the email generator, the app view and the gate get identical values from one call"). Four callers, two of them the product's two number-producing paths: the shared contract is earned. Inputs, outputs and errors are identical across callers (a frame and a `ctx`; an `Aggregate`; a `None` param handled by the function). Blast radius of a shared failure: every number; mitigated by golden outputs per version and the hash refusal. Keep the helper small: `ctx` exposes seven things and nothing else; hold that line.

**The reason catalogue (`reasons.render(key, **counts)`).** Verified callers: `engine/suppress.py` (every decision's `reason_text`); `disputes/rowtext.py` ("keys ... registered in `reason_catalogue` (F-33) so email, app and decision email say the same words"); `publish/email_text.py` and the web templates ("Every state string above is a catalogue key rendered by `reasons.render()`"); the pub contract test. Four callers; the helper is one function over one table; earned. Reliability gain: the "no unfilled placeholder" refusal fails the run instead of publishing `<n>`. Net savings: every surface drops its own wording.

**Candidates that do not pass the rubric and stay separate.** `publish/scan.py` and the `file_dispute()` claim scan share the value patterns; the design already says "the send-time scan runs the value patterns on them again". One pattern table, two entry points: that is reuse of data, not a shared helper with different contracts; no extraction beyond the pattern table. The `ClinicianArtifact` builder is one caller (`render.py`) with three consumers; it is a data contract, not shared logic.

### Findings

**1. [P2] (confidence: 9/10) technical design "Package layout" and the Metric engine section's suppression table: the reason catalogue has two authored sources and the technical design admits they have drifted.** Quoted: "`_catalogue.py` # reason text catalogue, versioned (F-33)"; "The reason catalogue (F-33) is `ledger.reason_catalogue (catalogue_version, state_key, template)`"; and the review log: "The Metric engine section's catalogue table still prints the pre-R-125 peer-under-five template text; the PRD (section 9.4) is the current wording and the table is due a version when the catalogue is registered." Three places hold strings (the Python file, the table, PRD section 9.4) and a fourth (DESIGN.md's email grammar) quotes them. Decision D9 (auto-chosen; P4, P5): `definitions/_catalogue.py` is the one authored source, registered into `ledger.reason_catalogue` by the same hash-refusal rule as a definition version (`scorecard register` walks it; a changed hash for a registered catalogue version exits 2); PRD section 9.4 and the R-118, R-126 to R-129 strings become the golden fixture `tests/fixtures/catalogue_v1.json` that `test_catalogue_strings.py` compares to the registered version byte for byte; DESIGN.md and the technical design cite keys, not strings, except in worked examples. Recorded as R-137 and T9.

**2. [P2] (confidence: 9/10) `DESIGN.md` "Pace block" and "Email grammar" versus PRD R-126 and R-129: two component strings predate the impeccable pass that wrote the same file.** Quoted, DESIGN.md: "the unreachable case reads "Flag: cannot reach 8 this year" in Ink, Value size, no colour" and "records line ("Records: 7 rows in the attachment, metric = fcot")". Quoted, PRD R-129: "the unreachable flag is a sentence in counts ("8 of 12 cannot be reached this year: 4 sessions remain and 5 are needed")"; R-126: "The email's records line names the metric as the brief writes it ... never an engine key". Since R-120 says DESIGN.md "supersedes the values in this row where they differ", a builder reading DESIGN.md ships the superseded string. Decision D10 (auto-chosen; P5): amend the two DESIGN.md lines to the PRD's strings now (a mechanical fix inside the blast radius, under an hour) and make `test_catalogue_strings.py` also scan `DESIGN.md` for any quoted catalogue string that is not the registered one. Applied in this run (see "Amendments made"); T9 carries the test.

**3. [P2] (confidence: 8/10) technical design "PHI minimization", payload scan: the date-of-birth heuristic will fire on legitimate cells.** Quoted: "a date of birth (a full date more than 18 years before the period in a non-date column)". `procedure_desc` is the one free-text column accepted and may carry a year ("revision of 2007 fusion"); `delay_reason_code` as stored may carry a date. The scan blocks that surgeon's send and names the field, which is the designed behaviour, so this is an availability finding, not a leak: one procedure string can hold one surgeon's email every month until periop rewords it. Decision D11 (auto-chosen; P3): keep the rule; add `department_setting.scan_allowlist.<column>` for analyst-recorded false positives by exact cell value, each an audit row and listed on the checklist, so a repeat hit is a one-line runbook action, never a scan bypass. T12 carries the test (a fixture with a year inside a procedure name).

**4. [P2] (confidence: 8/10) technical design "The publish stage in detail" and D-34: the directory being unreachable is an environment error for the whole run, while a mismatch is per surgeon.** Quoted: "4 | Environment error | database unreachable; `grants check` drift; migrations behind; SMTP relay refused" (the directory is not listed) and G13 "that surgeon only; others send". The designed behaviour for LDAPS timing out on surgeon 12 of 40 is not stated. Decision D12 (auto-chosen; P5): a directory error is exit 4 for the run after the surgeons already sent keep their delivery rows (the resume rule already covers this), and the run prints how many were sent; the D-34 fallback (a directory export loaded as a feed) is the runbook's next step. T7 carries the test alongside the relay-failure resume test.

**5. [P3] (confidence: 8/10) technical design `ledger.metric_definition_version` DDL: `git_sha char(40) not null` binds registration to a git checkout.** On the VM the design says "git checkout at a tagged release", so it holds; on the analyst's workstation at M0, `pip install -e .` from a checkout also holds. If a wheel is ever installed without `.git`, `register` cannot fill the column. Decision D13 (auto-chosen; P3): `register` reads the sha from `importlib.metadata` (the package version's build metadata) when `.git` is absent, and `doctor` reports which source it used. No PRD change; T14 note.

**6. [P3] (confidence: 7/10) technical design "Test strategy": `test_no_sql_strings.py` "greps `web/` for f-strings, `%` formatting and concatenation that build SQL". A grep cannot tell an f-string that builds a log line from one that builds SQL; it will either miss cases or block harmless ones.** Decision D14 (auto-chosen; P5): keep the grep as the cheap check and add the mechanism: every function in `web/queries.py` builds statements only from `psycopg.sql.SQL` literals and `sql.Identifier` for the sortable column, with a unit test that passes each query function a hostile sort column and asserts it is quoted. T13.

**7. [P3] (confidence: 7/10) technical design "Ingestion", rule 2: "A corrected extract is a new `feed_load` whose rows supersede by `source_key`; old rows stay" together with `ledger.record.current_src_row_id` moving.** A published `metric_value_record` links `record_id`, not `src_row_id`; a surgeon opening a record list after a superseding load sees the new source columns under a number computed from the old ones, until `restate` runs. The design says a superseding load "is a restatement only if `scorecard restate` is run", which is right for the number and wrong for the row text. Decision D15 (auto-chosen; P5): the record list renders the `src` row the number was computed from (join through `metric_value.source_feed_load_id`), and `status --daily` lists "superseded loads with published numbers not restated". T8 carries the test.

**8. [OK] Error handling and edge cases otherwise.** Examined: null primary (exception, blocks publish); empty extract (feed health, reasons, no rows); zero cases for a surgeon (0 with an empty list only when the feed loaded); one-column periop shape (`panel_roles` false, flags null, staging summary says so); overlapping roster windows (gist exclusion); a re-credit to a clinician not on the roster (refused in `decide()`); a third filing (refused); a note with an identifier (refused, pattern named); a `--send` twice (delivery rows found, nothing sent); a relay failure mid-run (resume). Each ends in a named refusal, reason or gate. Nothing else flagged.

Dispositions: findings 1 to 7 accepted as decisions D9 to D15 with tasks T7, T8, T9, T12, T13, T14; finding 2's DESIGN.md fix applied in this run.

---

## Section 3: Test review

Test framework: no `## Testing` section in `CLAUDE.md`; the technical design fixes `pytest` with a fresh PostgreSQL per session (`tests/conftest.py`), synthetic fixtures from `scorecard synth`, CI on a git host if available (D-44). "Existing tests" below means tests the technical design names; none exists as code. A named test is scored on what its description asserts.

### Step 1: code paths traced from each entry point

Entry points: `scorecard load`, `attribute`, `register`, `close`, `reconcile`, `recompute`, `restate`, `publish`, `overrides`, `status`, `dispute file|decide|withdraw|link`, `reply log|answer|ingest-ndr`, `roster load|set`, `setting set|confirm`, `source register`, `retention run`, `audit export`, `doctor`, `migrate`, `synth`; at M2 every route in the page inventory. For each: where input comes from (a file by ticket, a reply in a mailbox, an SSO subject, a CLI argument), what transforms it (loader steps 1 to 6; close stages 1 to 13; the dispute service functions; `render.py`), where it goes (`ledger.*`, `preview/`, the relay, the page) and what can go wrong (the failure modes table below). Every conditional branch is a row in the diagram.

### Step 2: user flows and interaction edge cases

Mapped from J1 to J4 and PRD section 9.7: double submit (M2 dispute form: idempotent on the triple, R-128; decide: refused when decided), navigate away mid-recompute (finding 8 above), stale data (`run-missed`, `restatement-pending`), slow connection (server-rendered, 10-second timeout to `load-failure`), two tabs (roles recomputed per request; a decision in tab A makes tab B's decide refuse), 30-minute idle (`session-expired`, claim not saved: stated, not prevented), zero results ("No rows: ..."), 10,000 results (a record list is one surgeon's period: at most a few hundred rows; no pagination, stated as an assumption above 200), max-length input (claim 1,000 characters, counted live). Empty, zero and boundary states are the catalogue keys of PRD section 9.4 and 9.7.

### Step 3 and 4: coverage diagram

Legend: `[★★★ TESTED]` behaviour plus edges plus error paths; `[★★ TESTED]` happy path; `[★ TESTED]` smoke or existence; `[GAP]` no named test; `[→E2E]` needs an integration or end-to-end test (3+ components, or a mock would hide the failure, or auth/data-destruction); `[→EVAL]` LLM eval (none here: no LLM in the runtime path). Milestone in brackets where not M1.

```
 CODE PATHS (entry -> branch)                                           | COVERAGE
 -----------------------------------------------------------------------|---------------------------------------------
 load: sha256 no-op on the same file                                    | [★★ TESTED]   test_idempotent
 load: corrected file supersedes; old rows stay; record.current moves   | [★★ TESTED]   test_idempotent
 load: column allowlist drops mrn, patient_name; names in checklist     | [★★★ TESTED]  test_column_allowlist
 load: required field absent -> exactly the dependents not_computable   | [★★ TESTED]   test_field_checklist
 load: wrong grain / one-primary-column shape -> panel_roles false      | [★★ TESTED]   test_grain
 load: no --ticket / file missing / bad period -> exit 2 or 3           | [GAP]         no test named for the refusals
 load: convergence retires an override on a matching re-ingest          | [★★ TESTED]   test_convergence
 load: procedure column that looks like notes (>120 chars) refused      | [GAP]
 attribute: ATTR-CASE-PRIMARY tie-break, shared flag, 3 exception types | [★★★ TESTED]  rules pytest, one fixture per branch
 attribute: reload closes and reopens one current row (I1, I11)         | [★★★ TESTED]  invariants I1, I11
 attribute: co-surgeon rate per subspecialty; >5% flag                  | [GAP]         printed only; no assertion named
 register: changed hash refused exit 2; same hash no-op                 | [★★★ TESTED]  test_registry_refusal
 register: overlapping effective windows; label <> file name            | [★★ TESTED]   test_registry_refusal (windows)
 register: definition_open_item closed by a new version                 | [GAP]
 definitions: fcot/duration/cancel golden outputs incl. blank reason    | [★★★ TESTED]  tests/definitions/*
 definitions: purity (no I/O, no comments table)                        | [★★ TESTED]   test_purity
 close: stage order; --dry-run rolls back and prints gate results       | [GAP]         dry-run rollback untested
 close: refuses an unended month (F-84); refuses published w/o --restate| [GAP]
 close: compute; row count == denominator (G7)                          | [★★★ TESTED]  test_invariants
 close: no-blank gate (G8) incl. unfilled placeholder                   | [★★★ TESTED]  test_invariants, test_suppression_order
 close: availability (pending_source, not_in_release, not_applicable)   | [★★ TESTED]   test_availability
 close: feed missing / partial / --accept-partial with note (G3)        | [★★★ TESTED]  test_feed_health
 close: governance flag unset -> not computed (G5)                      | [GAP]         M6 path; test at M6
 suppress: fixed rank order; exact strings per key                      | [★★★ TESTED]  test_suppression_order
 peers: viewer excluded; opt-out removed; 4 vs 5 clearing; per-site    | [★★★ TESTED]  test_peers
 peers: opt-out both directions (self-only AND absent from others)      | [★★ TESTED]   ceo block T6 names it; not yet a file
 peers: month one renders nothing; non-attendee kept in denominators    | [★★★ TESTED]  test_peers, test_month_one
 peers: sole-peer variant (R-129)                                       | [GAP]
 trend: restated marker, version boundary, history_from, gap_reason     | [GAP]         no test named for trend.series()
 reconcile: unexplained stops; delta explains; re-credit explains adj.  | [★★★ TESTED]  test_reconcile
 reconcile: brief assumption does not reconcile (D-09)                  | [★★★ TESTED]  test_brief_assumption_does_not_reconcile
 reconcile: --reconcile-skip refused for a reported metric; missing     | [★★ TESTED]   ceo block (test_reconcile extension)
   report holds publish (R-84)                                          |
 reconcile: sustained field override on the adjudicated basis (D4)      | [GAP]         -> T4
 recompute --dispute: delay reason 6/10 both; re-credit 6/10 vs 6/9;    | [★★★ TESTED]  test_recompute
   min-n crossing clause; restatement rows                              |
 recompute --version --from: only effective periods; boundary marker    | [GAP]
 recompute --roster-change: snapshots rebuilt; as-of template           | [GAP]
 restate: refused without --reason                                      | [★ TESTED]    invariant I8 test
 engine writer lock: close vs recompute; two recomputes                 | [GAP]         CRITICAL -> T1 (R-130)
 cli: unexpected exception -> exit 4, run.status error, publish refuses | [GAP]         -> T2 (R-131)
 disputes: state machine, every legal and illegal triple                | [★★★ TESTED]  test_state
 disputes: route.py a/b/c, route_undefined, survey flag on/off          | [★★★ TESTED]  test_route
 disputes: file validations (third filing, colleague id, claim scan,    | [★★ TESTED]   test_intake (ceo block) + test_state
   field not disputable, no effect notice)                              |
 disputes: decide validations (note, scan hit, actor, decided, receiver | [★★ TESTED]   test_state covers decide-after-decide;
   not on roster, source_corrected without contact)                     |               the other six branches unnamed
 disputes: dispute.state trigger runs as `disputes` role (D3)           | [GAP]         -> T3
 disputes: rowtext every key incl. target date, withdrawn, refile text  | [★★ TESTED]   test_rowtext
 disputes: provenance panel; missing field blocks adjudication          | [GAP]
 disputes: queue over_days 10 and 14; trust report column set           | [★ TESTED]    column set only
 disputes: intake awaiting_row; duplicate reply attaches; ack text      | [★★ TESTED]   test_intake (ceo block)
 publish: ClinicianArtifact parity email / web / pub                    | [★★ TESTED]   test_artifact_parity
 publish: email order, no rulers, month one vs two slot, subject        | [★★★ TESTED]  test_email_order, test_month_one
 publish: body rows cap 20, case id first, scan                         | [★★★ TESTED]  test_email_rows
 publish: CSV columns, row counts, formula escape                       | [★★★ TESTED]  test_csv_columns, test_csv_formula
 publish: what-changed block, restatement notice per category           | [★★★ TESTED]  test_what_changed
 publish: preview diff (R-113)                                          | [★★★ TESTED]  test_preview_diff (ceo block)
 publish: payload scan G12 (MRN col, long cell, allowlisted passes)     | [★★★ TESTED]  test_scan
 publish: scan false positive (a year in a procedure name) (D11)        | [GAP]         -> T12
 publish: own-records G14                                               | [★★ TESTED]   test_own_records
 publish: channel gates G11 (four of five -> fifth refused)             | [★★★ TESTED]  test_gates
 publish: G15 forbidden patterns (rank line fails)                      | [★★ TESTED]   test_what_this_is_not
 publish: directory mismatch blocks one surgeon; unreachable -> exit 4  | [GAP]         ceo T6 names mismatch; -> T7
 publish: relay fails at 20 of 40 -> resume; --send twice sends 0       | [GAP]         ceo T6 names it; -> T7  [→E2E]
 publish: .eml manifest; --record-eml-sent writes sent_at               | [GAP]         -> T7
 publish: NDR ingest -> bounce_at; --resend after identity fix          | [GAP]         -> T7
 publish: published_at written once; last refreshed after a missed run | [★★ TESTED]   test_last_refreshed
 publish: every state string is a catalogue key                         | [★★★ TESTED]  test_catalogue_strings
 publish: catalogue registered by hash; PRD strings golden (D9)         | [GAP]         -> T9
 overrides: one list per feed owner; only unconfirmed rows              | [GAP]
 status --daily: each deadline; two recipients; day-10 surgeon string   | [★★ TESTED]   test_status (ceo block); freeze time
 status --daily: runs stuck in running/error; pending decision emails   | [GAP]         -> T2, T10
 setting confirm: same identity refused; gate opens nothing unconfirmed | [★★ TESTED]   test_gate_confirm (ceo block)
 audit: immutability; export chain break; grants drift; runtime owner   | [★★★ TESTED]  tests/ops/*
 retention: every class unset -> no change; held references             | [★★ TESTED]   test_retention_unset (unset only)
 restore round trip; migrations fresh and replay; doctor checks         | [★★ TESTED]   tests/ops/*
 web [M2]: authz matrix every cell                                      | [★★★ TESTED]  test_authz_matrix   [→E2E]
 web [M2]: RLS backstop on every table of the set                       | [★★★ TESTED]  test_rls_backstop (extend, D5)
 web [M2]: four page outcomes each write one audit row                  | [★★ TESTED]   test_states
 web [M2]: view logging on every surgeon-identified handler             | [★★ TESTED]   test_view_logging
 web [M2]: no typed catalogue text in templates                         | [★★ TESTED]   test_state_strings
 web [M2]: dispute form validation; POST idempotent on the triple       | [★★ TESTED]   test_dispute_form (design block); idempotency [GAP]
 web [M2]: decide request commits, then recompute, then send (D8)       | [GAP]         -> T10
 web [M2]: SSO session idle/absolute expiry, logout, IdP disable        | [GAP]         -> T13  [→E2E]
 web [M2]: run-missed and first-hosted-visit asides                     | [GAP]
 web [M2]: charts strip plot, title sentence, no peer label             | [★★ TESTED]   test_charts
 web [M2]: nav, home layout, records table semantics                    | [★★ TESTED]   test_nav, test_home_layout, test_records_table
 web [M2]: CSP no external URL; 360/1280/200% screenshots               | [★ TESTED]    test_csp; CI screenshot job

 USER FLOWS                                                             | COVERAGE
 -----------------------------------------------------------------------|---------------------------------------------
 J1.1 step zero: attendance and opt-out recorded; chief summary (F-37)  | [★★ TESTED]   test_peers; summary text [GAP]
 J1.2 month-one email opened on a phone (iOS Mail, Outlook, Gmail)      | [→E2E]        R-82 rehearsal, manual, recorded
 J1.3, J1.4 find the late case from the 14th in the body rows           | [★★★ TESTED]  test_email_rows; timed task at step zero [→E2E]
 J1.5 definition appendix reachable from the version stamp              | [★ TESTED]    definitions page text; no email test
 J1.8 quarterly interim state on a non-close month                      | [★★ TESTED]   test_suppression_order (interim kind)
 J1.10 month-two spread, three lines, "You" first                       | [★★★ TESTED]  test_month_one, test_catalogue_strings
 J1.12 -> J2.3a reply, analyst entry, acknowledgement within 2 days     | [★★ TESTED]   test_intake; the 2-day deadline via test_status
 J2.2, J2.3 M2 dispute form -> detail with dispute-filed line           | [★★ TESTED]   test_dispute_form  [→E2E]
 J2.5 -> J2.8 queue, decide, recompute, decision email quoting rows     | [GAP]         no test spans decide -> recompute -> notify [→E2E]
 J2.8a denial; one re-file; third refused                               | [★★ TESTED]   test_state
 J2.9 re-credit: both surgeons recompute; receiver email; counter link  | [★★ TESTED]   test_recompute; receiver email [GAP]
 J2.12 definition question -> open item on the definition page          | [★ TESTED]    outcome write named; page render [GAP]
 J4.1 -> J4.9 runbook page 1 on the synthetic department, end to end    | [GAP]         -> T6 (R-132)  [→E2E]
 J4.11 new version registered; recompute --version; boundary rendered   | [GAP]         -> T8
 J4.13 source registered; earlier periods keep pending                  | [★★ TESTED]   test_availability
 J4.16 roster change; recompute --roster-change; as-of reason           | [GAP]         -> T8
 Analyst: publish --dry-run; preview index read before --send           | [★ TESTED]    preview files written; index content [GAP]
 Analyst: bounce -> identity fix -> --resend                            | [GAP]         -> T7
 Analyst: gate set + backup confirm; publish refuses unconfirmed        | [★★ TESTED]   test_gate_confirm, test_gates
 Analyst: restore drill from the off-host copy                          | [★★ TESTED]   test_restore_roundtrip; drill manual
 Surgeon [M2]: session expires with a typed claim                       | [GAP]         -> T13
 Chief [M2]: double-click decide                                        | [★★ TESTED]   decide-after-decide refused
 Chief [M2]: navigates away during recompute; returns to decision-recorded | [GAP]      -> T10
 Direct leader [M4]: day 29 refused, day 30 allowed, no notes           | [★★ TESTED]   test_leader_gate (M4)

 COVERAGE: 71/108 paths (66%)      code paths 55/85 (65%); user flows 16/23 (70%)
 QUALITY:  ★★★ 30   ★★ 33   ★ 8
 GAPS:     37   (M1: 27, M2: 8, M4/M6: 2)   E2E routed: 7   EVAL routed: 0   CRITICAL: 1 (engine writer lock)
```

Regression iron rule: there is no running code, so no planned change puts existing behaviour at risk. The rule still binds one thing: the ceo and design blocks' accepted requirements each name a test; every one of those tests is kept in the plan above and in the test plan on disk, and none is downgraded.

Critical gap rule applied: the engine writer lock (no test, no error handling, silent) is the one critical gap; it is R-130 and T1 and blocks ship. The unexpected-exception path is not silent to the analyst (a traceback in the log) but has no test and no handling: a gap, not critical; T2. Everything else has either handling or a named test.

### Step 5: missing tests specified

| # | Test (file) | Type | Asserts | CRITICAL |
|---|---|---|---|---|
| M1 | `tests/engine/test_ordering.py` | integration | `close` for period N+1 blocks on a `recompute` for N holding the engine lock and completes after it with the restated marker present and `is_current` unique per cell; two concurrent `recompute` calls on the same dispute serialize and the second is a no-op; the M2 recompute hands back "decided, recompute pending" after `lock_timeout` (30 s) with the decision committed | yes (R-130) |
| M2 | `tests/ops/test_unexpected_exception.py` | integration | an exception raised inside a close stage exits 4, writes `run.status = 'error'` and `log_path`, the log holds ids only, `publish` refuses the period, `status --daily` lists the run | no (R-131) |
| M3 | `tests/ops/test_state_trigger_grants.py` | integration | filing a dispute as role `disputes` on a fresh database sets `dispute.state = 'with_chief'`; an UPDATE of `state` by `disputes` directly is refused | no |
| M4 | `tests/engine/test_reconcile.py::test_adjudicated_field_override_explained` | unit | a sustained `cancellation_reason_code` override makes the adjudicated row differ from periop and the gate writes `explained_by_kind = 'sustained_override'`; the logged row still matches; a delay-reason override writes no result row | no (R-84) |
| M5 | `tests/publish/test_directory.py` | integration | a directory answer that differs from the prior delivery's address blocks that surgeon only; an unreachable directory after surgeon 12 exits 4 with 12 delivery rows kept; the first send has no prior address and passes; a typed address is refused | no (R-135) |
| M6 | `tests/e2e/test_runbook_page1.py` | E2E (in CI on the synthetic department) | `synth` -> `migrate` -> `load` x2 -> `roster load` -> `close --dry-run` -> `close` -> `publish --dry-run` -> `publish --send` (relay stubbed at `transport.py`) -> `overrides --send` -> `status --daily`: every gate passes, every artifact scans clean, row counts equal denominators, email order holds, `published_at` set once, checklist stored; elapsed time under the NFR targets | yes (R-132) |
| M7 | `tests/publish/test_send_resume.py` | integration | relay failure at surgeon 20 of 40 leaves 20 delivery rows and `published_at` null; `--send` again sends 20 and sets `published_at`; a third `--send` sends 0; `--eml` writes 40 files and a manifest; `--record-eml-sent` sets `sent_at` from the manifest; an NDR fixture sets `bounce_at` and `--resend` after `roster set --identity` writes a new row | no (R-133) |
| M8 | `tests/engine/test_trend.py` | unit | restated marker, version boundary, `history_from`, `gap_reason` for a hidden month, no zero fill, the one-sentence title | no |
| M9 | `tests/engine/test_recompute_version.py`, `test_recompute_roster.py` | integration | `--version fcot@v2 --from 2027-01` touches only fcot and only periods from 2027-01; `--roster-change` rebuilds snapshots from the change date with the `peer-under-five-asof` template and a `roster_change` restatement | no |
| M10 | `tests/publish/test_catalogue_registry.py` | unit | `_catalogue.py` registers by hash; a changed hash on a registered version exits 2; every string in `tests/fixtures/catalogue_v1.json` (PRD 9.4, R-118, R-126 to R-129) equals the registered template; DESIGN.md quotes none other | no (R-137) |
| M11 | `tests/web/test_decide_request.py` [M2] | integration | decide commits the events before the recompute; a recompute failure leaves the decision and lists it; a send failure leaves `delivery.status = 'pending'` and the page shows `decision-recorded-sending`; `status --daily` retries it | no (R-136) |
| M12 | `tests/web/test_rls_backstop.py` extension [M2] | integration | with the matrix bypassed, `record_override`, `correction_request`, `reply_log`, `dispute_event` return nothing for another surgeon | no (R-89) |
| M13 | `tests/web/test_session.py` [M2] | E2E | idle 30 minutes -> `session-expired` and the claim is not stored; absolute 8 hours; `/logout` clears the cookie; `identity.logout_before` invalidates an older cookie; a disabled IdP account is refused at the next idle boundary | no |
| M14 | `tests/disputes/test_provenance.py`, `test_notify.py` | unit | a missing panel field blocks adjudication and flags the analyst; the receiver email carries the record columns and the dispute instruction and no value of anyone | no |
| M15 | `tests/publish/test_scan.py::test_year_in_procedure_allowlisted` | unit | a procedure name with a year is blocked; an analyst allowlist row for that exact cell lets it pass and is an audit row | no |
| M16 | `tests/loaders/test_refusals.py`, `test_notes_column.py` | unit | no ticket exit 2; missing file exit 3; a column over 120 characters or with line breaks refused | no |
| M17 | `tests/attribution/test_cosurgeon.py` | unit | rate per subspecialty; 6% flags `premise_2_exceeded`; one-column shape prints "rate not computable" | no |
| M18 | `tests/engine/test_close_dry_run.py` | integration | `--dry-run` writes no row and prints gate results; an unended month is refused; a published period is refused without `--restate` | no |
| M19 | `tests/publish/test_overrides.py` | unit | one list per feed owner; only unconfirmed rows; a confirmed row leaves the list; prior months included | no |
| M20 | `tests/engine/test_peers.py::test_sole_peer` | unit | zero candidates renders the `sole-peer` key and "(no other surgeons)" | no |
| M21 | `tests/web/test_asides.py` [M2] | unit | `run-missed` after the expected date with no publish run; `first-hosted-visit` once, decided by the audit log | no |
| M22 | `tests/publish/test_superseded_row.py` | unit | after a superseding load the record list renders the source row the number was computed from; `status --daily` lists the unrestated period | no |

Decision D16 (auto-chosen; P1 completeness): add every test above; none deferred. M1 and M6 are P1 with their requirements; the rest land on the same branch as the code they test (P2). The Test Plan artifact for `/qa` is `docs/reviews/plan-eng-review-test-plan.md`.

---

## Section 4: Performance review

Targets under review (PRD section 10.7, technical design "Performance targets"): load one month under 60 s (workstation) or 30 s (VM); M1 close under 2 minutes including every gate; every bucket live under 10 minutes at a quarter close; a five-year restate of one metric under 30 minutes; recompute under 5 seconds and synchronous in the M2 decide request; publish render and scan for 40 surgeons under 5 minutes; web p95 under 1 second at 40 concurrent users with a 10-second statement timeout; `scorecard audit` under 10 seconds; the test suite under 5 minutes.

| Path | Work at M1 volume (40 surgeons, 5,000 cases, 4 metrics) | Against target | Finding |
|---|---|---|---|
| `load periop_or_log` | 5,000 case rows plus 15,000 panel rows through six steps; one `record` upsert per case | Under 60 s if the upsert is batched (`executemany` or `COPY` into a temp table then one `INSERT ... ON CONFLICT`); row-by-row inserts at 20,000 rows are 20 to 60 s on a workstation | [P2] below |
| `close` frames | one frame per (clinician, site, period, basis, record type): about 40 x 1 x 1 x 1 x 1 = 40 frame builds, each one query; adjudicated frames only where an override exists | Fine | none |
| `close` no-blank gate | cross join of 40 clinicians x 4 metrics x 2 scopes = 320 cells against two tables | Fine | none |
| `close` peers | 40 viewers x 3 peer metrics = 120 snapshots, each reading up to 39 peers' current values; 4,680 lookups if done one query per peer | Fine, but do it as one query per (metric, period) returning every clinician's current value, then group in memory | [P3] below |
| `reconcile` | 40 x 2 to 4 rows against `src.periop_report` | Fine | none |
| `recompute --dispute` | cells the record feeds (3 to 4) for one or two clinicians, plus peer snapshots for every viewer whose group contains them: at site scope up to 40 viewers x 3 metrics = 120 snapshots, plus suppression, reconciliation and the render of one decision email | Under 5 s with the one-query peer read; over 5 s with per-peer lookups; the relay send is unbounded and sits inside the same request at M2 | Section 1 finding 8 (D8); [P3] peers below |
| `publish` render and scan | 40 artifacts; each about 200 lines plus a 12-month trend per tile and the definitions appendix; the value scan runs on every CSV cell (about 5,000 x 25 cells) | Under 5 minutes; the regex pass over 125,000 cells is seconds | none |
| `publish` send | bounded by the relay; resume on failure | as designed | none |
| web record list [M2] | one query for one surgeon's period (tens to hundreds of rows), one `audit_log` insert; charts as inline SVG rendered server-side | p95 under 1 s | none |
| `scorecard audit --clinician --period` | scans `audit_log` by `subject_clinician_id` and `details.subject_ids`; no index named on either | Under 10 s in year one; a table scan by year three (every view is a row) | [P3] below |
| `restate` five years, one metric | 60 periods x 40 clinicians = 2,400 frames | Under 30 minutes at 0.5 s a frame; fine | none |
| Test suite | fresh database per session; synth fixtures committed | Under 5 minutes if the suite shares one database per session and truncates between modules, as `conftest.py` states | none |

Findings:

- [P2] (confidence: 7/10) technical design "Ingestion", step 5: "src.<record_type> rows typed and validated; ledger.record upserted by (record_type, source_key)". The loader base class does not say batched. Decision D17 (auto-chosen; P3): `_base.py` writes `raw` and `src` with `COPY` from an in-memory buffer and upserts `record` with one `INSERT ... ON CONFLICT DO NOTHING RETURNING` per batch of 1,000; the M6 E2E test records elapsed time against the 60-second target. T6 carries the timing assertion.
- [P3] (confidence: 7/10) technical design "Peer groups", `peers.build`: "clr = cand whose own current metric_value(metric, period, their site row ...) exists and has denominator >= V.min_n" reads per candidate. Decision D18 (auto-chosen; P5): one query per (metric, period) returning every clinician's current value and denominator (adjudicated where present, D-12), then build every viewer's group from that frame. No PRD change; T8 note.
- [P3] (confidence: 8/10) `ledger.audit_log` DDL names no index. Decision D19 (auto-chosen; P3): `create index on ledger.audit_log (subject_clinician_id, at)` and a GIN index on `details` for `subject_ids`; the ten-second target is then a matter of rows, not scans. T14.
- [OK] N+1 in the renderers: "the record-list render reads `metric_value_record` by (value id), one query per tile" (160 queries per publish at 40 x 4) is fine; caching is not needed anywhere because every value is precomputed into the ledger by `close`; memory is bounded by one surgeon's frames at a time. The synchronous recompute's bound is the relay, not the engine (D8).

---

## Failure modes

Per new path: one realistic production failure, whether a test or error handling covers it, and whether the person sees a clear error or nothing. Critical gap rule: no test AND no handling AND silent is a critical gap.

| Path | Realistic production failure | Handled | Tested | What the person sees | Verdict |
|---|---|---|---|---|---|
| load | periop ships the extract with a renamed column (`wheels_in_ts`) | yes: field checklist; dependent metrics `not_computable` (G2) | yes (`test_field_checklist`) | analyst: staging summary; surgeon: "Not shown: the OR-log extract ... did not include wheels-in time" | clear |
| load | the same file re-sent under a new ticket | yes: sha256 no-op | yes | analyst: "already loaded as feed_load 41" | clear |
| load | a `procedure` column that is really a notes field | yes: refused over 120 chars | no -> M16 | analyst: refusal | clear after M16 |
| register | the analyst edits `fcot/v1.py` to fix a typo | yes: hash refusal exit 2; `close` calls `register` first | yes | analyst: "edits go in a new version, not here" | clear |
| close | periop's report arrives a week late | yes: publish held (R-84), day-10 miss listed | yes (ceo block) | analyst: checklist; surgeon: prior month's "last refreshed" and, at M2, `run-missed` | clear |
| close | one surgeon's FCOT differs from periop's by one case (snapshot timing) | yes: G6 unexplained stops the run; the analyst authors a delta or calls periop | yes | analyst: reconcile table; surgeon: nothing until fixed | clear |
| close | pandas raises on a null `scheduled_start` inside `counted()` | no today; `run` stuck at `running` | no -> M2 | analyst: a traceback; `status --daily` silent | gap (not silent to the analyst) -> R-131, T2 |
| close vs recompute | a chief decides at M2 while the analyst's close is mid-way | no | no -> M1 | nobody | CRITICAL GAP -> R-130, T1 |
| reconcile | periop reports FCOT as a percentage only, rounded | yes: value at periop's printed precision (D-15) | yes | analyst | clear |
| reconcile | a sustained cancellation-reason override makes the adjudicated row differ | no: unexplained after recompute (finding 4) | no -> M4 | analyst: G6 failed on a recompute; the decision email is held; the surgeon hears nothing | gap -> R-84 amendment, T4 |
| publish | the relay refuses at surgeon 20 of 40 | yes: exit 4; resume with surgeons lacking a delivery row; `published_at` unset | no -> M7 | analyst: exit 4; 20 surgeons have email, 20 do not, "last refreshed" unchanged for all | clear after M7 |
| publish | the directory returns a different mailbox for one surgeon after a name change | partly: G13 as written has no second source (finding 6) | no -> M5 | analyst: as designed, the block on the checklist | gap -> R-135, T5 |
| publish | the scan blocks one surgeon's email every month on a year inside a procedure name | yes: blocked and named | no -> M15 | analyst: named artifact and field; surgeon: no email, no explanation | gap (clear to the analyst) -> T12 |
| publish | `--send` run twice by a tired analyst | yes: delivery rows found, nothing sent | no -> M7 | analyst: "0 sent" | clear after M7 |
| overrides | periop's contact leaves; the list bounces | yes: bounce logged; checklist | no -> M19, M7 | analyst: checklist | clear |
| dispute file (M1) | the reply quotes a colleague's case id | yes: held `awaiting_row`; ack asks for own id | yes (ceo block) | surgeon: the awaiting-row acknowledgement | clear |
| dispute file (M1) | the chief replies "sustained" from a personal address | partly: `sender_kind <> adjudicator`, not a decision; authenticity inside MGB mail is L-18 (information security) | no | analyst: the reply is logged, not applied | unresolved with owner (carried) |
| dispute decide | the chief decides twice (two replies; a double click at M2) | yes: refused when decided | yes | actor: refused | clear |
| dispute decide | the trigger cannot write `dispute.state` under the `disputes` role | no | no -> M3 | analyst: an exception on the first filing | gap -> T3 (not silent) |
| recompute | the recompute passes but the decision email send times out at M2 | partly: the design's fallback names the wrong cause | no -> M11 | chief: `load-failure`; surgeon: nothing | gap -> R-136, T10 |
| recompute | a re-credit crosses the receiver's FCOT over min-n downward | yes: dispute clause on the reason; `caused_by` | yes (`test_recompute`) | surgeon: "Not shown ... (1 case re-credited by dispute ...)" | clear |
| restate | a five-year restate is run on the wrong version | yes: `--to-version` explicit, reason category required, restatement rows chain | partly (refusal without reason) -> M9 | analyst: the run row; surgeon: restated markers and the R-98 notice | clear |
| web views [M2] | a URL with another surgeon's `record_ref` | yes: matrix refuses; RLS backstop; same bytes as not found | yes | viewer: `not-authorized`; audit row | clear |
| web views [M2] | a query bug in `views/disputes.py` selects an override note by id | partly: RLS set omits `record_override` (finding 5) | no -> M12 | nobody | gap -> R-89 amendment, T11 |
| web views [M2] | statement timeout on the record list | yes: `load-failure` with a reference; audit `error` | yes (`test_states`) | surgeon: the reference id | clear |
| SSO [M2] | an IdP-disabled account with a live 8-hour cookie | yes: revalidation at the idle boundary | no -> M13 | user: refused | clear after M13 |
| SSO [M2] | a first login whose UPN matches no roster row | yes: `not-on-roster` | yes | user: the sentence with the analyst mailbox | clear |
| audit | the workstation superuser deletes audit rows at M1 | yes: off-host hash chain; `doctor` age check | yes (`test_audit_export_chain`) | recertification: chain broken | clear |
| audit | the off-host location (OQ-61) is never granted | no mechanism can help; M1 cannot be called done (stated) | n/a | analyst: `doctor` fails on export age | clear; owner item |
| retention | a class period is set and the job removes a load an open dispute references | yes: held and listed | partly (unset only) -> add to M9's neighbour | analyst: held count | clear |

Critical gaps: one (the engine writer lock). Gaps with clear errors: seven, all tasked. Unresolved with owners: two carried from the CEO review (decision-by-reply authenticity; the whole-month-leave email).

---

## Diagrams

### Close -> reconcile -> publish (M1, one period)

```
 analyst        cli/close                 engine                  ledger (roles)              publish              relay/dir
   |  close --period P                       |                          |                         |                   |
   |----------------------->|  BEGIN; pg_advisory_xact_lock('scorecard.engine')  [D1]           |                   |
   |                        |  register()  -------------------------> mdv (engine): hash check   |                   |
   |                        |  field check, attribution  -----------> attribution, exceptions    |                   |
   |                        |     G4 exceptions unresolved? -- yes --> run.status=failed; exit 1 |                   |
   |                        |  frames -> compute ------------------> metric_value(+record)        |                   |
   |                        |     G7 assert_row_counts  ---- fail --> exit 1                      |                   |
   |                        |  suppress -> peers -> targets -> trend -> decisions, snapshots      |                   |
   |                        |     G8 assert_no_blank_cells - fail --> exit 1                      |                   |
   |                        |  reconcile ------------------------> reconciliation_result           |                   |
   |                        |     periop_report missing?  -- yes --> hold (R-84); exit 1          |                   |
   |                        |     unexplained delta?      -- yes --> exit 1 (analyst: delta add or call periop)      |
   |                        |     feed health G3 partial? -- yes --> exit 1 unless --accept-partial --note           |
   |                        |  COMMIT; run.status=ok; gate_results                                |                   |
   |<-----------------------|  exit 0                                                             |                   |
   |  publish --period P --dry-run --------------------------------------------------->|          |                   |
   |                        |                          run(kind=publish): latest close ok?  -- no --> exit 2          |
   |                        |                          for each clinician on roster_as_of(P):                          |
   |                        |                             render -> email_text + csv_rows -> scan G12 -> own_records G14 -> G15
   |                        |                             gates G11 (privacy_email.scorecard confirmed?) -- no --> exit 2
   |                        |                             directory.resolve(person_key) [D6: compare with last delivery] |
   |                        |                             write preview/<P>/<ref>/{email.txt, csv, message.eml}; delivery(preview)
   |   reads index.html, one email, one CSV against suppress --report                                                   |
   |  publish --period P --send ------------------------------------------------------>|          |                   |
   |                        |                          same gates per artifact; transport.send -------------------->  relay
   |                        |                             fail at surgeon k --> exit 4; rows 1..k-1 kept; resume later  |
   |                        |                          after the last send: run.published_at = now()  (= "last refreshed")
   |  overrides --month P --send ----------------------------------------------------->| correction_request list per feed owner
   |  status --daily -----------------------------------------------------------------> checklist stored on run        |
```

### Dispute -> decide -> recompute -> re-publish

```
 surgeon         intake (M1 analyst / M2 form)     disputes/*             engine/recompute       publish/notify       next close/publish
   | reply or POST /records/<ref>/dispute |                              |                        |                     |
   |------------------------------------>| file_dispute(): validate (credited, field disputable, notice exists, claim scan, <2 filings)
   |                                     | -> dispute + event(filed) ; route.py a/b/c -> event(with_chief|with_chair) ; held if route_undefined
   |                                     | -> ack (M1: gate privacy_email.decision; M2: dispute-filed line) ; adjudicator email (gate .adjudicator)
   |<--- "Dispute received on case C-..., filed <date>. Your division chief decides; decision due <date>." --|
   |                                     |                              |                        |                     |
   chief: reply (M1) / POST decide (M2)  | decide(): actor == adjudicator; decision null; note scanned; outcome rules
   |                                     | COMMIT 1: events + record_override (+ correction_request)             [D8]
   |                                     |------------------------------>| BEGIN; engine lock [D1]; lock_timeout 30 s
   |                                     |                              | affected cells (both clinicians on a re-credit)
   |                                     |                              | recompute basis=adjudicated under the SAME version
   |                                     |                              | restatement rows; suppression with the dispute clause
   |                                     |                              | peer snapshots for every viewer containing an affected clinician
   |                                     |                              | reconcile: re-credit -> sustained_recredit; field override -> sustained_override [D4]
   |                                     |                              | COMMIT 2: run(kind=recompute, ok)   | lock timeout -> "decided, recompute pending"; checklist
   |                                     |                              |----------------------->| COMMIT 3: delivery(pending) ; send decision email (gate .decision)
   |<--- "Decision on case C-...: <row before> / <row after>; tile as logged 60% (6 of 10) · as adjudicated 67% (6 of 9)" ---|
   |                                     |                              |                        | send fails -> delivery stays pending; status --daily retries
   receiver (re-credit) <--- recredit email (gate .recredit) ; may file a linked counter-dispute -----------------------|
   |                                     |                              |                        |                     |
   next month: publish carries the same row text and tile; What changed block lists the decision (R-115)  ----------->|
   periop: overrides --month --send lists the correction_request; next load: convergence retires the override; next close: one value
```

### Dispute state diagram

The technical design's diagram ("The dispute state machine") is complete for dispute states: `filed`, `with_chief`, `with_chair`, `with_direct_leader`, `sustained_annotated`, `sustained_source_corrected`, `not_sustained`, `definition_question`, `withdrawn`, `correction_requested`, `correction_confirmed`, with `held` as a flag on `filed` and re-file as a new row. What it does not draw is the post-decision run and delivery state that D8 makes explicit, which the surgeon experiences as "decided but nothing arrived". Drawn here as a companion, not a replacement:

```
  decision committed
        |
        v
  recompute run:  running --> ok --------------------------------> delivery(decision_email): pending --> sent
                    |          |                                                            |
                    |          +--> (lock timeout) pending: "decided, recompute pending"     +--> send failed: pending, retried by status --daily
                    |                 checklist; analyst re-runs recompute --dispute
                    +--> failed (a gate: G6/G7/G8) : "decided, recompute failed"; checklist; no email until a re-run passes
                    +--> error (unexpected, R-131): exit 4; run.status=error; checklist
  adjudicator's page: decision-recorded | decision-recorded-sending (pending delivery) | "recompute did not complete; the analyst has been alerted"
  surgeon's tile:     restatement-pending until the recompute run is ok
```

Files needing inline diagrams when written: `scorecard/engine/close.py` (the stage list as a docstring), `scorecard/disputes/state.py` (the transition table as data, which is the diagram), `scorecard/publish/transport.py` (the resume rule), `docs/RUNBOOK.md` page 1 (the sequence above, in the analyst's words).

---

## Worktree parallelization strategy

Dependency table for the M1 build (M0 code included, since M0 is the first M1 increment):

| Step | Modules touched | Depends on |
|---|---|---|
| S1 skeleton | `pyproject.toml`, `cli.py` (registry only), `log.py`, `settings.py`, `ledger/db.py`, `ledger/migrations/0001..0019` (schemas, `run`, `audit_log`, `department_setting`, `clinician`, `roster_membership`, `leave_period`, `feed_load`), `roles.sql`, `scorecard migrate`, `grants check`, `doctor` (skeleton), `tests/conftest.py`, CI | none |
| S2 synth | `synth.py`, `fixtures/synth/`, `test_fixtures_synthetic.py` | S1 (schema shape only) |
| S3 loaders | `loaders/_base.py`, `periop_or_log.py`, `periop_report.py`, `roster.py`, migrations 0020..0039 (`raw.*`, `src.case`, `src.case_panel`, `src.periop_report`), `record` | S1 |
| S4 attribution | `attribution/rules/case.py`, `cosurgeon.py`, `exceptions.py`, migrations 0040..0049 (`attribution`, `record_participant`, `attribution_exception`) | S1, S3 (record identity) |
| S5 definitions | `definitions/_contract.py`, `_catalogue.py`, the wedge four `v1.py`, division-only and pending definitions, migrations 0050..0059 (`metric_definition_version`, `definition_param`, `reason_catalogue`, `reason_set_version`, `definition_delta`, `source_registry`, `feed_owner`), `engine/registry.py` | S1 |
| S6 engine core | `engine/periods.py`, `frames.py`, `compute.py`, `invariants.py`, migrations 0060..0069 (`metric_value`, `metric_value_record`, `comparison_target`, `restatement`) | S4, S5 |
| S7 engine rules | `suppress.py`, `reasons.py`, `peers.py`, `targets.py`, `trend.py`, `availability.py`, migrations 0070..0079 (`suppression_decision`, `peer_group_snapshot`, `restricted.peer_group_member`) | S6 |
| S8 reconcile and close | `reconcile.py`, `close.py` (stages, gates, engine lock), `recompute.py`, `restate` | S7 |
| S9 disputes | `disputes/state.py`, `route.py`, `file.py`, `decide.py`, `rowtext.py`, `notices.py`, `provenance.py`, `queue.py`, `intake.py`, migrations 0080..0089 (`dispute`, `dispute_event`, `reply_log`, `record_override`, `correction_request`, `definition_open_item`), `loaders/convergence.py` | S1, S4 (participants), S5 (notices) ; recompute call site needs S8 |
| S10 publish render | `publish/render.py`, `email_text.py`, `csv_rows.py`, `scan.py`, `own_records.py`, `gates.py`, `overrides.py`, `status.py`, `adoption.py`, templates | S7 (artifact inputs), S9 (row text); can start against a fixture artifact from S2 |
| S11 publish transport | `directory.py`, `transport.py`, `delivery.py`, `notify.py`, migration 0090 (`delivery`) | S10 |
| S12 ops | `audit.py` (report, export chain), `retention.py`, `doctor.py` (full), `tests/ops/*`, runbook | S1; S11 for the checklist |
| S13 runbook and rehearsal | `docs/RUNBOOK.md`, the first-send rehearsal, the restore drill | S11, S12 |

Parallel lanes (each a worktree; merge order in brackets):

- **Lane A, ledger and ingestion:** S1 -> S3 -> S4. Owns migrations 0001 to 0049 and `loaders/`, `attribution/`.
- **Lane B, definitions and engine:** S5 -> S6 -> S7 -> S8, starting on S1's schema branch as soon as it merges. Owns migrations 0050 to 0079, `definitions/`, `engine/`.
- **Lane C, disputes:** S9, starting from S1 plus the S4 and S5 DDL (it needs only the tables, not the loaders' behaviour). Owns migrations 0080 to 0089, `disputes/`.
- **Lane D, publish:** S10 -> S11, starting against the S2 fixture artifact and the `ClinicianArtifact` contract written first as a frozen dataclass. Owns migration 0090, `publish/`.
- **Lane E, ops and tests:** S2, S12, CI, the E2E test skeleton (M6) that Lane B and D fill in. Owns `tests/ops/`, `tests/e2e/`, `synth.py`, `audit.py`, `retention.py`, `doctor.py`.

Execution order: S1 first (about a day; everything waits on it); then A, B, C, D, E in parallel; S8 (close) is the integration point where B, C and D meet; S13 last.

Conflict flags: `cli.py` (resolved by per-package `register_cli()`, Scope C finding 1); migration numbering (resolved by ranges); `_catalogue.py` (Lane B owns it; Lanes C and D add keys by pull request into Lane B's file, never by a second file); `tests/conftest.py` (Lane E owns it); `roles.sql` (Lane A owns it; every lane that adds a write adds a grant line by pull request, and `grants check` in CI is the arbiter). M2 is one further lane (`web/`, `deploy/`, `DESIGN.md` tokens into `scorecard.css`) that starts after S8 merges.

---

## Implementation tasks

Effort is human versus CC plus gstack; ratios per the digest (scaffolding about 100x, tests about 50x, features about 30x, bug fix with regression about 20x, architecture about 5x). P1 blocks ship.

- [ ] **T1 (P1, human: ~4h / CC: ~30min)** - engine - Add the engine writer lock and the ordering regression test
  - Surfaced by: Section 1 finding 1 (D1); CEO review L-16, T7; R-130
  - Files: `scorecard/engine/close.py`, `recompute.py`, `restate` path in `recompute.py`, `ledger/db.py` (lock helper, `lock_timeout`), `tests/engine/test_ordering.py`
  - Verify: M1 in the missing-tests table; a paused `close` blocks a `recompute` until commit; two recomputes serialize; the M2 path returns "recompute pending" after 30 s with the decision committed
- [ ] **T2 (P1, human: ~3h / CC: ~15min)** - cli - Unexpected-exception path: exit 4, `run.status = 'error'`, ids-only log, checklist row
  - Surfaced by: Section 1 finding 2 (D2); CEO review L-17, T8; R-131
  - Files: `scorecard/cli.py`, `log.py`, `ledger/migrations/00xx_run_status_error.sql` (CHECK gains `'error'`), `publish/status.py`, `docs/RUNBOOK.md` page 1 step 10
  - Verify: `tests/ops/test_unexpected_exception.py` (M2 above); `status --daily` lists runs stuck in `running` or `error`
- [ ] **T3 (P1, human: ~2h / CC: ~10min)** - ledger - Make the `dispute.state` trigger `SECURITY DEFINER` and prove filing works under the `disputes` role
  - Surfaced by: Section 1 finding 3 (D3)
  - Files: `ledger/migrations/0080_dispute.sql` (trigger function owner `migrate`, `SET search_path`), `tests/ops/test_state_trigger_grants.py`
  - Verify: M3 above; `grants check` still clean
- [ ] **T4 (P1, human: ~3h / CC: ~20min)** - engine/reconcile - `explained_by_kind = 'sustained_override'` for adjudicated-basis field overrides
  - Surfaced by: Section 1 finding 4 (D4); R-84 amended
  - Files: `scorecard/engine/reconcile.py`, `recompute.py` step 5, `ledger/migrations/00xx_reconciliation_result.sql` (CHECK gains the kind), `tests/engine/test_reconcile.py`
  - Verify: M4 above
- [ ] **T5 (P1, human: ~4h / CC: ~30min)** - publish/directory - Second source for G13 is the last delivery's resolved address; first-send review in the dry-run index
  - Surfaced by: Section 1 finding 6 (D6); R-135
  - Files: `scorecard/publish/directory.py`, `delivery.py`, `ledger/migrations/0090_delivery.sql` (`recipient_address`), `preview_index.html.j2`, `docs/RUNBOOK.md` page 1 step 7
  - Verify: `tests/publish/test_directory.py` (M5 above)
- [ ] **T6 (P1, human: ~2 days / CC: ~2h)** - tests/e2e - Runbook page 1 end to end on the synthetic department in CI, with elapsed-time assertions
  - Surfaced by: Section 3 (J4.1 to J4.9 GAP, [→E2E]); Section 4 D17; R-132
  - Files: `tests/e2e/test_runbook_page1.py`, `tests/conftest.py` (relay and directory stubs at `transport.py` and `directory.py`), `scorecard/loaders/_base.py` (batched writes)
  - Verify: M6 above; load under 60 s and close under 2 minutes on the CI runner
- [ ] **T7 (P1, human: ~1 day / CC: ~45min)** - publish/transport - Send resume, `--send` twice, `.eml` manifest, NDR ingest, directory unreachable
  - Surfaced by: Section 3 (transport GAPs); Section 2 finding 4 (D12); CEO review T6; R-133
  - Files: `scorecard/publish/transport.py`, `delivery.py`, `tests/publish/test_send_resume.py`
  - Verify: M7 and the directory-unreachable case in M5
- [ ] **T8 (P2, human: ~1 day / CC: ~1h)** - engine - Trend, `recompute --version`, `recompute --roster-change`, superseded-row render, one-query peer read
  - Surfaced by: Section 3 GAPs; Section 2 finding 7 (D15); Section 4 D18
  - Files: `scorecard/engine/trend.py`, `recompute.py`, `peers.py`, `publish/render.py`, `publish/status.py`, `tests/engine/test_trend.py`, `test_recompute_version.py`, `test_recompute_roster.py`, `tests/publish/test_superseded_row.py`
  - Verify: M8, M9, M22 above
- [ ] **T9 (P2, human: ~4h / CC: ~30min)** - definitions/_catalogue - One authored catalogue registered by hash; PRD strings as the golden fixture; DESIGN.md scan
  - Surfaced by: Section 2 findings 1 and 2 (D9, D10); Scope C finding 3; R-137
  - Files: `scorecard/definitions/_catalogue.py`, `engine/registry.py`, `tests/fixtures/catalogue_v1.json`, `tests/publish/test_catalogue_registry.py`, `test_catalogue_strings.py`, `DESIGN.md` (two lines, applied in this run)
  - Verify: M10 above; the technical design's Metric engine suppression table is regenerated from the registered version
- [ ] **T10 (P2, human: ~4h / CC: ~30min)** - web/views/disputes [M2] - Decide request in three commits; pending decision emails retried; `decision-recorded-sending` key
  - Surfaced by: Section 1 finding 8 (D8); R-136
  - Files: `scorecard/web/views/disputes.py`, `disputes/decide.py`, `publish/notify.py`, `publish/status.py`, `definitions/_catalogue.py`, `tests/web/test_decide_request.py`
  - Verify: M11 above
- [ ] **T11 (P2, human: ~2h / CC: ~15min)** - ledger/rls [M2] - Extend the RLS set to `record_override`, `correction_request`, `reply_log`, `dispute_event`
  - Surfaced by: Section 1 finding 5 (D5); R-89 amended
  - Files: `ledger/migrations/01xx_rls.sql`, `tests/web/test_rls_backstop.py`
  - Verify: M12 above
- [ ] **T12 (P2, human: ~3h / CC: ~20min)** - publish/scan, disputes - Scan allowlist for exact-cell false positives; provenance missing-field block; receiver email test
  - Surfaced by: Section 2 finding 3 (D11); Section 3 GAPs
  - Files: `scorecard/publish/scan.py`, `disputes/provenance.py`, `notify.py`, `tests/publish/test_scan.py`, `tests/disputes/test_provenance.py`, `test_notify.py`
  - Verify: M14, M15 above
- [ ] **T13 (P2, human: ~1 day / CC: ~1h)** - web/app [M2] - Session tests (idle, absolute, logout, IdP disable); `psycopg.sql` composition for sortable columns
  - Surfaced by: Section 3 GAPs; Section 2 finding 6 (D14)
  - Files: `scorecard/web/app.py`, `queries.py`, `tests/web/test_session.py`, `test_no_sql_strings.py`
  - Verify: M13 above; a hostile sort column is quoted
- [ ] **T14 (P2, human: ~2h / CC: ~15min)** - skeleton - Per-package `register_cli()`; migration number ranges; `audit_log` indexes; `git_sha` fallback
  - Surfaced by: Scope C findings 1 and 2; Section 4 D19; Section 2 finding 5 (D13)
  - Files: `scorecard/cli.py`, each package `__init__.py`, `ledger/migrations/README`, `0005_audit_log.sql`, `engine/registry.py`
  - Verify: `scorecard --help` lists every subcommand; `test_migrations_fresh.py`; an `EXPLAIN` on the audit query uses the index
- [ ] **T15 (P2, human: ~1h / CC: ~5min)** - ledger - Partial unique index on current `peer_group_snapshot`
  - Surfaced by: Section 1 finding 7 (D7)
  - Files: `ledger/migrations/0075_peer_group_snapshot.sql`, `tests/engine/test_peers.py`
  - Verify: inserting a second current system-scope snapshot raises
- [ ] **T16 (P2, human: ~1 day / CC: ~45min)** - tests - The remaining named unit tests: loader refusals and notes column; co-surgeon rate; close dry-run and refusals; overrides list; sole peer; run-missed and first-hosted-visit; retention held references
  - Surfaced by: Section 3 GAPs (M16 to M21 and the retention row)
  - Files: as named in the missing-tests table
  - Verify: each test fails against a stub that omits the behaviour and passes against the implementation
- [ ] **T17 (P3, human: ~1h / CC: ~10min)** - docs - `TODOS.md` written from every phase's deferred items (done in this run); revisit `pandas` when no definition needs it
  - Surfaced by: Scope Challenge A (TODOS cross-reference); Section 2 reuse ladder
  - Files: `TODOS.md`
  - Verify: the file lists every "NOT in scope" item from the three reviews with its owner

- [ ] **T18 (P1, human: ~1 day / CC: ~1h)** - engine/reconcile, loaders - Reconciliation stops on a roster surgeon with no report row (`clinician_unmapped`); `periop_report` unmapped-provider exceptions; per-column null rate on the field checklist; site-denominator feed-health check
  - Surfaced by: Outside voice TE-01 and TE-02 (both blocking, single-voice); R-138, R-139
  - Files: `scorecard/engine/reconcile.py`, `loaders/periop_report.py`, `loaders/_base.py`, `engine/close.py` (G3), `ledger/migrations/00xx_reconciliation_result.sql` (CHECK gains the kind), `tests/engine/test_reconcile.py`, `tests/loaders/test_field_checklist.py`, `test_feed_health.py`
  - Verify: M23 and M24 in "Tests added from the outside voice"
- [ ] **T19 (P2, human: ~2 days / CC: ~2h)** - engine, disputes, publish, ops - Frozen member set on published snapshots and `spread-group-changed`; `source_text` in the registry; derived `sender_kind`; `partial-extract` mark; `--publish-empty`; chair-facing trust report split; automatic audit export and `doctor` by setting; `delivery.status = 'blocked'` and `published_at`; `grants repair` and the exit-4 run-record fields
  - Surfaced by: Outside voice TE-03, TE-05 to TE-12, TE-D1; R-140 to R-144; R-13, R-41, R-85, R-102, R-135 amended
  - Files: `scorecard/engine/peers.py`, `recompute.py`, `registry.py`, `disputes/intake.py`, `queue.py`, `publish/render.py`, `delivery.py`, `gates.py`, `status.py`, `audit.py`, `doctor.py`, `cli.py`, `definitions/_catalogue.py`, migrations for `member_set_hash`, `source_text`, `reply_log.header_sha256`, `delivery.status`, `run.resolved_by`
  - Verify: M25 to M33

_No new tasks from the Diagrams section (the diagrams are documentation of tasked mechanisms)._

---

## NOT in scope

Deferred, one sentence each, now collected in `TODOS.md` (rows 22 to 24, from the outside-voice close, are listed under "Cross-model tension dispositions"):

- Division and site views: no specification exists (OQ-52); pub is the mandatory channel when one does.
- The BI pub export (D-36): schema and contract test written at M2, not enabled until a sponsor asks.
- A charge-level wRVU record list and dispute action (OQ-33): held for the owner.
- A print stylesheet or export for annual review (OQ-46).
- Mockups of the home, metric, record list and inbox pages (next interactive session).
- The display face and accent (OQ-63; DESIGN.md proposes, the human approves).
- Dark mode as shipped scope: DESIGN.md proposes the night scheme with M2; held as Taste.
- Replacing `pandas` with SQL plus plain Python: a P3 follow-up once no definition needs a frame.
- The full definitions text in every email versus month one and version changes only (OQ-64).
- M1 as a script, a sheet and a mailbox (CEO outside voice T-01): held as Taste, not taken.
- Automating the daily checklist before the VM (D-47): the M2 timer.
- Any institutional answer this plan cannot supply: OQ-47, OQ-57, OQ-61, OQ-62, TA-01 to TA-14.

Genuinely unrelated work, flagged as separate scope and not as a shortcut: a system-wide subspecialty roster feed (OQ-53); an NHSN feed for Surgical site infection (OQ-32); the M4 to M7 loaders and definitions, which each wait on an owner outside the department.

## What already exists

Nothing in this repository is code. What exists and is reused rather than rebuilt:

| Sub-problem | Exists as | Reuse |
|---|---|---|
| Product contracts (email, page, states, strings) | PRD sections 7 and 9; `DESIGN.md`; `docs/design/briefs/` | Every template cites them; the strings become the golden fixture (T9) |
| Architecture, DDL, invariants, gates, roles | `docs/03-technical-design.md` | Built as written, with the eight Section 1 decisions applied |
| Accepted obligations from earlier phases | PRD appendix D ceo and design blocks | Every named test kept in the test plan |
| Synthetic data | `scorecard synth` (designed, not built) | Lane E builds it first; every test and the E2E run use it |
| Institutional services | MGB relay, directory, SSO, git host | Used through one module each (`transport.py`, `directory.py`, `app.py`, CI); none rebuilt |
| Platform features | PostgreSQL constraints, triggers, RLS, advisory locks, pgaudit, `pg_dump` | Preferred over application code everywhere the design already does; the lock added the same way |

---

## Final planning decisions

Every potential TODO was reviewed (what, why, depends on) and took one of: add to `TODOS.md`, skip, or build in this plan. The 24 rows of `TODOS.md` (21 from the native review, 3 from the outside-voice close) are the "add" outcomes; the tasks T1 to T19 are the "build" outcomes; nothing was skipped without a reason recorded above.

### Decision ledger

Every accepted remedy cites its own answer. Headless, each answer is "auto-chosen (recommended)" under the spawned-session rule; State is approved for the plan, not for the product (the plan stays DRAFT).

| ID and owner | Contract and evidence | Current | Proposed | Status | Exact approval and scope |
|---|---|---|---|---|---|
| D1 (engine) | R-29, D-26; CEO L-16: no serialization between `close`, `recompute`, `restate`; quoted "second, call-scoped connection as `engine`" | none; human serialization at M1 | one session-level advisory lock in every engine write transaction; 30 s `lock_timeout` at M2 with the documented fallback; regression test | approved | auto-chosen (recommended); P5; R-130, T1. Alternative rejected: per-period locks (do not cover cross-period snapshots) |
| D2 (cli) | CEO L-17; exit-code table and `run.status` CHECK lack an error state | run stuck at `running` | top-level handler: exit 4, `status = 'error'`, ids-only log, publish refuses, checklist lists | approved | auto-chosen (recommended); P5; R-131, T2 |
| D3 (ledger) | "`dispute.state` is written by the trigger, not by the role" with no UPDATE grant | filing would raise | trigger function `SECURITY DEFINER`, owner `migrate`, fixed `search_path`; grants test | approved | auto-chosen (recommended); P5; T3; R-57 verification |
| D4 (reconcile) | gate pseudo-code versus F-65 mapping: adjudicated field override unexplained | contradiction | `explained_by_kind = 'sustained_override'` on the adjudicated basis; logged basis unchanged | approved | auto-chosen (recommended); P5; R-84 amended; T4 |
| D5 (web, M2) | RLS set of 11 tables omits four the app reads | matrix only on those four | add `record_override`, `correction_request`, `reply_log`, `dispute_event` | approved | auto-chosen (recommended); P5; R-89 amended; T11 |
| D6 (publish) | G13 "equal to the roster's stored address" versus "never typed on the roster" | no second source | the last delivery's resolved address, publisher-written; first send reviewed in the dry-run index | approved | auto-chosen (recommended); P5; R-135, T5. Alternative rejected: typing an address on the roster (F-90 AC 8 forbids it) |
| D7 (ledger) | `peer_group_snapshot.is_current` without a partial unique index | two current rows possible | partial unique index with `coalesce(site, '')` | approved | auto-chosen; P5; T15 |
| D8 (web, M2) | D-26 one request and transaction includes the relay send | timeout after commit misreported | three commits; delivery `pending` then `sent`; retry by status; `decision-recorded-sending` key | approved | auto-chosen (recommended); P3, P5; R-136, T10. Alternative rejected: a background queue (D-03 forbids a queue) |
| D9 (catalogue) | two authored stores; the technical design admits drift | `_catalogue.py` and the table and PRD 9.4 | the Python file registered by hash; PRD strings as the golden fixture; DESIGN.md scanned | approved | auto-chosen; P4, P5; R-137, T9 |
| D10 (DESIGN.md) | two component strings predate R-126 and R-129 | drift | amend the two lines now; scan in T9 | approved and applied | auto-chosen; P5; in blast radius, under an hour (P2) |
| D11 (scan) | date-of-birth heuristic on `procedure_desc` | recurring block | exact-cell allowlist by analyst, audited, listed | approved | auto-chosen; P3; T12 |
| D12 (publish) | directory unreachable not in the exit table | unstated | exit 4 after sent rows kept; export-file fallback | approved | auto-chosen; P5; T7 |
| D13 (registry) | `git_sha` required | binds to a checkout | `importlib.metadata` fallback; doctor reports the source | approved | auto-chosen; P3; T14 |
| D14 (web) | grep for SQL strings | smell test | `psycopg.sql` composition plus a hostile-column test | approved | auto-chosen; P5; T13 |
| D15 (render) | superseding load changes row text under an unrestated number | silent drift | render the computed-from row; checklist lists unrestated periods | approved | auto-chosen; P5; T8 |
| D16 (tests) | 37 gaps in the coverage diagram | none built | every missing test added; none deferred | approved | auto-chosen (recommended); P1; T6, T7, T8, T12, T13, T16 |
| D17 (loader) | row-by-row inserts against a 60 s target | unstated | batched `COPY` and upsert; E2E timing assertion | approved | auto-chosen; P3; T6 |
| D18 (peers) | per-candidate lookups | O(V x P) queries | one query per (metric, period) | approved | auto-chosen; P5; T8 |
| D19 (audit) | no index on `audit_log` | table scan by year three | two indexes | approved | auto-chosen; P3; T14 |
| S-C1, S-C2, S-C3 (structure) | Scope C findings | one `cli.py`; unassigned migration numbers; two catalogue stores | per-package `register_cli()`; number ranges; D9 | approved | auto-chosen; P5, P3, P4; T14, T9 |
| TE-01, TE-02, TE-05, TE-07, TE-09, TE-11 (outside voice, accepted) | "Cross-model tension dispositions" rows; each verified against the technical design text quoted there | silent reconciliation pass; header-only field check; registry without source; partial with no mark; per-surgeon rate to the chair; `published_at` undefined with a blocked row | R-138, R-139; R-13, R-85, R-102, R-135 amended | approved | auto-chosen; P5 then P1 or P3 per row; T18, T19; tests M23, M24, M26, M28, M30, M32 |
| TE-03, TE-06, TE-08, TE-10, TE-12, TE-D1 (outside voice, partial) | same | set-difference spread leak; typed `sender_kind`; empty email sendable; M1 audit by hand; G17 on every command; operating surface | R-140, R-141, R-142, R-143, R-144; R-41 amended; section 14 | approved for the accepted part; the rest recorded in the row | auto-chosen; P5, P3; T19; tests M25, M27, M29, M31, M33. Not taken: value-rebuild freeze; the subject token (L-18); a frozen "last refreshed"; unconditional `doctor` warnings; per-stage G17 |
| TE-04 (outside voice) | duplicate of D1 and D8 | as D1, D8 | as D1, D8 | merged | P4 |
| TE-D2 (outside voice, "build first") | the M1 control set; Scope Challenge B | as T-01 | none | rejected as a plan change; Taste | P2: never reduce a complete plan; T-01 already holds it for the human |
| Held (Taste, unchanged) | R-61 date; TD-03, TD-04, TD-06, TD-09, TD-13; OQ-63 face and accent; night scheme; T-01, T-03, T-06, T-10; TE-03 (published-period spread freeze, taken provisionally) | provisional recommended choices in the plan | none by this review | pending the human | not auto-decided: taste items are listed at the gate, never approved headless |
| Held (owner) | L-18 authenticity; L-19 whole-month leave; OQ-61; OQ-62; OQ-47; OQ-57 | unresolved | none | pending the owner | no institutional answer invented |

Approval readiness: NOT PASS. Every accepted remedy traces to an auto-chosen answer recorded above, which satisfies the ledger's own rule; but a headless run never marks a plan approved, and the items below must be confirmed by a human before the M1 build starts.

### Approval readiness (what a human must confirm before the M1 build starts)

1. The eight architecture decisions D1 to D8, each reversible in one file, read and either kept or reversed; D1 (the engine lock) and D6 (the recipient second source) are the two that change runtime behaviour a surgeon could notice. The outside voice added six rows a surgeon could notice: R-138 (a missing report row stops the run), R-139 (an empty required column and a falling site denominator stop the run), R-140 (a published period's spread is withheld when its peer set changes), R-142 (an empty period publishes only under an explicit flag), R-85's `partial-extract` mark and R-135's blocked-row definition of `published_at`.
2. The Taste items carried from every phase, in one sitting: R-61's visible target date; TD-03, TD-04, TD-06, TD-09, TD-13; the face and accent (OQ-63) and the night scheme in `DESIGN.md`; T-01, T-03, T-06, T-10 from the CEO review's outside voice.
3. The framework pick (D-05) recorded in the runbook, and the SSO pattern (D-06) confirmed with MGB IAM (TA-07); both are M2 and neither blocks M1 code, but the `disputes/` service-function boundary assumes the pick is one of the two.
4. The M0 answers the plan cannot supply: the interim store (TA-02, OQ-61), the relay and directory requests (TA-03, TA-04), the extract's shape (TA-05, TA-06), the MRN pattern and incident procedure (OQ-58). The M1 E2E test runs without them; the first real send does not.
5. The two owner items carried from the CEO review (L-18, L-19) answered or explicitly left open.
6. The PRD amendments in this run (R-130 to R-144; R-13, R-29, R-41, R-84, R-85, R-89, R-94, R-99, R-102, R-135 changed; section 13 exit criteria; sections 14 and 15; appendix D eng block) read and accepted as obligations, not as approvals.
7. The Taste items the outside voice added: TE-03 (the frozen peer set on published periods, taken provisionally) and TE-D2 with TE-D1 (the size of the M1 operating surface, which is T-01 restated); and the owner item it sharpened: the subject token for decision replies (TE-06) with L-18.

---

## Amendments made in this run

| File | Change |
|---|---|
| `docs/PRD.md` | R-130 (engine writer serialization and ordering test), R-131 (unexpected-exception path), R-132 (M1 end-to-end synthetic run in CI), R-133 (transport regression tests), R-134 (row text renders the source row a number was computed from; superseded loads listed), R-135 (recipient second source), R-136 (M2 decide request in three commits; pending decision emails retried), R-137 (one authored catalogue, registered by hash; PRD strings as the golden fixture) added; R-29, R-84, R-89, R-94, R-99 amended; section 7.16 count line; section 13 M1 and M2 exit criteria tightened; appendix A counts; appendix C row 0.8; appendix D "Pending" line and the `<!-- autoplan-accepted:eng -->` block appended after the impeccable line (the ceo and design blocks untouched). Outside-voice close (v0.9): R-138 (reconciliation stops on a missing report row), R-139 (null-rate field checklist and site-denominator feed health), R-140 (frozen peer set on published periods), R-141 (derived `sender_kind`), R-142 (`--publish-empty`), R-143 (M1 audit trusted-operator statement; automatic export; `doctor` by setting), R-144 (`grants repair`; exit-4 run-record fields) added; R-13, R-41, R-85, R-102, R-135 amended; section 9.4 two keys; section 13 M1 exit criteria; section 14 Survival; section 15 one row; section 1 one sentence; appendix A, C (row 0.9) and D (summary lines, Review summary table, eng block extended); R-127's citation of a feature id not in the catalogue (F-115) dropped |
| `DESIGN.md` | two strings aligned with R-126 and R-129 (Pace block; Email grammar records line) |
| `TODOS.md` | created: 21 deferred items from every phase, each with an owner and a starting point; rows 22 to 24 added by the outside-voice close (subject token for decision replies; "last refreshed" semantics under `--publish-empty`; per-stage narrowing of G17 after three closes) |
| `docs/reviews/plan-eng-review-test-plan.md` | the Test Plan artifact for `/qa`; tests M23 to M33 added by the outside-voice close |
| `README.md` | Documents table matched to the files that exist; Status section states the PRD version, DRAFT pending human approval, and the decisions a human makes first |
| `docs/reviews/plan-eng-review.md` | this file |

The technical design is not edited by this review: its eight contradictions and omissions are recorded here with the decision each takes, and the builder applies them in code with the tests named; the technical design's own review log is where the builder records them when the sections are next revised.

---

## Completion summary

```
 ENG REVIEW: COMPLETION SUMMARY
 -----------------------------------------------------------------------
 Target                 docs/PRD.md v0.7 -> v0.8 (DRAFT; not approved)
                        with docs/03-technical-design.md v1.0 and DESIGN.md
 Mode                   FULL_REVIEW (selectors tripped: ~60 modules, ~30 tables, 10 roles,
                        4 services; headless rule: never reduce a complete plan)
 Scope Challenge        3 findings (structure), all accepted; no cut, no deferral, no User Challenge
 Section 1 Architecture 8 findings: P1 3 (D1 lock, D2 error path, D3 trigger grants), P2 5
 Section 2 Code quality 7 findings: P2 4, P3 3; DESIGN.md drift fixed in this run
 Section 3 Tests        COVERAGE 71/108 paths (66%); QUALITY ★★★ 30, ★★ 33, ★ 8; GAPS 37
                        (M1 27, M2 8, M4/M6 2); E2E routed 7; EVAL 0; 22 missing tests specified;
                        test plan written to docs/reviews/plan-eng-review-test-plan.md
 Section 4 Performance  3 findings: P2 1 (batched loads), P3 2; every NFR target reachable
 Failure modes          31 rows; CRITICAL GAP 1 (engine writer lock, R-130, T1); gaps with a
                        clear error 7, all tasked; unresolved with owners 2 (carried)
 Diagrams               3 (close/reconcile/publish; dispute/decide/recompute/re-publish;
                        post-decision run and delivery states); dispute state diagram judged complete
 Parallelization        13 steps, 5 lanes for M1 plus one M2 lane; 5 conflict flags, each resolved
 Tasks                  19 (P1: 8, P2: 10, P3: 1)
 PRD rows               added R-130 to R-144; changed R-13, R-29, R-41, R-84, R-85, R-89, R-94,
                        R-99, R-102, R-135; sections 1, 7.16, 9.4, 13, 14, 15, 17A, 17C, 17D
                        changed; no row removed
 NOT in scope           12 deferrals + 3 separate-scope items; TODOS.md written (21 rows)
 What already exists    6 rows
 Outside voice          provider not installed; a fresh-context Claude subagent ran the eng prompt
                        and its output is under "## Outside voice" (native-only coverage; no
                        consensus cell CONFIRMED; no clean-review credit): 2 blocking, 8 material,
                        2 minor findings; ACCEPT 7, PARTIAL 6, REJECT 1 (as a plan change; Taste);
                        11 tests added (M23 to M33); 4 DISAGREE dimensions to Taste
 Unresolved             Taste 13 (held for the human; TE-03 and TE-D1/D2 added); owner 7 (the
                        subject token joins L-18)
 Lake score             13/13 on the coverage decisions where options differed in coverage
                        (every test gap chosen complete; every mechanism chosen over "document it")
 Status                 issues_open; DONE_WITH_CONCERNS (P1 tasks and Taste items await a human)
 -----------------------------------------------------------------------
```

## Headless decisions

Every decision point was auto-chosen under the spawned-session rule: the recommended option, else P5 explicit over clever then P3 pragmatic; never a destructive option. Recorded for the human to reverse.

1. Scope gate: B, `docs/PRD.md`, with the technical design as architecture and `DESIGN.md` as frontend system, as the task fixed.
2. MODE: FULL_REVIEW. The selectors tripped; the autoplan Eng rule forbids reducing a complete plan; every feature-cut question answered No with its reason; the structure question kept the original arrangement.
3. Scope Challenge C: three structural remedies (CLI registration, migration ranges, one catalogue) taken as recommended.
4. D1 to D19 and S-C1 to S-C3: each took the recommended option; alternatives named in the ledger where one existed.
5. D10 applied to `DESIGN.md` in this run because it is inside the blast radius and under an hour (P2); everything else stays a task for the builder.
6. Test gaps: every one added (P1 completeness); none deferred; two marked CRITICAL by the critical gap rule and the E2E matrix.
7. R-xx numbering: next unused number R-130 onward; no existing ID changed or removed; R-113 to R-129 kept as written by earlier phases.
8. Section 13: exit criteria tightened, gates unchanged; no milestone moved.
9. Appendix D: the eng block appended after the impeccable line; the ceo and design blocks byte-for-byte untouched (verified by diff).
10. `TODOS.md` created (autoplan Eng rule: deferred items from every phase), reversing the two earlier reviews' choice not to create it; non-destructive.
11. The technical design not edited: recording decisions here and in the PRD keeps one place per decision; the builder applies them in code.
12. Outside voice: provider not installed; not claimed. A fresh-context Claude subagent ran the eng prompt and its output is rendered verbatim under "## Outside voice"; it never counts as outside coverage; every consensus cell is N/A.
13. Approval: none granted; "Approval readiness" lists what a human confirms; status DRAFT; review status issues_open.
14. Taste items from every phase kept as provisional recommended choices and listed at the gate; none auto-approved. Owner items left with owners; no institutional fact asserted.
15. No User Challenge: no finding changes the user's stated direction (the brief, the wedge, the sequencing).
16. Effort ratios from the digest applied as written; human effort is an estimate for a builder with the technical design in hand.
17. Outside-voice dispositions (TE-01 to TE-12, TE-D1, TE-D2): each verified against the technical design text before disposal; ACCEPT where the mechanism is explicit, in blast radius and under a day (P5, then P1 or P3); PARTIAL where part of the fix is a security-sensitive or owner-held choice (the subject token, L-18) or the clever half of a two-part remedy (a frozen "last refreshed"; per-stage G17; unconditional `doctor` warnings); REJECT only for a plan reduction (P2), recorded as Taste beside T-01. The two blocking findings are single-voice and accepted as M1 Must rows.
18. The frozen peer set on published periods (TE-03, R-140) changes F-39's behaviour on published periods and is taken provisionally as the recommended option; listed as Taste for the human because the alternative (rebuild as designed, leak accepted and logged) is viable.
19. R-xx placement: existing rows R-137, R-136 and R-135 moved within their areas so ids read in ascending order (7.3, 7.4, 7.12); no id, text or feature citation changed by the move. R-127's citation of F-115, which is not in the catalogue, was dropped as a consistency fix.
20. PRD version 0.9: the outside-voice close and the finalize pass; status DRAFT; pending human approval.

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|---|---|---|---|---|---|
| CEO Review | done | plan-level product review | 1 | issues_open | `docs/reviews/plan-ceo-review.md`: 1 critical gap (closed here as R-130), 17 warnings |
| Outside Review | native only | no outside model installed; fresh-context native subagents ran the CEO, design and eng prompts; the eng output and its dispositions are under "## Outside voice" | 3 | native only | never counts as outside coverage; eng: 12 findings, 7 accepted, 6 partial, 1 rejected as a plan change |
| Eng Review | done (headless) | the shipping gate | 1 | issues_open | 8 architecture, 7 code quality, 3 performance; 37 test gaps; 1 critical gap; 19 tasks (8 P1) including the outside voice's two blocking findings |
| Design Review | done | UI scope: email, M2 app, M4 inbox | 1 | issues_open | 2/10 to 7/10; plus the impeccable pass (27/40 to 32/40) |
| DX Review | not applicable | no developer-facing surface | 0 | n/a | |

OUTSIDE COVERAGE: none (no consensus cell CONFIRMED; a native subagent is not outside coverage).

VERDICT: the plan is buildable. The architecture holds one system of truth, one artifact seam and roles that match package boundaries; the eight decisions above and the outside voice's accepted rows close the places it said two things or nothing; the test plan names every test the M1 build must carry. It is not approved and cannot be until a human confirms the seven items under "Approval readiness". The eight P1 tasks block ship.

**UNRESOLVED DECISIONS:**
- Taste (held for the human, from every phase): R-61 target date; TD-03, TD-04, TD-06, TD-09, TD-13; face and accent (OQ-63); night scheme with M2; T-01, T-03, T-06, T-10; TE-03 (frozen peer set on published periods, taken provisionally); TE-D1 and TE-D2 (the M1 operating surface, T-01 restated).
- Owner: L-18 decision-by-reply authenticity (information security), now with the subject-token question from TE-06; L-19 whole-month-leave email (definitions owner); OQ-61 off-host location; OQ-62 privileged derived rows (M6); OQ-47 approving bodies and lead times; OQ-57 retention periods.
- Builder, recorded in the runbook when made: D-05 framework; D-06 SSO pattern (with MGB IAM, TA-07).

## Outside voice

Run after every section above as a fresh-context Claude subagent, prompted with the eng prompt ("Review this plan for architectural issues, missing edge cases, and hidden complexity. Be adversarial.") and the CEO and design consensus summaries as context, and told not to repeat this review but to find what it missed. A Claude subagent is not an outside model: OUTSIDE COVERAGE is native only, no consensus cell below is CONFIRMED, and every verdict difference is a Taste item carried by a disposition row. Its output is rendered verbatim.

### OUTSIDE VOICE (Claude subagent)

```json
{
 "steelman": "One Python package, one PostgreSQL database and one CLI hold a record-level attribution ledger in which every published number points at the rows it was computed from, the hash-registered definition file it was computed under and the run that published it, so 'why is this my number' is always one query and never a conversation. A monthly close refuses to publish unless the wedge numbers equal periop's own report, every cell carries a value or a worded reason, and every record list has exactly as many rows as its denominator, which turns the brief's ground rules into gates rather than habits. Disputes are ledger rows pinned to one record, routed by executable predicates, applied as retiring overrides that recompute an 'as adjudicated' basis beside 'as logged', so the department can correct what a surgeon sees without ever editing a source row or waiting for periop.",
 "most_revealing_element": "The definition_delta table and who is writing to it in month two. Reconciliation (G6, D-15 zero tolerance) is both the product's central promise (goal G1) and its largest recurring operating cost: every one-case difference between the department's compute and periop's report must be explained by an authored delta or a sustained re-credit before anything publishes. If in the second close the analyst is authoring deltas to clear the gate, or reaching for --reconcile-skip, the wedge is already dead: either periop's extract and report cannot be made to agree at record grain, or the analyst is doing the builder's job. If the table stays nearly empty and the gate passes on its own, the ledger has earned its keep and the rest of the machinery is affordable. Watch that table, not the runbook page count.",
 "premises_challenged": [
  {
   "premise": "One department analyst on a chair-approved fraction can operate this surface unassisted (goal G6, R-82, D-48, runbook page 1 'fits one printed page').",
   "why_wrong": "The page fits because the surface does not: eighteen run gates, five exit codes, ten database roles with SET ROLE per stage, pgaudit, a hash-chained audit export the analyst runs by hand daily, an off-workstation dump copy that doctor fails on after 24 hours, a native PostgreSQL on a Windows workstation, IMAP NDR ingest, LDAPS lookup at send time and a quarterly recertification. Exit code 4 ('call the builder or MGB support') can be raised by grants drift on every command (G17), which no analyst can diagnose. This is a platform team's operating surface scaled to twelve surgeons and four numbers.",
   "evidence_that_would_prove_it": "Count exit-4 and doctor failures in the first three closes and who resolved them; the elapsed time R-82 records for the backup analyst's unassisted run against the builder's; the number of runbook steps whose remedy is 'call the builder'. If any close in months one to three is unblocked by the builder rather than by data, the premise failed."
  },
  {
   "premise": "A per-surgeon 'not_reconciled: periop does not report' result is a benign passing state of the reconciliation gate (Metric engine, 'The reconciliation gate', reconciliation_result.status; R-84; OQ-54).",
   "why_wrong": "'theirs absent -> not_reconciled' is evaluated per (clinician, metric). Periop's report keys surgeons by clinician_raw, and the periop_report loader has no unmapped-provider exception path like every other loader. A name-mapping miss for one surgeon therefore passes the gate and that surgeon's tile prints 'Periop's report does not carry this number', which is false; the one control the wedge rests on silently exempts exactly the surgeon it failed to match.",
   "evidence_that_would_prove_it": "Load the M0 periop report and count clinician_raw values that resolve to no roster person_key; run reconcile on the synthetic department with one surgeon's report row deleted and observe that the gate passes and the tile label changes."
  },
  {
   "premise": "The hash-chained off-host audit export is the control that holds when the M1 operator is the database superuser (invariant I3; audit log design point 4; OQ-61).",
   "why_wrong": "At M1 the export is a manual step inside status --daily, run by the same person it is meant to constrain, to a location information security has not yet named, and doctor is what notices its absence. A control that the controlled party can simply not run, with the only alarm being a tool that same party runs, is documentation, not a mechanism. The design should say plainly that M1 audit is trusted-operator and the mechanism begins on the VM.",
   "evidence_that_would_prove_it": "Check whether audit export has ever fired on a day the analyst did not otherwise touch the system; ask information security at M0 whether an append-only location with an analyst-only ACL exists at all (OQ-61). If either answer is no, the premise is already false."
  },
  {
   "premise": "A synchronous recompute inside the M2 decide request (D-26, 'under 5 seconds') is simpler than a queue.",
   "why_wrong": "The path recomputes both bases for every affected cell, re-runs suppression, rebuilds peer snapshots for every viewer whose group contains either clinician, re-runs the reconciliation gate, renders two emails, runs payload scans and sends through the SMTP relay, all inside one HTTP request under a 10-second statement timeout and gunicorn worker timeouts, with no lock against a concurrent scorecard close on the same period (the T7 item the PRD deferred here). D-26 also says 'same request and transaction' while the recompute path says 'the decision stands, the run row records the failure', which cannot both be true.",
   "evidence_that_would_prove_it": "Measure the M2 decide request p95 on the synthetic department with the relay in the loop; run close --period P concurrently with recompute --dispute on that period and watch for the partial unique index on metric_value(is_current) to raise mid-transaction."
  }
 ],
 "dimension_verdicts": [
  {
   "dimension": "architecture and boundaries",
   "verdict": "partial",
   "reason": "One package, one database, one CLI and the raw/src/ledger/restricted split are the right shape for tens of surgeons, and keeping the web app free of logic behind the same service functions the CLI calls is correct. But the boundary between the three-month wedge and the seven-milestone platform is not drawn in code: M1 already carries ten roles, an empty privileged schema, a pub contract, RLS preparation and a hash chain, so the pilot inherits the platform's operating cost before the month-three decision that decides whether the platform exists."
  },
  {
   "dimension": "data flow and state",
   "verdict": "agree",
   "reason": "Append-only metric_value with is_current, the restatement chain, period labels with derived dates (D-49), overrides that retire rather than delete, and convergence on re-ingest are sound and reproducible. Two state concerns remain: the registry stores a hash and not the source, so 'reproducible from raw plus the registry' depends on the working tree; and a published period's peer snapshot is rebuilt when membership changes, which is a state transition the anonymity model did not consider."
  },
  {
   "dimension": "failure modes and error handling",
   "verdict": "partial",
   "reason": "The gate table, exit codes and no-zero rule are better than most production systems. The silent paths are the ones the gates were not pointed at: a header-only field check passes an all-null column; a per-surgeon absent report row passes reconciliation; --accept-partial publishes truncated numbers with no mark on the tile; an email with zero values is sendable; the recompute/close race has no lock; and D-26's transaction semantics contradict the recompute path's failure handling."
  },
  {
   "dimension": "test strategy and coverage",
   "verdict": "agree",
   "reason": "Golden outputs per definition version, invariant fixtures that break one row and expect the run to fail, the purity check, the authorization matrix iterated as a matrix, the RLS backstop, migration fresh and replay, and the deliberate 'brief assumption does not reconcile' test are the right tests. Missing: a set-difference test on spread re-render after a membership change, a concurrency test for close versus recompute, a reconciliation test with an unmapped clinician_raw, and an end-to-end runbook run by a non-builder on the synthetic department as a CI-adjacent artifact."
  },
  {
   "dimension": "performance",
   "verdict": "agree",
   "reason": "Thousands of cases and tens of surgeons need nothing beyond pandas and the DDL's indexes; the targets are stated and measured from run rows, which is the correct posture. The only place performance is a design question is the synchronous recompute-and-send inside the decide request, which should be split so the request commits and the send happens after."
  },
  {
   "dimension": "operability by a department analyst",
   "verdict": "disagree",
   "reason": "The design confuses a short runbook with a small operating surface. Too many refusals are control failures rather than data failures (grants drift, dump age, export age, pgaudit presence, listener posture), each surfaced as exit 4 with 'call the builder'. The analyst also runs, by hand, the daily checklist, the audit export, the dump copy, the NDR ingest and the dispute intake between closes. Survival criterion G6 will be measured honestly, but the design should be shaped so that a monthly close can only be stopped by something the analyst can fix by reading the gate line."
  }
 ],
 "top_findings": [
  {
   "severity": "blocking",
   "finding": "Silent pass in the reconciliation gate: a surgeon whose periop_report row is absent (unmapped clinician_raw, name change, row dropped) gets status not_reconciled, the gate passes, and the tile prints the false statement that periop does not carry the number.",
   "location": "Metric engine, 'The reconciliation gate against periop's report' (reconcile.run pseudocode: 'absent -> status not_reconciled'); ledger.reconciliation_result; R-84; goal G1; feed contract row periop_report",
   "fix": "Make not_reconciled a metric-level state only: allowed when src.periop_report holds zero rows for (metric, period). When the metric is reported and a roster surgeon has no row, write status unexplained with explained_by_kind 'clinician_unmapped' and stop the run. Give loaders/periop_report.py the same unmapped_provider exception path as the other loaders, resolved by the analyst with a recorded reason. Add tests/engine/test_reconcile.py::test_missing_surgeon_row_stops_run."
  },
  {
   "severity": "blocking",
   "finding": "The field checklist is evaluated against the file header only, so a required column that is present but empty (wheels_in blank after an extract change, delay_reason_code all null) passes G2; FCOT's 'wheels-in missing' exclusion then empties every denominator and the run publishes 'Not shown: 0 first cases; needs at least 4' to every surgeon with no gate fired.",
   "location": "Ingestion and operations, 'The field checklist and \"not computable\"' (step 4 'evaluates it against the file's header'); G2; feed_load.field_checklist; feed health gate G3 (row_count against expected_min_rows only)",
   "fix": "Record per-required-column null rate in field_checklist and treat a column above a threshold (setting, default 20%) as not_computable for its metrics. Extend G3 from file row count to site-level wedge denominators: if the summed FCOT or volume denominator for the site falls below 70% of the trailing three months, stop with gate feed_health unless --accept-partial with a note. Add a fixture with an all-null wheels_in column to tests/loaders/test_field_checklist.py."
  },
  {
   "severity": "material",
   "finding": "Suppression leak by set difference: a published period's peer_group_snapshot is rebuilt after a roster change or a dispute recompute for that same period. A viewer holding the emailed sorted list and the re-rendered list learns one colleague's exact value (the member removed by opt-out or roster change, or the receiver whose value moved), and the what-changed block tells them why.",
   "location": "Metric engine, 'Peer groups and the anonymous spread' (roster change: recompute --roster-change rebuilds snapshots 'for periods on or after the change date'); 'The recompute path' step 4/6 (rebuild snapshots for every viewer whose group contains an affected clinician); ledger.peer_group_snapshot.spread_values; D-13; R-38, GR4",
   "fix": "Freeze the member set of a published period's snapshot: store member_set_hash on the snapshot at first publish; a rebuild may recompute values but if the set of clearing members differs from the published set, write suppression kind spread_not_written with a new catalogue key spread-group-changed ('Peer comparison withheld for this period: the peer group changed after it was published') instead of a new sorted list. Roster changes affect only periods that have not been published. Add tests/engine/test_peers.py::test_republished_spread_never_differs_by_one_member."
  },
  {
   "severity": "material",
   "finding": "D-26 says the app's decide action runs the recompute 'in the same request and transaction as the decision', while the recompute path says 'if the recompute fails its gates, the decision stands (the events are committed)'. Both cannot hold. Separately, nothing serializes close, recompute and restate on one period; two engine writers flipping is_current collide on the partial unique index mid-transaction, and the app request errors after part of the work.",
   "location": "Architecture decisions D-26; Dispute workflow 'The recompute path' (failure paragraph) and Builder decision 4; Metric engine 'Recompute after a dispute'; PRD appendix D deferred item T7",
   "fix": "Two transactions by design: commit the decision events, then run recompute in a second transaction on a call-scoped engine connection; a recompute failure writes the run row and the checklist item, never rolls back the decision. Every close, recompute and restate takes pg_advisory_xact_lock(hashtext(period_label)) first; a lock timeout renders restatement-pending and the analyst re-runs. Move the email sends out of the request: write delivery rows with status pending and let scorecard notify (or the status timer at M2) send, so a relay stall cannot fail a decision. Add tests/engine/test_concurrency.py."
  },
  {
   "severity": "material",
   "finding": "The definition registry stores code_hash and git_sha, not the definition's source, and recompute loads definitions/<metric>/<label>.py from the working tree 'by the registry's code_hash'. If v1.py is removed or the checkout is at a later tag, a same-version recompute (required by F-29 AC 2) cannot run, the definition page cannot show the text, and the loss-tolerance claim 'reproducible from raw plus the registry' is false.",
   "location": "Data model, ledger.metric_definition_version (C-01: code_hash); D-07, D-08; Dispute workflow 'The recompute path' step 2; Non-functional requirements 'Loss tolerance'",
   "fix": "Store source_text (the file bytes) on metric_definition_version at register time; recompute, restate and the definition page load from the ledger and verify sha256(source_text) = code_hash, falling back to the tree only to register. The refusal rule is unchanged. Add tests/engine/test_registry_refusal.py::test_recompute_without_tree_file."
  },
  {
   "severity": "material",
   "finding": "Decision-by-email authenticity at M1 is analyst-typed: decide() checks that decision_reply_id points at a reply_log row with sender_kind = 'adjudicator', but sender_kind is a value the analyst enters with scorecard reply log. G18 then verifies only that the analyst was the actor. A chief's ruling on a colleague's record is therefore recorded on the analyst's word, which the PRD lists as unresolved with information security.",
   "location": "Dispute workflow 'The dispute state machine' rules table (M1 decide check), 'M1 intake: email reply, analyst CLI', ledger.reply_log.sender_kind; gate G18; PRD appendix D 'decision-by-reply authenticity'",
   "fix": "Have scorecard reply log ingest the .eml itself (IMAP is already in scope for NDRs) and derive sender_kind from the authenticated envelope sender as delivered by the internal relay, storing the raw headers' hash on reply_log; put a per-dispute one-time token in the adjudicator email's subject and require it in the decision reply. Keep the analyst's typed override only as an explicit --override-sender with a note, listed on the trust report."
  },
  {
   "severity": "material",
   "finding": "Numbers computed from a partial extract publish with no mark the surgeon can see: '--accept-partial' stores the analyst's note on the period record, 'not on the tile'. A surgeon whose cases were in the truncated tail sees a lower volume and a different FCOT with no reason, which is exactly the blank the ground rules forbid.",
   "location": "Ingestion and operations, 'Feed health and the no-zero rule' (partial row: 'the analyst's note is on the period record, not on the tile'); G3; F-82 AC 3; OQ-37",
   "fix": "Add catalogue key partial-extract ('Computed from a partial periop extract for <period>: <n> of about <expected> rows arrived. Numbers may rise when the rest arrives.') rendered under every wedge tile and in the footer whenever the period's periop_or_log load is 'partial'; carry the accepted-partial flag on run and delivery so the next email's what-changed block reports the restatement when the full file lands."
  },
  {
   "severity": "material",
   "finding": "An email with zero values is sendable by design: every feed_missing cell is 'publish allowed', and R-129 even specifies the preview line for 'when no tile carries a value'. An analyst who closes a month before the extract lands (or loads the wrong period) sends forty surgeons an email of reasons, which reads as a broken product, and 'last refreshed' advances so the run-missed guard never fires.",
   "location": "Ingestion and operations, 'Feed health and the no-zero rule' (no load: 'run continues; publish allowed'); G3; R-129 zero-value preview line; F-83 last refreshed = run.published_at",
   "fix": "G3 stops close when zero wedge metrics have a metric_value for the period unless --publish-empty --note is passed and the note is stored; publish refuses a period with no values without the same flag. A run that publishes under --publish-empty does not advance the surgeon-facing 'last refreshed' date for value tiles."
  },
  {
   "severity": "material",
   "finding": "The trust report's per-surgeon disputed-record rate is offered to the chair (OQ-50). In the pilot no leader view of surgeon-level data may exist (D5, 'no leader view in M1'), and dispute rate per named surgeon is surgeon-level data with an obvious reading ('who complains'). Nothing in the report query or grants prevents it.",
   "location": "Dispute workflow 'The 14-day target and the over-14-days report' (trust report row: 'disputed-record rate per surgeon per month ... analyst; OQ-50 for the chair'); F-98; PRD invariant D5",
   "fix": "Split the report: an aggregate version (department-level counts, medians, outcome mix, awaiting-row share) is the only artifact that may leave the analyst; per-surgeon rows are an analyst-only table under analyst_ro with no send path. Add the chair to the payload scan's forbidden-recipient set for per-surgeon report columns and a test that the chair-facing report selects no clinician column."
  },
  {
   "severity": "material",
   "finding": "The M1 immutability story is not a mechanism. The analyst is the workstation superuser; the compensating control (hash-chained audit export, OQ-61) is run by hand by that analyst inside status --daily to an unnamed location, and doctor, which the analyst runs, is the alarm. Meanwhile doctor failing on a 24-hour-old export or dump can block a deploy for reasons the analyst cannot fix.",
   "location": "Data model invariant I3; Dispute workflow 'Audit log design' point 4; Ingestion and operations 'Environments' (M1) and 'Backups and the restore drill'; scorecard doctor conditions; OQ-61",
   "fix": "State in the runbook and on gate.privacy_email.scorecard's reference that M1 audit integrity is trusted-operator, with the mechanism starting on the VM. Make audit export automatic: every scorecard command appends its batch at exit (no separate daily step). At M1 make doctor's export-age and dump-age checks warnings, not failures, and keep them blocking only at M2 where a timer owns them."
  },
  {
   "severity": "minor",
   "finding": "published_at semantics are ambiguous when G13 blocks one surgeon: 'published_at is written once after the last successful send' and 'if a send fails midway, the period is not published', but a G13 block is 'that surgeon only; others send'. Either the period is never published while one address is unresolved (blocking everyone's 'last refreshed'), or it is published and the blocked surgeon's hosted page has no mechanism behind period-not-published-for-you.",
   "location": "Ingestion and operations, 'The publish stage in detail' (published_at paragraph); gate G13; C-18; R-118 period-not-published-for-you",
   "fix": "Define published_at as written when every roster surgeon has either a delivery row or a delivery row with status blocked and a reason code; period-not-published-for-you reads its sentence from that row's reason ('your identity could not be matched to the directory'); the blocked surgeon stays on the checklist until publish --resend succeeds. Add a fixture with one unresolved address to tests/publish/test_gates.py."
  },
  {
   "severity": "minor",
   "finding": "G17 (grants match roles.sql) runs at the start of every command and exits 4 on any difference. On a workstation where the analyst is superuser and may install extensions or receive a PostgreSQL patch that touches default privileges, a benign drift stops the monthly close with 'call the builder', which is the failure mode G6 is trying to avoid.",
   "location": "Ingestion and operations, 'The run pipeline' exit code table and gate G17; Data model invariant I14; scorecard grants check",
   "fix": "Run the full grants check at migrate, doctor and publish --send only; at load, close and dispute commands check just the invariant that matters for that stage (loader lacks UPDATE, engine lacks DELETE) and warn on other drift. Give the analyst scorecard grants repair, which re-applies roles.sql idempotently and records the audit row, so drift is a one-command fix rather than an exit 4."
  }
 ],
 "what_i_would_build_first": "Nothing with roles, pgaudit, RLS or a hash chain. Week one is the smallest thing that answers the reconciliation question on real data: migrations for ledger.record, attribution, metric_definition_version (with source_text), metric_value, metric_value_record, suppression_decision, reconciliation_result and run; scorecard synth producing a periop extract and a matching periop report with a known grace window; loaders/periop_or_log.py and loaders/periop_report.py with the clinician mapping and an unmapped-provider exception on both; definitions/fcot/v1.py and or_case_volume/v1.py registered by hash; scorecard close --dry-run producing the surgeon-by-metric suppression grid and the per-surgeon reconciliation table with ours, periop's, delta and explanation; and the two tests that matter most, test_brief_assumption_does_not_reconcile and test_missing_surgeon_row_stops_run. On Friday I hand the M0 extract and report to the backup analyst with a one-page runbook and a stopwatch, and I read the definition_delta table on Monday. If the gate clears with an empty table, I add the dispute functions and the email; if it does not, the next thing built is a conversation with periop analytics, not more code."
}
```

## Eng consensus table

Coverage: native completed (Scope Challenge, Sections 1 to 4, failure modes, diagrams, tasks); outside not available, replaced by a Claude subagent, which the autoplan rule counts as native only. Consequence: every consensus cell is N/A, none is CONFIRMED, and every DISAGREE is a Taste item carried by the disposition rows below. The Claude column is the native review's own verdict per dimension, cited to its section; the Outside column is the subagent's `dimension_verdicts` entry, with the outside dimension "operability by a department analyst" placed under "deployment risk manageable" because that is the dimension its evidence bears on.

| Dimension | Claude (native review) | Outside (Claude subagent) | Consensus |
|---|---|---|---|
| Architecture sound | agree with eight fixes (Section 1: D1 to D8; one package, one database, stage roles matching package boundaries, the artifact model as the one seam) | partial: the right shape for tens of surgeons, but the wedge-to-platform boundary is not drawn in code; M1 carries ten roles, an empty privileged schema, RLS preparation and a hash chain before the month-three decision | N/A, native only. DISAGREE, Taste; the outside position is the CEO outside voice's T-01 restated (held, not taken); carried by TE-D2 |
| Test coverage sufficient | partial, then complete by decision (Section 3: 71/108 paths before the 22 named tests; D16 adds every gap; one critical gap, R-130) | agree: the golden outputs, invariant fixtures, purity check, matrix, backstop, migration replay and "brief assumption does not reconcile" are the right tests; missing a set-difference spread test, a concurrency test, an unmapped `clinician_raw` reconciliation test and a non-builder end-to-end run | N/A, native only. Same verdict after D16; the four missing tests are TE-01, TE-03, TE-04 (merged into T1) and TE-B; three added to the test plan |
| Performance risks | agree (Section 4: every target reachable; batched loads D17, one-query peers D18, audit indexes D19; the relay is the only unbounded call) | agree: pandas and the DDL's indexes suffice; the one design question is the synchronous recompute-and-send in the decide request, which should commit first and send after | N/A, native only. Same verdict; the send split is D8 (R-136), already taken |
| Security threats | agree with two fixes (Section 1 D5 RLS set extended; D6 recipient second source; Section 2 D14 SQL composition; nothing lets a surgeon reach another's row without both the matrix and RLS failing) | partial by implication: a set-difference leak on a re-rendered spread (TE-03); decision-by-email authenticity on the analyst's word (TE-06); M1 audit integrity is trusted-operator (TE-10); the per-surgeon dispute rate offered to the chair (TE-09) | N/A, native only. DISAGREE, Taste; TE-03 and TE-09 accepted, TE-06 and TE-10 partial; carried by those rows |
| Error paths handled | agree with fixes (Section 1 D2 exit 4 and `error` status; D4 sustained-override explanation; D8 pending delivery; failure modes table: one critical gap, seven clear gaps, all tasked) | partial: the silent paths are the ones the gates were not pointed at: a header-only field check passes an all-null column; an absent per-surgeon report row passes reconciliation; `--accept-partial` publishes with no mark; a zero-value email is sendable; D-26's transaction semantics contradict the recompute path | N/A, native only. DISAGREE, Taste; TE-01, TE-02, TE-07 accepted, TE-08 partial, TE-04 merged into D1 and D8 |
| Deployment risk manageable | agree (Scope A distribution check: one deployment, `pip install -e .` at a tag, `doctor --compare`, migration replay; runbook page 1 fits a page; G17 turns drift into a run failure) | disagree ("operability by a department analyst"): a short runbook is not a small operating surface; too many refusals are control failures surfaced as exit 4 with "call the builder"; the analyst runs the checklist, the export, the dump copy, the NDR ingest and the intake by hand between closes | N/A, native only. DISAGREE, Taste; carried by TE-D1 (partly accepted as TE-10, TE-12 and the exit-4 count in section 14) |

Summary: 0 CONFIRMED; 4 DISAGREE to Taste; 2 same verdict (N/A, native only); 0 User Challenges (no item where both voices want to change the user's stated direction; the outside voice's "what I would build first" is one voice and restates T-01). Single-voice critical findings flagged: TE-01 and TE-02 are the outside voice's two blocking findings; neither was raised natively; both are accepted below and both are now M1 Must rows.

---

## Cross-model tension dispositions

Rule applied (headless): where the native review already made a recommendation, keep it and record the disagreement as a Taste item; where it made none, apply the eng tiebreakers (P5 explicit over clever, then P3 pragmatic) and accept what is in blast radius and under a day; never invent institutional policy; never auto-choose a security-sensitive change with no owner. Each finding was checked against the technical design text it cites before disposal; the "native position" column quotes it. Where a finding duplicates a native finding the row says so and merges into the native decision and task.

| ID | Source | Outside position (short) | Native position (cited) | Decision | Principle and reason | PRD change | Held for the human |
|---|---|---|---|---|---|---|---|
| TE-01 | Finding 1, blocking; premise 2; "error paths" | `not_reconciled` is evaluated per (clinician, metric), so a roster surgeon whose `periop_report` row is absent passes the gate and the tile prints "Periop's report does not carry this number", which is false; make `not_reconciled` metric-level only, stop the run with `clinician_unmapped` when the metric is reported and a surgeon has no row, give `loaders/periop_report.py` the unmapped-provider exception path | Verified. Technical design "The reconciliation gate": `theirs = src.periop_report row for (clinician, metric, period); absent -> status not_reconciled`; the feed contract for `periop_report` maps `surgeon id` with no exception path, while `ATTR-*` rules all carry `unmapped_provider`; the native review examined the gate for basis (D4) and not for absence | ACCEPT | P5: one stop condition a new contributor reads in a line; P1: the gate is goal G1's mechanism and a silent pass is its worst failure. In blast radius (`reconcile.py`, `loaders/periop_report.py`, the `reconciliation_result` CHECK), under a day | R-138 (new); `explained_by_kind` gains `clinician_unmapped`; test M23 | no |
| TE-02 | Finding 2, blocking; "error paths" | The field checklist reads the header only, so a present-but-empty required column (all-null `wheels_in`) passes G2 and FCOT publishes "Not shown: 0 first cases" to everyone; record per-column null rate, treat a column above a threshold (setting, default 20%) as `not_computable`; extend G3 from file row count to site-level wedge denominators against the trailing three months | Verified. "The field checklist": "Step 4 evaluates it against the file's header"; "Feed health": `row_count` against `expected_min_rows` only; the native failure-modes row for a renamed column covers absence, not emptiness | ACCEPT | P5, P1: a null-rate column on the checklist is the same mechanism pointed at the same gate; the denominator check is one query against three stored rows. In blast radius (`loaders/_base.py`, `feed_load.field_checklist`, `engine/close.py` G3), under a day; the 70% figure is a `department_setting` default the analyst can change with a signed row, not a constant | R-139 (new); test M24 | no |
| TE-03 | Finding 3, material; "security"; test strategy | A published period's `peer_group_snapshot` is rebuilt after a roster change or a dispute recompute; a viewer holding both sorted lists learns one colleague's exact value by set difference; freeze the member set at first publish (`member_set_hash`), and when the clearing set differs write `spread_not_written` with a new key `spread-group-changed`; roster changes touch only unpublished periods | Verified. "Peer groups": `recompute --roster-change` rebuilds snapshots "for periods on or after the change date"; "The recompute path" step 4 rebuilds "for every viewer whose peer_group_snapshot ... contains an affected clinician"; D-13 defends order, not membership; R-41 (F-39) requires the rebuild from the change date | PARTIAL | P5: a stored hash and one comparison. Accepted for the member set: a published period's spread is never re-rendered with a different clearing set. Not accepted for value changes in the same set (a re-credit moves one anonymous value; F-29 AC 5 requires the rebuild and the disputant and receiver already know the case). R-41's "recompute from the change date" now applies to membership only for periods not yet published; published periods withhold the comparison with the as-of date | R-140 (new); R-41 amended; section 9.4 gains `spread-group-changed`; test M25 | yes: it changes F-39's behaviour on published periods (Taste; the alternative is the rebuild as designed with the leak accepted and logged under P5 evidence) |
| TE-04 | Finding 4, material; premise 4; "architecture", "error paths" | D-26 ("same request and transaction") and the recompute path's failure paragraph ("the decision stands") cannot both hold; nothing serializes `close`, `recompute` and `restate`; two transactions by design, `pg_advisory_xact_lock(hashtext(period_label))`, sends moved out of the request, `tests/engine/test_concurrency.py` | Duplicate. Section 1 finding 1 (D1, R-130, T1: one session-level lock; per-period locks rejected because snapshots and trend markers span periods) and finding 8 (D8, R-136, T10: three commits; delivery `pending` then `sent`; retry by status) | ACCEPT as merged | P4: the same fix already taken; the one difference (per-period versus one key) was decided in D1 with the reason quoted above and stands. `test_ordering.py` (M1) is the concurrency test | none beyond R-130 and R-136 | no |
| TE-05 | Finding 5, material; "data flow and state" | The registry stores `code_hash` and `git_sha`, not the source; `recompute` loads `definitions/<metric>/<label>.py` from the working tree, so a removed file or a later tag breaks a same-version recompute (F-29 AC 2) and "reproducible from raw plus the registry" is false; store `source_text` at register time, load from the ledger and verify the hash | Verified. `ledger.metric_definition_version` DDL carries `file_path`, `code_hash`, `git_sha` and no source column; "The recompute path" step 2: "load definitions/<metric>/<version_label>.py by the registry's code_hash"; the native review's D13 addressed `git_sha` without `.git` and not the source | ACCEPT | P5: one `bytea` column and one `sha256` comparison; P1: the loss-tolerance claim becomes true. In blast radius (`engine/registry.py`, the DDL, `recompute.py`, the definition page), under a day | R-13 amended; test M26 | no |
| TE-06 | Finding 6, material; "security" | `reply_log.sender_kind` is typed by the analyst, so a chief's ruling is recorded on the analyst's word; ingest the `.eml`, derive `sender_kind` from the relay-delivered envelope sender, store a hash of the raw headers, put a one-time token in the adjudicator email's subject and require it in the reply, keep a typed override only as `--override-sender` with a note on the trust report | Verified. "M1 intake": `reply_log row (sender_kind = 'adjudicator', classification = 'decision')` is typed by `scorecard reply log`; G18 checks the actor and the reply reference, not the sender; the native failure-modes row "the chief replies from a personal address" carried it as L-18 for information security | PARTIAL | P5, P3: deriving `sender_kind` from the ingested message is in blast radius (IMAP ingest already exists for NDRs; `reply_log` already stores `message_id`) and removes the typed value; the override with a note keeps the analyst's fallback explicit. The subject token is a bearer secret in mail and a security-sensitive choice with an owner (L-18, information security); not auto-chosen headless | R-141 (new); test M27 | yes: the token, with L-18 (owner) |
| TE-07 | Finding 7, material; "error paths" | `--accept-partial` publishes numbers from a truncated extract with the note on the period record, "not on the tile"; add `partial-extract` under every wedge tile and in the footer; carry the flag on run and delivery; report the restatement in the next what-changed block when the full file lands | Verified. "Feed health": partial row, "after acceptance: numbers publish; the analyst's note is on the period record, not on the tile". PRD R-85 already requires "a worded reason for every affected metric" on a partial feed, so the technical design contradicts the PRD here; the native review did not catch the contradiction | ACCEPT | P5: one catalogue key rendered on one condition; P1: R-85 already says so. In blast radius (`publish/render.py`, `_catalogue.py`, `run`, `delivery`), under a day | R-85 amended; section 9.4 gains `partial-extract`; test M28 | no |
| TE-08 | Finding 8, material; "error paths" | Every `feed_missing` cell is "publish allowed", so an analyst who closes before the extract lands sends forty emails of reasons and "last refreshed" advances so `run-missed` never fires; stop `close` when zero wedge metrics have a value unless `--publish-empty --note`; refuse `publish` without the same flag; do not advance the surgeon-facing "last refreshed" under it | Verified. "Feed health": no load, "run continues; publish allowed"; R-129 specifies the preview line for the no-value email; R-84 already holds publish when periop's report is missing, which covers the common case (report and extract arrive on one ticket) but not a loaded report with no extract or a wrong-period load | PARTIAL | P5: an explicit flag with a stored note, the same shape as `--accept-partial`. Not accepted: freezing "last refreshed" (R-86 defines it as the publish date; an email that went out carries a true date, and every tile on it already says "not received as of <date>"; a second meaning for one date is the clever option) | R-142 (new); test M29 | no |
| TE-09 | Finding 9, material; "security" | The trust report's disputed-record rate per named surgeon is offered to the chair (OQ-50) while D5 forbids a leader view in the pilot; split the report: an aggregate version is the only artifact that may leave the analyst; per-surgeon rows analyst-only under `analyst_ro` with no send path; the chair-facing report selects no clinician column | Verified. "The 14-day target": trust report row "disputed-record rate per surgeon per month ... analyst; OQ-50 for the chair"; PRD R-102 reads "aggregates only" and then lists a per-surgeon rate; goal G3 and section 14 measure the rate but do not send it | ACCEPT | P5: two queries instead of one with a recipient rule; P1: D5 holds on every artifact. In blast radius (`disputes/queue.py`, `publish/status.py`), under half a day | R-102 amended; test M30 | no |
| TE-10 | Finding 10, material; premise 3; "security", "operability" | The M1 immutability story is not a mechanism: the export is a manual step inside `status --daily`, run by the superuser it constrains, to an unnamed location, with `doctor` as the alarm; state plainly that M1 audit is trusted-operator; make the export automatic at the exit of every command; make `doctor`'s export-age and dump-age checks warnings at M1 and failures at M2 | Verified. "Audit log design" point 4: export "run inside `status --daily` at M1"; "`doctor` fails when the newest batch is older than 24 hours"; the location is OQ-61; the native failure-modes row "the off-host location is never granted" says "M1 cannot be called done (stated)" and the restore-drill exit criterion already requires the copy | PARTIAL | P5: say what is true and make the export a side effect of writing rather than a chore. Accepted: the trusted-operator statement in the runbook and on the gate reference; export at the exit of every writing command once `department_setting.audit_export_location` is set; `doctor` warns on export and dump age while that setting is unset and fails once it is set. Not accepted: warnings at M1 unconditionally (OQ-61 is an M1 exit condition; the setting, not the milestone, is the switch) | R-143 (new); test M31 | no (OQ-61 stays with information security) |
| TE-11 | Finding 11, minor | `published_at` is ambiguous when G13 blocks one surgeon: either the period is never published or the blocked surgeon's page has nothing behind `period-not-published-for-you`; define `published_at` as written when every roster surgeon has a sent or blocked delivery row with a reason code; the page reads the reason from that row; the blocked surgeon stays on the checklist until `--resend` | Verified. "The publish stage": "`published_at` is written once per period ... after the last successful send; if a send fails midway, the period is not published"; G13: "that surgeon only; others send"; D6 (R-135) added the second source and did not define the period's state with a blocked row | ACCEPT | P5: one definition, one reason code, one catalogue sentence already in R-126 ("your identity could not be matched to the directory"). A relay failure (no row) still leaves the period unpublished, as designed. In blast radius (`delivery.py`, `publish/gates.py`), under half a day | R-135 amended; `delivery.status` gains `blocked` with `block_reason`; test M32 | no |
| TE-12 | Finding 12, minor; "operability" | G17 exits 4 on any grants difference on every command, so benign drift on a superuser workstation stops the close with "call the builder"; run the full check only at `migrate`, `doctor` and `publish --send`, check per-stage invariants elsewhere and warn; add `scorecard grants repair` | Verified. "Gates" G17: "every command ... yes (exit 4)"; invariant I14; the runbook's exit-4 row reads "call the builder or MGB support" | PARTIAL | P5, P3: `grants repair` (re-apply `roles.sql` idempotently, write the audit row) turns the exit-4 remedy into one runbook line, which is what the finding wants. Not accepted: narrowing G17 per stage; the technical design and invariant I14 make drift a run failure on a PHI pipeline on purpose, and a warned drift that lets `load` write under wrong grants is the clever option | R-144 (new); test M33 | no; a later narrowing is `TODOS.md` row 24 after three closes' exit-4 counts |
| TE-D1 | Dimension "operability by a department analyst", DISAGREE; premise 1 | The design confuses a short runbook with a small operating surface; a close should be stoppable only by something the analyst can fix by reading the gate line; count exit-4 and `doctor` failures in the first three closes and who resolved them | Scope Challenge A distribution check and Section 3 J4 rows: one deployment; runbook page 1 fits a page; R-82 records elapsed time; goal G6 is measured from the analyst's runs; the native review did not count control failures separately from data failures | PARTIAL | P3: the evidence the outside voice names is one column on the run record. Accepted: every exit-4 run records the gate or condition and who resolved it, and section 14's Survival row reads the count. TE-10 and TE-12 are the two mechanisms taken. Not accepted: reshaping M1's control set (T-01 territory) | Section 14 Survival row; R-144 carries the run-record fields | yes: the surface itself, as T-01 (Taste, held) |
| TE-D2 | Dimension "architecture and boundaries", partial; "what I would build first" | The wedge-to-platform boundary is not drawn in code; week one should be the smallest thing that answers the reconciliation question (ledger, loaders with unmapped-provider exceptions, two definitions, `close --dry-run`, two tests) with no roles, pgaudit, RLS or hash chain, then a Friday hand-off to the backup analyst and a Monday read of `definition_delta` | Scope Challenge B: every cut asked and answered No; T-01 held as Taste, unchanged; D-25's reasoning; the parallelization strategy already puts S1 to S3, S5 and S6 first, which is the outside voice's week one in a different order | REJECT as a plan change; recorded as Taste | P2 (autoplan Eng rule: never reduce a complete plan); the build order in "Worktree parallelization strategy" already front-loads the reconciliation question, and TE-01's test (`test_missing_surgeon_row_stops_run`) joins `test_brief_assumption_does_not_reconcile` as the two tests the outside voice names. The "most revealing element" (watch `definition_delta` in month two) is already the CEO review's T-03 evidence and R-84's M0 diff | none; `TODOS.md` row 9 (T-01) cross-references this | yes: T-01 |
| TE-P1 to TE-P4 | Premises challenged 1 to 4 | Analyst operability (1); per-surgeon `not_reconciled` (2); M1 audit as a mechanism (3); synchronous recompute simpler than a queue (4) | 1 is TE-D1; 2 is TE-01; 3 is TE-10; 4 is TE-04 (D1, D8) | as those rows | as those rows | as those rows | as those rows |

Counts: 12 top findings; 7 ACCEPT (TE-01, TE-02, TE-05, TE-07, TE-09, TE-11; TE-04 as a merge into D1 and D8), 4 PARTIAL (TE-03, TE-06, TE-08, TE-10, TE-12 counted: 5 PARTIAL), 0 REJECT among the top findings; the dimension items: TE-D1 PARTIAL, TE-D2 REJECT as a plan change and held as Taste. Net: ACCEPT 7, PARTIAL 6, REJECT 1. New PRD rows R-138 to R-144; amended R-13, R-41, R-85, R-102, R-135; section 9.4 two keys; section 13 M1 exit criteria; section 14 Survival; section 15 one row. Tests M23 to M33 added to `docs/reviews/plan-eng-review-test-plan.md`. No item became a User Challenge: no outside finding asks to change the user's stated direction that the native review joined.

### Tests added from the outside voice

| # | Test (file) | Type | Asserts | Row |
|---|---|---|---|---|
| M23 | `tests/engine/test_reconcile.py::test_missing_surgeon_row_stops_run` | integration | a roster surgeon with no `periop_report` row for a reported metric writes `unexplained` with `explained_by_kind = 'clinician_unmapped'` and the run stops; a metric with zero report rows for the period writes `not_reconciled`; an unmapped `clinician_raw` lands on the exception list | R-138 |
| M24 | `tests/loaders/test_field_checklist.py::test_all_null_required_column`, `tests/loaders/test_feed_health.py::test_site_denominator_drop` | integration | an all-null `wheels_in` column marks FCOT `not_computable` with the null rate on the checklist; a site FCOT denominator under 70% of the trailing three loaded months stops `close` with gate `feed_health` unless `--accept-partial --note`; month one with no trailing months passes | R-139 |
| M25 | `tests/engine/test_peers.py::test_republished_spread_never_differs_by_one_member` | integration | after a roster change or opt-out dated inside a published period, the rebuilt snapshot for that period carries `spread-group-changed` and no values; an unpublished period rebuilds normally; a dispute recompute with the same clearing set rebuilds values | R-140, R-41 |
| M26 | `tests/engine/test_registry_refusal.py::test_recompute_without_tree_file` | integration | with `definitions/fcot/v1.py` removed from the tree, `recompute --dispute` runs from `source_text` and the definition page renders the text; a `source_text` whose hash differs from `code_hash` is refused | R-13 |
| M27 | `tests/disputes/test_intake.py::test_sender_kind_derived` | unit | `reply log` ingesting a `.eml` sets `sender_kind` from the envelope sender and stores the header hash; a typed `sender_kind` without `--override-sender --note` is refused; an override appears on the trust report; G18 fails a decision whose reply has a typed sender and no note | R-141 |
| M28 | `tests/loaders/test_feed_health.py::test_partial_mark_on_tile` | unit | after `--accept-partial`, every wedge tile and the footer carry `partial-extract` with the row counts; the flag is on `run` and `delivery`; the next period's what-changed block reports the restatement when the full file lands | R-85 |
| M29 | `tests/loaders/test_feed_health.py::test_publish_empty_flag` | integration | `close` with no wedge value stops with gate `feed_health`; `--publish-empty --note` stores the note and continues; `publish` refuses the period without the flag; the email under the flag uses the R-129 preview line | R-142 |
| M30 | `tests/disputes/test_queue.py::test_chair_report_has_no_clinician_column` | unit | the chair-facing trust report selects no clinician column and no per-surgeon row; the analyst report keeps them under `analyst_ro`; no send path exists for the analyst report | R-102 |
| M31 | `tests/ops/test_audit_export_auto.py`, `tests/ops/test_doctor.py::test_export_age_by_setting` | integration | a writing command appends an export batch at exit when `audit_export_location` is set and none when unset; `doctor` warns on export and dump age while the setting is unset and fails once set; the runbook and the gate reference carry the trusted-operator sentence (text check) | R-143 |
| M32 | `tests/publish/test_gates.py::test_one_unresolved_address` | integration | one surgeon with a directory mismatch gets `delivery.status = 'blocked'` with a reason code; the other 39 send; `published_at` is written; the blocked surgeon's page renders `period-not-published-for-you` with the directory sentence; the checklist lists the surgeon until `--resend` succeeds | R-135 |
| M33 | `tests/ops/test_grants_repair.py` | integration | an extra GRANT exits 4 with the runbook line; `grants repair` re-applies `roles.sql`, writes the audit row and the next command passes; a run row that exited 4 carries the condition and `resolved_by` | R-144 |

Decision D20 (auto-chosen; P1 completeness): every test above added; none deferred. All eleven are M1 except M25's dispute-recompute clause, which runs at M1 too.

