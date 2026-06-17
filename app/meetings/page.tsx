"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { ElementType } from "react";
import {
  ArrowLeft,
  Bot,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  FileText,
  FolderOpen,
  Link2,
  Loader2,
  Mail,
  MessageSquareText,
  PanelRightClose,
  PanelRightOpen,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PulseMark } from "@/components/ui/pulse-logo";

type MeetingSourceEmail = {
  id: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  snippet: string;
  bodyText: string;
  receivedAt: string | null;
  threadSubject: string;
};

type MeetingItem = {
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
  sourceEmail: MeetingSourceEmail | null;
  workflows: {
    id: string;
    title?: string;
    type?: string;
    status?: string;
    summary?: string | null;
    nextStep?: string | null;
    updatedAt?: string;
  }[];
  auditLogs: {
    id: string;
    event: string;
    entityType?: string | null;
    entityId?: string | null;
    createdAt: string;
  }[];
  readiness: {
    score: number;
    label: "Ready" | "Needs preparation" | "Not ready";
    missing: string[];
  };
};

type MeetingTool =
  | "PREP"
  | "AGENDA"
  | "MOM"
  | "SOURCE_EMAIL"
  | "DOCUMENTS"
  | "FOLLOW_UP";

type AiTrigger = {
  id: number;
  command: string;
};

type FilterKey =
  | "ALL"
  | "TODAY"
  | "UPCOMING"
  | "FROM_EMAIL"
  | "NEEDS_PREP"
  | "WITH_LINK";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "TODAY", label: "Today" },
  { key: "UPCOMING", label: "Upcoming" },
  { key: "FROM_EMAIL", label: "From email" },
  { key: "NEEDS_PREP", label: "Needs prep" },
  { key: "WITH_LINK", label: "With link" },
];

function formatDateTime(value?: string | null) {
  if (!value) return "Unknown time";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDate(value?: string | null) {
  if (!value) return "Unknown date";

  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

function formatTime(value?: string | null) {
  if (!value) return "";

  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDuration(start?: string | null, end?: string | null) {
  if (!start || !end) return "Unknown duration";

  const diffMs = new Date(end).getTime() - new Date(start).getTime();
  const minutes = Math.max(0, Math.round(diffMs / 60000));

  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

function isToday(value: string) {
  return new Date(value).toDateString() === new Date().toDateString();
}

function isUpcoming(value: string) {
  return new Date(value).getTime() >= Date.now();
}

function cleanText(value: string) {
  return value
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function getMeetingBrief(meeting: MeetingItem) {
  const parts = [
    meeting.description,
    meeting.sourceEmail?.snippet,
    meeting.sourceEmail?.bodyText,
  ]
    .filter(Boolean)
    .join("\n\n");

  return cleanText(parts) || "No detailed description available.";
}

function getReadinessColor(label: MeetingItem["readiness"]["label"]) {
  if (label === "Ready") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  if (label === "Needs preparation") {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }

  return "bg-rose-50 text-rose-700 ring-rose-200";
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

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(
    null
  );
  const [meetingIdFromUrl, setMeetingIdFromUrl] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("ALL");

  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiTrigger, setAiTrigger] = useState<AiTrigger | null>(null);

  const selectedMeeting = useMemo(
    () => meetings.find((meeting) => meeting.id === selectedMeetingId) || null,
    [meetings, selectedMeetingId]
  );

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
        throw new Error(data.error || "Failed to load meetings.");
      }

      setMeetings(data.meetings || []);
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Failed to load meetings."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("meetingId");

    if (id) {
      setMeetingIdFromUrl(id);
    }
  }, []);

  useEffect(() => {
    loadMeetings();
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
    if (!meetingIdFromUrl) return;
    if (!meetings.some((meeting) => meeting.id === meetingIdFromUrl)) return;

    setSelectedMeetingId(meetingIdFromUrl);
  }, [meetingIdFromUrl, meetings]);

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

      if (activeFilter === "TODAY") return isToday(meeting.startTime);
      if (activeFilter === "UPCOMING") return isUpcoming(meeting.startTime);
      if (activeFilter === "FROM_EMAIL") return Boolean(meeting.sourceEmailId);
      if (activeFilter === "NEEDS_PREP") {
        return meeting.readiness.label !== "Ready";
      }
      if (activeFilter === "WITH_LINK") return Boolean(meeting.meetingUrl);

      return true;
    });
  }, [meetings, searchQuery, activeFilter]);

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
          : "Failed to sync Google Calendar."
      );
    } finally {
      setIsSyncing(false);
    }
  }

  function triggerPulseAi(command: string) {
    setIsAiOpen(true);
    setAiTrigger({
      id: Date.now(),
      command,
    });
  }

  function handleBack() {
    setSelectedMeetingId(null);

    const url = new URL(window.location.href);
    url.searchParams.delete("meetingId");
    window.history.replaceState({}, "", url.toString());
  }

  return (
    <AppShell
      showAiPanel={isAiOpen}
      showSearch={false}
      showHeader={false}
      rightPanel={
        isAiOpen ? (
          <MeetingPulseAiPanel
            selectedMeeting={selectedMeeting}
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
              Meetings
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {selectedMeeting
                ? "Prepare, review, and follow up from one focused meeting workspace."
                : "Review synced meetings, email-created meetings, attendees, and prep status."}
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

        {!selectedMeeting ? (
          <MeetingListView
            meetings={filteredMeetings}
            allMeetings={meetings}
            searchQuery={searchQuery}
            activeFilter={activeFilter}
            isLoading={isLoading}
            onSearchChange={setSearchQuery}
            onFilterChange={setActiveFilter}
            onSelectMeeting={setSelectedMeetingId}
          />
        ) : (
          <SelectedMeetingWorkspace
            key={selectedMeeting.id}
            meeting={selectedMeeting}
            onBack={handleBack}
            onAiAction={triggerPulseAi}
          />
        )}
      </div>
    </AppShell>
  );
}

function MeetingListView({
  meetings,
  allMeetings,
  searchQuery,
  activeFilter,
  isLoading,
  onSearchChange,
  onFilterChange,
  onSelectMeeting,
}: {
  meetings: MeetingItem[];
  allMeetings: MeetingItem[];
  searchQuery: string;
  activeFilter: FilterKey;
  isLoading: boolean;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: FilterKey) => void;
  onSelectMeeting: (id: string) => void;
}) {
  const todayCount = allMeetings.filter((meeting) =>
    isToday(meeting.startTime)
  ).length;
  const fromEmailCount = allMeetings.filter(
    (meeting) => meeting.sourceEmailId
  ).length;
  const needsPrepCount = allMeetings.filter(
    (meeting) => meeting.readiness.label !== "Ready"
  ).length;

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-white p-5">
        <div className="grid gap-3 md:grid-cols-3">
          <StatCard label="Today" value={String(todayCount)} />
          <StatCard label="Created from email" value={String(fromEmailCount)} />
          <StatCard label="Needs prep" value={String(needsPrepCount)} />
        </div>

        <div className="mt-5 flex items-center justify-between gap-4">
          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search meetings, attendees, source email..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white"
            />
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
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

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading meetings...
          </div>
        ) : meetings.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <CalendarClock className="mb-3 h-9 w-9 text-slate-300" />
            <h3 className="text-sm font-semibold text-slate-900">
              No meetings found
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Sync Google Calendar or create meetings from Inbox emails.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {meetings.map((meeting) => (
              <button
                key={meeting.id}
                onClick={() => onSelectMeeting(meeting.id)}
                className="grid w-full grid-cols-[170px_minmax(0,1fr)_180px_130px] items-center gap-4 px-5 py-4 text-left transition hover:bg-emerald-50/50"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    {formatDate(meeting.startTime)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatTime(meeting.startTime)} ·{" "}
                    {formatDuration(meeting.startTime, meeting.endTime)}
                  </p>
                </div>

                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <p className="truncate text-sm font-bold text-slate-950">
                      {meeting.title || "Untitled meeting"}
                    </p>

                    {meeting.sourceEmailId && (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                        From email
                      </span>
                    )}
                  </div>

                  <p className="mt-1 truncate text-sm text-slate-500">
                    {meeting.description ||
                      meeting.sourceEmail?.snippet ||
                      "No description"}
                  </p>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <UsersRound className="h-4 w-4 text-slate-400" />
                    <span className="truncate">
                      {meeting.attendees.length
                        ? `${meeting.attendees.length} attendees`
                        : "No attendees"}
                    </span>
                  </div>

                  {meeting.meetingUrl && (
                    <div className="mt-1 flex items-center gap-2 text-xs text-emerald-700">
                      <Link2 className="h-3.5 w-3.5" />
                      Meet link
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getReadinessColor(
                      meeting.readiness.label
                    )}`}
                  >
                    {meeting.readiness.label}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function SelectedMeetingWorkspace({
  meeting,
  onBack,
  onAiAction,
}: {
  meeting: MeetingItem;
  onBack: () => void;
  onAiAction: (command: string) => void;
}) {
  const [activeTool, setActiveTool] = useState<MeetingTool | null>(null);

  function trigger(tool: MeetingTool, command: string) {
    setActiveTool(tool);
    onAiAction(command);
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-5">
        <button
          onClick={onBack}
          className="mb-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to meetings
        </button>

        <div className="flex items-start justify-between gap-5">
          <div className="min-w-0">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              {meeting.title || "Untitled meeting"}
            </h2>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span>{formatDate(meeting.startTime)}</span>
              <span>•</span>
              <span>
                {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
              </span>
              <span>•</span>
              <span>{formatDuration(meeting.startTime, meeting.endTime)}</span>
            </div>

            <div className="mt-2 text-sm text-slate-500">
              {meeting.location || "No location added"}
            </div>
          </div>

          <span
            className={`inline-flex shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${getReadinessColor(
              meeting.readiness.label
            )}`}
          >
            {meeting.readiness.label}
          </span>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <ActionButton
            icon={Sparkles}
            label="Prep"
            active={activeTool === "PREP"}
            onClick={() =>
              trigger(
                "PREP",
                "Give a short 2-line prep brief for this selected meeting."
              )
            }
          />
          <ActionButton
            icon={ClipboardList}
            label="Agenda"
            active={activeTool === "AGENDA"}
            onClick={() =>
              trigger(
                "AGENDA",
                "Give a short agenda summary for this selected meeting."
              )
            }
          />
          <ActionButton
            icon={FileText}
            label="MoM"
            active={activeTool === "MOM"}
            onClick={() =>
              trigger(
                "MOM",
                "Prepare short minutes of meeting points for this selected meeting."
              )
            }
          />
          <ActionButton
            icon={Mail}
            label="Source Email"
            active={activeTool === "SOURCE_EMAIL"}
            onClick={() =>
              trigger(
                "SOURCE_EMAIL",
                "Explain in one short line how the source email relates to this meeting."
              )
            }
          />
          <ActionButton
            icon={FolderOpen}
            label="Documents"
            active={activeTool === "DOCUMENTS"}
            onClick={() =>
              trigger(
                "DOCUMENTS",
                "Suggest in one short line what documents are needed for this meeting."
              )
            }
          />
          <ActionButton
            icon={MessageSquareText}
            label="Follow-up"
            active={activeTool === "FOLLOW_UP"}
            onClick={() =>
              trigger(
                "FOLLOW_UP",
                "Generate a short follow-up direction for this meeting."
              )
            }
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <div className="grid gap-4 md:grid-cols-3">
          <InfoBox label="Status" value={meeting.status || "confirmed"} />
          <InfoBox label="Source" value={meeting.source || "Google Calendar"} />
          <InfoBox
            label="Readiness"
            value={`${meeting.readiness.score}% · ${meeting.readiness.label}`}
          />
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
          <div className="mb-3 flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-emerald-700" />
            <h3 className="text-sm font-semibold text-slate-950">
              Meeting details
            </h3>
          </div>

          <div className="space-y-3 text-sm leading-6 text-slate-700">
            <p>{getMeetingBrief(meeting)}</p>

            {meeting.meetingUrl && (
              <a
                href={meeting.meetingUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                <Link2 className="h-4 w-4" />
                Join meeting
              </a>
            )}
          </div>
        </div>

        {!activeTool && (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-500">
            Choose Prep, Agenda, MoM, Source Email, Documents, or Follow-up to
            open detailed meeting intelligence.
          </div>
        )}

        {activeTool === "PREP" && <MeetingPrepSection meeting={meeting} />}
        {activeTool === "AGENDA" && <MeetingAgendaSection meeting={meeting} />}
        {activeTool === "MOM" && <MeetingMomSection meeting={meeting} />}
        {activeTool === "SOURCE_EMAIL" && (
          <MeetingSourceEmailSection meeting={meeting} />
        )}
        {activeTool === "DOCUMENTS" && (
          <MeetingDocumentsSection meeting={meeting} />
        )}
        {activeTool === "FOLLOW_UP" && (
          <MeetingFollowUpSection meeting={meeting} />
        )}
      </div>
    </section>
  );
}

function MeetingPrepSection({ meeting }: { meeting: MeetingItem }) {
  const questions = [
    "What outcome should this meeting produce?",
    "Who owns the next action after the call?",
    "Are there documents or context missing before the meeting?",
  ];

  return (
    <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-emerald-700" />
        <h3 className="text-sm font-semibold text-slate-950">
          pulse AI meeting prep
        </h3>
      </div>

      <div className="grid gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-950">Brief</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            This meeting is about{" "}
            <b>{meeting.title || "the selected calendar event"}</b>.{" "}
            {meeting.sourceEmail
              ? "It was created from Gmail context, so review the source email before joining."
              : "No source email is linked, so use the calendar description and attendees for prep."}
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <InfoBox
            label="Missing"
            value={
              meeting.readiness.missing.length
                ? meeting.readiness.missing.join(", ")
                : "Nothing major"
            }
          />
          <InfoBox
            label="Attendees"
            value={
              meeting.attendees.length
                ? `${meeting.attendees.length} attendee(s)`
                : "Not added"
            }
          />
          <InfoBox
            label="Meet link"
            value={meeting.meetingUrl ? "Available" : "Missing"}
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-950">
            Questions to ask
          </p>
          <div className="mt-2 space-y-1 text-sm leading-6 text-slate-600">
            {questions.map((question) => (
              <p key={question}>• {question}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MeetingAgendaSection({ meeting }: { meeting: MeetingItem }) {
  return (
    <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="mb-4 flex items-center gap-2">
        <ClipboardList className="h-4 w-4 text-emerald-700" />
        <h3 className="text-sm font-semibold text-slate-950">Agenda</h3>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="space-y-2 text-sm leading-6 text-slate-600">
          <p>• Confirm the purpose of: {meeting.title}.</p>
          <p>• Review context from description/source email.</p>
          <p>• Discuss blockers, decisions, and responsibilities.</p>
          <p>• Confirm next actions and follow-up owner.</p>
          <p>• Decide whether documents or MoM need to be shared after call.</p>
        </div>
      </div>
    </div>
  );
}

function MeetingMomSection({ meeting }: { meeting: MeetingItem }) {
  return (
    <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="mb-4 flex items-center gap-2">
        <FileText className="h-4 w-4 text-emerald-700" />
        <h3 className="text-sm font-semibold text-slate-950">
          Minutes of meeting draft
        </h3>
      </div>

      <div className="grid gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-950">Summary</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Meeting held for {meeting.title}. The discussion should focus on the
            agenda, decisions, blockers, and follow-up responsibilities.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-950">Action items</p>
          <div className="mt-2 space-y-1 text-sm leading-6 text-slate-600">
            <p>• Capture key decisions after the meeting.</p>
            <p>• Assign action owners.</p>
            <p>• Send follow-up email with MoM.</p>
            <p>• Attach required documents if any.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MeetingSourceEmailSection({ meeting }: { meeting: MeetingItem }) {
  return (
    <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Mail className="h-4 w-4 text-emerald-700" />
        <h3 className="text-sm font-semibold text-slate-950">Source email</h3>
      </div>

      {meeting.sourceEmail ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-950">
            {meeting.sourceEmail.subject}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            From {meeting.sourceEmail.fromName || meeting.sourceEmail.fromEmail}
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {meeting.sourceEmail.snippet || meeting.sourceEmail.bodyText}
          </p>

          <Link
            href="/inbox"
            className="mt-4 inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Open Inbox
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
          No source email is linked to this meeting.
        </div>
      )}
    </div>
  );
}

function MeetingDocumentsSection({ meeting }: { meeting: MeetingItem }) {
  return (
    <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="mb-4 flex items-center gap-2">
        <FolderOpen className="h-4 w-4 text-emerald-700" />
        <h3 className="text-sm font-semibold text-slate-950">
          Related documents
        </h3>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-sm leading-6 text-slate-600">
          Document storage is not connected yet. For this meeting, pulse
          suggests attaching agenda, source email, MoM, shared files, and
          follow-up notes.
        </p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <InfoBox label="Agenda" value="Suggested" />
        <InfoBox
          label="Source email"
          value={meeting.sourceEmail ? "Linked" : "Missing"}
        />
        <InfoBox label="MoM" value="Draft ready after meeting" />
      </div>
    </div>
  );
}

function MeetingFollowUpSection({ meeting }: { meeting: MeetingItem }) {
  const attendee = meeting.attendees[0] || "there";

  return (
    <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/30 p-5">
      <div className="mb-4 flex items-center gap-2">
        <MessageSquareText className="h-4 w-4 text-emerald-700" />
        <h3 className="text-sm font-semibold text-slate-950">
          Follow-up draft
        </h3>
      </div>

      <textarea
        readOnly
        value={`Hi ${attendee},

Thank you for the meeting. Here is a short recap of what we discussed:

- Main topic: ${meeting.title}
- Key context: ${
          meeting.description || "Discussed meeting agenda and next steps"
        }
- Next action: Please confirm the follow-up items and responsibilities.

Best regards`}
        className="min-h-[220px] w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700 outline-none"
      />
    </div>
  );
}

function MeetingPulseAiPanel({
  selectedMeeting,
  trigger,
  onClose,
  onSyncCalendar,
}: {
  selectedMeeting: MeetingItem | null;
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
      command
    );
  }

  function selectedMeetingContext() {
    if (!selectedMeeting) return "";

    return `
Selected meeting:
Title: ${selectedMeeting.title}
Time: ${formatDateTime(selectedMeeting.startTime)} - ${formatDateTime(
      selectedMeeting.endTime
    )}
Attendees: ${selectedMeeting.attendees.join(", ") || "none"}
Description: ${selectedMeeting.description || "none"}
Source email: ${selectedMeeting.sourceEmail?.subject || "none"}
Readiness: ${selectedMeeting.readiness.label}
    `.trim();
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

${selectedMeetingContext()}
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
            <h2 className="text-base font-semibold text-slate-950">
              pulse AI
            </h2>
            <p className="text-xs text-slate-500">Meeting copilot</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="meeting-ai-scroll min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
              <Bot className="h-5 w-5" />
            </div>

            <h3 className="text-sm font-semibold text-slate-950">
              Ask pulse AI
            </h3>

            <p className="mt-2 max-w-[220px] text-sm leading-6 text-slate-500">
              Ask about prep, agenda, MoM, source email, documents, or
              follow-up.
            </p>
          </div>
        ) : (
          <div className="space-y-5 pb-4">
            {messages.map((message) => {
              const isUser = message.role === "user";

              return (
                <div
                  key={message.id}
                  className={`flex ${
                    isUser ? "justify-end" : "justify-start"
                  }`}
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
              placeholder="Ask about this meeting..."
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
        .meeting-ai-scroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .meeting-ai-scroll::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }
      `}</style>
    </aside>
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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}