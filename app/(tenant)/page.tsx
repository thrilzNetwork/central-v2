import { createAdminClient } from "@/lib/supabase/admin";
import { headers } from "next/headers";
import { RealtorV1Page } from "@/components/themes/realtor-v1/RealtorV1Page";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const headerStore = await headers();
  const tenantSlug = headerStore.get("x-tenant-slug") ?? "";
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("full_name, city, bio")
    .eq("slug", tenantSlug)
    .single();

  return {
    title: data?.full_name ?? "Portal Inmobiliario",
    description: data?.bio ?? `Portal inmobiliario en ${data?.city ?? "Bolivia"}`,
  };
}

export default async function TenantHomePage() {
  const headerStore = await headers();
  const _tenantSlug = headerStore.get("x-tenant-slug") ?? "";

  const supabase = createAdminClient();
  const { data: listings } = await supabase
    .from("listings")
    .select("*")
    .eq("status", "activo")
    .order("created_at", { ascending: false })
    .limit(20);

  // Increment view would be done client-side
  return <RealtorV1Page listings={listings ?? []} />;
}
