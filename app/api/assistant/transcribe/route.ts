import { NextResponse } from "next/server";
import { checkRateLimit, rateLimitKey } from "@/lib/rate-limit";
import { getRequestSession } from "@/lib/request-session";
import { transcribeVoice } from "@/lib/sarvam-stt";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getRequestSession(request);
  const limit = checkRateLimit(rateLimitKey("assistant-stt", request, session.userId), { limit: 10, windowMs: 60_000 });
  if (!limit.allowed) return NextResponse.json({ error: "Please wait a minute before another transcription." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds), "Cache-Control": "no-store" } });
  if (session.configured && !session.userId) return NextResponse.json({ error: "A private demo session is still being prepared." }, { status: 401 });
  const form = await request.formData().catch(() => null);
  const audio = form?.get("audio");
  if (!(audio instanceof File) || audio.size === 0 || audio.size > 4_000_000) return NextResponse.json({ error: "Invalid recording." }, { status: 400 });
  try { return NextResponse.json({ transcript: await transcribeVoice(audio) }, { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Transcription is unavailable." }, { status: 502, headers: { "Cache-Control": "no-store" } }); }
}
