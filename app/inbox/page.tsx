"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, ElementType, SetStateAction } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  CalendarPlus,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  CornerUpLeft,
  FolderOpen,
  Inbox,
  Loader2,
  Mail,
  PanelRightClose,
  PanelRightOpen,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Wand2,
  X,
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

type AiTrigger = {
  id: number;
  command: string;
};

type EmailWorkspaceTool = "SUMMARY" | "REPLY" | "MEETING" | "MOM" | "DOCUMENTS";

type ReplyTone =
  | "Professional"
  | "Friendly"
  | "Short"
  | "Detailed"
  | "Student-friendly";

const REPLY_TONES: ReplyTone[] = [
  "Professional",
  "Friendly",
  "Short",
  "Detailed",
  "Student-friendly",
];

type RecentMeetingItem = {
  id: string;
  title: string;
  description?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  meetingUrl?: string | null;
  attendees?: string[];
  status?: string | null;
  source?: string | null;
};

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "UNREAD", label: "Unread" },
  { key: "NEEDS_REPLY", label: "Needs reply" },
  { key: "MEETINGS", label: "Meetings" },
];

function createEmptyMeetingForm(): MeetingForm {
  return {
    title: "",
    description: "",
    location: "",
    startTime: "",
    endTime: "",
    attendeesText: "",
    createMeetLink: true,
  };
}

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

function getMeetingTimesFromCommand(command?: string) {
  if (!command) return null;

  const match = command.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);

  if (!match) return null;

  const hourRaw = Number(match[1]);
  const minute = match[2] ? Number(match[2]) : 0;
  const period = match[3].toLowerCase();

  if (hourRaw < 1 || hourRaw > 12 || minute < 0 || minute > 59) {
    return null;
  }

  let hour = hourRaw;

  if (period === "pm" && hour !== 12) hour += 12;
  if (period === "am" && hour === 12) hour = 0;

  const start = new Date();

  if (/tomorrow/i.test(command)) {
    start.setDate(start.getDate() + 1);
  }

  start.setHours(hour, minute, 0, 0);

  if (!/today/i.test(command) && !/tomorrow/i.test(command)) {
    const now = new Date();

    if (start <= now) {
      start.setDate(start.getDate() + 1);
    }
  }

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
    text,
  );
}

function detectNeedsReply(message: InboxMessage) {
  const text = `${message.subject} ${message.snippet || ""} ${
    message.bodyText || ""
  }`.toLowerCase();

  return /please|can you|could you|let me know|reply|confirm|available|schedule|response|connect/.test(
    text,
  );
}

function splitAttendees(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
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

export default function InboxPage() {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null,
  );
  const [analysis, setAnalysis] = useState<EmailAnalysis | null>(null);

  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);

  const [isInboxAiOpen, setIsInboxAiOpen] = useState(false);
  const [aiTrigger, setAiTrigger] = useState<AiTrigger | null>(null);

  const [pageError, setPageError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [meetingSuccess, setMeetingSuccess] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("ALL");

  const [replyDraft, setReplyDraft] = useState("");
  const [meetingForm, setMeetingForm] = useState<MeetingForm>(
    createEmptyMeetingForm,
  );

  const selectedMessage = useMemo(
    () => messages.find((message) => message.id === selectedMessageId) || null,
    [messages, selectedMessageId],
  );

  const loadMessages = useCallback(async () => {
    try {
      setPageError(null);
      setIsLoadingMessages(true);

      const response = await fetch("/api/gmail/messages", {
        method: "GET",
        cache: "no-store",
      });

      const data = await readJson(response);

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to load Gmail messages.");
      }

      const nextMessages = (data.messages || []) as InboxMessage[];
      setMessages(nextMessages);

      setSelectedMessageId((current) => {
        if (current && nextMessages.some((message) => message.id === current)) {
          return current;
        }

        return null;
      });
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Failed to load inbox.",
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

      const data = await readJson(response);

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to analyze email.");
      }

      setAnalysis(data.analysis as EmailAnalysis);
    } catch (error) {
      setAnalysis(null);
      setPageError(
        error instanceof Error ? error.message : "Failed to analyze email.",
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
      setReplyDraft("");
      setMeetingForm(createEmptyMeetingForm());
      return;
    }

    setSendSuccess(null);
    setMeetingSuccess(null);
    setReplyDraft("");
    setMeetingForm(createEmptyMeetingForm());
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

  async function handleSync() {
    try {
      setIsSyncing(true);
      setPageError(null);

      const response = await fetch("/api/gmail/sync", {
        method: "POST",
      });

      const data = await readJson(response);

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to sync Gmail.");
      }

      await loadMessages();
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Failed to sync Gmail.",
      );
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleSyncCalendarFromAi() {
    const response = await fetch("/api/calendar/sync", {
      method: "POST",
    });

    const data = await readJson(response);

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Failed to sync Google Calendar.");
    }

    return "Google Calendar sync completed. I refreshed your latest Calendar data.";
  }

  function triggerPulseAi(command: string) {
    setIsInboxAiOpen(true);
    setAiTrigger({
      id: Date.now(),
      command,
    });
  }

  function handleBackToInbox() {
    setSelectedMessageId(null);
    setReplyDraft("");
    setMeetingForm(createEmptyMeetingForm());
    setSendSuccess(null);
    setMeetingSuccess(null);
  }

  function handleUseSuggestedReply() {
    if (!selectedMessage) return;

    const suggested =
      analysis?.suggestedReply?.trim() ||
      `Hi ${selectedMessage.fromName || ""},

Thank you for your email.

Best regards`;

    setReplyDraft(suggested);
  }

  function handlePrepareMeeting(commandText?: string) {
    if (!selectedMessage) return;

    const parsedTimes = getMeetingTimesFromCommand(commandText);
    const { startTime, endTime } = parsedTimes || getDefaultMeetingTimes();

    const aiAttendees = analysis?.meeting?.attendees || [];
    const attendees = Array.from(
      new Set([selectedMessage.fromEmail, ...aiAttendees].filter(Boolean)),
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

      const data = await readJson(response);

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to send reply.");
      }

      setSendSuccess("Reply sent successfully.");
      setReplyDraft("");
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Failed to send reply.",
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

      const data = await readJson(response);

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to create Calendar event.");
      }

      setMeetingSuccess("Calendar event created successfully.");
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Failed to create Calendar event.",
      );
    } finally {
      setIsCreatingMeeting(false);
    }
  }

  return (
    <AppShell
      showAiPanel={isInboxAiOpen}
      showSearch={false}
      showHeader={false}
      rightPanel={
        isInboxAiOpen ? (
          <InboxPulseAiChatPanel
            selectedMessage={selectedMessage}
            trigger={aiTrigger}
            onClose={() => setIsInboxAiOpen(false)}
            onPrepareMeetingFromAi={handlePrepareMeeting}
            onSyncCalendarFromAi={handleSyncCalendarFromAi}
          />
        ) : undefined
      }
    >
      <div className="flex h-full min-h-0 flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              Smart Inbox
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {selectedMessage
                ? "Review this email and take approved actions."
                : "Choose an email to open a focused workspace."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsInboxAiOpen((current) => !current)}
              className={`inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold shadow-sm transition ${
                isInboxAiOpen
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                  : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
              }`}
            >
              {isInboxAiOpen ? (
                <PanelRightClose className="h-4 w-4" />
              ) : (
                <PanelRightOpen className="h-4 w-4" />
              )}
              pulse AI
            </button>

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

        {!selectedMessage ? (
          <InboxListView
            messages={filteredMessages}
            searchQuery={searchQuery}
            activeFilter={activeFilter}
            isLoadingMessages={isLoadingMessages}
            onSearchChange={setSearchQuery}
            onFilterChange={setActiveFilter}
            onSelectMessage={setSelectedMessageId}
          />
        ) : (
          <SelectedEmailWorkspace
            key={selectedMessage.id}
            message={selectedMessage}
            analysis={analysis}
            isAnalyzing={isAnalyzing}
            replyDraft={replyDraft}
            meetingForm={meetingForm}
            isSendingReply={isSendingReply}
            isCreatingMeeting={isCreatingMeeting}
            onBack={handleBackToInbox}
            onReplyDraftChange={setReplyDraft}
            onMeetingFormChange={setMeetingForm}
            onClearReply={() => setReplyDraft("")}
            onClearMeeting={() => setMeetingForm(createEmptyMeetingForm())}
            onSendReply={handleSendReply}
            onCreateMeeting={handleCreateMeeting}
            onUseSuggestedReply={handleUseSuggestedReply}
            onPrepareMeeting={handlePrepareMeeting}
            onAiAction={triggerPulseAi}
          />
        )}
      </div>
    </AppShell>
  );
}

function InboxListView({
  messages,
  searchQuery,
  activeFilter,
  isLoadingMessages,
  onSearchChange,
  onFilterChange,
  onSelectMessage,
}: {
  messages: InboxMessage[];
  searchQuery: string;
  activeFilter: FilterKey;
  isLoadingMessages: boolean;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: FilterKey) => void;
  onSelectMessage: (id: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<
    "PRIMARY" | "PROMOTIONS" | "SOCIAL" | "UPDATES"
  >("PRIMARY");

  function getCategory(message: InboxMessage) {
    const text = `${message.fromEmail} ${message.fromName || ""} ${
      message.subject
    } ${message.snippet || ""}`.toLowerCase();

    if (
      text.includes("linkedin") ||
      text.includes("instagram") ||
      text.includes("facebook") ||
      text.includes("twitter")
    ) {
      return "SOCIAL";
    }

    if (
      text.includes("offer") ||
      text.includes("sale") ||
      text.includes("premium") ||
      text.includes("discount") ||
      text.includes("deal") ||
      text.includes("promotion") ||
      text.includes("adidas") ||
      text.includes("framer")
    ) {
      return "PROMOTIONS";
    }

    if (
      text.includes("update") ||
      text.includes("verification") ||
      text.includes("status") ||
      text.includes("application") ||
      text.includes("job") ||
      text.includes("alert")
    ) {
      return "UPDATES";
    }

    return "PRIMARY";
  }

  const tabMessages = messages.filter((message) => {
    if (activeTab === "PRIMARY") return getCategory(message) === "PRIMARY";
    if (activeTab === "PROMOTIONS")
      return getCategory(message) === "PROMOTIONS";
    if (activeTab === "SOCIAL") return getCategory(message) === "SOCIAL";
    if (activeTab === "UPDATES") return getCategory(message) === "UPDATES";
    return true;
  });

  const tabs = [
    {
      key: "PRIMARY" as const,
      label: "Primary",
      count: messages.filter((m) => getCategory(m) === "PRIMARY").length,
    },
    {
      key: "PROMOTIONS" as const,
      label: "Promotions",
      count: messages.filter((m) => getCategory(m) === "PROMOTIONS").length,
    },
    {
      key: "SOCIAL" as const,
      label: "Social",
      count: messages.filter((m) => getCategory(m) === "SOCIAL").length,
    },
    {
      key: "UPDATES" as const,
      label: "Updates",
      count: messages.filter((m) => getCategory(m) === "UPDATES").length,
    },
  ];

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search mail"
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white"
            />
          </div>

          <div className="flex shrink-0 gap-2">
            {FILTERS.map((filter) => {
              const active = activeFilter === filter.key;

              return (
                <button
                  key={filter.key}
                  onClick={() => onFilterChange(filter.key)}
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
      </div>

      <div className="grid grid-cols-4 border-b border-slate-200 bg-white">
        {tabs.map((tab) => {
          const active = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center justify-between border-b-2 px-6 py-4 text-left text-sm font-semibold transition ${
                active
                  ? "border-emerald-700 text-emerald-800"
                  : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <span>{tab.label}</span>

              {tab.count > 0 && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    active
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoadingMessages ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading inbox...
          </div>
        ) : tabMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <Inbox className="mb-3 h-9 w-9 text-slate-300" />
            <h3 className="text-sm font-semibold text-slate-900">
              No emails in {activeTab.toLowerCase()}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Connect Gmail or sync your latest inbox messages.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {tabMessages.map((message) => {
              const needsReply = detectNeedsReply(message);
              const isMeeting = detectMeetingIntent(message);

              return (
                <button
                  key={message.id}
                  onClick={() => onSelectMessage(message.id)}
                  className={`grid w-full grid-cols-[36px_36px_210px_minmax(0,1fr)_90px] items-center gap-3 px-5 py-3 text-left transition hover:bg-emerald-50/50 ${
                    message.isUnread ? "bg-white" : "bg-slate-50/50"
                  }`}
                >
                  <div
                    onClick={(event) => event.stopPropagation()}
                    className="flex items-center justify-center"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 accent-emerald-700"
                    />
                  </div>

                  <div className="flex items-center justify-center text-slate-300">
                    <span className="text-lg leading-none">☆</span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {message.isUnread && (
                        <span className="h-2 w-2 rounded-full bg-emerald-600" />
                      )}
                      <p
                        className={`truncate text-sm ${
                          message.isUnread
                            ? "font-bold text-slate-950"
                            : "font-medium text-slate-700"
                        }`}
                      >
                        {getSenderName(message)}
                      </p>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <p
                        className={`truncate text-sm ${
                          message.isUnread
                            ? "font-bold text-slate-950"
                            : "font-semibold text-slate-800"
                        }`}
                      >
                        {message.subject || "(No subject)"}
                      </p>

                      <span className="text-slate-400">—</span>

                      <p className="truncate text-sm text-slate-500">
                        {getPreview(message)}
                      </p>
                    </div>

                    <div className="mt-1 flex gap-2">
                      {needsReply && (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 ring-1 ring-blue-200">
                          Needs reply
                        </span>
                      )}

                      {isMeeting && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                          Meeting
                        </span>
                      )}

                      {message.isUnread && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200">
                          Unread
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right text-xs font-semibold text-slate-500">
                    {formatShortTime(message.receivedAt)}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function SelectedEmailWorkspace({
  message,
  analysis,
  isAnalyzing,
  replyDraft,
  meetingForm,
  isSendingReply,
  isCreatingMeeting,
  onBack,
  onReplyDraftChange,
  onMeetingFormChange,
  onClearReply,
  onClearMeeting,
  onSendReply,
  onCreateMeeting,
  onUseSuggestedReply,
  onPrepareMeeting,
  onAiAction,
}: {
  message: InboxMessage;
  analysis: EmailAnalysis | null;
  isAnalyzing: boolean;
  replyDraft: string;
  meetingForm: MeetingForm;
  isSendingReply: boolean;
  isCreatingMeeting: boolean;
  onBack: () => void;
  onReplyDraftChange: (value: string) => void;
  onMeetingFormChange: Dispatch<SetStateAction<MeetingForm>>;
  onClearReply: () => void;
  onClearMeeting: () => void;
  onSendReply: () => void;
  onCreateMeeting: () => void;
  onUseSuggestedReply: () => void;
  onPrepareMeeting: (commandText?: string) => void;
  onAiAction: (command: string) => void;
}) {
  const [activeTool, setActiveTool] = useState<EmailWorkspaceTool | null>(null);
  const [isHeaderCompact, setIsHeaderCompact] = useState(false);
  const [replyTone, setReplyTone] = useState<ReplyTone>("Professional");
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);
  const [recentMeetings, setRecentMeetings] = useState<RecentMeetingItem[]>([]);
  const [isLoadingMeetings, setIsLoadingMeetings] = useState(false);

  function selectedEmailContext() {
    return `
Selected email context:
Subject: ${message.subject || "(No subject)"}
From: ${message.fromName || message.fromEmail} <${message.fromEmail}>
To: ${message.toEmails.join(", ")}
Received: ${message.receivedAt || "Unknown"}
Body:
${getReadableBody(message).slice(0, 2500)}
    `.trim();
  }

  async function generateReplyDraft(tone: ReplyTone) {
    try {
      setIsGeneratingReply(true);

      const response = await fetch("/api/pulse-ai/command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          command: `
Generate a ${tone.toLowerCase()} reply draft for this selected email.
Return only the reply body.
Do not say the email was sent.

${selectedEmailContext()}
          `.trim(),
        }),
      });

      const data = await readJson(response);

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to generate reply draft.");
      }

      onReplyDraftChange(data.answer || "");
    } catch {
      onUseSuggestedReply();
    } finally {
      setIsGeneratingReply(false);
    }
  }

  async function loadRecentMeetings() {
    try {
      setIsLoadingMeetings(true);

      const response = await fetch("/api/calendar/events", {
        method: "GET",
        cache: "no-store",
      });

      const data = await readJson(response);

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to load recent meetings.");
      }

      const events = (data.events ||
        data.calendarEvents ||
        []) as RecentMeetingItem[];

      setRecentMeetings(events.slice(0, 5));
    } catch {
      setRecentMeetings([]);
    } finally {
      setIsLoadingMeetings(false);
    }
  }

  function runSummarize() {
    setActiveTool("SUMMARY");
    onAiAction(
      "In 2-3 short lines, summarize this selected email and mention the next action.",
    );
  }

  function runReply() {
    setActiveTool("REPLY");
    onAiAction(
      "In one short line, tell me you prepared a reply draft for this selected email.",
    );
    onUseSuggestedReply();
    void generateReplyDraft(replyTone);
  }

  function runMeeting() {
    setActiveTool("MEETING");
    onPrepareMeeting();
    onAiAction(
      "In 2-3 short lines, check if this email needs a meeting and mention that the meeting draft is ready for approval.",
    );
  }

  function runMom() {
    setActiveTool("MOM");
    void loadRecentMeetings();
    onAiAction(
      "In 2-3 short lines, prepare meeting notes context from this selected email.",
    );
  }

  function runDocuments() {
    setActiveTool("DOCUMENTS");
    onAiAction(
      "In 2-3 short lines, explain what documents are related or should be attached to this email.",
    );
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div
        className={`shrink-0 border-b border-slate-200 bg-white transition-all duration-200 ${
          isHeaderCompact ? "px-6 py-3 shadow-sm" : "px-6 py-5"
        }`}
      >
        {!isHeaderCompact && (
          <button
            onClick={onBack}
            className="mb-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to inbox
          </button>
        )}

        <div className="flex items-start justify-between gap-5">
          <div className="min-w-0">
            <h2
              className={`font-semibold tracking-tight text-slate-950 transition-all ${
                isHeaderCompact ? "max-w-2xl truncate text-lg" : "text-3xl"
              }`}
            >
              {message.subject || "(No subject)"}
            </h2>

            {!isHeaderCompact && (
              <>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                  <span className="font-medium text-slate-900">
                    {getSenderName(message)}
                  </span>
                  <span>•</span>
                  <span>{message.fromEmail}</span>
                  <span>•</span>
                  <span>{formatDateTime(message.receivedAt)}</span>
                </div>

                <div className="mt-2 text-sm text-slate-500">
                  To: {message.toEmails.join(", ") || "—"}
                </div>
              </>
            )}
          </div>

          {isAnalyzing && (
            <div className="inline-flex shrink-0 items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Analyzing
            </div>
          )}
        </div>

        <div
          className={`${isHeaderCompact ? "mt-3" : "mt-5"} flex flex-wrap gap-3`}
        >
          <ActionButton
            icon={Sparkles}
            label="Summarize"
            active={activeTool === "SUMMARY"}
            onClick={runSummarize}
          />
          <ActionButton
            icon={Wand2}
            label="Reply"
            active={activeTool === "REPLY"}
            onClick={runReply}
          />
          <ActionButton
            icon={CalendarPlus}
            label="Meeting"
            active={activeTool === "MEETING"}
            onClick={runMeeting}
          />
          <ActionButton
            icon={ClipboardList}
            label="MoM"
            active={activeTool === "MOM"}
            onClick={runMom}
          />
          <ActionButton
            icon={FolderOpen}
            label="Documents"
            active={activeTool === "DOCUMENTS"}
            onClick={runDocuments}
          />
        </div>
      </div>

      <div
        onScroll={(event) => {
          setIsHeaderCompact(event.currentTarget.scrollTop > 80);
        }}
        className="min-h-0 flex-1 overflow-y-auto px-6 py-5"
      >
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
          <div className="space-y-4 text-[15px] leading-7 text-slate-700">
            {getReadableBody(message)
              .split(/\n{2,}/)
              .map((paragraph, index) => (
                <p key={index} className="break-words">
                  {paragraph}
                </p>
              ))}
          </div>
        </div>

        {!activeTool && (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-500">
            Choose Summarize, Reply, Meeting, MoM, or Documents to generate a
            detailed action panel for this email.
          </div>
        )}

        {activeTool === "SUMMARY" && (
          <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-700" />
              <h3 className="text-sm font-semibold text-slate-950">
                Detailed email summary
              </h3>
            </div>

            <p className="text-sm leading-6 text-slate-700">
              {analysis?.summary ||
                "pulse AI is analyzing this email. Try again in a moment."}
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <InfoBox
                label="Intent"
                value={analysis?.intent?.replace(/_/g, " ") || "Analyzing"}
              />
              <InfoBox
                label="Priority"
                value={analysis?.priority || "Analyzing"}
              />
              <InfoBox
                label="Reply needed"
                value={analysis?.requiresReply ? "Yes" : "No"}
              />
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Next actions
              </p>

              <div className="mt-2 space-y-2">
                {analysis?.nextActions?.length ? (
                  analysis.nextActions.map((action) => (
                    <p key={action} className="text-sm text-slate-700">
                      • {action}
                    </p>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">
                    No next actions detected.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTool === "REPLY" && (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/30 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CornerUpLeft className="h-4 w-4 text-emerald-700" />
                <h3 className="text-sm font-semibold text-slate-950">
                  Reply draft
                </h3>
              </div>

              {isGeneratingReply && (
                <div className="inline-flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-700" />
                  Generating
                </div>
              )}
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {REPLY_TONES.map((tone) => (
                <button
                  key={tone}
                  onClick={() => {
                    setReplyTone(tone);
                    void generateReplyDraft(tone);
                  }}
                  className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                    replyTone === tone
                      ? "bg-emerald-700 text-white"
                      : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-emerald-50 hover:text-emerald-800"
                  }`}
                >
                  {tone}
                </button>
              ))}
            </div>

            <div className="grid gap-4">
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                To: {message.fromEmail}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                Subject:{" "}
                {message.subject.startsWith("Re:")
                  ? message.subject
                  : `Re: ${message.subject}`}
              </div>

              <textarea
                value={replyDraft}
                onChange={(event) => onReplyDraftChange(event.target.value)}
                className="min-h-[220px] w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-300"
                placeholder="Generated reply will appear here..."
              />

              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                  pulse prepares the draft. You approve before sending.
                </p>

                <div className="flex items-center gap-3">
                  <button
                    onClick={onClearReply}
                    className="inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Clear
                  </button>

                  <button
                    onClick={onSendReply}
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
          </div>
        )}

        {activeTool === "MEETING" && (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/30 p-5">
            <div className="mb-4 flex items-center gap-2">
              <CalendarPlus className="h-4 w-4 text-emerald-700" />
              <h3 className="text-sm font-semibold text-slate-950">
                Schedule meeting
              </h3>
            </div>

            <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
              Add title, date, time, attendees, agenda, location, and Google
              Meet link. pulse creates the Calendar event only after approval.
            </div>

            <div className="grid gap-4">
              <InfoBox
                label="Detected sender"
                value={message.fromName || message.fromEmail}
              />
              <InfoBox
                label="Meeting request"
                value={
                  analysis?.hasMeetingRequest
                    ? "Detected"
                    : "Not clearly detected"
                }
              />

              <input
                value={meetingForm.title}
                onChange={(event) =>
                  onMeetingFormChange((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-emerald-300"
                placeholder="Meeting title"
              />

              <textarea
                value={meetingForm.description}
                onChange={(event) =>
                  onMeetingFormChange((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                className="min-h-[110px] w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700 outline-none transition focus:border-emerald-300"
                placeholder="Agenda / description"
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="datetime-local"
                  value={meetingForm.startTime}
                  onChange={(event) =>
                    onMeetingFormChange((current) => ({
                      ...current,
                      startTime: event.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-emerald-300"
                />

                <input
                  type="datetime-local"
                  value={meetingForm.endTime}
                  onChange={(event) =>
                    onMeetingFormChange((current) => ({
                      ...current,
                      endTime: event.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-emerald-300"
                />
              </div>

              <input
                value={meetingForm.attendeesText}
                onChange={(event) =>
                  onMeetingFormChange((current) => ({
                    ...current,
                    attendeesText: event.target.value,
                  }))
                }
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-emerald-300"
                placeholder="Attendees, separated by commas"
              />

              <input
                value={meetingForm.location}
                onChange={(event) =>
                  onMeetingFormChange((current) => ({
                    ...current,
                    location: event.target.value,
                  }))
                }
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-emerald-300"
                placeholder="Location optional"
              />

              <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                <span>
                  <span className="block text-sm font-semibold text-slate-950">
                    Create Google Meet link
                  </span>
                  <span className="block text-xs text-slate-500">
                    A Meet link will be requested when the Calendar event is
                    created.
                  </span>
                </span>

                <input
                  type="checkbox"
                  checked={meetingForm.createMeetLink}
                  onChange={(event) =>
                    onMeetingFormChange((current) => ({
                      ...current,
                      createMeetLink: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-emerald-700"
                />
              </label>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={onClearMeeting}
                  className="inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Clear
                </button>

                <button
                  onClick={onCreateMeeting}
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
                  {isCreatingMeeting ? "Creating..." : "Create event"}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTool === "MOM" && (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-4 flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-emerald-700" />
              <h3 className="text-sm font-semibold text-slate-950">
                Minutes of meeting
              </h3>
            </div>

            <div className="grid gap-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-950">
                  Short meeting points
                </p>
                <div className="mt-2 space-y-1 text-sm leading-6 text-slate-600">
                  <p>• Context comes from the selected email.</p>
                  <p>
                    • Main topic: {message.subject || "No subject provided"}.
                  </p>
                  <p>• Sender: {message.fromName || message.fromEmail}.</p>
                  <p>
                    • Suggested follow-up:{" "}
                    {analysis?.requiresReply
                      ? "reply or schedule next step"
                      : "no urgent reply detected"}
                    .
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-950">
                  Action items
                </p>
                <div className="mt-2 space-y-1 text-sm leading-6 text-slate-600">
                  {analysis?.nextActions?.length ? (
                    analysis.nextActions.map((action) => (
                      <p key={action}>• {action}</p>
                    ))
                  ) : (
                    <>
                      <p>• Review the email context.</p>
                      <p>• Decide whether a reply or meeting is needed.</p>
                      <p>• Attach related documents if required.</p>
                    </>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-950">
                  Last 5 meetings
                </h4>

                {isLoadingMeetings ? (
                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />
                    Loading meetings...
                  </div>
                ) : recentMeetings.length ? (
                  <div className="mt-3 grid gap-3">
                    {recentMeetings.map((meeting, index) => (
                      <div
                        key={meeting.id || `${meeting.title}-${index}`}
                        className="rounded-xl border border-slate-200 bg-white p-4"
                      >
                        <p className="text-sm font-semibold text-slate-950">
                          {meeting.title}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {formatDateTime(meeting.startTime)} -{" "}
                          {formatDateTime(meeting.endTime)}
                        </p>

                        {meeting.description && (
                          <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                            {meeting.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">
                    No recent meetings found. Sync Calendar first, then click
                    MoM again.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTool === "DOCUMENTS" && (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-4 flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-emerald-700" />
              <h3 className="text-sm font-semibold text-slate-950">
                Related documents
              </h3>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm leading-6 text-slate-600">
                No document store is connected yet. For now, pulse suggests the
                documents that should be attached to this email or meeting.
              </p>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <InfoBox
                label="Email"
                value={message.subject || "(No subject)"}
              />
              <InfoBox label="Sender" value={getSenderName(message)} />
              <InfoBox
                label="Suggested folder"
                value="Email / Meeting context"
              />
            </div>

            <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
              <p className="text-sm font-semibold text-slate-950">
                Suggested documents
              </p>
              <div className="mt-2 space-y-1 text-sm leading-6 text-slate-600">
                <p>• Meeting agenda</p>
                <p>• Reply draft or follow-up note</p>
                <p>• Sender-shared files</p>
                <p>• Screenshots or references</p>
                <p>• Minutes of meeting after discussion</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function ActionButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: ElementType;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-medium shadow-sm transition ${
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-semibold text-slate-950">
        {value || "—"}
      </p>
    </div>
  );
}

function InboxPulseAiChatPanel({
  selectedMessage,
  trigger,
  onClose,
  onPrepareMeetingFromAi,
  onSyncCalendarFromAi,
}: {
  selectedMessage: InboxMessage | null;
  trigger: AiTrigger | null;
  onClose: () => void;
  onPrepareMeetingFromAi: (commandText?: string) => void;
  onSyncCalendarFromAi: () => Promise<string>;
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

  function isMeetingScheduleCommand(command: string) {
    return /(schedule|create|book|set up|setup).*(meeting|call)|meeting.*(with|at|for)/i.test(
      command,
    );
  }

  function isCalendarSyncCommand(command: string) {
    return /(sync|refresh|update).*(calendar)|calendar.*(sync|refresh|update)/i.test(
      command,
    );
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
        const result = await onSyncCalendarFromAi();

        setMessages((current) => [
          ...current,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: result,
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
                : "I could not sync Google Calendar.",
          },
        ]);
      } finally {
        setIsThinking(false);
      }

      return;
    }

    if (isMeetingScheduleCommand(cleanQuestion)) {
      if (!selectedMessage) {
        setMessages((current) => [
          ...current,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content:
              "Select an email first, then I can prepare a meeting approval draft from that email.",
          },
        ]);

        setIsThinking(false);
        return;
      }

      onPrepareMeetingFromAi(cleanQuestion);

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content:
            "I prepared a meeting approval form from this email. Please review the title, attendee, date, and time, then click Create event to add it to Google Calendar.",
        },
      ]);

      setIsThinking(false);
      return;
    }

    const selectedEmailContext = selectedMessage
      ? `
Selected email context:
Subject: ${selectedMessage.subject}
From: ${selectedMessage.fromName || selectedMessage.fromEmail} <${
          selectedMessage.fromEmail
        }>
To: ${selectedMessage.toEmails.join(", ")}
Received: ${selectedMessage.receivedAt || "Unknown"}
Body:
${getReadableBody(selectedMessage).slice(0, 2500)}
`
      : "";

    try {
      const response = await fetch("/api/pulse-ai/command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          command: `${cleanQuestion}\n\n${selectedEmailContext}`,
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
            <p className="text-xs text-slate-500">Inbox copilot</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="pulse-ai-chat-scroll min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
              <Bot className="h-5 w-5" />
            </div>

            <h3 className="text-sm font-semibold text-slate-950">
              Ask pulse AI
            </h3>

            <p className="mt-2 max-w-[220px] text-sm leading-6 text-slate-500">
              Ask about this email, replies, meetings, priority, or your inbox.
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
              placeholder="Ask about this email..."
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
        .pulse-ai-chat-scroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .pulse-ai-chat-scroll::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }
      `}</style>
    </aside>
  );
}
