import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { generateOAuthUrl } from "corsair/oauth";
import { corsair } from "@/lib/corsair";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export async function GET(_request: NextRequest) {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const redirectUri = `${getAppUrl()}/api/corsair/oauth/gmail/callback`;

    const { url, state } = await generateOAuthUrl(corsair, "gmail", {
      tenantId: clerkUser.id,
      redirectUri,
    });

    const response = NextResponse.redirect(url);

    response.cookies.set("oauth_state", state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 10,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("GMAIL_OAUTH_START_ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to start Gmail OAuth",
      },
      { status: 500 }
    );
  }
}