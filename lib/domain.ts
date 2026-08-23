export const CASE_ID = "epfo-demo-ananya";

export const WORKFLOW_STEPS = [
  "transfer_failed",
  "diagnosed",
  "evidence_ready",
  "correction_submitted",
  "employer_overdue",
  "escalated",
  "reconciled",
  "transfer_completed",
] as const;

export type CaseStatus = (typeof WORKFLOW_STEPS)[number];
export type EvidenceId = "appointment" | "payslips" | "service" | "passbook" | "form3a" | "email";

export type TimelineEvent = {
  id: string;
  date: string;
  title: string;
  description: string;
  actor: "You" | "Northstar Services" | "EPFO Resolve" | "RPFC review";
  tone: "neutral" | "warning" | "success" | "accent";
};

export type DemoCase = {
  id: string;
  status: CaseStatus;
  selectedEvidence: EvidenceId[];
  locale: string;
  submittedAt?: string;
  events: TimelineEvent[];
};

export const EVIDENCE: Array<{
  id: EvidenceId;
  title: string;
  detail: string;
  source: string;
  required: boolean;
}> = [
  { id: "appointment", title: "Appointment letter", detail: "Confirms Ananya’s joining date and starting Basic + DA.", source: "Fictional document · 1 page", required: true },
  { id: "payslips", title: "First three payslips", detail: "Confirms ₹18,500 Basic + DA at first PF membership.", source: "Fictional documents · 3 pages", required: true },
  { id: "service", title: "Service history", detail: "Shows this was Ananya’s first EPF employment.", source: "Fictional record · 1 page", required: true },
  { id: "passbook", title: "Old passbook", detail: "Shows an EPS diversion that needs reclassification.", source: "Fictional record · 2 pages", required: true },
  { id: "form3a", title: "Form 3A extract", detail: "Supports the contribution-month reconciliation.", source: "Fictional record · 1 page", required: false },
  { id: "email", title: "Employer follow-up", detail: "Shows the correction request was sent to the former employer.", source: "Fictional email · 1 page", required: false },
];

export const REQUIRED_EVIDENCE: EvidenceId[] = ["appointment", "payslips", "service", "passbook"];

export const INITIAL_EVENTS: TimelineEvent[] = [
  { id: "transfer-failed", date: "12 Aug 2026", title: "Form 13 transfer could not continue", description: "The simulated transfer found contradictory EPS information in the previous employment record.", actor: "EPFO Resolve", tone: "warning" },
  { id: "case-opened", date: "22 Aug 2026", title: "Your correction case is ready", description: "We identified the exact field to correct and preserved the fictional transfer history in one case.", actor: "EPFO Resolve", tone: "accent" },
];

export const createDemoCase = (locale = "en"): DemoCase => ({
  id: CASE_ID,
  status: "transfer_failed",
  selectedEvidence: [],
  locale,
  events: INITIAL_EVENTS,
});

export function hasRequiredEvidence(caseData: DemoCase) {
  return REQUIRED_EVIDENCE.every((id) => caseData.selectedEvidence.includes(id));
}

export function nextStatus(current: CaseStatus, action: "diagnose" | "save_evidence" | "submit" | "expire" | "escalate" | "reconcile" | "complete"): CaseStatus {
  const transitions: Record<string, Partial<Record<string, CaseStatus>>> = {
    transfer_failed: { diagnose: "diagnosed" },
    diagnosed: { save_evidence: "evidence_ready" },
    evidence_ready: { submit: "correction_submitted" },
    correction_submitted: { expire: "employer_overdue" },
    employer_overdue: { escalate: "escalated" },
    escalated: { reconcile: "reconciled" },
    reconciled: { complete: "transfer_completed" },
  };
  const candidate = transitions[current]?.[action];
  if (!candidate) throw new Error(`Action ${action} is not allowed from ${current}.`);
  return candidate;
}

export function addBusinessDays(start: Date, days: number) {
  const date = new Date(start);
  let added = 0;
  while (added < days) {
    date.setDate(date.getDate() + 1);
    if (date.getDay() !== 0 && date.getDay() !== 6) added += 1;
  }
  return date;
}

export const ELIGIBILITY = {
  joiningDate: "04 Jan 2017",
  basicAndDa: 18500,
  priorEpsMembership: false,
  recordedEpsMembership: true,
  conclusion: "The simulated record indicates EPS should not have been recorded for this first-time post-2014 membership at this wage level.",
  sourceLabel: "EPFO FAQ · EPS membership after 01 Sep 2014",
  sourceUrl: "https://www.epfindia.gov.in/site_en/FAQ.php",
};

export const LEDGER = {
  total: 984320,
  before: { epf: 936120, eps: 48200 },
  after: { epf: 984320, eps: 0 },
};

export function ledgerConservesValue() {
  return LEDGER.before.epf + LEDGER.before.eps === LEDGER.total && LEDGER.after.epf + LEDGER.after.eps === LEDGER.total;
}

export const formatRupees = (amount: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
