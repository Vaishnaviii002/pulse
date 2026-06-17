import AppSidebar from "@/components/layout/app-sidebar";
import { PulseAiPanel } from "@/components/layout/pulse-ai-panel";
import { TopHeader } from "@/components/layout/top-header";
import { SyncUser } from "@/components/auth/sync-user";
import { AutoRealtimeSync } from "@/components/auth/auto-realtime-sync";

type AppShellProps = {
  children: React.ReactNode;
  showAiPanel?: boolean;
  showSearch?: boolean;
  rightPanel?: React.ReactNode;
  showHeader?: boolean;
  shellClassName?: string;
  contentClassName?: string;
};

export function AppShell({
  children,
  showAiPanel = true,
  showSearch = true,
  rightPanel,
  showHeader = true,
  shellClassName = "",
  contentClassName = "",
}: AppShellProps) {
  return (
    <div
      className={[
        "flex h-screen overflow-hidden bg-slate-50 text-slate-950",
        shellClassName,
      ].join(" ")}
    >
      <SyncUser />
      <AutoRealtimeSync />

      <AppSidebar />

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {showHeader ? <TopHeader showSearch={showSearch} /> : null}

        <div
          className={[
            "flex-1 overflow-hidden px-8 py-7",
            contentClassName,
          ].join(" ")}
        >
          {children}
        </div>
      </main>

      {showAiPanel && (rightPanel ?? <PulseAiPanel />)}
    </div>
  );
}