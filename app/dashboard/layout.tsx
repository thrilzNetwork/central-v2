import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { TrialGuard } from "@/components/dashboard/TrialGuard";
import type { ReactNode } from "react";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, logo_url, primary_color, secondary_color, slug, onboarding_completed, organization_id, created_at")
    .eq("id", user.id)
    .single();

  let org = null;
  if (profile?.organization_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: orgData } = await (supabase as any)
       .from("organizations")
       .select("is_active, trial_expires_at").eq("id", profile.organization_id).single();
    org = orgData as { is_active: boolean; trial_expires_at: string } | null;
  }

  if (!profile) redirect("/login");
  if (!profile.onboarding_completed) redirect("/bienvenido");

  return (
    <div className="flex min-h-dvh bg-[#F7F5EE]">
      <DashboardSidebar profile={profile} userId={user.id} />
      {/* pt-14 on mobile accounts for the fixed 56px top bar */}
      <main className="flex-1 min-w-0 ml-0 lg:ml-64 pt-14 lg:pt-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
          <TrialGuard
            trialExpiresAt={
              org?.trial_expires_at ||
              new Date(new Date(profile.created_at).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()
            }
            isActive={org?.is_active ?? true}
          >
            {children}
          </TrialGuard>
        </div>
      </main>
    </div>
  );
}
