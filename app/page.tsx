import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PulseMark } from "@/components/ui/pulse-logo";

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/pulse-ai");
  }

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <PulseMark size="sm" />
          <span className="text-2xl font-semibold tracking-tight">pulse</span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Sign in
          </Link>

          <Link
            href="/sign-up"
            className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
          >
            Get started
          </Link>
        </div>
      </nav>

      <section className="mx-auto flex max-w-5xl flex-col items-center px-6 py-28 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
          <PulseMark size="lg" />
        </div>

        <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-slate-950 md:text-6xl">
          AI workflow command center for Gmail and Calendar.
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
          pulse helps you summarize emails, generate replies, find meetings,
          create calendar events, review audits, and prepare daily briefs with
          approval-based actions.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/sign-up"
            className="rounded-2xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
          >
            Start using pulse
          </Link>

          <Link
            href="/sign-in"
            className="rounded-2xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Sign in
          </Link>
        </div>
      </section>
    </main>
  );
}