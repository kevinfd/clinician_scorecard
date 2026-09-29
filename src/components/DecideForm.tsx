"use client";

import { useActionState } from "react";
import { decideDispute, type FormState } from "../../app/actions";

export function DecideForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(decideDispute, {});
  const e = state.errors ?? {};
  const val = state.values ?? {};
  return (
    <form className="stack" action={action} noValidate>
      <input type="hidden" name="id" value={id} />
      {e.form && <p className="banner" role="alert">{e.form}</p>}
      <fieldset>
        <legend>Your decision on the record</legend>
        <label className="radio"><input type="radio" name="decision" value="sustained" defaultChecked={val.decision === "sustained"} /><span>Sustained: the record is wrong as logged</span></label>
        <label className="radio"><input type="radio" name="decision" value="not_sustained" defaultChecked={val.decision === "not_sustained"} /><span>Not sustained: the record stands as logged</span></label>
        <label className="radio"><input type="radio" name="decision" value="definition_question" defaultChecked={val.decision === "definition_question"} /><span>Definition question: the record is right but the definition is in question</span></label>
        {e.decision && <p className="error" role="alert">Decision: {e.decision}</p>}
      </fieldset>
      <fieldset>
        <legend>If sustained, what happens to the record</legend>
        <label className="radio"><input type="radio" name="outcome" value="annotated" defaultChecked={val.outcome === "annotated"} /><span>Annotated: the adjudicated value shows beside the logged one</span></label>
        <label className="radio"><input type="radio" name="outcome" value="source_corrected" defaultChecked={val.outcome === "source_corrected"} /><span>Source corrected: periop is also asked to correct its record</span></label>
        {e.outcome && <p className="error" role="alert">Outcome: {e.outcome}</p>}
      </fieldset>
      <div className={`field${e.note ? " has-error" : ""}`}>
        <label htmlFor="note">Note to the surgeon</label>
        <textarea id="note" name="note" maxLength={1200} defaultValue={val.note ?? ""} aria-describedby="note-help" />
        <p className="help" id="note-help">Required. The surgeon reads this on the row. Up to 1,000 characters.</p>
        {e.note && <p className="error" role="alert">Note: {e.note}</p>}
      </div>
      <div><button className="btn primary" type="submit" disabled={pending}>{pending ? "Recording" : "Record decision"}</button></div>
    </form>
  );
}
