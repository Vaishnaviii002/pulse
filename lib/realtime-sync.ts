import { prisma } from "@/lib/prisma";
import { syncLatestGmailForUser } from "@/lib/gmail-sync";
import { syncLatestCalendarForUser } from "@/lib/calendar-sync";

type WebhookSyncInput = {
  headers: Record<string, string>;
  body: unknown;
};

function getRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function getString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function deepFindString(value: unknown, keys: string[]): string {
  const record = getRecord(value);

  for (const key of keys) {
    const direct = getString(record[key]);
    if (direct) return direct;
  }

  for (const item of Object.values(record)) {
    if (item && typeof item === "object") {
      const nested = deepFindString(item, keys);
      if (nested) return nested;
    }
  }

  return "";
}

function inferProvider(headers: Record<string, string>, body: unknown) {
  const text = JSON.stringify({
    headers,
    body,
  }).toLowerCase();

  if (text.includes("gmail") || text.includes("message")) return "gmail";
  if (text.includes("googlecalendar") || text.includes("calendar") || text.includes("event")) {
    return "calendar";
  }

  return "unknown";
}

function extractTenantId(headers: Record<string, string>, body: unknown) {
  return (
    headers["x-corsair-tenant-id"] ||
    headers["x-tenant-id"] ||
    headers["corsair-tenant-id"] ||
    deepFindString(body, [
      "tenantId",
      "tenant_id",
      "tenant",
      "clerkUserId",
      "userId",
    ])
  );
}

export async function syncFromWebhookPayload({ headers, body }: WebhookSyncInput) {
  const tenantId = extractTenantId(headers, body);
  const provider = inferProvider(headers, body);

  if (!tenantId) {
    return {
      synced: false,
      provider,
      reason: "No tenantId found in webhook payload.",
    };
  }

  const appUser = await prisma.user.findUnique({
    where: {
      clerkId: tenantId,
    },
  });

  if (!appUser) {
    return {
      synced: false,
      provider,
      tenantId,
      reason: "No app user found for webhook tenant.",
    };
  }

  const accounts = await prisma.connectedAccount.findMany({
    where: {
      userId: appUser.id,
      status: "CONNECTED",
    },
  });

  const hasGmail = accounts.some((account) => account.provider === "CORSAIR_GMAIL");
  const hasCalendar = accounts.some(
    (account) =>
      account.provider === "CORSAIR_CALENDAR" ||
      account.provider === "GOOGLE_CALENDAR"
  );

  const result: Record<string, unknown> = {
    synced: true,
    provider,
    tenantId,
  };

  if ((provider === "gmail" || provider === "unknown") && hasGmail) {
    result.gmail = await syncLatestGmailForUser({
      clerkUserId: appUser.clerkId,
      appUserId: appUser.id,
    });
  }

  if ((provider === "calendar" || provider === "unknown") && hasCalendar) {
    result.calendar = await syncLatestCalendarForUser({
      clerkUserId: appUser.clerkId,
      appUserId: appUser.id,
      daysBack: 30,
      daysForward: 180,
    });
  }

  return result;
}