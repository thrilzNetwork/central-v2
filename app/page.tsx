import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { resolveBySlug } from "@/lib/tenant/resolver";
import { TenantProvider } from "@/components/themes/TenantContext";
import { createAdminClient } from "@/lib/supabase/admin";
import { RealtorV1Page } from "@/components/themes/realtor-v1/RealtorV1Page";
import { ArrowRight, MapPin, Layout, Target, Users } from "lucide-react";
import type { Metadata } from "next";

// ─── Metadata ─────────────────────────────────────────────────
export async function generateMetadata(): Promise<Metadata> {
  const headerStore = await headers();
  const tenantSlug = headerStore.get("x-tenant-slug");
  if (tenantSlug) {
    const profile = await resolveBySlug(tenantSlug);
    return {
      title: profile?.full_name ?? "Portal Inmobiliario",
      description: profile?.bio ?? `Portal inmobiliario en ${profile?.city ?? "Bolivia"}`,
    };
  }
  return {
    title: "Central Bolivia — Tu agente digital 24/7",
    description: "Portal inmobiliario propio con mapa interactivo, captura de leads y tecnología. Listo en 2 minutos.",
  };
}

// ─── Page ──────────────────────────────────────────────────────
export default async function HomePage() {
  const headerStore = await headers();
  const tenantSlug = headerStore.get("x-tenant-slug");

  if (tenantSlug) {
    const profile = await resolveBySlug(tenantSlug);
    if (!profile) return notFound();

    const supabase = createAdminClient();
    const { data: listings } = await supabase
      .from("listings")
      .select("*")
      .eq("profile_id", profile.id)
      .eq("status", "activo")
      .order("created_at", { ascending: false })
      .limit(20);

    return (
      <TenantProvider profile={profile} slug={tenantSlug}>
        <style>{`
          :root {
            --tenant-primary: ${profile.primary_color};
            --tenant-secondary: ${profile.secondary_color};
          }
        `}</style>
        <RealtorV1Page listings={listings ?? []} />
      </TenantProvider>
    );
  }

  return <MarketingPage />;
}

// ─── Features ─────────────────────────────────────────────────
const FEATURES = [
  { icon: <MapPin className="w-6 h-6" />, title: "Mapa Interactivo", desc: "Tus propiedades aparecen como pins en el mapa de tu portal. Los compradores ubican cada inmueble al instante." },
  { icon: <Layout className="w-6 h-6" />, title: "Portal con tu Marca", desc: "Logo, colores, dominio propio. Tu portal se ve como una agencia profesional desde el día uno." },
  { icon: <Target className="w-6 h-6" />, title: "Lead Sniper", desc: "Cuando un comprador guarda una propiedad, recibes notificación en WhatsApp al instante — nunca pierdas un cliente." },
  { icon: <Users className="w-6 h-6" />, title: "Multi-agente", desc: "Escala tu equipo sin límites. Cada agente tiene su propio portal bajo la misma plataforma." },
];

const STATS = [
  { n: "24/7", label: "Tu portal trabaja" },
  { n: "2 min", label: "Para lanzar tu sitio" },
  { n: "100%", label: "Tu marca, tu dominio" },
];

function MarketingPage() {
  return (
    <div className="min-h-screen bg-[#F7F5EE] font-sans">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#F7F5EE]/90 backdrop-blur-md border-b border-[#EAE7DC]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-[#FF7F11] rounded-sm" />
            <span className="text-[#262626] font-serif text-xl font-medium">Central Bolivia</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="label-caps text-[#6B7565] hover:text-[#262626] transition-colors hidden sm:block">
              Iniciar sesión
            </Link>
            <Link href="/bienvenido" className="px-5 py-2 bg-[#262626] text-white text-sm font-medium rounded-sm hover:bg-[#323232] transition-colors">
              Crear portal gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-36 pb-28 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-4xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-5 h-px bg-[#FF7F11]" />
            <span className="label-caps text-[#6B7565]">PropTech para Bolivia</span>
          </div>

          <h1
            className="text-[#262626] mb-6 font-serif leading-[1.02] tracking-tight"
            style={{ fontSize: "clamp(3rem, 6.5vw, 6.5rem)" }}
          >
            Tu agente digital<br />
            que trabaja<br />
            <em className="text-[#FF7F11] not-italic">las 24 horas.</em>
          </h1>

          <p className="text-[#6B7565] text-xl leading-relaxed max-w-2xl mb-6">
            Mientras duermes, tu portal recibe visitas, captura leads y muestra tus propiedades en el mapa. Todo automatizado — tú solo cierras los negocios.
          </p>

          {/* Value pills */}
          <div className="flex flex-wrap gap-2 mb-10">
            {["Portal con tu marca", "Mapa interactivo", "Leads en WhatsApp", "Sin código"].map((p) => (
              <span key={p} className="px-3 py-1 bg-white border border-[#EAE7DC] rounded-full text-sm text-[#6B7565]">
                {p}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/bienvenido"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#FF7F11] text-white font-medium rounded-sm hover:bg-[#CC6500] transition-all active:scale-[0.98] shadow-lg shadow-[#FF7F11]/20"
            >
              Activar mi portal gratis
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 border border-[#D8D3C8] text-[#262626] font-medium rounded-sm hover:bg-white transition-all"
            >
              Ya tengo cuenta
            </Link>
          </div>
          <p className="text-xs text-[#ACBFA4] mt-5">
            3 días de demo gratuita · Sin tarjeta de crédito · Desde $29/mo
          </p>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-3 gap-8 max-w-md">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="text-4xl font-light text-[#FF7F11] font-serif">{s.n}</p>
              <p className="label-caps text-[#6B7565] mt-2">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social proof bar */}
      <div className="border-y border-[#EAE7DC] bg-white py-5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-center gap-8 text-sm text-[#6B7565]">
          {["Century 21", "Re/Max", "Coldwell Banker", "Keller Williams", "ERA", "Independientes"].map((b) => (
            <span key={b} className="label-caps opacity-60">{b}</span>
          ))}
        </div>
      </div>

      {/* Problem / Solution */}
      <section className="py-28 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="label-caps text-[#6B7565]">El problema</span>
            <h2 className="text-[#262626] mt-3 mb-6 font-serif leading-tight" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
              Los mejores agentes<br />pierden clientes<br />
              <em className="text-[#FF7F11] not-italic">por no estar disponibles.</em>
            </h2>
            <div className="flex flex-col gap-4">
              {[
                { pain: "Un comprador visita tu portal a las 11pm — no hay nadie.", fix: "Tu portal captura sus datos y te avisa al instante." },
                { pain: "Tus propiedades son difíciles de ubicar sin un mapa.", fix: "Cada propiedad aparece como pin en el mapa interactivo." },
                { pain: "Tu presencia digital no refleja tu nivel profesional.", fix: "Portal con tu logo, colores y dominio desde el día uno." },
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#FF7F11]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[#FF7F11] text-xs font-bold">{i + 1}</span>
                  </div>
                  <div>
                    <p className="text-sm text-[#ACBFA4] line-through mb-0.5">{item.pain}</p>
                    <p className="text-sm text-[#262626] font-medium">{item.fix}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Mock portal preview */}
          <div className="bg-[#262626] rounded-sm p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-400/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
              <div className="w-3 h-3 rounded-full bg-green-400/60" />
              <div className="flex-1 bg-white/5 rounded-sm h-5 mx-2 flex items-center px-3">
                <span className="text-white/30 text-xs">tuagencia.centralbolivia.com</span>
              </div>
            </div>
            <div className="bg-[#1a1a1a] rounded-sm overflow-hidden">
              <div className="h-24 bg-gradient-to-r from-[#FF7F11]/20 to-[#262626] flex items-end p-4">
                <div>
                  <div className="h-2 w-24 bg-white/20 rounded mb-1" />
                  <div className="h-4 w-36 bg-white/40 rounded" />
                </div>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="bg-white/5 rounded-sm overflow-hidden">
                    <div className="h-16 bg-white/10" />
                    <div className="p-2">
                      <div className="h-2 w-3/4 bg-white/20 rounded mb-1" />
                      <div className="h-2 w-1/2 bg-[#FF7F11]/40 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-white/40 text-xs">3 visitantes ahora mismo</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-[#262626] py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="mb-16">
            <span className="label-caps text-[#ACBFA4]">Funcionalidades</span>
            <h2 className="text-white mt-3 font-serif leading-tight tracking-tight" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}>
              Todo lo que necesita<br />
              <em className="text-[#FF7F11] not-italic">un agente moderno.</em>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="border border-white/8 rounded-sm p-6 hover:border-[#FF7F11]/50 hover:bg-white/2 transition-all duration-200">
                <span className="text-[#FF7F11] block mb-4">{f.icon}</span>
                <h3 className="text-white font-medium mb-2">{f.title}</h3>
                <p className="text-[#6B7565] text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-28 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-16">
          <span className="label-caps text-[#6B7565]">Proceso</span>
          <h2 className="text-[#262626] mt-3 font-serif" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            De cero a portal en 3 pasos
          </h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-10">
          {[
            { step: "01", title: "Crea tu cuenta", desc: "El asistente conversacional configura tu portal en 2 minutos. Sin formularios largos, sin código." },
            { step: "02", title: "Agrega propiedades", desc: "Sube fotos, describe el inmueble y asigna coordenadas. Aparece en el mapa de tu portal al instante." },
            { step: "03", title: "Trabaja 24/7", desc: "Tu portal captura leads mientras duermes. Cada lead llega a tu WhatsApp con nombre, propiedad y contacto." },
          ].map((item) => (
            <div key={item.step} className="flex gap-5">
              <div className="w-12 h-12 rounded-sm flex items-center justify-center flex-shrink-0 mt-1 bg-[#FF7F11]/10 border border-[#FF7F11]/20">
                <span className="font-serif text-[#FF7F11] text-xl font-medium">{item.step}</span>
              </div>
              <div>
                <h3 className="font-medium text-[#262626] mb-2">{item.title}</h3>
                <p className="text-sm text-[#6B7565] leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Demo video */}
      <section className="py-28 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <span className="label-caps text-[#6B7565]">Demo en vivo</span>
          <h2 className="text-[#262626] mt-3 font-serif" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            Míralo funcionar en<br />
            <em className="text-[#FF7F11] not-italic">2 minutos.</em>
          </h2>
        </div>
        <div className="relative mx-auto max-w-4xl rounded-sm overflow-hidden shadow-2xl" style={{ aspectRatio: "16/9" }}>
          <iframe
            src="https://www.youtube.com/embed/qb92U0A-Aus"
            title="Central Bolivia Demo"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        </div>
      </section>

      {/* Pricing — contact */}
      <section className="bg-white py-28 border-t border-[#EAE7DC]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <span className="label-caps text-[#6B7565]">Planes</span>
          <h2 className="text-[#262626] mt-3 mb-4 font-serif" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            Planes a tu medida
          </h2>
          <p className="text-[#6B7565] text-lg max-w-xl mx-auto mb-12 leading-relaxed">
            Para agentes independientes, equipos y brokerages. Sin contratos — cancela cuando quieras.
          </p>
          <div className="grid sm:grid-cols-2 gap-8 max-w-3xl mx-auto mb-10">
            {[
              { title: "Essential", price: "$29/mo", desc: "Tu oficina digital profesional activa en 2 minutos.", features: ["Portal con tu marca", "Propiedades ilimitadas", "Mapa interactivo", "Leads a WhatsApp"] },
              { title: "Premium", price: "$49/mo", desc: "El estatus digital para el top 10% de agentes.", features: ["Todo de Essential", "Dominio personalizado ($15/mo value)", "AI Branding Manager", "Soporte prioritario"], highlight: true },
            ].map((p) => (
              <div key={p.title} className={`rounded-sm border p-8 text-left flex flex-col gap-5 ${p.highlight ? "border-[#FF7F11] shadow-xl shadow-[#FF7F11]/10 relative" : "border-[#EAE7DC]"}`}>
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="label-caps bg-[#FF7F11] text-white px-4 py-1.5 rounded-sm shadow-md">Más popular</span>
                  </div>
                )}
                <div>
                  <h3 className="font-serif text-[#262626] text-2xl">{p.title}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-light text-[#FF7F11]">{p.price}</span>
                  </div>
                  <p className="text-sm text-[#6B7565] mt-3">{p.desc}</p>
                </div>
                <div className="h-px bg-[#EAE7DC] w-full" />
                <ul className="flex flex-col gap-3 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-[#262626]">
                      <svg className="w-4 h-4 text-[#FF7F11] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/bienvenido"
                  className={`w-full py-3.5 text-center text-sm font-medium rounded-sm transition-all mt-4 ${p.highlight ? "bg-[#262626] text-white hover:bg-[#323232]" : "border border-[#D8D3C8] bg-white text-[#262626] hover:bg-[#F7F5EE]"}`}
                >
                  Empezar Ahora
                </Link>
              </div>
            ))}
          </div>

          <div className="bg-[#FFF7F0] border border-[#FFE0C0] max-w-3xl mx-auto rounded-sm p-4 text-center">
            <span className="label-caps text-[#FF7F11] bg-[#FFE0C0] px-2 py-1 rounded-sm mr-2 inline-block mb-1 sm:mb-0">Próximamente</span>
            <span className="text-sm text-[#9A4E00]">Recompensando a los pioneros: <strong>Acceso a Datos Competitivos Nacionales</strong> para usuarios activos.</span>
          </div>
          <p className="text-sm text-[#6B7565]">
            ¿Prefieres hablar directo?{" "}
            <a href="tel:+19546488174" className="text-[#FF7F11] font-medium hover:underline">
              +1 (954) 648-8174
            </a>
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#262626] py-28 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 30% 50%, #FF7F11 0%, transparent 60%)" }} />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <span className="label-caps text-[#ACBFA4]">Empieza hoy</span>
          <h2 className="text-white mt-3 mb-4 font-serif leading-tight" style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}>
            Tu portal inmobiliario<br />
            <em className="text-[#FF7F11] not-italic">activo en 2 minutos.</em>
          </h2>
          <p className="text-[#ACBFA4] mb-10 max-w-md mx-auto text-lg">
            Únete a los agentes bolivianos que ya trabajan con un portal profesional 24/7.
          </p>
          <Link
            href="/bienvenido"
            className="inline-flex items-center gap-2 px-10 py-5 bg-[#FF7F11] text-white font-medium rounded-sm hover:bg-[#CC6500] transition-all text-lg shadow-xl shadow-[#FF7F11]/20"
          >
            Activar mi portal gratis
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-[#6B7565] text-sm mt-4">3 días de demo · Sin tarjeta de crédito</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1a1a1a] text-[#6B7565] py-10 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-[#FF7F11] rounded-sm" />
            <span className="text-white text-sm font-medium">Central Bolivia</span>
          </div>
          <p className="text-xs">© 2025 Central Bolivia. Hecho en Bolivia 🇧🇴</p>
          <div className="flex gap-6">
            <Link href="/login" className="label-caps hover:text-white transition-colors">Ingresar</Link>
            <Link href="/bienvenido" className="label-caps hover:text-white transition-colors">Registro</Link>
            <a href="tel:+19546488174" className="label-caps hover:text-white transition-colors">Contacto</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
