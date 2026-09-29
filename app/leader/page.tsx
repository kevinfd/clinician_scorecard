import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Shell, SignInFirst, NotAuthorized } from "@/components/Shell";
import { Avatar } from "@/components/ui";
import { reportsOf, viewer } from "@/lib/session";

export default async function Leader() {
  const v = await viewer();
  if (!v) return <Shell viewer={null}><SignInFirst /></Shell>;
  if (!v.roles.includes("leader")) return <Shell viewer={v}><NotAuthorized /></Shell>;
  const reports = reportsOf(v);
  return (
    <Shell viewer={v} section="leader" crumbs={[{ label: "Direct reports" }]}>
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Direct reports</h1>
          <p className="mt-1 max-w-3xl text-[13.5px] text-slate-500">
            As direct leader of record you can read each surgeon&apos;s patient feedback, 30 days after each survey month reaches them. You never see their scorecard numbers or their private notes.
          </p>
        </div>
        {reports.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white px-5 py-6 text-[14px] text-slate-600">You are not the direct leader of record for any surgeon as of today.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" data-tour="leader-table">
            {reports.map((s) => (
              <Link key={s.id} href={`/leader/${s.ref}/inbox`} className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-slate-300 hover:shadow-sm">
                <Avatar name={s.name} className="size-10 text-[13px]" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-semibold text-slate-900">{s.name}</div>
                  <div className="truncate text-[12.5px] text-slate-500">{s.subspecialty} · {s.site}</div>
                </div>
                <span className="inline-flex items-center gap-1 text-[12.5px] font-medium text-teal-700">Patient feedback<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" /></span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
