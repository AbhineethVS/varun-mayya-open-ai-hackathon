import { NextResponse } from "next/server";
import { z } from "zod";
import { renderResolutionPdf } from "@/lib/resolution-pdf";
import { checkRateLimit, rateLimitKey } from "@/lib/rate-limit";
import { getRequestSession } from "@/lib/request-session";

const eventSchema = z.object({ id: z.string(), date: z.string(), title: z.string(), description: z.string(), actor: z.enum(["You", "Northstar Services", "EPFO Resolve", "RPFC review"]), tone: z.enum(["neutral", "warning", "success", "accent"]) });
const caseSchema = z.object({ id: z.literal("epfo-demo-ananya"), status: z.enum(["transfer_failed", "diagnosed", "evidence_ready", "correction_submitted", "employer_overdue", "escalated", "reconciled", "transfer_completed"]), selectedEvidence: z.array(z.enum(["appointment", "payslips", "service", "passbook", "form3a", "email"])), locale: z.string(), submittedAt: z.string().optional(), events: z.array(eventSchema) });

export async function POST(request: Request) {
  const session = await getRequestSession(request);
  const rateLimit = checkRateLimit(rateLimitKey("resolution", request, session.userId), { limit: 6, windowMs: 60_000 });
  if (!rateLimit.allowed) return NextResponse.json({ error: "Please wait a minute before creating another summary." }, { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds), "Cache-Control": "no-store" } });
  if (session.configured && !session.userId) return NextResponse.json({ error: "A demo session is required." }, { status: 401 });
  const body = await request.json().catch(() => null); const parsed = caseSchema.safeParse(body?.caseData);
  if (!parsed.success) return NextResponse.json({ error: "Invalid synthetic case." }, { status: 400 });
  const pdf = await renderResolutionPdf(parsed.data);
  return new NextResponse(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": "attachment; filename=epfo-resolve-ananya-rao.pdf", "Cache-Control": "no-store" } });
}
