# EPFO Resolve

An independent hackathon prototype for one specific citizen journey: a PF transfer blocked by a contradictory historical EPS record and an unresponsive former employer.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`, then use the displayed fictional UAN and OTP. Never enter real information.

## What is real vs simulated

- **Live in the app:** responsive interface, browser-resumable state, deterministic workflow, synthetic evidence selection, audit history, PDF summary, localised core UI, optional server-side AI, optional push-to-talk case guide, and (when configured) anonymous-session Supabase persistence protected by row-level security.
- **Simulated:** identity/OTP, accounts, employers, EPFO/RPFC, EPFiGMS/CPGRAMS, passbook, rules’ input data, deadlines, messages, ledger entries, and transfer outcome.

## Production configuration

Copy `.env.example` to `.env.local`. Add `OPENAI_API_KEY` to enable live optional AI text; otherwise the safe deterministic fallback is used. Add `SARVAM_API_KEY` to enable the push-to-talk guide: it sends a short browser-recorded WebM clip to Sarvam for transcription, asks the case-aware model for a constrained reply, and returns optional speech. Audio and transcripts are never persisted by EPFO Resolve. The guide requires explicit confirmation before any synthetic mutation, and it never reaches real EPFO systems.

Add the public Supabase URL and anon key, enable Anonymous Sign-Ins, and apply `supabase/migrations/001_epfo_resolve.sql` to make each mock-login session private and durable. The app deliberately works without credentials so reviewers can always complete the synthetic journey locally. Optionally set `NEXT_PUBLIC_SITE_URL` when deploying to a custom domain; it defaults to `https://epfo-resolve.vercel.app`.

## Guardrails

- No official government branding or live government systems.
- No real data upload path; all evidence is bundled fictional content.
- AI receives a whitelist of fictional facts and cannot determine EPS eligibility, balances, state transitions, or escalation.
- Voice is push-to-talk only. The synthetic guide may explain or navigate immediately, but an on-screen or spoken confirmation is required before it changes the fictional case or starts a PDF download.
- Rule context: [EPFO FAQ](https://www.epfindia.gov.in/site_en/FAQ.php) and [EPFO Citizen Charter](https://www.epfindia.gov.in/site_docs/PDFs/MiscPDFs/CitizenCharter.pdf).

For evaluation without interacting with the mock login, use the public `/review` route. See [architecture notes](docs/architecture.md), [research notes](docs/research.md), and [demo script](docs/demo-script.md).
