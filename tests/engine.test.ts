import { describe, expect, it } from "vitest";
import { department, person } from "@/lib/synth";
import { METRICS, metric } from "@/lib/metrics";
import { mmView, peerGroup, spreadFor, surveyView, tileFor, trendFor, windowFor, MIN_PEERS } from "@/lib/engine";
import { overridesFrom, routeFor, type Dispute } from "@/lib/disputes";
import { LATEST_PUBLISHED, publishedPeriods } from "@/lib/periods";

const none = new Map();
const S = (id: string) => person(id)!;

describe("synthetic department", () => {
  it("is deterministic", () => {
    const a = department().cases.slice(0, 5).map((c) => c.ref);
    expect(a.every((r) => /^C-[2-9A-Z]{6}$/.test(r))).toBe(true);
    expect(new Set(department().cases.map((c) => c.ref)).size).toBe(department().cases.length);
  });
  it("credits every case to exactly one primary surgeon on the roster (GR1)", () => {
    const ids = new Set(department().surgeons.map((s) => s.id));
    for (const c of department().cases) expect(ids.has(c.primaryId)).toBe(true);
  });
});

describe("no blank cells (GR3)", () => {
  it("every tile for every surgeon in every published period carries a value or a worded reason", () => {
    for (const p of publishedPeriods()) {
      for (const s of department().surgeons) {
        for (const m of METRICS) {
          const t = tileFor(m, s, p, none);
          if (t.kind === "value") expect(t.adjudicated!.line.length).toBeGreaterThan(0);
          else if (t.kind === "reason") expect(t.reason!.length).toBeGreaterThan(10);
          else expect(m.compute).toBeUndefined();
        }
      }
    }
  });
});

describe("minimum n", () => {
  it("suppresses FCOT below 4 first cases with the reason in words", () => {
    const fcot = metric("fcot")!;
    let seen = false;
    for (const p of publishedPeriods()) {
      for (const s of department().surgeons) {
        const t = tileFor(fcot, s, p, none);
        const c = fcot.compute!(s.id, [p], { basis: "adjudicated", ov: none });
        if (c.den < 4) {
          seen = true;
          expect(t.kind).toBe("reason");
          expect(t.reason).toMatch(/^Not shown: (\d+ first cases? this month|no first cases were credited to you in .+); needs at least 4\.$/);
        } else expect(t.kind).toBe("value");
      }
    }
    expect(seen).toBe(true);
  });
  it("shows the wording for a pending data source and for no allocated block", () => {
    expect(tileFor(metric("referral_to_visit")!, S("S01"), LATEST_PUBLISHED, none).reason).toBe("Not yet available: the data source has not been confirmed.");
    const noBlock = department().surgeons.find((s) => !s.hasBlock)!;
    expect(tileFor(metric("block_utilization")!, noBlock, LATEST_PUBLISHED, none).reason).toBe("Not applicable: no allocated block this month.");
  });
});

describe("anonymous peer spread (GR4)", () => {
  it("needs at least five other surgeons who each clear minimum n", () => {
    // Main campus spine has three surgeons: two others, so never a subspecialty-at-site comparison.
    const t = tileFor(metric("or_case_volume")!, S("S01"), LATEST_PUBLISHED, none);
    expect(t.spread).toEqual({ kind: "reason", text: "Peer comparison not shown: only 2 other spine surgeons at Main campus; 5 are needed for a comparison." });
    // Harbor campus has five neurosurgeons: four others.
    const h = tileFor(metric("fcot")!, S("S11"), LATEST_PUBLISHED, none);
    if (h.kind === "value") expect(h.spread?.kind).toBe("reason");
  });
  it("renders sorted values with no identities when the group is large enough", () => {
    const t = tileFor(metric("notes_72h")!, S("S02"), LATEST_PUBLISHED, none);
    expect(t.spread?.kind).toBe("rendered");
    if (t.spread?.kind === "rendered") {
      expect(t.spread.values.length).toBeGreaterThanOrEqual(MIN_PEERS);
      expect([...t.spread.values].sort((a, b) => a - b)).toEqual(t.spread.values);
    }
  });
  it("removes an opted-out surgeon from every peer group and tells them why", () => {
    const opted = department().surgeons.find((s) => s.optedOutOn)!;
    for (const s of department().surgeons) expect(peerGroup(s, "site").members.some((m) => m.id === opted.id)).toBe(false);
    const t = tileFor(metric("notes_72h")!, opted, LATEST_PUBLISHED, none);
    expect(t.spread?.kind === "reason" && t.spread.text).toMatch(/you opted out of the peer spread/);
  });
  it("never compares Work RVUs with peers and sets no target", () => {
    const w = metric("work_rvus")!;
    expect(w.peer).toBe("none");
    expect(w.comparedTo).toBe("Yourself last year only. No peer comparison and no target.");
    expect(spreadFor(w, S("S01"), windowFor(w, LATEST_PUBLISHED), LATEST_PUBLISHED, { basis: "adjudicated", ov: none }, null)).toBeUndefined();
  });
});

describe("disputes (GR2)", () => {
  it("routes to the chief, or the chair when the chief is involved", () => {
    const c = department().cases.find((x) => x.primaryId === "S03" && !x.shared)!;
    expect(routeFor({ filedById: "S03", recordRef: c.ref, recordType: "case" }).route).toBe("chief");
    expect(routeFor({ filedById: "S03", recordRef: c.ref, recordType: "case", proposedClinicianId: "S01" }).route).toBe("chair");
    const own = department().cases.find((x) => x.primaryId === "S01")!;
    expect(routeFor({ filedById: "S01", recordRef: own.ref, recordType: "case" }).route).toBe("chair");
    const discharged = department().admissions.find((a) => a.dischargingId === "S01" && a.indexSurgeonId !== "S01")!;
    expect(routeFor({ filedById: discharged.indexSurgeonId, recordRef: discharged.ref, recordType: "admission" }).route).toBe("chair");
  });

  it("a sustained re-credit moves the case between surgeons on the adjudicated basis only", () => {
    const c = department().cases.find((x) => x.primaryId === "S03" && x.period === LATEST_PUBLISHED && !x.cancelled)!;
    const d: Dispute = {
      id: "D-9001", recordRef: c.ref, recordType: "case", field: "primary_surgeon", proposedClinicianId: "S02", claim: "x",
      filedById: "S03", filedOn: "2026-09-12", route: "chief", routingReason: "", state: "sustained_annotated", note: "ok", decidedOn: "2026-09-13",
    };
    const ov = overridesFrom([d]);
    const vol = metric("or_case_volume")!;
    const m = [LATEST_PUBLISHED];
    const logged3 = vol.compute!("S03", m, { basis: "logged", ov }).value!;
    const adj3 = vol.compute!("S03", m, { basis: "adjudicated", ov }).value!;
    const logged2 = vol.compute!("S02", m, { basis: "logged", ov }).value!;
    const adj2 = vol.compute!("S02", m, { basis: "adjudicated", ov }).value!;
    expect(adj3).toBe(logged3 - 1);
    expect(adj2).toBe(logged2 + 1);
    const t = tileFor(vol, S("S03"), LATEST_PUBLISHED, ov);
    expect(t.bothBases).toBe(true);
    const rows = vol.records!("S03", m, { basis: "adjudicated", ov });
    expect(rows.find((r) => r.ref === c.ref)?.counted).toBe("not counted (re-credited)");
  });

  it("a sustained delay-attribution dispute changes the row label, never the FCOT count", () => {
    const fcot = metric("fcot")!;
    const c = department().cases.find((x) => x.firstCase && x.delay === "surgeon_late" && x.period === LATEST_PUBLISHED)!;
    const d: Dispute = {
      id: "D-9002", recordRef: c.ref, recordType: "case", field: "delay_attribution", claim: "x",
      filedById: c.primaryId, filedOn: "2026-09-12", route: "chief", routingReason: "", state: "sustained_annotated", note: "ok", decidedOn: "2026-09-13",
    };
    const ov = overridesFrom([d]);
    const a = fcot.compute!(c.primaryId, [LATEST_PUBLISHED], { basis: "logged", ov });
    const b = fcot.compute!(c.primaryId, [LATEST_PUBLISHED], { basis: "adjudicated", ov });
    expect(b.value).toBe(a.value);
    expect(b.den).toBe(a.den);
    expect(b.extra![0]).not.toBe(a.extra![0]);
  });
});

describe("display contracts", () => {
  it("M&M: 8 of 12 scales down for approved leave and rounds up", () => {
    const mm = mmView(S("S05"), LATEST_PUBLISHED, none);
    expect(mm.target).toBe(Math.ceil((8 * 10) / 12));
    expect(mm.scaled).toBe(true);
  });
  it("patient experience hides a month with fewer than 10 responses, for that month only", () => {
    for (const s of department().surgeons) {
      const v = surveyView(metric("explained")!, s, LATEST_PUBLISHED, none);
      for (const m of v.months) {
        expect(m.hidden).toBe(m.n < 10);
        if (m.hidden) expect(m.line).toMatch(/^Hidden: \d+ responses? this month; needs at least 10\.$/);
      }
    }
  });
  it("every live metric with a computation has a trend", () => {
    for (const m of METRICS.filter((x) => x.compute && x.availability === "live" && ["month", "quarter", "rolling12"].includes(x.cadence))) {
      expect(trendFor(m, S("S02"), LATEST_PUBLISHED, none).length).toBeGreaterThan(1);
    }
  });
});
