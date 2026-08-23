# EPFO Resolve — Hackathon Masterplan

## 1. Working idea

**One-line pitch**

EPFO Resolve helps an employee fix an incorrect EPS/pension record and complete a blocked PF transfer when their previous employer is unresponsive.

**Simple story**

A person leaves Company A and joins Company B. Their PF balance should move to the new account, but Company A recorded their EPS/pension details incorrectly. The transfer fails. Company A does not respond, EPFO complaints return generic answers, and the person cannot tell whether their money is safe or who must fix the problem.

EPFO Resolve diagnoses the mismatch, explains it plainly, gathers the required evidence, gives every participant a deadline, escalates an unanswered request to the appropriate EPFO authority, and shows the corrected balance and completed transfer.

## 2. Why this problem is worth solving

- It can block significant retirement savings for months or years.
- Different users have reported the same loop: incorrect EPS records, an unresponsive former employer, rejected transfers, generic grievance responses, and no clear owner.
- One documented user spent more than ten months resolving a transfer of approximately ₹10 lakh.
- Another user reported being stuck for more than 1.5 years.
- EPFO has stated that transfer-related issues form a meaningful share of member grievances.
- The problem is not merely an unattractive interface. It is a broken process spanning the employee, former employer, current employer, EPFO field office, EPFiGMS, and sometimes CPGRAMS.

The project should not claim that every EPFO delay has the same cause. It addresses one specific correction-and-transfer journey.

## 3. Target citizen

The primary user is a salaried employee who:

- changed jobs;
- has PF records under a previous employer;
- attempted to transfer the old PF balance;
- received a rejection or blockage caused by inconsistent EPS information;
- cannot get the previous employer to correct the record; and
- does not understand the status, accounting entries, or escalation process.

## 4. Synthetic demonstration case

Use only fictional names, IDs, employers, documents, balances, OTPs, and responses.

Suggested citizen:

- Name: Ananya Rao
- Previous employer: Northstar Services Pvt. Ltd.
- Current employer: Riverline Technologies Pvt. Ltd.
- Old PF balance: ₹9,84,320
- Situation: the former employer recorded EPS membership incorrectly.
- Result: Form 13 transfer is rejected because EPFO records contain contradictory EPS eligibility, dates, or contributions.
- Complication: the previous employer does not respond before the correction deadline.

The exact eligibility scenario must be checked against official EPFO rules. Do not implement the false rule that everyone earning above ₹15,000 is automatically ineligible for EPS. Prior membership, joining date, Basic + DA, and other conditions matter.

For the prototype, use a legally coherent scenario such as a first-time eligible case after 1 September 2014, with no prior EPS membership, after verifying it against official documentation.

## 5. Current broken journey

1. Citizen changes employment.
2. A PF transfer is initiated.
3. The transfer fails with an obscure EPS-related reason.
4. The citizen does not know whether the employer or EPFO must act.
5. The Joint Declaration or correction process requires employer involvement.
6. The former employer ignores the request or returns it without useful guidance.
7. EPFiGMS returns a generic response instructing the citizen to contact the employer.
8. The citizen files repeated complaints and loses the history between portals.
9. Passbook adjustments or negative entries make the citizen fear that money was lost.
10. Resolution depends on persistence rather than a clear, accountable process.

## 6. Proposed citizen journey

1. **Mock sign-in**
   - Citizen enters a fictional UAN and OTP.

2. **Transfer dashboard**
   - Shows the old account, current account, amount, submission date, and failed status.

3. **Plain-language diagnosis**
   - “Your previous employer recorded you as an EPS member, but the available employment data conflicts with that record.”
   - Clearly state whether money is missing, merely untransferred, or awaiting reconciliation.

4. **Record comparison**
   - Compare joining date, Basic + DA, prior membership, EPS dates, EPF contribution, and EPS contribution.
   - Highlight only the conflicting fields.
   - Link each conclusion to the applicable official rule.

5. **Evidence checklist**
   - Show which fictional documents are required and why.
   - Examples: appointment letter, payslips, service history, passbook, Form 3A, and employer communication.

6. **Correction request**
   - Citizen reviews and submits one structured correction case.
   - The request includes the detected conflict, evidence, requested correction, and complete history.

7. **Ownership and deadlines**
   - Show who currently owns the case.
   - Show the date by which the employer or EPFO should respond.
   - Explain what happens if the deadline is missed.

8. **Proposed escalation**
   - If the former employer is unresponsive, route the case to a simulated EPFO/RPFC review path.
   - Preserve all documents and messages instead of making the citizen begin again.
   - Clearly label this as the proposed improved process, not an existing live integration.

9. **Correction and reconciliation**
   - Explain any ledger adjustments in plain language.
   - Demonstrate that a negative EPS entry can represent reclassification rather than lost money.

10. **Transfer complete**
    - Old account becomes zero.
    - Correct amount appears in the current account.
    - Citizen receives a downloadable resolution summary and audit trail.

## 7. MVP screens

Build the smallest complete experience:

1. Landing page with disclaimer.
2. Mock UAN login.
3. PF transfer dashboard.
4. Failed-transfer diagnosis.
5. Side-by-side record comparison.
6. Evidence upload/checklist.
7. Correction request review.
8. Case timeline with employer deadline and escalation.
9. Corrected passbook explanation.
10. Transfer success screen.

The first-minute demo should move through the main states quickly; avoid typing long forms during the recording.

## 8. What makes this more than an AI wrapper

The product must own the complete correction workflow.

**Deterministic logic**

- EPS eligibility checks.
- Deadline calculation.
- Required-document rules.
- Transfer-state transitions.
- Balance and ledger reconciliation.
- Escalation conditions.

**Useful AI assistance**

- Convert technical rejection messages into plain language.
- Summarize employment records and grievance history.
- Translate explanations into an Indian language.
- Extract structured fields from synthetic documents.
- Detect and redact sensitive information.
- Draft a concise correction request from verified facts.

AI must not invent eligibility rules, calculate balances from guesses, or give unsupported legal conclusions. Every important conclusion should show its source and confidence.

## 9. Backend and process thinking

The prototype may use a mocked backend, but the production concept should include:

- a single correction-case ID across employer and EPFO systems;
- structured reason codes instead of generic rejection text;
- a named current owner or responsible office;
- deadlines and automatic escalation;
- an immutable event history;
- document provenance and access controls;
- notifications for every status change;
- a fallback path when a former employer is closed or unresponsive;
- protection against grievances closing during portal outages;
- a reconciliation record showing how money moved between EPS and EPF ledgers; and
- clear separation between citizen-visible information and restricted internal data.

Reviewers will test the citizen journey, so an admin dashboard is not required. Explain the process architecture briefly in the presentation.

## 10. Product principles

- Mobile-first and usable on slow connections.
- Plain language before legal or pension terminology.
- No government logo or styling that implies official approval.
- Clearly display “Unofficial prototype using synthetic data.”
- Never request real Aadhaar, PAN, UAN, OTP, bank, employer, or passbook details.
- Preserve progress so users do not repeatedly re-enter their case.
- Always show the current owner, next action, and expected date.
- Support keyboard navigation, readable contrast, large tap targets, and screen readers.

## 11. Non-goals

Do not build:

- the entire EPFO portal;
- a general EPFO chatbot;
- every PF claim or pension workflow;
- a real government login;
- live EPFO, employer, EPFiGMS, or CPGRAMS integration;
- actual payments or transfers;
- legal advice;
- an officer/admin management system; or
- a promise that every EPS correction can bypass an employer.

## 12. Validation plan

Before finalizing the workflow:

1. Interview at least one person who experienced an EPS-related transfer blockage.
2. Ask them to describe each status, action, response, delay, and workaround.
3. Validate which participant was expected to act at each stage.
4. Ask what information would have reduced the most anxiety or wasted effort.
5. Review the prototype with them without collecting personal information.
6. Verify every rule against current official EPFO documents.

Do not reuse Reddit screenshots, names, balances, or stories publicly without permission.

## 13. Six-day execution plan

### Day 1 — Validate and define

- Conduct user interview(s).
- Confirm the exact EPS scenario.
- Read official EPFO FAQ, Joint Declaration SOP, transfer guidance, and Citizen Charter.
- Freeze the citizen journey and synthetic dataset.
- Sketch the screens.

### Day 2 — Foundation

- Set up the web application.
- Implement design system, navigation, responsive layout, and mock login.
- Build the transfer dashboard and fixture data.

### Day 3 — Core diagnosis

- Implement deterministic eligibility and inconsistency rules.
- Build record comparison and plain-language diagnosis.
- Add source citations and explanations.

### Day 4 — Correction workflow

- Build evidence checklist/upload simulation.
- Build correction request review and submission.
- Implement case timeline, ownership, deadlines, and escalation states.

### Day 5 — Resolution and polish

- Build ledger reconciliation and successful transfer state.
- Add accessibility, loading, offline/slow-network considerations, error handling, and one language translation.
- Test the complete journey on mobile and desktop.

### Day 6 — Submission

- Fix defects and remove unnecessary features.
- Deploy to a public URL requiring no access approval.
- Add mock credentials if needed.
- Record the two-minute video.
- Write the under-250-word summary.
- Verify every link in a private/incognito browser.

## 14. Suggested two-minute video

### First minute — Citizen demo

- “Ananya changed jobs, but ₹9.84 lakh is stuck because her old EPS record is wrong.”
- Show the failed transfer.
- Show the exact conflicting record.
- Show required evidence and correction submission.
- Advance the mock timeline to an unanswered employer deadline.
- Show automatic proposed escalation.
- Show corrected records, reconciled balance, and successful transfer.

### Second minute — Build and reasoning

- Explain the real user evidence.
- Explain why the project solves one narrow journey.
- Show that eligibility and money calculations use deterministic rules.
- Explain where AI helps and where it is deliberately restricted.
- Identify all mocked integrations and data.
- Briefly describe security, scalability, and the production process.
- Explain how Codex was meaningfully used during research, implementation, testing, accessibility work, and iteration.

## 15. Judging alignment

- **Problem:** Retirement savings can be blocked by a correctable historical record and an unresponsive former employer.
- **Working build:** Reviewers can complete diagnosis, correction, escalation, reconciliation, and transfer.
- **Usability:** Complex EPS records become understandable and actionable.
- **Product thinking:** The solution addresses anxiety, ownership, evidence, deadlines, and failure recovery.
- **End-to-end thinking:** It redesigns the process across citizen, employer, EPFO, grievance, and ledger systems.
- **Honesty:** All accounts, documents, OTPs, responses, balances, integrations, and transfers are explicitly synthetic.

## 16. Evidence and starting references

- Hackathon brief: https://buildwhatmovesindia.com/brief
- EPFO FAQ: https://www.epfindia.gov.in/site_en/FAQ.php
- EPFO Citizen Charter: https://www.epfindia.gov.in/site_docs/PDFs/MiscPDFs/CitizenCharter.pdf
- EPFO Joint Declaration SOP: https://www.epfindia.gov.in/site_docs/PDFs/Circulars/Y2024-2025/Circular_WSU_01082024.pdf
- Resolved transfer story: https://www.reddit.com/r/epfoindia/comments/1udcnir/
- Long-running unresolved correction story: https://www.reddit.com/r/epfoindia/comments/1utkjtj/
- EPFO complaint discussion: https://www.reddit.com/r/epfoindia/comments/1utp4vr/

Reddit posts are problem-discovery evidence, not authoritative policy sources.

## 17. Definition of done

The project is ready when:

- a reviewer can complete the main journey without assistance;
- the story is understandable within the first 15 seconds;
- every important amount and decision can be explained;
- the prototype works on a mobile browser;
- no real sensitive data or live government access is used;
- mocked behavior is clearly identified;
- the deployed link works without requesting access;
- the two-minute video stays within the limit; and
- the project summary is under 250 words.
