"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Profile } from "@/types/tenant";

const COLOR_PRESETS = [
  { name: "Naranja", value: "#FF7F11" },
  { name: "Salvia", value: "#ACBFA4" },
  { name: "Ébano", value: "#262626" },
  { name: "Cobalto", value: "#1B4FD8" },
  { name: "Esmeralda", value: "#059669" },
  { name: "Vino", value: "#9B1C1C" },
];

export function ProfileEditor({ profile }: { profile: Profile | null }) {
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [whatsapp, setWhatsapp] = useState(profile?.whatsapp ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [city, setCity] = useState(profile?.city ?? "Santa Cruz");
  const [primaryColor, setPrimaryColor] = useState(profile?.primary_color ?? "#FF7F11");
  const [secondaryColor, setSecondaryColor] = useState(profile?.secondary_color ?? "#ACBFA4");
  const [logoUrl, setLogoUrl] = useState(profile?.logo_url ?? "");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "logos");
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error al subir imagen");
    } else if (data.url) {
      setLogoUrl(data.url);
    }
    setUploadingLogo(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: fullName,
        whatsapp,
        bio,
        city,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        logo_url: logoUrl,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error al guardar");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4">
      {/* Basic info */}
      <div className="bg-white border border-[#EAE7DC] rounded-sm p-4 sm:p-6 flex flex-col gap-4">
        <h2 className="text-[#262626] border-b border-[#EAE7DC] pb-3"
          style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: "1.1rem", fontWeight: 500 }}>
          Información Personal
        </h2>

        <Input label="Nombre completo" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        <Input label="WhatsApp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+59171234567" />
        <Input label="Ciudad" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Santa Cruz" />

        <div className="flex flex-col gap-1.5">
          <label className="label-caps text-[#6B7565]">Bio / Descripción</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            placeholder="Cuéntanos sobre ti y tu especialidad..."
            className="w-full border border-[#D8D3C8] rounded-sm px-4 py-3 text-sm text-[#262626] placeholder:text-[#ACBFA4] focus:outline-none focus:border-[#FF7F11] transition-colors resize-none"
          />
        </div>

        {/* Portal URL */}
        <div className="flex flex-col gap-1.5">
          <label className="label-caps text-[#6B7565]">Tu URL de portal</label>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center border border-[#EAE7DC] rounded-sm bg-[#F7F5EE] px-3 py-2.5 min-w-0 flex-1">
              <span className="text-xs text-[#ACBFA4] shrink-0">central.bo/</span>
              <span className="text-sm text-[#262626] font-medium truncate">{profile?.slug}</span>
            </div>
            <a
              href={`https://${profile?.slug}.central.bo`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2.5 bg-[#FF7F11] text-white text-xs font-medium rounded-sm hover:bg-[#CC6500] transition-colors whitespace-nowrap"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Ver Portal
            </a>
          </div>
        </div>
      </div>

      {/* Logo */}
      <div className="bg-white border border-[#EAE7DC] rounded-sm p-4 sm:p-6 flex flex-col gap-4">
        <h2 className="text-[#262626] border-b border-[#EAE7DC] pb-3"
          style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: "1.1rem", fontWeight: 500 }}>
          Logo
        </h2>
        <div className="flex items-center gap-4 flex-wrap">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-16 h-16 object-contain border border-[#EAE7DC] rounded-sm p-1 bg-white" />
          ) : (
            <div className="w-16 h-16 bg-[#E2E8CE] rounded-sm flex items-center justify-center shrink-0">
              <span className="text-xl font-bold" style={{ color: primaryColor }}>
                {fullName[0]?.toUpperCase() ?? "C"}
              </span>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 border border-[#D8D3C8] text-sm text-[#262626] rounded-sm hover:bg-[#F7F5EE] transition-colors">
              {uploadingLogo ? (
                <><div className="w-4 h-4 border-2 border-[#FF7F11] border-t-transparent rounded-full animate-spin" />Subiendo...</>
              ) : "Subir logo"}
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </label>
            {logoUrl && (
              <button type="button" onClick={() => setLogoUrl("")}
                className="text-xs text-red-500 hover:underline text-left">
                Eliminar logo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Brand colors */}
      <div className="bg-white border border-[#EAE7DC] rounded-sm p-4 sm:p-6 flex flex-col gap-4">
        <h2 className="text-[#262626] border-b border-[#EAE7DC] pb-3"
          style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: "1.1rem", fontWeight: 500 }}>
          Colores de Marca
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[
            { label: "Color Principal", color: primaryColor, setColor: setPrimaryColor },
            { label: "Color Secundario", color: secondaryColor, setColor: setSecondaryColor },
          ].map(({ label, color, setColor }) => (
            <div key={label}>
              <label className="label-caps text-[#6B7565] block mb-2">{label}</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {COLOR_PRESETS.map((c) => (
                  <button key={c.value} type="button" title={c.name}
                    onClick={() => setColor(c.value)}
                    className="w-8 h-8 rounded-full transition-transform active:scale-95 border-2"
                    style={{ backgroundColor: c.value, borderColor: color === c.value ? "#262626" : "transparent" }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                  className="w-10 h-9 cursor-pointer border border-[#D8D3C8] rounded-sm" />
                <span className="text-sm font-mono text-[#6B7565]">{color}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Live preview */}
        <div className="rounded-sm p-3 flex items-center justify-between" style={{ backgroundColor: "#262626" }}>
          <span className="text-white text-sm truncate mr-3">{fullName || "Tu Nombre"}</span>
          <div className="px-3 py-1.5 rounded-sm text-white text-xs shrink-0" style={{ backgroundColor: primaryColor }}>
            Ver Portal
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-4 py-3 rounded-sm">
          {error}
        </p>
      )}

      <Button type="submit" loading={saving} size="lg" className="w-full sm:w-auto">
        {saved ? "✓ Guardado" : "Guardar Cambios"}
      </Button>
    </form>
  );
}
