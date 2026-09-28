# Clinician Scorecard — Metric Definitions

Version 0.2 · September 9, 2026 · Owner: Omar Arnaout

> This is the source brain dump the rest of `docs/` is derived from. It is preserved verbatim; edits go in a new version, not here.

## Ground rules that apply to every metric

* Every case, visit, admission, survey, and attendance record is credited to exactly one clinician. Surgical cases go to the primary surgeon in the OR log. Admissions go to the surgeon who did the index operation, even if a different attending discharged the patient. Clinic visits go to the rendering provider. Surveys go to the provider named on the survey.
* A surgeon can dispute any record credited to them. Disputes go to the division chief; if the chief is involved, they go to the chair.
* A number is not shown if it is based on too few cases (the "minimum n" for that metric), or if the peer group has fewer than five surgeons. The screen says why instead of showing a blank.
* Peer comparisons are always anonymous: the surgeon sees the spread of their peers and where they sit in it, never who is who.
* Every number links to its definition and to the list of records behind it.
* Every metric shows a trend, not just a snapshot.

## Bucket 1 — Volume and mix

How much you do and what kind.

### OR case volume

- **What:** the number of operations where you were the primary surgeon.
- **Counted:** monthly.
- **Compared to:** surgeons in your subspecialty at your site.
- **Shown as:** a count with a trend line.
- **You can move it by:** block use, converting clinic to OR, scheduling practices.

### Case mix index

- **What:** how complex your inpatient cases are, on average, using Vizient's relative weight for each admission.
- **Counted:** quarterly; needs at least 10 admissions to display.
- **Compared to:** surgeons in your subspecialty across the system, and Vizient.
- **Shown as:** your value against the anonymous peer spread, with trend.
- **You can move it by:** referral development and case selection.

### New patient visits

- **What:** completed new-patient clinic visits.
- **Counted:** monthly.
- **Compared to:** subspecialty peers at your site.
- **Shown as:** a count with a trend line.
- **You can move it by:** clinic template design, access, referral relationships.

### Work RVUs — live tracker

- **What:** your billed wRVUs, fiscal year to date and by month.
- **Compared to:** yourself last year only. No peer comparison and no target.
- **Shown as:** year-to-date against the same point last year, plus monthly bars with last year's bars ghosted behind them. The as-of date reflects billing lag.
- **You can move it by:** documentation, coding accuracy, volume.

## Bucket 2 — Efficiency

How smoothly your OR and clinic days run.

### First-case on-time start (FCOT)

- **What:** of your first cases of the day, the share where the patient was wheeled into the room at or before the scheduled start time. No grace window (assumption — to be confirmed against the institutional definition).
- **Counted:** monthly; needs at least 4 first cases.
- **Compared to:** neurosurgeons at your site.
- **Note:** the delay reason is stored on each case, so a delay that wasn't yours can be disputed.
- **You can move it by:** arriving on time; consent, marking, and H&P done before the day.

### Duration estimate accuracy

- **What:** the share of your cases where actual in-room time was within 20% of what was booked (or within 30 minutes, whichever is more forgiving).
- **Counted:** monthly; needs at least 5 cases.
- **Compared to:** subspecialty peers at your site.
- **You can move it by:** booking realistic times and updating your default durations.

### Block utilization (only if you have allocated block)

- **What:** minutes you used in your own block as a share of minutes allocated, after removing any block you released.
- **Counted:** monthly.
- **Compared to:** neurosurgeons at your site.
- **You can move it by:** filling the block or releasing it early.

### Same-day cancellations you could have prevented

- **What:** same-day cancellations whose reason code is in the surgeon-attributable set, as a share of your scheduled cases. Cancellations for reasons outside your control are not counted against you.
- **Counted:** quarterly; needs at least 10 cases.
- **Compared to:** neurosurgeons at your site.
- **You can move it by:** pre-op readiness and clearance workflow.

### Clinic notes closed within 72 hours

- **What:** the share of your clinic visits with the note signed within 72 hours.
- **Counted:** monthly; needs at least 10 visits.
- **Compared to:** neurosurgeons at your site.
- **You can move it by:** closing notes the same day.

**Deliberately not on the individual scorecard:** OR turnover time, PACU boarding, room-ready delays. A surgeon cannot move these alone, so they appear only on division and site views.

## Bucket 3 — Access

How quickly new patients can get to you.

### Third-next-available appointment

- **What:** the number of days until your third next open new-patient slot, sampled regularly and reported as the median. (Third, not first, because the first open slot is usually a cancellation.)
- **Counted:** monthly; needs at least 2 samples.
- **Compared to:** subspecialty peers at your site. Lower is better.
- **You can move it by:** template capacity, hold slots, waitlist management.

### Referral-to-visit days (pending confirmation of data source)

- **What:** median days from when a referral is received to when the patient is seen.
- **Counted:** quarterly; needs at least 10 visits.
- **Compared to:** subspecialty peers at your site. Lower is better.
- **You can move it by:** triage speed and overbook policy.

## Bucket 4 — Quality and outcomes

How your patients do. Where Vizient has a risk model, the metric is shown as observed divided by expected (O/E), so a surgeon who takes sicker patients is not penalized. A ratio of 1.0 means exactly as expected; below 1.0 is better. Where there is no risk model the number is labeled "unadjusted." Complications come from the department's QI database, never entered by hand into the scorecard.

### Length of stay (O/E)

- **What:** total days your surgical patients stayed, divided by the total days Vizient expected given their diagnoses and risk. Patients who became "super-long boarders" are left out (assumed to mean more than 30 days until the institutional definition is confirmed); the screen shows how many were excluded.
- **Counted:** quarterly; needs at least 10 admissions.
- **Compared to:** subspecialty peers across the system, and Vizient.
- **You can move it by:** pathway adherence, early discharge planning, timely PT/OT orders.

### 30-day readmission (O/E)

- **What:** readmissions within 30 days to any MGB hospital, any service, divided by Vizient's expected number.
- **Counted:** quarterly; needs at least 10 admissions.
- **Compared to:** subspecialty peers across the system, and Vizient.
- **You can move it by:** discharge instructions, early follow-up, wound-care teaching.

### In-hospital mortality (O/E)

- **What:** deaths during the surgical admission divided by Vizient's expected number.
- **Counted:** rolling 12 months only, because counts are small; needs at least 30 admissions.
- **Compared to:** neurosurgeons across the system, and Vizient.
- **You can move it by:** case selection and rescue.

### Unplanned return to the OR within 30 days

- **What:** the share of your cases that needed an unplanned reoperation within 30 days, by any surgeon, as recorded in the QI database.
- **Counted:** quarterly; needs at least 10 cases.
- **Compared to:** subspecialty peers across the system. Lower is better.
- **You can move it by:** technique, hemostasis, closure, patient selection.

### Surgical site infection

- **What:** infections within 30 days (90 days with an implant), per the QI database, as a share of your cases.
- **Counted:** quarterly; needs at least 20 cases.
- **Compared to:** neurosurgeons across the system. Lower is better.
- **You can move it by:** prep, antibiotic timing, closure, wound care.

### VTE within 30 days

- **What:** DVT or PE within 30 days of surgery, per the QI database, as a share of your cases.
- **Counted:** quarterly; needs at least 20 cases.
- **Compared to:** neurosurgeons across the system. Lower is better.
- **You can move it by:** prophylaxis ordering and early mobilization.

### CSF leak requiring intervention (neurosurgery only)

- **What:** cranial or spinal cases with a CSF leak that needed reoperation, a lumbar drain, or readmission within 30 days, per the QI database, as a share of eligible cases.
- **Counted:** quarterly; needs at least 10 cases.
- **Compared to:** subspecialty peers across the system. Lower is better.
- **You can move it by:** closure technique.

### Unplanned return to ICU (pending confirmation of data source)

- **What:** the share of your ICU patients who were transferred back to the ICU unexpectedly after stepping down.
- **Counted:** quarterly; needs at least 10 admissions.
- **Compared to:** neurosurgeons across the system. Lower is better.
- **You can move it by:** step-down criteria and handoff quality.

## Bucket 5 — Patient experience

What your patients say. These come from the MGB patient survey. Each measure is shown exactly the way you already see it at faculty meeting — your year average, each of the past three months separately, and the MGB average — plus one new thing: the anonymous bar chart of everyone in your peer group with your own bar highlighted, available any time instead of twice a year. A month with fewer than 10 responses is hidden for that month only.

### Net promoter score

- **What:** on the "would you recommend this provider" question, the percentage of promoters minus the percentage of detractors.
- **Compared to:** neurosurgeons across the system, and the MGB average.
- **You can move it by:** communication, expectation setting, follow-through.

### "Provider explained things in a way I could understand"

- **What:** the share of responses giving the top score.
- **Compared to:** neurosurgeons across the system, and the MGB average.
- **You can move it by:** plain-language explanations and teach-back.

### "Provider listened carefully"

- **What:** the share of responses giving the top score.
- **Compared to:** neurosurgeons across the system, and the MGB average.
- **You can move it by:** sitting down, not interrupting, confirming concerns.

### "Provider showed respect"

- **What:** the share of responses giving the top score.
- **Compared to:** neurosurgeons across the system, and the MGB average.
- **You can move it by:** courtesy, introductions, acknowledging family.

### Patient feedback inbox

- **What:** every de-identified free-text comment about you, newest first, with the scores from the same survey, in one place.
- **Who sees it:** you and your direct leader only. Comments are never counted, compared, or rolled up into anything.
- **You can:** read, reflect, and add private notes.

## Bucket 6 — Citizenship

Objectively logged obligations tied to the compensation plan. The scorecard displays what the system of record logs.

### M&M attendance

- **What:** sessions attended out of sessions held while you were on faculty and not on approved leave, logged by the new attendance system (QR-code scan).
- **Target:** 8 of 12 per fiscal year, per the comp plan. If approved leave removes sessions, the target scales down proportionally and rounds up (assumption — to be confirmed).
- **Shown as:** attended so far, sessions remaining, on pace or off pace, and a clear flag when 8 can no longer be reached this year. No peer comparison.
- **You can move it by:** attending.
