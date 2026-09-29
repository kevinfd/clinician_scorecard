import { Shell } from "@/components/Shell";
import { viewer } from "@/lib/session";
import { DISPUTE_HOW } from "@/lib/disputes";

export default async function WhatsNot() {
  const v = await viewer();
  return (
    <Shell viewer={v} section="whats-not">
      <article className="read">
        <h1>What this is not</h1>
        <p>This page shows each surgeon their own numbers and the records behind them. Some things it deliberately does not do.</p>
        <h2>Not a score or a rank</h2>
        <p>There is no composite score and no ranking. Nothing here adds metrics together or orders surgeons.</p>
        <h2>Not a target, except one</h2>
        <p>The only target is M&amp;M attendance, 8 of 12 sessions per fiscal year, because the comp plan sets it. Work RVUs are compared with your own last year only, with no peer comparison and no target.</p>
        <h2>Not a way to see colleagues</h2>
        <p>Peer comparisons are anonymous: you see the spread of your peers and where you sit in it, never who is who. A comparison needs at least five other surgeons who each have enough cases; below that the screen says so instead.</p>
        <h2>Not the last word on a record</h2>
        <p>Every case, visit, admission, survey and attendance record is credited to exactly one clinician, and you can dispute any record credited to you. {DISPUTE_HOW}</p>
        <h2>Not a place for hand-entered outcomes</h2>
        <p>Complications come from the department&apos;s QI database. Nothing in this app lets anyone type an outcome in.</p>
        <h2>Not your whole practice</h2>
        <p>OR turnover time, PACU boarding and room-ready delays are not on your scorecard. A surgeon cannot move them alone, so they appear only on division and site views.</p>
        <h2>Not real data, in this deployment</h2>
        <p>This deployment runs on a synthetic department. Every name, case and comment is invented. Real surgeon data belongs on the department&apos;s governed server, not on this host.</p>
      </article>
    </Shell>
  );
}
