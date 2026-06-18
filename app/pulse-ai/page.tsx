// "use client";

// import { useEffect, useRef, useState } from "react";
// import {
//   ArrowUp,
//   Bot,
//   Loader2,
//   Mic,
//   Plus,
//   Sparkles,
//   MessageSquarePlus,
//   UserRound,
// } from "lucide-react";
// import { AppShell } from "@/components/layout/app-shell";
// import { PulseMark } from "@/components/ui/pulse-logo";

// type ChatMessage = {
//   id: string;
//   role: "user" | "assistant";
//   content: string;
// };

// const PULSE_AI_CHAT_STORAGE_KEY = "pulse-ai-chat-v1";

// function createId(prefix: string) {
//   return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
// }

// async function readJson(response: Response) {
//   const text = await response.text();

//   try {
//     return JSON.parse(text);
//   } catch {
//     return {
//       success: false,
//       error:
//         "Server returned invalid JSON. Please sign in again or restart the app.",
//     };
//   }
// }

// export default function PulseAiPage() {
//   const [input, setInput] = useState("");
//   const [isThinking, setIsThinking] = useState(false);
//   const [messages, setMessages] = useState<ChatMessage[]>([]);
//   const [error, setError] = useState<string | null>(null);
//   const [hasLoadedHistory, setHasLoadedHistory] = useState(false);

//   const bottomRef = useRef<HTMLDivElement | null>(null);
//   const textareaRef = useRef<HTMLTextAreaElement | null>(null);

//   const hasMessages = messages.length > 0;

//   useEffect(() => {
//     try {
//       const saved = window.localStorage.getItem(PULSE_AI_CHAT_STORAGE_KEY);

//       if (saved) {
//         const parsed = JSON.parse(saved) as ChatMessage[];

//         if (Array.isArray(parsed)) {
//           setMessages(
//             parsed.filter(
//               (message) =>
//                 message &&
//                 typeof message.id === "string" &&
//                 (message.role === "user" || message.role === "assistant") &&
//                 typeof message.content === "string",
//             ),
//           );
//         }
//       }
//     } catch {
//       window.localStorage.removeItem(PULSE_AI_CHAT_STORAGE_KEY);
//     } finally {
//       setHasLoadedHistory(true);
//     }
//   }, []);

//   useEffect(() => {
//     if (!hasLoadedHistory) return;

//     window.localStorage.setItem(
//       PULSE_AI_CHAT_STORAGE_KEY,
//       JSON.stringify(messages),
//     );
//   }, [messages, hasLoadedHistory]);

//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({
//       behavior: "smooth",
//       block: "end",
//     });
//   }, [messages, isThinking]);

//   function resizeTextarea() {
//     const textarea = textareaRef.current;
//     if (!textarea) return;

//     textarea.style.height = "auto";
//     textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
//   }

//   function startNewChat() {
//     setMessages([]);
//     setInput("");
//     setError(null);
//     window.localStorage.removeItem(PULSE_AI_CHAT_STORAGE_KEY);
//   }

//   async function submitQuestion(question: string) {
//     const cleanQuestion = question.trim();

//     if (!cleanQuestion || isThinking) return;

//     setInput("");
//     setError(null);
//     setIsThinking(true);

//     setTimeout(() => {
//       resizeTextarea();
//     }, 0);

//     const userMessage: ChatMessage = {
//       id: createId("user"),
//       role: "user",
//       content: cleanQuestion,
//     };

//     setMessages((current) => [...current, userMessage]);

//     try {
//       const response = await fetch("/api/pulse-ai/command", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           command: cleanQuestion,
//         }),
//       });

//       const data = await readJson(response);

//       if (!response.ok || !data.success) {
//         throw new Error(data.error || "pulse AI failed to answer.");
//       }

//       const assistantMessage: ChatMessage = {
//         id: createId("assistant"),
//         role: "assistant",
//         content: data.answer || "I could not generate an answer.",
//       };

//       setMessages((current) => [...current, assistantMessage]);
//     } catch (error) {
//       const message =
//         error instanceof Error ? error.message : "pulse AI failed to answer.";

//       setError(message);

//       setMessages((current) => [
//         ...current,
//         {
//           id: createId("assistant"),
//           role: "assistant",
//           content: message,
//         },
//       ]);
//     } finally {
//       setIsThinking(false);

//       setTimeout(() => {
//         resizeTextarea();
//       }, 0);
//     }
//   }

//   function handleSubmit() {
//     submitQuestion(input);
//   }

//   return (
//     <AppShell
//       showAiPanel={false}
//       showSearch={false}
//       showHeader={false}
//       shellClassName="bg-slate-100 text-slate-950"
//       contentClassName="px-0 py-0 bg-slate-50"
//     >
//       <div className="relative flex h-full min-h-0 flex-col bg-slate-50">
//         <main className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col px-6">
//           <div className="chat-scroll min-h-0 flex-1 overflow-y-auto">
//             {!hasMessages ? (
//               <div className="flex min-h-full flex-col items-center justify-center pb-40 text-center">
//                 <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
//                   <PulseMark size="lg" />
//                 </div>

//                 <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
//                   pulse <span className="text-emerald-700">AI</span>
//                 </h1>

//                 <p className="mt-3 max-w-xl text-base leading-7 text-slate-600">
//                   Ask about your synced Gmail, Calendar, meetings, workflows,
//                   replies, priorities, and audits.
//                 </p>
//               </div>
//             ) : (
//               <div className="space-y-8 py-8 pb-40">
//                 <div className="flex justify-end">
//                   <button
//                     onClick={startNewChat}
//                     className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
//                   >
//                     <MessageSquarePlus className="h-3.5 w-3.5" />
//                     New chat
//                   </button>
//                 </div>

//                 {messages.map((message) => {
//                   const isUser = message.role === "user";

//                   return (
//                     <div
//                       key={message.id}
//                       className={`flex gap-4 ${
//                         isUser ? "justify-end" : "justify-start"
//                       }`}
//                     >
//                       {!isUser && (
//                         <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
//                           <Bot className="h-4 w-4" />
//                         </div>
//                       )}

//                       <div
//                         className={
//                           isUser
//                             ? "max-w-[78%] rounded-3xl bg-slate-800 px-5 py-3 text-sm leading-6 text-white shadow-sm"
//                             : "max-w-[85%] text-sm leading-7 text-slate-800"
//                         }
//                       >
//                         {!isUser && (
//                           <div className="mb-2 flex items-center gap-2">
//                             <span className="font-semibold text-slate-950">
//                               pulse AI
//                             </span>
//                             <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
//                           </div>
//                         )}

//                         <div className="whitespace-pre-wrap">
//                           {message.content}
//                         </div>
//                       </div>

//                       {isUser && (
//                         <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700">
//                           <UserRound className="h-4 w-4" />
//                         </div>
//                       )}
//                     </div>
//                   );
//                 })}

//                 {isThinking && (
//                   <div className="flex justify-start gap-4">
//                     <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
//                       <Bot className="h-4 w-4" />
//                     </div>

//                     <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-500 ring-1 ring-slate-200">
//                       <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />
//                       pulse AI is thinking...
//                     </div>
//                   </div>
//                 )}

//                 {error && (
//                   <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
//                     {error}
//                   </div>
//                 )}

//                 <div ref={bottomRef} />
//               </div>
//             )}
//           </div>
//         </main>

//         <div className="fixed bottom-0 left-[15%] right-0 bg-gradient-to-t from-slate-50 via-slate-50/95 to-transparent px-6 pb-5 pt-10">
//           <div className="mx-auto max-w-5xl">
//             <div className="rounded-[30px] border border-slate-200 bg-white p-3 shadow-[0_14px_45px_rgba(15,23,42,0.08)]">
//               <div className="flex items-end gap-3">
//                 <button
//                   type="button"
//                   className="mb-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
//                 >
//                   <Plus className="h-5 w-5" />
//                 </button>

//                 <textarea
//                   ref={textareaRef}
//                   value={input}
//                   rows={1}
//                   onInput={resizeTextarea}
//                   onChange={(event) => setInput(event.target.value)}
//                   onKeyDown={(event) => {
//                     if (event.key === "Enter" && !event.shiftKey) {
//                       event.preventDefault();
//                       handleSubmit();
//                     }
//                   }}
//                   placeholder="Ask pulse AI anything..."
//                   className="max-h-[180px] min-h-10 flex-1 resize-none border-none bg-transparent py-2 text-[15px] leading-6 text-slate-900 outline-none placeholder:text-slate-400"
//                 />

//                 <button
//                   type="button"
//                   className="mb-1 hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 sm:flex"
//                 >
//                   <Mic className="h-5 w-5" />
//                 </button>

//                 <button
//                   onClick={handleSubmit}
//                   disabled={isThinking || !input.trim()}
//                   className="mb-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white transition hover:bg-emerald-800 active:bg-emerald-900 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-white"
//                 >
//                   {isThinking ? (
//                     <Loader2 className="h-5 w-5 animate-spin" />
//                   ) : (
//                     <ArrowUp className="h-5 w-5" />
//                   )}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       <style jsx global>{`
//         .chat-scroll {
//           -ms-overflow-style: none;
//           scrollbar-width: none;
//         }

//         .chat-scroll::-webkit-scrollbar {
//           display: none;
//           width: 0;
//           height: 0;
//         }
//       `}</style>
//     </AppShell>
//   );
// }









































"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Bot,
  Loader2,
  Mic,
  Plus,
  Sparkles,
  MessageSquarePlus,
  UserRound,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PulseMark } from "@/components/ui/pulse-logo";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type PulseAiAction =
  | {
      type: "create_task";
      payload: {
        title?: string;
        description?: string;
        priority?: "low" | "normal" | "high" | "urgent" | "LOW" | "MEDIUM" | "HIGH";
        dueAt?: string | null;
        type?: string;
      };
      confirmationMessage?: string;
      preview?: string;
    }
  | {
      type: string;
      payload?: Record<string, unknown>;
      confirmationMessage?: string;
      preview?: string;
    };

type PulseAiStructuredAnswer = {
  reply?: string;
  chips?: string[];
  action?: PulseAiAction | null;
  filterQuery?: string | null;
};

const PULSE_AI_CHAT_STORAGE_KEY = "pulse-ai-chat-v1";

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

async function readJson(response: Response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return {
      success: false,
      error:
        "Server returned invalid JSON. Please sign in again or restart the app.",
    };
  }
}

function cleanAiText(value: string) {
  return value
    .replace(/\*\*\*/g, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/#{1,6}\s?/g, "")
    .replace(/`{3,}/g, "")
    .replace(/`/g, "")
    .replace(/\n{4,}/g, "\n\n")
    .trim();
}

function tryParseStructuredAnswer(value: string): PulseAiStructuredAnswer | null {
  try {
    const parsed = JSON.parse(value) as PulseAiStructuredAnswer;

    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  } catch {
    const match = value.match(/\{[\s\S]*\}/);

    if (!match) return null;

    try {
      const parsed = JSON.parse(match[0]) as PulseAiStructuredAnswer;

      if (parsed && typeof parsed === "object") {
        return parsed;
      }
    } catch {
      return null;
    }
  }

  return null;
}

function normalizePriority(priority?: string) {
  const value = String(priority || "").toLowerCase();

  if (value === "urgent" || value === "high" || value === "HIGH") {
    return "HIGH";
  }

  if (value === "low" || value === "LOW") {
    return "LOW";
  }

  return "MEDIUM";
}

function buildPulseAiCommand(question: string) {
  return `
You are pulse AI inside the user's app.

Behave like a smart workflow assistant, not a scripted bot.

Important answer rules:
- Do not use markdown bold syntax like ** or ***.
- Do not put stars in the middle of text.
- Use clean plain text.
- You may use simple bullets with "-".
- Be specific and helpful.
- Use the user's real Gmail, Calendar, meetings, workflows, and task context when available.
- If data is missing, say exactly what is missing.
- Never pretend an email was sent.
- Never pretend a meeting was created.
- Never pretend a task was created unless an action object is returned.

Task creation rule:
If the user asks you to create, add, make, schedule, remember, or track a task, return a JSON object with action.type = "create_task".

Return ONLY raw JSON. No markdown code block. No backticks. Start directly with {.

Required JSON shape:
{
  "reply": "Clean answer to show the user. Do not use ** or ***.",
  "chips": ["specific follow up 1", "specific follow up 2", "specific follow up 3"],
  "action": null or {
    "type": "create_task",
    "payload": {
      "title": "short task title",
      "description": "clear task description",
      "priority": "low or normal or high or urgent",
      "dueAt": "ISO date string if clear, otherwise null",
      "type": "GENERAL"
    },
    "confirmationMessage": "Task created and added to your Tasks page.",
    "preview": "Short preview of the task"
  },
  "filterQuery": null
}

Examples:
User: make a task for me to submit assignment tomorrow
Action should be create_task.

User: remind me to reply to Rahul today
Action should be create_task.

User: add task prepare for interview at 5pm
Action should be create_task.

User question:
${question}
  `.trim();
}

export default function PulseAiPage() {
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const hasMessages = messages.length > 0;

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(PULSE_AI_CHAT_STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved) as ChatMessage[];

        if (Array.isArray(parsed)) {
          setMessages(
            parsed.filter(
              (message) =>
                message &&
                typeof message.id === "string" &&
                (message.role === "user" || message.role === "assistant") &&
                typeof message.content === "string",
            ),
          );
        }
      }
    } catch {
      window.localStorage.removeItem(PULSE_AI_CHAT_STORAGE_KEY);
    } finally {
      setHasLoadedHistory(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedHistory) return;

    window.localStorage.setItem(
      PULSE_AI_CHAT_STORAGE_KEY,
      JSON.stringify(messages),
    );
  }, [messages, hasLoadedHistory]);

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

  function startNewChat() {
    setMessages([]);
    setInput("");
    setError(null);
    window.localStorage.removeItem(PULSE_AI_CHAT_STORAGE_KEY);
  }

  async function executeAction(action: PulseAiAction | null | undefined) {
    if (!action) return null;

    if (action.type !== "create_task") {
      return null;
    }

    const payload = action.payload || {};

    const title = String(payload.title || "").trim();
    const description = String(payload.description || "").trim();

    if (!title) {
      throw new Error("pulse AI tried to create a task, but no task title was provided.");
    }

    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        description,
        type: payload.type || "GENERAL",
        // priority: normalizePriority(payload.priority),
        dueAt: payload.dueAt || null,
      }),
    });

    const data = await readJson(response);

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Failed to create task.");
    }

    window.dispatchEvent(new Event("pulse:auto-sync-complete"));

    return {
      success: true,
      message:
        action.confirmationMessage ||
        "Task created successfully and added to your Tasks page.",
    };
  }

  async function submitQuestion(question: string) {
    const cleanQuestion = question.trim();

    if (!cleanQuestion || isThinking) return;

    setInput("");
    setError(null);
    setIsThinking(true);

    setTimeout(() => {
      resizeTextarea();
    }, 0);

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
          command: buildPulseAiCommand(cleanQuestion),
        }),
      });

      const data = await readJson(response);

      if (!response.ok || !data.success) {
        throw new Error(data.error || "pulse AI failed to answer.");
      }

      const rawAnswer = String(
        data.answer || "I could not generate an answer.",
      );

      const structuredAnswer = tryParseStructuredAnswer(rawAnswer);

      let assistantContent = structuredAnswer?.reply
        ? structuredAnswer.reply
        : rawAnswer;

      const actionResult = await executeAction(structuredAnswer?.action);

      if (actionResult?.success) {
        assistantContent = `${assistantContent}\n\n${actionResult.message}`;
      }

      const assistantMessage: ChatMessage = {
        id: createId("assistant"),
        role: "assistant",
        content: cleanAiText(assistantContent),
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
          content: cleanAiText(message),
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
                <div className="flex justify-end">
                  <button
                    onClick={startNewChat}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
                  >
                    <MessageSquarePlus className="h-3.5 w-3.5" />
                    New chat
                  </button>
                </div>

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