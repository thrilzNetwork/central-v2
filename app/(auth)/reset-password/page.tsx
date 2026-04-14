"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${appUrl}/update-password`,
      }
    );

    if (resetError) {
      setError("No pudimos enviar el correo. Intenta de nuevo.");
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="w-full max-w-sm animate-fade-up text-center">
        <div className="w-14 h-14 rounded-full bg-[#FF7F11]/10 flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-7 h-7 text-[#FF7F11]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h2
          className="text-[#262626] mb-3"
          style={{
            fontFamily: "Cormorant Garamond, Georgia, serif",
            fontSize: "1.8rem",
            fontWeight: 500,
          }}
        >
          Revisa tu correo
        </h2>
        <p className="text-sm text-[#6B7565] mb-8 leading-relaxed">
          Si <strong className="text-[#262626]">{email}</strong> está
          registrado, recibirás un enlace para restablecer tu contraseña en
          los próximos minutos.
        </p>
        <Link
          href="/login"
          className="label-caps text-[#FF7F11] hover:underline"
        >
          ← Volver al inicio de sesión
        </Link>
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
        Restablecer contraseña
      </h2>
      <p className="text-sm text-[#6B7565] mb-8">
        Ingresa tu correo y te enviaremos un enlace para crear una nueva contraseña.
      </p>

      <form onSubmit={handleReset} className="flex flex-col gap-5">
        <Input
          label="Correo electrónico"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          required
          autoComplete="email"
        />

        {error && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-4 py-2 rounded-sm">
            {error}
          </p>
        )}

        <Button type="submit" loading={loading} size="lg" className="w-full mt-1">
          Enviar enlace
        </Button>
      </form>

      <div className="mt-8 pt-6 border-t border-[#EAE7DC] text-center">
        <Link href="/login" className="label-caps text-[#6B7565] hover:text-[#FF7F11]">
          ← Volver al inicio de sesión
        </Link>
      </div>
    </div>
  );
}
