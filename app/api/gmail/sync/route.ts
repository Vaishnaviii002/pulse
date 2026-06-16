import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncLatestGmailForUser } from "@/lib/gmail-sync";

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

export async function POST() {
  try {
    const { clerkUser, appUser } = await getAppUser();

    const result = await syncLatestGmailForUser({
      clerkUserId: clerkUser.id,
      appUserId: appUser.id,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("GMAIL_SYNC_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown Gmail sync error",
      },
      { status: 500 }
    );
  }
}