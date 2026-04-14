"use client";

import { useEffect, useRef } from "react";
import type { Listing } from "@/types/tenant";

interface PropertyMapInnerProps {
  listing: Partial<Listing>;
  primaryColor: string;
}

export default function PropertyMapInner({ listing, primaryColor }: PropertyMapInnerProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current || !listing.lat || !listing.lng) return;

    let mapInstance: import("leaflet").Map | null = null;

    (async () => {
      const L = (await import("leaflet")).default;

      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      mapInstance = L.map(mapRef.current!, {
        center: [listing.lat!, listing.lng!],
        zoom: 15,
        scrollWheelZoom: false,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: "© OpenStreetMap © CARTO",
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(mapInstance);

      const icon = L.divIcon({
        className: "",
        html: `
          <div style="position:relative;width:22px;height:22px">
            <div style="position:absolute;inset:0;border-radius:50%;background:${primaryColor};opacity:0.25;animation:ping 1.8s cubic-bezier(0,0,0.2,1) infinite"></div>
            <div style="position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:${primaryColor};border:2.5px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,0.35)"></div>
          </div>
          <style>@keyframes ping{75%,100%{transform:scale(2.2);opacity:0}}</style>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      L.marker([listing.lat!, listing.lng!], { icon })
        .addTo(mapInstance)
        .bindPopup(`<div style="font-family:'Manrope',sans-serif;font-size:12px;padding:2px 4px"><strong>${listing.title ?? "Propiedad"}</strong>${listing.neighborhood ? `<br/><span style="color:#888">${listing.neighborhood}</span>` : ""}</div>`)
        .openPopup();
    })();

    return () => { mapInstance?.remove(); };
  }, [listing, primaryColor]);

  return (
    <div
      ref={mapRef}
      style={{ width: "100%", height: 260, borderRadius: 4, overflow: "hidden" }}
    />
  );
}
