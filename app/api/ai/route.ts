import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAiAssistance, getFallback } from "@/lib/ai";
import { allowRequest } from "@/lib/rate-limit";
import { getRequestSession } from "@/lib/request-session";

const requestSchema = z.object({
  kind: z.enum(["explain", "draft", "translate"]),
  locale: z.enum(["en", "hi", "bn", "gu", "kn", "mr", "ta", "te"]),
  caseId: z.literal("epfo-demo-ananya"),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid AI request." }, { status: 400 });
  const session = await getRequestSession(request);
  if (session.configured && !session.userId) {
    return NextResponse.json({
      text: getFallback(parsed.data.kind),
      source: "fallback",
      notice: "The private demo session is still being prepared.",
    }, { headers: { "Cache-Control": "no-store" } });
  }
  if (!allowRequest(`ai:${session.userId}`)) return NextResponse.json({ error: "Please wait a minute before another AI request." }, { status: 429 });
  const identifier = createHash("sha256").update(`epfo-resolve:${session.userId}:${parsed.data.caseId}`).digest("hex").slice(0, 32);
  const result = await getAiAssistance(parsed.data.kind, parsed.data.locale, identifier);
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
