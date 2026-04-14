"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTenant } from "@/components/themes/TenantContext";
import { Menu, X, MessageSquare } from "lucide-react";

const NAV_LINKS = [
  { href: "#inicio",    label: "Inicio" },
  { href: "#inmuebles", label: "Inmuebles" },
  { href: "#mapa",      label: "Mapa" },
  { href: "#contacto",  label: "Contacto" },
];

export function RealtorV1Header() {
  const { profile } = useTenant();
  const [menuOpen, setMenuOpen] = useState(false);

  const primary = profile.primary_color ?? "#FF7F11";
  const waUrl   = profile.whatsapp
    ? `https://wa.me/${profile.whatsapp.replace(/\D/g, "")}`
    : "#";

  const brokerName     = profile.broker_name;
  const brokerLogoUrl  = profile.broker_logo_url;
  const brokerCode     = profile.broker_agent_code;

  const hasBroker = !!(brokerName || brokerLogoUrl);

  const serif = "'Noto Serif', Georgia, serif";
  const sans  = "'Manrope', system-ui, sans-serif";

  return (
    <>
      <header
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          background: "rgba(18,18,18,0.96)", backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>

            {/* ── Left: Realtor name + broker tag ───────────────────── */}
            <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 14 }}>
              {/* Broker logo OR realtor logo / initial */}
              {hasBroker && brokerLogoUrl ? (
                <Image
                  src={brokerLogoUrl}
                  alt={brokerName ?? "Broker"}
                  width={120}
                  height={40}
                  style={{ objectFit: "contain", maxHeight: 40 }}
                />
              ) : profile.logo_url ? (
                <Image
                  src={profile.logo_url}
                  alt={profile.full_name}
                  width={40}
                  height={40}
                  style={{ objectFit: "contain", borderRadius: 4 }}
                />
              ) : (
                <div
                  style={{
                    width: 38, height: 38, borderRadius: 4, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    backgroundColor: primary, color: "#fff",
                    fontFamily: serif, fontSize: "1rem", fontWeight: 500,
                  }}
                >
                  {profile.full_name[0]?.toUpperCase()}
                </div>
              )}

              {/* Name stack */}
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {/* Realtor name — always prominent on top */}
                <span style={{
                  fontFamily: serif, fontSize: "0.95rem", letterSpacing: "0.04em",
                  color: "#fff", lineHeight: 1.2,
                }}>
                  {profile.full_name}
                </span>

                {/* Broker name + code below */}
                {hasBroker && (
                  <span style={{
                    fontFamily: sans, fontSize: "0.58rem", letterSpacing: "0.22em",
                    textTransform: "uppercase", color: primary, lineHeight: 1,
                  }}>
                    {brokerName ?? ""}{brokerCode ? ` · ${brokerCode}` : ""}
                  </span>
                )}
                {!hasBroker && profile.city && (
                  <span style={{
                    fontFamily: sans, fontSize: "0.58rem", letterSpacing: "0.22em",
                    textTransform: "uppercase", color: "#555",
                  }}>
                    {profile.city}
                  </span>
                )}
              </div>
            </Link>

            {/* ── Center: desktop nav ───────────────────────────────── */}
            <nav className="hidden md:flex" style={{ display: "flex", alignItems: "center", gap: 32 }}>
              {NAV_LINKS.map((l) => (
                <a key={l.href} href={l.href}
                  style={{ fontFamily: sans, fontSize: "0.62rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "#888", textDecoration: "none", transition: "color 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#888")}
                >{l.label}</a>
              ))}
            </nav>

            {/* ── Right: WhatsApp CTA + mobile toggle ───────────────── */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {profile.whatsapp && (
                <a href={waUrl} target="_blank" rel="noopener noreferrer"
                  className="hidden sm:flex"
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    backgroundColor: primary, color: "#fff",
                    padding: "0.55rem 1.25rem", borderRadius: 2,
                    fontFamily: sans, fontSize: "0.62rem", letterSpacing: "0.16em",
                    textTransform: "uppercase", fontWeight: 700, textDecoration: "none",
                    transition: "opacity 0.2s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
                  onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                >
                  <MessageSquare size={15} />
                </a>
              )}

              {/* Mobile menu toggle */}
              <button onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden"
                style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 4 }}
              >
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile menu ─────────────────────────────────────────── */}
        {menuOpen && (
          <div style={{ background: "#0f0f0f", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "1.25rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {NAV_LINKS.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
                  style={{ fontFamily: sans, fontSize: "0.68rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#888", textDecoration: "none" }}
                >{l.label}</a>
              ))}
              {profile.whatsapp && (
                <a href={waUrl} target="_blank" rel="noopener noreferrer"
                  style={{
                    backgroundColor: primary, color: "#fff", padding: "0.85rem",
                    textAlign: "center", fontFamily: sans, fontSize: "0.68rem",
                    letterSpacing: "0.15em", textTransform: "uppercase",
                    textDecoration: "none", fontWeight: 700, marginTop: 4,
                  }}
                >Contactar por WhatsApp</a>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Spacer */}
      <div style={{ height: 64 }} />
    </>
  );
}
