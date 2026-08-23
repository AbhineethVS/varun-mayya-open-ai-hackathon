import type { SupabaseClient } from "@supabase/supabase-js";
import { CASE_ID, createDemoCase, DemoCase, EvidenceId, TimelineEvent } from "@/lib/domain";

type RemoteCase = { id: string; status: DemoCase["status"]; locale: string };

export async function bootstrapCase(supabase: SupabaseClient, localCase: DemoCase) {
  let { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error || !data.user) throw error ?? new Error("Could not create an anonymous session.");
    user = data.user;
  }

  const { data: existing, error: existingError } = await supabase
    .from("cases")
    .select("id,status,locale")
    .eq("user_id", user.id)
    .eq("scenario_key", CASE_ID)
    .maybeSingle<RemoteCase>();
  if (existingError) throw existingError;

  if (!existing) {
    const { data: created, error: createError } = await supabase
      .from("cases")
      .insert({ user_id: user.id, scenario_key: CASE_ID, status: localCase.status, locale: localCase.locale })
      .select("id,status,locale")
      .single<RemoteCase>();
    if (createError || !created) throw createError ?? new Error("Could not create the synthetic case.");
    await persistCase(supabase, created.id, localCase);
    return { remoteId: created.id, caseData: localCase };
  }

  const [eventsResult, evidenceResult] = await Promise.all([
    supabase.from("case_events").select("event_key,payload").eq("case_id", existing.id).order("created_at", { ascending: true }),
    supabase.from("evidence_selections").select("evidence_id").eq("case_id", existing.id),
  ]);
  if (eventsResult.error) throw eventsResult.error;
  if (evidenceResult.error) throw evidenceResult.error;
  const events = (eventsResult.data ?? []).map((row) => row.payload as TimelineEvent).filter(Boolean);
  return {
    remoteId: existing.id,
    caseData: {
      ...createDemoCase(existing.locale),
      status: existing.status,
      locale: existing.locale,
      selectedEvidence: (evidenceResult.data ?? []).map((row) => row.evidence_id as EvidenceId),
      events: events.length > 0 ? events : localCase.events,
    },
  };
}

export async function persistCase(supabase: SupabaseClient, remoteId: string, caseData: DemoCase) {
  const { error: caseError } = await supabase.from("cases").update({ status: caseData.status, locale: caseData.locale, updated_at: new Date().toISOString() }).eq("id", remoteId);
  if (caseError) throw caseError;

  const events = caseData.events.map((event) => ({
    case_id: remoteId,
    event_key: event.id,
    event_type: event.id,
    actor: event.actor,
    payload: event,
  }));
  const { error: eventError } = await supabase.from("case_events").upsert(events, { onConflict: "case_id,event_key" });
  if (eventError) throw eventError;

  const { error: clearEvidenceError } = await supabase.from("evidence_selections").delete().eq("case_id", remoteId);
  if (clearEvidenceError) throw clearEvidenceError;
  if (caseData.selectedEvidence.length > 0) {
    const { error: evidenceError } = await supabase.from("evidence_selections").insert(caseData.selectedEvidence.map((evidenceId) => ({ case_id: remoteId, evidence_id: evidenceId })));
    if (evidenceError) throw evidenceError;
  }
}

export async function persistAiArtifact(supabase: SupabaseClient, remoteId: string, kind: "explain" | "draft" | "translate", source: "live" | "fallback", output: string) {
  await supabase.from("ai_artifacts").insert({ case_id: remoteId, kind, source, output });
}
