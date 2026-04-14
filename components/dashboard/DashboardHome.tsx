"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Home, Users, Eye, Heart, Plus, Globe, BarChart2, Send, Bot } from "lucide-react";

interface Metrics {
  totalListings: number;
  activeListings: number;
  totalLeads: number;
  newLeads: number;
  totalViews: number;
  totalHearts: number;
}

interface DashboardHomeProps {
  agentName: string;
  slug: string;
  metrics: Metrics;
}

type ChatMessage = { role: "assistant" | "user"; text: string };

// Smart pre-scripted assistant with contextual awareness
function getReply(input: string, metrics: Metrics, agentName: string): string {
  const q = input.toLowerCase();

  if (q.match(/hola|buenos|buenas|hi|hey/))
    return `¡Hola, ${agentName}! Soy tu asistente de Central. Puedo ayudarte con tus propiedades, leads, o cualquier duda sobre tu portal. ¿En qué te ayudo hoy?`;

  if (q.match(/lead|cliente|contacto/)) {
    if (metrics.newLeads > 0)
      return `Tienes **${metrics.newLeads} lead${metrics.newLeads > 1 ? "s" : ""} nuevo${metrics.newLeads > 1 ? "s" : ""}** esperando respuesta. Ve a [Leads](/dashboard/leads) para verlos y contactarlos. Los primeros 5 minutos de respuesta aumentan la conversión hasta un 400%.`;
    return `No tienes leads nuevos por ahora. Para atraer más, asegúrate de que tus propiedades tengan fotos profesionales y precios competitivos. ¿Quieres tips para optimizar tu portal?`;
  }

  if (q.match(/propiedad|inmueble|listado|publicar/)) {
    if (metrics.activeListings === 0)
      return `Aún no tienes propiedades publicadas. ¡Empieza ahora! Ve a [Nueva propiedad](/dashboard/propiedades/nueva) y agrega tu primer inmueble con fotos, precio y ubicación en el mapa.`;
    return `Tienes **${metrics.activeListings} propiedad${metrics.activeListings > 1 ? "es" : ""} activa${metrics.activeListings > 1 ? "s"  : ""}** en tu portal. Para mejorar su visibilidad, asegúrate de que cada una tenga al menos 5 fotos y coordenadas de ubicación.`;
  }

  if (q.match(/vista|visita|view|tráfico/))
    return `Tu portal ha recibido **${metrics.totalViews} vista${metrics.totalViews !== 1 ? "s" : ""}** en total. ${metrics.totalViews < 50 ? "Para aumentar el tráfico, comparte el link de tu portal en tus redes sociales y grupos de WhatsApp." : "¡Buen tráfico! Asegúrate de responder los leads rápidamente para convertir esas visitas en ventas."}`;

  if (q.match(/mapa|ubicaci/))
    return `El mapa interactivo de tu portal muestra tus propiedades como pins. Para que aparezcan, cada propiedad necesita coordenadas (latitud/longitud). Ve a editar una propiedad y busca el campo de ubicación.`;

  if (q.match(/logo|color|marca|diseño|sitio|portal/))
    return `Puedes personalizar tu portal completamente en [Mi Sitio](/dashboard/mi-sitio). Cambia el logo, colores, imágenes del hero, nombre de tu brokerage y más.`;

  if (q.match(/dominio|url|link|web/))
    return `Tu portal está en **${agentName.toLowerCase().replace(/\s+/g, "")}.central.bo**. También puedes conectar un dominio propio en [Dominios](/dashboard/dominios).`;

  if (q.match(/precio|plan|pago|suscripci/))
    return `Para ver opciones de planes y activar tu cuenta completa, ve a [Facturación](/dashboard/facturacion) o contáctanos directamente al +1 (954) 648-8174.`;

  if (q.match(/whatsapp|notificaci|aviso/))
    return `Cuando un comprador guarda una propiedad o envía un lead, recibes una notificación en tu WhatsApp. Asegúrate de tener tu número actualizado en [Mi Perfil](/dashboard/perfil).`;

  if (q.match(/foto|imagen|upload|subir/))
    return `Puedes subir fotos directamente al editar una propiedad. Ve a [Propiedades](/dashboard/propiedades), selecciona una y sube hasta 20 fotos por inmueble. Las fotos de portada son las más importantes.`;

  if (q.match(/ayuda|help|soporte|problema/))
    return `Estoy aquí para ayudarte. Puedes preguntarme sobre propiedades, leads, configuración del portal, mapas o cualquier funcionalidad. También puedes contactar soporte al +1 (954) 648-8174.`;

  return `Entendido. Puedo ayudarte con: gestión de **propiedades**, responder **leads**, configurar tu **portal**, o cualquier duda técnica. ¿Qué necesitas?`;
}

export function DashboardHome({ agentName, slug, metrics }: DashboardHomeProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: `Hola ${agentName.split(" ")[0]} 👋 Soy tu asistente de portal. ${
        metrics.newLeads > 0
          ? `Tienes **${metrics.newLeads} lead${metrics.newLeads > 1 ? "s" : ""} nuevo${metrics.newLeads > 1 ? "s" : ""}** esperando respuesta.`
          : metrics.activeListings === 0
          ? "Aún no tienes propiedades publicadas. ¡Empieza agregando tu primera!"
          : `Tu portal tiene **${metrics.activeListings} propiedad${metrics.activeListings > 1 ? "es" : ""}** activa${metrics.activeListings > 1 ? "s" : ""} y **${metrics.totalViews} vistas** esta semana.`
      } ¿En qué te ayudo hoy?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  function renderText(text: string) {
    // Bold **text** and make [label](href) into links
    const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
    return parts.map((part, i) => {
      const bold = part.match(/^\*\*(.+)\*\*$/);
      if (bold) return <strong key={i}>{bold[1]}</strong>;
      const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (link) return <Link key={i} href={link[2]} className="underline text-[#FF7F11] hover:opacity-80">{link[1]}</Link>;
      return part;
    });
  }

  async function handleSend() {
    const val = input.trim();
    if (!val) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: val }]);
    setTyping(true);
    await new Promise((r) => setTimeout(r, 600));
    setTyping(false);
    const reply = getReply(val, metrics, agentName);
    setMessages((m) => [...m, { role: "assistant", text: reply }]);
  }

  const QUICK_ACTIONS = [
    { label: "Nueva propiedad", href: "/dashboard/propiedades/nueva", icon: <Plus className="w-4 h-4" />, color: "#FF7F11" },
    { label: "Ver leads", href: "/dashboard/leads", icon: <Users className="w-4 h-4" />, badge: metrics.newLeads > 0 ? metrics.newLeads : null },
    { label: "Mi sitio", href: "/dashboard/mi-sitio", icon: <Globe className="w-4 h-4" /> },
    { label: "Propiedades", href: "/dashboard/propiedades", icon: <Home className="w-4 h-4" /> },
  ];

  const METRIC_CARDS = [
    { label: "Propiedades activas", value: metrics.activeListings, icon: <Home className="w-4 h-4" />, sub: `de ${metrics.totalListings} total` },
    { label: "Leads nuevos", value: metrics.newLeads, icon: <Users className="w-4 h-4" />, sub: `de ${metrics.totalLeads} total`, alert: metrics.newLeads > 0 },
    { label: "Vistas totales", value: metrics.totalViews, icon: <Eye className="w-4 h-4" />, sub: "en tu portal" },
    { label: "Guardados", value: metrics.totalHearts, icon: <Heart className="w-4 h-4" />, sub: "por compradores" },
  ];

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <span className="label-caps text-[#6B7565]">Bienvenido de vuelta</span>
          <h1
            className="text-[#262626] mt-1"
            style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: "2rem", fontWeight: 500 }}
          >
            {agentName}
          </h1>
        </div>
        {slug && (
          <a
            href={
              typeof window !== "undefined" && window.location.hostname === "localhost"
                ? `http://${slug}.localhost:3000`
                : `https://${slug}.central.bo`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 border border-[#D8D3C8] text-sm text-[#262626] rounded-sm hover:bg-white transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-[#FF7F11]" />
            Ver mi portal
          </a>
        )}
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Left: AI Chat */}
        <div className="lg:col-span-3 flex flex-col bg-white border border-[#EAE7DC] rounded-sm overflow-hidden" style={{ minHeight: 480 }}>
          {/* Chat header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#EAE7DC] bg-[#F7F5EE]">
            <div className="w-8 h-8 rounded-full bg-[#FF7F11] flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#262626]">Asistente Central</p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <p className="text-xs text-[#6B7565]">En línea</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3" style={{ maxHeight: 360 }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-[#FF7F11]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-[#FF7F11]" />
                  </div>
                )}
                <div
                  className="max-w-[80%] px-3 py-2 rounded-sm text-sm leading-relaxed"
                  style={
                    msg.role === "assistant"
                      ? { backgroundColor: "#F7F5EE", color: "#262626" }
                      : { backgroundColor: "#FF7F11", color: "white" }
                  }
                >
                  {renderText(msg.text)}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-[#FF7F11]/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3.5 h-3.5 text-[#FF7F11]" />
                </div>
                <div className="px-3 py-2 rounded-sm bg-[#F7F5EE] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ACBFA4] animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ACBFA4] animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ACBFA4] animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          <div className="px-4 pb-2 flex flex-wrap gap-1.5">
            {["¿Cómo atraigo más leads?", "Ver mis propiedades", "Configurar mi portal"].map((s) => (
              <button
                key={s}
                onClick={() => { setInput(s); }}
                className="px-2.5 py-1 text-xs border border-[#EAE7DC] rounded-full text-[#6B7565] hover:border-[#FF7F11] hover:text-[#FF7F11] transition-colors"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="px-4 pb-4">
            <div className="flex gap-2 border border-[#D8D3C8] rounded-sm overflow-hidden focus-within:border-[#FF7F11] focus-within:ring-1 focus-within:ring-[#FF7F11]/20 transition-all">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Pregúntame lo que necesites..."
                className="flex-1 px-3 py-2.5 text-sm text-[#262626] placeholder:text-[#ACBFA4] bg-transparent outline-none"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="px-3 text-[#FF7F11] hover:bg-[#FF7F11]/5 disabled:opacity-30 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Metrics + Quick Actions */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Metrics */}
          <div className="grid grid-cols-2 gap-3">
            {METRIC_CARDS.map((m) => (
              <div
                key={m.label}
                className={`bg-white border rounded-sm p-4 ${m.alert ? "border-[#FF7F11]" : "border-[#EAE7DC]"}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#6B7565]">{m.icon}</span>
                  {m.alert && <span className="w-2 h-2 rounded-full bg-[#FF7F11] animate-pulse" />}
                </div>
                <p
                  className="text-2xl font-light text-[#262626]"
                  style={{ fontFamily: "Cormorant Garamond, Georgia, serif" }}
                >
                  {m.value}
                </p>
                <p className="label-caps text-[#6B7565] mt-0.5 leading-tight">{m.label}</p>
                <p className="text-xs text-[#ACBFA4] mt-0.5">{m.sub}</p>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-[#EAE7DC] rounded-sm p-4">
            <p className="label-caps text-[#6B7565] mb-3">Acciones rápidas</p>
            <div className="flex flex-col gap-2">
              {QUICK_ACTIONS.map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-sm border border-[#EAE7DC] hover:border-[#FF7F11]/40 hover:bg-[#FFF7F0] transition-all text-sm text-[#262626] group"
                >
                  <span className="text-[#FF7F11]">{a.icon}</span>
                  <span className="flex-1">{a.label}</span>
                  {a.badge && (
                    <span className="w-5 h-5 rounded-full bg-[#FF7F11] text-white text-xs flex items-center justify-center font-medium">
                      {a.badge}
                    </span>
                  )}
                  <span className="text-[#ACBFA4] group-hover:text-[#FF7F11] transition-colors">→</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Portal status */}
          <div className="bg-[#262626] rounded-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <p className="text-white text-sm font-medium">Tu portal está activo 24/7</p>
            </div>
            <p className="text-[#6B7565] text-xs leading-relaxed mb-3">
              Mientras duermes, tu portal recibe visitas y captura leads automáticamente.
            </p>
            <div className="flex items-center gap-2">
              <BarChart2 className="w-3.5 h-3.5 text-[#FF7F11]" />
              <span className="text-[#ACBFA4] text-xs">{metrics.totalViews} vistas · {metrics.totalHearts} guardados</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
