"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AuthGate } from "../components/auth-gate";
import { PwaRegister } from "../components/pwa-register";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
  }));
  return <QueryClientProvider client={queryClient}><PwaRegister /><AuthGate>{children}</AuthGate></QueryClientProvider>;
}
