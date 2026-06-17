"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ElementType } from "react";
import {
  ArrowLeft,
  Bot,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  Clock,
  FileText,
  Inbox,
  Loader2,
  Mail,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PulseMark } from "@/components/ui/pulse-logo";

type TaskItem = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  priority: string;
  status: string;
  dueAt: string | null;
  source: string;
  sourceEmailId: string | null;
  sourceEmailSubject: string | null;
  sourceEmailFrom: string | null;
  metadata: unknown;
  createdAt: string;
  updatedAt: string;
};

type FilterKey = "ALL" | "TODAY" | "PRIORITY" | "COMPLETED" | "REMAINING";

type AiTrigger = {
  id: number;
  command: string;
};

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "TODAY", label: "Today" },
  { key: "PRIORITY", label: "Priority" },
  { key: "COMPLETED", label: "Completed" },
  { key: "REMAINING", label: "Remaining" },
];

const TASK_TYPES = [
  "GENERAL",
  "FORM",
  "ASSESSMENT",
  "INTERVIEW",
  "MEETING",
  "FOLLOW_UP",
  "PLACEMENT",
];

function formatDateTime(value?: string | null) {
  if (!value) return "No deadline";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDate(value?: string | null) {
  if (!value) return "No deadline";

  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

function isToday(value?: string | null) {
  if (!value) return false;
  return new Date(value).toDateString() === new Date().toDateString();
}

function isOverdue(value?: string | null) {
  if (!value) return false;
  return new Date(value).getTime() < Date.now();
}

function getPriorityClass(priority: string) {
  if (priority === "HIGH") return "bg-rose-50 text-rose-700 ring-rose-200";
  if (priority === "MEDIUM") return "bg-amber-50 text-amber-700 ring-amber-200";
  return "bg-emerald-50 text-emerald-700 ring-emerald-200";
}

function getStatusClass(status: string) {
  if (status === "DONE") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  if (status === "IN_PROGRESS") {
    return "bg-blue-50 text-blue-700 ring-blue-200";
  }

  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function getTypeIcon(type: string): ElementType {
  if (type === "ASSESSMENT") return FileText;
  if (type === "INTERVIEW") return UserRound;
  if (type === "MEETING") return CalendarClock;
  if (type === "FORM") return ClipboardList;
  if (type === "PLACEMENT") return Inbox;
  if (type === "FOLLOW_UP") return Mail;
  return CheckCircle2;
}

function getMetadataValue(metadata: unknown, key: string) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return "";
  }

  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
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

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const [activeFilter, setActiveFilter] = useState<FilterKey>("ALL");

  const [isLoading, setIsLoading] = useState(true);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [pageError, setPageError] = useState<string | null>(null);
  const [pageSuccess, setPageSuccess] = useState<string | null>(null);

  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiTrigger, setAiTrigger] = useState<AiTrigger | null>(null);

  const [showManualForm, setShowManualForm] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [manualType, setManualType] = useState("GENERAL");
  const [manualPriority, setManualPriority] = useState("MEDIUM");
  const [manualDueAt, setManualDueAt] = useState("");

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) || null,
    [tasks, selectedTaskId]
  );

  const loadTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      setPageError(null);

      const response = await fetch("/api/tasks", {
        method: "GET",
        cache: "no-store",
      });

      const data = await readJson(response);

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to load tasks.");
      }

      setTasks(data.tasks || []);
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Failed to load tasks."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    function handleAutoSyncComplete() {
      void loadTasks();
    }

    const intervalId = window.setInterval(() => {
      void loadTasks();
    }, 30000);

    window.addEventListener("pulse:auto-sync-complete", handleAutoSyncComplete);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener(
        "pulse:auto-sync-complete",
        handleAutoSyncComplete
      );
    };
  }, [loadTasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (activeFilter === "TODAY") return isToday(task.dueAt);
      if (activeFilter === "PRIORITY") return task.priority === "HIGH";
      if (activeFilter === "COMPLETED") return task.status === "DONE";
      if (activeFilter === "REMAINING") return task.status !== "DONE";

      return true;
    });
  }, [tasks, activeFilter]);

  async function handleExtractFromEmails() {
    try {
      setIsExtracting(true);
      setPageError(null);
      setPageSuccess(null);

      const response = await fetch("/api/tasks/extract-from-emails", {
        method: "POST",
      });

      const data = await readJson(response);

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to analyze Gmail for tasks.");
      }

      setPageSuccess(
        `Analyzed ${data.scanned || 0} emails. Created ${
          data.created || 0
        } new task(s).`
      );

      await loadTasks();
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Failed to analyze Gmail for tasks."
      );
    } finally {
      setIsExtracting(false);
    }
  }

  async function handleCreateManualTask() {
    try {
      setIsCreating(true);
      setPageError(null);
      setPageSuccess(null);

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: manualTitle,
          description: manualDescription,
          type: manualType,
          priority: manualPriority,
          dueAt: manualDueAt ? new Date(manualDueAt).toISOString() : null,
        }),
      });

      const data = await readJson(response);

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to create task.");
      }

      setManualTitle("");
      setManualDescription("");
      setManualType("GENERAL");
      setManualPriority("MEDIUM");
      setManualDueAt("");
      setShowManualForm(false);

      setPageSuccess("Task created successfully.");
      await loadTasks();
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Failed to create task."
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function updateTaskStatus(taskId: string, status: string) {
    try {
      setPageError(null);

      const response = await fetch("/api/tasks", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId,
          status,
        }),
      });

      const data = await readJson(response);

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to update task.");
      }

      await loadTasks();
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Failed to update task."
      );
    }
  }

  function triggerPulseAi(command: string) {
    setIsAiOpen(true);
    setAiTrigger({
      id: Date.now(),
      command,
    });
  }

  function handleBackToList() {
    setSelectedTaskId(null);
  }

  return (
    <AppShell
      showAiPanel={isAiOpen}
      showSearch={false}
      showHeader={false}
      rightPanel={
        isAiOpen ? (
          <TaskCopilotPanel
            selectedTask={selectedTask}
            tasks={tasks}
            trigger={aiTrigger}
            onClose={() => setIsAiOpen(false)}
          />
        ) : undefined
      }
    >
      <div className="flex h-full min-h-0 flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              Tasks
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Automatically track tasks from Gmail, assessments, forms,
              interviews, meetings, and manual actions.
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

            <button
              onClick={handleExtractFromEmails}
              disabled={isExtracting}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isExtracting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {isExtracting ? "Analyzing..." : "Analyze Gmail"}
            </button>

            <button
              onClick={() => {
                setSelectedTaskId(null);
                setShowManualForm((current) => !current);
              }}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
            >
              <Plus className="h-4 w-4" />
              New task
            </button>
          </div>
        </div>

        {pageError && (
          <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <CircleAlert className="h-4 w-4" />
            <span>{pageError}</span>
          </div>
        )}

        {pageSuccess && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            <span>{pageSuccess}</span>
          </div>
        )}

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {!selectedTask ? (
            <>
              <div className="shrink-0 border-b border-slate-200 bg-white p-5">
                <div className="flex flex-wrap gap-2">
                  {FILTERS.map((filter) => {
                    const active = activeFilter === filter.key;

                    return (
                      <button
                        key={filter.key}
                        onClick={() => setActiveFilter(filter.key)}
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

                {showManualForm && (
                  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <Plus className="h-4 w-4 text-emerald-700" />
                      <h2 className="text-sm font-semibold text-slate-950">
                        Add manual task
                      </h2>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <input
                        value={manualTitle}
                        onChange={(event) => setManualTitle(event.target.value)}
                        placeholder="Task title"
                        className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-emerald-300"
                      />

                      <input
                        type="datetime-local"
                        value={manualDueAt}
                        onChange={(event) => setManualDueAt(event.target.value)}
                        className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-emerald-300"
                      />

                      <select
                        value={manualType}
                        onChange={(event) => setManualType(event.target.value)}
                        className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-emerald-300"
                      >
                        {TASK_TYPES.map((type) => (
                          <option key={type}>{type}</option>
                        ))}
                      </select>

                      <select
                        value={manualPriority}
                        onChange={(event) =>
                          setManualPriority(event.target.value)
                        }
                        className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-emerald-300"
                      >
                        <option>HIGH</option>
                        <option>MEDIUM</option>
                        <option>LOW</option>
                      </select>

                      <textarea
                        value={manualDescription}
                        onChange={(event) =>
                          setManualDescription(event.target.value)
                        }
                        placeholder="Task description"
                        className="min-h-24 rounded-xl border border-slate-200 bg-white p-4 text-sm outline-none focus:border-emerald-300 md:col-span-2"
                      />

                      <div className="flex justify-end gap-3 md:col-span-2">
                        <button
                          onClick={() => setShowManualForm(false)}
                          className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Cancel
                        </button>

                        <button
                          onClick={handleCreateManualTask}
                          disabled={isCreating || !manualTitle.trim()}
                          className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isCreating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                          {isCreating ? "Creating..." : "Create task"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading tasks...
                  </div>
                ) : filteredTasks.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                    <ClipboardList className="mb-3 h-10 w-10 text-slate-300" />
                    <h3 className="text-sm font-semibold text-slate-950">
                      No tasks found
                    </h3>
                    <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
                      pulse will automatically create tasks from Gmail during
                      auto-sync. You can also add one manually.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredTasks.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        onClick={() => setSelectedTaskId(task.id)}
                        onAskAi={() => {
                          setSelectedTaskId(task.id);
                          triggerPulseAi(
                            "Explain this task properly. What do I need to do, what is the deadline, and what should be my next step?"
                          );
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <SelectedTaskWorkspace
              task={selectedTask}
              onBack={handleBackToList}
              onAskAi={() =>
                triggerPulseAi(
                  "Analyze this selected task properly and tell me what I should do next."
                )
              }
              onMarkProgress={() =>
                updateTaskStatus(selectedTask.id, "IN_PROGRESS")
              }
              onMarkDone={() => updateTaskStatus(selectedTask.id, "DONE")}
            />
          )}
        </section>
      </div>
    </AppShell>
  );
}

function TaskRow({
  task,
  onClick,
  onAskAi,
}: {
  task: TaskItem;
  onClick: () => void;
  onAskAi: () => void;
}) {
  const Icon = getTypeIcon(task.type);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      className="grid w-full cursor-pointer grid-cols-[42px_minmax(0,1fr)_120px_120px_130px] items-center gap-4 px-5 py-4 text-left transition hover:bg-emerald-50/50"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-bold text-slate-950">
            {task.title}
          </p>

          {isOverdue(task.dueAt) && task.status !== "DONE" && (
            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 ring-1 ring-rose-200">
              Overdue
            </span>
          )}
        </div>

        <p className="mt-1 truncate text-sm text-slate-500">
          {task.description || task.sourceEmailSubject || "No description"}
        </p>

        {task.sourceEmailFrom && (
          <p className="mt-1 truncate text-xs text-slate-400">
            From: {task.sourceEmailFrom}
          </p>
        )}
      </div>

      <span
        className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getPriorityClass(
          task.priority
        )}`}
      >
        {task.priority}
      </span>

      <span
        className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getStatusClass(
          task.status
        )}`}
      >
        {task.status.replace("_", " ")}
      </span>

      <div className="text-right">
        <p className="text-xs font-semibold text-slate-700">
          {formatDate(task.dueAt)}
        </p>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onAskAi();
          }}
          className="mt-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
        >
          Ask AI
        </button>
      </div>
    </div>
  );
}

function SelectedTaskWorkspace({
  task,
  onBack,
  onAskAi,
  onMarkProgress,
  onMarkDone,
}: {
  task: TaskItem;
  onBack: () => void;
  onAskAi: () => void;
  onMarkProgress: () => void;
  onMarkDone: () => void;
}) {
  const Icon = getTypeIcon(task.type);
  const detectedAction = getMetadataValue(task.metadata, "detectedAction");
  const confidence = getMetadataValue(task.metadata, "confidence");
  const relatedLink = getMetadataValue(task.metadata, "relatedLink");

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-6">
      <button
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to tasks
      </button>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
            <Icon className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              {task.title}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {task.type} · {task.source} · created{" "}
              {formatDateTime(task.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          <span
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${getPriorityClass(
              task.priority
            )}`}
          >
            {task.priority}
          </span>

          <span
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${getStatusClass(
              task.status
            )}`}
          >
            {task.status.replace("_", " ")}
          </span>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        {task.status !== "DONE" && (
          <>
            <button
              onClick={onMarkProgress}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <Clock className="h-4 w-4" />
              Mark in progress
            </button>

            <button
              onClick={onMarkDone}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
            >
              <CheckCircle2 className="h-4 w-4" />
              Mark completed
            </button>
          </>
        )}

        <button
          onClick={onAskAi}
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-100"
        >
          <Sparkles className="h-4 w-4" />
          Ask pulse AI
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <InfoBox label="Deadline" value={formatDateTime(task.dueAt)} />
        <InfoBox label="Source" value={task.source} />
        <InfoBox
          label="Source email"
          value={task.sourceEmailSubject || "No source email"}
        />
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Description
        </p>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
          {task.description || "No description available."}
        </p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <InfoBox
          label="Detected action"
          value={detectedAction || "Not available"}
        />
        <InfoBox label="AI confidence" value={confidence || "Not available"} />
      </div>

      {relatedLink && (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5">
          <p className="text-sm font-semibold text-slate-950">Related link</p>
          <a
            href={relatedLink}
            target="_blank"
            rel="noreferrer"
            className="mt-2 block break-all text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            {relatedLink}
          </a>
        </div>
      )}

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-semibold text-slate-950">
          Recommended next steps
        </p>

        <div className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
          {task.type === "ASSESSMENT" && (
            <>
              <p>• Open the assessment link or source email.</p>
              <p>
                • Check deadline, duration, allowed attempts, and required
                documents.
              </p>
              <p>• Complete it before the deadline and mark this task completed.</p>
            </>
          )}

          {task.type === "FORM" || task.type === "PLACEMENT" ? (
            <>
              <p>• Open the form or placement link.</p>
              <p>• Keep resume, academic details, and contact details ready.</p>
              <p>• Submit the form and mark this task completed.</p>
            </>
          ) : null}

          {task.type === "INTERVIEW" || task.type === "MEETING" ? (
            <>
              <p>• Check interview/meeting time and joining link.</p>
              <p>• Prepare notes, resume/project details, and questions.</p>
              <p>• Join on time and add follow-up after completion.</p>
            </>
          ) : null}

          {task.type === "GENERAL" ||
          task.type === "FOLLOW_UP" ||
          task.type === "EMAIL" ? (
            <>
              <p>• Review the source email context.</p>
              <p>• Decide whether reply, form submission, or follow-up is needed.</p>
              <p>• Complete the action and mark this task completed.</p>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function TaskCopilotPanel({
  selectedTask,
  tasks,
  trigger,
  onClose,
}: {
  selectedTask: TaskItem | null;
  tasks: TaskItem[];
  trigger: AiTrigger | null;
  onClose: () => void;
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

  function taskContext() {
    const selected = selectedTask
      ? `
Selected task:
Title: ${selectedTask.title}
Type: ${selectedTask.type}
Priority: ${selectedTask.priority}
Status: ${selectedTask.status}
Due: ${selectedTask.dueAt || "No deadline"}
Source: ${selectedTask.source}
Source email: ${selectedTask.sourceEmailSubject || "none"}
From: ${selectedTask.sourceEmailFrom || "none"}
Description: ${selectedTask.description || "none"}
Detected action: ${getMetadataValue(selectedTask.metadata, "detectedAction")}
Confidence: ${getMetadataValue(selectedTask.metadata, "confidence")}
Related link: ${getMetadataValue(selectedTask.metadata, "relatedLink")}
      `.trim()
      : "No task selected.";

    const openTasks = tasks
      .filter((task) => task.status !== "DONE")
      .slice(0, 20)
      .map(
        (task) =>
          `- ${task.title} | ${task.type} | ${task.priority} | due: ${
            task.dueAt || "none"
          } | source: ${task.source}`
      )
      .join("\n");

    return `
${selected}

Open tasks:
${openTasks || "No open tasks."}
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

    try {
      const response = await fetch("/api/pulse-ai/command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          command: `
You are pulse AI task copilot.

Answer using the actual task context below.
Do not give a predefined generic answer.
If it is an assessment, explain what type of assessment it seems to be, deadline, urgency, and next step.
If it is a Google Form or placement task, explain what needs to be filled and what details to keep ready.
If it is an interview or meeting task, explain preparation steps.
If the data is missing, say exactly what is missing.
Keep the answer practical and specific.

User question:
${cleanQuestion}

Task context:
${taskContext()}
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
            <p className="text-xs text-slate-500">Task copilot</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="task-ai-scroll min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
              <Bot className="h-5 w-5" />
            </div>

            <h3 className="text-sm font-semibold text-slate-950">
              Ask pulse AI
            </h3>

            <p className="mt-2 max-w-[230px] text-sm leading-6 text-slate-500">
              Ask about assessments, forms, interviews, meetings, deadlines, or
              next steps.
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
              placeholder="Ask about tasks..."
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
        .task-ai-scroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .task-ai-scroll::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }
      `}</style>
    </aside>
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