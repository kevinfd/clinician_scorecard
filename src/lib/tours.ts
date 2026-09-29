// Guided walkthroughs, one per user journey (docs/01-user-journeys.md J1 to J4).
// Each step spotlights a `data-tour` element on a route, as a given synthetic person.
// A step whose person differs from the current viewer is reached through /tour/go,
// which switches identity and redirects; other steps navigate client-side.

import { department } from "./synth";
import { seededDisputes } from "./disputes";
import { LATEST_PUBLISHED } from "./periods";

export type TourId = "month" | "dispute" | "feedback" | "close";

export interface TourStep {
  target: string | null;
  route: string;
  as: string;
  title: string;
  body: string;
  cta?: string;
}

export interface TourDef {
  id: TourId;
  journey: string;
  label: string;
  persona: string;
  blurb: string;
  highlights: string[];
  accent: "teal" | "violet" | "amber" | "slate";
  enterAs: string;
  steps: TourStep[];
}

export function isTourId(s: string | null | undefined): s is TourId {
  return s === "month" || s === "dispute" || s === "feedback" || s === "close";
}

export function buildTours(): Record<TourId, TourDef> {
  const d = department();
  const seeded = seededDisputes();
  const d11 = seeded.find((x) => x.id === "D-0011");
  const d10 = seeded.find((x) => x.id === "D-0010");
  const d10case = d10 ? d.cases.find((c) => c.ref === d10.recordRef) : undefined;
  const mizrahi = d.people.find((p) => p.id === "S05")!;
  const P = LATEST_PUBLISHED;

  const month: TourDef = {
    id: "month",
    journey: "J1",
    label: "Month posted",
    persona: "Dr. Tomas Lindqvist, spine surgeon",
    blurb: "The monthly numbers land. A surgeon checks their own scorecard, the records behind each number, and where they sit among anonymous peers.",
    highlights: ["All six areas on one page", "Every number has its records", "Anonymous peer spread and trend", "The plain-text monthly email"],
    accent: "teal",
    enterAs: "S02",
    steps: [
      { target: null, route: "/me", as: "S02", title: "The month is posted", body: "You are Dr. Tomas Lindqvist, a spine surgeon at Main campus. The August numbers were published on 10 September. This tour follows what he does in the ten minutes after the email arrives." },
      { target: "me-header", route: "/me", as: "S02", title: "Whose numbers, for when", body: "Every page opens with the same stamp: the surgeon, the site, the period and when the data was last refreshed. Pick any published month from the period control." },
      { target: "what-changed", route: "/me", as: "S02", title: "What changed since last month", body: "The first thing to read: the headline numbers against July, and where each of your disputes stands. An open dispute on an August case is already here." },
      { target: "section-volume", route: "/me", as: "S02", title: "Volume and mix", body: "Each card is one metric from the department's definitions: the value with its count, a trend line, how many records sit behind it, and who it is compared with. There is no composite score and no rank." },
      { target: "section-access", route: "/me", as: "S02", title: "A reason, never a blank", body: "When a number cannot be shown, the card says why. Referral-to-visit days has no confirmed data source yet, so it says exactly that instead of showing an empty box or a zero." },
      { target: "metric-value", route: "/me/metric/fcot", as: "S02", title: "One metric, opened up", body: "First-case on-time start with its count, and a line that splits the late cases into your delays and delays that were not yours. Both still count under the definition; the split tells you what to dispute.", cta: "Open any card to reach this page" },
      { target: "metric-spread", route: "/me/metric/fcot", as: "S02", title: "Where you sit, anonymously", body: "Your value against the sorted values of the other neurosurgeons at your site. No one is named. A comparison appears only when at least five others each have enough cases." },
      { target: "metric-trend", route: "/me/metric/fcot", as: "S02", title: "A trend, not a snapshot", body: "Every metric carries its history, with a table under the chart. A point restated after a sustained dispute is marked." },
      { target: "metric-definition", route: "/me/metric/fcot", as: "S02", title: "The definition and its source", body: "The definition version, the assumption still to be confirmed (no grace window), and the feed the number came from. The definition link opens the department's wording verbatim." },
      { target: "records-table", route: `/me/metric/fcot/records?period=${P}`, as: "S02", title: "The records behind the number", body: "Every first case credited to him in August: scheduled start, wheels in, the delay reason as logged. This is the list a surgeon checks before trusting the number.", cta: "Dispute this record, on any row" },
      { target: "email", route: `/me/email?period=${P}`, as: "S02", title: "The email that started it", body: "In the first three months the scorecard arrives as this plain-text email with a spreadsheet of the surgeon's own rows. The pages show the same numbers." },
      { target: null, route: "/me", as: "S02", title: "That's the month", body: "Stamp, what changed, six areas, one metric opened, its records. Take the dispute tour next to see what happens when a row is wrong." },
    ],
  };

  const dispute: TourDef = {
    id: "dispute",
    journey: "J2",
    label: "Dispute a record",
    persona: "Dr. Lindqvist, then the division chief",
    blurb: "A late start was coded as the surgeon's delay. He disputes the record, the division chief rules on it, and the outcome shows up on the row.",
    highlights: ["Dispute pinned to one record", "Chief decides, or the chair", "Provenance, not scores", "Logged and adjudicated side by side"],
    accent: "violet",
    enterAs: "S02",
    steps: [
      { target: null, route: `/me/metric/fcot/records?period=${P}`, as: "S02", title: "A record looks wrong", body: "Dr. Lindqvist's August on-time rate dropped. On one of his late first cases the delay is coded as his, but anesthesia was still with the previous patient. Every surgeon can dispute any record credited to them." },
      { target: "records-table", route: `/me/metric/fcot/records?period=${P}`, as: "S02", title: "The disputed row", body: "The row already carries an open dispute: the state is written on the row itself, with the date it was filed. Other rows keep their Dispute button." },
      ...(d11
        ? [
            { target: "dispute-form", route: `/records/${d11.recordRef}/dispute?metric=fcot&period=${P}`, as: "S02", title: "Filing is one page", body: "The record's facts at the top, what is wrong as plain choices, a short claim, and a notice of what a sustained dispute will and will not change. Patient identifiers are refused.", cta: "What is wrong · What happened · File dispute" },
            { target: "dispute-status", route: `/disputes/${d11.id}`, as: "S02", title: "Where it stands", body: "The surgeon sees who decides, the 14-day target date and why it went to that person. The division chief decides; the chair decides when the chief is involved in the record." },
            { target: "queue-table", route: "/queue", as: "S01", title: "The chief's queue", body: "You are now Dr. Imani Okafor, the division chief. Disputes routed to her, oldest first, with their age against the 14-day target. No surgeon's number appears anywhere in the queue." },
            { target: "provenance", route: `/disputes/${d11.id}`, as: "S01", title: "Decide on the record, not the score", body: "The provenance panel shows the source extract, the attribution rule, the definition version and everyone on the record. The chief rules on what happened, not on anyone's performance." },
            { target: "decide-form", route: `/disputes/${d11.id}`, as: "S01", title: "Three possible decisions", body: "Sustained (annotated, or with a request to correct the source), not sustained, or a definition question. A note to the surgeon is required.", cta: "Record decision" },
          ]
        : []),
      ...(d10 && d10case
        ? [
            { target: "dispute-status", route: `/disputes/${d10.id}`, as: "S10", title: "An outcome", body: "You are now Dr. Rafael Duarte at Harbor campus. His dispute about a same-day cancellation was sustained: the clearance was ordered on time, so the cancellation is no longer counted against him." },
            { target: "records-table", route: `/me/metric/same_day_cancel/records?period=${d10case.period}`, as: "S10", title: "The row keeps its history", body: "The cancellation stays in the list, now marked not counted, with the decision and the chief's note beside it. The OR log is never edited: the adjudicated value sits next to the logged one until periop corrects its record." },
          ]
        : []),
      { target: null, route: "/disputes", as: "S02", title: "That's the dispute path", body: "Row, claim, chief or chair, provenance, decision, recomputed number. Trust in a number comes from being able to contest it." },
    ],
  };

  const feedback: TourDef = {
    id: "feedback",
    journey: "J3",
    label: "What patients said",
    persona: "Dr. Hana Mizrahi, then her direct leader",
    blurb: "Survey scores as they appear at faculty meeting, plus the anonymous peer bars, the comment inbox with private notes, and what the direct leader can see.",
    highlights: ["Faculty-meeting layout, any time", "Months under 10 responses hidden", "Private notes on comments", "Leader sees each month 30 days later"],
    accent: "amber",
    enterAs: "S05",
    steps: [
      { target: null, route: "/me/metric/explained", as: "S05", title: "What patients said", body: `You are ${mizrahi.name}, a cranial and tumor surgeon. Patient experience used to arrive twice a year at faculty meeting. Here it is any time.` },
      { target: "survey-table", route: "/me/metric/explained", as: "S05", title: "The layout you already know", body: "Year average, each of the past three months, and the MGB average, exactly as shown at faculty meeting. A month with fewer than 10 responses is hidden for that month only, with the count shown." },
      { target: "survey-bars", route: "/me/metric/explained", as: "S05", title: "Everyone in your peer group", body: "The one new thing: an anonymous bar for every neurosurgeon in the system, with your own bar marked. No other bar is labelled." },
      { target: "inbox-intro", route: "/me/inbox", as: "S05", title: "The feedback inbox", body: "Every de-identified comment, newest first, with the scores from the same survey. Comments are never counted, compared or rolled up. The line at the top says exactly who else can read it." },
      { target: "inbox-item", route: "/me/inbox", as: "S05", title: "Read, reflect, add a note", body: "Each comment sits with its scores. A private note stays with the surgeon; it is never shown to the leader. If the patient was not hers, the attribution can be disputed, never the comment.", cta: "Add a private note" },
      { target: "leader-table", route: "/leader", as: "S01", title: "The direct leader's view", body: "You are now Dr. Okafor, who is Dr. Mizrahi's direct leader of record. She can read her reports' inboxes and nothing else of theirs: no scorecard numbers." },
      { target: "leader-inbox", route: `/leader/${mizrahi.ref}/inbox`, as: "S01", title: "Thirty days later, without notes", body: "The leader sees each survey month 30 days after the surgeon does, so the surgeon reads it first. Private notes are never shown." },
      { target: null, route: "/me/inbox", as: "S05", title: "That's patient experience", body: "Scores in a familiar layout, anonymous peers, comments in one place, and a clear line on who sees what." },
    ],
  };

  const close: TourDef = {
    id: "close",
    journey: "J4",
    label: "Close the month",
    persona: "Jordan Pike, department analyst",
    blurb: "The analyst's monthly close: reconcile to periop's report, check that every cell has a value or a reason, watch dispute aging, and keep definitions versioned.",
    highlights: ["Reconciliation gate", "No blank cells, ever", "Dispute aging against 14 days", "Versioned definitions and assumptions"],
    accent: "slate",
    enterAs: "P02",
    steps: [
      { target: null, route: "/analyst", as: "P02", title: "Closing the month", body: "You are Jordan Pike, the department analyst who runs the monthly close. Nothing reaches a surgeon until these checks pass." },
      { target: "recon", route: "/analyst", as: "P02", title: "Match periop's report first", body: "Every wedge number must equal periop's own report or carry a written explanation. Differences caused by sustained disputes are counted and explained, not hidden." },
      { target: "suppression", route: "/analyst", as: "P02", title: "Every cell: a value or a reason", body: "Counts only, never a surgeon's value: how many cells show a number, how many fall below minimum n, how many are not applicable or waiting on a data source, and how often the peer spread could be shown." },
      { target: "open-disputes", route: "/analyst", as: "P02", title: "Dispute aging", body: "Open disputes with who holds them and how old they are against the 14-day target." },
      { target: "definition-params", route: "/definitions/fcot", as: "P02", title: "Definitions are versioned", body: "Each metric's definition is kept as a version with its assumptions named. The grace window is still an assumption to be confirmed; when it is, a new version is issued and the old numbers keep theirs." },
      { target: "whats-not", route: "/whats-not", as: "P02", title: "What this is not", body: "No composite score, no rank, no target except M&M attendance, no hand-entered outcomes. This page is shown at faculty meeting before anyone sees a peer comparison." },
      { target: null, route: "/analyst", as: "P02", title: "That's the close", body: "Reconcile, check every cell, watch disputes, keep definitions versioned. The system survives its champion only if this runs every month without the builder." },
    ],
  };

  return { month, dispute, feedback, close };
}

export function tourStepUrl(route: string, tour: TourId, step: number): string {
  const sep = route.includes("?") ? "&" : "?";
  return `${route}${sep}tour=${tour}&step=${step}`;
}
