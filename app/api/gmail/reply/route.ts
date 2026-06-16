import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendApprovedGmailReply } from "@/lib/gmail-reply";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  return {
    clerkUser,
    appUser,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { clerkUser, appUser } = await getAppUser();

    const body = await request.json();

    const messageId =
      typeof body.messageId === "string" ? body.messageId.trim() : "";

    const replyBody =
      typeof body.replyBody === "string" ? body.replyBody.trim() : "";

    if (!messageId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing messageId",
        },
        { status: 400 }
      );
    }

    if (!replyBody) {
      return NextResponse.json(
        {
          success: false,
          error: "Reply body cannot be empty.",
        },
        { status: 400 }
      );
    }

    const result = await sendApprovedGmailReply({
      clerkUserId: clerkUser.id,
      appUserId: appUser.id,
      messageId,
      replyBody,
    });

    return NextResponse.json({
      success: true,
      message: "Gmail reply sent successfully.",
      sentMessage: {
        id: result.sentMessage.id,
        externalMessageId: result.sentMessage.externalMessageId,
        subject: result.sentMessage.subject,
        toEmails: result.sentMessage.toEmails,
        sentAt: result.sentMessage.sentAt,
      },
      workflow: {
        id: result.workflow.id,
        status: "COMPLETED",
      },
      action: {
        id: result.action.id,
        status: "COMPLETED",
      },
      gmail: result.gmail,
    });
  } catch (error) {
    console.error("GMAIL_REPLY_ERROR:", error);

    const message =
      error instanceof Error ? error.message : "Unknown Gmail reply error";

    const status =
      message === "Unauthorized"
        ? 401
        : message.includes("not found")
          ? 404
          : message.includes("not connected")
            ? 400
            : 500;

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status }
    );
  }
}