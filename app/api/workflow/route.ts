import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, rateLimitKey } from "@/lib/rate-limit";
import { getRequestSession } from "@/lib/request-session";
import { applyWorkflowAction, demoCaseSchema, evidenceIdSchema, workflowActionSchema } from "@/lib/workflow";

const requestSchema = z.object({ caseData: demoCaseSchema, action: workflowActionSchema, evidenceIds: z.array(evidenceIdSchema).optional() });

export async function POST(request: Request) {
  const session = await getRequestSession(request);
  const limit = checkRateLimit(rateLimitKey("workflow", request, session.userId), { limit: 20, windowMs: 60_000 });
  if (!limit.allowed) return NextResponse.json({ error: "Please wait a moment before another demo action." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds), "Cache-Control": "no-store" } });
  if (session.configured && !session.userId) return NextResponse.json({ error: "A demo session is required." }, { status: 401 });
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid synthetic workflow request." }, { status: 400 });
  try {
    return NextResponse.json({ caseData: applyWorkflowAction(parsed.data.caseData, parsed.data.action, parsed.data.evidenceIds) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "That synthetic action is unavailable." }, { status: 409, headers: { "Cache-Control": "no-store" } });
  }
}
