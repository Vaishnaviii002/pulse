import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncLatestGmailForUser } from "@/lib/gmail-sync";
import { syncLatestCalendarForUser } from "@/lib/calendar-sync";
import { extractTasksFromRecentEmails } from "@/lib/task-extraction";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ConnectedAccountItem = {
  id: string;
  provider: string;
  status: string;
  userId: string;
};

type SyncResult = {
  gmail?: unknown;
  calendar?: unknown;
  tasks?: unknown;
  errors: string[];
};

export async function POST() {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized. Please sign in again.",
        },
        { status: 401 },
      );
    }

    const appUser = await prisma.user.findUnique({
      where: {
        clerkId: clerkUser.id,
      },
    });

    if (!appUser) {
      return NextResponse.json(
        {
          success: false,
          error: "User not synced in database.",
        },
        { status: 404 },
      );
    }

    const accounts = (await prisma.connectedAccount.findMany({
      where: {
        userId: appUser.id,
        status: "CONNECTED",
      },
    })) as ConnectedAccountItem[];

    const hasGmail = accounts.some(
      (account: ConnectedAccountItem) =>
        account.provider === "CORSAIR_GMAIL",
    );

    const hasCalendar = accounts.some(
      (account: ConnectedAccountItem) =>
        account.provider === "CORSAIR_CALENDAR" ||
        account.provider === "GOOGLE_CALENDAR",
    );

    const result: SyncResult = {
      errors: [],
    };

    if (hasGmail) {
      try {
        result.gmail = await syncLatestGmailForUser({
          clerkUserId: clerkUser.id,
          appUserId: appUser.id,
        });

        result.tasks = await extractTasksFromRecentEmails({
          appUserId: appUser.id,
          limit: 40,
        });
      } catch (error) {
        result.errors.push(
          error instanceof Error
            ? `Gmail/Tasks: ${error.message}`
            : "Gmail sync or task extraction failed.",
        );
      }
    }

    if (hasCalendar) {
      try {
        result.calendar = await syncLatestCalendarForUser({
          clerkUserId: clerkUser.id,
          appUserId: appUser.id,
          daysBack: 30,
          daysForward: 180,
        });
      } catch (error) {
        result.errors.push(
          error instanceof Error
            ? `Calendar: ${error.message}`
            : "Calendar sync failed.",
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Automatic pulse sync completed.",
      hasGmail,
      hasCalendar,
      ...result,
    });
  } catch (error) {
    console.error("REALTIME_SYNC_ROUTE_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Automatic pulse sync failed.",
      },
      { status: 500 },
    );
  }
}