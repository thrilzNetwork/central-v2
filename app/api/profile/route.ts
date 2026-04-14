import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const admin = createAdminClient();

  const updatePayload: Record<string, unknown> = {};
  if (body.full_name !== undefined) updatePayload.full_name = body.full_name;
  if (body.whatsapp !== undefined) updatePayload.whatsapp = body.whatsapp || null;
  if (body.bio !== undefined) updatePayload.bio = body.bio || null;
  if (body.city !== undefined) updatePayload.city = body.city || null;
  if (body.primary_color !== undefined) updatePayload.primary_color = body.primary_color;
  if (body.secondary_color !== undefined) updatePayload.secondary_color = body.secondary_color;
  if (body.logo_url !== undefined) updatePayload.logo_url = body.logo_url || null;
  if (body.phone              !== undefined) updatePayload.phone              = body.phone              || null;
  // Site customizer fields
  if (body.hero_title         !== undefined) updatePayload.hero_title         = body.hero_title         || null;
  if (body.hero_headline      !== undefined) updatePayload.hero_headline      = body.hero_headline      || null;
  if (body.hero_subtitle      !== undefined) updatePayload.hero_subtitle      = body.hero_subtitle      || null;
  if (body.hero_images        !== undefined) updatePayload.hero_images        = body.hero_images        ?? [];
  if (body.broker_name        !== undefined) updatePayload.broker_name        = body.broker_name        || null;
  if (body.broker_logo_url    !== undefined) updatePayload.broker_logo_url    = body.broker_logo_url    || null;
  if (body.broker_agent_code  !== undefined) updatePayload.broker_agent_code  = body.broker_agent_code  || null;

  // Try update first
  const { data, error } = await admin
    .from("profiles")
    .update(updatePayload)
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    // If no row found (PGRST116), upsert to create the profile
    if (error.code === "PGRST116") {
      const fallbackSlug = (user.email ?? user.id).split("@")[0].replace(/[^a-z0-9]/gi, "-").toLowerCase();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: upserted, error: upsertError } = await admin
        .from("profiles")
        .upsert({ id: user.id, email: user.email ?? "", full_name: "", slug: fallbackSlug, ...updatePayload })
        .select()
        .single();
      if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 });
      return NextResponse.json(upserted);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
