import Link from "next/link";
import type { ReactNode } from "react";
import { PlayCircle } from "lucide-react";
import { department, type Person } from "@/lib/synth";
import { has, isAdjudicator, reportsOf, roleWords, ANALYST_MAILBOX } from "@/lib/session";
import { monthName, LATEST_PUBLISHED, longDate, type Period } from "@/lib/periods";
import { storageMode } from "@/lib/store";
import { Logo } from "./Logo";
import { IdentitySwitcher, type PersonOption } from "./IdentitySwitcher";
import { PeriodPicker } from "./PeriodPicker";
import { cn } from "@/lib/cn";
import { DISPUTES_ENABLED } from "@/lib/features";

type Section = "department" | "scorecard" | "inbox" | "disputes" | "queue" | "leader" | "analyst" | "definitions" | "whats-not" | "home";

const GROUP_ORDER = ["Clinicians", "Leadership", "Operations"];

/** The demo cast shown in the identity switcher. Every other clinician exists only as an anonymous peer. */
export function personOptions(): PersonOption[] {
  return department().people.filter((p) => p.featured).map((p) => ({
    id: p.id,
    name: p.name,
    sub: roleWords(p),
    group: p.roles.includes("chief") || p.roles.includes("chair") ? "Leadership" : p.isClinician ? "Clinicians" : "Operations",
  })).sort((a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group));
}

export function Shell({
  viewer, period, section, periodPath, crumbs, children, wide,
}: {
  viewer: Person | null;
  period?: Period;
  section?: Section;
  periodPath?: string;
  crumbs?: { href?: string; label: string }[];
  children: ReactNode;
  wide?: boolean;
}) {
  const nav: { key: Section; href: string; label: string }[] = [];
  if (has(viewer, "chair") || has(viewer, "chief")) nav.push({ key: "department", href: "/department", label: "Department" });
  if (viewer?.isClinician) {
    nav.push({ key: "scorecard", href: "/me", label: has(viewer, "chief") ? "My scorecard" : "Scorecard" });
    nav.push({ key: "inbox", href: "/me/inbox", label: "Patient feedback" });
    if (DISPUTES_ENABLED) nav.push({ key: "disputes", href: "/disputes", label: "My disputes" });
  }
  if (DISPUTES_ENABLED && isAdjudicator(viewer)) nav.push({ key: "queue", href: "/queue", label: "Dispute queue" });
  if (reportsOf(viewer).length) nav.push({ key: "leader", href: "/leader", label: "Direct reports" });
  if (has(viewer, "analyst")) nav.push({ key: "analyst", href: "/analyst", label: "Period close" });
  nav.push({ key: "definitions", href: "/definitions", label: "Definitions" });

  const options = personOptions();
  const current = viewer ? options.find((o) => o.id === viewer.id) ?? null : null;

  return (
    <div className="flex min-h-dvh flex-col">
      <span id="cs-viewer" data-id={viewer?.id ?? ""} hidden />
      <a className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2" href="#main">Skip to content</a>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md print-hide">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-2.5 sm:gap-6 sm:px-6">
          <Link href="/" className="shrink-0" aria-label="Clinician Scorecard home"><Logo /></Link>
          <nav aria-label="Main" className="ml-1 hidden items-center gap-0.5 lg:flex">
            {nav.map((n) => (
              <Link key={n.key} href={n.href} aria-current={section === n.key ? "page" : undefined}
                className={cn("whitespace-nowrap rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors", section === n.key ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900")}>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            <span className="hidden items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600 2xl:inline-flex" title={`Last refreshed ${longDate(department().refreshedOn)}`}>
              <span className="size-1.5 rounded-full bg-emerald-500" />Data: {monthName(LATEST_PUBLISHED)}
            </span>
            <span className="hidden items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800 sm:inline-flex lg:hidden xl:inline-flex" title="Every person, case and comment here is invented">
              <span className="size-1.5 rounded-full bg-amber-500" />Synthetic data
            </span>
            <Link href="/#tours" className="hidden items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium text-teal-700 hover:bg-teal-50 md:inline-flex">
              <PlayCircle className="size-4" strokeWidth={2} />Tours
            </Link>
            <span data-tour="identity"><IdentitySwitcher current={current} people={options} /></span>
          </div>
        </div>
        {nav.length > 0 && viewer ? (
          <nav aria-label="Main (compact)" className="border-t border-slate-100 lg:hidden">
            <div className="mx-auto flex max-w-[1400px] gap-1 overflow-x-auto px-4 py-1.5 sm:px-6">
              {nav.map((n) => (
                <Link key={n.key} href={n.href} aria-current={section === n.key ? "page" : undefined}
                  className={cn("whitespace-nowrap rounded-md px-3 py-2 text-[13px] font-medium", section === n.key ? "bg-slate-100 text-slate-900" : "text-slate-600")}>
                  {n.label}
                </Link>
              ))}
            </div>
          </nav>
        ) : null}
      </header>

      <main id="main" className={cn("mx-auto w-full flex-1 px-4 py-6 sm:px-6 sm:py-8", wide === false ? "max-w-5xl" : "max-w-[1400px]")}>
        {(crumbs?.length || (period && periodPath)) ? (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[12px] text-slate-500">
              {crumbs?.map((c, i) => (
                <span key={i}>
                  {i > 0 && <span className="px-1.5 text-slate-300">/</span>}
                  {c.href ? <Link className="hover:text-slate-800 hover:underline" href={c.href}>{c.label}</Link> : <span className="text-slate-700">{c.label}</span>}
                </span>
              ))}
            </p>
            {period && periodPath ? <PeriodPicker period={period} path={periodPath} /> : null}
          </div>
        ) : null}
        {children}
      </main>

      <footer className="border-t border-slate-200 bg-white print-hide">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-2 px-4 py-4 text-[12px] text-slate-400 sm:px-6">
          <span>Clinician Scorecard · synthetic demonstration · {storageMode() === "browser" ? "notes are kept in this browser" : "notes are shared on this deployment"}</span>
          <span className="flex flex-wrap gap-4">
            <Link className="hover:text-slate-600" href="/whats-not">What this is not</Link>
            <Link className="hover:text-slate-600" href="/definitions">Definitions</Link>
            <span>{ANALYST_MAILBOX}</span>
          </span>
        </div>
      </footer>
    </div>
  );
}

export function NotAuthorized() {
  return (
    <div className="mx-auto mt-10 max-w-xl rounded-xl border border-slate-200 bg-white p-6 text-center" role="status">
      <h1 className="text-lg font-semibold text-slate-900">This page is not available to you.</h1>
      <p className="mt-1 text-[13px] text-slate-500">If you think it should be, contact {ANALYST_MAILBOX}.</p>
    </div>
  );
}

export function SignInFirst() {
  return (
    <div className="mx-auto mt-10 max-w-xl rounded-xl border border-slate-200 bg-white p-6 text-center" role="status">
      <h1 className="text-lg font-semibold text-slate-900">Choose an identity to continue.</h1>
      <p className="mt-1 text-[13px] text-slate-500">
        This demonstration has no single sign-on. <Link className="font-medium text-teal-700 underline" href="/">Pick a synthetic identity or take a tour</Link>.
      </p>
    </div>
  );
}
