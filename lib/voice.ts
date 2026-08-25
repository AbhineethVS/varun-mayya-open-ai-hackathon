import { z } from "zod";
import { DemoCase, EvidenceId, REQUIRED_EVIDENCE } from "./domain";
import { Locale } from "./locales";

export const VOICE_LOCALES: Record<Locale, string> = { en: "en-IN", hi: "hi-IN", bn: "bn-IN", gu: "gu-IN", kn: "kn-IN", mr: "mr-IN", ta: "ta-IN", te: "te-IN" };
export const voiceIntentSchema = z.enum(["explain", "diagnose", "select_evidence", "prepare_submission", "submit", "simulate_deadline", "escalate", "reconcile", "complete", "download", "change_locale", "clarify"]);
export type VoiceIntent = z.infer<typeof voiceIntentSchema>;
export type VoiceAction = Exclude<VoiceIntent, "explain" | "clarify" | "change_locale">;

export type VoiceIntentWithPlan = VoiceIntent;
export type VoiceTurn = { reply: string; proposedAction: VoiceIntent; evidenceIds: EvidenceId[]; replyLocale: Locale; source: "deterministic"; requiresConfirmation: boolean };

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
export function requiresVoiceConfirmation(action: VoiceIntentWithPlan) { return !["explain", "diagnose", "clarify", "change_locale"].includes(action); }
export function isVoiceConfirmation(text: string) { return /^(?:yes|yeah|yep|sure|okay|ok|go ahead|continue|haan|ha)\b|^(?:हाँ|हां|जी हाँ|हाँ जी)(?:\s|$)/i.test(text.trim()); }

export function createVoiceTurn(transcript: string, locale: Locale, caseData: DemoCase): VoiceTurn {
  const text = transcript.toLowerCase();
  const requestedLocale = requestedVoiceLocale(text) ?? locale;
  let proposedAction: VoiceIntentWithPlan = "explain";
  if (/^(?:show|open|take me to).*(?:diagnos|problem)/.test(text)) proposedAction = "diagnose";
  else if (/what.*(?:issue|wrong)|(?:explain|why|issue|problem)/.test(text)) proposedAction = "explain";
  else if (/evidence|document|attach|select/.test(text)) proposedAction = "select_evidence";
  else if (/submit|send.*request/.test(text)) proposedAction = canSubmit(caseData) ? "submit" : canStartSubmission(caseData) ? "prepare_submission" : "clarify";
  else if (/deadline|overdue|missed/.test(text)) proposedAction = "simulate_deadline";
  else if (/escalat|rpfc/.test(text)) proposedAction = "escalate";
  else if (/reconcil|ledger|balance/.test(text)) proposedAction = "reconcile";
  else if (/complete|transfer/.test(text)) proposedAction = "complete";
  else if (/download|summary|pdf/.test(text)) proposedAction = "download";
  else if (/hindi|bengali|gujarati|kannada|marathi|tamil|telugu|english/.test(text)) proposedAction = "change_locale";
  if (proposedAction !== "prepare_submission" && !allowedVoiceActions(caseData).includes(proposedAction)) proposedAction = "clarify";
  const reply = proposedAction === "explain"
    ? explanationFor(caseData)
    : proposedAction === "diagnose"
    ? "I can open the diagnosis. The synthetic record says EPS was active, even though Ananya’s first membership began after September 2014 with Basic plus DA of ₹18,500 and no earlier EPS membership."
    : proposedAction === "select_evidence"
      ? "The case needs four fictional records: the appointment letter, first three payslips, service history, and old passbook. I can select those for this synthetic request."
      : proposedAction === "prepare_submission"
        ? "To submit this fictional request, I will open the diagnosis, select the four required fictional records, and submit the correction request. Would you like me to continue?"
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
                    ? `I will use ${requestedLocale === "en" ? "English" : requestedLocale === "hi" ? "Hindi" : requestedLocale === "bn" ? "Bengali" : requestedLocale === "gu" ? "Gujarati" : requestedLocale === "kn" ? "Kannada" : requestedLocale === "mr" ? "Marathi" : requestedLocale === "ta" ? "Tamil" : "Telugu"} for the interface and spoken guide.`
                    : "This is a synthetic case guide, not an EPFO officer. Ask what the issue is, ask me to show the diagnosis, select evidence, submit the fictional request, or guide you to the next step.";
  return { reply, proposedAction, evidenceIds: proposedAction === "select_evidence" || proposedAction === "prepare_submission" ? REQUIRED_EVIDENCE : [], replyLocale: requestedLocale, source: "deterministic", requiresConfirmation: requiresVoiceConfirmation(proposedAction) };
}

function explanationFor(caseData: DemoCase) {
  if (caseData.status === "transfer_failed" || caseData.status === "diagnosed") return "The fictional former employer recorded Ananya as an EPS member. But this synthetic case starts after September 2014, has no earlier EPS membership, and uses ₹18,500 Basic plus DA. That historical EPS entry must be corrected before the fictional PF transfer can continue. The total balance is being reconciled, not lost.";
  if (caseData.status === "evidence_ready") return "The issue is now diagnosed. Four fictional records support the correction: the appointment letter, first three payslips, service history, and old passbook. Select them, then submit the fictional correction request.";
  if (caseData.status === "correction_submitted") return "The fictional correction request is submitted. Northstar Services owns the next action, with a proposed seven-business-day response target. This is a demo deadline, not a real EPFO service level.";
  if (caseData.status === "employer_overdue") return "The fictional former employer missed the proposed deadline. The existing evidence and audit history stay intact, and the next simulated route is RPFC review.";
  if (caseData.status === "escalated") return "The fictional RPFC review is ready to reconcile the ledger. ₹48,200 moves from EPS back to EPF, while the total protected balance remains ₹9,84,320.";
  if (caseData.status === "reconciled") return "The historical fictional entry is corrected and the balance is reconciled. The next step is to complete the synthetic transfer to Riverline Technologies.";
  return "The fictional PF transfer is complete. The total ₹9,84,320 is shown under Riverline Technologies, and the resolution summary preserves the full synthetic audit history.";
}

function canSubmit(caseData: DemoCase) {
  return caseData.status === "evidence_ready" && REQUIRED_EVIDENCE.every((id) => caseData.selectedEvidence.includes(id));
}

function canStartSubmission(caseData: DemoCase) {
  return caseData.status === "transfer_failed" || caseData.status === "diagnosed" || caseData.status === "evidence_ready";
}

function requestedVoiceLocale(text: string): Locale | null {
  if (/hindi|हिंदी|हिन्दी/.test(text)) return "hi";
  if (/bengali|বাংলা/.test(text)) return "bn";
  if (/gujarati|ગુજરાતી/.test(text)) return "gu";
  if (/kannada|ಕನ್ನಡ/.test(text)) return "kn";
  if (/marathi|मराठी/.test(text)) return "mr";
  if (/tamil|தமிழ்/.test(text)) return "ta";
  if (/telugu|తెలుగు/.test(text)) return "te";
  if (/english/.test(text)) return "en";
  return null;
}

export async function transcribeVoice(audio: File) {
  if (!process.env.SARVAM_API_KEY) throw new Error("Voice service is not configured.");
  // Android Chrome labels MediaRecorder output as `audio/webm;codecs=opus`.
  // Sarvam validates the multipart MIME type strictly, so retain the bytes but
  // remove browser-only codec parameters before forwarding the file.
  const uploadType = supportedUploadType(audio.type);
  const upload = new Blob([await audio.arrayBuffer()], { type: uploadType });
  const form = new FormData();
  form.append("file", upload, "voice.webm"); form.append("model", process.env.SARVAM_STT_MODEL || "saaras:v3"); form.append("mode", "transcribe");
  const response = await fetch("https://api.sarvam.ai/speech-to-text", { method: "POST", headers: { "api-subscription-key": process.env.SARVAM_API_KEY }, body: form, signal: AbortSignal.timeout(20_000) });
  const body = await response.text();
  if (!response.ok) {
    console.error("EPFO Resolve Sarvam transcription rejected", { status: response.status, audioBytes: audio.size, audioType: audio.type, uploadType, detail: body.slice(0, 500) });
    throw new Error(`Sarvam transcription ${response.status}`);
  }
  const payload = JSON.parse(body) as { transcript?: string };
  if (!payload.transcript?.trim()) throw new Error("No speech was detected.");
  return payload.transcript.trim();
}

export function supportedUploadType(audioType: string) {
  const mimeType = audioType.split(";", 1)[0].trim().toLowerCase();
  return mimeType === "audio/webm" || mimeType === "video/webm" ? mimeType : "audio/webm";
}

export async function synthesizeVoice(text: string, locale: Locale) {
  if (!process.env.SARVAM_API_KEY) return null;
  const response = await fetch("https://api.sarvam.ai/text-to-speech", { method: "POST", headers: { "Content-Type": "application/json", "api-subscription-key": process.env.SARVAM_API_KEY }, body: JSON.stringify({ text: text.slice(0, 1800), language_code: VOICE_LOCALES[locale], model: process.env.SARVAM_TTS_MODEL || "bulbul:v3", speaker: process.env.SARVAM_TTS_SPEAKER || "ritu", pace: 1.03, output_audio_codec: "wav" }), signal: AbortSignal.timeout(20_000) });
  const body = await response.text();
  if (!response.ok) {
    console.error("EPFO Resolve Sarvam speech rejected", { status: response.status, locale, detail: body.slice(0, 500) });
    return null;
  }
  const payload = JSON.parse(body) as { audios?: string[] };
  return payload.audios?.[0] ?? null;
}
