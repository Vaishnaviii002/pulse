"use client";

import { useEffect, useRef } from "react";

const AUTO_SYNC_STORAGE_KEY = "pulse-last-auto-sync-at";
const AUTO_SYNC_INTERVAL_MS = 60_000;
const AUTO_SYNC_MIN_GAP_MS = 25_000;

async function runPulseAutoSync() {
  const now = Date.now();
  const lastSync = Number(
    window.localStorage.getItem(AUTO_SYNC_STORAGE_KEY) || "0"
  );

  if (now - lastSync < AUTO_SYNC_MIN_GAP_MS) {
    return;
  }

  window.localStorage.setItem(AUTO_SYNC_STORAGE_KEY, String(now));

  const response = await fetch("/api/realtime/sync", {
    method: "POST",
  });

  const text = await response.text();

  let data: unknown = null;

  try {
    data = JSON.parse(text);
  } catch {
    data = {
      success: false,
      error: text,
    };
  }

  window.dispatchEvent(
    new CustomEvent("pulse:auto-sync-complete", {
      detail: data,
    })
  );

  return data;
}

export function AutoRealtimeSync() {
  const isRunningRef = useRef(false);

  useEffect(() => {
    async function syncSafely() {
      if (isRunningRef.current) return;
      if (document.visibilityState !== "visible") return;

      try {
        isRunningRef.current = true;
        await runPulseAutoSync();
      } catch (error) {
        console.warn("pulse auto sync failed:", error);
      } finally {
        isRunningRef.current = false;
      }
    }

    void syncSafely();

    const intervalId = window.setInterval(() => {
      void syncSafely();
    }, AUTO_SYNC_INTERVAL_MS);

    function handleFocus() {
      void syncSafely();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void syncSafely();
      }
    }

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return null;
}