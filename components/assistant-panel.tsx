"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, LoaderCircle, Mic, Send, Sparkles, Square, Volume2 } from "lucide-react";
import { AssistantMessage, ASSISTANT_SOURCES } from "@/lib/assistant";
import { DemoCase } from "@/lib/domain";
import { Locale } from "@/lib/locales";

type Props = {
  locale: Locale;
  caseData: DemoCase;
  requestHeaders: () => Promise<Record<string, string>>;
  collapsed: boolean;
  onToggle: () => void;
};

const suggestions = ["Explain this screen", "What happens next?", "What EPFO rule explains this?"];

export function AssistantPanel({ locale, caseData, requestHeaders, collapsed, onToggle }: Props) {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [notice, setNotice] = useState("");
  const transcriptRef = useRef<HTMLDivElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startedAtRef = useRef(0);
  const stopTimerRef = useRef<number | null>(null);

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => () => {
    if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current);
    recorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  async function submit(value = draft) {
    const question = value.trim().slice(0, 1200);
    if (!question || busy) return;
    const prior = messages.slice(-7);
    const nextMessages: AssistantMessage[] = [...prior, { role: "user", content: question }];
    setMessages([...nextMessages, { role: "assistant", content: "" }]);
    setDraft("");
    setNotice("");
    setBusy(true);
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: await requestHeaders(),
        body: JSON.stringify({ locale, caseData, messages: nextMessages }),
      });
      if (!response.body) throw new Error("The assistant response was unavailable.");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let answer = "";
      const append = (delta: string) => {
        answer += delta;
        setMessages([...nextMessages, { role: "assistant", content: answer }]);
      };
      while (true) {
        const { value: chunk, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(chunk, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";
        for (const event of events) {
          const data = event.split("\n").find((line) => line.startsWith("data: "))?.slice(6);
          if (!data || data === "[DONE]") continue;
          const payload = JSON.parse(data) as { delta?: string };
          if (payload.delta) append(payload.delta);
        }
      }
      if (!answer) append("I could not prepare a reply. Please try again or use the verified case details on this screen.");
    } catch {
      setMessages([...nextMessages, { role: "assistant", content: "I could not reach the assistant. The verified synthetic case details and visible workflow remain available." }]);
    } finally {
      setBusy(false);
    }
  }

  function onComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  }

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setNotice("Recording is not supported in this browser. Type your question instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredType = ["audio/webm;codecs=opus", "audio/webm"].find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = preferredType ? new MediaRecorder(stream, { mimeType: preferredType }) : new MediaRecorder(stream);
      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];
      startedAtRef.current = Date.now();
      recorder.addEventListener("dataavailable", (event) => { if (event.data.size) chunksRef.current.push(event.data); });
      recorder.addEventListener("stop", () => { void transcribeRecording(recorder.mimeType || preferredType || "audio/webm"); }, { once: true });
      recorder.start(250);
      setNotice("Listening… tap the square when you are done.");
      setRecording(true);
      stopTimerRef.current = window.setTimeout(() => stopRecording(), 15_000);
    } catch {
      setNotice("Microphone permission was not granted. Type your question instead.");
    }
  }

  function stopRecording() {
    if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current);
    stopTimerRef.current = null;
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    setRecording(false);
  }

  async function transcribeRecording(type: string) {
    const duration = Date.now() - startedAtRef.current;
    const audio = new Blob(chunksRef.current, { type });
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
    if (duration < 500 || audio.size < 900) {
      setNotice("That recording was too short. Please try again or type your question.");
      return;
    }
    setTranscribing(true);
    setNotice("Transcribing your question…");
    try {
      const headers = await requestHeaders();
      delete headers["Content-Type"];
      const form = new FormData();
      form.append("audio", new File([audio], "assistant-voice.webm", { type: "audio/webm" }));
      const response = await fetch("/api/assistant/transcribe", { method: "POST", headers, body: form });
      const payload = await response.json() as { transcript?: string; error?: string };
      if (!response.ok || !payload.transcript) throw new Error(payload.error || "We could not transcribe that recording.");
      setDraft(payload.transcript);
      setNotice("Transcript added to the prompt. Review or edit it, then send.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "We could not transcribe that recording. Type your question instead.");
    } finally {
      setTranscribing(false);
    }
  }

  return <aside className={collapsed ? "assistant-panel collapsed" : "assistant-panel"} aria-label="Resolve Assistant">
    <header className="assistant-header">
      {!collapsed && <div><span className="assistant-eyebrow"><Sparkles size={13} /> Optional case assistant</span><h2>Ask about this case</h2></div>}
      <button className="assistant-collapse" type="button" onClick={onToggle} aria-label={collapsed ? "Open case assistant" : "Collapse case assistant"} title={collapsed ? "Open assistant" : "Collapse assistant"}>
        {collapsed ? <ChevronLeft size={19} /> : <ChevronRight size={19} />}
      </button>
    </header>
    {!collapsed && <>
      <div className="assistant-chat" ref={transcriptRef} aria-live="polite" aria-label="Assistant conversation">
        {messages.length === 0 && <div className="assistant-welcome"><div className="assistant-avatar"><Sparkles size={19} /></div><h3>Hello — I’m the case guide.</h3><p>I can explain this fictional case and the visible next step. I cannot access EPFO or change the workflow.</p><div className="assistant-suggestions">{suggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => void submit(suggestion)} disabled={busy}>{suggestion}</button>)}</div></div>}
        {messages.map((message, index) => <div className={`assistant-message ${message.role}`} key={`${message.role}-${index}`}><span>{message.role === "assistant" ? "Resolve Assistant" : "You"}</span><p>{message.content || <LoaderCircle className="spin" size={16} aria-label="Thinking" />}</p></div>)}
      </div>
      <footer className="assistant-composer-wrap">
        {notice && <p className="assistant-notice" role="status">{notice}</p>}
        <form className="assistant-composer" onSubmit={(event: FormEvent) => { event.preventDefault(); void submit(); }}>
          <textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={onComposerKeyDown} maxLength={1200} rows={2} placeholder="Ask about the fictional case…" aria-label="Question for Resolve Assistant" disabled={busy || transcribing} />
          <div className="assistant-composer-actions">
            <button className={recording ? "assistant-mic recording" : "assistant-mic"} type="button" onClick={recording ? stopRecording : () => void startRecording()} disabled={busy || transcribing} aria-label={recording ? "Stop recording" : "Transcribe a spoken question"} title={recording ? "Stop recording" : "Speak a question"}>{recording ? <Square size={15} fill="currentColor" /> : transcribing ? <LoaderCircle className="spin" size={17} /> : <Mic size={17} />}</button>
            <button className="assistant-send" type="submit" disabled={!draft.trim() || busy || transcribing} aria-label="Send question"><Send size={17} /></button>
          </div>
        </form>
        <p className="assistant-boundary"><Volume2 size={13} /> Speech is transcribed only after you tap the mic; it is never sent automatically.</p>
        <p className="assistant-sources">Official context: {ASSISTANT_SOURCES.map((source, index) => <span key={source.id}>{index > 0 && " · "}<a href={source.url} target="_blank" rel="noreferrer">{source.label}</a></span>)}</p>
      </footer>
    </>}
  </aside>;
}
