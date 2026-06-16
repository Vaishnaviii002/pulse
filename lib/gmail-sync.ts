import { prisma } from "@/lib/prisma";
import { corsair } from "@/lib/corsair";
import {
  extractBody,
  getHeader,
  parseEmailAddress,
} from "@/lib/gmail-parser";

type GmailListItem = {
  id: string;
  threadId?: string;
};

type GmailMessageResponse = {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  payload?: {
    headers?: {
      name?: string;
      value?: string;
    }[];
    parts?: any[];
    body?: {
      data?: string;
    };
    mimeType?: string;
  };
  internalDate?: string;
};

function unwrapCorsairResponse<T>(response: any): T {
  return (response?.data || response?.response || response) as T;
}

function getListItems(response: any): GmailListItem[] {
  const data = unwrapCorsairResponse<any>(response);
  return data?.messages || [];
}

async function listInboxMessages(tenantClient: any) {
  const api = tenantClient.gmail?.api;

  if (!api) {
    throw new Error("Corsair Gmail API is not available on tenant client.");
  }

  // Corsair docs show gmail.api.messages.list(...)
  if (api.messages?.list) {
    return api.messages.list({
      maxResults: 20,
      q: "in:inbox",
    });
  }

  // Fallback for Google-style generated clients.
  if (api.users?.messages?.list) {
    return api.users.messages.list({
      userId: "me",
      maxResults: 20,
      q: "in:inbox",
    });
  }

  throw new Error("No Gmail messages.list method found in Corsair client.");
}

async function getFullMessage(tenantClient: any, messageId: string) {
  const api = tenantClient.gmail?.api;

  if (!api) {
    throw new Error("Corsair Gmail API is not available on tenant client.");
  }

  if (api.messages?.get) {
    try {
      return api.messages.get({
        id: messageId,
        format: "full",
      });
    } catch {
      return api.messages.get({
        messageId,
        format: "full",
      });
    }
  }

  if (api.users?.messages?.get) {
    return api.users.messages.get({
      userId: "me",
      id: messageId,
      format: "full",
    });
  }

  throw new Error("No Gmail messages.get method found in Corsair client.");
}

function splitEmailList(raw: string) {
  if (!raw) return [];

  return raw
    .split(",")
    .map((item) => parseEmailAddress(item).email)
    .filter(Boolean);
}

export async function syncLatestGmailForUser({
  clerkUserId,
  appUserId,
}: {
  clerkUserId: string;
  appUserId: string;
}) {
  const gmailConnection = await prisma.connectedAccount.findUnique({
    where: {
      userId_provider: {
        userId: appUserId,
        provider: "CORSAIR_GMAIL",
      },
    },
  });

  if (!gmailConnection || gmailConnection.status !== "CONNECTED") {
    throw new Error("Gmail is not connected for this user.");
  }

  const tenantClient = corsair.withTenant(clerkUserId) as any;

  const listResponse = await listInboxMessages(tenantClient);
  const gmailMessages = getListItems(listResponse);

  const savedMessages = [];

  for (const item of gmailMessages) {
    const rawMessage = await getFullMessage(tenantClient, item.id);
    const fullMessage = unwrapCorsairResponse<GmailMessageResponse>(rawMessage);

    if (!fullMessage?.id) continue;

    const headers = fullMessage.payload?.headers || [];

    const subject = getHeader(headers, "Subject") || "(No subject)";
    const fromRaw = getHeader(headers, "From");
    const toRaw = getHeader(headers, "To");
    const ccRaw = getHeader(headers, "Cc");
    const dateRaw = getHeader(headers, "Date");

    const from = parseEmailAddress(fromRaw);
    const body = extractBody(fullMessage.payload);

    const receivedAt = fullMessage.internalDate
      ? new Date(Number(fullMessage.internalDate))
      : dateRaw
        ? new Date(dateRaw)
        : new Date();

    const participants = [
      from.email,
      ...splitEmailList(toRaw),
      ...splitEmailList(ccRaw),
    ].filter(Boolean);

    const thread = await prisma.emailThread.upsert({
      where: {
        userId_externalThreadId: {
          userId: appUserId,
          externalThreadId: fullMessage.threadId,
        },
      },
      update: {
        subject,
        participants,
        lastMessageAt: receivedAt,
      },
      create: {
        userId: appUserId,
        externalThreadId: fullMessage.threadId,
        subject,
        participants,
        lastMessageAt: receivedAt,
      },
    });

    const savedMessage = await prisma.emailMessage.upsert({
      where: {
        userId_externalMessageId: {
          userId: appUserId,
          externalMessageId: fullMessage.id,
        },
      },
      update: {
        threadId: thread.id,
        fromEmail: from.email,
        fromName: from.name,
        toEmails: splitEmailList(toRaw),
        ccEmails: splitEmailList(ccRaw),
        subject,
        snippet: fullMessage.snippet || "",
        bodyText: body.text,
        bodyHtml: body.html,
        receivedAt,
        metadata: {
          labelIds: fullMessage.labelIds || [],
          gmailThreadId: fullMessage.threadId,
          syncedAt: new Date().toISOString(),
        },
      },
      create: {
        userId: appUserId,
        threadId: thread.id,
        externalMessageId: fullMessage.id,
        direction: "INBOUND",
        fromEmail: from.email,
        fromName: from.name,
        toEmails: splitEmailList(toRaw),
        ccEmails: splitEmailList(ccRaw),
        subject,
        snippet: fullMessage.snippet || "",
        bodyText: body.text,
        bodyHtml: body.html,
        receivedAt,
        metadata: {
          labelIds: fullMessage.labelIds || [],
          gmailThreadId: fullMessage.threadId,
          syncedAt: new Date().toISOString(),
        },
      },
    });

    savedMessages.push(savedMessage);
  }

  return {
    fetched: gmailMessages.length,
    saved: savedMessages.length,
  };
}