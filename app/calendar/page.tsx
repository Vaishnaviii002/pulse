"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bot,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock,
  Loader2,
  PanelRightClose,
  PanelRightOpen,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PulseMark } from "@/components/ui/pulse-logo";

type CalendarMeeting = {
  id: string;
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  status: string;
  source: string;
  meetingUrl: string;
  attendees: string[];
  sourceEmailId: string | null;
  sourceEmail: {
    id: string;
    subject: string;
    fromName: string;
    fromEmail: string;
    snippet: string;
    bodyText: string;
    receivedAt: string | null;
    threadSubject: string;
  } | null;
  readiness: {
    score: number;
    label: "Ready" | "Needs preparation" | "Not ready";
    missing: string[];
  };
};

type FilterKey = "ALL" | "TODAY" | "FROM_EMAIL" | "WITH_LINK" | "NEEDS_PREP";

type AiTrigger = {
  id: number;
  command: string;
};

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "TODAY", label: "Today" },
];

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 11 }, (_, index) => index + 8);
const START_HOUR = 8;
const END_HOUR = 19;
const HOUR_HEIGHT = 76;

function startOfWeek(date: Date) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() - copy.getDay());
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

function isTodayDate(date: Date) {
  return isSameDay(date, new Date());
}

function formatWeekRange(start: Date) {
  const end = addDays(start, 6);

  const startText = new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
  }).format(start);

  const endText = new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(end);

  return `${startText} – ${endText}`;
}

function toMonthInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

function getWeekStartFromMonthValue(value: string) {
  const [year, month] = value.split("-").map(Number);
  return startOfWeek(new Date(year, month - 1, 1));
}

function formatTime(value?: string | null) {
  if (!value) return "";

  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getMeetingCardClass(meeting: CalendarMeeting) {
  if (meeting.sourceEmailId) {
    return "border-emerald-300 bg-emerald-50 text-emerald-950 hover:bg-emerald-100";
  }

  if (meeting.readiness.label !== "Ready") {
    return "border-amber-300 bg-amber-50 text-amber-950 hover:bg-amber-100";
  }

  if (meeting.meetingUrl) {
    return "border-blue-300 bg-blue-50 text-blue-950 hover:bg-blue-100";
  }

  return "border-slate-300 bg-slate-50 text-slate-900 hover:bg-slate-100";
}

function getMeetingPosition(meeting: CalendarMeeting) {
  const start = new Date(meeting.startTime);
  const end = new Date(meeting.endTime);

  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();

  const gridStartMinutes = START_HOUR * 60;
  const gridEndMinutes = END_HOUR * 60;

  const clampedStart = Math.max(startMinutes, gridStartMinutes);
  const clampedEnd = Math.min(endMinutes, gridEndMinutes);

  const top = ((clampedStart - gridStartMinutes) / 60) * HOUR_HEIGHT;
  const height = Math.max(42, ((clampedEnd - clampedStart) / 60) * HOUR_HEIGHT);

  return {
    top,
    height,
  };
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

export default function CalendarPage() {
  const router = useRouter();

  const [meetings, setMeetings] = useState<CalendarMeeting[]>([]);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("ALL");

  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiTrigger, setAiTrigger] = useState<AiTrigger | null>(null);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  }, [weekStart]);

  const loadMeetings = useCallback(async () => {
    try {
      setIsLoading(true);
      setPageError(null);

      const response = await fetch("/api/meetings", {
        method: "GET",
        cache: "no-store",
      });

      const data = await readJson(response);

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to load calendar meetings.");
      }

      setMeetings(data.meetings || []);
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Failed to load calendar.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  useEffect(() => {
  function handleAutoSyncComplete() {
    void loadMeetings();
  }

  window.addEventListener("pulse:auto-sync-complete", handleAutoSyncComplete);

  return () => {
    window.removeEventListener(
      "pulse:auto-sync-complete",
      handleAutoSyncComplete
    );
  };
}, [loadMeetings]);

  useEffect(() => {
  const intervalId = window.setInterval(() => {
    void loadMeetings();
  }, 30000);

  function handleFocus() {
    void loadMeetings();
  }

  window.addEventListener("focus", handleFocus);

  return () => {
    window.clearInterval(intervalId);
    window.removeEventListener("focus", handleFocus);
  };
}, [loadMeetings]);

  const filteredMeetings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    

    return meetings.filter((meeting) => {
      const matchesSearch =
        !q ||
        meeting.title.toLowerCase().includes(q) ||
        meeting.description.toLowerCase().includes(q) ||
        meeting.attendees.join(" ").toLowerCase().includes(q) ||
        meeting.sourceEmail?.subject.toLowerCase().includes(q) ||
        meeting.sourceEmail?.fromEmail.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (activeFilter === "TODAY") {
        return isSameDay(new Date(meeting.startTime), new Date());
      }

      if (activeFilter === "FROM_EMAIL") {
        return Boolean(meeting.sourceEmailId);
      }

      if (activeFilter === "WITH_LINK") {
        return Boolean(meeting.meetingUrl);
      }

      if (activeFilter === "NEEDS_PREP") {
        return meeting.readiness.label !== "Ready";
      }

      return true;
    });
  }, [meetings, searchQuery, activeFilter]);

  const weekMeetings = useMemo(() => {
    const weekEnd = addDays(weekStart, 7);

    return filteredMeetings.filter((meeting) => {
      const start = new Date(meeting.startTime);
      return start >= weekStart && start < weekEnd;
    });
  }, [filteredMeetings, weekStart]);

  const meetingsByDay = useMemo(() => {
    return weekDays.map((day) =>
      weekMeetings
        .filter((meeting) => isSameDay(new Date(meeting.startTime), day))
        .sort(
          (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
        ),
    );
  }, [weekDays, weekMeetings]);

  function handleFilterChange(filter: FilterKey) {
  setActiveFilter(filter);

  if (filter === "TODAY") {
    setWeekStart(startOfWeek(new Date()));
  }
}

  async function handleSyncCalendar() {
    try {
      setIsSyncing(true);
      setPageError(null);

      const response = await fetch("/api/calendar/sync", {
        method: "POST",
      });

      const data = await readJson(response);

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to sync Google Calendar.");
      }

      await loadMeetings();
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Failed to sync Google Calendar.",
      );
    } finally {
      setIsSyncing(false);
    }
  }

  function openMeeting(meetingId: string) {
    router.push(`/meetings?meetingId=${meetingId}`);
  }

  return (
    <AppShell
      showAiPanel={isAiOpen}
      showSearch={false}
      showHeader={false}
      rightPanel={
        isAiOpen ? (
          <CalendarPulseAiPanel
            meetings={filteredMeetings}
            trigger={aiTrigger}
            onClose={() => setIsAiOpen(false)}
            onSyncCalendar={handleSyncCalendar}
          />
        ) : undefined
      }
    >
      <div className="flex h-full min-h-0 flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              Calendar
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              View schedules, timing, and meeting history.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAiOpen((current) => !current)}
              className={`inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold shadow-sm transition ${
                isAiOpen
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                  : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
              }`}
            >
              {isAiOpen ? (
                <PanelRightClose className="h-4 w-4" />
              ) : (
                <PanelRightOpen className="h-4 w-4" />
              )}
              pulse AI
            </button>

            <Link
              href="/api/corsair/oauth/calendar/start"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
            >
              <CalendarClock className="h-4 w-4" />
              Connect Calendar
            </Link>

            <button
              onClick={handleSyncCalendar}
              disabled={isSyncing}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSyncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {isSyncing ? "Syncing..." : "Sync Calendar"}
            </button>
          </div>
        </div>

        {pageError && (
          <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <CircleAlert className="h-4 w-4" />
            <span>{pageError}</span>
          </div>
        )}

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-300 bg-white p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {FILTERS.map((filter) => {
                  const active = activeFilter === filter.key;

                  return (
                    <button
                      key={filter.key}
                      onClick={() => handleFilterChange(filter.key)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        active
                          ? "bg-emerald-700 text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {filter.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setWeekStart(addDays(weekStart, -7))}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <input
                  type="month"
                  value={toMonthInputValue(weekStart)}
                  onChange={(event) => {
                    setWeekStart(
                      getWeekStartFromMonthValue(event.target.value),
                    );
                  }}
                  className="h-10 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-300"
                />

                <div className="min-w-[210px] text-center">
                  <p className="text-sm font-semibold text-slate-950">
                    {formatWeekRange(weekStart)}
                  </p>
                </div>

                <button
                  onClick={() => setWeekStart(addDays(weekStart, 7))}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto p-5">
            {isLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading calendar...
              </div>
            ) : (
              <div className="min-w-[900px] overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="grid grid-cols-[72px_repeat(7,minmax(110px,1fr))] border-b border-slate-200 bg-white">
                  <div className="border-r border-slate-200 px-3 py-3 text-xs text-slate-400" />

                  {weekDays.map((day, index) => (
                    <div
                      key={day.toISOString()}
                      className="border-r border-slate-200 px-3 py-3 text-center"
                    >
                      <p className="text-xs font-semibold text-slate-500">
                        {WEEK_DAYS[index]}
                      </p>

                      <div
                        className={`mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                          isTodayDate(day)
                            ? "bg-emerald-700 text-white"
                            : "text-slate-700"
                        }`}
                      >
                        {day.getDate()}
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  className="relative grid grid-cols-[72px_repeat(7,minmax(110px,1fr))]"
                  style={{ height: HOURS.length * HOUR_HEIGHT }}
                >
                  <div className="border-r border-slate-200 bg-white">
                    {HOURS.map((hour) => (
                      <div
                        key={hour}
                        className="border-b border-slate-200 px-3 text-right text-[11px] font-medium text-slate-400"
                        style={{ height: HOUR_HEIGHT }}
                      >
                        {hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                      </div>
                    ))}
                  </div>

                  {weekDays.map((day, dayIndex) => (
                    <div
                      key={day.toISOString()}
                      className="relative border-r border-slate-200"
                    >
                      {HOURS.map((hour) => (
                        <div
                          key={hour}
                          className="border-b border-slate-200"
                          style={{ height: HOUR_HEIGHT }}
                        />
                      ))}

                      {meetingsByDay[dayIndex].map((meeting, meetingIndex) => {
                        const position = getMeetingPosition(meeting);

                        return (
                          <button
                            key={meeting.id}
                            onClick={() => openMeeting(meeting.id)}
                            className={`absolute left-2 right-2 overflow-hidden rounded-xl border px-2 py-1.5 text-left text-[11px] leading-4 shadow-sm transition ${getMeetingCardClass(
                              meeting,
                            )}`}
                            style={{
                              top: position.top + meetingIndex * 2,
                              height: position.height,
                            }}
                          >
                            <p className="truncate font-bold">
                              {formatTime(meeting.startTime)}
                            </p>
                            <p className="mt-0.5 line-clamp-2 font-semibold">
                              {meeting.title || "Untitled meeting"}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-700" />
                <h3 className="text-sm font-semibold text-slate-950">
                  Synced meeting activity & time insights
                </h3>
              </div>

              <div className="grid gap-3 md:grid-cols-4">
                <InsightCard
                  label="This week"
                  value={`${weekMeetings.length} meetings`}
                  detail="All meetings visible in the selected week."
                />
                <InsightCard
                  label="Email-created"
                  value={`${
                    weekMeetings.filter((meeting) => meeting.sourceEmailId)
                      .length
                  } meetings`}
                  detail="Meetings created from Gmail workflow."
                />
                <InsightCard
                  label="Needs prep"
                  value={`${
                    weekMeetings.filter(
                      (meeting) => meeting.readiness.label !== "Ready",
                    ).length
                  } meetings`}
                  detail="Meetings missing agenda, attendees, or link."
                />
                <InsightCard
                  label="Meet links"
                  value={`${
                    weekMeetings.filter((meeting) => meeting.meetingUrl).length
                  } meetings`}
                  detail="Meetings with online meeting URLs."
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function CalendarPulseAiPanel({
  meetings,
  trigger,
  onClose,
  onSyncCalendar,
}: {
  meetings: CalendarMeeting[];
  trigger: AiTrigger | null;
  onClose: () => void;
  onSyncCalendar: () => Promise<void>;
}) {
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<
    { id: string; role: "user" | "assistant"; content: string }[]
  >([]);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const lastTriggerIdRef = useRef<number | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, isThinking]);

  useEffect(() => {
    if (!trigger) return;
    if (lastTriggerIdRef.current === trigger.id) return;

    lastTriggerIdRef.current = trigger.id;
    submitQuestion(trigger.command);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  function isCalendarSyncCommand(command: string) {
    return /(sync|refresh|update).*(calendar)|calendar.*(sync|refresh|update)/i.test(
      command,
    );
  }

  function calendarContext() {
    return meetings
      .slice(0, 20)
      .map(
        (meeting) =>
          `- ${meeting.title} at ${formatTime(meeting.startTime)}, readiness: ${meeting.readiness.label}`,
      )
      .join("\n");
  }

  async function submitQuestion(question: string) {
    const cleanQuestion = question.trim();

    if (!cleanQuestion || isThinking) return;

    setInput("");
    setIsThinking(true);

    setMessages((current) => [
      ...current,
      {
        id: `user-${Date.now()}`,
        role: "user",
        content: cleanQuestion,
      },
    ]);

    if (isCalendarSyncCommand(cleanQuestion)) {
      try {
        await onSyncCalendar();

        setMessages((current) => [
          ...current,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: "Calendar synced successfully.",
          },
        ]);
      } catch (error) {
        setMessages((current) => [
          ...current,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content:
              error instanceof Error
                ? error.message
                : "I could not sync Calendar.",
          },
        ]);
      } finally {
        setIsThinking(false);
      }

      return;
    }

    try {
      const response = await fetch("/api/pulse-ai/command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          command: `
Answer in 2-3 short lines only.

${cleanQuestion}

Calendar context:
${calendarContext()}
          `.trim(),
        }),
      });

      const data = await readJson(response);

      if (!response.ok || !data.success) {
        throw new Error(data.error || "pulse AI failed to answer.");
      }

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.answer || "I could not generate an answer.",
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "pulse AI failed to answer.",
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  }

  function handleSubmit() {
    submitQuestion(input);
  }

  return (
    <aside className="flex h-screen w-[20%] min-w-[300px] max-w-[360px] flex-col overflow-hidden border-l border-slate-200 bg-slate-50">
      <div className="flex h-20 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5">
        <div className="flex items-center gap-3">
          <PulseMark size="sm" />
          <div>
            <h2 className="text-base font-semibold text-slate-950">pulse AI</h2>
            <p className="text-xs text-slate-500">Calendar copilot</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="calendar-ai-scroll min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
              <Bot className="h-5 w-5" />
            </div>

            <h3 className="text-sm font-semibold text-slate-950">
              Ask pulse AI
            </h3>

            <p className="mt-2 max-w-[220px] text-sm leading-6 text-slate-500">
              Ask about meetings, schedule, busy days, or Calendar sync.
            </p>
          </div>
        ) : (
          <div className="space-y-5 pb-4">
            {messages.map((message) => {
              const isUser = message.role === "user";

              return (
                <div
                  key={message.id}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={
                      isUser
                        ? "max-w-[88%] rounded-2xl bg-slate-800 px-4 py-3 text-sm leading-6 text-white"
                        : "max-w-[92%] text-sm leading-6 text-slate-700"
                    }
                  >
                    {!isUser && (
                      <div className="mb-1 flex items-center gap-2">
                        <span className="font-semibold text-slate-950">
                          pulse AI
                        </span>
                        <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                      </div>
                    )}

                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                </div>
              );
            })}

            {isThinking && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm text-slate-500 ring-1 ring-slate-200">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />
                  Thinking...
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-slate-200 bg-white p-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-100 p-2">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              rows={1}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Ask about calendar..."
              className="max-h-[120px] min-h-10 flex-1 resize-none border-none bg-transparent px-2 py-2 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-500"
            />

            <button
              onClick={handleSubmit}
              disabled={isThinking || !input.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white transition hover:bg-emerald-800 active:bg-emerald-900 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isThinking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .calendar-ai-scroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .calendar-ai-scroll::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }
      `}</style>
    </aside>
  );
}

function InsightCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-sm leading-6 text-slate-500">{detail}</p>
    </div>
  );
}
