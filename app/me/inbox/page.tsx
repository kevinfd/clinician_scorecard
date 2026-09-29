import { EyeOff, UserRound } from "lucide-react";
import { Shell, SignInFirst, NotAuthorized } from "@/components/Shell";
import { InboxList, inboxItems, LEADER_GATE_DAYS } from "@/components/Inbox";
import { viewer } from "@/lib/session";
import { live } from "@/lib/store";
import { person } from "@/lib/synth";

export default async function MyInbox({ searchParams }: { searchParams: Promise<{ saved?: string; deleted?: string; error?: string; on?: string }> }) {
  const v = await viewer();
  if (!v) return <Shell viewer={null}><SignInFirst /></Shell>;
  if (!v.isSurgeon) return <Shell viewer={v}><NotAuthorized /></Shell>;
  const flash = await searchParams;
  const { state, ov } = await live();
  const items = inboxItems(v, ov, false);
  const leader = v.directLeaderId ? person(v.directLeaderId) : undefined;
  return (
    <Shell viewer={v} section="inbox" wide={false} crumbs={[{ label: "Patient feedback" }]}>
      <div className="flex flex-col gap-5">
        <div data-tour="inbox-intro" className="flex flex-col gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Patient experience</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Patient feedback</h1>
            <p className="mt-1 max-w-3xl text-[13.5px] text-slate-500">Every de-identified comment about you, newest first, with the scores from the same survey. Comments are never counted, compared, or rolled up into anything.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-[12.5px]">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-600">
              <UserRound className="size-4 text-slate-400" />{leader ? `${leader.name}, your direct leader, can read this inbox ${LEADER_GATE_DAYS} days after you do` : "Only you can read this inbox"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-600"><EyeOff className="size-4 text-slate-400" />Your notes are never shown to anyone</span>
          </div>
        </div>
        <InboxList items={items} notes={state.notes.filter((n) => n.authorId === v.id)} editable flash={flash} />
      </div>
    </Shell>
  );
}
