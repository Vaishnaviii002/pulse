import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const appUser = await prisma.user.findUnique({
      where: {
        clerkId: clerkUser.id,
      },
    });

    if (!appUser) {
      return NextResponse.json(
        { success: false, error: "User not synced in database." },
        { status: 400 }
      );
    }

    const start = new Date();
    start.setDate(start.getDate() - 1);

    const events = await prisma.calendarEvent.findMany({
      where: {
        userId: appUser.id,
        endTime: {
          gte: start,
        },
      },
      orderBy: {
        startTime: "asc",
      },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      events,
    });
  } catch (error) {
    console.error("CALENDAR_EVENTS_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown Calendar events load error",
      },
      { status: 500 }
    );
  }
}