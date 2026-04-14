import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SiteCustomizerForm } from "@/components/forms/SiteCustomizerForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mi Sitio — Dashboard" };

export default async function MiSitioPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="animate-fade-up max-w-2xl">
      <div className="mb-8">
        <span className="label-caps text-[#6B7565]">Personalización</span>
        <h1
          className="text-[#262626] mt-1"
          style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: "2rem", fontWeight: 500 }}
        >
          Mi Sitio Web
        </h1>
        <p className="text-sm text-[#6B7565] mt-2">
          Personaliza el hero, imágenes, colores y la identidad de tu portal.
        </p>
      </div>

      {/* Quick link to live site */}
      {profile?.slug && (
        <div className="mb-6 bg-[#F7F5EE] border border-[#EAE7DC] rounded-sm px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <p className="label-caps text-[#6B7565]">Tu portal en vivo</p>
            <p className="text-sm text-[#262626] font-medium mt-0.5">
{profile.slug}.central.bo
            </p>
          </div>
          <a
            href={`https://${profile.slug}.central.bo`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 bg-[#FF7F11] text-white text-xs font-medium rounded-sm hover:bg-[#CC6500] transition-colors whitespace-nowrap flex-shrink-0"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Ver portal
          </a>
        </div>
      )}

      <SiteCustomizerForm settings={profile as Parameters<typeof SiteCustomizerForm>[0]["settings"]} />
    </div>
  );
}
