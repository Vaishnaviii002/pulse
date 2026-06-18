"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  CalendarDays,
  CalendarPlus,
  Inbox,
  Network,
  Settings,
  UsersRound,
} from "lucide-react";
import { PulseLogo } from "@/components/ui/pulse-logo";
import { useUser } from "@clerk/nextjs";

const navItems = [
  {
    label: "pulse AI",
    href: "/pulse-ai",
    icon: Bot,
  },
  {
    label: "Inbox",
    href: "/inbox",
    icon: Inbox,
  },
  {
    label: "Meetings",
    href: "/meetings",
    icon: UsersRound,
  },
  {
    label: "Calendar",
    href: "/calendar",
    icon: CalendarDays,
  },
  {
    label: "Tasks",
    href: "/workflow",
    icon: Network,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

function AppSidebar() {
  const pathname = usePathname();

  const { user } = useUser();

  const userName = user?.fullName || user?.firstName || "pulse user";
  const userEmail =
    user?.primaryEmailAddress?.emailAddress || "No email available";
  const userInitials = userName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="flex h-screen w-[15%] min-w-[220px] shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white px-5 py-6">
      <Link href="/pulse-ai" className="mb-6 block">
        <PulseLogo />
      </Link>

      <Link
        href="/calendar"
        className="mb-6 flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
      >
        <CalendarPlus className="h-4 w-4" />
        Welcome
      </Link>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;

          const active =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex h-12 items-center gap-3 rounded-xl px-4 text-sm font-medium transition",
                active
                  ? "bg-emerald-50 text-emerald-800"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
              ].join(" ")}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-slate-200 pt-6">
        <div className="flex items-center gap-3 rounded-xl p-3 transition hover:bg-slate-50">
          {user?.imageUrl ? (
            <img
              src={user.imageUrl}
              alt={userName}
              className="h-10 w-10 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-sm font-semibold text-white">
              {userInitials}
            </div>
          )}

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-950">
              {userName}
            </p>
            <p className="truncate text-xs text-slate-500">{userEmail}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export { AppSidebar };
export default AppSidebar;
