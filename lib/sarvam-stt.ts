export async function transcribeVoice(audio: File) {
  if (!process.env.SARVAM_API_KEY) throw new Error("Voice transcription is not configured.");
  const uploadType = supportedUploadType(audio.type);
  const upload = new Blob([await audio.arrayBuffer()], { type: uploadType });
  const form = new FormData();
  form.append("file", upload, "assistant-voice.webm");
  form.append("model", process.env.SARVAM_STT_MODEL || "saaras:v3");
  form.append("mode", "transcribe");
  const response = await fetch("https://api.sarvam.ai/speech-to-text", { method: "POST", headers: { "api-subscription-key": process.env.SARVAM_API_KEY }, body: form, signal: AbortSignal.timeout(20_000) });
  const body = await response.text();
  if (!response.ok) {
    console.error("EPFO Resolve Sarvam transcription rejected", { status: response.status, audioBytes: audio.size, audioType: audio.type, uploadType, detail: body.slice(0, 500) });
    throw new Error("We could not transcribe that recording. Please try again or type your question.");
  }
  const payload = JSON.parse(body) as { transcript?: string };
  if (!payload.transcript?.trim()) throw new Error("No speech was detected. Please try again or type your question.");
  return payload.transcript.trim();
}

export function supportedUploadType(audioType: string) {
  const mimeType = audioType.split(";", 1)[0].trim().toLowerCase();
  return mimeType === "audio/webm" || mimeType === "video/webm" ? mimeType : "audio/webm";
}
