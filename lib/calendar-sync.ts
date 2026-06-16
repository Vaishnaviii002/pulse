import { prisma } from "@/lib/prisma";
import { corsair } from "@/lib/corsair";

type GoogleCalendarEventDate = {
  date?: string;
  dateTime?: string;
  timeZone?: string;
};

type GoogleCalendarEvent = {
  id?: string;
  summary?: string;
  description?: string;
  location?: string;
  status?: string;
  htmlLink?: string;
  hangoutLink?: string;
  eventType?: string;
  start?: GoogleCalendarEventDate;
  end?: GoogleCalendarEventDate;
  attendees?: {
    email?: string;
    displayName?: string;
    responseStatus?: string;
    optional?: boolean;
  }[];
  creator?: {
    email?: string;
    displayName?: string;
  };
  organizer?: {
    email?: string;
    displayName?: string;
  };
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

function getEventItems(response: any): GoogleCalendarEvent[] {
  const data = unwrapCorsairResponse<any>(response);

  if (Array.isArray(data)) return data;

  return data?.items || data?.events || [];
}

function toGoogleDate(value: Date) {
  return value.toISOString();
}

async function listCalendarEvents({
  tenantClient,
  timeMin,
  timeMax,
}: {
  tenantClient: any;
  timeMin: Date;
  timeMax: Date;
}) {
  const api = getCalendarApi(tenantClient);

  const params = {
    calendarId: "primary",
    timeMin: toGoogleDate(timeMin),
    timeMax: toGoogleDate(timeMax),
    maxResults: 50,
    singleEvents: true,
    orderBy: "startTime",
  };

  const attempts: Array<() => Promise<any>> = [];

  if (api?.events?.list) {
    attempts.push(
      () => api.events.list(params),
      () =>
        api.events.list({
          ...params,
          calendar_id: "primary",
        }),
      () =>
        api.events.list({
          calendarId: "primary",
          requestBody: params,
        })
    );
  }

  if (api?.calendar?.events?.list) {
    attempts.push(() => api.calendar.events.list(params));
  }

  if (api?.users?.events?.list) {
    attempts.push(() =>
      api.users.events.list({
        userId: "me",
        ...params,
      })
    );
  }

  if (tenantClient.run) {
    attempts.push(() => tenantClient.run("googlecalendar.api.events.list", params));
    attempts.push(() => tenantClient.run("calendar.api.events.list", params));
  }

  if (!attempts.length) {
    throw new Error("No Google Calendar events.list method found in Corsair client.");
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
    : new Error("Failed to list Google Calendar events.");
}

function parseCalendarDate(value?: GoogleCalendarEventDate) {
  if (!value) return null;

  const raw = value.dateTime || value.date;

  if (!raw) return null;

  return new Date(raw);
}

function fallbackEndTime(startTime: Date) {
  return new Date(startTime.getTime() + 30 * 60 * 1000);
}

function getMeetingUrl(event: GoogleCalendarEvent) {
  const videoEntry = event.conferenceData?.entryPoints?.find(
    (entry) => entry.entryPointType === "video" && entry.uri
  );

  return videoEntry?.uri || event.hangoutLink || null;
}

export async function syncLatestCalendarForUser({
  clerkUserId,
  appUserId,
}: {
  clerkUserId: string;
  appUserId: string;
}) {
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

  const tenantClient = corsair.withTenant(clerkUserId) as any;

  const timeMin = new Date();
  timeMin.setDate(timeMin.getDate() - 7);

  const timeMax = new Date();
  timeMax.setDate(timeMax.getDate() + 90);

  const response = await listCalendarEvents({
    tenantClient,
    timeMin,
    timeMax,
  });

  const events = getEventItems(response);

  const savedEvents = [];

  for (const event of events) {
    if (!event.id) continue;

    const startTime = parseCalendarDate(event.start);
    const endTime = parseCalendarDate(event.end) || (startTime ? fallbackEndTime(startTime) : null);

    if (!startTime || !endTime) continue;

    const savedEvent = await prisma.calendarEvent.upsert({
      where: {
        userId_externalEventId: {
          userId: appUserId,
          externalEventId: event.id,
        },
      },
      update: {
        title: event.summary || "(No title)",
        description: event.description || null,
        location: event.location || null,
        meetingUrl: getMeetingUrl(event),
        attendees: event.attendees || [],
        startTime,
        endTime,
        status: event.status || "confirmed",
        source: "GOOGLE_CALENDAR",
        metadata: {
          htmlLink: event.htmlLink,
          eventType: event.eventType,
          creator: event.creator,
          organizer: event.organizer,
          timeZone: event.start?.timeZone || event.end?.timeZone,
          syncedAt: new Date().toISOString(),
        },
      },
      create: {
        userId: appUserId,
        externalEventId: event.id,
        title: event.summary || "(No title)",
        description: event.description || null,
        location: event.location || null,
        meetingUrl: getMeetingUrl(event),
        attendees: event.attendees || [],
        startTime,
        endTime,
        status: event.status || "confirmed",
        source: "GOOGLE_CALENDAR",
        metadata: {
          htmlLink: event.htmlLink,
          eventType: event.eventType,
          creator: event.creator,
          organizer: event.organizer,
          timeZone: event.start?.timeZone || event.end?.timeZone,
          syncedAt: new Date().toISOString(),
        },
      },
    });

    savedEvents.push(savedEvent);
  }

  return {
    fetched: events.length,
    saved: savedEvents.length,
  };
}