"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

type Stage = "loading" | "form" | "done" | "error";

export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-sm flex flex-col items-center gap-4 pt-10">
        <div className="w-8 h-8 border-2 border-[#FF7F11] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <UpdatePasswordInner />
    </Suspense>
  );
}

function UpdatePasswordInner() {
  const searchParams = useSearchParams();
  const [stage, setStage] = useState<Stage>("loading");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Exchange the PKCE code that Supabase appended to this URL
  const exchangeCode = useCallback(async () => {
    const code = searchParams.get("code");
    if (!code) {
      // No code — maybe user navigated here directly without a reset link
      setStage("error");
      return;
    }
    const supabase = createClient();
    const { error: err } = await supabase.auth.exchangeCodeForSession(code);
    if (err) {
      setStage("error");
    } else {
      setStage("form");
    }
  }, [searchParams]);

  useEffect(() => {
    exchangeCode();
  }, [exchangeCode]);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError("No se pudo actualizar la contraseña. Intenta solicitar un nuevo enlace.");
      setSaving(false);
      return;
    }
    setStage("done");
    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 2000);
  }

  // ── Loading ───────────────────────────────────────────
  if (stage === "loading") {
    return (
      <div className="w-full max-w-sm animate-fade-up flex flex-col items-center gap-4 pt-10">
        <div className="w-8 h-8 border-2 border-[#FF7F11] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[#6B7565]">Verificando enlace...</p>
      </div>
    );
  }

  // ── Invalid / expired link ────────────────────────────
  if (stage === "error") {
    return (
      <div className="w-full max-w-sm animate-fade-up text-center">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
          <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2
          className="text-[#262626] mb-3"
          style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: "1.8rem", fontWeight: 500 }}
        >
          Enlace inválido
        </h2>
        <p className="text-sm text-[#6B7565] mb-8">
          Este enlace expiró o ya fue usado. Solicita uno nuevo.
        </p>
        <a href="/reset-password" className="inline-block px-5 py-2.5 bg-[#FF7F11] text-white text-sm font-medium rounded-sm hover:bg-[#CC6500] transition-colors">
          Solicitar nuevo enlace
        </a>
      </div>
    );
  }

  // ── Done ─────────────────────────────────────────────
  if (stage === "done") {
    return (
      <div className="w-full max-w-sm animate-fade-up text-center">
        <div className="w-14 h-14 rounded-full bg-[#FF7F11]/10 flex items-center justify-center mx-auto mb-6">
          <svg className="w-7 h-7 text-[#FF7F11]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2
          className="text-[#262626] mb-3"
          style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: "1.8rem", fontWeight: 500 }}
        >
          Contraseña actualizada
        </h2>
        <p className="text-sm text-[#6B7565]">Redirigiendo a tu panel...</p>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────
  return (
    <div className="w-full max-w-sm animate-fade-up">
      <div className="lg:hidden mb-10">
        <span className="label-caps text-[#6B7565]">Central</span>
        <div className="mt-2 w-8 h-0.5 bg-[#FF7F11]" />
      </div>

      <h2
        className="mb-2 text-[#262626]"
        style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: "2rem", fontWeight: 500, letterSpacing: "-0.01em" }}
      >
        Nueva contraseña
      </h2>
      <p className="text-sm text-[#6B7565] mb-8">
        Elige una contraseña segura para tu cuenta.
      </p>

      <form onSubmit={handleUpdate} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="label-caps text-[#6B7565]">Nueva contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            required
            autoComplete="new-password"
            className="w-full border border-[#D8D3C8] bg-white px-4 py-3 text-sm text-[#262626] rounded-sm placeholder:text-[#ACBFA4] transition-colors focus:outline-none focus:border-[#FF7F11] focus:ring-1 focus:ring-[#FF7F11]/20"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="label-caps text-[#6B7565]">Confirmar contraseña</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repite la contraseña"
            required
            autoComplete="new-password"
            className="w-full border border-[#D8D3C8] bg-white px-4 py-3 text-sm text-[#262626] rounded-sm placeholder:text-[#ACBFA4] transition-colors focus:outline-none focus:border-[#FF7F11] focus:ring-1 focus:ring-[#FF7F11]/20"
          />
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-4 py-2 rounded-sm">
            {error}
          </p>
        )}

        <Button type="submit" loading={saving} size="lg" className="w-full mt-1">
          Guardar contraseña
        </Button>
      </form>
    </div>
  );
}
