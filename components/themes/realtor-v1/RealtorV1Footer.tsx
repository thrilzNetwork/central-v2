"use client";

import { useTenant } from "@/components/themes/TenantContext";
import Link from "next/link";

export function RealtorV1Footer() {
  const { profile } = useTenant();

  return (
    <footer className="bg-[#1a1a1a] text-[#6B7565] py-10 border-t border-white/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <p className="text-sm text-white mb-1">{profile.full_name}</p>
          <p className="label-caps">{profile.city} · Bolivia</p>
        </div>

        <div className="flex flex-wrap gap-6">
          <Link href="/" className="label-caps hover:text-white transition-colors">Inicio</Link>
          <Link href="/propiedades" className="label-caps hover:text-white transition-colors">Inmuebles</Link>
          <Link href="#contacto" className="label-caps hover:text-white transition-colors">Contacto</Link>
        </div>

        <div className="text-xs">
          <p>
            Powered by{" "}
            <a
              href="https://central.bo"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
              style={{ color: profile.primary_color }}
            >
              Central
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
