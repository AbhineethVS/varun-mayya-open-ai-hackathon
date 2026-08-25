"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Bot, Check, CheckCircle2, ChevronDown, CircleHelp, Clock3, Download, FileText, Landmark, Languages, LoaderCircle, LockKeyhole, Menu, RefreshCcw, Scale, Send, ShieldCheck, Sparkles, X } from "lucide-react";
import { CASE_ID, createDemoCase, DemoCase, EVIDENCE, EvidenceId, formatRupees, hasRequiredEvidence, LEDGER, nextStatus, TimelineEvent, WORKFLOW_STEPS } from "@/lib/domain";
import { copy, Locale, locales } from "@/lib/locales";
import { bootstrapCase, persistAiArtifact, persistCase } from "@/lib/case-persistence";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

const STORAGE_KEY = "epfo-resolve-case-v1";
const DEMO_UAN = "1000 2000 3000";
const DEMO_OTP = "123456";
type AiKind = "explain" | "draft" | "translate";
type ConfirmAction = { label: string; description: string; action: () => void };

const eventFor = (id: string, title: string, description: string, actor: TimelineEvent["actor"], tone: TimelineEvent["tone"]): TimelineEvent => ({ id, date: "22 Aug 2026", title, description, actor, tone });

function journeyStage(status: DemoCase["status"]) {
  if (status === "transfer_failed") return 1;
  if (status === "diagnosed" || status === "evidence_ready") return 2;
  if (status === "correction_submitted" || status === "employer_overdue") return 3;
  if (status === "escalated") return 4;
  return 5;
}

function nextStep(status: DemoCase["status"]) {
  const steps: Record<DemoCase["status"], string> = {
    transfer_failed: "Review the EPS mismatch",
    diagnosed: "Select the required fictional evidence",
    evidence_ready: "Submit the correction request",
    correction_submitted: "Wait for the proposed response target",
    employer_overdue: "Open the fictional RPFC review",
    escalated: "Reconcile the protected balance",
    reconciled: "Complete the fictional transfer",
    transfer_completed: "Download the summary or reset the demo",
  };
  return steps[status];
}

export function DemoClient() {
  const [locale, setLocale] = useState<Locale>("en");
  const [caseData, setCaseData] = useState<DemoCase>(() => createDemoCase());
  const [loggedIn, setLoggedIn] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [uan, setUan] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [aiText, setAiText] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [loginBusy, setLoginBusy] = useState(false);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [docPreview, setDocPreview] = useState<EvidenceId | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [remoteCaseId, setRemoteCaseId] = useState<string | null>(null);
  const [persistence, setPersistence] = useState<"local" | "syncing" | "cloud" | "offline">("local");
  const [announcement, setAnnouncement] = useState("The fictional Ananya Rao case is ready to review.");
  const t = copy[locale];

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as DemoCase;
      const timer = window.setTimeout(() => {
        setCaseData(parsed);
        setLocale((parsed.locale in locales ? parsed.locale : "en") as Locale);
      }, 0);
      return () => window.clearTimeout(timer);
    } catch { window.localStorage.removeItem(STORAGE_KEY); }
  }, []);

  useEffect(() => { if (loggedIn) window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...caseData, locale })); }, [caseData, locale, loggedIn]);
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);

  useEffect(() => {
    if (!loggedIn) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    let active = true;
    const timer = window.setTimeout(() => setPersistence("syncing"), 0);
    void bootstrapCase(supabase, caseData).then((result) => {
      if (!active) return;
      window.setTimeout(() => {
        if (!active) return;
        setRemoteCaseId(result.remoteId);
        setCaseData(result.caseData);
        setLocale((result.caseData.locale in locales ? result.caseData.locale : "en") as Locale);
        setPersistence("cloud");
      }, 0);
    }).catch(() => { if (active) window.setTimeout(() => active && setPersistence("offline"), 0); });
    return () => { active = false; window.clearTimeout(timer); };
    // The anonymous cloud case is bootstrapped once per mock login.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn]);

  useEffect(() => {
    if (!loggedIn || !remoteCaseId) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const timer = window.setTimeout(() => {
      void persistCase(supabase, remoteCaseId, { ...caseData, locale })
        .then(() => window.setTimeout(() => setPersistence("cloud"), 0))
        .catch(() => window.setTimeout(() => setPersistence("offline"), 0));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [caseData, locale, loggedIn, remoteCaseId]);

  const updateCase = (updater: (previous: DemoCase) => DemoCase) => setCaseData((previous) => updater(previous));
  const requiredSelected = hasRequiredEvidence(caseData);
  const statusIndex = WORKFLOW_STEPS.indexOf(caseData.status);
  const stage = journeyStage(caseData.status);
  const progress = stage * 20;

  function reset() {
    const fresh = createDemoCase(locale);
    setCaseData(fresh);
    setAiText(null);
    setMenuOpen(false);
    setAnnouncement("The fictional case was reset to the transfer review.");
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  }

  async function login() {
    if (uan.replace(/\s/g, "") !== DEMO_UAN.replace(/\s/g, "")) { setError("Use the displayed fictional UAN to continue."); return; }
    if (!otpSent) {
      setOtpSent(true);
      setError("");
      setAnnouncement("A fictional one-time password is now displayed. Enter 123456 to continue.");
      return;
    }
    if (otp !== DEMO_OTP) { setError("Use the displayed fictional demo code."); return; }
    setLoginBusy(true);
    setError("");
    try {
      await ensureDemoSession();
      setLoggedIn(true);
      setAnnouncement("Private synthetic demo session created. The transfer dashboard is ready.");
    } catch {
      setError("We could not create the private demo session. Confirm Anonymous Sign-Ins is enabled in Supabase, then try again.");
    } finally { setLoginBusy(false); }
  }

  function transition(action: Parameters<typeof nextStatus>[1], event: TimelineEvent) {
    updateCase((previous) => ({ ...previous, status: nextStatus(previous.status, action), events: [...previous.events, event] }));
    setAnnouncement(`${event.title}. ${event.description}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleEvidence(id: EvidenceId) {
    updateCase((previous) => ({
      ...previous,
      selectedEvidence: previous.selectedEvidence.includes(id) ? previous.selectedEvidence.filter((item) => item !== id) : [...previous.selectedEvidence, id],
    }));
  }

  async function askAi(kind: AiKind) {
    setAiBusy(true);
    setAiText(null);
    try {
      const response = await fetch("/api/ai", { method: "POST", headers: await requestHeaders(), body: JSON.stringify({ kind, locale, caseId: CASE_ID }) });
      if (!response.ok) throw new Error("AI assistance unavailable");
      const payload = await response.json() as { text: string; source: string; reason?: "missing_api_key" | "provider_error" | "session_pending" };
      const sourceNote = payload.source === "fallback"
        ? payload.reason === "missing_api_key"
          ? "Shown from the built-in safe fallback because OPENAI_API_KEY is not configured in this Vercel deployment."
          : payload.reason === "session_pending"
            ? "Shown from the built-in safe fallback while the private demo session is being prepared. Try the live AI action again in a moment."
            : "Shown from the built-in safe fallback because the configured OpenAI request did not complete. Check the Vercel Runtime Logs for the provider error."
        : "Generated from the configured AI service.";
      setAiText(`${payload.text}\n\n${sourceNote}`);
      setAnnouncement("An optional AI explanation is ready.");
      const supabase = getSupabaseBrowserClient();
      if (supabase && remoteCaseId && (payload.source === "live" || payload.source === "fallback")) {
        void persistAiArtifact(supabase, remoteCaseId, kind, payload.source, payload.text);
      }
    } catch {
      setAiText("The optional AI assistant is unavailable. The verified explanation and workflow remain available.");
      setAnnouncement("The optional AI assistant is unavailable. The verified workflow remains available.");
    } finally { setAiBusy(false); }
  }

  async function downloadSummary() {
    setDownloadBusy(true);
    try {
      const response = await fetch("/api/resolution", { method: "POST", headers: await requestHeaders(), body: JSON.stringify({ caseData }) });
      if (!response.ok) throw new Error("PDF unavailable");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "epfo-resolve-ananya-rao.pdf";
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setAnnouncement("Your synthetic resolution summary is downloading.");
    } catch {
      setAiText("The downloadable synthetic summary is temporarily unavailable. Please try again.");
      setAnnouncement("The synthetic summary could not be generated. Please try again.");
    } finally { setDownloadBusy(false); }
  }

  async function requestHeaders() {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return headers;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) return { ...headers, Authorization: `Bearer ${data.session.access_token}` };
      await new Promise((resolve) => window.setTimeout(resolve, 250));
    }
    return headers;
  }

  async function ensureDemoSession() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { data: existing } = await supabase.auth.getSession();
    if (existing.session) return;
    const { error: signInError } = await supabase.auth.signInAnonymously();
    if (signInError) throw signInError;
  }

  if (!loggedIn) return <LoginScreen locale={locale} setLocale={setLocale} t={t} uan={uan} setUan={setUan} otp={otp} setOtp={setOtp} otpSent={otpSent} login={login} loginBusy={loginBusy} error={error} />;

  return <main className="app-shell">
    <header className="app-header">
      <Link href="/" className="brand"><span className="brand-mark">R</span><span>EPFO Resolve</span></Link>
      <div className="header-right"><span className="hide-mobile prototype-label">{persistence === "cloud" ? "Private demo session saved" : persistence === "syncing" ? "Saving demo session…" : persistence === "offline" ? "Saved in this browser" : t.synthetic}</span><button className="icon-button" type="button" aria-label="Open case options" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><Menu size={20} /></button></div>
    </header>
    {menuOpen && <div className="menu-popover"><LocalePicker locale={locale} setLocale={setLocale} compact /><button type="button" onClick={reset}><RefreshCcw size={15} /> {t.reset}</button></div>}
    <div className="prototype-banner"><ShieldCheck size={16} /><span>{t.notOfficial}. All records and actions below are fictional.</span></div>
    <div className="progress-wrap" aria-label={`Case progress: stage ${stage} of 5`}><div className="progress-meta"><span>Case journey · stage {stage} of 5</span><span>{progress}%</span></div><div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><div style={{ width: `${progress}%` }} /></div><p className="next-step"><strong>Next:</strong> {nextStep(caseData.status)}</p></div>
    <div className="app-content">
      <aside className="side-rail"><CaseIdentity /><nav className="side-nav" aria-label="Case journey"><NavItem label="Transfer" active /><NavItem label="Diagnosis" active={statusIndex >= 1} /><NavItem label="Evidence" active={statusIndex >= 2} /><NavItem label="Resolution" active={statusIndex >= 5} /></nav><button className="text-button" type="button" onClick={reset}><RefreshCcw size={15} /> {t.reset}</button></aside>
      <section className="main-panel panel-enter" key={caseData.status} aria-label="Current case step">
        {caseData.status === "transfer_failed" && <Dashboard t={t} onContinue={() => transition("diagnose", eventFor("diagnosed", "Mismatch explained", "The EPS conflict is now explained in plain language with the source used for this fictional assessment.", "EPFO Resolve", "accent"))} />}
        {caseData.status === "diagnosed" && <Diagnosis t={t} onContinue={() => transition("save_evidence", eventFor("evidence-ready", "Evidence checklist opened", "The required fictional documents are ready to review and attach to this case.", "EPFO Resolve", "neutral"))} onAi={askAi} aiBusy={aiBusy} aiText={aiText} onDismissAi={() => setAiText(null)} />}
        {caseData.status === "evidence_ready" && <EvidenceScreen t={t} selected={caseData.selectedEvidence} requiredSelected={requiredSelected} onToggle={toggleEvidence} onPreview={setDocPreview} onContinue={() => transition("submit", eventFor("submitted", "Correction request submitted", "A complete simulated correction request was sent to Northstar Services with a proposed seven-business-day response target.", "You", "accent"))} />}
        {caseData.status === "correction_submitted" && <TimelineScreen t={t} caseData={caseData} title="Request sent. Northstar now owns the next action." detail="The response target shown below is a proposed product deadline, not an EPFO statutory employer SLA." actionLabel="Simulate missed deadline" onActionRequested={() => setConfirmAction({ label: "Simulate missed deadline", description: "This will instantly move the fictional timeline past the proposed seven-business-day target. It will not contact Northstar Services or EPFO.", action: () => transition("expire", eventFor("overdue", "Employer deadline missed", "Northstar did not respond by the proposed deadline. Your case and evidence remain intact.", "Northstar Services", "warning")) })} />}
        {caseData.status === "employer_overdue" && <TimelineScreen t={t} caseData={caseData} title="The former employer did not respond." detail="EPFO Resolve proposes a direct RPFC review route rather than asking you to begin another grievance from scratch." actionLabel="Escalate to simulated RPFC review" onActionRequested={() => setConfirmAction({ label: "Open simulated RPFC review", description: "This will create the next fictional audit event using the evidence already selected. It will not submit a real grievance or contact EPFO.", action: () => transition("escalate", eventFor("escalated", "Proposed RPFC review opened", "The fictional EPFO review path received the same correction request, evidence and event history.", "RPFC review", "accent")) })} />}
        {caseData.status === "escalated" && <Reconciliation onContinue={() => transition("reconcile", eventFor("reconciled", "Ledger reconciled", "The incorrect simulated EPS diversion was reclassified to EPF. The total balance is unchanged.", "RPFC review", "success"))} />}
        {caseData.status === "reconciled" && <Success t={t} caseData={caseData} onComplete={() => transition("complete", eventFor("completed", "Transfer completed", "The fictional old account is now zero and the full reconciled amount appears under Riverline Technologies.", "EPFO Resolve", "success"))} onDownload={downloadSummary} downloadBusy={downloadBusy} />}
        {caseData.status === "transfer_completed" && <Success t={t} caseData={caseData} complete onDownload={downloadSummary} downloadBusy={downloadBusy} />}
      </section>
    </div>
    <p className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</p>
    {docPreview && <DocumentPreview item={EVIDENCE.find((item) => item.id === docPreview)!} close={() => setDocPreview(null)} />}
    {confirmAction && <ConfirmationDialog label={confirmAction.label} description={confirmAction.description} onCancel={() => setConfirmAction(null)} onConfirm={() => { confirmAction.action(); setConfirmAction(null); }} />}
  </main>;
}

function LoginScreen({ locale, setLocale, t, uan, setUan, otp, setOtp, otpSent, login, loginBusy, error }: { locale: Locale; setLocale: (value: Locale) => void; t: typeof copy.en; uan: string; setUan: (value: string) => void; otp: string; setOtp: (value: string) => void; otpSent: boolean; login: () => Promise<void>; loginBusy: boolean; error: string }) {
  const otpRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (otpSent) otpRef.current?.focus(); }, [otpSent]);
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); void login(); };
  const submitOnEnter = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void login();
    }
  };
  return <main className="login-shell">
    <header className="app-header"><Link href="/" className="brand"><span className="brand-mark">R</span><span>EPFO Resolve</span></Link><LocalePicker locale={locale} setLocale={setLocale} /></header>
    <section className="login-card" aria-labelledby="mock-login-title">
      <div className="icon-orb"><LockKeyhole size={25} /></div>
      <div className="eyebrow">{t.synthetic}</div>
      <h1 id="mock-login-title">Open Ananya’s fictional case</h1>
      <p>This is a mock sign-in. It creates an isolated demo session; it does not verify a real identity.</p>
      <div className="demo-credentials"><span>Fictional UAN</span><strong>{DEMO_UAN}</strong>{otpSent && <><span>Fictional OTP</span><strong>{DEMO_OTP}</strong></>}</div>
      <form onSubmit={submit} noValidate>
        <label htmlFor="demo-uan">UAN <input id="demo-uan" autoComplete="off" inputMode="numeric" placeholder="Enter fictional UAN" value={uan} onChange={(event) => setUan(event.target.value)} onKeyDown={submitOnEnter} aria-invalid={Boolean(error)} aria-describedby={error ? "mock-login-error" : undefined} /></label>
        {otpSent && <label htmlFor="demo-otp">One-time password <input ref={otpRef} id="demo-otp" autoComplete="one-time-code" inputMode="numeric" placeholder="Enter fictional OTP" value={otp} onChange={(event) => setOtp(event.target.value)} onKeyDown={submitOnEnter} aria-invalid={Boolean(error)} aria-describedby={error ? "mock-login-error" : undefined} /></label>}
        {error && <p id="mock-login-error" className="form-error" role="alert"><AlertTriangle size={16} />{error}</p>}
        <button className="button primary full" type="submit" disabled={loginBusy}>{loginBusy ? <><LoaderCircle className="spin" size={17} /> Creating private demo session…</> : otpSent ? <>Verify and continue <ArrowRight size={17} /></> : <>Send fictional OTP <ArrowRight size={17} /></>}</button>
      </form>
      <p className="small-note"><ShieldCheck size={15} /> Press Enter to send the fictional OTP or verify it. Do not enter real UAN, Aadhaar, PAN, OTP, bank, or employer details.</p>
    </section>
  </main>;
}

function Dashboard({ t, onContinue }: { t: typeof copy.en; onContinue: () => void }) {
  return <><div className="page-heading"><div><div className="eyebrow">Stage 1 of 5 · Ananya Rao · Case ER-2026-0812</div><h1>{t.dashboard}</h1><p>One transfer. One historical record conflict. One complete correction trail.</p></div><span className="status-chip warning"><AlertTriangle size={15} /> Transfer needs correction</span></div><div className="money-safe"><ShieldCheck size={22} /><div><strong>Your simulated balance is not missing.</strong><span>{t.safety}</span></div></div><div className="summary-grid"><InfoCard label="Previous account" value="Northstar Services" detail="Member ID: SYN/NS/1427" /><InfoCard label="Current account" value="Riverline Technologies" detail="Member ID: SYN/RL/9881" /><InfoCard label="Transfer amount" value={formatRupees(LEDGER.total)} detail="Submitted: 12 Aug 2026" /><InfoCard label={t.currentOwner} value="You" detail="Review the diagnosed mismatch" /></div><section className="feature-card"><div><div className="mini-label">Why the transfer stopped</div><h2>Previous EPS information conflicts with the employment record.</h2><p>We found a simulated EPS enrollment for a first-time post-2014 membership with ₹18,500 Basic + DA. The issue is correctable; the next step is to review the fields and evidence.</p></div><button className="button primary" type="button" onClick={onContinue}>See the diagnosis <ArrowRight size={17} /></button></section></>;
}

function Diagnosis({ t, onContinue, onAi, aiBusy, aiText, onDismissAi }: { t: typeof copy.en; onContinue: () => void; onAi: (kind: AiKind) => void; aiBusy: boolean; aiText: string | null; onDismissAi: () => void }) {
  const rows = [["Joining date", "04 Jan 2017", "04 Jan 2017", false], ["Basic + DA at joining", formatRupees(18500), formatRupees(18500), false], ["Prior EPS membership", "No", "No", false], ["EPS membership recorded", "Should not be recorded", "Recorded as active", true], ["EPS contribution", "Retain in EPF", "₹48,200 diverted to EPS", true]] as const;
  return <>
    <div className="page-heading">
      <div><div className="eyebrow">Stage 2 of 5 · Deterministic diagnosis</div><h1>Here’s the mismatch in plain language.</h1><p>The fictional former employer recorded Ananya as an EPS member even though the case’s starting facts conflict with that entry.</p></div>
    </div>
    <section className="decision-card"><div className="decision-icon"><Scale size={24} /></div><div><span className="mini-label">What the case engine found</span><h2>Correct the historical EPS record, then let the PF transfer continue.</h2><p>This conclusion comes from fixed case facts—not AI. The app does not make a legal decision for a real person.</p><a href="https://www.epfindia.gov.in/site_en/FAQ.php" target="_blank" rel="noreferrer">View EPFO FAQ source <ArrowRight size={14} /></a></div></section>
    <section className="card">
      <div className="card-header"><div><h2>Record comparison</h2><p>Only the fields behind this fictional rejection are highlighted.</p></div><span className="source-pill">EPFO FAQ cited</span></div>
      <div className="comparison-table-wrap"><table><caption className="sr-only">Expected and recorded values in Ananya’s fictional employment record</caption><thead><tr><th scope="col">Field</th><th scope="col">Expected from case facts</th><th scope="col">Recorded by former employer</th><th scope="col"><span className="sr-only">Result</span></th></tr></thead><tbody>{rows.map(([field, expected, recorded, conflict]) => <tr className={conflict ? "conflict" : undefined} key={field}><th scope="row">{field}</th><td>{expected}</td><td>{recorded}</td><td>{conflict ? <><AlertTriangle size={18} aria-hidden="true" /><span className="sr-only">Mismatch</span></> : <><CheckCircle2 size={18} aria-hidden="true" /><span className="sr-only">Matches</span></>}</td></tr>)}</tbody></table></div>
      <p className="comparison-note"><strong>Why this stops the transfer:</strong> the historical EPS field and EPS diversion must be corrected before this fictional Form 13 transfer can continue.</p>
    </section>
    <section className="ai-actions"><div><span className="mini-label">Optional AI assistance</span><h2>AI explains verified facts; it never decides the rule.</h2></div><div><button className="button secondary" type="button" onClick={() => onAi("explain")} disabled={aiBusy}><Bot size={17} /> Explain simply</button><button className="button secondary" type="button" onClick={() => onAi("draft")} disabled={aiBusy}><FileText size={17} /> Draft request</button><button className="button secondary" type="button" onClick={() => onAi("translate")} disabled={aiBusy}><Languages size={17} /> Translate context</button></div></section>
    <div className="inline-actions"><button className="button primary" type="button" onClick={onContinue}>{t.next}: review evidence <ArrowRight size={17} /></button></div>
    {aiText && <section className="ai-panel" aria-live="polite"><Sparkles size={18} /><p>{aiText}</p><button type="button" onClick={onDismissAi} aria-label="Dismiss AI answer"><X size={16} /></button></section>}
  </>;
}

function EvidenceScreen({ t, selected, requiredSelected, onToggle, onPreview, onContinue }: { t: typeof copy.en; selected: EvidenceId[]; requiredSelected: boolean; onToggle: (id: EvidenceId) => void; onPreview: (id: EvidenceId) => void; onContinue: () => void }) {
  const selectedRequired = selected.filter((id) => EVIDENCE.find((e) => e.id === id)?.required).length;
  return <><div className="page-heading"><div><div className="eyebrow">Stage 2 of 5 · Synthetic evidence only</div><h1>Attach the facts that support the correction.</h1><p>These bundled records are fictional. Real documents are never uploaded, stored, or sent from this prototype.</p></div><span className="status-chip accent">{selectedRequired} / 4 required</span></div><div className="evidence-grid" role="list" aria-label="Fictional evidence checklist">{EVIDENCE.map((item) => { const selectedItem = selected.includes(item.id); return <article className={selectedItem ? "evidence-card selected" : "evidence-card"} key={item.id} role="listitem"><div className="evidence-icon"><FileText size={21} /></div><div className="evidence-main"><div className="evidence-title"><h3>{item.title}</h3>{item.required && <span>Required</span>}</div><p>{item.detail}</p><small>{item.source}</small></div><div className="evidence-actions"><button className="link-button" type="button" onClick={() => onPreview(item.id)}>Preview</button><button className={selectedItem ? "select-toggle selected" : "select-toggle"} type="button" aria-pressed={selectedItem} aria-label={`${selectedItem ? "Remove" : "Include"} ${item.title}`} onClick={() => onToggle(item.id)}>{selectedItem ? <Check size={16} /> : "+"} {selectedItem ? "Included" : "Include"}</button></div></article>; })}</div><section className="sticky-action" aria-live="polite"><div><strong>{selectedRequired} of 4 required items selected</strong><span>{requiredSelected ? "Your correction request has the necessary fictional evidence." : "Select all required items to continue."}</span></div><button className="button primary" type="button" disabled={!requiredSelected} onClick={onContinue}>{t.submit} <Send size={16} /></button></section></>;
}

function TimelineScreen({ t, caseData, title, detail, actionLabel, onActionRequested }: { t: typeof copy.en; caseData: DemoCase; title: string; detail: string; actionLabel: string; onActionRequested: () => void }) {
  return <><div className="page-heading"><div><div className="eyebrow">Stage 3 of 5 · Ownership and deadlines</div><h1>{title}</h1><p>{detail}</p></div><span className="status-chip accent"><Clock3 size={15} /> Case protected</span></div><section className="owner-card"><div className="owner-avatar"><Landmark size={23} /></div><div><span className="mini-label">{t.currentOwner}</span><h2>{caseData.status === "correction_submitted" ? "Northstar Services Pvt. Ltd." : "Simulated RPFC review"}</h2><p>{caseData.status === "correction_submitted" ? "Proposed response target: 02 Sep 2026 · 7 business days" : "The previous request, evidence and timeline were retained without asking the citizen to start over."}</p></div></section><section className="card"><div className="card-header"><div><h2>{t.timeline}</h2><p>Immutable fictional audit history for this demo session.</p></div><span className="source-pill">No live integrations</span></div><ol className="timeline">{caseData.events.map((event) => <li key={event.id}><span className={`timeline-dot ${event.tone}`} /><div><div className="timeline-meta"><span>{event.date}</span><span>{event.actor}</span></div><h3>{event.title}</h3><p>{event.description}</p></div></li>)}</ol></section><section className="demo-control"><CircleHelp size={20} /><div><strong>Demo control</strong><p>This intentionally advances simulated time. It does not contact an employer or EPFO.</p></div><button className="button primary" type="button" onClick={onActionRequested}>{actionLabel} <ArrowRight size={17} /></button></section></>;
}

function Reconciliation({ onContinue }: { onContinue: () => void }) {
  return <><div className="page-heading"><div><div className="eyebrow">Stage 4 of 5 · Reconciliation</div><h1>The entry changed category. The money did not disappear.</h1><p>The fictional EPS amount is moved back to EPF because the historical EPS entry was corrected.</p></div></div><section className="ledger-explainer"><div><span className="mini-label">What changes</span><strong>₹48,200 leaves the EPS column and returns to EPF.</strong></div><div><span className="mini-label">What never changes</span><strong>The total protected balance stays {formatRupees(LEDGER.total)}.</strong></div></section><section className="ledger-flow" aria-label="Before and after synthetic ledger"><LedgerColumn title="Before correction" epf={LEDGER.before.epf} eps={LEDGER.before.eps} /><div className="reclassify"><ArrowRight size={29} /><span>Reclassify<br />{formatRupees(LEDGER.before.eps)}</span></div><LedgerColumn title="After correction" epf={LEDGER.after.epf} eps={LEDGER.after.eps} success /></section><section className="money-safe"><CheckCircle2 size={22} /><div><strong>Total remains {formatRupees(LEDGER.total)}.</strong><span>A negative EPS line is a reclassification in this synthetic ledger, not a loss of retirement money.</span></div></section><div className="inline-actions"><button className="button primary" type="button" onClick={onContinue}>Confirm reconciliation <ArrowRight size={17} /></button></div></>;
}

function Success({ t, caseData, complete, onComplete, onDownload, downloadBusy }: { t: typeof copy.en; caseData: DemoCase; complete?: boolean; onComplete?: () => void; onDownload: () => void; downloadBusy: boolean }) {
  return <section className="success-view"><div className="success-icon"><CheckCircle2 size={38} /></div><div className="eyebrow">Stage 5 of 5 · {complete ? "Resolved" : "Ready to complete"}</div><h1>{complete ? "Your fictional PF transfer is complete." : "The record is corrected. Complete the transfer."}</h1><p>{complete ? "The old synthetic account is now zero. The complete reconciled amount is available in the current account, with the full history preserved." : "The correction and reconciliation are ready. The final simulated transfer will move the complete amount to Riverline Technologies."}</p><div className="success-amount"><span>Amount transferred</span><strong>{formatRupees(LEDGER.total)}</strong><span>Northstar Services → Riverline Technologies</span></div><div className="success-actions">{!complete && onComplete && <button className="button primary" type="button" onClick={onComplete}>{t.complete} <Check size={17} /></button>}<button className="button secondary" type="button" onClick={onDownload} disabled={downloadBusy}>{downloadBusy ? <><LoaderCircle className="spin" size={17} /> Preparing summary…</> : <><Download size={17} /> {t.download}</>}</button></div><section className="card audit-card"><h2>What your summary includes</h2><p>Fictional case facts, evidence selected, source link, the correction rationale, every timeline event, and the ledger explanation.</p><span>{caseData.events.length} immutable events in this demo session</span></section></section>;
}

function LedgerColumn({ title, epf, eps, success }: { title: string; epf: number; eps: number; success?: boolean }) { return <section className={success ? "ledger-card success" : "ledger-card"}><span className="mini-label">{title}</span><div><span>EPF</span><strong>{formatRupees(epf)}</strong></div><div><span>EPS</span><strong>{formatRupees(eps)}</strong></div><footer><span>Total</span><strong>{formatRupees(epf + eps)}</strong></footer></section>; }
function CaseIdentity() { return <div className="case-identity"><div className="avatar">AR</div><div><strong>Ananya Rao</strong><span>ER-2026-0812</span></div></div>; }
function NavItem({ label, active }: { label: string; active?: boolean }) { return <div className={active ? "nav-item active" : "nav-item"} aria-current={active ? "step" : undefined}>{active ? <Check size={15} /> : <span />} {label}</div>; }
function InfoCard({ label, value, detail }: { label: string; value: string; detail: string }) { return <article className="info-card"><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>; }
function LocalePicker({ locale, setLocale, compact = false }: { locale: Locale; setLocale: (value: Locale) => void; compact?: boolean }) { return <label className={compact ? "locale-picker compact" : "locale-picker"}><Languages size={17} /><span className="sr-only">Language</span><select value={locale} aria-label="Language" onChange={(event) => setLocale(event.target.value as Locale)}>{Object.entries(locales).map(([code, item]) => <option key={code} value={code}>{item.native}</option>)}</select><ChevronDown size={14} /></label>; }

function DocumentPreview({ item, close }: { item: (typeof EVIDENCE)[number]; close: () => void }) {
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    window.addEventListener("keydown", onKeyDown);
    closeButton.current?.focus();
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close]);
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}><div className="document-modal" role="dialog" aria-modal="true" aria-labelledby="document-preview-title"><button ref={closeButton} className="icon-button close" type="button" aria-label="Close preview" onClick={close}><X size={20} /></button><div className="document-sheet"><span className="document-watermark">SYNTHETIC</span><span className="mini-label">EPFO Resolve evidence preview</span><h2 id="document-preview-title">{item.title}</h2><p><strong>Employee:</strong> Ananya Rao</p><p>{item.detail}</p><hr /><p>This is a bundled fictional document for a hackathon prototype. It contains no real personal, employment or financial information.</p></div></div></div>;
}

function ConfirmationDialog({ label, description, onCancel, onConfirm }: { label: string; description: string; onCancel: () => void; onConfirm: () => void }) {
  const cancelButton = useRef<HTMLButtonElement>(null);
  useEffect(() => { cancelButton.current?.focus(); }, []);
  return <div className="modal-backdrop" role="presentation"><section className="confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-action-title"><span className="mini-label">Confirm synthetic action</span><h2 id="confirm-action-title">{label}?</h2><p>{description}</p><div className="confirmation-actions"><button className="button secondary" type="button" ref={cancelButton} onClick={onCancel}>Keep reviewing</button><button className="button primary" type="button" onClick={onConfirm}>Continue simulation <ArrowRight size={17} /></button></div></section></div>;
}
