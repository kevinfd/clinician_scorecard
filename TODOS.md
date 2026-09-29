# TODOS

Deferred scope collected by `/plan-eng-review` (2026-09-29, headless) from the CEO review, the design review, the impeccable pass and the eng review. Nothing here is approved; each item names its owner or gate. Items are deferrals, never shortcuts: each was judged outside the M1 blast radius or waiting on an answer this repository cannot give.

| # | Item | Source | Owner or gate | Where to start |
|---|---|---|---|---|
| 1 | Division and site views: no specification exists; pub is the mandatory channel when one does | design doc; OQ-52 | definitions owner, chair | `docs/PRD.md` section 7.15; technical design "The optional BI pub contract" |
| 2 | BI pub export: schema, contract test and grants written at M2, enabled by `department_setting.pub_enabled` when a sponsor asks | D-36 | sponsor | technical design "The optional BI pub contract" |
| 3 | Charge-level wRVU record list and dispute action | OQ-33 | definitions owner, professional billing office | PRD R-80; technical design OQ-33 row |
| 4 | Print stylesheet or export for annual review | OQ-46; design review Pass 7 row 13 | definitions owner | `web/static/print.css` |
| 5 | Mockups of home, metric, record list and inbox pages | design review Step 0.5 | next interactive session | `docs/design/briefs/m2-web-app.md` |
| 6 | Display face and accent approval; MGB web standard question | OQ-63; R-120 | the human; department at M0 | `DESIGN.md` frontmatter |
| 7 | Night scheme shipped with M2 (DESIGN.md assumption) or deferred (design review) | DESIGN.md "Night scheme" | the human | `DESIGN.md` Colors |
| 8 | Full definitions text in every email versus month one and version changes only | OQ-64 | catalogue owner | technical design D-33 |
| 9 | M1 as one script, a sheet and a mailbox with the ledger at M2 | CEO outside voice T-01 (held as Taste; not taken) | the human | CEO review "Cross-model tension dispositions" |
| 10 | Reconciliation threshold instead of zero tolerance | CEO T-03, L-04 | definitions owner after the M0 diff | PRD R-84; D-15 |
| 11 | wRVU mirror tile in the M1 email | CEO T-06 | definitions owner, comp office | PRD 16.6 |
| 12 | Step zero by video plus acknowledgement | CEO T-10 | owner under OQ-10 | design doc Distribution Plan |
| 13 | Replace `pandas` with SQL plus plain Python once no definition needs a frame | eng review Section 2 | builder, P3 | `scorecard/engine/frames.py`, `compute.py` |
| 14 | Automate the daily checklist before the VM (Windows scheduled task rejected, D-47) | D-47 | VM landing (TA-01) | `deploy/systemd/scorecard-status.timer` |
| 15 | System-wide subspecialty roster feed for system-scope peer groups | OQ-53 | chair; enterprise analytics | `loaders/roster.py` with a new `feed_key` |
| 16 | NHSN as the Surgical site infection source | OQ-32 | QI coordinator, infection control | a new loader |
| 17 | Analyst screens' hierarchy and design | design review NOT in scope | M2 build | `web/templates/analyst/` |
| 18 | The whole-month-leave email content | CEO L-19; design Pass 7 row 8 | definitions owner | PRD R-94 |
| 19 | Decision-by-reply authenticity inside MGB mail | CEO L-18 | information security | technical design "M1 intake" |
| 20 | Off-host location for the M1 dump and audit export | OQ-61 | information security | technical design "Backups and the restore drill" |
| 21 | Whether QI-derived rows are peer-review privileged (M6) | OQ-62 | medical staff office | technical design "Roles, grants, restricted and privileged schemas" |
| 22 | A per-dispute one-time token in the adjudicator email's subject, required in the decision reply (eng outside voice TE-06); the derived sender kind ships without it (R-141) | eng review, outside voice; CEO L-18 | information security | technical design "M1 intake"; `disputes/intake.py` |
| 23 | Whether "last refreshed" should stay unchanged on an email published under `--publish-empty` (R-142 keeps R-86's meaning: the publish date) | eng outside voice TE-08 | definitions owner, analyst | PRD R-86, R-142 |
| 24 | Narrowing the grants check (G17) to per-stage invariants on `load`, `close` and dispute commands, after the first three closes' exit-4 counts (R-144) show whether benign drift ever stopped a close | eng outside voice TE-12 | builder, after three closes | technical design "Gates" G17; `scorecard grants check` |
