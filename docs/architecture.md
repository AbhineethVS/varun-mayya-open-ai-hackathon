# Architecture notes

## Runtime

The web application is Next.js on Vercel. It is designed to use Supabase anonymous authentication and Postgres for production sessions. Until cloud environment variables are connected, the fully synthetic case is isolated and resumable with browser local storage so a public demo never fails due to missing infrastructure.

## Data flow

1. A visitor sees an explicit mock UAN/OTP screen and creates a synthetic session.
2. The deterministic state machine controls every workflow transition; AI never receives authority over it.
3. The case event history and selected evidence are persisted per session. The included Supabase migration creates `cases`, `case_events`, `evidence_selections`, and `ai_artifacts`, with row-level security keyed to `auth.uid()`.
4. The AI route validates a fixed action, locale, and scenario key, then uses only a server-held key and whitelisted facts. With Supabase configured, protected endpoints require that anonymous session’s bearer token. AI actions are also limited per session in the running instance. It returns built-in copy on any AI failure.
5. The PDF endpoint validates the synthetic case shape, requires the same session when cloud persistence is configured, and renders a no-store resolution summary.

## Production cutover

1. Create a Supabase project and enable anonymous sign-ins.
2. Run `supabase/migrations/001_epfo_resolve.sql` in the SQL editor.
3. Set the Supabase and OpenAI environment variables in Vercel.
4. The included client persistence adapter will automatically create an anonymous session and synchronize the synthetic case. Browser storage remains the no-configuration/offline fallback.
5. Test in an incognito browser and make sure every visible simulation disclosure remains present.
