"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Pause, Play, Send, Volume2, X } from "lucide-react";
import { DemoCase, EvidenceId } from "@/lib/domain";
import { Locale } from "@/lib/locales";
import { VoiceIntentWithPlan } from "@/lib/voice";
import { WorkflowAction } from "@/lib/workflow";

type Turn = { transcript: string; reply: string; proposedAction: VoiceIntentWithPlan; evidenceIds: EvidenceId[]; replyLocale: Locale; source: "deterministic"; requiresConfirmation: boolean; audioBase64: string | null; audioMimeType: string | null; confirmed: boolean };
type Pending = Pick<Turn, "proposedAction" | "evidenceIds" | "reply">;

export function VoiceGuide({ locale, caseData, requestHeaders, onWorkflow, onLocale, onDownload, onAnnouncement }: { locale: Locale; caseData: DemoCase; requestHeaders: () => Promise<Record<string, string>>; onWorkflow: (action: WorkflowAction, evidenceIds?: EvidenceId[]) => Promise<boolean>; onLocale: (locale: Locale) => void; onDownload: () => Promise<void>; onAnnouncement: (message: string) => void }) {
  const [status, setStatus] = useState<"idle" | "listening" | "thinking" | "speaking" | "error">("idle");
  const [turn, setTurn] = useState<Turn | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [error, setError] = useState("");
  const [speechNotice, setSpeechNotice] = useState("");
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const startedAt = useRef(0);
  const stopTimer = useRef<number | null>(null);
  const player = useRef<HTMLAudioElement | null>(null);

  useEffect(() => () => { if (stopTimer.current) window.clearTimeout(stopTimer.current); player.current?.pause(); recorder.current?.stream.getTracks().forEach((track) => track.stop()); }, []);

  async function start() {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { setError("Voice input is not supported in this browser. The regular demo controls are still available."); setStatus("error"); return; }
    setError(""); setSpeechNotice(""); setTurn(null); player.current?.pause();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      recorder.current = mediaRecorder; chunks.current = [];
      mediaRecorder.ondataavailable = (event) => { if (event.data.size) chunks.current.push(event.data); };
      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const recording = new Blob(chunks.current, { type: mimeType });
        if (Date.now() - startedAt.current < 600 || recording.size < 1_000) { setError("That recording was too short to capture speech. Hold the microphone for at least a second, then try again."); setStatus("error"); return; }
        void send(recording);
      };
      startedAt.current = Date.now(); mediaRecorder.start(250); setStatus("listening"); onAnnouncement("Voice guide is listening. Tap stop when you finish speaking.");
      stopTimer.current = window.setTimeout(() => stop(), 15_000);
    } catch {
      setError("Microphone permission was not granted. You can continue with the normal controls."); setStatus("error");
    }
  }

  function stop() { if (stopTimer.current) window.clearTimeout(stopTimer.current); if (recorder.current?.state === "recording") recorder.current.stop(); }

  async function send(audio: Blob) {
    setStatus("thinking");
    try {
      const form = new FormData(); form.set("audio", audio, "voice.webm"); form.set("locale", locale); form.set("caseData", JSON.stringify(caseData)); if (pending) form.set("pendingAction", pending.proposedAction);
      const headers = await requestHeaders(); delete headers["Content-Type"];
      const response = await fetch("/api/voice/turn", { method: "POST", headers, body: form });
      const payload = await response.json() as Turn & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Voice guide is unavailable.");
      setTurn(payload); onAnnouncement(payload.reply);
      if (payload.confirmed && pending) { const accepted = await execute(pending); if (accepted) setPending(null); setStatus("idle"); void requestSpeech(payload.reply, payload.replyLocale); return; }
      if (payload.proposedAction === "change_locale" && payload.replyLocale !== locale) onLocale(payload.replyLocale);
      if (payload.proposedAction === "diagnose") await execute({ proposedAction: "diagnose", evidenceIds: [], reply: payload.reply });
      else if (payload.requiresConfirmation) setPending({ proposedAction: payload.proposedAction, evidenceIds: payload.evidenceIds, reply: payload.reply });
      setStatus("idle"); void requestSpeech(payload.reply, payload.replyLocale);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Voice guide is unavailable."); setStatus("error"); }
  }

  async function requestSpeech(text: string, replyLocale: Locale) {
    try {
      const response = await fetch("/api/voice/speak", { method: "POST", headers: await requestHeaders(), body: JSON.stringify({ text, locale: replyLocale }) });
      const speech = await response.json() as Pick<Turn, "audioBase64" | "audioMimeType"> & { error?: string };
      if (!response.ok || !speech.audioBase64) { setSpeechNotice(speech.error || "Spoken reply is unavailable. The written answer is ready."); return; }
      setTurn((previous) => previous ? { ...previous, ...speech } : previous);
      play(speech);
    } catch { setSpeechNotice("Spoken reply is unavailable. The written answer is ready."); }
  }

  function play(payload: Pick<Turn, "audioBase64" | "audioMimeType">, fromTap = false) {
    player.current?.pause();
    if (!payload.audioBase64 || !payload.audioMimeType) { setStatus("idle"); return; }
    const audio = new Audio(`data:${payload.audioMimeType};base64,${payload.audioBase64}`); player.current = audio; audio.onended = () => setStatus("idle"); audio.onerror = () => { setStatus("idle"); setSpeechNotice("Audio playback failed. Tap play to try again."); }; void audio.play().then(() => { setSpeechNotice(""); setStatus("speaking"); }).catch(() => { setStatus("idle"); setSpeechNotice(fromTap ? "Audio playback was blocked by this browser." : "Spoken reply is ready—tap play to hear it."); });
  }

  async function execute(action: Pending) {
    if (action.proposedAction === "download") { await onDownload(); return true; }
    const map: Partial<Record<VoiceIntentWithPlan, WorkflowAction>> = { diagnose: "diagnose", select_evidence: "select_evidence", prepare_submission: "prepare_submit", submit: "submit", simulate_deadline: "expire", escalate: "escalate", reconcile: "reconcile", complete: "complete" };
    const workflowAction = map[action.proposedAction];
    if (!workflowAction) return false;
    return onWorkflow(workflowAction, action.evidenceIds);
  }

  async function confirm() { if (!pending) return; const accepted = await execute(pending); if (accepted) { setPending(null); setStatus("idle"); } }
  function stopSpeaking() { player.current?.pause(); setStatus("idle"); }
  const label = status === "listening" ? "Stop and send" : status === "thinking" ? "Thinking…" : status === "speaking" ? "Stop speaking" : "Talk to the case guide";

  return <aside className="voice-guide" aria-label="Synthetic voice case guide">
    <div className="voice-guide-header"><div><span className="mini-label">Optional voice guide</span><strong>Synthetic case guide</strong></div><Volume2 size={19} /></div>
    <p>Ask naturally about this fictional case. Nothing you say or record is saved.</p>
    {turn && <div className="voice-turn"><span>Heard: {turn.transcript}</span><strong>{turn.reply}</strong><small>Guided by deterministic synthetic case rules.</small></div>}
    {pending && <div className="voice-confirm"><strong>Confirm fictional action</strong><span>{pending.proposedAction.replaceAll("_", " ")}</span><button className="button primary" type="button" onClick={() => void confirm()}><Send size={15} /> Yes, continue</button><button className="link-button" type="button" onClick={() => setPending(null)}>Keep reviewing</button></div>}
    {error && <p className="voice-error" role="alert">{error}</p>}
    {speechNotice && <p className="voice-speech-note" role="status">{speechNotice}</p>}
    <div className="voice-actions">{status === "listening" ? <button className="button primary" type="button" onClick={stop}><Pause size={16} /> {label}</button> : status === "speaking" ? <button className="button secondary" type="button" onClick={stopSpeaking}><X size={16} /> {label}</button> : <button className="button primary" type="button" disabled={status === "thinking"} onClick={() => void start()}><Mic size={17} /> {label}</button>}{turn?.audioBase64 && status !== "speaking" && <button className="icon-button" type="button" onClick={() => play(turn, true)} aria-label="Play spoken guide reply"><Play size={16} /></button>}</div>
    <small className="voice-examples">Try: “What is the issue?” · “Show the diagnosis” · “Submit this”</small>
  </aside>;
}
