"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bot,
  CalendarPlus,
  CheckCircle2,
  CircleAlert,
  CornerUpLeft,
  Inbox,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Wand2,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PulseMark } from "@/components/ui/pulse-logo";

type InboxMessage = {
  id: string;
  externalMessageId: string;
  threadId: string;
  subject: string;
  snippet: string | null;
  bodyText: string | null;
  bodyHtml: string | null;
  fromEmail: string;
  fromName: string | null;
  toEmails: string[];
  ccEmails: string[];
  receivedAt: string | null;
  isUnread: boolean;
  labelIds: string[];
  threadSubject: string;
};

type EmailAnalysis = {
  summary: string;
  intent:
    | "MEETING_REQUEST"
    | "QUESTION"
    | "TASK"
    | "FOLLOW_UP"
    | "FYI"
    | "PROMOTION"
    | "OTHER";
  priority: "HIGH" | "MEDIUM" | "LOW";
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "URGENT";
  requiresReply: boolean;
  hasMeetingRequest: boolean;
  suggestedReply: string;
  nextActions: string[];
  meeting: {
    shouldCreate: boolean;
    title: string;
    dateText: string;
    timeText: string;
    attendees: string[];
  };
};

type MeetingForm = {
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  attendeesText: string;
  createMeetLink: boolean;
};

type FilterKey = "ALL" | "UNREAD" | "NEEDS_REPLY" | "MEETINGS";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "UNREAD", label: "Unread" },
  { key: "NEEDS_REPLY", label: "Needs reply" },
  { key: "MEETINGS", label: "Meetings" },
];

function formatDateTime(value?: string | null) {
  if (!value) return "Unknown time";

  const date = new Date(value);

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatShortTime(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();

  if (sameDay) {
    return new Intl.DateTimeFormat("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function toDateTimeLocalValue(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  const localDate = new Date(date.getTime() - offsetMs);

  return localDate.toISOString().slice(0, 16);
}

function getDefaultMeetingTimes() {
  const start = new Date();

  start.setDate(start.getDate() + 1);
  start.setHours(10, 0, 0, 0);

  const end = new Date(start);
  end.setMinutes(end.getMinutes() + 30);

  return {
    startTime: toDateTimeLocalValue(start),
    endTime: toDateTimeLocalValue(end),
  };
}

function getSenderName(message: InboxMessage) {
  return message.fromName?.trim() || message.fromEmail || "Unknown sender";
}

function cleanVisibleEmailText(text: string) {
  if (!text) return "";

  const lines = text
    .replace(/\r/g, "")
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const cleanedLines: string[] = [];

  for (const line of lines) {
    if (line.length > 220 && /https?:\/\//i.test(line)) continue;
    if (/https?:\/\/www\.linkedin\.com\/comm\/search/i.test(line)) continue;
    if (/https?:\/\/.*trk=/i.test(line)) continue;
    if (/https?:\/\/.*midtoken=/i.test(line)) continue;
    if (/https?:\/\/.*lipi=/i.test(line)) continue;
    if (/^view profile:/i.test(line)) continue;
    if (/^see all connections/i.test(line)) continue;
    if (/^unsubscribe/i.test(line)) continue;
    if (/^manage your email preferences/i.test(line)) continue;
    if (/^this email was intended for/i.test(line)) continue;
    if (/^you are receiving/i.test(line)) continue;
    if (/^©\s?\d{4}/i.test(line)) continue;
    if (/linkedin corporation/i.test(line)) continue;
    if (/linkedin and the linkedin logo/i.test(line)) continue;
    if (/west maude avenue/i.test(line)) continue;

    cleanedLines.push(line);
  }

  return cleanedLines
    .join("\n")
    .replace(/\bhttps?:\/\/\S{80,}/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function getReadableBody(message: InboxMessage) {
  const raw =
    message.bodyText?.trim() ||
    message.snippet?.trim() ||
    "No readable email body available.";

  return cleanVisibleEmailText(raw) || message.snippet || raw;
}

function getPreview(message: InboxMessage) {
  return (
    cleanVisibleEmailText(message.snippet || message.bodyText || "") ||
    "No preview available."
  );
}

function detectMeetingIntent(message: InboxMessage) {
  const text = `${message.subject} ${message.snippet || ""} ${
    message.bodyText || ""
  }`.toLowerCase();

  return /meeting|schedule|calendar|call|zoom|availability|discussion|appointment|invite/.test(
    text
  );
}

function detectNeedsReply(message: InboxMessage) {
  const text = `${message.subject} ${message.snippet || ""} ${
    message.bodyText || ""
  }`.toLowerCase();

  return /please|can you|could you|let me know|reply|confirm|available|schedule|response/.test(
    text
  );
}

function splitAttendees(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getPriorityTone(priority?: EmailAnalysis["priority"]) {
  if (priority === "HIGH") {
    return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
  }

  if (priority === "MEDIUM") {
    return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
  }

  return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
}

function getIntentTone(intent?: EmailAnalysis["intent"]) {
  switch (intent) {
    case "MEETING_REQUEST":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    case "QUESTION":
      return "bg-blue-50 text-blue-700 ring-1 ring-blue-200";
    case "TASK":
      return "bg-violet-50 text-violet-700 ring-1 ring-violet-200";
    case "FOLLOW_UP":
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
    case "PROMOTION":
      return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
    default:
      return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
  }
}

export default function InboxPage() {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null
  );
  const [analysis, setAnalysis] = useState<EmailAnalysis | null>(null);

  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);

  const [pageError, setPageError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [meetingSuccess, setMeetingSuccess] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("ALL");

  const [composerOpen, setComposerOpen] = useState(false);
  const [replyDraft, setReplyDraft] = useState("");

  const [meetingComposerOpen, setMeetingComposerOpen] = useState(false);
  const [meetingForm, setMeetingForm] = useState<MeetingForm>({
    title: "",
    description: "",
    location: "",
    startTime: "",
    endTime: "",
    attendeesText: "",
    createMeetLink: true,
  });

  const selectedMessage = useMemo(
    () => messages.find((message) => message.id === selectedMessageId) || null,
    [messages, selectedMessageId]
  );

  const canUseSuggestedReply =
    Boolean(analysis?.requiresReply) && Boolean(analysis?.suggestedReply?.trim());

  const canPrepareMeeting =
    Boolean(selectedMessage) &&
    (Boolean(analysis?.hasMeetingRequest) ||
      Boolean(analysis?.meeting?.shouldCreate) ||
      Boolean(selectedMessage && detectMeetingIntent(selectedMessage)));

  const loadMessages = useCallback(async () => {
    try {
      setPageError(null);
      setIsLoadingMessages(true);

      const response = await fetch("/api/gmail/messages", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to load Gmail messages.");
      }

      const nextMessages = (data.messages || []) as InboxMessage[];
      setMessages(nextMessages);

      setSelectedMessageId((current) => {
        if (current && nextMessages.some((message) => message.id === current)) {
          return current;
        }

        return nextMessages[0]?.id || null;
      });
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Failed to load inbox."
      );
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  const runAnalysis = useCallback(async (messageId: string) => {
    try {
      setIsAnalyzing(true);
      setAnalysis(null);

      const response = await fetch("/api/ai/email/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messageId }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to analyze email.");
      }

      setAnalysis(data.analysis as EmailAnalysis);
    } catch (error) {
      setAnalysis(null);
      setPageError(
        error instanceof Error ? error.message : "Failed to analyze email."
      );
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!selectedMessageId) {
      setAnalysis(null);
      setComposerOpen(false);
      setReplyDraft("");
      setMeetingComposerOpen(false);
      return;
    }

    setSendSuccess(null);
    setMeetingSuccess(null);
    setComposerOpen(false);
    setReplyDraft("");
    setMeetingComposerOpen(false);
    runAnalysis(selectedMessageId);
  }, [selectedMessageId, runAnalysis]);

  const filteredMessages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return messages.filter((message) => {
      const matchesSearch =
        !q ||
        getSenderName(message).toLowerCase().includes(q) ||
        message.subject.toLowerCase().includes(q) ||
        getPreview(message).toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (activeFilter === "UNREAD") return message.isUnread;
      if (activeFilter === "NEEDS_REPLY") return detectNeedsReply(message);
      if (activeFilter === "MEETINGS") return detectMeetingIntent(message);

      return true;
    });
  }, [messages, searchQuery, activeFilter]);

  useEffect(() => {
    if (!filteredMessages.length) return;

    const exists = filteredMessages.some(
      (message) => message.id === selectedMessageId
    );

    if (!exists) {
      setSelectedMessageId(filteredMessages[0].id);
    }
  }, [filteredMessages, selectedMessageId]);

  async function handleSync() {
    try {
      setIsSyncing(true);
      setPageError(null);

      const response = await fetch("/api/gmail/sync", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to sync Gmail.");
      }

      await loadMessages();
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Failed to sync Gmail."
      );
    } finally {
      setIsSyncing(false);
    }
  }

  function handleUseSuggestedReply() {
    if (!selectedMessage) return;

    const suggested =
      analysis?.suggestedReply?.trim() ||
      `Hi ${selectedMessage.fromName || ""},

Thank you for your email.

Best regards`;

    setReplyDraft(suggested);
    setComposerOpen(true);
    setMeetingComposerOpen(false);
  }

  function handlePrepareMeeting() {
    if (!selectedMessage) return;

    const { startTime, endTime } = getDefaultMeetingTimes();

    const aiAttendees = analysis?.meeting?.attendees || [];
    const attendees = Array.from(
      new Set([selectedMessage.fromEmail, ...aiAttendees].filter(Boolean))
    );

    const title =
      analysis?.meeting?.title?.trim() ||
      `Meeting with ${selectedMessage.fromName || selectedMessage.fromEmail}`;

    const aiDateText = analysis?.meeting?.dateText?.trim();
    const aiTimeText = analysis?.meeting?.timeText?.trim();

    const description = [
      `Created by pulse from email: ${selectedMessage.subject}`,
      "",
      analysis?.summary ? `AI summary: ${analysis.summary}` : "",
      aiDateText || aiTimeText
        ? `AI extracted timing: ${[aiDateText, aiTimeText]
            .filter(Boolean)
            .join(" ")}`
        : "",
      "",
      selectedMessage.snippet || "",
    ]
      .filter(Boolean)
      .join("\n");

    setMeetingForm({
      title,
      description,
      location: "",
      startTime,
      endTime,
      attendeesText: attendees.join(", "),
      createMeetLink: true,
    });

    setMeetingComposerOpen(true);
    setComposerOpen(false);
  }

  async function handleSendReply() {
    if (!selectedMessage) return;

    try {
      setIsSendingReply(true);
      setPageError(null);
      setSendSuccess(null);

      const response = await fetch("/api/gmail/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messageId: selectedMessage.id,
          replyBody: replyDraft,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to send reply.");
      }

      setSendSuccess("Reply sent successfully.");
      setComposerOpen(false);
      setReplyDraft("");
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Failed to send reply."
      );
    } finally {
      setIsSendingReply(false);
    }
  }

  async function handleCreateMeeting() {
    if (!selectedMessage) return;

    try {
      setIsCreatingMeeting(true);
      setPageError(null);
      setMeetingSuccess(null);

      const startTime = new Date(meetingForm.startTime);
      const endTime = new Date(meetingForm.endTime);

      if (Number.isNaN(startTime.getTime())) {
        throw new Error("Meeting start time is invalid.");
      }

      if (Number.isNaN(endTime.getTime())) {
        throw new Error("Meeting end time is invalid.");
      }

      if (endTime <= startTime) {
        throw new Error("Meeting end time must be after start time.");
      }

      const response = await fetch("/api/calendar/create-from-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messageId: selectedMessage.id,
          title: meetingForm.title,
          description: meetingForm.description,
          location: meetingForm.location,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          attendees: splitAttendees(meetingForm.attendeesText),
          createMeetLink: meetingForm.createMeetLink,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to create Calendar event.");
      }

      setMeetingSuccess("Calendar event created successfully.");
      setMeetingComposerOpen(false);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Failed to create Calendar event."
      );
    } finally {
      setIsCreatingMeeting(false);
    }
  }

  return (
    <AppShell
      showAiPanel
      showSearch={false}
      rightPanel={
        <InboxAssistantPanel
          selectedMessage={selectedMessage}
          analysis={analysis}
          isAnalyzing={isAnalyzing}
          onUseSuggestedReply={handleUseSuggestedReply}
          onPrepareMeeting={handlePrepareMeeting}
          sendSuccess={sendSuccess}
          meetingSuccess={meetingSuccess}
        />
      }
    >
      <div className="flex h-full min-h-0 flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              Smart Inbox
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Review email context, prepare replies, and take approved actions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/api/corsair/oauth/gmail/start"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
            >
              <Mail className="h-4 w-4" />
              Connect Gmail
            </Link>

            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSyncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {isSyncing ? "Syncing..." : "Sync now"}
            </button>
          </div>
        </div>

        {pageError && (
          <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <CircleAlert className="h-4 w-4" />
            <span>{pageError}</span>
          </div>
        )}

        {sendSuccess && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            <span>{sendSuccess}</span>
          </div>
        )}

        {meetingSuccess && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            <span>{meetingSuccess}</span>
          </div>
        )}

        <div className="grid min-h-0 flex-1 grid-cols-[340px_minmax(0,1fr)] gap-5">
          <section className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search sender, subject, or email..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white"
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {FILTERS.map((filter) => {
                  const active = activeFilter === filter.key;

                  return (
                    <button
                      key={filter.key}
                      onClick={() => setActiveFilter(filter.key)}
                      className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
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
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {isLoadingMessages ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading inbox...
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                  <Inbox className="mb-3 h-8 w-8 text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-900">
                    No messages found
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Connect Gmail or sync your latest inbox messages.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredMessages.map((message) => {
                    const active = selectedMessageId === message.id;

                    return (
                      <button
                        key={message.id}
                        onClick={() => setSelectedMessageId(message.id)}
                        className={`w-full rounded-2xl border p-4 text-left transition ${
                          active
                            ? "border-emerald-200 bg-emerald-50/70 shadow-sm"
                            : "border-transparent bg-white hover:border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              {message.isUnread && (
                                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                              )}
                              <p className="truncate text-sm font-semibold text-slate-950">
                                {getSenderName(message)}
                              </p>
                            </div>
                          </div>

                          <span className="shrink-0 text-xs font-medium text-slate-500">
                            {formatShortTime(message.receivedAt)}
                          </span>
                        </div>

                        <p className="truncate text-sm font-semibold text-slate-900">
                          {message.subject}
                        </p>

                        <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-600">
                          {getPreview(message)}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {detectNeedsReply(message) && (
                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 ring-1 ring-blue-200">
                              Needs reply
                            </span>
                          )}

                          {detectMeetingIntent(message) && (
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                              Meeting
                            </span>
                          )}

                          {message.isUnread && (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200">
                              Unread
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <section className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            {!selectedMessage ? (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <Mail className="mb-4 h-10 w-10 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-950">
                  Select an email
                </h3>
                <p className="mt-1 max-w-md text-sm text-slate-500">
                  Choose a message from the left to read it and take action with
                  pulse AI.
                </p>
              </div>
            ) : (
              <>
                <div className="border-b border-slate-200 px-6 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                        {selectedMessage.subject}
                      </h2>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                        <span className="font-medium text-slate-900">
                          {getSenderName(selectedMessage)}
                        </span>
                        <span>•</span>
                        <span>{selectedMessage.fromEmail}</span>
                        <span>•</span>
                        <span>
                          {formatDateTime(selectedMessage.receivedAt)}
                        </span>
                      </div>

                      <div className="mt-2 text-sm text-slate-500">
                        To: {selectedMessage.toEmails.join(", ") || "—"}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <button
                        onClick={handleUseSuggestedReply}
                        disabled={!canUseSuggestedReply}
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                      >
                        <Wand2 className="h-4 w-4" />
                        Use this reply
                      </button>

                      <button
                        onClick={handlePrepareMeeting}
                        disabled={!canPrepareMeeting}
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                      >
                        <CalendarPlus className="h-4 w-4" />
                        Create meeting
                      </button>
                    </div>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                    <div className="space-y-4 text-[15px] leading-7 text-slate-700">
                      {getReadableBody(selectedMessage)
                        .split(/\n{2,}/)
                        .map((paragraph, index) => (
                          <p key={index} className="break-words">
                            {paragraph}
                          </p>
                        ))}
                    </div>
                  </div>

                  {meetingComposerOpen && (
                    <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/30 p-5">
                      <div className="mb-4 flex items-center gap-2">
                        <CalendarPlus className="h-4 w-4 text-emerald-700" />
                        <h3 className="text-sm font-semibold text-slate-950">
                          Meeting approval
                        </h3>
                      </div>

                      {analysis?.meeting?.dateText || analysis?.meeting?.timeText ? (
                        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                          AI extracted timing:{" "}
                          {[analysis?.meeting?.dateText, analysis?.meeting?.timeText]
                            .filter(Boolean)
                            .join(" ")}
                          . Please confirm the exact date and time before
                          creating the event.
                        </div>
                      ) : null}

                      <div className="grid gap-4">
                        <div>
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Meeting title
                          </label>
                          <input
                            value={meetingForm.title}
                            onChange={(event) =>
                              setMeetingForm((current) => ({
                                ...current,
                                title: event.target.value,
                              }))
                            }
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-emerald-300"
                            placeholder="Meeting title"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Description
                          </label>
                          <textarea
                            value={meetingForm.description}
                            onChange={(event) =>
                              setMeetingForm((current) => ({
                                ...current,
                                description: event.target.value,
                              }))
                            }
                            className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700 outline-none transition focus:border-emerald-300"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Start time
                            </label>
                            <input
                              type="datetime-local"
                              value={meetingForm.startTime}
                              onChange={(event) =>
                                setMeetingForm((current) => ({
                                  ...current,
                                  startTime: event.target.value,
                                }))
                              }
                              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-emerald-300"
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                              End time
                            </label>
                            <input
                              type="datetime-local"
                              value={meetingForm.endTime}
                              onChange={(event) =>
                                setMeetingForm((current) => ({
                                  ...current,
                                  endTime: event.target.value,
                                }))
                              }
                              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-emerald-300"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Attendees
                          </label>
                          <input
                            value={meetingForm.attendeesText}
                            onChange={(event) =>
                              setMeetingForm((current) => ({
                                ...current,
                                attendeesText: event.target.value,
                              }))
                            }
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-emerald-300"
                            placeholder="email@example.com, another@example.com"
                          />
                          <p className="mt-2 text-xs text-slate-500">
                            Separate multiple attendees with commas.
                          </p>
                        </div>

                        <div>
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Location
                          </label>
                          <input
                            value={meetingForm.location}
                            onChange={(event) =>
                              setMeetingForm((current) => ({
                                ...current,
                                location: event.target.value,
                              }))
                            }
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-emerald-300"
                            placeholder="Optional"
                          />
                        </div>

                        <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                          <span>
                            <span className="block text-sm font-semibold text-slate-950">
                              Add Google Meet link
                            </span>
                            <span className="block text-xs text-slate-500">
                              pulse will try to create a Meet link if your
                              Calendar account supports it.
                            </span>
                          </span>

                          <input
                            type="checkbox"
                            checked={meetingForm.createMeetLink}
                            onChange={(event) =>
                              setMeetingForm((current) => ({
                                ...current,
                                createMeetLink: event.target.checked,
                              }))
                            }
                            className="h-4 w-4 accent-emerald-700"
                          />
                        </label>

                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => setMeetingComposerOpen(false)}
                            className="inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            Cancel
                          </button>

                          <button
                            onClick={handleCreateMeeting}
                            disabled={
                              isCreatingMeeting ||
                              !meetingForm.title.trim() ||
                              !meetingForm.startTime ||
                              !meetingForm.endTime
                            }
                            className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isCreatingMeeting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CalendarPlus className="h-4 w-4" />
                            )}
                            {isCreatingMeeting
                              ? "Creating..."
                              : "Create event"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {composerOpen && (
                    <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/30 p-5">
                      <div className="mb-4 flex items-center gap-2">
                        <CornerUpLeft className="h-4 w-4 text-emerald-700" />
                        <h3 className="text-sm font-semibold text-slate-950">
                          Reply composer
                        </h3>
                      </div>

                      <div className="grid gap-4">
                        <div>
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                            To
                          </label>
                          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                            {selectedMessage.fromEmail}
                          </div>
                        </div>

                        <div>
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Subject
                          </label>
                          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                            {selectedMessage.subject.startsWith("Re:")
                              ? selectedMessage.subject
                              : `Re: ${selectedMessage.subject}`}
                          </div>
                        </div>

                        <div>
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Reply body
                          </label>
                          <textarea
                            value={replyDraft}
                            onChange={(event) =>
                              setReplyDraft(event.target.value)
                            }
                            className="min-h-[220px] w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-300"
                            placeholder="Write your reply here..."
                          />
                        </div>

                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => {
                              setComposerOpen(false);
                              setReplyDraft("");
                            }}
                            className="inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            Cancel
                          </button>

                          <button
                            onClick={handleSendReply}
                            disabled={isSendingReply || !replyDraft.trim()}
                            className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isSendingReply ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                            {isSendingReply ? "Sending..." : "Send reply"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function InboxAssistantPanel({
  selectedMessage,
  analysis,
  isAnalyzing,
  onUseSuggestedReply,
  onPrepareMeeting,
  sendSuccess,
  meetingSuccess,
}: {
  selectedMessage: InboxMessage | null;
  analysis: EmailAnalysis | null;
  isAnalyzing: boolean;
  onUseSuggestedReply: () => void;
  onPrepareMeeting: () => void;
  sendSuccess: string | null;
  meetingSuccess: string | null;
}) {
  return (
    <aside className="flex h-screen w-[20%] min-w-[300px] max-w-[360px] flex-col overflow-hidden border-l border-slate-200 bg-white">
      <div className="flex h-20 items-center justify-between border-b border-slate-200 px-6">
        <div className="flex items-center gap-3">
          <PulseMark size="sm" />
          <div>
            <h2 className="text-lg font-semibold text-slate-950">pulse AI</h2>
            <p className="text-xs text-slate-500">Inbox copilot</p>
          </div>
        </div>

        <div className="rounded-full bg-emerald-50 p-2 text-emerald-700">
          <Bot className="h-4 w-4" />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        {!selectedMessage ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Bot className="mb-3 h-8 w-8 text-slate-300" />
            <h3 className="text-sm font-semibold text-slate-950">
              No email selected
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Select an email to view analysis and suggested actions.
            </p>
          </div>
        ) : isAnalyzing ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Analyzing selected email...
          </div>
        ) : !analysis ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Analysis is not available for this email yet.
          </div>
        ) : (
          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Selected email
              </p>
              <h3 className="mt-2 text-base font-semibold text-slate-950">
                {selectedMessage.subject}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                From {getSenderName(selectedMessage)}
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-700" />
                <h3 className="text-sm font-semibold text-slate-950">
                  Quick summary
                </h3>
              </div>
              <p className="text-sm leading-6 text-slate-600">
                {analysis.summary}
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-950">
                Signals
              </h3>

              <div className="mt-4 flex flex-wrap gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getIntentTone(
                    analysis.intent
                  )}`}
                >
                  {analysis.intent.replaceAll("_", " ")}
                </span>

                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getPriorityTone(
                    analysis.priority
                  )}`}
                >
                  {analysis.priority} priority
                </span>
              </div>

              <div className="mt-4 space-y-2">
                <SignalRow
                  label="Reply needed"
                  value={analysis.requiresReply ? "Yes" : "No"}
                />
                <SignalRow
                  label="Meeting request"
                  value={analysis.hasMeetingRequest ? "Yes" : "No"}
                />
                <SignalRow label="Sentiment" value={analysis.sentiment} />
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-950">
                Suggested actions
              </h3>

              <div className="mt-3 space-y-2">
                {analysis.nextActions.length ? (
                  analysis.nextActions.map((item) => (
                    <div
                      key={item}
                      className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700"
                    >
                      {item}
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-500">
                    No suggested actions.
                  </div>
                )}
              </div>
            </section>

            {analysis.suggestedReply && analysis.requiresReply && (
              <section className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-950">
                    Suggested reply
                  </h3>

                  <button
                    onClick={onUseSuggestedReply}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800"
                  >
                    <Wand2 className="h-3.5 w-3.5" />
                    Use this reply
                  </button>
                </div>

                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {analysis.suggestedReply}
                </p>
              </section>
            )}

            {analysis.hasMeetingRequest && (
              <section className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-950">
                    Meeting detected
                  </h3>

                  <button
                    onClick={onPrepareMeeting}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800"
                  >
                    <CalendarPlus className="h-3.5 w-3.5" />
                    Prepare
                  </button>
                </div>

                <div className="space-y-2">
                  <SignalRow
                    label="Title"
                    value={analysis.meeting.title || "Untitled meeting"}
                  />
                  <SignalRow
                    label="Date"
                    value={analysis.meeting.dateText || "Not specified"}
                  />
                  <SignalRow
                    label="Time"
                    value={analysis.meeting.timeText || "Not specified"}
                  />
                </div>
              </section>
            )}

            {sendSuccess && (
              <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-700" />
                  <p className="text-sm font-medium text-emerald-700">
                    {sendSuccess}
                  </p>
                </div>
              </section>
            )}

            {meetingSuccess && (
              <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-700" />
                  <p className="text-sm font-medium text-emerald-700">
                    {meetingSuccess}
                  </p>
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

function SignalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-sm font-semibold text-slate-950">{value}</span>
    </div>
  );
}