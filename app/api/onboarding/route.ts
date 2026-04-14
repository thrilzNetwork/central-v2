import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils/slugify";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, fullName, brandName, whatsapp, theme, email } = body;

    if (!userId || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Generate a unique slug from brand name
    const baseSlug = slugify(brandName || fullName || email.split("@")[0]);
    let finalSlug = baseSlug;
    let counter = 0;

    while (true) {
      const { data } = await supabase
        .from("profiles")
        .select("slug")
        .eq("slug", finalSlug)
        .maybeSingle();

      if (!data) break;
      counter++;
      finalSlug = `${baseSlug}-${counter}`;
    }

    // Upsert profile (trigger may have already created it)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("profiles") as any)
      .upsert({
        id: userId,
        email,
        full_name: fullName ?? "",
        slug: finalSlug,
        whatsapp: whatsapp ?? null,
        theme: theme ?? "realtor-v1",
        onboarding_completed: true,
        hero_images: null,
        broker_name: null,
        broker_logo_url: null,
        broker_agent_code: null,
        primary_color: "#FF7F11",
        secondary_color: "#262626",
        city: "",
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ slug: finalSlug, success: true });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
