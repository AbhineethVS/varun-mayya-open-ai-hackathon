import { createHash } from "crypto";
import OpenAI from "openai";
import { z } from "zod";
import { assistantFallback, assistantInstructions, trimAssistantHistory } from "@/lib/assistant";
import { checkRateLimit, rateLimitKey } from "@/lib/rate-limit";
import { getRequestSession } from "@/lib/request-session";
import { demoCaseSchema } from "@/lib/workflow";

export const runtime = "nodejs";
const requestSchema = z.object({
  locale: z.enum(["en", "hi", "bn", "gu", "kn", "mr", "ta", "te"]),
  caseData: demoCaseSchema,
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(1200) })).min(1).max(8),
});

export async function POST(request: Request) {
  const session = await getRequestSession(request);
  const limit = checkRateLimit(rateLimitKey("assistant", request, session.userId), { limit: 12, windowMs: 60_000 });
  if (!limit.allowed) return textStream("Please wait a minute before another assistant question.", 429, limit.retryAfterSeconds);
  if (session.configured && !session.userId) return textStream("A private demo session is still being prepared. Please try again in a moment.", 401);
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return textStream("Please enter a short question about this synthetic case.", 400);
  if (!process.env.OPENAI_API_KEY) return textStream(assistantFallback(parsed.data.caseData));
  const history = trimAssistantHistory(parsed.data.messages);
  const identifier = createHash("sha256").update(`epfo-resolve-assistant:${session.userId}:${parsed.data.caseData.id}`).digest("hex").slice(0, 32);
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const stream = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
      instructions: assistantInstructions(parsed.data.locale, parsed.data.caseData),
      input: history,
      reasoning: { effort: "low" },
      max_output_tokens: 420,
      store: false,
      user: identifier,
      stream: true,
    });
    const encoder = new TextEncoder();
    return new Response(new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === "response.output_text.delta") controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: event.delta })}\n\n`));
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (error) {
          console.error("EPFO Resolve assistant stream failed", { message: error instanceof Error ? error.message : "Unknown provider error" });
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: "\n\nThe assistant could not finish that response. Please use the verified case details or try again." })}\n\n`));
        } finally { controller.close(); }
      },
    }), { headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" } });
  } catch (error) {
    console.error("EPFO Resolve assistant request failed", { message: error instanceof Error ? error.message : "Unknown provider error" });
    return textStream(assistantFallback(parsed.data.caseData));
  }
}

function textStream(text: string, status = 200, retryAfter?: number) {
  const headers = new Headers({ "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform" });
  if (retryAfter) headers.set("Retry-After", String(retryAfter));
  return new Response(`data: ${JSON.stringify({ delta: text })}\n\ndata: [DONE]\n\n`, { status, headers });
}
