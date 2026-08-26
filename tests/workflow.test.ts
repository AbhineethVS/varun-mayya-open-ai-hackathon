import { describe, expect, it } from "vitest";
import { createDemoCase } from "../lib/domain";
import { applyWorkflowAction } from "../lib/workflow";

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
});
