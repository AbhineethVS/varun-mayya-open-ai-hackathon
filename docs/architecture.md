# Architecture notes

## Runtime

The web application is Next.js on Vercel. It is designed to use Supabase anonymous authentication and Postgres for production sessions. Until cloud environment variables are connected, the fully synthetic case is isolated and resumable with browser local storage so a public demo never fails due to missing infrastructure.

## Data flow

1. A visitor sees an explicit mock UAN/OTP screen and creates a synthetic session.
2. The deterministic state machine controls every workflow transition. Both visible controls and the optional voice guide use the validated `/api/workflow` route; AI never receives authority over it.
3. The case event history and selected evidence are persisted per session. The included Supabase migration creates `cases`, `case_events`, `evidence_selections`, and `ai_artifacts`, with row-level security keyed to `auth.uid()`.
4. The AI route validates a fixed action, locale, and scenario key, then uses only a server-held key and whitelisted facts. With Supabase configured, protected endpoints require that anonymous session’s bearer token. AI is limited to 10 requests per minute per session/IP fingerprint; it returns built-in copy on any AI failure.
5. The PDF endpoint validates the synthetic case shape, requires the same session when cloud persistence is configured, is limited to 6 requests per minute per session/IP fingerprint, and renders a no-store resolution summary.
6. The optional push-to-talk guide records at most 15 seconds in the browser after an explicit microphone press. `/api/voice/turn` transcribes the short clip with Sarvam, resolves its answer and permitted action from deterministic page-aware rules, and returns text immediately. `/api/voice/speak` then requests optional Bulbul speech without delaying that visible response. No chat model is called in this path. Audio and transcripts are not written to browser storage, Supabase, or application logs. Voice turns and spoken replies are each limited to 10 per minute per session/IP fingerprint; changing case state or downloading a PDF requires an explicit spoken or on-screen confirmation.

## Public evaluator surface

`/review` is a server-rendered, no-auth walkthrough of the complete synthetic case. It imports the same case constants as the interactive app but does not initialize Supabase, invoke AI, or write any data. `/robots.txt`, `/sitemap.xml`, and `/llms.txt` direct automated evaluators to that readable route; the interaction-gated `/demo` is intentionally excluded from the sitemap.

The application limiter is intentionally dependency-free and instance-local for this hackathon deployment. Before materially higher traffic, replace it with a shared rate-limit store (for example, Redis) so limits remain global across serverless instances.

## Production cutover

1. Create a Supabase project and enable anonymous sign-ins.
2. Run `supabase/migrations/001_epfo_resolve.sql` in the SQL editor.
3. Set the Supabase and OpenAI environment variables in Vercel. Add the server-only `SARVAM_*` variables to enable voice; the demo remains usable without them.
4. The included client persistence adapter will automatically create an anonymous session and synchronize the synthetic case. Browser storage remains the no-configuration/offline fallback.
5. Test in an incognito browser and make sure every visible simulation disclosure remains present.
