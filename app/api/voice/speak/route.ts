import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, rateLimitKey } from "@/lib/rate-limit";
import { getRequestSession } from "@/lib/request-session";
import { synthesizeVoice } from "@/lib/voice";

const requestSchema = z.object({ text: z.string().min(1).max(900), locale: z.enum(["en", "hi", "bn", "gu", "kn", "mr", "ta", "te"]) });

export async function POST(request: Request) {
  const session = await getRequestSession(request);
  const limit = checkRateLimit(rateLimitKey("voice-speech", request, session.userId), { limit: 10, windowMs: 60_000 });
  if (!limit.allowed) return NextResponse.json({ error: "Please wait a minute before another spoken reply." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds), "Cache-Control": "no-store" } });
  if (session.configured && !session.userId) return NextResponse.json({ error: "A demo session is required." }, { status: 401 });
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid voice reply." }, { status: 400 });
  const audioBase64 = await synthesizeVoice(parsed.data.text, parsed.data.locale);
  if (!audioBase64) return NextResponse.json({ error: "Spoken reply is temporarily unavailable. The written reply is still ready." }, { status: 502, headers: { "Cache-Control": "no-store" } });
  return NextResponse.json({ audioBase64, audioMimeType: audioBase64 ? "audio/wav" : null }, { headers: { "Cache-Control": "no-store" } });
}
