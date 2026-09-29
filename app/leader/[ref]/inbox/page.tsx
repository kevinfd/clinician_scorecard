import { CalendarClock, EyeOff } from "lucide-react";
import { Shell, SignInFirst, NotAuthorized } from "@/components/Shell";
import { InboxList, inboxItems } from "@/components/Inbox";
import { viewer } from "@/lib/session";
import { live } from "@/lib/store";
import { personByRef } from "@/lib/synth";

export default async function LeaderInbox({ params }: { params: Promise<{ ref: string }> }) {
  const v = await viewer();
  if (!v) return <Shell viewer={null}><SignInFirst /></Shell>;
  const s = personByRef((await params).ref);
  // Same page for "not yours" and "does not exist".
  if (!s || !s.isSurgeon || s.directLeaderId !== v.id) return <Shell viewer={v}><NotAuthorized /></Shell>;
  const { ov } = await live();
  const items = inboxItems(s, ov, true);
  return (
    <Shell viewer={v} section="leader" wide={false} crumbs={[{ href: "/leader", label: "Direct reports" }, { label: s.name }]}>
      <div className="flex flex-col gap-5">
        <div data-tour="leader-inbox" className="flex flex-col gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Direct leader view</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{s.name}: patient feedback</h1>
          </div>
          <div className="flex flex-wrap gap-2 text-[12.5px]">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-600"><CalendarClock className="size-4 text-slate-400" />Each month appears 30 days after {s.name} sees it</span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-600"><EyeOff className="size-4 text-slate-400" />Private notes are never shown</span>
          </div>
        </div>
        <InboxList items={items} notes={[]} editable={false} />
      </div>
    </Shell>
  );
}
