import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#F7F5EE] flex">
      {/* Left — editorial visual panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#262626] relative overflow-hidden flex-col justify-between p-14">
        {/* Grain */}
        <div
          className="absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Orange accent strip */}
        <div className="absolute top-0 left-0 w-1 h-full bg-[#FF7F11]" />

        {/* Logo */}
        <div>
          <span className="label-caps text-[#ACBFA4] tracking-[0.2em]">Central</span>
          <div className="mt-2 w-10 h-px bg-[#FF7F11]" />
        </div>

        {/* Editorial headline */}
        <div>
          <h1
            className="text-white leading-tight mb-8"
            style={{
              fontFamily: "Cormorant Garamond, Georgia, serif",
              fontSize: "clamp(2.5rem, 3.5vw, 4.5rem)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
            }}
          >
            El mercado
            <br />
            <em style={{ color: "#FF7F11", fontStyle: "italic" }}>inmobiliario</em>
            <br />
            que merecías.
          </h1>
          <p className="text-[#ACBFA4] text-sm leading-relaxed max-w-xs">
            Tecnología de punta para el agente boliviano moderno. Tu marca,
            tu portal, tus leads — todo en un solo lugar.
          </p>
        </div>

        {/* Bottom tagline */}
        <div className="flex items-center gap-3">
          <div className="w-6 h-px bg-[#FF7F11]" />
          <span className="label-caps text-[#6B7565]">
            Hecho en Bolivia &mdash; para Bolivia
          </span>
        </div>
      </div>

      {/* Right — form panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-14">
        {children}
      </div>
    </div>
  );
}
