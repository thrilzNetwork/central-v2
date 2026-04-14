"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "motion/react";
import { useTenant } from "@/components/themes/TenantContext";
import {
  Home, Key, Building, LandPlot, Sprout, Compass,
  MessageSquare, Mail, MapPin, ChevronDown,
} from "lucide-react";
import { HeartButton } from "@/components/property/HeartButton";
import { ChatWidget } from "@/components/themes/realtor-v1/ChatWidget";
import type { Listing } from "@/types/tenant";

// Dynamic map to avoid SSR issues with Leaflet
const RealtorMap = dynamic(() => import("./MapInner"), { ssr: false, loading: () => (
  <div style={{ width: "100%", height: "100%", minHeight: 400, background: "#161616", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <span style={{ color: "#444", fontSize: "0.8rem", letterSpacing: "0.1em" }}>Cargando mapa…</span>
  </div>
) });

interface RealtorV1PageProps { listings: Partial<Listing>[]; }

// ─── Fallback hero images ─────────────────────────────────────
const FALLBACK_HERO = [
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=1920&auto=format&fit=crop",
];

// ─── Services (static, always shown) ─────────────────────────
const SERVICES = [
  { icon: Home,     label: "Casas" },
  { icon: Key,      label: "Renta" },
  { icon: Building, label: "Departamentos" },
  { icon: LandPlot, label: "Terrenos" },
  { icon: Sprout,   label: "Agrícola" },
  { icon: Compass,  label: "Proyectos" },
];

// ─── Animations ───────────────────────────────────────────────
const fadeUp = {
  hidden:  { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: "easeOut" as const } },
};
const stagger = { visible: { transition: { staggerChildren: 0.09 } } };

// ─── Fade‑in wrapper ─────────────────────────────────────────
function FadeIn({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial="hidden" whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={stagger}
    >
      {children}
    </motion.div>
  );
}

// ─── Property Card ────────────────────────────────────────────
function PropertyCard({ listing, primary, profileId, fmt }: {
  listing: Partial<Listing>;
  primary: string;
  profileId: string;
  fmt: (p?: number | null, c?: string | null) => string | null;
}) {
  const img  = listing.images?.[0];
  const price = fmt(listing.price, listing.currency);

  return (
    <motion.div variants={fadeUp} style={{ background: "#1a1a1a", borderRadius: 2, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Image */}
      <a href={`/propiedades/${listing.slug}`} style={{ display: "block", position: "relative", aspectRatio: "16/10", overflow: "hidden", flexShrink: 0 }}>
        {img
          ? <img src={img} alt={listing.title ?? ""} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" }}
              onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.06)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
            />
          : <div style={{ width: "100%", height: "100%", background: "#2a2a2a", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Home size={28} style={{ color: "#444" }} />
            </div>
        }
        {/* Status badge */}
        {listing.status && (
          <span style={{
            position: "absolute", top: 10, left: 10,
            background: listing.status === "activo" ? primary : "#4b5563",
            color: "#fff", fontSize: "9px", padding: "3px 8px", letterSpacing: "0.14em", textTransform: "uppercase",
          }}>{listing.status}</span>
        )}
        {/* Heart */}
        <div style={{ position: "absolute", top: 8, right: 8 }}>
          <HeartButton listingId={listing.id!} profileId={profileId} hearts={listing.hearts ?? 0} />
        </div>
      </a>

      {/* Info */}
      <div style={{ padding: "1rem 1.1rem 1.25rem", display: "flex", flexDirection: "column", gap: 5, flex: 1 }}>
        <span style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: primary }}>{listing.property_type}</span>
        <a href={`/propiedades/${listing.slug}`} style={{ textDecoration: "none" }}>
          <h3 style={{ fontFamily: "'Noto Serif',Georgia,serif", fontSize: "0.95rem", fontWeight: 400, color: "#fff", lineHeight: 1.35, margin: 0 }}>{listing.title}</h3>
        </a>
        {listing.neighborhood && (
          <p style={{ fontSize: "0.72rem", color: "#555", margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
            <MapPin size={10} style={{ color: "#555", flexShrink: 0 }} /> {listing.neighborhood}
          </p>
        )}
        {price && (
          <p style={{ fontFamily: "'Manrope',sans-serif", fontSize: "1rem", fontWeight: 700, color: "#fff", margin: "4px 0 0" }}>{price}</p>
        )}
        {(listing.bedrooms || listing.bathrooms || listing.area_m2) && (
          <div style={{ display: "flex", gap: 12, fontSize: "0.7rem", color: "#555", marginTop: 4 }}>
            {listing.bedrooms  && <span>{listing.bedrooms}  hab</span>}
            {listing.bathrooms && <span>{listing.bathrooms} baños</span>}
            {listing.area_m2   && <span>{listing.area_m2} m²</span>}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Contact Info Row ─────────────────────────────────────────
function ContactRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
      <div style={{ marginTop: 2 }}>{icon}</div>
      <div>
        <p style={{ fontSize: "0.58rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#555", marginBottom: 2, fontFamily: "'Manrope',sans-serif" }}>{label}</p>
        <div>{value}</div>
      </div>
    </div>
  );
}

// ─── Contact Form ─────────────────────────────────────────────
function ContactForm({ profileId, primary }: { profileId: string; primary: string }) {
  const sans = "'Manrope',system-ui,sans-serif";
  const [name, setName]     = useState("");
  const [email, setEmail]   = useState("");
  const [msg, setMsg]       = useState("");
  const [sent, setSent]     = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitor_name: name, visitor_email: email, notes: msg, profile_id: profileId }),
      });
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "#1e1e1e", border: "1px solid rgba(255,255,255,0.08)",
    color: "#fff", padding: "0.8rem 1rem", fontFamily: sans, fontSize: "0.85rem",
    outline: "none", boxSizing: "border-box",
  };

  if (sent) return (
    <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
      <p style={{ fontFamily: "'Noto Serif',Georgia,serif", fontSize: "1.4rem", marginBottom: "0.5rem" }}>¡Gracias!</p>
      <p style={{ fontFamily: sans, fontSize: "0.85rem", color: "#666" }}>Le responderemos a la brevedad.</p>
    </div>
  );

  return (
    <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <input placeholder="Nombre" value={name} onChange={e => setName(e.target.value)} required style={inputStyle} />
      <input placeholder="Correo electrónico" type="email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
      <textarea placeholder="Mensaje" value={msg} onChange={e => setMsg(e.target.value)} rows={4} style={{ ...inputStyle, resize: "none" }} />
      <motion.button type="submit" disabled={loading}
        whileHover={{ opacity: 0.88 }} whileTap={{ scale: 0.97 }}
        style={{ background: primary, color: "#fff", border: "none", padding: "0.95rem", fontFamily: sans, fontSize: "0.68rem", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, cursor: "pointer" }}
      >{loading ? "Enviando…" : "Enviar Mensaje"}</motion.button>
    </form>
  );
}

// ─── Main Component ───────────────────────────────────────────
export function RealtorV1Page({ listings }: RealtorV1PageProps) {
  const { profile } = useTenant();
  const [heroIdx, setHeroIdx] = useState(0);
  const [filter,  setFilter]  = useState("");
  const [scrolled, setScrolled] = useState(false);

  const primary  = profile.primary_color ?? "#FF7F11";
  const serif    = "'Noto Serif', Georgia, serif";
  const sans     = "'Manrope', system-ui, sans-serif";
  const waUrl    = profile.whatsapp ? `https://wa.me/${profile.whatsapp.replace(/\D/g, "")}` : "#";

  // Pull customised content from profile
  const heroTitle    = profile.hero_title    ?? "Aquí encontrarás";
  const heroHeadline = profile.hero_headline ?? "tu hogar";
  const heroSubtitle = profile.hero_subtitle ?? null;
  const heroImages   = profile.hero_images?.length ? profile.hero_images : FALLBACK_HERO;

  // Hero crossfade
  useEffect(() => {
    const t = setInterval(() => setHeroIdx(i => (i + 1) % heroImages.length), 6000);
    return () => clearInterval(t);
  }, [heroImages.length]);

  // Nav shrink
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  function fmt(price?: number | null, cur?: string | null) {
    if (!price) return null;
    return cur === "BOB" ? `Bs. ${price.toLocaleString()}` : `$${price.toLocaleString()}`;
  }

  // Property type filters
  const FILTERS = [
    { value: "",                  label: "Todos" },
    { value: "casa",              label: "Casas" },
    { value: "departamento",      label: "Deptos." },
    { value: "terreno",           label: "Terrenos" },
    { value: "oficina",           label: "Oficinas" },
    { value: "local_comercial",   label: "Locales" },
  ];

  const filtered = listings.filter(l => !filter || l.property_type === filter);
  const withCoords = listings.filter(l => l.lat && l.lng);

  return (
    <div style={{ background: "#1e1e1e", color: "#fff", fontFamily: sans, minHeight: "100vh", overflowX: "hidden" }}>

      {/* ── NAV ──────────────────────────────────────────────── */}
      <motion.nav
        initial={false}
        animate={{ height: scrolled ? 64 : 72, backgroundColor: scrolled ? "rgba(14,14,14,0.98)" : "rgba(14,14,14,0.5)" }}
        transition={{ duration: 0.3 }}
        style={{ position: "fixed", top: 0, width: "100%", zIndex: 100, backdropFilter: "blur(16px)", borderBottom: scrolled ? "1px solid rgba(255,255,255,0.07)" : "1px solid transparent" }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 1.25rem", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Brand: realtor name + broker */}
          <a href="#inicio" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
            {profile.logo_url
              ? <img src={profile.logo_url} alt={profile.full_name} style={{ height: 38, objectFit: "contain" }} />
              : <div style={{ width: 36, height: 36, borderRadius: 3, background: primary, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: serif, color: "#fff", fontSize: "1rem" }}>
                  {profile.full_name[0]?.toUpperCase()}
                </div>
            }
            <div>
              <div style={{ fontFamily: serif, fontSize: "0.9rem", color: "#fff", lineHeight: 1.2 }}>{profile.full_name}</div>
              {(profile.broker_name || profile.city) && (
                <div style={{ fontFamily: sans, fontSize: "0.55rem", letterSpacing: "0.22em", textTransform: "uppercase", color: primary, marginTop: 1 }}>
                  {profile.broker_name ?? profile.city}
                </div>
              )}
            </div>
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex" style={{ alignItems: "center", gap: 32 }}>
            {[["#inicio","Inicio"],["#inmuebles","Inmuebles"],["#mapa","Mapa"],["#contacto","Contacto"]].map(([href,label]) => (
              <a key={href} href={href}
                style={{ fontFamily: sans, fontSize: "0.6rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "#888", textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color="#fff")}
                onMouseLeave={e => (e.currentTarget.style.color="#888")}
              >{label}</a>
            ))}
          </div>

          {/* CTA */}
          {profile.whatsapp && (
            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="hidden sm:flex"
              style={{ background: primary, color: "#fff", padding: "0.5rem 1.2rem", fontFamily: sans, fontSize: "0.6rem", letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 7 }}
            ><MessageSquare size={12} /> WhatsApp</a>
          )}
        </div>
      </motion.nav>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section id="inicio" style={{ position: "relative", height: "100svh", minHeight: 560, display: "flex", alignItems: "center", overflow: "hidden" }}>
        {/* Crossfade images */}
        {heroImages.map((src, i) => (
          <motion.div key={src}
            animate={{ opacity: i === heroIdx ? 1 : 0 }}
            transition={{ duration: 1.4, ease: "easeInOut" }}
            style={{ position: "absolute", inset: 0, zIndex: 0 }}
          >
            <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} referrerPolicy="no-referrer" />
          </motion.div>
        ))}

        {/* Overlays */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(110deg, rgba(12,12,12,0.92) 0%, rgba(12,12,12,0.5) 60%, rgba(12,12,12,0.15) 100%)", zIndex: 1 }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 200, background: "linear-gradient(to top, #1e1e1e, transparent)", zIndex: 1 }} />

        {/* Content */}
        <motion.div initial="hidden" animate="visible" variants={stagger}
          style={{ position: "relative", zIndex: 2, padding: "80px clamp(1.25rem,5vw,4rem) 2rem", maxWidth: 820 }}
        >
          <motion.p variants={fadeUp} style={{ fontFamily: sans, fontSize: "0.62rem", letterSpacing: "0.32em", textTransform: "uppercase", color: primary, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 28, height: 1, background: primary, display: "inline-block" }} />
            Portal Inmobiliario — {profile.city ?? "Santa Cruz"}
          </motion.p>

          <motion.h1 variants={fadeUp} style={{ fontFamily: serif, fontSize: "clamp(2.5rem, 6vw, 5.25rem)", lineHeight: 1.05, letterSpacing: "-0.02em", fontWeight: 400, marginBottom: "1.5rem", margin: 0 }}>
            {heroTitle}
            <br />
            <em style={{ color: primary, fontStyle: "italic" }}>{heroHeadline}</em>
          </motion.h1>

          <motion.p variants={fadeUp} style={{ fontFamily: sans, fontSize: "clamp(0.88rem, 1.4vw, 1.05rem)", color: "rgba(255,255,255,0.5)", maxWidth: 460, marginTop: "1.5rem", marginBottom: "2.5rem", lineHeight: 1.8, fontWeight: 300 }}>
            {heroSubtitle ?? profile.bio ?? `Agente inmobiliario en ${profile.city ?? "Santa Cruz"}`}
          </motion.p>

          <motion.div variants={fadeUp} style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <motion.a href={waUrl} target="_blank" rel="noopener noreferrer"
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              style={{ background: primary, color: "#fff", padding: "0.9rem 2rem", fontSize: "0.68rem", letterSpacing: "0.16em", textTransform: "uppercase", textDecoration: "none", display: "flex", alignItems: "center", gap: 8, fontWeight: 700, boxShadow: `0 8px 28px ${primary}40` }}
            ><MessageSquare size={14} /> Consultar por WhatsApp</motion.a>
            <motion.a href="#inmuebles"
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              style={{ border: "1px solid rgba(255,255,255,0.15)", color: "#fff", padding: "0.9rem 2rem", fontSize: "0.68rem", letterSpacing: "0.16em", textTransform: "uppercase", textDecoration: "none", background: "rgba(255,255,255,0.04)", backdropFilter: "blur(8px)" }}
            >Ver Propiedades</motion.a>
          </motion.div>
        </motion.div>

        {/* Stats — desktop only */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.8 }}
          className="hidden md:flex"
          style={{ position: "absolute", bottom: 52, right: 52, zIndex: 2, display: "flex", gap: 40 }}
        >
          {[{ n: listings.length, label: "Propiedades" }, { n: listings.filter(l => l.status === "activo").length, label: "Disponibles" }].map(s => (
            <div key={s.label} style={{ textAlign: "right" }}>
              <p style={{ fontFamily: serif, fontSize: "2.75rem", color: primary, fontWeight: 300, lineHeight: 1, margin: 0 }}>{s.n}</p>
              <p style={{ fontFamily: sans, fontSize: "0.58rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Scroll indicator */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
          style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 2 }}
        >
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
            <ChevronDown size={20} style={{ color: "rgba(255,255,255,0.25)" }} />
          </motion.div>
        </motion.div>
      </section>

      {/* ── SERVICES BAR ─────────────────────────────────────── */}
      <section style={{ background: "#161616", padding: "3rem 1.25rem", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }} className="sm:grid-cols-6">
            {SERVICES.map(({ icon: Icon, label }) => (
              <motion.div key={label}
                whileHover={{ backgroundColor: "#222" }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "1.5rem 0.75rem", background: "#1a1a1a", cursor: "default", transition: "background 0.2s" }}
              >
                <Icon size={24} style={{ color: primary }} strokeWidth={1.5} />
                <span style={{ fontFamily: sans, fontSize: "0.62rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "#666" }}>{label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LISTINGS ─────────────────────────────────────────── */}
      <section id="inmuebles" style={{ padding: "6rem 1.25rem", background: "#1e1e1e" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <FadeIn>
            <motion.div variants={fadeUp} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "3rem", flexWrap: "wrap", gap: 20 }}>
              <div>
                <p style={{ fontFamily: sans, fontSize: "0.6rem", letterSpacing: "0.32em", textTransform: "uppercase", color: primary, marginBottom: "0.75rem" }}>Proyectos Destacados</p>
                <div style={{ width: 28, height: 1, background: primary, marginBottom: "1rem" }} />
                <h2 style={{ fontFamily: serif, fontSize: "clamp(1.6rem, 3vw, 2.5rem)", fontWeight: 400, margin: 0 }}>Curaduría Exclusiva</h2>
              </div>
              {/* Filter chips */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {FILTERS.map(f => (
                  <motion.button key={f.value} onClick={() => setFilter(f.value)}
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                    style={{
                      padding: "0.4rem 1rem", fontFamily: sans, fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase",
                      border: `1px solid ${filter === f.value ? primary : "rgba(255,255,255,0.1)"}`,
                      background: filter === f.value ? primary : "transparent",
                      color: filter === f.value ? "#fff" : "#666",
                      cursor: "pointer", transition: "all 0.2s",
                    }}
                  >{f.label}</motion.button>
                ))}
              </div>
            </motion.div>
          </FadeIn>

          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "5rem 2rem" }}>
              <p style={{ fontFamily: serif, fontSize: "1.4rem", color: "#444", marginBottom: "0.5rem" }}>Sin propiedades</p>
              <p style={{ fontFamily: sans, fontSize: "0.85rem", color: "#555" }}>Vuelve pronto para ver nuevos inmuebles</p>
            </div>
          ) : (
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={stagger}
              style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: 20 }}
            >
              {filtered.map(listing => (
                <PropertyCard key={listing.id} listing={listing} primary={primary} profileId={profile.id} fmt={fmt} />
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ── MAP ──────────────────────────────────────────────── */}
      {withCoords.length > 0 && (
        <FadeIn>
          <section id="mapa" style={{ padding: "6rem 1.25rem", background: "#161616" }}>
            <div style={{ maxWidth: 1280, margin: "0 auto" }}>
              <motion.div variants={fadeUp} style={{ marginBottom: "3rem" }}>
                <p style={{ fontFamily: sans, fontSize: "0.6rem", letterSpacing: "0.32em", textTransform: "uppercase", color: primary, marginBottom: "0.75rem" }}>Ubicaciones</p>
                <div style={{ width: 28, height: 1, background: primary, marginBottom: "1rem" }} />
                <h2 style={{ fontFamily: serif, fontSize: "clamp(1.6rem, 3vw, 2.5rem)", fontWeight: 400, margin: 0 }}>Propiedades en el Mapa</h2>
              </motion.div>

              <motion.div variants={fadeUp}
                style={{ borderRadius: 2, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", height: "clamp(360px, 50vw, 520px)" }}
              >
                <RealtorMap listings={withCoords} />
              </motion.div>

              <motion.p variants={fadeUp} style={{ fontFamily: sans, fontSize: "0.72rem", color: "#444", marginTop: "1rem", textAlign: "center" }}>
                {withCoords.length} propiedad{withCoords.length !== 1 ? "es" : ""} en el mapa — haz clic en un punto para ver detalles
              </motion.p>
            </div>
          </section>
        </FadeIn>
      )}

      {/* ── CONTACT ──────────────────────────────────────────── */}
      <FadeIn>
        <section id="contacto" style={{ padding: "6rem 1.25rem", background: "#141414" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <motion.div variants={fadeUp} style={{ textAlign: "center", marginBottom: "4rem" }}>
              <p style={{ fontFamily: sans, fontSize: "0.6rem", letterSpacing: "0.32em", textTransform: "uppercase", color: primary, marginBottom: "0.75rem" }}>Hablemos</p>
              <div style={{ width: 28, height: 1, background: primary, margin: "0 auto 1.25rem" }} />
              <h2 style={{ fontFamily: serif, fontSize: "clamp(1.6rem, 3vw, 2.75rem)", fontWeight: 400, margin: 0 }}>Póngase en Contacto</h2>
            </motion.div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 40 }} className="contact-grid">
              {/* Info */}
              <motion.div variants={fadeUp} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {profile.whatsapp && <ContactRow icon={<MessageSquare size={16} style={{ color: primary }} />} label="WhatsApp" value={<a href={waUrl} target="_blank" rel="noopener noreferrer" style={{ color: primary, textDecoration: "none", fontFamily: serif, fontSize: "1rem" }}>{profile.whatsapp}</a>} />}
                {profile.email    && <ContactRow icon={<Mail    size={16} style={{ color: primary }} />} label="Email"    value={<span style={{ color: "#777", fontSize: "0.9rem" }}>{profile.email}</span>} />}
                {profile.city     && <ContactRow icon={<MapPin  size={16} style={{ color: primary }} />} label="Ciudad"   value={<span style={{ color: "#777", fontSize: "0.9rem" }}>{profile.city}, Bolivia</span>} />}
                <motion.a href={waUrl} target="_blank" rel="noopener noreferrer"
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  style={{ background: primary, color: "#fff", padding: "0.95rem 2rem", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontSize: "0.68rem", letterSpacing: "0.16em", textTransform: "uppercase", textDecoration: "none", fontWeight: 700, marginTop: 8 }}
                ><MessageSquare size={15} /> Hablar por WhatsApp</motion.a>
              </motion.div>

              {/* Form */}
              <motion.div variants={fadeUp}>
                <ContactForm profileId={profile.id} primary={primary} />
              </motion.div>
            </div>
          </div>
        </section>
      </FadeIn>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer style={{ background: "#0d0d0d", padding: "2.5rem 1.25rem", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 20 }}>
          <div>
            <div style={{ fontFamily: serif, fontSize: "0.9rem", letterSpacing: "0.06em", color: primary, marginBottom: 4 }}>{profile.full_name}</div>
            <div style={{ fontFamily: sans, fontSize: "0.58rem", letterSpacing: "0.18em", color: "#3a3a3a", textTransform: "uppercase" }}>{profile.city ?? "Santa Cruz"} · Bolivia</div>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {[["#inicio","Inicio"],["#inmuebles","Inmuebles"],["#mapa","Mapa"],["#contacto","Contacto"]].map(([href,label]) => (
              <a key={href} href={href} style={{ fontFamily: sans, fontSize: "0.58rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "#3a3a3a", textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color="#fff")}
                onMouseLeave={e => (e.currentTarget.style.color="#3a3a3a")}
              >{label}</a>
            ))}
          </div>
          <a href="https://central.bo" target="_blank" rel="noopener noreferrer"
            style={{ fontFamily: sans, fontSize: "0.58rem", letterSpacing: "0.1em", color: "#333", textDecoration: "none" }}
          >Powered by <span style={{ color: primary }}>Central</span></a>
        </div>
      </footer>

      {/* Responsive styles */}
      <style>{`
        @media (min-width: 640px) {
          .sm\\:grid-cols-6 { grid-template-columns: repeat(6, 1fr) !important; }
        }
        @media (min-width: 768px) {
          .contact-grid { grid-template-columns: 1fr 1.25fr !important; gap: 64px !important; }
          .hidden.md\\:flex { display: flex !important; }
          .hidden.sm\\:flex { display: flex !important; }
        }
        .hidden { display: none; }
      `}</style>


      {/* ── CHAT WIDGET ──────────────────────────────────────── */}
      <ChatWidget
        realtorName={profile.full_name ?? "Asesor Inmobiliario"}
        realtorPhone={profile.whatsapp ?? "59170000000"}
        primaryColor={primary}
        profileId={profile.id}
      />
    </div>
  );
}
