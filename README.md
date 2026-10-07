# Clinician Scorecard

A per-clinician metrics viewer for a neurosurgery department (surgeons and advanced practice providers): volume and mix, efficiency, access, quality and outcomes, patient experience, and citizenship. Every number links to its definition and to the records behind it; every record is credited to exactly one clinician; numbers built on too few cases say why instead of showing a blank; peer comparisons are anonymous; every metric shows a trend.

This repository holds the product definition (`docs/`) and a working Next.js implementation that deploys to Vercel from this repo. The deployed app runs on a synthetic department only.

## The app

A Next.js 16 app at the repository root implements the scorecard on a deterministic synthetic department: 14 neurosurgeons and 6 advanced practice providers (NPs and PA-Cs) at two sites, about two years of OR cases, admissions, clinic visits, survey responses with comments, wRVUs, block days and M&M attendance. Every name, case and comment is invented.

What works:

- **All 25 metrics from the brief**, with their cadences (monthly, quarterly, rolling 12 months, fiscal year), minimum n, peer groups, and the brief's wording on every definition page.
- **Suppression that says why** (min-n, peer group under five, not applicable, source pending, hidden survey month), never a blank.
- **Anonymous peer spread** as a strip plot of sorted values with "You" marked, and a text table under every chart.
- **Record lists** behind every number, with CSV export.
- **Advanced practice providers** get their own scorecard with only the measures that apply to them (clinic volume, notes, access, patient experience, citizenship), compared only with other APPs.
- **Department view** for the chair and division chief: pooled KPIs with trends, site operations (OR turnover, PACU boarding, room-ready delays), the anonymous spread of practice, outcomes against expected, and patient experience by clinician group. No clinician is named or ranked.
- **Disputes are hidden for the demo.** The full dispute workflow (filing, routing to the chief or chair, decisions, adjudicated values) is still in the code behind a flag: set `ENABLE_DISPUTES=true` to turn it back on.
- **Patient feedback inbox** with private notes, visible to the surgeon and their direct leader only, with the leader seeing each month 30 days later.
- **Views by role**: surgeon, advanced practice provider, division chief (department view and direct reports), department chair (department view), department analyst (period close: reconciliation and suppression counts).
- **The M1 plain-text email** preview for each clinician and month.
- **Guided tours** (a surgeon's month, a clinic provider's month, what patients said, the department at a glance, close the month), launched from the home page. Each tour spotlights one part of the page at a time and switches identity when the journey changes hands.
- The visual system in `DESIGN.md` (revision 2, NeuroScore family): Geist, slate canvas, white cards, teal for you and for action, violet for external references, no verdict colors.

Sign-in is a demo identity picker (home page or the switcher at top right) limited to a six-person cast: two surgeons, the division chief, a nurse practitioner, the department chair and the analyst. The rest of the department exists only as anonymous peers; in the department it is single sign-on. Code lives in `app/` (pages and server actions), `src/lib/` (synthetic data, metric definitions, engine, disputes, storage) and `src/components/`.

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # engine rules: suppression, peer spread, routing, overrides, display contracts
npm run build
```

## Deploying to Vercel

1. In Vercel, choose **Add New > Project** and import `kevinfd/clinician_scorecard`. Vercel detects Next.js; keep the defaults (root directory `.`, build `next build`).
2. Deploy. Every push to the connected branch redeploys, and pull requests get preview URLs.
3. Optional: add the **Upstash Redis** integration from the Vercel Marketplace. It sets `KV_REST_API_URL` and `KV_REST_API_TOKEN`, and private notes become shared across everyone using the deployment. Without it they live in each browser's cookies.
4. Optional: set `ENABLE_DISPUTES=true` to show the dispute workflow (off by default).
5. Optional: set `DEMO_PASSCODE` in the project's environment variables to require a passcode before anyone can pick an identity.

Do not load real surgeon or patient data into this deployment. The technical design keeps real data on an MGB-managed server behind MGB single sign-on; this app is the product and design reference for that build.

## Documents

| Order | Document | What it is |
|---|---|---|
| 0 | [docs/source/metric-definitions-v0.2.md](docs/source/metric-definitions-v0.2.md) | The source brief: metric definitions v0.2 (owner: Omar Arnaout), preserved verbatim. |
| 1 | [docs/designs/clinician-scorecard.md](docs/designs/clinician-scorecard.md) | gstack `/office-hours` design doc: problem framing, demand evidence, premises, alternatives, the recommended wedge, the Assignment. DRAFT. |
| 2 | [docs/01-user-journeys.md](docs/01-user-journeys.md) | Four user journeys (month posted, record dispute, patient experience, period close) with a metric coverage matrix and delivery sequencing. |
| 3 | [docs/02-features.md](docs/02-features.md) | Feature catalogue derived from the journeys: stable IDs (F-xx), acceptance criteria, milestones, traceability to journey steps and metrics. |
| 4 | [docs/03-technical-design.md](docs/03-technical-design.md) | Technical design: architecture, data model, definitions as code, suppression and peer groups, dispute workflow, security, operations. |
| 5 | [docs/PRD.md](docs/PRD.md) | The PRD a team builds from. Consolidates 1 to 4 and carries the gstack review record (appendix D). |
| 6 | [PRODUCT.md](PRODUCT.md) | `/impeccable init`: the durable product record (users, purpose, ground rules, terminology, voice, accessibility, open decisions). Inferred facts are marked for confirmation. |
| 7 | [DESIGN.md](DESIGN.md) | The design system, revision 2: NeuroScore family (Geist, slate and teal, cards), the logo, components, charts, the guided tours, and the product rules the redesign kept. |
| 8 | [docs/design/briefs/](docs/design/briefs/) | `/impeccable shape`: one surface brief each for the M1 plain-text email and the M2 web app. |
| 9 | [docs/reviews/plan-ceo-review.md](docs/reviews/plan-ceo-review.md) | `/plan-ceo-review` (headless, SCOPE EXPANSION) with its outside-voice dispositions (T-01 to T-10). |
| 10 | [docs/reviews/plan-design-review.md](docs/reviews/plan-design-review.md) | `/plan-design-review` (headless, text-only; 2/10 to 7/10) with its outside-voice dispositions (TD-01 to TD-13). |
| 11 | [docs/reviews/impeccable-design.md](docs/reviews/impeccable-design.md) | `/impeccable` critique, clarify, onboard and harden applied to the PRD's experience section (27/40 to 32/40), with the review log of every amendment. |
| 12 | [docs/reviews/plan-eng-review.md](docs/reviews/plan-eng-review.md) | `/plan-eng-review` (headless, FULL_REVIEW): architecture, code quality, test review, performance, failure modes, tasks, and the outside-voice dispositions (TE-01 to TE-12). The shipping gate; it reads issues_open. |
| 13 | [docs/reviews/plan-eng-review-test-plan.md](docs/reviews/plan-eng-review-test-plan.md) | The test plan for `/qa`: every test the M1 and M2 builds must carry, by feature area. |
| 14 | [TODOS.md](TODOS.md) | Deferred scope from every review, 24 rows, each with an owner or gate. |

## How these documents were produced

The brief was turned into journeys, features, a technical design and a PRD with the [gstack](https://github.com/garrytan/gstack) sprint: Think (`/office-hours`), then Plan (`/plan-ceo-review`, `/plan-design-review`, `/plan-eng-review`), then Build, Review, Test, Ship. Each step ran headless: every decision point took the option the skill marks as recommended, every outside voice was a fresh-context Claude subagent (native-only coverage, never an outside model), and every choice is recorded in the document it affected so a human can reverse it. Nothing in `docs/` is approved until its owner says so.

## Continuing with gstack

Install gstack (see `CLAUDE.md`), then from this repo:

1. `/office-hours` to revisit the design doc with a human answering the forcing questions. Its "Open Questions" and "The Assignment" are the agenda.
2. `/plan-ceo-review docs/PRD.md` to confirm or change scope posture.
3. `/plan-design-review docs/PRD.md` once a first screen sketch exists.
4. `/plan-eng-review docs/PRD.md` to re-run the shipping gate after the human decisions below are made.
5. `/spec` per feature ID (F-xx) to file executable issues.
6. Build, then `/review`, `/qa`, `/ship`.

Frontend design goes through `/impeccable` (shape, build, critique, harden, onboard, clarify, audit, polish), reading `PRODUCT.md`, `DESIGN.md` and the surface brief for the page being built.

## Status

PRD version 0.9, status DRAFT, pending human approval. Reviewed by `/plan-ceo-review`, `/plan-design-review`, `/impeccable` and `/plan-eng-review`, all headless; no review grants approval and the eng review, the shipping gate, reads issues_open. The Vercel app implements the surfaces on synthetic data; the M1 build against real feeds has not started. Before it starts a human must decide, in one sitting (the full list is "Approval readiness" in `docs/reviews/plan-eng-review.md`):

- The eng review's architecture decisions D1 to D8 and the outside voice's accepted rows R-138 to R-144: keep or reverse each; D1 (engine lock), D6 (recipient second source), R-138 (a missing report row stops the run) and R-140 (a published spread is withheld when its peer set changes) are the ones a surgeon could notice.
- The Taste items carried from every review: R-61's visible target date; TD-03, TD-04, TD-06, TD-09, TD-13; the face and accent (OQ-63) and the night scheme in `DESIGN.md`; T-01, T-03, T-06, T-10 from the CEO review; TE-03 and the M1 operating surface (TE-D1, TE-D2) from the eng review.
- The framework (D-05) and SSO pattern (D-06) picks, recorded in the runbook and confirmed with MGB IAM (TA-07); neither blocks M1 code.
- The M0 institutional answers the plan cannot supply: the interim store (TA-02, OQ-61), the relay and directory requests (TA-03, TA-04), the extract's shape (TA-05, TA-06), the MRN pattern and incident procedure (OQ-58).
- The owner items: decision-by-reply authenticity and the subject token (L-18, information security) and the whole-month-leave email (L-19, definitions owner), answered or explicitly left open.
- The PRD amendments R-130 to R-144 and the changed rows (R-13, R-29, R-41, R-84, R-85, R-89, R-94, R-99, R-102, R-135), read and accepted as obligations, not approvals.
