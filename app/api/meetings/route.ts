import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SourceEmail = {
  id: string;
  subject?: string | null;
  fromName?: string | null;
  fromEmail?: string | null;
  toEmails?: string[] | null;
  snippet?: string | null;
  bodyText?: string | null;
  receivedAt?: Date | null;
  thread?: {
    subject?: string | null;
  } | null;
};

type MeetingItem = {
  id: string;
  title: string;
  description: string;
  location: string;
  startTime: Date;
  endTime: Date;
  status: string;
  source: string;
  meetingUrl: string;
  attendees: string[];
  sourceEmailId: string | null;
  readiness: {
    score: number;
    label: "Ready" | "Needs preparation" | "Not ready";
    missing: string[];
  };
  sourceEmail: {
    id: string;
    subject: string;
    fromName: string;
    fromEmail?: string | null;
    toEmails: string[];
    snippet: string;
    bodyText: string;
    receivedAt?: Date | null;
    threadSubject: string;
  } | null;
  workflows: any[];
  auditLogs: any[];
};

function normalizeAttendees(value: unknown): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((item: unknown) => {
        if (typeof item === "string") return item;

        if (item && typeof item === "object") {
          const record = item as {
            email?: unknown;
            displayName?: unknown;
          };

          return String(record.email || record.displayName || "");
        }

        return "";
      })
      .map((item: string) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item: string) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function getMetadataValue(metadata: unknown, key: string): unknown | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  return (metadata as Record<string, unknown>)[key] || null;
}

function getMeetingUrl(event: unknown): string {
  const item = event as {
    meetingUrl?: string | null;
    hangoutLink?: string | null;
    metadata?: unknown;
  };

  return (
    item.meetingUrl ||
    item.hangoutLink ||
    String(getMetadataValue(item.metadata, "meetingUrl") || "") ||
    String(getMetadataValue(item.metadata, "hangoutLink") || "") ||
    ""
  );
}

function getSourceEmailId(event: unknown): string | null {
  const item = event as {
    sourceEmailId?: string | null;
    emailMessageId?: string | null;
    metadata?: unknown;
  };

  return (
    item.sourceEmailId ||
    item.emailMessageId ||
    String(getMetadataValue(item.metadata, "sourceEmailId") || "") ||
    null
  );
}

function getAttendees(event: unknown): string[] {
  const item = event as {
    attendees?: unknown;
    metadata?: unknown;
  };

  const directAttendees = normalizeAttendees(item.attendees);

  if (directAttendees.length) {
    return directAttendees;
  }

  return normalizeAttendees(getMetadataValue(item.metadata, "attendees"));
}

function calculateReadiness(event: {
  description?: string | null;
  attendees: string[];
  meetingUrl: string;
  sourceEmailId?: string | null;
}) {
  const missing: string[] = [];
  let score = 100;

  if (!event.description?.trim()) {
    score -= 25;
    missing.push("agenda");
  }

  if (!event.attendees.length) {
    score -= 25;
    missing.push("attendees");
  }

  if (!event.meetingUrl) {
    score -= 20;
    missing.push("meeting link");
  }

  if (!event.sourceEmailId) {
    score -= 10;
    missing.push("source email");
  }

  if (score >= 80) {
    return {
      score,
      label: "Ready" as const,
      missing,
    };
  }

  if (score >= 50) {
    return {
      score,
      label: "Needs preparation" as const,
      missing,
    };
  }

  return {
    score,
    label: "Not ready" as const,
    missing,
  };
}

export async function GET() {
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

    const events = await prisma.calendarEvent.findMany({
      where: {
        userId: appUser.id,
      },
      orderBy: {
        startTime: "asc",
      },
      take: 120,
    });

    const eventIds = events.map((event: any) => event.id);

    const sourceEmailIds = Array.from(
      new Set(
        events
          .map((event: any) => getSourceEmailId(event))
          .filter((id: string | null | undefined): id is string =>
            Boolean(id),
          ),
      ),
    );

    const sourceEmails: SourceEmail[] = sourceEmailIds.length
      ? ((await prisma.emailMessage.findMany({
          where: {
            id: {
              in: sourceEmailIds,
            },
            userId: appUser.id,
          },
          include: {
            thread: true,
          },
        })) as SourceEmail[])
      : [];

    const sourceEmailMap = new Map<string, SourceEmail>(
      sourceEmails.map((email: SourceEmail) => [email.id, email]),
    );

    let workflows: any[] = [];
    let auditLogs: any[] = [];

    try {
      workflows = await (prisma.workflow as any).findMany({
        where: {
          userId: appUser.id,
          calendarEventId: {
            in: eventIds,
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 100,
      });
    } catch {
      workflows = [];
    }

    try {
      auditLogs = await (prisma.auditLog as any).findMany({
        where: {
          userId: appUser.id,
          OR: [
            {
              entityType: "CalendarEvent",
              entityId: {
                in: eventIds,
              },
            },
            {
              entityType: "Workflow",
            },
          ],
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 100,
      });
    } catch {
      auditLogs = [];
    }

    const workflowMap = new Map<string, any[]>();
    const auditMap = new Map<string, any[]>();

    for (const workflow of workflows) {
      const key = workflow.calendarEventId;
      if (!key) continue;

      const current = workflowMap.get(key) || [];
      current.push(workflow);
      workflowMap.set(key, current);
    }

    for (const log of auditLogs) {
      const key = log.entityId;
      if (!key) continue;

      const current = auditMap.get(key) || [];
      current.push(log);
      auditMap.set(key, current);
    }

    const meetings: MeetingItem[] = events.map((event: any) => {
      const sourceEmailId = getSourceEmailId(event);

      const sourceEmail: SourceEmail | null = sourceEmailId
        ? sourceEmailMap.get(sourceEmailId) || null
        : null;

      const attendees = getAttendees(event);
      const meetingUrl = getMeetingUrl(event);

      const readiness = calculateReadiness({
        description: event.description,
        attendees,
        meetingUrl,
        sourceEmailId,
      });

      return {
        id: event.id,
        title: event.title,
        description: event.description || "",
        location: event.location || "",
        startTime: event.startTime,
        endTime: event.endTime,
        status: event.status || "confirmed",
        source: event.source || "GOOGLE_CALENDAR",
        meetingUrl,
        attendees,
        sourceEmailId,
        readiness,
        sourceEmail: sourceEmail
          ? {
              id: sourceEmail.id,
              subject: sourceEmail.subject || "(No subject)",
              fromName: sourceEmail.fromName || "",
              fromEmail: sourceEmail.fromEmail,
              toEmails: sourceEmail.toEmails || [],
              snippet: sourceEmail.snippet || "",
              bodyText: sourceEmail.bodyText || "",
              receivedAt: sourceEmail.receivedAt,
              threadSubject: sourceEmail.thread?.subject || "",
            }
          : null,
        workflows: workflowMap.get(event.id) || [],
        auditLogs: auditMap.get(event.id) || [],
      };
    });

    return NextResponse.json({
      success: true,
      meetings,
      stats: {
        total: meetings.length,
        fromEmail: meetings.filter((meeting: MeetingItem) => meeting.sourceEmailId)
          .length,
        needsPrep: meetings.filter(
          (meeting: MeetingItem) => meeting.readiness.label !== "Ready",
        ).length,
        withMeetLink: meetings.filter((meeting: MeetingItem) => meeting.meetingUrl)
          .length,
      },
    });
  } catch (error) {
    console.error("MEETINGS_ROUTE_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to load meetings.",
      },
      { status: 500 },
    );
  }
}