import { describe, expect, it } from "vitest";
import { assistantFallback, assistantInstructions, ASSISTANT_SOURCES, trimAssistantHistory } from "../lib/assistant";
import { createDemoCase } from "../lib/domain";
import { supportedUploadType } from "../lib/sarvam-stt";

describe("desktop assistant guardrails", () => {
  it("grounds its prompt in the current synthetic case and official source links", () => {
    const prompt = assistantInstructions("en", createDemoCase());
    expect(prompt).toContain("Current fictional screen: transfer_failed");
    expect(prompt).toContain("₹48,200");
    expect(prompt).toContain(ASSISTANT_SOURCES[0].url);
    expect(prompt).toContain(ASSISTANT_SOURCES[1].url);
    expect(prompt).toContain("Never perform or promise an action");
  });

  it("keeps only the last eight short, non-empty messages", () => {
    const messages = Array.from({ length: 10 }, (_, index) => ({ role: index % 2 ? "assistant" as const : "user" as const, content: index === 1 ? "  " : ` message ${index} ${"x".repeat(1300)}` }));
    const trimmed = trimAssistantHistory(messages);
    expect(trimmed).toHaveLength(8);
    expect(trimmed[0].content.startsWith("message 2")).toBe(true);
    expect(trimmed.every((message) => message.content.length <= 1200)).toBe(true);
  });

  it("uses a deterministic no-action fallback when the provider is unavailable", () => {
    const fallback = assistantFallback(createDemoCase());
    expect(fallback).toContain("fictional transfer is blocked");
    expect(fallback).toContain("EPFO FAQ");
  });

  it("normalizes Android WebM metadata before upload to Sarvam", () => {
    expect(supportedUploadType("audio/webm;codecs=opus")).toBe("audio/webm");
    expect(supportedUploadType("video/webm; codecs=vp8,opus")).toBe("video/webm");
    expect(supportedUploadType("audio/unknown")).toBe("audio/webm");
  });
});
