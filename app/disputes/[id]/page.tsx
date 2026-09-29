import Link from "next/link";
import { Shell, SignInFirst, NotAuthorized } from "@/components/Shell";
import { DecideForm } from "@/components/DecideForm";
import { viewer } from "@/lib/session";
import { live } from "@/lib/store";
import { findRecord } from "@/lib/records";
import {
  acknowledgement, adjudicatorFor, dueDate, FIELD_LABELS, recordParticipants, stateLine, stateTone,
} from "@/lib/disputes";
import { daysBetween, longDate } from "@/lib/periods";
import { person } from "@/lib/synth";
import { withdrawDispute } from "../../actions";

export default async function DisputeDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ filed?: string }> }) {
  const v = await viewer();
  if (!v) return <Shell viewer={null}><SignInFirst /></Shell>;
  const { id } = await params;
  const { filed } = await searchParams;
  const { disputes, ov } = await live();
  const d = disputes.find((x) => x.id === id);
  const adjudicator = d ? adjudicatorFor(d) : null;
  const isFiler = !!d && d.filedById === v.id;
  const isReceiver = !!d && d.proposedClinicianId === v.id;
  const isAdj = !!d && adjudicator?.id === v.id;
  if (!d || !(isFiler || isReceiver || isAdj)) return <Shell viewer={v}><NotAuthorized /></Shell>;
  const rec = findRecord(d.recordRef, new Map());
  const recNow = findRecord(d.recordRef, ov);
  const filer = person(d.filedById)!;
  const prior = disputes.filter((x) => x.recordRef === d.recordRef && x.id !== d.id);

  return (
    <Shell viewer={v} section={isAdj ? "queue" : "disputes"} crumbs={[isAdj ? { href: "/queue", label: "Dispute queue" } : { href: "/disputes", label: "My disputes" }, { label: d.recordRef }]}>
      {isFiler && filed && d.state === "open" && <p className="value settle" role="status">{acknowledgement(d)}</p>}
      <h1>Dispute on {d.recordRef}</h1>
      <p><span className={`state ${stateTone(d)}`}>{stateLine(d)}</span></p>
      {d.state === "open" && (
        <p>
          {d.route === "chair" ? "The chair" : "The division chief"} decides; decision due {longDate(dueDate(d))}
          {daysBetween(dueDate(d), new Date().toISOString()) > 0 ? " (past the 14-day target)" : ""}. {d.routingReason}
        </p>
      )}
      {isReceiver && !isFiler && (
        <p className="notice">
          A colleague disputed this record and asks that it be credited to you. {d.state === "open" ? "If the dispute is sustained, the record counts toward your numbers." : ""} You may dispute it in turn from your record list.
        </p>
      )}

      <h2>The claim</h2>
      <dl className="facts">
        <dt>Filed by</dt><dd>{isAdj || isFiler ? filer.name : "a colleague"}</dd>
        <dt>Filed</dt><dd>{longDate(d.filedOn)}</dd>
        <dt>What is wrong</dt><dd>{FIELD_LABELS[d.field]}</dd>
        {d.proposedClinicianId && <><dt>Credit to</dt><dd>{person(d.proposedClinicianId)?.name}</dd></>}
        <dt>What happened</dt><dd style={{ whiteSpace: "pre-wrap", maxWidth: "72ch" }}>{isAdj || isFiler ? d.claim : "Visible to the surgeon who filed and the decider."}</dd>
      </dl>

      {isAdj && rec && (
        <section className="section" aria-labelledby="prov">
          <h2 id="prov">Provenance</h2>
          <div className="notice">
            <dl className="facts">
              {rec.facts.map(([k, val]) => <div key={k} style={{ display: "contents" }}><dt>{k}</dt><dd>{val}</dd></div>)}
              <dt>Source</dt><dd>{rec.source}</dd>
              <dt>Attribution rule</dt><dd>{rec.attributionRule}</dd>
              <dt>Definition</dt><dd>Metric definitions v0.2, version 1</dd>
              <dt>Feeds</dt><dd>{rec.feeds.join("; ")}</dd>
              <dt>People on the record</dt><dd>{recordParticipants(d.recordRef, d.recordType).map((pid) => person(pid)?.name).join(", ")}</dd>
              <dt>Prior disputes</dt><dd>{prior.length ? prior.map((p) => `${p.id}: ${stateLine(p)}`).join(" ") : "None"}</dd>
            </dl>
            <p className="label">No metric value of any surgeon is shown here: the decision is about the record, not the score.</p>
          </div>
        </section>
      )}

      {isAdj && d.state === "open" && (
        <section className="section" aria-labelledby="decide">
          <h2 id="decide">Decision</h2>
          <DecideForm id={d.id} />
        </section>
      )}

      {!isAdj && recNow && (
        <section className="section" aria-labelledby="rec">
          <h2 id="rec">The record</h2>
          <dl className="facts">
            {recNow.facts.map(([k, val]) => <div key={k} style={{ display: "contents" }}><dt>{k}</dt><dd>{val}</dd></div>)}
          </dl>
          {d.state !== "open" && d.state !== "withdrawn" && d.state !== "not_sustained" && (
            <p>The reason you gave and the decision stay on this row. Periop is asked to correct its record; until it does, both values show.</p>
          )}
          {d.state === "not_sustained" && <p>You may file once more on this record with new evidence.</p>}
        </section>
      )}

      {isFiler && d.state === "open" && (
        <form action={withdrawDispute} style={{ marginTop: 32 }}>
          <input type="hidden" name="id" value={d.id} />
          <button className="btn" type="submit">Withdraw this dispute</button>
        </form>
      )}
      {adjudicator && d.state !== "open" && d.state !== "withdrawn" && (
        <p className="label" style={{ marginTop: 24 }}>Decided by {adjudicator.name}. <Link href={isAdj ? "/queue" : "/me"}>Back</Link></p>
      )}
    </Shell>
  );
}
