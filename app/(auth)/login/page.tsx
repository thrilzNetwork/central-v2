"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PhoneCall } from "lucide-react";

const TRIAL_DAYS = 3;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trialExpired, setTrialExpired] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: signInData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Correo o contraseña incorrectos.");
      setLoading(false);
      return;
    }

    // Check trial expiry
    const userId = signInData.user?.id;
    if (userId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("created_at")
        .eq("id", userId)
        .single();

      if (profile?.created_at) {
        const createdAt = new Date(profile.created_at);
        const trialEnd = new Date(createdAt.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
        if (new Date() > trialEnd) {
          // Sign them back out and show trial expired screen
          await supabase.auth.signOut();
          setTrialExpired(true);
          setLoading(false);
          return;
        }
      }
    }

    // Hard redirect so the server picks up the newly set auth cookie
    window.location.href = "/dashboard";
  }

  if (trialExpired) {
    return (
      <div className="w-full max-w-sm animate-fade-up text-center">
        <div className="w-14 h-14 bg-[#FFF0E8] rounded-full flex items-center justify-center mx-auto mb-6">
          <PhoneCall className="w-6 h-6 text-[#FF7F11]" />
        </div>
        <h2
          className="mb-3 text-[#262626]"
          style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: "2rem", fontWeight: 500 }}
        >
          Tu prueba gratuita ha finalizado
        </h2>
        <p className="text-sm text-[#6B7565] mb-8 leading-relaxed">
          Los 3 días de acceso de demostración han concluido. Para continuar usando Central y mantener tu portal activo, contáctanos para activar tu plan.
        </p>
        <a
          href="tel:+19546488174"
          className="flex items-center justify-center gap-3 w-full py-4 bg-[#FF7F11] text-white font-medium rounded-sm hover:bg-[#CC6500] transition-all text-base mb-4"
        >
          <PhoneCall className="w-5 h-5" />
          Llamar: +1 (954) 648-8174
        </a>
        <a
          href="https://wa.me/19546488174?text=Hola,%20mi%20prueba%20de%20Central%20Bolivia%20terminó.%20Quisiera%20activar%20mi%20plan."
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 w-full py-4 border border-[#D8D3C8] text-[#262626] font-medium rounded-sm hover:bg-[#F7F5EE] transition-all text-sm"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#25D366]" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Escribir por WhatsApp
        </a>
        <p className="text-xs text-[#ACBFA4] mt-6">
          ¿Ya tienes un plan activo?{" "}
          <button onClick={() => setTrialExpired(false)} className="text-[#FF7F11] hover:underline">
            Intentar de nuevo
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm animate-fade-up">
      {/* Mobile logo */}
      <div className="lg:hidden mb-10">
        <span className="label-caps text-[#6B7565]">Central</span>
        <div className="mt-2 w-8 h-0.5 bg-[#FF7F11]" />
      </div>

      <h2
        className="mb-2 text-[#262626]"
        style={{
          fontFamily: "Cormorant Garamond, Georgia, serif",
          fontSize: "2rem",
          fontWeight: 500,
          letterSpacing: "-0.01em",
        }}
      >
        Bienvenido de vuelta
      </h2>
      <p className="text-sm text-[#6B7565] mb-8">
        Ingresa a tu panel de agente.
      </p>

      <form onSubmit={handleLogin} className="flex flex-col gap-5">
        <Input
          label="Correo electrónico"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          required
          autoComplete="email"
        />
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="label-caps text-[#6B7565]">Contraseña</label>
            <Link
              href="/reset-password"
              className="text-xs text-[#FF7F11] hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
            className="w-full border border-[#D8D3C8] bg-white px-4 py-3 text-sm text-[#262626] rounded-sm placeholder:text-[#ACBFA4] transition-colors focus:outline-none focus:border-[#FF7F11] focus:ring-1 focus:ring-[#FF7F11]/20"
          />
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-4 py-2 rounded-sm">
            {error}
          </p>
        )}

        <Button type="submit" loading={loading} size="lg" className="w-full mt-1">
          Ingresar
        </Button>
      </form>

      <div className="mt-8 pt-6 border-t border-[#EAE7DC]">
        <p className="text-sm text-[#6B7565] text-center">
          ¿Eres nuevo en Central?{" "}
          <Link
            href="/bienvenido"
            className="text-[#FF7F11] font-medium hover:underline"
          >
            Crea tu portal gratis
          </Link>
        </p>
      </div>
    </div>
  );
}
