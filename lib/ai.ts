import OpenAI from "openai";
import { Locale } from "@/lib/locales";

export type AiKind = "explain" | "draft" | "translate";

const fallback: Record<AiKind, string> = {
  explain: "Your old employer’s fictional record says EPS was active. But this demo case starts after 1 September 2014, has no earlier EPS membership, and uses ₹18,500 Basic + DA. The historical EPS entry needs correction before the PF transfer can continue. The total balance is being reconciled, not lost.",
  draft: "Please correct the simulated EPS membership entry for Ananya Rao’s previous employment. The attached synthetic appointment letter, payslips, service history and passbook show a first-time post-2014 membership with ₹18,500 Basic + DA and no prior EPS membership. Please reclassify the recorded EPS diversion and enable the pending PF transfer.",
  translate: "This case is a synthetic prototype. Your balance is shown as awaiting record correction, not as lost. The next action and responsible owner are shown on the case timeline.",
};

const languageNames: Record<Locale, string> = { en: "English", hi: "Hindi", bn: "Bengali", gu: "Gujarati", kn: "Kannada", mr: "Marathi", ta: "Tamil", te: "Telugu" };

export async function getAiAssistance(kind: AiKind, locale: Locale, safetyIdentifier: string) {
  if (!process.env.OPENAI_API_KEY) return { text: fallback[kind], source: "fallback" as const };
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const prompt = kind === "explain"
    ? "Explain the following verified fictional case in plain language. Do not offer legal advice or alter the conclusion: first EPF membership 04 Jan 2017; Basic + DA ₹18,500; no prior EPS membership; former employer recorded EPS active and ₹48,200 diverted."
    : kind === "draft"
      ? "Write a concise, respectful correction request using only these verified fictional facts: Ananya Rao, first EPF membership 04 Jan 2017, Basic + DA ₹18,500, no prior EPS membership, EPS record incorrectly active, ₹48,200 requires reclassification. Mention that the records are synthetic." 
      : `Translate this factual synthetic-prototype message into ${languageNames[locale]}. Keep numbers and the terms EPF and EPS unchanged: ${fallback.translate}`;
  try {
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.6-terra",
      instructions: "You are an accessibility assistant inside an independent public-service prototype. Use only supplied facts. Never provide legal advice, invent policy, calculate money, or claim to access EPFO. Return valid JSON matching the schema.",
      input: prompt,
      reasoning: { effort: "low" },
      // The installed SDK exposes the legacy `user` field; the value is a one-way
      // hash of the anonymous synthetic case and contains no personal information.
      user: safetyIdentifier,
      store: false,
      text: {
        format: {
          type: "json_schema",
          name: "epfo_resolve_copy",
          strict: true,
          schema: {
            type: "object",
            properties: { text: { type: "string" } },
            required: ["text"],
            additionalProperties: false,
          },
        },
      },
    });
    const parsed = JSON.parse(response.output_text) as { text?: string };
    if (!parsed.text) throw new Error("AI returned no text");
    return { text: parsed.text, source: "live" as const };
  } catch {
    return { text: fallback[kind], source: "fallback" as const };
  }
}

export const getFallback = (kind: AiKind) => fallback[kind];
