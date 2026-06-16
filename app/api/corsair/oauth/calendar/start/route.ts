import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { setupCorsair } from "corsair";
import { generateOAuthUrl } from "corsair/oauth";
import { corsair } from "@/lib/corsair";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

function getCalendarKeys(corsairAny: any) {
  const keys =
    corsairAny.keys?.googlecalendar ||
    corsairAny.keys?.googleCalendar ||
    corsairAny.keys?.calendar;

  if (!keys?.set_client_id || !keys?.set_client_secret) {
    throw new Error(
      `Corsair Google Calendar keys namespace not found. Available keys: ${Object.keys(
        corsairAny.keys || {}
      ).join(", ")}`
    );
  }

  return keys;
}

async function ensureCalendarCredentials() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
  }

  await setupCorsair(corsair);

  const corsairAny = corsair as any;
  const calendarKeys = getCalendarKeys(corsairAny);

  await calendarKeys.set_client_id(process.env.GOOGLE_CLIENT_ID);
  await calendarKeys.set_client_secret(process.env.GOOGLE_CLIENT_SECRET);
}

export async function GET(_request: NextRequest) {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureCalendarCredentials();

    const redirectUri = `${getAppUrl()}/api/corsair/oauth/calendar/callback`;

    const { url, state } = await generateOAuthUrl(corsair, "googlecalendar", {
      tenantId: clerkUser.id,
      redirectUri,
    });

    const response = NextResponse.redirect(url);

    response.cookies.set("calendar_oauth_state", state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 10,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("CALENDAR_OAUTH_START_ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to start Google Calendar OAuth",
      },
      { status: 500 }
    );
  }
}