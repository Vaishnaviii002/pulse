import { NextResponse } from "next/server";
import { setupCorsair } from "corsair";
import { corsair } from "@/lib/corsair";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

export async function GET() {
  try {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET",
        },
        { status: 500 }
      );
    }

    await setupCorsair(corsair);

    const corsairAny = corsair as any;
    const calendarKeys = getCalendarKeys(corsairAny);

    await calendarKeys.set_client_id(process.env.GOOGLE_CLIENT_ID);
    await calendarKeys.set_client_secret(process.env.GOOGLE_CLIENT_SECRET);

    return NextResponse.json({
      success: true,
      message: "Google Calendar integration credentials saved in Corsair.",
    });
  } catch (error) {
    console.error("CORSAIR_CALENDAR_SETUP_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown Corsair Calendar setup error",
      },
      { status: 500 }
    );
  }
}