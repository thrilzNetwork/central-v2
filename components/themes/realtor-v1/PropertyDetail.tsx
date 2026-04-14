"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useTenant } from "@/components/themes/TenantContext";
import { RealtorV1Header } from "./RealtorV1Header";
import { RealtorV1Footer } from "./RealtorV1Footer";
import { HeartButton } from "@/components/property/HeartButton";
import { formatPrice } from "@/lib/utils/formatCurrency";
import type { Listing } from "@/types/tenant";

const PropertyMapInner = dynamic(() => import("./PropertyMapInner"), { ssr: false, loading: () => <div style={{ height: 260, background: "#E2E8CE", borderRadius: 4 }} /> });

interface PropertyDetailProps {
  listing: Listing;
}

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  casa: "Casa",
  departamento: "Departamento",
  terreno: "Terreno",
  oficina: "Oficina",
  local_comercial: "Local Comercial",
  otro: "Otro",
};

export function PropertyDetail({ listing }: PropertyDetailProps) {
  const { profile } = useTenant();
  const [activeImage, setActiveImage] = useState(0);

  return (
    <div className="min-h-screen bg-[#F7F5EE]">
      <RealtorV1Header />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 label-caps text-[#6B7565] mb-8">
          <a href="/" className="hover:text-[#262626] transition-colors">Inicio</a>
          <span>/</span>
          <a href="/propiedades" className="hover:text-[#262626] transition-colors">Inmuebles</a>
          <span>/</span>
          <span className="text-[#262626] truncate max-w-xs">{listing.title}</span>
        </nav>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Left column: images + description */}
          <div className="lg:col-span-2">
            {/* Main image */}
            <div className="relative aspect-[4/3] overflow-hidden bg-[#E2E8CE] mb-3 rounded-sm">
              {listing.images?.[activeImage] ? (
                <Image
                  src={listing.images[activeImage]}
                  alt={listing.title}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-16 h-16 text-[#ACBFA4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  </svg>
                </div>
              )}

              {/* AI badge */}
              {listing.ai_generated && (
                <div className="absolute bottom-3 right-3 bg-[#262626]/80 backdrop-blur-sm px-2 py-1 rounded-sm">
                  <span className="label-caps text-[#FF7F11]">✦ Descripción IA</span>
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            {listing.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {listing.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`relative w-20 h-16 flex-shrink-0 overflow-hidden rounded-sm border-2 transition-all ${i === activeImage ? "border-[#FF7F11]" : "border-transparent opacity-60 hover:opacity-100"}`}
                  >
                    <Image src={img} alt={`Foto ${i + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Description */}
            {listing.description && (
              <div className="mt-8">
                <h2
                  className="text-[#262626] mb-4"
                  style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: "1.5rem", fontWeight: 500 }}
                >
                  Descripción
                </h2>
                <p className="text-[#6B7565] leading-relaxed text-sm whitespace-pre-line">
                  {listing.description}
                </p>
              </div>
            )}

            {/* Neighborhood context */}
            {listing.neighborhood_summary && (
              <div className="mt-8 p-5 bg-[#E2E8CE] rounded-sm">
                <h3 className="label-caps text-[#6B7565] mb-2">Contexto del Barrio</h3>
                <p className="text-sm text-[#262626] leading-relaxed">{listing.neighborhood_summary}</p>
              </div>
            )}

            {/* Interactive map */}
            {listing.lat && listing.lng && (
              <div className="mt-8">
                <h2 className="text-[#262626] mb-3 label-caps text-[#6B7565]">Ubicación</h2>
                <PropertyMapInner listing={listing} primaryColor={profile.primary_color ?? "#FF7F11"} />
              </div>
            )}
          </div>

          {/* Right column: summary + CTA */}
          <div>
            <div className="sticky top-20 flex flex-col gap-6">
              {/* Type badge */}
              <div>
                <span
                  className="inline-block px-3 py-1 label-caps text-white rounded-sm mb-3"
                  style={{ backgroundColor: profile.primary_color }}
                >
                  {PROPERTY_TYPE_LABELS[listing.property_type] ?? listing.property_type}
                </span>
                <h1
                  className="text-[#262626] leading-tight"
                  style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: "1.6rem", fontWeight: 500 }}
                >
                  {listing.title}
                </h1>
                {listing.neighborhood && (
                  <p className="label-caps text-[#6B7565] mt-2">
                    {listing.neighborhood}{listing.city ? `, ${listing.city}` : ""}
                  </p>
                )}
              </div>

              {/* Price */}
              {listing.price && (
                <div className="py-4 border-t border-b border-[#EAE7DC]">
                  <p className="label-caps text-[#6B7565] mb-1">Precio</p>
                  <p
                    className="text-3xl font-light"
                    style={{ fontFamily: "Cormorant Garamond, Georgia, serif", color: profile.primary_color }}
                  >
                    {formatPrice(listing.price, listing.currency ?? "USD")}
                  </p>
                </div>
              )}

              {/* Specs grid */}
              <div className="grid grid-cols-2 gap-3">
                {listing.area_m2 && (
                  <SpecItem icon="area" label="Área" value={`${listing.area_m2} m²`} />
                )}
                {listing.bedrooms != null && (
                  <SpecItem icon="bed" label="Habitaciones" value={`${listing.bedrooms}`} />
                )}
                {listing.bathrooms != null && (
                  <SpecItem icon="bath" label="Baños" value={`${listing.bathrooms}`} />
                )}
                {listing.parking != null && (
                  <SpecItem icon="car" label="Estacionamiento" value={`${listing.parking}`} />
                )}
              </div>

              {/* Heart + CTA */}
              <div className="flex flex-col gap-3">
                <HeartButton listingId={listing.id} profileId={listing.profile_id} hearts={listing.hearts} />
                {profile.whatsapp && (
                  <a
                    href={`https://wa.me/${profile.whatsapp.replace(/\D/g, "")}?text=Hola, me interesa la propiedad: ${listing.title}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 text-white text-sm font-medium transition-all rounded-sm hover:opacity-90"
                    style={{ backgroundColor: "#25d366" }}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.529 5.859L0 24l6.335-1.607A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.914 0-3.71-.5-5.27-1.377L2.5 21.5l.907-3.992A9.95 9.95 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                    </svg>
                    Consultar por WhatsApp
                  </a>
                )}
              </div>

              {/* Views + Hearts stats */}
              <div className="flex gap-4 text-xs text-[#6B7565]">
                <span>{listing.views} visitas</span>
                <span>·</span>
                <span>{listing.hearts} guardados</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <RealtorV1Footer />
    </div>
  );
}

function SpecItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-white border border-[#EAE7DC] rounded-sm px-3 py-2.5">
      <p className="label-caps text-[#6B7565] mb-0.5">{label}</p>
      <p className="text-sm font-medium text-[#262626]">{value}</p>
    </div>
  );
}
