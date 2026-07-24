"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  speaker: string;
  content: string;
  sequence: number;
}

interface TextConversationProps {
  attemptId: string;
  initialMessages: Message[];
  characterName: string;
  characterRole: string;
  scenarioTitle: string;
  maxDurationMinutes: number;
  startedAt: string;
  isPreview?: boolean;
}

export function TextConversation({
  attemptId,
  initialMessages,
  characterName,
  characterRole,
  scenarioTitle,
  maxDurationMinutes,
  startedAt,
  isPreview,
}: TextConversationProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const content = input.trim();
    setInput("");
    setLoading(true);
    setError("");

    const tempSeq = messages.length + 1;
    setMessages((prev) => [
      ...prev,
      {
        id: `temp-${tempSeq}`,
        speaker: "EMPLOYEE",
        content,
        sequence: tempSeq,
      },
    ]);

    try {
      const res = await fetch(`/api/practice-lab/attempts/${attemptId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to send message");
        setMessages((prev) => prev.filter((m) => m.id !== `temp-${tempSeq}`));
        setInput(content);
        return;
      }

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== `temp-${tempSeq}`),
        { id: `emp-${tempSeq}`, speaker: "EMPLOYEE", content, sequence: tempSeq },
        data.message,
      ]);
    } catch {
      setError("Connection error. Your message was not lost — please try again.");
      setInput(content);
    } finally {
      setLoading(false);
    }
  }

  async function endConversation() {
    setEnding(true);
    setError("");

    try {
      const res = await fetch(`/api/practice-lab/attempts/${attemptId}/end`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to end conversation");
        if (data.canRetry) {
          setError(`${data.error}. You can retry evaluation from feedback.`);
        }
        setEnding(false);
        return;
      }

      router.push(`/practice-lab/attempts/${attemptId}/feedback`);
    } catch {
      setError("Failed to end conversation. Please try again.");
      setEnding(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {isPreview && (
        <div className="mb-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Administrator Preview — this attempt will not count as employee training.
        </div>
      )}

      <Card className="mb-4">
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">{scenarioTitle}</CardTitle>
              <p className="text-sm text-slate-500">
                Speaking with {characterName} ({characterRole})
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{timeDisplay}</Badge>
              <Button variant="destructive" size="sm" onClick={endConversation} disabled={ending}>
                {ending ? "Ending..." : "End Conversation"}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="flex flex-1 flex-col overflow-hidden">
        <CardContent className="flex flex-1 flex-col p-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-4" aria-live="polite">
            {messages.map((msg) => (
              <div
                key={`${msg.sequence}-${msg.id}`}
                className={`flex ${msg.speaker === "EMPLOYEE" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.speaker === "EMPLOYEE"
                      ? "bg-sky-600 text-white"
                      : "bg-slate-100 text-slate-900"
                  }`}
                >
                  {msg.speaker === "CHARACTER" && (
                    <p className="mb-1 text-xs font-medium text-slate-500">{characterName}</p>
                  )}
                  <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-500">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-slate-200 p-4">
            {error && <p className="mb-2 text-sm text-red-600" role="alert">{error}</p>}
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your response..."
                rows={2}
                disabled={loading || ending}
                aria-label="Your message"
                maxLength={2000}
              />
              <Button onClick={sendMessage} disabled={loading || ending || !input.trim()}>
                Send
              </Button>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Max duration: {maxDurationMinutes} min · Press Enter to send
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="mt-2 text-center">
        <Link href="/practice-lab" className="text-sm text-slate-500 hover:underline">
          Exit to Practice Lab
        </Link>
      </div>
    </div>
  );
}
