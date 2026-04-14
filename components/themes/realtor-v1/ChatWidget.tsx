"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, ChevronRight } from "lucide-react";

interface Message { id: string; from: "bot" | "user"; text: string; }
interface LeadData { name: string; phone: string; interest: string; budget: string; }
interface Step {
  id: string; botText: string;
  inputType: "text" | "tel" | "quick";
  quickOptions?: string[]; placeholder?: string;
  field: keyof LeadData;
}
interface ChatWidgetProps {
  realtorName: string; realtorPhone: string;
  primaryColor: string; profileId: string;
}

const STEPS: Step[] = [
  { id: "name",     botText: "¡Hola! 👋 ¿Cuál es tu nombre?",                                         inputType: "text",  placeholder: "Tu nombre", field: "name" },
  { id: "interest", botText: "Hola {name}! ¿Qué tipo de propiedad buscas?",                          inputType: "quick", quickOptions: ["🏠 Casa","🏢 Depto","🏗️ Terreno","🏬 Local"], field: "interest" },
  { id: "budget",   botText: "¿Cuál es tu presupuesto?",                                              inputType: "quick", quickOptions: ["Hasta $50k","$50k–$100k","$100k–$200k","+$200k"],  field: "budget" },
  { id: "phone",    botText: "Para conectarte con {realtorName}, ¿cuál es tu WhatsApp?",              inputType: "tel",   placeholder: "+591 7X XXX XXXX", field: "phone" },
];

export function ChatWidget({ realtorName, realtorPhone, primaryColor, profileId }: ChatWidgetProps) {
  const [open,         setOpen]         = useState(false);
  const [messages,     setMessages]     = useState<Message[]>([]);
  const [currentStep,  setCurrentStep]  = useState(0);
  const [inputValue,   setInputValue]   = useState("");
  const [leadData,     setLeadData]     = useState<LeadData>({ name: "", phone: "", interest: "", budget: "" });
  const [done,         setDone]         = useState(false);
  const [typing,       setTyping]       = useState(false);
  const [teaserVisible, setTeaserVisible] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  // Show teaser bubble after 4 seconds
  useEffect(() => {
    const t = setTimeout(() => setTeaserVisible(true), 4000);
    return () => clearTimeout(t);
  }, []);

  // Hide teaser when chat opens
  useEffect(() => {
    if (open) {
      setTeaserVisible(false);
      if (messages.length === 0) showBotMessage(STEPS[0].botText, {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);
  useEffect(() => { if (open && !done) setTimeout(() => inputRef.current?.focus(), 300); }, [currentStep, open, done]);

  function fill(text: string, data: Partial<LeadData>) {
    return text.replace("{name}", data.name ?? "").replace("{realtorName}", realtorName);
  }
  function addMsg(from: "bot" | "user", text: string) {
    setMessages(p => [...p, { id: `${Date.now()}-${Math.random()}`, from, text }]);
  }
  function showBotMessage(text: string, data: Partial<LeadData>) {
    setTyping(true);
    setTimeout(() => { setTyping(false); addMsg("bot", fill(text, data)); }, 800);
  }

  async function handleAnswer(answer: string) {
    const step    = STEPS[currentStep];
    const newData = { ...leadData, [step.field]: answer };
    setLeadData(newData);
    setInputValue("");
    addMsg("user", answer);
    const next = currentStep + 1;
    if (next < STEPS.length) { setCurrentStep(next); showBotMessage(STEPS[next].botText, newData); }
    else await finishFlow(newData);
  }

  async function finishFlow(data: LeadData) {
    setTyping(true);
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, visitorName: data.name, visitorPhone: data.phone, message: `Busca: ${data.interest} | Presupuesto: ${data.budget}` }),
      });
    } catch { /* non-fatal */ }
    setTimeout(() => {
      setTyping(false);
      addMsg("bot", `¡Listo, ${data.name}! 🎉 Ahora te conectamos con ${realtorName} por WhatsApp.`);
      setDone(true);
    }, 1000);
  }

  function openWhatsApp() {
    const msg = `Hola ${realtorName}! Soy *${leadData.name}*.\n📱 ${leadData.phone}\n🏠 Busco: ${leadData.interest}\n💰 Presupuesto: ${leadData.budget}\n\nMe contacté desde tu portal inmobiliario.`;
    window.open(`https://wa.me/${realtorPhone.replace(/\D/g,"")}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  const activeStep = STEPS[Math.min(currentStep, STEPS.length - 1)];

  return (
    <>
      {/* ── Floating button + teaser ──────────────────────────── */}
      <div style={{ position: "fixed", bottom: 24, right: 20, zIndex: 9999, display: "flex", alignItems: "center", gap: 10, flexDirection: "row-reverse" }}>
        {/* Bubble button */}
        <motion.button
          onClick={() => setOpen(v => !v)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.92 }}
          style={{
            width: 48, height: 48, borderRadius: "50%",
            background: primaryColor, border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 6px 24px ${primaryColor}55`, color: "#fff", flexShrink: 0,
          }}
          aria-label="Chat"
        >
          <AnimatePresence mode="wait" initial={false}>
            {open
              ? <motion.span key="x"  initial={{ rotate: -80, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}><X size={20} /></motion.span>
              : <motion.span key="wh" initial={{ rotate: 80,  opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  {/* WhatsApp icon */}
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.116 1.524 5.849L0 24l6.335-1.505A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.81 9.81 0 01-5.031-1.384l-.36-.214-3.733.887.935-3.634-.235-.374A9.808 9.808 0 012.182 12C2.182 6.58 6.58 2.182 12 2.182c5.42 0 9.818 4.398 9.818 9.818 0 5.42-4.398 9.818-9.818 9.818z"/>
                  </svg>
                </motion.span>
            }
          </AnimatePresence>
        </motion.button>

        {/* Teaser pill — appears after 4 s, hides when chat opens */}
        <AnimatePresence>
          {teaserVisible && !open && (
            <motion.button
              onClick={() => setOpen(true)}
              initial={{ opacity: 0, x: 16, scale: 0.9 }}
              animate={{ opacity: 1, x: 0,  scale: 1 }}
              exit={{   opacity: 0, x: 16,  scale: 0.9 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              style={{
                background: "#fff", border: "none", cursor: "pointer",
                padding: "8px 14px", borderRadius: 20,
                boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
                display: "flex", alignItems: "center", gap: 8,
                fontFamily: "'Manrope', sans-serif",
                whiteSpace: "nowrap",
              }}
            >
              {/* Green dot */}
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", flexShrink: 0, display: "inline-block" }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>¿Quieres hablar ahora?</span>
              {/* Close teaser only */}
              <span
                role="button"
                onClick={e => { e.stopPropagation(); setTeaserVisible(false); }}
                style={{ marginLeft: 2, color: "#aaa", lineHeight: 1, fontSize: 14, cursor: "pointer" }}
              >✕</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── Chat window ───────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{   opacity: 0, y: 20,  scale: 0.97 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{
              position: "fixed",
              bottom: 82, right: 20,
              zIndex: 9998,
              width: "min(340px, calc(100vw - 32px))",
              background: "#1a1a1a",
              borderRadius: 16,
              boxShadow: "0 20px 56px rgba(0,0,0,0.65)",
              display: "flex", flexDirection: "column",
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.07)",
              fontFamily: "'Manrope', sans-serif",
            }}
          >
            {/* Header */}
            <div style={{ background: primaryColor, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🏠</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: "#fff", fontWeight: 600, fontSize: 13, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{realtorName}</p>
                <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 10, margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} /> En línea
                </p>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", padding: 2, lineHeight: 1 }}>
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 6px", display: "flex", flexDirection: "column", gap: 8, minHeight: 220, maxHeight: 300 }}>
              {messages.map(msg => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                  style={{ display: "flex", justifyContent: msg.from === "user" ? "flex-end" : "flex-start" }}
                >
                  <div style={{
                    maxWidth: "80%", padding: "9px 13px",
                    borderRadius: msg.from === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                    background: msg.from === "user" ? primaryColor : "rgba(255,255,255,0.09)",
                    color: "rgba(255,255,255,0.92)", fontSize: 12.5, lineHeight: 1.55,
                  }}>{msg.text}</div>
                </motion.div>
              ))}

              <AnimatePresence>
                {typing && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div style={{ display: "inline-flex", gap: 4, padding: "9px 13px", background: "rgba(255,255,255,0.09)", borderRadius: "14px 14px 14px 4px" }}>
                      {[0,1,2].map(i => (
                        <motion.span key={i} animate={{ y: [0,-4,0] }} transition={{ duration: 0.55, delay: i*0.14, repeat: Infinity }}
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
                        style={{ padding: "6px 12px", borderRadius: 20, border: `1.5px solid ${primaryColor}`, background: "transparent", color: primaryColor, fontSize: 11.5, cursor: "pointer", fontFamily: "'Manrope',sans-serif", fontWeight: 500 }}
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
                      style={{ width: 36, height: 36, borderRadius: 10, background: inputValue.trim() ? primaryColor : "rgba(255,255,255,0.08)", border: "none", cursor: inputValue.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0, transition: "background 0.2s" }}
                    ><Send size={14} /></motion.button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: "10px 12px 16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <motion.button onClick={openWhatsApp} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  style={{ width: "100%", padding: "11px 0", background: "#25D366", border: "none", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: "'Manrope',sans-serif" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.116 1.524 5.849L0 24l6.335-1.505A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.81 9.81 0 01-5.031-1.384l-.36-.214-3.733.887.935-3.634-.235-.374A9.808 9.808 0 012.182 12C2.182 6.58 6.58 2.182 12 2.182c5.42 0 9.818 4.398 9.818 9.818 0 5.42-4.398 9.818-9.818 9.818z"/></svg>
                  Continuar por WhatsApp <ChevronRight size={14} />
                </motion.button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
