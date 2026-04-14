"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AddressAutocomplete } from "@/components/geo/AddressAutocomplete";
import { MiniMap } from "@/components/geo/MiniMap";
import type { AutocompleteSuggestion } from "@/lib/geo/client";

type InputMode = "address" | "pdf" | "image";
type PropertyType = "casa" | "departamento" | "terreno" | "oficina" | "local_comercial" | "otro";

export function MagicPropertyForm() {
  const [mode, setMode] = useState<InputMode>("address");
  const [address, setAddress] = useState("");
  // lat/lng from autocomplete selection (pre-geocoded before magic populate)
  const [previewCoords, setPreviewCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Editable fields after generation
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [propertyType, setPropertyType] = useState<PropertyType>("casa");
  const [area, setArea] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [listingStatus, setListingStatus] = useState("borrador");
  const [saving, setSaving] = useState(false);

  // Coords to show on map — prefer the server-geocoded result, fall back to autocomplete preview
  const mapLat = (generated?.lat as number | null) ?? previewCoords?.lat ?? null;
  const mapLng = (generated?.lng as number | null) ?? previewCoords?.lng ?? null;

  function handleAddressSelect(s: AutocompleteSuggestion) {
    setPreviewCoords({ lat: s.lat, lng: s.lng });
  }

  async function handleMagicGenerate() {
    if (mode === "address" && !address.trim()) return;
    if (mode === "pdf" && !pdfFile) return;
    if (mode === "image" && !imageFile) return;

    setGenerating(true);
    setError(null);

    try {
      let body: Record<string, unknown> = {};

      if (mode === "address") {
        body = { address };
      } else if (pdfFile) {
        const arrayBuffer = await pdfFile.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        body = { pdfBase64: base64, fileName: pdfFile.name };
      } else if (imageFile) {
        const arrayBuffer = await imageFile.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        body = { imageBase64: base64, fileName: imageFile.name };
      }

      const res = await fetch("/api/magic-property", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al generar");

      setGenerated(data);
      setTitle(data.title ?? "");
      setDescription(data.description ?? "");
      setPrice(data.price?.toString() ?? "");
      setPropertyType(data.property_type ?? "casa");
      setArea(data.area_m2?.toString() ?? "");
      setBedrooms(data.bedrooms?.toString() ?? "");
      setBathrooms(data.bathrooms?.toString() ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          price: price ? parseFloat(price) : null,
          currency,
          property_type: propertyType,
          area_m2: area ? parseFloat(area) : null,
          bedrooms: bedrooms ? parseInt(bedrooms) : null,
          bathrooms: bathrooms ? parseInt(bathrooms) : null,
          status: listingStatus,
          address: generated?.address ?? address,
          neighborhood: generated?.neighborhood,
          city: generated?.city,
          lat: generated?.lat,
          lng: generated?.lng,
          neighborhood_summary: generated?.neighborhood_summary,
          ai_generated: !!generated,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = "/dashboard/propiedades";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* ── Magic input section ──────────────────────────────── */}
      <div className="bg-white border border-[#EAE7DC] rounded-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-6 h-6 rounded-full bg-[#FF7F11] flex items-center justify-center">
            <span className="text-white text-xs font-bold">✦</span>
          </div>
          <h2
            className="text-[#262626]"
            style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: "1.25rem", fontWeight: 500 }}
          >
            Magic Populate
          </h2>
          <span className="label-caps text-[#6B7565] ml-auto">IA</span>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-2 mb-5">
          {(["address", "pdf", "image"] as InputMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="px-4 py-2 text-sm rounded-sm border transition-all"
              style={
                mode === m
                  ? { backgroundColor: "#262626", color: "white", borderColor: "#262626" }
                  : { backgroundColor: "transparent", color: "#6B7565", borderColor: "#D8D3C8" }
              }
            >
              {m === "address" ? "📍 Dirección" : m === "pdf" ? "📄 PDF" : "🖼️ Imagen"}
            </button>
          ))}
        </div>

        {mode === "address" ? (
          <AddressAutocomplete
            label="Dirección de la propiedad"
            value={address}
            onChange={(v) => {
              setAddress(v);
              // If user edits after selecting, clear preview coords
              if (previewCoords) setPreviewCoords(null);
            }}
            onSelect={handleAddressSelect}
            placeholder="Av. San Martín 456, Equipetrol, Santa Cruz"
            hint="Empieza a escribir — sugerencias vía OpenStreetMap"
          />
        ) : mode === "pdf" ? (
          <div>
            <label className="label-caps text-[#6B7565] block mb-2">Archivo PDF</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-[#D8D3C8] rounded-sm p-8 text-center cursor-pointer hover:border-[#FF7F11] hover:bg-[#FFF8F2] transition-all"
            >
              {pdfFile ? (
                <p className="text-sm text-[#262626]">📄 {pdfFile.name}</p>
              ) : (
                <>
                  <svg className="w-8 h-8 text-[#ACBFA4] mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm text-[#6B7565]">Haz clic para subir un PDF de la propiedad</p>
                  <p className="text-xs text-[#ACBFA4] mt-1">Máximo 10MB</p>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
            />
          </div>
        ) : (
          <div>
            <label className="label-caps text-[#6B7565] block mb-2">Imagen</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-[#D8D3C8] rounded-sm p-8 text-center cursor-pointer hover:border-[#FF7F11] hover:bg-[#FFF8F2] transition-all"
            >
              {imageFile ? (
                <p className="text-sm text-[#262626]">🖼️ {imageFile.name}</p>
              ) : (
                <>
                  <svg className="w-8 h-8 text-[#ACBFA4] mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-[#6B7565]">Haz clic para subir una imagen de la propiedad</p>
                  <p className="text-xs text-[#ACBFA4] mt-1">PNG, JPG, WEBP · Máximo 10MB</p>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            />
          </div>
        )}

        {/* Map preview — shown once coords are known */}
        {mapLat !== null && mapLng !== null && !generating && (
          <div className="mt-5">
            <p className="label-caps text-[#6B7565] mb-2">Ubicación</p>
            <MiniMap
              lat={mapLat}
              lng={mapLng}
              label={typeof generated?.address === "string" ? generated.address : address}
            />
            {(generated?.neighborhood != null || generated?.city != null) && (
              <p className="text-xs text-[#6B7565] mt-2">
                {([generated.neighborhood, generated.city] as string[]).filter(Boolean).join(", ")}
              </p>
            )}
          </div>
        )}

        {error && (
          <p className="mt-4 text-sm text-red-500 bg-red-50 border border-red-100 px-4 py-2 rounded-sm">
            {error}
          </p>
        )}

        <div className="mt-5">
          <Button
            onClick={handleMagicGenerate}
            loading={generating}
            disabled={mode === "address" ? !address.trim() : mode === "pdf" ? !pdfFile : !imageFile}
            className="w-full"
            size="lg"
          >
            {generating ? "Generando con IA..." : "✦ Magic Populate"}
          </Button>
        </div>

        {generating && (
          <div className="mt-4 bg-[#F7F5EE] border border-[#EAE7DC] rounded-sm px-4 py-3 flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-[#FF7F11] border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <p className="text-sm text-[#6B7565]">
              Buscando ubicación y generando descripción con IA...
            </p>
          </div>
        )}
      </div>

      {/* ── Editable form ─────────────────────────────────────── */}
      {(generated || true) && (
        <div className="bg-white border border-[#EAE7DC] rounded-sm p-6">
          <h2
            className="text-[#262626] mb-5"
            style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: "1.25rem", fontWeight: 500 }}
          >
            {generated ? "Revisa y Edita" : "Datos Manuales"}
          </h2>

          <div className="flex flex-col gap-5">
            <Input
              label="Título"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Casa de Lujo en Equipetrol"
              required
            />

            <div className="flex flex-col gap-1.5">
              <label className="label-caps text-[#6B7565]">Descripción</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                placeholder="Descripción de la propiedad..."
                className="w-full border border-[#D8D3C8] bg-white px-4 py-3 text-sm text-[#262626] rounded-sm placeholder:text-[#ACBFA4] transition-colors focus:outline-none focus:border-[#FF7F11] focus:ring-1 focus:ring-[#FF7F11]/20 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="label-caps text-[#6B7565]">Tipo</label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                  className="border border-[#D8D3C8] bg-white px-4 py-3 text-sm text-[#262626] rounded-sm focus:outline-none focus:border-[#FF7F11] cursor-pointer"
                >
                  <option value="casa">Casa</option>
                  <option value="departamento">Departamento</option>
                  <option value="terreno">Terreno</option>
                  <option value="oficina">Oficina</option>
                  <option value="local_comercial">Local Comercial</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="label-caps text-[#6B7565]">Estado</label>
                <select
                  value={listingStatus}
                  onChange={(e) => setListingStatus(e.target.value)}
                  className="border border-[#D8D3C8] bg-white px-4 py-3 text-sm text-[#262626] rounded-sm focus:outline-none focus:border-[#FF7F11] cursor-pointer"
                >
                  <option value="borrador">Borrador</option>
                  <option value="activo">Publicar</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Precio"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="150000"
              />
              <div className="flex flex-col gap-1.5">
                <label className="label-caps text-[#6B7565]">Moneda</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="border border-[#D8D3C8] bg-white px-4 py-3 text-sm text-[#262626] rounded-sm focus:outline-none focus:border-[#FF7F11] cursor-pointer"
                >
                  <option value="USD">USD ($)</option>
                  <option value="BOB">BOB (Bs.)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Input label="Área m²" type="number" value={area} onChange={(e) => setArea(e.target.value)} placeholder="150" />
              <Input label="Hab." type="number" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} placeholder="3" />
              <Input label="Baños" type="number" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} placeholder="2" />
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleSave}
              loading={saving}
              disabled={!title}
              size="lg"
              className="flex-1"
            >
              {listingStatus === "activo" ? "Publicar Propiedad" : "Guardar Borrador"}
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => { window.location.href = "/dashboard/propiedades"; }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
