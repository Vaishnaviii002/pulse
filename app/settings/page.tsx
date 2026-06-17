"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { SignOutButton, useUser } from "@clerk/nextjs";
import { AppShell } from "@/components/layout/app-shell";
import {
  CalendarDays,
  Download,
  KeyRound,
  Lock,
  Mail,
  Moon,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  UserRound,
} from "lucide-react";

type Settings = {
  autoSyncOnOpen: boolean;
  syncOnTabFocus: boolean;
  syncEveryMinute: boolean;
  analyzeGmailAfterSync: boolean;
  extractTasksAutomatically: boolean;

  defaultReplyTone: string;
  defaultSummaryStyle: string;

  allowEmailSummaries: boolean;
  allowReplyDrafts: boolean;
  allowTaskExtraction: boolean;
  allowMeetingNotes: boolean;
  allowCalendarSuggestions: boolean;

  requireEmailApproval: boolean;
  requireCalendarApproval: boolean;
  requireExternalConfirmation: boolean;
};

type AppearanceMode = "light" | "dark";

const defaultSettings: Settings = {
  autoSyncOnOpen: true,
  syncOnTabFocus: true,
  syncEveryMinute: true,
  analyzeGmailAfterSync: true,
  extractTasksAutomatically: true,

  defaultReplyTone: "PROFESSIONAL",
  defaultSummaryStyle: "ACTION_FOCUSED",

  allowEmailSummaries: true,
  allowReplyDrafts: true,
  allowTaskExtraction: true,
  allowMeetingNotes: true,
  allowCalendarSuggestions: true,

  requireEmailApproval: true,
  requireCalendarApproval: true,
  requireExternalConfirmation: true,
};

export default function SettingsPage() {
  return (
    <AppShell showAiPanel={false}>
      <SettingsContent />
    </AppShell>
  );
}

function SettingsContent() {
  const { user } = useUser();

  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [appearance, setAppearance] = useState<AppearanceMode>("light");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const accountEmail = useMemo(() => {
    return user?.primaryEmailAddress?.emailAddress ?? "No email found";
  }, [user]);

  useEffect(() => {
    const savedAppearance = localStorage.getItem("pulse:appearance");

    if (savedAppearance === "dark" || savedAppearance === "light") {
      applyAppearance(savedAppearance);
    } else {
      applyAppearance("light");
    }
  }, []);

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch("/api/settings/preferences", {
          cache: "no-store",
        });

        const data = await response.json();

        if (data.success && data.settings) {
          setSettings({
            ...defaultSettings,
            ...data.settings,
          });
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  function applyAppearance(mode: AppearanceMode) {
    setAppearance(mode);
    localStorage.setItem("pulse:appearance", mode);

    if (mode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  async function updateSettings(patch: Partial<Settings>) {
    const previousSettings = settings;

    const nextSettings = {
      ...settings,
      ...patch,
    };

    setSettings(nextSettings);
    setSaving(true);

    try {
      const response = await fetch("/api/settings/preferences", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(patch),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error ?? "Failed to update settings");
      }

      setSettings({
        ...defaultSettings,
        ...data.settings,
      });
    } catch (error) {
      console.error("Failed to update settings:", error);
      setSettings(previousSettings);
    } finally {
      setSaving(false);
    }
  }

  async function runSync(endpoint: string) {
    try {
      await fetch(endpoint, {
        method: "POST",
      });

      window.dispatchEvent(
        new CustomEvent("pulse:auto-sync-complete", {
          detail: {
            source: "settings",
            endpoint,
          },
        })
      );
    } catch (error) {
      console.error("Sync failed:", error);
    }
  }

  if (loading) {
    return (
      <div className="h-full overflow-y-auto bg-slate-50 px-8 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="h-8 w-48 animate-pulse rounded-xl bg-slate-200" />

          <div className="mt-6 grid gap-4">
            <div className="h-40 animate-pulse rounded-3xl bg-white" />
            <div className="h-40 animate-pulse rounded-3xl bg-white" />
            <div className="h-40 animate-pulse rounded-3xl bg-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-50 px-8 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-emerald-700">Settings</p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
              Control how pulse works for you
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Manage your account, connected apps, sync behavior, pulse AI,
              approvals, appearance, and privacy controls.
            </p>
          </div>

          <div className="rounded-full border border-emerald-100 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
            {saving ? "Saving..." : "Saved"}
          </div>
        </header>

        <Section
          icon={<UserRound className="h-5 w-5" />}
          title="Account Settings"
          description="Your profile and signed-in account details."
        >
          <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <UserRound className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-950">
                {user?.fullName ?? "pulse user"}
              </p>

              <p className="truncate text-sm text-slate-500">{accountEmail}</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                Clerk authenticated
              </div>

              <SignOutButton>
                <button className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
                  Sign out
                </button>
              </SignOutButton>
            </div>
          </div>
        </Section>

        <Section
          icon={<KeyRound className="h-5 w-5" />}
          title="Connected Apps"
          description="Connect Gmail and Google Calendar through Corsair."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <ConnectedAppCard
              icon={<Mail className="h-5 w-5" />}
              title="Gmail"
              description="Read, analyze, summarize, and reply to real Gmail messages."
              href="/api/corsair/oauth/gmail/start"
              syncLabel="Sync Gmail"
              onSync={() => runSync("/api/gmail/sync")}
            />

            <ConnectedAppCard
              icon={<CalendarDays className="h-5 w-5" />}
              title="Google Calendar"
              description="Sync upcoming meetings and create approved calendar events."
              href="/api/corsair/oauth/calendar/start"
              syncLabel="Sync Calendar"
              onSync={() => runSync("/api/calendar/sync")}
            />
          </div>
        </Section>

        <Section
          icon={<RefreshCcw className="h-5 w-5" />}
          title="Sync Preferences"
          description="Control when pulse refreshes Gmail, Calendar, and Tasks."
        >
          <SettingToggle
            title="Auto-sync when pulse opens"
            description="Refresh Gmail, Calendar, and Tasks when the app loads."
            checked={settings.autoSyncOnOpen}
            onChange={(value) => updateSettings({ autoSyncOnOpen: value })}
          />

          <SettingToggle
            title="Sync when tab is focused"
            description="Refresh data when you return to the pulse browser tab."
            checked={settings.syncOnTabFocus}
            onChange={(value) => updateSettings({ syncOnTabFocus: value })}
          />

          <SettingToggle
            title="Sync every 60 seconds"
            description="Keep inbox, meetings, calendar, and tasks updated during demo/local use."
            checked={settings.syncEveryMinute}
            onChange={(value) => updateSettings({ syncEveryMinute: value })}
          />

          <SettingToggle
            title="Analyze Gmail after sync"
            description="Allow OpenAI to analyze recent synced emails for useful actions."
            checked={settings.analyzeGmailAfterSync}
            onChange={(value) =>
              updateSettings({ analyzeGmailAfterSync: value })
            }
          />

          <SettingToggle
            title="Extract tasks automatically"
            description="Create task suggestions from forms, interviews, assessments, deadlines, and follow-ups."
            checked={settings.extractTasksAutomatically}
            onChange={(value) =>
              updateSettings({ extractTasksAutomatically: value })
            }
          />

          <div className="pt-3">
            <button
              onClick={() => runSync("/api/realtime/sync")}
              className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-800"
            >
              Run full sync now
            </button>
          </div>
        </Section>

        <Section
          icon={<Sparkles className="h-5 w-5" />}
          title="pulse AI Preferences"
          description="Choose how pulse AI writes, summarizes, and suggests actions."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              label="Default reply tone"
              value={settings.defaultReplyTone}
              onChange={(value) => updateSettings({ defaultReplyTone: value })}
              options={[
                { label: "Professional", value: "PROFESSIONAL" },
                { label: "Friendly", value: "FRIENDLY" },
                { label: "Short", value: "SHORT" },
                { label: "Detailed", value: "DETAILED" },
              ]}
            />

            <SelectField
              label="Default summary style"
              value={settings.defaultSummaryStyle}
              onChange={(value) =>
                updateSettings({ defaultSummaryStyle: value })
              }
              options={[
                { label: "Brief", value: "BRIEF" },
                { label: "Detailed", value: "DETAILED" },
                { label: "Action-focused", value: "ACTION_FOCUSED" },
              ]}
            />
          </div>

          <div className="mt-4 grid gap-3">
            <SettingToggle
              title="Allow email summaries"
              description="pulse AI can summarize selected emails."
              checked={settings.allowEmailSummaries}
              onChange={(value) =>
                updateSettings({ allowEmailSummaries: value })
              }
            />

            <SettingToggle
              title="Allow reply drafts"
              description="pulse AI can generate reply drafts, but not send without approval."
              checked={settings.allowReplyDrafts}
              onChange={(value) => updateSettings({ allowReplyDrafts: value })}
            />

            <SettingToggle
              title="Allow task extraction"
              description="pulse AI can detect tasks from Gmail."
              checked={settings.allowTaskExtraction}
              onChange={(value) =>
                updateSettings({ allowTaskExtraction: value })
              }
            />

            <SettingToggle
              title="Allow meeting notes"
              description="pulse AI can prepare agendas, MoM, and meeting prep notes."
              checked={settings.allowMeetingNotes}
              onChange={(value) =>
                updateSettings({ allowMeetingNotes: value })
              }
            />

            <SettingToggle
              title="Allow calendar suggestions"
              description="pulse AI can suggest calendar events from emails and tasks."
              checked={settings.allowCalendarSuggestions}
              onChange={(value) =>
                updateSettings({ allowCalendarSuggestions: value })
              }
            />
          </div>
        </Section>

        <Section
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Approvals & Safety"
          description="Keep real Gmail and Calendar actions user-approved."
        >
          <SettingToggle
            title="Require approval before sending email"
            description="pulse can draft replies, but sending must be approved by you."
            checked={settings.requireEmailApproval}
            disabled
            onChange={() => undefined}
          />

          <SettingToggle
            title="Require approval before creating calendar events"
            description="pulse can prepare meetings, but creation must be approved by you."
            checked={settings.requireCalendarApproval}
            disabled
            onChange={() => undefined}
          />

          <SettingToggle
            title="Show confirmation before external actions"
            description="Show a confirmation before Gmail, Calendar, or workflow actions."
            checked={settings.requireExternalConfirmation}
            onChange={(value) =>
              updateSettings({ requireExternalConfirmation: value })
            }
          />

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
            <div className="flex items-start gap-3">
              <Lock className="mt-0.5 h-4 w-4" />

              <p>
                Email sending and calendar creation stay approval-based to keep
                pulse safe and audit-friendly.
              </p>
            </div>
          </div>
        </Section>

        <Section
          icon={<Sun className="h-5 w-5" />}
          title="Appearance"
          description="Choose how pulse looks on your device."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <AppearanceOption
              icon={<Sun className="h-5 w-5" />}
              title="Light mode"
              description="Clean white and emerald interface."
              active={appearance === "light"}
              onClick={() => applyAppearance("light")}
            />

            <AppearanceOption
              icon={<Moon className="h-5 w-5" />}
              title="Dark mode"
              description="Use dark surfaces for low-light work."
              active={appearance === "dark"}
              onClick={() => applyAppearance("dark")}
            />
          </div>

          <p className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            Light mode is already complete. Dark mode preference is now saved,
            and next we will apply the actual dark theme styles across the app.
          </p>
        </Section>

        <Section
          icon={<Trash2 className="h-5 w-5" />}
          title="Privacy & Data"
          description="Manage synced data and connected account access."
        >
          <div className="grid gap-3 md:grid-cols-2">
            <DangerAction
              icon={<Trash2 className="h-4 w-4" />}
              title="Clear synced Gmail data"
              description="Remove locally stored Gmail messages from pulse."
            />

            <DangerAction
              icon={<Trash2 className="h-4 w-4" />}
              title="Clear synced Calendar data"
              description="Remove locally stored Calendar events from pulse."
            />

            <DangerAction
              icon={<Download className="h-4 w-4" />}
              title="Export my data"
              description="Download your local pulse data."
            />

            <DangerAction
              icon={<Lock className="h-4 w-4" />}
              title="Revoke connected access"
              description="Disconnect Gmail or Calendar access from pulse."
            />
          </div>

          <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            pulse only performs Gmail and Calendar actions after your approval.
            Generated replies, tasks, and meetings are designed to stay
            reviewable before external action.
          </p>
        </Section>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          {icon}
        </div>

        <div>
          <h2 className="text-base font-semibold text-slate-950">{title}</h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            {description}
          </p>
        </div>
      </div>

      <div className="space-y-3">{children}</div>
    </section>
  );
}

function SettingToggle({
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-4">
      <div>
        <p className="text-sm font-medium text-slate-950">{title}</p>

        <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={[
          "relative h-6 w-11 rounded-full transition",
          checked ? "bg-emerald-700" : "bg-slate-300",
          disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-1 h-4 w-4 rounded-full bg-white transition",
            checked ? "left-6" : "left-1",
          ].join(" ")}
        />
      </button>
    </div>
  );
}

function ConnectedAppCard({
  icon,
  title,
  description,
  href,
  syncLabel,
  onSync,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  href: string;
  syncLabel: string;
  onSync: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
          {icon}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-950">{title}</h3>

          <p className="mt-1 text-sm leading-5 text-slate-500">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={href}
          className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800"
        >
          Connect / reconnect
        </a>

        <button
          type="button"
          onClick={onSync}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          {syncLabel}
        </button>
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function AppearanceOption({
  icon,
  title,
  description,
  active,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex items-start gap-3 rounded-2xl border p-4 text-left transition",
        active
          ? "border-emerald-200 bg-emerald-50"
          : "border-slate-100 bg-slate-50 hover:border-emerald-100 hover:bg-white",
      ].join(" ")}
    >
      <div
        className={[
          "flex h-10 w-10 items-center justify-center rounded-2xl shadow-sm",
          active ? "bg-emerald-700 text-white" : "bg-white text-slate-600",
        ].join(" ")}
      >
        {icon}
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-950">{title}</p>

        <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
      </div>
    </button>
  );
}

function DangerAction({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left transition hover:border-rose-200 hover:bg-rose-50"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm">
        {icon}
      </div>

      <div>
        <p className="text-sm font-medium text-slate-950">{title}</p>

        <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
      </div>
    </button>
  );
}