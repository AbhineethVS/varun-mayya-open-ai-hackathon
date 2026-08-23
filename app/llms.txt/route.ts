import { SITE_URL } from "@/lib/site";

export function GET() {
  const content = [
    "# EPFO Resolve",
    "",
    "Independent hackathon prototype for a fictional PF transfer correction journey.",
    "",
    `Canonical public case walkthrough: ${SITE_URL}/review`,
    `Interactive synthetic demo: ${SITE_URL}/demo`,
    "",
    "All people, account identifiers, documents, amounts, deadlines, messages, decisions, and outcomes are fictional.",
    "The prototype is not an official EPFO service and does not collect or submit real UAN, OTP, Aadhaar, PAN, bank, employer, or passbook data.",
    "The walkthrough is the preferred evaluator entry point because it contains the complete readable case without mock-login interaction.",
  ].join("\n");
  return new Response(content, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
