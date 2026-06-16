"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Inbox,
  Loader2,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PulseMark } from "@/components/ui/pulse-logo";

type WorkflowStatus = "DETECTED" | "SUGGESTED" | "PENDING" | "APPROVED" | "COMPLETED" | "FAILED" | string;

type WorkflowAction = {
  id: string;
  type: string;
  status: string;
  title: string;
  description: string | null;
  payload: unknown;
  result: unknown;
  preparedAt: string | null;
  approvedAt: string | null;
  executedAt: string | null;
  failedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type AuditLog = {
  id: string;
  event: string;
  description: string | null;
  metadata: unknown;
  createdAt: string;
};

type Workflow = {
  id: string;
  type: string;
  status: WorkflowStatus;
  title: string;
  summary: string | null;
  nextStep: string | null;
  contactName: string | null;
  contactEmail: string | null;
  dueAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  emailMessage?: {
    id: string;
    subject: string;
    fromEmail: string;
    fromName: string | null;
    snippet: string | null;
  } | null;
  emailThread?: {
    id: string;
    subject: string;
    externalThreadId: string;
  } | null;
  calendarEvent?: {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
  } | null;
  actions: WorkflowAction[];
  auditLogs: AuditLog[];
};

type WorkflowStats = {
  total: number;
  completed: number;
  pending: number;
  failed: number;
};

type FilterKey = "ALL" | "PENDING" | "COMPLETED" | "FAILED";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "COMPLETED", label: "Completed" },
  { key: "FAILED", label: "Failed" },
];

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getStatusTone(status: string) {
  if (status === "COMPLETED") {
    return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  }

  if (status === "FAILED") {
    return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
  }

  if (status === "APPROVED") {
    return "bg-blue-50 text-blue-700 ring-1 ring-blue-200";
  }

  return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
}

function getWorkflowIcon(type: string) {
  if (type.includes("EMAIL")) return Send;
  if (type.includes("MEETING") || type.includes("CALENDAR")) return Calendar;
  return Sparkles;
}

function isPendingStatus(status: string) {
  return ["DETECTED", "SUGGESTED", "PENDING", "APPROVED"].includes(status);
}

export default function WorkflowPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [stats, setStats] = useState<WorkflowStats>({
    total: 0,
    completed: 0,
    pending: 0,
    failed: 0,
  });

  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(
    null
  );
  const [activeFilter, setActiveFilter] = useState<FilterKey>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const selectedWorkflow = useMemo(
    () =>
      workflows.find((workflow) => workflow.id === selectedWorkflowId) || null,
    [workflows, selectedWorkflowId]
  );

  const loadWorkflows = useCallback(async ({ refreshing = false } = {}) => {
    try {
      setPageError(null);

      if (refreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const response = await fetch("/api/workflows", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to load workflows.");
      }

      const nextWorkflows = (data.workflows || []) as Workflow[];

      setWorkflows(nextWorkflows);
      setStats(data.stats || { total: 0, completed: 0, pending: 0, failed: 0 });

      setSelectedWorkflowId((current) => {
        if (
          current &&
          nextWorkflows.some((workflow) => workflow.id === current)
        ) {
          return current;
        }

        return nextWorkflows[0]?.id || null;
      });
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Failed to load workflows."
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows]);

  const filteredWorkflows = useMemo(() => {
    return workflows.filter((workflow) => {
      if (activeFilter === "ALL") return true;
      if (activeFilter === "PENDING") return isPendingStatus(workflow.status);
      return workflow.status === activeFilter;
    });
  }, [workflows, activeFilter]);

  useEffect(() => {
    if (!filteredWorkflows.length) return;

    const exists = filteredWorkflows.some(
      (workflow) => workflow.id === selectedWorkflowId
    );

    if (!exists) {
      setSelectedWorkflowId(filteredWorkflows[0].id);
    }
  }, [filteredWorkflows, selectedWorkflowId]);

  return (
    <AppShell
      showAiPanel
      showSearch={false}
      rightPanel={<WorkflowAssistantPanel selectedWorkflow={selectedWorkflow} />}
    >
      <div className="flex h-full min-h-0 flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              Workflow
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Track approved actions, completed replies, failed runs, and audit history.
            </p>
          </div>

          <button
            onClick={() => loadWorkflows({ refreshing: true })}
            disabled={isRefreshing}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {pageError && (
          <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <AlertCircle className="h-4 w-4" />
            <span>{pageError}</span>
          </div>
        )}

        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Total workflows" value={stats.total} icon={FileText} />
          <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} />
          <StatCard label="Pending" value={stats.pending} icon={Clock} />
          <StatCard label="Failed" value={stats.failed} icon={XCircle} />
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[380px_minmax(0,1fr)] gap-5">
          <section className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-4">
              <div className="flex flex-wrap gap-2">
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
              {isLoading ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading workflows...
                </div>
              ) : filteredWorkflows.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                  <ShieldCheck className="mb-3 h-8 w-8 text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-900">
                    No workflows yet
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Send an approved Gmail reply from Inbox to create your first workflow.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredWorkflows.map((workflow) => {
                    const active = selectedWorkflowId === workflow.id;
                    const Icon = getWorkflowIcon(workflow.type);

                    return (
                      <button
                        key={workflow.id}
                        onClick={() => setSelectedWorkflowId(workflow.id)}
                        className={`w-full rounded-2xl border p-4 text-left transition ${
                          active
                            ? "border-emerald-200 bg-emerald-50/70 shadow-sm"
                            : "border-transparent bg-white hover:border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className="mb-3 flex items-start gap-3">
                          <div className="rounded-xl bg-slate-100 p-2 text-slate-600">
                            <Icon className="h-4 w-4" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-950">
                              {workflow.title}
                            </p>
                            <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-600">
                              {workflow.summary || workflow.nextStep || "No summary available."}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusTone(
                              workflow.status
                            )}`}
                          >
                            {workflow.status}
                          </span>

                          <span className="text-xs font-medium text-slate-500">
                            {formatDateTime(workflow.updatedAt)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <section className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            {!selectedWorkflow ? (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <ShieldCheck className="mb-4 h-10 w-10 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-950">
                  Select a workflow
                </h3>
                <p className="mt-1 max-w-md text-sm text-slate-500">
                  Choose a workflow to inspect the approved action and audit trail.
                </p>
              </div>
            ) : (
              <>
                <div className="border-b border-slate-200 px-6 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="mb-3 flex items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusTone(
                            selectedWorkflow.status
                          )}`}
                        >
                          {selectedWorkflow.status}
                        </span>

                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                          {selectedWorkflow.type.replaceAll("_", " ")}
                        </span>
                      </div>

                      <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                        {selectedWorkflow.title}
                      </h2>

                      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                        {selectedWorkflow.summary || "No workflow summary available."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                  <div className="grid gap-5">
                    <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                      <h3 className="text-sm font-semibold text-slate-950">
                        Source context
                      </h3>

                      <div className="mt-4 grid gap-3">
                        <DetailRow
                          label="Contact"
                          value={
                            selectedWorkflow.contactName ||
                            selectedWorkflow.contactEmail ||
                            "—"
                          }
                        />
                        <DetailRow
                          label="Email"
                          value={selectedWorkflow.contactEmail || "—"}
                        />
                        <DetailRow
                          label="Source subject"
                          value={
                            selectedWorkflow.emailMessage?.subject ||
                            selectedWorkflow.emailThread?.subject ||
                            "—"
                          }
                        />
                        <DetailRow
                          label="Created"
                          value={formatDateTime(selectedWorkflow.createdAt)}
                        />
                        <DetailRow
                          label="Completed"
                          value={formatDateTime(selectedWorkflow.completedAt)}
                        />
                      </div>
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-5">
                      <h3 className="text-sm font-semibold text-slate-950">
                        Actions
                      </h3>

                      <div className="mt-4 space-y-3">
                        {selectedWorkflow.actions.length ? (
                          selectedWorkflow.actions.map((action) => (
                            <div
                              key={action.id}
                              className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-slate-950">
                                    {action.title}
                                  </p>
                                  <p className="mt-1 text-sm text-slate-600">
                                    {action.description || action.type}
                                  </p>
                                </div>

                                <span
                                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusTone(
                                    action.status
                                  )}`}
                                >
                                  {action.status}
                                </span>
                              </div>

                              <div className="mt-4 grid gap-2">
                                <DetailRow
                                  label="Prepared"
                                  value={formatDateTime(action.preparedAt)}
                                />
                                <DetailRow
                                  label="Approved"
                                  value={formatDateTime(action.approvedAt)}
                                />
                                <DetailRow
                                  label="Executed"
                                  value={formatDateTime(action.executedAt)}
                                />
                                <DetailRow
                                  label="Failed"
                                  value={formatDateTime(action.failedAt)}
                                />
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                            No actions found for this workflow.
                          </p>
                        )}
                      </div>
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-5">
                      <h3 className="text-sm font-semibold text-slate-950">
                        Audit trail
                      </h3>

                      <div className="mt-4 space-y-3">
                        {selectedWorkflow.auditLogs.length ? (
                          selectedWorkflow.auditLogs.map((log) => (
                            <div
                              key={log.id}
                              className="flex gap-3 rounded-2xl bg-slate-50 px-4 py-3"
                            >
                              <div className="mt-1 h-2 w-2 rounded-full bg-emerald-600" />
                              <div>
                                <p className="text-sm font-semibold text-slate-950">
                                  {log.event.replaceAll("_", " ")}
                                </p>
                                <p className="mt-1 text-sm text-slate-600">
                                  {log.description || "No description."}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {formatDateTime(log.createdAt)}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                            No audit events found.
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

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
        </div>

        <div className="rounded-xl bg-emerald-50 p-2 text-emerald-700">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl bg-white px-4 py-3 text-sm ring-1 ring-slate-200">
      <span className="text-slate-500">{label}</span>
      <span className="max-w-[65%] text-right font-medium text-slate-900">
        {value}
      </span>
    </div>
  );
}

function WorkflowAssistantPanel({
  selectedWorkflow,
}: {
  selectedWorkflow: Workflow | null;
}) {
  return (
    <aside className="flex h-screen w-[20%] min-w-[300px] max-w-[360px] flex-col overflow-hidden border-l border-slate-200 bg-white">
      <div className="flex h-20 items-center justify-between border-b border-slate-200 px-6">
        <div className="flex items-center gap-3">
          <PulseMark size="sm" />
          <div>
            <h2 className="text-lg font-semibold text-slate-950">pulse AI</h2>
            <p className="text-xs text-slate-500">Workflow context</p>
          </div>
        </div>

        <div className="rounded-full bg-emerald-50 p-2 text-emerald-700">
          <ShieldCheck className="h-4 w-4" />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        {!selectedWorkflow ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <ShieldCheck className="mb-3 h-8 w-8 text-slate-300" />
            <h3 className="text-sm font-semibold text-slate-950">
              No workflow selected
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Select a workflow to view action context.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Current workflow
              </p>
              <h3 className="mt-2 text-base font-semibold text-slate-950">
                {selectedWorkflow.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {selectedWorkflow.summary || "No summary available."}
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-950">
                Execution status
              </h3>

              <div className="mt-4 space-y-2">
                <PanelRow label="Status" value={selectedWorkflow.status} />
                <PanelRow label="Type" value={selectedWorkflow.type} />
                <PanelRow
                  label="Actions"
                  value={String(selectedWorkflow.actions.length)}
                />
                <PanelRow
                  label="Audit logs"
                  value={String(selectedWorkflow.auditLogs.length)}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-700" />
                <p className="text-sm leading-6 text-emerald-800">
                  Every action shown here was user-approved before execution.
                  This keeps pulse safe, auditable, and production-ready.
                </p>
              </div>
            </section>
          </div>
        )}
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