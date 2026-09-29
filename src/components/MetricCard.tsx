import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight, Info } from "lucide-react";
import { Sparkline } from "./ui";
import { cn } from "@/lib/cn";

export function MetricCard({
  href, name, value, sub, reason, muted, spark, footer, reference, extra, period,
}: {
  href: string;
  name: string;
  value?: string;
  sub?: ReactNode;
  reason?: string;
  muted?: boolean;
  spark?: (number | null)[];
  footer?: string[];
  reference?: string;
  extra?: ReactNode;
  period?: string;
}) {
  return (
    <Link href={href} className="group flex flex-col gap-2.5 rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-slate-300 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-teal-500">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 text-[12.5px] font-medium leading-snug text-slate-600">{name}</div>
        <ArrowUpRight className="size-4 shrink-0 text-slate-300 transition-colors group-hover:text-teal-600" strokeWidth={2} aria-hidden />
      </div>
      {reason ? (
        <div className={cn("flex items-start gap-2 text-[13.5px] font-medium leading-snug", muted ? "text-slate-500" : "text-slate-800")}>
          <Info className={cn("mt-0.5 size-4 shrink-0", muted ? "text-slate-400" : "text-teal-600")} strokeWidth={2} aria-hidden />
          <span>{reason}</span>
        </div>
      ) : (
        <div className="flex items-end justify-between gap-3">
          <div className="tabular text-[26px] font-semibold leading-none tracking-tight text-slate-900">{value}</div>
          {spark ? <Sparkline values={spark} /> : null}
        </div>
      )}
      {sub ? <div className="text-[12.5px] leading-snug text-slate-500 tabular">{sub}</div> : null}
      {extra}
      {reference ? (
        <div className="flex items-center gap-1.5 text-[11.5px] text-violet-700 tabular">
          <span aria-hidden className="size-1.5 rounded-full bg-violet-500" />{reference}
        </div>
      ) : null}
      {(footer?.length || period) ? (
        <div className="mt-auto border-t border-slate-100 pt-2.5 text-[11.5px] leading-relaxed text-slate-400">
          {[period, ...(footer ?? [])].filter(Boolean).join(" · ")}
        </div>
      ) : null}
    </Link>
  );
}
