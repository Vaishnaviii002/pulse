"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";

export function SyncUser() {
  const { isLoaded, isSignedIn } = useUser();
  const hasSynced = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || hasSynced.current) return;

    hasSynced.current = true;

    async function syncUser() {
      try {
        const res = await fetch("/api/user/sync", {
          method: "POST",
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          console.log("User sync failed:", data);
          return;
        }

        console.log("User synced:", data);
      } catch (error) {
        console.log("Failed to sync user:", error);
      }
    }

    syncUser();
  }, [isLoaded, isSignedIn]);

  return null;
}