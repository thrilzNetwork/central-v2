import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardHome } from "@/components/dashboard/DashboardHome";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Panel — Central" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, listingsRes, leadsRes] = await Promise.all([
    supabase.from("profiles").select("full_name, slug, primary_color").eq("id", user.id).single(),
    supabase.from("listings").select("id, status, views, hearts").eq("profile_id", user.id),
    supabase.from("leads").select("id, status, created_at").eq("profile_id", user.id).order("created_at", { ascending: false }).limit(50),
  ]);

  const profile = profileRes.data;
  const listings = listingsRes.data ?? [];
  const leads = leadsRes.data ?? [];

  const totalViews = listings.reduce((s, l) => s + (l.views ?? 0), 0);
  const totalHearts = listings.reduce((s, l) => s + (l.hearts ?? 0), 0);
  const activeListings = listings.filter((l) => l.status === "activo").length;
  const newLeads = leads.filter((l) => l.status === "nuevo").length;

  return (
    <DashboardHome
      agentName={profile?.full_name ?? "Agente"}
      slug={profile?.slug ?? ""}
      metrics={{ totalListings: listings.length, activeListings, totalLeads: leads.length, newLeads, totalViews, totalHearts }}
    />
  );
}
