import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { corsair } from "@/lib/corsair";
import { getHeader } from "@/lib/gmail-parser";

type GmailSendResponse = {
  id?: string;
  threadId?: string;
  labelIds?: string[];
};

type GmailMessageResponse = {
  id: string;
  threadId: string;
  payload?: {
    headers?: {
      name?: string;
      value?: string;
    }[];
  };
};

type SendApprovedGmailReplyInput = {
  clerkUserId: string;
  appUserId: string;
  messageId: string;
  replyBody: string;
};

function unwrapCorsairResponse<T>(response: any): T {
  return (response?.data || response?.response || response) as T;
}

function sanitizeHeader(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function ensureReplySubject(subject: string) {
  const cleanSubject = sanitizeHeader(subject || "(No subject)");

  if (/^re:/i.test(cleanSubject)) {
    return cleanSubject;
  }

  return `Re: ${cleanSubject}`;
}

function buildReferencesHeader({
  existingReferences,
  existingMessageId,
}: {
  existingReferences?: string;
  existingMessageId?: string;
}) {
  return [existingReferences, existingMessageId]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildReplyMime({
  to,
  subject,
  body,
  inReplyTo,
  references,
}: {
  to: string;
  subject: string;
  body: string;
  inReplyTo?: string;
  references?: string;
}) {
  const headers = [
    `To: ${sanitizeHeader(to)}`,
    `Subject: ${sanitizeHeader(subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
  ];

  if (inReplyTo) {
    headers.push(`In-Reply-To: ${sanitizeHeader(inReplyTo)}`);
  }

  if (references) {
    headers.push(`References: ${sanitizeHeader(references)}`);
  }

  return `${headers.join("\r\n")}\r\n\r\n${body.trim()}\r\n`;
}

function getSnippet(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 180);
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
        format: "metadata",
      });
    } catch {
      return api.messages.get({
        messageId,
        format: "metadata",
      });
    }
  }

  if (api.users?.messages?.get) {
    return api.users.messages.get({
      userId: "me",
      id: messageId,
      format: "metadata",
    });
  }

  throw new Error("No Gmail messages.get method found in Corsair client.");
}

async function sendRawMessage({
  tenantClient,
  raw,
  threadId,
}: {
  tenantClient: any;
  raw: string;
  threadId: string;
}) {
  const api = tenantClient.gmail?.api;

  if (!api && !tenantClient.run) {
    throw new Error("Corsair Gmail API is not available on tenant client.");
  }

  const messagePayload = {
    raw,
    threadId,
  };

  const attempts: Array<() => Promise<any>> = [];

  if (api?.messages?.send) {
    attempts.push(
      () =>
        api.messages.send({
          raw,
          threadId,
        }),
      () =>
        api.messages.send({
          userId: "me",
          raw,
          threadId,
        }),
      () =>
        api.messages.send({
          requestBody: messagePayload,
        }),
      () =>
        api.messages.send({
          body: messagePayload,
        }),
      () =>
        api.messages.send({
          message: messagePayload,
        })
    );
  }

  if (api?.users?.messages?.send) {
    attempts.push(
      () =>
        api.users.messages.send({
          userId: "me",
          requestBody: messagePayload,
        }),
      () =>
        api.users.messages.send({
          userId: "me",
          body: messagePayload,
        })
    );
  }

  if (tenantClient.run) {
    attempts.push(() =>
      tenantClient.run("gmail.api.messages.send", messagePayload)
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
    : new Error("No Gmail messages.send method worked.");
}

export async function sendApprovedGmailReply({
  clerkUserId,
  appUserId,
  messageId,
  replyBody,
}: SendApprovedGmailReplyInput) {
  const cleanReplyBody = replyBody.trim();

  if (!cleanReplyBody) {
    throw new Error("Reply body cannot be empty.");
  }

  if (cleanReplyBody.length > 20000) {
    throw new Error("Reply body is too long.");
  }

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

  if (!originalMessage.fromEmail) {
    throw new Error("Original sender email is missing.");
  }

  const tenantClient = corsair.withTenant(clerkUserId) as any;

  const workflow = await prisma.workflow.create({
    data: {
      userId: appUserId,
      type: "EMAIL_REPLY",
      status: "APPROVED",
      title: `Reply to ${
        originalMessage.fromName || originalMessage.fromEmail
      }`,
      summary: `User approved a Gmail reply for: ${originalMessage.subject}`,
      nextStep: "Send approved Gmail reply",
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
      type: "SEND_GMAIL_REPLY",
      status: "APPROVED",
      title: "Send Gmail reply",
      description: `Send approved reply to ${originalMessage.fromEmail}`,
      payload: {
        messageId: originalMessage.id,
        externalMessageId: originalMessage.externalMessageId,
        to: originalMessage.fromEmail,
        subject: ensureReplySubject(originalMessage.subject),
        replyBody: cleanReplyBody,
      },
      preparedAt: new Date(),
      approvedAt: new Date(),
    },
  });

  try {
    const rawOriginal = await getFullMessage(
      tenantClient,
      originalMessage.externalMessageId
    );

    const fullOriginal =
      unwrapCorsairResponse<GmailMessageResponse>(rawOriginal);

    const headers = fullOriginal.payload?.headers || [];

    const originalSmtpMessageId = getHeader(headers, "Message-ID");
    const originalReferences = getHeader(headers, "References");

    const gmailThreadId =
      fullOriginal.threadId || originalMessage.thread.externalThreadId;

    if (!gmailThreadId) {
      throw new Error("Gmail thread id is missing.");
    }

    const replySubject = ensureReplySubject(originalMessage.subject);

    const references = buildReferencesHeader({
      existingReferences: originalReferences,
      existingMessageId: originalSmtpMessageId,
    });

    const mimeMessage = buildReplyMime({
      to: originalMessage.fromEmail,
      subject: replySubject,
      body: cleanReplyBody,
      inReplyTo: originalSmtpMessageId,
      references,
    });

    const raw = base64UrlEncode(mimeMessage);

    const sendResponse = await sendRawMessage({
      tenantClient,
      raw,
      threadId: gmailThreadId,
    });

    const sentResult = unwrapCorsairResponse<GmailSendResponse>(sendResponse);

    const sentExternalMessageId =
      sentResult.id || `local-reply-${randomUUID()}`;

    const sentAt = new Date();

    const savedOutboundMessage = await prisma.emailMessage.create({
      data: {
        userId: appUserId,
        threadId: originalMessage.threadId,
        externalMessageId: sentExternalMessageId,
        direction: "OUTBOUND",
        fromEmail:
          gmailConnection.accountEmail ||
          originalMessage.toEmails[0] ||
          originalMessage.user.email,
        fromName: originalMessage.user.name,
        toEmails: [originalMessage.fromEmail],
        ccEmails: [],
        subject: replySubject,
        snippet: getSnippet(cleanReplyBody),
        bodyText: cleanReplyBody,
        bodyHtml: null,
        sentAt,
        metadata: {
          source: "USER_APPROVED_GMAIL_REPLY",
          gmailThreadId,
          repliedToMessageId: originalMessage.id,
          repliedToExternalMessageId: originalMessage.externalMessageId,
          gmailSendResponse: sentResult,
          approvedAt: sentAt.toISOString(),
        },
      },
    });

    await prisma.emailThread.update({
      where: {
        id: originalMessage.threadId,
      },
      data: {
        lastMessageAt: sentAt,
      },
    });

    await prisma.workflowAction.update({
      where: {
        id: action.id,
      },
      data: {
        status: "COMPLETED",
        executedAt: sentAt,
        result: {
          sentEmailMessageId: savedOutboundMessage.id,
          externalMessageId: sentExternalMessageId,
          gmailThreadId,
        },
      },
    });

    await prisma.workflow.update({
      where: {
        id: workflow.id,
      },
      data: {
        status: "COMPLETED",
        completedAt: sentAt,
        metadata: {
          source: "INBOX",
          approvedAt: sentAt.toISOString(),
          sentEmailMessageId: savedOutboundMessage.id,
          externalMessageId: sentExternalMessageId,
          gmailThreadId,
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: appUserId,
        workflowId: workflow.id,
        actionId: action.id,
        event: "GMAIL_REPLY_SENT",
        description: `Approved Gmail reply sent to ${originalMessage.fromEmail}`,
        metadata: {
          originalMessageId: originalMessage.id,
          originalExternalMessageId: originalMessage.externalMessageId,
          sentEmailMessageId: savedOutboundMessage.id,
          sentExternalMessageId,
          gmailThreadId,
        },
      },
    });

    return {
      workflow,
      action,
      sentMessage: savedOutboundMessage,
      gmail: {
        id: sentExternalMessageId,
        threadId: gmailThreadId,
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
              : "Unknown Gmail reply send error",
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
              : "Unknown Gmail reply send error",
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: appUserId,
        workflowId: workflow.id,
        actionId: action.id,
        event: "GMAIL_REPLY_FAILED",
        description: `Failed to send Gmail reply to ${originalMessage.fromEmail}`,
        metadata: {
          originalMessageId: originalMessage.id,
          originalExternalMessageId: originalMessage.externalMessageId,
          error:
            error instanceof Error
              ? error.message
              : "Unknown Gmail reply send error",
        },
      },
    });

    throw error;
  }
}