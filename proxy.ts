import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/pulse-ai(.*)",
  "/inbox(.*)",
  "/meetings(.*)",
  "/calendar(.*)",
  "/workflow(.*)",
  "/settings(.*)",

  "/api/user/sync(.*)",
  "/api/gmail(.*)",
  "/api/calendar(.*)",
  "/api/workflows(.*)",
  "/api/pulse-ai(.*)",
  "/api/ai(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const pathname = req.nextUrl.pathname;

  if (!isProtectedRoute(req)) {
    return NextResponse.next();
  }

  if (!userId) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized. Please sign in again.",
        },
        { status: 401 }
      );
    }

    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};