"use client";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="mx-auto mt-16 max-w-xl px-4">
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center" role="alert">
        <h1 className="text-lg font-semibold text-slate-900">The page could not be loaded.</h1>
        <p className="mt-1 text-[13px] text-slate-500">
          Your data has not changed. Try again or contact scorecard-analyst@example.org.
          {error.digest ? ` Reference ${error.digest.slice(0, 8)}.` : ""}
        </p>
        <button className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-teal-600 px-4 text-[13px] font-semibold text-white hover:bg-teal-700" type="button" onClick={() => reset()}>Try again</button>
      </div>
    </main>
  );
}
