import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, FileText, Landmark, Scale, ShieldCheck } from "lucide-react";
import { ELIGIBILITY, EVIDENCE, formatRupees, LEDGER, REQUIRED_EVIDENCE, WORKFLOW_STEPS } from "@/lib/domain";

export const metadata: Metadata = {
  title: "Full synthetic case review",
  description: "A public, readable walkthrough of EPFO Resolve's synthetic EPS correction and PF transfer journey.",
  alternates: { canonical: "/review" },
};

const comparison = [
  ["Joining date", ELIGIBILITY.joiningDate, ELIGIBILITY.joiningDate, false],
  ["Basic + DA at joining", formatRupees(ELIGIBILITY.basicAndDa), formatRupees(ELIGIBILITY.basicAndDa), false],
  ["Prior EPS membership", "No", "No", false],
  ["EPS membership recorded", "Should not be recorded", "Recorded as active", true],
  ["EPS contribution", "Retain in EPF", formatRupees(LEDGER.before.eps) + " diverted to EPS", true],
] as const;

const workflow = [
  ["Transfer failed", "A Form 13 transfer stops because the previous employment record has contradictory EPS information."],
  ["Diagnosed", "The deterministic case rules identify the precise historical EPS entry that needs correction."],
  ["Evidence ready", "Four fictional supporting records are selected and retained with the correction request."],
  ["Correction submitted", "Northstar Services receives a simulated correction request and a clearly labelled proposed seven-business-day response target."],
  ["Employer overdue", "A labelled demo control simulates the missed response target without contacting any employer or government system."],
  ["Escalated", "The same fictional facts and audit history move to simulated RPFC review; the citizen does not start over."],
  ["Reconciled", "The incorrect EPS diversion is reclassified to EPF while the total balance stays unchanged."],
  ["Transfer completed", "The synthetic old account reaches zero and the reconciled amount appears in the synthetic current account."],
] as const;

export default function ReviewPage() {
  return <main className="review-shell">
    <header className="review-header">
      <Link href="/" className="brand"><span className="brand-mark">R</span><span>EPFO Resolve</span></Link>
      <Link href="/demo" className="button primary">Open interactive demo <ArrowRight size={16} /></Link>
    </header>

    <section className="review-hero" aria-labelledby="review-title">
      <div className="eyebrow">Public evaluator walkthrough · synthetic case ER-2026-0812</div>
      <h1 id="review-title">The entire correction journey, readable without a login.</h1>
      <p>EPFO Resolve is an independent hackathon prototype. This page documents one complete fictional PF transfer correction case so reviewers and automated evaluators can inspect the problem, logic, evidence, workflow, and outcome without interacting with the mock UAN/OTP screen.</p>
      <div className="review-disclosure"><ShieldCheck size={20} /><span><strong>Safety boundary:</strong> every person, account, employer, amount, deadline, document, message, and outcome on this page is fictional. It is not an official EPFO service or legal advice.</span></div>
      <nav className="review-nav" aria-label="Case review sections"><a href="#diagnosis">Diagnosis</a><a href="#evidence">Evidence</a><a href="#workflow">Workflow</a><a href="#ledger">Ledger</a><a href="#outcome">Outcome</a></nav>
    </section>

    <section id="diagnosis" className="review-section" aria-labelledby="diagnosis-title">
      <div className="review-section-title"><Scale size={23} /><div><span className="eyebrow">01 · Deterministic diagnosis</span><h2 id="diagnosis-title">The transfer is blocked by a historical EPS mismatch.</h2></div></div>
      <p className="review-lead">Ananya Rao’s fictional prior employer recorded active EPS membership even though this scenario starts after 1 September 2014, has no earlier EPS membership, and uses {formatRupees(ELIGIBILITY.basicAndDa)} Basic + DA.</p>
      <div className="review-rule"><strong>Case engine conclusion</strong><p>{ELIGIBILITY.conclusion}</p><a href={ELIGIBILITY.sourceUrl} target="_blank" rel="noreferrer">{ELIGIBILITY.sourceLabel} <ArrowRight size={14} /></a></div>
      <div className="review-table-wrap"><table><caption>Fictional record comparison</caption><thead><tr><th scope="col">Field</th><th scope="col">Expected record</th><th scope="col">Recorded record</th><th scope="col">Result</th></tr></thead><tbody>{comparison.map(([field, expected, recorded, conflict]) => <tr className={conflict ? "review-conflict" : ""} key={field}><th scope="row">{field}</th><td>{expected}</td><td>{recorded}</td><td>{conflict ? "Correction needed" : "Matches"}</td></tr>)}</tbody></table></div>
      <p className="review-note">The conclusion is fixed by the case facts. Optional AI can explain, draft, or translate those facts, but cannot decide eligibility, amounts, deadlines, or escalation.</p>
    </section>

    <section id="evidence" className="review-section" aria-labelledby="evidence-title">
      <div className="review-section-title"><FileText size={23} /><div><span className="eyebrow">02 · Fictional evidence</span><h2 id="evidence-title">The correction request has a complete support set.</h2></div></div>
      <p className="review-lead">The live prototype bundles fictional previews only. It does not accept uploads or collect real records.</p>
      <ul className="review-evidence">{EVIDENCE.map((item) => <li key={item.id}><CheckCircle2 size={18} /><div><strong>{item.title}{REQUIRED_EVIDENCE.includes(item.id) ? " · Required" : " · Optional"}</strong><span>{item.detail}</span><small>{item.source}</small></div></li>)}</ul>
    </section>

    <section id="workflow" className="review-section" aria-labelledby="workflow-title">
      <div className="review-section-title"><Landmark size={23} /><div><span className="eyebrow">03 · Ownership and escalation</span><h2 id="workflow-title">One case retains its history from failure to completion.</h2></div></div>
      <p className="review-lead">The application models {WORKFLOW_STEPS.length} validated states. It does not call EPFO, an employer, EPFiGMS, CPGRAMS, or any other external government system.</p>
      <ol className="review-workflow">{workflow.map(([title, description], index) => <li key={title}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{title}</h3><p>{description}</p></div></li>)}</ol>
      <div className="review-callout"><strong>Proposed target, not a statutory promise.</strong><p>The seven-business-day employer response target is an explicit product simulation. The app never presents it as an EPFO SLA or real employer deadline.</p></div>
    </section>

    <section id="ledger" className="review-section" aria-labelledby="ledger-title">
      <div className="review-section-title"><CheckCircle2 size={23} /><div><span className="eyebrow">04 · Ledger explanation</span><h2 id="ledger-title">The entry changes category. The money does not disappear.</h2></div></div>
      <div className="review-ledger"><article><span>Before fictional correction</span><div><b>EPF</b><strong>{formatRupees(LEDGER.before.epf)}</strong></div><div><b>EPS</b><strong>{formatRupees(LEDGER.before.eps)}</strong></div><footer>Total <strong>{formatRupees(LEDGER.total)}</strong></footer></article><div className="review-transfer"><ArrowRight size={28} /><strong>Reclassify {formatRupees(LEDGER.before.eps)}</strong></div><article className="review-ledger-success"><span>After fictional correction</span><div><b>EPF</b><strong>{formatRupees(LEDGER.after.epf)}</strong></div><div><b>EPS</b><strong>{formatRupees(LEDGER.after.eps)}</strong></div><footer>Total <strong>{formatRupees(LEDGER.total)}</strong></footer></article></div>
      <p className="review-note">The total stays {formatRupees(LEDGER.total)} before and after the simulated correction. The negative EPS movement is a synthetic reclassification, not missing retirement money.</p>
    </section>

    <section id="outcome" className="review-outcome" aria-labelledby="outcome-title">
      <div className="eyebrow">05 · Synthetic resolution</div>
      <h2 id="outcome-title">A clear route from blocked transfer to accountable resolution.</h2>
      <p>The final fictional state records the correction, preserves every audit event, completes the transfer to Riverline Technologies, and offers a downloadable synthetic PDF summary.</p>
      <div className="review-outcome-total"><span>Fictional amount transferred</span><strong>{formatRupees(LEDGER.total)}</strong><span>Northstar Services → Riverline Technologies</span></div>
      <div className="review-actions"><Link href="/demo" className="button primary">Try the full interactive demo <ArrowRight size={17} /></Link><Link href="/" className="button secondary">Return to overview</Link></div>
    </section>
  </main>;
}
