"use client";

import { useOffline } from "next/offline";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const isOffline = useOffline();
  if (!isOffline) return null;
  return (
    <p role="status" className="flex items-center gap-2 bg-amber-tint px-4 py-2 text-sm text-ink md:px-10">
      <WifiOff aria-hidden size={16} />
      Sin conexión. Lo que registres se guarda y se envía cuando vuelva la señal.
    </p>
  );
}
