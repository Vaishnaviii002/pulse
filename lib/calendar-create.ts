import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { corsair } from "@/lib/corsair";

type CreateCalendarEventInput = {
  clerkUserId: string;
  appUserId: string;
  messageId: string;
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  attendees: string[];
  createMeetLink?: boolean;
};

type GoogleCalendarCreatedEvent = {
  id?: string;
  summary?: string;
  description?: string;
  location?: string;
  status?: string;
  htmlLink?: string;
  hangoutLink?: string;
  start?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: {
    email?: string;
    displayName?: string;
    responseStatus?: string;
  }[];
  conferenceData?: {
    entryPoints?: {
      entryPointType?: string;
      uri?: string;
      label?: string;
    }[];
  };
};

function unwrapCorsairResponse<T>(response: any): T {
  return (response?.data || response?.response || response) as T;
}

function getCalendarApi(tenantClient: any) {
  return (
    tenantClient.googlecalendar?.api ||
    tenantClient.googleCalendar?.api ||
    tenantClient.calendar?.api
  );
}

function cleanText(value: string, fallback: string) {
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned || fallback;
}

function uniqueEmails(values: string[]) {
  const seen = new Set<string>();

  return values
    .map((value) => value.trim().toLowerCase())
    .filter((value) => {
      if (!value || !value.includes("@")) return false;
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
}

function getMeetingUrl(event: GoogleCalendarCreatedEvent) {
  const videoEntry = event.conferenceData?.entryPoints?.find(
    (entry) => entry.entryPointType === "video" && entry.uri
  );

  return videoEntry?.uri || event.hangoutLink || null;
}

function normalizeDate(value: string, label: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${label} must be a valid date/time.`);
  }

  return date;
}

function buildCalendarEventPayload({
  title,
  description,
  location,
  startTime,
  endTime,
  attendees,
  createMeetLink,
}: {
  title: string;
  description: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  attendees: string[];
  createMeetLink: boolean;
}) {
  const payload: any = {
    summary: title,
    description,
    location: location || undefined,
    start: {
      dateTime: startTime.toISOString(),
    },
    end: {
      dateTime: endTime.toISOString(),
    },
    attendees: attendees.map((email) => ({ email })),
  };

  if (createMeetLink) {
    payload.conferenceData = {
      createRequest: {
        requestId: `pulse-${randomUUID()}`,
        conferenceSolutionKey: {
          type: "hangoutsMeet",
        },
      },
    };
  }

  return payload;
}

async function createGoogleCalendarEvent({
  tenantClient,
  eventPayload,
  createMeetLink,
}: {
  tenantClient: any;
  eventPayload: any;
  createMeetLink: boolean;
}) {
  const api = getCalendarApi(tenantClient);

  if (!api && !tenantClient.run) {
    throw new Error("Corsair Google Calendar API is not available.");
  }

  const params = {
    calendarId: "primary",
    sendUpdates: "all",
    conferenceDataVersion: createMeetLink ? 1 : 0,
  };

  const attempts: Array<() => Promise<any>> = [];

  if (api?.events?.create) {
    attempts.push(
      () =>
        api.events.create({
          ...params,
          event: eventPayload,
        }),
      () =>
        api.events.create({
          ...params,
          body: eventPayload,
        }),
      () =>
        api.events.create({
          ...params,
          requestBody: eventPayload,
        })
    );
  }

  if (api?.events?.insert) {
    attempts.push(
      () =>
        api.events.insert({
          ...params,
          requestBody: eventPayload,
        }),
      () =>
        api.events.insert({
          ...params,
          body: eventPayload,
        }),
      () =>
        api.events.insert({
          ...params,
          resource: eventPayload,
        })
    );
  }

  if (api?.calendar?.events?.insert) {
    attempts.push(() =>
      api.calendar.events.insert({
        ...params,
        requestBody: eventPayload,
      })
    );
  }

  if (api?.users?.events?.insert) {
    attempts.push(() =>
      api.users.events.insert({
        userId: "me",
        ...params,
        requestBody: eventPayload,
      })
    );
  }

  if (tenantClient.run) {
    attempts.push(
      () =>
        tenantClient.run("googlecalendar.api.events.create", {
          ...params,
          event: eventPayload,
        }),
      () =>
        tenantClient.run("googlecalendar.api.events.insert", {
          ...params,
          requestBody: eventPayload,
        }),
      () =>
        tenantClient.run("calendar.api.events.insert", {
          ...params,
          requestBody: eventPayload,
        })
    );
  }

  let lastError: unknown;

  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("No Google Calendar event creation method worked.");
}

export async function createApprovedCalendarEventFromEmail({
  clerkUserId,
  appUserId,
  messageId,
  title,
  description,
  location,
  startTime,
  endTime,
  attendees,
  createMeetLink = true,
}: CreateCalendarEventInput) {
  const cleanTitle = cleanText(title, "Meeting");
  const startDate = normalizeDate(startTime, "startTime");
  const endDate = normalizeDate(endTime, "endTime");

  if (endDate <= startDate) {
    throw new Error("endTime must be after startTime.");
  }

  const calendarConnection = await prisma.connectedAccount.findUnique({
    where: {
      userId_provider: {
        userId: appUserId,
        provider: "CORSAIR_CALENDAR",
      },
    },
  });

  if (!calendarConnection || calendarConnection.status !== "CONNECTED") {
    throw new Error("Google Calendar is not connected for this user.");
  }

  const originalMessage = await prisma.emailMessage.findFirst({
    where: {
      id: messageId,
      userId: appUserId,
      direction: "INBOUND",
    },
    include: {
      thread: true,
      user: true,
    },
  });

  if (!originalMessage) {
    throw new Error("Inbound email message not found.");
  }

  const attendeeEmails = uniqueEmails([
    originalMessage.fromEmail,
    ...attendees,
  ]);

  if (!attendeeEmails.length) {
    throw new Error("At least one attendee email is required.");
  }

  const eventDescription =
    description?.trim() ||
    [
      `Created by pulse from email: ${originalMessage.subject}`,
      "",
      originalMessage.snippet || "",
    ]
      .join("\n")
      .trim();

  const tenantClient = corsair.withTenant(clerkUserId) as any;

  const workflow = await prisma.workflow.create({
    data: {
      userId: appUserId,
      type: "CALENDAR_EVENT_FROM_EMAIL",
      status: "APPROVED",
      title: `Create meeting: ${cleanTitle}`,
      summary: `User approved a Calendar event from email: ${originalMessage.subject}`,
      nextStep: "Create approved Google Calendar event",
      contactName: originalMessage.fromName,
      contactEmail: originalMessage.fromEmail,
      emailThreadId: originalMessage.threadId,
      emailMessageId: originalMessage.id,
      metadata: {
        source: "INBOX",
        approvedAt: new Date().toISOString(),
      },
    },
  });

  const action = await prisma.workflowAction.create({
    data: {
      workflowId: workflow.id,
      type: "CREATE_GOOGLE_CALENDAR_EVENT",
      status: "APPROVED",
      title: "Create Google Calendar event",
      description: `Create approved meeting from ${originalMessage.fromEmail}`,
      payload: {
        messageId: originalMessage.id,
        externalMessageId: originalMessage.externalMessageId,
        title: cleanTitle,
        description: eventDescription,
        location: location || null,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        attendees: attendeeEmails,
        createMeetLink,
      },
      preparedAt: new Date(),
      approvedAt: new Date(),
    },
  });

  try {
    const eventPayload = buildCalendarEventPayload({
      title: cleanTitle,
      description: eventDescription,
      location,
      startTime: startDate,
      endTime: endDate,
      attendees: attendeeEmails,
      createMeetLink,
    });

    let createResponse: any;

    try {
      createResponse = await createGoogleCalendarEvent({
        tenantClient,
        eventPayload,
        createMeetLink,
      });
    } catch (error) {
      if (!createMeetLink) throw error;

      const fallbackPayload = buildCalendarEventPayload({
        title: cleanTitle,
        description: eventDescription,
        location,
        startTime: startDate,
        endTime: endDate,
        attendees: attendeeEmails,
        createMeetLink: false,
      });

      createResponse = await createGoogleCalendarEvent({
        tenantClient,
        eventPayload: fallbackPayload,
        createMeetLink: false,
      });
    }

    const createdEvent =
      unwrapCorsairResponse<GoogleCalendarCreatedEvent>(createResponse);

    const externalEventId = createdEvent.id || `local-calendar-${randomUUID()}`;
    const meetingUrl = getMeetingUrl(createdEvent);

    const savedCalendarEvent = await prisma.calendarEvent.upsert({
      where: {
        userId_externalEventId: {
          userId: appUserId,
          externalEventId,
        },
      },
      update: {
        title: createdEvent.summary || cleanTitle,
        description: createdEvent.description || eventDescription,
        location: createdEvent.location || location || null,
        meetingUrl,
        attendees: createdEvent.attendees || attendeeEmails.map((email) => ({ email })),
        startTime: startDate,
        endTime: endDate,
        status: createdEvent.status || "confirmed",
        source: "PULSE_EMAIL_WORKFLOW",
        sourceEmailId: originalMessage.id,
        metadata: {
          htmlLink: createdEvent.htmlLink,
          sourceEmailId: originalMessage.id,
          sourceExternalMessageId: originalMessage.externalMessageId,
          googleCalendarResponse: createdEvent,
          createdFromEmailAt: new Date().toISOString(),
        },
      },
      create: {
        userId: appUserId,
        externalEventId,
        title: createdEvent.summary || cleanTitle,
        description: createdEvent.description || eventDescription,
        location: createdEvent.location || location || null,
        meetingUrl,
        attendees: createdEvent.attendees || attendeeEmails.map((email) => ({ email })),
        startTime: startDate,
        endTime: endDate,
        status: createdEvent.status || "confirmed",
        source: "PULSE_EMAIL_WORKFLOW",
        sourceEmailId: originalMessage.id,
        metadata: {
          htmlLink: createdEvent.htmlLink,
          sourceEmailId: originalMessage.id,
          sourceExternalMessageId: originalMessage.externalMessageId,
          googleCalendarResponse: createdEvent,
          createdFromEmailAt: new Date().toISOString(),
        },
      },
    });

    const completedAt = new Date();

    await prisma.workflowAction.update({
      where: {
        id: action.id,
      },
      data: {
        status: "COMPLETED",
        executedAt: completedAt,
        result: {
          calendarEventId: savedCalendarEvent.id,
          externalEventId,
          meetingUrl,
        },
      },
    });

    await prisma.workflow.update({
      where: {
        id: workflow.id,
      },
      data: {
        status: "COMPLETED",
        completedAt,
        calendarEventId: savedCalendarEvent.id,
        metadata: {
          source: "INBOX",
          approvedAt: completedAt.toISOString(),
          calendarEventId: savedCalendarEvent.id,
          externalEventId,
          meetingUrl,
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: appUserId,
        workflowId: workflow.id,
        actionId: action.id,
        event: "GOOGLE_CALENDAR_EVENT_CREATED",
        description: `Approved Calendar event created: ${cleanTitle}`,
        metadata: {
          originalMessageId: originalMessage.id,
          originalExternalMessageId: originalMessage.externalMessageId,
          calendarEventId: savedCalendarEvent.id,
          externalEventId,
          meetingUrl,
        },
      },
    });

    return {
      workflow,
      action,
      calendarEvent: savedCalendarEvent,
      google: {
        id: externalEventId,
        meetingUrl,
        htmlLink: createdEvent.htmlLink,
      },
    };
  } catch (error) {
    const failedAt = new Date();

    await prisma.workflowAction.update({
      where: {
        id: action.id,
      },
      data: {
        status: "FAILED",
        failedAt,
        result: {
          error:
            error instanceof Error
              ? error.message
              : "Unknown Calendar event creation error",
        },
      },
    });

    await prisma.workflow.update({
      where: {
        id: workflow.id,
      },
      data: {
        status: "FAILED",
        metadata: {
          source: "INBOX",
          failedAt: failedAt.toISOString(),
          error:
            error instanceof Error
              ? error.message
              : "Unknown Calendar event creation error",
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: appUserId,
        workflowId: workflow.id,
        actionId: action.id,
        event: "GOOGLE_CALENDAR_EVENT_FAILED",
        description: `Failed to create Calendar event: ${cleanTitle}`,
        metadata: {
          originalMessageId: originalMessage.id,
          originalExternalMessageId: originalMessage.externalMessageId,
          error:
            error instanceof Error
              ? error.message
              : "Unknown Calendar event creation error",
        },
      },
    });

    throw error;
  }
}