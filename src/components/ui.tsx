import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, children, ...rest }: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white", className)} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({ title, sub, right, id }: { title: ReactNode; sub?: ReactNode; right?: ReactNode; id?: string }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-4 sm:px-6 sm:pt-5">
      <div className="min-w-0">
        <h2 id={id} className="text-[15px] font-semibold text-slate-900">{title}</h2>
        {sub ? <p className="mt-0.5 text-[13px] text-slate-500">{sub}</p> : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("px-5 pb-5 pt-3 sm:px-6", className)}>{children}</div>;
}

export function SectionHeader({ title, sub, right, id }: { title: string; sub?: string; right?: ReactNode; id?: string }) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 id={id} className="text-[15px] font-semibold text-slate-900">{title}</h2>
        {sub ? <p className="mt-0.5 text-[13px] text-slate-500">{sub}</p> : null}
      </div>
      {right ? <div className="text-[12px] text-slate-400">{right}</div> : null}
    </div>
  );
}

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("text-[11px] font-medium uppercase tracking-wider text-slate-500", className)}>{children}</div>;
}

type Tone = "neutral" | "teal" | "violet" | "amber" | "emerald" | "slate";
const TONES: Record<Tone, string> = {
  neutral: "border-slate-200 bg-slate-50 text-slate-600",
  slate: "border-slate-200 bg-white text-slate-600",
  teal: "border-teal-200 bg-teal-50 text-teal-800",
  violet: "border-violet-200 bg-violet-50 text-violet-800",
  amber: "border-amber-200 bg-amber-50 text-amber-900",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
};
const DOTS: Record<Tone, string> = {
  neutral: "bg-slate-400", slate: "bg-slate-400", teal: "bg-teal-500", violet: "bg-violet-500", amber: "bg-amber-500", emerald: "bg-emerald-500",
};

export function Chip({ tone = "neutral", dot, children, className }: { tone?: Tone; dot?: boolean; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium", TONES[tone], className)}>
      {dot ? <span className={cn("size-1.5 shrink-0 rounded-full", DOTS[tone])} /> : null}
      {children}
    </span>
  );
}

export function StatePill({ tone, children, href }: { tone: "disputed" | "sustained" | "muted"; children: ReactNode; href?: string }) {
  const cls = cn(
    "inline-block rounded-md px-2 py-1 text-[12px] leading-snug",
    tone === "disputed" && "bg-amber-50 text-amber-900 ring-1 ring-amber-200",
    tone === "sustained" && "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200",
    tone === "muted" && "bg-slate-50 text-slate-600 ring-1 ring-slate-200",
  );
  return href ? <Link href={href} className={cn(cls, "hover:underline")}>{children}</Link> : <span className={cls}>{children}</span>;
}

const BTN = {
  primary: "bg-teal-600 text-white hover:bg-teal-700 border border-teal-600",
  violet: "bg-violet-600 text-white hover:bg-violet-700 border border-violet-600",
  secondary: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  ghost: "text-slate-600 hover:bg-slate-100",
};
export type BtnVariant = keyof typeof BTN;
export function btn(variant: BtnVariant = "secondary", size: "sm" | "md" = "md") {
  return cn(
    "inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition-colors disabled:cursor-default disabled:opacity-60",
    size === "md" ? "min-h-11 px-4 text-[13px]" : "min-h-9 px-3 text-[12px]",
    BTN[variant],
  );
}

export function LinkButton({ href, variant = "secondary", size = "md", children, className, ...rest }: { href: string; variant?: BtnVariant; size?: "sm" | "md"; children: ReactNode; className?: string } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  return <Link href={href} className={cn(btn(variant, size), className)} {...rest}>{children}</Link>;
}

export function Callout({ tone = "teal", title, children, className }: { tone?: "teal" | "violet" | "amber" | "slate"; title?: ReactNode; children: ReactNode; className?: string }) {
  const t = {
    teal: "border-teal-200 bg-teal-50/60",
    violet: "border-violet-200 bg-violet-50/60",
    amber: "border-amber-200 bg-amber-50/70",
    slate: "border-slate-200 bg-white",
  }[tone];
  return (
    <div className={cn("rounded-xl border px-5 py-4", t, className)}>
      {title ? <div className="mb-1.5 text-[13px] font-semibold text-slate-900">{title}</div> : null}
      <div className="text-[13px] leading-relaxed text-slate-700">{children}</div>
    </div>
  );
}

export function Sparkline({ values, width = 84, height = 26 }: { values: (number | null)[]; width?: number; height?: number }) {
  const pts = values.map((v, i) => ({ v, i })).filter((p): p is { v: number; i: number } => p.v !== null && Number.isFinite(p.v));
  if (pts.length < 2) return null;
  const min = Math.min(...pts.map((p) => p.v));
  const max = Math.max(...pts.map((p) => p.v));
  const range = Math.max(0.001, max - min);
  const n = Math.max(1, values.length - 1);
  const xy = pts.map((p) => [(p.i / n) * width, height - ((p.v - min) / range) * (height - 6) - 3]);
  const last = xy[xy.length - 1];
  return (
    <svg width={width} height={height} aria-hidden className="shrink-0 overflow-visible">
      <polyline points={xy.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")} fill="none" stroke="#0d9488" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r={2.2} fill="#0d9488" />
    </svg>
  );
}

export function Table({ caption, head, children, empty }: { caption?: ReactNode; head: { label: string; align?: "right" | "left" }[]; children: ReactNode; empty?: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          {caption ? <caption className="border-b border-slate-100 px-4 py-3 text-left text-[13px] font-semibold text-slate-900">{caption}</caption> : null}
          <thead className="bg-slate-50">
            <tr className="text-[11px] uppercase tracking-wider text-slate-500">
              {head.map((h, i) => (
                <th key={i} scope="col" className={cn("whitespace-nowrap px-4 py-2.5 font-medium", h.align === "right" ? "text-right" : "text-left")}>{h.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">{children}</tbody>
        </table>
      </div>
      {empty}
    </div>
  );
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name.replace(/^Dr\.\s*/, "").split(/\s+/).map((s) => s[0]).slice(0, 2).join("");
  return (
    <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-50 to-slate-100 text-[15px] font-semibold text-teal-800 ring-1 ring-slate-200", className)}>
      {initials}
    </span>
  );
}
