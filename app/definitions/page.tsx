import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Shell } from "@/components/Shell";
import { Chip, SectionHeader } from "@/components/ui";
import { viewer } from "@/lib/session";
import { BUCKETS, METRICS, DIVISION_ONLY } from "@/lib/metrics";

export default async function Definitions() {
  const v = await viewer();
  return (
    <Shell viewer={v} section="definitions" crumbs={[{ label: "Definitions" }]}>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Metric definitions</h1>
          <p className="mt-1 max-w-3xl text-[13.5px] text-slate-500">Version 0.2 of the department&apos;s definitions, kept as versioned code. Where an assumption is still to be confirmed, the definition names it with the value in force.</p>
        </div>
        {[1, 2, 3, 4, 5, 6].map((b) => (
          <section key={b} aria-labelledby={`d${b}`}>
            <SectionHeader id={`d${b}`} title={BUCKETS[b].name} sub={BUCKETS[b].intro} />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {METRICS.filter((m) => m.bucket === b).map((m) => (
                <Link key={m.key} href={`/definitions/${m.key}`} className="group flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-slate-300 hover:shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[14px] font-semibold text-slate-900">{m.name}</span>
                    <ArrowUpRight className="size-4 shrink-0 text-slate-300 group-hover:text-teal-600" />
                  </div>
                  <p className="text-[13px] leading-relaxed text-slate-600">{m.what}</p>
                  <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
                    <Chip>{m.counted.split(";")[0].replace(/\.$/, "")}</Chip>
                    {m.minN !== undefined ? <Chip>min n {m.minN}</Chip> : null}
                    {m.availability === "pending_source" ? <Chip tone="amber" dot>Source pending</Chip> : null}
                    {m.params?.some((p) => p.status === "assumed") ? <Chip tone="amber" dot>Assumption to confirm</Chip> : null}
                  </div>
                </Link>
              ))}
            </div>
            {b === 2 ? <p className="mt-3 text-[12.5px] text-slate-500">Division and site views only: {DIVISION_ONLY.join(", ")}.</p> : null}
          </section>
        ))}
      </div>
    </Shell>
  );
}
