"use client";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="wrap">
      <main id="main">
        <div className="banner" role="alert">
          <h1>The page could not be loaded.</h1>
          <p>
            Your data has not changed. Try again or contact scorecard-analyst@example.org.
            {error.digest ? ` Reference ${error.digest.slice(0, 8)}.` : ""}
          </p>
          <button className="btn" type="button" onClick={() => reset()}>Try again</button>
        </div>
      </main>
    </div>
  );
}
