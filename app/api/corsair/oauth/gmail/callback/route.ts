import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { processOAuthCallback } from "corsair/oauth";
import { corsair } from "@/lib/corsair";
import { prisma } from "@/lib/prisma";
import { syncLatestGmailForUser } from "@/lib/gmail-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

async function getOrCreateAppUser() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    throw new Error("Unauthorized");
  }

  const email = clerkUser.primaryEmailAddress?.emailAddress;

  if (!email) {
    throw new Error("No primary email found");
  }

  const name =
    clerkUser.fullName ||
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    "pulse user";

  const appUser = await prisma.user.upsert({
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

  return { clerkUser, appUser, email };
}

export async function GET(request: NextRequest) {
  const appUrl = getAppUrl();
  const inboxUrl = `${appUrl}/inbox`;
  const settingsUrl = `${appUrl}/settings`;

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    const responseError = (message: string) => {
      const response = NextResponse.redirect(
        `${settingsUrl}?gmail=error&message=${encodeURIComponent(message)}`
      );
      response.cookies.delete("oauth_state");
      return response;
    };

    if (error) {
      return responseError(error);
    }

    if (!code || !state) {
      return responseError("Missing OAuth code or state");
    }

    const storedState = request.cookies.get("oauth_state")?.value;

    if (!storedState || storedState !== state) {
      return responseError("Invalid OAuth state");
    }

    const { clerkUser, appUser, email } = await getOrCreateAppUser();

    const redirectUri = `${appUrl}/api/corsair/oauth/gmail/callback`;

    const result = await processOAuthCallback(corsair, {
      code,
      state,
      redirectUri,
    });

    const resultAny = result as any;

    await prisma.connectedAccount.upsert({
      where: {
        userId_provider: {
          userId: appUser.id,
          provider: "CORSAIR_GMAIL",
        },
      },
      update: {
        status: "CONNECTED",
        accountEmail: email,
        externalAccountId: clerkUser.id,
        metadata: {
          corsairPlugin: resultAny?.plugin || "gmail",
          corsairTenantId: resultAny?.tenantId || clerkUser.id,
          connectedAt: new Date().toISOString(),
        },
      },
      create: {
        userId: appUser.id,
        provider: "CORSAIR_GMAIL",
        status: "CONNECTED",
        accountEmail: email,
        externalAccountId: clerkUser.id,
        scopes: [],
        metadata: {
          corsairPlugin: resultAny?.plugin || "gmail",
          corsairTenantId: resultAny?.tenantId || clerkUser.id,
          connectedAt: new Date().toISOString(),
        },
      },
    });

    let synced = 0;

    try {
      const syncResult = await syncLatestGmailForUser({
        clerkUserId: clerkUser.id,
        appUserId: appUser.id,
      });

      synced = syncResult.saved;
    } catch (syncError) {
      console.error("GMAIL_AUTO_SYNC_AFTER_CONNECT_ERROR:", syncError);
    }

    const response = NextResponse.redirect(
      `${inboxUrl}?gmail=connected&synced=${synced}`
    );
    response.cookies.delete("oauth_state");
    return response;
  } catch (error) {
    console.error("GMAIL_OAUTH_CALLBACK_ERROR:", error);

    const response = NextResponse.redirect(
      `${settingsUrl}?gmail=error&message=${encodeURIComponent(
        error instanceof Error ? error.message : "Gmail connection failed"
      )}`
    );
    response.cookies.delete("oauth_state");
    return response;
  }
}