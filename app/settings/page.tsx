"use client";

import { SignOutButton, useUser } from "@clerk/nextjs";
import { AppShell } from "@/components/layout/app-shell";
import type { ElementType } from "react";
import { useEffect, useState } from "react";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  Monitor,
  ShieldCheck,
  UserRound,
} from "lucide-react";

const preferences = [
  {
    title: "Approval before sending emails",
    description: "pulse will never send emails without your approval.",
    enabled: true,
  },
  {
    title: "Approval before creating meetings",
    description: "Calendar events are created only after you approve them.",
    enabled: true,
  },
  {
    title: "Daily brief",
    description:
      "Show a daily summary of emails, meetings, follow-ups, and pending actions.",
    enabled: true,
  },
  {
    title: "Meeting reminders",
    description:
      "Show meeting context and previous notes before scheduled meetings.",
    enabled: true,
  },
];

export default function SettingsPage() {
  const { user, isLoaded } = useUser();

  const [syncingGmail, setSyncingGmail] = useState(false);
  const [gmailMessage, setGmailMessage] = useState("");
  const [calendarMessage, setCalendarMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const gmailStatus = params.get("gmail");
    const calendarStatus = params.get("calendar");
    const message = params.get("message");

    if (gmailStatus === "connected") {
      setGmailMessage("Gmail connected successfully.");
    }

    if (gmailStatus === "error") {
      setGmailMessage(message || "Gmail connection failed.");
    }

    if (calendarStatus === "connected") {
      setCalendarMessage("Google Calendar connected successfully.");
    }

    if (calendarStatus === "error") {
      setCalendarMessage(message || "Google Calendar connection failed.");
    }
  }, []);

  const userName = user?.fullName || user?.firstName || "pulse user";
  const userEmail =
    user?.primaryEmailAddress?.emailAddress || "No email available";

  const userInitials = userName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const accountDetails = [
    {
      label: "Name",
      value: userName,
    },
    {
      label: "Email",
      value: userEmail,
    },
    {
      label: "Workspace",
      value: "Personal Workspace",
    },
    {
      label: "Role",
      value: "Owner",
    },
  ];

  async function syncGmail() {
    try {
      setSyncingGmail(true);
      setGmailMessage("");

      const res = await fetch("/api/gmail/sync", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        setGmailMessage(data.error || "Gmail sync failed.");
        return;
      }

      setGmailMessage(`Gmail synced successfully. ${data.saved} emails saved.`);
    } catch {
      setGmailMessage("Gmail sync failed. Check terminal logs.");
    } finally {
      setSyncingGmail(false);
    }
  }

  return (
    <AppShell showAiPanel={false} showSearch={false}>
      <div className="flex h-full flex-col overflow-hidden">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Settings
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage your account, login status, connected apps, and workspace
            preferences.
          </p>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[0.9fr_1.1fr] gap-5 overflow-hidden">
          <section className="flex min-h-0 flex-col gap-5 overflow-y-auto">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-4">
                {user?.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt={userName}
                    className="h-14 w-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-700 text-lg font-semibold text-white">
                    {userInitials}
                  </div>
                )}

                <div>
                  <h2 className="text-xl font-semibold text-slate-950">
                    {isLoaded ? userName : "Loading user..."}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {isLoaded ? userEmail : "Loading email..."}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {accountDetails.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
                  >
                    <p className="text-sm text-slate-500">{item.label}</p>
                    <p className="text-sm font-semibold text-slate-950">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-2">
                <UserRound className="h-5 w-5 text-emerald-700" />
                <h2 className="text-lg font-semibold text-slate-950">
                  Login & session
                </h2>
              </div>

              <div className="space-y-3">
                <InfoRow
                  icon={CheckCircle2}
                  title="Logged in"
                  description="Your current session is active."
                  value="Active"
                />

                <InfoRow
                  icon={Clock}
                  title="Session"
                  description="Authenticated with Clerk."
                  value="Secure"
                />

                <InfoRow
                  icon={Monitor}
                  title="Device"
                  description="Current device used for this session."
                  value="Browser"
                />
              </div>

              <div className="mt-6 flex gap-3">
                <button className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  Manage account
                </button>

                <SignOutButton redirectUrl="/">
                  <button className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700">
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </SignOutButton>
              </div>
            </div>
          </section>

          <section className="flex min-h-0 flex-col gap-5 overflow-y-auto">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-700" />
                <h2 className="text-lg font-semibold text-slate-950">
                  Connected apps
                </h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                      <Mail className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="font-semibold text-slate-950">Gmail</p>

                      <p className="mt-1 max-w-md text-sm leading-6 text-slate-600">
                        Connect Gmail to let pulse read emails, prepare replies,
                        detect meeting requests, and send only approved
                        messages.
                      </p>

                      <div className="mt-4 flex flex-wrap gap-3">
                        <a
                          href="/api/corsair/oauth/gmail/start"
                          className="inline-flex rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
                        >
                          Connect Gmail
                        </a>

                        <button
                          onClick={syncGmail}
                          disabled={syncingGmail}
                          className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {syncingGmail && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          )}
                          {syncingGmail ? "Syncing..." : "Sync Gmail"}
                        </button>
                      </div>

                      {gmailMessage && (
                        <p className="mt-3 text-sm font-medium text-slate-600">
                          {gmailMessage}
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                    Ready
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                      <CalendarDays className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="font-semibold text-slate-950">
                        Google Calendar
                      </p>

                      <p className="mt-1 max-w-md text-sm leading-6 text-slate-600">
                        Connect Google Calendar to let pulse read schedules,
                        check availability, and create approved meetings.
                      </p>

                      <div className="mt-4 flex flex-wrap gap-3">
                        <a
                          href="/api/corsair/oauth/calendar/start"
                          className="inline-flex rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
                        >
                          Connect Calendar
                        </a>

                        <a
                          href="/api/corsair/setup/calendar"
                          className="inline-flex rounded-xl border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                        >
                          Setup Calendar
                        </a>
                      </div>

                      {calendarMessage && (
                        <p className="mt-3 text-sm font-medium text-slate-600">
                          {calendarMessage}
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                    Ready
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-emerald-700" />
                <h2 className="text-lg font-semibold text-slate-950">
                  Action preferences
                </h2>
              </div>

              <div className="space-y-3">
                {preferences.map((item) => (
                  <div
                    key={item.title}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        {item.title}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        {item.description}
                      </p>
                    </div>

                    <button
                      className={[
                        "relative h-7 w-12 shrink-0 rounded-full transition",
                        item.enabled ? "bg-emerald-700" : "bg-slate-300",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "absolute top-1 h-5 w-5 rounded-full bg-white transition",
                          item.enabled ? "right-1" : "left-1",
                        ].join(" ")}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-2">
                <Bell className="h-5 w-5 text-emerald-700" />
                <h2 className="text-lg font-semibold text-slate-950">
                  Notifications
                </h2>
              </div>

              <button className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:bg-slate-100">
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    Email and meeting alerts
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Manage reminders for meetings, follow-ups, and pending
                    approvals.
                  </p>
                </div>

                <ChevronRight className="h-5 w-5 text-slate-400" />
              </button>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function InfoRow({
  icon: Icon,
  title,
  description,
  value,
}: {
  icon: ElementType;
  title: string;
  description: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-950">{title}</p>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
      </div>

      <p className="text-sm font-semibold text-slate-700">{value}</p>
    </div>
  );
}