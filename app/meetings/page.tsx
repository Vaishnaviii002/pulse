"use client";

import { AppShell } from "@/components/layout/app-shell";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  Filter,
  Mail,
  MoreVertical,
  NotebookText,
  Plus,
  Send,
  UsersRound,
  Video,
} from "lucide-react";
import { useState } from "react";

const meetings = [
  {
    id: 1,
    time: "10:00 AM",
    duration: "60m",
    title: "Q2 Roadmap Alignment",
    client: "Acme Corp",
    type: "Strategic Review",
    status: "Confirmed",
    day: "Today",
    date: "May 8",
    meetLink: "meet.google.com/abc-defg-hij",
    attendeeCount: 3,
    attendees: [
      "Sarah Chen — VP Operations",
      "Sarah Thompson — VP of Operations, Acme Corp",
      "James Lee — Director of Product, Acme Corp",
    ],
    agenda: [
      "Review Q2 roadmap and milestones",
      "Align on priorities and dependencies",
      "Identify risks and mitigation plans",
      "Agree on next steps and owners",
    ],
    lastSummary:
      "Q1 results were reviewed and go-to-market priorities were aligned. Roadmap risks identified; monthly alignment cadence established.",
    minutes: [
      "Share updated roadmap deck",
      "Confirm integration dependencies",
      "Provide marketing launch plan",
    ],
  },
  {
    id: 2,
    time: "1:30 PM",
    duration: "45m",
    title: "Implementation Check-in",
    client: "Beta Solutions",
    type: "Check-in",
    status: "Confirmed",
    day: "Today",
    date: "May 8",
    meetLink: "meet.google.com/beta-sync",
    attendeeCount: 2,
    attendees: ["Sam Lee — CTO", "Alex Morgan — Greenfield Partners"],
    agenda: [
      "Review current implementation status",
      "Discuss blockers",
      "Confirm rollout timeline",
    ],
    lastSummary:
      "Implementation scope was confirmed. Data sync and onboarding blockers were flagged for review.",
    minutes: [
      "Confirm API handoff",
      "Review migration checklist",
      "Share rollout dates",
    ],
  },
  {
    id: 3,
    time: "9:00 AM",
    duration: "45m",
    title: "Renewal Discussion",
    client: "Northwind Group",
    type: "Renewal",
    status: "Confirmed",
    day: "Tomorrow",
    date: "May 9",
    meetLink: "meet.google.com/northwind-renewal",
    attendeeCount: 4,
    attendees: ["Jordan Patel — Account Lead", "Alex Morgan — Greenfield"],
    agenda: [
      "Review renewal scope",
      "Discuss pricing concerns",
      "Confirm executive sponsor",
    ],
    lastSummary:
      "Northwind asked for updated renewal numbers and requested a clearer implementation roadmap.",
    minutes: [
      "Send updated quote",
      "Prepare success metrics",
      "Confirm contract timeline",
    ],
  },
  {
    id: 4,
    time: "11:00 AM",
    duration: "30m",
    title: "Introductory Call",
    client: "Brightway Inc.",
    type: "Intro Call",
    status: "Confirmed",
    day: "Tomorrow",
    date: "May 9",
    meetLink: "meet.google.com/brightway-intro",
    attendeeCount: 2,
    attendees: ["Maya Patel — Founder", "Alex Morgan — Greenfield"],
    agenda: [
      "Understand Brightway goals",
      "Review product fit",
      "Agree on follow-up steps",
    ],
    lastSummary:
      "No previous meeting found. This appears to be the first client call.",
    minutes: [
      "Capture requirements",
      "Send product overview",
      "Schedule technical discovery",
    ],
  },
  {
    id: 5,
    time: "2:00 PM",
    duration: "90m",
    title: "Strategic Planning Workshop",
    client: "Vantage Consulting",
    type: "Workshop",
    status: "Confirmed",
    day: "Upcoming",
    date: "May 12",
    meetLink: "meet.google.com/vantage-workshop",
    attendeeCount: 5,
    attendees: ["Priya Shah — Partner", "Alex Morgan — Greenfield"],
    agenda: [
      "Map current workflows",
      "Identify automation opportunities",
      "Define next quarter goals",
    ],
    lastSummary:
      "Previous discussion focused on operational bottlenecks and reporting gaps.",
    minutes: [
      "Prepare workshop board",
      "Share agenda",
      "Collect stakeholder notes",
    ],
  },
];

function statusClass(status: string) {
  if (status === "Confirmed") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }

  return "bg-amber-50 text-amber-700 ring-amber-100";
}

function MeetingsAiPanel({
  selectedMeeting,
}: {
  selectedMeeting: (typeof meetings)[number];
}) {
  return (
    <aside className="flex h-screen w-[20%] min-w-[300px] shrink-0 flex-col overflow-hidden border-l border-slate-200 bg-white">
      <div className="flex h-20 shrink-0 items-center justify-between border-b border-slate-200 px-6">
        <div className="flex items-center gap-2">
          <span className="text-emerald-700">✦</span>
          <h2 className="text-lg font-semibold text-slate-950">pulse AI</h2>
        </div>

        <button className="rounded-full p-2 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        <section>
          <div className="mb-3 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-950">
              Meeting Brief
            </h3>
          </div>

          <p className="text-sm leading-6 text-slate-600">
            {selectedMeeting.title} with {selectedMeeting.client} is focused on{" "}
            {selectedMeeting.type.toLowerCase()}. Review agenda items, previous
            summary, and open action items before the call.
          </p>
        </section>

        <section className="border-t border-slate-200 pt-5">
          <div className="mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-950">
              Last Meeting Summary
            </h3>
          </div>

          <p className="text-sm leading-6 text-slate-600">
            {selectedMeeting.lastSummary}
          </p>
        </section>

        <section className="border-t border-slate-200 pt-5">
          <div className="mb-3 flex items-center gap-2">
            <NotebookText className="h-4 w-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-950">
              Key Talking Points
            </h3>
          </div>

          <ul className="space-y-2 text-sm leading-6 text-slate-600">
            {selectedMeeting.agenda.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </section>

        <section className="border-t border-slate-200 pt-5">
          <div className="mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-950">
              Recommended Actions
            </h3>
          </div>

          <div className="space-y-2">
            <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50">
              <Mail className="h-4 w-4" />
              Draft Follow-up
            </button>

            <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50">
              <UsersRound className="h-4 w-4" />
              Open Client Record
            </button>

            <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50">
              <Send className="h-4 w-4" />
              Prepare Recap
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs leading-5 text-slate-500">
            pulse securely uses your Gmail and Calendar data to prepare meeting
            context, summaries, and follow-ups.
          </p>
        </section>
      </div>
    </aside>
  );
}

export default function MeetingsPage() {
  const [selectedId, setSelectedId] = useState(1);

  const selectedMeeting =
    meetings.find((meeting) => meeting.id === selectedId) ?? meetings[0];

  const todayMeetings = meetings.filter((meeting) => meeting.day === "Today");
  const tomorrowMeetings = meetings.filter(
    (meeting) => meeting.day === "Tomorrow"
  );
  const upcomingMeetings = meetings.filter(
    (meeting) => meeting.day === "Upcoming"
  );

  return (
    <AppShell rightPanel={<MeetingsAiPanel selectedMeeting={selectedMeeting} />}>
      <div className="flex h-full flex-col">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              Meetings
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Your scheduled meetings and meeting intelligence.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
              <Filter className="h-4 w-4" />
              Filter
            </button>

            <button className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50">
              <CalendarDays className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[0.9fr_1.1fr] gap-5">
          <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex-1 overflow-y-auto p-4">
              <MeetingGroup
                title="Today"
                date="May 8"
                meetings={todayMeetings}
                selectedId={selectedId}
                setSelectedId={setSelectedId}
              />

              <MeetingGroup
                title="Tomorrow"
                date="May 9"
                meetings={tomorrowMeetings}
                selectedId={selectedId}
                setSelectedId={setSelectedId}
              />

              <MeetingGroup
                title="Upcoming"
                date=""
                meetings={upcomingMeetings}
                selectedId={selectedId}
                setSelectedId={setSelectedId}
              />
            </div>

            <div className="shrink-0 border-t border-slate-200 p-4">
              <button className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                <span className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  View full calendar
                </span>
                <span>↗</span>
              </button>
            </div>
          </section>

          <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <span className="mb-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                    {selectedMeeting.type}
                  </span>

                  <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                    {selectedMeeting.title}
                  </h2>

                  <p className="mt-1 text-sm text-slate-600">
                    {selectedMeeting.client}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={[
                      "rounded-full px-3 py-1 text-xs font-semibold ring-1",
                      statusClass(selectedMeeting.status),
                    ].join(" ")}
                  >
                    {selectedMeeting.status}
                  </span>

                  <button className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-50">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4 border-y border-slate-200 py-5">
                <DetailRow
                  icon={CalendarDays}
                  label={`${selectedMeeting.day}, ${selectedMeeting.date}`}
                />
                <DetailRow
                  icon={Clock}
                  label={`${selectedMeeting.time} · ${selectedMeeting.duration}`}
                />
                <DetailRow icon={Video} label={selectedMeeting.meetLink} />
                <DetailRow
                  icon={UsersRound}
                  label={`${selectedMeeting.client} · ${selectedMeeting.attendeeCount} attendees`}
                />
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-slate-950">
                    Agenda
                  </h3>

                  <ul className="space-y-2 text-sm leading-6 text-slate-600">
                    {selectedMeeting.agenda.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-semibold text-slate-950">
                    Attendees
                  </h3>

                  <div className="space-y-3">
                    {selectedMeeting.attendees.map((attendee) => (
                      <div key={attendee} className="flex gap-2">
                        <UsersRound className="mt-0.5 h-4 w-4 text-slate-400" />
                        <p className="text-sm leading-5 text-slate-600">
                          {attendee}
                        </p>
                      </div>
                    ))}

                    <button className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                      <Plus className="h-4 w-4" />
                      Add attendees
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-500" />
                    <h3 className="text-sm font-semibold text-slate-950">
                      Last Meeting Summary
                    </h3>
                  </div>

                  <p className="text-sm leading-6 text-slate-600">
                    {selectedMeeting.lastSummary}
                  </p>

                  <button className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                    View full notes
                  </button>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <NotebookText className="h-4 w-4 text-slate-500" />
                    <h3 className="text-sm font-semibold text-slate-950">
                      Minutes of Meeting
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {selectedMeeting.minutes.map((item, index) => (
                      <label
                        key={item}
                        className="flex items-start gap-3 rounded-xl bg-white p-3"
                      >
                        <input type="checkbox" className="mt-1 h-4 w-4" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-slate-700">{item}</p>
                          <p className="mt-1 text-xs text-slate-400">
                            Due May {9 + index * 3}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>

                  <button className="mt-4 w-full rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50">
                    View all action items
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function MeetingGroup({
  title,
  date,
  meetings,
  selectedId,
  setSelectedId,
}: {
  title: string;
  date: string;
  meetings: typeof meetings;
  selectedId: number;
  setSelectedId: (id: number) => void;
}) {
  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
        {date && <span className="text-sm text-slate-500">• {date}</span>}
      </div>

      <div className="space-y-2">
        {meetings.map((meeting) => {
          const active = meeting.id === selectedId;

          return (
            <button
              key={meeting.id}
              onClick={() => setSelectedId(meeting.id)}
              className={[
                "flex w-full items-center gap-4 rounded-xl border px-4 py-3 text-left transition",
                active
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-slate-200 bg-white hover:bg-slate-50",
              ].join(" ")}
            >
              <div className="w-20 shrink-0">
                <p className="text-sm font-semibold text-slate-950">
                  {meeting.time}
                </p>
                <p className="text-xs text-slate-500">{meeting.duration}</p>
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-950">
                  {meeting.client}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {meeting.title}
                </p>
              </div>

              <div className="hidden text-right lg:block">
                <span
                  className={[
                    "rounded-full px-2 py-1 text-[11px] font-semibold ring-1",
                    statusClass(meeting.status),
                  ].join(" ")}
                >
                  {meeting.status}
                </span>
                <p className="mt-1 text-xs text-slate-500">{meeting.type}</p>
              </div>

              <span className="text-slate-400">›</span>
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
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-600">
      <Icon className="h-4 w-4 text-slate-400" />
      <span>{label}</span>
    </div>
  );
}