import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function stripHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n\s*\n\s*\n/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function removeTrackingAndFooter(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const cleanedLines: string[] = [];

  for (const line of lines) {
    const lower = line.toLowerCase();

    if (line.length > 220 && /https?:\/\//i.test(line)) continue;
    if (/https?:\/\/www\.linkedin\.com\/comm\/search/i.test(line)) continue;
    if (/https?:\/\/.*trk=/i.test(line)) continue;
    if (/https?:\/\/.*midtoken=/i.test(line)) continue;
    if (/https?:\/\/.*lipi=/i.test(line)) continue;
    if (/^view profile:/i.test(line)) continue;
    if (/^see all connections/i.test(line)) continue;
    if (/^unsubscribe/i.test(line)) continue;
    if (/^manage your email preferences/i.test(line)) continue;
    if (/^this email was intended for/i.test(line)) continue;
    if (/^you are receiving/i.test(line)) continue;
    if (/^©\s?\d{4}/i.test(line)) continue;
    if (/linkedin corporation/i.test(line)) continue;
    if (/linkedin and the linkedin logo/i.test(line)) continue;
    if (/west maude avenue/i.test(line)) continue;

    cleanedLines.push(line);
  }

  return cleanedLines.join("\n");
}

function cleanEmailBody(text: string) {
  if (!text) return "";

  let clean = text
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  clean = removeTrackingAndFooter(clean);

  clean = clean
    .replace(/\bhttps?:\/\/\S{80,}/gi, "")
    .replace(/\bhttps?:\/\/\S+/gi, (url) => {
      if (
        url.includes("linkedin.com") ||
        url.includes("trk=") ||
        url.includes("midToken") ||
        url.includes("lipi=")
      ) {
        return "";
      }

      return url;
    })
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  return clean;
}

function getDisplayBody({
  bodyText,
  bodyHtml,
  snippet,
}: {
  bodyText?: string | null;
  bodyHtml?: string | null;
  snippet?: string | null;
}) {
  const rawText = bodyText?.trim() || stripHtml(bodyHtml || "");
  const cleaned = cleanEmailBody(rawText);

  if (cleaned) return cleaned;

  return snippet?.trim() || "No readable email body available.";
}

function getLabelIds(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return [];
  }

  const labelIds = (metadata as { labelIds?: unknown }).labelIds;

  if (!Array.isArray(labelIds)) return [];

  return labelIds.filter((item): item is string => typeof item === "string");
}

export async function GET() {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
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
        { success: false, error: "User not synced in database." },
        { status: 400 },
      );
    }

    const messages = await prisma.emailMessage.findMany({
      where: {
        userId: appUser.id,
        direction: "INBOUND",
      },
      orderBy: {
        receivedAt: "desc",
      },
      take: 50,
      include: {
        thread: true,
      },
    });

    return NextResponse.json({
      success: true,
      messages: messages.map((message: any) => {
        const labelIds = getLabelIds(message.metadata);

        const cleanBody = getDisplayBody({
          bodyText: message.bodyText,
          bodyHtml: message.bodyHtml,
          snippet: message.snippet,
        });

        return {
          id: message.id,
          externalMessageId: message.externalMessageId,
          externalThreadId: message.externalThreadId,
          subject: message.subject || "(No subject)",
          fromEmail: message.fromEmail,
          fromName: message.fromName || message.fromEmail,
          toEmails: message.toEmails || [],
          ccEmails: message.ccEmails || [],
          bodyText: cleanBody,
          bodyHtml: message.bodyHtml,
          priority: message.priority,
          intent: message.intent,
          labelIds,
          receivedAt: message.receivedAt,
          sentAt: message.sentAt,
          createdAt: message.createdAt,
          thread: message.thread,
        };
      }),
    });
  } catch (error) {
    console.error("GMAIL_MESSAGES_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown Gmail load error",
      },
      { status: 500 },
    );
  }
}
