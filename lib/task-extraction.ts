import OpenAI from "openai";
import { prisma } from "@/lib/prisma";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type TaskType =
  | "GENERAL"
  | "EMAIL"
  | "FORM"
  | "ASSESSMENT"
  | "INTERVIEW"
  | "MEETING"
  | "FOLLOW_UP"
  | "PLACEMENT";

type TaskPriority = "HIGH" | "MEDIUM" | "LOW";

type ExtractedTask = {
  sourceEmailId: string;
  title: string;
  description: string;
  type: TaskType;
  priority: TaskPriority;
  dueAt: string | null;
  detectedAction: string;
  confidence: TaskPriority;
  relatedLink: string | null;
};

type EmailMessageItem = {
  id: string;
  externalMessageId: string | null;
  subject: string | null;
  snippet: string | null;
  bodyText: string | null;
  bodyHtml?: string | null;
  fromName: string | null;
  fromEmail: string | null;
  receivedAt: Date | null;
};

type ExistingTaskItem = {
  sourceEmailId: string | null;
  title: string;
};

type ParsedTaskResponse = {
  tasks?: ExtractedTask[];
};

function cleanEmailText(text: string) {
  return text
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim()
    .slice(0, 3500);
}

function extractLinks(text: string) {
  const matches = text.match(/https?:\/\/[^\s<>"')]+/gi) || [];
  return Array.from(new Set(matches)).slice(0, 8);
}

function safeParseJson(text: string): ParsedTaskResponse | null {
  try {
    return JSON.parse(text) as ParsedTaskResponse;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);

    if (!match) {
      return null;
    }

    try {
      return JSON.parse(match[0]) as ParsedTaskResponse;
    } catch {
      return null;
    }
  }
}

function normalizeTaskType(value: unknown): TaskType {
  const allowedTypes: TaskType[] = [
    "GENERAL",
    "EMAIL",
    "FORM",
    "ASSESSMENT",
    "INTERVIEW",
    "MEETING",
    "FOLLOW_UP",
    "PLACEMENT",
  ];

  return allowedTypes.includes(value as TaskType)
    ? (value as TaskType)
    : "GENERAL";
}

function normalizePriority(value: unknown): TaskPriority {
  const allowedPriorities: TaskPriority[] = ["HIGH", "MEDIUM", "LOW"];

  return allowedPriorities.includes(value as TaskPriority)
    ? (value as TaskPriority)
    : "MEDIUM";
}

export async function extractTasksFromRecentEmails({
  appUserId,
  limit = 40,
}: {
  appUserId: string;
  limit?: number;
}) {
  const emails = (await prisma.emailMessage.findMany({
    where: {
      userId: appUserId,
      direction: "INBOUND",
    },
    orderBy: {
      receivedAt: "desc",
    },
    take: limit,
  })) as EmailMessageItem[];

  if (!emails.length) {
    return {
      scanned: 0,
      extracted: 0,
      created: 0,
      skipped: 0,
    };
  }

  const emailIds = emails.map((email: EmailMessageItem) => email.id);

  const existingTasks = (await prisma.task.findMany({
    where: {
      userId: appUserId,
      source: "EMAIL",
      sourceEmailId: {
        in: emailIds,
      },
    },
    select: {
      sourceEmailId: true,
      title: true,
    },
  })) as ExistingTaskItem[];

  const existingKeys = new Set(
    existingTasks.map((task: ExistingTaskItem) => {
      return `${task.sourceEmailId || ""}::${task.title
        .toLowerCase()
        .trim()}`;
    }),
  );

  const now = new Date();

  const emailContext = emails
    .map((email: EmailMessageItem, index: number) => {
      const body = cleanEmailText(
        email.bodyText || email.snippet || "No body available.",
      );

      const links = extractLinks(
        `${email.bodyText || ""}\n${email.snippet || ""}`,
      );

      return `
EMAIL ${index + 1}
id: ${email.id}
from: ${email.fromName || ""} <${email.fromEmail || "unknown"}>
subject: ${email.subject || "(No subject)"}
receivedAt: ${email.receivedAt?.toISOString() || "Unknown"}
links:
${links.length ? links.join("\n") : "No links found"}
body:
${body}
      `.trim();
    })
    .join("\n\n---\n\n");

  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content: `
You are pulse AI task extraction engine.

Your job is to analyze synced Gmail emails and create real actionable tasks.

Current date/time: ${now.toISOString()}
User timezone context: India / Asia-Kolkata.

Create tasks for emails that require action, such as:
- Fill Google Form for placement, internship, college, company, recruitment, campus drive
- Assessment/test/coding round/quiz/assignment due at a specific or vague time
- Interview scheduled or interview preparation needed
- Meeting scheduled or meeting preparation needed
- Document submission
- Application deadline
- Reply/follow-up needed
- Payment, registration, confirmation, or form completion
- Student tasks like classes, assignments, scholarship updates, internship tasks
- Professional tasks like client follow-up, meeting prep, approval, report, deadline

Do NOT create tasks for:
- OTP or verification code only
- newsletters
- promotional offers
- generic FYI messages
- social notifications with no action
- ads
- emails already clearly completed

Important behavior:
- If an email says "assessment due at 6 PM", create an ASSESSMENT task and convert dueAt if the date is clear.
- If date is not clear, keep dueAt null and explain the vague deadline in description.
- If an email has a Google Form or form link, create a FORM or PLACEMENT task.
- If an interview is scheduled, create an INTERVIEW task.
- If it is a meeting invitation, create a MEETING task.
- If it requires reply, create a FOLLOW_UP task.
- Use specific titles, not generic titles.
- Include the related link if available.

Return only valid JSON:
{
  "tasks": [
    {
      "sourceEmailId": "email id exactly",
      "title": "short specific task title",
      "description": "clear explanation of what the user must do and why",
      "type": "GENERAL | EMAIL | FORM | ASSESSMENT | INTERVIEW | MEETING | FOLLOW_UP | PLACEMENT",
      "priority": "HIGH | MEDIUM | LOW",
      "dueAt": "ISO date string if clearly known, otherwise null",
      "detectedAction": "what action was detected",
      "confidence": "HIGH | MEDIUM | LOW",
      "relatedLink": "most relevant form/meeting/assessment link or null"
    }
  ]
}
        `.trim(),
      },
      {
        role: "user",
        content: emailContext,
      },
    ],
  });

  const parsed = safeParseJson(response.output_text || "");

  const extractedTasks = Array.isArray(parsed?.tasks)
    ? parsed.tasks
    : [];

  let created = 0;
  let skipped = 0;

  for (const task of extractedTasks) {
    const sourceEmail = emails.find(
      (email: EmailMessageItem) => email.id === task.sourceEmailId,
    );

    if (!sourceEmail || !task.title?.trim()) {
      skipped += 1;
      continue;
    }

    const key = `${sourceEmail.id}::${task.title.toLowerCase().trim()}`;

    if (existingKeys.has(key)) {
      skipped += 1;
      continue;
    }

    const dueAt = task.dueAt ? new Date(task.dueAt) : null;

    await prisma.task.create({
      data: {
        userId: appUserId,
        title: task.title.trim(),
        description: task.description?.trim() || "",
        type: normalizeTaskType(task.type),
        priority: normalizePriority(task.priority),
        status: "OPEN",
        dueAt: dueAt && !Number.isNaN(dueAt.getTime()) ? dueAt : null,
        source: "EMAIL",
        sourceEmailId: sourceEmail.id,
        sourceEmailSubject: sourceEmail.subject || "(No subject)",
        sourceEmailFrom:
          sourceEmail.fromName || sourceEmail.fromEmail || "Unknown sender",
        metadata: {
          extractedBy: "pulse AI",
          extractedAt: new Date().toISOString(),
          detectedAction: task.detectedAction || "",
          confidence: normalizePriority(task.confidence),
          relatedLink: task.relatedLink || null,
          emailExternalMessageId: sourceEmail.externalMessageId,
        },
      },
    });

    existingKeys.add(key);
    created += 1;
  }

  return {
    scanned: emails.length,
    extracted: extractedTasks.length,
    created,
    skipped,
  };
}