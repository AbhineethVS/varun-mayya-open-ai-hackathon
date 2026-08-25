import { z } from "zod";
import { DemoCase, EVIDENCE, EvidenceId, REQUIRED_EVIDENCE } from "./domain";
import { Locale } from "./locales";

export const VOICE_LOCALES: Record<Locale, string> = { en: "en-IN", hi: "hi-IN", bn: "bn-IN", gu: "gu-IN", kn: "kn-IN", mr: "mr-IN", ta: "ta-IN", te: "te-IN" };
export const voiceIntentSchema = z.enum(["explain", "diagnose", "select_evidence", "submit", "simulate_deadline", "escalate", "reconcile", "complete", "download", "change_locale", "clarify"]);
export type VoiceIntent = z.infer<typeof voiceIntentSchema>;
export type VoiceAction = Exclude<VoiceIntent, "explain" | "clarify" | "change_locale">;

const responseSchema = z.object({
  reply: z.string().min(1).max(900),
  proposedAction: voiceIntentSchema,
  evidenceIds: z.array(z.enum(["appointment", "payslips", "service", "passbook", "form3a", "email"])).max(6).default([]),
  replyLocale: z.enum(["en", "hi", "bn", "gu", "kn", "mr", "ta", "te"]).optional(),
});

export type VoiceTurn = z.infer<typeof responseSchema> & { source: "live" | "fallback"; requiresConfirmation: boolean };

const actionForStatus: Record<DemoCase["status"], VoiceIntent[]> = {
  transfer_failed: ["explain", "diagnose", "clarify", "change_locale"],
  diagnosed: ["explain", "select_evidence", "clarify", "change_locale"],
  evidence_ready: ["explain", "select_evidence", "submit", "clarify", "change_locale"],
  correction_submitted: ["explain", "simulate_deadline", "clarify", "change_locale"],
  employer_overdue: ["explain", "escalate", "clarify", "change_locale"],
  escalated: ["explain", "reconcile", "clarify", "change_locale"],
  reconciled: ["explain", "complete", "download", "clarify", "change_locale"],
  transfer_completed: ["explain", "download", "clarify", "change_locale"],
};

export function allowedVoiceActions(caseData: DemoCase) { return actionForStatus[caseData.status]; }
export function requiresVoiceConfirmation(action: VoiceIntent) { return !["explain", "diagnose", "clarify", "change_locale"].includes(action); }
export function isVoiceConfirmation(text: string) { return /^(?:yes|yeah|yep|sure|okay|ok|go ahead|continue|haan|ha)\b|^(?:हाँ|हां|जी हाँ|हाँ जी)(?:\s|$)/i.test(text.trim()); }

function fallbackTurn(transcript: string, locale: Locale, caseData: DemoCase): VoiceTurn {
  const text = transcript.toLowerCase();
  let proposedAction: VoiceIntent = "explain";
  if (/diagnos|show.*issue|what.*wrong|issue/.test(text)) proposedAction = "diagnose";
  else if (/evidence|document|attach|select/.test(text)) proposedAction = "select_evidence";
  else if (/submit|send.*request/.test(text)) proposedAction = "submit";
  else if (/deadline|overdue|missed/.test(text)) proposedAction = "simulate_deadline";
  else if (/escalat|rpfc/.test(text)) proposedAction = "escalate";
  else if (/reconcil|ledger|balance/.test(text)) proposedAction = "reconcile";
  else if (/complete|transfer/.test(text)) proposedAction = "complete";
  else if (/download|summary|pdf/.test(text)) proposedAction = "download";
  else if (/hindi|bengali|gujarati|kannada|marathi|tamil|telugu|english/.test(text)) proposedAction = "change_locale";
  if (!allowedVoiceActions(caseData).includes(proposedAction)) proposedAction = "clarify";
  const reply = proposedAction === "diagnose"
    ? "I can open the diagnosis. The synthetic record says EPS was active, even though Ananya’s first membership began after September 2014 with Basic plus DA of ₹18,500 and no earlier EPS membership."
    : proposedAction === "select_evidence"
      ? "The case needs four fictional records: the appointment letter, first three payslips, service history, and old passbook. I can select those for this synthetic request."
      : proposedAction === "submit"
        ? "I can submit the fictional correction request once the four required synthetic records are selected. Would you like me to continue?"
        : proposedAction === "reconcile"
          ? "I can reconcile the fictional ledger. ₹48,200 moves from EPS back to EPF, while the total remains ₹9,84,320. Would you like me to continue?"
          : proposedAction === "complete"
            ? "I can complete the final fictional transfer. Would you like me to continue?"
            : proposedAction === "download"
              ? "I can prepare the synthetic resolution summary as a PDF. Would you like me to continue?"
              : proposedAction === "simulate_deadline"
                ? "I can instantly simulate the proposed seven-business-day deadline being missed. This never contacts an employer or EPFO. Would you like me to continue?"
                : proposedAction === "escalate"
                  ? "I can open the fictional RPFC review with the existing synthetic evidence. This does not create a real grievance. Would you like me to continue?"
                  : proposedAction === "change_locale"
                    ? "I can change the interface language when you name one of the eight supported languages."
                    : "This is a synthetic case guide, not an EPFO officer. Ask what the issue is, ask me to show the diagnosis, select evidence, or guide you to the next fictional step.";
  return { reply, proposedAction, evidenceIds: proposedAction === "select_evidence" ? REQUIRED_EVIDENCE : [], replyLocale: locale, source: "fallback", requiresConfirmation: requiresVoiceConfirmation(proposedAction) };
}

function caseContext(caseData: DemoCase) {
  return {
    status: caseData.status,
    selectedEvidence: caseData.selectedEvidence,
    permittedActions: allowedVoiceActions(caseData),
    facts: "Synthetic Ananya Rao case only: first EPF membership 04 Jan 2017; Basic + DA ₹18,500; no prior EPS membership; old employer incorrectly recorded EPS active; ₹48,200 is reclassified from EPS to EPF; total stays ₹9,84,320.",
    evidence: EVIDENCE.map((item) => ({ id: item.id, title: item.title, required: item.required })),
  };
}

export async function createVoiceTurn(transcript: string, locale: Locale, caseData: DemoCase): Promise<VoiceTurn> {
  if (!process.env.SARVAM_API_KEY) return fallbackTurn(transcript, locale, caseData);
  try {
    const response = await fetch("https://api.sarvam.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-subscription-key": process.env.SARVAM_API_KEY },
      body: JSON.stringify({
        model: process.env.SARVAM_CHAT_MODEL || "sarvam-105b-conversations",
        temperature: 0.2, reasoning_effort: null, max_tokens: 260,
        response_format: { type: "json_schema", json_schema: { name: "epfo_resolve_voice_turn", strict: true, schema: { type: "object", properties: { reply: { type: "string" }, proposedAction: { type: "string", enum: voiceIntentSchema.options }, evidenceIds: { type: "array", items: { type: "string", enum: EVIDENCE.map((item) => item.id) } }, replyLocale: { type: "string", enum: ["en", "hi", "bn", "gu", "kn", "mr", "ta", "te"] } }, required: ["reply", "proposedAction", "evidenceIds"], additionalProperties: false } } },
        messages: [
          { role: "system", content: "You are EPFO Resolve's synthetic case guide. Never claim to be EPFO or an officer. Use only the supplied synthetic facts. Do not give legal advice, invent rules, calculate different amounts, claim a real submission, or mention unseen data. Reply briefly in the selected UI language unless the user explicitly asks to change it. You may propose only a permitted action. Actions other than explain, diagnose, clarify, or change_locale always require confirmation." },
          { role: "user", content: JSON.stringify({ userUtterance: transcript, uiLocale: locale, case: caseContext(caseData) }) },
        ],
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`Sarvam chat ${response.status}`);
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content;
    const parsed = responseSchema.safeParse(content ? JSON.parse(content) : null);
    if (!parsed.success || !allowedVoiceActions(caseData).includes(parsed.data.proposedAction)) throw new Error("Invalid voice response");
    return { ...parsed.data, evidenceIds: parsed.data.evidenceIds.filter((id) => EVIDENCE.some((item) => item.id === id)), replyLocale: parsed.data.replyLocale ?? locale, source: "live", requiresConfirmation: requiresVoiceConfirmation(parsed.data.proposedAction) };
  } catch (error) {
    console.error("EPFO Resolve Sarvam voice request failed", { message: error instanceof Error ? error.message : "Unknown provider error" });
    return fallbackTurn(transcript, locale, caseData);
  }
}

export async function transcribeVoice(audio: File) {
  if (!process.env.SARVAM_API_KEY) throw new Error("Voice service is not configured.");
  const form = new FormData();
  form.append("file", audio, "voice.webm"); form.append("model", process.env.SARVAM_STT_MODEL || "saaras:v3"); form.append("mode", "transcribe");
  const response = await fetch("https://api.sarvam.ai/speech-to-text", { method: "POST", headers: { "api-subscription-key": process.env.SARVAM_API_KEY }, body: form, signal: AbortSignal.timeout(20_000) });
  const body = await response.text();
  if (!response.ok) {
    console.error("EPFO Resolve Sarvam transcription rejected", { status: response.status, audioBytes: audio.size, audioType: audio.type, detail: body.slice(0, 500) });
    throw new Error(`Sarvam transcription ${response.status}`);
  }
  const payload = JSON.parse(body) as { transcript?: string };
  if (!payload.transcript?.trim()) throw new Error("No speech was detected.");
  return payload.transcript.trim();
}

export async function synthesizeVoice(text: string, locale: Locale) {
  if (!process.env.SARVAM_API_KEY) return null;
  const response = await fetch("https://api.sarvam.ai/text-to-speech", { method: "POST", headers: { "Content-Type": "application/json", "api-subscription-key": process.env.SARVAM_API_KEY }, body: JSON.stringify({ text: text.slice(0, 1800), language_code: VOICE_LOCALES[locale], model: process.env.SARVAM_TTS_MODEL || "bulbul:v3", speaker: process.env.SARVAM_TTS_SPEAKER || "ritu", pace: 1.03, output_audio_codec: "wav" }), signal: AbortSignal.timeout(20_000) });
  if (!response.ok) return null;
  const payload = await response.json() as { audios?: string[] };
  return payload.audios?.[0] ?? null;
}
