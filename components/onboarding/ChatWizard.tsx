"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

type Step = "welcome" | "email" | "password" | "name" | "brand" | "whatsapp" | "theme" | "done";
type MessageRole = "agent" | "user";

interface Message {
  id: string;
  role: MessageRole;
  content: string;
  type?: "text" | "input-email" | "input-password" | "input-text" | "input-whatsapp" | "theme-picker";
}

const THEME_OPTIONS = [
  { id: "realtor-v1", label: "Realtor V1", desc: "Profesional con mapa y filtros avanzados" },
];

const STEPS: Record<Step, { message: string; inputType?: Message["type"] }> = {
  welcome:  { message: "Hola 👋 Soy tu asistente de configuración. En 2 minutos tendrás tu portal inmobiliario listo. ¿Empezamos?" },
  email:    { message: "Primero, ¿cuál es tu correo electrónico?", inputType: "input-email" },
  password: { message: "Perfecto. Elige una contraseña segura (mínimo 8 caracteres).", inputType: "input-password" },
  name:     { message: "¿Cuál es tu nombre completo? (Aparecerá en tu portal)", inputType: "input-text" },
  brand:    { message: "¿Cómo se llama tu marca o agencia? (Ej: Inmobiliaria Sur, García Propiedades)", inputType: "input-text" },
  whatsapp: { message: "¿Cuál es tu número de WhatsApp? Los clientes lo usarán para contactarte. (Ej: +59171234567)", inputType: "input-whatsapp" },
  theme:    { message: "Elige la plantilla visual de tu portal:", inputType: "theme-picker" },
  done:     { message: "🎉 ¡Todo listo! Estamos creando tu portal. Serás redirigido en un momento..." },
};

export function ChatWizard() {
  const [step, setStep] = useState<Step>("welcome");
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", role: "agent", content: STEPS.welcome.message },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState({
    email: "", password: "", fullName: "", brandName: "", whatsapp: "", theme: "realtor-v1",
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  function addMessage(role: MessageRole, content: string, type?: Message["type"]) {
    setMessages((prev) => [...prev, { id: Date.now().toString() + Math.random(), role, content, type }]);
  }

  async function agentReply(next: Step) {
    setIsTyping(true);
    await new Promise((r) => setTimeout(r, 350));
    setIsTyping(false);
    addMessage("agent", STEPS[next].message, STEPS[next].inputType);
    setStep(next);
    setInputValue("");
  }

  async function handleSubmit(value?: string) {
    const val = value ?? inputValue.trim();
    if (!val) return;

    addMessage("user", step === "password" ? "••••••••" : val);
    setInputValue("");

    switch (step) {
      case "welcome":
        agentReply("email");
        break;

      case "email": {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        if (!emailRegex.test(val)) {
          addMessage("agent", "Ese correo no parece válido. Escríbelo completo, por ejemplo: maria@gmail.com");
          setStep("email");
          break;
        }
        setData((d) => ({ ...d, email: val }));
        agentReply("password");
        break;
      }

      case "password":
        if (val.length < 8) {
          addMessage("agent", "La contraseña debe tener al menos 8 caracteres. Intenta de nuevo.");
          setStep("password");
          break;
        }
        setData((d) => ({ ...d, password: val }));
        agentReply("name");
        break;

      case "name":
        setData((d) => ({ ...d, fullName: val }));
        agentReply("brand");
        break;

      case "brand":
        setData((d) => ({ ...d, brandName: val }));
        agentReply("whatsapp");
        break;

      case "whatsapp":
        setData((d) => ({ ...d, whatsapp: val }));
        agentReply("theme");
        break;

      case "theme":
        setData((d) => ({ ...d, theme: val }));
        await handleFinalSubmit({ ...data, theme: val });
        break;
    }
  }

  async function handleFinalSubmit(finalData: typeof data) {
    setIsTyping(true);
    await new Promise((r) => setTimeout(r, 300));
    setIsTyping(false);
    addMessage("agent", STEPS.done.message);
    setStep("done");
    setLoading(true);

    try {
      // ── Step 1: Create account server-side (no client rate limits) ──
      const createRes = await fetch("/api/onboarding/create-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: finalData.email,
          password: finalData.password,
          fullName: finalData.fullName,
          brandName: finalData.brandName,
          whatsapp: finalData.whatsapp,
          theme: finalData.theme,
        }),
      });

      const createJson = await createRes.json().catch(() => ({}));

      if (!createRes.ok) {
        throw new Error(createJson.error ?? "No se pudo crear la cuenta. Intenta de nuevo.");
      }

      // ── Step 2: Sign in so the browser gets a session cookie ────────
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: finalData.email,
        password: finalData.password,
      });

      if (signInError) {
        // Account was created, just couldn't auto-login — send to login page
        addMessage("agent", "¡Tu portal fue creado! Ingresa con tu correo y contraseña en /login.");
        await new Promise((r) => setTimeout(r, 2000));
        window.location.href = "/login";
        return;
      }

      // ── Step 3: Redirect to dashboard (3-day demo starts) ──────────
      await new Promise((r) => setTimeout(r, 400));
      window.location.href = "/dashboard?bienvenido=1";

    } catch (err) {
      console.error("Onboarding error:", err);
      const msg = err instanceof Error ? err.message : "Ocurrió un error inesperado.";
      addMessage("agent", `${msg} Selecciona la plantilla de nuevo para reintentar.`);
      setStep("theme");
    } finally {
      setLoading(false);
    }
  }

  const currentStepDef = STEPS[step];
  const isAwaitingInput = step !== "welcome" && step !== "done";
  const showInput = isAwaitingInput && currentStepDef.inputType !== "theme-picker";
  const showThemePicker = step === "theme";

  return (
    <div className="min-h-dvh bg-[#F7F5EE] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#EAE7DC] bg-white px-6 py-4 flex items-center gap-4">
        <div className="w-8 h-8 rounded-full bg-[#262626] flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-[#FF7F11] animate-pulse" />
        </div>
        <div>
          <p className="text-sm font-medium text-[#262626]">Asistente Central</p>
          <p className="label-caps text-[#ACBFA4]">Configuración de Portal</p>
        </div>
        <div className="ml-auto">
          <span className="label-caps text-[#6B7565]">
            {step === "done"
              ? "Completado"
              : `Paso ${Object.keys(STEPS).indexOf(step) + 1} de ${Object.keys(STEPS).length - 1}`}
          </span>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl mx-auto w-full">
        <div className="flex flex-col gap-4">
          {messages.map((msg, i) => (
            <div key={msg.id} className="flex gap-3 animate-fade-up" style={{ animationDelay: `${i * 30}ms` }}>
              {msg.role === "agent" && (
                <div className="w-7 h-7 rounded-full bg-[#262626] flex-shrink-0 flex items-center justify-center mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FF7F11]" />
                </div>
              )}
              <div
                className={`max-w-sm px-4 py-3 rounded-sm text-sm leading-relaxed ${
                  msg.role === "agent"
                    ? "bg-white border border-[#EAE7DC] text-[#262626]"
                    : "bg-[#FF7F11] text-white ml-auto"
                }`}
              >
                {msg.content}
              </div>
              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-full bg-[#ACBFA4] flex-shrink-0 mt-0.5" />
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-7 h-7 rounded-full bg-[#262626] flex-shrink-0 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FF7F11]" />
              </div>
              <div className="bg-white border border-[#EAE7DC] px-4 py-3 rounded-sm">
                <div className="flex gap-1 items-center h-4">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#ACBFA4] animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Theme picker */}
          {showThemePicker && !isTyping && (
            <div className="flex flex-col gap-3 pl-10 animate-fade-up">
              {THEME_OPTIONS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSubmit(t.id)}
                  disabled={loading}
                  className="text-left border border-[#D8D3C8] bg-white hover:border-[#FF7F11] hover:bg-[#FFF8F2] transition-all px-4 py-3 rounded-sm group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#262626]">{t.label}</span>
                    <span className="text-xs text-[#FF7F11] opacity-0 group-hover:opacity-100 transition-opacity">Seleccionar →</span>
                  </div>
                  <p className="text-xs text-[#6B7565] mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
          )}

          {/* Welcome CTA */}
          {step === "welcome" && !isTyping && (
            <div className="pl-10 animate-fade-up delay-300">
              <Button onClick={() => handleSubmit("sí")} size="sm">Sí, empecemos</Button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input bar */}
      {showInput && !isTyping && (
        <div className="border-t border-[#EAE7DC] bg-white px-4 py-4">
          <div className="max-w-2xl mx-auto flex gap-3">
            <input
              type={step === "password" ? "password" : step === "email" ? "email" : step === "whatsapp" ? "tel" : "text"}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder={step === "email" ? "tu@correo.com" : step === "password" ? "Mínimo 8 caracteres" : step === "whatsapp" ? "+591 7xxxxxxx" : "Escribe aquí..."}
              className="flex-1 border border-[#D8D3C8] rounded-sm px-4 py-3 text-sm text-[#262626] placeholder:text-[#ACBFA4] focus:outline-none focus:border-[#FF7F11] focus:ring-1 focus:ring-[#FF7F11]/20 transition-colors bg-[#F7F5EE]"
              autoFocus
            />
            <Button onClick={() => handleSubmit()} disabled={!inputValue.trim()} loading={loading}>Enviar</Button>
          </div>
        </div>
      )}
    </div>
  );
}
