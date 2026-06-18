import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
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

    const body = await request.json();

    const taskId = String(body.taskId || "").trim();
    const startTimeRaw = String(body.startTime || "").trim();
    const endTimeRaw = String(body.endTime || "").trim();

    if (!taskId) {
      return NextResponse.json(
        {
          success: false,
          error: "Task id is required.",
        },
        { status: 400 },
      );
    }

    if (!startTimeRaw || !endTimeRaw) {
      return NextResponse.json(
        {
          success: false,
          error: "Start time and end time are required.",
        },
        { status: 400 },
      );
    }

    const startTime = new Date(startTimeRaw);
    const endTime = new Date(endTimeRaw);

    if (
      Number.isNaN(startTime.getTime()) ||
      Number.isNaN(endTime.getTime()) ||
      endTime <= startTime
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Please select a valid start and end time.",
        },
        { status: 400 },
      );
    }

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId: appUser.id,
      },
    });

    if (!task) {
      return NextResponse.json(
        {
          success: false,
          error: "Task not found.",
        },
        { status: 404 },
      );
    }

    const calendarEvent = await prisma.calendarEvent.create({
      data: {
        userId: appUser.id,
        title: task.title,
        description:
          task.description ||
          `Task added manually from pulse Tasks page.\n\nTask source: ${
            task.source || "MANUAL"
          }`,
        location: "",
        meetingUrl: "",
        attendees: [],
        startTime,
        endTime,
        status: "confirmed",
        source: "TASK",
        sourceEmailId: task.sourceEmailId || null,
        metadata: {
          createdFrom: "task",
          taskId: task.id,
          taskTitle: task.title,
        },
      },
    });

    await prisma.task.update({
      where: {
        id: task.id,
      },
      data: {
        metadata: {
          ...(task.metadata && typeof task.metadata === "object"
            ? (task.metadata as Record<string, unknown>)
            : {}),
          addedToCalendar: true,
          calendarEventId: calendarEvent.id,
          calendarStartTime: startTime.toISOString(),
          calendarEndTime: endTime.toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Task added to Calendar successfully.",
      calendarEvent,
    });
  } catch (error) {
    console.error("TASK_ADD_TO_CALENDAR_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to add task to Calendar.",
      },
      { status: 500 },
    );
  }
}