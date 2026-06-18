import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOpenAIClient, OPENAI_MODEL } from "@/lib/openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function limitText(value: string, max = 10000) {
  if (!value) return "";
  return value.length > max ? value.slice(0, max) : value;
}

function stripHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
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

function cleanEmailText(text: string) {
  if (!text) return "";

  const lines = text
    .replace(/\r/g, "")
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const cleanedLines: string[] = [];

  for (const line of lines) {
    const lower = line.toLowerCase();

    if (line.length > 220 && /https?:\/\//i.test(line)) continue;
    if (/https?:\/\/www\.linkedin\.com/i.test(line)) continue;
    if (/https?:\/\/.*trk=/i.test(line)) continue;
    if (/https?:\/\/.*midtoken=/i.test(line)) continue;
    if (/https?:\/\/.*lipi=/i.test(line)) continue;
    if (/^unsubscribe/i.test(line)) continue;
    if (/^manage your email preferences/i.test(line)) continue;
    if (/^this email was intended for/i.test(line)) continue;
    if (/^you are receiving/i.test(line)) continue;
    if (/^©\s?\d{4}/i.test(line)) continue;
    if (/linkedin corporation/i.test(line)) continue;
    if (/linkedin and the linkedin logo/i.test(line)) continue;
    if (/west maude avenue/i.test(line)) continue;
    if (/view profile/i.test(line)) continue;
    if (/see all connections/i.test(line)) continue;
    if (/build your network/i.test(line)) continue;
    if (/premium inmail/i.test(line)) continue;

    cleanedLines.push(line);
  }

  return cleanedLines
    .join("\n")
    .replace(/\bhttps?:\/\/\S{80,}/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function isAutomatedSender(email: string) {
  const value = email.toLowerCase();

  return (
    value.includes("noreply") ||
    value.includes("no-reply") ||
    value.includes("notification") ||
    value.includes("notifications") ||
    value.includes("invitations@linkedin") ||
    value.includes("linkedin.com") ||
    value.includes("mailer") ||
    value.includes("updates")
  );
}

export async function POST(request: NextRequest) {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const messageId = body.messageId as string | undefined;

    if (!messageId) {
      return NextResponse.json(
        { success: false, error: "Missing messageId" },
        { status: 400 }
      );
    }

    const appUser = await prisma.user.findUnique({
      where: {
        clerkId: clerkUser.id,
      },
    });

    if (!appUser) {
      return NextResponse.json(
        { success: false, error: "User not synced in database" },
        { status: 400 }
      );
    }

    const message = await prisma.emailMessage.findFirst({
      where: {
        id: messageId,
        userId: appUser.id,
      },
    });

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Email message not found" },
        { status: 404 }
      );
    }

    const rawBody = message.bodyText || stripHtml(message.bodyHtml || "");
    const cleanBody = cleanEmailText(rawBody);

    const automatedSender = isAutomatedSender(message.fromEmail);

    const openai = getOpenAIClient();

    const emailText = `
Subject: ${message.subject}
From name: ${message.fromName || ""}
From email: ${message.fromEmail || ""}
To: ${message.toEmails.join(", ")}
Date: ${
      message.receivedAt
        ? message.receivedAt.toISOString()
        : message.sentAt
          ? message.sentAt.toISOString()
          : "Unknown"
    }
Automated sender: ${automatedSender ? "YES" : "NO"}

Snippet:
${message.snippet || ""}

Cleaned body:
${limitText(cleanBody || message.snippet || "")}
`;

    const response = await openai.responses.create({
      model: OPENAI_MODEL,
      input: [
        {
          role: "system",
          content: `
You are pulse AI, a professional email workflow assistant.

Your job:
1. Understand what the email actually means.
2. Decide whether a real Gmail reply is needed.
3. If a reply is needed, write a useful human reply.
4. If the email is an automated notification, newsletter, LinkedIn invite, receipt, promotion, alert, or no-reply email, do NOT create a Gmail reply.

Very important rules:
- Do not generate filler replies.
- Do not say "I will get back to you" unless the email actually asks for something that needs follow-up.
- Do not reply to LinkedIn notification emails through Gmail.
- Write the summary in simple English. It should clearly explain what the email is about and what the user should understand from it.
- Do not reply to no-reply, notification, newsletter, or marketing senders.
- If no reply is needed, set requiresReply=false and suggestedReply="".
- A good reply should directly answer the sender's message.
- A good reply should sound natural, professional, and specific.
- Never include placeholders like [Name], [Date], [Time], or "your project" unless those exact details are unknown and necessary.
- If the email asks for a meeting but does not provide a time, suggest asking for a suitable time.
- If the email proposes a meeting with clear details, confirm politely.
- For meeting detection, only set hasMeetingRequest=true and meeting.shouldCreate=true when the email clearly asks to schedule, join, confirm, or discuss a meeting/call/interview.
- If the email is promotional, security notification, newsletter, password reset, OTP, receipt, update, or FYI, set hasMeetingRequest=false and meeting.shouldCreate=false.
- Meeting title should describe the real topic of the meeting, not generic text.
- Meeting attendees should include real email addresses or names found in the email.
- If date or time is missing, keep dateText/timeText empty and let the user choose manually.
- Keep suggested replies short, human, and ready to send.
          `.trim(),
        },
        {
          role: "user",
          content: emailText,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "email_analysis",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: [
              "summary",
              "intent",
              "priority",
              "sentiment",
              "requiresReply",
              "hasMeetingRequest",
              "suggestedReply",
              "nextActions",
              "meeting",
            ],
            properties: {
              summary: {
                type: "string",
                description:
  "A simple-English summary explaining what the email is about. Avoid technical labels. Keep it clear and useful for the user.",
              },
              intent: {
                type: "string",
                enum: [
                  "MEETING_REQUEST",
                  "QUESTION",
                  "TASK",
                  "FOLLOW_UP",
                  "FYI",
                  "PROMOTION",
                  "OTHER",
                ],
              },
              priority: {
                type: "string",
                enum: ["HIGH", "MEDIUM", "LOW"],
              },
              sentiment: {
                type: "string",
                enum: ["POSITIVE", "NEUTRAL", "NEGATIVE", "URGENT"],
              },
              requiresReply: {
                type: "boolean",
                description:
                  "True only when the user should send a real Gmail reply to this sender.",
              },
              hasMeetingRequest: {
                type: "boolean",
              },
              suggestedReply: {
                type: "string",
                description:
                  "A ready-to-send professional reply. Empty string if no Gmail reply should be sent.",
              },
              nextActions: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              meeting: {
                type: "object",
                additionalProperties: false,
                required: [
                  "shouldCreate",
                  "title",
                  "dateText",
                  "timeText",
                  "attendees",
                ],
                properties: {
                  shouldCreate: {
                    type: "boolean",
                  },
                  title: {
                    type: "string",
                  },
                  dateText: {
                    type: "string",
                  },
                  timeText: {
                    type: "string",
                  },
                  attendees: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const outputText = response.output_text;

    if (!outputText) {
      throw new Error("OpenAI returned empty analysis");
    }

    const analysis = JSON.parse(outputText);

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("AI_EMAIL_ANALYZE_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown AI email analysis error",
      },
      { status: 500 }
    );
  }
}