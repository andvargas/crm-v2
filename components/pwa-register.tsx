"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (["localhost", "127.0.0.1", "::1"].includes(window.location.hostname)) {
      navigator.serviceWorker.getRegistrations().then((registrations) => Promise.all(registrations.map((registration) => registration.unregister()))).catch(() => undefined);
      caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("studio-crm-")).map((key) => caches.delete(key)))).catch(() => undefined);
      return;
    }
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
  }, []);
  return null;
}
