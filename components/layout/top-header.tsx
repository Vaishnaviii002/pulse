"use client";

import { Bell, ChevronDown, Search } from "lucide-react";
import { useUser } from "@clerk/nextjs";

type TopHeaderProps = {
  showSearch?: boolean;
};

export function TopHeader({ showSearch = true }: TopHeaderProps) {
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
    <header className="flex h-20 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8">
      <div className="flex-1">
        {showSearch && (
          <div className="w-full max-w-xl">
            <div className="flex h-11 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 shadow-sm">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                className="w-full border-none bg-transparent text-sm outline-none placeholder:text-slate-400"
                placeholder="Search clients, meetings, emails..."
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-5">
        <button className="relative rounded-full p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-700 text-[10px] font-semibold text-white">
            3
          </span>
        </button>

        <div className="flex items-center gap-3">
          {user?.imageUrl ? (
            <img
              src={user.imageUrl}
              alt={userName}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
              {userInitials}
            </div>
          )}

          <div className="hidden leading-tight lg:block">
            <p className="text-sm font-semibold text-slate-950">{userName}</p>
            <p className="text-xs text-slate-500">{userEmail}</p>
          </div>

          <ChevronDown className="h-4 w-4 text-slate-400" />
        </div>
      </div>
    </header>
  );
}