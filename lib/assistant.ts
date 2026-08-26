import { DemoCase, ELIGIBILITY, LEDGER } from "./domain";
import { Locale } from "./locales";

export type AssistantMessage = { role: "user" | "assistant"; content: string };

export const ASSISTANT_SOURCES = [
  { id: "faq", label: "EPFO FAQ", url: "https://www.epfindia.gov.in/site_en/FAQ.php" },
  { id: "charter", label: "EPFO Citizen Charter", url: "https://www.epfindia.gov.in/site_docs/PDFs/MiscPDFs/CitizenCharter.pdf" },
] as const;

const languageNames: Record<Locale, string> = { en: "English", hi: "Hindi", bn: "Bengali", gu: "Gujarati", kn: "Kannada", mr: "Marathi", ta: "Tamil", te: "Telugu" };

export function assistantInstructions(locale: Locale, caseData: DemoCase) {
  const currentStep = {
    transfer_failed: "The transfer is blocked. The next visible step is the diagnosis.",
    diagnosed: "The mismatch is diagnosed. The next visible step is selecting fictional evidence.",
    evidence_ready: "The evidence checklist is open. The next visible step is submitting the fictional correction request.",
    correction_submitted: "The fictional request is submitted. The next visible step is the proposed employer response target.",
    employer_overdue: "The fictional employer missed the proposed target. The next visible step is simulated RPFC review.",
    escalated: "The fictional RPFC review is open. The next visible step is reconciliation.",
    reconciled: "The fictional ledger is reconciled. The next visible step is completing the synthetic transfer.",
    transfer_completed: "The fictional transfer is complete. The next visible step is downloading the synthetic summary.",
  }[caseData.status];
  return `You are Resolve Assistant inside EPFO Resolve, an independent hackathon prototype. Reply in ${languageNames[locale]}. You are not EPFO, an officer, lawyer, or government service. The user is viewing a fictional Ananya Rao PF-transfer correction case. Never claim access to EPFO, an employer, documents, identity, accounts, or a live transfer. Never perform or promise an action; the visible demo controls own all workflow changes.

Current fictional screen: ${caseData.status}. ${currentStep}
Verified synthetic facts only: joining date ${ELIGIBILITY.joiningDate}; Basic + DA ₹${ELIGIBILITY.basicAndDa.toLocaleString("en-IN")}; no prior EPS membership; prior employer's fictional record incorrectly says EPS active; ₹${LEDGER.before.eps.toLocaleString("en-IN")} is reclassified from EPS to EPF; total remains ₹${LEDGER.total.toLocaleString("en-IN")}.

Curated official context available to cite by name and link: EPFO FAQ (${ASSISTANT_SOURCES[0].url}) and EPFO Citizen Charter (${ASSISTANT_SOURCES[1].url}). You may explain the project’s stated EPS context and general process guidance only when supported by those curated materials. For any broader EPFO policy, eligibility, legal, personal, or current-rule question not clearly supported here, say that this prototype cannot verify it and direct the user to the official EPFO sources. Do not invent a policy, deadline, form requirement, or calculation.

Be concise, warm, and practical. Use short paragraphs, no markdown tables. Treat every case amount and event as fictional.`;
}

export function trimAssistantHistory(messages: AssistantMessage[]) {
  return messages.slice(-8).map((message) => ({ role: message.role, content: message.content.trim().slice(0, 1200) })).filter((message) => message.content.length > 0);
}

export function assistantFallback(caseData: DemoCase) {
  const next = {
    transfer_failed: "The fictional transfer is blocked by a contradictory EPS entry. Open the diagnosis to see the verified case facts.",
    diagnosed: "The mismatch is explained. Next, select the four required fictional records in the evidence step.",
    evidence_ready: "The evidence step is ready. Select the required fictional records, then use the visible submit control.",
    correction_submitted: "The fictional correction request is submitted. The visible timeline explains the proposed response target.",
    employer_overdue: "The fictional employer missed the proposed target. Use the visible escalation control to open simulated RPFC review.",
    escalated: "The fictional review is ready to reconcile ₹48,200 from EPS to EPF while preserving the total balance.",
    reconciled: "The fictional record is reconciled. Use the visible control to complete the synthetic transfer.",
    transfer_completed: "The fictional transfer is complete. You can download the synthetic resolution summary from the visible control.",
  }[caseData.status];
  return `${next} For official context, see the EPFO FAQ and Citizen Charter linked below.`;
}
