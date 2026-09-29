import { cookies } from "next/headers";
import { enterPasscode, signIn } from "./actions";
import { Shell } from "@/components/Shell";
import { department } from "@/lib/synth";
import { PASS_COOKIE, passToken, roleWords, viewer } from "@/lib/session";

export default async function SignIn({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const v = await viewer();
  const people = department().people;
  const locked = !!process.env.DEMO_PASSCODE && (await cookies()).get(PASS_COOKIE)?.value !== passToken();
  const groups: { title: string; ids: string[] }[] = [
    { title: "Surgeons", ids: people.filter((p) => p.isSurgeon).map((p) => p.id) },
    { title: "Leadership and operations", ids: people.filter((p) => !p.isSurgeon).map((p) => p.id) },
  ];
  return (
    <Shell viewer={v}>
      <h1>Choose who you are</h1>
      <p className="lede">
        In the department this page is single sign-on. Here you pick one of fourteen synthetic neurosurgeons, the chair, or the
        department analyst, and see exactly what that person is allowed to see. Dr. Imani Okafor is also the division chief; Dr.
        Rafael Duarte is the Harbor campus site lead.
      </p>
      {locked ? (
        <form className="stack" action={enterPasscode}>
          <div className={`field${error === "passcode" ? " has-error" : ""}`}>
            <label htmlFor="passcode">Demo passcode</label>
            <input id="passcode" name="passcode" type="password" autoComplete="off" aria-describedby="passcode-help" required />
            <p className="help" id="passcode-help">Whoever shared this link has the passcode.</p>
            {error === "passcode" && <p className="error" role="alert">Passcode: not accepted. Type it again.</p>}
          </div>
          <div><button className="btn primary" type="submit">Continue</button></div>
        </form>
      ) : (
        groups.map((g) => (
          <section key={g.title}>
            <h2>{g.title}</h2>
            <div className="people">
              {g.ids.map((id) => {
                const p = people.find((x) => x.id === id)!;
                return (
                  <form key={id} action={signIn}>
                    <input type="hidden" name="id" value={p.id} />
                    <div>
                      <div>{p.name}</div>
                      <div className="label">{roleWords(p)}</div>
                    </div>
                    <button className="btn small" type="submit" aria-label={`Continue as ${p.name}`}>Continue</button>
                  </form>
                );
              })}
            </div>
          </section>
        ))
      )}
    </Shell>
  );
}
