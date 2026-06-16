import { NextResponse } from "next/server";
import { setupCorsair } from "corsair";
import { corsair } from "@/lib/corsair";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    await corsairAny.keys.gmail.set_client_id(process.env.GOOGLE_CLIENT_ID);
    await corsairAny.keys.gmail.set_client_secret(
      process.env.GOOGLE_CLIENT_SECRET
    );

    return NextResponse.json({
      success: true,
      message: "Gmail integration credentials saved in Corsair.",
    });
  } catch (error) {
    console.error("CORSAIR_GMAIL_SETUP_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown Corsair Gmail setup error",
      },
      { status: 500 }
    );
  }
}