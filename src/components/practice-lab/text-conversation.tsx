"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Clock, Send, AlertTriangle, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";

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
      setError("Connection error. Your message was not sent. Please try again.");
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
    <div className="mx-auto flex h-[calc(100vh-6rem)] max-w-3xl flex-col animate-fade-up sm:h-[calc(100vh-7rem)]">
      {isPreview && (
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Administrator preview. This attempt will not count as employee training.
        </div>
      )}

      <Card className="mb-3 shrink-0">
        <CardHeader className="py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
                {getInitials(characterName)}
              </span>
              <div>
                <CardTitle className="text-base">{scenarioTitle}</CardTitle>
                <p className="text-sm text-zinc-500">
                  {characterName} · {characterRole}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="hidden font-mono sm:inline-flex">
                <Clock className="h-3 w-3" /> {timeDisplay}
              </Badge>
              <Button variant="destructive" size="sm" onClick={endConversation} disabled={ending}>
                <PhoneOff className="h-3.5 w-3.5" />
                {ending ? "Ending..." : "End"}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="flex flex-1 flex-col overflow-hidden">
        <CardContent className="flex flex-1 flex-col p-0">
          <div className="scroll-thin flex-1 space-y-4 overflow-y-auto p-4" aria-live="polite">
            {messages.map((msg) => {
              const isEmployee = msg.speaker === "EMPLOYEE";
              return (
                <div
                  key={`${msg.sequence}-${msg.id}`}
                  className={`flex items-end gap-2 ${isEmployee ? "justify-end" : "justify-start"}`}
                >
                  {!isEmployee && (
                    <span className="mb-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-semibold text-white">
                      {getInitials(characterName)}
                    </span>
                  )}
                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-soft ${
                      isEmployee
                        ? "rounded-br-md bg-brand-600 text-white"
                        : "rounded-bl-md bg-zinc-100 text-zinc-900"
                    }`}
                  >
                    {!isEmployee && (
                      <p className="mb-0.5 text-xs font-medium text-zinc-500">{characterName}</p>
                    )}
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex items-end justify-start gap-2">
                <span className="mb-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-semibold text-white">
                  {getInitials(characterName)}
                </span>
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-zinc-100 px-4 py-3">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-zinc-100 p-4">
            {error && (
              <p className="mb-2 text-sm text-rose-600" role="alert">
                {error}
              </p>
            )}
            <div className="flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your response..."
                rows={2}
                disabled={loading || ending}
                aria-label="Your message"
                maxLength={2000}
                className="resize-none"
              />
              <Button
                onClick={sendMessage}
                disabled={loading || ending || !input.trim()}
                size="icon"
                className="h-10 w-10 shrink-0"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-1.5 text-xs text-zinc-400">
              Max duration: {maxDurationMinutes} min · Press Enter to send
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="mt-3 text-center">
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
