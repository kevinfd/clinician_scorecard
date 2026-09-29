import { Ban, Database, EyeOff, Gauge, Layers, PenOff, Target } from "lucide-react";
import { Shell } from "@/components/Shell";
import { viewer } from "@/lib/session";
import { DISPUTE_HOW } from "@/lib/disputes";

const ITEMS = [
  { icon: Gauge, title: "Not a score or a rank", body: "There is no composite score and no ranking. Nothing here adds metrics together or orders surgeons." },
  { icon: Target, title: "Not a target, except one", body: "The only target is M&M attendance, 8 of 12 sessions per fiscal year, because the comp plan sets it. Work RVUs are compared with your own last year only." },
  { icon: EyeOff, title: "Not a way to see colleagues", body: "Peer comparisons are anonymous: the spread of your peers and where you sit in it, never who is who. A comparison needs at least five other surgeons who each have enough cases." },
  { icon: Ban, title: "Not the last word on a record", body: `Every record is credited to exactly one clinician, and you can dispute any record credited to you. ${DISPUTE_HOW}` },
  { icon: PenOff, title: "Not a place for hand-entered outcomes", body: "Complications come from the department's QI database. Nothing in this app lets anyone type an outcome in." },
  { icon: Layers, title: "Not your whole practice", body: "OR turnover time, PACU boarding and room-ready delays are not on your scorecard. A surgeon cannot move them alone, so they appear only on division and site views." },
  { icon: Database, title: "Not real data, here", body: "This deployment runs on a synthetic department. Every name, case and comment is invented. Real surgeon data belongs on the department's governed server." },
];

export default async function WhatsNot() {
  const v = await viewer();
  return (
    <Shell viewer={v} section="whats-not" wide={false} crumbs={[{ label: "What this is not" }]}>
      <div className="flex flex-col gap-6" data-tour="whats-not">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">What this is not</h1>
          <p className="mt-1 max-w-3xl text-[13.5px] text-slate-500">Each surgeon sees their own numbers and the records behind them. Some things the scorecard deliberately does not do.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {ITEMS.map(({ icon: I, title, body }) => (
            <div key={title} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><I className="size-4.5" strokeWidth={2} /></span>
              <div>
                <h2 className="text-[14px] font-semibold text-slate-900">{title}</h2>
                <p className="mt-1 text-[13px] leading-relaxed text-slate-600">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}
