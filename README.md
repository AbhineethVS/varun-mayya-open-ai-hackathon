# EPFO Resolve

An independent hackathon prototype for one specific citizen journey: a PF transfer blocked by a contradictory historical EPS record and an unresponsive former employer.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`, then use the displayed fictional UAN and OTP. Never enter real information.

## What is real vs simulated

- **Live in the app:** responsive interface, browser-resumable state, deterministic workflow, synthetic evidence selection, audit history, PDF summary, localised core UI, optional server-side AI, and (when configured) anonymous-session Supabase persistence protected by row-level security. On desktop, an optional case assistant can answer grounded questions without controlling the workflow.
- **Simulated:** identity/OTP, accounts, employers, EPFO/RPFC, EPFiGMS/CPGRAMS, passbook, rules’ input data, deadlines, messages, ledger entries, and transfer outcome.

## Production configuration

Copy `.env.example` to `.env.local`. Add `OPENAI_API_KEY` to enable live optional AI text and the desktop case assistant; otherwise safe deterministic fallback copy is used. Add `SARVAM_API_KEY` only to enable the assistant’s microphone transcription. It sends a short browser-recorded WebM clip to Sarvam, then inserts the transcript into the editable prompt for review. Audio and transcripts are never persisted by EPFO Resolve, and speech never sends a message or changes the fictional workflow automatically.

Add the public Supabase URL and anon key, enable Anonymous Sign-Ins, and apply `supabase/migrations/001_epfo_resolve.sql` to make each mock-login session private and durable. The app deliberately works without credentials so reviewers can always complete the synthetic journey locally. Optionally set `NEXT_PUBLIC_SITE_URL` when deploying to a custom domain; it defaults to `https://epfo-resolve.vercel.app`.

## Guardrails

- No official government branding or live government systems.
- No real data upload path; all evidence is bundled fictional content.
- AI receives a whitelist of fictional facts and cannot determine EPS eligibility, balances, state transitions, or escalation.
- The desktop assistant is answer-only: it has no access to synthetic workflow controls, documents, downloads, Supabase writes, or real EPFO systems. Its client-side conversation history lasts only for the open tab.
- Rule context: [EPFO FAQ](https://www.epfindia.gov.in/site_en/FAQ.php) and [EPFO Citizen Charter](https://www.epfindia.gov.in/site_docs/PDFs/MiscPDFs/CitizenCharter.pdf).

For evaluation without interacting with the mock login, use the public `/review` route. See [architecture notes](docs/architecture.md), [research notes](docs/research.md), and [demo script](docs/demo-script.md).
