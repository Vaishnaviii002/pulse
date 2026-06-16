import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
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
        { success: false, error: "User not synced in database." },
        { status: 400 }
      );
    }

    const workflows = await prisma.workflow.findMany({
      where: {
        userId: appUser.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 50,
      include: {
        emailThread: true,
        emailMessage: true,
        calendarEvent: true,
        actions: {
          orderBy: {
            createdAt: "desc",
          },
        },
        approvals: {
          orderBy: {
            createdAt: "desc",
          },
        },
        auditLogs: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    const stats = {
      total: workflows.length,
      completed: workflows.filter((workflow) => workflow.status === "COMPLETED")
        .length,
      pending: workflows.filter((workflow) =>
        ["DETECTED", "SUGGESTED", "PENDING", "APPROVED"].includes(
          workflow.status
        )
      ).length,
      failed: workflows.filter((workflow) => workflow.status === "FAILED")
        .length,
    };

    return NextResponse.json({
      success: true,
      stats,
      workflows,
    });
  } catch (error) {
    console.error("WORKFLOWS_GET_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown workflow load error",
      },
      { status: 500 }
    );
  }
}