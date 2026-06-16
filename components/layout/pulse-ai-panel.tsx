import { Bot, FileText, Lock, Send, Sparkles, Zap } from "lucide-react";
import { PulseMark } from "@/components/ui/pulse-logo";

export function PulseAiPanel() {
  return (
    <aside className="flex h-screen w-[20%] min-w-[300px] flex-col overflow-hidden border-l border-slate-200 bg-white">
      <div className="flex h-20 items-center justify-between border-b border-slate-200 px-6">
        <div className="flex items-center gap-3">
          <PulseMark size="sm" />
          <h2 className="text-lg font-semibold text-slate-950">pulse ai</h2>
        </div>

        <button className="rounded-full p-2 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700">
          <Bot className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-950">
              Today&apos;s Brief
            </h3>
          </div>

          <p className="text-sm leading-6 text-slate-600">
            You have 2 meetings today, 8 pending actions, and 5 follow-ups due
            this week. Acme Corp is your most important client context today.
          </p>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <Send className="h-4 w-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-950">Ask Pulse</h3>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <textarea
              className="min-h-20 w-full resize-none border-none bg-transparent text-sm outline-none placeholder:text-slate-400"
              placeholder="Ask anything about your clients, meetings, or emails..."
            />
            <div className="flex justify-end">
              <button className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800">
                Ask
              </button>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-950">
              Client Snapshot
            </h3>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold text-slate-950">Acme Corp</p>
              <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">
                Strategic
              </span>
            </div>

            <div className="space-y-2 text-sm text-slate-600">
              <p>Contact: Sarah Chen</p>
              <p>Open items: 3</p>
              <p>Next meeting: Tomorrow, 10:00 AM</p>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-950">
              Recommended Actions
            </h3>
          </div>

          <div className="space-y-2">
            <button className="w-full rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800">
              Prepare for Acme meeting
            </button>
            <button className="w-full rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800">
              Review open items
            </button>
            <button className="w-full rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800">
              Draft QBR recap
            </button>
          </div>
        </section>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex gap-3">
            <Lock className="mt-0.5 h-4 w-4 text-slate-500" />
            <p className="text-xs leading-5 text-slate-500">
              pulse securely uses your Gmail and Calendar data. Your data is
              private and never shared.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
