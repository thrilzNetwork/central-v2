"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Lock, Timer } from "lucide-react";

export function TrialGuard({
  children,
  trialExpiresAt,
  isActive,
}: {
  children: React.ReactNode;
  trialExpiresAt: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number } | null>(null);

  const expiresOn = new Date(trialExpiresAt).getTime();
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const checkExpiration = () => {
      const now = Date.now();
      const expired = now >= expiresOn || !isActive;
      setIsExpired(expired);
      return expired;
    };

    const currentExpired = checkExpiration();
    if (currentExpired && pathname !== "/dashboard/facturacion") {
      router.push("/dashboard/facturacion?expired=true");
    }
  }, [expiresOn, isActive, pathname, router]);

  useEffect(() => {
    const calcTime = () => {
      const now = Date.now();
      const diff = expiresOn - now;
      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        });
      } else {
        setTimeLeft(null);
      }
    };
    calcTime();
    const interval = setInterval(calcTime, 60000);
    return () => clearInterval(interval);
  }, [expiresOn]);

  // If expired, and we aren't on billing page yet, render a hard wall overlay momentarily
  // to avoid flashing standard dashboard content before the router pushes.
  if (isExpired && pathname !== "/dashboard/facturacion") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in">
        <div className="w-16 h-16 bg-[#FEF2F2] rounded-full flex items-center justify-center mb-6">
          <Lock className="w-8 h-8 text-[#DC2626]" />
        </div>
        <h2 className="text-3xl font-serif text-[#262626] mb-3">Tu oficina ha sido pausada</h2>
        <p className="text-[#6B7565] max-w-md mx-auto mb-8">
          Tu período de prueba ha concluido. Reactiva tu portal para recibir clientes, propiedades y leads inmediatamente.
        </p>
      </div>
    );
  }

  return (
    <>
      {timeLeft && !isExpired && (
        <div className="bg-[#FFF7F0] border-b border-[#FF7F11]/20 px-4 py-3 flex items-center justify-center gap-4 sticky top-0 z-40">
          <div className="flex items-center gap-2 text-sm text-[#9A4E00] font-medium">
            <Timer className="w-4 h-4 animate-pulse" />
            <span>Tu prueba gratuita expira en {timeLeft.days} días, {timeLeft.hours} hrs.</span>
          </div>
          <Link
            href="/dashboard/facturacion"
            className="text-xs bg-[#FF7F11] text-white px-3 py-1.5 rounded-sm hover:bg-[#CC6500] transition-colors"
          >
            Reclamar Ahora
          </Link>
        </div>
      )}
      {children}
    </>
  );
}
