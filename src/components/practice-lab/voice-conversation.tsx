"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">{scenarioTitle}</CardTitle>
              <p className="text-sm text-slate-500">
                Speaking with {characterName} ({characterRole})
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={status === "connected" ? "success" : "secondary"}>
                {status === "connecting" ? "Connecting..." : status === "connected" ? "Listening" : status}
              </Badge>
              <Badge variant="secondary">
                {minutes}:{seconds.toString().padStart(2, "0")}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      <p className="text-xs text-slate-500">
        This conversation uses AI-generated voice. Your microphone is active during the session.
      </p>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">
          {error}
          <div className="mt-2">
            <Button asChild size="sm" variant="outline">
              <Link href={`/practice-lab/attempts/${attemptId}?fallback=text`}>Use Text Mode</Link>
            </Button>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="outline" onClick={toggleMute} disabled={status !== "connected"}>
          {muted ? "Unmute" : "Mute"}
        </Button>
        <Button variant="destructive" onClick={endConversation} disabled={ending}>
          {ending ? "Ending..." : "End Conversation"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Live Transcript</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 space-y-3 overflow-y-auto" aria-live="polite">
            {transcript.length === 0 ? (
              <p className="text-sm text-slate-500">Transcript will appear as you speak...</p>
            ) : (
              transcript.map((msg) => (
                <div key={msg.clientId} className="text-sm">
                  <span className="font-medium">
                    {msg.speaker === "EMPLOYEE" ? "You" : characterName}:
                  </span>{" "}
                  {msg.content}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-slate-400">
        Max duration: {maxDurationMinutes} min
      </p>
    </div>
  );
}
