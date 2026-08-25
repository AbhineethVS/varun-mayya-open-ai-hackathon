import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, rateLimitKey } from "@/lib/rate-limit";
import { getRequestSession } from "@/lib/request-session";
import { demoCaseSchema } from "@/lib/workflow";
import { createVoiceTurn, isVoiceConfirmation, synthesizeVoice, transcribeVoice, voiceIntentSchema } from "@/lib/voice";

export const runtime = "nodejs";
const localeSchema = z.enum(["en", "hi", "bn", "gu", "kn", "mr", "ta", "te"]);

export async function POST(request: Request) {
  const session = await getRequestSession(request);
  const limit = checkRateLimit(rateLimitKey("voice", request, session.userId), { limit: 10, windowMs: 60_000 });
  if (!limit.allowed) return NextResponse.json({ error: "Please wait a minute before another voice request." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds), "Cache-Control": "no-store" } });
  if (session.configured && !session.userId) return NextResponse.json({ error: "A demo session is required." }, { status: 401 });
  if (!process.env.SARVAM_API_KEY) return NextResponse.json({ error: "Voice is not configured in this deployment yet." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  const form = await request.formData().catch(() => null);
  const audio = form?.get("audio");
  const locale = localeSchema.safeParse(form?.get("locale"));
  const caseData = demoCaseSchema.safeParse(parseJson(form?.get("caseData") ?? null));
  const pendingAction = voiceIntentSchema.safeParse(form?.get("pendingAction") || "clarify");
  if (!(audio instanceof File) || audio.size === 0 || audio.size > 4_000_000 || !locale.success || !caseData.success || !pendingAction.success) return NextResponse.json({ error: "Invalid synthetic voice request." }, { status: 400 });
  try {
    const selectedLocale = locale.data;
    const transcript = await transcribeVoice(audio);
    const confirmed = pendingAction.data !== "clarify" && isVoiceConfirmation(transcript);
    const turn = confirmed
      ? { reply: "Confirmed. I will continue with the fictional demo action now.", proposedAction: pendingAction.data, evidenceIds: [], replyLocale: selectedLocale, source: "live" as const, requiresConfirmation: false }
      : await createVoiceTurn(transcript, selectedLocale, caseData.data);
    const audioBase64 = await synthesizeVoice(turn.reply, turn.replyLocale ?? selectedLocale);
    return NextResponse.json({ transcript, ...turn, audioBase64, audioMimeType: audioBase64 ? "audio/wav" : null, confirmed }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "We could not process that voice request." }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}

function parseJson(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  try { return JSON.parse(value); } catch { return null; }
}
