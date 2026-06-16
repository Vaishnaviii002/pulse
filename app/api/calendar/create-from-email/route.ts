import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createApprovedCalendarEventFromEmail } from "@/lib/calendar-create";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getAppUser() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    throw new Error("Unauthorized");
  }

  const appUser = await prisma.user.findUnique({
    where: {
      clerkId: clerkUser.id,
    },
  });

  if (!appUser) {
    throw new Error("User not synced in database.");
  }

  return {
    clerkUser,
    appUser,
  };
}

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

export async function POST(request: NextRequest) {
  try {
    const { clerkUser, appUser } = await getAppUser();

    const body = await request.json();

    const messageId = getString(body.messageId);
    const title = getString(body.title);
    const description = getString(body.description);
    const location = getString(body.location);
    const startTime = getString(body.startTime);
    const endTime = getString(body.endTime);
    const attendees = getStringArray(body.attendees);
    const createMeetLink =
      typeof body.createMeetLink === "boolean" ? body.createMeetLink : true;

    if (!messageId) {
      return NextResponse.json(
        { success: false, error: "Missing messageId." },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { success: false, error: "Meeting title is required." },
        { status: 400 }
      );
    }

    if (!startTime || !endTime) {
      return NextResponse.json(
        { success: false, error: "startTime and endTime are required." },
        { status: 400 }
      );
    }

    const result = await createApprovedCalendarEventFromEmail({
      clerkUserId: clerkUser.id,
      appUserId: appUser.id,
      messageId,
      title,
      description,
      location,
      startTime,
      endTime,
      attendees,
      createMeetLink,
    });

    return NextResponse.json({
      success: true,
      message: "Calendar event created successfully.",
      calendarEvent: {
        id: result.calendarEvent.id,
        externalEventId: result.calendarEvent.externalEventId,
        title: result.calendarEvent.title,
        startTime: result.calendarEvent.startTime,
        endTime: result.calendarEvent.endTime,
        meetingUrl: result.calendarEvent.meetingUrl,
        attendees: result.calendarEvent.attendees,
      },
      workflow: {
        id: result.workflow.id,
        status: "COMPLETED",
      },
      action: {
        id: result.action.id,
        status: "COMPLETED",
      },
      google: result.google,
    });
  } catch (error) {
    console.error("CALENDAR_CREATE_FROM_EMAIL_ERROR:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unknown Calendar event creation error";

    const status =
      message === "Unauthorized"
        ? 401
        : message.includes("not found")
          ? 404
          : message.includes("not connected")
            ? 400
            : 500;

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status }
    );
  }
}