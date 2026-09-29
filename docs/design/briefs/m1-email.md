# Surface brief: the M1 monthly email

Written by `/impeccable shape` on 2026-09-29 with no human present. No structured question tool was exposed, so the discovery interview was answered from the documents; every reading that a human would normally confirm is marked "assumption". The brief cites `F-xx` (`docs/02-features.md`), `R-xx` (`docs/PRD.md` section 7) and `Jn.m` (`docs/01-user-journeys.md`). Source of truth for the template: `docs/03-technical-design.md`, "M1: the monthly email", and PRD section 9.1 and 9.6.

## 1. Job and audience

- **Who arrives:** an attending neurosurgeon at the pilot site, in their MGB mailbox, within 10 business days of month close (J1.2). Tens of surgeons receive one each; every email is different and carries only that surgeon's rows.
- **Context and state of mind:** on a phone, between cases or at night (assumption; J1.2 says "on a phone"). Wary: the envelope looks like the shape phishing training warns about (TD-01), the number may read as a verdict (TD-03), and the department has never sent them their own case list before.
- **Need:** four numbers that match periop's report, the case list behind them, a reason for every absence, and a way to dispute a row that lands somewhere (J1.3 to J1.8, J1.12).
- **Visitor mode:** Operate. The surgeon completes a task: check the month, find a case, copy a case id into a reply. Nothing on the surface persuades.

## 2. Outcome and proof

- **Primary task:** read the four values on the first phone screen, then find one row (for example the late first case from the 14th) and, if it is wrong, reply with its case id (J1.4, J2.2, J2.3a).
- **Success:** in month one a surgeon reads four numbers that match periop's, opens their own list, finds the late case and sees why it was counted; every cell without a number says why (J1 success outcome). Measured by unprompted replies and the month-three interview (R-95), never by a "seen" request (TD-12).
- **Real evidence the surface carries:** the surgeon's own OR-log rows (case id, date, room, procedure, scheduled start, wheels-in, on time, delay reason as stored, booked and actual minutes, cancellation reason, shared flag, dispute state); periop's definitions verbatim with version; "last refreshed"; the versioned "what this is not" line (F-42); decisions on the surgeon's own disputes since the last email (R-115).
- **Product-specific truth no template could claim:** the number reconciles to periop's report (G1, footer sentence); the late count decomposes into "your delay" and "not your delay" without changing the rate (R-123); a suppressed tile still lists its rows (F-49 AC 3); "Names are hidden, not people." (R-48).

## 3. Selected direction

- **Visual authority:** none incumbent. The world is defined in `DESIGN.md` ("The OR list and the pen"). In plain text the world survives as grammar, not as colour or type: a printed list with a stamped header, fixed columns, one record per line, and annotations (dispute states, restatements, decisions) that read as something a person wrote on the sheet afterwards, in words, dated and attributed.
- **Structural thesis:** the email is a printed day sheet, not a report. Header stamp (who, period, site, last refreshed), then the four totals, then the rows, then the full tiles, then the paperwork (how to dispute, definitions, footer). The rows are the product; the tiles are the totals line above them.
- **Sequence (R-116):** envelope and two preview lines; three-line header; "what this is not"; the rows-and-attachment line; the orientation block (month one) or "What changed since <period>" (month two on); THIS MONTH, four lines with the late-case decomposition; YOUR FIRST CASES AND CANCELLATIONS, case id first, 20 rows cap; full tiles in bucket order; buckets 3 to 6 as one paragraph; HOW TO DISPUTE; DEFINITIONS IN FORCE THIS PERIOD; footer.
- **Focal moment:** THIS MONTH's four lines on the first phone screen, and under FCOT the decomposition line "Of the 2 late: 1 your delay, 1 not your delay". The memory test: an hour later the surgeon remembers "5 of 7, and the late one on the 14th was anaesthesia's".
- **Implementation consequence:** one Jinja2 template (`templates/scorecard_email.txt.j2`) rendering `ClinicianArtifact`; every string a catalogue key (F-33); a line-width test at 72 characters; a test that month one contains no `Peers:` line (F-35); no ruler lines (R-94).

### Direction contract

THESIS: The email is the surgeon's own OR list for the month with the totals stamped on top and the department's annotations written beside the rows; it refuses the report-card arrangement (headline percentage, commentary, appendix) and the dashboard-in-an-email arrangement (a table of KPIs with arrows).

OWN-WORLD: With all content removed, what remains is the grammar of a printed list: an upper-case stamped header line, blank-line-separated blocks, one record per line beginning with its id, two-space column gaps, counts written as "5 of 7", annotations in the form "<state> by <role> on <date>: <note>" and "restated <cause>". No ruler, no symbol art, no indentation deeper than four spaces. In DESIGN.md's terms: the printed ink only; the pen is represented by dated, attributed words.

STORY: The surgeon understands that these are their own rows, that every number has a denominator they can count, that a missing number has a counted reason, and that a reply with a case id changes the list. They believe it because the rows are there and the footer says the number matches periop's. They do one thing: find a row and reply, or close the email knowing nothing changed.

FIRST VIEWPORT: On a 360 px phone in a proportional-font mail client, the first screen shows: the two preview lines (already read in the inbox), the three-line header, the one-line "what this is not", the rows-and-attachment line, the orientation block, and THIS MONTH's four value lines with the FCOT decomposition. About 22 lines. The primary action (reply with a case id) is not on the first screen by design; it follows the rows, which follow the totals.

FORM: The OR daily case list, annotated by pen, candidate 6 of 7 on the grounded list; seed key 20b5df25 (degraded roll, no challengers). Raised by two declined grounded candidates from the same list: from the lab report, the reference-range discipline for the spread line (range in the unit, "You" marked, no verdict); from the operative note, the addendum discipline (nothing is edited; every change is appended, dated and signed).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance. (No raster ships in a plain-text email; the clause applies to the hosted view.)

## 4. Scope and boundaries

- **Fidelity:** production template for months one to three. Rendered by the analyst's `scorecard publish --dry-run`, rehearsed as `.eml` on iOS Mail, Outlook for iOS and Android Gmail (R-82).
- **Breadth:** the monthly email body and its CSV; the month-one and month-two variants; the suppressed, interim, as-logged-and-as-adjudicated and restated tile forms. The other M1 emails (acknowledgement, decision, re-credit, deadline, override list) share the grammar and are out of this brief's composition scope.
- **Interactivity:** none. Reply is the only action. No link in months one to three (F-90 AC 3).
- **Named target:** `templates/scorecard_email.txt.j2` and `csv_rows.py` (technical design, "M1: the monthly email").
- **Untouched:** the catalogue strings the PRD fixes (section 9.4) except where `docs/reviews/impeccable-design.md` rewrites them and the PRD amendment records it; the CSV column order (R-121); the bucket order (the brief's).
- **Anti-goals:** HTML email; any hyperlink; any peer value in month one; any composite, rank, target or "seen" request; ruler lines; emoji or symbol art; a headline percentage without its denominator; a second FCOT rate.

### What plain text can and cannot do

| Plain text can | Plain text cannot | Consequence |
|---|---|---|
| Order blocks; separate them with blank lines | Show hierarchy by size, weight or colour | Headings are one upper-case line followed by a blank line; the first screen is ordered by importance, not styled |
| Put one fact per line | Guarantee column alignment: iOS Mail, Gmail and Outlook render plain text in a proportional face | Never depend on alignment; a row reads left to right with two-space gaps and the id first; no table headers |
| Write counts | Draw a chart, a bar, a marker or an interval | The trend is one dated row per point (R-45); the spread is three lines (R-48); a strip plot exists only on the hosted view |
| Mark a state with a word | Mark it with colour, icon, strike-through or a badge | "restated", "Disputed - with chief, filed <date>", "not counted (re-credited)" are words on the row |
| Wrap at 72 characters | Prevent a client from re-wrapping long lines or a screen reader from reading symbols aloud | Hard-wrap at 72; no run of symbols (no rulers); indentation at most four spaces |
| Carry an attachment | Render a CSV as rows on a phone | The first-case and cancellation rows ride in the body (R-124, cap 20); the CSV is for the desk |
| Be quoted in a reply | Know which row the surgeon meant | The case id is the first token on every row and the first line of the reply template (R-94) |
| Show the two preview lines in the inbox list | Control the subject's truncation on a phone (about 35 to 45 characters visible) | The subject leads with the surgeon's own words: "Your October 2026 scorecard and case list" (R-122); the analyst's name may truncate and that is acceptable |

## 5. States and ranges

Realistic ranges from the brief and the technical design (all counts are per surgeon unless stated; values are illustrative, not measured):

| Item | Minimum | Typical | Maximum | Where the range bites |
|---|---|---|---|---|
| Surgeons on the roster at the site | 5 | 12 to 25 | about 40 | Peer count on every comparator line ("9 surgeons") |
| Peers who clear min-n for a site metric | 0 | 5 to 12 | about 30 | Spread renders at 5; the "Peers:" line runs to 30 values, up to 4 wrapped lines |
| Peers in a subspecialty at the site | 1 | 2 to 6 | 10 | Often under five: OR case volume and Duration estimate accuracy read "Peer comparison not shown" |
| OR case volume, monthly | 0 | 8 to 25 | 40 | 0 is a real month only if the feed loaded (leave, sabbatical); "0 rows; the <period> extract loaded with no cases credited to you" |
| First cases, monthly | 0 | 3 to 10 | 20 | Min-n 4 sits inside the typical range: many months read "Not shown: 3 first cases this month; needs at least 4" |
| Late first cases | 0 | 0 to 3 | 10 | Decomposition line: "Of the 0 late" must read well; "Of the 3 late: 1 your delay, 1 not your delay, 1 reason not recorded" |
| Duration cases, monthly | 0 | 6 to 25 | 40 | Min-n 5 |
| Scheduled cases, quarterly | 10 | 30 to 90 | 120 | Min-n 10; interim months read "Counted quarterly; the quarter closes <date>. Scheduled cases so far this quarter: 24." |
| Same-day cancellations, quarterly | 0 | 0 to 3 | 8 | "0 of 61 (0.0%)" is a value, not an absence |
| Body rows (first cases plus cancellations) | 0 | 4 to 12 | 20, then "Full list attached" | The cap line names both counts |
| Trend rows per tile | 1 (history from <date>) | 12 monthly, 4 quarterly | 12 monthly | Gap rows carry their reason text; restated rows append "restated <cause>" |
| Procedure name in the CSV | 6 characters | 20 to 35 | 47 characters and longer (periop free text) | CSV only; never in the body rows (R-124 names date, state and label only) |
| Delay reason as stored | blank | one or two words | a phrase of 40 or more characters | Body row wraps to a second line at 72; acceptable; the id stays first on the first line |
| Email length | about 120 lines (self-only, many suppressions) | 200 to 350 lines | about 500 lines (month two, full trends, long definitions) | Definitions last (F-50 AC 7); the first screen is unaffected |
| Definition changes since last email | 0 ("No changes since <period>") | 0 | 2 | In the What changed block |
| Decisions on own disputes since last email | 0 | 0 to 2 | 6 | In the What changed block, one row each with both row texts |

Material states, each a catalogue key (PRD section 9.4, 9.7): month one (orientation block, no spread, no What changed); month two on (What changed, spread where eligible); suppressed tile (reason in the value position, records line kept); peer-under-five (own value stays); opted out; not attended step zero; interim quarterly; history from <date>; as logged and as adjudicated; restated; feed not received (never a zero); not computable; not in this release (buckets 3 to 6 paragraph); numbers-only fallback (D-31 sentence in place of the records line); a held publish sends nothing.

## 6. Interaction and layout intent

- **Hierarchy:** who and when; whether anything changed; the four values; the rows; everything else. The first phone screen ends at THIS MONTH.
- **Topology:** linear. Blocks in fixed order, no cross-references except "see HOW TO DISPUTE below" once.
- **Responsiveness:** the surface has one width, 72 characters, and the client reflows it. Nothing depends on a line staying unbroken except the case id being first on its line.
- **Affordances:** the reply template in HOW TO DISPUTE is the only control; its three labels ("Case id:", "What is wrong:", "What happened:") are the form. The dispute mailbox is the Reply-To.
- **Feedback:** none inside the email. The acknowledgement (within two business days, naming who decides and the due date, R-59), the day-10 note (R-88) and the decision email (R-97) are the feedback loop.
- **Transitions:** none. No motion exists in email.

## 7. Constraints and open decisions

- **Platform and delivery:** plain text, UTF-8, 72-character lines, one CSV attachment with BOM, sent from the department service mailbox through the MGB relay; `--dry-run` default; every body passes the minimum-necessary payload scan (F-106 AC 7).
- **Accessibility:** one fact per line; dated trend rows; no symbol runs; the "You" line precedes the "Peers" line; every state is a word.
- **Localisation:** not required (English, one institution).
- **Reusable components (grammar, from DESIGN.md):** stamp header; block heading; value line; reason line; decomposition line; records line; comparator line; three-line spread; provenance line; trend row; record row; annotation clause; reply template; footer.
- **Open decisions a builder must not invent:** the peer line as sorted values or range and median (TD-06); the decomposition line on the tile versus rows only (TD-03); per-tile provenance line versus footer only (TD-04); the surgeon-facing product name (TD-13); whether the privacy office admits body rows (R-124 condition); whether pending disputes are held out of the number (OQ, J2.3).
