"use client";

// Guided-walkthrough engine, mounted once in the root layout. It watches the
// `tour` and `step` URL params: switches identity through /tour/go when a step
// belongs to another person, navigates between routes, finds the step's
// `data-tour` target and renders the spotlight. A missing target degrades to a
// centered card, so a tour never breaks.

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TourOverlay } from "./TourOverlay";
import type { TourDef, TourId } from "@/lib/tours";

function stepUrl(route: string, tour: string, step: number) {
  const sep = route.includes("?") ? "&" : "?";
  return `${route}${sep}tour=${tour}&step=${step}`;
}
const pathOf = (route: string) => route.split("?")[0];
const currentViewer = () => document.getElementById("cs-viewer")?.dataset.id ?? "";

export function TourProvider({ tours }: { tours: Record<TourId, TourDef> }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const tourId = sp.get("tour") as TourId | null;
  const tour = tourId && tours[tourId] ? tours[tourId] : null;
  const index = Math.max(0, Math.min((tour?.steps.length ?? 1) - 1, Number(sp.get("step") ?? "0") || 0));
  const step = tour?.steps[index];
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [ready, setReady] = useState(false);

  const goTo = useCallback((i: number) => {
    if (!tour) return;
    const s = tour.steps[i];
    setRect(null);
    setReady(false);
    if (s.as !== currentViewer()) {
      window.location.assign(`/tour/go?tour=${tour.id}&step=${i}`);
      return;
    }
    const url = stepUrl(s.route, tour.id, i);
    if (pathOf(s.route) === pathname) router.replace(url, { scroll: false });
    else router.push(url);
  }, [tour, pathname, router]);

  const close = useCallback(() => {
    setRect(null);
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  const next = useCallback(() => {
    if (!tour) return;
    if (index >= tour.steps.length - 1) close();
    else goTo(index + 1);
  }, [tour, index, close, goTo]);

  const back = useCallback(() => { if (index > 0) goTo(index - 1); }, [index, goTo]);

  // Arrive at the right person and page for this step.
  useEffect(() => {
    if (!tour || !step) return;
    if (step.as !== currentViewer()) {
      window.location.assign(`/tour/go?tour=${tour.id}&step=${index}`);
      return;
    }
    if (pathOf(step.route) !== pathname) router.push(stepUrl(step.route, tour.id, index));
  }, [tour, step, index, pathname, router]);

  // Find and follow the target.
  useEffect(() => {
    setReady(false);
    if (!tour || !step) return;
    if (pathOf(step.route) !== pathname) return;
    if (step.target == null) { setRect(null); setReady(true); return; }
    let cancelled = false;
    let tries = 0;
    const selector = `[data-tour="${step.target}"]`;
    const update = () => {
      const el = document.querySelector(selector);
      if (el) setRect(el.getBoundingClientRect());
    };
    const ro = new ResizeObserver(update);
    const find = () => {
      if (cancelled) return;
      const el = document.querySelector(selector);
      if (el) {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        ro.observe(el);
        window.setTimeout(() => { if (!cancelled) { setRect(el.getBoundingClientRect()); setReady(true); } }, 350);
      } else if (tries++ < 30) window.setTimeout(find, 100);
      else { setRect(null); setReady(true); }
    };
    find();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      cancelled = true;
      ro.disconnect();
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [tour, step, pathname]);

  useEffect(() => {
    if (!tour) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") back();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [tour, close, next, back]);

  if (!tour || !step || !ready || pathOf(step.route) !== pathname) return null;
  return (
    <TourOverlay step={step} index={index} total={tour.steps.length} rect={rect} tourLabel={`${tour.label} tour`} onNext={next} onBack={back} onClose={close} />
  );
}
