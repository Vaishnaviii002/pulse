import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userCount = await prisma.user.count();

    return NextResponse.json({
      success: true,
      databaseConnected: true,
      userCount,
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      hasDirectUrl: Boolean(process.env.DIRECT_URL),
    });
  } catch (error) {
    console.error("USER_SYNC_GET_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown database test error",
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: no Clerk user found" },
        { status: 401 }
      );
    }

    const email = clerkUser.primaryEmailAddress?.emailAddress;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "No primary email found on Clerk user" },
        { status: 400 }
      );
    }

    const name =
      clerkUser.fullName ||
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
      "pulse user";

    const syncedUser = await prisma.user.upsert({
      where: {
        clerkId: clerkUser.id,
      },
      update: {
        email,
        name,
        imageUrl: clerkUser.imageUrl,
      },
      create: {
        clerkId: clerkUser.id,
        email,
        name,
        imageUrl: clerkUser.imageUrl,
        workspaceName: "Personal Workspace",
      },
    });

    return NextResponse.json({
      success: true,
      user: syncedUser,
    });
  } catch (error) {
    console.error("USER_SYNC_POST_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown user sync server error",
      },
      { status: 500 }
    );
  }
}