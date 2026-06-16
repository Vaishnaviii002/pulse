"use client";

import { AppShell } from "@/components/layout/app-shell";
import {
  AlertCircle,
  Clock3,
  Inbox,
  Loader2,
  Mail,
  RefreshCcw,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type EmailMessage = {
  id: string;
  externalMessageId: string;
  subject: string;
  snippet: string;
  bodyText: string;
  fromEmail: string;
  fromName: string;
  toEmails: string[];
  ccEmails: string[];
  receivedAt: string;
  isUnread: boolean;
  labelIds: string[];
};

type EmailAnalysis = {
  summary: string;
  intent: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  sentiment: string;
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

function formatEmailDate(value: string) {
  const date = new Date(value);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

function formatFullDate(value: string) {
  return new Date(value).toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function InboxPage() {
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const selectedMessage =
    messages.find((message) => message.id === selectedId) || messages[0];

  const filteredMessages = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) return messages;

    return messages.filter((message) =>
      [
        message.subject,
        message.snippet,
        message.bodyText,
        message.fromEmail,
        message.fromName,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search)
    );
  }, [messages, query]);

  async function loadMessages() {
    const res = await fetch("/api/gmail/messages", {
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to load Gmail messages.");
    }

    const sorted = [...((data.messages || []) as EmailMessage[])].sort(
      (a, b) =>
        new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
    );

    setMessages(sorted);

    const stillExists = sorted.some((message) => message.id === selectedId);

    if (!stillExists) {
      setSelectedId(sorted[0]?.id || "");
    }
  }

  async function syncAndLoadMessages() {
    try {
      setSyncing(true);
      setError("");
      setStatusMessage("");

      const syncRes = await fetch("/api/gmail/sync", {
        method: "POST",
      });

      const syncData = await syncRes.json();

      if (!syncRes.ok) {
        throw new Error(syncData.error || "Gmail sync failed.");
      }

      await loadMessages();

      setStatusMessage(
        `Gmail synced successfully. ${syncData.saved || 0} emails saved.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gmail sync failed.");
    } finally {
      setSyncing(false);
      setLoading(false);
    }
  }

  useEffect(() => {
    async function initialLoad() {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams(window.location.search);
        const gmailStatus = params.get("gmail");
        const synced = params.get("synced");

        if (gmailStatus === "connected") {
          setStatusMessage(
            synced
              ? `Gmail connected successfully. ${synced} emails synced.`
              : "Gmail connected successfully."
          );
        }

        await loadMessages();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load saved emails."
        );
      } finally {
        setLoading(false);
      }
    }

    initialLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppShell showAiPanel={false} showSearch={false}>
      <div className="flex h-full flex-col overflow-hidden">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
              Inbox
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Real Gmail messages synced through Corsair. Newest emails appear
              first.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/api/corsair/oauth/gmail/start"
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Connect Gmail
            </a>

            <button
              onClick={syncAndLoadMessages}
              disabled={syncing}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {syncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4" />
              )}
              {syncing ? "Syncing..." : "Sync now"}
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            {statusMessage}
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">Gmail issue</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        )}

        <div className="grid min-h-0 flex-1 grid-cols-[340px_minmax(0,1fr)_360px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <section className="flex min-h-0 flex-col border-r border-slate-200">
            <div className="border-b border-slate-200 p-4">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search Gmail"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-500">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <p className="text-sm">Loading saved Gmail messages...</p>
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <Inbox className="h-6 w-6" />
                  </div>

                  <p className="font-semibold text-slate-950">
                    No Gmail messages found
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Connect Gmail first, then click Sync now.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredMessages.map((message) => {
                    const isSelected = message.id === selectedMessage?.id;

                    return (
                      <button
                        key={message.id}
                        onClick={() => setSelectedId(message.id)}
                        className={[
                          "w-full px-4 py-4 text-left transition",
                          isSelected
                            ? "bg-emerald-50"
                            : "bg-white hover:bg-slate-50",
                        ].join(" ")}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              {message.isUnread && (
                                <span className="h-2 w-2 rounded-full bg-emerald-700" />
                              )}

                              <p
                                className={[
                                  "truncate text-sm",
                                  message.isUnread
                                    ? "font-bold text-slate-950"
                                    : "font-semibold text-slate-800",
                                ].join(" ")}
                              >
                                {message.fromName ||
                                  message.fromEmail ||
                                  "Unknown sender"}
                              </p>
                            </div>

                            <p className="mt-1 truncate text-sm font-semibold text-slate-950">
                              {message.subject}
                            </p>

                            <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">
                              {message.snippet || message.bodyText}
                            </p>
                          </div>

                          <span className="shrink-0 text-xs font-medium text-slate-400">
                            {formatEmailDate(message.receivedAt)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <section className="min-h-0 overflow-y-auto border-r border-slate-200">
            {selectedMessage ? (
              <div className="p-6">
                <div className="mb-6 border-b border-slate-200 pb-6">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                      <Mail className="h-3.5 w-3.5" />
                      Gmail
                    </span>

                    <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
                      <Clock3 className="h-3.5 w-3.5" />
                      {formatFullDate(selectedMessage.receivedAt)}
                    </span>
                  </div>

                  <h2 className="text-2xl font-semibold leading-8 text-slate-950">
                    {selectedMessage.subject}
                  </h2>

                  <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-950">
                      {selectedMessage.fromName ||
                        selectedMessage.fromEmail ||
                        "Unknown sender"}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      From: {selectedMessage.fromEmail}
                    </p>

                    {selectedMessage.toEmails?.length > 0 && (
                      <p className="mt-1 text-sm text-slate-500">
                        To: {selectedMessage.toEmails.join(", ")}
                      </p>
                    )}
                  </div>
                </div>

                <article className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {selectedMessage.bodyText ||
                    selectedMessage.snippet ||
                    "No readable body found for this email."}
                </article>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                  <Mail className="h-6 w-6" />
                </div>

                <p className="font-semibold text-slate-950">
                  Select an email
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Click a Gmail message from the left side to open it here.
                </p>
              </div>
            )}
          </section>

          <InboxAssistantPanel selectedMessage={selectedMessage} />
        </div>
      </div>
    </AppShell>
  );
}

function InboxAssistantPanel({
  selectedMessage,
}: {
  selectedMessage?: EmailMessage;
}) {
  const [analysis, setAnalysis] = useState<EmailAnalysis | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  useEffect(() => {
    async function analyzeEmail() {
      if (!selectedMessage?.id) {
        setAnalysis(null);
        return;
      }

      try {
        setLoadingAnalysis(true);
        setAnalysisError("");
        setAnalysis(null);

        const res = await fetch("/api/ai/email/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messageId: selectedMessage.id,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "AI analysis failed");
        }

        setAnalysis(data.analysis);
      } catch (error) {
        setAnalysisError(
          error instanceof Error ? error.message : "AI analysis failed"
        );
      } finally {
        setLoadingAnalysis(false);
      }
    }

    analyzeEmail();
  }, [selectedMessage?.id]);

  return (
    <aside className="flex min-h-0 flex-col overflow-hidden bg-slate-50">
      <div className="border-b border-slate-200 bg-white p-5">
        <p className="text-sm font-semibold text-slate-950">pulse AI</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Real AI analysis for the selected Gmail message.
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {!selectedMessage ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-950">
              No email selected
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Select a Gmail message to analyze it with pulse AI.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Selected email
              </p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-950">
                {selectedMessage.subject}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                From{" "}
                {selectedMessage.fromName ||
                  selectedMessage.fromEmail ||
                  "Unknown sender"}
              </p>
            </div>

            {loadingAnalysis && (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-900">
                  Analyzing email...
                </p>
                <p className="mt-2 text-sm leading-6 text-emerald-800">
                  pulse AI is reading this Gmail and preparing workflow
                  suggestions.
                </p>
              </div>
            )}

            {analysisError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-700">
                  AI analysis failed
                </p>
                <p className="mt-2 text-sm leading-6 text-red-600">
                  {analysisError}
                </p>
              </div>
            )}

            {analysis && (
              <>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-950">
                    Summary
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {analysis.summary}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Intent
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">
                      {analysis.intent.replaceAll("_", " ")}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Priority
                    </p>
                    <p
                      className={[
                        "mt-2 text-sm font-semibold",
                        analysis.priority === "HIGH"
                          ? "text-red-600"
                          : analysis.priority === "MEDIUM"
                            ? "text-amber-600"
                            : "text-emerald-700",
                      ].join(" ")}
                    >
                      {analysis.priority}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-950">
                    Workflow signals
                  </p>

                  <div className="mt-3 space-y-2">
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
                </div>

                {analysis.nextActions.length > 0 && (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                    <p className="text-sm font-semibold text-emerald-900">
                      Suggested actions
                    </p>

                    <div className="mt-3 space-y-2">
                      {analysis.nextActions.map((action) => (
                        <div
                          key={action}
                          className="rounded-xl bg-white px-3 py-2 text-sm font-medium leading-6 text-slate-700 shadow-sm"
                        >
                          {action}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.suggestedReply && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-950">
                      Reply preview
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                      {analysis.suggestedReply}
                    </p>

                    <button className="mt-4 w-full rounded-xl bg-emerald-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800">
                      Use this reply
                    </button>
                  </div>
                )}

                {analysis.meeting.shouldCreate && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-950">
                      Meeting detected
                    </p>

                    <div className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                      <p>
                        <span className="font-semibold text-slate-800">
                          Title:
                        </span>{" "}
                        {analysis.meeting.title || "Not specified"}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-800">
                          Date:
                        </span>{" "}
                        {analysis.meeting.dateText || "Not specified"}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-800">
                          Time:
                        </span>{" "}
                        {analysis.meeting.timeText || "Not specified"}
                      </p>
                    </div>

                    <button className="mt-4 w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50">
                      Prepare calendar invite
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

function SignalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-sm font-semibold text-slate-950">{value}</span>
    </div>
  );
}