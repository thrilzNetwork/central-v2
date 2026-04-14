"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function RegistroPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="w-full max-w-sm animate-fade-up text-center">
        <div className="w-14 h-14 rounded-full bg-[#E2E8CE] flex items-center justify-center mx-auto mb-6">
          <svg className="w-6 h-6 text-[#FF7F11]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2
          className="text-[#262626] mb-3"
          style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: "1.75rem", fontWeight: 500 }}
        >
          Revisa tu correo
        </h2>
        <p className="text-sm text-[#6B7565]">
          Te enviamos un enlace de confirmación a{" "}
          <strong className="text-[#262626]">{email}</strong>. Una vez confirmado,
          podrás acceder a tu portal.
        </p>
        <div className="mt-8">
          <Link href="/login" className="text-sm text-[#FF7F11] hover:underline">
            Ir al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm animate-fade-up">
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
        Crea tu cuenta
      </h2>
      <p className="text-sm text-[#6B7565] mb-8">
        Regístrate como comprador para guardar tus propiedades favoritas.
      </p>

      <form onSubmit={handleRegister} className="flex flex-col gap-5">
        <Input
          label="Nombre completo"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="María García"
          required
        />
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
          <label className="label-caps text-[#6B7565]">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            minLength={8}
            required
            className="w-full border border-[#D8D3C8] bg-white px-4 py-3 text-sm text-[#262626] rounded-sm placeholder:text-[#ACBFA4] transition-colors focus:outline-none focus:border-[#FF7F11] focus:ring-1 focus:ring-[#FF7F11]/20"
          />
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-4 py-2 rounded-sm">
            {error}
          </p>
        )}

        <Button type="submit" loading={loading} size="lg" className="w-full mt-1">
          Crear cuenta
        </Button>
      </form>

      <div className="mt-8 pt-6 border-t border-[#EAE7DC]">
        <p className="text-sm text-[#6B7565] text-center">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-[#FF7F11] font-medium hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
