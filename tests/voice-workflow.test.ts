import { describe, expect, it } from "vitest";
import { createDemoCase } from "../lib/domain";
import { allowedVoiceActions, createVoiceTurn, isVoiceConfirmation, supportedUploadType, VOICE_LOCALES } from "../lib/voice";
import { applyWorkflowAction } from "../lib/workflow";

describe("voice guide guardrails", () => {
  it("maps every curated interface locale to Sarvam's supported India locale", () => {
    expect(VOICE_LOCALES).toEqual({ en: "en-IN", hi: "hi-IN", bn: "bn-IN", gu: "gu-IN", kn: "kn-IN", mr: "mr-IN", ta: "ta-IN", te: "te-IN" });
  });

  it("only exposes the action valid for the current deterministic state", () => {
    expect(allowedVoiceActions(createDemoCase())).toContain("diagnose");
    expect(allowedVoiceActions(createDemoCase())).not.toContain("submit");
  });

  it("recognises an explicit confirmation without treating ordinary questions as approval", () => {
    expect(isVoiceConfirmation("Yes, continue")).toBe(true);
    expect(isVoiceConfirmation("हाँ जी")).toBe(true);
    expect(isVoiceConfirmation("Can you explain this?")).toBe(false);
  });

  it("removes browser-only codec parameters before sending WebM to Sarvam", () => {
    expect(supportedUploadType("audio/webm;codecs=opus")).toBe("audio/webm");
  });

  it("turns a direct submit request into a safe page-aware plan", () => {
    const turn = createVoiceTurn("Please submit this", "en", createDemoCase());
    expect(turn.source).toBe("deterministic");
    expect(turn.proposedAction).toBe("prepare_submission");
    expect(turn.requiresConfirmation).toBe(true);
  });
});

describe("shared workflow endpoint rules", () => {
  it("can open and select the four fictional evidence records through the controlled action", () => {
    const diagnosed = applyWorkflowAction(createDemoCase(), "diagnose");
    const evidence = applyWorkflowAction(diagnosed, "select_evidence", ["appointment", "payslips", "service", "passbook"]);
    expect(evidence.status).toBe("evidence_ready");
    expect(evidence.selectedEvidence).toHaveLength(4);
  });

  it("refuses a submission without the required fictional evidence", () => {
    const evidenceReady = applyWorkflowAction(applyWorkflowAction(createDemoCase(), "diagnose"), "save_evidence");
    expect(() => applyWorkflowAction(evidenceReady, "submit")).toThrow("required fictional evidence");
  });

  it("can safely prepare the complete fictional submission from the first page", () => {
    const submitted = applyWorkflowAction(createDemoCase(), "prepare_submit");
    expect(submitted.status).toBe("correction_submitted");
    expect(submitted.selectedEvidence).toEqual(["appointment", "payslips", "service", "passbook"]);
    expect(submitted.events.map((event) => event.id)).toContain("submitted");
  });
});
