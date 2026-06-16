"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Bot,
  Loader2,
  Mic,
  Plus,
  Sparkles,
  UserRound,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PulseMark } from "@/components/ui/pulse-logo";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function PulseAiPage() {
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const hasMessages = messages.length > 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, isThinking]);

  function resizeTextarea() {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
  }

  async function submitQuestion(question: string) {
    const cleanQuestion = question.trim();

    if (!cleanQuestion || isThinking) return;

    setInput("");
    setError(null);
    setIsThinking(true);

    const userMessage: ChatMessage = {
      id: createId("user"),
      role: "user",
      content: cleanQuestion,
    };

    setMessages((current) => [...current, userMessage]);

    try {
      const response = await fetch("/api/pulse-ai/command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          command: cleanQuestion,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "pulse AI failed to answer.");
      }

      const assistantMessage: ChatMessage = {
        id: createId("assistant"),
        role: "assistant",
        content: data.answer || "I could not generate an answer.",
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "pulse AI failed to answer.";

      setError(message);

      setMessages((current) => [
        ...current,
        {
          id: createId("assistant"),
          role: "assistant",
          content: message,
        },
      ]);
    } finally {
      setIsThinking(false);

      setTimeout(() => {
        resizeTextarea();
      }, 0);
    }
  }

  function handleSubmit() {
    submitQuestion(input);
  }

  return (
    <AppShell
      showAiPanel={false}
      showSearch={false}
      showHeader={false}
      shellClassName="bg-slate-100 text-slate-950"
      contentClassName="px-0 py-0 bg-slate-50"
    >
      <div className="relative flex h-full min-h-0 flex-col bg-slate-50">
        <main className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col px-6">
          <div className="chat-scroll min-h-0 flex-1 overflow-y-auto">
            {!hasMessages ? (
              <div className="flex min-h-full flex-col items-center justify-center pb-40 text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                  <PulseMark size="lg" />
                </div>

                <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
                  pulse <span className="text-emerald-700">AI</span>
                </h1>

                <p className="mt-3 max-w-xl text-base leading-7 text-slate-600">
                  Ask about your synced Gmail, Calendar, meetings, workflows,
                  replies, priorities, and audits.
                </p>
              </div>
            ) : (
              <div className="space-y-8 py-8 pb-40">
                {messages.map((message) => {
                  const isUser = message.role === "user";

                  return (
                    <div
                      key={message.id}
                      className={`flex gap-4 ${
                        isUser ? "justify-end" : "justify-start"
                      }`}
                    >
                      {!isUser && (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                          <Bot className="h-4 w-4" />
                        </div>
                      )}

                      <div
                        className={
                          isUser
                            ? "max-w-[78%] rounded-3xl bg-slate-800 px-5 py-3 text-sm leading-6 text-white shadow-sm"
                            : "max-w-[85%] text-sm leading-7 text-slate-800"
                        }
                      >
                        {!isUser && (
                          <div className="mb-2 flex items-center gap-2">
                            <span className="font-semibold text-slate-950">
                              pulse AI
                            </span>
                            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                          </div>
                        )}

                        <div className="whitespace-pre-wrap">
                          {message.content}
                        </div>
                      </div>

                      {isUser && (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700">
                          <UserRound className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {isThinking && (
                  <div className="flex justify-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                      <Bot className="h-4 w-4" />
                    </div>

                    <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-500 ring-1 ring-slate-200">
                      <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />
                      pulse AI is thinking...
                    </div>
                  </div>
                )}

                {error && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </div>
                )}

                <div ref={bottomRef} />
              </div>
            )}
          </div>
        </main>

        <div className="fixed bottom-0 left-[15%] right-0 bg-gradient-to-t from-slate-50 via-slate-50/95 to-transparent px-6 pb-5 pt-10">
          <div className="mx-auto max-w-5xl">
            <div className="rounded-[30px] border border-slate-200 bg-white p-3 shadow-[0_14px_45px_rgba(15,23,42,0.08)]">
              <div className="flex items-end gap-3">
                <button
                  type="button"
                  className="mb-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                >
                  <Plus className="h-5 w-5" />
                </button>

                <textarea
                  ref={textareaRef}
                  value={input}
                  rows={1}
                  onInput={resizeTextarea}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder="Ask pulse AI anything..."
                  className="max-h-[180px] min-h-10 flex-1 resize-none border-none bg-transparent py-2 text-[15px] leading-6 text-slate-900 outline-none placeholder:text-slate-400"
                />

                <button
                  type="button"
                  className="mb-1 hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 sm:flex"
                >
                  <Mic className="h-5 w-5" />
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={isThinking || !input.trim()}
                  className="mb-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white transition hover:bg-emerald-800 active:bg-emerald-900 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-white"
                >
                  {isThinking ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <ArrowUp className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .chat-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .chat-scroll::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }
      `}</style>
    </AppShell>
  );
}