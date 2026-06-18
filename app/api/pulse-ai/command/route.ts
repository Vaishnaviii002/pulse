import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOpenAIClient, OPENAI_MODEL } from "@/lib/openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EmailRecord = {
  id: string;
  subject: string | null;
  snippet: string | null;
  bodyText: string | null;
  bodyHtml: string | null;
  fromName: string | null;
  fromEmail: string | null;
  toEmails: string[];
  ccEmails: string[];
  receivedAt: Date | null;
  sentAt: Date | null;
  thread?: {
    subject?: string | null;
  } | null;
};

type CalendarEventRecord = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startTime: Date;
  endTime: Date;
  status: string | null;
  source: string | null;
};

type WorkflowRecord = {
  id: string;
  title: string;
  type: string;
  status: string;
  summary: string | null;
  nextStep: string | null;
  updatedAt: Date;
};

type AuditRecord = {
  id: string;
  event: string;
  entityType: string | null;
  entityId: string | null;
  createdAt: Date;
};

type ScoredEmail = {
  email: EmailRecord;
  score: number;
};

function stripHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanText(value: string) {
  return value
    .replace(/\r/g, "")
    .replace(/\bhttps?:\/\/\S{60,}/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function getEmailBody(message: {
  snippet?: string | null;
  bodyText?: string | null;
  bodyHtml?: string | null;
}) {
  return cleanText(
    message.bodyText?.trim() ||
      message.snippet?.trim() ||
      stripHtml(message.bodyHtml || "") ||
      "No readable body available.",
  );
}

function formatDateTime(value?: Date | string | null) {
  if (!value) return "Unknown time";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatTime(value?: Date | string | null) {
  if (!value) return "Unknown time";

  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function isAutomatedSender(email: string) {
  const value = email.toLowerCase();

  return (
    value.includes("noreply") ||
    value.includes("no-reply") ||
    value.includes("notification") ||
    value.includes("notifications") ||
    value.includes("mailer") ||
    value.includes("updates") ||
    value.includes("linkedin")
  );
}

function inferPriority(text: string) {
  const value = text.toLowerCase();

  if (
    /urgent|asap|immediately|critical|deadline|today|important|approve|blocked|priority/.test(
      value,
    )
  ) {
    return "HIGH";
  }

  if (
    /please|review|reply|confirm|meeting|schedule|follow up|update|response|share/.test(
      value,
    )
  ) {
    return "MEDIUM";
  }

  return "LOW";
}

function looksLikeReplyNeeded(text: string, fromEmail: string) {
  if (isAutomatedSender(fromEmail)) return false;

  return /please|can you|could you|let me know|reply|confirm|available|response|interested|call|meeting|connect|share|send|review/.test(
    text.toLowerCase(),
  );
}

function extractPossibleSender(command: string) {
  const text = command.trim();

  const patterns = [
    /sent by ([a-zA-Z0-9._%+\-\s]+)$/i,
    /from ([a-zA-Z0-9._%+\-\s]+)$/i,
    /by ([a-zA-Z0-9._%+\-\s]+)$/i,
    /email of ([a-zA-Z0-9._%+\-\s]+)$/i,
    /mail of ([a-zA-Z0-9._%+\-\s]+)$/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match?.[1]) {
      return match[1].trim().toLowerCase();
    }
  }

  return "";
}

function normalizeSearchValue(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9@.\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getSearchTerms(command: string, possibleSender: string) {
  const stopWords = new Set([
    "can",
    "you",
    "send",
    "me",
    "the",
    "emails",
    "email",
    "gmail",
    "mail",
    "sent",
    "send",
    "by",
    "from",
    "of",
    "to",
    "summarize",
    "summary",
    "please",
    "will",
    "would",
  ]);

  const source = possibleSender || command;

  return normalizeSearchValue(source)
    .split(" ")
    .map((word: string) => word.trim())
    .filter((word: string) => word.length >= 3)
    .filter((word: string) => !stopWords.has(word));
}

function emailSearchText(email: EmailRecord) {
  return normalizeSearchValue(
    [
      email.fromName || "",
      email.fromEmail || "",
      email.toEmails.join(" "),
      email.ccEmails.join(" "),
      email.subject || "",
      email.thread?.subject || "",
      email.snippet || "",
      email.bodyText || "",
      stripHtml(email.bodyHtml || ""),
    ].join(" "),
  );
}

function findRelevantEmails({
  emails,
  command,
  possibleSender,
}: {
  emails: EmailRecord[];
  command: string;
  possibleSender: string;
}) {
  const terms = getSearchTerms(command, possibleSender);

  if (!terms.length) return emails;

  return emails
    .map((email: EmailRecord): ScoredEmail => {
      const text = emailSearchText(email);

      const score = terms.reduce((total: number, term: string) => {
        return text.includes(term) ? total + 1 : total;
      }, 0);

      return {
        email,
        score,
      };
    })
    .filter((item: ScoredEmail) => item.score > 0)
    .sort((a: ScoredEmail, b: ScoredEmail) => b.score - a.score)
    .map((item: ScoredEmail) => item.email);
}

function isTodayCommand(command: string) {
  const value = command.toLowerCase();

  return (
    value.includes("today") ||
    value.includes("todays") ||
    value.includes("today's")
  );
}

async function getAppUser() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    throw new Error("Unauthorized");
  }

  const appUser = await prisma.user.findUnique({
    where: {
      clerkId: clerkUser.id,
    },
  });

  if (!appUser) {
    throw new Error("User not synced in database.");
  }

  return { clerkUser, appUser };
}

export async function POST(request: NextRequest) {
  try {
    const { appUser } = await getAppUser();

    const body = await request.json();
    const command = typeof body.command === "string" ? body.command.trim() : "";

    if (!command) {
      return NextResponse.json(
        {
          success: false,
          error: "Question is required.",
        },
        { status: 400 },
      );
    }

    const now = new Date();

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const possibleSender = extractPossibleSender(command);

    const emails = (await prisma.emailMessage.findMany({
      where: {
        userId: appUser.id,
      },
      orderBy: [
        {
          receivedAt: "desc",
        },
        {
          sentAt: "desc",
        },
      ],
      take: 200,
      include: {
        thread: true,
      },
    })) as EmailRecord[];

    const matchedEmails = findRelevantEmails({
      emails,
      command,
      possibleSender,
    });

    const relevantEmails = matchedEmails.length ? matchedEmails : emails;

    const todayEvents = (await prisma.calendarEvent.findMany({
      where: {
        userId: appUser.id,
        startTime: {
          gte: todayStart,
          lt: tomorrowStart,
        },
      },
      orderBy: {
        startTime: "asc",
      },
      take: 20,
    })) as CalendarEventRecord[];

    const upcomingEvents = (await prisma.calendarEvent.findMany({
      where: {
        userId: appUser.id,
        startTime: {
          gte: now,
        },
      },
      orderBy: {
        startTime: "asc",
      },
      take: 20,
    })) as CalendarEventRecord[];

    const recentEvents = (await prisma.calendarEvent.findMany({
      where: {
        userId: appUser.id,
      },
      orderBy: {
        startTime: "desc",
      },
      take: 20,
    })) as CalendarEventRecord[];

    const workflows = (await prisma.workflow.findMany({
      where: {
        userId: appUser.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 20,
    })) as WorkflowRecord[];

    const audits = (await prisma.auditLog.findMany({
      where: {
        userId: appUser.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    })) as AuditRecord[];

    const emailContext = relevantEmails
      .slice(0, 12)
      .map((email: EmailRecord, index: number) => {
        const emailBody = getEmailBody(email);
        const fullText = `${email.subject || ""} ${emailBody}`;
        const priority = inferPriority(fullText);
        const replyNeeded = looksLikeReplyNeeded(
          fullText,
          email.fromEmail || "",
        );

        return {
          index: index + 1,
          id: email.id,
          subject: email.subject || "(No subject)",
          from: `${email.fromName || "Unknown"} <${
            email.fromEmail || "unknown"
          }>`,
          receivedAt: formatDateTime(email.receivedAt),
          priority,
          replyNeeded,
          preview: emailBody.slice(0, 1200),
        };
      });

    const calendarContext = {
      today: todayEvents.map((event: CalendarEventRecord) => ({
        title: event.title,
        start: formatTime(event.startTime),
        end: formatTime(event.endTime),
        fullTime: formatDateTime(event.startTime),
        location: event.location || "",
        description: event.description || "",
        status: event.status || "",
        source: event.source || "",
      })),
      upcoming: upcomingEvents
        .slice(0, 10)
        .map((event: CalendarEventRecord) => ({
          title: event.title,
          start: formatDateTime(event.startTime),
          end: formatDateTime(event.endTime),
          location: event.location || "",
          description: event.description || "",
          status: event.status || "",
          source: event.source || "",
        })),
      recent: recentEvents.slice(0, 10).map((event: CalendarEventRecord) => ({
        title: event.title,
        start: formatDateTime(event.startTime),
        end: formatDateTime(event.endTime),
        location: event.location || "",
        description: event.description || "",
        status: event.status || "",
        source: event.source || "",
      })),
    };

    const workflowContext = workflows
      .slice(0, 10)
      .map((workflow: WorkflowRecord) => ({
        title: workflow.title,
        type: workflow.type,
        status: workflow.status,
        summary: workflow.summary || "",
        nextStep: workflow.nextStep || "",
        updatedAt: formatDateTime(workflow.updatedAt),
      }));

    const auditContext = audits.slice(0, 10).map((audit: AuditRecord) => ({
      event: audit.event,
      entityType: audit.entityType || "",
      entityId: audit.entityId || "",
      createdAt: formatDateTime(audit.createdAt),
    }));

    const openai = getOpenAIClient();

    const response = await openai.responses.create({
      model: OPENAI_MODEL,
      input: [
        {
          role: "system",
          content: `
You are pulse AI, a helpful workflow assistant inside the user's app.

You answer using only the provided app context:
- Gmail email context
- Google Calendar event context
- Workflow context
- Audit log context

Important behavior:
- Be concise but useful.
- For meeting prep, agenda, documents, and MoM, analyze the linked Gmail/source email context first.
- Do not create generic meeting advice.
- If the meeting is for internship, interview, placement, or selection, suggest resume/CV readiness, project explanation, role questions, timeline, responsibilities, and next steps.
- If the meeting is for an event, workshop, conference, webinar, or session, focus on event purpose, schedule, role, documents, and expectations.
- If the meeting is for a project or client discussion, focus on requirements, blockers, decisions, documents, and next actions.
- Agenda should explain the purpose of the meeting only from the linked email context.
- Documents should be suggested only from email context, attachments, or document-related wording. If no document is detected, say no clear document was found.
- If the user asks for meetings today, answer from today's calendar events.
- If the user asks to summarize Gmail/email from a person, use matching email context.
- If the user asks to generate a reply, draft a reply but do not say it was sent.
- If the user asks to create a meeting, explain the meeting suggestion and say it needs user approval in Inbox/Calendar.
- If data is not available, say clearly that it is not available in synced data.
- Never pretend an email was sent.
- Never pretend a meeting was created.
- Use friendly, simple language.
- Use bullets when it improves readability.
- The product name is "pulse AI".
- If the user asks to schedule, create, or book a meeting, do not say the meeting was created. Explain that pulse AI can prepare a meeting draft and the user must approve it before it is added to Google Calendar.
- If selected email context is provided, use it as the source of truth for meeting suggestions, replies, summaries, and documents.
          `.trim(),
        },
        {
          role: "user",
          content: `
User question:
${command}

Possible sender filter extracted from question:
${possibleSender || "none"}

Email context:
${JSON.stringify(emailContext, null, 2)}

Calendar context:
${JSON.stringify(calendarContext, null, 2)}

Workflow context:
${JSON.stringify(workflowContext, null, 2)}

Audit context:
${JSON.stringify(auditContext, null, 2)}

Today command:
${isTodayCommand(command) ? "yes" : "no"}

Answer the user directly.
          `.trim(),
        },
      ],
    });

    const answer =
      response.output_text?.trim() ||
      "I could not generate an answer from the synced workspace data.";

    return NextResponse.json({
      success: true,
      answer,
      meta: {
        matchedEmails: relevantEmails.length,
        totalEmails: emails.length,
        todayEvents: todayEvents.length,
        upcomingEvents: upcomingEvents.length,
        workflows: workflows.length,
        audits: audits.length,
      },
    });
  } catch (error) {
    console.error("PULSE_AI_COMMAND_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown pulse AI command error.",
      },
      {
        status:
          error instanceof Error && error.message === "Unauthorized"
            ? 401
            : 500,
      },
    );
  }
}