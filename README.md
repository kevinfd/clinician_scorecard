# Clinician Scorecard

A per-surgeon metrics viewer for a neurosurgery department: volume and mix, efficiency, access, quality and outcomes, patient experience, and citizenship. Every number links to its definition and to the records behind it; every record is credited to exactly one clinician and can be disputed; numbers built on too few cases say why instead of showing a blank; peer comparisons are anonymous; every metric shows a trend.

This repository currently holds the product definition, not code. Read the documents in order.

## Documents

| Order | Document | What it is |
|---|---|---|
| 0 | [docs/source/metric-definitions-v0.2.md](docs/source/metric-definitions-v0.2.md) | The source brief: metric definitions v0.2 (owner: Omar Arnaout), preserved verbatim. |
| 1 | [docs/designs/clinician-scorecard.md](docs/designs/clinician-scorecard.md) | gstack `/office-hours` design doc: problem framing, demand evidence, premises, alternatives, recommended wedge, the Assignment. Status: DRAFT. |
| 2 | [docs/01-user-journeys.md](docs/01-user-journeys.md) | Four user journeys (month posted, record dispute, patient experience, period close) with a metric coverage matrix and delivery sequencing. |
| 3 | [docs/02-features.md](docs/02-features.md) | Feature catalogue derived from the journeys, with stable IDs (F-xx), acceptance criteria, milestones, and traceability to journey steps and metrics. |
| 4 | [docs/03-technical-design.md](docs/03-technical-design.md) | Technical design: architecture, data model, definitions-as-code, suppression and peer groups, dispute workflow, security, operations. |
| 5 | [docs/PRD.md](docs/PRD.md) | The source PRD for building the application. Consolidates 1 to 4 and carries the gstack review record (CEO, design, eng). |
| 6 | [docs/reviews/](docs/reviews/) | gstack plan reviews applied to the PRD: `/plan-ceo-review`, `/plan-design-review`, `/plan-eng-review`. |

## How these documents were produced

The brief was turned into journeys, features, technical design, and a PRD using the [gstack](https://github.com/garrytan/gstack) sprint: Think (`/office-hours`) → Plan (`/plan-ceo-review`, `/plan-design-review`, `/plan-eng-review`) → Build → Review → Test → Ship. Each step ran headlessly: every decision point took the option the skill marks as recommended, and every such choice is recorded in the document it affected so a human can reverse it. Nothing in `docs/` is approved until its owner says so.

## Continuing with gstack

Install gstack (see `CLAUDE.md`), then from this repo:

1. `/office-hours` to revisit the design doc with a human answering the forcing questions. The doc's "Open Questions" and "The Assignment" sections are the agenda.
2. `/plan-ceo-review docs/PRD.md` to confirm or change scope posture.
3. `/plan-design-review docs/PRD.md` once a first screen sketch exists.
4. `/plan-eng-review docs/PRD.md` to lock architecture and produce the test plan. This is the gate before code.
5. `/spec` per feature ID (F-xx) to file executable issues.
6. Build, then `/review`, `/qa`, `/ship`.

## Status

Product definition complete through the PRD. No application code yet. The first engineering milestone (M1, the wedge) is defined in the PRD.
