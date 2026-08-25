import { z } from "zod";
import { DemoCase, EVIDENCE, EvidenceId, hasRequiredEvidence, nextStatus, REQUIRED_EVIDENCE, TimelineEvent } from "./domain";

export const evidenceIdSchema = z.enum(["appointment", "payslips", "service", "passbook", "form3a", "email"]);
export const caseStatusSchema = z.enum(["transfer_failed", "diagnosed", "evidence_ready", "correction_submitted", "employer_overdue", "escalated", "reconciled", "transfer_completed"]);
export const timelineEventSchema = z.object({
  id: z.string(), date: z.string(), title: z.string(), description: z.string(),
  actor: z.enum(["You", "Northstar Services", "EPFO Resolve", "RPFC review"]),
  tone: z.enum(["neutral", "warning", "success", "accent"]),
});
export const demoCaseSchema = z.object({
  id: z.literal("epfo-demo-ananya"), status: caseStatusSchema, selectedEvidence: z.array(evidenceIdSchema),
  locale: z.string(), submittedAt: z.string().optional(), events: z.array(timelineEventSchema),
});

export const workflowActionSchema = z.enum(["diagnose", "save_evidence", "select_evidence", "prepare_submit", "submit", "expire", "escalate", "reconcile", "complete"]);
export type WorkflowAction = z.infer<typeof workflowActionSchema>;

const events: Partial<Record<WorkflowAction, TimelineEvent>> = {
  diagnose: event("diagnosed", "Mismatch explained", "The EPS conflict is now explained in plain language with the source used for this fictional assessment.", "EPFO Resolve", "accent"),
  save_evidence: event("evidence-ready", "Evidence checklist opened", "The required fictional documents are ready to review and attach to this case.", "EPFO Resolve", "neutral"),
  submit: event("submitted", "Correction request submitted", "A complete simulated correction request was sent to Northstar Services with a proposed seven-business-day response target.", "You", "accent"),
  expire: event("overdue", "Employer deadline missed", "Northstar did not respond by the proposed deadline. Your case and evidence remain intact.", "Northstar Services", "warning"),
  escalate: event("escalated", "Proposed RPFC review opened", "The fictional EPFO review path received the same correction request, evidence and event history.", "RPFC review", "accent"),
  reconcile: event("reconciled", "Ledger reconciled", "The incorrect simulated EPS diversion was reclassified to EPF. The total balance is unchanged.", "RPFC review", "success"),
  complete: event("completed", "Transfer completed", "The fictional old account is now zero and the full reconciled amount appears under Riverline Technologies.", "EPFO Resolve", "success"),
};

function event(id: string, title: string, description: string, actor: TimelineEvent["actor"], tone: TimelineEvent["tone"]): TimelineEvent {
  return { id, date: "22 Aug 2026", title, description, actor, tone };
}

export function applyWorkflowAction(caseData: DemoCase, action: WorkflowAction, evidenceIds?: EvidenceId[]): DemoCase {
  if (action === "prepare_submit") {
    let prepared = caseData;
    if (prepared.status === "transfer_failed") prepared = applyWorkflowAction(prepared, "diagnose");
    if (prepared.status === "diagnosed") prepared = applyWorkflowAction(prepared, "save_evidence");
    if (prepared.status === "evidence_ready") prepared = applyWorkflowAction(prepared, "select_evidence", evidenceIds?.length ? evidenceIds : REQUIRED_EVIDENCE);
    if (prepared.status === "evidence_ready") return applyWorkflowAction(prepared, "submit");
    throw new Error("The fictional correction request is already beyond the submission stage.");
  }
  if (action === "select_evidence") {
    if (caseData.status !== "evidence_ready" && caseData.status !== "diagnosed") throw new Error("Evidence can only be selected during the evidence step.");
    const selectedEvidence = [...new Set(evidenceIds ?? [])].filter((id) => EVIDENCE.some((item) => item.id === id));
    if (caseData.status === "diagnosed") return { ...caseData, status: "evidence_ready", selectedEvidence, events: [...caseData.events, events.save_evidence!] };
    return { ...caseData, selectedEvidence };
  }
  if (action === "submit" && !hasRequiredEvidence(caseData)) throw new Error("Select all required fictional evidence before submitting.");
  const status = nextStatus(caseData.status, action);
  const auditEvent = events[action];
  if (!auditEvent) throw new Error("This workflow action has no audit event.");
  return { ...caseData, status, events: [...caseData.events, auditEvent] };
}
