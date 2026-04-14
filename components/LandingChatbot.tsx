"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, MessageCircle } from "lucide-react";

interface Message { id: string; from: "bot" | "user"; text: string; }

interface LeadData {
  role: string;
  properties: string;
  challenge: string;
  name: string;
  phone: string;
}

interface Step {
  id: string;
  botText: string;
  inputType: "text" | "tel" | "quick";
  quickOptions?: string[];
  placeholder?: string;
  field: keyof LeadData;
}

const STEPS: Step[] = [
  {
    id: "role",
    botText: "Hola! 👋 Soy el asistente de Central Bolivia.\n\n¿Cómo describes tu rol?",
    inputType: "quick",
    quickOptions: ["🏢 Agente independiente", "🏛️ Broker / Dueño de agencia", "🌐 Franquicia (Re/Max, C21…)", "📋 Otro"],
    field: "role",
  },
  {
    id: "properties",
    botText: "Perfecto. ¿Cuántas propiedades manejas actualmente?",
    inputType: "quick",
    quickOptions: ["1–5 propiedades", "6–20 propiedades", "21–50 propiedades", "+50 propiedades"],
    field: "properties",
  },
  {
    id: "challenge",
    botText: "¿Cuál es tu mayor reto hoy en día?",
    inputType: "quick",
    quickOptions: ["Capturar más leads", "Presencia digital profesional", "Organizar mis propiedades", "Escalar mi equipo"],
    field: "challenge",
  },
  {
    id: "name",
    botText: "Excelente. ¿Cuál es tu nombre completo?",
    inputType: "text",
    placeholder: "Tu nombre",
    field: "name",
  },
  {
    id: "phone",
    botText: "Y tu número de WhatsApp para que nuestro equipo te contacte:",
    inputType: "tel",
    placeholder: "+591 7X XXX XXXX",
    field: "phone",
  },
];

function scoreLead(data: Partial<LeadData>): "alto" | "medio" | "bajo" {
  let score = 0;
  if (data.role?.includes("Broker") || data.role?.includes("Franquicia")) score += 3;
  else if (data.role?.includes("Agente")) score += 1;
  if (data.properties?.includes("+50") || data.properties?.includes("21–50")) score += 3;
  else if (data.properties?.includes("6–20")) score += 2;
  else score += 1;
  if (data.challenge?.includes("Escalar") || data.challenge?.includes("equipo")) score += 2;
  if (score >= 6) return "alto";
  if (score >= 3) return "medio";
  return "bajo";
}

export function LandingChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [leadData, setLeadData] = useState<Partial<LeadData>>({});
  const [done, setDone] = useState(false);
  const [typing, setTyping] = useState(false);
  const [teaserVisible, setTeaserVisible] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setTeaserVisible(true), 6000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (open) {
      setTeaserVisible(false);
      if (messages.length === 0) showBotMessage(STEPS[0].botText);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);
  useEffect(() => { if (open && !done) setTimeout(() => inputRef.current?.focus(), 300); }, [currentStep, open, done]);

  function addMsg(from: "bot" | "user", text: string) {
    setMessages(p => [...p, { id: `${Date.now()}-${Math.random()}`, from, text }]);
  }
  function showBotMessage(text: string) {
    setTyping(true);
    setTimeout(() => { setTyping(false); addMsg("bot", text); }, 700);
  }

  async function handleAnswer(answer: string) {
    const step = STEPS[currentStep];
    const newData = { ...leadData, [step.field]: answer };
    setLeadData(newData);
    setInputValue("");
    addMsg("user", answer);
    const next = currentStep + 1;
    if (next < STEPS.length) {
      setCurrentStep(next);
      showBotMessage(STEPS[next].botText);
    } else {
      await finishFlow(newData as LeadData);
    }
  }

  async function finishFlow(data: LeadData) {
    setTyping(true);
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          phone: data.phone,
          role: data.role,
          properties: data.properties,
          challenge: data.challenge,
          score: scoreLead(data),
          source: "landing_chatbot",
        }),
      });
    } catch { /* non-fatal */ }
    setTimeout(() => {
      setTyping(false);
      const score = scoreLead(data);
      const msg = score === "alto"
        ? `¡Excelente, ${data.name}! 🎉 Tu perfil es exactamente para quien diseñamos Central Bolivia. Nuestro equipo te contactará en las próximas horas.`
        : `¡Gracias, ${data.name}! Recibimos tu información. Te contactaremos pronto para mostrarte cómo Central Bolivia puede ayudarte.`;
      addMsg("bot", msg);
      setDone(true);
    }, 1000);
  }

  const activeStep = STEPS[Math.min(currentStep, STEPS.length - 1)];
  const PRIMARY = "#FF7F11";

  return (
    <>
      {/* Floating button + teaser */}
      <div style={{ position: "fixed", bottom: 24, left: 20, zIndex: 9999, display: "flex", alignItems: "center", gap: 10 }}>
        <motion.button
          onClick={() => setOpen(v => !v)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
          style={{
            width: 52, height: 52, borderRadius: "50%",
            background: "#262626", border: `2px solid ${PRIMARY}`,
            cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", color: PRIMARY, flexShrink: 0,
            boxShadow: "0 6px 24px rgba(0,0,0,0.25)",
          }}
          aria-label="Asistente Central Bolivia"
        >
          <AnimatePresence mode="wait" initial={false}>
            {open
              ? <motion.span key="x" initial={{ rotate: -80, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}><X size={20} /></motion.span>
              : <motion.span key="chat" initial={{ rotate: 80, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}><MessageCircle size={22} /></motion.span>
            }
          </AnimatePresence>
        </motion.button>

        <AnimatePresence>
          {teaserVisible && !open && (
            <motion.button
              onClick={() => setOpen(true)}
              initial={{ opacity: 0, x: -16, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -16, scale: 0.9 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              style={{
                background: "#262626", border: `1px solid ${PRIMARY}`, cursor: "pointer",
                padding: "8px 14px", borderRadius: 20,
                boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
                display: "flex", alignItems: "center", gap: 8,
                fontFamily: "'Manrope', sans-serif", whiteSpace: "nowrap",
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>¿Eres agente o broker?</span>
              <span role="button" onClick={e => { e.stopPropagation(); setTeaserVisible(false); }}
                style={{ marginLeft: 2, color: "#666", fontSize: 14, cursor: "pointer" }}>✕</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{
              position: "fixed", bottom: 82, left: 20, zIndex: 9998,
              width: "min(340px, calc(100vw - 32px))",
              background: "#1a1a1a", borderRadius: 16,
              boxShadow: "0 20px 56px rgba(0,0,0,0.55)",
              display: "flex", flexDirection: "column", overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.08)",
              fontFamily: "'Manrope', sans-serif",
            }}
          >
            {/* Header */}
            <div style={{ background: "#262626", borderBottom: `2px solid ${PRIMARY}`, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: PRIMARY + "22", border: `1px solid ${PRIMARY}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🏠</div>
              <div style={{ flex: 1 }}>
                <p style={{ color: "#fff", fontWeight: 700, fontSize: 13, margin: 0 }}>Central Bolivia</p>
                <p style={{ color: PRIMARY, fontSize: 10, margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} /> Asistente en línea
                </p>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 6px", display: "flex", flexDirection: "column", gap: 8, minHeight: 220, maxHeight: 300 }}>
              {messages.map(msg => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                  style={{ display: "flex", justifyContent: msg.from === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{
                    maxWidth: "85%", padding: "9px 13px",
                    borderRadius: msg.from === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                    background: msg.from === "user" ? PRIMARY : "rgba(255,255,255,0.08)",
                    color: "#fff", fontSize: 12.5, lineHeight: 1.55, whiteSpace: "pre-line",
                  }}>{msg.text}</div>
                </motion.div>
              ))}
              <AnimatePresence>
                {typing && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div style={{ display: "inline-flex", gap: 4, padding: "9px 13px", background: "rgba(255,255,255,0.08)", borderRadius: "14px 14px 14px 4px" }}>
                      {[0, 1, 2].map(i => (
                        <motion.span key={i} animate={{ y: [0, -4, 0] }} transition={{ duration: 0.55, delay: i * 0.14, repeat: Infinity }}
                          style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.35)", display: "block" }} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            {!done ? (
              <div style={{ padding: "6px 12px 14px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                {!typing && activeStep?.inputType === "quick" && currentStep < STEPS.length && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                    {activeStep.quickOptions?.map(opt => (
                      <motion.button key={opt} onClick={() => handleAnswer(opt)} whileTap={{ scale: 0.95 }}
                        style={{ padding: "6px 11px", borderRadius: 20, border: `1.5px solid ${PRIMARY}`, background: "transparent", color: PRIMARY, fontSize: 11.5, cursor: "pointer", fontFamily: "'Manrope',sans-serif", fontWeight: 500 }}
                      >{opt}</motion.button>
                    ))}
                  </div>
                )}
                {!typing && activeStep?.inputType !== "quick" && currentStep < STEPS.length && (
                  <div style={{ display: "flex", gap: 7 }}>
                    <input ref={inputRef} type={activeStep.inputType} value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && inputValue.trim() && handleAnswer(inputValue.trim())}
                      placeholder={activeStep.placeholder ?? "Escribe aquí…"}
                      style={{ flex: 1, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "9px 13px", color: "#fff", fontSize: 12.5, fontFamily: "'Manrope',sans-serif", outline: "none" }}
                    />
                    <motion.button onClick={() => inputValue.trim() && handleAnswer(inputValue.trim())} whileTap={{ scale: 0.9 }} disabled={!inputValue.trim()}
                      style={{ width: 36, height: 36, borderRadius: 10, background: inputValue.trim() ? PRIMARY : "rgba(255,255,255,0.08)", border: "none", cursor: inputValue.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0, transition: "background 0.2s" }}
                    ><Send size={14} /></motion.button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: "10px 12px 16px", borderTop: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, margin: "0 0 8px" }}>Nuestro equipo te contactará pronto.</p>
                <motion.button onClick={() => setOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ padding: "10px 24px", background: PRIMARY, border: "none", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Manrope',sans-serif" }}
                >Cerrar</motion.button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
