import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BillingPanel } from "@/components/dashboard/BillingPanel";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Facturación — Dashboard" };

export default async function FacturacionPage({
  searchParams,
}: {
  searchParams: Promise<{ nuevo?: string; expired?: string }>;
}) {
  const params = await searchParams;
  const isNew = params.nuevo === "1";
  const isExpired = params.expired === "true";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("created_at, organization_id, slug")
    .eq("id", user.id)
    .single();

  let entitySlug = profile?.slug ?? "N/A";
  if (profile?.organization_id) {
    const { data: org } = await supabase.from("organizations").select("slug").eq("id", profile.organization_id).single();
    if (org?.slug) entitySlug = org.slug;
  }

  // Trial = 3 days from account creation
  const trialEndsAt = profile?.created_at
    ? new Date(new Date(profile.created_at).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const heading = isNew
    ? "Activa tu portal"
    : isExpired
    ? "Tu prueba ha finalizado"
    : "Tu Plan";

  const subtext = isNew
    ? "Elige tu plan ahora o empieza con 3 días de demo gratuita."
    : isExpired
    ? "Tu período de prueba terminó. Reactiva tu portal para seguir recibiendo leads."
    : "Activa tu plan para continuar usando Central.";

  return (
    <div className="animate-fade-up max-w-3xl">
      <div className="mb-8">
        <span className="label-caps text-[#6B7565]">Facturación</span>
        <h1
          className="text-[#262626] mt-1"
          style={{
            fontFamily: "Cormorant Garamond, Georgia, serif",
            fontSize: "2rem",
            fontWeight: 500,
          }}
        >
          {heading}
        </h1>
        <p className="text-sm text-[#6B7565] mt-1">{subtext}</p>
      </div>

      <BillingPanel
        currentPlan="demo"
        subscriptionStatus="trialing"
        trialEndsAt={trialEndsAt}
        hasCustomer={false}
        userId={user.id}
        entitySlug={entitySlug}
        isNew={isNew}
        isExpired={isExpired}
      />
    </div>
  );
}
