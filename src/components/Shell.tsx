import Link from "next/link";
import type { ReactNode } from "react";
import { department, type Person } from "@/lib/synth";
import { has, isAdjudicator, reportsOf, ANALYST_MAILBOX } from "@/lib/session";
import { longDate, monthName, publishedPeriods, type Period } from "@/lib/periods";
import { storageMode } from "@/lib/store";

type Section = "scorecard" | "inbox" | "disputes" | "queue" | "leader" | "analyst" | "definitions" | "whats-not";

export function Shell({
  viewer,
  period,
  section,
  periodPath,
  crumbs,
  children,
}: {
  viewer: Person | null;
  period?: Period;
  section?: Section;
  periodPath?: string;
  crumbs?: { href?: string; label: string }[];
  children: ReactNode;
}) {
  const nav: { key: Section; href: string; label: string }[] = [];
  if (viewer?.isSurgeon) {
    nav.push({ key: "scorecard", href: "/me", label: "Scorecard" });
    nav.push({ key: "inbox", href: "/me/inbox", label: "Patient feedback" });
    nav.push({ key: "disputes", href: "/disputes", label: "My disputes" });
  }
  if (isAdjudicator(viewer)) nav.push({ key: "queue", href: "/queue", label: "Dispute queue" });
  if (reportsOf(viewer).length) nav.push({ key: "leader", href: "/leader", label: "Direct reports" });
  if (has(viewer, "analyst")) nav.push({ key: "analyst", href: "/analyst", label: "Period close" });
  nav.push({ key: "definitions", href: "/definitions", label: "Definitions" });
  nav.push({ key: "whats-not", href: "/whats-not", label: "What this is not" });

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <header className="stamp">
        <div className="wrap">
          <span className="product">Clinician Scorecard</span>
          {viewer && (
            <>
              <span className="sep" aria-hidden="true">·</span>
              <span>{viewer.name}</span>
            </>
          )}
          {period && viewer?.site && (
            <>
              <span className="sep" aria-hidden="true">·</span>
              <span>{monthName(period)} at {viewer.site}</span>
            </>
          )}
          <span className="sep" aria-hidden="true">·</span>
          <span>last refreshed {longDate(department().refreshedOn)}</span>
          {period && periodPath && (
            <form action={periodPath} method="get">
              <label htmlFor="period">Period</label>
              <select id="period" name="period" defaultValue={period}>
                {publishedPeriods().slice().reverse().map((p) => (
                  <option key={p} value={p}>{monthName(p)}</option>
                ))}
              </select>
              <button className="btn small" type="submit">Go</button>
            </form>
          )}
        </div>
      </header>
      <div className="synthetic">
        <div className="wrap">
          Synthetic data. Every person, case and comment here is invented for demonstration.{" "}
          {storageMode() === "browser" ? "Disputes and notes are kept in this browser only." : "Disputes and notes are shared by everyone using this deployment."}
          {viewer && (
            <>
              {" "}
              <Link href="/">Switch identity</Link>
            </>
          )}
        </div>
      </div>
      {viewer && (
        <nav className="main" aria-label="Main">
          <ul>
            {nav.map((n) => (
              <li key={n.key}>
                <Link href={n.href} aria-current={section === n.key ? "page" : undefined}>{n.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
      <div className="wrap">
        {crumbs && crumbs.length > 0 && (
          <p className="crumb">
            {crumbs.map((c, i) => (
              <span key={i}>
                {i > 0 && " / "}
                {c.href ? <Link href={c.href}>{c.label}</Link> : c.label}
              </span>
            ))}
          </p>
        )}
        <main id="main">{children}</main>
      </div>
      <footer className="foot">
        <div className="wrap">
          <p>
            No composite score, no rank, no target except M&amp;M attendance. Every number links to its definition and the records behind it.
            Questions go to the department analyst at {ANALYST_MAILBOX}.
          </p>
        </div>
      </footer>
    </>
  );
}

export function NotAuthorized() {
  return (
    <div className="banner" role="status">
      <h1>This page is not available to you.</h1>
      <p>If you think it should be, contact {ANALYST_MAILBOX}.</p>
    </div>
  );
}

export function SignInFirst() {
  return (
    <div className="banner" role="status">
      <h1>Choose an identity to continue.</h1>
      <p>
        This demonstration has no single sign-on. <Link href="/">Choose a synthetic identity</Link> to see the scorecard as that person sees it.
      </p>
    </div>
  );
}
