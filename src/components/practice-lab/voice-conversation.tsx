"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Clock, Mic, MicOff, PhoneOff, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, getInitials } from "@/lib/utils";

interface TranscriptMessage {
  speaker: "EMPLOYEE" | "CHARACTER";
  content: string;
  clientId: string;
}

interface VoiceConversationProps {
  attemptId: string;
  characterName: string;
  characterRole: string;
  scenarioTitle: string;
  maxDurationMinutes: number;
  startedAt: string;
}

export function VoiceConversation({
  attemptId,
  characterName,
  characterRole,
  scenarioTitle,
  maxDurationMinutes,
  startedAt,
}: VoiceConversationProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"connecting" | "connected" | "error" | "ended">("connecting");
  const [muted, setMuted] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [error, setError] = useState("");
  const [ending, setEnding] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const transcriptMapRef = useRef<Map<string, TranscriptMessage>>(new Map());
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const addTranscript = useCallback((speaker: "EMPLOYEE" | "CHARACTER", content: string, clientId: string) => {
    if (!content.trim()) return;
    const existing = transcriptMapRef.current.get(clientId);
    if (existing) {
      existing.content = content;
    } else {
      transcriptMapRef.current.set(clientId, { speaker, content, clientId });
    }
    setTranscript(Array.from(transcriptMapRef.current.values()));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  useEffect(() => {
    let cancelled = false;

    async function connect() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("error");
        setError("Your browser does not support voice practice. Please use text mode.");
        return;
      }

      try {
        const sessionRes = await fetch(`/api/practice-lab/attempts/${attemptId}/voice`);
        const sessionData = await sessionRes.json();
        if (!sessionRes.ok) {
          setStatus("error");
          setError(sessionData.error ?? "Failed to start voice session");
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;

        const pc = new RTCPeerConnection();
        pcRef.current = pc;

        const audioEl = document.createElement("audio");
        audioEl.autoplay = true;
        audioRef.current = audioEl;

        pc.ontrack = (e) => {
          audioEl.srcObject = e.streams[0];
        };

        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        const dc = pc.createDataChannel("oai-events");
        dcRef.current = dc;

        dc.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);

            if (msg.type === "response.output_audio_transcript.done") {
              addTranscript("CHARACTER", msg.transcript ?? "", `char-${msg.response_id ?? Date.now()}`);
            }
            if (msg.type === "conversation.item.input_audio_transcription.completed") {
              addTranscript("EMPLOYEE", msg.transcript ?? "", `emp-${msg.item_id ?? Date.now()}`);
            }
            if (msg.type === "response.audio_transcript.done") {
              addTranscript("CHARACTER", msg.transcript ?? "", `char-alt-${Date.now()}`);
            }
          } catch {
            // ignore parse errors
          }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        const sdpResponse = await fetch("https://api.openai.com/v1/realtime/calls", {
          method: "POST",
          body: offer.sdp,
          headers: {
            Authorization: `Bearer ${sessionData.clientSecret}`,
            "Content-Type": "application/sdp",
          },
        });

        if (!sdpResponse.ok) {
          setStatus("error");
          setError("Failed to connect voice session. Try text mode instead.");
          return;
        }

        const answerSdp = await sdpResponse.text();
        await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

        if (!cancelled) {
          setStatus("connected");
        }
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          const message = err instanceof Error ? err.message : "Voice connection failed";
          if (message.includes("Permission") || message.includes("NotAllowed")) {
            setError("Microphone permission denied. Please allow microphone access or use text mode.");
          } else {
            setError(message);
          }
        }
      }
    }

    connect();

    return () => {
      cancelled = true;
      dcRef.current?.close();
      pcRef.current?.close();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [attemptId, addTranscript]);

  function toggleMute() {
    const tracks = localStreamRef.current?.getAudioTracks();
    if (tracks) {
      tracks.forEach((t) => {
        t.enabled = muted;
      });
      setMuted(!muted);
    }
  }

  async function endConversation() {
    setEnding(true);

    try {
      await fetch(`/api/practice-lab/attempts/${attemptId}/voice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: transcript }),
      });

      dcRef.current?.close();
      pcRef.current?.close();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());

      const res = await fetch(`/api/practice-lab/attempts/${attemptId}/end`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to complete the conversation");
        setEnding(false);
        return;
      }

      router.push(`/practice-lab/attempts/${attemptId}/feedback`);
    } catch {
      setError("Failed to end conversation");
      setEnding(false);
    }
  }

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const statusLabel =
    status === "connecting" ? "Connecting..." : status === "connected" ? "Listening" : status === "ended" ? "Ended" : "Error";

  return (
    <div className="mx-auto max-w-2xl space-y-4 animate-fade-up">
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{scenarioTitle}</CardTitle>
            <Badge variant="secondary" className="font-mono">
              <Clock className="h-3 w-3" />
              {minutes}:{seconds.toString().padStart(2, "0")}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700" role="alert">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            {error}
            <div className="mt-2">
              <Button asChild size="sm" variant="outline">
                <Link href={`/practice-lab/attempts/${attemptId}?fallback=text`}>Use Text Mode</Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardContent className="flex flex-col items-center gap-5 py-10">
          <div className="relative flex h-28 w-28 items-center justify-center">
            {status === "connected" && (
              <span className="absolute inset-0 animate-pulse-ring rounded-full bg-brand-400/40" />
            )}
            <span
              className={cn(
                "relative flex h-24 w-24 items-center justify-center rounded-full text-2xl font-semibold text-white shadow-glow",
                status === "connected" ? "bg-gradient-to-br from-brand-500 to-brand-700" : "bg-zinc-400"
              )}
            >
              {getInitials(characterName)}
            </span>
          </div>
          <div className="text-center">
            <p className="font-display text-lg font-semibold text-zinc-900">{characterName}</p>
            <p className="text-sm text-zinc-500">{characterRole}</p>
            <Badge
              variant={status === "connected" ? "success" : status === "error" ? "destructive" : "secondary"}
              className="mt-2"
            >
              {statusLabel}
            </Badge>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={toggleMute}
              disabled={status !== "connected"}
              aria-label={muted ? "Unmute microphone" : "Mute microphone"}
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full border transition-colors disabled:pointer-events-none disabled:opacity-50",
                muted
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
              )}
            >
              {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
            <button
              type="button"
              onClick={endConversation}
              disabled={ending}
              aria-label="End conversation"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-600 text-white shadow-soft transition-colors hover:bg-rose-700 disabled:pointer-events-none disabled:opacity-50"
            >
              <PhoneOff className="h-5 w-5" />
            </button>
          </div>
          <p className="text-xs text-zinc-400">
            This conversation uses AI-generated voice. Your microphone is active during the session.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Live Transcript</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="scroll-thin max-h-80 space-y-3 overflow-y-auto" aria-live="polite">
            {transcript.length === 0 ? (
              <p className="text-sm text-zinc-400">Transcript will appear as you speak...</p>
            ) : (
              transcript.map((msg) => (
                <div
                  key={msg.clientId}
                  className={`flex ${msg.speaker === "EMPLOYEE" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                      msg.speaker === "EMPLOYEE" ? "bg-brand-50 text-brand-900" : "bg-zinc-100 text-zinc-900"
                    }`}
                  >
                    <span className="mb-0.5 block text-xs font-medium text-zinc-500">
                      {msg.speaker === "EMPLOYEE" ? "You" : characterName}
                    </span>
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            <div ref={transcriptEndRef} />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col items-center gap-2 pb-4 text-center">
        <p className="text-xs text-zinc-400">Max duration: {maxDurationMinutes} min</p>
        <Link
          href="/practice-lab"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-brand-600"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Exit to Practice Lab
        </Link>
      </div>
    </div>
  );
}
