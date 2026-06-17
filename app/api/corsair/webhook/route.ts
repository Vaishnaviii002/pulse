import { NextResponse } from "next/server";
import { processWebhook } from "corsair";
import { corsair } from "@/lib/corsair";
import { syncFromWebhookPayload } from "@/lib/realtime-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeJsonParse(text: string) {
  if (!text.trim()) return {};

  try {
    return JSON.parse(text);
  } catch {
    return {
      rawBody: text,
    };
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Corsair webhook endpoint is live.",
    endpoint: "/api/corsair/webhook",
  });
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const debug = url.searchParams.get("debug") === "1";
  const skipCorsair = url.searchParams.get("skipCorsair") === "1";

  const headers = Object.fromEntries(request.headers.entries());
  const rawBody = await request.text();
  const body = safeJsonParse(rawBody);

  let corsairResponse: Response | null = null;
  let corsairError: string | null = null;

  if (!skipCorsair) {
    try {
      const result = await processWebhook(corsair, headers, body);
      corsairResponse = result?.response ?? null;
    } catch (error) {
      corsairError =
        error instanceof Error ? error.message : "Corsair webhook processing failed.";

      if (!debug) {
        return NextResponse.json(
          {
            success: false,
            error: corsairError,
          },
          { status: 500 }
        );
      }
    }
  }

  let appSync: unknown = null;

  try {
    appSync = await syncFromWebhookPayload({
      headers,
      body,
    });
  } catch (error) {
    appSync = {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Webhook received but app sync failed.",
    };
  }

  if (debug) {
    return NextResponse.json({
      success: true,
      corsairProcessed: Boolean(corsairResponse),
      corsairError,
      appSync,
    });
  }

  if (corsairResponse) {
    return corsairResponse;
  }

  return NextResponse.json({
    success: true,
    appSync,
  });
}