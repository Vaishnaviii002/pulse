import { prisma } from "@/lib/prisma";
import { corsair } from "@/lib/corsair";

type SyncCalendarOptions = {
  clerkUserId: string;
  appUserId: string;
  daysBack?: number;
  daysForward?: number;
};

type NormalizedCalendarEvent = {
  externalEventId: string;
  title: string;
  description: string;
  location: string;
  startTime: Date;
  endTime: Date;
  status: string;
  meetingUrl: string;
  attendees: string[];
  metadata: Record<string, unknown>;
};

function unwrapCorsairResponse(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;

  const record = value as Record<string, unknown>;

  if ("data" in record) return unwrapCorsairResponse(record.data);
  if ("result" in record) return unwrapCorsairResponse(record.result);
  if ("response" in record) return unwrapCorsairResponse(record.response);

  return value;
}

function getRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function getNestedRecord(value: unknown, key: string): Record<string, unknown> {
  return getRecord(getRecord(value)[key]);
}

function getString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function pickString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = getString(record[key]);
    if (value) return value;
  }

  return "";
}

function pickDateFromGoogleDate(value: unknown): Date | null {
  const record = getRecord(value);

  const dateTime = getString(record.dateTime);
  const date = getString(record.date);

  if (dateTime) {
    const parsed = new Date(dateTime);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  if (date) {
    const parsed = new Date(`${date}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return null;
}

function pickEventStart(raw: Record<string, unknown>) {
  const start =
    pickDateFromGoogleDate(raw.start) ||
    pickDateFromGoogleDate(raw.startTime) ||
    pickDateFromGoogleDate(raw.startsAt);

  if (start) return start;

  const direct =
    getString(raw.startTime) ||
    getString(raw.startsAt) ||
    getString(raw.startDateTime) ||
    getString(raw.start);

  if (!direct) return null;

  const parsed = new Date(direct);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function pickEventEnd(raw: Record<string, unknown>, startTime: Date) {
  const end =
    pickDateFromGoogleDate(raw.end) ||
    pickDateFromGoogleDate(raw.endTime) ||
    pickDateFromGoogleDate(raw.endsAt);

  if (end) return end;

  const direct =
    getString(raw.endTime) ||
    getString(raw.endsAt) ||
    getString(raw.endDateTime) ||
    getString(raw.end);

  if (direct) {
    const parsed = new Date(direct);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  const fallback = new Date(startTime);
  fallback.setMinutes(fallback.getMinutes() + 30);

  return fallback;
}

function extractMeetingUrl(raw: Record<string, unknown>) {
  const direct =
    pickString(raw, [
      "hangoutLink",
      "meetingUrl",
      "meetingURL",
      "conferenceUrl",
      "conferenceURL",
      "htmlLink",
    ]) || "";

  if (direct) return direct;

  const conferenceData = getNestedRecord(raw, "conferenceData");
  const entryPoints = conferenceData.entryPoints;

  if (Array.isArray(entryPoints)) {
    const videoEntry = entryPoints.find((item) => {
      const itemRecord = getRecord(item);
      return getString(itemRecord.entryPointType).toLowerCase() === "video";
    });

    const uri = getString(getRecord(videoEntry).uri);

    if (uri) return uri;

    const firstUri = getString(getRecord(entryPoints[0]).uri);
    if (firstUri) return firstUri;
  }

  return "";
}

function extractAttendees(raw: Record<string, unknown>) {
  const attendees = raw.attendees;

  if (!Array.isArray(attendees)) return [];

  return attendees
    .map((attendee) => {
      const record = getRecord(attendee);
      return getString(record.email) || getString(record.displayName);
    })
    .filter(Boolean);
}

function extractItems(value: unknown): unknown[] {
  const unwrapped = unwrapCorsairResponse(value);

  if (Array.isArray(unwrapped)) return unwrapped;

  const record = getRecord(unwrapped);

  const candidates = [
    record.items,
    record.events,
    record.data,
    getRecord(record.data).items,
    getRecord(record.data).events,
    getRecord(record.result).items,
    getRecord(record.result).events,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  return [];
}

function normalizeCalendarEvent(rawValue: unknown): NormalizedCalendarEvent | null {
  const raw = getRecord(rawValue);

  const externalEventId =
    pickString(raw, ["id", "eventId", "externalEventId", "googleEventId"]) ||
    pickString(getRecord(raw.resource), [
      "id",
      "eventId",
      "externalEventId",
      "googleEventId",
    ]);

  if (!externalEventId) return null;

  const mergedRaw = {
    ...getRecord(raw.resource),
    ...raw,
  };

  const startTime = pickEventStart(mergedRaw);

  if (!startTime) return null;

  const endTime = pickEventEnd(mergedRaw, startTime);

  const title =
    pickString(mergedRaw, ["summary", "title", "name"]) || "Untitled meeting";

  const description = pickString(mergedRaw, ["description", "notes"]);
  const location = pickString(mergedRaw, ["location"]);
  const status = pickString(mergedRaw, ["status"]) || "confirmed";
  const meetingUrl = extractMeetingUrl(mergedRaw);
  const attendees = extractAttendees(mergedRaw);

  return {
    externalEventId,
    title,
    description,
    location,
    startTime,
    endTime,
    status,
    meetingUrl,
    attendees,
    metadata: {
      raw: rawValue,
      syncedAt: new Date().toISOString(),
    },
  };
}

async function callCalendarListThroughCorsair({
  tenantClient,
  timeMin,
  timeMax,
}: {
  tenantClient: any;
  timeMin: string;
  timeMax: string;
}) {
  const payload = {
    calendarId: "primary",
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 250,
  };

  const directCalls: {
    label: string;
    call: () => Promise<unknown> | unknown;
  }[] = [
    {
      label: "googlecalendar.api.events.getMany",
      call: () => tenantClient.googlecalendar?.api?.events?.getMany?.(payload),
    },
    {
      label: "googleCalendar.api.events.getMany",
      call: () => tenantClient.googleCalendar?.api?.events?.getMany?.(payload),
    },
    {
      label: "calendar.api.events.getMany",
      call: () => tenantClient.calendar?.api?.events?.getMany?.(payload),
    },
    {
      label: "api.events.getMany",
      call: () => tenantClient.api?.events?.getMany?.(payload),
    },
  ];

  const errors: string[] = [];

  for (const candidate of directCalls) {
    try {
      const result = await candidate.call();

      if (!result) continue;

      const unwrapped = unwrapCorsairResponse(result);
      const record = getRecord(unwrapped);

      if (Array.isArray(record.items)) {
        return {
          source: candidate.label,
          items: record.items,
        };
      }

      const items = extractItems(result);

      return {
        source: candidate.label,
        items,
      };
    } catch (error) {
      errors.push(
        `${candidate.label}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  if (typeof tenantClient.run === "function") {
    const actionNames = [
      "googlecalendar.api.events.getMany",
      "googleCalendar.api.events.getMany",
      "calendar.api.events.getMany",
      "api.events.getMany",
    ];

    for (const actionName of actionNames) {
      try {
        const result = await tenantClient.run(actionName, payload);

        if (!result) continue;

        const unwrapped = unwrapCorsairResponse(result);
        const record = getRecord(unwrapped);

        if (Array.isArray(record.items)) {
          return {
            source: `run:${actionName}`,
            items: record.items,
          };
        }

        const items = extractItems(result);

        return {
          source: `run:${actionName}`,
          items,
        };
      } catch (error) {
        errors.push(
          `run:${actionName}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
  }

  throw new Error(
    [
      "Google Calendar events.getMany method was not found in Corsair client.",
      "Make sure @corsair-dev/googlecalendar is installed, registered in lib/corsair.ts, and Calendar OAuth is connected.",
      errors.slice(0, 5).join(" | "),
    ]
      .filter(Boolean)
      .join(" ")
  );
}

export async function syncLatestCalendarForUser({
  clerkUserId,
  appUserId,
  daysBack = 30,
  daysForward = 180,
}: SyncCalendarOptions) {
  const connectedAccount = await prisma.connectedAccount.findFirst({
    where: {
      userId: appUserId,
      provider: {
        in: ["CORSAIR_CALENDAR", "GOOGLE_CALENDAR"],
      },
      status: "CONNECTED",
    },
  });

  if (!connectedAccount) {
    throw new Error("Google Calendar is not connected.");
  }

  const timeMinDate = new Date();
  timeMinDate.setDate(timeMinDate.getDate() - daysBack);

  const timeMaxDate = new Date();
  timeMaxDate.setDate(timeMaxDate.getDate() + daysForward);

  const tenantClient = corsair.withTenant(clerkUserId) as any;

  const { source, items } = await callCalendarListThroughCorsair({
    tenantClient,
    timeMin: timeMinDate.toISOString(),
    timeMax: timeMaxDate.toISOString(),
  });

  const normalizedEvents = items
    .map(normalizeCalendarEvent)
    .filter((event): event is NormalizedCalendarEvent => Boolean(event));

  let saved = 0;
  let skipped = 0;

  for (const event of normalizedEvents) {
    try {
      const existing = await prisma.calendarEvent.findFirst({
        where: {
          userId: appUserId,
          externalEventId: event.externalEventId,
        },
      });

      if (existing) {
        await prisma.calendarEvent.update({
          where: {
            id: existing.id,
          },
          data: {
            title: event.title,
            description: event.description,
            location: event.location,
            startTime: event.startTime,
            endTime: event.endTime,
            attendees: event.attendees,
            meetingUrl: event.meetingUrl,
            status: event.status,
            source: "GOOGLE_CALENDAR",
            metadata: {
              ...event.metadata,
              syncSource: source,
            },
          },
        });
      } else {
        await prisma.calendarEvent.create({
          data: {
            userId: appUserId,
            externalEventId: event.externalEventId,
            title: event.title,
            description: event.description,
            location: event.location,
            startTime: event.startTime,
            endTime: event.endTime,
            attendees: event.attendees,
            meetingUrl: event.meetingUrl,
            status: event.status,
            source: "GOOGLE_CALENDAR",
            metadata: {
              ...event.metadata,
              syncSource: source,
            },
          },
        });
      }

      saved += 1;
    } catch (error) {
      skipped += 1;
      console.error("CALENDAR_EVENT_SAVE_ERROR:", error);
    }
  }

  return {
    source,
    fetched: items.length,
    normalized: normalizedEvents.length,
    saved,
    skipped,
  };
}