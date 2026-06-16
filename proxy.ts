import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/pulse-ai(.*)",
  "/inbox(.*)",
  "/meetings(.*)",
  "/calendar(.*)",
  "/workflow(.*)",
  "/settings(.*)",
  "/api/user/sync(.*)",
  "/api/corsair(.*)",
  "/api/gmail(.*)",
  "/api/ai(.*)",
  "/api/calendar(.*)",
  "/api/pulse-ai(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};