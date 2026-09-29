"use client";

import { useActionState } from "react";
import { fileDispute, type FormState } from "../../app/actions";

export function DisputeForm({
  recordRef, fields, labels, options, effect, openNotice,
}: {
  recordRef: string;
  fields: string[];
  labels: Record<string, string>;
  options: { id: string; name: string }[];
  effect: string;
  openNotice?: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(fileDispute, {});
  const e = state.errors ?? {};
  const val = state.values ?? {};
  const initialField = val.field || (fields.length === 1 ? fields[0] : "");
  return (
    <form className="stack" action={action} noValidate>
      <input type="hidden" name="ref" value={recordRef} />
      {e.form && <p className="banner" role="alert">{e.form}</p>}
      {openNotice && <p className="notice">{openNotice}</p>}
      <fieldset aria-describedby={e.field ? "field-err" : undefined}>
        <legend>What is wrong with this record?</legend>
        {fields.map((f) => (
          <label className="radio" key={f}>
            <input type="radio" name="field" value={f} defaultChecked={initialField === f} required />
            <span>{labels[f]}</span>
          </label>
        ))}
        {e.field && <p className="error" id="field-err" role="alert">{e.field}</p>}
      </fieldset>
      {fields.includes("primary_surgeon") && (
        <div className={`field${e.proposed ? " has-error" : ""}`}>
          <label htmlFor="proposed">If it is not your case: who was the primary surgeon?</label>
          <select key={`p-${val.proposed ?? ""}-${Object.keys(e).join()}`} id="proposed" name="proposed" defaultValue={val.proposed ?? ""} aria-describedby="proposed-help">
            <option value="">Choose a surgeon</option>
            {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <p className="help" id="proposed-help">Only needed when you choose &ldquo;Not my case&rdquo;. That surgeon sees the record and its dispute history.</p>
          {e.proposed && <p className="error" role="alert">Surgeon: {e.proposed}</p>}
        </div>
      )}
      <div className={`field${e.claim ? " has-error" : ""}`}>
        <label htmlFor="claim">What happened</label>
        <textarea id="claim" name="claim" maxLength={1200} defaultValue={val.claim ?? ""} aria-describedby="claim-help" />
        <p className="help" id="claim-help">Up to 1,000 characters. Describe the record by its id and what happened; do not include patient names, record numbers or dates of birth.</p>
        {e.claim && <p className="error" role="alert">Claim: {e.claim}</p>}
      </div>
      <p className="notice">{effect}</p>
      <div>
        <button className="btn primary" type="submit" disabled={pending}>{pending ? "Filing" : "File dispute"}</button>
      </div>
    </form>
  );
}
