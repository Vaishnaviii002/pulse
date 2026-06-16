"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  RefreshCw,
  Users,
  Video,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PulseMark } from "@/components/ui/pulse-logo";

type CalendarEvent = {
  id: string;
  externalEventId: string | null;
  title: string;
  description: string | null;
  location: string | null;
  meetingUrl: string | null;
  attendees: unknown;
  startTime: string;
  endTime: string;
  status: string | null;
  source: string | null;
  sourceEmailId: string | null;
  metadata: unknown;
  createdAt: string;
  updatedAt: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getAttendees(value: unknown): { email?: string; displayName?: string }[] {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (item): item is { email?: string; displayName?: string } =>
      typeof item === "object" && item !== null
  );
}

function getDuration(start: string, end: string) {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  const minutes = Math.max(0, Math.round(diff / 60000));

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;

    return remaining ? `${hours}h ${remaining}m` : `${hours}h`;
  }

  return `${minutes}m`;
}

function isToday(value: string) {
  return new Date(value).toDateString() === new Date().toDateString();
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) || null,
    [events, selectedEventId]
  );

  const loadEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      setPageError(null);

      const response = await fetch("/api/calendar/events", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to load Calendar events.");
      }

      const nextEvents = (data.events || []) as CalendarEvent[];
      setEvents(nextEvents);

      setSelectedEventId((current) => {
        if (current && nextEvents.some((event) => event.id === current)) {
          return current;
        }

        return nextEvents[0]?.id || null;
      });
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Failed to load Calendar."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  async function handleSyncCalendar() {
    try {
      setIsSyncing(true);
      setPageError(null);
      setSyncMessage(null);

      const response = await fetch("/api/calendar/sync", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to sync Calendar.");
      }

      setSyncMessage(`Calendar synced. ${data.saved} events saved.`);
      await loadEvents();
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Failed to sync Calendar."
      );
    } finally {
      setIsSyncing(false);
    }
  }

  const todayEvents = events.filter((event) => isToday(event.startTime));
  const upcomingEvents = events.filter((event) => !isToday(event.startTime));

  return (
    <AppShell
      showAiPanel
      showSearch={false}
      rightPanel={<CalendarAssistantPanel events={events} selectedEvent={selectedEvent} />}
    >
      <div className="flex h-full min-h-0 flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              Calendar
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Sync Google Calendar and review upcoming meetings from pulse.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/api/corsair/oauth/calendar/start"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
            >
              <CalendarDays className="h-4 w-4" />
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
            <AlertCircle className="h-4 w-4" />
            <span>{pageError}</span>
          </div>
        )}

        {syncMessage && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            <span>{syncMessage}</span>
          </div>
        )}

        <div className="grid min-h-0 flex-1 grid-cols-[360px_minmax(0,1fr)] gap-5">
          <section className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-950">
                Upcoming events
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {events.length} synced events
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {isLoading ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading events...
                </div>
              ) : events.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                  <CalendarDays className="mb-3 h-8 w-8 text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-900">
                    No calendar events yet
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Connect Calendar and sync events to show your schedule.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {todayEvents.length > 0 && (
                    <EventGroup
                      title="Today"
                      events={todayEvents}
                      selectedEventId={selectedEventId}
                      onSelect={setSelectedEventId}
                    />
                  )}

                  {upcomingEvents.length > 0 && (
                    <EventGroup
                      title="Upcoming"
                      events={upcomingEvents}
                      selectedEventId={selectedEventId}
                      onSelect={setSelectedEventId}
                    />
                  )}
                </div>
              )}
            </div>
          </section>

          <section className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            {!selectedEvent ? (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <CalendarDays className="mb-4 h-10 w-10 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-950">
                  Select an event
                </h3>
                <p className="mt-1 max-w-md text-sm text-slate-500">
                  Choose a Calendar event to see meeting details.
                </p>
              </div>
            ) : (
              <>
                <div className="border-b border-slate-200 px-6 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="mb-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                          {selectedEvent.status || "confirmed"}
                        </span>

                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                          {selectedEvent.source || "GOOGLE_CALENDAR"}
                        </span>
                      </div>

                      <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                        {selectedEvent.title}
                      </h2>

                      <p className="mt-2 text-sm text-slate-500">
                        {formatDateTime(selectedEvent.startTime)} ·{" "}
                        {getDuration(selectedEvent.startTime, selectedEvent.endTime)}
                      </p>
                    </div>

                    {selectedEvent.meetingUrl && (
                      <a
                        href={selectedEvent.meetingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
                      >
                        <Video className="h-4 w-4" />
                        Join
                      </a>
                    )}
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                  <div className="grid gap-5">
                    <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                      <h3 className="text-sm font-semibold text-slate-950">
                        Event details
                      </h3>

                      <div className="mt-4 grid gap-3">
                        <DetailRow
                          icon={Clock}
                          label="Time"
                          value={`${formatTime(selectedEvent.startTime)} - ${formatTime(
                            selectedEvent.endTime
                          )}`}
                        />

                        <DetailRow
                          icon={CalendarDays}
                          label="Date"
                          value={formatDate(selectedEvent.startTime)}
                        />

                        <DetailRow
                          icon={MapPin}
                          label="Location"
                          value={selectedEvent.location || "No location"}
                        />

                        <DetailRow
                          icon={Users}
                          label="Attendees"
                          value={`${getAttendees(selectedEvent.attendees).length} people`}
                        />
                      </div>
                    </section>

                    {selectedEvent.description && (
                      <section className="rounded-2xl border border-slate-200 bg-white p-5">
                        <h3 className="text-sm font-semibold text-slate-950">
                          Description
                        </h3>

                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                          {selectedEvent.description}
                        </p>
                      </section>
                    )}

                    <section className="rounded-2xl border border-slate-200 bg-white p-5">
                      <h3 className="text-sm font-semibold text-slate-950">
                        Attendees
                      </h3>

                      <div className="mt-4 space-y-2">
                        {getAttendees(selectedEvent.attendees).length ? (
                          getAttendees(selectedEvent.attendees).map((attendee, index) => (
                            <div
                              key={`${attendee.email}-${index}`}
                              className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700"
                            >
                              <p className="font-medium text-slate-950">
                                {attendee.displayName || attendee.email || "Unknown attendee"}
                              </p>
                              {attendee.email && (
                                <p className="mt-1 text-slate-500">{attendee.email}</p>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                            No attendees found.
                          </p>
                        )}
                      </div>
                    </section>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function EventGroup({
  title,
  events,
  selectedEventId,
  onSelect,
}: {
  title: string;
  events: CalendarEvent[];
  selectedEventId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h3>

      <div className="space-y-2">
        {events.map((event) => {
          const active = event.id === selectedEventId;

          return (
            <button
              key={event.id}
              onClick={() => onSelect(event.id)}
              className={`w-full rounded-2xl border p-4 text-left transition ${
                active
                  ? "border-emerald-200 bg-emerald-50/70 shadow-sm"
                  : "border-transparent bg-white hover:border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950">
                    {event.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatDate(event.startTime)}
                  </p>
                </div>

                <span className="shrink-0 text-xs font-semibold text-slate-600">
                  {formatTime(event.startTime)}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200">
                  {getDuration(event.startTime, event.endTime)}
                </span>

                {event.meetingUrl && (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    Video
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-white px-4 py-3 text-sm ring-1 ring-slate-200">
      <div className="flex items-center gap-3 text-slate-500">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>

      <span className="max-w-[60%] text-right font-medium text-slate-900">
        {value}
      </span>
    </div>
  );
}

function CalendarAssistantPanel({
  events,
  selectedEvent,
}: {
  events: CalendarEvent[];
  selectedEvent: CalendarEvent | null;
}) {
  const todayEvents = events.filter((event) => isToday(event.startTime));
  const nextEvent = events[0] || null;

  return (
    <aside className="flex h-screen w-[20%] min-w-[300px] max-w-[360px] flex-col overflow-hidden border-l border-slate-200 bg-white">
      <div className="flex h-20 items-center justify-between border-b border-slate-200 px-6">
        <div className="flex items-center gap-3">
          <PulseMark size="sm" />
          <div>
            <h2 className="text-lg font-semibold text-slate-950">pulse AI</h2>
            <p className="text-xs text-slate-500">Calendar context</p>
          </div>
        </div>

        <div className="rounded-full bg-emerald-50 p-2 text-emerald-700">
          <CalendarDays className="h-4 w-4" />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Schedule brief
            </p>

            <h3 className="mt-2 text-base font-semibold text-slate-950">
              {todayEvents.length} events today
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {nextEvent
                ? `Next event: ${nextEvent.title} at ${formatTime(nextEvent.startTime)}.`
                : "No upcoming events found yet."}
            </p>
          </section>

          {selectedEvent && (
            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-950">
                Selected event
              </h3>

              <div className="mt-4 space-y-2">
                <PanelRow label="Title" value={selectedEvent.title} />
                <PanelRow label="Date" value={formatDate(selectedEvent.startTime)} />
                <PanelRow label="Time" value={formatTime(selectedEvent.startTime)} />
                <PanelRow
                  label="Attendees"
                  value={String(getAttendees(selectedEvent.attendees).length)}
                />
              </div>

              {selectedEvent.meetingUrl && (
                <a
                  href={selectedEvent.meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open meeting link
                </a>
              )}
            </section>
          )}

          <section className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4">
            <p className="text-sm leading-6 text-emerald-800">
              Calendar is now part of pulse context. In the next phase, pulse will create approved meetings from emails.
            </p>
          </section>
        </div>
      </div>
    </aside>
  );
}

function PanelRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-sm font-semibold text-slate-950">{value}</span>
    </div>
  );
}