import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractTasksFromRecentEmails } from "@/lib/task-extraction";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized. Please sign in again.",
        },
        { status: 401 }
      );
    }

    const appUser = await prisma.user.findUnique({
      where: {
        clerkId: clerkUser.id,
      },
    });

    if (!appUser) {
      return NextResponse.json(
        {
          success: false,
          error: "User not synced in database.",
        },
        { status: 404 }
      );
    }

    const result = await extractTasksFromRecentEmails({
      appUserId: appUser.id,
      limit: 40,
    });

    return NextResponse.json({
      success: true,
      message: "Email task extraction completed.",
      ...result,
    });
  } catch (error) {
    console.error("TASK_EXTRACTION_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to extract tasks from emails.",
      },
      { status: 500 }
    );
  }
}