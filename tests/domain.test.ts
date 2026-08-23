import { describe, expect, it } from "vitest";
import { addBusinessDays, createDemoCase, hasRequiredEvidence, ledgerConservesValue, nextStatus } from "../lib/domain";
import { getFallback } from "../lib/ai";

describe("EPFO Resolve deterministic workflow", () => {
  it("only permits the intended state-machine transitions", () => {
    expect(nextStatus("transfer_failed", "diagnose")).toBe("diagnosed");
    expect(() => nextStatus("transfer_failed", "complete")).toThrow("not allowed");
    expect(nextStatus("escalated", "reconcile")).toBe("reconciled");
  });

  it("requires every required fictional document", () => {
    const caseData = createDemoCase();
    expect(hasRequiredEvidence(caseData)).toBe(false);
    caseData.selectedEvidence = ["appointment", "payslips", "service", "passbook"];
    expect(hasRequiredEvidence(caseData)).toBe(true);
  });

  it("keeps the total balance constant across the simulated reclassification", () => {
    expect(ledgerConservesValue()).toBe(true);
  });

  it("skips weekends when calculating a proposed business-day response target", () => {
    const friday = new Date("2026-08-21T00:00:00Z");
    expect(addBusinessDays(friday, 1).toISOString().slice(0, 10)).toBe("2026-08-24");
  });

  it("always has a deterministic AI fallback", () => {
    expect(getFallback("explain")).toContain("fictional");
    expect(getFallback("draft")).toContain("synthetic");
  });
});
